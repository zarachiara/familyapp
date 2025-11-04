from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.models.note import NoteCreate, NoteResponse
from app.crud import note as note_crud
from app.dependencies.auth import get_current_user
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/notes", tags=["notes"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=NoteResponse)
async def create_note(
    note_data: NoteCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new appreciation note.
    
    Request body:
    - from_id: Member ID sending the note
    - to_id: Member ID receiving the note
    - message: Appreciation message
    
    Returns:
        Created note information
    """
    try:
        household_id = str(current_user["household_id"])
        
        note = await note_crud.create_note(db, household_id, note_data)
        
        logger.info(f"Appreciation note created from {note_data.from_id} to {note_data.to_id}")
        
        return NoteResponse(
            id=str(note.id),
            household_id=str(note.household_id),
            from_id=note.from_id,
            to_id=note.to_id,
            message=note.message,
            created_at=note.created_at
        )
    except Exception as e:
        logger.error(f"Error creating note: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create appreciation note"
        )


@router.get("", response_model=List[NoteResponse])
async def get_notes(
    limit: int = Query(50, ge=1, le=200),
    to_member: Optional[str] = Query(None, alias="to"),
    from_member: Optional[str] = Query(None, alias="from"),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get appreciation notes for the household.
    
    Query parameters:
    - limit: Maximum number of notes to return (1-200, default: 50)
    - to: Filter by recipient member ID
    - from: Filter by sender member ID
    
    Returns:
        List of appreciation notes (most recent first)
    """
    try:
        household_id = str(current_user["household_id"])
        
        # Apply filters based on query parameters
        if to_member:
            notes = await note_crud.get_notes_for_member(db, household_id, to_member, limit)
        elif from_member:
            notes = await note_crud.get_notes_from_member(db, household_id, from_member, limit)
        else:
            notes = await note_crud.get_notes_by_household(db, household_id, limit)
        
        return [
            NoteResponse(
                id=str(note.id),
                household_id=str(note.household_id),
                from_id=note.from_id,
                to_id=note.to_id,
                message=note.message,
                created_at=note.created_at
            )
            for note in notes
        ]
    except Exception as e:
        logger.error(f"Error fetching notes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch appreciation notes"
        )


@router.get("/received/{member_id}", response_model=List[NoteResponse])
async def get_notes_received(
    member_id: str,
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get appreciation notes received by a specific member.
    
    Path parameters:
    - member_id: Member ID
    
    Query parameters:
    - limit: Maximum number of notes to return (1-100, default: 20)
    
    Returns:
        List of notes received by the member (most recent first)
    """
    try:
        household_id = str(current_user["household_id"])
        
        notes = await note_crud.get_notes_for_member(db, household_id, member_id, limit)
        
        return [
            NoteResponse(
                id=str(note.id),
                household_id=str(note.household_id),
                from_id=note.from_id,
                to_id=note.to_id,
                message=note.message,
                created_at=note.created_at
            )
            for note in notes
        ]
    except Exception as e:
        logger.error(f"Error fetching notes for member: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notes for member"
        )


@router.get("/sent/{member_id}", response_model=List[NoteResponse])
async def get_notes_sent(
    member_id: str,
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get appreciation notes sent by a specific member.
    
    Path parameters:
    - member_id: Member ID
    
    Query parameters:
    - limit: Maximum number of notes to return (1-100, default: 20)
    
    Returns:
        List of notes sent by the member (most recent first)
    """
    try:
        household_id = str(current_user["household_id"])
        
        notes = await note_crud.get_notes_from_member(db, household_id, member_id, limit)
        
        return [
            NoteResponse(
                id=str(note.id),
                household_id=str(note.household_id),
                from_id=note.from_id,
                to_id=note.to_id,
                message=note.message,
                created_at=note.created_at
            )
            for note in notes
        ]
    except Exception as e:
        logger.error(f"Error fetching notes from member: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notes from member"
        )


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete an appreciation note.
    
    Path parameters:
    - note_id: Note ID
    
    Returns:
        No content on success
    """
    try:
        household_id = str(current_user["household_id"])
        
        deleted = await note_crud.delete_note(db, note_id, household_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        logger.info(f"Note deleted: {note_id} by {current_user['email']}")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting note: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete note"
        )