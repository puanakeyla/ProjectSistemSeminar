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
        $user = $request->user();

        // Count approvals by status
        $approvalCounts = [
            'total' => SeminarApproval::where('dosen_id', $user->id)->count(),
            'menunggu' => SeminarApproval::where('dosen_id', $user->id)->menunggu()->count(),
            'setuju' => SeminarApproval::where('dosen_id', $user->id)->setuju()->count(),
            'ditolak' => SeminarApproval::where('dosen_id', $user->id)->ditolak()->count(),
        ];

        // Count seminars where dosen is involved
        $seminarCounts = [
            'pembimbing1' => Seminar::where('pembimbing1_id', $user->id)->count(),
            'pembimbing2' => Seminar::where('pembimbing2_id', $user->id)->count(),
            'penguji' => Seminar::where('penguji_id', $user->id)->count(),
            'total' => Seminar::where(function ($query) use ($user) {
                $query->where('pembimbing1_id', $user->id)
                    ->orWhere('pembimbing2_id', $user->id)
                    ->orWhere('penguji_id', $user->id);
            })->count(),
        ];

        // Get today's seminars
        $todaySeminars = SeminarSchedule::with(['seminar.mahasiswa'])
            ->whereHas('seminar', function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('pembimbing1_id', $user->id)
                        ->orWhere('pembimbing2_id', $user->id)
                        ->orWhere('penguji_id', $user->id);
                });
            })
            ->today()
            ->orderBy('waktu_mulai')
            ->get()
            ->map(function ($schedule) use ($user) {
                return $this->formatSeminarScheduleData($schedule, $user);
            });

        // Get pending approvals
        $pendingApprovals = SeminarApproval::with(['seminar.mahasiswa'])
            ->where('dosen_id', $user->id)
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
            'ruangan' => $schedule->ruangan,
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