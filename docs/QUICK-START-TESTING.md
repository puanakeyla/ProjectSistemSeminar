# 🚀 Quick Start Testing Guide

## Setup Database & Run Seeder

```bash
# Masuk ke direktori project
cd C:\Users\Akeyla\ProjectSistemSeminar

# Run migrations (jika belum)
php artisan migrate:fresh

# Run seeder untuk test users
php artisan db:seed --class=TestUsersSeeder
```

## Start Servers

### Terminal 1: Laravel Backend
```bash
php artisan serve
# Running at: http://127.0.0.1:8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
# Running at: http://localhost:3001
```

## Testing Flow - Quick Version

### 🎓 Test sebagai MAHASISWA

**1. Login**
```
URL: http://localhost:3001
Email: andi@student.univ.ac.id
Password: mhs123
```

**2. Ajukan Seminar**
- Klik "Seminar & Revisi" → "Ajukan Seminar Baru"
- Isi form:
  - Jenis: Proposal
  - Judul: "Sistem Rekomendasi Buku Berbasis Machine Learning"
  - Deskripsi: (min 50 karakter)
  - Pilih 3 dosen
  - Upload PDF
- Submit
- Logout

---

### 👨‍🏫 Test sebagai DOSEN PEMBIMBING 1

**1. Login**
```
Email: ahmad.wijaya@univ.ac.id
Password: dosen123
```

**2. Approve Pengajuan**
- Klik "Persetujuan"
- Buka pengajuan dari Andi Prasetyo
- Klik "Approve"
- Masukkan 3 tanggal ketersediaan:
  - 10 Des 2025, 09:00
  - 11 Des 2025, 13:00
  - 12 Des 2025, 10:00
- Submit
- Logout

---

### 👨‍🏫 Test sebagai DOSEN PEMBIMBING 2

**1. Login**
```
Email: siti.nurhaliza@univ.ac.id
Password: dosen123
```

**2. Approve Pengajuan**
- Klik "Persetujuan"
- Approve dengan tanggal:
  - 10 Des 2025, 09:00
  - 12 Des 2025, 10:00
  - 13 Des 2025, 14:00
- Submit
- Logout

---

### 👨‍🏫 Test sebagai DOSEN PENGUJI

**1. Login**
```
Email: budi.santoso@univ.ac.id
Password: dosen123
```

**2. Approve Pengajuan**
- Approve dengan tanggal:
  - 10 Des 2025, 09:00
  - 12 Des 2025, 10:00
- Submit
- Logout

---

### 👨‍💼 Test sebagai ADMIN

**1. Login**
```
Email: admin@univ.ac.id
Password: admin123
```

**2. Verifikasi Pengajuan**
- Klik "Verifikasi"
- Buka pengajuan Andi (status: all_approved)
- Klik "Verifikasi"
- Submit

**3. Jadwalkan Seminar**
- Klik "Penjadwalan"
- Pilih pengajuan Andi
- Klik "Jadwalkan"
- Pilih tanggal: **10 Desember 2025, 09:00** (irisan ketiga dosen)
- Pilih ruangan: Ruang Seminar 301
- Submit

**4. Generate QR Code**
- Klik "Kode QR"
- Cari seminar Andi
- Klik "Generate QR"
- Download QR Code
- Logout

---

### 🎓 Test QR Scan (MAHASISWA)

**1. Login**
```
Email: andi@student.univ.ac.id
Password: mhs123
```

**2. Scan QR**
- Klik "Scan QR"
- Upload file QR yang sudah di-download
- Atau gunakan camera untuk scan
- Verifikasi check-in berhasil
- Logout

---

## Test Matrix - Cepat

| No | Action | Role | Status |
|----|--------|------|--------|
| 1 | Login | Mahasiswa | ⬜ |
| 2 | Ajukan Seminar | Mahasiswa | ⬜ |
| 3 | Approve Pembimbing 1 | Dosen | ⬜ |
| 4 | Approve Pembimbing 2 | Dosen | ⬜ |
| 5 | Approve Penguji | Dosen | ⬜ |
| 6 | Verifikasi | Admin | ⬜ |
| 7 | Jadwalkan | Admin | ⬜ |
| 8 | Generate QR | Admin | ⬜ |
| 9 | Scan QR | Mahasiswa | ⬜ |
| 10 | Check-in Dosen | Dosen | ⬜ |
| 11 | View Kehadiran | Admin | ⬜ |
| 12 | Buat Revisi | Dosen | ⬜ |
| 13 | Kerjakan Revisi | Mahasiswa | ⬜ |
| 14 | Approve Revisi | Dosen | ⬜ |

## Troubleshooting

### Login muncul "canceled"
✅ **SUDAH DIPERBAIKI**
- Timeout ditingkatkan ke 30 detik
- Abort controller dihapus
- Error handling diperbaiki

### API Error 500
```bash
# Check Laravel log
tail -f storage/logs/laravel.log

# Atau di Windows:
Get-Content storage/logs/laravel.log -Tail 50
```

### Frontend tidak muncul data
1. Buka Console (F12)
2. Check Network tab
3. Lihat response API
4. Pastikan token ada di localStorage

### Database kosong
```bash
php artisan migrate:fresh --seed
php artisan db:seed --class=TestUsersSeeder
```

## API Testing (Optional)

Gunakan Postman atau curl untuk test API langsung:

### Login
```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"andi@student.univ.ac.id","password":"mhs123"}'
```

### Get User (dengan token)
```bash
curl -X GET http://127.0.0.1:8000/api/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Notes

- Semua password default: sesuai role (mhs123, dosen123, admin123)
- QR Code valid 24 jam setelah di-generate
- Scan QR hanya bisa dalam rentang waktu seminar
- Notifikasi real-time menggunakan polling setiap 30 detik

---

**Happy Testing! 🎉**
