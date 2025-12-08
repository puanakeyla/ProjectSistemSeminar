# 🎓 SEMAR - Sistem Manajemen Seminar

Aplikasi web untuk mengelola seminar proposal, skripsi, dan komprehensif mahasiswa dengan fitur persetujuan dosen, penjadwalan otomatis, absensi QR Code, dan sistem revisi.

## 📋 Fitur Utama

### 👨‍🎓 Mahasiswa
- ✅ Pengajuan seminar (Proposal/Hasil/Kompre)
- ✅ Upload berkas proposal/skripsi
- ✅ Tracking status persetujuan dosen
- ✅ Kelola revisi dari dosen
- ✅ Submit revisi dengan upload file
- ✅ Absensi via QR Code

### 👨‍🏫 Dosen
- ✅ Dashboard persetujuan seminar
- ✅ Approve/Reject pengajuan mahasiswa
- ✅ Pilih tanggal ketersediaan
- ✅ Tambah poin revisi dengan deadline
- ✅ Validasi revisi mahasiswa
- ✅ Absensi kehadiran via QR Code
- ✅ Download proposal mahasiswa

### 👨‍💼 Admin
- ✅ Dashboard monitoring seminar
- ✅ Verifikasi seminar yang sudah disetujui
- ✅ Generate jadwal otomatis
- ✅ Generate QR Code untuk absensi
- ✅ Monitoring kehadiran dosen dan mahasiswa
- ✅ Export data seminar

## 🛠️ Tech Stack

### Backend
- **Laravel 11** - PHP Framework
- **Laravel Sanctum** - API Authentication
- **SQLite** - Database (development)
- **Storage** - File Management

### Frontend
- **React 18** - UI Library
- **Vite** - Build Tool
- **Axios** - HTTP Client
- **Zustand** - State Management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 🚀 Quick Start

### Prerequisites
- PHP >= 8.1
- Composer
- Node.js >= 18
- NPM

### Installation

**📖 Lihat [SETUP-GUIDE.md](./SETUP-GUIDE.md) untuk instruksi lengkap!**

Ringkasan singkat:

```bash
# 1. Clone repository
git clone https://github.com/puanakeyla/ProjectSistemSeminar.git
cd ProjectSistemSeminar

# 2. Backend setup
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link

# 3. Frontend setup
cd frontend
npm install

# 4. Run application (2 terminals)
# Terminal 1: php artisan serve
# Terminal 2: cd frontend && npm run dev
```

## 🔑 Default Login

| Role      | Email                        | Password  |
|-----------|------------------------------|-----------|
| Admin     | admin@univ.ac.id            | admin123  |
| Mahasiswa | andi@student.univ.ac.id     | mhs123    |
| Dosen     | ahmad.wijaya@univ.ac.id     | dosen123  |

## 📁 Project Structure

```
ProjectSistemSeminar/
├── app/                    # Laravel application
│   ├── Http/Controllers/   # API Controllers
│   ├── Models/            # Eloquent Models
│   └── Services/          # Business Logic
├── database/
│   ├── migrations/        # Database migrations
│   └── seeders/           # Database seeders
├── frontend/              # React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── stores/        # Zustand stores
│   │   └── utils/         # Helper functions
│   └── public/            # Static assets
├── routes/
│   └── api.php            # API routes
└── storage/
    └── app/public/        # Uploaded files
        ├── revisions/     # Revision files
        └── seminar_berkas/ # Seminar documents
```

## 📚 Documentation

- [Setup Guide](./SETUP-GUIDE.md) - Panduan instalasi lengkap
- [API Documentation](./docs/API-TESTING.md) - API endpoints dan testing
- [Testing Guide](./docs/TESTING-README.md) - Panduan testing
- [Migration Guide](./docs/MIGRATION-GUIDE.md) - Database migrations

## 🔄 Workflow

1. **Mahasiswa** mengajukan seminar dengan upload berkas
2. **Dosen** (Pembimbing 1, 2, dan Penguji) menyetujui/menolak
3. **Admin** verifikasi dan generate jadwal otomatis
4. **Sistem** mencari tanggal yang cocok untuk semua dosen
5. **Admin** generate QR Code untuk absensi
6. **Dosen & Mahasiswa** scan QR Code saat seminar
7. **Dosen** tambahkan poin revisi setelah seminar
8. **Mahasiswa** kerjakan dan submit revisi
9. **Dosen** validasi revisi (approve/reject)

## 🎯 Key Features Details

### 🤖 Auto Scheduling
- Mencari tanggal yang cocok dari pilihan semua dosen
- Notifikasi otomatis jika tidak ada tanggal yang cocok
- Saran reschedule jika terjadi konflik

### 📱 QR Code Attendance
- Generate QR unique per jadwal seminar
- Validasi lokasi dan waktu check-in
- Tracking kehadiran real-time

### 📝 Revision System
- Dosen bisa tambah poin revisi dengan kategori
- Set deadline untuk setiap poin revisi
- Mahasiswa submit revisi dengan upload file
- Dosen validasi dengan approve/reject
- Counter revisi otomatis jika ditolak

### 🔔 Notification System
- Real-time notification untuk semua event
- Bell icon dengan counter unread
- Notifikasi untuk: approval, scheduling, revisi, dll

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

## 📄 License

This project is open-sourced software licensed under the MIT license.

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
