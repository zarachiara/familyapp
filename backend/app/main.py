from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import connect_to_mongodb, close_mongodb_connection, ping_database
from app.routers import auth

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("Starting FamilyFlow backend...")
    
    # Validate settings
    try:
        settings.validate_required_settings()
        logger.info("Configuration validated successfully")
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise
    
    # Connect to MongoDB
    await connect_to_mongodb()
    
    yield
    
    # Shutdown
    logger.info("Shutting down FamilyFlow backend...")
    await close_mongodb_connection()


# Create FastAPI application
app = FastAPI(
    title="FamilyFlow API",
    description="Backend API for FamilyFlow household task management",
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

logger.info(f"CORS enabled for origins: {settings.cors_origins_list}")

# Include routers
app.include_router(auth.router)


@app.get("/healthz")
async def health_check():
    """Health check endpoint that verifies database connectivity."""
    db_connected = await ping_database()
    
    if db_connected:
        return {
            "status": "ok",
            "database": "connected"
        }
    else:
        return {
            "status": "error",
            "database": "disconnected"
        }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "FamilyFlow API",
        "version": "1.0.0",
        "docs": "/docs"
    }