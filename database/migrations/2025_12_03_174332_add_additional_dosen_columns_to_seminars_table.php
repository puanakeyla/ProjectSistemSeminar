<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * NOTE: This migration is deprecated - the correct structure is already in create_seminars_table
     */
    public function up(): void
    {
        // Do nothing - structure already correct in base migration
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Do nothing - no columns were added
    }
};
