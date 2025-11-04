from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.models.user import UserCreate, UserLogin, UserResponse
from app.models.household import HouseholdResponse
from app.crud import user as user_crud
from app.crud import household as household_crud
from app.utils.security import hash_password, verify_password, create_access_token
from app.dependencies.auth import get_current_user
from bson import ObjectId
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Register a new user and create their household.
    
    Request body:
    - email: User's email address
    - password: User's password (min 8 characters)
    - name: User's display name
    - household_name: Name for the new household
    
    Returns:
    - user: User information
    - household: Household information
    - token: JWT access token
    """
    # Validate password length
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Check if email already exists
    if await user_crud.email_exists(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    password_hash = hash_password(user_data.password)
    
    # Create initial member for household
    member_id = f"member-{uuid.uuid4().hex[:8]}"
    initial_member = {
        "id": member_id,
        "name": user_data.name,
        "role": "manager",
        "avatar": "👤",
        "color": "#8B5CF6",
        "points": 0,
        "tasks_completed": 0
    }
    
    # Create household first (we need the ID for the user)
    household_doc = await household_crud.create_household(
        db,
        name=user_data.household_name,
        manager_id=ObjectId(),  # Temporary, will be updated
        initial_member=initial_member
    )
    
    household_id = household_doc["_id"]
    
    # Create user
    user_doc = await user_crud.create_user(
        db,
        email=user_data.email,
        password_hash=password_hash,
        name=user_data.name,
        household_id=household_id
    )
    
    user_id = user_doc["_id"]
    
    # Update household with correct manager_id
    await db.households.update_one(
        {"_id": household_id},
        {"$set": {"manager_id": user_id}}
    )
    household_doc["manager_id"] = user_id
    
    # Create JWT token
    token = create_access_token(data={"sub": str(user_id)})
    
    # Prepare response
    user_response = UserResponse(
        id=str(user_id),
        email=user_doc["email"],
        name=user_doc["name"],
        household_id=str(household_id),
        created_at=user_doc["created_at"],
        notification_preferences=user_doc.get("notification_preferences", {
            "email_enabled": True,
            "task_reminders": True,
            "weekly_digest": True,
            "overdue_alerts": True
        }),
        onboarding_completed=user_doc.get("onboarding_completed", False)
    )
    
    household_response = HouseholdResponse(
        id=str(household_id),
        name=household_doc["name"],
        manager_id=str(user_id),
        members=household_doc["members"],
        created_at=household_doc["created_at"]
    )
    
    logger.info(f"User signed up: {user_data.email}")
    
    return {
        "user": user_response,
        "household": household_response,
        "token": token
    }


@router.post("/login")
async def login(
    credentials: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Authenticate user and return JWT token.
    
    Request body:
    - email: User's email address
    - password: User's password
    
    Returns:
    - user: User information
    - household: Household information
    - token: JWT access token
    """
    # Get user by email
    user_doc = await user_crud.get_user_by_email(db, credentials.email)
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Get household
    household_doc = await household_crud.get_household_by_id(db, user_doc["household_id"])
    
    if not household_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Household not found"
        )
    
    # Create JWT token
    user_id = str(user_doc["_id"])
    token = create_access_token(data={"sub": user_id})
    
    # Prepare response
    user_response = UserResponse(
        id=user_id,
        email=user_doc["email"],
        name=user_doc["name"],
        household_id=str(user_doc["household_id"]),
        created_at=user_doc["created_at"],
        notification_preferences=user_doc.get("notification_preferences", {
            "email_enabled": True,
            "task_reminders": True,
            "weekly_digest": True,
            "overdue_alerts": True
        }),
        onboarding_completed=user_doc.get("onboarding_completed", False)
    )
    
    household_response = HouseholdResponse(
        id=str(household_doc["_id"]),
        name=household_doc["name"],
        manager_id=str(household_doc["manager_id"]),
        members=household_doc["members"],
        created_at=household_doc["created_at"]
    )
    
    logger.info(f"User logged in: {credentials.email}")
    
    return {
        "user": user_response,
        "household": household_response,
        "token": token
    }


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout endpoint (client-side token removal).
    
    Note: JWT tokens are stateless, so logout is handled client-side
    by removing the token from storage.
    """
    logger.info(f"User logged out: {current_user['email']}")
    
    return {
        "message": "Logged out successfully"
    }


@router.get("/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get current authenticated user's information.
    
    Returns:
    - user: User information
    - household: Household information
    """
    # Get household
    household_doc = await household_crud.get_household_by_id(db, current_user["household_id"])
    
    if not household_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Household not found"
        )
    
    # Prepare response
    user_response = UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        name=current_user["name"],
        household_id=str(current_user["household_id"]),
        created_at=current_user["created_at"],
        notification_preferences=current_user.get("notification_preferences", {
            "email_enabled": True,
            "task_reminders": True,
            "weekly_digest": True,
            "overdue_alerts": True
        }),
        onboarding_completed=current_user.get("onboarding_completed", False)
    )
    
    household_response = HouseholdResponse(
        id=str(household_doc["_id"]),
        name=household_doc["name"],
        manager_id=str(household_doc["manager_id"]),
        members=household_doc["members"],
        created_at=household_doc["created_at"]
    )
    
    return {
        "user": user_response,
        "household": household_response
    }


@router.put("/onboarding-status")
async def update_onboarding_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Mark onboarding as completed for the current user.
    
    Returns:
        Updated user information
    """
    try:
        # Update user's onboarding status
        result = await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"onboarding_completed": True}}
        )
        
        if result.modified_count == 0:
            logger.warning(f"Onboarding status not updated for user {current_user['_id']}")
        
        logger.info(f"Onboarding completed for user: {current_user['email']}")
        
        # Get updated user
        updated_user = await db.users.find_one({"_id": current_user["_id"]})
        
        return {
            "success": True,
            "message": "Onboarding status updated",
            "onboarding_completed": updated_user.get("onboarding_completed", True)
        }
        
    except Exception as e:
        logger.error(f"Error updating onboarding status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update onboarding status"
        )