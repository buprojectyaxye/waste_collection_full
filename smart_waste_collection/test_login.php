<?php
require 'api/config.php';
// Simulate auth.php login logic
$email = 'admin@waste.com';
$password = 'password';
$table = 'admins';
$stmt = $conn->prepare("SELECT * FROM $table WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();
var_dump($user);
if ($user && password_verify($password, $user['password'])) {
    echo "Login successful!\n";
} else {
    echo "Login failed!\n";
}
?>
