<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/login', function () {
    return view('login');
});

Route::get('/mahasiswa', function () {
    return view('mahasiswa');
});

// Main application route - this will be handled by React
Route::get('/{any?}', function () {
    return response()->json([
        'message' => 'SEMAR Backend API is running!',
        'frontend' => 'Please access the React frontend application',
        'api_docs' => 'API endpoints are available at /api/*',
        'login_test' => 'Test login at /api/login with {"email": "mahasiswa@semar.com", "password": "password"}'
    ]);
})->where('any', '.*');

// Alternative: You can also return a simple message
// Route::get('/{any?}', function () {
//     return response()->json([
//         'message' => 'SEMAR Backend API is running!',
//         'frontend' => 'Please access the React frontend application',
//         'api_docs' => 'API endpoints are available at /api/*',
//         'login_test' => 'Test login at /api/login with {"email": "mahasiswa@semar.com", "password": "password"}'
//     ]);
// })->where('any', '.*');

// Health check route
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'SEMAR Backend',
        'timestamp' => now()->toDateTimeString(),
        'version' => '1.0.0'
    ]);
});

// Database connection test
Route::get('/db-test', function () {
    try {
        \DB::connection()->getPdo();
        return response()->json([
            'status' => 'success',
            'message' => 'Database connection is working',
            'database' => \DB::connection()->getDatabaseName()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Database connection failed: ' . $e->getMessage()
        ], 500);
    }
});
