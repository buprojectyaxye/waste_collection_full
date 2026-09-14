<?php
require_once 'api/config.php';

// Simulate active sessions for both Driver (isse) and Resident
$_SESSION['sessions'] = [
    'driver' => [
        'user_id' => 31,
        'type' => 'driver',
        'name' => 'isse',
        'email' => 'isse1@gmail.com'
    ],
    'resident' => [
        'user_id' => 10,
        'type' => 'resident',
        'name' => 'Garasbaley Resident',
        'email' => 'resident@gmail.com'
    ]
];
$_SESSION['user_id'] = 10;
$_SESSION['user_type'] = 'resident';

echo "=== INITIAL SESSION STATE ===\n";
echo "Active Roles in Session: " . implode(', ', array_keys($_SESSION['sessions'])) . "\n";
echo "Current Session User: " . $_SESSION['name'] . " (" . $_SESSION['user_type'] . ")\n\n";

// Perform simulated logout of 'resident'
$type = 'resident';
if ($type && isset($_SESSION['sessions'][$type])) {
    unset($_SESSION['sessions'][$type]);
}

$activeRemaining = [];
if (isset($_SESSION['sessions']) && is_array($_SESSION['sessions'])) {
    foreach ($_SESSION['sessions'] as $roleKey => $sessData) {
        if (!empty($sessData['user_id'])) {
            $activeRemaining[$roleKey] = $sessData;
        }
    }
}

if (!empty($activeRemaining)) {
    $nextRole = array_key_first($activeRemaining);
    $nextSess = $activeRemaining[$nextRole];
    $_SESSION['user_id'] = $nextSess['user_id'];
    $_SESSION['user_type'] = $nextRole;
    $_SESSION['name'] = $nextSess['name'];
    $_SESSION['email'] = $nextSess['email'] ?? $nextSess['name'];
} else {
    $_SESSION = [];
}

echo "=== SESSION STATE AFTER RESIDENT LOGOUT ===\n";
echo "Remaining Roles in Session: " . implode(', ', array_keys($_SESSION['sessions'])) . "\n";
echo "Active Session User: " . $_SESSION['name'] . " (" . $_SESSION['user_type'] . ")\n";

// Test requireAuth('driver') to verify driver is still 100% authenticated
requireAuth('driver');
echo "\nrequireAuth('driver') Verification -> Driver is AUTHENTICATED as: " . $_SESSION['name'] . " (Driver ID: " . $_SESSION['user_id'] . ")\n";
