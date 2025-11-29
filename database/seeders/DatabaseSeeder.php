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
        User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Admin Test',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        // Create Mahasiswa
        User::firstOrCreate(
            ['email' => 'mahasiswa@test.com'],
            [
                'name' => 'Mahasiswa Test',
                'password' => Hash::make('password'),
                'role' => 'mahasiswa',
                'npm' => '2101010001',
            ]
        );

        // Create Dosen 1
        User::firstOrCreate(
            ['email' => 'dosen1@test.com'],
            [
                'name' => 'Dr. Budi Santoso, M.Kom',
                'password' => Hash::make('password'),
                'role' => 'dosen',
                'nidn' => '0123456789',
            ]
        );

        // Create Dosen 2
        User::firstOrCreate(
            ['email' => 'dosen2@test.com'],
            [
                'name' => 'Dr. Siti Aminah, M.T',
                'password' => Hash::make('password'),
                'role' => 'dosen',
                'nidn' => '0123456790',
            ]
        );

        // Create Dosen 3
        $dosen3 = User::firstOrCreate(
            ['email' => 'dosen3@test.com'],
            [
                'name' => 'Dr. Ahmad Hidayat, M.Kom',
                'password' => Hash::make('password'),
                'role' => 'dosen',
                'nidn' => '0123456791',
            ]
        );

        // Get created users
        $admin = User::where('email', 'admin@test.com')->first();
        $mahasiswa = User::where('email', 'mahasiswa@test.com')->first();
        $dosen1 = User::where('email', 'dosen1@test.com')->first();
        $dosen2 = User::where('email', 'dosen2@test.com')->first();

        // Create more mahasiswa for testing
        $mahasiswa2 = User::firstOrCreate(
            ['email' => 'mahasiswa2@test.com'],
            [
                'name' => 'Siti Nurhaliza',
                'password' => Hash::make('password'),
                'role' => 'mahasiswa',
                'npm' => '2101010002',
            ]
        );

        $mahasiswa3 = User::firstOrCreate(
            ['email' => 'mahasiswa3@test.com'],
            [
                'name' => 'Ahmad Fauzi',
                'password' => Hash::make('password'),
                'role' => 'mahasiswa',
                'npm' => '2101010003',
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
            'pembimbing1_id' => $dosen1->id,
            'pembimbing2_id' => $dosen2->id,
            'penguji_id' => $dosen3->id,
            'judul' => 'Sistem Informasi Manajemen Perpustakaan Berbasis Web menggunakan Laravel',
            'tipe' => 'hasil',
            'abstrak' => 'Pengembangan sistem informasi perpustakaan menggunakan framework Laravel dan React. Sistem ini dirancang untuk mempermudah pengelolaan buku, peminjaman, dan administrasi perpustakaan digital.',
            'status' => 'pending_verification',
        ]);

        $seminar3 = \App\Models\Seminar::create([
            'mahasiswa_id' => $mahasiswa3->id,
            'pembimbing1_id' => $dosen2->id,
            'pembimbing2_id' => $dosen1->id,
            'penguji_id' => $dosen3->id,
            'judul' => 'Analisis Kinerja Algoritma Sorting pada Big Data dengan Benchmark Testing',
            'tipe' => 'kompre',
            'abstrak' => 'Melakukan perbandingan kinerja berbagai algoritma sorting (Quick Sort, Merge Sort, Heap Sort) dalam menangani dataset besar. Menggunakan metode benchmark untuk mengukur efisiensi waktu dan memori secara akurat.',
            'status' => 'pending_verification',
        ]);

        // Create Approvals untuk setiap seminar (status pending)
        // Seminar 1 Approvals
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
            'dosen_id' => $dosen1->id,
            'peran' => 'pembimbing1',
            'status' => 'pending',
        ]);
        \App\Models\SeminarApproval::create([
            'seminar_id' => $seminar2->id,
            'dosen_id' => $dosen2->id,
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
            'dosen_id' => $dosen2->id,
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
            'dosen_id' => $dosen3->id,
            'peran' => 'penguji',
            'status' => 'pending',
        ]);

        $this->command->info('');
        $this->command->info('✅ Seeder completed!');
        $this->command->info('📊 Created: 3 Seminars, 9 Pending Approvals');
        $this->command->info('📧 Login credentials:');
        $this->command->info('   Admin: admin@test.com / password');
        $this->command->info('   Mahasiswa: mahasiswa@test.com / password');
        $this->command->info('   Dosen 1: dosen1@test.com / password (3 approvals pending)');
        $this->command->info('   Dosen 2: dosen2@test.com / password (3 approvals pending)');
        $this->command->info('   Dosen 3: dosen3@test.com / password (3 approvals pending)');
    }
}
