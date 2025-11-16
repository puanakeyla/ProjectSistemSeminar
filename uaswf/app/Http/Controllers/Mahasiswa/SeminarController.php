<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarApproval;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SeminarController extends Controller
{
    /**
     * Get all seminars for current mahasiswa
     */
    public function index(Request $request): JsonResponse
    {
        $seminars = Seminar::with(['pembimbing1', 'pembimbing2', 'penguji', 'approvals', 'schedule'])
            ->where('mahasiswa_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($seminar) {
                return $this->formatSeminarData($seminar);
            });

        return response()->json([
            'message' => 'Seminars retrieved successfully',
            'data' => $seminars
        ]);
    }

    /**
     * Get specific seminar
     */
    public function show(Request $request, $id): JsonResponse
    {
        $seminar = Seminar::with(['pembimbing1', 'pembimbing2', 'penguji', 'approvals', 'schedule', 'revisions'])
            ->where('mahasiswa_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'message' => 'Seminar retrieved successfully',
            'data' => $this->formatSeminarData($seminar, true)
        ]);
    }

    /**
     * Create new seminar submission
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // Validate request
        $validated = $request->validate([
            'judul' => 'required|string|max:500',
            'jenis_seminar' => ['required', Rule::in(['proposal', 'hasil', 'kompre'])],
            'pembimbing1_id' => 'required|exists:users,id',
            'pembimbing2_id' => 'required|exists:users,id',
            'penguji_id' => 'required|exists:users,id',
            'file_persyaratan' => 'required|file|mimes:pdf|max:10240', // 10MB max
        ]);

        // Check if pembimbing and penguji are dosen
        $this->validateDosen($validated['pembimbing1_id'], 'Pembimbing 1');
        $this->validateDosen($validated['pembimbing2_id'], 'Pembimbing 2');
        $this->validateDosen($validated['penguji_id'], 'Penguji');

        // Upload file
        $filePath = $request->file('file_persyaratan')->store('seminar_files');

        // Create seminar
        $seminar = Seminar::create([
            'mahasiswa_id' => $user->id,
            'judul' => $validated['judul'],
            'jenis_seminar' => $validated['jenis_seminar'],
            'pembimbing1_id' => $validated['pembimbing1_id'],
            'pembimbing2_id' => $validated['pembimbing2_id'],
            'penguji_id' => $validated['penguji_id'],
            'file_persyaratan' => $filePath,
            'status' => 'menunggu',
        ]);

        // Create approval records
        $dosenIds = [
            $validated['pembimbing1_id'],
            $validated['pembimbing2_id'],
            $validated['penguji_id']
        ];

        foreach ($dosenIds as $dosenId) {
            SeminarApproval::create([
                'seminar_id' => $seminar->id,
                'dosen_id' => $dosenId,
                'status' => 'menunggu',
            ]);
        }

        return response()->json([
            'message' => 'Pengajuan seminar berhasil dikirim',
            'data' => $this->formatSeminarData($seminar->load(['pembimbing1', 'pembimbing2', 'penguji', 'approvals']))
        ], 201);
    }

    /**
     * Get available dosen for dropdown
     */
    public function getDosenList(): JsonResponse
    {
        $dosens = User::dosen()
            ->select('id', 'name', 'nidn')
            ->orderBy('name')
            ->get()
            ->map(function ($dosen) {
                return [
                    'id' => $dosen->id,
                    'name' => $dosen->name,
                    'nidn' => $dosen->nidn,
                    'display' => $dosen->name . ' (' . $dosen->nidn . ')'
                ];
            });

        return response()->json([
            'message' => 'Dosen list retrieved successfully',
            'data' => $dosens
        ]);
    }

    /**
     * Get seminar status with approval details
     */
    public function getStatus(Request $request, $id): JsonResponse
    {
        $seminar = Seminar::with(['approvals.dosen', 'pembimbing1', 'pembimbing2', 'penguji'])
            ->where('mahasiswa_id', $request->user()->id)
            ->findOrFail($id);

        $approvalDetails = $seminar->approvals->map(function ($approval) {
            return [
                'dosen_id' => $approval->dosen_id,
                'dosen_name' => $approval->dosen->name,
                'status' => $approval->status,
                'status_display' => $approval->getStatusDisplay(),
                'status_color' => $approval->getStatusColor(),
                'alasan' => $approval->alasan,
                'updated_at' => $approval->updated_at->format('d M Y H:i'),
            ];
        });

        return response()->json([
            'message' => 'Seminar status retrieved successfully',
            'data' => [
                'seminar' => $this->formatSeminarData($seminar),
                'approval_details' => $approvalDetails,
                'overall_status' => [
                    'status' => $seminar->status,
                    'status_display' => $seminar->getStatusDisplay(),
                    'status_color' => $seminar->getStatusColor(),
                    'is_approved_by_all' => $seminar->isApprovedByAllDosen(),
                ]
            ]
        ]);
    }

    /**
     * Validate that user is a dosen
     */
    private function validateDosen($userId, $roleName): void
    {
        $dosen = User::find($userId);
        if (!$dosen || !$dosen->isDosen()) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                strtolower($roleName) => ["User yang dipilih harus berperan sebagai dosen."]
            ]);
        }
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
            'file_persyaratan' => $seminar->file_persyaratan,
            'file_persyaratan_url' => Storage::url($seminar->file_persyaratan),
            'created_at' => $seminar->created_at->format('d M Y H:i'),
            'updated_at' => $seminar->updated_at->format('d M Y H:i'),
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
        ];

        if ($detailed) {
            $data['approvals'] = $seminar->approvals->map(function ($approval) {
                return [
                    'dosen_id' => $approval->dosen_id,
                    'dosen_name' => $approval->dosen->name,
                    'status' => $approval->status,
                    'status_display' => $approval->getStatusDisplay(),
                    'alasan' => $approval->alasan,
                    'updated_at' => $approval->updated_at->format('d M Y H:i'),
                ];
            });

            $data['schedule'] = $seminar->schedule ? [
                'ruangan' => $seminar->schedule->ruangan,
                'tanggal_jam' => $seminar->schedule->tanggal_jam->format('Y-m-d\TH:i'),
                'tanggal_jam_display' => $seminar->schedule->getFormattedDateTime(),
                'qr_code' => $seminar->schedule->qr_code,
            ] : null;

            $data['revisions'] = $seminar->revisions->map(function ($revision) {
                return [
                    'id' => $revision->id,
                    'file_revisi' => $revision->file_revisi,
                    'file_revisi_url' => Storage::url($revision->file_revisi),
                    'status' => $revision->status,
                    'status_display' => $revision->getStatusDisplay(),
                    'status_color' => $revision->getStatusColor(),
                    'catatan_mahasiswa' => $revision->catatan_mahasiswa,
                    'catatan_dosen' => $revision->catatan_dosen,
                    'tanggal_pengumpulan' => $revision->tanggal_pengumpulan?->format('d M Y H:i'),
                    'tanggal_verifikasi' => $revision->tanggal_verifikasi?->format('d M Y H:i'),
                ];
            });
        }

        return $data;
    }
}