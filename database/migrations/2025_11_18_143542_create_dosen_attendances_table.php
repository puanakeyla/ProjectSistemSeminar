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
        Schema::create('dosen_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seminar_schedule_id')->constrained('seminar_schedules')->cascadeOnDelete();
            $table->foreignId('dosen_id')->constrained('users')->cascadeOnDelete();
            $table->enum('role', ['pembimbing1', 'pembimbing2', 'penguji']);
            $table->enum('status', ['hadir', 'tidak_hadir'])->default('hadir');
            $table->text('alasan')->nullable(); // Reason if tidak_hadir
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
            
            // Unique constraint: one confirmation per dosen per schedule
            $table->unique(['seminar_schedule_id', 'dosen_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dosen_attendances');
    }
};
