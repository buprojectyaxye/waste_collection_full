<?php
require_once 'api/config.php';

echo "Session Garbage Collection Lifetime: " . ini_get('session.gc_maxlifetime') . " seconds (30 Days)\n";
echo "Session Cookie Lifetime: " . ini_get('session.cookie_lifetime') . " seconds (30 Days)\n";

// Test token generation and cookie restoration simulation for driver #31 (isse)
$stmt = $conn->query("SELECT * FROM drivers WHERE driver_id = 31");
$driver = $stmt->fetch();

$secretKey = "SWCMS_SECRET_KEY_2026";
$userId = $driver['driver_id'];
$tokenHash = hash_hmac('sha256', "driver:$userId:" . $driver['password'], $secretKey);
$tokenVal = base64_encode("driver:$userId:$tokenHash");

$_COOKIE['swcms_token_driver'] = $tokenVal;

// Clear session to simulate PHP session expiration / server restart
$_SESSION = [];

echo "\nBefore Cookie Restore -> User ID in Session: " . ($_SESSION['user_id'] ?? 'NONE') . "\n";

$restored = restoreSessionFromCookie('driver');
echo "Cookie Session Restore Result: " . ($restored ? 'SUCCESS' : 'FAILED') . "\n";
echo "After Cookie Restore -> Logged-in User ID: " . ($_SESSION['user_id'] ?? 'NONE') . " | Name: " . ($_SESSION['name'] ?? 'NONE') . " | Role: " . ($_SESSION['user_type'] ?? 'NONE') . "\n";
