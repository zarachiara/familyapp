from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.models.notification import NotificationPreferences


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


class UserBase(BaseModel):
    """Base user model with common fields."""
    email: EmailStr
    name: str


class UserCreate(UserBase):
    """User creation model."""
    password: str
    household_name: str


class UserLogin(BaseModel):
    """User login model."""
    email: EmailStr
    password: str


class UserInDB(UserBase):
    """User model as stored in database."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    password_hash: str
    household_id: PyObjectId
    created_at: datetime
    notification_preferences: NotificationPreferences = Field(default_factory=NotificationPreferences)
    onboarding_completed: bool = False
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class UserResponse(UserBase):
    """User response model (without sensitive data)."""
    id: str
    household_id: str
    created_at: datetime
    notification_preferences: NotificationPreferences
    onboarding_completed: bool = False
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }