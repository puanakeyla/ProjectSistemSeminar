<?php
$dbFile = __DIR__ . '/../database/database.sqlite';
if (!file_exists($dbFile)) {
    echo "Database not found\n";
    exit(1);
}
try {
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->query('SELECT id, name, email, password, created_at FROM users');
    foreach ($stmt as $row) {
        echo "ID: {$row['id']} | Name: {$row['name']} | Email: {$row['email']} | Password: {$row['password']} | Created: {$row['created_at']}\n";
    }
} catch (Throwable $e) {
    echo "error: " . $e->getMessage() . "\n";
    exit(1);
}
