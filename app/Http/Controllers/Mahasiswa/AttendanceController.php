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

        // TIME VALIDATION: Can only register up to 7 days before seminar
        $registrationStartTime = $schedule->waktu_mulai->copy()->subDays(7);
        $registrationEndTime = $schedule->waktu_mulai->copy()->subMinutes(30); // Close 30 min before
        $now = now();

        if ($now < $registrationStartTime) {
            $daysUntil = $now->diffInDays($registrationStartTime);
            return response()->json([
                'message' => "Pendaftaran akan dibuka {$daysUntil} hari lagi (7 hari sebelum seminar).",
                'waktu_buka_pendaftaran' => $registrationStartTime->format('d M Y H:i'),
            ], 422);
        }

        if ($now > $registrationEndTime) {
            return response()->json([
                'message' => 'Pendaftaran telah ditutup. Silakan gunakan QR code untuk absensi langsung saat seminar berlangsung.',
                'waktu_tutup_pendaftaran' => $registrationEndTime->format('d M Y H:i'),
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
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'manual_reason' => 'nullable|string|max:500',
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

        // TIME VALIDATION: Check if seminar is currently ongoing
        // Grace period: 15 minutes before start, 30 minutes after end
        if (!$schedule->isOngoing(15, 30)) {
            $seminarStatus = $schedule->getSeminarStatus();

            if ($seminarStatus === 'upcoming') {
                $minutesUntil = $schedule->getMinutesUntilStart();
                return response()->json([
                    'message' => "Seminar belum dimulai. QR code dapat dipindai {$minutesUntil} menit lagi (15 menit sebelum seminar dimulai).",
                    'seminar_status' => 'upcoming',
                    'waktu_mulai' => $schedule->waktu_mulai->format('d M Y H:i'),
                ], 422);
            } elseif ($seminarStatus === 'finished') {
                return response()->json([
                    'message' => 'Seminar telah selesai. Waktu absensi telah berakhir.',
                    'seminar_status' => 'finished',
                    'waktu_selesai' => $schedule->getEndTime()->format('d M Y H:i'),
                ], 422);
            }
        }

        // Determine attendance status based on time
        $minutesLate = 0;
        if (now() > $schedule->waktu_mulai) {
            $minutesLate = now()->diffInMinutes($schedule->waktu_mulai);
        }

        // Status: present if on time (within 15 min), late if after start time
        $status = $minutesLate > 15 ? 'late' : 'present';

        // Validasi geolocation jika koordinat seminar tersedia
        $distance = null;
        $validLocation = true;
        if ($schedule->latitude && $schedule->longitude) {
            if ($validated['latitude'] && $validated['longitude']) {
                // Hitung jarak menggunakan Haversine formula
                $distance = $this->calculateDistance(
                    $validated['latitude'],
                    $validated['longitude'],
                    $schedule->latitude,
                    $schedule->longitude
                );

                // Cek apakah dalam radius yang diizinkan
                $allowedRadius = $schedule->radius_meter ?? 50;
                if ($distance > $allowedRadius) {
                    $validLocation = false;
                    // Jika di luar radius dan tidak ada manual_reason, reject
                    if (!$validated['manual_reason']) {
                        return response()->json([
                            'message' => "Anda berada di luar area seminar. Jarak Anda: {$distance}m (maksimal {$allowedRadius}m)",
                            'distance' => round($distance, 2),
                            'allowed_radius' => $allowedRadius,
                        ], 422);
                    }
                }
            }
        }

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
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'distance_meter' => $distance,
            'manual_reason' => $validated['manual_reason'] ?? null,
        ]);

        // Broadcast event ke admin untuk real-time update
        broadcast(new \App\Events\StudentCheckedIn($attendance))->toOthers();

        $statusMessage = $status === 'late'
            ? "Absensi berhasil dicatat (Terlambat {$minutesLate} menit)"
            : 'Absensi berhasil dicatat!';

        return response()->json([
            'message' => $statusMessage,
            'data' => [
                'id' => $attendance->id,
                'seminar_title' => $schedule->seminar->judul,
                'ruangan' => $schedule->ruang,
                'waktu_absen' => $attendance->waktu_absen->format('d M Y H:i'),
                'metode_absen' => $attendance->metode_absen,
                'status' => $status,
                'status_display' => $status === 'late' ? 'Terlambat' : 'Hadir',
                'minutes_late' => $minutesLate,
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

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in meters
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371000; // Earth radius in meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distance = $earthRadius * $c;

        return round($distance, 2);
    }
}
