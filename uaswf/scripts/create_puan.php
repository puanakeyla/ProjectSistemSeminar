<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

// Bootstrap the kernel to have facades and Eloquent available
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$email = 'puan@example.com';
$name = 'puan';
$password = '123';

try {
    $existing = User::where('email', $email)->first();
    if ($existing) {
        echo "exists\n";
        exit(0);
    }

    $user = User::create([
        'name' => $name,
        'email' => $email,
        'password' => Hash::make($password),
    ]);

    if ($user) {
        echo "created: {$user->id}\n";
        exit(0);
    }

    echo "failed\n";
    exit(1);
} catch (Throwable $e) {
    echo "error: " . $e->getMessage() . "\n";
    exit(1);
}
