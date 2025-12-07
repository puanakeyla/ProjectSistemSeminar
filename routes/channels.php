<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Channel untuk user pribadi (notifikasi revisi, dll)
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Channel untuk admin - student attendance real-time
Broadcast::channel('admin.student-attendance', function ($user) {
    return $user->role === 'admin';
});

// Channel untuk admin - lecturer check-in verification
Broadcast::channel('admin.lecturer-checkin', function ($user) {
    return $user->role === 'admin';
});

// Channel untuk dosen - revision requests
Broadcast::channel('dosen.{dosenId}.revisions', function ($user, $dosenId) {
    return $user->role === 'dosen' && (int) $user->id === (int) $dosenId;
});

// Channel untuk seminar schedule specific (untuk QR scan real-time, dll)
Broadcast::channel('schedule.{scheduleId}', function ($user, $scheduleId) {
    // Semua authenticated user bisa subscribe (mahasiswa, dosen, admin)
    return true;
});
