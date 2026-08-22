<?php
require 'api/config.php';
$stmt = $conn->query("DESCRIBE residents");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
