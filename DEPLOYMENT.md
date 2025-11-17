# Deployment Guide

Panduan untuk deploy Spreadsheet Data Reader ke production.

## Deployment Approaches

### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended
**Pros**: Easy setup, good free tier, automatic deployments
**Cons**: Limited free tier

### Option 2: Heroku (Full Stack)
**Pros**: Traditional, well-documented, free tier
**Cons**: Free tier sulit di-maintain, discontinued

### Option 3: DigitalOcean / AWS / Linode (Self-hosted)
**Pros**: Full control, scalable
**Cons**: Requires Linux/DevOps knowledge

Mari kita implement Option 1 (Recommended).

## Option 1: Vercel (Frontend) + Railway (Backend)

### Part A: Deploy Backend to Railway

#### A.1 Prepare Backend

\`\`\`bash
# Di backend folder, pastikan ada requirements.txt
pip freeze > requirements.txt

# Tambah Procfile di backend root
echo "web: uvicorn app:app --host 0.0.0.0 --port \$PORT" > Procfile

# Pastikan .env tidak di-commit ke Git
echo ".env" > .gitignore
\`\`\`

#### A.2 Deploy to Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up dengan GitHub account

2. **Create New Project**
   - Klik "Start New Project"
   - Select "Deploy from Git"
   - Authorize GitHub
   - Select repository

3. **Configure Environment**
   - Klik project
   - Go to "Variables"
   - Add dari `.env`:
     \`\`\`
     GOOGLE_CLIENT_ID=xxx
     GOOGLE_CLIENT_SECRET=xxx
     GOOGLE_REDIRECT_URI=https://yourdomain.railway.app/api/auth/callback
     DATABASE_URL=sqlite:///spreadsheet_reader.db
     SESSION_SECRET_KEY=your-production-secret
     FRONTEND_URL=https://yourdomain.vercel.app
     \`\`\`

4. **Deploy**
   - Klik "Deploy"
   - Railway otomatis build dan deploy
   - Tunggu sampai "Deployed" status

5. **Get Backend URL**
   - Di Railway dashboard, copy URL endpoint
   - Contoh: `https://yourdomain.railway.app`

### Part B: Deploy Frontend to Vercel

#### B.1 Prepare Frontend

\`\`\`bash
# Create vercel.json di root folder
cat > vercel.json << 'EOF'
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF

# Create .env.production
cat > frontend/.env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://yourdomain.railway.app
EOF
\`\`\`

Update `frontend/assets/api.js`:
\`\`\`javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        // ... rest of class
    }
}
\`\`\`

#### B.2 Deploy to Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up dengan GitHub account

2. **Import Project**
   - Klik "Add New"
   - Select "Project"
   - Select repository
   - Select "frontend" folder di "Root Directory"

3. **Configure**
   - Go to "Settings" > "Environment Variables"
   - Add:
     \`\`\`
     NEXT_PUBLIC_API_URL=https://yourdomain.railway.app
     \`\`\`

4. **Deploy**
   - Klik "Deploy"
   - Vercel otomatis build dan deploy
   - Tunggu sampai selesai

5. **Get Frontend URL**
   - Dari Vercel dashboard, copy domain
   - Contoh: `https://yourdomain.vercel.app`

### Part C: Update OAuth Credentials

Kembali ke Google Cloud Console dan update:

1. **Redirect URI**:
   \`\`\`
   https://yourdomain.railway.app/api/auth/callback
   \`\`\`

2. **Authorized Origins**:
   \`\`\`
   https://yourdomain.vercel.app
   https://yourdomain.railway.app
   \`\`\`

3. Update `.env` di Railway dengan:
   \`\`\`
   GOOGLE_REDIRECT_URI=https://yourdomain.railway.app/api/auth/callback
   FRONTEND_URL=https://yourdomain.vercel.app
   \`\`\`

## Post-Deployment Checklist

- ✅ Backend running (check `/api/health`)
- ✅ Frontend loads
- ✅ OAuth login works
- ✅ Can add spreadsheet link
- ✅ Can fetch data
- ✅ Database persists data
- ✅ Email validation working

## Monitoring & Maintenance

### Monitor Logs

**Railway Backend Logs:**
\`\`\`bash
# Via Railway dashboard
- Project > Logs tab
- Or: railway logs

# Via CLI
railway logs -t web
\`\`\`

**Vercel Frontend:**
- Vercel dashboard > Deployments > View logs

### Database Backup

For SQLite in production, backup database:

\`\`\`bash
# Railway shell
railway shell

# Inside shell
# Copy database file locally
\`\`\`

## Performance Optimization

### Backend Optimization
1. Add Redis caching
2. Implement database connection pooling
3. Add API rate limiting
4. Optimize queries with indexes

### Frontend Optimization
1. Minify CSS/JS
2. Compress images
3. Implement lazy loading
4. Cache API responses

### Database Optimization
1. Add indexes to frequently queried columns
2. Archive old data
3. Regular backups

## Scaling Considerations

For production with high traffic:

1. **Database**: Migrate dari SQLite ke PostgreSQL
   \`\`\`python
   # Update DATABASE_URL
   DATABASE_URL=postgresql://user:password@host:5432/db
   \`\`\`

2. **Session Storage**: Use Redis instead of in-memory
3. **API Caching**: Implement Redis caching layer
4. **Load Balancing**: Use multiple backend instances

## SSL/HTTPS

- Vercel otomatis provide HTTPS
- Railway otomatis provide HTTPS
- Update `.env` untuk HTTPS URLs

## Custom Domain (Optional)

### For Frontend (Vercel)
1. Go to Vercel project > Domains
2. Add custom domain
3. Update DNS records per Vercel instructions

### For Backend (Railway)
1. Go to Railway project > Settings
2. Add custom domain
3. Update DNS records

## Rollback Procedure

If deployment breaks:

**Railway**:
1. Go to Deployments
2. Select previous deployment
3. Click "Redeploy"

**Vercel**:
1. Go to Deployments
2. Click on previous deployment
3. Click "Redeploy"

## Common Issues

### Database Connection Issues
- Check DATABASE_URL in environment
- Verify database credentials
- Check firewall rules

### CORS Errors
- Verify FRONTEND_URL and allowed origins
- Check credentials setup in Google Cloud

### OAuth Redirect Loop
- Verify GOOGLE_REDIRECT_URI matches exactly
- Check callback route in backend
- Clear browser cookies

### Slow Performance
- Check backend logs for slow queries
- Enable caching
- Scale up resources

## Getting Help

1. Check provider documentation
2. Review logs
3. Test locally
4. Contact provider support

---

**Deployment Complete!** 🚀

Your application is now live in production!

Last Updated: November 17, 2025
