"""
Session management for user authentication
"""

import secrets
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

class SessionManager:
    """Manage user sessions"""
    
    # In-memory session store (replace with Redis for production)
    _sessions: Dict[str, Dict] = {}
    
    def create_session(
        self,
        user_id: int,
        user_email: str,
        access_token: str,
        refresh_token: Optional[str] = None,
        expires_in: int = 3600
    ) -> str:
        """Create new session"""
        session_id = secrets.token_urlsafe(32)
        
        self._sessions[session_id] = {
            "user_id": user_id,
            "email": user_email,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(seconds=expires_in),
        }
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        if session_id not in self._sessions:
            return None
        
        session = self._sessions[session_id]
        
        # Check if session expired
        if datetime.utcnow() > session["expires_at"]:
            del self._sessions[session_id]
            return None
        
        return session
    
    def delete_session(self, session_id: str) -> bool:
        """Delete session"""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False
    
    def validate_session(self, session_id: str) -> bool:
        """Validate session"""
        return self.get_session(session_id) is not None
