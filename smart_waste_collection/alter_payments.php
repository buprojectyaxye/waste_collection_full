<?php
require 'api/config.php';
try {
    $conn->exec('UPDATE payments SET created_at = paid_at WHERE paid_at IS NOT NULL');
    echo "Done updating created_at\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
