<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarApproval;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SeminarController extends Controller
{
    /**
     * List seminars milik mahasiswa login
     * Include revision information
     */
    public function index(Request $request): JsonResponse
    {
        // Optimize with select and eager loading
        $seminars = Seminar::select(['id', 'mahasiswa_id', 'pembimbing1_id', 'pembimbing2_id', 'penguji_id', 'judul', 'jenis_seminar', 'status', 'created_at', 'cancelled_at', 'cancel_reason', 'cancelled_by'])
            ->with([
                'schedule:id,seminar_id,tanggal,waktu_mulai,ruangan',
                'cancelledBy:id,name,role',
                'approvals' => function($query) {
                    $query->select(['id', 'seminar_id', 'dosen_id', 'peran', 'status'])
                          ->orderByRaw("CASE peran WHEN 'pembimbing1' THEN 1 WHEN 'pembimbing2' THEN 2 WHEN 'penguji' THEN 3 END");
                },
                'approvals.dosen:id,name',
                'pembimbing1:id,name',
                'pembimbing2:id,name',
                'penguji:id,name',
                'revisions' => function($query) {
                    $query->select(['id', 'seminar_id', 'status', 'created_at'])
                          ->latest()
                          ->limit(1)
                          ->with(['items:id,seminar_revision_id,status,created_by']);
                }
            ])
            ->where('mahasiswa_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function($seminar) {
                $latestRevision = $seminar->revisions->first();
                
                $data = $this->mapSeminar($seminar);
                
                // Add revision data
                $data['revision'] = $latestRevision ? [
                    'id' => $latestRevision->id,
                    'status' => $latestRevision->status,
                    'total_items' => $latestRevision->items->count(),
                    'approved_items' => $latestRevision->items->where('status', 'approved')->count(),
                    'pending_items' => $latestRevision->items->where('status', 'pending')->count(),
                    'submitted_items' => $latestRevision->items->where('status', 'submitted')->count(),
                    'progress' => $latestRevision->getProgressPercentage(),
                ] : null;
                
                return $data;
            });

        return response()->json([
            'message' => 'Seminars retrieved',
            'data' => $seminars,
        ]);
    }

    /** Show single seminar with full revision details */
    public function show(Request $request, int $id): JsonResponse
    {
        $seminar = Seminar::with([
                'schedule', 
                'approvals.dosen',
                'cancelledBy:id,name,role',
                'pembimbing1:id,name,email',
                'pembimbing2:id,name,email',
                'penguji:id,name,email',
                'revisions.items.createdBy:id,name',
                'revisions.items.validator:id,name'
            ])
            ->where('mahasiswa_id', $request->user()->id)
            ->findOrFail($id);

        $data = $this->mapSeminar($seminar, true);
        
        // Add full revision details
        $latestRevision = $seminar->revisions->first();
        if ($latestRevision) {
            // Group items by dosen
            $itemsByDosen = $latestRevision->items->groupBy('created_by')->map(function($items, $dosenId) {
                $firstItem = $items->first();
                return [
                    'dosen_id' => $dosenId,
                    'dosen_name' => $firstItem->createdBy->name,
                    'total_items' => $items->count(),
                    'approved_items' => $items->where('status', 'approved')->count(),
                    'pending_items' => $items->where('status', 'pending')->count(),
                    'submitted_items' => $items->where('status', 'submitted')->count(),
                    'rejected_items' => $items->where('status', 'rejected')->count(),
                    'items' => $items->map(function($item) {
                        return [
                            'id' => $item->id,
                            'poin_revisi' => $item->poin_revisi,
                            'kategori' => $item->kategori,
                            'status' => $item->status,
                            'status_display' => $item->getStatusDisplay(),
                            'status_color' => $item->getStatusColor(),
                            'mahasiswa_notes' => $item->mahasiswa_notes,
                            'file_path' => $item->file_path,
                            'file_url' => $item->getFileUrl(),
                            'rejection_reason' => $item->rejection_reason,
                            'revision_count' => $item->revision_count,
                            'submitted_at' => $item->submitted_at?->format('d M Y H:i'),
                            'validated_at' => $item->validated_at?->format('d M Y H:i'),
                            'validator' => $item->validator ? $item->validator->name : null,
                        ];
                    })->values()
                ];
            })->values();

            $data['revision'] = [
                'id' => $latestRevision->id,
                'status' => $latestRevision->status,
                'catatan_dosen' => $latestRevision->catatan_dosen,
                'progress' => $latestRevision->getProgressPercentage(),
                'total_items' => $latestRevision->items->count(),
                'approved_items' => $latestRevision->items->where('status', 'approved')->count(),
                'pending_items' => $latestRevision->items->where('status', 'pending')->count(),
                'submitted_items' => $latestRevision->items->where('status', 'submitted')->count(),
                'rejected_items' => $latestRevision->items->where('status', 'rejected')->count(),
                'items_by_dosen' => $itemsByDosen,
                'approval_status' => $seminar->getRevisionApprovalStatus(),
            ];
        }

        return response()->json([
            'message' => 'Seminar detail',
            'data' => $data,
        ]);
    }

    /** Cancel an existing seminar submission */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $seminar = Seminar::with(['schedule', 'approvals'])
            ->where('mahasiswa_id', $request->user()->id)
            ->findOrFail($id);

        if ($seminar->isCancelled()) {
            return response()->json([
                'message' => 'Pengajuan sudah dibatalkan sebelumnya.',
                'data' => $this->mapSeminar($seminar),
            ], 409);
        }

        if ($seminar->status === 'finished') {
            return response()->json([
                'message' => 'Seminar yang sudah selesai tidak dapat dibatalkan.'
            ], 422);
        }

        $seminar->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancelled_by' => $request->user()->id,
            'cancel_reason' => $validated['reason'] ?? 'Dibatalkan oleh mahasiswa',
        ]);

        if ($seminar->schedule && $seminar->schedule->status !== 'completed') {
            $seminar->schedule->update(['status' => 'cancelled']);
        }

        foreach ($seminar->approvals->where('status', 'pending') as $approval) {
            $approval->update([
                'status' => 'cancelled',
                'catatan' => trim(($approval->catatan ? $approval->catatan . ' | ' : '') . 'Dibatalkan oleh mahasiswa'),
            ]);
        }

        // Send notifications to all dosen and admin
        NotificationService::notifySeminarCancelledByMahasiswa(
            $seminar->fresh(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji']),
            $validated['reason'] ?? null
        );

        return response()->json([
            'message' => 'Pengajuan seminar berhasil dibatalkan.',
            'data' => $this->mapSeminar($seminar->fresh(['schedule', 'approvals.dosen'])),
        ]);
    }

    /** Store new seminar with dosen selection and file upload */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'tipe' => ['required', Rule::in(['proposal','hasil','kompre'])],
            'abstrak' => 'nullable|string',
            'pembimbing1_id' => 'required|exists:users,id',
            'pembimbing2_id' => 'required|exists:users,id|different:pembimbing1_id',
            'penguji_id' => 'required|exists:users,id|different:pembimbing1_id,pembimbing2_id',
            'file_berkas' => 'required|file|mimes:pdf,zip|max:10240', // 10MB
        ]);

        // Upload file
        $filePath = null;
        if ($request->hasFile('file_berkas')) {
            $file = $request->file('file_berkas');
            $fileName = time() . '_' . $user->npm . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('seminar_berkas', $fileName, 'public');
        }

        // Create seminar
        $seminar = Seminar::create([
            'mahasiswa_id' => $user->id,
            'pembimbing1_id' => $validated['pembimbing1_id'],
            'pembimbing2_id' => $validated['pembimbing2_id'],
            'penguji_id' => $validated['penguji_id'],
            'judul' => $validated['judul'],
            'tipe' => $validated['tipe'],
            'abstrak' => $validated['abstrak'] ?? null,
            'file_berkas' => $filePath,
            'status' => 'pending_verification',
        ]);

        // Create approval records for all 3 dosen
        $dosenAssignments = [
            ['dosen_id' => $validated['pembimbing1_id'], 'peran' => 'pembimbing1'],
            ['dosen_id' => $validated['pembimbing2_id'], 'peran' => 'pembimbing2'],
            ['dosen_id' => $validated['penguji_id'], 'peran' => 'penguji'],
        ];

        foreach ($dosenAssignments as $assignment) {
            SeminarApproval::create([
                'seminar_id' => $seminar->id,
                'dosen_id' => $assignment['dosen_id'],
                'peran' => $assignment['peran'],
                'status' => 'pending',
            ]);
        }

        // Send notification to all stakeholders
        NotificationService::notifyNewSeminarSubmission($seminar);

        return response()->json([
            'message' => 'Pengajuan seminar berhasil dikirim. Menunggu persetujuan dosen.',
            'data' => $this->mapSeminar($seminar->fresh(['pembimbing1', 'pembimbing2', 'penguji'])),
        ], 201);
    }

    /** Status seminar (ringkas) */
    public function getStatus(Request $request, int $id): JsonResponse
    {
        $seminar = Seminar::where('mahasiswa_id', $request->user()->id)->findOrFail($id);
        return response()->json([
            'message' => 'Seminar status',
            'data' => [
                'id' => $seminar->id,
                'status' => $seminar->status,
                'status_display' => $seminar->getStatusDisplay(),
                'status_color' => $seminar->getStatusColor(),
            ]
        ]);
    }

    /** Get list of dosen for selection */
    public function getDosenList(): JsonResponse
    {
        $dosenList = User::where('role', 'dosen')
            ->select('id', 'name', 'email', 'nidn')
            ->orderBy('name')
            ->get();

        return response()->json([
            'message' => 'Dosen list retrieved successfully',
            'data' => $dosenList
        ]);
    }

    private function mapSeminar(Seminar $s, bool $detailed = false): array
    {
        $data = [
            'id' => $s->id,
            'judul' => $s->judul,
            'tipe' => $s->tipe,
            'tipe_display' => $s->getJenisSeminarDisplay(),
            'status' => $s->status,
            'status_display' => $s->getStatusDisplay(),
            'status_color' => $s->getStatusColor(),
            'admin_status' => match ($s->status) {
                'approved' => 'scheduling',
                'scheduled', 'finished' => 'approved',
                'revising' => 'rejected',
                'cancelled' => 'cancelled',
                default => 'pending',
            },
            'admin_status_display' => match ($s->status) {
                'approved' => 'Proses Penentuan Jadwal',
                'scheduled' => 'Jadwal Telah Ditentukan',
                'finished' => 'Seminar Selesai',
                'revising' => 'Ditolak - Perlu Revisi',
                'cancelled' => $s->cancel_reason ? 'Dibatalkan' : 'Dibatalkan',
                default => 'Menunggu Persetujuan Dosen',
            },
            'created_at' => $s->created_at?->toIso8601String(),
            'cancelled_at' => $s->cancelled_at?->toIso8601String(),
            'cancel_reason' => $s->cancel_reason,
            'is_cancelled' => $s->isCancelled(),
            'cancelled_by_name' => $s->cancelledBy?->name,
            'cancelled_by_role' => $s->cancelledBy?->role,
        ];

        if ($s->relationLoaded('approvals')) {
            $data['approvals'] = $s->approvals->map(function ($approval) {
                return [
                    'id' => $approval->id,
                    'peran' => $approval->peran,
                    'status' => $approval->status,
                    'status_display' => $approval->getStatusDisplay(),
                    'status_color' => $approval->getStatusColor(),
                    'dosen' => $approval->dosen ? [
                        'id' => $approval->dosen->id,
                        'name' => $approval->dosen->name,
                        'nidn' => $approval->dosen->nidn,
                    ] : null,
                    'updated_at' => $approval->updated_at?->toIso8601String(),
                ];
            });
        }

        if ($s->schedule) {
            $data['schedule'] = [
                'waktu_mulai' => $s->schedule->waktu_mulai?->toIso8601String(),
                'durasi_menit' => $s->schedule->durasi_menit,
                'ruang' => $s->schedule->ruang,
                'status' => $s->schedule->status,
            ];
        }

        if ($detailed) {
            $data['abstrak'] = $s->abstrak;
            $data['skor_total'] = $s->skor_total;
        }

        return $data;
    }
}