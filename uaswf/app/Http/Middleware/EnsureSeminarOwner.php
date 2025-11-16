<?php

namespace App\Http\Middleware;

use App\Models\Seminar;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSeminarOwner
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Get seminar ID from route parameters or request body
        $seminarId = $request->route('id') ?? $request->route('seminar') ?? $request->input('seminar_id');

        if (!$seminarId) {
            return response()->json([
                'message' => 'Seminar ID tidak ditemukan.'
            ], 400);
        }

        // Find the seminar
        $seminar = Seminar::find($seminarId);

        if (!$seminar) {
            return response()->json([
                'message' => 'Seminar tidak ditemukan.'
            ], 404);
        }

        // Check if user is the owner of the seminar (mahasiswa) or has appropriate access
        if ($user->role === 'mahasiswa' && $seminar->mahasiswa_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke seminar ini.'
            ], 403);
        }

        // For dosen, check if they are involved in the seminar
        if ($user->role === 'dosen') {
            $isInvolved = in_array($user->id, [
                $seminar->pembimbing1_id,
                $seminar->pembimbing2_id,
                $seminar->penguji_id
            ]);

            if (!$isInvolved) {
                return response()->json([
                    'message' => 'Anda tidak terlibat dalam seminar ini.'
                ], 403);
            }
        }

        // Admin can access all seminars
        if ($user->role === 'admin') {
            return $next($request);
        }

        // Add seminar to request for use in controller
        $request->attributes->set('seminar', $seminar);

        return $next($request);
    }
}