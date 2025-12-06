# 📚 Testing Documentation Index

Dokumen panduan testing lengkap untuk Sistem Manajemen Seminar (SEMAR).

---

## 📖 Dokumen Testing

### 1. 🚀 [Quick Start Testing Guide](./QUICK-START-TESTING.md)
**Untuk**: Pemula / Testing Cepat  
**Waktu**: 5-10 menit  
**Isi**:
- Setup database & seeder
- Start servers
- Quick test flow per role
- Troubleshooting

### 2. ✅ [Test Checklist](./TEST-CHECKLIST.md)
**Untuk**: Tester / QA  
**Waktu**: 30-45 menit  
**Isi**:
- Checklist lengkap step-by-step
- 3 skenario testing utama
- Form checklist yang bisa dicetak
- Bug tracking template

### 3. 📋 [Test Plan (Full)](./TEST-PLAN.md)
**Untuk**: Project Manager / Test Lead  
**Waktu**: 2-3 jam (comprehensive testing)  
**Isi**:
- Test plan lengkap 105+ langkah
- Test cases detail per role
- Integration testing scenarios
- Security & performance testing
- Analytics testing

### 4. 🔌 [API Testing Collection](./API-TESTING.md)
**Untuk**: Backend Developer / API Tester  
**Waktu**: 1-2 jam  
**Isi**:
- Complete API endpoints
- Request/response examples
- Curl & PowerShell commands
- Postman ready

---

## 🎯 Pilih Berdasarkan Kebutuhan

| Tujuan | Dokumen | Waktu |
|--------|---------|-------|
| **Testing cepat untuk demo** | Quick Start Guide | 10 menit |
| **QA testing standar** | Test Checklist | 30 menit |
| **UAT (User Acceptance Test)** | Test Plan Full | 2-3 jam |
| **API development/testing** | API Testing Collection | 1-2 jam |

---

## 🔑 Kredensial Testing

Semua kredensial sudah di-setup via TestUsersSeeder:

| Role | Email | Password | Nama |
|------|-------|----------|------|
| **Mahasiswa** | andi@student.univ.ac.id | mhs123 | Andi Prasetyo (NPM: 2021001) |
| **Mahasiswa** | dewi@student.univ.ac.id | mhs123 | Dewi Kusuma (NPM: 2021002) |
| **Mahasiswa** | raka@student.univ.ac.id | mhs123 | Raka Firmansyah (NPM: 2021003) |
| **Dosen** | ahmad.wijaya@univ.ac.id | dosen123 | Dr. Ahmad Wijaya, M.Kom |
| **Dosen** | siti.nurhaliza@univ.ac.id | dosen123 | Dr. Siti Nurhaliza, M.T |
| **Dosen** | budi.santoso@univ.ac.id | dosen123 | Prof. Budi Santoso, Ph.D |
| **Admin** | admin@univ.ac.id | admin123 | Admin System |

---

## 🚦 Setup Testing Environment

### 1. Persiapan Database
```bash
# Jalankan migrasi & seeder
php artisan migrate:fresh
php artisan db:seed --class=TestUsersSeeder
```

### 2. Start Servers
```bash
# Terminal 1: Backend (Laravel)
php artisan serve
# http://127.0.0.1:8000

# Terminal 2: Frontend (Vite)
cd frontend
npm run dev
# http://localhost:3001
```

### 3. Verifikasi
- ✅ Backend running di port 8000
- ✅ Frontend running di port 3001
- ✅ Database memiliki 7 users
- ✅ Browser console terbuka (F12)

---

## 🔄 Alur Testing Recommended

### Phase 1: Basic Flow (30 menit)
Gunakan **Test Checklist**:
1. Test authentication semua role
2. Test full workflow: Pengajuan → Approval → Jadwal → QR Scan
3. Test revisi flow
4. Test rejection flow

### Phase 2: Deep Testing (2 jam)
Gunakan **Test Plan Full**:
1. Semua test cases Mahasiswa (TC-MHS-001 s/d TC-MHS-010)
2. Semua test cases Dosen (TC-DSN-001 s/d TC-DSN-012)
3. Semua test cases Admin (TC-ADM-001 s/d TC-ADM-013)
4. Integration & performance testing

