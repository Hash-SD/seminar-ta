# 📊 Spreadsheet Reader (Jadwal Seminar ITERA)

Aplikasi modern untuk membaca, memfilter, dan menampilkan jadwal seminar mahasiswa ITERA secara real-time dari Google Sheets.  
Dibangun dengan **Next.js 16**, **PostgreSQL**, dan **Google OAuth** untuk keamanan tingkat institusi.

---

## 🌟 Fitur Utama

- 🔐 **Autentikasi Google Aman**: Login khusus untuk email domain `@student.itera.ac.id` dan `@itera.ac.id`.
- 📅 **Parsing Tanggal Cerdas ("Omnivora")**: Sistem otomatis membaca berbagai format tanggal (Indonesia, Inggris, format numerik, dll).
- ⚡ **Smart Caching**: Menyimpan data sementara di PostgreSQL untuk mengurangi request ke Google API.
- 🔄 **Token Rotation**: Menangani sesi login secara otomatis tanpa login ulang berkali-kali.
- 📱 **Desain Responsif**: Tampilan modern ala Apple, optimal di HP, Tablet, dan Desktop.
- 🔍 **Filter & Pencarian**: Cari berdasarkan Nama, Judul, atau Ruangan.
- 🛡️ **Admin Dashboard**: Panel khusus untuk mengelola link spreadsheet.

---

## 📂 Struktur Proyek

```

project-root/
├── app/                        # App Router (Next.js 16)
│   ├── admin/                  # Halaman Admin Dashboard
│   ├── api/                    # API Routes Backend
│   │   ├── auth/               # NextAuth configuration
│   │   ├── db-init/            # Endpoint inisialisasi database
│   │   ├── links/              # API manajemen link spreadsheet
│   │   ├── sheets/             # API fetch data Google Sheets
│   │   └── db.ts               # Koneksi PostgreSQL & Helper Query
│   ├── login/                  # Halaman Login
│   ├── page.tsx                # Halaman Utama (Public View)
│   ├── layout.tsx              # Root Layout
│   └── globals.css             # Global CSS (Tailwind imports)
│
├── components/                 # Komponen UI React
│   ├── ui/                     # Komponen Shadcn UI (Button, Card, etc.)
│   ├── add-link-form.tsx       # Form tambah spreadsheet
│   ├── dashboard.tsx           # Komponen utama dashboard admin
│   ├── links-list.tsx          # List spreadsheet yang dikelola
│   ├── login-page.tsx          # UI Halaman Login
│   ├── mode-toggle.tsx         # Tombol Dark/Light Mode
│   ├── public-schedule-viewer.tsx # Tampilan jadwal untuk umum
│   └── sheet-data-viewer.tsx   # Tampilan preview data sheet
│
├── lib/                        # Library & Helper Functions
│   ├── date-filter.ts          # Logika parsing tanggal "Omnivora"
│   ├── google-sheets.ts        # Client Google Sheets API
│   └── utils.ts                # Utilitas umum
│
├── hooks/                      # Custom Hooks
│   └── use-toast.ts            # Hook notifikasi
│
├── public/                     # Aset statis
│
├── .env.local                  # Environment Variables (Rahasia)
├── middleware.ts               # Middleware proteksi rute admin
├── next.config.mjs             # Konfigurasi Next.js
├── package.json                # Dependensi Node.js
├── tailwind.config.ts          # Konfigurasi Tailwind
└── tsconfig.json               # Konfigurasi TypeScript

````

---

## 🛠️ Tech Stack

- **Frontend / Framework**: Next.js 16 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Vercel Postgres / Neon)
- **Auth**: NextAuth.js (Google Provider)
- **API Client**: Google Sheets API v4

---

## 🚀 Panduan Instalasi (Local Development)

### 1. Persiapan Awal
Pastikan Anda memiliki:
- Node.js **18+**
- PostgreSQL Database
- Akun Google Cloud Platform (untuk OAuth)

### 2. Clone & Install
```bash
git clone https://github.com/username/repo-anda.git
cd repo-anda
npm install
````

### 3. Konfigurasi Environment Variables

Buat file `.env.local`:

```env
# --- DATABASE (PostgreSQL) ---
POSTGRES_URL="postgres://user:password@localhost:5432/db_name"

# --- GOOGLE OAUTH ---
GOOGLE_CLIENT_ID="dapatkan-dari-google-console"
GOOGLE_CLIENT_SECRET="dapatkan-dari-google-console"

# --- NEXTAUTH ---
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="rahasia-dapur-jangan-disebar"
```

### 4. Jalankan Server

```bash
npm run dev
```

Akses: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Panduan Google OAuth (PENTING)

1. Buka **Google Cloud Console**
2. Buat Project Baru (contoh: *ITERA Spreadsheet App*)
3. Masuk ke **OAuth consent screen**

   * Pilih *External* atau *Internal*
   * Isi App Name & Support Email
4. Buka **Credentials → Create Credentials → OAuth Client ID**

   * Tipe: **Web Application**
   * Authorized JavaScript origins:

     * `http://localhost:3000`
     * `https://nama-project.vercel.app`
   * Authorized redirect URIs:

     * `http://localhost:3000/api/auth/callback/google`
     * `https://nama-project.vercel.app/api/auth/callback/google`
5. Aktifkan **Google Sheets API** di menu *Library*
6. Masukkan Client ID & Secret ke file `.env.local`

---

## ☁️ Panduan Deploy ke Vercel

1. Push kode ke GitHub
2. Masuk Vercel → **New Project**
3. Import repo
4. Tambahkan Environment Variables seperti `.env.local`
5. Ubah `NEXTAUTH_URL` menjadi domain Vercel:

   ```
   https://seminar-ta.vercel.app
   ```
6. Klik **Deploy**
7. Tambahkan domain Vercel ke **Redirect URI** di Google Cloud Console

---

## 📄 Lisensi

Dibuat khusus untuk kebutuhan mahasiswa
**Institut Teknologi Sumatera (ITERA)** dengan 💝💝.
