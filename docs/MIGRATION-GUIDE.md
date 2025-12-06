# MIGRATION INSTRUCTIONS

## ⚠️ PENTING - BACA SEBELUM MIGRASI!

Dokumen ini berisi instruksi lengkap untuk menjalankan database migrations pada sistem seminar.

---

## 📋 PRE-MIGRATION CHECKLIST

Sebelum menjalankan migration, pastikan:

- [ ] Sudah backup database: `php artisan db:backup` (jika ada)
- [ ] Laravel server tidak sedang running
- [ ] Database connection sudah dikonfigurasi di `.env`
- [ ] Tidak ada pending changes di database

---

## 🔧 STEP-BY-STEP MIGRATION

### Step 1: Check Migration Status
```bash
php artisan migrate:status
```

**Expected Output**:
```
+------+-------------------------------------------------------+-------+
| Ran? | Migration                                             | Batch |
+------+-------------------------------------------------------+-------+
| Yes  | 0001_01_01_000000_create_users_table                  | 1     |
| Yes  | ...existing migrations...                             | ...   |
| No   | 2025_12_06_100000_add_verification_history_to_seminars| -     |
| No   | 2025_12_06_100001_create_approval_histories_table     | -     |
| No   | 2025_12_06_100002_update_seminar_attendances_fields   | -     |
+------+-------------------------------------------------------+-------+
```

### Step 2: Run New Migrations
```bash
php artisan migrate
```

**Expected Output**:
```
Migrating: 2025_12_06_100000_add_verification_history_to_seminars
Migrated:  2025_12_06_100000_add_verification_history_to_seminars (50.23ms)

Migrating: 2025_12_06_100001_create_approval_histories_table
Migrated:  2025_12_06_100001_create_approval_histories_table (75.45ms)

Migrating: 2025_12_06_100002_update_seminar_attendances_fields
Migrated:  2025_12_06_100002_update_seminar_attendances_fields (45.12ms)
```

### Step 3: Verify Tables Created
```bash
# For SQLite
sqlite3 database/database.sqlite ".tables"

# For MySQL
mysql -u root -p -e "SHOW TABLES FROM your_database_name;"
```

**Expected Tables (new ones)**:
- `approval_histories`

**Expected Columns Added**:
- `seminars.verification_history`
- `seminar_attendances.waktu_absen`

### Step 4: Check Table Structure

**Check approval_histories table**:
```sql
-- SQLite
sqlite3 database/database.sqlite "PRAGMA table_info(approval_histories);"

-- MySQL
DESCRIBE approval_histories;
```

**Expected Structure**:
```
| Column       | Type         | Null | Key | Default | Extra          |
|--------------|--------------|------|-----|---------|----------------|
| id           | bigint       | NO   | PRI | NULL    | auto_increment |
| seminar_id   | bigint       | NO   | MUL | NULL    |                |
| dosen_id     | bigint       | NO   | MUL | NULL    |                |
| action       | varchar(255) | NO   |     | NULL    |                |
| role         | varchar(255) | NO   |     | NULL    |                |
| catatan      | text         | YES  |     | NULL    |                |
| created_at   | timestamp    | YES  |     | NULL    |                |
| updated_at   | timestamp    | YES  |     | NULL    |                |
```

**Check seminars table**:
```sql
-- Check if verification_history column exists
SELECT verification_history FROM seminars LIMIT 1;
```

**Check seminar_attendances table**:
```sql
-- Check if waktu_absen column exists
SELECT waktu_absen, metode_absen FROM seminar_attendances LIMIT 1;
```

---

## 🚨 TROUBLESHOOTING

### Problem 1: "SQLSTATE[42S01]: Base table or view already exists"
**Cause**: Tabel sudah ada dari migration sebelumnya

**Solution**:
```bash
# Option A: Skip migration yang error
php artisan migrate --skip-failed

# Option B: Rollback dan run ulang
php artisan migrate:rollback --step=1
php artisan migrate
```

### Problem 2: "SQLSTATE[42S21]: Column already exists"
**Cause**: Column sudah ditambahkan sebelumnya

**Solution**:
```bash
# Check which columns exist
php artisan tinker
>>> Schema::hasColumn('seminars', 'verification_history')
>>> Schema::hasColumn('seminar_attendances', 'waktu_absen')
```

**If column exists**, edit migration file to add condition:
```php
if (!Schema::hasColumn('seminars', 'verification_history')) {
    $table->json('verification_history')->nullable();
}
```

### Problem 3: "Foreign key constraint error"
**Cause**: Referenced table/column tidak exist

