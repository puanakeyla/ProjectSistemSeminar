<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('seminars')) {
            return;
        }

        if (!Schema::hasColumn('seminars', 'cancelled_at')) {
            Schema::table('seminars', function (Blueprint $table) {
                $table->timestamp('cancelled_at')->nullable()->after('verified_at');
            });
        }

        if (!Schema::hasColumn('seminars', 'cancel_reason')) {
            Schema::table('seminars', function (Blueprint $table) {
                $table->string('cancel_reason', 255)->nullable()->after('cancelled_at');
            });
        }

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE seminars MODIFY status ENUM('draft','pending_verification','approved','scheduled','finished','revising','cancelled') DEFAULT 'draft'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('seminars')) {
            return;
        }

        if (Schema::hasColumn('seminars', 'cancel_reason')) {
            Schema::table('seminars', function (Blueprint $table) {
                $table->dropColumn('cancel_reason');
            });
        }

        if (Schema::hasColumn('seminars', 'cancelled_at')) {
            Schema::table('seminars', function (Blueprint $table) {
                $table->dropColumn('cancelled_at');
            });
        }

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE seminars MODIFY status ENUM('draft','pending_verification','approved','scheduled','finished','revising') DEFAULT 'draft'");
        }
    }
};
