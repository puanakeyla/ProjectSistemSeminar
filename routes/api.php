<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Import Controller dengan rapi
// ==================================================

// Auth
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;

// Admin (Sudah benar pakai alias)
use App\Http\Controllers\Admin\AttendanceController as AdminAttendanceController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\QRController as AdminQRController;
use App\Http\Controllers\Admin\ScheduleController as AdminScheduleController;
use App\Http\Controllers\Admin\VerificationController as AdminVerificationController;

// Dosen (Sudah benar pakai alias)
use App\Http\Controllers\Dosen\ApprovalController;
use App\Http\Controllers\Dosen\DashboardController as DosenDashboardController;
use App\Http\Controllers\Dosen\RevisionController as DosenRevisionController;
use App\Http\Controllers\Dosen\SeminarController as DosenSeminarController;

// Mahasiswa (INI YANG DIPERBAIKI)
use App\Http\Controllers\Mahasiswa\AttendanceController as MahasiswaAttendanceController;
use App\Http\Controllers\Mahasiswa\DashboardController as MahasiswaDashboardController;
use App\Http\Controllers\Mahasiswa\RevisionController as MahasiswaRevisionController;
use App\Http\Controllers\Mahasiswa\SeminarController as MahasiswaSeminarController;

// Notification
use App\Http\Controllers\NotificationController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes - No authentication required
Route::post('/login', [LoginController::class, 'login']);
Route::post('/admin/login', [LoginController::class, 'adminLogin']);
Route::post('/dosen/login', [LoginController::class, 'dosenLogin']);

