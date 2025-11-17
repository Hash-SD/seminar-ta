# Setup Checklist - Spreadsheet Data Reader

Gunakan checklist ini untuk memastikan setup berjalan dengan baik.

## Pre-Setup
- [ ] Python 3.8+ installed
- [ ] pip installed
- [ ] Text editor/IDE ready
- [ ] Web browser available
- [ ] Internet connection

## Google OAuth Setup
- [ ] Google Cloud Project created
- [ ] Google Sheets API enabled
- [ ] OAuth Consent Screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Client ID copied
- [ ] Client Secret copied
- [ ] Redirect URI configured in Google

## Backend Setup
- [ ] Backend folder navigated
- [ ] Virtual environment created
- [ ] Virtual environment activated
- [ ] Dependencies installed (pip install -r requirements.txt)
- [ ] .env file created
- [ ] Google credentials added to .env
- [ ] Database initialized
- [ ] Backend server starts without errors
- [ ] Health check working (http://localhost:8000/api/health)

## Frontend Setup
- [ ] Frontend can be accessed
- [ ] Landing page loads
- [ ] CSS styling applied
- [ ] Frontend can communicate with backend

## First-Time Login Test
- [ ] Can click "Login dengan Google" button
- [ ] Google login dialog appears
- [ ] Can login with @student.itera.ac.id email
- [ ] Redirects to dashboard after login
- [ ] User info displayed correctly

## Dashboard Test
- [ ] Dashboard loads without errors
- [ ] Can see "Tambah Spreadsheet Baru" section
- [ ] Can see empty links list
- [ ] Can see form inputs

## Add Link Test
- [ ] Can input spreadsheet URL
- [ ] Can input sheet name
- [ ] Can click "Tambah Link" button
- [ ] Link appears in links list
- [ ] Can click "Lihat" to load data

## Error Handling
- [ ] Non-@student.itera.ac.id email shows error page
- [ ] Invalid spreadsheet URL shows error
- [ ] Can logout successfully

## Production Deployment (if applicable)
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] OAuth credentials updated
- [ ] Custom domain configured
- [ ] HTTPS working
- [ ] Database backed up

## Final Verification
- [ ] All features working as expected
- [ ] No console errors
- [ ] No backend errors
- [ ] Performance acceptable
- [ ] Dark mode working correctly
- [ ] Mobile responsiveness working

---

Date Completed: ______________
Completed By: _________________
Notes: _________________________
