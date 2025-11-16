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
        $user = $request->user();

        // Count seminars by status
        $seminarCounts = [
            'total' => Seminar::where('mahasiswa_id', $user->id)->count(),
            'menunggu' => Seminar::where('mahasiswa_id', $user->id)->menunggu()->count(),
            'disetujui' => Seminar::where('mahasiswa_id', $user->id)->disetujui()->count(),
            'ditolak' => Seminar::where('mahasiswa_id', $user->id)->ditolak()->count(),
        ];

        // Count attended seminars
        $attendedSeminarsCount = SeminarAttendance::where('mahasiswa_id', $user->id)->count();

        // Get recent seminars
        $recentSeminars = Seminar::with(['pembimbing1', 'pembimbing2', 'penguji', 'approvals'])
            ->where('mahasiswa_id', $user->id)
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
                    'pembimbing2_status' => $seminar->getApprovalStatus($seminar->pembimbing2_id),
                    'penguji_status' => $seminar->getApprovalStatus($seminar->penguji_id),
                ];
            });

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