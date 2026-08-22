<?php
require 'api/config.php';
try {
    $conn->exec("ALTER TABLE residents ADD COLUMN status VARCHAR(20) DEFAULT 'Active'");
    echo "Column added successfully";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "Column already exists";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
