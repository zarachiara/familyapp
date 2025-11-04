from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from app.models.sync import SyncSessionInDB, SyncSessionCreate


async def create_sync_session(
    db: AsyncIOMotorDatabase,
    household_id: str,
    sync_data: SyncSessionCreate,
    created_by: str
) -> SyncSessionInDB:
    """Create a new sync session record."""
    sync_dict = sync_data.model_dump()
    sync_dict["household_id"] = ObjectId(household_id)
    sync_dict["created_by"] = created_by
    sync_dict["timestamp"] = datetime.utcnow()
    
    result = await db.sync_sessions.insert_one(sync_dict)
    sync_dict["_id"] = result.inserted_id
    
    return SyncSessionInDB(**sync_dict)


async def get_sync_history(
    db: AsyncIOMotorDatabase,
    household_id: str,
    limit: int = 20
) -> List[SyncSessionInDB]:
    """Get sync session history for a household."""
    cursor = db.sync_sessions.find({
        "household_id": ObjectId(household_id)
    }).sort("timestamp", -1).limit(limit)
    
    sessions = await cursor.to_list(length=limit)
    return [SyncSessionInDB(**session) for session in sessions]


async def get_sync_session_by_id(
    db: AsyncIOMotorDatabase,
    session_id: str,
    household_id: str
) -> Optional[SyncSessionInDB]:
    """Get a specific sync session by ID."""
    session = await db.sync_sessions.find_one({
        "_id": ObjectId(session_id),
        "household_id": ObjectId(household_id)
    })
    
    if session:
        return SyncSessionInDB(**session)
    return None


async def get_latest_sync_session(
    db: AsyncIOMotorDatabase,
    household_id: str
) -> Optional[SyncSessionInDB]:
    """Get the most recent sync session for a household."""
    session = await db.sync_sessions.find_one(
        {"household_id": ObjectId(household_id)},
        sort=[("timestamp", -1)]
    )
    
    if session:
        return SyncSessionInDB(**session)
    return None


async def delete_sync_session(
    db: AsyncIOMotorDatabase,
    session_id: str,
    household_id: str
) -> bool:
    """Delete a sync session."""
    result = await db.sync_sessions.delete_one({
        "_id": ObjectId(session_id),
        "household_id": ObjectId(household_id)
    })
    
    return result.deleted_count > 0