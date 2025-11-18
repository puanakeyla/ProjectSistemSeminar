<?php

use App\Models\SeminarApproval;
use App\Models\Seminar;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Approve all pending approvals with common dates
$approvals = SeminarApproval::where('status', 'pending')->get();

foreach ($approvals as $approval) {
    $approval->update([
        'status' => 'approved',
        'available_dates' => ['2025-11-20', '2025-11-21', '2025-11-22', '2025-11-25'],
        'approved_at' => now(),
    ]);
}

echo "✅ Approved {$approvals->count()} approvals with available dates\n";

// Verify all seminars that have all 3 approvals
$seminars = Seminar::whereHas('approvals', function($q) {
    $q->where('status', 'approved');
}, '=', 3)->get();

foreach ($seminars as $seminar) {
    $seminar->update([
        'verified_at' => now(),
    ]);
}

echo "✅ Verified {$seminars->count()} seminars (all 3 dosen approved)\n";
echo "\n📅 Common available dates: 2025-11-20, 2025-11-21, 2025-11-22, 2025-11-25\n";
