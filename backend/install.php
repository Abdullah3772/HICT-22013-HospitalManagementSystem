<?php
/**
 * One-time installer: creates the initial Super Admin account.
 *
 * Security guards:
 *   1. CLI-only — refuses to run through a web browser.
 *   2. Checks whether an admin already exists and aborts if so.
 *   3. Password is read from the ADMIN_PASSWORD env var (or prompted interactively).
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo 'This script must be run from the command line.';
    exit(1);
}

require_once __DIR__ . '/config.php';

function connectInstall() {
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    return new PDO($dsn, DB_USER, DB_PASS, $options);
}

try {
    $db = connectInstall();
    $adminUsername = 'admin';
    $adminEmail = 'admin@nationalhospital.lk';
    $adminPhone = '011 234 5678';

    $roleStmt = $db->prepare('SELECT role_id FROM roles WHERE role_name = ?');
    $roleStmt->execute(['Super Admin']);
    $role = $roleStmt->fetchColumn();
    if (!$role) {
        echo "Role 'Super Admin' not found. Please import db.sql first.\n";
        exit(1);
    }

    $userStmt = $db->prepare('SELECT user_id FROM users WHERE username = ?');
    $userStmt->execute([$adminUsername]);
    if ($userStmt->fetch()) {
        echo "Admin user already exists.\n";
        exit;
    }

    $adminPassword = getenv('ADMIN_PASSWORD') ?: '';
    if ($adminPassword === '') {
        echo 'Enter a password for the admin account: ';
        $adminPassword = trim(fgets(STDIN));
    }
    if (strlen($adminPassword) < 8) {
        echo "Password must be at least 8 characters.\n";
        exit(1);
    }

    $insert = $db->prepare('INSERT INTO users (username, password_hash, role_id, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)');
    $insert->execute([
        $adminUsername,
        password_hash($adminPassword, PASSWORD_DEFAULT),
        $role,
        'Super Admin',
        $adminEmail,
        $adminPhone,
    ]);

    echo "Super Admin user created successfully.\n";
    echo "Username: {$adminUsername}\n";
} catch (PDOException $ex) {
    echo "Error: " . $ex->getMessage() . "\n";
    exit(1);
}
