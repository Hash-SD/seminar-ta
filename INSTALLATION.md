# Installation Guide - Spreadsheet Data Reader

Panduan lengkap untuk setup aplikasi di local machine.

## Prerequisites

Pastikan Anda memiliki:
- Python 3.8 atau lebih tinggi
- pip (usually comes with Python)
- Text editor atau IDE (VS Code recommended)
- Web browser modern
- Internet connection

## Verifikasi Prerequisites

\`\`\`bash
# Check Python version
python --version
# Expected: Python 3.8.0 atau lebih tinggi

# Check pip
pip --version
# Expected: pip 20.0 atau lebih tinggi
\`\`\`

## Step 1: Download Project Files

### Option A: Clone from Git (Jika project di Git)
\`\`\`bash
git clone <repository-url>
cd spreadsheet-reader
\`\`\`

### Option B: Manual Download
\`\`\`bash
# Extract zip file ke folder lokal Anda
# Navigate ke project folder
cd spreadsheet-reader
\`\`\`

## Step 2: Setup Backend

### 2.1 Navigate to Backend Directory
\`\`\`bash
cd backend
\`\`\`

### 2.2 Create Virtual Environment
\`\`\`bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
\`\`\`

Anda akan melihat `(venv)` di terminal jika berhasil.

### 2.3 Install Dependencies
\`\`\`bash
pip install -r requirements.txt
\`\`\`

Tunggu sampai semua packages terinstall (ini bisa memakan waktu 2-5 menit).

### 2.4 Setup Environment Variables

\`\`\`bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
\`\`\`

Edit file `.env` dengan text editor:

\`\`\`env
# App Settings
ENV=development
PORT=8000
HOST=0.0.0.0

# Database
DATABASE_URL=sqlite:///spreadsheet_reader.db

# Google OAuth (Will setup in next step)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/callback

# Google Sheets API
GOOGLE_SHEETS_API_KEY=your_api_key_here

# Session
SESSION_SECRET_KEY=your-super-secret-key-12345
SESSION_TIMEOUT_MINUTES=30

# Frontend
FRONTEND_URL=http://localhost:8080
\`\`\`

## Step 3: Setup Google OAuth

Ikuti panduan di `OAUTH_SETUP.md` untuk:
1. Membuat Google Cloud Project
2. Enable Sheets API
3. Setup OAuth Consent Screen
4. Create OAuth 2.0 Credentials
5. Copy credentials ke `.env`

⚠️ **PENTING**: Jangan skip step ini! Aplikasi tidak akan bekerja tanpa Google OAuth setup.

## Step 4: Initialize Database

\`\`\`bash
# Backend harus dalam virtual environment
cd backend
python -c "from utils.database import Database; db = Database(); db.init_db()"
\`\`\`

Ini akan membuat file `spreadsheet_reader.db` dengan schema yang benar.

## Step 5: Run Backend Server

\`\`\`bash
# Pastikan masih di backend directory dan venv active
python app.py
\`\`\`

Anda akan melihat output seperti:
\`\`\`
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Database initialized successfully
\`\`\`

Biarkan server berjalan di terminal ini. Buka terminal baru untuk frontend setup.

## Step 6: Setup Frontend

Di terminal BARU:

\`\`\`bash
# Navigate ke frontend directory
cd frontend

# Option A: Simple file serving
python -m http.server 8080

# Anda akan melihat:
# Serving HTTP on 0.0.0.0 port 8080 ...
\`\`\`

Atau gunakan VS Code Live Server:
- Install extension "Live Server"
- Right-click di `index.html`
- Select "Open with Live Server"

## Step 7: Access Application

Buka web browser dan navigasi ke:
- **Frontend**: http://localhost:8080
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/api/health

## Step 8: First Time Login

1. Di halaman landing, klik "Login dengan Google"
2. Pilih akun Google dengan email @student.itera.ac.id
3. Jika berhasil, akan redirect ke dashboard
4. Jika email bukan @student.itera.ac.id, akan error

## Verification Checklist

Pastikan semua berjalan dengan benar:

- ✅ Backend server running di port 8000
- ✅ Frontend server running di port 8080 (atau file accessible)
- ✅ Bisa akses http://localhost:8000/api/health (returns {"status": "healthy"})
- ✅ Bisa akses http://localhost:8080 (landing page loads)
- ✅ Google OAuth credentials sudah di `.env`
- ✅ Database file `spreadsheet_reader.db` exists di backend folder

## Troubleshooting Installation

### Problem: Python command not found
**Solution**: 
- Pastikan Python sudah diinstall
- Restart terminal setelah install
- Gunakan `python3` jika `python` tidak work

### Problem: pip install gagal
**Solution**:
\`\`\`bash
# Upgrade pip
python -m pip install --upgrade pip

# Install packages satu per satu untuk identify issue
pip install fastapi
pip install uvicorn
# ... dst
\`\`\`

### Problem: Virtual environment tidak activate
**Solution**:
\`\`\`bash
# Windows - try full path
C:\path\to\venv\Scripts\activate.bat

# macOS/Linux - check script exists
ls venv/bin/activate
# If not exist, recreate venv
rm -rf venv
python3 -m venv venv
source venv/bin/activate
\`\`\`

### Problem: Port 8000 atau 8080 already in use
**Solution**:
\`\`\`bash
# Find process using port 8000
lsof -i :8000

# Kill process (macOS/Linux)
kill -9 <PID>

# Windows - use Resource Monitor to kill process
# Or change port in .env and code
\`\`\`

### Problem: CORS error di browser
**Solution**:
- Pastikan backend running
- Check `FRONTEND_URL` di backend `.env`
- Frontend harus bisa akses http://localhost:8000
- Check browser console untuk exact error

### Problem: Database locked error
**Solution**:
\`\`\`bash
# Close all Python processes
# Delete database file if development
rm spreadsheet_reader.db

# Reinitialize
python -c "from utils.database import Database; db = Database(); db.init_db()"

# Restart backend
python app.py
\`\`\`

## Next Steps

1. **Setup Google OAuth** - Follow `OAUTH_SETUP.md`
2. **Test Application** - Add a spreadsheet link and verify it works
3. **Read Documentation** - Check `README.md` untuk feature details
4. **Deploy** - Follow `DEPLOYMENT.md` untuk deploy ke production

## Getting Help

1. Check browser console (F12) untuk JavaScript errors
2. Check backend terminal untuk Python errors
3. Verify `.env` file memiliki correct credentials
4. Restart backend dan frontend server
5. Clear browser cache (Ctrl+Shift+Delete)

---

**Installation Complete!** 🎉

Anda sekarang siap menggunakan Spreadsheet Data Reader.

Last Updated: November 17, 2025
