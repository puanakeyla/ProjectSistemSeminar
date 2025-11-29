<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class LogoutController extends Controller
{
    /**
     * Handle user logout
     */
    public function logout(Request $request)
    {
        try {
            // Revoke current access token
            $request->user()->currentAccessToken()->delete();

            // Alternative: Revoke all tokens (if you want logout from all devices)
            // $request->user()->tokens()->delete();

            return response()->json([
                'message' => 'Logout berhasil'
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Terjadi kesalahan saat logout'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Handle logout from all devices
     */
    public function logoutAllDevices(Request $request)
    {
        try {
            // Revoke all tokens
            $request->user()->tokens()->delete();

            return response()->json([
                'message' => 'Logout dari semua perangkat berhasil'
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            Log::error('Logout all devices error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Terjadi kesalahan saat logout dari semua perangkat'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get current user's active sessions
     */
    public function sessions(Request $request)
    {
        try {
            $tokens = $request->user()->tokens()
                ->select('id', 'name', 'last_used_at', 'created_at')
                ->get();

            return response()->json([
                'sessions' => $tokens
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            Log::error('Get sessions error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Terjadi kesalahan saat mengambil data sesi'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Revoke specific token/session
     */
    public function revokeToken(Request $request, $tokenId)
    {
        try {
            $token = $request->user()->tokens()->where('id', $tokenId)->first();

            if (!$token) {
                return response()->json([
                    'message' => 'Token tidak ditemukan'
                ], Response::HTTP_NOT_FOUND);
            }

            $token->delete();

            return response()->json([
                'message' => 'Sesi berhasil diakhiri'
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            Log::error('Revoke token error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Terjadi kesalahan saat mengakhiri sesi'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}