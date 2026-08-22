<?php
require_once __DIR__ . '/../api/config.php';
requireAuth('resident');
?>
<?= file_get_contents(__DIR__ . '/dashboard.html') ?>
