# ✅ Test Checklist - Simple Version

**Date**: _____________
**Tester**: _____________

## Pre-Test Setup
- [ ] Laravel server running di port 8000
- [ ] Frontend server running di port 3001  
- [ ] Database sudah di-seed (7 users)
- [ ] Browser console terbuka (F12)
- [ ] Siapkan file PDF untuk upload

---

## 🎯 Test Scenario 1: Full Workflow (30 menit)

### Step 1: Mahasiswa Ajukan Seminar ⏱️ 5 menit
- [ ] **Login**: `andi@student.univ.ac.id` / `mhs123`
- [ ] Dashboard tampil nama & NPM: **Andi Prasetyo (2021001)** / NPM BELOM TAMPIL
- [ ] Klik menu **"Seminar & Revisi"**
- [ ] Klik **"Ajukan Seminar Baru"**
- [ ] Isi form:
  - Jenis: **Proposal** ✓
  - Judul: **"Sistem Rekomendasi Buku Berbasis Machine Learning"**
  - Deskripsi: _(min 50 karakter)_
  - Pembimbing 1: **Dr. Ahmad Wijaya**
  - Pembimbing 2: **Dr. Siti Nurhaliza**
  - Penguji: **Prof. Budi Santoso**
  - Upload: _(file PDF)_
- [ ] Klik **Submit**
- [ ] Notifikasi success muncul ✓
- [ ] Status seminar: **"pending"** di list
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 2: Dosen Pembimbing 1 Approve ⏱️ 3 menit
- [ ] **Login**: `ahmad.wijaya@univ.ac.id` / `dosen123`
- [ ] Ada notifikasi baru (badge count > 0)
- [ ] Klik **"Persetujuan"**
- [ ] Lihat pengajuan dari **Andi Prasetyo**
- [ ] Klik detail pengajuan
- [ ] Klik **"Approve"**
- [ ] Input 3 tanggal ketersediaan:
  - **10 Des 2025, 09:00** ✓
  - **11 Des 2025, 13:00** ✓
  - **12 Des 2025, 10:00** ✓
- [ ] Submit approval
- [ ] Status berubah di history
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 3: Dosen Pembimbing 2 Approve ⏱️ 3 menit
- [ ] **Login**: `siti.nurhaliza@univ.ac.id` / `dosen123`
- [ ] Ada notifikasi baru
- [ ] Klik **"Persetujuan"**
- [ ] Approve dengan tanggal:
  - **10 Des 2025, 09:00** ✓
  - **12 Des 2025, 10:00** ✓
  - **13 Des 2025, 14:00** ✓
- [ ] Submit
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 4: Dosen Penguji Approve ⏱️ 3 menit
- [ ] **Login**: `budi.santoso@univ.ac.id` / `dosen123`
- [ ] Ada notifikasi baru
- [ ] Klik **"Persetujuan"**
- [ ] Approve dengan tanggal:
  - **10 Des 2025, 09:00** ✓
  - **12 Des 2025, 10:00** ✓
- [ ] Submit
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 5: Admin Verifikasi ⏱️ 3 menit
- [ ] **Login**: `admin@univ.ac.id` / `admin123`
- [ ] Ada notifikasi (pengajuan siap verifikasi)
- [ ] Dashboard tampil statistik
- [ ] Klik **"Verifikasi"**
- [ ] Lihat pengajuan **Andi Prasetyo**
- [ ] Status approval: **3/3 dosen approved** ✓
- [ ] Klik **"Verifikasi"**
- [ ] Konfirmasi verifikasi
- [ ] Status berubah: **"verified"**
- [ ] Jangan logout

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 6: Admin Jadwalkan ⏱️ 4 menit
- [ ] Klik menu **"Penjadwalan"**
- [ ] Lihat pengajuan yang sudah diverifikasi
- [ ] Klik **"Jadwalkan"** pada pengajuan Andi
- [ ] Modal/form penjadwalan terbuka
- [ ] Pilih tanggal: **10 Desember 2025, 09:00** ✓ _(irisan tanggal ketiga dosen)_
- [ ] Pilih ruangan: **Ruang Seminar 301**
- [ ] Submit jadwal
- [ ] Notifikasi success
- [ ] Jadwal muncul di kalender
- [ ] Jangan logout

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 7: Admin Generate QR ⏱️ 3 menit
- [ ] Klik menu **"Kode QR"**
- [ ] Cari seminar **Andi Prasetyo**
- [ ] Klik **"Generate QR Code"**
- [ ] QR Code muncul
- [ ] Klik **"Download QR"**
- [ ] File QR tersimpan di folder Downloads
- [ ] Preview QR tampil
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 8: Mahasiswa Scan QR ⏱️ 3 menit
- [ ] **Login**: `andi@student.univ.ac.id` / `mhs123`
- [ ] Ada notifikasi jadwal baru
- [ ] Dashboard tampil jadwal mendatang
- [ ] Klik menu **"Scan QR"**
- [ ] Klik **"Upload QR"** atau gunakan kamera
- [ ] Upload file QR yang sudah di-download
- [ ] QR berhasil di-scan
- [ ] Notifikasi: **"Check-in berhasil!"** ✓
- [ ] Status kehadiran: **"Hadir"**
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 9: Dosen Check-in ⏱️ 2 menit
- [ ] **Login**: `ahmad.wijaya@univ.ac.id` / `dosen123`
- [ ] Klik menu **"Jadwal"**
- [ ] Lihat seminar hari ini
- [ ] Klik detail seminar Andi
- [ ] Klik **"Check-in"**
- [ ] Status kehadiran tercatat
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 10: Admin Cek Kehadiran ⏱️ 3 menit
- [ ] **Login**: `admin@univ.ac.id` / `admin123`
- [ ] Klik menu **"Kehadiran"**
- [ ] Pilih seminar **Andi Prasetyo**
- [ ] Daftar kehadiran tampil:
  - **Mahasiswa: Hadir** ✓ _(scan QR)_
  - **Pembimbing 1: Hadir** ✓
  - **Pembimbing 2: -**
  - **Penguji: -**
