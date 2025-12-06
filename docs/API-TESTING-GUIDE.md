# API TESTING GUIDE - Quick Reference

## 🔧 SETUP AWAL

```bash
# 1. Run migrations
php artisan migrate

# 2. Clear cache
php artisan cache:clear
php artisan route:clear
php artisan config:clear

# 3. Start server
php artisan serve
```

---

## 📡 NEW API ENDPOINTS

### 1️⃣ DOSEN - Approval History
**Endpoint**: `GET /api/dosen/approvals/seminar/{seminarId}/history`

**Test Command**:
```bash
curl -X GET "http://localhost:8000/api/dosen/approvals/seminar/1/history" \
  -H "Authorization: Bearer {dosen_token}" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "message": "Approval history retrieved successfully",
  "data": [
    {
      "id": 1,
      "dosen_name": "Dr. Ahmad Wijaya",
      "action": "Disetujui",
      "role": "Pembimbing 1",
      "catatan": "Proposal sudah bagus",
      "created_at": "06 Des 2025 10:30"
    }
  ]
}
```

---

### 2️⃣ ADMIN - Download QR Code
**Endpoint**: `GET /api/admin/qr-codes/{scheduleId}/download`

**Test Command**:
```bash
curl -X GET "http://localhost:8000/api/admin/qr-codes/1/download" \
  -H "Authorization: Bearer {admin_token}" \
  -o qr_seminar.png
```

**Expected**: File PNG terdownload dengan nama `QR_Seminar_{id}_{npm}.png`

---

### 3️⃣ MAHASISWA - Scan QR Attendance
**Endpoint**: `POST /api/mahasiswa/attendance/scan-qr`

**Request Body**:
```json
{
  "qr_token": "9c7f8d2a-3b1e-4f6a-a9d8-1e2f3a4b5c6d"
}
```

**Test Command**:
```bash
curl -X POST "http://localhost:8000/api/mahasiswa/attendance/scan-qr" \
  -H "Authorization: Bearer {mahasiswa_token}" \
  -H "Content-Type: application/json" \
  -d '{"qr_token": "9c7f8d2a-3b1e-4f6a-a9d8-1e2f3a4b5c6d"}'
```

**Expected Response**:
```json
{
  "message": "Absensi berhasil dicatat! Anda hadir tepat waktu.",
  "data": {
    "id": 1,
    "seminar_title": "Sistem Rekomendasi Buku Berbasis Machine Learning",
    "ruangan": "Ruang Seminar 301",
    "waktu_absen": "06 Des 2025 09:05",
    "metode_absen": "qr",
    "status": "present",
    "status_display": "Hadir"
  }
}
```

**Error Responses**:
```json
// QR tidak valid
{
  "message": "QR Code tidak valid atau tidak ditemukan"
}

// Sudah absen
{
  "message": "Anda sudah melakukan absensi untuk seminar ini",
  "data": {
    "waktu_absen": "06 Des 2025 09:05",
    "metode_absen": "qr"
  }
}

// Waktu tidak valid
{
  "message": "Absensi belum dibuka. Seminar dimulai dalam 30 menit",
  "valid_time_range": {
    "start": "06 Des 2025 08:45",
    "end": "06 Des 2025 10:30"
  }
}
```

---

### 4️⃣ DOSEN - Check-in
**Endpoint**: `POST /api/dosen/seminars/check-in`

**Request Body**:
```json
{
  "seminar_schedule_id": 1
}
```

**Test Command**:
```bash
curl -X POST "http://localhost:8000/api/dosen/seminars/check-in" \
  -H "Authorization: Bearer {dosen_token}" \
  -H "Content-Type: application/json" \
  -d '{"seminar_schedule_id": 1}'
```

**Expected Response**:
```json
{
  "message": "Check-in berhasil dicatat",
  "data": {
    "id": 1,
    "seminar_title": "Sistem Rekomendasi Buku Berbasis Machine Learning",
    "role": "pembimbing1",
    "role_display": "Pembimbing 1",
    "ruangan": "Ruang Seminar 301",
    "confirmed_at": "06 Des 2025 09:00",
    "status": "hadir"
  }
}
```

---

### 5️⃣ DOSEN - Attendance History
**Endpoint**: `GET /api/dosen/attendance/history`

