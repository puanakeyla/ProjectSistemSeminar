<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * Handle user login
     */
    public function login(Request $request)
    {
        // Validate request
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        // Find user by email
        $user = User::where('email', $request->email)->first();

        // Check if user exists and password is correct
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password yang dimasukkan salah.'],
            ]);
        }

        // Check if user is active (you can add 'is_active' field later)
        // if (!$user->is_active) {
        //     return response()->json([
        //         'message' => 'Akun Anda dinonaktifkan. Silakan hubungi administrator.'
        //     ], Response::HTTP_FORBIDDEN);
        // }

        // Create token
        $token = $user->createToken('semar-token')->plainTextToken;

        // Return response
        return response()->json([
            'message' => 'Login berhasil',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'npm' => $user->npm,
                'nidn' => $user->nidn,
            ],
            'token' => $token,
        ], Response::HTTP_OK);
    }

    /**
     * Get authenticated user data
     */
    public function user(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'npm' => $user->npm,
                'nidn' => $user->nidn,
                'created_at' => $user->created_at,
            ]
        ], Response::HTTP_OK);
    }

    /**
     * Handle admin login (optional - separate endpoint for admin)
     */
    public function adminLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password yang dimasukkan salah.'],
            ]);
        }

        // Check if user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Anda tidak memiliki akses sebagai administrator.'
            ], Response::HTTP_FORBIDDEN);
        }

        $token = $user->createToken('semar-admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Login admin berhasil',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
        ], Response::HTTP_OK);
    }

    /**
     * Handle dosen login (optional - separate endpoint for dosen)
     */
    public function dosenLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password yang dimasukkan salah.'],
            ]);
        }

        // Check if user is dosen
        if ($user->role !== 'dosen') {
            return response()->json([
                'message' => 'Anda tidak memiliki akses sebagai dosen.'
            ], Response::HTTP_FORBIDDEN);
        }

        $token = $user->createToken('semar-dosen-token')->plainTextToken;

        return response()->json([
            'message' => 'Login dosen berhasil',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'nidn' => $user->nidn,
            ],
            'token' => $token,
        ], Response::HTTP_OK);
    }
}