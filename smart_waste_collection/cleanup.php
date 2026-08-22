<?php
require 'api/config.php';
try {
    $stmt = $conn->query("SELECT notification_id, message FROM notifications WHERE message LIKE '%Resident #%'");
    $notifs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($notifs as $n) {
        if (preg_match('/Resident #(\d+)/', $n['message'], $matches)) {
            $resident_id = $matches[1];
            $rStmt = $conn->prepare("SELECT name FROM residents WHERE resident_id = ?");
            $rStmt->execute([$resident_id]);
            $res = $rStmt->fetch(PDO::FETCH_ASSOC);
            if ($res) {
                $newName = $res['name'];
                $newMsg = str_replace("Resident #$resident_id", $newName, $n['message']);
                $upd = $conn->prepare("UPDATE notifications SET message = ? WHERE notification_id = ?");
                $upd->execute([$newMsg, $n['notification_id']]);
                echo "Updated notif " . $n['notification_id'] . "\n";
            }
        }
    }
    echo "Done";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
