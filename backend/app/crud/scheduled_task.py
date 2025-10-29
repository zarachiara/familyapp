from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List, Union, Dict, Any
import logging

logger = logging.getLogger(__name__)


async def create_scheduled_task(
    db: AsyncIOMotorDatabase,
    task_name: str,
    task_type: str,
    interval_days: int = 30,
    enabled: bool = True,
    metadata: Dict[str, Any] = None
) -> dict:
    """Create a new scheduled task in the database."""
    now = datetime.utcnow()
    next_run = now + timedelta(days=interval_days)
    
    task_doc = {
        "task_name": task_name,
        "task_type": task_type,
        "interval_days": interval_days,
        "enabled": enabled,
        "last_run": None,
        "next_run": next_run,
        "created_at": now,
        "updated_at": now,
        "metadata": metadata or {}
    }
    
    result = await db.scheduled_tasks.insert_one(task_doc)
    task_doc["_id"] = result.inserted_id
    
    logger.info(f"Created scheduled task: {task_name} (type: {task_type})")
    return task_doc


async def get_scheduled_task_by_id(
    db: AsyncIOMotorDatabase,
    task_id: Union[str, ObjectId]
) -> Optional[dict]:
    """Get a scheduled task by ID."""
    if isinstance(task_id, str):
        task_id = ObjectId(task_id)
    
    task = await db.scheduled_tasks.find_one({"_id": task_id})
    return task


async def get_scheduled_task_by_name(
    db: AsyncIOMotorDatabase,
    task_name: str
) -> Optional[dict]:
    """Get a scheduled task by name."""
    task = await db.scheduled_tasks.find_one({"task_name": task_name})
    return task


async def get_all_scheduled_tasks(
    db: AsyncIOMotorDatabase,
    enabled_only: bool = False
) -> List[dict]:
    """Get all scheduled tasks."""
    query = {"enabled": True} if enabled_only else {}
    cursor = db.scheduled_tasks.find(query)
    tasks = await cursor.to_list(length=None)
    return tasks


async def get_tasks_due_for_execution(
    db: AsyncIOMotorDatabase
) -> List[dict]:
    """Get all enabled tasks that are due for execution."""
    now = datetime.utcnow()
    query = {
        "enabled": True,
        "next_run": {"$lte": now}
    }
    cursor = db.scheduled_tasks.find(query)
    tasks = await cursor.to_list(length=None)
    return tasks


async def update_scheduled_task(
    db: AsyncIOMotorDatabase,
    task_id: Union[str, ObjectId],
    update_data: dict
) -> Optional[dict]:
    """Update a scheduled task."""
    if isinstance(task_id, str):
        task_id = ObjectId(task_id)
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.scheduled_tasks.find_one_and_update(
        {"_id": task_id},
        {"$set": update_data},
        return_document=True
    )
    
    if result:
        logger.info(f"Updated scheduled task: {task_id}")
    
    return result


async def mark_task_executed(
    db: AsyncIOMotorDatabase,
    task_id: Union[str, ObjectId],
    execution_metadata: Dict[str, Any] = None
) -> Optional[dict]:
    """Mark a task as executed and calculate next run time."""
    if isinstance(task_id, str):
        task_id = ObjectId(task_id)
    
    task = await get_scheduled_task_by_id(db, task_id)
    if not task:
        return None
    
    now = datetime.utcnow()
    next_run = now + timedelta(days=task["interval_days"])
    
    update_data = {
        "last_run": now,
        "next_run": next_run,
        "updated_at": now
    }
    
    # Merge execution metadata if provided
    if execution_metadata:
        current_metadata = task.get("metadata", {})
        current_metadata.update(execution_metadata)
        update_data["metadata"] = current_metadata
    
    result = await db.scheduled_tasks.find_one_and_update(
        {"_id": task_id},
        {"$set": update_data},
        return_document=True
    )
    
    logger.info(f"Marked task {task_id} as executed. Next run: {next_run}")
    return result


async def delete_scheduled_task(
    db: AsyncIOMotorDatabase,
    task_id: Union[str, ObjectId]
) -> bool:
    """Delete a scheduled task."""
    if isinstance(task_id, str):
        task_id = ObjectId(task_id)
    
    result = await db.scheduled_tasks.delete_one({"_id": task_id})
    
    if result.deleted_count > 0:
        logger.info(f"Deleted scheduled task: {task_id}")
        return True
    
    return False


async def enable_scheduled_task(
    db: AsyncIOMotorDatabase,
    task_id: Union[str, ObjectId]
) -> Optional[dict]:
    """Enable a scheduled task."""
    return await update_scheduled_task(db, task_id, {"enabled": True})


async def disable_scheduled_task(
    db: AsyncIOMotorDatabase,
    task_id: Union[str, ObjectId]
) -> Optional[dict]:
    """Disable a scheduled task."""
    return await update_scheduled_task(db, task_id, {"enabled": False})