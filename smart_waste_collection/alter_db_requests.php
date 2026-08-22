<?php
require 'api/config.php';
try {
    $conn->exec("ALTER TABLE requests ADD COLUMN priority ENUM('High', 'Medium', 'Normal') DEFAULT 'Normal'");
    echo "Column added successfully";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "Column already exists";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
