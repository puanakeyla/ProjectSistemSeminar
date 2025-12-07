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
        Schema::create('attendance_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seminar_attendance_id')->constrained('seminar_attendances')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete(); // Mahasiswa yang request
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete(); // Dosen yang approve

            $table->enum('old_status', ['present', 'late', 'invalid', 'absent'])->nullable();
            $table->enum('new_status', ['present', 'late', 'invalid', 'absent']);
            $table->enum('revision_status', ['pending', 'approved', 'rejected'])->default('pending');

            $table->text('reason'); // Alasan revisi dari mahasiswa
            $table->text('notes')->nullable(); // Catatan dari dosen
            $table->text('evidence_file')->nullable(); // Path file bukti (PDF/image)

            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            // Index untuk performa
            $table->index(['seminar_attendance_id', 'revision_status']);
            $table->index(['requested_by', 'revision_status']);
            $table->index(['approved_by', 'responded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_revisions');
    }
};
