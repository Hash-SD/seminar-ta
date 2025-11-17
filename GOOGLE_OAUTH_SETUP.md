# Google OAuth Setup Guide

## Create Google OAuth Credentials

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click project dropdown at top → "New Project"
3. Name: "Spreadsheet Reader"
4. Click "Create"

### Step 2: Enable APIs

1. In Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click it, then "Enable"
4. Search for "Google Drive API"
5. Click it, then "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Configure OAuth consent screen:
   - User Type: Internal
   - App name: Spreadsheet Reader
   - User support email: your-email@student.itera.ac.id
   - Developer contact: your-email@student.itera.ac.id
5. Add authorized redirect URI:
   - For local: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.vercel.app/api/auth/callback/google`
6. Click "Create"
7. Download JSON or copy credentials:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### Step 4: Create Service Account

Service Account is needed to read spreadsheets on behalf of the app.

1. In Cloud Console, go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Service account name: "sheets-reader"
4. Click "Create and Continue"
5. Grant roles: "Editor" (for testing), or specific "Sheets API User"
6. Click "Continue"
7. Go to service account page
8. Click "Keys" tab
9. Add Key → "Create new key" → JSON
10. Download the JSON file

Extract from the JSON file:
\`\`\`json
{
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "sheets-reader@YOUR_PROJECT.iam.gserviceaccount.com",
  "client_id": "YOUR_SERVICE_ACCOUNT_CLIENT_ID",
  ...
}
\`\`\`

## Environment Variables

Add to `.env.local`:

\`\`\`
GOOGLE_CLIENT_ID=<from OAuth credentials>
GOOGLE_CLIENT_SECRET=<from OAuth credentials>
GOOGLE_PROJECT_ID=<from service account JSON>
GOOGLE_PRIVATE_KEY_ID=<from service account JSON>
GOOGLE_PRIVATE_KEY=<from service account JSON - keep newlines>
GOOGLE_CLIENT_EMAIL=<from service account JSON>
GOOGLE_CLIENT_ID_SA=<from service account JSON client_id>
\`\`\`

## Share Spreadsheet with Service Account

For the app to read your spreadsheet:

1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email: `sheets-reader@your-project.iam.gserviceaccount.com`
4. Give "Viewer" permission
5. Uncheck "Notify people"
6. Click "Share"

Now the app can read this spreadsheet!

## Verify Setup

1. Add environment variables to `.env.local`
2. Start the app: `npm run dev`
3. Go to login page
4. Click "Sign in with Google"
5. Authorize with your ITERA email
6. Add a spreadsheet URL
7. Click "View Data"

If data loads, Google OAuth is working!

## Troubleshooting

### "Invalid Client" error
- Check `GOOGLE_CLIENT_ID` is correct
- Verify redirect URI matches exactly

### "Access Denied" on Sheets
- Ensure spreadsheet is shared with service account email
- Check service account has Sheets API access

### Date parsing not working
- Verify sheet has date column
- Check date format matches Indonesian format
