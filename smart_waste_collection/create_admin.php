<?php
require_once __DIR__ . '/api/config.php';

$email = 'admin@waste.com';
$password = 'password';
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $conn->prepare("SELECT * FROM admins WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() == 0) {
        $stmt = $conn->prepare("INSERT INTO admins (name, email, password) VALUES (?, ?, ?)");
        $stmt->execute(['Admin User', $email, $hashed_password]);
        echo "Admin created successfully.\n";
    } else {
        // Update password just in case
        $stmt = $conn->prepare("UPDATE admins SET password = ? WHERE email = ?");
        $stmt->execute([$hashed_password, $email]);
        echo "Admin password updated.\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
