<?php
require_once __DIR__ . '/api/config.php';

try {
    // Add columns to assignments if they don't exist
    $columns = [
        "started_time TIMESTAMP NULL AFTER assigned_time",
        "waste_type VARCHAR(50) DEFAULT 'Plastic'",
        "weight_kg DECIMAL(10,2) DEFAULT 25.00",
        "driver_notes TEXT NULL",
        "before_image VARCHAR(255) NULL",
        "after_image VARCHAR(255) NULL",
        "rating DECIMAL(2,1) DEFAULT 5.0",
        "payment_status ENUM('Paid', 'Unpaid') DEFAULT 'Paid'"
    ];

    foreach ($columns as $colDef) {
        $colName = explode(' ', trim($colDef))[0];
        $check = $conn->query("SHOW COLUMNS FROM assignments LIKE '$colName'");
        if ($check->rowCount() == 0) {
            $conn->exec("ALTER TABLE assignments ADD COLUMN $colDef");
            echo "Added column $colName to assignments\n";
        } else {
            echo "Column $colName already exists\n";
        }
    }

    // Also update existing completed/assigned jobs with sample data for demonstration
    $conn->exec("UPDATE assignments SET 
        started_time = IFNULL(started_time, DATE_SUB(completed_time, INTERVAL 30 MINUTE)),
        waste_type = IF(waste_type IS NULL OR waste_type='', 'Plastic', waste_type),
        weight_kg = IF(weight_kg IS NULL OR weight_kg=0, 25.5, weight_kg),
        driver_notes = IF(driver_notes IS NULL, 'Collected successfully from designated bin area.', driver_notes),
        rating = IF(rating IS NULL, 5.0, rating),
        payment_status = IF(payment_status IS NULL, 'Paid', payment_status)
        WHERE status IN ('Completed', 'In Progress', 'Accepted', 'Pending')
    ");

    echo "Database updated successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
