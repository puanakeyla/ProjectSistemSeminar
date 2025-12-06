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
        Schema::create('seminar_revision_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('revision_id')->constrained('seminar_revisions')->onDelete('cascade');
            $table->text('poin_revisi'); // Poin revisi yang harus dikerjakan mahasiswa
            $table->string('kategori')->nullable(); // BAB 1, BAB 2, Metodologi, dll
            $table->enum('status', ['pending', 'submitted', 'approved', 'rejected'])->default('pending');
            $table->text('mahasiswa_notes')->nullable(); // Catatan mahasiswa saat submit
            $table->string('file_path')->nullable(); // File bukti revisi (PDF/screenshot)
            $table->timestamp('submitted_at')->nullable(); // Kapan mahasiswa submit
            $table->timestamp('validated_at')->nullable(); // Kapan dosen validasi
            $table->foreignId('validated_by')->nullable()->constrained('users'); // Dosen yang validasi
            $table->text('rejection_reason')->nullable(); // Alasan reject (jika rejected)
            $table->integer('revision_count')->default(0); // Berapa kali revisi ulang
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seminar_revision_items');
    }
};
