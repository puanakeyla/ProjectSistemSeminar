# QUICK TEST GUIDE - QR Scan Fixed

## ✅ PERBAIKAN YANG SUDAH DILAKUKAN:

### 1. **QR Scan Validation Fixed**
- ✅ Support `qr_token` DAN `qr_content` (backward compatible)
- ✅ Error message lebih jelas dengan debug token

### 2. **Time Validation REMOVED**
- ✅ Bisa scan QR **kapan saja** (tidak perlu tunggu waktu seminar)
- ✅ Status selalu "Hadir" (tidak ada "Terlambat")

### 3. **QR Download Enhanced**
- ✅ Added Content-Length header
- ✅ Added Content-Transfer-Encoding
- ✅ Better cache control headers

---

## 🧪 CARA TEST (PowerShell)

### Step 1: Login & Get Token
```powershell
# Login sebagai Mahasiswa
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"andi@student.univ.ac.id","password":"mhs123"}'

$token = $response.token
Write-Host "Token: $token"
```

### Step 2: Generate QR (Login sebagai Admin dulu)
```powershell
# Login Admin
$adminResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/admin/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@univ.ac.id","password":"admin123"}'

$adminToken = $adminResponse.token

# Generate QR untuk schedule ID 1
$qr = Invoke-RestMethod -Uri "http://localhost:8000/api/admin/qr-codes/generate/1" `
  -Method POST `
  -Headers @{Authorization="Bearer $adminToken"}

$qrToken = $qr.token
Write-Host "QR Token: $qrToken"
```

### Step 3: Test QR Scan (METODE 1 - qr_token)
```powershell
# Scan dengan qr_token
$scanResult = Invoke-RestMethod -Uri "http://localhost:8000/api/mahasiswa/attendance/scan-qr" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body "{`"qr_token`":`"$qrToken`"}"

Write-Host "Scan Result: $($scanResult.message)"
Write-Host $scanResult.data | ConvertTo-Json
```

### Step 4: Test QR Scan (METODE 2 - qr_content)
```powershell
# Scan dengan qr_content (backward compatible)
$scanResult2 = Invoke-RestMethod -Uri "http://localhost:8000/api/mahasiswa/attendance/scan-qr" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body "{`"qr_content`":`"$qrToken`"}"

Write-Host "Scan Result: $($scanResult2.message)"
```

### Step 5: Download QR Code
```powershell
# Method 1: Via PowerShell (auto download)
Invoke-WebRequest -Uri "http://localhost:8000/api/admin/qr-codes/1/download" `
  -Headers @{Authorization="Bearer $adminToken"} `
  -OutFile "QR_Seminar.png"

Write-Host "QR Downloaded to: QR_Seminar.png"

# Method 2: Via Browser (buka URL ini di browser saat sudah login admin)
# http://localhost:8000/api/admin/qr-codes/1/download
```

---

## 📋 EXPECTED RESULTS

### ✅ QR Scan Success:
```json
{
  "message": "Absensi berhasil dicatat!",
  "data": {
    "id": 1,
    "seminar_title": "Sistem Rekomendasi Buku Berbasis Machine Learning",
    "ruangan": "Ruang Seminar 301",
    "waktu_absen": "06 Des 2025 15:30",
    "metode_absen": "qr",
    "status": "present",
    "status_display": "Hadir"
  }
}
```

### ❌ Already Scanned:
```json
{
  "message": "Anda sudah melakukan absensi untuk seminar ini",
  "data": {
    "waktu_absen": "06 Des 2025 15:30",
    "metode_absen": "qr"
  }
}
```

### ❌ Invalid QR:
```json
{
  "message": "QR Code tidak valid atau tidak ditemukan",
  "debug_token": "xxx-invalid-token-xxx"
}
```

---

## 🔧 TROUBLESHOOTING

### Problem: "The qr token field is required"
**Solution**: Sekarang sudah fixed! Gunakan `qr_token` atau `qr_content`

### Problem: QR buka tab baru bukan download
**Frontend Fix** - Tambahkan di Axios request:
```javascript
// React/Vue Example
axios.get('/api/admin/qr-codes/1/download', {
  responseType: 'blob', // IMPORTANT!
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(response => {
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'QR_Seminar.png');
  document.body.appendChild(link);
  link.click();
  link.remove();
});
```

### Problem: Time validation masih ada
**Solved!** Time validation sudah dihapus di:
- `scanQRAttendance()` - dapat scan kapan saja
- `validateQR()` - QR valid kapan saja

---

## 🎯 QUICK TEST COMMANDS (Copy-Paste)

### Test 1: Login Mahasiswa
```powershell
$mhs = Invoke-RestMethod -Uri "http://localhost:8000/api/login" -Method POST -ContentType "application/json" -Body '{"email":"andi@student.univ.ac.id","password":"mhs123"}'; $mhs.token
```

### Test 2: Login Admin
```powershell
$adm = Invoke-RestMethod -Uri "http://localhost:8000/api/admin/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@univ.ac.id","password":"admin123"}'; $adm.token
```

### Test 3: Generate QR & Get Token
```powershell
$qr = Invoke-RestMethod -Uri "http://localhost:8000/api/admin/qr-codes/generate/1" -Method POST -Headers @{Authorization="Bearer $($adm.token)"}; $qr.token
```

### Test 4: Scan QR (dengan token dari step 3)
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/mahasiswa/attendance/scan-qr" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $($mhs.token)"} -Body "{`"qr_token`":`"$($qr.token)`"}"
```

### Test 5: Download QR
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/admin/qr-codes/1/download" -Headers @{Authorization="Bearer $($adm.token)"} -OutFile "QR_Test.png"
```

---

## 📊 VERIFICATION CHECKLIST

- [ ] QR scan dengan `qr_token` berhasil
- [ ] QR scan dengan `qr_content` berhasil (backward compatible)
- [ ] Dapat scan QR di luar waktu seminar
- [ ] Status selalu "Hadir" (bukan "Terlambat")
- [ ] QR download via PowerShell berhasil
- [ ] File QR tersimpan dengan nama yang benar
- [ ] Error message menampilkan token untuk debugging

---

**All Fixed!** 🎉
