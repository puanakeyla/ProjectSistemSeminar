# 🧪 Test Plan - Sistem Manajemen Seminar (SEMAR)

## 📋 Daftar Isi
- [Kredensial Testing](#kredensial-testing)
- [Alur Testing Terintegrasi](#alur-testing-terintegrasi)
- [Test Case per Role](#test-case-per-role)
- [Checklist Testing](#checklist-testing)

---

## 🔑 Kredensial Testing

### Admin
- **Email**: `admin@univ.ac.id`
- **Password**: `admin123`
- **Role**: Administrator

### Dosen
1. **Dosen Pembimbing 1**
   - Email: `ahmad.wijaya@univ.ac.id`
   - Password: `dosen123`
   - Nama: Dr. Ahmad Wijaya, M.Kom

2. **Dosen Pembimbing 2**
   - Email: `siti.nurhaliza@univ.ac.id`
   - Password: `dosen123`
   - Nama: Dr. Siti Nurhaliza, M.T

3. **Dosen Penguji**
   - Email: `budi.santoso@univ.ac.id`
   - Password: `dosen123`
   - Nama: Prof. Budi Santoso, Ph.D

### Mahasiswa
1. **Mahasiswa 1**
   - Email: `andi@student.univ.ac.id`
   - Password: `mhs123`
   - NPM: 2021001
   - Nama: Andi Prasetyo

2. **Mahasiswa 2**
   - Email: `dewi@student.univ.ac.id`
   - Password: `mhs123`
   - NPM: 2021002
   - Nama: Dewi Kusuma

3. **Mahasiswa 3**
   - Email: `raka@student.univ.ac.id`
   - Password: `mhs123`
   - NPM: 2021003
   - Nama: Raka Firmansyah

---

## 🔄 Alur Testing Terintegrasi

### Skenario 1: Alur Lengkap Pengajuan Seminar Proposal
**Tujuan**: Test full workflow dari pengajuan hingga pelaksanaan seminar

#### Langkah Testing:

**FASE 1: PENGAJUAN (Mahasiswa)**
1. ✅ Login sebagai Mahasiswa (andi@student.univ.ac.id)
2. ✅ Akses Dashboard - verifikasi statistik awal
3. ✅ Buka menu "Seminar & Revisi"
4. ✅ Klik "Ajukan Seminar Baru"
5. ✅ Isi form pengajuan:
   - Jenis: Proposal
   - Judul: "Sistem Rekomendasi Buku Berbasis Machine Learning"
   - Deskripsi: "Penelitian tentang implementasi collaborative filtering..."
   - Dosen Pembimbing 1: Dr. Ahmad Wijaya, M.Kom
   - Dosen Pembimbing 2: Dr. Siti Nurhaliza, M.T
   - Dosen Penguji: Prof. Budi Santoso, Ph.D
   - Upload dokumen proposal (PDF)
6. ✅ Submit pengajuan
7. ✅ Verifikasi notifikasi berhasil
8. ✅ Cek status di halaman "Seminar & Revisi" (status: pending)
9. ✅ Logout

**FASE 2: APPROVAL PEMBIMBING 1 (Dosen)**
10. ✅ Login sebagai Dosen Pembimbing 1 (ahmad.wijaya@univ.ac.id)
11. ✅ Verifikasi notifikasi pengajuan baru
12. ✅ Cek Dashboard - ada pengajuan pending
13. ✅ Buka menu "Persetujuan"
14. ✅ Klik detail pengajuan dari Andi Prasetyo
15. ✅ Review dokumen proposal
16. ✅ Approve pengajuan dengan memberikan tanggal ketersediaan:
    - Tanggal 1: 10 Desember 2025, 09:00
    - Tanggal 2: 11 Desember 2025, 13:00
    - Tanggal 3: 12 Desember 2025, 10:00
17. ✅ Submit approval
18. ✅ Verifikasi status berubah di halaman approval
19. ✅ Logout

**FASE 3: APPROVAL PEMBIMBING 2 (Dosen)**
20. ✅ Login sebagai Dosen Pembimbing 2 (siti.nurhaliza@univ.ac.id)
21. ✅ Verifikasi notifikasi pengajuan baru
22. ✅ Buka menu "Persetujuan"
23. ✅ Klik detail pengajuan dari Andi Prasetyo
24. ✅ Approve pengajuan dengan tanggal ketersediaan:
    - Tanggal 1: 10 Desember 2025, 09:00
    - Tanggal 2: 12 Desember 2025, 10:00
    - Tanggal 3: 13 Desember 2025, 14:00
25. ✅ Submit approval
26. ✅ Logout

**FASE 4: APPROVAL PENGUJI (Dosen)**
27. ✅ Login sebagai Dosen Penguji (budi.santoso@univ.ac.id)
28. ✅ Verifikasi notifikasi pengajuan baru
29. ✅ Buka menu "Persetujuan"
30. ✅ Review dan approve dengan tanggal ketersediaan:
    - Tanggal 1: 10 Desember 2025, 09:00
    - Tanggal 2: 12 Desember 2025, 10:00
31. ✅ Submit approval
32. ✅ Logout

**FASE 5: VERIFIKASI ADMIN**
33. ✅ Login sebagai Admin (admin@univ.ac.id)
34. ✅ Verifikasi notifikasi ada pengajuan yang sudah disetujui semua dosen
35. ✅ Cek Dashboard - lihat statistik
36. ✅ Buka menu "Verifikasi"
37. ✅ Klik detail pengajuan Andi Prasetyo
38. ✅ Review dokumen dan approval dosen
39. ✅ Verifikasi pengajuan (setujui)
40. ✅ Verifikasi status berubah menjadi "verified"
41. ✅ Jangan logout dulu

**FASE 6: PENJADWALAN (Admin)**
42. ✅ Buka menu "Penjadwalan"
43. ✅ Lihat pengajuan yang sudah diverifikasi
44. ✅ Klik "Jadwalkan" pada pengajuan Andi
45. ✅ Pilih tanggal yang tersedia dari irisan tanggal dosen: **10 Desember 2025, 09:00**
46. ✅ Pilih ruangan: Ruang Seminar 301
47. ✅ Submit jadwal
48. ✅ Verifikasi notifikasi berhasil
49. ✅ Cek di kalender jadwal sudah muncul

**FASE 7: GENERATE QR CODE (Admin)**
50. ✅ Buka menu "Kode QR"
51. ✅ Cari seminar Andi Prasetyo yang sudah dijadwalkan
52. ✅ Klik "Generate QR Code"
53. ✅ Verifikasi QR Code muncul
54. ✅ Download QR Code untuk testing
55. ✅ Logout

**FASE 8: CEK JADWAL (Mahasiswa)**
56. ✅ Login sebagai Mahasiswa (andi@student.univ.ac.id)
57. ✅ Verifikasi notifikasi ada jadwal baru
58. ✅ Cek Dashboard - ada jadwal mendatang
59. ✅ Buka menu "Seminar & Revisi"
60. ✅ Verifikasi status seminar: "scheduled"
61. ✅ Lihat detail jadwal (tanggal, waktu, ruangan)
62. ✅ Jangan logout

**FASE 9: SCAN QR (Mahasiswa)**
63. ✅ Buka menu "Scan QR"
64. ✅ Klik tombol scan atau upload QR
65. ✅ Scan/upload QR Code yang sudah di-download
66. ✅ Verifikasi berhasil check-in
67. ✅ Cek status kehadiran berubah
68. ✅ Logout

**FASE 10: ABSENSI DOSEN**
69. ✅ Login sebagai Dosen Pembimbing 1 (ahmad.wijaya@univ.ac.id)
70. ✅ Buka menu "Jadwal"
71. ✅ Lihat seminar hari ini
72. ✅ Klik detail seminar
73. ✅ Tandai kehadiran (check-in)
74. ✅ Logout
75. ✅ Ulangi langkah 69-74 untuk Dosen Pembimbing 2 dan Penguji

**FASE 11: CEK KEHADIRAN (Admin)**
76. ✅ Login sebagai Admin (admin@univ.ac.id)
77. ✅ Buka menu "Kehadiran"
78. ✅ Pilih seminar Andi Prasetyo
79. ✅ Verifikasi daftar kehadiran:
    - Mahasiswa: Hadir (scan QR)
    - Pembimbing 1: Hadir
    - Pembimbing 2: Hadir
    - Penguji: Hadir
80. ✅ Export laporan kehadiran
81. ✅ Logout

**FASE 12: REVISI (Dosen ke Mahasiswa)**
82. ✅ Login sebagai Dosen Pembimbing 1 (ahmad.wijaya@univ.ac.id)
83. ✅ Buka menu "Seminar & Revisi"
84. ✅ Klik seminar Andi yang sudah selesai
85. ✅ Klik "Buat Revisi"
86. ✅ Tambahkan item revisi:
    - Item 1: "Perbaiki abstrak pada halaman 2"
    - Item 2: "Tambahkan diagram use case di BAB 3"
    - Item 3: "Lengkapi daftar pustaka"
87. ✅ Tambahkan catatan untuk admin
88. ✅ Submit revisi
89. ✅ Logout

**FASE 13: CEK & KERJAKAN REVISI (Mahasiswa)**
90. ✅ Login sebagai Mahasiswa (andi@student.univ.ac.id)
91. ✅ Verifikasi notifikasi ada revisi baru
92. ✅ Buka menu "Seminar & Revisi"
93. ✅ Klik detail seminar
94. ✅ Lihat daftar revisi dari dosen
95. ✅ Tandai revisi item 1 sebagai "selesai"
96. ✅ Upload bukti perbaikan
97. ✅ Tandai revisi item 2 sebagai "selesai"
98. ✅ Tandai revisi item 3 sebagai "selesai"
99. ✅ Submit semua revisi
100. ✅ Logout

**FASE 14: VERIFIKASI REVISI (Dosen)**
101. ✅ Login sebagai Dosen Pembimbing 1 (ahmad.wijaya@univ.ac.id)
102. ✅ Verifikasi notifikasi revisi sudah dikerjakan
103. ✅ Buka menu "Seminar & Revisi"
104. ✅ Review revisi yang sudah dikerjakan
105. ✅ Approve/setujui semua revisi
106. ✅ Logout

---

### Skenario 2: Rejection Flow
**Tujuan**: Test alur penolakan pengajuan

#### Langkah Testing:

**FASE 1: PENGAJUAN KEDUA (Mahasiswa)**
1. ✅ Login sebagai Mahasiswa (dewi@student.univ.ac.id)
2. ✅ Ajukan seminar baru (Hasil)
3. ✅ Isi data pengajuan
4. ✅ Logout

**FASE 2: REJECTION (Dosen)**
5. ✅ Login sebagai Dosen (ahmad.wijaya@univ.ac.id)
6. ✅ Buka pengajuan dari Dewi
7. ✅ Reject dengan catatan: "Dokumen belum lengkap, harap upload lampiran A dan B"
8. ✅ Submit rejection
9. ✅ Logout

**FASE 3: CEK REJECTION (Mahasiswa)**
10. ✅ Login sebagai Mahasiswa (dewi@student.univ.ac.id)
11. ✅ Verifikasi notifikasi penolakan
12. ✅ Baca catatan penolakan
13. ✅ Verifikasi status: "rejected"
14. ✅ Ajukan ulang dengan dokumen lengkap
15. ✅ Logout

---

### Skenario 3: Multi Seminar Parallel
**Tujuan**: Test sistem dengan multiple seminar berjalan bersamaan

#### Langkah Testing:

1. ✅ Mahasiswa Raka ajukan Seminar Proposal
2. ✅ Mahasiswa Dewi ajukan Seminar Hasil
3. ✅ Mahasiswa Andi ajukan Seminar Hasil
4. ✅ Dosen approve ketiga pengajuan dengan jadwal berbeda
5. ✅ Admin jadwalkan di hari yang berbeda
6. ✅ Verifikasi tidak ada konflik jadwal
7. ✅ Generate QR untuk semua seminar
8. ✅ Test scan QR di masing-masing seminar

---

## 📝 Test Case per Role

### A. MAHASISWA Test Cases

#### TC-MHS-001: Login Mahasiswa
- **Precondition**: User sudah terdaftar sebagai mahasiswa
- **Input**: Email & Password yang valid
- **Expected**: Login berhasil, redirect ke dashboard mahasiswa
- **Test Data**: andi@student.univ.ac.id / mhs123

#### TC-MHS-002: View Dashboard
- **Precondition**: Mahasiswa sudah login
- **Expected**: 
  - Tampil nama mahasiswa
  - Tampil NPM
  - Statistik: Total Seminar, Jadwal Mendatang, Revisi Pending
  - Timeline seminar terkini

#### TC-MHS-003: Ajukan Seminar Baru
- **Precondition**: Mahasiswa sudah login
- **Input**:
  - Jenis: Proposal/Hasil
  - Judul seminar (min 10 karakter)
  - Deskripsi (min 50 karakter)
  - 3 Dosen (Pembimbing 1, 2, Penguji)
  - Upload dokumen PDF (max 10MB)
- **Expected**: 
  - Form validasi bekerja
  - Upload berhasil
  - Status: pending
  - Notifikasi success
  - Data muncul di list seminar

#### TC-MHS-004: View Status Seminar
- **Precondition**: Ada seminar yang sudah diajukan
- **Expected**:
  - List seminar dengan status (pending/approved/rejected/scheduled/completed)
  - Detail lengkap untuk setiap seminar
  - Status approval dari masing-masing dosen
  - Tanggal pengajuan

#### TC-MHS-005: View Jadwal Seminar
- **Precondition**: Seminar sudah dijadwalkan
- **Expected**:
  - Tanggal & waktu seminar
  - Ruangan
  - Daftar dosen penguji
  - Status persiapan

#### TC-MHS-006: Scan QR Code
- **Precondition**: 
  - Seminar sudah dijadwalkan
  - QR Code sudah di-generate
  - Waktu scan dalam rentang yang diizinkan
- **Expected**:
  - Kamera aktif atau upload file
  - Scan berhasil
  - Check-in tercatat
  - Notifikasi berhasil absen

#### TC-MHS-007: View Revisi
- **Precondition**: Dosen sudah memberikan revisi
- **Expected**:
  - List revisi dari dosen
  - Status setiap item revisi
  - Catatan/komentar dosen
  - Deadline revisi (jika ada)

#### TC-MHS-008: Update Status Revisi
- **Precondition**: Ada revisi yang harus dikerjakan
- **Input**: 
  - Pilih item revisi
  - Tandai sebagai selesai
  - Upload bukti (optional)
- **Expected**:
  - Status revisi berubah
  - Dosen mendapat notifikasi
  - Progress bar updated

#### TC-MHS-009: View Notifikasi
- **Precondition**: Ada notifikasi baru
- **Expected**:
  - Badge count notifikasi
  - List notifikasi (terbaru di atas)
  - Mark as read
  - Link ke halaman terkait

#### TC-MHS-010: Logout
- **Expected**:
  - Token dihapus
  - Redirect ke login
  - Session cleared

---

### B. DOSEN Test Cases

#### TC-DSN-001: Login Dosen
- **Precondition**: User sudah terdaftar sebagai dosen
- **Input**: Email & Password yang valid
- **Expected**: Login berhasil, redirect ke dashboard dosen
- **Test Data**: ahmad.wijaya@univ.ac.id / dosen123

#### TC-DSN-002: View Dashboard
- **Precondition**: Dosen sudah login
- **Expected**:
  - Nama dosen & NIDN
  - Statistik: Approval Pending, Jadwal Seminar, Total Dibimbing
  - Chart/grafik statistik
  - Quick actions

#### TC-DSN-003: View Pengajuan Pending
- **Precondition**: Ada pengajuan baru dari mahasiswa
- **Expected**:
  - List pengajuan yang belum diproses
  - Info mahasiswa (nama, NPM, judul)
  - Tombol Approve/Reject
  - Tanggal pengajuan

#### TC-DSN-004: Approve Pengajuan
- **Precondition**: Ada pengajuan pending
- **Input**:
  - Status: Approved
  - 3 tanggal ketersediaan dengan waktu
  - Catatan (optional)
- **Expected**:
  - Status approval berubah
  - Mahasiswa mendapat notifikasi
  - Admin dapat melihat untuk penjadwalan
  - Tanggal tersimpan di database

#### TC-DSN-005: Reject Pengajuan
- **Precondition**: Ada pengajuan pending
- **Input**:
  - Status: Rejected
  - Catatan wajib (alasan penolakan)
- **Expected**:
  - Status berubah menjadi rejected
  - Mahasiswa mendapat notifikasi dengan catatan
  - Approval flow berhenti

#### TC-DSN-006: View Detail Pengajuan
- **Precondition**: Ada pengajuan seminar
- **Expected**:
  - Judul & deskripsi lengkap
  - Info mahasiswa
  - Dokumen proposal/hasil (bisa download)
  - Status approval dari dosen lain
  - Timeline approval

#### TC-DSN-007: View Jadwal Seminar
- **Precondition**: Ada seminar yang sudah dijadwalkan
- **Expected**:
  - Kalender view
  - List seminar per hari
  - Detail: mahasiswa, waktu, ruangan
  - Status kehadiran dosen

#### TC-DSN-008: Check-in Kehadiran
- **Precondition**: 
  - Ada seminar hari ini
  - Dosen terdaftar sebagai pembimbing/penguji
- **Expected**:
  - Tombol check-in aktif
  - Status kehadiran tercatat
  - Admin dapat melihat di laporan

#### TC-DSN-009: Buat Revisi
- **Precondition**: Seminar sudah selesai
- **Input**:
  - Pilih seminar
  - Tambah item revisi (multiple)
  - Keterangan per item
  - Catatan untuk admin (optional)
- **Expected**:
  - Revisi tersimpan
  - Mahasiswa mendapat notifikasi
  - Status seminar: need_revision

#### TC-DSN-010: View & Verifikasi Revisi
- **Precondition**: Mahasiswa sudah mengerjakan revisi
- **Expected**:
  - List item revisi dengan status
  - Bukti perbaikan dari mahasiswa
  - Tombol approve/reject per item
  - Bisa approve semua sekaligus

#### TC-DSN-011: View Seminar History
- **Precondition**: Ada seminar yang sudah completed
- **Expected**:
  - List seminar completed
  - Filter by jenis/status
  - Export data
  - Statistik

#### TC-DSN-012: Notifikasi Real-time
- **Expected**:
  - Notifikasi pengajuan baru
  - Notifikasi revisi selesai
  - Notifikasi jadwal seminar
  - Badge count update otomatis

---

### C. ADMIN Test Cases

#### TC-ADM-001: Login Admin
- **Precondition**: User sudah terdaftar sebagai admin
- **Input**: Email & Password yang valid
- **Expected**: Login berhasil, redirect ke dashboard admin
- **Test Data**: admin@univ.ac.id / admin123

#### TC-ADM-002: View Dashboard
- **Precondition**: Admin sudah login
- **Expected**:
  - Statistik keseluruhan sistem
  - Total pengajuan (pending/approved/rejected)
  - Jadwal seminar hari ini
  - Chart trend seminar
  - Quick stats card

#### TC-ADM-003: View Pengajuan untuk Verifikasi
- **Precondition**: Ada pengajuan yang sudah disetujui semua dosen
- **Expected**:
  - List pengajuan ready for verification
  - Status approval dari 3 dosen
  - Tanggal ketersediaan dosen
  - Dokumen seminar

#### TC-ADM-004: Verifikasi Pengajuan
- **Precondition**: Pengajuan sudah approved semua dosen
- **Input**: Approve/Reject dengan catatan
- **Expected**:
  - Status berubah menjadi verified
  - Muncul di halaman penjadwalan
  - Notifikasi ke mahasiswa
  - Log activity

#### TC-ADM-005: Reject Verifikasi
- **Precondition**: Pengajuan perlu ditolak admin
- **Input**: Alasan penolakan (wajib)
- **Expected**:
  - Status: rejected_by_admin
  - Notifikasi ke mahasiswa & dosen
  - Approval reset

#### TC-ADM-006: Jadwalkan Seminar
- **Precondition**: Pengajuan sudah diverifikasi
- **Input**:
  - Pilih pengajuan
  - Pilih tanggal dari irisan tanggal dosen
  - Pilih ruangan
  - Set waktu mulai & selesai
- **Expected**:
  - Jadwal tersimpan
  - Status: scheduled
  - Notifikasi ke mahasiswa & dosen
  - Muncul di kalender

#### TC-ADM-007: Check Konflik Jadwal
- **Precondition**: Mencoba jadwalkan dengan waktu/ruangan conflict
- **Expected**:
  - Warning konflik ruangan
  - Warning konflik dosen
  - Sistem prevent double booking
  - Saran jadwal alternatif

#### TC-ADM-008: Generate QR Code
- **Precondition**: Seminar sudah dijadwalkan
- **Expected**:
  - QR Code unik ter-generate
  - QR berisi: seminar_id, tanggal, token
  - Bisa download PNG
  - Bisa print langsung
  - QR tersimpan di database

#### TC-ADM-009: View QR Code List
- **Precondition**: Ada seminar yang sudah di-generate QR
- **Expected**:
  - List seminar dengan QR
  - Preview QR code
  - Re-generate QR (jika perlu)
  - Download batch QR

#### TC-ADM-010: View Kehadiran
- **Precondition**: Seminar sudah dilaksanakan
- **Expected**:
  - List kehadiran per seminar
  - Status: Mahasiswa (scan QR)
  - Status: Dosen Pembimbing 1, 2, Penguji
  - Waktu check-in
  - Koordinat GPS (optional)

#### TC-ADM-011: Export Laporan Kehadiran
- **Precondition**: Ada data kehadiran
- **Input**: 
  - Filter: tanggal, jenis seminar, status
  - Format: PDF/Excel
- **Expected**:
  - Generate report
  - Download file
  - Format sesuai template
  - Include statistik

#### TC-ADM-012: Manage Ruangan
- **Precondition**: Admin sudah login
- **Expected**:
  - List ruangan tersedia
  - Kapasitas ruangan
  - Fasilitas
  - Status (available/maintenance)
  - CRUD ruangan

#### TC-ADM-013: View Analytics
- **Expected**:
  - Chart seminar per bulan
  - Persentase approval
  - Tingkat kehadiran
  - Dosen tersibuk
  - Mahasiswa terbanyak seminar

---

## ✅ Checklist Testing

### Pre-Testing Setup
- [ ] Database sudah di-seed dengan TestUsersSeeder
- [ ] Laravel server running (php artisan serve)
- [ ] Frontend server running (npm run dev)
- [ ] Browser console terbuka untuk monitoring error
- [ ] Network tab terbuka untuk monitoring API calls
- [ ] Postman/Thunder Client ready (untuk API testing)

### Testing Environment
- [ ] Clear browser cache
- [ ] Clear localStorage
- [ ] Test di browser berbeda (Chrome, Firefox, Edge)
- [ ] Test responsiveness (mobile view)

### Functional Testing

#### Authentication
- [ ] Login Mahasiswa berhasil
- [ ] Login Dosen berhasil
- [ ] Login Admin berhasil
- [ ] Login dengan kredensial salah (error handling)
- [ ] Logout berhasil clear session
- [ ] Token expired handling
- [ ] Protected route redirect ke login

#### Mahasiswa Features
- [ ] Dashboard load dengan data benar
- [ ] Form pengajuan seminar (validasi)
- [ ] Upload dokumen berhasil
- [ ] View status seminar real-time
- [ ] View jadwal seminar
- [ ] Scan QR code (web camera)
- [ ] Upload QR code (file upload)
- [ ] View revisi dari dosen
- [ ] Update status revisi
- [ ] Upload bukti revisi
- [ ] Notifikasi real-time

#### Dosen Features
- [ ] Dashboard load dengan statistik
- [ ] View pengajuan pending
- [ ] Approve dengan tanggal ketersediaan
- [ ] Reject dengan catatan
- [ ] View detail dokumen seminar
- [ ] View jadwal seminar (kalender)
- [ ] Check-in kehadiran
- [ ] Buat revisi untuk mahasiswa
- [ ] View revisi yang sudah dikerjakan
- [ ] Approve revisi
- [ ] View history seminar
- [ ] Notifikasi real-time

#### Admin Features
- [ ] Dashboard dengan full statistics
- [ ] View pengajuan untuk verifikasi
- [ ] Verifikasi pengajuan
- [ ] Reject pengajuan dengan alasan
- [ ] Jadwalkan seminar (date picker)
- [ ] Check konflik jadwal/ruangan
- [ ] Generate QR Code
- [ ] Download QR Code
- [ ] Print QR Code
- [ ] View daftar kehadiran
- [ ] Export laporan PDF
- [ ] Export laporan Excel
- [ ] View analytics & charts

### Integration Testing
- [ ] Mahasiswa ajukan → Dosen terima notifikasi
- [ ] Dosen approve → Admin terima notifikasi
- [ ] Admin jadwalkan → Mahasiswa & Dosen terima notifikasi
- [ ] Mahasiswa scan QR → Data tercatat di admin
- [ ] Dosen buat revisi → Mahasiswa terima notifikasi
- [ ] Mahasiswa selesai revisi → Dosen terima notifikasi
- [ ] Multi-user concurrent access
- [ ] Real-time update antar user

### Performance Testing
- [ ] Login response < 2s
- [ ] Dashboard load < 3s
- [ ] API response < 1s
- [ ] Upload dokumen < 5s
- [ ] Generate QR < 2s
- [ ] Scan QR < 1s
- [ ] Notifikasi real-time (instant)

### Security Testing
- [ ] SQL Injection prevention
- [ ] XSS prevention
- [ ] CSRF token validation
- [ ] Authorization check (role-based)
- [ ] File upload validation (type, size)
- [ ] Password hashing (bcrypt)
- [ ] Token expiration
- [ ] API rate limiting

### UI/UX Testing
- [ ] Responsive di mobile (320px - 768px)
- [ ] Responsive di tablet (768px - 1024px)
- [ ] Responsive di desktop (> 1024px)
- [ ] Loading states (skeleton/spinner)
- [ ] Error messages jelas
- [ ] Success messages informatif
- [ ] Form validation real-time
- [ ] Accessible (keyboard navigation)
- [ ] Color contrast (WCAG)
- [ ] Icons & labels jelas

### Error Handling
- [ ] Network error (offline)
- [ ] Server error (500)
- [ ] Not found (404)
- [ ] Unauthorized (401)
- [ ] Validation error (422)
- [ ] Timeout error
- [ ] File too large
- [ ] Invalid file type
- [ ] Duplicate submission prevention

---

## 🐛 Bug Tracking Template

Jika menemukan bug, catat dengan format:

```
BUG-ID: [MHS/DSN/ADM]-[NO]
Title: [Judul singkat bug]
Severity: [Critical/High/Medium/Low]
Steps to Reproduce:
1. ...
2. ...
3. ...
Expected Result: ...
Actual Result: ...
Screenshot: [Link atau attach]
Browser: [Chrome/Firefox/etc + version]
Console Error: [Copy paste error]
Status: [Open/In Progress/Fixed/Closed]
```

---

## 📊 Test Report Template

Setelah testing selesai, buat laporan:

```
Test Session: [Tanggal]
Tester: [Nama]
Environment: [Development/Staging/Production]

Summary:
- Total Test Cases: X
- Passed: Y
- Failed: Z
- Blocked: W
- Pass Rate: XX%

Critical Issues: [List]
High Priority Issues: [List]
Medium Priority Issues: [List]
Low Priority Issues: [List]

Recommendations:
- ...
- ...

Next Steps:
- ...
- ...
```

---

## 🎯 Testing Priority

### Priority 1 (MUST PASS)
1. Authentication untuk semua role
2. Pengajuan seminar oleh mahasiswa
3. Approval oleh dosen
4. Penjadwalan oleh admin
5. QR Code generation & scan

### Priority 2 (SHOULD PASS)
1. Notifikasi real-time
2. Revisi management
3. Kehadiran tracking
4. Export laporan
5. Dashboard statistics

### Priority 3 (NICE TO HAVE)
1. Analytics & charts
2. Search & filter
3. Batch operations
4. Mobile responsiveness
5. Accessibility features

---

## 📞 Support

Jika ada masalah saat testing:
1. Check console browser untuk error
2. Check network tab untuk failed API calls
3. Check Laravel log: `storage/logs/laravel.log`
4. Restart server jika perlu
5. Clear cache & refresh

---

**Last Updated**: 6 Desember 2025
**Version**: 1.0
**Status**: Ready for Testing
