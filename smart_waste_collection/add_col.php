<?php
require 'api/config.php';
try {
    $conn->exec("ALTER TABLE admins ADD COLUMN profile_pic LONGTEXT NULL");
    echo "Column added";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
