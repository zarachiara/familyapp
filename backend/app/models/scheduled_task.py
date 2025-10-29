from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId


class ScheduledTaskBase(BaseModel):
    """Base scheduled task model."""
    task_name: str
    task_type: str  # e.g., "data_backup", "cleanup", "report_generation"
    interval_days: int = 30
    enabled: bool = True


class ScheduledTaskCreate(ScheduledTaskBase):
    """Scheduled task creation model."""
    pass


class ScheduledTaskInDB(ScheduledTaskBase):
    """Scheduled task model as stored in database."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    last_run: Optional[datetime] = None
    next_run: datetime
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = {}
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class ScheduledTaskResponse(ScheduledTaskBase):
    """Scheduled task response model."""
    id: str
    last_run: Optional[datetime]
    next_run: datetime
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ScheduledTaskUpdate(BaseModel):
    """Model for updating scheduled task."""
    task_name: Optional[str] = None
    enabled: Optional[bool] = None
    interval_days: Optional[int] = None
    next_run: Optional[datetime] = None
    last_run: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None