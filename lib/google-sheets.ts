import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Helper to create a Sheets client using User Tokens (Delegation)
export const getUserGoogleSheetsClient = (accessToken?: string, refreshToken?: string) => {
  // Support both naming conventions
  const clientId = process.env.NEXTAUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.NEXTAUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('FATAL: Google OAuth Credentials missing. Check .env for GOOGLE_CLIENT_ID / NEXTAUTH_GOOGLE_ID');
    return null;
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);

  // Scenario 1: Refresh Token available (e.g., Cron Job / Background process)
  // The googleapis library will automatically swap refresh_token for a new access_token
  if (refreshToken) {
    auth.setCredentials({ refresh_token: refreshToken });
  }
  // Scenario 2: Access Token available (e.g., active user session)
  else if (accessToken) {
    auth.setCredentials({ access_token: accessToken });
  } else {
    console.error('Failed to create client: No token provided');
    return null;
  }

  return google.sheets({ version: 'v4', auth });
};

export const extractSpreadsheetId = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};
