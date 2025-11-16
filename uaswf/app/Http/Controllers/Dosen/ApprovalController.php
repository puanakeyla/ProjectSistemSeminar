<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarApproval;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ApprovalController extends Controller
{
    /**
     * Get all pending approvals for dosen
     */
    public function pendingApprovals(Request $request): JsonResponse
    {
        $approvals = SeminarApproval::with([
                'seminar.mahasiswa', 
                'seminar.pembimbing1', 
                'seminar.pembimbing2', 
                'seminar.penguji'
            ])
            ->where('dosen_id', $request->user()->id)
            ->menunggu()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($approval) {
                return $this->formatApprovalData($approval);
            });

        return response()->json([
            'message' => 'Pending approvals retrieved successfully',
            'data' => $approvals
        ]);
    }

    /**
     * Get all approvals history for dosen
     */
    public function approvalHistory(Request $request): JsonResponse
    {
        $status = $request->get('status', 'all'); // all, setuju, ditolak

        $query = SeminarApproval::with([
            'seminar.mahasiswa', 
            'seminar.pembimbing1', 
            'seminar.pembimbing2', 
            'seminar.penguji'
        ])
        ->where('dosen_id', $request->user()->id);

        // Filter by status
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $approvals = $query->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($approval) {
                return $this->formatApprovalData($approval, true);
            });

        return response()->json([
            'message' => 'Approval history retrieved successfully',
            'data' => $approvals
        ]);
    }

    /**
     * Get specific approval detail
     */
    public function showApproval(Request $request, $id): JsonResponse
    {
        $approval = SeminarApproval::with([
                'seminar.mahasiswa', 
                'seminar.pembimbing1', 
                'seminar.pembimbing2', 
                'seminar.penguji',
                'seminar.approvals.dosen'
            ])
            ->where('dosen_id', $request->user()->id)
            ->findOrFail($id);

        // Get other approvals for this seminar
        $otherApprovals = $approval->seminar->approvals
            ->where('id', '!=', $approval->id)
            ->map(function ($otherApproval) {
                return [
                    'dosen_name' => $otherApproval->dosen->name,
                    'status' => $otherApproval->status,
                    'status_display' => $otherApproval->getStatusDisplay(),
                    'status_color' => $otherApproval->getStatusColor(),
                    'alasan' => $otherApproval->alasan,
                    'updated_at' => $otherApproval->updated_at->format('d M Y H:i'),
                ];
            });

        return response()->json([
            'message' => 'Approval detail retrieved successfully',
            'data' => [
                'approval' => $this->formatApprovalData($approval, true),
                'other_approvals' => $otherApprovals,
                'seminar_status' => [
                    'status' => $approval->seminar->status,
                    'status_display' => $approval->seminar->getStatusDisplay(),
                    'is_approved_by_all' => $approval->seminar->isApprovedByAllDosen(),
                ]
            ]
        ]);
    }

    /**
     * Approve or reject seminar submission
     */
    public function updateApproval(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['setuju', 'ditolak'])],
            'alasan' => 'required_if:status,ditolak|nullable|string|max:1000',
        ]);

        $approval = SeminarApproval::with(['seminar'])
            ->where('dosen_id', $request->user()->id)
            ->where('status', 'menunggu') // Only allow updating pending approvals
            ->findOrFail($id);

        // Update approval
        $approval->update([
            'status' => $validated['status'],
            'alasan' => $validated['alasan'] ?? null,
        ]);

        // Check if all approvals are completed
        $this->checkSeminarOverallStatus($approval->seminar);

        return response()->json([
            'message' => $validated['status'] === 'setuju' 
                ? 'Seminar berhasil disetujui' 
                : 'Seminar berhasil ditolak',
            'data' => $this->formatApprovalData($approval->fresh(['seminar.mahasiswa']), true)
        ]);
    }

    /**
     * Get seminars where dosen is involved
     */
    public function mySeminars(Request $request): JsonResponse
    {
        $status = $request->get('status', 'all'); // all, menunggu, disetujui, ditolak

        $query = Seminar::with(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji', 'approvals', 'schedule'])
            ->where(function ($query) use ($request) {
                $query->where('pembimbing1_id', $request->user()->id)
                    ->orWhere('pembimbing2_id', $request->user()->id)
                    ->orWhere('penguji_id', $request->user()->id);
            });

        // Filter by status
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $seminars = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($seminar) use ($request) {
                return $this->formatSeminarData($seminar, $request->user());
            });

        return response()->json([
            'message' => 'My seminars retrieved successfully',
            'data' => $seminars
        ]);
    }

    /**
     * Mark attendance status for seminar (hadir/tidak hadir)
     */
    public function updateAttendanceStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'seminar_schedule_id' => 'required|exists:seminar_schedules,id',
            'status' => ['required', Rule::in(['hadir', 'tidak_hadir'])],
            'alasan' => 'required_if:status,tidak_hadir|nullable|string|max:500',
        ]);

        $user = $request->user();
        $schedule = \App\Models\SeminarSchedule::with(['seminar'])->find($validated['seminar_schedule_id']);

        // Check if dosen is involved in this seminar
        $seminar = $schedule->seminar;
        if (!$this->isDosenInvolvedInSeminar($seminar, $user)) {
            return response()->json([
                'message' => 'Anda tidak terlibat dalam seminar ini'
            ], 403);
        }

        // Here you would typically save to a separate table for dosen attendance
        // For now, we'll just return success message
        // In real implementation, you might have a `dosen_attendances` table

        $statusMessage = $validated['status'] === 'hadir' 
            ? 'Konfirmasi kehadiran berhasil' 
            : 'Konfirmasi ketidakhadiran berhasil';

        return response()->json([
            'message' => $statusMessage,
            'data' => [
                'seminar_title' => $seminar->judul,
                'tanggal_jam' => $schedule->getFormattedDateTime(),
                'ruangan' => $schedule->ruangan,
                'status' => $validated['status'],
                'alasan' => $validated['alasan'] ?? null,
                'confirmed_at' => now()->format('d M Y H:i'),
            ]
        ]);
    }

    /**
     * Get statistics for approvals
     */
    public function getStatistics(Request $request): JsonResponse
    {
        $user = $request->user();

        $statistics = [
            'total_approvals' => SeminarApproval::where('dosen_id', $user->id)->count(),
            'approved' => SeminarApproval::where('dosen_id', $user->id)->setuju()->count(),
            'rejected' => SeminarApproval::where('dosen_id', $user->id)->ditolak()->count(),
            'pending' => SeminarApproval::where('dosen_id', $user->id)->menunggu()->count(),
            'approval_rate' => 0,
        ];

        // Calculate approval rate
        $totalProcessed = $statistics['approved'] + $statistics['rejected'];
        if ($totalProcessed > 0) {
            $statistics['approval_rate'] = round(($statistics['approved'] / $totalProcessed) * 100, 2);
        }

        // Monthly statistics
        $monthlyStats = SeminarApproval::where('dosen_id', $user->id)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $statistics['current_month'] = [
            'approved' => $monthlyStats['setuju'] ?? 0,
            'rejected' => $monthlyStats['ditolak'] ?? 0,
            'pending' => $monthlyStats['menunggu'] ?? 0,
        ];

        return response()->json([
            'message' => 'Statistics retrieved successfully',
            'data' => $statistics
        ]);
    }

    /**
     * Check and update seminar overall status
     */
    private function checkSeminarOverallStatus(Seminar $seminar): void
    {
        $approvals = $seminar->approvals;

        // If any approval is rejected, seminar is rejected
        if ($approvals->where('status', 'ditolak')->count() > 0) {
            $seminar->update(['status' => 'ditolak']);
            return;
        }

        // If all approvals are approved, seminar is approved
        if ($approvals->where('status', 'setuju')->count() === 3) {
            $seminar->update(['status' => 'disetujui']);
            return;
        }

        // Otherwise, status remains 'menunggu'
    }

    /**
     * Check if dosen is involved in seminar
     */
    private function isDosenInvolvedInSeminar(Seminar $seminar, $user): bool
    {
        return in_array($user->id, [
            $seminar->pembimbing1_id,
            $seminar->pembimbing2_id,
            $seminar->penguji_id
        ]);
    }

    /**
     * Format approval data for response
     */
    private function formatApprovalData(SeminarApproval $approval, $detailed = false): array
    {
        $seminar = $approval->seminar;

        $data = [
            'id' => $approval->id,
            'seminar_id' => $approval->seminar_id,
            'mahasiswa_name' => $seminar->mahasiswa->name,
            'mahasiswa_npm' => $seminar->mahasiswa->npm,
            'judul' => $seminar->judul,
            'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
            'status' => $approval->status,
            'status_display' => $approval->getStatusDisplay(),
            'status_color' => $approval->getStatusColor(),
            'created_at' => $approval->created_at->format('d M Y'),
            'updated_at' => $approval->updated_at->format('d M Y H:i'),
            'days_pending' => $approval->created_at->diffInDays(now()),
        ];

        if ($detailed) {
            $data['alasan'] = $approval->alasan;
            $data['seminar_details'] = [
                'file_persyaratan' => $seminar->file_persyaratan,
                'pembimbing1' => $seminar->pembimbing1->name,
                'pembimbing2' => $seminar->pembimbing2->name,
                'penguji' => $seminar->penguji->name,
                'seminar_status' => $seminar->getStatusDisplay(),
            ];
        }

        return $data;
    }

    /**
     * Format seminar data for response
     */
    private function formatSeminarData(Seminar $seminar, $user): array
    {
        $userRole = $this->getUserRoleInSeminar($seminar, $user);

        return [
            'id' => $seminar->id,
            'judul' => $seminar->judul,
            'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
            'mahasiswa_name' => $seminar->mahasiswa->name,
            'mahasiswa_npm' => $seminar->mahasiswa->npm,
            'status' => $seminar->status,
            'status_display' => $seminar->getStatusDisplay(),
            'status_color' => $seminar->getStatusColor(),
            'user_role' => $userRole,
            'created_at' => $seminar->created_at->format('d M Y'),
            'schedule' => $seminar->schedule ? [
                'ruangan' => $seminar->schedule->ruangan,
                'tanggal_jam' => $seminar->schedule->tanggal_jam->format('d M Y H:i'),
                'is_upcoming' => $seminar->schedule->isUpcoming(),
            ] : null,
            'approval_status' => $seminar->getApprovalStatus($user->id),
        ];
    }

    /**
     * Get user's role in a seminar
     */
    private function getUserRoleInSeminar(Seminar $seminar, $user): string
    {
        if ($seminar->pembimbing1_id == $user->id) {
            return 'Pembimbing 1';
        } elseif ($seminar->pembimbing2_id == $user->id) {
            return 'Pembimbing 2';
        } elseif ($seminar->penguji_id == $user->id) {
            return 'Penguji';
        }

        return 'Unknown';
    }
}