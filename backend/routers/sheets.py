"""
Google Sheets data routes
"""

from fastapi import APIRouter, HTTPException, Request, status
from typing import List, Dict, Any
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import re
from datetime import datetime
from dateutil import parser as date_parser
import locale

from utils.session import SessionManager
from utils.database import Database
from config.settings import settings

router = APIRouter()
session_manager = SessionManager()
database = Database()

class DateNormalizer:
    """Normalize various date formats"""
    
    # Supported Indonesian month names
    INDONESIAN_MONTHS = {
        'januari': 1, 'februari': 2, 'maret': 3, 'april': 4,
        'mei': 5, 'juni': 6, 'juli': 7, 'agustus': 8,
        'september': 9, 'oktober': 10, 'november': 11, 'desember': 12,
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'mei': 5, 'jun': 6,
        'jul': 7, 'ags': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'des': 12,
    }
    
    INDONESIAN_DAYS = {
        'senin': 0, 'selasa': 1, 'rabu': 2, 'kamis': 3,
        'jumat': 4, 'sabtu': 5, 'minggu': 6,
        'sen': 0, 'sel': 1, 'rab': 2, 'kam': 3,
        'jum': 4, 'sab': 5, 'min': 6,
    }
    
    @staticmethod
    def parse_date(date_str: str) -> datetime:
        """
        Parse various date formats robustly
        Supports: 17/11/2025, 2025-11-17, 17 November 2025, Senin, 17 Nov 2025, etc.
        """
        if not date_str or not isinstance(date_str, str):
            return None
        
        date_str = date_str.strip().lower()
        
        try:
            # Try standard parsing first
            return datetime.strptime(date_str, "%d/%m/%Y").date()
        except ValueError:
            pass
        
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            pass
        
        # Handle Indonesian date formats
        # Format: "17 November 2025" or "17 Nov 2025"
        for month_name, month_num in DateNormalizer.INDONESIAN_MONTHS.items():
            if month_name in date_str:
                # Extract day and year
                parts = date_str.split()
                if len(parts) >= 3:
                    try:
                        day = int(parts[0])
                        year = int(parts[-1])
                        return datetime(year, month_num, day).date()
                    except (ValueError, IndexError):
                        pass
        
        # If string starts with day name, try to extract date part
        for day_name in DateNormalizer.INDONESIAN_DAYS.keys():
            if date_str.startswith(day_name):
                parts = date_str.split(',')
                if len(parts) > 1:
                    try:
                        return DateNormalizer.parse_date(parts[1].strip())
                    except:
                        pass
        
        # Last resort: use dateutil parser
        try:
            return date_parser.parse(date_str).date()
        except:
            return None

def extract_spreadsheet_id(url: str) -> str:
    """Extract spreadsheet ID from Google Sheets URL"""
    # Format: https://docs.google.com/spreadsheets/d/{id}/edit...
    match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', url)
    if match:
        return match.group(1)
    
    # If just ID is provided
    if re.match(r'^[a-zA-Z0-9-_]+$', url):
        return url
    
    raise ValueError("Invalid Google Sheets URL")

@router.post("/fetch")
async def fetch_sheet_data(
    request: Request,
    spreadsheet_link: str,
    sheet_name: str = "Sheet1"
):
    """
    Fetch and filter spreadsheet data by today's date
    """
    
    # Verify authentication
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
    
    try:
        # Extract spreadsheet ID
        spreadsheet_id = extract_spreadsheet_id(spreadsheet_link)
        
        # Note: For production, you'd need to set up Google Sheets API credentials
        # This is a simplified example showing the structure
        
        # TODO: Implement actual Google Sheets API call
        # For now, returning mock data structure
        
        today = datetime.now().date()
        
        return {
            "success": True,
            "spreadsheet_id": spreadsheet_id,
            "sheet_name": sheet_name,
            "today": str(today),
            "data": [],
            "message": "Spreadsheet integration requires proper Google API credentials"
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching sheet data: {str(e)}"
        )

@router.get("/test-date-parser")
async def test_date_parser(date_string: str):
    """Test date parser with various formats"""
    
    result = DateNormalizer.parse_date(date_string)
    
    return {
        "input": date_string,
        "parsed": str(result) if result else None,
        "is_today": result == datetime.now().date() if result else False
    }
