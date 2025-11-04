from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.models.sync import SyncSessionCreate, SyncSessionResponse
from app.crud import sync as sync_crud
from app.dependencies.auth import get_current_user
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=SyncSessionResponse)
async def create_sync_session(
    sync_data: SyncSessionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new sync session record.
    
    Request body:
    - reason: Reason for the sync session
    - member_capacities: List of member capacity assessments
    - previous_assignments: Task assignments before sync
    - new_assignments: Task assignments after sync
    - fairness_score_before: Fairness score before recalibration
    - fairness_score_after: Fairness score after recalibration
    
    Returns:
        Created sync session record
    """
    try:
        household_id = str(current_user["household_id"])
        created_by = current_user.get("member_id", str(current_user["_id"]))
        
        sync_session = await sync_crud.create_sync_session(
            db, household_id, sync_data, created_by
        )
        
        logger.info(f"Sync session created by {current_user['email']}")
        
        return SyncSessionResponse(
            id=str(sync_session.id),
            household_id=str(sync_session.household_id),
            reason=sync_session.reason,
            member_capacities=sync_session.member_capacities,
            previous_assignments=sync_session.previous_assignments,
            new_assignments=sync_session.new_assignments,
            fairness_score_before=sync_session.fairness_score_before,
            fairness_score_after=sync_session.fairness_score_after,
            timestamp=sync_session.timestamp,
            created_by=sync_session.created_by
        )
    except Exception as e:
        logger.error(f"Error creating sync session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create sync session"
        )


@router.get("/history", response_model=List[SyncSessionResponse])
async def get_sync_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get sync session history for the household.
    
    Query parameters:
    - limit: Maximum number of sessions to return (1-100, default: 20)
    
    Returns:
        List of sync sessions (most recent first)
    """
    try:
        household_id = str(current_user["household_id"])
        
        sessions = await sync_crud.get_sync_history(db, household_id, limit)
        
        return [
            SyncSessionResponse(
                id=str(session.id),
                household_id=str(session.household_id),
                reason=session.reason,
                member_capacities=session.member_capacities,
                previous_assignments=session.previous_assignments,
                new_assignments=session.new_assignments,
                fairness_score_before=session.fairness_score_before,
                fairness_score_after=session.fairness_score_after,
                timestamp=session.timestamp,
                created_by=session.created_by
            )
            for session in sessions
        ]
    except Exception as e:
        logger.error(f"Error fetching sync history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch sync history"
        )


@router.get("/latest", response_model=SyncSessionResponse)
async def get_latest_sync_session(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get the most recent sync session for the household.
    
    Returns:
        Latest sync session or 404 if none exists
    """
    try:
        household_id = str(current_user["household_id"])
        
        session = await sync_crud.get_latest_sync_session(db, household_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No sync sessions found"
            )
        
        return SyncSessionResponse(
            id=str(session.id),
            household_id=str(session.household_id),
            reason=session.reason,
            member_capacities=session.member_capacities,
            previous_assignments=session.previous_assignments,
            new_assignments=session.new_assignments,
            fairness_score_before=session.fairness_score_before,
            fairness_score_after=session.fairness_score_after,
            timestamp=session.timestamp,
            created_by=session.created_by
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching latest sync session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch latest sync session"
        )


@router.get("/{session_id}", response_model=SyncSessionResponse)
async def get_sync_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific sync session by ID.
    
    Path parameters:
    - session_id: Sync session ID
    
    Returns:
        Sync session information
    """
    try:
        household_id = str(current_user["household_id"])
        
        session = await sync_crud.get_sync_session_by_id(db, session_id, household_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sync session not found"
            )
        
        return SyncSessionResponse(
            id=str(session.id),
            household_id=str(session.household_id),
            reason=session.reason,
            member_capacities=session.member_capacities,
            previous_assignments=session.previous_assignments,
            new_assignments=session.new_assignments,
            fairness_score_before=session.fairness_score_before,
            fairness_score_after=session.fairness_score_after,
            timestamp=session.timestamp,
            created_by=session.created_by
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sync session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch sync session"
        )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sync_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a sync session.
    
    Path parameters:
    - session_id: Sync session ID
    
    Returns:
        No content on success
    """
    try:
        household_id = str(current_user["household_id"])
        
        deleted = await sync_crud.delete_sync_session(db, session_id, household_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sync session not found"
            )
        
        logger.info(f"Sync session deleted: {session_id} by {current_user['email']}")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting sync session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete sync session"
        )