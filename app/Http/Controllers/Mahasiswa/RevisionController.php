<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\SeminarRevision;
use App\Models\SeminarRevisionItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class RevisionController extends Controller
{
    /**
     * Submit revision item
     */
    public function submitItem(Request $request, $revisionId, $itemId): JsonResponse
    {
        $user = $request->user();

        // Validate request
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240', // 10MB
            'mahasiswa_notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find revision item
        $item = SeminarRevisionItem::with('revision.seminar.mahasiswa')->find($itemId);

        if (!$item || $item->revision_id != $revisionId) {
            return response()->json([
                'success' => false,
                'message' => 'Item revisi tidak ditemukan'
            ], 404);
        }

        // Check if this revision belongs to current user
        if ($item->revision->seminar->mahasiswa_id != $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk submit revisi ini'
            ], 403);
        }

        // Check if item can be submitted
        if ($item->status != 'pending' && $item->status != 'rejected') {
            return response()->json([
                'success' => false,
                'message' => 'Item revisi tidak dapat disubmit'
            ], 400);
        }

        // Handle file upload
        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($item->file_path && Storage::disk('public')->exists($item->file_path)) {
                Storage::disk('public')->delete($item->file_path);
            }

            $file = $request->file('file');
            $fileName = time() . '_' . $user->id . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('revisions', $fileName, 'public');

            $item->file_path = $filePath;
        }

        // Update item
        $item->mahasiswa_notes = $request->mahasiswa_notes;
        $item->status = 'submitted';
        $item->submitted_at = now();
        $item->save();

        // Send notification to dosen
        \App\Services\NotificationService::notifyRevisionSubmitted(
            $item->revision->seminar,
            $item
        );

        return response()->json([
            'success' => true,
            'message' => 'Revisi berhasil disubmit',
            'data' => $item
        ]);
    }
}