### Phase 3: API Testing (1 jam)
Gunakan **API Testing Collection**:
1. Test semua endpoint dengan Postman
2. Verify response codes
3. Test error handling
4. Security testing

---

## ✅ Test Coverage

Dokumentasi ini mencakup testing untuk:

### Functional Features
- ✅ Authentication & Authorization (3 roles)
- ✅ Mahasiswa: Pengajuan, Status, Jadwal, QR Scan, Revisi
- ✅ Dosen: Approval, Jadwal, Check-in, Revisi Management
- ✅ Admin: Verifikasi, Penjadwalan, QR Generate, Kehadiran, Laporan
- ✅ Notifikasi real-time untuk semua role
- ✅ Dashboard & statistik
- ✅ File upload & download

### Non-Functional Features
- ✅ Performance (response time)
- ✅ Security (authentication, authorization)
- ✅ Usability (UI/UX)
- ✅ Responsiveness (mobile/tablet/desktop)
- ✅ Error handling
- ✅ Data validation

---

## 📊 Test Metrics

Target pass rate untuk production-ready:
- **Critical Features**: 100% pass (Auth, Pengajuan, Approval, Jadwal)
- **High Priority**: 95% pass (QR, Revisi, Notifikasi)
- **Medium Priority**: 90% pass (Dashboard, Export, Analytics)
- **Low Priority**: 80% pass (UI polish, Nice-to-have features)

---

## 🐛 Bug Reporting

Jika menemukan bug:
1. Catat di Test Checklist/Test Plan
2. Screenshot error (console & UI)
3. Catat steps to reproduce
4. Prioritas: Critical / High / Medium / Low
5. Report ke development team

---

## 📝 Testing Best Practices

1. **Selalu clear cache** sebelum testing
2. **Buka console** (F12) untuk monitoring error
3. **Test di multiple browsers** (Chrome, Firefox, Edge)
4. **Test responsiveness** (resize browser)
5. **Dokumentasikan semua findings**
6. **Retest after bug fix**
7. **Verify notifications** di semua role
8. **Check database** untuk data integrity
9. **Test edge cases** (file besar, karakter spesial, etc)
10. **Performance monitoring** (response time, loading)

---

## 🎓 Training Scenarios

### Scenario untuk Training User:

#### Training Mahasiswa (15 menit)
1. Login & explore dashboard
2. Ajukan seminar baru
3. Cek status pengajuan
4. View jadwal seminar
5. Scan QR code
6. View & update revisi

#### Training Dosen (15 menit)
1. Login & explore dashboard
2. Review & approve pengajuan
3. View jadwal seminar
4. Check-in kehadiran
5. Buat revisi untuk mahasiswa
6. Approve revisi yang sudah dikerjakan

#### Training Admin (20 menit)
1. Login & explore dashboard
2. Verifikasi pengajuan
3. Jadwalkan seminar (cek konflik)
4. Generate QR code
5. View kehadiran
6. Export laporan

---

## 🔧 Troubleshooting Common Issues

### "Login muncul canceled"
✅ **SUDAH DIPERBAIKI**
- Timeout diperpanjang ke 30 detik
- Abort controller dihapus
- Error handling diperbaiki

### "CORS Error"
```bash
# Check Laravel CORS config
# File: config/cors.php
```

### "Token Expired"
- Token valid 7 hari
- Re-login untuk get new token

### "QR Scan Failed"
- Pastikan QR sudah di-generate
- Pastikan dalam rentang waktu seminar
- Check camera permission

### "File Upload Failed"
- Max size: 10MB
- Format: PDF only
- Check storage permissions

---

## 📞 Support

Jika butuh bantuan:
1. Check dokumentasi ini
2. Check Laravel logs: `storage/logs/laravel.log`
3. Check browser console
4. Check network tab
5. Contact: [your-email@example.com]

---

## 📅 Update History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 6 Des 2025 | Initial testing documentation |
| 1.1 | 6 Des 2025 | Fixed login "canceled" issue |
| - | - | Added comprehensive test scenarios |

---

**Status**: ✅ Ready for Testing  
**Last Updated**: 6 Desember 2025  
**Maintained by**: Development Team

🎉 **Happy Testing!**
