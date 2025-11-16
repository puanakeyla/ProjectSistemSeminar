<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeminarSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRController extends Controller
{
    /**
     * Generate QR Code for seminar schedule
     */
    public function generateQR(Request $request, $scheduleId): JsonResponse
    {
        $schedule = SeminarSchedule::with(['seminar'])->findOrFail($scheduleId);

        // Check if QR code already exists
        if ($schedule->qr_code && Storage::exists($schedule->qr_code)) {
            return response()->json([
                'message' => 'QR Code sudah ada untuk seminar ini',
                'data' => [
                    'qr_code_url' => Storage::url($schedule->qr_code),
                    'qr_content' => $this->getQRContent($schedule),
                ]
            ]);
        }

        // Generate QR content
        $qrContent = $this->getQRContent($schedule);

        // Generate QR code image
        $qrCodeImage = QrCode::format('png')
            ->size(300)
            ->margin(2)
            ->generate($qrContent);

        // Save QR code to storage
        $fileName = 'qr_codes/seminar_' . $schedule->id . '_' . time() . '.png';
        Storage::put($fileName, $qrCodeImage);

        // Update schedule with QR code path
        $schedule->update([
            'qr_code' => $fileName,
        ]);

        return response()->json([
            'message' => 'QR Code berhasil dibuat',
            'data' => [
                'qr_code_url' => Storage::url($fileName),
                'qr_content' => $qrContent,
                'seminar_title' => $schedule->seminar->judul,
                'schedule_time' => $schedule->getFormattedDateTime(),
            ]
        ]);
    }

    /**
     * Get QR code for specific schedule
     */
    public function getQR($scheduleId): JsonResponse
    {
        $schedule = SeminarSchedule::with(['seminar'])->findOrFail($scheduleId);

        if (!$schedule->qr_code) {
            return response()->json([
                'message' => 'QR Code belum dibuat untuk seminar ini'
            ], 404);
        }

        return response()->json([
            'message' => 'QR Code retrieved successfully',
            'data' => [
                'qr_code_url' => Storage::url($schedule->qr_code),
                'qr_content' => $this->getQRContent($schedule),
                'seminar_title' => $schedule->seminar->judul,
                'schedule_time' => $schedule->getFormattedDateTime(),
                'ruangan' => $schedule->ruangan,
            ]
        ]);
    }

    /**
     * Get all QR codes
     */
    public function index(): JsonResponse
    {
        $schedules = SeminarSchedule::with(['seminar.mahasiswa'])
            ->whereNotNull('qr_code')
            ->orderBy('tanggal_jam', 'desc')
            ->get()
            ->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'seminar_id' => $schedule->seminar_id,
                    'judul' => $schedule->seminar->judul,
                    'mahasiswa_name' => $schedule->seminar->mahasiswa->name,
                    'ruangan' => $schedule->ruangan,
                    'tanggal_jam' => $schedule->getFormattedDateTime(),
                    'qr_code_url' => Storage::url($schedule->qr_code),
                    'qr_content' => $this->getQRContent($schedule),
                    'is_upcoming' => $schedule->isUpcoming(),
                ];
            });

        return response()->json([
            'message' => 'QR Codes retrieved successfully',
            'data' => $schedules
        ]);
    }

    /**
     * Delete QR code
     */
    public function destroy($scheduleId): JsonResponse
    {
        $schedule = SeminarSchedule::findOrFail($scheduleId);

        if ($schedule->qr_code && Storage::exists($schedule->qr_code)) {
            Storage::delete($schedule->qr_code);
        }

        $schedule->update(['qr_code' => null]);

        return response()->json([
            'message' => 'QR Code berhasil dihapus'
        ]);
    }

    /**
     * Bulk generate QR codes for upcoming seminars
     */
    public function bulkGenerate(): JsonResponse
    {
        $upcomingSchedules = SeminarSchedule::with(['seminar'])
            ->upcoming()
            ->whereNull('qr_code')
            ->get();

        $generated = 0;
        $errors = [];

        foreach ($upcomingSchedules as $schedule) {
            try {
                $qrContent = $this->getQRContent($schedule);
                
                $qrCodeImage = QrCode::format('png')
                    ->size(300)
                    ->margin(2)
                    ->generate($qrContent);

                $fileName = 'qr_codes/seminar_' . $schedule->id . '_' . time() . '.png';
                Storage::put($fileName, $qrCodeImage);

                $schedule->update(['qr_code' => $fileName]);
                $generated++;
            } catch (\Exception $e) {
                $errors[] = "Gagal generate QR untuk seminar: " . $schedule->seminar->judul;
            }
        }

        return response()->json([
            'message' => 'Bulk QR generation completed',
            'data' => [
                'generated' => $generated,
                'total_processed' => $upcomingSchedules->count(),
                'errors' => $errors,
            ]
        ]);
    }

    /**
     * Get QR code content
     */
    private function getQRContent(SeminarSchedule $schedule): string
    {
        return "SEMAR-" . $schedule->id . "-" . $schedule->seminar_id;
    }

    /**
     * Validate QR code content
     */
    public function validateQR(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_content' => 'required|string',
        ]);

        // Parse QR content
        $parts = explode('-', $validated['qr_content']);
        
        if (count($parts) !== 3 || $parts[0] !== 'SEMAR') {
            return response()->json([
                'message' => 'Format QR Code tidak valid'
            ], 422);
        }

        $scheduleId = $parts[1];
        $seminarId = $parts[2];

        $schedule = SeminarSchedule::with(['seminar'])->find($scheduleId);

        if (!$schedule) {
            return response()->json([
                'message' => 'QR Code tidak valid - jadwal tidak ditemukan'
            ], 422);
        }

        if ($schedule->seminar_id != $seminarId) {
            return response()->json([
                'message' => 'QR Code tidak valid - data tidak sesuai'
            ], 422);
        }

        return response()->json([
            'message' => 'QR Code valid',
            'data' => [
                'schedule_id' => $schedule->id,
                'seminar_title' => $schedule->seminar->judul,
                'schedule_time' => $schedule->getFormattedDateTime(),
                'ruangan' => $schedule->ruangan,
                'is_valid' => true,
            ]
        ]);
    }
}