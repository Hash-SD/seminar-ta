# Setup & Installation Guide

## For Development

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL 14+
- Google Cloud account

### Installation Steps

1. **Clone and Install**
\`\`\`bash
git clone your-repo-url
cd project-directory
npm install
\`\`\`

2. **Setup Google OAuth**
- Go to Google Cloud Console
- Create new project
- Create OAuth 2.0 credentials
- Set authorized redirect URI to `http://localhost:3000/api/auth/callback/google`
- Note your Client ID and Secret

3. **Setup Service Account**
- In Google Cloud Console, create Service Account
- Create and download JSON key
- Extract necessary values for `.env.local`

4. **Setup Database**
\`\`\`bash
# With Docker
docker-compose up -d postgres

# Or connect to existing PostgreSQL
# Update POSTGRES_URL in .env.local
\`\`\`

5. **Configure Environment**
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your credentials
\`\`\`

6. **Initialize Database**
\`\`\`bash
# Tables will be created automatically on first request
# Or run initialization:
npm run db:init
\`\`\`

7. **Start Development Server**
\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` in your browser.

## Usage Guide

### Adding a Spreadsheet

1. Click "Add New" tab in dashboard
2. Paste your Google Sheets URL
3. Enter the sheet name (tab name in spreadsheet)
4. Click "Add Spreadsheet"

### Viewing Data

1. Click "View Data" button next to a spreadsheet
2. The system will automatically fetch today's data
3. Data is filtered to show only rows with today's date
4. Click "Refresh" to get latest data

### Managing Links

1. All your spreadsheets appear in "My Spreadsheets"
2. Click "View Data" to see data
3. Click "Delete" to remove a spreadsheet

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in with Google
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Links Management
- `GET /api/links` - Get all user's spreadsheet links
- `POST /api/links` - Add new spreadsheet link
- `DELETE /api/links/[id]/delete` - Delete a link

### Sheets Data
- `POST /api/sheets/fetch` - Fetch data from spreadsheet

## Deployment to Vercel

See `DEPLOYMENT.md` for detailed instructions.

## Troubleshooting

### "Email domain not allowed"
- Ensure you're using @student.itera.ac.id email
- Check email is authorized in Google

### "Failed to fetch sheet"
- Verify spreadsheet URL is correct
- Ensure sheet tab name matches exactly
- Check service account email has access to spreadsheet

### Database errors
- Verify POSTGRES_URL is correct
- Check database is running
- Ensure network connectivity

### OAuth errors
- Clear browser cookies
- Verify callback URL matches Google settings
- Check NEXTAUTH_SECRET is set

## Support

For issues or questions:
1. Check logs: `npm run dev` shows console output
2. Verify all environment variables
3. Test Google API access separately