**Test Command**:
```bash
curl -X GET "http://localhost:8000/api/dosen/attendance/history" \
  -H "Authorization: Bearer {dosen_token}" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "message": "Attendance history retrieved successfully",
  "data": {
    "total": 5,
    "attendances": [
      {
        "id": 1,
        "seminar_title": "Sistem Rekomendasi Buku",
        "mahasiswa_name": "Andi Prasetyo",
        "mahasiswa_npm": "2021001",
        "role": "Pembimbing 1",
        "status": "Hadir",
        "ruangan": "Ruang Seminar 301",
        "tanggal_seminar": "06 Des 2025",
        "waktu_seminar": "09:00",
        "confirmed_at": "06 Des 2025 09:00"
      }
    ]
  }
}
```

---

### 6️⃣ ADMIN - Complete Attendance Report
**Endpoint**: `GET /api/admin/attendances/schedule/{scheduleId}/report`

**Test Command**:
```bash
curl -X GET "http://localhost:8000/api/admin/attendances/schedule/1/report" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "message": "Complete attendance report retrieved successfully",
  "data": {
    "seminar_info": {
      "id": 1,
      "judul": "Sistem Rekomendasi Buku Berbasis Machine Learning",
      "jenis_seminar": "Seminar Proposal",
      "mahasiswa_presenter": "Andi Prasetyo",
      "npm_presenter": "2021001",
      "ruangan": "Ruang Seminar 301",
      "tanggal": "06 Des 2025",
      "waktu": "09:00 - 10:30"
    },
    "dosen_team": {
      "pembimbing1": {
        "name": "Dr. Ahmad Wijaya",
        "status": "Hadir",
        "waktu": "06 Des 2025 09:00"
      },
      "pembimbing2": {
        "name": "Dr. Siti Nurhaliza",
        "status": "Hadir",
        "waktu": "06 Des 2025 09:05"
      },
      "penguji": {
        "name": "Prof. Budi Santoso",
        "status": "Hadir",
        "waktu": "06 Des 2025 09:10"
      }
    },
    "mahasiswa_attendances": [
      {
        "id": 1,
        "name": "Budi Santoso",
        "npm": "2021002",
        "waktu_absen": "06 Des 2025 09:15",
        "metode_absen": "qr",
        "status": "present"
      },
      {
        "id": 2,
        "name": "Citra Dewi",
        "npm": "2021003",
        "waktu_absen": "06 Des 2025 09:20",
        "metode_absen": "qr",
        "status": "late"
      }
    ],
    "statistics": {
      "total_mahasiswa": 15,
      "total_dosen": 3,
      "qr_attendance": 13,
      "manual_attendance": 2
    }
  }
}
```

---

### 7️⃣ ADMIN - Export PDF
**Endpoint**: `GET /api/admin/attendances/schedule/{scheduleId}/export-pdf`

**Browser Test**:
```
http://localhost:8000/api/admin/attendances/schedule/1/export-pdf
```

**cURL Test**:
```bash
curl -X GET "http://localhost:8000/api/admin/attendances/schedule/1/export-pdf" \
  -H "Authorization: Bearer {admin_token}" \
  -o laporan_kehadiran.pdf
```

**Expected**: PDF file downloaded dengan nama `Kehadiran_Seminar_{id}_{npm}.pdf`

---

## 🔍 DEBUGGING HELPERS

### Get QR Token from Database
```sql
SELECT id, seminar_id, qr_code_path, waktu_mulai 
FROM seminar_schedules 
WHERE id = 1;
```

### Check Approval History
```sql
SELECT ah.*, d.name as dosen_name, s.judul 
FROM approval_histories ah
JOIN users d ON ah.dosen_id = d.id
JOIN seminars s ON ah.seminar_id = s.id
ORDER BY ah.created_at DESC;
```

### Check Attendance Records
```sql
SELECT sa.*, u.name, u.npm, ss.waktu_mulai
FROM seminar_attendances sa
JOIN users u ON sa.mahasiswa_id = u.id
JOIN seminar_schedules ss ON sa.seminar_schedule_id = ss.id
ORDER BY sa.waktu_absen DESC;
```

