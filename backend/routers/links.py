"""
Spreadsheet links management routes
"""

from fastapi import APIRouter, HTTPException, Request, status
from typing import List, Dict, Any
from datetime import datetime
import json

from utils.session import SessionManager
from utils.database import Database

router = APIRouter()
session_manager = SessionManager()
database = Database()

def get_current_user_id(request: Request) -> int:
    """Get current user ID from session"""
    session_id = request.cookies.get("session_id")
    
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
    
    return session["user_id"]

@router.post("/add")
async def add_spreadsheet_link(
    request: Request,
    spreadsheet_link: str,
    sheet_name: str = "Sheet1",
    name: str = ""
):
    """Add new spreadsheet link"""
    
    user_id = get_current_user_id(request)
    
    try:
        # Extract spreadsheet ID
        from routers.sheets import extract_spreadsheet_id
        spreadsheet_id = extract_spreadsheet_id(spreadsheet_link)
        
        # Check if link already exists
        existing = database.fetch_one(
            """
            SELECT id FROM spreadsheet_links
            WHERE user_id = ? AND spreadsheet_id = ? AND sheet_name = ?
            """,
            (user_id, spreadsheet_id, sheet_name)
        )
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This spreadsheet link already exists"
            )
        
        # Add link
        database.execute(
            """
            INSERT INTO spreadsheet_links
            (user_id, spreadsheet_id, spreadsheet_name, sheet_name, link)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, spreadsheet_id, name or sheet_name, sheet_name, spreadsheet_link)
        )
        
        # Get the newly created link
        link = database.fetch_one(
            """
            SELECT * FROM spreadsheet_links
            WHERE user_id = ? AND spreadsheet_id = ? AND sheet_name = ?
            ORDER BY created_at DESC LIMIT 1
            """,
            (user_id, spreadsheet_id, sheet_name)
        )
        
        return {
            "success": True,
            "link": link,
            "message": "Spreadsheet link added successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding link: {str(e)}"
        )

@router.get("/list")
async def list_spreadsheet_links(request: Request):
    """List all spreadsheet links for current user"""
    
    user_id = get_current_user_id(request)
    
    try:
        links = database.fetch_all(
            """
            SELECT * FROM spreadsheet_links
            WHERE user_id = ? AND is_active = 1
            ORDER BY updated_at DESC
            """,
            (user_id,)
        )
        
        return {
            "success": True,
            "links": links,
            "count": len(links)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing links: {str(e)}"
        )

@router.delete("/delete/{link_id}")
async def delete_spreadsheet_link(request: Request, link_id: int):
    """Delete spreadsheet link"""
    
    user_id = get_current_user_id(request)
    
    try:
        # Verify ownership
        link = database.fetch_one(
            "SELECT * FROM spreadsheet_links WHERE id = ? AND user_id = ?",
            (link_id, user_id)
        )
        
        if not link:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Link not found"
            )
        
        # Soft delete
        database.execute(
            "UPDATE spreadsheet_links SET is_active = 0 WHERE id = ?",
            (link_id,)
        )
        
        # Record in history
        database.execute(
            """
            INSERT INTO link_history (link_id, action, old_value, new_value)
            VALUES (?, ?, ?, ?)
            """,
            (link_id, "deleted", link["link"], None)
        )
        
        return {
            "success": True,
            "message": "Link deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting link: {str(e)}"
        )

@router.get("/history/{link_id}")
async def get_link_history(request: Request, link_id: int):
    """Get history of changes for a link"""
    
    user_id = get_current_user_id(request)
    
    try:
        # Verify ownership
        link = database.fetch_one(
            "SELECT * FROM spreadsheet_links WHERE id = ? AND user_id = ?",
            (link_id, user_id)
        )
        
        if not link:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Link not found"
            )
        
        history = database.fetch_all(
            """
            SELECT * FROM link_history
            WHERE link_id = ?
            ORDER BY timestamp DESC
            """,
            (link_id,)
        )
        
        return {
            "success": True,
            "link_id": link_id,
            "history": history
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching history: {str(e)}"
        )
