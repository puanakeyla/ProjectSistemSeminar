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
        Schema::table('dosen_attendances', function (Blueprint $table) {
            $table->boolean('is_verified_by_admin')->default(false)->after('status');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete()->after('is_verified_by_admin');
            $table->timestamp('verified_at')->nullable()->after('verified_by');

            // Index untuk query performa admin
            $table->index(['is_verified_by_admin', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dosen_attendances', function (Blueprint $table) {
            $table->dropForeign(['verified_by']);
            $table->dropIndex(['is_verified_by_admin', 'created_at']);
            $table->dropColumn(['is_verified_by_admin', 'verified_by', 'verified_at']);
        });
    }
};
