# Deploy to Vercel - Step by Step

## Prerequisites
- GitHub account with your code pushed
- Vercel account (free tier works)
- Google Cloud project with credentials
- PostgreSQL database

## Step 1: Prepare Your Code

1. Create `.env.production.local` in your project:
\`\`\`
# This won't be committed, just for local testing
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate_with_openssl_rand_-base64_32
\`\`\`

2. Push code to GitHub:
\`\`\`bash
git add .
git commit -m "Ready for deployment"
git push origin main
\`\`\`

## Step 2: Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Select your GitHub repository
4. Click "Import"

## Step 3: Configure Environment Variables in Vercel

In Vercel dashboard, go to Settings → Environment Variables and add:

\`\`\`
GOOGLE_CLIENT_ID=<your_oauth_client_id>
GOOGLE_CLIENT_SECRET=<your_oauth_client_secret>
GOOGLE_PROJECT_ID=<your_project_id>
GOOGLE_PRIVATE_KEY_ID=<your_private_key_id>
GOOGLE_PRIVATE_KEY=<your_private_key>
GOOGLE_CLIENT_EMAIL=<your_service_account_email>
GOOGLE_CLIENT_ID_SA=<your_service_account_client_id>
NEXTAUTH_URL=https://<your-app>.vercel.app
NEXTAUTH_SECRET=<generated_secret>
POSTGRES_URL=<your_postgres_connection_string>
\`\`\`

### How to get POSTGRES_URL

1. In Vercel Dashboard, go to "Databases"
2. Click "Create Database" → "PostgreSQL"
3. Name it "sheets-reader"
4. After creation, copy the connection string from "Connection Details"
5. Paste as POSTGRES_URL

## Step 4: Deploy

1. After adding all env vars, click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Vercel will give you a URL like `https://your-app.vercel.app`

## Step 5: Update Google OAuth

1. Go to Google Cloud Console
2. Go to APIs & Services → Credentials
3. Edit OAuth 2.0 Client
4. Update "Authorized Redirect URIs":
   - Add: `https://your-app.vercel.app/api/auth/callback/google`
5. Save changes

## Step 6: Initialize Database

1. Visit your deployed app
2. It will automatically initialize database tables on first access
3. Or manually: `https://your-app.vercel.app/api/db-init`

## Step 7: Test

1. Go to your app URL
2. Click "Sign in with Google"
3. Authorize with your ITERA email
4. You should be redirected to dashboard

If you get an error, check:
- Vercel deployment logs: go to Deployments → View Logs
- Environment variables are all set
- PostgreSQL connection is working
- Google OAuth credentials are correct

## Continuous Deployment

After initial setup:
1. Push changes to GitHub: `git push origin main`
2. Vercel automatically builds and deploys
3. No additional steps needed!

## Monitoring

In Vercel Dashboard:
- **Deployments**: See all builds and rollback if needed
- **Analytics**: Monitor usage and performance
- **Logs**: Debug any issues
- **Settings**: Update env vars anytime

## Troubleshooting

### "Deployment failed"
- Check build logs in Deployments
- Verify all dependencies are installed
- Ensure package.json is correct

### "Database connection error in production"
- Verify POSTGRES_URL in Environment Variables
- Check PostgreSQL database is running
- Try reinitializing: visit `/api/db-init`

### "OAuth not working"
- Check redirect URI matches exactly
- Verify credentials are correct
- Check NEXTAUTH_SECRET and NEXTAUTH_URL are set

### "502 Bad Gateway"
- Check server logs
- Verify all environment variables
- Database might be down
\`\`\`
