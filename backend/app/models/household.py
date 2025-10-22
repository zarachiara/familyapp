from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId


class Member(BaseModel):
    """Household member embedded document."""
    id: str
    name: str
    role: str  # manager, member, child
    avatar: str
    color: str
    points: int = 0
    tasks_completed: int = 0


class HouseholdBase(BaseModel):
    """Base household model."""
    name: str


class HouseholdCreate(HouseholdBase):
    """Household creation model."""
    pass


class HouseholdInDB(HouseholdBase):
    """Household model as stored in database."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    manager_id: PyObjectId
    members: List[Member] = []
    created_at: datetime
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class HouseholdResponse(HouseholdBase):
    """Household response model."""
    id: str
    manager_id: str
    members: List[Member]
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class MemberCreate(BaseModel):
    """Model for creating a new member."""
    name: str
    role: str
    avatar: str
    color: str


class HouseholdUpdate(BaseModel):
    """Model for updating household."""
    name: str