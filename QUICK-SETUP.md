# 🚀 Quick Setup - Clone di Laptop Baru

## Langkah-langkah Cepat

### 1. Clone Repository
```bash
git clone https://github.com/puanakeyla/ProjectSistemSeminar.git
cd ProjectSistemSeminar
```

### 2. Backend (Terminal 1)
```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### 3. Frontend (Terminal 2)
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## ✅ Yang Harus Di-Commit ke Git

✅ **File yang SUDAH di commit:**
- Semua file `.php` (controllers, models, routes)
- Semua file `.jsx` dan `.css` (frontend)
- File `composer.json` dan `package.json`
- File migrations dan seeders
- File `.env.example` (template)
- File utils dan helper

❌ **File yang JANGAN di commit:**
- `.env` (berisi config pribadi)
- `vendor/` folder (install via composer)
- `node_modules/` folder (install via npm)
- `database/database.sqlite` (file database)
- `storage/app/public/` (file uploads)
- `public/storage/` (symlink)

## 📋 Checklist After Clone

- [ ] Run `composer install`
- [ ] Copy `.env.example` ke `.env`
- [ ] Run `php artisan key:generate`
- [ ] Run `php artisan migrate --seed`
- [ ] Run `php artisan storage:link` ⚠️ PENTING!
- [ ] Run `npm install` di folder frontend
- [ ] Copy `.env.example` ke `.env` di folder frontend

## 🔑 Login Default

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@univ.ac.id | admin123 |
| Mahasiswa | andi@student.univ.ac.id | mhs123 |
| Dosen | ahmad.wijaya@univ.ac.id | dosen123 |

## 🐛 Troubleshooting

### File tidak bisa di-download/view?
```bash
php artisan storage:link
```

### Database kosong?
```bash
php artisan migrate:fresh --seed
```

### Cache error?
```bash
php artisan cache:clear
php artisan config:clear
```

### Port sudah dipakai?
```bash
# Backend - ganti port
php artisan serve --port=8001

# Frontend - akan auto-detect port lain
npm run dev
```

---

📖 **Lihat SETUP-GUIDE.md untuk instruksi lengkap!**
