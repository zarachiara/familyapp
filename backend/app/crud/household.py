from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import Optional, Union
import logging
import uuid

logger = logging.getLogger(__name__)


async def create_household(
    db: AsyncIOMotorDatabase,
    name: str,
    manager_id: ObjectId,
    initial_member: dict
) -> dict:
    """Create a new household with an initial member."""
    household_doc = {
        "name": name,
        "manager_id": manager_id,
        "members": [initial_member],
        "created_at": datetime.utcnow()
    }
    
    result = await db.households.insert_one(household_doc)
    household_doc["_id"] = result.inserted_id
    
    logger.info(f"Created household: {name}")
    return household_doc


async def get_household_by_id(
    db: AsyncIOMotorDatabase,
    household_id: Union[str, ObjectId]
) -> Optional[dict]:
    """Get a household by ID."""
    if isinstance(household_id, str):
        household_id = ObjectId(household_id)
    
    household = await db.households.find_one({"_id": household_id})
    return household


async def update_household_name(
    db: AsyncIOMotorDatabase,
    household_id: Union[str, ObjectId],
    name: str
) -> Optional[dict]:
    """Update household name."""
    if isinstance(household_id, str):
        household_id = ObjectId(household_id)
    
    result = await db.households.find_one_and_update(
        {"_id": household_id},
        {"$set": {"name": name}},
        return_document=True
    )
    
    logger.info(f"Updated household name: {name}")
    return result


async def add_member(
    db: AsyncIOMotorDatabase,
    household_id: Union[str, ObjectId],
    member: dict
) -> Optional[dict]:
    """Add a member to household."""
    if isinstance(household_id, str):
        household_id = ObjectId(household_id)
    
    # Generate unique member ID
    member["id"] = f"member-{uuid.uuid4().hex[:8]}"
    member["points"] = 0
    member["tasks_completed"] = 0
    
    result = await db.households.find_one_and_update(
        {"_id": household_id},
        {"$push": {"members": member}},
        return_document=True
    )
    
    logger.info(f"Added member to household: {member['name']}")
    return result


async def remove_member(
    db: AsyncIOMotorDatabase,
    household_id: Union[str, ObjectId],
    member_id: str
) -> Optional[dict]:
    """Remove a member from household."""
    if isinstance(household_id, str):
        household_id = ObjectId(household_id)
    
    result = await db.households.find_one_and_update(
        {"_id": household_id},
        {"$pull": {"members": {"id": member_id}}},
        return_document=True
    )
    
    logger.info(f"Removed member from household: {member_id}")
    return result


async def update_member_points(
    db: AsyncIOMotorDatabase,
    household_id: Union[str, ObjectId],
    member_id: str,
    points_delta: int,
    tasks_delta: int = 0
) -> Optional[dict]:
    """Update member points and task count."""
    if isinstance(household_id, str):
        household_id = ObjectId(household_id)
    
    result = await db.households.find_one_and_update(
        {"_id": household_id, "members.id": member_id},
        {
            "$inc": {
                "members.$.points": points_delta,
                "members.$.tasks_completed": tasks_delta
            }
        },
        return_document=True
    )
    
    logger.info(f"Updated member points: {member_id} +{points_delta} points, +{tasks_delta} tasks")
    return result