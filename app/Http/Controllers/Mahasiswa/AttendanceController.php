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
        $schedules = SeminarSchedule::with(['seminar.mahasiswa', 'seminar.pembimbing1', 'seminar.pembimbing2', 'seminar.penguji'])
            ->whereHas('seminar', function ($query) {
                $query->where('status', 'approved');
            })
            ->where('waktu_mulai', '>=', now()->subDay()) // Include today and future
            ->orderBy('waktu_mulai')
            ->get()
            ->map(function ($schedule) use ($request) {
                $isRegistered = SeminarAttendance::where('mahasiswa_id', $request->user()->id)
                    ->where('seminar_schedule_id', $schedule->id)
                    ->exists();

                return [
                    'id' => $schedule->id,
                    'seminar_id' => $schedule->seminar_id,
                    'mahasiswa_name' => $schedule->seminar->mahasiswa->name,
                    'mahasiswa_npm' => $schedule->seminar->mahasiswa->npm,
                    'judul' => $schedule->seminar->judul,
                    'jenis_seminar' => $schedule->seminar->getJenisSeminarDisplay(),
                    'ruangan' => $schedule->ruangan,
                    'tanggal_jam' => $schedule->waktu_mulai->format('Y-m-d H:i:s'),
                    'tanggal_display' => $schedule->getFormattedDate(),
                    'waktu_display' => $schedule->getFormattedTime(),
                    'is_upcoming' => $schedule->isUpcoming(),
                    'is_today' => $schedule->isToday(),
                    'is_registered' => $isRegistered,
                    'pembimbing1' => $schedule->seminar->pembimbing1->name,
                    'pembimbing2' => $schedule->seminar->pembimbing2->name,
                    'penguji' => $schedule->seminar->penguji->name,
                ];
            });

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
                'ruangan' => $schedule->ruangan,
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
                    'ruangan' => $attendance->schedule->ruangan,
                    'tanggal_seminar' => $attendance->schedule->getFormattedDate(),
                    'waktu_seminar' => $attendance->schedule->getFormattedTime(),
                    'waktu_absen' => $attendance->waktu_absen->format('d M Y H:i'),
                    'metode_absen' => $attendance->metode_absen,
                    'pembimbing1' => $attendance->schedule->seminar->pembimbing1->name,
                    'pembimbing2' => $attendance->schedule->seminar->pembimbing2->name,
                    'penguji' => $attendance->schedule->seminar->penguji->name,
                ];
            });

        $totalAttended = $attendances->count();

        return response()->json([
            'message' => 'Attendance history retrieved successfully',
            'data' => [
                'total_attended' => $totalAttended,
                'attendances' => $attendances,
            ]
        ]);
    }

    /**
     * Scan QR code for attendance
     */
    public function scanQRAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_content' => 'required|string',
            'seminar_schedule_id' => 'required|exists:seminar_schedules,id',
        ]);

        $user = $request->user();
        $schedule = SeminarSchedule::find($validated['seminar_schedule_id']);

        // Validate QR content (simple validation)
        $expectedQR = "SEMAR-" . $schedule->id . "-" . $schedule->seminar_id;
        if ($validated['qr_content'] !== $expectedQR) {
            return response()->json([
                'message' => 'QR Code tidak valid'
            ], 422);
        }

        // Check if already attended
        $existingAttendance = SeminarAttendance::where('mahasiswa_id', $user->id)
            ->where('seminar_schedule_id', $validated['seminar_schedule_id'])
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Anda sudah melakukan absensi untuk seminar ini'
            ], 422);
        }

        // Check if seminar is happening now (within 2 hours before and after)
        $seminarTime = $schedule->waktu_mulai;
        $currentTime = now();
        $timeDifference = $currentTime->diffInHours($seminarTime);

        if ($timeDifference > 2) {
            return response()->json([
                'message' => 'Absensi hanya dapat dilakukan 2 jam sebelum dan sesudah seminar'
            ], 422);
        }

        // Record attendance
        $attendance = SeminarAttendance::create([
            'mahasiswa_id' => $user->id,
            'seminar_schedule_id' => $validated['seminar_schedule_id'],
            'waktu_absen' => now(),
            'metode_absen' => 'qr',
        ]);

        return response()->json([
            'message' => 'Absensi berhasil dicatat',
            'data' => [
                'seminar_title' => $schedule->seminar->judul,
                'ruangan' => $schedule->ruangan,
                'waktu_absen' => $attendance->waktu_absen->format('d M Y H:i'),
                'metode_absen' => $attendance->metode_absen,
            ]
        ]);
    }
}