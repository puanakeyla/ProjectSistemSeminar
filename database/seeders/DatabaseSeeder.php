<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@univ.ac.id'],
            [
                'name' => 'Admin System',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );

        // Create Mahasiswa
        $mahasiswa = User::firstOrCreate(
            ['email' => 'andi@student.univ.ac.id'],
            [
                'name' => 'Andi Prasetyo',
                'password' => Hash::make('mhs123'),
                'role' => 'mahasiswa',
                'npm' => '2021001',
            ]
        );

        // Dosen 1 - Dr. Ahmad Wijaya
        $dosen1 = User::firstOrCreate(
            ['email' => 'ahmad.wijaya@univ.ac.id'],
            [
                'name' => 'Dr. Ahmad Wijaya, M.Kom',
                'password' => Hash::make('dosen123'),
                'role' => 'dosen',
                'nidn' => '0123456789',
            ]
        );

        // Dosen 2 - Prof. Budi Santoso
        $dosen2 = User::firstOrCreate(
            ['email' => 'budi.santoso@univ.ac.id'],
            [
                'name' => 'Prof. Budi Santoso, Ph.D',
                'password' => Hash::make('dosen123'),
                'role' => 'dosen',
                'nidn' => '0123456790',
            ]
        );

        // Dosen 3 - Dr. Siti Nurhaliza
        $dosen3 = User::firstOrCreate(
            ['email' => 'siti.nurhaliza@univ.ac.id'],
            [
                'name' => 'Dr. Siti Nurhaliza, M.T',
                'password' => Hash::make('dosen123'),
                'role' => 'dosen',
                'nidn' => '0123456791',
            ]
        );

        // Mahasiswa 2
        $mahasiswa2 = User::firstOrCreate(
            ['email' => 'dewi@student.univ.ac.id'],
            [
                'name' => 'Dewi Kusuma',
                'password' => Hash::make('mhs123'),
                'role' => 'mahasiswa',
                'npm' => '2021002',
            ]
        );

        // Mahasiswa 3
        $mahasiswa3 = User::firstOrCreate(
            ['email' => 'raka@student.univ.ac.id'],
            [
                'name' => 'Raka Firmansyah',
                'password' => Hash::make('mhs123'),
                'role' => 'mahasiswa',
                'npm' => '2021003',
            ]
        );

        // Create Sample Seminars
        $seminar1 = \App\Models\Seminar::create([
            'mahasiswa_id' => $mahasiswa->id,
            'pembimbing1_id' => $dosen1->id,
            'pembimbing2_id' => $dosen2->id,
            'penguji_id' => $dosen3->id,
            'judul' => 'Implementasi Machine Learning untuk Prediksi Cuaca dengan Neural Network',
            'tipe' => 'proposal',
            'abstrak' => 'Penelitian ini membahas tentang implementasi algoritma machine learning untuk memprediksi pola cuaca berdasarkan data historis. Menggunakan metode Random Forest dan Neural Network untuk analisis prediksi dengan akurasi tinggi.',
            'status' => 'pending_verification',
        ]);

        $seminar2 = \App\Models\Seminar::create([
            'mahasiswa_id' => $mahasiswa2->id,
            'pembimbing1_id' => $dosen2->id,
            'pembimbing2_id' => $dosen1->id,
            'penguji_id' => $dosen3->id,
            'judul' => 'Sistem Informasi Manajemen Perpustakaan Berbasis Web menggunakan Laravel',
            'tipe' => 'hasil',
            'abstrak' => 'Pengembangan sistem informasi perpustakaan menggunakan framework Laravel dan React. Sistem ini dirancang untuk mempermudah pengelolaan buku, peminjaman, dan administrasi perpustakaan digital.',
            'status' => 'pending_verification',
        ]);

        $seminar3 = \App\Models\Seminar::create([
            'mahasiswa_id' => $mahasiswa3->id,
            'pembimbing1_id' => $dosen3->id,
            'pembimbing2_id' => $dosen1->id,
            'penguji_id' => $dosen2->id,
            'judul' => 'Analisis Kinerja Algoritma Sorting pada Big Data dengan Benchmark Testing',
            'tipe' => 'kompre',
            'abstrak' => 'Melakukan perbandingan kinerja berbagai algoritma sorting (Quick Sort, Merge Sort, Heap Sort) dalam menangani dataset besar. Menggunakan metode benchmark untuk mengukur efisiensi waktu dan memori secara akurat.',
            'status' => 'pending_verification',
        ]);

        // Create Approvals untuk setiap seminar (status pending)
        // Seminar 1 Approvals (1 Pembimbing + 2 Penguji = 3 approvals)
        \App\Models\SeminarApproval::create([
            'seminar_id' => $seminar1->id,
            'dosen_id' => $dosen1->id,
            'peran' => 'pembimbing1',
            'status' => 'pending',
        ]);
        \App\Models\SeminarApproval::create([
            'seminar_id' => $seminar1->id,
            'dosen_id' => $dosen2->id,
            'peran' => 'pembimbing2',
            'status' => 'pending',
        ]);
        \App\Models\SeminarApproval::create([
            'seminar_id' => $seminar1->id,
            'dosen_id' => $dosen3->id,
            'peran' => 'penguji',
            'status' => 'pending',
        ]);

        // Seminar 2 Approvals
        \App\Models\SeminarApproval::create([
            'seminar_id' => $seminar2->id,
            'dosen_id' => $dosen2->id,
            'peran' => 'pembimbing1',
            'status' => 'pending',
        ]);
        \App\Models\SeminarApproval::create([
            'seminar_id' => $seminar2->id,
            'dosen_id' => $dosen1->id,
            'peran' => 'pembimbing2',
            'status' => 'pending',
        ]);
        \App\Models\SeminarApproval::create([
            'seminar_id' => $seminar2->id,
            'dosen_id' => $dosen3->id,
            'peran' => 'penguji',
            'status' => 'pending',
        ]);

        // Seminar 3 Approvals
        \App\Models\SeminarApproval::create([
            'seminar_id' => $seminar3->id,
            'dosen_id' => $dosen3->id,
            'peran' => 'pembimbing1',
            'status' => 'pending',
        ]);
        \App\Models\SeminarApproval::create([
            'seminar_id' => $seminar3->id,
            'dosen_id' => $dosen1->id,
            'peran' => 'pembimbing2',
            'status' => 'pending',
        ]);
        \App\Models\SeminarApproval::create([
            'seminar_id' => $seminar3->id,
            'dosen_id' => $dosen2->id,
            'peran' => 'penguji',
            'status' => 'pending',
        ]);

        $this->command->info('');
        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('📊 Created: 3 Mahasiswa, 3 Dosen, 3 Seminars, 9 Approvals (1 Pembimbing + 2 Penguji per seminar)');
        $this->command->info('');
        $this->command->info('📧 Login Credentials:');
        $this->command->info('   👤 Admin: admin@univ.ac.id / admin123');
        $this->command->info('   🎓 Mahasiswa: andi@student.univ.ac.id / mhs123');
        $this->command->info('   👨‍🏫 Dosen Ahmad: ahmad.wijaya@univ.ac.id / dosen123');
        $this->command->info('   👨‍🏫 Dosen Budi: budi.santoso@univ.ac.id / dosen123');
        $this->command->info('   👨‍🏫 Dosen Siti: siti.nurhaliza@univ.ac.id / dosen123');
    }
}
