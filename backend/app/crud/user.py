from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import Optional, Union
import logging

logger = logging.getLogger(__name__)


async def create_user(
    db: AsyncIOMotorDatabase,
    email: str,
    password_hash: str,
    name: str,
    household_id: ObjectId
) -> dict:
    """Create a new user in the database."""
    user_doc = {
        "email": email.lower(),
        "password_hash": password_hash,
        "name": name,
        "household_id": household_id,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    logger.info(f"Created user: {email}")
    return user_doc


async def get_user_by_email(
    db: AsyncIOMotorDatabase,
    email: str
) -> Optional[dict]:
    """Get a user by email address."""
    user = await db.users.find_one({"email": email.lower()})
    return user


async def get_user_by_id(
    db: AsyncIOMotorDatabase,
    user_id: Union[str, ObjectId]
) -> Optional[dict]:
    """Get a user by ID."""
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    
    user = await db.users.find_one({"_id": user_id})
    return user


async def email_exists(
    db: AsyncIOMotorDatabase,
    email: str
) -> bool:
    """Check if an email already exists in the database."""
    count = await db.users.count_documents({"email": email.lower()})
    return count > 0