<?php
require_once __DIR__ . '/api/config.php';

try {
    // Get driver id 1 or any existing driver
    $driverStmt = $conn->query("SELECT driver_id FROM drivers LIMIT 1");
    $driver = $driverStmt->fetch(PDO::FETCH_ASSOC);
    if (!$driver) {
        $conn->exec("INSERT INTO drivers (name, email, phone, zone, password) VALUES ('Driver One', 'driver@waste.com', '+252615559999', 'Wabari', 'password')");
        $driver_id = $conn->lastInsertId();
    } else {
        $driver_id = $driver['driver_id'];
    }

    // Get or create resident
    $resStmt = $conn->query("SELECT resident_id FROM residents LIMIT 1");
    $resident = $resStmt->fetch(PDO::FETCH_ASSOC);
    if (!$resident) {
        $conn->exec("INSERT INTO residents (name, email, phone, address, password) VALUES ('Ali Hassan', 'ali@gmail.com', '+252615551234', 'Wabari, Block 4', 'password')");
        $resident_id = $conn->lastInsertId();
    } else {
        $resident_id = $resident['resident_id'];
    }

    // Count existing assignments
    $count = $conn->query("SELECT COUNT(*) FROM assignments WHERE driver_id = $driver_id")->fetchColumn();
    if ($count < 3) {
        $sampleData = [
            ['Ali Hassan', 'Wabari, Mogadishu', 'Plastic', 25.0, 5.0, 'Completed', 'Collected successfully on schedule.'],
            ['Ahmed Noor', 'Hodan, Mogadishu', 'Organic', 30.5, 4.0, 'Completed', 'Recycled organic waste collected.'],
            ['Asha Abdi', 'Hamarweyne, Mogadishu', 'Metal', 18.0, 5.0, 'Completed', 'Metal scrap collected safely.']
        ];

        foreach ($sampleData as $item) {
            $conn->exec("INSERT INTO requests (resident_id, request_time, address, status) VALUES ($resident_id, NOW(), '{$item[1]}', 'Completed')");
            $req_id = $conn->lastInsertId();

            $conn->exec("INSERT INTO assignments (request_id, driver_id, assigned_time, started_time, completed_time, status, waste_type, weight_kg, rating, driver_notes, payment_status) 
            VALUES ($req_id, $driver_id, NOW(), NOW(), NOW(), 'Completed', '{$item[2]}', {$item[3]}, {$item[4]}, '{$item[6]}', 'Paid')");
        }
        echo "Inserted sample assignment data!\n";
    } else {
        echo "Already have sufficient sample assignments ($count).\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
