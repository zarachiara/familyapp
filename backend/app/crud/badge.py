from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from app.models.badge import BadgeInDB, BadgeCreate, BadgeEarned


async def create_badge(
    db: AsyncIOMotorDatabase,
    badge_data: BadgeCreate
) -> BadgeInDB:
    """Create a new badge definition."""
    badge_dict = badge_data.model_dump()
    badge_dict["earned_by"] = []
    badge_dict["created_at"] = datetime.utcnow()
    
    result = await db.badges.insert_one(badge_dict)
    badge_dict["_id"] = result.inserted_id
    
    return BadgeInDB(**badge_dict)


async def get_all_badges(
    db: AsyncIOMotorDatabase
) -> List[BadgeInDB]:
    """Get all badge definitions."""
    cursor = db.badges.find({}).sort("threshold", 1)
    badges = await cursor.to_list(length=None)
    
    return [BadgeInDB(**badge) for badge in badges]


async def get_badges_for_household(
    db: AsyncIOMotorDatabase,
    household_id: str
) -> List[BadgeInDB]:
    """Get all badges with earned status for a household."""
    badges = await get_all_badges(db)
    
    # Filter earned_by to only include entries for this household
    for badge in badges:
        badge.earned_by = [
            earned for earned in badge.earned_by
            if earned.household_id == household_id
        ]
    
    return badges


async def award_badge(
    db: AsyncIOMotorDatabase,
    badge_id: str,
    household_id: str,
    member_id: str
) -> Optional[BadgeInDB]:
    """Award a badge to a member."""
    earned_entry = BadgeEarned(
        household_id=household_id,
        member_id=member_id,
        earned_at=datetime.utcnow()
    )
    
    result = await db.badges.find_one_and_update(
        {
            "_id": ObjectId(badge_id),
            "earned_by": {
                "$not": {
                    "$elemMatch": {
                        "household_id": household_id,
                        "member_id": member_id
                    }
                }
            }
        },
        {"$push": {"earned_by": earned_entry.model_dump()}},
        return_document=True
    )
    
    if result:
        return BadgeInDB(**result)
    return None


async def check_and_award_badges(
    db: AsyncIOMotorDatabase,
    household_id: str,
    member_id: str,
    tasks_completed: int
) -> List[BadgeInDB]:
    """Check if member qualifies for any badges and award them."""
    awarded_badges = []
    
    # Get all badges
    badges = await get_all_badges(db)
    
    for badge in badges:
        # Check if member already has this badge
        already_earned = any(
            earned.household_id == household_id and earned.member_id == member_id
            for earned in badge.earned_by
        )
        
        if not already_earned and tasks_completed >= badge.threshold:
            awarded = await award_badge(db, str(badge.id), household_id, member_id)
            if awarded:
                awarded_badges.append(awarded)
    
    return awarded_badges


async def seed_badges(db: AsyncIOMotorDatabase) -> None:
    """Seed badge definitions if they don't exist."""
    # Check if badges already exist
    count = await db.badges.count_documents({})
    if count > 0:
        return
    
    badge_definitions = [
        {
            "name": "Task Master",
            "description": "Complete 10 tasks",
            "icon": "🏆",
            "threshold": 10,
            "earned_by": [],
            "created_at": datetime.utcnow()
        },
        {
            "name": "Team Player",
            "description": "Complete 25 tasks",
            "icon": "🤝",
            "threshold": 25,
            "earned_by": [],
            "created_at": datetime.utcnow()
        },
        {
            "name": "Consistency Champion",
            "description": "Complete 50 tasks",
            "icon": "⭐",
            "threshold": 50,
            "earned_by": [],
            "created_at": datetime.utcnow()
        },
        {
            "name": "Household Hero",
            "description": "Complete 100 tasks",
            "icon": "🦸",
            "threshold": 100,
            "earned_by": [],
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.badges.insert_many(badge_definitions)