// Protected routes - Authentication required
Route::middleware('auth:sanctum')->group(function () {

    // Common auth routes
    Route::get('/user', [LoginController::class, 'user']);
    Route::post('/logout', [LogoutController::class, 'logout']);
    Route::post('/logout-all', [LogoutController::class, 'logoutAllDevices']);
    Route::get('/sessions', [LogoutController::class, 'sessions']);
    Route::delete('/sessions/{tokenId}', [LogoutController::class, 'revokeToken']);

    // Notifications (for all authenticated users)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Test route
    Route::get('/test', function (Request $request) {
        return response()->json([
            'message' => 'API SEMAR bekerja!',
            'user' => $request->user()->only(['id', 'name', 'email', 'role']),
            'timestamp' => now()->toDateTimeString()
        ]);
    });

    // ==================== MAHASISWA ROUTES (SUDAH DIPERBAIKI) ====================
    Route::prefix('mahasiswa')->middleware('role:mahasiswa')->group(function () {

        // Dashboard - with cache (2 minutes)
        Route::get('/dashboard', [MahasiswaDashboardController::class, 'index'])->middleware('cache.response:2');
        Route::get('/profile', [MahasiswaDashboardController::class, 'profile']);

        // Seminars
        Route::get('/seminars', [MahasiswaSeminarController::class, 'index']);
        Route::get('/seminars/{id}', [MahasiswaSeminarController::class, 'show']);
        Route::post('/seminars', [MahasiswaSeminarController::class, 'store']);
        Route::get('/seminars/{id}/status', [MahasiswaSeminarController::class, 'getStatus']);
        Route::post('/seminars/{id}/cancel', [MahasiswaSeminarController::class, 'cancel']);
        Route::get('/dosens', [MahasiswaSeminarController::class, 'getDosenList']);

        // Attendance
        Route::get('/attendance/schedules', [MahasiswaAttendanceController::class, 'getSchedules']);
        Route::post('/attendance/register', [MahasiswaAttendanceController::class, 'registerAttendance']);
        Route::get('/attendance/history', [MahasiswaAttendanceController::class, 'getAttendanceHistory']);
        Route::post('/attendance/scan-qr', [MahasiswaAttendanceController::class, 'scanQRAttendance']);

        // Revisions
        Route::get('/revisions', [MahasiswaRevisionController::class, 'index']);
        Route::get('/revisions/{id}', [MahasiswaRevisionController::class, 'show']);
        Route::post('/revisions', [MahasiswaRevisionController::class, 'store']);
        Route::get('/revisions/seminars/available', [MahasiswaRevisionController::class, 'getAvailableSeminars']);
        Route::get('/revisions/seminars/{seminarId}', [MahasiswaRevisionController::class, 'getSeminarRevisions']);
        Route::post('/revisions/{revisionId}/items/{itemId}/submit', [MahasiswaRevisionController::class, 'submitItem']);
    });

    // ==================== DOSEN ROUTES (Sudah benar) ====================
    Route::prefix('dosen')->middleware('role:dosen')->group(function () {

        // Dashboard - with cache (2 minutes)
        Route::get('/dashboard', [DosenDashboardController::class, 'index'])->middleware('cache.response:2');
        Route::get('/profile', [DosenDashboardController::class, 'profile']);
        Route::get('/upcoming-seminars', [DosenDashboardController::class, 'upcomingSeminars']);

        // Seminars (NEW - for seminar list and detail)
        Route::get('/seminars', [DosenSeminarController::class, 'index']);
        Route::get('/seminars/{id}', [DosenSeminarController::class, 'show']);
        Route::post('/seminars/check-in', [DosenSeminarController::class, 'checkIn']); // NEW: Dosen check-in
        Route::get('/attendance/history', [DosenSeminarController::class, 'myAttendanceHistory']); // NEW: Attendance history

        // Approvals
        Route::get('/approvals/pending', [ApprovalController::class, 'pendingApprovals']);
        Route::get('/approvals/history', [ApprovalController::class, 'approvalHistory']);
        Route::get('/approvals/{id}', [ApprovalController::class, 'showApproval']);
        Route::put('/approvals/{id}', [ApprovalController::class, 'updateApproval']);
        Route::get('/approvals/seminar/{seminarId}/history', [ApprovalController::class, 'getApprovalHistory']); // NEW: Approval history

        // Seminar Actions
        Route::post('/seminars/{id}/cancel', [ApprovalController::class, 'cancelSeminar']);
        Route::get('/seminars/{id}/file/view', [ApprovalController::class, 'viewFile']);
        Route::get('/seminars/{id}/file/download', [ApprovalController::class, 'downloadFile']);
        Route::post('/seminars/{id}/final-approval', [ApprovalController::class, 'finalApproval']);
        Route::get('/seminars/{id}/approval-status', [ApprovalController::class, 'getSeminarApprovalStatus']);

        // Attendance
        Route::post('/attendance/status', [ApprovalController::class, 'updateAttendanceStatus']);

        // Revisions
        Route::get('/revisions', [DosenRevisionController::class, 'index']);
        Route::post('/revisions', [DosenRevisionController::class, 'store']);
        Route::get('/revisions/{id}', [DosenRevisionController::class, 'show']);
        Route::post('/revisions/{id}/validate', [DosenRevisionController::class, 'validate']);
        Route::post('/revisions/{seminarId}/items', [DosenRevisionController::class, 'addRevisionItem']);
        Route::post('/revisions/{revisionId}/items/{itemId}/validate', [DosenRevisionController::class, 'validateItem']);

        // Statistics
        Route::get('/statistics', [ApprovalController::class, 'getStatistics']);
    });

    // ==================== ADMIN ROUTES (Sudah benar) ====================
    Route::prefix('admin')->middleware('role:admin')->group(function () {

        // Dashboard - with cache (2 minutes)
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->middleware('cache.response:2');
        Route::get('/system-overview', [AdminDashboardController::class, 'systemOverview']);

        // Verification
        Route::get('/verification/seminars', [AdminVerificationController::class, 'index']);
        Route::get('/verification/seminars/pending', [AdminVerificationController::class, 'pendingVerification']);
        Route::get('/verification/seminars/{id}', [AdminVerificationController::class, 'show']);
        Route::post('/verification/seminars/{id}/verify', [AdminVerificationController::class, 'verifySeminar']);
        Route::get('/verification/statistics', [AdminVerificationController::class, 'statistics']);

        // Schedule
        Route::get('/schedules', [AdminScheduleController::class, 'index']);
        Route::get('/schedules/available-seminars', [AdminScheduleController::class, 'availableSeminars']);
        Route::post('/schedules', [AdminScheduleController::class, 'store']);
        Route::put('/schedules/{id}', [AdminScheduleController::class, 'update']);
        Route::delete('/schedules/{id}', [AdminScheduleController::class, 'destroy']);
        Route::get('/schedules/statistics', [AdminScheduleController::class, 'statistics']);

        // QR Codes
        Route::get('/qr-codes', [AdminQRController::class, 'index']);
        Route::post('/qr-codes/bulk-generate', [AdminQRController::class, 'bulkGenerate']);
        Route::post('/qr-codes/validate', [AdminQRController::class, 'validateQR']);
        Route::post('/qr-codes/generate/{scheduleId}', [AdminQRController::class, 'generateQR']); // Ubah pattern
        Route::delete('/qr-codes/{scheduleId}', [AdminQRController::class, 'destroy']);
        Route::get('/qr-codes/{scheduleId}', [AdminQRController::class, 'getQR']);
        Route::get('/qr-codes/{scheduleId}/download', [AdminQRController::class, 'downloadQR']); // NEW: Download QR

        // Attendance
        Route::get('/attendances', [AdminAttendanceController::class, 'index']);
        Route::get('/attendances/schedule/{scheduleId}', [AdminAttendanceController::class, 'getScheduleAttendances']);
        Route::get('/attendances/schedule/{scheduleId}/report', [AdminAttendanceController::class, 'getCompleteReport']); // NEW: Complete report
        Route::get('/attendances/schedule/{scheduleId}/export-pdf', [AdminAttendanceController::class, 'exportPDF']); // NEW: PDF export
        Route::get('/attendances/statistics', [AdminAttendanceController::class, 'statistics']);
        Route::post('/attendances/manual', [AdminAttendanceController::class, 'manualAttendance']);
        Route::delete('/attendances/{attendanceId}', [AdminAttendanceController::class, 'destroy']);
        Route::get('/attendances/mahasiswa-list', [AdminAttendanceController::class, 'getMahasiswaList']);
    });

    // ==================== SEMINAR OWNER PROTECTED ROUTES ====================
    // Routes that require seminar ownership or involvement
    Route::middleware('seminar.owner')->group(function () {
        // Example: Route::get('/seminar/{id}/details', [MahasiswaSeminarController::class, 'showDetails']);
    });
});

// Fallback for undefined API routes
Route::fallback(function () {
    return response()->json([
        'message' => 'Endpoint API tidak ditemukan.',
        'available_endpoints' => [
            'auth' => ['/login', '/admin/login', '/dosen/login', '/logout'],
            'mahasiswa' => ['/mahasiswa/dashboard', '/mahasiswa/seminars', '/mahasiswa/attendance/*', '/mahasiswa/revisions/*'],
            'dosen' => ['/dosen/dashboard', '/dosen/approvals/*', '/dosen/seminars'],
            'admin' => ['/admin/dashboard', '/admin/verification/*', '/admin/schedules/*', '/admin/qr-codes/*', '/admin/attendances/*'],
        ]
    ], 404);
});
