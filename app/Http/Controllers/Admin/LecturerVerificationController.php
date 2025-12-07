<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DosenAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LecturerVerificationController extends Controller
{
    public function getUnverified(Request $request)
    {
        $attendances = DosenAttendance::with([
            'dosen:id,name,nidn',
            'schedule.seminar'
        ])
            ->unverified()
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json(['success' => true, 'data' => $attendances]);
    }

    public function verify(Request $request, $id)
    {
        $attendance = DosenAttendance::findOrFail($id);

        if ($attendance->is_verified_by_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance already verified'
            ], 422);
        }

        $attendance->update([
            'is_verified_by_admin' => true,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Attendance verified successfully',
            'data' => $attendance->fresh(['verifier'])
        ]);
    }

    public function unverify(Request $request, $id)
    {
        $attendance = DosenAttendance::findOrFail($id);

        $attendance->update([
            'is_verified_by_admin' => false,
            'verified_by' => null,
            'verified_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Verification removed',
            'data' => $attendance
        ]);
    }

    public function getAllWithFilter(Request $request)
    {
        $query = DosenAttendance::with(['dosen:id,name,nidn', 'schedule.seminar', 'verifier:id,name']);

        if ($request->has('verified')) {
            if ($request->verified === 'true' || $request->verified === '1') {
                $query->verified();
            } else {
                $query->unverified();
            }
        }

        $attendances = $query->orderBy('created_at', 'desc')->paginate(50);
        return response()->json(['success' => true, 'data' => $attendances]);
    }
}
