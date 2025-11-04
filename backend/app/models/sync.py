from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId


class MemberCapacity(BaseModel):
    """Member capacity for sync session."""
    member_id: str
    member_name: str
    workload_level: int  # 1-5 scale (1=light, 5=heavy)
    energy_level: int  # 1-5 scale (1=exhausted, 5=energized)
    emotional_capacity: int  # 1-5 scale (1=overwhelmed, 5=great)
    reason: Optional[str] = None
    notes: Optional[str] = None


class SyncSessionBase(BaseModel):
    """Base sync session model."""
    reason: str
    member_capacities: List[MemberCapacity]
    previous_assignments: Dict[str, List[str]]  # member_id -> task_ids
    new_assignments: Dict[str, List[str]]  # member_id -> task_ids
    fairness_score_before: float
    fairness_score_after: float


class SyncSessionCreate(SyncSessionBase):
    """Sync session creation model."""
    pass


class SyncSessionInDB(SyncSessionBase):
    """Sync session model as stored in database."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    household_id: PyObjectId
    timestamp: datetime
    created_by: str  # Member ID
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class SyncSessionResponse(SyncSessionBase):
    """Sync session response model."""
    id: str
    household_id: str
    timestamp: datetime
    created_by: str
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }