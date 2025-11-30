<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeminarAttendance;
use App\Models\SeminarSchedule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    /**
     * Get all attendances
     */
    public function index(Request $request): JsonResponse
    {
        $filter = $request->get('filter', 'all'); // all, today, week, month

        $query = SeminarAttendance::with([
            'mahasiswa', 
            'schedule.seminar.mahasiswa',
            'schedule.seminar.pembimbing1',
            'schedule.seminar.pembimbing2',
            'schedule.seminar.penguji'
        ]);

        switch ($filter) {
            case 'today':
                $query->today();
                break;
            case 'week':
                $query->where('waktu_absen', '>=', now()->subWeek());
                break;
            case 'month':
                $query->where('waktu_absen', '>=', now()->subMonth());
                break;
        }

        $attendances = $query->orderBy('waktu_absen', 'desc')
            ->get()
            ->map(function ($attendance) {
                return $this->formatAttendanceData($attendance);
            });

        return response()->json([
            'message' => 'Attendances retrieved successfully',
            'data' => $attendances
        ]);
    }

    /**
     * Get attendance for specific seminar schedule
     */
    public function getScheduleAttendances($scheduleId): JsonResponse
    {
        $schedule = SeminarSchedule::with(['seminar'])->findOrFail($scheduleId);

        $attendances = SeminarAttendance::with(['mahasiswa'])
            ->where('seminar_schedule_id', $scheduleId)
            ->orderBy('waktu_absen', 'desc')
            ->get()
            ->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'mahasiswa_id' => $attendance->mahasiswa_id,
                    'mahasiswa_name' => $attendance->mahasiswa->name,
                    'mahasiswa_npm' => $attendance->mahasiswa->npm,
                    'waktu_absen' => $attendance->waktu_absen->format('d M Y H:i:s'),
                    'waktu_absen_display' => $attendance->waktu_absen->format('d M Y H:i'),
                    'metode_absen' => $attendance->metode_absen,
                    'is_qr' => $attendance->metode_absen === 'qr',
                    'is_manual' => $attendance->metode_absen === 'manual',
                ];
            });

        $attendanceStats = [
            'total' => $attendances->count(),
            'qr_count' => $attendances->where('is_qr', true)->count(),
            'manual_count' => $attendances->where('is_manual', true)->count(),
            'unique_attendees' => $attendances->unique('mahasiswa_id')->count(),
        ];

        return response()->json([
            'message' => 'Schedule attendances retrieved successfully',
            'data' => [
                'schedule' => [
                    'id' => $schedule->id,
                    'judul' => $schedule->seminar->judul,
                    'ruangan' => $schedule->ruang,
                    'tanggal_jam' => $schedule->getFormattedDateTime(),
                    'mahasiswa_presenter' => $schedule->seminar->mahasiswa->name,
                ],
                'attendance_stats' => $attendanceStats,
                'attendances' => $attendances,
            ]
        ]);
    }

    /**
     * Get attendance statistics
     */
    public function statistics(): JsonResponse
    {
        // Overall statistics
        $overallStats = [
            'total_attendances' => SeminarAttendance::count(),
            'qr_attendances' => SeminarAttendance::where('metode_absen', 'qr')->count(),
            'manual_attendances' => SeminarAttendance::where('metode_absen', 'manual')->count(),
            'unique_attendees' => SeminarAttendance::distinct('mahasiswa_id')->count('mahasiswa_id'),
            'today_attendances' => SeminarAttendance::today()->count(),
        ];

        // Monthly attendance trend
        $monthlyTrend = SeminarAttendance::selectRaw('
                YEAR(waktu_absen) as year, 
                MONTH(waktu_absen) as month, 
                COUNT(*) as total_attendances,
                COUNT(DISTINCT mahasiswa_id) as unique_attendees
            ')
            ->where('waktu_absen', '>=', now()->subMonths(6))
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        // Most attended seminars
        $popularSeminars = SeminarAttendance::selectRaw('
                seminar_schedule_id,
                COUNT(*) as attendance_count,
                COUNT(DISTINCT mahasiswa_id) as unique_attendees
            ')
            ->with(['schedule.seminar'])
            ->groupBy('seminar_schedule_id')
            ->orderBy('attendance_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'seminar_title' => $item->schedule->seminar->judul,
                    'schedule_time' => $item->schedule->getFormattedDateTime(),
                    'attendance_count' => $item->attendance_count,
                    'unique_attendees' => $item->unique_attendees,
                ];
            });

        // Active attendees
        $activeAttendees = SeminarAttendance::selectRaw('
                mahasiswa_id,
                COUNT(*) as attendance_count
            ')
            ->with(['mahasiswa'])
            ->groupBy('mahasiswa_id')
            ->orderBy('attendance_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'mahasiswa_name' => $item->mahasiswa->name,
                    'mahasiswa_npm' => $item->mahasiswa->npm,
                    'attendance_count' => $item->attendance_count,
                ];
            });

        return response()->json([
            'message' => 'Attendance statistics retrieved successfully',
            'data' => [
                'overall_statistics' => $overallStats,
                'monthly_trend' => $monthlyTrend,
                'popular_seminars' => $popularSeminars,
                'active_attendees' => $activeAttendees,
            ]
        ]);
    }

    /**
     * Manual attendance registration by admin
     */
    public function manualAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mahasiswa_id' => 'required|exists:users,id',
            'seminar_schedule_id' => 'required|exists:seminar_schedules,id',
        ]);

        // Check if mahasiswa exists and is actually a mahasiswa
        $mahasiswa = User::where('id', $validated['mahasiswa_id'])
            ->where('role', 'mahasiswa')
            ->firstOrFail();

        // Check if already attended
        $existingAttendance = SeminarAttendance::where('mahasiswa_id', $validated['mahasiswa_id'])
            ->where('seminar_schedule_id', $validated['seminar_schedule_id'])
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Mahasiswa sudah terdaftar hadir untuk seminar ini'
            ], 422);
        }

        // Register manual attendance
        $attendance = SeminarAttendance::create([
            'mahasiswa_id' => $validated['mahasiswa_id'],
            'seminar_schedule_id' => $validated['seminar_schedule_id'],
            'waktu_absen' => now(),
            'metode_absen' => 'manual',
        ]);

        $schedule = SeminarSchedule::with(['seminar'])->find($validated['seminar_schedule_id']);

        return response()->json([
            'message' => 'Kehadiran berhasil dicatat secara manual',
            'data' => [
                'attendance_id' => $attendance->id,
                'mahasiswa_name' => $mahasiswa->name,
                'mahasiswa_npm' => $mahasiswa->npm,
                'seminar_title' => $schedule->seminar->judul,
                'waktu_absen' => $attendance->waktu_absen->format('d M Y H:i'),
                'metode_absen' => $attendance->metode_absen,
            ]
        ]);
    }

    /**
     * Delete attendance record
     */
    public function destroy($attendanceId): JsonResponse
    {
        $attendance = SeminarAttendance::findOrFail($attendanceId);
        $attendance->delete();

        return response()->json([
            'message' => 'Record kehadiran berhasil dihapus'
        ]);
    }

    /**
     * Get mahasiswa list for manual attendance
     */
    public function getMahasiswaList(): JsonResponse
    {
        $mahasiswas = User::mahasiswa()
            ->select('id', 'name', 'npm', 'email')
            ->orderBy('name')
            ->get()
            ->map(function ($mahasiswa) {
                return [
                    'id' => $mahasiswa->id,
                    'name' => $mahasiswa->name,
                    'npm' => $mahasiswa->npm,
                    'email' => $mahasiswa->email,
                    'display' => $mahasiswa->name . ' (' . $mahasiswa->npm . ')'
                ];
            });

        return response()->json([
            'message' => 'Mahasiswa list retrieved successfully',
            'data' => $mahasiswas
        ]);
    }

    /**
     * Format attendance data for response
     */
    private function formatAttendanceData(SeminarAttendance $attendance): array
    {
        return [
            'id' => $attendance->id,
            'mahasiswa_id' => $attendance->mahasiswa_id,
            'mahasiswa_name' => $attendance->mahasiswa->name,
            'mahasiswa_npm' => $attendance->mahasiswa->npm,
            'seminar_schedule_id' => $attendance->seminar_schedule_id,
            'seminar_title' => $attendance->schedule->seminar->judul,
            'presenter_name' => $attendance->schedule->seminar->mahasiswa->name,
            'ruangan' => $attendance->schedule->ruang,
            'tanggal_seminar' => $attendance->schedule->getFormattedDateTime(),
            'waktu_absen' => $attendance->waktu_absen->format('Y-m-d H:i:s'),
            'waktu_absen_display' => $attendance->waktu_absen->format('d M Y H:i'),
            'metode_absen' => $attendance->metode_absen,
            'is_qr' => $attendance->metode_absen === 'qr',
            'is_manual' => $attendance->metode_absen === 'manual',
            'created_at' => $attendance->created_at->format('d M Y H:i'),
        ];
    }
}
