<?php
// db.php - Database connection for Smart Waste Collection System
$host = '127.0.0.1';
$port = 3306;
$db_name = 'smart_waste_db';
$username = 'root';
$password = '';

try {
    $conn = new PDO("mysql:host={$host};port={$port};dbname={$db_name};charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database Connection Error: " . $e->getMessage());
}
