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
use App\Http\Controllers\Admin\RevisionController as AdminRevisionController;
use App\Http\Controllers\Admin\ScheduleController as AdminScheduleController;
use App\Http\Controllers\Admin\VerificationController as AdminVerificationController;

// Dosen (Sudah benar pakai alias)
use App\Http\Controllers\Dosen\ApprovalController;
use App\Http\Controllers\Dosen\DashboardController as DosenDashboardController;

// Mahasiswa (INI YANG DIPERBAIKI)
use App\Http\Controllers\Mahasiswa\AttendanceController as MahasiswaAttendanceController;
use App\Http\Controllers\Mahasiswa\DashboardController as MahasiswaDashboardController;
use App\Http\Controllers\Mahasiswa\RevisionController as MahasiswaRevisionController;
use App\Http\Controllers\Mahasiswa\SeminarController as MahasiswaSeminarController;


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
        
        // Dashboard
        Route::get('/dashboard', [MahasiswaDashboardController::class, 'index']);
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
    });

    // ==================== DOSEN ROUTES (Sudah benar) ====================
    Route::prefix('dosen')->middleware('role:dosen')->group(function () {
        
        // Dashboard
        Route::get('/dashboard', [DosenDashboardController::class, 'index']);
        Route::get('/profile', [DosenDashboardController::class, 'profile']);
        Route::get('/upcoming-seminars', [DosenDashboardController::class, 'upcomingSeminars']);
        
        // Approvals
        Route::get('/approvals/pending', [ApprovalController::class, 'pendingApprovals']);
        Route::get('/approvals/history', [ApprovalController::class, 'approvalHistory']);
        Route::get('/approvals/{id}', [ApprovalController::class, 'showApproval']);
        Route::put('/approvals/{id}', [ApprovalController::class, 'updateApproval']);
        
        // Seminars
        Route::get('/seminars', [ApprovalController::class, 'mySeminars']);
        Route::post('/seminars/{id}/cancel', [ApprovalController::class, 'cancelSeminar']);
        Route::get('/seminars/{id}/file/view', [ApprovalController::class, 'viewFile']);
        Route::get('/seminars/{id}/file/download', [ApprovalController::class, 'downloadFile']);
        
        // Attendance
        Route::post('/attendance/status', [ApprovalController::class, 'updateAttendanceStatus']);
        
        // Statistics
        Route::get('/statistics', [ApprovalController::class, 'getStatistics']);
    });

    // ==================== ADMIN ROUTES (Sudah benar) ====================
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        
        // Dashboard
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
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
        Route::post('/qr-codes/{scheduleId}/generate', [AdminQRController::class, 'generateQR']);
        Route::get('/qr-codes/{scheduleId}', [AdminQRController::class, 'getQR']);
        Route::delete('/qr-codes/{scheduleId}', [AdminQRController::class, 'destroy']);
        Route::post('/qr-codes/bulk-generate', [AdminQRController::class, 'bulkGenerate']);
        Route::post('/qr-codes/validate', [AdminQRController::class, 'validateQR']);
        
        // Attendance
        Route::get('/attendances', [AdminAttendanceController::class, 'index']);
        Route::get('/attendances/schedule/{scheduleId}', [AdminAttendanceController::class, 'getScheduleAttendances']);
        Route::get('/attendances/statistics', [AdminAttendanceController::class, 'statistics']);
        Route::post('/attendances/manual', [AdminAttendanceController::class, 'manualAttendance']);
        Route::delete('/attendances/{attendanceId}', [AdminAttendanceController::class, 'destroy']);
        Route::get('/attendances/mahasiswa-list', [AdminAttendanceController::class, 'getMahasiswaList']);
        
        // Revisions
        Route::get('/revisions', [AdminRevisionController::class, 'index']);
        Route::get('/revisions/{id}', [AdminRevisionController::class, 'show']);
        Route::post('/revisions/{id}/validate', [AdminRevisionController::class, 'validate']);
        Route::get('/revisions/statistics', [AdminRevisionController::class, 'statistics']);
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