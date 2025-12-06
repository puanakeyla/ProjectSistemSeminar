<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seminars', function (Blueprint $table) {
            $table->index('mahasiswa_id');
            $table->index('pembimbing1_id');
            $table->index('pembimbing2_id');
            $table->index('penguji_id');
            $table->index('status');
            $table->index('created_at');
        });

        Schema::table('seminar_approvals', function (Blueprint $table) {
            $table->index('dosen_id');
            $table->index('seminar_id');
            $table->index('status');
        });

        Schema::table('seminar_schedules', function (Blueprint $table) {
            $table->index('seminar_id');
            $table->index('tanggal');
        });

        Schema::table('seminar_revisions', function (Blueprint $table) {
            $table->index('seminar_id');
            $table->index('status');
        });

        Schema::table('seminar_revision_items', function (Blueprint $table) {
            $table->index('seminar_revision_id');
            $table->index('status');
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::table('seminars', function (Blueprint $table) {
            $table->dropIndex(['mahasiswa_id']);
            $table->dropIndex(['pembimbing1_id']);
            $table->dropIndex(['pembimbing2_id']);
            $table->dropIndex(['penguji_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('seminar_approvals', function (Blueprint $table) {
            $table->dropIndex(['dosen_id']);
            $table->dropIndex(['seminar_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('seminar_schedules', function (Blueprint $table) {
            $table->dropIndex(['seminar_id']);
            $table->dropIndex(['tanggal']);
        });

        Schema::table('seminar_revisions', function (Blueprint $table) {
            $table->dropIndex(['seminar_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('seminar_revision_items', function (Blueprint $table) {
            $table->dropIndex(['seminar_revision_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['created_by']);
        });
    }
};
