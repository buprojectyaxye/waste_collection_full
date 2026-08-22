<?php
require 'api/config.php';
try {
    $conn->exec("ALTER TABLE payments ADD COLUMN method VARCHAR(50) DEFAULT 'Mobile Money'");
    echo "Done";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
