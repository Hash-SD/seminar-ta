import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Helper to create a Sheets client using User Tokens (Delegation)
export const getUserGoogleSheetsClient = (accessToken?: string, refreshToken?: string) => {
  const clientId = process.env.NEXTAUTH_GOOGLE_ID;
  const clientSecret = process.env.NEXTAUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    console.error('FATAL: Google OAuth Credentials (ID/Secret) are missing in .env');
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

// Deprecated: Old Service Account implementation (kept for reference if needed, but unused)
export const getGoogleSheetsClient = () => {
    // Redirect to new implementation with null tokens (will fail safely) or remove entirely.
    // For now, let's just rely on the new function.
    return null;
};

export const extractSpreadsheetId = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};
