from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId


class MemberCapacitySnapshot(BaseModel):
    """Member capacity snapshot for equilibrium."""
    member_id: str
    member_name: str
    workload_level: int  # 1-5 scale
    energy_level: int  # 1-5 scale
    emotional_capacity: int  # 1-5 scale


class EquilibriumBase(BaseModel):
    """Base equilibrium snapshot model."""
    assignments: Dict[str, List[str]]  # member_id -> task_ids[]
    fairness_score: float
    capacities: List[MemberCapacitySnapshot]
    description: Optional[str] = None
    is_active: bool = True


class EquilibriumCreate(EquilibriumBase):
    """Equilibrium creation model."""
    pass


class EquilibriumInDB(EquilibriumBase):
    """Equilibrium model as stored in database."""
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


class EquilibriumResponse(EquilibriumBase):
    """Equilibrium response model."""
    id: str
    household_id: str
    timestamp: datetime
    created_by: str
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class EquilibriumUpdate(BaseModel):
    """Model for updating equilibrium."""
    is_active: Optional[bool] = None
    description: Optional[str] = None