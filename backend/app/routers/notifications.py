from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import logging

from app.models.user import UserInDB
from app.models.notification import NotificationPreferences
from app.dependencies.auth import get_current_user
from app.database import get_database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


class TestEmailRequest(BaseModel):
    """Request model for test email endpoints."""
    test_email: EmailStr


@router.get("/preferences", response_model=NotificationPreferences)
async def get_notification_preferences(
    current_user: dict = Depends(get_current_user)
) -> NotificationPreferences:
    """
    Get the current user's notification preferences.
    
    Returns:
        NotificationPreferences: The user's notification preferences
    """
    try:
        # Return the user's notification preferences
        prefs = current_user.get("notification_preferences", {
            "email_enabled": True,
            "task_reminders": True,
            "weekly_digest": True,
            "overdue_alerts": True
        })
        return NotificationPreferences(**prefs)
        
    except Exception as e:
        logger.error(f"Error fetching notification preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notification preferences"
        )


@router.put("/preferences", response_model=NotificationPreferences)
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
) -> NotificationPreferences:
    """
    Update the current user's notification preferences.
    
    Args:
        preferences: The new notification preferences
        
    Returns:
        NotificationPreferences: The updated notification preferences
    """
    try:
        # Update the user's notification preferences in the database
        result = await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"notification_preferences": preferences.model_dump()}}
        )
        
        if result.modified_count == 0:
            logger.warning(f"No changes made to notification preferences for user {current_user['_id']}")
        
        logger.info(f"Updated notification preferences for user {current_user['_id']}")
        return preferences
        
    except Exception as e:
        logger.error(f"Error updating notification preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification preferences"
        )


