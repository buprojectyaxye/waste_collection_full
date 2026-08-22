<?php
require 'api/config.php';
$stmt = $conn->prepare('UPDATE admins SET password = ?');
$stmt->execute(['$2y$10$trb3NjbPSL9iETNQPf0bFeaeIUBOFzIanxXLQOch2J2v2buhFUF1C']);
echo 'Password reset';
