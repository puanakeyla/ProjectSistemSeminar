<?php

$dbFile = __DIR__ . '/database/database.sqlite';
if (!file_exists($dbFile)) {
    $dbFile = __DIR__ . '/database.sqlite';
}

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/../database/database.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $email = 'puan@example.com';
    $name = 'puan';
    $password = password_hash('123', PASSWORD_BCRYPT);
    $now = (new DateTime())->format('Y-m-d H:i:s');

    // Check existing
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        echo "exists: {$row['id']}\n";
        exit(0);
    }

    $insert = $pdo->prepare('INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
    $insert->execute([$name, $email, $password, $now, $now]);
    $id = $pdo->lastInsertId();
    echo "inserted: $id\n";
    exit(0);
} catch (Throwable $e) {
    echo "error: " . $e->getMessage() . "\n";
    exit(1);
}
