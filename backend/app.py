"""
Main FastAPI Application
Spreadsheet Data Reader with Google OAuth Authentication
"""

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv
import logging

# Import routers and utilities
from routers.auth import router as auth_router
from routers.sheets import router as sheets_router
from routers.links import router as links_router
from utils.session import SessionManager
from utils.database import Database

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Spreadsheet Data Reader",
    description="Professional system untuk membaca dan memproses Google Sheets data",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
session_manager = SessionManager()
database = Database()

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup"""
    try:
        database.init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(sheets_router, prefix="/api/sheets", tags=["Sheets"])
app.include_router(links_router, prefix="/api/links", tags=["Links"])

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Spreadsheet Data Reader",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint - redirect to frontend"""
    return {
        "message": "Spreadsheet Data Reader API",
        "docs": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "development") == "development"
    )
