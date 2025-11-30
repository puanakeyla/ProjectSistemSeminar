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
        // User statistics
        $userStats = [
            'total' => User::count(),
            'mahasiswa' => User::mahasiswa()->count(),
            'dosen' => User::dosen()->count(),
            'admin' => User::admin()->count(),
        ];

        // Seminar statistics
        $seminarStats = [
            'total' => Seminar::count(),
            'pending_verification' => Seminar::menunggu()->count(),
            'approved' => Seminar::disetujui()->count(),
            'revising' => Seminar::ditolak()->count(),
            'scheduled' => Seminar::has('schedule')->count(),
        ];

        // Attendance statistics
        $attendanceStats = [
            'total_attendances' => SeminarAttendance::count(),
            'qr_attendances' => SeminarAttendance::where('metode', 'qr')->count(),
            'manual_attendances' => SeminarAttendance::where('metode', 'manual')->count(),
            'today_attendances' => SeminarAttendance::whereDate('waktu_scan', today())->count(),
        ];

        // Recent seminars
        $recentSeminars = Seminar::with(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji'])
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

        // Today's seminars
        $todaySeminars = SeminarSchedule::with(['seminar.mahasiswa'])
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

        // Recently cancelled seminars
        $cancelledSeminars = Seminar::with(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji'])
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
