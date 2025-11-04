from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.models.template import TemplateCreate, TemplateResponse, TemplateApply
from app.models.task import TaskCreate
from app.crud import template as template_crud
from app.crud import task as task_crud
from app.dependencies.auth import get_current_user
from typing import List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/templates", tags=["templates"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TemplateResponse)
async def create_template(
    template_data: TemplateCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new custom template for the household.
    
    Request body:
    - name: Template name
    - category: Template category
    - description: Template description
    - tasks: List of task definitions
    - is_custom: Whether this is a custom template (always true for user-created)
    
    Returns:
        Created template information
    """
    try:
        household_id = str(current_user["household_id"])
        created_by = current_user.get("member_id", str(current_user["_id"]))
        
        template = await template_crud.create_template(
            db, household_id, template_data, created_by
        )
        
        logger.info(f"Template created: {template.name} by {current_user['email']}")
        
        return TemplateResponse(
            id=str(template.id),
            household_id=str(template.household_id) if template.household_id else None,
            name=template.name,
            category=template.category,
            description=template.description,
            tasks=template.tasks,
            is_custom=template.is_custom,
            created_by=template.created_by,
            created_at=template.created_at
        )
    except Exception as e:
        logger.error(f"Error creating template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create template"
        )


@router.get("", response_model=List[TemplateResponse])
async def get_templates(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all templates (pre-built + household custom templates).
    
    Returns:
        List of all available templates
    """
    try:
        household_id = str(current_user["household_id"])
        
        templates = await template_crud.get_all_templates(db, household_id)
        
        return [
            TemplateResponse(
                id=str(template.id),
                household_id=str(template.household_id) if template.household_id else None,
                name=template.name,
                category=template.category,
                description=template.description,
                tasks=template.tasks,
                is_custom=template.is_custom,
                created_by=template.created_by,
                created_at=template.created_at
            )
            for template in templates
        ]
    except Exception as e:
        logger.error(f"Error fetching templates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch templates"
        )


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific template by ID.
    
    Path parameters:
    - template_id: Template ID
    
    Returns:
        Template information
    """
    try:
        template = await template_crud.get_template_by_id(db, template_id)
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Check if user has access to this template
        # (pre-built templates are accessible to all, custom templates only to their household)
        household_id = str(current_user["household_id"])
        if template.household_id and str(template.household_id) != household_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this template"
            )
        
        return TemplateResponse(
            id=str(template.id),
            household_id=str(template.household_id) if template.household_id else None,
            name=template.name,
            category=template.category,
            description=template.description,
            tasks=template.tasks,
            is_custom=template.is_custom,
            created_by=template.created_by,
            created_at=template.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch template"
        )


@router.post("/{template_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_template(
    template_id: str,
    apply_data: TemplateApply,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Apply a template by creating tasks from it.
    
    Path parameters:
    - template_id: Template ID to apply
    
    Request body:
    - assignments: Dictionary mapping task index to member_id
    - start_date: Starting date for the tasks
    
    Returns:
        List of created task IDs
    """
    try:
        household_id = str(current_user["household_id"])
        created_by = current_user.get("member_id", str(current_user["_id"]))
        
        # Get the template
        template = await template_crud.get_template_by_id(db, template_id)
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Check access
        if template.household_id and str(template.household_id) != household_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this template"
            )
        
        # Create tasks from template
        created_task_ids = []
        
        for idx, template_task in enumerate(template.tasks):
            # Get assignee for this task
            assignee_id = apply_data.assignments.get(idx)
            
            if not assignee_id:
                # Skip tasks without assignments
                continue
            
            # Calculate due date (start_date + index days for spacing)
            due_date = apply_data.start_date + timedelta(days=idx)
            
            # Create task
            task_data = TaskCreate(
                title=template_task.title,
                description=template_task.description,
                assignee_id=assignee_id,
                due_date=due_date,
                status="todo",
                recurrence=template_task.recurrence,
                room=template_task.room,
                points=template_task.points,
                estimated_minutes=template_task.estimated_minutes
            )
            
            task = await task_crud.create_task(db, household_id, task_data, created_by)
            created_task_ids.append(str(task.id))
        
        logger.info(f"Template applied: {template.name} by {current_user['email']}, created {len(created_task_ids)} tasks")
        
        return {
            "message": f"Template applied successfully, created {len(created_task_ids)} tasks",
            "task_ids": created_task_ids
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to apply template"
        )


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a custom template.
    
    Note: Only custom templates belonging to the household can be deleted.
    
    Path parameters:
    - template_id: Template ID
    
    Returns:
        No content on success
    """
    try:
        household_id = str(current_user["household_id"])
        
        deleted = await template_crud.delete_template(db, template_id, household_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found or cannot be deleted (only custom templates can be deleted)"
            )
        
        logger.info(f"Template deleted: {template_id} by {current_user['email']}")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete template"
        )


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed_prebuilt_templates(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Seed pre-built templates (admin/development use).
    
    This endpoint seeds the database with pre-built templates if they don't exist.
    
    Returns:
        Success message
    """
    try:
        await template_crud.seed_prebuilt_templates(db)
        
        logger.info(f"Pre-built templates seeded by {current_user['email']}")
        
        return {
            "message": "Pre-built templates seeded successfully"
        }
    except Exception as e:
        logger.error(f"Error seeding templates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to seed pre-built templates"
        )