# Spreadsheet Reader

Aplikasi profesional untuk membaca, memfilter, dan mengelola data dari Google Spreadsheet dengan Next.js dan PostgreSQL. Sistem dirancang khusus untuk institusi ITERA dengan validasi domain @student.itera.ac.id dan production-ready untuk Vercel deployment.

## Fitur Utama

- ✅ **Google OAuth Authentication** - Login aman dengan Google Account
- ✅ **Domain Validation** - Hanya email @student.itera.ac.id yang diizinkan  
- ✅ **Spreadsheet Management** - Tambah, hapus, dan kelola multiple spreadsheet links
- ✅ **Smart Date Filtering** - Filter otomatis berdasarkan tanggal hari ini
- ✅ **Link History Tracking** - Track semua perubahan dan history link
- ✅ **Data Caching** - Cache data untuk performa optimal
- ✅ **Modern UI** - Responsive design, dark mode support, professional interface
- ✅ **Production-Ready** - Next.js 16, TypeScript, best practices, secure

## Tech Stack

### Frontend & Backend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js dengan Google OAuth
- **Database**: PostgreSQL dengan Vercel Postgres
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Deployment**: Vercel (zero-config)

### APIs
- **Google Sheets API** - Untuk read spreadsheet data
- **Google OAuth 2.0** - Untuk authentication

## Project Structure

\`\`\`
project-root/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/      # NextAuth konfigurasi
│   │   ├── db.ts                    # Database setup & initialization
│   │   ├── db-init/route.ts         # Manual DB init endpoint
│   │   ├── links/                   # Link management API routes
│   │   └── sheets/                  # Google Sheets fetch API
│   ├── login/page.tsx               # Login page
│   ├── page.tsx                     # Dashboard page (protected)
│   ├── layout.tsx                   # Root layout dengan SessionProvider
│   └── globals.css                  # Global styles & design tokens
│
├── components/
│   ├── dashboard.tsx                # Main dashboard component
│   ├── add-link-form.tsx           # Form untuk add spreadsheet
│   ├── links-list.tsx               # List semua spreadsheet user
│   ├── sheet-data-viewer.tsx       # Display data dari spreadsheet
│   ├── login-page.tsx               # Login UI
│   └── ui/                          # shadcn/ui components
│
├── middleware.ts                    # NextAuth middleware untuk route protection
├── .env.local                       # Local environment variables
├── .env.example                     # Environment template
├── docker-compose.yml               # Docker setup untuk development
├── Dockerfile                       # Container configuration
├── next.config.mjs                  # Next.js configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
├── SETUP_GUIDE.md                   # Detailed setup instructions
├── DEPLOYMENT.md                    # Production deployment guide
├── GOOGLE_OAUTH_SETUP.md           # Google OAuth configuration
├── VERCEL_DEPLOYMENT.md            # Step-by-step Vercel deployment
└── README.md                        # This file
\`\`\`

## Quick Start - Untuk Deploy ke Vercel

### Prerequisite
- GitHub repository dengan code ini
- Vercel account (gratis)
- Google Cloud project dengan OAuth credentials

### Langkah-langkah Deploy:

1. **Push ke GitHub**
\`\`\`bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
\`\`\`

2. **Deploy ke Vercel**
   - Buka https://vercel.com/dashboard
   - Klik "Add New" → "Project"
   - Select repository Anda
   - Vercel auto-detect Next.js
   - Klik "Deploy"

3. **Setup Environment Variables di Vercel**
   - Di Vercel dashboard, Settings → Environment Variables
   - Tambahkan semua variables dari `.env.example`
   - Lihat `VERCEL_DEPLOYMENT.md` untuk detail lengkap

4. **Setup Google OAuth**
   - Follow `GOOGLE_OAUTH_SETUP.md`
   - Update redirect URI ke `https://your-app.vercel.app/api/auth/callback/google`

5. **Setup PostgreSQL Database**
   - Di Vercel dashboard, "Storage" → "Create Postgres"
   - Copy connection string ke `POSTGRES_URL` environment variable
   - Database auto-initialize on first access

6. **Done!**
   - Visit `https://your-app.vercel.app`
   - Login dengan ITERA email
   - Mulai gunakan aplikasi

Lihat **VERCEL_DEPLOYMENT.md** untuk panduan lengkap step-by-step!

## Local Development

### Setup

