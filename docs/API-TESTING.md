# 🔌 API Testing Collection

Gunakan Postman, Thunder Client, atau curl untuk testing API secara langsung.

## Base URL
```
http://127.0.0.1:8000/api
```

---

## 🔐 Authentication

### 1. Login Mahasiswa
```http
POST /login
Content-Type: application/json

{
  "email": "andi@student.univ.ac.id",
  "password": "mhs123"
}
```

**Expected Response:**
```json
{
  "message": "Login berhasil",
  "user": {
    "id": 5,
    "name": "Andi Prasetyo",
    "email": "andi@student.univ.ac.id",
    "role": "mahasiswa",
    "npm": "2021001"
  },
  "token": "1|xxxxxxxxxxxxxxxxxxxxx"
}
```

### 2. Login Dosen
```http
POST /login
Content-Type: application/json

{
  "email": "ahmad.wijaya@univ.ac.id",
  "password": "dosen123"
}
```

### 3. Login Admin
```http
POST /login
Content-Type: application/json

{
  "email": "admin@univ.ac.id",
  "password": "admin123"
}
```

### 4. Get Current User
```http
GET /user
Authorization: Bearer {token}
```

### 5. Logout
```http
POST /logout
Authorization: Bearer {token}
```

---

## 🎓 Mahasiswa Endpoints

### 1. Get Dashboard Stats
```http
GET /mahasiswa/dashboard
Authorization: Bearer {token}
```

### 2. Create Seminar
```http
POST /mahasiswa/seminars
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "jenis": "proposal",
  "judul": "Sistem Rekomendasi Buku Berbasis Machine Learning",
  "deskripsi": "Penelitian tentang implementasi collaborative filtering untuk sistem rekomendasi buku perpustakaan menggunakan algoritma machine learning",
  "dosen_pembimbing_1_id": 2,
  "dosen_pembimbing_2_id": 3,
  "dosen_penguji_id": 4,
  "dokumen": [file.pdf]
}
```

### 3. Get My Seminars
```http
GET /mahasiswa/seminars
Authorization: Bearer {token}
```

### 4. Get Seminar Detail
```http
GET /mahasiswa/seminars/{id}
Authorization: Bearer {token}
```

### 5. Scan QR Code
```http
POST /mahasiswa/attendance/scan
Authorization: Bearer {token}
Content-Type: application/json

{
  "qr_code": "encoded_qr_string"
}
```

### 6. Get My Revisions
```http
GET /mahasiswa/revisions
Authorization: Bearer {token}
```

### 7. Update Revision Item
```http
PUT /mahasiswa/revisions/{revision_id}/items/{item_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "selesai",
  "bukti": "link_atau_file"
}
```

---

## 👨‍🏫 Dosen Endpoints

### 1. Get Dashboard Stats
```http
GET /dosen/dashboard
Authorization: Bearer {token}
```

### 2. Get Pending Approvals
```http
GET /dosen/approvals/pending
Authorization: Bearer {token}
```

### 3. Get Approval Detail
```http
GET /dosen/approvals/{id}
Authorization: Bearer {token}
```

### 4. Approve Seminar
```http
PUT /dosen/approvals/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "approved",
  "available_dates": [
    "2025-12-10 09:00:00",
    "2025-12-11 13:00:00",
    "2025-12-12 10:00:00"
  ],
  "catatan": "Dokumen sudah lengkap"
}
```

### 5. Reject Seminar
```http
PUT /dosen/approvals/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "rejected",
  "catatan": "Dokumen belum lengkap, harap upload lampiran A dan B"
}
```

### 6. Get My Schedule
```http
GET /dosen/schedule
Authorization: Bearer {token}
```

### 7. Check-in Attendance
```http
POST /dosen/attendance/{seminar_schedule_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "hadir"
}
```

### 8. Get My Seminars
```http
GET /dosen/seminars
Authorization: Bearer {token}
```

### 9. Create Revision
```http
POST /dosen/seminars/{seminar_id}/revisions
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "item": "Perbaiki abstrak pada halaman 2",
      "keterangan": "Abstrak terlalu panjang, ringkas menjadi max 250 kata"
    },
    {
      "item": "Tambahkan diagram use case di BAB 3",
      "keterangan": "Jelaskan semua use case utama sistem"
    }
  ],
  "catatan_admin": "Revisi minor, mahasiswa bisa lanjut ke seminar hasil"
}
```

### 10. Approve Revision
```http
PUT /dosen/revisions/{revision_id}/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "approved"
}
```

---

## 👨‍💼 Admin Endpoints

### 1. Get Dashboard Stats
```http
GET /admin/dashboard
Authorization: Bearer {token}
```

### 2. Get Seminars for Verification
```http
GET /admin/verification/pending
Authorization: Bearer {token}
```

### 3. Verify Seminar
```http
PUT /admin/verification/{seminar_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "verified",
  "catatan": "Semua dokumen lengkap dan approval sesuai"
}
```

