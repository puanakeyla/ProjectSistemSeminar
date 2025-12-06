<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\SeminarAttendance;
use App\Models\SeminarSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    /**
     * Get all seminar schedules for attendance
     */
    public function getSchedules(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get all scheduled seminars (including own seminars and seminars for attendance)
        $schedules = SeminarSchedule::with(['seminar.mahasiswa', 'seminar.pembimbing1', 'seminar.pembimbing2', 'seminar.penguji'])
            ->where('waktu_mulai', '>=', now()->subDay()) // Include today and future
            ->orderBy('waktu_mulai')
            ->get()
            ->filter(function ($schedule) use ($user) {
                // Include if: approved seminar OR own seminar (regardless of status)
                return $schedule->seminar->status === 'approved' ||
                       $schedule->seminar->mahasiswa_id === $user->id;
            })
            ->map(function ($schedule) use ($user) {
                $isRegistered = SeminarAttendance::where('mahasiswa_id', $user->id)
                    ->where('seminar_schedule_id', $schedule->id)
                    ->exists();

                $isOwnSeminar = $schedule->seminar->mahasiswa_id == $user->id;

                return [
                    'id' => $schedule->id,
                    'seminar_id' => $schedule->seminar_id,
                    'mahasiswa_name' => $schedule->seminar->mahasiswa->name,
                    'mahasiswa_npm' => $schedule->seminar->mahasiswa->npm,
                    'judul' => $schedule->seminar->judul,
                    'jenis_seminar' => $schedule->seminar->getJenisSeminarDisplay(),
                    'ruangan' => $schedule->ruang,
                    'tanggal_jam' => $schedule->waktu_mulai->format('Y-m-d H:i:s'),
                    'tanggal_display' => $schedule->getFormattedDate(),
                    'waktu_display' => $schedule->getFormattedTime(),
                    'is_upcoming' => $schedule->isUpcoming(),
                    'is_today' => $schedule->isToday(),
                    'is_registered' => $isRegistered,
                    'is_own_seminar' => $isOwnSeminar,
                    'seminar_status' => $schedule->seminar->getStatusDisplay(),
                    'pembimbing1' => $schedule->seminar->pembimbing1->name ?? 'N/A',
                    'pembimbing2' => $schedule->seminar->pembimbing2->name ?? 'N/A',
                    'penguji' => $schedule->seminar->penguji->name ?? 'N/A',
                ];
            })
            ->values(); // Reset array keys

        return response()->json([
            'message' => 'Seminar schedules retrieved successfully',
            'data' => $schedules
        ]);
    }

    /**
     * Register attendance for a seminar
     */
    public function registerAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'seminar_schedule_id' => 'required|exists:seminar_schedules,id',
        ]);

        $user = $request->user();
        $schedule = SeminarSchedule::find($validated['seminar_schedule_id']);

        // Check if already registered
        $existingAttendance = SeminarAttendance::where('mahasiswa_id', $user->id)
            ->where('seminar_schedule_id', $validated['seminar_schedule_id'])
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Anda sudah terdaftar untuk seminar ini'
            ], 422);
        }

        // Register attendance
        $attendance = SeminarAttendance::create([
            'mahasiswa_id' => $user->id,
            'seminar_schedule_id' => $validated['seminar_schedule_id'],
            'waktu_absen' => now(),
            'metode_absen' => 'manual', // Manual registration
        ]);

        return response()->json([
            'message' => 'Pendaftaran kehadiran berhasil',
            'data' => [
                'id' => $attendance->id,
                'seminar_title' => $schedule->seminar->judul,
                'tanggal_jam' => $schedule->getFormattedDateTime(),
                'ruangan' => $schedule->ruang,
                'waktu_absen' => $attendance->waktu_absen->format('d M Y H:i'),
            ]
        ]);
    }

    /**
     * Get attendance history for current mahasiswa
     */
    public function getAttendanceHistory(Request $request): JsonResponse
    {
        $attendances = SeminarAttendance::with(['schedule.seminar.mahasiswa', 'schedule.seminar.pembimbing1', 'schedule.seminar.pembimbing2', 'schedule.seminar.penguji'])
            ->where('mahasiswa_id', $request->user()->id)
            ->orderBy('waktu_absen', 'desc')
            ->get()
            ->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'seminar_title' => $attendance->schedule->seminar->judul,
                    'jenis_seminar' => $attendance->schedule->seminar->getJenisSeminarDisplay(),
                    'mahasiswa_presenter' => $attendance->schedule->seminar->mahasiswa->name,
                    'npm_presenter' => $attendance->schedule->seminar->mahasiswa->npm,
                    'ruangan' => $attendance->schedule->ruang,
                    'tanggal_seminar' => $attendance->schedule->getFormattedDate(),
                    'waktu_seminar' => $attendance->schedule->getFormattedTime(),
                    'waktu_absen' => $attendance->waktu_absen->format('d M Y H:i'),
                    'metode_absen' => $attendance->metode_absen,
                    'pembimbing1' => $attendance->schedule->seminar->pembimbing1->name,
                    'pembimbing2' => $attendance->schedule->seminar->pembimbing2->name,
                    'penguji' => $attendance->schedule->seminar->penguji->name,
                ];
            });

        return response()->json([
            'message' => 'Attendance history retrieved successfully',
            'data' => $attendances->map(function ($item) {
                return [
                    'id' => $item['id'],
                    'jenis_seminar' => $item['jenis_seminar'],
                    'mahasiswa_name' => $item['mahasiswa_presenter'],
                    'mahasiswa_npm' => $item['npm_presenter'],
                    'tanggal_display' => $item['tanggal_seminar'],
                    'waktu_absen_display' => $item['waktu_absen'],
                    'metode_absen' => $item['metode_absen'],
                    'ruangan' => $item['ruangan'],
                ];
            })
        ]);
    }

    /**
     * Scan QR code for attendance (using token from QR)
     * UPDATED: Support both qr_token and qr_content, removed time validation
     */
    public function scanQRAttendance(Request $request): JsonResponse
    {
        // Support both qr_token (new) and qr_content (old) for backward compatibility
        $validated = $request->validate([
            'qr_token' => 'required_without:qr_content|string|nullable',
            'qr_content' => 'required_without:qr_token|string|nullable',
        ]);

        $user = $request->user();
        $qrToken = $validated['qr_token'] ?? $validated['qr_content'] ?? null;

        if (!$qrToken) {
            return response()->json([
                'message' => 'QR token atau content harus diisi'
            ], 422);
        }

        // Find schedule by QR token
        $schedule = SeminarSchedule::with(['seminar'])
            ->where('qr_code_path', $qrToken)
            ->first();

        if (!$schedule) {
            return response()->json([
                'message' => 'QR Code tidak valid atau tidak ditemukan',
                'debug_token' => $qrToken // Untuk debugging
            ], 422);
        }

        // Check if already attended
        $existingAttendance = SeminarAttendance::where('mahasiswa_id', $user->id)
            ->where('seminar_schedule_id', $schedule->id)
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Anda sudah melakukan absensi untuk seminar ini',
                'data' => [
                    'waktu_absen' => $existingAttendance->waktu_absen ? $existingAttendance->waktu_absen->format('d M Y H:i') : '-',
                    'metode_absen' => $existingAttendance->metode_absen ?? $existingAttendance->metode,
                ]
            ], 422);
        }

        // REMOVED: Time validation - dapat scan kapan saja
        // Status always 'present' since no time checking
        $status = 'present';

        // Record attendance
        $attendance = SeminarAttendance::create([
            'mahasiswa_id' => $user->id,
            'seminar_schedule_id' => $schedule->id,
            'waktu_absen' => now(),
            'waktu_scan' => now(),
            'metode_absen' => 'qr',
            'metode' => 'qr',
            'status' => $status,
            'qr_token' => $qrToken,
        ]);

        return response()->json([
            'message' => 'Absensi berhasil dicatat!',
            'data' => [
                'id' => $attendance->id,
                'seminar_title' => $schedule->seminar->judul,
                'ruangan' => $schedule->ruang,
                'waktu_absen' => $attendance->waktu_absen->format('d M Y H:i'),
                'metode_absen' => $attendance->metode_absen,
                'status' => $status,
                'status_display' => 'Hadir',
            ]
        ]);
    }

    /**
     * Upload and scan QR image for attendance
     */
    public function uploadQRScan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // In a real implementation, you would decode the QR image here
        // For now, we'll simulate it by reading a token from the request
        // You can use libraries like SimpleSoftwareIO/simple-qrcode or chillerlan/php-qrcode

        return response()->json([
            'message' => 'QR image upload endpoint - requires QR decoder library',
            'note' => 'Please use scanQRAttendance endpoint with qr_token instead'
        ], 501);
    }
}
