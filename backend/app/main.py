from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import connect_to_mongodb, close_mongodb_connection, get_database
from app.routers import auth, scheduler, notifications, household, tasks, equilibrium, sync, templates, notes, badges
from app.services import initialize_scheduler, shutdown_scheduler, register_all_handlers

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("Starting FamilyFlow Backend...")
    
    # Validate settings
    settings.validate_required_settings()
    
    # Connect to MongoDB
    await connect_to_mongodb()
    
    # Initialize scheduler
    db = get_database()
    scheduler = await initialize_scheduler(db)
    
    # Register task handlers
    register_all_handlers(scheduler)
    
    # Create default scheduled task for data backup (if not exists)
    try:
        await scheduler.add_task(
            task_name="Monthly Data Backup",
            task_type="data_backup",
            interval_days=30,
            enabled=True,
            metadata={"description": "Automatic monthly data backup"}
        )
    except Exception as e:
        logger.info(f"Default backup task may already exist: {e}")
    
    logger.info("FamilyFlow Backend started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down FamilyFlow Backend...")
    
    # Shutdown scheduler
    await shutdown_scheduler()
    
    # Close database connection
    await close_mongodb_connection()
    
    logger.info("FamilyFlow Backend shut down successfully")


# Create FastAPI app
app = FastAPI(
    title="FamilyFlow API",
    description="Backend API for FamilyFlow household management application",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(scheduler.router)
app.include_router(notifications.router)
app.include_router(household.router)
app.include_router(tasks.router)
app.include_router(equilibrium.router)
app.include_router(sync.router)
app.include_router(templates.router)
app.include_router(notes.router)
app.include_router(badges.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "FamilyFlow API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    from app.database import ping_database
    from app.services import get_scheduler
    
    db_healthy = await ping_database()
    
    try:
        scheduler = get_scheduler()
        scheduler_status = scheduler.get_scheduler_status()
    except Exception as e:
        scheduler_status = {"error": str(e)}
    
    return {
        "status": "healthy" if db_healthy else "unhealthy",
        "database": "connected" if db_healthy else "disconnected",
        "scheduler": scheduler_status
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.app_env == "development"
    )