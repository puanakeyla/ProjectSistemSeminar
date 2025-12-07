<?php

namespace App\Http\Controllers\Dosen;

use App\Events\RevisionStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\AttendanceRevision;
use App\Models\SeminarAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AttendanceRevisionController extends Controller
{
    public function getPendingRevisions(Request $request)
    {
        $dosenId = $request->user()->id;

        $revisions = AttendanceRevision::with([
            'attendance.schedule.seminar',
            'requester:id,name,npm'
        ])
            ->whereHas('attendance.schedule.seminar', function($query) use ($dosenId) {
                $query->where('pembimbing1_id', $dosenId)
                    ->orWhere('pembimbing2_id', $dosenId)
                    ->orWhere('penguji_id', $dosenId);
            })
            ->where('revision_status', 'pending')
            ->orderBy('requested_at', 'asc')
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $revisions]);
    }

    public function approve(Request $request, $id)
    {
        $validator = Validator::make($request->all(), ['notes' => 'nullable|string|max:500']);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $dosenId = $request->user()->id;
        $revision = AttendanceRevision::with('attendance.schedule.seminar')->findOrFail($id);
        $seminar = $revision->attendance->schedule->seminar;
        $isAuthorized = in_array($dosenId, [$seminar->pembimbing1_id, $seminar->pembimbing2_id, $seminar->penguji_id]);

        if (!$isAuthorized) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($revision->revision_status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Revisi sudah diproses'], 422);
        }

        DB::beginTransaction();
        try {
            $revision->attendance->update(['status' => $revision->new_status]);
            $revision->update([
                'revision_status' => 'approved',
                'approved_by' => $dosenId,
                'notes' => $request->notes,
                'responded_at' => now(),
            ]);
            DB::commit();

            broadcast(new RevisionStatusUpdated($revision))->toOthers();
            return response()->json(['success' => true, 'message' => 'Revisi disetujui', 'data' => $revision->fresh(['attendance', 'approver'])]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), ['notes' => 'required|string|min:10|max:500']);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $dosenId = $request->user()->id;
        $revision = AttendanceRevision::with('attendance.schedule.seminar')->findOrFail($id);
        $seminar = $revision->attendance->schedule->seminar;
        $isAuthorized = in_array($dosenId, [$seminar->pembimbing1_id, $seminar->pembimbing2_id, $seminar->penguji_id]);

        if (!$isAuthorized) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($revision->revision_status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Revisi sudah diproses'], 422);
        }

        $revision->update([
            'revision_status' => 'rejected',
            'approved_by' => $dosenId,
            'notes' => $request->notes,
            'responded_at' => now(),
        ]);

        broadcast(new RevisionStatusUpdated($revision))->toOthers();
        return response()->json(['success' => true, 'message' => 'Revisi ditolak', 'data' => $revision->fresh(['approver'])]);
    }

    public function updateAttendanceStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'seminar_attendance_id' => 'required|exists:seminar_attendances,id',
            'new_status' => 'required|in:present,late,invalid,absent',
            'notes' => 'required|string|min:10|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $dosenId = $request->user()->id;
        $attendance = SeminarAttendance::with('schedule.seminar')->findOrFail($request->seminar_attendance_id);
        $seminar = $attendance->schedule->seminar;
        $isAuthorized = in_array($dosenId, [$seminar->pembimbing1_id, $seminar->pembimbing2_id, $seminar->penguji_id]);

        if (!$isAuthorized) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        DB::beginTransaction();
        try {
            $oldStatus = $attendance->status;
            $attendance->update(['status' => $request->new_status]);
            AttendanceRevision::create([
                'seminar_attendance_id' => $attendance->id,
                'requested_by' => $attendance->mahasiswa_id,
                'approved_by' => $dosenId,
                'old_status' => $oldStatus,
                'new_status' => $request->new_status,
                'revision_status' => 'approved',
                'reason' => 'Revisi langsung oleh dosen',
                'notes' => $request->notes,
                'requested_at' => now(),
                'responded_at' => now(),
            ]);
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Status diubah', 'data' => $attendance->fresh()]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