### 4. Reject Verification
```http
PUT /admin/verification/{seminar_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "rejected",
  "catatan": "Format dokumen tidak sesuai template"
}
```

### 5. Get Verified Seminars (for Scheduling)
```http
GET /admin/schedule/pending
Authorization: Bearer {token}
```

### 6. Schedule Seminar
```http
POST /admin/schedule
Authorization: Bearer {token}
Content-Type: application/json

{
  "seminar_id": 1,
  "tanggal": "2025-12-10",
  "waktu_mulai": "09:00:00",
  "waktu_selesai": "11:00:00",
  "ruangan": "Ruang Seminar 301"
}
```

### 7. Update Schedule
```http
PUT /admin/schedule/{schedule_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "tanggal": "2025-12-11",
  "waktu_mulai": "13:00:00",
  "waktu_selesai": "15:00:00",
  "ruangan": "Ruang Seminar 302"
}
```

### 8. Get All Schedules
```http
GET /admin/schedule
Authorization: Bearer {token}
```

**Query Parameters:**
- `date`: Filter by date (YYYY-MM-DD)
- `month`: Filter by month (YYYY-MM)
- `status`: Filter by status

### 9. Generate QR Code
```http
POST /admin/qr/generate/{schedule_id}
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "qr_code": "base64_encoded_image",
  "qr_data": "encrypted_seminar_data",
  "schedule_id": 1
}
```

### 10. Get QR Codes
```http
GET /admin/qr
Authorization: Bearer {token}
```

### 11. Get Attendance Report
```http
GET /admin/attendance/{schedule_id}
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "seminar": {
    "id": 1,
    "judul": "...",
    "mahasiswa": "...",
    "tanggal": "..."
  },
  "attendance": {
    "mahasiswa": {
      "status": "hadir",
      "waktu": "2025-12-10 08:55:00"
    },
    "pembimbing_1": {
      "status": "hadir",
      "waktu": "2025-12-10 09:00:00"
    },
    "pembimbing_2": {
      "status": "tidak_hadir",
      "waktu": null
    },
    "penguji": {
      "status": "hadir",
      "waktu": "2025-12-10 09:05:00"
    }
  }
}
```

### 12. Export Attendance (PDF)
```http
GET /admin/attendance/{schedule_id}/export?format=pdf
Authorization: Bearer {token}
```

### 13. Export Attendance (Excel)
```http
GET /admin/attendance/{schedule_id}/export?format=excel
Authorization: Bearer {token}
```

---

## 🔔 Notification Endpoints

### 1. Get My Notifications
```http
GET /notifications
Authorization: Bearer {token}
```

**Query Parameters:**
- `unread`: true/false (filter)
- `limit`: number (default 10)

### 2. Mark as Read
```http
PUT /notifications/{id}/read
Authorization: Bearer {token}
```

### 3. Mark All as Read
```http
PUT /notifications/read-all
Authorization: Bearer {token}
```

### 4. Delete Notification
```http
DELETE /notifications/{id}
Authorization: Bearer {token}
```

---

## 📊 Testing Curl Commands

### Quick Test Login Flow
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"andi@student.univ.ac.id","password":"mhs123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. Get User
curl -X GET http://127.0.0.1:8000/api/user \
  -H "Authorization: Bearer $TOKEN"

# 3. Get Dashboard
curl -X GET http://127.0.0.1:8000/api/mahasiswa/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### PowerShell Version
```powershell
# 1. Login
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"andi@student.univ.ac.id","password":"mhs123"}'

$token = $response.token
Write-Host "Token: $token"

# 2. Get User
$headers = @{
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/user" `
  -Method GET `
  -Headers $headers
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Seminar Flow
1. Login as Mahasiswa → Get token
2. Create Seminar → Get seminar_id
3. Login as Dosen 1 → Approve seminar
4. Login as Dosen 2 → Approve seminar
5. Login as Dosen 3 → Approve seminar
6. Login as Admin → Verify seminar
7. Admin → Schedule seminar → Get schedule_id
8. Admin → Generate QR code
9. Login as Mahasiswa → Scan QR
10. Login as Dosen → Check-in
11. Login as Admin → View attendance

### Scenario 2: Rejection Flow
1. Login as Mahasiswa → Create Seminar
2. Login as Dosen → Reject seminar
3. Login as Mahasiswa → Check rejection notification

### Scenario 3: Revision Flow
1. Login as Dosen → Create revision
2. Login as Mahasiswa → Update revision items
3. Login as Dosen → Approve revision

---

## 📝 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

---

## 🐛 Common Errors

### 1. Token Expired
```json
{
  "message": "Unauthenticated."
}
```
**Solution**: Login again to get new token

### 2. Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```
**Solution**: Check required fields

### 3. Unauthorized
```json
{
  "message": "Anda tidak memiliki akses."
}
```
**Solution**: Check user role

---

**Happy API Testing! 🚀**