### Check Dosen Attendance
```sql
SELECT da.*, u.name, ss.waktu_mulai, s.judul
FROM dosen_attendances da
JOIN users u ON da.dosen_id = u.id
JOIN seminar_schedules ss ON da.seminar_schedule_id = ss.id
JOIN seminars s ON ss.seminar_id = s.id
ORDER BY da.confirmed_at DESC;
```

---

## ⚠️ COMMON ERRORS & SOLUTIONS

### Error: "Unauthenticated"
**Cause**: Token expired atau tidak valid  
**Solution**: Login ulang untuk dapat token baru

### Error: "QR Code tidak valid"
**Cause**: Token di request tidak match dengan database  
**Debug**: Check `qr_code_path` di tabel `seminar_schedules`

### Error: "Waktu absensi sudah berakhir"
**Cause**: Request dilakukan di luar window waktu (15 menit sebelum - 60 menit setelah)  
**Solution**: Adjust waktu_mulai di schedule atau tunggu jadwal berikutnya

### Error: "Anda tidak terlibat dalam seminar ini"
**Cause**: Dosen yang check-in bukan pembimbing/penguji di seminar tersebut  
**Debug**: 
```sql
SELECT pembimbing1_id, pembimbing2_id, penguji_id 
FROM seminars 
WHERE id = (SELECT seminar_id FROM seminar_schedules WHERE id = {scheduleId});
```

---

## 🧪 POSTMAN COLLECTION

Import JSON berikut ke Postman:

```json
{
  "info": {
    "name": "Sistem Seminar - New Endpoints",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Dosen - Approval History",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{dosen_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/dosen/approvals/seminar/1/history",
          "host": ["{{base_url}}"],
          "path": ["api", "dosen", "approvals", "seminar", "1", "history"]
        }
      }
    },
    {
      "name": "Mahasiswa - Scan QR",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{mahasiswa_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"qr_token\": \"{{qr_token}}\"}"
        },
        "url": {
          "raw": "{{base_url}}/api/mahasiswa/attendance/scan-qr",
          "host": ["{{base_url}}"],
          "path": ["api", "mahasiswa", "attendance", "scan-qr"]
        }
      }
    },
    {
      "name": "Dosen - Check-in",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{dosen_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"seminar_schedule_id\": 1}"
        },
        "url": {
          "raw": "{{base_url}}/api/dosen/seminars/check-in",
          "host": ["{{base_url}}"],
          "path": ["api", "dosen", "seminars", "check-in"]
        }
      }
    },
    {
      "name": "Admin - Complete Report",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/admin/attendances/schedule/1/report",
          "host": ["{{base_url}}"],
          "path": ["api", "admin", "attendances", "schedule", "1", "report"]
        }
      }
    },
    {
      "name": "Admin - Download QR",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/admin/qr-codes/1/download",
          "host": ["{{base_url}}"],
          "path": ["api", "admin", "qr-codes", "1", "download"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000"
    },
    {
      "key": "mahasiswa_token",
      "value": "your_mahasiswa_token_here"
    },
    {
      "key": "dosen_token",
      "value": "your_dosen_token_here"
    },
    {
      "key": "admin_token",
      "value": "your_admin_token_here"
    },
    {
      "key": "qr_token",
      "value": "uuid-from-database"
    }
  ]
}
```

---

## ✅ TESTING WORKFLOW

### Complete Test Flow:

1. **Setup**
   ```bash
   php artisan migrate
   php artisan serve
   ```

2. **Login as Mahasiswa**
   ```bash
   curl -X POST http://localhost:8000/api/login \
     -H "Content-Type: application/json" \
     -d '{"email": "andi@student.univ.ac.id", "password": "mhs123"}'
   ```

3. **Login as Dosen**
   ```bash
   curl -X POST http://localhost:8000/api/dosen/login \
     -H "Content-Type: application/json" \
     -d '{"email": "ahmad.wijaya@univ.ac.id", "password": "dosen123"}'
   ```

4. **Login as Admin**
   ```bash
   curl -X POST http://localhost:8000/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@univ.ac.id", "password": "admin123"}'
   ```

5. **Test Semua Endpoint** (gunakan token dari response login)

---

**End of Testing Guide**  
Generated: 06 December 2025
