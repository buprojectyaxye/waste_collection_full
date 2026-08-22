<?php
require_once __DIR__ . '/../api/config.php';
requireAuth('driver');
?>
<?= file_get_contents(__DIR__ . '/dashboard.html') ?>
