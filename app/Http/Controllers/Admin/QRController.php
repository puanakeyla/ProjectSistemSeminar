<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeminarSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class QRController extends Controller
{
    /**
     * Generate QR Code for seminar schedule
     */
    public function generateQR(Request $request, $scheduleId): JsonResponse
    {
        $schedule = SeminarSchedule::with(['seminar.mahasiswa'])->findOrFail($scheduleId);

        // Generate unique token for this schedule
        $token = $this->getOrCreateToken($schedule);

        // Generate QR code URL using Google Charts API
        $qrCodeUrl = $this->generateQRCodeUrl($token);

        // Update schedule with token
        $schedule->update([
            'qr_code_path' => $token,
        ]);

        return response()->json([
            'message' => 'QR Code berhasil dibuat',
            'qr_code_url' => $qrCodeUrl,
            'token' => $token,
            'seminar_title' => $schedule->seminar->judul,
            'schedule_time' => $schedule->getFormattedDateTime(),
        ]);
    }

    /**
     * Get QR code for specific schedule
     */
    public function getQR($scheduleId): JsonResponse
    {
        $schedule = SeminarSchedule::with(['seminar.mahasiswa'])->findOrFail($scheduleId);

        if (!$schedule->qr_code_path) {
            return response()->json([
                'message' => 'QR Code belum dibuat untuk seminar ini'
            ], 404);
        }

        $qrCodeUrl = $this->generateQRCodeUrl($schedule->qr_code_path);

        return response()->json([
            'message' => 'QR Code retrieved successfully',
            'qr_code_url' => $qrCodeUrl,
            'token' => $schedule->qr_code_path,
            'seminar_title' => $schedule->seminar->judul,
            'schedule_time' => $schedule->getFormattedDateTime(),
            'ruang' => $schedule->ruang,
        ]);
    }

    /**
     * Regenerate QR Code
     */
    public function regenerateQR($scheduleId): JsonResponse
    {
        $schedule = SeminarSchedule::with(['seminar.mahasiswa'])->findOrFail($scheduleId);

        // Generate new unique token
        $token = Str::uuid()->toString();

        // Generate QR code URL
        $qrCodeUrl = $this->generateQRCodeUrl($token);

        // Update schedule with new token
        $schedule->update([
            'qr_code_path' => $token,
        ]);

        return response()->json([
            'message' => 'QR Code berhasil di-generate ulang',
            'qr_code_url' => $qrCodeUrl,
            'token' => $token,
        ]);
    }



    /**
     * Get or create token for schedule
     */
    private function getOrCreateToken(SeminarSchedule $schedule): string
    {
        if ($schedule->qr_code_path) {
            return $schedule->qr_code_path;
        }
        return Str::uuid()->toString();
    }

    /**
     * Generate QR code URL using Google Charts API
     */
    private function generateQRCodeUrl(string $data): string
    {
        $size = '300x300';
        $encodedData = urlencode($data);
        return "https://api.qrserver.com/v1/create-qr-code/?size={$size}&data={$encodedData}";
    }

    /**
     * Validate QR code and check time validity
     */
    public function validateQR(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $schedule = SeminarSchedule::with(['seminar.mahasiswa'])
            ->where('qr_code_path', $validated['token'])
            ->first();

        if (!$schedule) {
            return response()->json([
                'message' => 'QR Code tidak valid'
            ], 422);
        }

        // Check if seminar time is now (±15 minutes tolerance)
        $now = now();
        $startTime = $schedule->waktu_mulai;
        $endTime = $startTime->copy()->addMinutes($schedule->durasi_menit);
        $toleranceStart = $startTime->copy()->subMinutes(15);
        $toleranceEnd = $endTime->copy()->addMinutes(15);

        if ($now < $toleranceStart || $now > $toleranceEnd) {
            return response()->json([
                'message' => 'QR Code hanya berlaku pada waktu seminar (±15 menit)',
                'valid_time' => false,
                'seminar_time' => $schedule->getFormattedDateTime(),
            ], 422);
        }

        return response()->json([
            'message' => 'QR Code valid',
            'schedule_id' => $schedule->id,
            'seminar_id' => $schedule->seminar_id,
            'seminar_title' => $schedule->seminar->judul,
            'mahasiswa' => [
                'name' => $schedule->seminar->mahasiswa->name,
                'npm' => $schedule->seminar->mahasiswa->npm,
            ],
            'schedule_time' => $schedule->getFormattedDateTime(),
            'ruang' => $schedule->ruang,
            'valid_time' => true,
        ]);
    }
}