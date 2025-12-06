<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Seminar;
use App\Models\User;

class NotificationService
{
    /**
     * Send notification about schedule conflict (no matching dates)
     */
    public static function notifyScheduleConflict(Seminar $seminar): void
    {
        $title = 'Tidak Ada Kecocokan Jadwal';
        $message = "Seminar \"{$seminar->judul}\" dibatalkan karena tidak ada tanggal yang cocok dari semua dosen pembimbing dan penguji.";

        // Notify mahasiswa
        self::createNotification(
            $seminar->mahasiswa_id,
            $seminar->id,
            'schedule_conflict',
            $title,
            $message . ' Silakan hubungi dosen terkait untuk koordinasi jadwal sebelum mengajukan ulang.',
            [
                'seminar_id' => $seminar->id,
                'judul' => $seminar->judul,
                'tipe' => $seminar->tipe,
            ]
        );

        // Notify pembimbing 1
        if ($seminar->pembimbing1_id) {
            self::createNotification(
                $seminar->pembimbing1_id,
                $seminar->id,
                'schedule_conflict',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'role' => 'Pembimbing 1',
                ]
            );
        }

        // Notify pembimbing 2
        if ($seminar->pembimbing2_id) {
            self::createNotification(
                $seminar->pembimbing2_id,
                $seminar->id,
                'schedule_conflict',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'role' => 'Pembimbing 2',
                ]
            );
        }

        // Notify penguji
        if ($seminar->penguji_id) {
            self::createNotification(
                $seminar->penguji_id,
                $seminar->id,
                'schedule_conflict',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'role' => 'Penguji',
                ]
            );
        }

        // Notify all admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            self::createNotification(
                $admin->id,
                $seminar->id,
                'schedule_conflict',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}). Perlu koordinasi ulang jadwal.",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                ]
            );
        }
    }

    /**
     * Send notification about seminar rejection
     */
    public static function notifySeminarRejected(Seminar $seminar, $rejectedBy, $rejectionReason): void
    {
        $title = 'Pengajuan Seminar Ditolak';
        $dosenName = $rejectedBy->name;
        
        // Get dosen role
        $role = '';
        if ($seminar->pembimbing1_id == $rejectedBy->id) {
            $role = 'Pembimbing 1';
        } elseif ($seminar->pembimbing2_id == $rejectedBy->id) {
            $role = 'Pembimbing 2';
        } elseif ($seminar->penguji_id == $rejectedBy->id) {
            $role = 'Penguji';
        }

        $message = "Seminar \"{$seminar->judul}\" telah ditolak oleh {$dosenName} ({$role}) dan otomatis dibatalkan.";

        // Notify mahasiswa
        self::createNotification(
            $seminar->mahasiswa_id,
            $seminar->id,
            'seminar_rejected',
            $title,
            $message . ($rejectionReason ? " Alasan: {$rejectionReason}" : ' Silakan hubungi dosen pembimbing untuk melakukan revisi dan ajukan kembali.'),
            [
                'seminar_id' => $seminar->id,
                'judul' => $seminar->judul,
                'tipe' => $seminar->tipe,
                'rejected_by' => $dosenName,
                'rejection_reason' => $rejectionReason,
            ]
        );

        // Notify pembimbing 1
        if ($seminar->pembimbing1_id && $seminar->pembimbing1_id != $rejectedBy->id) {
            self::createNotification(
                $seminar->pembimbing1_id,
                $seminar->id,
                'seminar_rejected',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'rejected_by' => $dosenName,
                    'rejection_reason' => $rejectionReason,
                ]
            );
        }

        // Notify pembimbing 2
        if ($seminar->pembimbing2_id && $seminar->pembimbing2_id != $rejectedBy->id) {
            self::createNotification(
                $seminar->pembimbing2_id,
                $seminar->id,
                'seminar_rejected',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'rejected_by' => $dosenName,
                    'rejection_reason' => $rejectionReason,
                ]
            );
        }

        // Notify penguji
        if ($seminar->penguji_id && $seminar->penguji_id != $rejectedBy->id) {
            self::createNotification(
                $seminar->penguji_id,
                $seminar->id,
                'seminar_rejected',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'rejected_by' => $dosenName,
                    'rejection_reason' => $rejectionReason,
                ]
            );
        }

        // Notify all admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            self::createNotification(
                $admin->id,
                $seminar->id,
                'seminar_rejected',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'rejected_by' => $dosenName,
                    'rejection_reason' => $rejectionReason,
                ]
            );
        }
    }

    /**
     * Send notification when seminar is approved by dosen
     */
    public static function notifySeminarApproved(Seminar $seminar, User $approvedBy): void
    {
        $title = 'Pengajuan Seminar Disetujui';
        
        // Get dosen role
        $role = '';
        if ($seminar->pembimbing1_id == $approvedBy->id) {
            $role = 'Pembimbing 1';
        } elseif ($seminar->pembimbing2_id == $approvedBy->id) {
            $role = 'Pembimbing 2';
        } elseif ($seminar->penguji_id == $approvedBy->id) {
            $role = 'Penguji';
        }

        $message = "Pengajuan seminar \"{$seminar->judul}\" telah disetujui oleh {$approvedBy->name} ({$role}).";

        // Notify mahasiswa
        self::createNotification(
            $seminar->mahasiswa_id,
            $seminar->id,
            'seminar_approved',
            $title,
            $message . ' Pengajuan seminar Anda sedang dalam proses persetujuan.',
            [
                'seminar_id' => $seminar->id,
                'judul' => $seminar->judul,
                'tipe' => $seminar->tipe,
                'approved_by' => $approvedBy->name,
                'approved_role' => $role,
            ]
        );
    }

    /**
     * Send notification when seminar is scheduled
     */
    public static function notifySeminarScheduled(Seminar $seminar): void
    {
        $schedule = $seminar->schedule;
        if (!$schedule) {
            return;
        }

        $title = 'Seminar Telah Dijadwalkan';
        $waktu = \Carbon\Carbon::parse($schedule->waktu_mulai)->format('d F Y, H:i');
        $message = "Seminar \"{$seminar->judul}\" telah dijadwalkan pada {$waktu} di {$schedule->ruang}.";

        // Notify mahasiswa
        self::createNotification(
            $seminar->mahasiswa_id,
            $seminar->id,
            'seminar_scheduled',
            $title,
            $message . ' Silakan cek halaman Jadwal untuk detailnya.',
            [
                'seminar_id' => $seminar->id,
                'judul' => $seminar->judul,
                'tipe' => $seminar->tipe,
                'waktu_mulai' => $schedule->waktu_mulai,
                'ruang' => $schedule->ruang,
            ]
        );

        // Notify pembimbing 1
        if ($seminar->pembimbing1_id) {
            self::createNotification(
                $seminar->pembimbing1_id,
                $seminar->id,
                'seminar_scheduled',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'waktu_mulai' => $schedule->waktu_mulai,
                    'ruang' => $schedule->ruang,
                ]
            );
        }

        // Notify pembimbing 2
        if ($seminar->pembimbing2_id) {
            self::createNotification(
                $seminar->pembimbing2_id,
                $seminar->id,
                'seminar_scheduled',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'waktu_mulai' => $schedule->waktu_mulai,
                    'ruang' => $schedule->ruang,
                ]
            );
        }

        // Notify penguji
        if ($seminar->penguji_id) {
            self::createNotification(
                $seminar->penguji_id,
                $seminar->id,
                'seminar_scheduled',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'waktu_mulai' => $schedule->waktu_mulai,
                    'ruang' => $schedule->ruang,
                ]
            );
        }
    }

    /**
     * Send notification when mahasiswa cancels seminar
     */
    public static function notifySeminarCancelledByMahasiswa(Seminar $seminar, ?string $reason = null): void
    {
        $title = 'Seminar Dibatalkan oleh Mahasiswa';
        $message = "Seminar \"{$seminar->judul}\" telah dibatalkan oleh mahasiswa {$seminar->mahasiswa->name}.";
        
        if ($reason) {
            $message .= " Alasan: {$reason}";
        }

        // Notify pembimbing 1
        if ($seminar->pembimbing1_id) {
            self::createNotification(
                $seminar->pembimbing1_id,
                $seminar->id,
                'seminar_cancelled_by_mahasiswa',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'cancel_reason' => $reason,
                ]
            );
        }

        // Notify pembimbing 2
        if ($seminar->pembimbing2_id) {
            self::createNotification(
                $seminar->pembimbing2_id,
                $seminar->id,
                'seminar_cancelled_by_mahasiswa',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'cancel_reason' => $reason,
                ]
            );
        }

        // Notify penguji
        if ($seminar->penguji_id) {
            self::createNotification(
                $seminar->penguji_id,
                $seminar->id,
                'seminar_cancelled_by_mahasiswa',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'cancel_reason' => $reason,
                ]
            );
        }

        // Notify all admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            self::createNotification(
                $admin->id,
                $seminar->id,
                'seminar_cancelled_by_mahasiswa',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'cancel_reason' => $reason,
                ]
            );
        }
    }

    /**
     * Send notification when admin cancels seminar
     */
    public static function notifySeminarCancelledByAdmin(Seminar $seminar, User $cancelledBy, ?string $reason = null): void
    {
        $title = 'Seminar Dibatalkan oleh Admin';
        $message = "Seminar \"{$seminar->judul}\" telah dibatalkan oleh Admin {$cancelledBy->name}.";
        
        if ($reason) {
            $message .= " Alasan: {$reason}";
        }

        // Notify mahasiswa
        self::createNotification(
            $seminar->mahasiswa_id,
            $seminar->id,
            'seminar_cancelled_by_admin',
            $title,
            $message . ' Silakan hubungi admin atau dosen pembimbing untuk informasi lebih lanjut.',
            [
                'seminar_id' => $seminar->id,
                'judul' => $seminar->judul,
                'tipe' => $seminar->tipe,
                'cancelled_by' => $cancelledBy->name,
                'cancelled_by_role' => 'Admin',
                'cancel_reason' => $reason,
            ]
        );

        // Notify pembimbing 1
        if ($seminar->pembimbing1_id) {
            self::createNotification(
                $seminar->pembimbing1_id,
                $seminar->id,
                'seminar_cancelled_by_admin',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'cancelled_by' => $cancelledBy->name,
                    'cancel_reason' => $reason,
                ]
            );
        }

        // Notify pembimbing 2
        if ($seminar->pembimbing2_id) {
            self::createNotification(
                $seminar->pembimbing2_id,
                $seminar->id,
                'seminar_cancelled_by_admin',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'cancelled_by' => $cancelledBy->name,
                    'cancel_reason' => $reason,
                ]
            );
        }

        // Notify pembimbing 2
        if ($seminar->pembimbing2_id) {
            self::createNotification(
                $seminar->pembimbing2_id,
                $seminar->id,
                'seminar_cancelled_by_admin',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'cancelled_by' => $cancelledBy->name,
                    'cancel_reason' => $reason,
                ]
            );
        }

        // Notify penguji
        if ($seminar->penguji_id) {
            self::createNotification(
                $seminar->penguji_id,
                $seminar->id,
                'seminar_cancelled_by_admin',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'cancelled_by' => $cancelledBy->name,
                    'cancel_reason' => $reason,
                ]
            );
        }
    }

    /**
     * Send notification when schedule is updated/rescheduled
     */
    public static function notifySeminarRescheduled(Seminar $seminar, User $updatedBy, string $oldDateTime, string $newDateTime): void
    {
        $title = 'Jadwal Seminar Diubah';
        $oldTime = \Carbon\Carbon::parse($oldDateTime)->format('d F Y, H:i');
        $newTime = \Carbon\Carbon::parse($newDateTime)->format('d F Y, H:i');
        $message = "Jadwal seminar \"{$seminar->judul}\" telah diubah dari {$oldTime} menjadi {$newTime} oleh {$updatedBy->name}.";

        // Notify mahasiswa
        self::createNotification(
            $seminar->mahasiswa_id,
            $seminar->id,
            'seminar_rescheduled',
            $title,
            $message . ' Silakan sesuaikan jadwal Anda.',
            [
                'seminar_id' => $seminar->id,
                'judul' => $seminar->judul,
                'old_time' => $oldDateTime,
                'new_time' => $newDateTime,
                'updated_by' => $updatedBy->name,
                'updated_by_role' => $updatedBy->role,
            ]
        );

        // Notify all dosen
        $dosenIds = array_filter([
            $seminar->pembimbing1_id,
            $seminar->pembimbing2_id,
            $seminar->penguji_id,
        ]);

        foreach ($dosenIds as $dosenId) {
            self::createNotification(
                $dosenId,
                $seminar->id,
                'seminar_rescheduled',
                $title,
                $message . " Mahasiswa: {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}).",
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'old_time' => $oldDateTime,
                    'new_time' => $newDateTime,
                    'updated_by' => $updatedBy->name,
                ]
            );
        }
    }

    /**
     * Send notification when new seminar is submitted
     */
    public static function notifyNewSeminarSubmission(Seminar $seminar): void
    {
        $title = 'Pengajuan Seminar Baru';
        $message = "Mahasiswa {$seminar->mahasiswa->name} ({$seminar->mahasiswa->npm}) telah mengajukan seminar {$seminar->tipe}: \"{$seminar->judul}\".";

        // Notify pembimbing 1
        if ($seminar->pembimbing1_id) {
            self::createNotification(
                $seminar->pembimbing1_id,
                $seminar->id,
                'new_seminar_submission',
                $title,
                $message . ' Anda ditunjuk sebagai Pembimbing 1. Silakan review pengajuan ini.',
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'judul' => $seminar->judul,
                    'tipe' => $seminar->tipe,
                    'role' => 'Pembimbing 1',
                ]
            );
        }

        // Notify pembimbing 2
        if ($seminar->pembimbing2_id) {
            self::createNotification(
                $seminar->pembimbing2_id,
                $seminar->id,
                'new_seminar_submission',
                $title,
                $message . ' Anda ditunjuk sebagai Pembimbing 2. Silakan review pengajuan ini.',
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'judul' => $seminar->judul,
                    'tipe' => $seminar->tipe,
                    'role' => 'Pembimbing 2',
                ]
            );
        }

        // Notify penguji
        if ($seminar->penguji_id) {
            self::createNotification(
                $seminar->penguji_id,
                $seminar->id,
                'new_seminar_submission',
                $title,
                $message . ' Anda ditunjuk sebagai Penguji. Silakan review pengajuan ini.',
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'judul' => $seminar->judul,
                    'tipe' => $seminar->tipe,
                    'role' => 'Penguji',
                ]
            );
        }

        // Notify all admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            self::createNotification(
                $admin->id,
                $seminar->id,
                'new_seminar_submission',
                $title,
                $message . ' Pengajuan menunggu persetujuan dosen.',
                [
                    'seminar_id' => $seminar->id,
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'judul' => $seminar->judul,
                    'tipe' => $seminar->tipe,
                ]
            );
        }
    }

    /**
     * Create a notification
     */
    private static function createNotification(
        int $userId,
        ?int $seminarId,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'seminar_id' => $seminarId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }
}
