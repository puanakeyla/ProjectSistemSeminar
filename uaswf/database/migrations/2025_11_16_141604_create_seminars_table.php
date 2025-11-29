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
        Schema::create('seminars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('pembimbing1_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('pembimbing2_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('penguji_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('judul');
            $table->enum('tipe', ['proposal','hasil','kompre']);
            $table->text('abstrak')->nullable();
            $table->enum('status', ['draft','pending_verification','approved','scheduled','finished','revising'])->default('draft');
            $table->unsignedTinyInteger('skor_total')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seminars');
    }
};
