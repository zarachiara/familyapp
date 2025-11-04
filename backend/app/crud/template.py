from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from app.models.template import TemplateInDB, TemplateCreate


async def create_template(
    db: AsyncIOMotorDatabase,
    household_id: str,
    template_data: TemplateCreate,
    created_by: str
) -> TemplateInDB:
    """Create a new custom template."""
    template_dict = template_data.model_dump()
    template_dict["household_id"] = ObjectId(household_id)
    template_dict["created_by"] = created_by
    template_dict["created_at"] = datetime.utcnow()
    template_dict["is_custom"] = True
    
    result = await db.templates.insert_one(template_dict)
    template_dict["_id"] = result.inserted_id
    
    return TemplateInDB(**template_dict)


async def get_all_templates(
    db: AsyncIOMotorDatabase,
    household_id: str
) -> List[TemplateInDB]:
    """Get all templates (pre-built + household custom)."""
    # Get pre-built templates (household_id is None)
    # and custom templates for this household
    cursor = db.templates.find({
        "$or": [
            {"household_id": None},
            {"household_id": ObjectId(household_id)}
        ]
    }).sort("name", 1)
    
    templates = await cursor.to_list(length=None)
    return [TemplateInDB(**template) for template in templates]


async def get_template_by_id(
    db: AsyncIOMotorDatabase,
    template_id: str
) -> Optional[TemplateInDB]:
    """Get a specific template by ID."""
    template = await db.templates.find_one({"_id": ObjectId(template_id)})
    
    if template:
        return TemplateInDB(**template)
    return None


async def delete_template(
    db: AsyncIOMotorDatabase,
    template_id: str,
    household_id: str
) -> bool:
    """Delete a custom template (only if is_custom=true and belongs to household)."""
    result = await db.templates.delete_one({
        "_id": ObjectId(template_id),
        "household_id": ObjectId(household_id),
        "is_custom": True
    })
    
    return result.deleted_count > 0


async def seed_prebuilt_templates(db: AsyncIOMotorDatabase) -> None:
    """Seed pre-built templates if they don't exist."""
    # Check if pre-built templates already exist
    count = await db.templates.count_documents({"household_id": None})
    if count > 0:
        return
    
    prebuilt_templates = [
        {
            "name": "Travel Prep",
            "category": "Travel",
            "description": "Complete checklist for family travel",
            "is_custom": False,
            "household_id": None,
            "created_by": None,
            "created_at": datetime.utcnow(),
            "tasks": [
                {
                    "title": "Pack Suitcases",
                    "description": "Pack clothes and essentials",
                    "recurrence": "none",
                    "room": "Bedroom",
                    "points": 30,
                    "estimated_minutes": 120
                },
                {
                    "title": "Check Travel Documents",
                    "description": "Verify passports, tickets, and IDs",
                    "recurrence": "none",
                    "room": "Office",
                    "points": 20,
                    "estimated_minutes": 30
                },
                {
                    "title": "Prepare House for Absence",
                    "description": "Set timers, lock windows, adjust thermostat",
                    "recurrence": "none",
                    "room": "General",
                    "points": 25,
                    "estimated_minutes": 45
                }
            ]
        },
        {
            "name": "Back to School",
            "category": "Education",
            "description": "Get ready for the new school year",
            "is_custom": False,
            "household_id": None,
            "created_by": None,
            "created_at": datetime.utcnow(),
            "tasks": [
                {
                    "title": "Buy School Supplies",
                    "description": "Purchase notebooks, pens, backpack",
                    "recurrence": "none",
                    "room": "General",
                    "points": 30,
                    "estimated_minutes": 90
                },
                {
                    "title": "Organize Study Space",
                    "description": "Clean and set up desk area",
                    "recurrence": "none",
                    "room": "Bedroom",
                    "points": 20,
                    "estimated_minutes": 60
                },
                {
                    "title": "Label School Items",
                    "description": "Label all books, supplies, and clothing",
                    "recurrence": "none",
                    "room": "General",
                    "points": 15,
                    "estimated_minutes": 30
                }
            ]
        },
        {
            "name": "Spring Cleaning",
            "category": "Cleaning",
            "description": "Deep clean the entire house",
            "is_custom": False,
            "household_id": None,
            "created_by": None,
            "created_at": datetime.utcnow(),
            "tasks": [
                {
                    "title": "Clean Windows",
                    "description": "Wash all windows inside and out",
                    "recurrence": "none",
                    "room": "General",
                    "points": 40,
                    "estimated_minutes": 120
                },
                {
                    "title": "Deep Clean Kitchen",
                    "description": "Clean appliances, cabinets, and floors",
                    "recurrence": "none",
                    "room": "Kitchen",
                    "points": 50,
                    "estimated_minutes": 180
                },
                {
                    "title": "Organize Closets",
                    "description": "Sort, donate, and organize all closets",
                    "recurrence": "none",
                    "room": "Bedroom",
                    "points": 35,
                    "estimated_minutes": 150
                }
            ]
        }
    ]
    
    await db.templates.insert_many(prebuilt_templates)