- [ ] Waktu check-in tercatat
- [ ] Klik **"Export PDF"** _(optional)_
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

## 🎯 Test Scenario 2: Revisi Flow (10 menit)

### Step 11: Dosen Buat Revisi ⏱️ 4 menit
- [ ] **Login**: `ahmad.wijaya@univ.ac.id` / `dosen123`
- [ ] Klik **"Seminar & Revisi"**
- [ ] Klik seminar Andi (yang sudah selesai)
- [ ] Klik **"Buat Revisi"**
- [ ] Tambah item revisi:
  - Item 1: "Perbaiki abstrak pada halaman 2"
  - Item 2: "Tambahkan diagram use case di BAB 3"
  - Item 3: "Lengkapi daftar pustaka"
- [ ] Tambah catatan untuk admin _(optional)_
- [ ] Submit revisi
- [ ] Notifikasi success
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 12: Mahasiswa Kerjakan Revisi ⏱️ 4 menit
- [ ] **Login**: `andi@student.univ.ac.id` / `mhs123`
- [ ] Ada notifikasi revisi baru
- [ ] Klik **"Seminar & Revisi"**
- [ ] Klik detail seminar
- [ ] Lihat daftar revisi dari dosen
- [ ] Tandai Item 1 sebagai **"Selesai"**
- [ ] Upload bukti perbaikan _(optional)_
- [ ] Tandai Item 2 sebagai **"Selesai"**
- [ ] Tandai Item 3 sebagai **"Selesai"**
- [ ] Submit semua revisi
- [ ] Progress bar: **100%** ✓
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 13: Dosen Approve Revisi ⏱️ 2 menit
- [ ] **Login**: `ahmad.wijaya@univ.ac.id` / `dosen123`
- [ ] Ada notifikasi revisi selesai
- [ ] Klik **"Seminar & Revisi"**
- [ ] Buka seminar Andi
- [ ] Review revisi yang sudah dikerjakan
- [ ] Lihat bukti perbaikan
- [ ] Approve semua revisi
- [ ] Status: **"Revisi Approved"** ✓
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

## 🎯 Test Scenario 3: Rejection Flow (5 menit)

### Step 14: Mahasiswa Ajukan Seminar Kedua ⏱️ 2 menit
- [ ] **Login**: `dewi@student.univ.ac.id` / `mhs123`
- [ ] Ajukan seminar (Hasil)
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 15: Dosen Reject ⏱️ 2 menit
- [ ] **Login**: `ahmad.wijaya@univ.ac.id` / `dosen123`
- [ ] Buka pengajuan dari Dewi
- [ ] Klik **"Reject"**
- [ ] Input catatan: **"Dokumen belum lengkap, upload lampiran A dan B"**
- [ ] Submit rejection
- [ ] Status: **"rejected"**
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

### Step 16: Mahasiswa Cek Rejection ⏱️ 1 menit
- [ ] **Login**: `dewi@student.univ.ac.id` / `mhs123`
- [ ] Ada notifikasi penolakan
- [ ] Baca catatan penolakan
- [ ] Status seminar: **"rejected"** dengan alasan jelas
- [ ] **Logout**

**✅ PASS | ❌ FAIL** | Notes: _______________________

---

## 📊 Test Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Login (all roles) | ⬜ PASS ⬜ FAIL | |
| Mahasiswa Ajukan | ⬜ PASS ⬜ FAIL | |
| Dosen Approve | ⬜ PASS ⬜ FAIL | |
| Admin Verifikasi | ⬜ PASS ⬜ FAIL | |
| Admin Jadwalkan | ⬜ PASS ⬜ FAIL | |
| Generate QR | ⬜ PASS ⬜ FAIL | |
| Scan QR | ⬜ PASS ⬜ FAIL | |
| Check-in Dosen | ⬜ PASS ⬜ FAIL | |
| View Kehadiran | ⬜ PASS ⬜ FAIL | |
| Buat Revisi | ⬜ PASS ⬜ FAIL | |
| Kerjakan Revisi | ⬜ PASS ⬜ FAIL | |
| Approve Revisi | ⬜ PASS ⬜ FAIL | |
| Rejection Flow | ⬜ PASS ⬜ FAIL | |
| Notifikasi | ⬜ PASS ⬜ FAIL | |

---

## 🐛 Bugs Found

1. **Bug ID**: __________ | **Severity**: __________ | **Description**: __________
2. **Bug ID**: __________ | **Severity**: __________ | **Description**: __________
3. **Bug ID**: __________ | **Severity**: __________ | **Description**: __________

---

## ✅ Overall Result

- **Total Tests**: 16
- **Passed**: _____ / 16
- **Failed**: _____ / 16
- **Pass Rate**: _____ %

---

## 📝 Notes & Recommendations

_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________

---

## Signature

**Tester**: _________________ | **Date**: _________________ | **Sign**: _________________
