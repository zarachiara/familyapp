from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies.auth import get_current_user
from app.models.user import UserInDB
from app.models.household import WeeklyCommitment
from app.database import get_database
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/v1/household", tags=["household"])


@router.post("/commitment")
async def set_weekly_commitment(
    commitment: WeeklyCommitment,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Set or update the weekly commitment for the household."""
    
    # Update the household's weekly commitment
    result = await db.households.update_one(
        {"_id": current_user["household_id"]},
        {
            "$set": {
                "weekly_commitment": {
                    "week_key": commitment.week_key,
                    "task_count": commitment.task_count,
                    "committed_at": commitment.committed_at
                }
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Household not found"
        )
    
    return {"message": "Weekly commitment set successfully", "commitment": commitment}


@router.get("/commitment")
async def get_weekly_commitment(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get the current weekly commitment for the household."""
    
    household = await db.households.find_one(
        {"_id": current_user["household_id"]},
        {"weekly_commitment": 1}
    )
    
    if not household:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Household not found"
        )
    
    commitment = household.get("weekly_commitment")
    
    return {"commitment": commitment}


@router.delete("/commitment")
async def clear_weekly_commitment(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Clear the weekly commitment (used when week ends)."""
    
    result = await db.households.update_one(
        {"_id": current_user["household_id"]},
        {"$unset": {"weekly_commitment": ""}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Household not found"
        )
    
    return {"message": "Weekly commitment cleared successfully"}