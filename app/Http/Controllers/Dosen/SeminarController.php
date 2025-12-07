<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarRevision;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SeminarController extends Controller
{
    /**
     * Get list of seminars for dosen
     * Shows seminars where dosen is pembimbing1, pembimbing2, or penguji
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Simplified query to avoid timeout
        // Only show seminars that are scheduled and have schedule
        $seminars = Seminar::select(['id', 'mahasiswa_id', 'pembimbing1_id', 'pembimbing2_id', 'penguji_id', 'judul', 'tipe', 'status', 'created_at'])
            ->with([
                'mahasiswa:id,name,npm',
                'pembimbing1:id,name',
                'pembimbing2:id,name',
                'penguji:id,name',
                'schedule:id,seminar_id,waktu_mulai,durasi_menit,ruang,status'
            ])
            ->where(function($query) use ($user) {
                $query->where('pembimbing1_id', $user->id)
                      ->orWhere('pembimbing2_id', $user->id)
                      ->orWhere('penguji_id', $user->id);
            })
            ->whereIn('status', ['scheduled', 'finished']) // Only scheduled/finished seminars
            ->whereHas('schedule') // Only seminars with schedule
            ->orderBy('created_at', 'desc')
            ->limit(100) // Limit to prevent timeout
            ->get()
            ->map(function($seminar) use ($user) {

                // Determine dosen role
                $role = '';
                if ($seminar->pembimbing1_id == $user->id) {
                    $role = 'Pembimbing 1';
                } elseif ($seminar->pembimbing2_id == $user->id) {
                    $role = 'Pembimbing 2';
                } elseif ($seminar->penguji_id == $user->id) {
                    $role = 'Penguji';
                }

                return [
                    'id' => $seminar->id,
                    'judul' => $seminar->judul,
                    'jenis_seminar' => $seminar->tipe,
                    'jenis_seminar_display' => $seminar->getJenisSeminarDisplay(),
                    'status' => $seminar->status,
                    'status_display' => $seminar->getStatusDisplay(),
                    'status_color' => $seminar->getStatusColor(),
                    'my_role' => $role,
                    'mahasiswa' => [
                        'id' => $seminar->mahasiswa->id,
                        'name' => $seminar->mahasiswa->name,
                        'npm' => $seminar->mahasiswa->npm,
                    ],
                    'pembimbing1' => $seminar->pembimbing1 ? [
                        'id' => $seminar->pembimbing1->id,
                        'name' => $seminar->pembimbing1->name,
                    ] : null,
                    'pembimbing2' => $seminar->pembimbing2 ? [
                        'id' => $seminar->pembimbing2->id,
                        'name' => $seminar->pembimbing2->name,
                    ] : null,
                    'penguji' => $seminar->penguji ? [
                        'id' => $seminar->penguji->id,
                        'name' => $seminar->penguji->name,
                    ] : null,
                    'schedule' => $seminar->schedule ? [
                        'id' => $seminar->schedule->id,
                        'waktu_mulai' => $seminar->schedule->waktu_mulai->format('Y-m-d H:i:s'),
                        'durasi_menit' => $seminar->schedule->durasi_menit,
                        'ruangan' => $seminar->schedule->ruang,
                        'formatted_date' => $seminar->schedule->waktu_mulai->format('d M Y'),
                        'formatted_time' => $seminar->schedule->waktu_mulai->format('H:i') . ' - ' . $seminar->schedule->waktu_mulai->addMinutes($seminar->schedule->durasi_menit)->format('H:i'),
                        'tanggal_jam' => $seminar->schedule->waktu_mulai->format('d M Y \· H:i'),
                        'waktu_mulai_iso' => $seminar->schedule->waktu_mulai->format('Y-m-d H:i:s'),
                        'is_today' => $seminar->schedule->waktu_mulai->isToday(),
                        'is_upcoming' => $seminar->schedule->waktu_mulai->isFuture(),
                        'is_past' => $seminar->schedule->waktu_mulai->isPast(),
                    ] : null,
                    'created_at' => $seminar->created_at->format('d M Y H:i'),
                ];
            });

        return response()->json([
            'message' => 'Seminars retrieved successfully',
            'data' => $seminars
        ]);
    }

    /**
     * Get seminar detail with revision items
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $seminar = Seminar::with([
                'mahasiswa:id,name,npm,email',
                'pembimbing1:id,name,email',
                'pembimbing2:id,name,email',
                'penguji:id,name,email',
                'schedule',
                'revisions.items.createdBy:id,name',
                'revisions.items.validator:id,name'
            ])
            ->findOrFail($id);

        // Check access
        if (!$this->isDosenInvolvedInSeminar($seminar, $user)) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses'
            ], 403);
        }

        // Determine dosen role
        $role = '';
        if ($seminar->pembimbing1_id == $user->id) {
            $role = 'Pembimbing 1';
        } elseif ($seminar->pembimbing2_id == $user->id) {
            $role = 'Pembimbing 2';
        } elseif ($seminar->penguji_id == $user->id) {
            $role = 'Penguji';
        }

        // Get latest revision
        $latestRevision = $seminar->revisions->first();

        // Group items by dosen if revision exists
        $itemsByDosen = null;
        $myItems = collect([]);
        if ($latestRevision) {
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

            // Get items created by current dosen
            $myItems = $latestRevision->items->where('created_by', $user->id)->map(function($item) {
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
            })->values();
        }

        return response()->json([
            'message' => 'Seminar detail retrieved successfully',
            'data' => [
                'id' => $seminar->id,
                'judul' => $seminar->judul,
                'deskripsi' => $seminar->deskripsi,
                'jenis_seminar' => $seminar->tipe,
                'jenis_seminar_display' => $seminar->getJenisSeminarDisplay(),
                'status' => $seminar->status,
                'status_display' => $seminar->getStatusDisplay(),
                'status_color' => $seminar->getStatusColor(),
                'file_proposal' => $seminar->file_proposal,
                'file_url' => $seminar->file_proposal ? url('storage/' . $seminar->file_proposal) : null,
                'my_role' => $role,
                'mahasiswa' => [
                    'id' => $seminar->mahasiswa->id,
                    'name' => $seminar->mahasiswa->name,
                    'npm' => $seminar->mahasiswa->npm,
                    'email' => $seminar->mahasiswa->email,
                ],
                'pembimbing1' => $seminar->pembimbing1 ? [
                    'id' => $seminar->pembimbing1->id,
                    'name' => $seminar->pembimbing1->name,
                    'email' => $seminar->pembimbing1->email,
                ] : null,
                'pembimbing2' => $seminar->pembimbing2 ? [
                    'id' => $seminar->pembimbing2->id,
                    'name' => $seminar->pembimbing2->name,
                    'email' => $seminar->pembimbing2->email,
                ] : null,
                'penguji' => $seminar->penguji ? [
                    'id' => $seminar->penguji->id,
                    'name' => $seminar->penguji->name,
                    'email' => $seminar->penguji->email,
                ] : null,
                'schedule' => $seminar->schedule ? [
                    'id' => $seminar->schedule->id,
                    'waktu_mulai' => $seminar->schedule->waktu_mulai->format('Y-m-d H:i:s'),
                    'durasi_menit' => $seminar->schedule->durasi_menit,
                    'ruangan' => $seminar->schedule->ruang,
                    'formatted_date' => $seminar->schedule->waktu_mulai->format('d M Y'),
                    'formatted_time' => $seminar->schedule->waktu_mulai->format('H:i') . ' - ' . $seminar->schedule->waktu_mulai->copy()->addMinutes($seminar->schedule->durasi_menit)->format('H:i'),
                ] : null,
                'revision' => $latestRevision ? [
                    'id' => $latestRevision->id,
                    'status' => $latestRevision->status,
                    'catatan_dosen' => $latestRevision->catatan_dosen,
                    'progress' => $latestRevision->getProgressPercentage(),
                    'total_items' => $latestRevision->items->count(),
                    'approved_items' => $latestRevision->items->where('status', 'approved')->count(),
                    'pending_items' => $latestRevision->items->where('status', 'pending')->count(),
                    'submitted_items' => $latestRevision->items->where('status', 'submitted')->count(),
                    'items_by_dosen' => $itemsByDosen,
                    'my_items' => $myItems,
                    'approval_status' => $seminar->getRevisionApprovalStatus(),
                ] : null,
                'created_at' => $seminar->created_at->format('d M Y H:i'),
            ]
        ]);
    }

    /**
     * Check if dosen is involved in seminar
     */
    private function isDosenInvolvedInSeminar(Seminar $seminar, $user): bool
    {
        return $seminar->pembimbing1_id == $user->id
            || $seminar->pembimbing2_id == $user->id
            || $seminar->penguji_id == $user->id;
    }

    /**
     * Check-in for dosen attendance
     */
    public function checkIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'seminar_schedule_id' => 'required|exists:seminar_schedules,id',
        ]);

        $user = $request->user();
        $schedule = \App\Models\SeminarSchedule::with(['seminar'])->findOrFail($validated['seminar_schedule_id']);
        $seminar = $schedule->seminar;

        // Check if dosen is involved in this seminar
        if (!$this->isDosenInvolvedInSeminar($seminar, $user)) {
            return response()->json([
                'message' => 'Anda tidak terlibat dalam seminar ini'
            ], 403);
        }

        // TIME VALIDATION: Check if within check-in period
        // Dosen can check-in: 2 hours before until 1 hour after seminar ends
        $checkInStartTime = $schedule->waktu_mulai->copy()->subHours(2);
        $checkInEndTime = $schedule->getEndTime()->addHour();
        $now = now();

        if ($now < $checkInStartTime) {
            $hoursUntil = $now->diffInHours($checkInStartTime);
            return response()->json([
                'message' => "Check-in belum dapat dilakukan. Silakan check-in {$hoursUntil} jam lagi (2 jam sebelum seminar dimulai).",
                'waktu_mulai_checkin' => $checkInStartTime->format('d M Y H:i'),
                'waktu_seminar' => $schedule->waktu_mulai->format('d M Y H:i'),
            ], 422);
        }

        if ($now > $checkInEndTime) {
            return response()->json([
                'message' => 'Waktu check-in telah berakhir (1 jam setelah seminar selesai).',
                'waktu_selesai_checkin' => $checkInEndTime->format('d M Y H:i'),
            ], 422);
        }

        // Determine dosen role
        $role = '';
        if ($seminar->pembimbing1_id == $user->id) {
            $role = 'pembimbing1';
        } elseif ($seminar->pembimbing2_id == $user->id) {
            $role = 'pembimbing2';
        } elseif ($seminar->penguji_id == $user->id) {
            $role = 'penguji';
        }

        // Check if already checked in
        $existingAttendance = \App\Models\DosenAttendance::where('seminar_schedule_id', $schedule->id)
            ->where('dosen_id', $user->id)
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Anda sudah melakukan check-in untuk seminar ini',
                'data' => [
                    'status' => $existingAttendance->status,
                    'confirmed_at' => $existingAttendance->confirmed_at->format('d M Y H:i'),
                ]
            ], 422);
        }

        // Record dosen attendance
        $attendance = \App\Models\DosenAttendance::create([
            'seminar_schedule_id' => $schedule->id,
            'dosen_id' => $user->id,
            'role' => $role,
            'status' => 'hadir',
            'confirmed_at' => now(),
        ]);

        // Broadcast event ke admin untuk real-time notification
        broadcast(new \App\Events\LecturerCheckedIn($attendance))->toOthers();

        return response()->json([
            'message' => 'Check-in berhasil dicatat',
            'data' => [
                'id' => $attendance->id,
                'seminar_title' => $seminar->judul,
                'role' => $role,
                'role_display' => $attendance->getRoleDisplay(),
                'ruangan' => $schedule->ruang,
                'confirmed_at' => $attendance->confirmed_at->format('d M Y H:i'),
                'status' => $attendance->status,
            ]
        ]);
    }

    /**
     * Get dosen's attendance history
     */
    public function myAttendanceHistory(Request $request): JsonResponse
    {
        $user = $request->user();

        $attendances = \App\Models\DosenAttendance::with(['schedule.seminar.mahasiswa'])
            ->where('dosen_id', $user->id)
            ->orderBy('confirmed_at', 'desc')
            ->get()
            ->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'seminar_title' => $attendance->schedule->seminar->judul,
                    'mahasiswa_name' => $attendance->schedule->seminar->mahasiswa->name,
                    'mahasiswa_npm' => $attendance->schedule->seminar->mahasiswa->npm,
                    'role' => $attendance->getRoleDisplay(),
                    'status' => $attendance->getStatusDisplay(),
                    'ruangan' => $attendance->schedule->ruang,
                    'tanggal_seminar' => $attendance->schedule->waktu_mulai->format('d M Y'),
                    'waktu_seminar' => $attendance->schedule->waktu_mulai->format('H:i'),
                    'confirmed_at' => $attendance->confirmed_at->format('d M Y H:i'),
                ];
            });

        return response()->json([
            'message' => 'Attendance history retrieved successfully',
            'data' => [
                'total' => $attendances->count(),
                'attendances' => $attendances,
            ]
        ]);
    }
}
