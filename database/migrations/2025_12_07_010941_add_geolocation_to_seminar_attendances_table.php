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
        Schema::table('seminar_attendances', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable()->after('qr_token');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            $table->decimal('distance_meter', 8, 2)->nullable()->after('longitude'); // Jarak dalam meter
            $table->text('manual_reason')->nullable()->after('distance_meter'); // Alasan jika manual/fallback
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seminar_attendances', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'distance_meter', 'manual_reason']);
        });
    }
};
