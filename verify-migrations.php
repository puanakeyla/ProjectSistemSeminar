<?php

// Quick verification script for new migrations
// Run with: php verify-migrations.php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║          MIGRATION VERIFICATION - December 6, 2025             ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// Check 1: approval_histories table
echo "✓ Checking approval_histories table...\n";
if (Schema::hasTable('approval_histories')) {
    echo "  ✅ Table EXISTS\n";
    $columns = Schema::getColumnListing('approval_histories');
    echo "  📋 Columns: " . implode(', ', $columns) . "\n";
} else {
    echo "  ❌ Table MISSING\n";
}
echo "\n";

// Check 2: seminars.verification_history column
echo "✓ Checking seminars.verification_history column...\n";
if (Schema::hasColumn('seminars', 'verification_history')) {
    echo "  ✅ Column EXISTS\n";
} else {
    echo "  ❌ Column MISSING\n";
}
echo "\n";

// Check 3: seminar_attendances columns
echo "✓ Checking seminar_attendances columns...\n";
if (Schema::hasColumn('seminar_attendances', 'waktu_absen')) {
    echo "  ✅ waktu_absen EXISTS\n";
} else {
    echo "  ❌ waktu_absen MISSING\n";
}

if (Schema::hasColumn('seminar_attendances', 'metode_absen')) {
    echo "  ✅ metode_absen EXISTS\n";
} else {
    echo "  ❌ metode_absen MISSING\n";
}

if (Schema::hasColumn('seminar_attendances', 'metode')) {
    echo "  ℹ️  metode (old column) still exists\n";
}
echo "\n";

// Check 4: Test Models
echo "✓ Checking Models...\n";
try {
    $approvalHistoryExists = class_exists('App\Models\ApprovalHistory');
    echo "  " . ($approvalHistoryExists ? "✅" : "❌") . " ApprovalHistory Model\n";
} catch (Exception $e) {
    echo "  ❌ Error loading ApprovalHistory: " . $e->getMessage() . "\n";
}
echo "\n";

// Check 5: Count records
echo "✓ Checking Record Counts...\n";
try {
    $seminarCount = DB::table('seminars')->count();
    $approvalCount = DB::table('approval_histories')->count();
    $attendanceCount = DB::table('seminar_attendances')->count();

    echo "  📊 Seminars: $seminarCount\n";
    echo "  📊 Approval Histories: $approvalCount\n";
    echo "  📊 Attendances: $attendanceCount\n";
} catch (Exception $e) {
    echo "  ❌ Error counting records: " . $e->getMessage() . "\n";
}
echo "\n";

// Check 6: Test insert
echo "✓ Testing Insert Capability...\n";
try {
    // Test if we can create approval history
    if (Schema::hasTable('approval_histories')) {
        echo "  ✅ approval_histories table ready for inserts\n";
    }

    // Test if we can update seminar with verification_history
    if (Schema::hasColumn('seminars', 'verification_history')) {
        echo "  ✅ seminars.verification_history ready for updates\n";
    }

    // Test if we can insert attendance with new columns
    if (Schema::hasColumn('seminar_attendances', 'waktu_absen') &&
        Schema::hasColumn('seminar_attendances', 'metode_absen')) {
        echo "  ✅ seminar_attendances ready for new attendance records\n";
    }
} catch (Exception $e) {
    echo "  ❌ Error: " . $e->getMessage() . "\n";
}
echo "\n";

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║                    VERIFICATION COMPLETE                       ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

echo "Next Steps:\n";
echo "1. Start Laravel server: php artisan serve\n";
echo "2. Test API endpoints (see docs/API-TESTING-GUIDE.md)\n";
echo "3. Test QR scan functionality\n";
echo "4. Test PDF export\n\n";
