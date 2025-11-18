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
        $seminars = Seminar::with(['schedule'])
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
        $seminar = Seminar::with(['schedule'])
            ->where('mahasiswa_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'message' => 'Seminar detail',
            'data' => $this->mapSeminar($seminar, true),
        ]);
    }

    /** Store new seminar (versi sederhana tanpa upload & approvals) */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'tipe' => ['required', Rule::in(['proposal','hasil','kompre'])],
            'abstrak' => 'nullable|string',
        ]);

        $seminar = Seminar::create([
            'mahasiswa_id' => $user->id,
            'judul' => $validated['judul'],
            'tipe' => $validated['tipe'],
            'abstrak' => $validated['abstrak'] ?? null,
            'status' => 'draft',
        ]);

        return response()->json([
            'message' => 'Seminar created (draft)',
            'data' => $this->mapSeminar($seminar),
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

    /** Dosen list sementara kosong (karena skema dosen belum selaras) */
    public function getDosenList(): JsonResponse
    {
        return response()->json([
            'message' => 'Fitur dosen list belum diaktifkan',
            'data' => []
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
            'created_at' => $s->created_at?->toIso8601String(),
        ];

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