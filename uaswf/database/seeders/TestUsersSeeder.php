<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::create([
            'name' => 'Admin System',
            'email' => 'admin@univ.ac.id',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'npm' => null,
        ]);

        // Dosen Pembimbing 1
        User::create([
            'name' => 'Dr. Ahmad Wijaya, M.Kom',
            'email' => 'ahmad.wijaya@univ.ac.id',
            'password' => Hash::make('dosen123'),
            'role' => 'dosen',
            'npm' => null,
        ]);

        // Dosen Pembimbing 2
        User::create([
            'name' => 'Dr. Siti Nurhaliza, M.T',
            'email' => 'siti.nurhaliza@univ.ac.id',
            'password' => Hash::make('dosen123'),
            'role' => 'dosen',
            'npm' => null,
        ]);

        // Dosen Penguji
        User::create([
            'name' => 'Prof. Budi Santoso, Ph.D',
            'email' => 'budi.santoso@univ.ac.id',
            'password' => Hash::make('dosen123'),
            'role' => 'dosen',
            'npm' => null,
        ]);

        // Mahasiswa 1
        User::create([
            'name' => 'Andi Prasetyo',
            'email' => 'andi@student.univ.ac.id',
            'password' => Hash::make('mhs123'),
            'role' => 'mahasiswa',
            'npm' => '2021001',
        ]);

        // Mahasiswa 2
        User::create([
            'name' => 'Dewi Kusuma',
            'email' => 'dewi@student.univ.ac.id',
            'password' => Hash::make('mhs123'),
            'role' => 'mahasiswa',
            'npm' => '2021002',
        ]);

        // Mahasiswa 3
        User::create([
            'name' => 'Raka Firmansyah',
            'email' => 'raka@student.univ.ac.id',
            'password' => Hash::make('mhs123'),
            'role' => 'mahasiswa',
            'npm' => '2021003',
        ]);
    }
}
