from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId


class BadgeEarned(BaseModel):
    """Record of a badge earned by a member."""
    household_id: str
    member_id: str
    earned_at: datetime


class BadgeBase(BaseModel):
    """Base badge model."""
    name: str
    description: str
    icon: str
    threshold: int  # Number of tasks/points required


class BadgeCreate(BadgeBase):
    """Badge creation model."""
    pass


class BadgeInDB(BadgeBase):
    """Badge model as stored in database."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    earned_by: List[BadgeEarned] = []
    created_at: datetime
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class BadgeResponse(BadgeBase):
    """Badge response model."""
    id: str
    earned_by: List[BadgeEarned]
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }