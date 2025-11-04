from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.models.task import TaskCreate, TaskUpdate, TaskResponse
from app.crud import task as task_crud
from app.dependencies.auth import get_current_user
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new task for the household.
    
    Request body:
    - title: Task title
    - description: Task description
    - assignee_id: Member ID to assign the task to
    - due_date: Task due date
    - status: Task status (todo, in-progress, done)
    - recurrence: Recurrence pattern (none, daily, weekly, monthly, custom)
    - room: Room/category for the task
    - points: Points value for the task
    - estimated_minutes: Estimated time to complete
    
    Returns:
        Created task information
    """
    try:
        household_id = str(current_user["household_id"])
        created_by = current_user.get("member_id", str(current_user["_id"]))
        
        task = await task_crud.create_task(db, household_id, task_data, created_by)
        
        logger.info(f"Task created: {task.title} by {current_user['email']}")
        
        return TaskResponse(
            id=str(task.id),
            household_id=str(task.household_id),
            title=task.title,
            description=task.description,
            assignee_id=task.assignee_id,
            due_date=task.due_date,
            status=task.status,
            recurrence=task.recurrence,
            room=task.room,
            points=task.points,
            estimated_minutes=task.estimated_minutes,
            created_by=task.created_by,
            created_at=task.created_at,
            completed_at=task.completed_at
        )
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task"
        )


@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    assignee_id: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all tasks for the household with optional filters.
    
    Query parameters:
    - status: Filter by task status (todo, in-progress, done)
    - assignee_id: Filter by assignee member ID
    - room: Filter by room/category
    
    Returns:
        List of tasks matching the filters
    """
    try:
        household_id = str(current_user["household_id"])
        
        tasks = await task_crud.get_tasks_by_household(
            db, household_id, status_filter, assignee_id, room
        )
        
        return [
            TaskResponse(
                id=str(task.id),
                household_id=str(task.household_id),
                title=task.title,
                description=task.description,
                assignee_id=task.assignee_id,
                due_date=task.due_date,
                status=task.status,
                recurrence=task.recurrence,
                room=task.room,
                points=task.points,
                estimated_minutes=task.estimated_minutes,
                created_by=task.created_by,
                created_at=task.created_at,
                completed_at=task.completed_at
            )
            for task in tasks
        ]
    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch tasks"
        )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific task by ID.
    
    Path parameters:
    - task_id: Task ID
    
    Returns:
        Task information
    """
    try:
        household_id = str(current_user["household_id"])
        
        task = await task_crud.get_task_by_id(db, task_id, household_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return TaskResponse(
            id=str(task.id),
            household_id=str(task.household_id),
            title=task.title,
            description=task.description,
            assignee_id=task.assignee_id,
            due_date=task.due_date,
            status=task.status,
            recurrence=task.recurrence,
            room=task.room,
            points=task.points,
            estimated_minutes=task.estimated_minutes,
            created_by=task.created_by,
            created_at=task.created_at,
            completed_at=task.completed_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch task"
        )


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    updates: TaskUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Update a task.
    
    Path parameters:
    - task_id: Task ID
    
    Request body:
    - Any task fields to update (all optional)
    
    Returns:
        Updated task information
    """
    try:
        household_id = str(current_user["household_id"])
        
        task = await task_crud.update_task(db, task_id, household_id, updates)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        logger.info(f"Task updated: {task_id} by {current_user['email']}")
        
        return TaskResponse(
            id=str(task.id),
            household_id=str(task.household_id),
            title=task.title,
            description=task.description,
            assignee_id=task.assignee_id,
            due_date=task.due_date,
            status=task.status,
            recurrence=task.recurrence,
            room=task.room,
            points=task.points,
            estimated_minutes=task.estimated_minutes,
            created_by=task.created_by,
            created_at=task.created_at,
            completed_at=task.completed_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task"
        )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a task.
    
    Path parameters:
    - task_id: Task ID
    
    Returns:
        No content on success
    """
    try:
        household_id = str(current_user["household_id"])
        
        deleted = await task_crud.delete_task(db, task_id, household_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        logger.info(f"Task deleted: {task_id} by {current_user['email']}")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete task"
        )