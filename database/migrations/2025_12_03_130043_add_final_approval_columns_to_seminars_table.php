<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('seminars', function (Blueprint $table) {
            $table->text('catatan_akhir')->nullable()->after('status'); // Catatan penilaian akhir dosen
            $table->timestamp('tanggal_penilaian')->nullable()->after('catatan_akhir'); // Tanggal penilaian akhir
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seminars', function (Blueprint $table) {
            $table->dropColumn(['catatan_akhir', 'tanggal_penilaian']);
        });
    }
};