**Solution**:
```bash
# Check foreign key constraints
php artisan tinker
>>> DB::select("PRAGMA foreign_keys"); // SQLite
>>> DB::select("SHOW CREATE TABLE approval_histories"); // MySQL

# Temporarily disable foreign key checks (MySQL)
DB::statement('SET FOREIGN_KEY_CHECKS=0;');
Schema::table('approval_histories', function($table) {
    // drop foreign keys
});
DB::statement('SET FOREIGN_KEY_CHECKS=1;');
```

### Problem 4: Migration Stuck/Timeout
**Cause**: Database lock atau query slow

**Solution**:
```bash
# Check database locks (SQLite)
sqlite3 database/database.sqlite ".timeout 10000"

# Increase PHP timeout
php -d max_execution_time=300 artisan migrate

# Run migration satu per satu
php artisan migrate --path=database/migrations/2025_12_06_100000_add_verification_history_to_seminars.php
```

---

## 🔄 ROLLBACK INSTRUCTIONS

Jika terjadi masalah dan perlu rollback:

### Rollback Last Batch
```bash
php artisan migrate:rollback
```

### Rollback Specific Steps
```bash
# Rollback 3 migrations terakhir
php artisan migrate:rollback --step=3
```

### Reset All Migrations (⚠️ DANGER - Will lose all data!)
```bash
php artisan migrate:reset
php artisan migrate
```

### Refresh All Migrations (⚠️ DANGER - Will lose all data!)
```bash
php artisan migrate:refresh
```

---

## ✅ POST-MIGRATION VERIFICATION

### 1. Test Insert to approval_histories
```php
php artisan tinker

use App\Models\ApprovalHistory;
use App\Models\Seminar;
use App\Models\User;

$seminar = Seminar::first();
$dosen = User::where('role', 'dosen')->first();

ApprovalHistory::create([
    'seminar_id' => $seminar->id,
    'dosen_id' => $dosen->id,
    'action' => 'approved',
    'role' => 'pembimbing1',
    'catatan' => 'Test approval history'
]);

echo "✅ Approval history created successfully!\n";
```

### 2. Test Update verification_history
```php
php artisan tinker

use App\Models\Seminar;

$seminar = Seminar::first();
$seminar->verification_history = [
    [
        'admin_id' => 1,
        'admin_name' => 'Admin Test',
        'action' => 'verified',
        'timestamp' => now()->toIso8601String()
    ]
];
$seminar->save();

echo "✅ Verification history updated successfully!\n";
```

### 3. Test Update waktu_absen
```php
php artisan tinker

use App\Models\SeminarAttendance;

$attendance = SeminarAttendance::first();
if ($attendance) {
    $attendance->waktu_absen = now();
    $attendance->metode_absen = 'qr';
    $attendance->save();
    echo "✅ Attendance waktu_absen updated successfully!\n";
} else {
    echo "⚠️ No attendance records found. Create test data first.\n";
}
```

### 4. Run Full System Test
```bash
# Test all endpoints
php artisan test --filter=SeminarWorkflowTest

# Or manual test via API
curl -X GET http://localhost:8000/api/test \
  -H "Authorization: Bearer {token}"
```

---

## 📊 MIGRATION SUMMARY

### Files Created:
1. `database/migrations/2025_12_06_100000_add_verification_history_to_seminars.php`
2. `database/migrations/2025_12_06_100001_create_approval_histories_table.php`
3. `database/migrations/2025_12_06_100002_update_seminar_attendances_fields.php`

### Tables Created:
- `approval_histories`

### Columns Added:
- `seminars.verification_history` (JSON, nullable)
- `seminar_attendances.waktu_absen` (TIMESTAMP, nullable)

### Foreign Keys Added:
- `approval_histories.seminar_id` → `seminars.id`
- `approval_histories.dosen_id` → `users.id`

### Indexes Added:
- `approval_histories(seminar_id, created_at)`

---

## 🎯 FINAL CHECKLIST

Setelah migration selesai, pastikan:

- [ ] Migration status shows all migrations as "Ran"
- [ ] New tables exist in database
- [ ] New columns accessible via Eloquent models
- [ ] Foreign key constraints working
- [ ] Test data dapat di-insert tanpa error
- [ ] API endpoints baru berfungsi normal
- [ ] No breaking changes di existing features

---

## 📞 SUPPORT

Jika mengalami masalah yang tidak tercantum di troubleshooting:

1. Check Laravel log: `storage/logs/laravel.log`
2. Check database log (jika ada)
3. Run dengan verbose mode: `php artisan migrate --verbose`
4. Cek dokumentasi Laravel: https://laravel.com/docs/10.x/migrations

---

**Migration Guide Completed**  
Generated: 06 December 2025  
Laravel Version: 10.48  
PHP Version: 8.3
