<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarRevision;
use App\Models\SeminarRevisionItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class RevisionController extends Controller
{
    /**
     * Add revision item to seminar
     */
    public function addRevisionItem(Request $request, $seminarId): JsonResponse
    {
        $user = $request->user();

        // Validate request
        $validator = Validator::make($request->all(), [
            'poin_revisi' => 'required|string',
            'kategori' => 'nullable|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if seminar exists and user is authorized
        $seminar = Seminar::with('schedule')->find($seminarId);

        if (!$seminar) {
            return response()->json([
                'success' => false,
                'message' => 'Seminar tidak ditemukan'
            ], 404);
        }

        // Check if user is pembimbing or penguji
        if ($seminar->pembimbing1_id != $user->id &&
            $seminar->pembimbing2_id != $user->id &&
            $seminar->penguji_id != $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk menambahkan revisi pada seminar ini'
            ], 403);
        }

        // Check if seminar is scheduled
        if (!$seminar->schedule) {
            return response()->json([
                'success' => false,
                'message' => 'Seminar belum dijadwalkan'
            ], 400);
        }

        // Get or create revision for this seminar
        // Generate nomor_revisi: get max + 1 for this seminar
        $maxNomor = SeminarRevision::where('seminar_id', $seminarId)->max('nomor_revisi') ?? 0;

        $revision = SeminarRevision::firstOrCreate(
            ['seminar_id' => $seminarId],
            [
                'mahasiswa_id' => $seminar->mahasiswa_id,
                'nomor_revisi' => $maxNomor + 1,
                'catatan' => 'Revisi dari dosen',
                'status' => 'in_progress'
            ]
        );

        // Create revision item
        $item = SeminarRevisionItem::create([
            'revision_id' => $revision->id,
            'created_by' => $user->id,
            'poin_revisi' => $request->poin_revisi,
            'kategori' => $request->kategori,
            'status' => 'pending'
        ]);

        // Send notification to mahasiswa
        \App\Services\NotificationService::notifyRevisionAdded($seminar, $user, $item);

        return response()->json([
            'success' => true,
            'message' => 'Poin revisi berhasil ditambahkan',
            'data' => $item
        ], 201);
    }

    /**
     * Validate revision item submitted by mahasiswa
     */
    public function validateItem(Request $request, $revisionId, $itemId): JsonResponse
    {
        $user = $request->user();

        // Validate request
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject',
            'rejection_reason' => 'required_if:action,reject|nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find revision item
        $item = SeminarRevisionItem::with('revision.seminar')->find($itemId);

        if (!$item || $item->revision_id != $revisionId) {
            return response()->json([
                'success' => false,
                'message' => 'Item revisi tidak ditemukan'
            ], 404);
        }

        // Check if this item was created by current user
        if ($item->created_by != $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya dapat memvalidasi item revisi yang Anda buat'
            ], 403);
        }

        // Check if item is in submitted status
        if ($item->status != 'submitted') {
            return response()->json([
                'success' => false,
                'message' => 'Item revisi harus dalam status submitted untuk divalidasi'
            ], 400);
        }

        // Update item status
        if ($request->action === 'approve') {
            $item->status = 'approved';
            $item->validated_at = now();
            $item->rejection_reason = null;
        } else {
            $item->status = 'rejected';
            $item->rejection_reason = $request->rejection_reason;
            $item->revision_count += 1;
        }

        $item->save();

        return response()->json([
            'success' => true,
            'message' => $request->action === 'approve' ? 'Revisi disetujui' : 'Revisi ditolak',
            'data' => $item
        ]);
    }
}
