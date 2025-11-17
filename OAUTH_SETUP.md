# Google OAuth Setup Guide

Panduan lengkap untuk setup Google OAuth 2.0 credentials.

## Overview

Aplikasi ini menggunakan Google OAuth 2.0 untuk autentikasi. Prosesnya terdiri dari:
1. Membuat Google Cloud Project
2. Enable Google Sheets API
3. Setup OAuth Consent Screen
4. Create OAuth 2.0 Credentials
5. Konfigurasi .env file

## Step 1: Buat Google Cloud Project

### 1.1 Go to Google Cloud Console
- Buka https://console.cloud.google.com/
- Sign in dengan akun Google Anda (preferably admin account)

### 1.2 Create New Project
- Klik dropdown di top bar yang menunjukkan "Select a project"
- Klik "NEW PROJECT"
- Nama project: `Spreadsheet Reader`
- Click "CREATE"
- Tunggu project dibuat (biasanya < 1 menit)

### 1.3 Select Project
- Klik dropdown di top bar
- Pilih project `Spreadsheet Reader` dari list

Anda sekarang di project dashboard.

## Step 2: Enable Google Sheets API

### 2.1 Open APIs & Services Library
Di sidebar, cari dan klik "APIs & Services" > "Library"

### 2.2 Search for Sheets API
- Di search box, ketik: `google sheets api`
- Dari list hasil, klik `Google Sheets API`

### 2.3 Enable the API
- Klik tombol "ENABLE" (berwarna biru)
- Wait for confirmation

## Step 3: Setup OAuth Consent Screen

### 3.1 Go to OAuth Consent Screen
- Di sidebar, klik "APIs & Services" > "OAuth consent screen"

### 3.2 Choose User Type
- Pilih "External"
- Klik "CREATE"

### 3.3 Fill OAuth Consent Screen Form

**App Information:**
- App name: `Spreadsheet Data Reader`
- User support email: Gunakan email Anda
- Developer contact information: Gunakan email Anda

**App Scopes:**
Klik "ADD OR REMOVE SCOPES"
- Search: `spreadsheets`
- Check: `https://www.googleapis.com/auth/spreadsheets.readonly`
- Juga add: `https://www.googleapis.com/auth/userinfo.email`
- Juga add: `https://www.googleapis.com/auth/userinfo.profile`
- Klik "UPDATE"

Scroll down dan klik "SAVE AND CONTINUE"

### 3.4 Add Test Users (untuk development)
- Klik "ADD USERS" atau tab "Test users"
- Tambah akun Google Anda (yang punya email @student.itera.ac.id)
- Klik "ADD"
- Klik "SAVE AND CONTINUE"

## Step 4: Create OAuth 2.0 Credentials

### 4.1 Go to Credentials Page
- Di sidebar, klik "APIs & Services" > "Credentials"

### 4.2 Create OAuth Client ID
- Klik "+ CREATE CREDENTIALS" di top
- Pilih "OAuth client ID"
- Jika diminta, klik "CONFIGURE OAUTH CONSENT SCREEN" dulu (sudah done di step 3)

### 4.3 Configure OAuth Client

**Application type:**
- Pilih "Web application"

**Name:**
- Masukkan: `Spreadsheet Reader - Web Client`

**Authorized redirect URIs:**
- Klik "ADD URI"
- Masukkan: `http://localhost:8000/api/auth/callback`
- Untuk production, tambah: `https://yourdomain.com/api/auth/callback`

**Authorized JavaScript origins:**
- Klik "ADD URI"
- Masukkan: `http://localhost:8000`
- Masukkan: `http://localhost:8080`
- Untuk production, tambah domain Anda

Klik "CREATE"

### 4.4 Save Your Credentials

**PENTING**: Jangan share credentials ini!

Anda akan melihat popup dengan:
- **Client ID**: Contoh: `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: Contoh: `GOCSPX-1234567890_`

Copy kedua nilai ini.

## Step 5: Update .env File

Buka file `backend/.env` dan update:

\`\`\`env
GOOGLE_CLIENT_ID=your_client_id_from_above
GOOGLE_CLIENT_SECRET=your_client_secret_from_above
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/callback
\`\`\`

### Contoh:
\`\`\`env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-1234567890abcdefg
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/callback
\`\`\`

⚠️ **PENTING**: 
- Jangan commit `.env` ke Git
- Jangan share credentials Anda
- Di production, gunakan environment variables yang aman

## Testing OAuth Setup

### 1. Start Backend Server
\`\`\`bash
cd backend
python app.py
\`\`\`

### 2. Open Frontend
- Buka http://localhost:8080
- Klik "Login dengan Google"

### 3. Expected Flow
1. Browser akan redirect ke Google login page
2. Login dengan akun @student.itera.ac.id
3. Google akan ask for permission
4. Browser akan redirect back ke aplikasi
5. Anda akan di dashboard

### 4. If Something Wrong
- Check browser console (F12) untuk error messages
- Check backend terminal untuk API errors
- Verify credentials di `.env`
- Pastikan domain di OAuth consent screen match

## Troubleshooting

### Error: "Invalid redirect_uri"
**Cause**: URI di Google Console tidak match dengan `.env`
**Solution**: 
- Pastikan `GOOGLE_REDIRECT_URI` di `.env` sama persis dengan di Google Console
- Termasuk protocol (http/https) dan port

### Error: "Client not registered"
**Cause**: Client ID salah atau tidak ada credentials
**Solution**: 
- Double-check credentials di `.env`
- Copy-paste dari Google Console lagi
- Make sure tidak ada extra spaces

### Error: "Redirect URL mismatch"
**Cause**: Frontend URL tidak authorized
**Solution**:
- Add frontend URL ke "Authorized JavaScript origins" di Google Console
- Contoh: `http://localhost:8080`

### Error: "Access denied - invalid email domain"
**Cause**: Email tidak @student.itera.ac.id
**Solution**:
- Logout dari Google
- Login dengan email @student.itera.ac.id
- Jika tidak punya, hubungi administrator

### OAuth Consent Screen Stuck on "Testing"
**Cause**: Normal untuk development environment
**Solution**: 
- For production: Publish the app di OAuth Consent Screen
- For development: Cukup gunakan test users

## Production Deployment Checklist

Sebelum deploy ke production:

- ✅ Publish OAuth consent screen (not in testing mode)
- ✅ Create production OAuth credentials (separate dari development)
- ✅ Update redirect URI ke production domain
- ✅ Update authorized origins ke production domain
- ✅ Use environment variables untuk credentials (jangan hardcode)
- ✅ Enable HTTPS (required untuk production)
- ✅ Setup SSL certificate
- ✅ Test login flow di production

## Additional Resources

- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2
- Google Cloud Console: https://console.cloud.google.com/
- Google Sheets API Docs: https://developers.google.com/sheets/api

---

**OAuth Setup Complete!** 🔐

Anda sekarang siap untuk login dengan Google.

Last Updated: November 17, 2025
