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
        Schema::create('seminar_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seminar_schedule_id')->constrained('seminar_schedules')->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('waktu_scan')->nullable();
            $table->enum('metode', ['qr','manual'])->default('qr');
            $table->enum('status', ['present','late','invalid'])->default('present');
            $table->string('qr_token')->nullable();
            $table->timestamps();
            $table->unique(['seminar_schedule_id','mahasiswa_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seminar_attendances');
    }
};
