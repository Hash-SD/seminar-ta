# 📊 Spreadsheet Reader (Jadwal Seminar ITERA)

Aplikasi modern untuk membaca, memfilter, dan menampilkan jadwal seminar mahasiswa ITERA secara real-time dari Google Sheets.  
Dibangun dengan **Next.js 16**, **PostgreSQL**, dan **Google OAuth** untuk keamanan tingkat institusi.

---

## 🌟 Fitur Utama

### 🔐 Autentikasi Google Aman
- Login khusus email **@student.itera.ac.id** dan **@itera.ac.id**.

### 📅 Parsing Tanggal Cerdas (“Omnivora”)
- Sistem otomatis membaca berbagai format tanggal (Indonesia/Inggris/angka pendek, dll).

### ⚡ Smart Caching
- Menggunakan PostgreSQL untuk cache sementara agar loading jauh lebih cepat.

### 🔄 Token Rotation
- Menangani sesi login Google secara otomatis tanpa sering login ulang.

### 📱 Desain Responsif
- Tampilan modern ala Apple, optimal di HP, Tablet, dan Desktop.

### 🔍 Filter & Pencarian
- Cari berdasarkan **Nama**, **Judul**, atau **Ruangan**.

### 🛡️ Admin Dashboard
- Panel khusus untuk mengelola link spreadsheet.

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
- Node.js 18+
- PostgreSQL (Lokal atau Cloud)
- Akun Google Cloud Platform

### 2. Clone & Install
```bash
git clone https://github.com/username/repo-anda.git
cd repo-anda
npm install
