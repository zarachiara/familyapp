from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId


class TaskBase(BaseModel):
    """Base task model."""
    title: str
    description: str = ""
    assignee_id: str  # Member ID from household.members
    due_date: datetime
    status: str = "todo"  # todo, in-progress, done
    recurrence: str = "none"  # none, daily, weekly, monthly, custom
    room: str = "General"
    points: int
    estimated_minutes: int


class TaskCreate(TaskBase):
    """Task creation model."""
    pass


class TaskInDB(TaskBase):
    """Task model as stored in database."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    household_id: PyObjectId
    created_by: str  # Member ID
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class TaskResponse(TaskBase):
    """Task response model."""
    id: str
    household_id: str
    created_by: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TaskUpdate(BaseModel):
    """Model for updating task."""
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    recurrence: Optional[str] = None
    room: Optional[str] = None
    points: Optional[int] = None
    estimated_minutes: Optional[int] = None
    completed_at: Optional[datetime] = None