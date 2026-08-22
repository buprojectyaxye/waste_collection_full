<?php
require 'api/config.php';
$stmt = $conn->query('SHOW COLUMNS FROM drivers');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
