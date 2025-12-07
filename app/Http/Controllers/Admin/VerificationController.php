<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarApproval;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class VerificationController extends Controller
{
    /**
     * Get all seminars for verification
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $status = $request->get('status', 'all'); // all, pending_verification, approved, revising

            $query = Seminar::with([
                'mahasiswa:id,name,npm',
                'pembimbing1:id,name',
                'pembimbing2:id,name',
                'penguji:id,name',
                'approvals:id,seminar_id,dosen_id,peran,status,catatan,updated_at',
                'approvals.dosen:id,name'
            ]);

            if ($status !== 'all') {
                $query->where('status', $status);
            }

            $seminars = $query->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($seminar) {
                    return $this->formatSeminarData($seminar);
                });

            return response()->json([
                'message' => 'Seminars for verification retrieved successfully',
                'data' => $seminars
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching seminars: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal memuat daftar seminar',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get specific seminar for verification
     */
    public function show($id): JsonResponse
    {
        try {
            $seminar = Seminar::with([
                    'mahasiswa:id,name,npm',
                    'pembimbing1:id,name,nidn',
                    'pembimbing2:id,name,nidn',
                    'penguji:id,name,nidn',
                    'approvals:id,seminar_id,dosen_id,peran,status,catatan,updated_at',
                    'approvals.dosen:id,name,nidn'
                ])
                ->findOrFail($id);

            $approvalDetails = $seminar->approvals->map(function ($approval) use ($seminar) {
                return [
                    'dosen_id' => $approval->dosen_id,
                    'dosen_name' => $approval->dosen->name ?? 'N/A',
                    'dosen_nidn' => $approval->dosen->nidn ?? 'N/A',
                    'role' => $this->getDosenRole($seminar, $approval->dosen_id),
                    'peran' => $approval->peran,
                    'status' => $approval->status,
                    'status_display' => $approval->getStatusDisplay(),
                    'status_color' => $approval->getStatusColor(),
                    'catatan' => $approval->catatan,
                    'updated_at' => $approval->updated_at->format('d M Y H:i'),
                ];
            });

            return response()->json([
                'message' => 'Seminar verification detail retrieved successfully',
                'data' => [
                    'seminar' => $this->formatSeminarData($seminar, true),
                    'approval_details' => $approvalDetails,
                    'file_url' => $seminar->file_berkas ? Storage::url($seminar->file_berkas) : null,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching seminar detail: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal memuat detail seminar',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify seminar (approve/reject by admin)
     */
    public function verifySeminar(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'alasan' => 'required_if:status,rejected|nullable|string|max:1000',
        ]);

        $seminar = Seminar::with(['approvals'])->findOrFail($id);

        // Check if all dosen have approved
        if ($validated['status'] === 'approved' && !$seminar->isApprovedByAllDosen()) {
            return response()->json([
                'message' => 'Tidak dapat menyetujui seminar. Belum semua dosen memberikan persetujuan.'
            ], 422);
        }

        // Update seminar status
        $updateData = [];
        if ($validated['status'] === 'approved') {
            // Log verification history
            $verificationHistory = $seminar->verification_history ?? [];
            $verificationHistory[] = [
                'admin_id' => $request->user()->id,
                'admin_name' => $request->user()->name,
                'action' => 'verified',
                'timestamp' => now()->toIso8601String(),
            ];

            $updateData = [
                'status' => 'approved', // Approved by admin - ready for scheduling
                'verified_at' => now(),
                'verification_history' => $verificationHistory,
            ];
        } else {
            // Log rejection history
            $verificationHistory = $seminar->verification_history ?? [];
            $verificationHistory[] = [
                'admin_id' => $request->user()->id,
                'admin_name' => $request->user()->name,
                'action' => 'rejected',
                'reason' => $validated['alasan'],
                'timestamp' => now()->toIso8601String(),
            ];

            $updateData = [
                'status' => 'revising',
                'alasan_ditolak' => $validated['alasan'],
                'verification_history' => $verificationHistory,
            ];
        }

        $seminar->update($updateData);

        // Send notifications
        if ($validated['status'] === 'approved') {
            NotificationService::notifyAdminVerificationApproved($seminar, $request->user());
        } else {
            NotificationService::notifyAdminVerificationRejected($seminar, $request->user(), $validated['alasan']);
        }

        $message = $validated['status'] === 'approved'
            ? 'Seminar berhasil diverifikasi dan siap dijadwalkan'
            : 'Seminar membutuhkan revisi';

        return response()->json([
            'message' => $message,
            'data' => $this->formatSeminarData($seminar->fresh(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji']))
        ]);
    }

    /**
     * Get seminars pending admin verification
     */
    public function pendingVerification(): JsonResponse
    {
        $seminars = Seminar::with(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji', 'approvals.dosen'])
            ->where('status', 'pending_verification')
            ->whereDoesntHave('approvals', function ($query) {
                $query->menunggu(); // No pending approvals
            }) // All dosen have approved
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($seminar) {
                return $this->formatSeminarData($seminar);
            });

        return response()->json([
            'message' => 'Pending verification seminars retrieved successfully',
            'data' => $seminars
        ]);
    }

    /**
     * Get verification statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_seminars' => Seminar::count(),
            'pending_verification' => Seminar::where('status', 'pending_verification')
                ->whereDoesntHave('approvals', function ($query) {
                    $query->menunggu();
                })
                ->count(),
            'approved_seminars' => Seminar::disetujui()->count(),
            'revising_seminars' => Seminar::ditolak()->count(),
            'awaiting_dosen_approval' => Seminar::where('status', 'pending_verification')
                ->whereHas('approvals', function ($query) {
                    $query->menunggu();
                })
                ->count(),
        ];

        return response()->json([
            'message' => 'Verification statistics retrieved successfully',
            'data' => $stats
        ]);
    }

    /**
     * Format seminar data for response
     */
    private function formatSeminarData(Seminar $seminar, $detailed = false): array
    {
        $data = [
            'id' => $seminar->id,
            'judul' => $seminar->judul,
            'tipe' => $seminar->tipe,
            'jenis_seminar' => $seminar->tipe,
            'jenis_seminar_display' => $seminar->getJenisSeminarDisplay(),
            'status' => $seminar->status,
            'status_display' => $seminar->getStatusDisplay(),
            'status_color' => $seminar->getStatusColor(),
            'mahasiswa' => [
                'id' => $seminar->mahasiswa->id ?? null,
                'name' => $seminar->mahasiswa->name ?? 'N/A',
                'npm' => $seminar->mahasiswa->npm ?? 'N/A',
                'email' => $seminar->mahasiswa->email ?? 'N/A',
            ],
            'pembimbing1' => $seminar->pembimbing1 ? [
                'id' => $seminar->pembimbing1->id,
                'name' => $seminar->pembimbing1->name,
                'nidn' => $seminar->pembimbing1->nidn ?? 'N/A',
            ] : null,
            'pembimbing2' => $seminar->pembimbing2 ? [
                'id' => $seminar->pembimbing2->id,
                'name' => $seminar->pembimbing2->name,
                'nidn' => $seminar->pembimbing2->nidn ?? 'N/A',
            ] : null,
            'penguji' => $seminar->penguji ? [
                'id' => $seminar->penguji->id,
                'name' => $seminar->penguji->name,
                'nidn' => $seminar->penguji->nidn ?? 'N/A',
            ] : null,
            'created_at' => $seminar->created_at->format('d M Y H:i'),
            'is_approved_by_all_dosen' => $seminar->isApprovedByAllDosen(),
            'approvals' => $seminar->approvals->map(function ($approval) {
                return [
                    'id' => $approval->id,
                    'dosen_id' => $approval->dosen_id,
                    'dosen' => [
                        'id' => $approval->dosen->id ?? null,
                        'name' => $approval->dosen->name ?? 'N/A',
                        'nidn' => $approval->dosen->nidn ?? 'N/A',
                    ],
                    'peran' => $approval->peran,
                    'status' => $approval->status,
                    'available_dates' => $approval->available_dates,
                    'catatan' => $approval->catatan,
                    'approved_at' => $approval->approved_at ? $approval->approved_at->format('d M Y H:i') : null,
                    'updated_at' => $approval->updated_at->format('d M Y H:i'),
                ];
            }),
        ];

        if ($detailed) {
            $data['file_persyaratan'] = $seminar->file_persyaratan;
            $data['file_persyaratan_url'] = Storage::url($seminar->file_persyaratan);
            $data['alasan_ditolak'] = $seminar->alasan_ditolak;
        }

        return $data;
    }

    /**
     * Get dosen role in seminar
     */
    private function getDosenRole(Seminar $seminar, $dosenId): string
    {
        if ($seminar->pembimbing1_id == $dosenId) {
            return 'Pembimbing 1';
        } elseif ($seminar->pembimbing2_id == $dosenId) {
            return 'Pembimbing 2';
        } elseif ($seminar->penguji_id == $dosenId) {
            return 'Penguji';
        }

        return 'Unknown';
    }
}
