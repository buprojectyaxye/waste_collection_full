<?php
require 'api/config.php';
try {
    $conn->exec("ALTER TABLE drivers ADD COLUMN vehicle_info VARCHAR(100) DEFAULT ''");
    echo "Column vehicle_info added successfully\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
