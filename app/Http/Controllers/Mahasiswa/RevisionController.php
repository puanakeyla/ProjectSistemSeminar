<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarRevision;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class RevisionController extends Controller
{
    /**
     * Get revisions for mahasiswa's seminars
     */
    public function index(Request $request): JsonResponse
    {
        $revisions = SeminarRevision::with(['seminar'])
            ->whereHas('seminar', function ($query) use ($request) {
                $query->where('mahasiswa_id', $request->user()->id);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($revision) {
                return $this->formatRevisionData($revision);
            });

        return response()->json([
            'message' => 'Revisions retrieved successfully',
            'data' => $revisions
        ]);
    }

    /**
     * Submit new revision
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'seminar_id' => 'required|exists:seminars,id',
            'file_revisi' => 'required|file|mimes:pdf,doc,docx|max:10240', // 10MB max
            'catatan_mahasiswa' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();

        // Verify that seminar belongs to mahasiswa
        $seminar = Seminar::where('id', $validated['seminar_id'])
            ->where('mahasiswa_id', $user->id)
            ->firstOrFail();

        // Check if seminar is approved
        if ($seminar->status !== 'approved') {
            return response()->json([
                'message' => 'Hanya dapat mengumpulkan revisi untuk seminar yang telah disetujui'
            ], 422);
        }

        // Upload revision file
        $filePath = $request->file('file_revisi')->store('revision_files');

        // Create revision record
        $revision = SeminarRevision::create([
            'seminar_id' => $validated['seminar_id'],
            'file_revisi' => $filePath,
            'catatan_mahasiswa' => $validated['catatan_mahasiswa'],
            'status' => 'submitted',
            'tanggal_pengumpulan' => now(),
        ]);

        return response()->json([
            'message' => 'Revisi berhasil diunggah',
            'data' => $this->formatRevisionData($revision->load('seminar'))
        ], 201);
    }

    /**
     * Get specific revision
     */
    public function show(Request $request, $id): JsonResponse
    {
        $revision = SeminarRevision::with(['seminar'])
            ->whereHas('seminar', function ($query) use ($request) {
                $query->where('mahasiswa_id', $request->user()->id);
            })
            ->findOrFail($id);

        return response()->json([
            'message' => 'Revision retrieved successfully',
            'data' => $this->formatRevisionData($revision, true)
        ]);
    }

    /**
     * Get seminars that can have revisions submitted
     */
    public function getAvailableSeminars(Request $request): JsonResponse
    {
        $seminars = Seminar::with(['schedule'])
            ->where('mahasiswa_id', $request->user()->id)
            ->where('status', 'approved')
            ->whereHas('schedule') // Only seminars that have been scheduled
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($seminar) {
                return [
                    'id' => $seminar->id,
                    'judul' => $seminar->judul,
                    'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
                    'tanggal_seminar' => $seminar->schedule ? $seminar->schedule->getFormattedDate() : 'Belum dijadwalkan',
                    'has_pending_revision' => $seminar->revisions()->menunggu()->exists(),
                ];
            });

        return response()->json([
            'message' => 'Available seminars retrieved successfully',
            'data' => $seminars
        ]);
    }

    /**
     * Get revision status for a seminar
     */
    public function getSeminarRevisions(Request $request, $seminarId): JsonResponse
    {
        $revisions = SeminarRevision::with(['seminar'])
            ->whereHas('seminar', function ($query) use ($request, $seminarId) {
                $query->where('mahasiswa_id', $request->user()->id)
                    ->where('id', $seminarId);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($revision) {
                return $this->formatRevisionData($revision, true);
            });

        $seminar = Seminar::where('mahasiswa_id', $request->user()->id)
            ->findOrFail($seminarId);

        return response()->json([
            'message' => 'Seminar revisions retrieved successfully',
            'data' => [
                'seminar' => [
                    'id' => $seminar->id,
                    'judul' => $seminar->judul,
                    'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
                ],
                'revisions' => $revisions
            ]
        ]);
    }

    /**
     * Format revision data for response
     */
    private function formatRevisionData(SeminarRevision $revision, $detailed = false): array
    {
        $data = [
            'id' => $revision->id,
            'seminar_id' => $revision->seminar_id,
            'seminar_judul' => $revision->seminar->judul,
            'file_revisi' => $revision->file_revisi,
            'file_revisi_url' => Storage::url($revision->file_revisi),
            'file_name' => basename($revision->file_revisi),
            'status' => $revision->status,
            'status_display' => $revision->getStatusDisplay(),
            'status_color' => $revision->getStatusColor(),
            'tanggal_pengumpulan' => $revision->tanggal_pengumpulan?->format('d M Y H:i'),
            'created_at' => $revision->created_at->format('d M Y H:i'),
        ];

        if ($detailed) {
            $data['catatan_mahasiswa'] = $revision->catatan_mahasiswa;
            $data['catatan_dosen'] = $revision->catatan_dosen;
            $data['tanggal_verifikasi'] = $revision->tanggal_verifikasi?->format('d M Y H:i');
            
            $data['seminar_details'] = [
                'judul' => $revision->seminar->judul,
                'jenis_seminar' => $revision->seminar->getJenisSeminarDisplay(),
                'pembimbing1' => $revision->seminar->pembimbing1->name,
                'pembimbing2' => $revision->seminar->pembimbing2->name,
                'penguji' => $revision->seminar->penguji->name,
            ];
        }

        return $data;
    }
}