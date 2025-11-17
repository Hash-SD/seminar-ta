"""
Google OAuth utilities
"""

import requests
import json
from typing import Optional, Dict, Tuple
from config.settings import settings

class GoogleOAuthHandler:
    """Handle Google OAuth authentication"""
    
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo"
    
    @staticmethod
    def get_authorization_url(state: str) -> str:
        """Get Google authorization URL"""
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile https://www.googleapis.com/auth/spreadsheets.readonly",
            "state": state,
            "access_type": "offline",
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{GoogleOAuthHandler.GOOGLE_AUTH_URL}?{query_string}"
    
    @staticmethod
    def exchange_code_for_token(code: str) -> Optional[Dict]:
        """Exchange authorization code for access token"""
        try:
            data = {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            }
            
            response = requests.post(GoogleOAuthHandler.GOOGLE_TOKEN_URL, data=data)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error exchanging code for token: {e}")
            return None
    
    @staticmethod
    def get_user_info(access_token: str) -> Optional[Dict]:
        """Get user information from access token"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(GoogleOAuthHandler.GOOGLE_USERINFO_URL, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error getting user info: {e}")
            return None
    
    @staticmethod
    def validate_email_domain(email: str) -> bool:
        """Validate if email belongs to allowed domain"""
        if "@" not in email:
            return False
        domain = email.split("@")[1]
        return domain == settings.ALLOWED_EMAIL_DOMAIN
