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
     * List seminars milik mahasiswa login
     */
    public function index(Request $request): JsonResponse
    {
        $seminars = Seminar::with(['schedule', 'approvals.dosen'])
            ->where('mahasiswa_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($s) => $this->mapSeminar($s));

        return response()->json([
            'message' => 'Seminars retrieved',
            'data' => $seminars,
        ]);
    }

    /** Show single seminar */
    public function show(Request $request, int $id): JsonResponse
    {
        $seminar = Seminar::with(['schedule', 'approvals.dosen'])
            ->where('mahasiswa_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'message' => 'Seminar detail',
            'data' => $this->mapSeminar($seminar, true),
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
            ->select('id', 'name', 'email', 'npm')
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
                'approved', 'scheduled', 'finished' => 'approved',
                'revising' => 'rejected',
                default => 'pending',
            },
            'created_at' => $s->created_at?->toIso8601String(),
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