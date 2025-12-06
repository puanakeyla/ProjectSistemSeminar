<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\User;
use App\Models\SeminarAttendance;
use App\Models\SeminarSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get dashboard data for admin
     */
    public function index(Request $request): JsonResponse
    {
        // Optimized: Single query for user statistics
        $userCounts = User::selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN role = "mahasiswa" THEN 1 ELSE 0 END) as mahasiswa')
            ->selectRaw('SUM(CASE WHEN role = "dosen" THEN 1 ELSE 0 END) as dosen')
            ->selectRaw('SUM(CASE WHEN role = "admin" THEN 1 ELSE 0 END) as admin')
            ->first();

        $userStats = [
            'total' => $userCounts->total ?? 0,
            'mahasiswa' => $userCounts->mahasiswa ?? 0,
            'dosen' => $userCounts->dosen ?? 0,
            'admin' => $userCounts->admin ?? 0,
        ];

        // Optimized: Single query for seminar statistics
        $seminarCounts = Seminar::selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN status = "pending_verification" THEN 1 ELSE 0 END) as pending_verification')
            ->selectRaw('SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) as approved')
            ->selectRaw('SUM(CASE WHEN status = "revising" THEN 1 ELSE 0 END) as revising')
            ->first();

        $scheduledCount = Seminar::has('schedule')->count();

        $seminarStats = [
            'total' => $seminarCounts->total ?? 0,
            'pending_verification' => $seminarCounts->pending_verification ?? 0,
            'approved' => $seminarCounts->approved ?? 0,
            'revising' => $seminarCounts->revising ?? 0,
            'scheduled' => $scheduledCount,
        ];

        // Optimized: Single query for attendance statistics (SQLite compatible)
        $attendanceCounts = SeminarAttendance::selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN metode = "qr" THEN 1 ELSE 0 END) as qr')
            ->selectRaw('SUM(CASE WHEN metode = "manual" THEN 1 ELSE 0 END) as manual')
            ->first();
        
        // Count today's attendances separately for SQLite compatibility
        $todayCount = SeminarAttendance::whereDate('waktu_scan', today())->count();

        $attendanceStats = [
            'total_attendances' => $attendanceCounts->total ?? 0,
            'qr_attendances' => $attendanceCounts->qr ?? 0,
            'manual_attendances' => $attendanceCounts->manual ?? 0,
            'today_attendances' => $todayCount,
        ];

        // Recent seminars - optimized with select()
        $recentSeminars = Seminar::with(['mahasiswa:id,name,npm'])
            ->select('id', 'mahasiswa_id', 'judul', 'jenis_seminar', 'status', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($seminar) {
                return [
                    'id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'judul' => $seminar->judul,
                    'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
                    'status' => $seminar->getStatusDisplay(),
                    'status_color' => $seminar->getStatusColor(),
                    'created_at' => $seminar->created_at->format('d M Y'),
                ];
            });

        // Today's seminars - optimized
        $todaySeminars = SeminarSchedule::with(['seminar:id,mahasiswa_id,judul,jenis_seminar', 'seminar.mahasiswa:id,name'])
            ->select('id', 'seminar_id', 'ruang', 'waktu_mulai', 'waktu_selesai')
            ->today()
            ->orderBy('waktu_mulai')
            ->get()
            ->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'mahasiswa_name' => $schedule->seminar->mahasiswa->name,
                    'judul' => $schedule->seminar->judul,
                    'ruangan' => $schedule->ruang,
                    'waktu' => $schedule->getFormattedTime(),
                    'jenis_seminar' => $schedule->seminar->getJenisSeminarDisplay(),
                ];
            });

        // Recently scheduled seminars - optimized
        $scheduledSeminars = Seminar::with(['mahasiswa:id,name,npm', 'schedule:id,seminar_id,waktu_mulai,ruang'])
            ->select('id', 'mahasiswa_id', 'judul', 'jenis_seminar', 'status', 'updated_at')
            ->where('status', 'scheduled')
            ->whereHas('schedule')
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($seminar) {
                return [
                    'id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'judul' => $seminar->judul,
                    'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
                    'waktu_mulai' => $seminar->schedule->waktu_mulai->format('d M Y H:i'),
                    'ruang' => $seminar->schedule->ruang,
                    'scheduled_at' => $seminar->updated_at->format('d M Y H:i'),
                    'days_ago' => $seminar->updated_at->diffInDays(now()),
                ];
            });

        // Recently cancelled seminars - optimized
        $cancelledSeminars = Seminar::with(['mahasiswa:id,name,npm', 'cancelledBy:id,name,role'])
            ->select('id', 'mahasiswa_id', 'judul', 'jenis_seminar', 'cancel_reason', 'cancelled_at', 'cancelled_by')
            ->whereNotNull('cancelled_at')
            ->orderBy('cancelled_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($seminar) {
                return [
                    'id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'judul' => $seminar->judul,
                    'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
                    'cancel_reason' => $seminar->cancel_reason,
                    'cancelled_at' => $seminar->cancelled_at->format('d M Y H:i'),
                    'days_ago' => $seminar->cancelled_at->diffInDays(now()),
                    'cancelled_by_name' => $seminar->cancelledBy?->name,
                    'cancelled_by_role' => $seminar->cancelledBy?->role,
                ];
            });

        return response()->json([
            'message' => 'Dashboard data retrieved successfully',
            'data' => [
                'user_statistics' => $userStats,
                'seminar_statistics' => $seminarStats,
                'attendance_statistics' => $attendanceStats,
                'recent_seminars' => $recentSeminars,
                'today_seminars' => $todaySeminars,
                'scheduled_seminars' => $scheduledSeminars,
                'cancelled_seminars' => $cancelledSeminars,
            ]
        ]);
    }

    /**
     * Get system overview statistics
     */
    public function systemOverview(): JsonResponse
    {
        // Weekly seminar statistics
        $weeklySeminars = Seminar::where('created_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Monthly user registrations
        $monthlyUsers = User::where('created_at', '>=', now()->subMonths(6))
            ->selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        // Seminar status distribution
        $seminarDistribution = Seminar::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get();

        return response()->json([
            'message' => 'System overview retrieved successfully',
            'data' => [
                'weekly_seminars' => $weeklySeminars,
                'monthly_users' => $monthlyUsers,
                'seminar_distribution' => $seminarDistribution,
            ]
        ]);
    }
}
