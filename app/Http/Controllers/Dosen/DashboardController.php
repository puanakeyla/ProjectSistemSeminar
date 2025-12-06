<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarApproval;
use App\Models\SeminarSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get dashboard data for dosen
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Optimized: Single query for approval counts
        $approvalData = SeminarApproval::where('dosen_id', $userId)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as menunggu')
            ->selectRaw('SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) as setuju')
            ->selectRaw('SUM(CASE WHEN status = "rejected" THEN 1 ELSE 0 END) as ditolak')
            ->first();

        $approvalCounts = [
            'total' => $approvalData->total ?? 0,
            'menunggu' => $approvalData->menunggu ?? 0,
            'setuju' => $approvalData->setuju ?? 0,
            'ditolak' => $approvalData->ditolak ?? 0,
        ];

        // Optimized: Single query for seminar counts
        $seminarData = Seminar::where(function ($query) use ($userId) {
                $query->where('pembimbing1_id', $userId)
                    ->orWhere('pembimbing2_id', $userId)
                    ->orWhere('penguji_id', $userId);
            })
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN pembimbing1_id = ? THEN 1 ELSE 0 END) as pembimbing1', [$userId])
            ->selectRaw('SUM(CASE WHEN pembimbing2_id = ? THEN 1 ELSE 0 END) as pembimbing2', [$userId])
            ->selectRaw('SUM(CASE WHEN penguji_id = ? THEN 1 ELSE 0 END) as penguji', [$userId])
            ->first();

        $seminarCounts = [
            'pembimbing1' => $seminarData->pembimbing1 ?? 0,
            'pembimbing2' => $seminarData->pembimbing2 ?? 0,
            'penguji' => $seminarData->penguji ?? 0,
            'total' => $seminarData->total ?? 0,
        ];

        // Get today's seminars - optimized
        $todaySeminars = SeminarSchedule::with(['seminar:id,mahasiswa_id,judul,jenis_seminar,pembimbing1_id,pembimbing2_id,penguji_id', 'seminar.mahasiswa:id,name,npm'])
            ->select('id', 'seminar_id', 'ruang', 'waktu_mulai', 'waktu_selesai')
            ->whereHas('seminar', function ($query) use ($userId) {
                $query->where(function ($q) use ($userId) {
                    $q->where('pembimbing1_id', $userId)
                        ->orWhere('pembimbing2_id', $userId)
                        ->orWhere('penguji_id', $userId);
                });
            })
            ->today()
            ->orderBy('waktu_mulai')
            ->get()
            ->map(function ($schedule) use ($userId) {
                return $this->formatSeminarScheduleData($schedule, (object)['id' => $userId]);
            });

        // Get pending approvals - optimized
        $pendingApprovals = SeminarApproval::with(['seminar:id,mahasiswa_id,judul,jenis_seminar', 'seminar.mahasiswa:id,name,npm'])
            ->select('id', 'seminar_id', 'dosen_id', 'created_at')
            ->where('dosen_id', $userId)
            ->menunggu()
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($approval) {
                return [
                    'id' => $approval->id,
                    'seminar_id' => $approval->seminar_id,
                    'mahasiswa_name' => $approval->seminar->mahasiswa->name,
                    'mahasiswa_npm' => $approval->seminar->mahasiswa->npm,
                    'judul' => $approval->seminar->judul,
                    'jenis_seminar' => $approval->seminar->getJenisSeminarDisplay(),
                    'created_at' => $approval->created_at->format('d M Y'),
                    'days_pending' => $approval->created_at->diffInDays(now()),
                ];
            });

        // Get recently scheduled seminars - optimized
        $scheduledSeminars = Seminar::with(['mahasiswa:id,name,npm', 'schedule:id,seminar_id,waktu_mulai,ruang'])
            ->select('id', 'mahasiswa_id', 'judul', 'jenis_seminar', 'status', 'updated_at', 'pembimbing1_id', 'pembimbing2_id', 'penguji_id')
            ->where('status', 'scheduled')
            ->whereHas('schedule')
            ->where(function ($query) use ($userId) {
                $query->where('pembimbing1_id', $userId)
                    ->orWhere('pembimbing2_id', $userId)
                    ->orWhere('penguji_id', $userId);
            })
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($seminar) {
                return [
                    'id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'judul' => $seminar->judul,
                    'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
                    'waktu_mulai' => $seminar->schedule->waktu_mulai->format('d M Y H:i'),
                    'ruang' => $seminar->schedule->ruang,
                    'scheduled_at' => $seminar->updated_at->format('d M Y H:i'),
                    'days_ago' => $seminar->updated_at->diffInDays(now()),
                ];
            });

        // Get recently cancelled seminars - optimized
        $cancelledSeminars = Seminar::with(['mahasiswa:id,name,npm', 'cancelledBy:id,name,role'])
            ->select('id', 'mahasiswa_id', 'judul', 'jenis_seminar', 'cancel_reason', 'cancelled_at', 'cancelled_by', 'pembimbing1_id', 'pembimbing2_id', 'penguji_id')
            ->whereNotNull('cancelled_at')
            ->where(function ($query) use ($userId) {
                $query->where('pembimbing1_id', $userId)
                    ->orWhere('pembimbing2_id', $userId)
                    ->orWhere('penguji_id', $userId);
            })
            ->orderBy('cancelled_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($seminar) use ($userId) {
                return [
                    'id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'judul' => $seminar->judul,
                    'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
                    'cancel_reason' => $seminar->cancel_reason,
                    'cancelled_at' => $seminar->cancelled_at->format('d M Y H:i'),
                    'days_ago' => $seminar->cancelled_at->diffInDays(now()),
                    'cancelled_by_name' => $seminar->cancelledBy?->name,
                    'cancelled_by_role' => $seminar->cancelledBy?->role,
                ];
            });

        $user = $request->user();

        return response()->json([
            'message' => 'Dashboard data retrieved successfully',
            'data' => [
                'user' => [
                    'name' => $user->name,
                    'nidn' => $user->nidn,
                    'email' => $user->email,
                ],
                'approval_counts' => $approvalCounts,
                'seminar_counts' => $seminarCounts,
                'today_seminars' => $todaySeminars,
                'pending_approvals' => $pendingApprovals,
                'scheduled_seminars' => $scheduledSeminars,
                'cancelled_seminars' => $cancelledSeminars,
            ]
        ]);
    }

    /**
     * Get dosen profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get statistics
        $stats = [
            'total_approvals' => SeminarApproval::where('dosen_id', $user->id)->count(),
            'approved_seminars' => SeminarApproval::where('dosen_id', $user->id)->setuju()->count(),
            'rejected_seminars' => SeminarApproval::where('dosen_id', $user->id)->ditolak()->count(),
            'pending_approvals' => SeminarApproval::where('dosen_id', $user->id)->menunggu()->count(),
        ];

        return response()->json([
            'message' => 'Profile retrieved successfully',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'nidn' => $user->nidn,
                'role' => $user->getRoleDisplay(),
                'created_at' => $user->created_at->format('d F Y'),
                'statistics' => $stats,
            ]
        ]);
    }

    /**
     * Get upcoming seminars for dosen
     */
    public function upcomingSeminars(Request $request): JsonResponse
    {
        $user = $request->user();

        $upcomingSeminars = SeminarSchedule::with(['seminar.mahasiswa', 'seminar.pembimbing1', 'seminar.pembimbing2', 'seminar.penguji'])
            ->whereHas('seminar', function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('pembimbing1_id', $user->id)
                        ->orWhere('pembimbing2_id', $user->id)
                        ->orWhere('penguji_id', $user->id);
                })
                ->where('status', 'approved');
            })
            ->upcoming()
            ->orderBy('waktu_mulai')
            ->get()
            ->map(function ($schedule) use ($user) {
                return $this->formatSeminarScheduleData($schedule, $user, true);
            });

        return response()->json([
            'message' => 'Upcoming seminars retrieved successfully',
            'data' => $upcomingSeminars
        ]);
    }

    /**
     * Format seminar schedule data for response
     */
    private function formatSeminarScheduleData(SeminarSchedule $schedule, $user, $detailed = false): array
    {
        $seminar = $schedule->seminar;
        $userRole = $this->getUserRoleInSeminar($seminar, $user);

        $data = [
            'id' => $schedule->id,
            'seminar_id' => $seminar->id,
            'judul' => $seminar->judul,
            'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
            'mahasiswa_name' => $seminar->mahasiswa->name,
            'mahasiswa_npm' => $seminar->mahasiswa->npm,
            'ruangan' => $schedule->ruang,
            'tanggal_jam' => $schedule->waktu_mulai->format('Y-m-d H:i:s'),
            'tanggal_display' => $schedule->getFormattedDate(),
            'waktu_display' => $schedule->getFormattedTime(),
            'user_role' => $userRole,
            'is_today' => $schedule->isToday(),
            'is_upcoming' => $schedule->isUpcoming(),
        ];

        if ($detailed) {
            $data['pembimbing1'] = [
                'name' => $seminar->pembimbing1->name,
                'nidn' => $seminar->pembimbing1->nidn,
            ];
            $data['pembimbing2'] = [
                'name' => $seminar->pembimbing2->name,
                'nidn' => $seminar->pembimbing2->nidn,
            ];
            $data['penguji'] = [
                'name' => $seminar->penguji->name,
                'nidn' => $seminar->penguji->nidn,
            ];
            $data['qr_code'] = $schedule->qr_code;
        }

        return $data;
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