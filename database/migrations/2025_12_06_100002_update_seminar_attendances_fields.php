<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Disable foreign key checks for SQLite
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys=OFF;');
        }

        Schema::table('seminar_attendances', function (Blueprint $table) {
            // Add waktu_absen if it doesn't exist
            if (!Schema::hasColumn('seminar_attendances', 'waktu_absen')) {
                $table->timestamp('waktu_absen')->nullable()->after('mahasiswa_id');
            }

            // Add metode_absen column if not exists (instead of rename)
            if (!Schema::hasColumn('seminar_attendances', 'metode_absen')) {
                $table->string('metode_absen')->nullable()->after('waktu_absen');
            }
        });

        // Copy data from metode to metode_absen if metode column exists
        if (Schema::hasColumn('seminar_attendances', 'metode')) {
            DB::table('seminar_attendances')
                ->whereNotNull('metode')
                ->update([
                    'metode_absen' => DB::raw('metode')
                ]);
        }

        // Re-enable foreign key checks
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys=ON;');
        }
    }

    public function down(): void
    {
        Schema::table('seminar_attendances', function (Blueprint $table) {
            if (Schema::hasColumn('seminar_attendances', 'waktu_absen')) {
                $table->dropColumn('waktu_absen');
            }
            if (Schema::hasColumn('seminar_attendances', 'metode_absen')) {
                $table->dropColumn('metode_absen');
            }
        });
    }
};
