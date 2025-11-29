<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarApproval;
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
        $status = $request->get('status', 'all'); // all, pending_verification, approved, revising

        $query = Seminar::with(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji', 'approvals.dosen']);

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
    }

    /**
     * Get specific seminar for verification
     */
    public function show($id): JsonResponse
    {
        $seminar = Seminar::with([
                'mahasiswa', 
                'pembimbing1', 
                'pembimbing2', 
                'penguji', 
                'approvals.dosen'
            ])
            ->findOrFail($id);

        $approvalDetails = $seminar->approvals->map(function ($approval) {
            return [
                'dosen_id' => $approval->dosen_id,
                'dosen_name' => $approval->dosen->name,
                'dosen_nidn' => $approval->dosen->nidn,
                'role' => $this->getDosenRole($seminar, $approval->dosen_id),
                'status' => $approval->status,
                'status_display' => $approval->getStatusDisplay(),
                'status_color' => $approval->getStatusColor(),
                'alasan' => $approval->alasan,
                'updated_at' => $approval->updated_at->format('d M Y H:i'),
            ];
        });

        return response()->json([
            'message' => 'Seminar verification detail retrieved successfully',
            'data' => [
                'seminar' => $this->formatSeminarData($seminar, true),
                'approval_details' => $approvalDetails,
                'file_url' => Storage::url($seminar->file_persyaratan),
            ]
        ]);
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
        $newStatus = $validated['status'] === 'approved' ? 'approved' : 'revising';
        $seminar->update([
            'status' => $newStatus,
            'alasan_ditolak' => $validated['status'] === 'rejected' ? $validated['alasan'] : null,
        ]);

        $message = $validated['status'] === 'approved' 
            ? 'Seminar berhasil disetujui' 
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
            ->whereHas('approvals', function ($query) {
                $query->setuju();
            }, '=', 3) // All 3 dosen have approved
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
                ->whereHas('approvals', function ($query) {
                    $query->setuju();
                }, '=', 3)
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
            'jenis_seminar' => $seminar->jenis_seminar,
            'jenis_seminar_display' => $seminar->getJenisSeminarDisplay(),
            'status' => $seminar->status,
            'status_display' => $seminar->getStatusDisplay(),
            'status_color' => $seminar->getStatusColor(),
            'mahasiswa' => [
                'id' => $seminar->mahasiswa->id,
                'name' => $seminar->mahasiswa->name,
                'npm' => $seminar->mahasiswa->npm,
                'email' => $seminar->mahasiswa->email,
            ],
            'pembimbing1' => [
                'id' => $seminar->pembimbing1->id,
                'name' => $seminar->pembimbing1->name,
                'nidn' => $seminar->pembimbing1->nidn,
            ],
            'pembimbing2' => [
                'id' => $seminar->pembimbing2->id,
                'name' => $seminar->pembimbing2->name,
                'nidn' => $seminar->pembimbing2->nidn,
            ],
            'penguji' => [
                'id' => $seminar->penguji->id,
                'name' => $seminar->penguji->name,
                'nidn' => $seminar->penguji->nidn,
            ],
            'created_at' => $seminar->created_at->format('d M Y H:i'),
            'is_approved_by_all_dosen' => $seminar->isApprovedByAllDosen(),
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