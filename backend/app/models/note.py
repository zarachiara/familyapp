from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId


class NoteBase(BaseModel):
    """Base appreciation note model."""
    from_id: str  # Member ID
    to_id: str  # Member ID
    message: str


class NoteCreate(NoteBase):
    """Note creation model."""
    pass


class NoteInDB(NoteBase):
    """Note model as stored in database."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    household_id: PyObjectId
    created_at: datetime
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class NoteResponse(NoteBase):
    """Note response model."""
    id: str
    household_id: str
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }