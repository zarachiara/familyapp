from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.models.equilibrium import EquilibriumCreate, EquilibriumUpdate, EquilibriumResponse
from app.crud import equilibrium as equilibrium_crud
from app.dependencies.auth import get_current_user
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/equilibrium", tags=["equilibrium"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=EquilibriumResponse)
async def create_equilibrium(
    equilibrium_data: EquilibriumCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new equilibrium snapshot.
    
    This will deactivate any existing active equilibrium and set this as the new active one.
    
    Request body:
    - assignments: Dictionary mapping member_id to list of task_ids
    - fairness_score: Calculated fairness score
    - capacities: List of member capacity snapshots
    - description: Optional description of this equilibrium
    - is_active: Whether this is the active equilibrium (default: true)
    
    Returns:
        Created equilibrium snapshot
    """
    try:
        household_id = str(current_user["household_id"])
        created_by = current_user.get("member_id", str(current_user["_id"]))
        
        equilibrium = await equilibrium_crud.create_equilibrium(
            db, household_id, equilibrium_data, created_by
        )
        
        logger.info(f"Equilibrium snapshot created by {current_user['email']}")
        
        return EquilibriumResponse(
            id=str(equilibrium.id),
            household_id=str(equilibrium.household_id),
            assignments=equilibrium.assignments,
            fairness_score=equilibrium.fairness_score,
            capacities=equilibrium.capacities,
            description=equilibrium.description,
            is_active=equilibrium.is_active,
            timestamp=equilibrium.timestamp,
            created_by=equilibrium.created_by
        )
    except Exception as e:
        logger.error(f"Error creating equilibrium: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create equilibrium snapshot"
        )


@router.get("/active", response_model=EquilibriumResponse)
async def get_active_equilibrium(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get the currently active equilibrium for the household.
    
    Returns:
        Active equilibrium snapshot or 404 if none exists
    """
    try:
        household_id = str(current_user["household_id"])
        
        equilibrium = await equilibrium_crud.get_active_equilibrium(db, household_id)
        
        if not equilibrium:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active equilibrium found"
            )
        
        return EquilibriumResponse(
            id=str(equilibrium.id),
            household_id=str(equilibrium.household_id),
            assignments=equilibrium.assignments,
            fairness_score=equilibrium.fairness_score,
            capacities=equilibrium.capacities,
            description=equilibrium.description,
            is_active=equilibrium.is_active,
            timestamp=equilibrium.timestamp,
            created_by=equilibrium.created_by
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching active equilibrium: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch active equilibrium"
        )


@router.get("/history", response_model=List[EquilibriumResponse])
async def get_equilibrium_history(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get equilibrium history for the household.
    
    Query parameters:
    - limit: Maximum number of historical snapshots to return (1-50, default: 10)
    
    Returns:
        List of historical equilibrium snapshots (most recent first)
    """
    try:
        household_id = str(current_user["household_id"])
        
        equilibriums = await equilibrium_crud.get_equilibrium_history(db, household_id, limit)
        
        return [
            EquilibriumResponse(
                id=str(eq.id),
                household_id=str(eq.household_id),
                assignments=eq.assignments,
                fairness_score=eq.fairness_score,
                capacities=eq.capacities,
                description=eq.description,
                is_active=eq.is_active,
                timestamp=eq.timestamp,
                created_by=eq.created_by
            )
            for eq in equilibriums
        ]
    except Exception as e:
        logger.error(f"Error fetching equilibrium history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch equilibrium history"
        )


@router.get("/{equilibrium_id}", response_model=EquilibriumResponse)
async def get_equilibrium(
    equilibrium_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific equilibrium snapshot by ID.
    
    Path parameters:
    - equilibrium_id: Equilibrium snapshot ID
    
    Returns:
        Equilibrium snapshot information
    """
    try:
        household_id = str(current_user["household_id"])
        
        equilibrium = await equilibrium_crud.get_equilibrium_by_id(db, equilibrium_id, household_id)
        
        if not equilibrium:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equilibrium snapshot not found"
            )
        
        return EquilibriumResponse(
            id=str(equilibrium.id),
            household_id=str(equilibrium.household_id),
            assignments=equilibrium.assignments,
            fairness_score=equilibrium.fairness_score,
            capacities=equilibrium.capacities,
            description=equilibrium.description,
            is_active=equilibrium.is_active,
            timestamp=equilibrium.timestamp,
            created_by=equilibrium.created_by
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching equilibrium: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch equilibrium snapshot"
        )


@router.post("/{equilibrium_id}/restore", response_model=EquilibriumResponse)
async def restore_equilibrium(
    equilibrium_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Restore a previous equilibrium snapshot as the active one.
    
    This will deactivate the current active equilibrium and activate the selected one.
    
    Path parameters:
    - equilibrium_id: Equilibrium snapshot ID to restore
    
    Returns:
        Restored equilibrium snapshot
    """
    try:
        household_id = str(current_user["household_id"])
        
        equilibrium = await equilibrium_crud.restore_equilibrium(db, equilibrium_id, household_id)
        
        if not equilibrium:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equilibrium snapshot not found"
            )
        
        logger.info(f"Equilibrium restored: {equilibrium_id} by {current_user['email']}")
        
        return EquilibriumResponse(
            id=str(equilibrium.id),
            household_id=str(equilibrium.household_id),
            assignments=equilibrium.assignments,
            fairness_score=equilibrium.fairness_score,
            capacities=equilibrium.capacities,
            description=equilibrium.description,
            is_active=equilibrium.is_active,
            timestamp=equilibrium.timestamp,
            created_by=equilibrium.created_by
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restoring equilibrium: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to restore equilibrium snapshot"
        )


@router.put("/{equilibrium_id}", response_model=EquilibriumResponse)
async def update_equilibrium(
    equilibrium_id: str,
    updates: EquilibriumUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Update an equilibrium snapshot.
    
    Path parameters:
    - equilibrium_id: Equilibrium snapshot ID
    
    Request body:
    - is_active: Update active status (optional)
    - description: Update description (optional)
    
    Returns:
        Updated equilibrium snapshot
    """
    try:
        household_id = str(current_user["household_id"])
        
        equilibrium = await equilibrium_crud.update_equilibrium(db, equilibrium_id, household_id, updates)
        
        if not equilibrium:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equilibrium snapshot not found"
            )
        
        logger.info(f"Equilibrium updated: {equilibrium_id} by {current_user['email']}")
        
        return EquilibriumResponse(
            id=str(equilibrium.id),
            household_id=str(equilibrium.household_id),
            assignments=equilibrium.assignments,
            fairness_score=equilibrium.fairness_score,
            capacities=equilibrium.capacities,
            description=equilibrium.description,
            is_active=equilibrium.is_active,
            timestamp=equilibrium.timestamp,
            created_by=equilibrium.created_by
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating equilibrium: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update equilibrium snapshot"
        )


@router.delete("/{equilibrium_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equilibrium(
    equilibrium_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete an equilibrium snapshot.
    
    Note: Only inactive equilibrium snapshots can be deleted.
    
    Path parameters:
    - equilibrium_id: Equilibrium snapshot ID
    
    Returns:
        No content on success
    """
    try:
        household_id = str(current_user["household_id"])
        
        deleted = await equilibrium_crud.delete_equilibrium(db, equilibrium_id, household_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equilibrium snapshot not found or is currently active"
            )
        
        logger.info(f"Equilibrium deleted: {equilibrium_id} by {current_user['email']}")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting equilibrium: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete equilibrium snapshot"
        )