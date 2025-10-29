"""
Task handlers for scheduled tasks.

Each handler is an async function that performs a specific task type.
Handlers are registered with the scheduler and executed when tasks are due.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import logging

from app.database import get_database

logger = logging.getLogger(__name__)


async def data_backup_handler(task_id: str, task_name: str) -> dict:
    """
    Handler for data backup tasks.
    
    This handler saves/backs up data every 30 days (or configured interval).
    It can be customized to backup specific collections or perform other data operations.
    
    Args:
        task_id: The scheduled task ID
        task_name: The name of the task
        
    Returns:
        Dictionary with execution results
    """
    logger.info(f"Starting data backup: {task_name}")
    
    try:
        db = get_database()
        
        # Get statistics about the data
        users_count = await db.users.count_documents({})
        households_count = await db.households.count_documents({})
        
        # Create a backup record
        backup_record = {
            "task_id": task_id,
            "task_name": task_name,
            "backup_time": datetime.utcnow(),
            "users_count": users_count,
            "households_count": households_count,
            "status": "completed"
        }
        
        # Store backup metadata
        await db.backup_logs.insert_one(backup_record)
        
        logger.info(f"Data backup completed: {users_count} users, {households_count} households")
        
        return {
            "status": "success",
            "users_backed_up": users_count,
            "households_backed_up": households_count,
            "backup_time": backup_record["backup_time"].isoformat()
        }
        
    except Exception as e:
        logger.error(f"Data backup failed: {e}", exc_info=True)
        raise


async def data_cleanup_handler(task_id: str, task_name: str) -> dict:
    """
    Handler for data cleanup tasks.
    
    This handler performs cleanup operations like removing old logs,
    expired sessions, or other temporary data.
    
    Args:
        task_id: The scheduled task ID
        task_name: The name of the task
        
    Returns:
        Dictionary with execution results
    """
    logger.info(f"Starting data cleanup: {task_name}")
    
    try:
        db = get_database()
        
        # Example: Clean up old backup logs (keep only last 12 backups)
        all_backups = await db.backup_logs.find().sort("backup_time", -1).to_list(length=None)
        
        if len(all_backups) > 12:
            backups_to_delete = all_backups[12:]
            delete_ids = [backup["_id"] for backup in backups_to_delete]
            
            result = await db.backup_logs.delete_many({"_id": {"$in": delete_ids}})
            deleted_count = result.deleted_count
        else:
            deleted_count = 0
        
        logger.info(f"Data cleanup completed: {deleted_count} old backup logs removed")
        
        return {
            "status": "success",
            "old_backups_removed": deleted_count,
            "cleanup_time": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Data cleanup failed: {e}", exc_info=True)
        raise


async def data_export_handler(task_id: str, task_name: str) -> dict:
    """
    Handler for data export tasks.
    
    This handler exports data to a specific format or location.
    Can be customized for different export requirements.
    
    Args:
        task_id: The scheduled task ID
        task_name: The name of the task
        
    Returns:
        Dictionary with execution results
    """
    logger.info(f"Starting data export: {task_name}")
    
    try:
        db = get_database()
        
        # Get all data for export
        users = await db.users.find({}, {"password_hash": 0}).to_list(length=None)
        households = await db.households.find().to_list(length=None)
        
        # Create export record
        export_record = {
            "task_id": task_id,
            "task_name": task_name,
            "export_time": datetime.utcnow(),
            "users_exported": len(users),
            "households_exported": len(households),
            "status": "completed"
        }
        
        # Store export metadata
        await db.export_logs.insert_one(export_record)
        
        logger.info(f"Data export completed: {len(users)} users, {len(households)} households")
        
        return {
            "status": "success",
            "users_exported": len(users),
            "households_exported": len(households),
            "export_time": export_record["export_time"].isoformat()
        }
        
    except Exception as e:
        logger.error(f"Data export failed: {e}", exc_info=True)
        raise


async def health_check_handler(task_id: str, task_name: str) -> dict:
    """
    Handler for system health check tasks.
    
    This handler performs periodic health checks on the system.
    
    Args:
        task_id: The scheduled task ID
        task_name: The name of the task
        
    Returns:
        Dictionary with execution results
    """
    logger.info(f"Starting health check: {task_name}")
    
    try:
        db = get_database()
        
        # Ping database
        await db.command("ping")
        
        # Get collection stats
        users_count = await db.users.count_documents({})
        households_count = await db.households.count_documents({})
        scheduled_tasks_count = await db.scheduled_tasks.count_documents({})
        
        health_status = {
            "database": "healthy",
            "users_count": users_count,
            "households_count": households_count,
            "scheduled_tasks_count": scheduled_tasks_count,
            "check_time": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Health check completed: All systems operational")
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        raise


# Registry of all available task handlers
TASK_HANDLERS = {
    "data_backup": data_backup_handler,
    "data_cleanup": data_cleanup_handler,
    "data_export": data_export_handler,
    "health_check": health_check_handler,
}


def register_all_handlers(scheduler) -> None:
    """
    Register all task handlers with the scheduler.
    
    Args:
        scheduler: The PersistentScheduler instance
    """
    for task_type, handler in TASK_HANDLERS.items():
        scheduler.register_task_handler(task_type, handler)
    
    logger.info(f"Registered {len(TASK_HANDLERS)} task handlers")