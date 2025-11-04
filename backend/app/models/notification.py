from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v, field=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class NotificationPreferences(BaseModel):
    """User notification preferences."""
    daily_reminders: bool = True
    weekly_fairness_summary: bool = True
    task_due_reminders: bool = True
    overdue_follow_ups: bool = True
    fair_flow_updates: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "daily_reminders": True,
                "weekly_fairness_summary": True,
                "task_due_reminders": True,
                "overdue_follow_ups": True,
                "fair_flow_updates": True
            }
        }


class EmailLog(BaseModel):
    """Log of sent emails for tracking and debugging."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    email_type: str  # "task_reminder", "new_assignment", "weekly_digest", etc.
    recipient_email: str
    subject: str
    sent_at: datetime
    status: str  # "sent", "failed", "bounced"
    error_message: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class EmailLogCreate(BaseModel):
    """Model for creating email log entries."""
    user_id: str
    email_type: str
    recipient_email: str
    subject: str
    status: str
    error_message: Optional[str] = None