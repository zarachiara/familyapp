from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime

from app.database import get_database
from app.services import get_scheduler
from app.models.scheduled_task import (
    ScheduledTaskCreate,
    ScheduledTaskResponse,
    ScheduledTaskUpdate
)
from app.crud.scheduled_task import (
    get_all_scheduled_tasks,
    get_scheduled_task_by_id,
    update_scheduled_task,
    delete_scheduled_task,
    enable_scheduled_task,
    disable_scheduled_task
)
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


@router.get("/status")
async def get_scheduler_status():
    """
    Get the current status of the scheduler.
    
    Returns information about the scheduler state and scheduled jobs.
    """
    try:
        scheduler = get_scheduler()
        status = scheduler.get_scheduler_status()
        return status
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get scheduler status: {str(e)}"
        )


@router.get("/tasks", response_model=List[ScheduledTaskResponse])
async def list_scheduled_tasks(
    enabled_only: bool = False,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    List all scheduled tasks.
    
    Args:
        enabled_only: If True, only return enabled tasks
        db: Database dependency
        
    Returns:
        List of scheduled tasks
    """
    try:
        tasks = await get_all_scheduled_tasks(db, enabled_only=enabled_only)
        
        # Convert to response models
        response_tasks = []
        for task in tasks:
            response_tasks.append(
                ScheduledTaskResponse(
                    id=str(task["_id"]),
                    task_name=task["task_name"],
                    task_type=task["task_type"],
                    interval_days=task["interval_days"],
                    enabled=task["enabled"],
                    last_run=task.get("last_run"),
                    next_run=task["next_run"],
                    created_at=task["created_at"],
                    updated_at=task["updated_at"],
                    metadata=task.get("metadata", {})
                )
            )
        
        return response_tasks
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list scheduled tasks: {str(e)}"
        )


@router.get("/tasks/{task_id}", response_model=ScheduledTaskResponse)
async def get_task(
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific scheduled task by ID.
    
    Args:
        task_id: The task ID
        db: Database dependency
        
    Returns:
        The scheduled task
    """
    try:
        task = await get_scheduled_task_by_id(db, task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found"
            )
        
        return ScheduledTaskResponse(
            id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            interval_days=task["interval_days"],
            enabled=task["enabled"],
            last_run=task.get("last_run"),
            next_run=task["next_run"],
            created_at=task["created_at"],
            updated_at=task["updated_at"],
            metadata=task.get("metadata", {})
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get scheduled task: {str(e)}"
        )


@router.post("/tasks", response_model=ScheduledTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: ScheduledTaskCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new scheduled task.
    
    Args:
        task_data: Task creation data
        db: Database dependency
        
    Returns:
        The created task
    """
    try:
        scheduler = get_scheduler()
        
        # Create the task using the scheduler
        task_id = await scheduler.add_task(
            task_name=task_data.task_name,
            task_type=task_data.task_type,
            interval_days=task_data.interval_days,
            enabled=task_data.enabled,
            metadata={}
        )
        
        # Get the created task
        task = await get_scheduled_task_by_id(db, task_id)
        
        return ScheduledTaskResponse(
            id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            interval_days=task["interval_days"],
            enabled=task["enabled"],
            last_run=task.get("last_run"),
            next_run=task["next_run"],
            created_at=task["created_at"],
            updated_at=task["updated_at"],
            metadata=task.get("metadata", {})
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create scheduled task: {str(e)}"
        )


@router.patch("/tasks/{task_id}", response_model=ScheduledTaskResponse)
async def update_task(
    task_id: str,
    task_update: ScheduledTaskUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Update a scheduled task.
    
    Args:
        task_id: The task ID
        task_update: Task update data
        db: Database dependency
        
    Returns:
        The updated task
    """
    try:
        # Build update dictionary
        update_data = {}
        if task_update.task_name is not None:
            update_data["task_name"] = task_update.task_name
        if task_update.enabled is not None:
            update_data["enabled"] = task_update.enabled
        if task_update.interval_days is not None:
            update_data["interval_days"] = task_update.interval_days
        if task_update.next_run is not None:
            update_data["next_run"] = task_update.next_run
        if task_update.last_run is not None:
            update_data["last_run"] = task_update.last_run
        if task_update.metadata is not None:
            update_data["metadata"] = task_update.metadata
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No update data provided"
            )
        
        # Update the task
        task = await update_scheduled_task(db, task_id, update_data)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found"
            )
        
        # If enabled status changed, reschedule
        if "enabled" in update_data:
            scheduler = get_scheduler()
            await scheduler._schedule_task_from_db(task_id)
        
        return ScheduledTaskResponse(
            id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            interval_days=task["interval_days"],
            enabled=task["enabled"],
            last_run=task.get("last_run"),
            next_run=task["next_run"],
            created_at=task["created_at"],
            updated_at=task["updated_at"],
            metadata=task.get("metadata", {})
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update scheduled task: {str(e)}"
        )


@router.post("/tasks/{task_id}/enable", response_model=ScheduledTaskResponse)
async def enable_task(
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Enable a scheduled task.
    
    Args:
        task_id: The task ID
        db: Database dependency
        
    Returns:
        The updated task
    """
    try:
        task = await enable_scheduled_task(db, task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found"
            )
        
        # Reschedule the task
        scheduler = get_scheduler()
        await scheduler._schedule_task_from_db(task_id)
        
        return ScheduledTaskResponse(
            id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            interval_days=task["interval_days"],
            enabled=task["enabled"],
            last_run=task.get("last_run"),
            next_run=task["next_run"],
            created_at=task["created_at"],
            updated_at=task["updated_at"],
            metadata=task.get("metadata", {})
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enable scheduled task: {str(e)}"
        )


@router.post("/tasks/{task_id}/disable", response_model=ScheduledTaskResponse)
async def disable_task(
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Disable a scheduled task.
    
    Args:
        task_id: The task ID
        db: Database dependency
        
    Returns:
        The updated task
    """
    try:
        task = await disable_scheduled_task(db, task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found"
            )
        
        # Remove the task from scheduler
        scheduler = get_scheduler()
        job_id = f"task_{task_id}"
        if scheduler.scheduler.get_job(job_id):
            scheduler.scheduler.remove_job(job_id)
        
        return ScheduledTaskResponse(
            id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            interval_days=task["interval_days"],
            enabled=task["enabled"],
            last_run=task.get("last_run"),
            next_run=task["next_run"],
            created_at=task["created_at"],
            updated_at=task["updated_at"],
            metadata=task.get("metadata", {})
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disable scheduled task: {str(e)}"
        )


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a scheduled task.
    
    Args:
        task_id: The task ID
        db: Database dependency
    """
    try:
        # Remove from scheduler first
        scheduler = get_scheduler()
        job_id = f"task_{task_id}"
        if scheduler.scheduler.get_job(job_id):
            scheduler.scheduler.remove_job(job_id)
        
        # Delete from database
        deleted = await delete_scheduled_task(db, task_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found"
            )
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete scheduled task: {str(e)}"
        )