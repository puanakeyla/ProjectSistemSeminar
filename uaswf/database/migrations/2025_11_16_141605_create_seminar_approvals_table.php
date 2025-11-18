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
        Schema::create('seminar_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seminar_id')->constrained('seminars')->cascadeOnDelete();
            $table->foreignId('dosen_id')->constrained('users')->cascadeOnDelete();
            $table->enum('peran', ['pembimbing1','pembimbing2','penguji']);
            $table->enum('status', ['pending','approved','rejected'])->default('pending');
            $table->text('catatan')->nullable();
            $table->json('available_dates')->nullable(); // Tanggal ketersediaan dosen
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->unique(['seminar_id','dosen_id','peran']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seminar_approvals');
    }
};
