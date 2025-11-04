from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from app.models.note import NoteInDB, NoteCreate


async def create_note(
    db: AsyncIOMotorDatabase,
    household_id: str,
    note_data: NoteCreate
) -> NoteInDB:
    """Create a new appreciation note."""
    note_dict = note_data.model_dump()
    note_dict["household_id"] = ObjectId(household_id)
    note_dict["created_at"] = datetime.utcnow()
    
    result = await db.appreciation_notes.insert_one(note_dict)
    note_dict["_id"] = result.inserted_id
    
    return NoteInDB(**note_dict)


async def get_notes_by_household(
    db: AsyncIOMotorDatabase,
    household_id: str,
    limit: int = 50
) -> List[NoteInDB]:
    """Get appreciation notes for a household."""
    cursor = db.appreciation_notes.find({
        "household_id": ObjectId(household_id)
    }).sort("created_at", -1).limit(limit)
    
    notes = await cursor.to_list(length=limit)
    return [NoteInDB(**note) for note in notes]


async def get_notes_for_member(
    db: AsyncIOMotorDatabase,
    household_id: str,
    member_id: str,
    limit: int = 20
) -> List[NoteInDB]:
    """Get appreciation notes sent to a specific member."""
    cursor = db.appreciation_notes.find({
        "household_id": ObjectId(household_id),
        "to_id": member_id
    }).sort("created_at", -1).limit(limit)
    
    notes = await cursor.to_list(length=limit)
    return [NoteInDB(**note) for note in notes]


async def get_notes_from_member(
    db: AsyncIOMotorDatabase,
    household_id: str,
    member_id: str,
    limit: int = 20
) -> List[NoteInDB]:
    """Get appreciation notes sent by a specific member."""
    cursor = db.appreciation_notes.find({
        "household_id": ObjectId(household_id),
        "from_id": member_id
    }).sort("created_at", -1).limit(limit)
    
    notes = await cursor.to_list(length=limit)
    return [NoteInDB(**note) for note in notes]


async def delete_note(
    db: AsyncIOMotorDatabase,
    note_id: str,
    household_id: str
) -> bool:
    """Delete an appreciation note."""
    result = await db.appreciation_notes.delete_one({
        "_id": ObjectId(note_id),
        "household_id": ObjectId(household_id)
    })
    
    return result.deleted_count > 0