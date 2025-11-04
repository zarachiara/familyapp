from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId


class TemplateTask(BaseModel):
    """Task definition within a template."""
    title: str
    description: str = ""
    recurrence: str = "none"
    room: str = "General"
    points: int
    estimated_minutes: int


class TemplateBase(BaseModel):
    """Base template model."""
    name: str
    category: str
    description: str
    tasks: List[TemplateTask]
    is_custom: bool = False


class TemplateCreate(TemplateBase):
    """Template creation model."""
    pass


class TemplateInDB(TemplateBase):
    """Template model as stored in database."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    household_id: Optional[PyObjectId] = None  # None for pre-built templates
    created_by: Optional[str] = None  # Member ID for custom templates
    created_at: datetime
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class TemplateResponse(TemplateBase):
    """Template response model."""
    id: str
    household_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TemplateApply(BaseModel):
    """Model for applying a template."""
    assignments: dict[int, str]  # task_index -> member_id
    start_date: datetime