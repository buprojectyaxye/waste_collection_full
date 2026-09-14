<?php
// assign_driver.php - Dedicated Endpoint for Driver Assignment
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/api/config.php';

// Decode JSON or POST form data or GET parameters
$data = json_decode(file_get_contents("php://input"), true);
if (!$data && !empty($_POST)) {
    $data = $_POST;
}
if (!$data && !empty($_GET)) {
    $data = $_GET;
}

$request_id = $data['request_id'] ?? $data['id'] ?? null;
$driver_id = $data['driver_id'] ?? null;

if (!$request_id || !$driver_id) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Both request_id and driver_id are required.'
    ]);
    exit;
}

try {
    // 1. Verify driver exists
    $stmtDrv = $conn->prepare("SELECT driver_id, name, status, zone FROM drivers WHERE driver_id = ?");
    $stmtDrv->execute([$driver_id]);
    $driver = $stmtDrv->fetch(PDO::FETCH_ASSOC);

    if (!$driver) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => "Driver with ID $driver_id was not found in the database."
        ]);
        exit;
    }

    // 2. Verify request exists and payment status
    $stmtReq = $conn->prepare("SELECT request_id, resident_id, address, status, payment_status FROM waste_requests WHERE request_id = ?");
    $stmtReq->execute([$request_id]);
    $req = $stmtReq->fetch(PDO::FETCH_ASSOC);

    if (!$req) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => "Waste Request #$request_id was not found in the database."
        ]);
        exit;
    }

    $isPaid = false;
    if (isset($req['payment_status']) && in_array($req['payment_status'], ['Completed', 'Paid', 'Success'])) {
        $isPaid = true;
    } else {
        $stmtPay = $conn->prepare("SELECT payment_id FROM payments WHERE request_id = ? AND status IN ('Completed', 'Paid', 'Success') LIMIT 1");
        $stmtPay->execute([$request_id]);
        if ($stmtPay->fetch()) {
            $isPaid = true;
        }
    }

    if (!$isPaid) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => "🛑 Cannot Assign Driver: Request #$request_id is UNPAID. Resident must pay the fee before a driver can be assigned!"
        ]);
        exit;
    }

    $conn->beginTransaction();

    // 3. Update waste_requests table
    $stmtUpdateReq = $conn->prepare("UPDATE waste_requests SET driver_id = ?, status = 'Assigned' WHERE request_id = ?");
    $stmtUpdateReq->execute([$driver_id, $request_id]);

    // 4. Create or update assignment record
    $checkAssign = $conn->prepare("SELECT assignment_id FROM assignments WHERE request_id = ? ORDER BY assignment_id DESC LIMIT 1");
    $checkAssign->execute([$request_id]);
    $existAssign = $checkAssign->fetch(PDO::FETCH_ASSOC);

    if ($existAssign) {
        $stmtAssign = $conn->prepare("UPDATE assignments SET driver_id = ?, status = 'Assigned', assigned_time = NOW() WHERE assignment_id = ?");
        $stmtAssign->execute([$driver_id, $existAssign['assignment_id']]);
    } else {
        $stmtAssign = $conn->prepare("INSERT INTO assignments (request_id, driver_id, status, assigned_time) VALUES (?, ?, 'Assigned', NOW())");
        $stmtAssign->execute([$request_id, $driver_id]);
    }

    // 5. Add request audit log
    $driverName = $driver['name'] ?? 'Driver';
    try {
        $stmtLog = $conn->prepare("INSERT INTO request_logs (request_id, action, message) VALUES (?, 'Assigned', ?)");
        $stmtLog->execute([$request_id, "Assigned to driver $driverName by administrator."]);
    } catch (Exception $exLog) {}

    // 6. Send notification to driver
    try {
        $stmtNotif = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Driver', ?, 'New Job Assigned', ?)");
        $stmtNotif->execute([$driver_id, "You have been assigned to Pickup Request #$request_id at {$req['address']}."]);
    } catch (Exception $exNotif) {}

    $conn->commit();

    echo json_encode([
        'status' => 'success',
        'message' => "Driver $driverName successfully assigned to Request #$request_id.",
        'data' => [
            'request_id' => (int)$request_id,
            'driver_id' => (int)$driver_id,
            'driver_name' => $driverName,
            'status' => 'Assigned'
        ]
    ]);
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
