<?php
require_once 'api/config.php';

// Verify Garasbaley zone driver
$stmt = $conn->prepare("SELECT driver_id, name, zone FROM drivers WHERE approval_status = 'Approved' AND (zone LIKE '%Garasbaley%' OR zone = 'Garasbaley') ORDER BY driver_id ASC LIMIT 1");
$stmt->execute();
$drv = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Garasbaley District Assigned Driver: ";
print_r($drv);

// Check Request #54 again
$stmt54 = $conn->prepare("
    SELECT r.request_id, r.address, r.driver_id, d.name as driver_name, r.status 
    FROM waste_requests r 
    JOIN drivers d ON r.driver_id = d.driver_id 
    WHERE r.request_id = 54
");
$stmt54->execute();
echo "\nRequest #54 Status:\n";
print_r($stmt54->fetch(PDO::FETCH_ASSOC));
