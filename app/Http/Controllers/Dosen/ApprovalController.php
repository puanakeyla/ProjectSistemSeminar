<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarApproval;
use App\Services\NotificationService;
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
        try {
            $approvals = SeminarApproval::with([
                    'seminar:id,mahasiswa_id,judul,tipe,abstrak,file_berkas,status',
                    'seminar.mahasiswa:id,name,npm',
                    'seminar.pembimbing1:id,name',
                    'seminar.pembimbing2:id,name',
                    'seminar.penguji:id,name',
                    'seminar.approvals:id,seminar_id,dosen_id,peran,status,catatan,available_dates,updated_at',
                    'seminar.approvals.dosen:id,name'
                ])
                ->where('dosen_id', $request->user()->id)
                ->whereHas('seminar', function ($query) {
                    $query->where('status', '!=', 'cancelled');
                })
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
        } catch (\Exception $e) {
            \Log::error('Error fetching pending approvals: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal memuat data persetujuan',
                'error' => $e->getMessage()
            ], 500);
        }
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
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'catatan' => 'nullable|string|max:1000',
            'available_dates' => 'required_if:status,approved|nullable|array|min:1',
            'available_dates.*' => 'date|after:today',
        ]);

        $approval = SeminarApproval::with(['seminar'])
            ->where('dosen_id', $request->user()->id)
            ->where('status', 'pending') // Only allow updating pending approvals
            ->findOrFail($id);

        if ($approval->seminar->isCancelled()) {
            return response()->json([
                'message' => 'Mahasiswa telah membatalkan pengajuan ini.'
            ], 422);
        }

        // Update approval
        $updateData = [
            'status' => $validated['status'],
            'catatan' => $validated['catatan'] ?? null,
        ];

        // Add available_dates and approved_at if approved
        if ($validated['status'] === 'approved') {
            $updateData['available_dates'] = $validated['available_dates'];
            $updateData['approved_at'] = now();
        }

        $approval->update($updateData);

        // Log approval history
        \App\Models\ApprovalHistory::create([
            'seminar_id' => $approval->seminar_id,
            'dosen_id' => $request->user()->id,
            'action' => $validated['status'],
            'role' => $approval->peran,
            'catatan' => $validated['catatan'] ?? null,
        ]);

        // Send notification if approved
        if ($validated['status'] === 'approved') {
            NotificationService::notifySeminarApproved(
                $approval->seminar->fresh(['mahasiswa']),
                $request->user()
            );
        }

        // Check if all approvals are completed
        $this->checkSeminarOverallStatus($approval->seminar);

        return response()->json([
            'message' => $validated['status'] === 'approved'
                ? 'Seminar berhasil disetujui. Tanggal ketersediaan Anda telah tersimpan.'
                : 'Seminar berhasil ditolak',
            'data' => $this->formatApprovalData($approval->fresh(['seminar.mahasiswa']), true)
        ]);
    }

    /**
     * Get seminars where dosen is involved
     */
    public function mySeminars(Request $request): JsonResponse
    {
        try {
            $status = $request->get('status', 'all'); // all, menunggu, disetujui, ditolak
            $user = $request->user();

            \Log::info('Fetching dosen seminars', [
                'dosen_id' => $user->id,
                'dosen_name' => $user->name,
                'status_filter' => $status
            ]);

            // Optimized query with specific columns
            $query = Seminar::select([
                    'id', 'judul', 'jenis_seminar', 'mahasiswa_id',
                    'pembimbing1_id', 'pembimbing2_id', 'penguji_id',
                    'status', 'created_at', 'cancelled_at'
                ])
                ->with([
                    'mahasiswa:id,name,npm',
                    'schedule:id,seminar_id,ruang,waktu_mulai,waktu_selesai',
                    'approvals' => function($q) use ($user) {
                        $q->select('id', 'seminar_id', 'dosen_id', 'status')
                          ->where('dosen_id', $user->id);
                    }
                ])
                ->where(function ($query) use ($user) {
                    $query->where('pembimbing1_id', $user->id)
                        ->orWhere('pembimbing2_id', $user->id)
                        ->orWhere('penguji_id', $user->id);
                });

            // Filter by status
            if ($status !== 'all') {
                $query->where('status', $status);
            }

            $seminars = $query->orderBy('created_at', 'desc')
                ->limit(100) // Limit untuk mencegah timeout
                ->get()
                ->map(function ($seminar) use ($user) {
                    return $this->formatSeminarData($seminar, $user);
                });

            \Log::info('Dosen seminars fetched successfully', [
                'count' => $seminars->count()
            ]);

            return response()->json([
                'message' => 'My seminars retrieved successfully',
                'data' => $seminars
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching dosen seminars', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Gagal memuat jadwal: ' . $e->getMessage()
            ], 500);
        }
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
        $schedule = \App\Models\SeminarSchedule::with(['seminar'])->findOrFail($validated['seminar_schedule_id']);

        // Check if dosen is involved in this seminar
        $seminar = $schedule->seminar;
        if (!$this->isDosenInvolvedInSeminar($seminar, $user)) {
            return response()->json([
                'message' => 'Anda tidak terlibat dalam seminar ini'
            ], 403);
        }

        // Determine dosen role in this seminar
        $role = $this->getDosenRole($seminar, $user);

        // Create or update dosen attendance
        $attendance = \App\Models\DosenAttendance::updateOrCreate(
            [
                'seminar_schedule_id' => $validated['seminar_schedule_id'],
                'dosen_id' => $user->id,
            ],
            [
                'role' => $role,
                'status' => $validated['status'],
                'alasan' => $validated['alasan'] ?? null,
                'confirmed_at' => now(),
            ]
        );

        $statusMessage = $validated['status'] === 'hadir'
            ? 'Konfirmasi kehadiran berhasil dicatat'
            : 'Konfirmasi ketidakhadiran berhasil dicatat. Admin akan diberitahu.';

        return response()->json([
            'message' => $statusMessage,
            'data' => [
                'seminar_title' => $seminar->judul,
                'tanggal_jam' => $schedule->getFormattedDateTime(),
                'ruangan' => $schedule->ruang,
                'role' => $attendance->getRoleDisplay(),
                'status' => $validated['status'],
                'status_display' => $attendance->getStatusDisplay(),
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
            'approved' => $monthlyStats['approved'] ?? 0,
            'rejected' => $monthlyStats['rejected'] ?? 0,
            'pending' => $monthlyStats['pending'] ?? 0,
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

        // If any approval is rejected, auto-cancel the seminar and notify all parties
        $rejectedApproval = $approvals->where('status', 'rejected')->first();
        if ($rejectedApproval) {
            // Get the rejection reason
            $rejectionReason = $rejectedApproval->catatan ?? 'Tidak ada alasan spesifik';

            // Cancel the seminar
            $seminar->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancel_reason' => "Ditolak oleh {$rejectedApproval->dosen->name}. Alasan: {$rejectionReason}"
            ]);

            // Delete any existing schedule
            if ($seminar->schedule) {
                $seminar->schedule->delete();
            }

            // Send notifications to all parties
            NotificationService::notifySeminarRejected(
                $seminar->fresh(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji']),
                $rejectedApproval->dosen,
                $rejectionReason
            );

            return;
        }

        // If all approvals are approved, check for date compatibility
        $totalApprovals = $approvals->count();
        if ($totalApprovals > 0 && $approvals->where('status', 'approved')->count() === $totalApprovals) {
            // Check if there are matching dates among all dosen
            $matchingDates = $this->findMatchingDates($approvals);

            if (empty($matchingDates)) {
                // No matching dates - auto-cancel the seminar
                $seminar->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                    'cancel_reason' => 'Tidak ada kecocokan jadwal dari semua dosen pembimbing dan penguji. Silakan ajukan ulang seminar dengan menghubungi dosen terkait terlebih dahulu.'
                ]);

                // Delete any existing schedule
                if ($seminar->schedule) {
                    $seminar->schedule->delete();
                }

                // Send notifications to all parties
                NotificationService::notifyScheduleConflict($seminar->fresh(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji']));
            } else {
                // Has matching dates - keep as pending_verification for admin to verify
                // Admin must verify before scheduling
                $seminar->update([
                    'status' => 'pending_verification'
                ]);
            }
            return;
        }

        // Otherwise, status remains 'pending_verification'
    }

    /**
     * Find matching dates from all approvals
     */
    private function findMatchingDates($approvals): array
    {
        if ($approvals->isEmpty()) {
            return [];
        }

        // Get available dates from each approval
        $allAvailableDates = $approvals->map(function ($approval) {
            return $approval->available_dates ?? [];
        })->filter(function ($dates) {
            return !empty($dates);
        });

        if ($allAvailableDates->isEmpty() || $allAvailableDates->count() !== $approvals->count()) {
            return [];
        }

        // Find intersection of all dates
        $matchingDates = $allAvailableDates->first();

        foreach ($allAvailableDates->skip(1) as $dates) {
            $matchingDates = array_intersect($matchingDates, $dates);
        }

        return array_values($matchingDates);
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
            'mahasiswa_name' => $seminar->mahasiswa->name ?? 'N/A',
            'mahasiswa_npm' => $seminar->mahasiswa->npm ?? 'N/A',
            'judul' => $seminar->judul,
            'jenis_seminar' => $seminar->tipe,
            'tipe' => $seminar->tipe,
            'abstrak' => $seminar->abstrak,
            'file_berkas' => $seminar->file_berkas,
            'peran' => $approval->peran,
            'status' => $approval->status,
            'created_at' => $approval->created_at->format('d M Y'),
            'tanggal_pengajuan' => $approval->created_at->format('d M Y'),
            'updated_at' => $approval->updated_at->format('d M Y H:i'),
            'days_pending' => $approval->created_at->diffInDays(now()),
        ];

        // Get other dosen's approved dates from loaded relationship
        $otherApprovedDates = collect();
        if ($seminar->relationLoaded('approvals')) {
            $otherApprovedDates = $seminar->approvals
                ->where('id', '!=', $approval->id)
                ->where('status', 'approved')
                ->whereNotNull('available_dates')
                ->map(function ($otherApproval) {
                    return [
                        'dosen_name' => $otherApproval->dosen->name ?? 'N/A',
                        'peran' => $otherApproval->peran,
                        'dates' => $otherApproval->available_dates ?? [],
                    ];
                })->filter(function ($item) {
                    return !empty($item['dates']);
                })->values();
        } else {
            // Fallback if not loaded
            $otherApprovedDates = $seminar->approvals()
                ->where('id', '!=', $approval->id)
                ->where('status', 'approved')
                ->whereNotNull('available_dates')
                ->with('dosen:id,name')
                ->get()
                ->map(function ($otherApproval) {
                    return [
                        'dosen_name' => $otherApproval->dosen->name ?? 'N/A',
                        'peran' => $otherApproval->peran,
                        'dates' => $otherApproval->available_dates ?? [],
                    ];
                })->filter(function ($item) {
                    return !empty($item['dates']);
                })->values();
        }

        $data['other_approved_dates'] = $otherApprovedDates;

        // Get other dosen's rejections (if any) from loaded relationship
        $otherRejections = collect();
        if ($seminar->relationLoaded('approvals')) {
            $otherRejections = $seminar->approvals
                ->where('id', '!=', $approval->id)
                ->where('status', 'rejected')
                ->map(function ($otherApproval) {
                    return [
                        'dosen_name' => $otherApproval->dosen->name ?? 'N/A',
                        'peran' => $otherApproval->peran,
                        'rejection_reason' => $otherApproval->catatan ?? 'Tidak ada alasan spesifik',
                        'rejected_at' => $otherApproval->updated_at->format('d M Y H:i'),
                    ];
                })->values();
        } else {
            // Fallback if not loaded
            $otherRejections = $seminar->approvals()
                ->where('id', '!=', $approval->id)
                ->where('status', 'rejected')
                ->with('dosen:id,name')
                ->get()
                ->map(function ($otherApproval) {
                    return [
                        'dosen_name' => $otherApproval->dosen->name ?? 'N/A',
                        'peran' => $otherApproval->peran,
                        'rejection_reason' => $otherApproval->catatan ?? 'Tidak ada alasan spesifik',
                        'rejected_at' => $otherApproval->updated_at->format('d M Y H:i'),
                    ];
                })->values();
        }

        $data['other_rejections'] = $otherRejections;

        // Calculate common dates if there are other approved dates
        if ($otherApprovedDates->isNotEmpty()) {
            $allDates = $otherApprovedDates->pluck('dates')->toArray();
            $commonDates = count($allDates) > 0 ? $allDates[0] : [];

            foreach (array_slice($allDates, 1) as $dates) {
                $commonDates = array_intersect($commonDates, $dates);
            }

            $data['suggested_dates'] = array_values($commonDates);
        } else {
            $data['suggested_dates'] = [];
        }

        if ($detailed) {
            $data['catatan'] = $approval->catatan;
            $data['available_dates'] = $approval->available_dates;
            $data['approved_at'] = $approval->approved_at?->format('d M Y H:i');
            $data['seminar_details'] = [
                'pembimbing1' => $seminar->pembimbing1?->name,
                'pembimbing2' => $seminar->pembimbing2?->name,
                'penguji' => $seminar->penguji?->name,
                'seminar_status' => $seminar->status,
                'skor_total' => $seminar->skor_total,
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

        // Get approval status from loaded relationship instead of querying again
        $approvalStatus = 'menunggu';
        if ($seminar->approvals && $seminar->approvals->isNotEmpty()) {
            $approval = $seminar->approvals->first();
            $approvalStatus = $approval->status;
        }

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
                'ruangan' => $seminar->schedule->ruang,
                'tanggal_jam' => $seminar->schedule->waktu_mulai->format('d M Y H:i'),
                'waktu_mulai_iso' => $seminar->schedule->waktu_mulai->toIso8601String(),
                'is_upcoming' => $seminar->schedule->isUpcoming(),
                'is_today' => $seminar->schedule->isToday(),
                'is_past' => $seminar->schedule->isPast(),
            ] : null,
            'approval_status' => $approvalStatus,
        ];
    }

    /**
     * Get dosen role in seminar
     */
    private function getDosenRole(Seminar $seminar, $user): string
    {
        if ($seminar->pembimbing1_id == $user->id) {
            return 'pembimbing1';
        } elseif ($seminar->pembimbing2_id == $user->id) {
            return 'pembimbing2';
        } elseif ($seminar->penguji_id == $user->id) {
            return 'penguji';
        }
        return 'unknown';
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

    /**
     * Cancel seminar by dosen
     * If any dosen cancels, the entire seminar is cancelled
     */
    public function cancelSeminar(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'cancel_reason' => 'required|string|max:500',
        ]);

        $seminar = Seminar::with(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji', 'schedule'])->findOrFail($id);
        $user = $request->user();

        // Check if dosen is involved in this seminar
        if (!$this->isDosenInvolvedInSeminar($seminar, $user)) {
            return response()->json([
                'message' => 'Anda tidak terlibat dalam seminar ini'
            ], 403);
        }

        // Check if seminar is already cancelled
        if ($seminar->cancelled_at) {
            return response()->json([
                'message' => 'Seminar ini sudah dibatalkan sebelumnya'
            ], 400);
        }

        // Get dosen role for the cancellation reason
        $dosenRole = $this->getUserRoleInSeminar($seminar, $user);
        $fullCancelReason = "[Dibatalkan oleh {$dosenRole}: {$user->name}] {$validated['cancel_reason']}";

        // Cancel the seminar
        $seminar->update([
            'cancelled_at' => now(),
            'cancel_reason' => $fullCancelReason,
            'status' => 'cancelled'
        ]);

        // Delete the schedule if exists
        if ($seminar->schedule) {
            $seminar->schedule->delete();
        }

        return response()->json([
            'message' => 'Seminar berhasil dibatalkan. Mahasiswa akan menerima notifikasi.',
            'data' => [
                'seminar_id' => $seminar->id,
                'mahasiswa_name' => $seminar->mahasiswa->name,
                'judul' => $seminar->judul,
                'cancelled_by' => $user->name,
                'cancelled_role' => $dosenRole,
                'cancel_reason' => $validated['cancel_reason'],
                'cancelled_at' => now()->format('d M Y H:i')
            ]
        ]);
    }

    /**
     * View PDF file
     */
    public function viewFile(Request $request, $seminarId): mixed
    {
        $seminar = Seminar::findOrFail($seminarId);

        if (!$seminar->file_berkas) {
            abort(404, 'File tidak ditemukan');
        }

        $path = storage_path('app/public/' . $seminar->file_berkas);

        if (!file_exists($path)) {
            abort(404, 'File tidak ditemukan di server');
        }

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($path) . '"'
        ]);
    }

    /**
     * Download PDF file
     */
    public function downloadFile(Request $request, $seminarId): mixed
    {
        $seminar = Seminar::findOrFail($seminarId);

        if (!$seminar->file_berkas) {
            abort(404, 'File tidak ditemukan');
        }

        $path = storage_path('app/public/' . $seminar->file_berkas);

        if (!file_exists($path)) {
            abort(404, 'File tidak ditemukan di server');
        }

        return response()->download($path, basename($path));
    }

    /**
     * Final approval after seminar presentation (approve/reject/need revision)
     * Can only be done during seminar time
     */
    public function finalApproval(Request $request, $seminarId): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected', 'needs_revision'])],
            'catatan' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $seminar = Seminar::with(['schedule'])->findOrFail($seminarId);

        // Check if dosen is involved in this seminar
        $isInvolved = $seminar->pembimbing1_id == $user->id
                   || $seminar->pembimbing2_id == $user->id
                   || $seminar->penguji_id == $user->id;

        if (!$isInvolved) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk memberikan penilaian akhir'
            ], 403);
        }

        // Check if seminar has schedule
        if (!$seminar->schedule) {
            return response()->json([
                'message' => 'Seminar belum dijadwalkan'
            ], 422);
        }

        // Check if seminar is ongoing (with grace period)
        if (!$seminar->schedule->isOngoing(gracePeriodBefore: 15, gracePeriodAfter: 60)) {
            $status = $seminar->schedule->getSeminarStatus();

            if ($status === 'upcoming') {
                $minutesUntil = $seminar->schedule->getMinutesUntilStart();
                return response()->json([
                    'message' => "Penilaian akhir hanya dapat dilakukan saat seminar berlangsung. Seminar dimulai dalam {$minutesUntil} menit.",
                    'seminar_status' => 'upcoming',
                    'minutes_until_start' => $minutesUntil
                ], 422);
            } else {
                return response()->json([
                    'message' => 'Waktu untuk memberikan penilaian akhir sudah lewat',
                    'seminar_status' => 'finished'
                ], 422);
            }
        }

        // Update seminar status based on decision
        $statusMap = [
            'approved' => 'approved',
            'rejected' => 'rejected',
            'needs_revision' => 'revising'
        ];

        $seminar->update([
            'status' => $statusMap[$validated['decision']],
            'catatan_akhir' => $validated['catatan'] ?? null,
            'tanggal_penilaian' => now(),
        ]);

        $messages = [
            'approved' => 'Seminar disetujui',
            'rejected' => 'Seminar ditolak',
            'needs_revision' => 'Seminar memerlukan revisi'
        ];

        return response()->json([
            'message' => $messages[$validated['decision']],
            'data' => [
                'seminar_id' => $seminar->id,
                'status' => $seminar->status,
                'decision' => $validated['decision'],
            ]
        ]);
    }

    /**
     * Get seminar status and check if can give final approval
     */
    public function getSeminarApprovalStatus(Request $request, $seminarId): JsonResponse
    {
        $user = $request->user();
        $seminar = Seminar::with(['schedule'])->findOrFail($seminarId);

        // Check if dosen is involved
        $isInvolved = $seminar->pembimbing1_id == $user->id
                   || $seminar->pembimbing2_id == $user->id
                   || $seminar->penguji_id == $user->id;

        if (!$isInvolved) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses'
            ], 403);
        }

        $canApprove = false;
        $reason = '';
        $seminarStatus = 'unknown';
        $timeInfo = [];

        if (!$seminar->schedule) {
            $reason = 'Seminar belum dijadwalkan';
        } else {
            $seminarStatus = $seminar->schedule->getSeminarStatus();

            if ($seminar->schedule->isOngoing(15, 60)) {
                $canApprove = true;
                $timeInfo = [
                    'minutes_until_end' => $seminar->schedule->getMinutesUntilEnd(),
                ];
            } else {
                if ($seminarStatus === 'upcoming') {
                    $minutesUntil = $seminar->schedule->getMinutesUntilStart();
                    $reason = "Seminar dimulai dalam {$minutesUntil} menit";
                    $timeInfo['minutes_until_start'] = $minutesUntil;
                } else {
                    $reason = 'Waktu penilaian sudah lewat';
                }
            }
        }

        return response()->json([
            'data' => [
                'can_approve' => $canApprove,
                'reason' => $reason,
                'seminar_status' => $seminarStatus,
                'seminar_status_display' => $seminar->schedule ? $seminar->schedule->getSeminarStatusDisplay() : '-',
                'time_info' => $timeInfo,
            ]
        ]);
    }

    /**
     * Get approval history for a seminar
     */
    public function getApprovalHistory($seminarId): JsonResponse
    {
        $seminar = Seminar::with([
            'approvalHistories' => function($query) {
                $query->with('dosen:id,name')->orderBy('created_at', 'desc');
            }
        ])->findOrFail($seminarId);

        $histories = $seminar->approvalHistories->map(function ($history) {
            return [
                'id' => $history->id,
                'dosen_name' => $history->dosen->name,
                'action' => $history->getActionDisplay(),
                'role' => $history->getRoleDisplay(),
                'catatan' => $history->catatan,
                'created_at' => $history->created_at->format('d M Y H:i'),
            ];
        });

        return response()->json([
            'message' => 'Approval history retrieved successfully',
            'data' => $histories
        ]);
    }
}