@router.post("/test-email")
async def send_test_email(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Send a test email to the current user.
    
    This endpoint is useful for testing the email service configuration.
    
    Returns:
        Dict with success status and message
    """
    try:
        from app.services.email_service import email_service
        
        success = await email_service.send_email(
            to_email=current_user["email"],
            to_name=current_user["name"],
            subject="Test Email from FairShare",
            template_name="test_email",
            context={
                "user_name": current_user["name"],
                "test_message": "This is a test email to verify your email notification settings."
            },
            user_id=str(current_user["_id"]),
            email_type="test"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Test email sent successfully to {current_user['email']}"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send test email"
            )
            
    except Exception as e:
        logger.error(f"Error sending test email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test email: {str(e)}"
        )


@router.post("/test/{email_type}")
async def send_test_email_by_type(
    email_type: str,
    request: TestEmailRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
) -> Dict[str, Any]:
    """
    Send a test email of a specific type using real user data.
    
    Available email types:
    - test: Basic test email
    - new_assignment: New task assignment notification
    - task_reminder: Task reminder notification
    - overdue_tasks: Overdue tasks notification
    - weekly_digest: Weekly summary digest
    - fairflow_completion: FairFlow rebalancing completion
    
    Args:
        email_type: Type of email to send
        request: Request containing test email address
        current_user: Current authenticated user
        db: Database instance
        
    Returns:
        Dict with success status and message
    """
    try:
        from app.services.email_service import email_service
        
        user_name = current_user["name"]
        test_email = request.test_email
        
        # Get household info
        household = await db.households.find_one({"_id": current_user["household_id"]})
        household_name = household["name"] if household else "Your Household"
        
        success = False
        
        if email_type == "test":
            success = await email_service.send_email(
                to_email=test_email,
                to_name=user_name,
                subject="Test Email from FairShare",
                template_name="test_email",
                context={
                    "user_name": user_name,
                    "test_message": "This is a test email to verify your email notification settings."
                },
                user_id=str(current_user["_id"]),
                email_type="test"
            )
            
        elif email_type == "new_assignment":
            # Get a real task or use sample data
            task = await db.tasks.find_one({"household_id": current_user["household_id"]})
            task_name = task["name"] if task else "Clean the Kitchen"
            task_description = task.get("description", "Wipe down counters, do dishes, and sweep the floor")
            due_date = task.get("due_date", datetime.now() + timedelta(days=2))
            
            success = await email_service.send_email(
                to_email=test_email,
                to_name=user_name,
                subject=f"New Task Assigned: {task_name}",
                template_name="new_assignment",
                context={
                    "user_name": user_name,
                    "task_name": task_name,
                    "task_description": task_description,
                    "due_date": due_date.strftime("%B %d, %Y") if isinstance(due_date, datetime) else due_date,
                    "points": task.get("points", 15) if task else 15,
                    "app_url": "http://localhost:5173"
                },
                user_id=str(current_user["_id"]),
                email_type="new_assignment"
            )
            
        elif email_type == "task_reminder":
            # Get a real task or use sample data
            task = await db.tasks.find_one({"household_id": current_user["household_id"]})
            task_name = task["name"] if task else "Clean the Kitchen"
            due_date = task.get("due_date", datetime.now() + timedelta(days=1))
            
            success = await email_service.send_email(
                to_email=test_email,
                to_name=user_name,
                subject=f"Reminder: {task_name} is due soon",
                template_name="task_reminder",
                context={
                    "user_name": user_name,
                    "task_name": task_name,
                    "due_date": due_date.strftime("%B %d, %Y at %I:%M %p") if isinstance(due_date, datetime) else due_date,
                    "time_remaining": "1 day",
                    "app_url": "http://localhost:5173"
                },
                user_id=str(current_user["_id"]),
                email_type="task_reminder"
            )
            
        elif email_type == "overdue_tasks":
            # Get real overdue tasks or use sample data
            overdue_tasks = []
            cursor = db.tasks.find({
                "household_id": current_user["household_id"],
                "status": {"$ne": "completed"}
            }).limit(3)
            
            async for task in cursor:
                overdue_tasks.append({
                    "name": task["name"],
                    "due_date": (datetime.now() - timedelta(days=2)).strftime("%B %d, %Y"),
                    "days_overdue": 2
                })
            
            if not overdue_tasks:
                overdue_tasks = [
                    {
                        "name": "Take out the trash",
                        "due_date": (datetime.now() - timedelta(days=2)).strftime("%B %d, %Y"),
                        "days_overdue": 2
                    },
                    {
                        "name": "Water the plants",
                        "due_date": (datetime.now() - timedelta(days=1)).strftime("%B %d, %Y"),
                        "days_overdue": 1
                    }
                ]
            
            success = await email_service.send_email(
                to_email=test_email,
                to_name=user_name,
                subject=f"You have {len(overdue_tasks)} overdue task(s)",
                template_name="overdue_tasks",
                context={
                    "user_name": user_name,
                    "overdue_count": len(overdue_tasks),
                    "tasks": overdue_tasks,
                    "app_url": "http://localhost:5173"
                },
                user_id=str(current_user["_id"]),
                email_type="overdue_alert"
            )
            
        elif email_type == "weekly_digest":
            # Get real stats or use sample data
            completed_tasks = await db.tasks.count_documents({
                "household_id": current_user["household_id"],
                "status": "completed"
            })
            
            upcoming_tasks = []
            cursor = db.tasks.find({
                "household_id": current_user["household_id"],
                "status": {"$ne": "completed"}
            }).limit(3)
            
            async for task in cursor:
                upcoming_tasks.append({
                    "name": task["name"],
                    "due_date": (datetime.now() + timedelta(days=2)).strftime("%B %d")
                })
            
            if not upcoming_tasks:
                upcoming_tasks = [
                    {"name": "Grocery shopping", "due_date": (datetime.now() + timedelta(days=2)).strftime("%B %d")},
                    {"name": "Vacuum living room", "due_date": (datetime.now() + timedelta(days=3)).strftime("%B %d")}
                ]
            
            success = await email_service.send_email(
                to_email=test_email,
                to_name=user_name,
                subject="Your Weekly FairShare Summary",
                template_name="weekly_digest",
                context={
                    "user_name": user_name,
                    "week_start": (datetime.now() - timedelta(days=7)).strftime("%B %d"),
                    "week_end": datetime.now().strftime("%B %d, %Y"),
                    "tasks_completed": completed_tasks if completed_tasks > 0 else 8,
                    "points_earned": completed_tasks * 15 if completed_tasks > 0 else 120,
                    "current_rank": 2,
                    "total_members": len(household.get("members", [])) if household else 4,
                    "upcoming_tasks": upcoming_tasks,
                    "fairness_score": 85,
                    "app_url": "http://localhost:5173"
                },
                user_id=str(current_user["_id"]),
                email_type="weekly_digest"
            )
            
        elif email_type == "fairflow_completion":
            success = await email_service.send_email(
                to_email=test_email,
                to_name=user_name,
                subject="🔄 FairFlow Rebalancing Complete",
                template_name="fairflow_completion",
                context={
                    "user_name": user_name,
                    "household_name": household_name,
                    "rebalance_summary": {
                        "Tasks Redistributed": "15 tasks",
                        "Members Affected": f"{len(household.get('members', []))} members" if household else "4 members",
                        "Fairness Score": "92%",
                        "Balance Improvement": "+12%"
                    },
                    "app_url": "http://localhost:5173"
                },
                user_id=str(current_user["_id"]),
                email_type="fairflow_completion"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown email type: {email_type}"
            )
        
        if success:
            return {
                "success": True,
                "message": f"{email_type.replace('_', ' ').title()} email sent successfully to {test_email}"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send test email"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test email ({email_type}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test email: {str(e)}"
        )