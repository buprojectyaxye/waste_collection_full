<?php
require_once __DIR__ . '/api/config.php';

try {
    // Check requests addresses
    $stmt = $conn->query("SELECT request_id, address FROM requests");
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $neighborhoods = ['Wabari, Mogadishu', 'Hodan, Mogadishu', 'Wadajir, Mogadishu', 'Deyniile, Mogadishu', 'Hamarweyne, Mogadishu'];
    $i = 0;

    foreach ($requests as $req) {
        $addr = trim($req['address']);
        // If address is only a map URL or empty or short
        if (empty($addr) || strpos($addr, 'http') === 0 || strlen($addr) < 5) {
            $newAddr = $neighborhoods[$i % count($neighborhoods)];
            if (!empty($addr) && strpos($addr, 'http') !== false) {
                $newAddr .= ' ' . $addr;
            }
            $update = $conn->prepare("UPDATE requests SET address = ? WHERE request_id = ?");
            $update->execute([$newAddr, $req['request_id']]);
            echo "Updated request #{$req['request_id']} address to: $newAddr\n";
            $i++;
        }
    }
    echo "Address migration completed successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
