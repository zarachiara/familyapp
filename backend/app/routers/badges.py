from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.models.badge import BadgeCreate, BadgeResponse
from app.crud import badge as badge_crud
from app.dependencies.auth import get_current_user
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/badges", tags=["badges"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=BadgeResponse)
async def create_badge(
    badge_data: BadgeCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new badge (admin/system use).
    
    Request body:
    - name: Badge name
    - description: Badge description
    - icon: Badge icon/emoji
    - threshold: Number of tasks/points required to earn
    
    Returns:
        Created badge information
    """
    try:
        badge = await badge_crud.create_badge(db, badge_data)
        
        logger.info(f"Badge created: {badge.name} by {current_user['email']}")
        
        return BadgeResponse(
            id=str(badge.id),
            name=badge.name,
            description=badge.description,
            icon=badge.icon,
            threshold=badge.threshold,
            earned_by=badge.earned_by,
            created_at=badge.created_at
        )
    except Exception as e:
        logger.error(f"Error creating badge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create badge"
        )


@router.get("", response_model=List[BadgeResponse])
async def get_all_badges(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all available badges.
    
    Returns:
        List of all badges
    """
    try:
        badges = await badge_crud.get_all_badges(db)
        
        return [
            BadgeResponse(
                id=str(badge.id),
                name=badge.name,
                description=badge.description,
                icon=badge.icon,
                threshold=badge.threshold,
                earned_by=badge.earned_by,
                created_at=badge.created_at
            )
            for badge in badges
        ]
    except Exception as e:
        logger.error(f"Error fetching badges: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch badges"
        )


@router.get("/member/{member_id}", response_model=List[BadgeResponse])
async def get_member_badges(
    member_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get badges earned by a specific member.
    
    Path parameters:
    - member_id: Member ID
    
    Returns:
        List of badges earned by the member
    """
    try:
        household_id = str(current_user["household_id"])
        
        badges = await badge_crud.get_badges_for_member(db, household_id, member_id)
        
        return [
            BadgeResponse(
                id=str(badge.id),
                name=badge.name,
                description=badge.description,
                icon=badge.icon,
                threshold=badge.threshold,
                earned_by=badge.earned_by,
                created_at=badge.created_at
            )
            for badge in badges
        ]
    except Exception as e:
        logger.error(f"Error fetching member badges: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch member badges"
        )


@router.get("/{badge_id}", response_model=BadgeResponse)
async def get_badge(
    badge_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific badge by ID.
    
    Path parameters:
    - badge_id: Badge ID
    
    Returns:
        Badge information
    """
    try:
        badge = await badge_crud.get_badge_by_id(db, badge_id)
        
        if not badge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found"
            )
        
        return BadgeResponse(
            id=str(badge.id),
            name=badge.name,
            description=badge.description,
            icon=badge.icon,
            threshold=badge.threshold,
            earned_by=badge.earned_by,
            created_at=badge.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching badge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch badge"
        )


@router.post("/{badge_id}/award/{member_id}", response_model=BadgeResponse)
async def award_badge(
    badge_id: str,
    member_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Award a badge to a member.
    
    Path parameters:
    - badge_id: Badge ID
    - member_id: Member ID to award the badge to
    
    Returns:
        Updated badge information
    """
    try:
        household_id = str(current_user["household_id"])
        
        badge = await badge_crud.award_badge(db, badge_id, household_id, member_id)
        
        if not badge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found"
            )
        
        logger.info(f"Badge {badge_id} awarded to member {member_id} by {current_user['email']}")
        
        return BadgeResponse(
            id=str(badge.id),
            name=badge.name,
            description=badge.description,
            icon=badge.icon,
            threshold=badge.threshold,
            earned_by=badge.earned_by,
            created_at=badge.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error awarding badge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to award badge"
        )


@router.post("/{badge_id}/check/{member_id}")
async def check_badge_eligibility(
    badge_id: str,
    member_id: str,
    tasks_completed: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Check if a member is eligible for a badge and award it if they are.
    
    Path parameters:
    - badge_id: Badge ID
    - member_id: Member ID to check
    
    Query parameters:
    - tasks_completed: Number of tasks completed by the member
    
    Returns:
        Eligibility status and badge information if awarded
    """
    try:
        household_id = str(current_user["household_id"])
        
        result = await badge_crud.check_and_award_badge(
            db, badge_id, household_id, member_id, tasks_completed
        )
        
        if result["awarded"]:
            logger.info(f"Badge {badge_id} automatically awarded to member {member_id}")
        
        return result
    except Exception as e:
        logger.error(f"Error checking badge eligibility: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check badge eligibility"
        )


@router.delete("/{badge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_badge(
    badge_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a badge (admin use).
    
    Path parameters:
    - badge_id: Badge ID
    
    Returns:
        No content on success
    """
    try:
        deleted = await badge_crud.delete_badge(db, badge_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found"
            )
        
        logger.info(f"Badge deleted: {badge_id} by {current_user['email']}")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting badge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete badge"
        )


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed_default_badges(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Seed default badges (admin/development use).
    
    This endpoint seeds the database with default badges if they don't exist.
    
    Returns:
        Success message
    """
    try:
        await badge_crud.seed_default_badges(db)
        
        logger.info(f"Default badges seeded by {current_user['email']}")
        
        return {
            "message": "Default badges seeded successfully"
        }
    except Exception as e:
        logger.error(f"Error seeding badges: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to seed default badges"
        )