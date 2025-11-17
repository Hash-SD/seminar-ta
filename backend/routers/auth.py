"""
Authentication routes
"""

from fastapi import APIRouter, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
import secrets
from typing import Optional

from utils.google_oauth import GoogleOAuthHandler
from utils.session import SessionManager
from utils.database import Database
from config.settings import settings

router = APIRouter()
session_manager = SessionManager()
database = Database()

# Store states for CSRF protection
_states = {}

@router.get("/login")
async def login():
    """Initiate Google OAuth login"""
    state = secrets.token_urlsafe(32)
    _states[state] = True
    
    auth_url = GoogleOAuthHandler.get_authorization_url(state)
    return {"url": auth_url}

@router.get("/callback")
async def callback(code: str, state: str, response: Response):
    """Google OAuth callback"""
    
    # Verify state
    if state not in _states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter"
        )
    
    del _states[state]
    
    # Exchange code for token
    token_data = GoogleOAuthHandler.exchange_code_for_token(code)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange code for token"
        )
    
    # Get user info
    user_info = GoogleOAuthHandler.get_user_info(token_data.get("access_token"))
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user information"
        )
    
    # Validate email domain
    email = user_info.get("email", "")
    if not GoogleOAuthHandler.validate_email_domain(email):
        return RedirectResponse(url="/error?reason=invalid_domain", status_code=302)
    
    # Get or create user
    existing_user = database.fetch_one(
        "SELECT id FROM users WHERE email = ?",
        (email,)
    )
    
    if existing_user:
        user_id = existing_user["id"]
    else:
        # Create new user
        database.execute(
            """
            INSERT INTO users (email, name, picture, google_id)
            VALUES (?, ?, ?, ?)
            """,
            (
                email,
                user_info.get("name", ""),
                user_info.get("picture", ""),
                user_info.get("id", ""),
            )
        )
        
        user = database.fetch_one(
            "SELECT id FROM users WHERE email = ?",
            (email,)
        )
        user_id = user["id"]
    
    # Create session
    session_id = session_manager.create_session(
        user_id=user_id,
        user_email=email,
        access_token=token_data.get("access_token"),
        refresh_token=token_data.get("refresh_token"),
        expires_in=token_data.get("expires_in", 3600)
    )
    
    # Set session cookie
    response = RedirectResponse(url="/dashboard", status_code=302)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=settings.ENV == "production",
        samesite="Lax"
    )
    
    return response

@router.get("/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_id = request.cookies.get("session_id")
    
    if session_id:
        session_manager.delete_session(session_id)
    
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie("session_id")
    
    return response

@router.get("/me")
async def get_current_user(request: Request):
    """Get current user information"""
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
    
    user = database.fetch_one(
        "SELECT id, email, name, picture FROM users WHERE id = ?",
        (session["user_id"],)
    )
    
    return user
