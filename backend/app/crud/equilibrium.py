from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from app.models.equilibrium import EquilibriumInDB, EquilibriumCreate, EquilibriumUpdate


async def create_equilibrium(
    db: AsyncIOMotorDatabase,
    household_id: str,
    equilibrium_data: EquilibriumCreate,
    created_by: str
) -> EquilibriumInDB:
    """Create a new equilibrium snapshot."""
    # Deactivate any existing active equilibrium for this household
    await db.equilibrium_snapshots.update_many(
        {"household_id": ObjectId(household_id), "is_active": True},
        {"$set": {"is_active": False}}
    )
    
    equilibrium_dict = equilibrium_data.model_dump()
    equilibrium_dict["household_id"] = ObjectId(household_id)
    equilibrium_dict["created_by"] = created_by
    equilibrium_dict["timestamp"] = datetime.utcnow()
    
    result = await db.equilibrium_snapshots.insert_one(equilibrium_dict)
    equilibrium_dict["_id"] = result.inserted_id
    
    return EquilibriumInDB(**equilibrium_dict)


async def get_active_equilibrium(
    db: AsyncIOMotorDatabase,
    household_id: str
) -> Optional[EquilibriumInDB]:
    """Get the currently active equilibrium for a household."""
    equilibrium = await db.equilibrium_snapshots.find_one({
        "household_id": ObjectId(household_id),
        "is_active": True
    })
    
    if equilibrium:
        return EquilibriumInDB(**equilibrium)
    return None


async def get_equilibrium_history(
    db: AsyncIOMotorDatabase,
    household_id: str,
    limit: int = 10
) -> List[EquilibriumInDB]:
    """Get equilibrium history for a household."""
    cursor = db.equilibrium_snapshots.find({
        "household_id": ObjectId(household_id),
        "is_active": False
    }).sort("timestamp", -1).limit(limit)
    
    equilibriums = await cursor.to_list(length=limit)
    return [EquilibriumInDB(**eq) for eq in equilibriums]


async def get_equilibrium_by_id(
    db: AsyncIOMotorDatabase,
    equilibrium_id: str,
    household_id: str
) -> Optional[EquilibriumInDB]:
    """Get a specific equilibrium snapshot by ID."""
    equilibrium = await db.equilibrium_snapshots.find_one({
        "_id": ObjectId(equilibrium_id),
        "household_id": ObjectId(household_id)
    })
    
    if equilibrium:
        return EquilibriumInDB(**equilibrium)
    return None


async def restore_equilibrium(
    db: AsyncIOMotorDatabase,
    equilibrium_id: str,
    household_id: str
) -> Optional[EquilibriumInDB]:
    """Restore a previous equilibrium snapshot as the active one."""
    # Deactivate current active equilibrium
    await db.equilibrium_snapshots.update_many(
        {"household_id": ObjectId(household_id), "is_active": True},
        {"$set": {"is_active": False}}
    )
    
    # Activate the selected equilibrium
    result = await db.equilibrium_snapshots.find_one_and_update(
        {"_id": ObjectId(equilibrium_id), "household_id": ObjectId(household_id)},
        {"$set": {"is_active": True}},
        return_document=True
    )
    
    if result:
        return EquilibriumInDB(**result)
    return None


async def update_equilibrium(
    db: AsyncIOMotorDatabase,
    equilibrium_id: str,
    household_id: str,
    updates: EquilibriumUpdate
) -> Optional[EquilibriumInDB]:
    """Update an equilibrium snapshot."""
    update_dict = {k: v for k, v in updates.model_dump(exclude_unset=True).items() if v is not None}
    
    if not update_dict:
        return await get_equilibrium_by_id(db, equilibrium_id, household_id)
    
    result = await db.equilibrium_snapshots.find_one_and_update(
        {"_id": ObjectId(equilibrium_id), "household_id": ObjectId(household_id)},
        {"$set": update_dict},
        return_document=True
    )
    
    if result:
        return EquilibriumInDB(**result)
    return None


async def delete_equilibrium(
    db: AsyncIOMotorDatabase,
    equilibrium_id: str,
    household_id: str
) -> bool:
    """Delete an equilibrium snapshot (only if not active)."""
    result = await db.equilibrium_snapshots.delete_one({
        "_id": ObjectId(equilibrium_id),
        "household_id": ObjectId(household_id),
        "is_active": False
    })
    
    return result.deleted_count > 0