\`\`\`bash
# Clone repository
git clone your-repo-url
cd project-directory

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan credentials

# Start database (optional, untuk production-like testing)
docker-compose up -d postgres

# Inisialisasi database (akan auto-run, atau manual)
curl http://localhost:3000/api/db-init
\`\`\`

### Run

\`\`\`bash
# Development server dengan auto-reload
npm run dev

# Buka browser ke http://localhost:3000
\`\`\`

### Build & Production Test

\`\`\`bash
# Build untuk production
npm run build

# Run production build locally
npm start
\`\`\`

## Database Schema

Otomatis diinisialisasi saat pertama kali app dijalankan.

### Users Table
\`\`\`sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### Spreadsheet Links Table
\`\`\`sql
CREATE TABLE spreadsheet_links (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    sheet_url VARCHAR(500) NOT NULL,
    sheet_name VARCHAR(255) NOT NULL,
    sheet_id VARCHAR(100),
    last_accessed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, sheet_url)
);
\`\`\`

### Sheet Data Cache Table
\`\`\`sql
CREATE TABLE sheet_data_cache (
    id SERIAL PRIMARY KEY,
    link_id INT NOT NULL REFERENCES spreadsheet_links(id),
    data JSONB NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);
\`\`\`

### Link History Table
\`\`\`sql
CREATE TABLE link_history (
    id SERIAL PRIMARY KEY,
    link_id INT NOT NULL REFERENCES spreadsheet_links(id),
    action VARCHAR(50),
    old_value VARCHAR(500),
    new_value VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## API Endpoints

### Authentication (Public)
- `POST /api/auth/signin` - Google sign in
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Links Management (Protected)
- `GET /api/links` - Get all user's spreadsheets
- `POST /api/links` - Add new spreadsheet link
- `DELETE /api/links/[id]/delete` - Delete a link

### Sheets Data (Protected)
- `POST /api/sheets/fetch` - Fetch data dari spreadsheet untuk hari ini

## Environment Variables

\`\`\`bash
# Google OAuth - Dari Google Cloud Console
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret

# Google Service Account - Untuk Sheets API
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_PRIVATE_KEY_ID=your_key_id
GOOGLE_PRIVATE_KEY="your_private_key"
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID_SA=service_account_client_id

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.vercel.app (production)
NEXTAUTH_SECRET=generated_secret (generate dengan: openssl rand -base64 32)

# Database - PostgreSQL
POSTGRES_URL=postgresql://user:password@host/dbname
\`\`\`

## Deployment Guides

- **VERCEL_DEPLOYMENT.md** - Complete step-by-step untuk deploy ke Vercel
- **DEPLOYMENT.md** - Advanced deployment options dan optimization
- **GOOGLE_OAUTH_SETUP.md** - Detailed Google OAuth setup
- **SETUP_GUIDE.md** - Local development setup

## Supported Date Formats

System otomatis memparsing berbagai format tanggal:

- ✅ `17/11/2025` (DD/MM/YYYY)
- ✅ `2025-11-17` (YYYY-MM-DD)
- ✅ `17 November 2025` (English)
- ✅ `Senin, 17 November 2025` (Indonesian)
- ✅ `17 Nov 2025`
- ✅ Dan format lainnya yang umum digunakan

## Troubleshooting

### "Email domain not allowed"
- Pastikan login dengan email @student.itera.ac.id
- Clear browser cookies dan login ulang

### "Failed to fetch sheet"
- Verify spreadsheet URL benar
- Check sheet name cocok dengan tab di spreadsheet
- Pastikan service account email sudah di-share ke spreadsheet

### Database connection error
- Verify `POSTGRES_URL` di environment variables
- Check database sudah berjalan
- Try reinitialize: `curl https://your-app.vercel.app/api/db-init`

### OAuth errors
- Verify redirect URI di Google Cloud Console cocok
- Check `NEXTAUTH_SECRET` dan `NEXTAUTH_URL` sudah set
- Clear browser cache dan cookies

Lihat dokumentasi files untuk troubleshooting detail.

## Performance & Security

### Performance
- Database queries dioptimasi dengan indexes
- Data dicache untuk mengurangi API calls
- NextAuth sessions dimanage efficiently
- Vercel edge network untuk fast response times

### Security
- Email domain validation (@student.itera.ac.id only)
- NextAuth middleware melindungi protected routes
- Database queries menggunakan parameterized queries
- HTTPS automatic di Vercel
- Secure session management dengan NextAuth
- Input validation di semua endpoints

## Support & Documentation

- Lihat file-file dokumentasi untuk setup detail
- Check GitHub issues untuk common problems
- Review error logs di Vercel dashboard untuk debugging

---

**Production-Ready untuk ITERA Students**

Buatan: v0 AI Assistant  
Last Updated: November 17, 2025  
Version: 2.0.0
