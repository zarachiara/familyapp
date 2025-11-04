from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models.task import TaskInDB, TaskCreate, TaskUpdate


async def create_task(
    db: AsyncIOMotorDatabase,
    household_id: str,
    task_data: TaskCreate,
    created_by: str
) -> TaskInDB:
    """Create a new task."""
    task_dict = task_data.model_dump()
    task_dict["household_id"] = ObjectId(household_id)
    task_dict["created_by"] = created_by
    task_dict["created_at"] = datetime.utcnow()
    task_dict["completed_at"] = None
    
    result = await db.tasks.insert_one(task_dict)
    task_dict["_id"] = result.inserted_id
    
    return TaskInDB(**task_dict)


async def get_tasks_by_household(
    db: AsyncIOMotorDatabase,
    household_id: str,
    status: Optional[str] = None,
    assignee_id: Optional[str] = None,
    room: Optional[str] = None
) -> List[TaskInDB]:
    """Get all tasks for a household with optional filters."""
    query: Dict[str, Any] = {"household_id": ObjectId(household_id)}
    
    if status:
        query["status"] = status
    if assignee_id:
        query["assignee_id"] = assignee_id
    if room:
        query["room"] = room
    
    cursor = db.tasks.find(query).sort("due_date", 1)
    tasks = await cursor.to_list(length=None)
    
    return [TaskInDB(**task) for task in tasks]


async def get_task_by_id(
    db: AsyncIOMotorDatabase,
    task_id: str,
    household_id: str
) -> Optional[TaskInDB]:
    """Get a single task by ID."""
    task = await db.tasks.find_one({
        "_id": ObjectId(task_id),
        "household_id": ObjectId(household_id)
    })
    
    if task:
        return TaskInDB(**task)
    return None


async def update_task(
    db: AsyncIOMotorDatabase,
    task_id: str,
    household_id: str,
    updates: TaskUpdate
) -> Optional[TaskInDB]:
    """Update a task."""
    update_dict = {k: v for k, v in updates.model_dump(exclude_unset=True).items() if v is not None}
    
    if not update_dict:
        return await get_task_by_id(db, task_id, household_id)
    
    # If status is being changed to "done", set completed_at
    if "status" in update_dict and update_dict["status"] == "done":
        update_dict["completed_at"] = datetime.utcnow()
    
    result = await db.tasks.find_one_and_update(
        {"_id": ObjectId(task_id), "household_id": ObjectId(household_id)},
        {"$set": update_dict},
        return_document=True
    )
    
    if result:
        return TaskInDB(**result)
    return None


async def delete_task(
    db: AsyncIOMotorDatabase,
    task_id: str,
    household_id: str
) -> bool:
    """Delete a task."""
    result = await db.tasks.delete_one({
        "_id": ObjectId(task_id),
        "household_id": ObjectId(household_id)
    })
    
    return result.deleted_count > 0


async def get_tasks_by_ids(
    db: AsyncIOMotorDatabase,
    task_ids: List[str],
    household_id: str
) -> List[TaskInDB]:
    """Get multiple tasks by their IDs."""
    object_ids = [ObjectId(tid) for tid in task_ids]
    cursor = db.tasks.find({
        "_id": {"$in": object_ids},
        "household_id": ObjectId(household_id)
    })
    tasks = await cursor.to_list(length=None)
    
    return [TaskInDB(**task) for task in tasks]