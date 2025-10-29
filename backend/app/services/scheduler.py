from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from typing import Callable, Dict, Any, Optional
import logging
import asyncio

from app.crud.scheduled_task import (
    get_all_scheduled_tasks,
    get_tasks_due_for_execution,
    mark_task_executed,
    get_scheduled_task_by_name
)

logger = logging.getLogger(__name__)


class PersistentScheduler:
    """
    A persistent scheduler that maintains task schedules across server restarts.
    
    This scheduler uses MongoDB to store task metadata and APScheduler for execution.
    When the server restarts, it automatically resumes all scheduled tasks from the database.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize the persistent scheduler.
        
        Args:
            db: MongoDB database instance
        """
        self.db = db
        self.scheduler = AsyncIOScheduler()
        self.task_handlers: Dict[str, Callable] = {}
        self._initialized = False
    
    def register_task_handler(self, task_type: str, handler: Callable) -> None:
        """
        Register a handler function for a specific task type.
        
        Args:
            task_type: The type of task (e.g., "data_backup", "cleanup")
            handler: Async function to execute when task runs
        """
        self.task_handlers[task_type] = handler
        logger.info(f"Registered handler for task type: {task_type}")
    
    async def _execute_task(self, task_id: str, task_type: str, task_name: str) -> None:
        """
        Execute a scheduled task and update its status in the database.
        
        Args:
            task_id: The task's database ID
            task_type: The type of task
            task_name: The name of the task
        """
        logger.info(f"Executing scheduled task: {task_name} (type: {task_type})")
        
        try:
            # Get the handler for this task type
            handler = self.task_handlers.get(task_type)
            
            if not handler:
                logger.error(f"No handler registered for task type: {task_type}")
                return
            
            # Execute the handler
            execution_start = datetime.utcnow()
            result = await handler(task_id, task_name)
            execution_end = datetime.utcnow()
            
            # Calculate execution time
            execution_time = (execution_end - execution_start).total_seconds()
            
            # Update task metadata with execution info
            execution_metadata = {
                "last_execution_time": execution_time,
                "last_execution_status": "success",
                "last_execution_result": result if isinstance(result, (str, int, float, bool, dict, list)) else str(result)
            }
            
            # Mark task as executed and schedule next run
            await mark_task_executed(self.db, task_id, execution_metadata)
            
            # Reschedule the task for its next run
            await self._schedule_task_from_db(task_id)
            
            logger.info(f"Task {task_name} completed successfully in {execution_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Error executing task {task_name}: {e}", exc_info=True)
            
            # Update task metadata with error info
            error_metadata = {
                "last_execution_status": "error",
                "last_execution_error": str(e)
            }
            
            try:
                await mark_task_executed(self.db, task_id, error_metadata)
                await self._schedule_task_from_db(task_id)
            except Exception as update_error:
                logger.error(f"Failed to update task after error: {update_error}")
    
    async def _schedule_task_from_db(self, task_id: str) -> None:
        """
        Schedule a task from the database using APScheduler.
        
        Args:
            task_id: The task's database ID
        """
        from app.crud.scheduled_task import get_scheduled_task_by_id
        
        task = await get_scheduled_task_by_id(self.db, task_id)
        
        if not task or not task.get("enabled"):
            logger.debug(f"Task {task_id} is disabled or not found, skipping scheduling")
            return
        
        next_run = task.get("next_run")
        if not next_run:
            logger.warning(f"Task {task_id} has no next_run time")
            return
        
        # Remove existing job if it exists
        job_id = f"task_{task_id}"
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
        
        # Schedule the task
        self.scheduler.add_job(
            self._execute_task,
            trigger=DateTrigger(run_date=next_run),
            args=[str(task["_id"]), task["task_type"], task["task_name"]],
            id=job_id,
            name=task["task_name"],
            replace_existing=True
        )
        
        logger.info(f"Scheduled task '{task['task_name']}' for {next_run}")
    
    async def initialize(self) -> None:
        """
        Initialize the scheduler and load all tasks from the database.
        This should be called when the application starts.
        """
        if self._initialized:
            logger.warning("Scheduler already initialized")
            return
        
        logger.info("Initializing persistent scheduler...")
        
        # Start the APScheduler
        self.scheduler.start()
        
        # Load all enabled tasks from database
        tasks = await get_all_scheduled_tasks(self.db, enabled_only=True)
        
        logger.info(f"Found {len(tasks)} enabled tasks in database")
        
        # Check for tasks that are overdue and execute them immediately
        overdue_tasks = await get_tasks_due_for_execution(self.db)
        
        if overdue_tasks:
            logger.info(f"Found {len(overdue_tasks)} overdue tasks, executing immediately...")
            for task in overdue_tasks:
                # Execute overdue tasks in the background
                asyncio.create_task(
                    self._execute_task(
                        str(task["_id"]),
                        task["task_type"],
                        task["task_name"]
                    )
                )
        
        # Schedule all tasks for their next run
        for task in tasks:
            await self._schedule_task_from_db(str(task["_id"]))
        
        self._initialized = True
        logger.info("Persistent scheduler initialized successfully")
    
    async def shutdown(self) -> None:
        """
        Shutdown the scheduler gracefully.
        This should be called when the application stops.
        """
        logger.info("Shutting down persistent scheduler...")
        
        if self.scheduler.running:
            self.scheduler.shutdown(wait=True)
        
        self._initialized = False
        logger.info("Persistent scheduler shut down successfully")
    
    async def add_task(
        self,
        task_name: str,
        task_type: str,
        interval_days: int = 30,
        enabled: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add a new scheduled task.
        
        Args:
            task_name: Name of the task
            task_type: Type of task (must have a registered handler)
            interval_days: Days between executions (default: 30)
            enabled: Whether the task is enabled (default: True)
            metadata: Additional metadata for the task
            
        Returns:
            The task ID
        """
        from app.crud.scheduled_task import create_scheduled_task
        
        # Check if handler exists for this task type
        if task_type not in self.task_handlers:
            raise ValueError(f"No handler registered for task type: {task_type}")
        
        # Check if task already exists
        existing_task = await get_scheduled_task_by_name(self.db, task_name)
        if existing_task:
            logger.warning(f"Task '{task_name}' already exists")
            return str(existing_task["_id"])
        
        # Create task in database
        task = await create_scheduled_task(
            self.db,
            task_name=task_name,
            task_type=task_type,
            interval_days=interval_days,
            enabled=enabled,
            metadata=metadata
        )
        
        task_id = str(task["_id"])
        
        # Schedule the task if enabled
        if enabled:
            await self._schedule_task_from_db(task_id)
        
        logger.info(f"Added new scheduled task: {task_name} (ID: {task_id})")
        return task_id
    
    def get_scheduler_status(self) -> Dict[str, Any]:
        """
        Get the current status of the scheduler.
        
        Returns:
            Dictionary with scheduler status information
        """
        jobs = self.scheduler.get_jobs()
        
        return {
            "running": self.scheduler.running,
            "initialized": self._initialized,
            "registered_handlers": list(self.task_handlers.keys()),
            "scheduled_jobs": len(jobs),
            "jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run": job.next_run_time.isoformat() if job.next_run_time else None
                }
                for job in jobs
            ]
        }


# Global scheduler instance
_scheduler: Optional[PersistentScheduler] = None


def get_scheduler() -> PersistentScheduler:
    """Get the global scheduler instance."""
    if _scheduler is None:
        raise RuntimeError("Scheduler not initialized. Call initialize_scheduler() first.")
    return _scheduler


async def initialize_scheduler(db: AsyncIOMotorDatabase) -> PersistentScheduler:
    """
    Initialize the global scheduler instance.
    
    Args:
        db: MongoDB database instance
        
    Returns:
        The initialized scheduler
    """
    global _scheduler
    
    if _scheduler is not None:
        logger.warning("Scheduler already initialized")
        return _scheduler
    
    _scheduler = PersistentScheduler(db)
    await _scheduler.initialize()
    
    return _scheduler


async def shutdown_scheduler() -> None:
    """Shutdown the global scheduler instance."""
    global _scheduler
    
    if _scheduler is not None:
        await _scheduler.shutdown()
        _scheduler = None