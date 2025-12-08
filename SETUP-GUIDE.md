# 📋 Setup Guide - Setelah Clone Project

Ikuti langkah-langkah ini setelah clone project di laptop baru untuk memastikan semua fitur berfungsi dengan baik.

## 🔧 Prerequisites

Pastikan sudah terinstall:
- PHP >= 8.1
- Composer
- Node.js >= 18
- NPM atau Yarn
- Database (SQLite/MySQL/PostgreSQL)

## 📥 Langkah Setup

### 1️⃣ **Backend Setup (Laravel)**

```bash
# 1. Masuk ke folder project
cd ProjectSistemSeminar

# 2. Install dependencies PHP
composer install

# 3. Copy file environment
copy .env.example .env
# atau di Linux/Mac: cp .env.example .env

# 4. Generate application key
php artisan key:generate

# 5. Buat database SQLite (jika menggunakan SQLite)
# Windows PowerShell:
New-Item -Path database/database.sqlite -ItemType File -Force
# Linux/Mac:
# touch database/database.sqlite

# 6. Setup .env - Edit file .env:
# APP_URL=http://localhost:8000
# DB_CONNECTION=sqlite
# (hapus atau comment DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD)

# 7. Run migrations
php artisan migrate

# 8. Seed database dengan data dummy
php artisan db:seed

# 9. PENTING: Buat storage symlink
php artisan storage:link

# 10. Clear semua cache
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# 11. Buat folder storage yang diperlukan
# Windows PowerShell:
New-Item -Path storage/app/public/revisions -ItemType Directory -Force
New-Item -Path storage/app/public/seminar_berkas -ItemType Directory -Force
# Linux/Mac:
# mkdir -p storage/app/public/revisions
# mkdir -p storage/app/public/seminar_berkas
```

### 2️⃣ **Frontend Setup (React + Vite)**

```bash
# 1. Masuk ke folder frontend
cd frontend

# 2. Install dependencies Node.js
npm install
# atau jika pakai yarn:
# yarn install

# 3. Copy environment file (jika ada)
# copy .env.example .env
# Edit .env jika diperlukan:
# VITE_API_URL=http://localhost:8000

# 4. Kembali ke root folder
cd ..
```

### 3️⃣ **Running the Application**

Buka **2 terminal terpisah**:

**Terminal 1 - Backend (Laravel):**
```bash
php artisan serve
# Server akan jalan di: http://localhost:8000
```

**Terminal 2 - Frontend (React):**
```bash
cd frontend
npm run dev
# Atau: yarn dev
# Frontend akan jalan di: http://localhost:5173
```

## 🔑 **Login Credentials**

Setelah seeding, gunakan credentials ini:

### Admin
- Email: `admin@univ.ac.id`
- Password: `admin123`

### Mahasiswa
- Email: `andi@student.univ.ac.id`
- Password: `mhs123`

### Dosen
- Email: `ahmad.wijaya@univ.ac.id`
- Password: `dosen123`
- Email: `budi.santoso@univ.ac.id`
- Password: `dosen123`
- Email: `siti.nurhaliza@univ.ac.id`
- Password: `dosen123`

## ⚠️ **Common Issues & Solutions**

### 1. Storage Symlink Error
```bash
# Hapus symlink lama (jika ada)
# Windows:
Remove-Item public/storage -Force
# Linux/Mac:
# rm -rf public/storage

# Buat ulang symlink
php artisan storage:link
```

### 2. Permission Error (Linux/Mac)
```bash
chmod -R 775 storage
chmod -R 775 bootstrap/cache
chown -R www-data:www-data storage
chown -R www-data:www-data bootstrap/cache
```

### 3. File Upload Tidak Bisa Diakses
```bash
# Pastikan symlink sudah dibuat
php artisan storage:link

# Cek apakah folder public/storage ada
# Windows:
Test-Path public/storage
# Linux/Mac:
# ls -la public/storage
```

### 4. Frontend Tidak Connect ke Backend
```bash
# Edit frontend/.env
VITE_API_URL=http://localhost:8000

# Restart frontend dev server
# Ctrl+C untuk stop, kemudian:
npm run dev
```

### 5. Database Error
```bash
# Reset database (HATI-HATI: akan hapus semua data!)
php artisan migrate:fresh --seed

# Atau jika mau keep data, coba:
php artisan migrate
```

### 6. Cache Issues
```bash
# Clear semua cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Rebuild cache (optional, untuk production)
# php artisan config:cache
# php artisan route:cache
```

## 📁 **Struktur Folder Penting**

```
ProjectSistemSeminar/
├── storage/
│   └── app/
│       └── public/           # File uploads disimpan di sini
│           ├── revisions/    # File revisi mahasiswa
│           └── seminar_berkas/ # File proposal/skripsi
├── public/
│   └── storage/              # Symlink ke storage/app/public (dibuat otomatis)
├── database/
│   └── database.sqlite       # Database file (jika pakai SQLite)
├── frontend/
│   ├── node_modules/         # Dependencies frontend
│   └── .env                  # Config frontend
└── .env                      # Config backend
```

## 🔄 **Update dari Git**

Jika ada update dari repository:

```bash
# 1. Pull changes
git pull origin main

# 2. Update backend dependencies
composer install

# 3. Update frontend dependencies
cd frontend
npm install
cd ..

# 4. Run migrations (jika ada yang baru)
php artisan migrate

# 5. Clear cache
php artisan cache:clear
php artisan config:clear
```

## ✅ **Verifikasi Setup**

Cek apakah semua sudah benar:

```bash
# 1. Cek Laravel
php artisan --version

# 2. Cek database connection
php artisan tinker
# Ketik: \App\Models\User::count()
# Jika return angka, berarti database OK

# 3. Cek storage symlink
# Windows:
Test-Path public/storage
# Linux/Mac:
# ls -la public/storage

# 4. Cek frontend dependencies
cd frontend
npm list
```

## 🎯 **Quick Start Commands**

Untuk memulai development setiap hari:

```bash
# Terminal 1 - Backend
php artisan serve

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## 📞 **Need Help?**

Jika masih ada masalah:
1. Pastikan semua prerequisites sudah terinstall
2. Cek error message di terminal
3. Pastikan port 8000 dan 5173 tidak dipakai aplikasi lain
4. Clear cache dan restart server

---

**Last Updated:** December 8, 2025
