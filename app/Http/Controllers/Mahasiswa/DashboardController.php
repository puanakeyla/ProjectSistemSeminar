<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarAttendance;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get dashboard data for mahasiswa
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Optimized: Single query with selectRaw for counts
        $counts = Seminar::where('mahasiswa_id', $userId)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN status = "pending_verification" THEN 1 ELSE 0 END) as pending_verification')
            ->selectRaw('SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) as approved')
            ->selectRaw('SUM(CASE WHEN status = "revising" THEN 1 ELSE 0 END) as revising')
            ->first();

        $seminarCounts = [
            'total' => $counts->total ?? 0,
            'pending_verification' => $counts->pending_verification ?? 0,
            'approved' => $counts->approved ?? 0,
            'revising' => $counts->revising ?? 0,
        ];

        // Count attended seminars
        $attendedSeminarsCount = SeminarAttendance::where('mahasiswa_id', $userId)->count();

        // Get recent seminars - optimized with select()
        $recentSeminars = Seminar::with(['pembimbing1:id,name', 'pembimbing2:id,name', 'penguji:id,name', 'approvals:id,seminar_id,dosen_id,status'])
            ->select('id', 'judul', 'jenis_seminar', 'status', 'created_at', 'pembimbing1_id', 'pembimbing2_id', 'penguji_id', 'mahasiswa_id')
            ->where('mahasiswa_id', $userId)
            ->whereNull('cancelled_at')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($seminar) {
                return [
                    'id' => $seminar->id,
                    'judul' => $seminar->judul,
                    'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
                    'status' => $seminar->getStatusDisplay(),
                    'status_color' => $seminar->getStatusColor(),
                    'created_at' => $seminar->created_at->format('d M Y'),
                    'pembimbing1_status' => $seminar->getApprovalStatus($seminar->pembimbing1_id),
                    'pembimbing2_status' => $seminar->pembimbing2_id ? $seminar->getApprovalStatus($seminar->pembimbing2_id) : null,
                    'penguji_status' => $seminar->penguji_id ? $seminar->getApprovalStatus($seminar->penguji_id) : null,
                ];
            });

        // Get recently scheduled seminars - optimized
        $scheduledSeminars = Seminar::with('schedule:id,seminar_id,waktu_mulai,ruang')
            ->select('id', 'judul', 'jenis_seminar', 'status', 'updated_at')
            ->where('mahasiswa_id', $userId)
            ->where('status', 'scheduled')
            ->whereHas('schedule')
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($seminar) {
                return [
                    'id' => $seminar->id,
                    'judul' => $seminar->judul,
                    'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
                    'waktu_mulai' => $seminar->schedule->waktu_mulai->format('d M Y H:i'),
                    'ruang' => $seminar->schedule->ruang,
                    'scheduled_at' => $seminar->updated_at->format('d M Y H:i'),
                    'days_ago' => $seminar->updated_at->diffInDays(now()),
                ];
            });

        // Get cancelled seminars - optimized
        $cancelledSeminars = Seminar::with('cancelledBy:id,name,role')
            ->select('id', 'judul', 'jenis_seminar', 'cancel_reason', 'cancelled_at', 'cancelled_by')
            ->where('mahasiswa_id', $userId)
            ->whereNotNull('cancelled_at')
            ->orderBy('cancelled_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($seminar) {
                return [
                    'id' => $seminar->id,
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
                    'npm' => $user->npm,
                    'email' => $user->email,
                ],
                'counts' => $seminarCounts,
                'attended_seminars_count' => $attendedSeminarsCount,
                'recent_seminars' => $recentSeminars,
                'scheduled_seminars' => $scheduledSeminars,
                'cancelled_seminars' => $cancelledSeminars,
            ]
        ]);
    }

    /**
     * Get mahasiswa profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'message' => 'Profile retrieved successfully',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'npm' => $user->npm,
                'role' => $user->getRoleDisplay(),
                'created_at' => $user->created_at->format('d F Y'),
            ]
        ]);
    }
}