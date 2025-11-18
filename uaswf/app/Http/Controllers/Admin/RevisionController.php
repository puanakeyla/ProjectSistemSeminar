<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeminarRevision;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RevisionController extends Controller
{
    /**
     * Get all revisions (with optional status filter)
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->get('status'); // pending, approved, rejected

        $query = SeminarRevision::with([
            'seminar.mahasiswa',
            'seminar.pembimbing1',
            'seminar.pembimbing2',
            'seminar.penguji'
        ])
        ->orderBy('created_at', 'desc');

        // Filter by status if provided
        if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $status);
        }

        $revisions = $query->get()->map(function ($revision) {
            return $this->formatRevisionData($revision);
        });

        return response()->json([
            'message' => 'Revisions retrieved successfully',
            'data' => $revisions
        ]);
    }

    /**
     * Get single revision detail
     */
    public function show($id): JsonResponse
    {
        $revision = SeminarRevision::with([
            'seminar.mahasiswa',
            'seminar.pembimbing1',
            'seminar.pembimbing2',
            'seminar.penguji',
            'seminar.schedule'
        ])->findOrFail($id);

        return response()->json([
            'message' => 'Revision detail retrieved successfully',
            'data' => $this->formatRevisionData($revision, true)
        ]);
    }

    /**
     * Validate revision (approve/reject)
     */
    public function validate(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'catatan_admin' => 'nullable|string|max:1000',
        ]);

        $revision = SeminarRevision::findOrFail($id);

        // Prevent re-validation
        if ($revision->status !== 'pending') {
            return response()->json([
                'message' => 'Revisi sudah divalidasi sebelumnya'
            ], 422);
        }

        // Update revision status
        $revision->update([
            'status' => $validated['status'],
            'catatan_admin' => $validated['catatan_admin'] ?? null,
            'tanggal_verifikasi' => now(),
        ]);

        // If approved, update seminar status to completed
        if ($validated['status'] === 'approved') {
            $revision->seminar->update([
                'status' => 'selesai'
            ]);
        }

        return response()->json([
            'message' => $validated['status'] === 'approved' 
                ? 'Revisi berhasil disetujui' 
                : 'Revisi ditolak',
            'data' => $this->formatRevisionData($revision->fresh())
        ]);
    }

    /**
     * Get revision statistics
     */
    public function statistics(): JsonResponse
    {
        $pending = SeminarRevision::where('status', 'pending')->count();
        $approved = SeminarRevision::where('status', 'approved')->count();
        $rejected = SeminarRevision::where('status', 'rejected')->count();
        $total = SeminarRevision::count();

        return response()->json([
            'message' => 'Revision statistics retrieved successfully',
            'data' => [
                'total' => $total,
                'pending' => $pending,
                'approved' => $approved,
                'rejected' => $rejected,
            ]
        ]);
    }

    /**
     * Format revision data for response
     */
    private function formatRevisionData(SeminarRevision $revision, bool $detailed = false): array
    {
        $data = [
            'id' => $revision->id,
            'seminar_id' => $revision->seminar_id,
            'revision_number' => $revision->id, // Can be improved with actual revision count
            'status' => $revision->status,
            'status_display' => $this->getStatusDisplay($revision->status),
            
            // Mahasiswa info
            'mahasiswa' => [
                'id' => $revision->seminar->mahasiswa->id,
                'name' => $revision->seminar->mahasiswa->name,
                'npm' => $revision->seminar->mahasiswa->npm,
            ],
            
            // Seminar info
            'seminar' => [
                'id' => $revision->seminar->id,
                'judul' => $revision->seminar->judul,
                'tipe' => $revision->seminar->tipe,
                'tipe_display' => $revision->seminar->getJenisSeminarDisplay(),
            ],
            
            // File info
            'file_revisi' => $revision->file_revisi,
            'file_url' => $revision->file_revisi ? asset('storage/' . $revision->file_revisi) : null,
            
            // Dates
            'tanggal_pengumpulan' => $revision->tanggal_pengumpulan?->format('Y-m-d H:i:s'),
            'tanggal_pengumpulan_display' => $revision->tanggal_pengumpulan?->format('d M Y H:i'),
            'created_at' => $revision->created_at?->format('Y-m-d H:i:s'),
        ];

        if ($detailed) {
            $data['catatan_mahasiswa'] = $revision->catatan_mahasiswa;
            $data['catatan_admin'] = $revision->catatan_admin;
            $data['tanggal_verifikasi'] = $revision->tanggal_verifikasi?->format('Y-m-d H:i:s');
            $data['tanggal_verifikasi_display'] = $revision->tanggal_verifikasi?->format('d M Y H:i');
            
            // Add pembimbing and penguji info
            $data['pembimbing1'] = [
                'id' => $revision->seminar->pembimbing1->id,
                'name' => $revision->seminar->pembimbing1->name,
            ];
            $data['pembimbing2'] = [
                'id' => $revision->seminar->pembimbing2->id,
                'name' => $revision->seminar->pembimbing2->name,
            ];
            $data['penguji'] = [
                'id' => $revision->seminar->penguji->id,
                'name' => $revision->seminar->penguji->name,
            ];

            // Schedule info if exists
            if ($revision->seminar->schedule) {
                $data['schedule'] = [
                    'waktu_mulai' => $revision->seminar->schedule->waktu_mulai?->format('Y-m-d H:i:s'),
                    'ruang' => $revision->seminar->schedule->ruang,
                    'status' => $revision->seminar->schedule->status,
                ];
            }
        }

        return $data;
    }

    /**
     * Get status display text
     */
    private function getStatusDisplay(string $status): string
    {
        return match($status) {
            'pending' => 'Menunggu Validasi',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            default => ucfirst($status),
        };
    }
}
