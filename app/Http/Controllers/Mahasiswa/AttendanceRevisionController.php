<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRevision;
use App\Models\SeminarAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\RateLimiter;

class AttendanceRevisionController extends Controller
{
    /**
     * Tampilkan daftar revisi mahasiswa (history)
     */
    public function index(Request $request)
    {
        $mahasiswaId = $request->user()->id;

        $revisions = AttendanceRevision::with([
            'attendance.schedule',
            'approver:id,name,nidn'
        ])
            ->where('requested_by', $mahasiswaId)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $revisions
        ]);
    }

    /**
     * Ambil detail revisi spesifik
     */
    public function show($id)
    {
        $revision = AttendanceRevision::with([
            'attendance.schedule.seminar',
            'requester:id,name,npm',
            'approver:id,name,nidn'
        ])->findOrFail($id);

        // Cek authorization
        if ($revision->requested_by !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $revision
        ]);
    }

    /**
     * Ajukan revisi absensi baru
     * Rate limit: 5 attempts per day
     */
    public function store(Request $request)
    {
        $mahasiswaId = $request->user()->id;

        // Rate limiting: 5 revisions per day
        $key = 'revision-request:' . $mahasiswaId;
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => 'Terlalu banyak request revisi. Coba lagi dalam ' . ceil($seconds / 3600) . ' jam.'
            ], 429);
        }

        // Validasi input
        $validator = Validator::make($request->all(), [
            'seminar_attendance_id' => 'required|exists:seminar_attendances,id',
            'new_status' => 'required|in:present,late,absent',
            'reason' => 'required|string|min:10|max:1000',
            'evidence_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048', // Max 2MB
        ], [
            'seminar_attendance_id.required' => 'ID absensi harus diisi',
            'seminar_attendance_id.exists' => 'Data absensi tidak ditemukan',
            'new_status.required' => 'Status baru harus dipilih',
            'new_status.in' => 'Status tidak valid',
            'reason.required' => 'Alasan revisi harus diisi',
            'reason.min' => 'Alasan minimal 10 karakter',
            'evidence_file.mimes' => 'File harus berformat PDF, JPG, atau PNG',
            'evidence_file.max' => 'Ukuran file maksimal 2MB',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Cek ownership attendance
        $attendance = SeminarAttendance::with('schedule.seminar')->findOrFail($request->seminar_attendance_id);

        if ($attendance->mahasiswa_id !== $mahasiswaId) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke absensi ini'
            ], 403);
        }

        // Cek apakah sudah ada pending revision untuk attendance ini
        $existingPending = AttendanceRevision::where('seminar_attendance_id', $request->seminar_attendance_id)
            ->where('revision_status', 'pending')
            ->exists();

        if ($existingPending) {
            return response()->json([
                'success' => false,
                'message' => 'Sudah ada revisi yang sedang menunggu approval untuk absensi ini'
            ], 422);
        }

        // Upload evidence file jika ada
        $evidencePath = null;
        if ($request->hasFile('evidence_file')) {
            $file = $request->file('evidence_file');
            $seminar = $attendance->schedule->seminar;

            // Path: /revisions/{year}/{course_code}/{npm}_{timestamp}.ext
            $academicYear = now()->year;
            $courseCode = $seminar->mata_kuliah ?? 'GENERAL';
            $npm = $request->user()->npm ?? 'unknown';
            $timestamp = now()->timestamp;
            $extension = $file->getClientOriginalExtension();

            $path = "revisions/{$academicYear}/{$courseCode}";
            $filename = "{$npm}_{$timestamp}.{$extension}";

            $evidencePath = $file->storeAs($path, $filename, 'public');
        }

        // Buat revisi
        $revision = AttendanceRevision::create([
            'seminar_attendance_id' => $attendance->id,
            'requested_by' => $mahasiswaId,
            'old_status' => $attendance->status,
            'new_status' => $request->new_status,
            'reason' => $request->reason,
            'evidence_file' => $evidencePath,
            'revision_status' => 'pending',
            'requested_at' => now(),
        ]);

        // Increment rate limiter (expire in 24 hours)
        RateLimiter::hit($key, 86400);

        // TODO: Kirim notifikasi ke dosen pembimbing
        // NotificationService::sendRevisionRequest($revision);

        return response()->json([
            'success' => true,
            'message' => 'Revisi berhasil diajukan. Menunggu approval dosen.',
            'data' => $revision->load('attendance.schedule')
        ], 201);
    }

    /**
     * Ambil daftar absensi yang bisa direvisi oleh mahasiswa
     */
    public function getRevisableAttendances(Request $request)
    {
        $mahasiswaId = $request->user()->id;

        $attendances = SeminarAttendance::with([
            'schedule.seminar',
            'latestRevision' => function($query) {
                $query->select('id', 'seminar_attendance_id', 'revision_status', 'new_status');
            }
        ])
            ->where('mahasiswa_id', $mahasiswaId)
            ->whereHas('schedule', function($query) {
                // Hanya seminar yang sudah selesai (bisa direvisi)
                $query->where('waktu_mulai', '<', now());
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $attendances
        ]);
    }

    /**
     * Batalkan revisi yang masih pending
     */
    public function cancel($id)
    {
        $revision = AttendanceRevision::findOrFail($id);

        // Cek authorization
        if ($revision->requested_by !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Hanya pending yang bisa dibatalkan
        if ($revision->revision_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya revisi pending yang bisa dibatalkan'
            ], 422);
        }

        // Hapus file evidence jika ada
        if ($revision->evidence_file) {
            Storage::disk('public')->delete($revision->evidence_file);
        }

        $revision->delete();

        return response()->json([
            'success' => true,
            'message' => 'Revisi berhasil dibatalkan'
        ]);
    }
}
