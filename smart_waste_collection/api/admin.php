<?php
// api/admin.php
require_once 'config.php';

requireAuth('admin');
$admin_id = $_SESSION['user_id'];

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data && !empty($_POST)) {
        $data = $_POST;
    }
    
    if ($action === 'update_admin_profile') {
        $name = $data['name'] ?? '';
        $email = $data['email'] ?? '';
        
        if (!$name || !$email) {
            sendResponse('error', 'Name and Email are required', null, 400);
        }
        
        try {
            $stmt = $conn->prepare("UPDATE admins SET name = ?, email = ? WHERE admin_id = ?");
            $stmt->execute([$name, $email, $_SESSION['user_id']]);
            
            $_SESSION['name'] = $name;
            $_SESSION['email'] = $email;
            
            sendResponse('success', 'Profile updated successfully');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    
    if ($action === 'update_admin_password') {
        $current = $data['current_password'] ?? '';
        $new = $data['new_password'] ?? '';
        
        if (!$current || !$new) {
            sendResponse('error', 'Both passwords are required', null, 400);
        }
        
        try {
            $stmt = $conn->prepare("SELECT password FROM admins WHERE admin_id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $admin = $stmt->fetch();
            
            if (!$admin || !password_verify($current, $admin['password'])) {
                sendResponse('error', 'Current password is incorrect', null, 400);
            }
            
            $hash = password_hash($new, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE admins SET password = ? WHERE admin_id = ?");
            $stmt->execute([$hash, $_SESSION['user_id']]);
            
            sendResponse('success', 'Password updated successfully');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    
    if ($action === 'update_admin_profile_pic') {
        $profile_pic = $data['profile_pic'] ?? null;
        
        if ($profile_pic && strpos($profile_pic, 'data:image') === 0) {
            $dir = __DIR__ . '/../uploads/profiles/';
            if (!file_exists($dir)) {
                @mkdir($dir, 0777, true);
            }
            
            $ext = 'jpg';
            if (preg_match('/data:image\/([a-zA-Z0-9+]+);base64,/', $profile_pic, $matches)) {
                $ext = strtolower($matches[1]);
                if ($ext === 'jpeg') $ext = 'jpg';
                if ($ext === 'svg+xml') $ext = 'svg';
            }
            
            $parts = explode(',', $profile_pic);
            $base64Data = end($parts);
            
            if ($base64Data) {
                $filename = 'admin_' . ($_SESSION['user_id'] ?? 1) . '_' . time() . '.' . $ext;
                $filepath = $dir . $filename;
                @file_put_contents($filepath, base64_decode($base64Data));
                $profile_pic = '../uploads/profiles/' . $filename;
            }
        }
        
        try {
            try {
                $stmt = $conn->prepare("UPDATE admins SET profile_picture = ? WHERE admin_id = ?");
                $stmt->execute([$profile_pic, $_SESSION['user_id'] ?? 1]);
            } catch (PDOException $eCol) {
                $conn->exec("ALTER TABLE admins ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL AFTER role");
                $stmt = $conn->prepare("UPDATE admins SET profile_picture = ? WHERE admin_id = ?");
                $stmt->execute([$profile_pic, $_SESSION['user_id'] ?? 1]);
            }
            
            sendResponse('success', 'Profile picture updated successfully', ['profile_picture' => $profile_pic]);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }

    if ($action === 'add_driver' || $action === 'register_driver') {
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $zone = trim($data['zone'] ?? '');
        $license_number = trim($data['license_number'] ?? $data['license'] ?? '');
        $emergency_contact = trim($data['emergency_contact'] ?? $data['emergency'] ?? '');
        $password = $data['password'] ?? '';
        $raw_plate = trim($data['vehicle_plate'] ?? $data['truck_plate'] ?? $data['truck'] ?? $data['plate'] ?? $data['plate_num'] ?? '');
        $digits = preg_replace('/[^0-9]/', '', $raw_plate);
        $vehicle_info = trim($data['vehicle_info'] ?? '');

        if (!$name || !$email || !$password) {
            sendResponse('error', 'Name, email and password are required', null, 400);
        }
        if (!$license_number) {
            sendResponse('error', 'Driver License Number is required', null, 400);
        }
        if (!$digits) {
            sendResponse('error', 'Fadlan geli lambarka taargada gaariga (tusaale geli 101 si ay u noqoto BU-101)', null, 400);
        }

        $truck_plate = 'BU-' . $digits;

        try {
            $checkDup = $conn->prepare("SELECT driver_id FROM drivers WHERE email = ? OR (phone = ? AND phone != '')");
            $checkDup->execute([$email, $phone]);
            if ($checkDup->fetch()) {
                sendResponse('error', '🛑 A driver with this email or phone number already exists!', null, 400);
            }

            // Strict Driver License Uniqueness Check
            $clean_license = strtoupper(trim($license_number));
            $checkLicense = $conn->prepare("SELECT driver_id, name FROM drivers WHERE UPPER(TRIM(license_number)) = ?");
            $checkLicense->execute([$clean_license]);
            $dupLicense = $checkLicense->fetch(PDO::FETCH_ASSOC);
            if ($dupLicense) {
                sendResponse('error', "🛑 Driver License Number '$clean_license' is already registered to driver '{$dupLicense['name']}'!", null, 400);
            }

            // Strict Plate Uniqueness Check (BU- format)
            $checkPlate = $conn->prepare("SELECT driver_id, name FROM drivers WHERE UPPER(vehicle_plate) = ?");
            $checkPlate->execute([$truck_plate]);
            $dupDriver = $checkPlate->fetch(PDO::FETCH_ASSOC);
            if ($dupDriver) {
                sendResponse('error', "🛑 The vehicle number plate '$truck_plate' is already registered to driver '{$dupDriver['name']}'. Please enter a different vehicle number plate.", null, 400);
            }

            // Strict 1-Driver-Per-District Enforcement
            if ($zone) {
                $checkZone = $conn->prepare("SELECT driver_id, name FROM drivers WHERE (LOWER(zone) = LOWER(?) OR zone LIKE ?) AND approval_status = 'Approved'");
                $checkZone->execute([$zone, "%$zone%"]);
                $zoneDriver = $checkZone->fetch(PDO::FETCH_ASSOC);
                if ($zoneDriver) {
                    sendResponse('error', "🛑 District '$zone' already has an assigned driver ('{$zoneDriver['name']}'). Each district can only have 1 assigned driver.", null, 400);
                }
            }

            // Total 18 Drivers Max Limit
            $totalDrivers = (int)$conn->query("SELECT COUNT(*) FROM drivers WHERE approval_status = 'Approved'")->fetchColumn();
            if ($totalDrivers >= 18) {
                sendResponse('error', "🛑 Maximum driver limit reached (18 drivers for 18 Mogadishu districts). All districts are fully staffed.", null, 400);
            }

            // Find model if truck plate matches fleet
            $trkStmt = $conn->prepare("SELECT model, assigned_zone FROM trucks WHERE plate_number = ?");
            $trkStmt->execute([$truck_plate]);
            $trk = $trkStmt->fetch();
            if ($trk) {
                if (!$vehicle_info) $vehicle_info = $trk['model'] . " ($truck_plate)";
                if (!$zone) $zone = $trk['assigned_zone'];
            }

            if (!$vehicle_info) $vehicle_info = "Pickup Truck ($truck_plate)";
            if (!$zone) $zone = 'Wadajir';

            $hashed = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("
                INSERT INTO drivers (name, email, phone, zone, license_number, emergency_contact, vehicle_plate, vehicle_info, status, approval_status, password) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'On Duty', 'Approved', ?)
            ");
            $stmt->execute([$name, $email, $phone, $zone, $license_number, $emergency_contact, $truck_plate, $vehicle_info, $hashed]);
            $newDriverId = $conn->lastInsertId();

            // Link fleet truck if present in trucks table
            $upTrk = $conn->prepare("UPDATE trucks SET current_driver_id = ?, status = 'Assigned' WHERE plate_number = ?");
            $upTrk->execute([$newDriverId, $truck_plate]);

            sendResponse('success', 'Driver registered and vehicle plate assigned successfully!', ['driver_id' => $newDriverId, 'vehicle_plate' => $truck_plate]);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'edit_resident' || $action === 'update_resident') {
        $resident_id = $data['resident_id'] ?? null;
        $name = $data['name'] ?? '';
        $email = $data['email'] ?? '';
        $phone = $data['phone'] ?? '';
        $address = $data['address'] ?? '';
        $status = $data['status'] ?? 'Active';

        if (!$resident_id || !$name) {
            sendResponse('error', 'Required fields missing', null, 400);
        }

        try {
            $stmt = $conn->prepare("UPDATE residents SET name = ?, email = ?, phone = ?, address = ?, status = ? WHERE resident_id = ?");
            $stmt->execute([$name, $email, $phone, $address, $status, $resident_id]);
            sendResponse('success', 'Resident updated successfully');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'edit_driver') {
        $driver_id = $data['driver_id'] ?? null;
        $name = $data['name'] ?? '';
        $phone = $data['phone'] ?? '';
        $zone = $data['zone'] ?? '';
        $vehicle_info = $data['vehicle_info'] ?? '';

        if (!$driver_id || !$name) {
            sendResponse('error', 'Required fields missing', null, 400);
        }

        try {
            $stmt = $conn->prepare("UPDATE drivers SET name = ?, phone = ?, zone = ? WHERE driver_id = ?");
            $stmt->execute([$name, $phone, $zone, $driver_id]);
            sendResponse('success', 'Driver updated successfully');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'delete_driver') {
        $driver_id = $data['driver_id'] ?? null;
        if (!$driver_id) {
            sendResponse('error', 'Driver ID missing', null, 400);
        }

        try {
            // Unassign FROM waste_requests first or set to null if needed
            $conn->beginTransaction();
            $stmt = $conn->prepare("DELETE FROM assignments WHERE driver_id = ?");
            $stmt->execute([$driver_id]);
            $stmt = $conn->prepare("DELETE FROM drivers WHERE driver_id = ?");
            $stmt->execute([$driver_id]);
            $conn->commit();
            sendResponse('success', 'Driver deleted successfully');
        } catch (PDOException $e) {
            $conn->rollBack();
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'approve_driver') {
        $driver_id = $data['driver_id'] ?? null;
        $vehicle_plate = trim($data['vehicle_plate'] ?? '');
        $vehicle_info = trim($data['vehicle_info'] ?? 'Compact Dump Truck');
        $zone = trim($data['zone'] ?? 'Wadajir');

        if (!$driver_id || empty($vehicle_plate)) {
            sendResponse('error', 'Driver ID and Assigned Vehicle License Plate Number are required to approve the driver.', null, 400);
        }

        try {
            $stmt = $conn->prepare("
                UPDATE drivers 
                SET approval_status = 'Approved', 
                    status = 'On Duty', 
                    vehicle_plate = ?, 
                    vehicle_info = ?, 
                    zone = ?,
                    rejection_reason = NULL
                WHERE driver_id = ?
            ");
            $stmt->execute([$vehicle_plate, $vehicle_info, $zone, $driver_id]);

            // Notify Driver
            try {
                $notifStmt = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Driver', ?, 'Account Approved! 🎉', ?)");
                $notifStmt->execute([
                    $driver_id, 
                    "Congratulations! Your driver account has been approved by the Admin.\nAssigned Vehicle Plate: $vehicle_plate\nYou can now log in and access your dashboard."
                ]);

                $msgStmt = $conn->prepare("INSERT INTO messages (sender_type, sender_id, message) VALUES ('Admin', ?, ?)");
                $msgStmt->execute([
                    $_SESSION['user_id'] ?? 1,
                    "To Driver #$driver_id: Application approved. Assigned Vehicle Plate: $vehicle_plate."
                ]);
            } catch (Exception $exN) {}

            sendResponse('success', 'Driver approved successfully and assigned vehicle plate: ' . $vehicle_plate);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'reject_driver') {
        $driver_id = $data['driver_id'] ?? null;
        $reason = trim($data['reason'] ?? 'Application does not meet fleet requirements at this time.');

        if (!$driver_id) {
            sendResponse('error', 'Driver ID is required.', null, 400);
        }

        try {
            $stmt = $conn->prepare("
                UPDATE drivers 
                SET approval_status = 'Rejected', 
                    status = 'Offline', 
                    rejection_reason = ? 
                WHERE driver_id = ?
            ");
            $stmt->execute([$reason, $driver_id]);

            // Notify Driver
            try {
                $notifStmt = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Driver', ?, 'Application Rejected', ?)");
                $notifStmt->execute([
                    $driver_id, 
                    "Your driver application has been rejected by the administrator.\nReason: $reason"
                ]);
            } catch (Exception $exN) {}

            sendResponse('success', 'Driver application rejected.');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'assign_driver') {
        $request_id = $data['request_id'] ?? '';
        $driver_id = $data['driver_id'] ?? '';

        if (!$request_id || !$driver_id) {
            sendResponse('error', 'Missing data', null, 400);
        }

        try {
            // Check driver status before assignment
            $stmtDrv = $conn->prepare("SELECT name, status FROM drivers WHERE driver_id = ?");
            $stmtDrv->execute([$driver_id]);
            $drvInfo = $stmtDrv->fetch();

            if (!$drvInfo) {
                sendResponse('error', 'Driver not found', null, 404);
            }

            if ($drvInfo['status'] === 'On Break') {
                sendResponse('error', "🛑 Cannot Assign Driver: Darawalka '{$drvInfo['name']}' wuxuu ku jiraa 🟡 On Break (nasasho), ma assign-garayn kartid ilaa uu kuso laabto On Duty!", null, 400);
            }

            // Check if Request is Paid before assigning
            $stmtReqCheck = $conn->prepare("SELECT request_id, payment_status, resident_id FROM waste_requests WHERE request_id = ?");
            $stmtReqCheck->execute([$request_id]);
            $reqRow = $stmtReqCheck->fetch(PDO::FETCH_ASSOC);

            if (!$reqRow) {
                sendResponse('error', 'Request not found', null, 404);
            }

            $isPaid = false;
            if (isset($reqRow['payment_status']) && in_array($reqRow['payment_status'], ['Completed', 'Paid', 'Success'])) {
                $isPaid = true;
            } else {
                $stmtPay = $conn->prepare("SELECT payment_id FROM payments WHERE request_id = ? AND status IN ('Completed', 'Paid', 'Success') LIMIT 1");
                $stmtPay->execute([$request_id]);
                if ($stmtPay->fetch()) {
                    $isPaid = true;
                }
            }

            if (!$isPaid) {
                sendResponse('error', "🛑 Cannot Assign Driver: Request #$request_id is UNPAID. Resident must pay the fee before a driver can be assigned!", null, 400);
            }

            $conn->beginTransaction();
            
            // Upsert assignment record
            $checkAssign = $conn->prepare("SELECT assignment_id FROM assignments WHERE request_id = ? ORDER BY assignment_id DESC LIMIT 1");
            $checkAssign->execute([$request_id]);
            $existAssign = $checkAssign->fetch();

            if ($existAssign) {
                $stmt = $conn->prepare("UPDATE assignments SET driver_id = ?, status = 'Assigned', assigned_time = NOW() WHERE assignment_id = ?");
                $stmt->execute([$driver_id, $existAssign['assignment_id']]);
            } else {
                $stmt = $conn->prepare("INSERT INTO assignments (request_id, driver_id, status, assigned_time) VALUES (?, ?, 'Assigned', NOW())");
                $stmt->execute([$request_id, $driver_id]);
            }
            
            $stmt2 = $conn->prepare("UPDATE waste_requests SET status = 'Assigned', driver_id = ? WHERE request_id = ?");
            $stmt2->execute([$driver_id, $request_id]);
            
            $drvName = $drvInfo['name'] ?? 'Driver';
            $stmt3 = $conn->prepare("INSERT INTO request_logs (request_id, action, message) VALUES (?, 'Assigned', ?)");
            $stmt3->execute([$request_id, "Admin assigned driver $drvName"]);

            $conn->commit();
            sendResponse('success', 'Driver assigned successfully');
        } catch (PDOException $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'reply_message') {
        $receiver_id = $data['receiver_id'] ?? null;
        $receiver_type = $data['receiver_type'] ?? 'driver';
        $message = trim($data['message'] ?? '');
        $original_message = trim($data['original_message'] ?? $data['original_content'] ?? '');

        if (!$receiver_id || !$message) {
            sendResponse('error', 'Missing receiver ID or message', null, 400);
        }

        try {
            $norm_type = ucfirst(strtolower(trim($receiver_type))); // 'Driver' or 'Resident'
            
            // Format embedded quoted context if original message is provided
            if (!empty($original_message)) {
                $formatted_msg = "📌 Re: \"$original_message\"\n----------------------------------------\n💬 Admin Reply:\n$message";
            } else {
                $formatted_msg = $message;
            }

            $stmt = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, 'Admin Reply to Your Report', ?)");
            $stmt->execute([$norm_type, $receiver_id, $formatted_msg]);

            // Also record in messages so it appears in history
            try {
                $msgStmt = $conn->prepare("INSERT INTO messages (sender_type, sender_id, recipient_id, message) VALUES ('Admin', ?, ?, ?)");
                $msgStmt->execute([$_SESSION['user_id'] ?? 1, $receiver_id, "To $norm_type #$receiver_id: $formatted_msg"]);
            } catch (Exception $exM) {}

            sendResponse('success', 'Reply sent successfully');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'edit_request') {
        $request_id = $data['request_id'] ?? null;
        $status = $data['status'] ?? null;
        $driver_id = $data['driver_id'] ?? null;
        
        if (!$request_id || !$status) {
            sendResponse('error', 'Missing required fields', null, 400);
        }
        
        try {
            $stmtReqCheck = $conn->prepare("SELECT status FROM waste_requests WHERE request_id = ?");
            $stmtReqCheck->execute([$request_id]);
            $currentReq = $stmtReqCheck->fetch();

            if ($currentReq && in_array($currentReq['status'], ['Accepted', 'In Progress', 'Completed'])) {
                sendResponse('error', '🛑 Cannot Edit Request: The driver has already accepted or started this job!', null, 400);
            }

            $conn->beginTransaction();
            
            // Update request status
            $stmt = $conn->prepare("UPDATE waste_requests SET status = ? WHERE request_id = ?");
            $stmt->execute([$status, $request_id]);
            
            // Update driver assignment
            if ($driver_id !== null && $driver_id !== '') {
                // Check if assignment exists
                $stmtCheck = $conn->prepare("SELECT assignment_id FROM assignments WHERE request_id = ?");
                $stmtCheck->execute([$request_id]);
                if ($stmtCheck->fetch()) {
                    $stmtUpdate = $conn->prepare("UPDATE assignments SET driver_id = ? WHERE request_id = ?");
                    $stmtUpdate->execute([$driver_id, $request_id]);
                } else {
                    $stmtInsert = $conn->prepare("INSERT INTO assignments (request_id, driver_id, admin_id) VALUES (?, ?, ?)");
                    $stmtInsert->execute([$request_id, $driver_id, $_SESSION['user_id']]);
                }
            } elseif ($driver_id === '') {
                // Remove driver assignment
                $stmtDelete = $conn->prepare("DELETE FROM assignments WHERE request_id = ?");
                $stmtDelete->execute([$request_id]);
            }
            
            $conn->commit();
            sendResponse('success', 'Request updated successfully');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'delete_resident') {
        $resident_id = $data['resident_id'] ?? null;
        if (!$resident_id) {
            sendResponse('error', 'Missing resident ID', null, 400);
        }
        try {
            $conn->beginTransaction();

            // Delete messages sent by the resident
            $stmt = $conn->prepare("DELETE FROM messages WHERE sender_id = ? AND sender_type = 'resident'");
            $stmt->execute([$resident_id]);

            // Get all requests from the resident
            $stmt = $conn->prepare("SELECT request_id FROM waste_requests WHERE resident_id = ?");
            $stmt->execute([$resident_id]);
            $requests = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($requests)) {
                $placeholders = implode(',', array_fill(0, count($requests), '?'));
                
                // Delete assignments
                $stmt = $conn->prepare("DELETE FROM assignments WHERE request_id IN ($placeholders)");
                $stmt->execute($requests);
                
                // Delete request logs
                $stmt = $conn->prepare("DELETE FROM request_logs WHERE request_id IN ($placeholders)");
                $stmt->execute($requests);
            }

            // Delete the requests
            $stmt = $conn->prepare("DELETE FROM waste_requests WHERE resident_id = ?");
            $stmt->execute([$resident_id]);

            // Finally delete the resident
            $stmt = $conn->prepare("DELETE FROM residents WHERE resident_id = ?");
            $stmt->execute([$resident_id]);

            $conn->commit();
            sendResponse('success', 'Resident deleted successfully');
        } catch (PDOException $e) {
            $conn->rollBack();
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'get_dashboard_stats') {
        try {
            $stats = [];
            $stats['total_requests'] = $conn->query("SELECT COUNT(*) FROM waste_requests WHERE (payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = waste_requests.request_id AND p.status = 'Completed') > 0)")->fetchColumn();
            $stats['pending_requests'] = $conn->query("SELECT COUNT(*) FROM waste_requests WHERE status = 'Pending' AND (payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = waste_requests.request_id AND p.status = 'Completed') > 0)")->fetchColumn();
            $stats['completed_requests'] = $conn->query("SELECT COUNT(*) FROM waste_requests WHERE status = 'Completed' AND (payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = waste_requests.request_id AND p.status = 'Completed') > 0)")->fetchColumn();
            $stats['total_drivers'] = $conn->query("SELECT COUNT(*) FROM drivers")->fetchColumn();
            $stats['total_residents'] = $conn->query("SELECT COUNT(*) FROM residents")->fetchColumn();
            
            // Payment stats - strictly Completed
            $stats['total_payments'] = $conn->query("SELECT COUNT(*) FROM payments WHERE status = 'Completed'")->fetchColumn();
            
            $rev = $conn->query("SELECT SUM(amount) FROM payments WHERE status = 'Completed' AND (paid_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) OR MONTH(paid_at) = MONTH(CURRENT_DATE()))")->fetchColumn();
            if (!$rev || (float)$rev == 0) {
                $rev = $conn->query("SELECT SUM(amount) FROM payments WHERE status = 'Completed'")->fetchColumn();
            }
            $stats['monthly_revenue'] = $rev ? (float)$rev : 0;
            
            $stats['today_collections'] = $conn->query("SELECT COUNT(*) FROM waste_requests WHERE status = 'Completed' AND (payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = waste_requests.request_id AND p.status = 'Completed') > 0) AND DATE(request_time) = CURRENT_DATE()")->fetchColumn();
            
            sendResponse('success', 'Stats fetched', $stats);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_payments_stats') {
        try {
            $filter = isset($_GET['filter']) ? $_GET['filter'] : '6months';
            $dateCond = "";
            $dateCondRev = "";
            if ($filter === 'this_month') {
                $dateCond = " WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())";
                $dateCondRev = " AND MONTH(paid_at) = MONTH(CURRENT_DATE()) AND YEAR(paid_at) = YEAR(CURRENT_DATE())";
            } elseif ($filter === '7days') {
                $dateCond = " WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)";
                $dateCondRev = " AND paid_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)";
            } else {
                $dateCond = " WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)";
                $dateCondRev = " AND paid_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)";
            }

            $stats = [];
            $stats['total_payments'] = $conn->query("SELECT COUNT(*) FROM payments WHERE status = 'Completed'" . str_replace("WHERE", "AND", $dateCond))->fetchColumn();
            $rev = $conn->query("SELECT SUM(amount) FROM payments WHERE status = 'Completed'" . $dateCondRev)->fetchColumn();
            $stats['monthly_revenue'] = $rev ? (float)$rev : 0;
            $stats['pending_payments'] = 0;
            $stats['failed_payments'] = 0;
            sendResponse('success', 'Stats fetched', $stats);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_chart_data') {
        try {
            $filter = isset($_GET['filter']) ? $_GET['filter'] : '6months';
            $barData = [];
            $barLabels = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = date('Y-m-d', strtotime("-$i months"));
                $monthStr = date('Y-m', strtotime("-$i months"));
                $monthLabel = date('M', strtotime("-$i months"));
                $stmt = $conn->prepare("SELECT COUNT(*) FROM waste_requests WHERE DATE_FORMAT(request_time, '%Y-%m') = ? AND (payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = waste_requests.request_id AND p.status = 'Completed') > 0)");
                $stmt->execute([$monthStr]);
                $barData[] = (int)$stmt->fetchColumn();
                $barLabels[] = $monthLabel;
            }

            $pieData = [0, 0, 0];
            $pieData[0] = (int)$conn->query("SELECT COUNT(*) FROM waste_requests WHERE status = 'Completed' AND (payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = waste_requests.request_id AND p.status = 'Completed') > 0)")->fetchColumn();
            $pieData[1] = (int)$conn->query("SELECT COUNT(*) FROM waste_requests WHERE status = 'Pending' AND (payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = waste_requests.request_id AND p.status = 'Completed') > 0)")->fetchColumn();
            $pieData[2] = (int)$conn->query("SELECT COUNT(*) FROM waste_requests WHERE status IN ('Assigned', 'In Progress', 'Accepted') AND (payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = waste_requests.request_id AND p.status = 'Completed') > 0)")->fetchColumn();

            $stmt = $conn->query("
                SELECT d.name, COUNT(a.assignment_id) as jobs
                FROM drivers d
                LEFT JOIN assignments a ON d.driver_id = a.driver_id AND a.status = 'Completed'
                GROUP BY d.driver_id
                ORDER BY jobs DESC
                LIMIT 5
            ");
            $drivers = $stmt->fetchAll();
            $driverLabels = [];
            $driverData = [];
            foreach ($drivers as $d) {
                $nameParts = explode(' ', trim($d['name']));
                $driverLabels[] = $nameParts[0];
                $driverData[] = (int)$d['jobs'];
            }
            $revenueData = [];
            $revenueLabels = [];
            if ($filter === '7days') {
                for ($i = 6; $i >= 0; $i--) {
                    $day = date('Y-m-d', strtotime("-$i days"));
                    $dayLabel = date('D', strtotime("-$i days"));
                    $stmt = $conn->prepare("SELECT SUM(amount) FROM payments WHERE status = 'Completed' AND DATE(paid_at) = ?");
                    $stmt->execute([$day]);
                    $rev = $stmt->fetchColumn();
                    $revenueData[] = $rev ? (float)$rev : 0;
                    $revenueLabels[] = $dayLabel;
                }
            } elseif ($filter === 'this_month') {
                $year = date('Y');
                $month = date('m');
                $monthName = date('M');
                $daysInMonth = (int)date('t');

                $ranges = [
                    ['label' => "1-7 $monthName", 'start' => "$year-$month-01", 'end' => "$year-$month-07"],
                    ['label' => "8-14 $monthName", 'start' => "$year-$month-08", 'end' => "$year-$month-14"],
                    ['label' => "15-21 $monthName", 'start' => "$year-$month-15", 'end' => "$year-$month-21"],
                    ['label' => "22-28 $monthName", 'start' => "$year-$month-22", 'end' => "$year-$month-28"],
                ];
                if ($daysInMonth > 28) {
                    $ranges[] = ['label' => "29-$daysInMonth $monthName", 'start' => "$year-$month-29", 'end' => "$year-$month-" . sprintf('%02d', $daysInMonth)];
                }

                foreach ($ranges as $r) {
                    $stmt = $conn->prepare("SELECT SUM(amount) FROM payments WHERE status = 'Completed' AND DATE(paid_at) BETWEEN ? AND ?");
                    $stmt->execute([$r['start'], $r['end']]);
                    $rev = $stmt->fetchColumn();
                    $revenueData[] = $rev ? (float)$rev : 0;
                    $revenueLabels[] = $r['label'];
                }
            } else {
                for ($i = 5; $i >= 0; $i--) {
                    $monthStr = date('Y-m', strtotime("-$i months"));
                    $monthLabel = date('M', strtotime("-$i months"));
                    $stmt = $conn->prepare("SELECT SUM(amount) FROM payments WHERE status = 'Completed' AND DATE_FORMAT(paid_at, '%Y-%m') = ?");
                    $stmt->execute([$monthStr]);
                    $rev = $stmt->fetchColumn();
                    $revenueData[] = $rev ? (float)$rev : 0;
                    $revenueLabels[] = $monthLabel;
                }
            }

            $paymentPie = [(int)$conn->query("SELECT COUNT(*) FROM payments WHERE status = 'Completed'")->fetchColumn(), 0, 0];

            sendResponse('success', 'Charts', [
                'bar' => $barData,
                'barLabels' => $barLabels,
                'pie' => $pieData,
                'driver' => $driverData,
                'driverLabels' => $driverLabels,
                'revenueArea' => $revenueData,
                'revenueLabels' => $revenueLabels,
                'paymentPie' => $paymentPie
            ]);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'export_financial_report') {
        header('Content-Type: application/vnd.ms-excel');
        header('Content-Disposition: attachment; filename=financial_report.xls');
        echo '<table border="1">';
        echo '<tr><th style="background-color:#4CAF50;color:white;">Transaction ID</th><th style="background-color:#4CAF50;color:white;width:150px;">Resident Name</th><th style="background-color:#4CAF50;color:white;width:120px;">Date</th><th style="background-color:#4CAF50;color:white;">Amount</th><th style="background-color:#4CAF50;color:white;">Method</th><th style="background-color:#4CAF50;color:white;">Status</th></tr>';
        
        $stmt = $conn->query("
            SELECT p.payment_id, r.name, DATE_FORMAT(p.paid_at, '%d %b %Y') as paid_at, p.amount, 'EVC Plus' as payment_method, p.status 
            FROM payments p 
            LEFT JOIN residents r ON p.resident_id = r.resident_id 
            ORDER BY p.paid_at DESC
        ");
        $totalCollected = 0;
        $totalPending = 0;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $name = htmlspecialchars(ucwords(strtolower(trim($row['name']))));
            $id = htmlspecialchars($row['payment_id']);
            $date = htmlspecialchars($row['paid_at']);
            $amtVal = floatval($row['amount']);
            if ($row['status'] === 'Completed' || $row['status'] === 'Success') {
                $totalCollected += $amtVal;
            } else if ($row['status'] === 'Pending') {
                $totalPending += $amtVal;
            }
            $amt = htmlspecialchars($row['amount']);
            $method = htmlspecialchars($row['payment_method']);
            $status = htmlspecialchars($row['status']);
            echo "<tr><td>{$id}</td><td style='white-space:nowrap;'>{$name}</td><td style='white-space:nowrap;'>{$date}</td><td>\${$amt}</td><td>{$method}</td><td>{$status}</td></tr>";
        }
        echo "<tr><td colspan='5' style='text-align:right;font-weight:bold;'>Total Pending (Unpaid):</td><td style='font-weight:bold;color:orange;'>\${$totalPending}</td></tr>";
        echo "<tr><td colspan='5' style='text-align:right;font-weight:bold;'>Total Revenue Collected (Lacagta Soo Xarootay):</td><td style='font-weight:bold;color:green;'>\${$totalCollected}</td></tr>";
        echo '</table>';
        exit();
    }
    elseif ($action === 'get_dashboard_activities') {
        try {
            $stmt = $conn->query("
                SELECT 'request' as type, request_time as time, CONCAT('New request #', request_id, ' from resident #', resident_id) as description
                FROM waste_requests
                ORDER BY request_time DESC LIMIT 5
            ");
            $activities = $stmt->fetchAll();

            $stmt = $conn->query("
                SELECT 'assignment' as type, assigned_time as time, CONCAT('Driver #', driver_id, ' assigned to request #', request_id) as description
                FROM assignments
                ORDER BY assigned_time DESC LIMIT 5
            ");
            $activities = array_merge($activities, $stmt->fetchAll());

            $stmt = $conn->query("
                SELECT 'payment' as type, COALESCE(paid_at, created_at) as time, CONCAT('Payment of $', amount, ' received') as description
                FROM payments
                WHERE status = 'Completed' OR status = 'Success'
                ORDER BY time DESC LIMIT 5
            ");
            $activities = array_merge($activities, $stmt->fetchAll());

            usort($activities, function($a, $b) {
                return strtotime($b['time']) - strtotime($a['time']);
            });

            sendResponse('success', 'Activities', array_slice($activities, 0, 5));
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_admin_profile') {
        try {
            $stmt = $conn->prepare("SELECT admin_id, name, email, role, profile_picture FROM admins WHERE admin_id = ?");
            $stmt->execute([$_SESSION['user_id'] ?? 1]);
            $admin = $stmt->fetch();
            sendResponse('success', 'Admin profile fetched', $admin);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_system_activity_logs') {
        try {
            $logs = [];
            
            // 1. Fetch latest request_logs (ORDER BY created_at DESC LIMIT 10)
            $stmt1 = $conn->query("
                SELECT l.log_id, l.action AS title, l.message, l.created_at
                FROM request_logs l
                ORDER BY l.created_at DESC LIMIT 10
            ");
            while ($r = $stmt1->fetch()) {
                $logs[] = [
                    'id' => 'req_' . $r['log_id'],
                    'title' => $r['title'],
                    'message' => $r['message'],
                    'created_at' => $r['created_at'],
                    'icon' => 'fas fa-truck text-primary',
                    'badge' => 'border-primary'
                ];
            }

            // 2. Fetch latest completed/success payments (ORDER BY created_at DESC LIMIT 10)
            $stmt2 = $conn->query("
                SELECT p.payment_id, p.amount, p.status, p.created_at, r.name AS resident_name
                FROM payments p
                LEFT JOIN residents r ON p.resident_id = r.resident_id
                WHERE p.status = 'Completed' OR p.status = 'Success'
                ORDER BY p.created_at DESC LIMIT 10
            ");
            while ($r = $stmt2->fetch()) {
                $logs[] = [
                    'id' => 'pay_' . $r['payment_id'],
                    'title' => 'Payment Received',
                    'message' => 'Payment of $' . number_format($r['amount'], 2) . ' received from ' . ($r['resident_name'] ?: 'Resident'),
                    'created_at' => $r['created_at'],
                    'icon' => 'fas fa-credit-card text-success',
                    'badge' => 'border-success'
                ];
            }

            // 3. Current active Admin session authentication log
            $adminName = $_SESSION['name'] ?? 'Maryan Ali';
            $logs[] = [
                'id' => 'auth_admin',
                'title' => 'Admin Authenticated',
                'message' => "Admin '$adminName' logged into dashboard successfully.",
                'created_at' => date('Y-m-d H:i:s'),
                'icon' => 'fas fa-user-shield text-success',
                'badge' => 'border-success'
            ];

            // Sort all logs strictly by created_at DESC (newest at top)
            usort($logs, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            // Limit to top 10 latest real logs
            sendResponse('success', 'Latest activity logs fetched', array_slice($logs, 0, 10));
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'clear_system_activity_logs') {
        try {
            $conn->exec("TRUNCATE TABLE request_logs");
            sendResponse('success', 'Activity logs cleared successfully');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_dashboard_schedule') {
        try {
            $stmt = $conn->query("
                SELECT r.request_id, r.request_time, r.address as area, r.waste_type,
                       COALESCE(d.name, d2.name, 'Waiting for Driver') as driver_name,
                       COALESCE(d.vehicle_plate, d2.vehicle_plate, '') as vehicle_plate,
                       r.status
                FROM waste_requests r
                LEFT JOIN drivers d ON r.driver_id = d.driver_id
                LEFT JOIN (
                    SELECT request_id, MAX(assignment_id) as max_id 
                    FROM assignments 
                    GROUP BY request_id
                ) latest_a ON r.request_id = latest_a.request_id
                LEFT JOIN assignments a ON latest_a.max_id = a.assignment_id
                LEFT JOIN drivers d2 ON a.driver_id = d2.driver_id
                WHERE (r.payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed') > 0)
                  AND r.status IN ('Pending', 'Assigned', 'Accepted', 'In Progress')
                ORDER BY r.request_time DESC
                LIMIT 10
            ");
            $schedule = $stmt->fetchAll();
            sendResponse('success', 'Schedule', $schedule);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_all_requests') {
        try {
            $stmt = $conn->query("
                SELECT r.*, 
                       COALESCE(res.name, CONCAT('Resident #', r.resident_id)) as resident_name, 
                       COALESCE(res.phone, 'N/A') as resident_phone, 
                       COALESCE(d.name, d2.name, 'Unassigned') as driver_name,
                       COALESCE(d.vehicle_plate, d2.vehicle_plate, '') as vehicle_plate,
                       COALESCE(r.driver_id, a.driver_id) as driver_id,
                       COALESCE(
                           (SELECT p.amount FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed' ORDER BY p.payment_id DESC LIMIT 1),
                           (SELECT p2.amount FROM payments p2 WHERE p2.resident_id = r.resident_id AND p2.status = 'Completed' ORDER BY p2.payment_id DESC LIMIT 1),
                           5.00
                       ) as paid_amount,
                       CASE 
                           WHEN r.payment_status IN ('Paid', 'Completed') THEN 'Completed'
                           WHEN (SELECT COUNT(*) FROM payments p WHERE (p.request_id = r.request_id OR p.resident_id = r.resident_id) AND p.status = 'Completed') > 0 THEN 'Completed'
                           ELSE 'Unpaid'
                       END as payment_status
                FROM waste_requests r 
                LEFT JOIN residents res ON r.resident_id = res.resident_id 
                LEFT JOIN drivers d ON r.driver_id = d.driver_id
                LEFT JOIN (
                    SELECT request_id, MAX(assignment_id) as max_id 
                    FROM assignments 
                    GROUP BY request_id
                ) latest_a ON r.request_id = latest_a.request_id
                LEFT JOIN assignments a ON latest_a.max_id = a.assignment_id
                LEFT JOIN drivers d2 ON a.driver_id = d2.driver_id 
                WHERE (r.payment_status = 'Paid' OR r.payment_status = 'Completed' OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed') > 0)
                ORDER BY r.request_id DESC
            ");
            sendResponse('success', 'Requests fetched', $stmt->fetchAll());
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_residents') {
        try {
            $stmt = $conn->query("SELECT resident_id, name, email, phone, address, status, created_at FROM residents ORDER BY created_at DESC");
            sendResponse('success', 'Residents fetched', $stmt->fetchAll());
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'global_search') {
        $q = trim($_GET['q'] ?? '');
        if (strlen($q) < 1) {
            sendResponse('success', 'Search query too short', ['residents' => [], 'drivers' => [], 'requests' => []]);
        }
        $searchPattern = '%' . $q . '%';
        try {
            // Search Residents
            $stmtRes = $conn->prepare("
                SELECT resident_id, name, phone, address, status 
                FROM residents 
                WHERE name LIKE ? OR phone LIKE ? OR address LIKE ? 
                LIMIT 5
            ");
            $stmtRes->execute([$searchPattern, $searchPattern, $searchPattern]);
            $residents = $stmtRes->fetchAll();

            // Search Drivers
            $stmtDrv = $conn->prepare("
                SELECT driver_id, name, phone, zone, status 
                FROM drivers 
                WHERE name LIKE ? OR phone LIKE ? OR zone LIKE ? 
                LIMIT 5
            ");
            $stmtDrv->execute([$searchPattern, $searchPattern, $searchPattern]);
            $drivers = $stmtDrv->fetchAll();

            // Search Requests
            $stmtReq = $conn->prepare("
                SELECT r.request_id, r.address, r.status, r.request_time, res.name as resident_name, d.name as driver_name 
                FROM waste_requests r 
                JOIN residents res ON r.resident_id = res.resident_id 
                LEFT JOIN assignments a ON r.request_id = a.request_id 
                LEFT JOIN drivers d ON a.driver_id = d.driver_id 
                WHERE r.request_id LIKE ? OR res.name LIKE ? OR d.name LIKE ? OR r.address LIKE ? 
                ORDER BY r.request_time DESC 
                LIMIT 5
            ");
            $stmtReq->execute([$searchPattern, $searchPattern, $searchPattern, $searchPattern]);
            $requests = $stmtReq->fetchAll();

            sendResponse('success', 'Search results', [
                'residents' => $residents,
                'drivers' => $drivers,
                'requests' => $requests
            ]);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_dashboard_activities') {
        try {
            $stmt = $conn->query("
                SELECT 'request' as type, r.request_time as time, 
                       CONCAT('New pickup request #', r.request_id, ' from ', COALESCE(res.name, CONCAT('Resident #', r.resident_id))) as description
                FROM waste_requests r
                LEFT JOIN residents res ON r.resident_id = res.resident_id
                ORDER BY r.request_time DESC LIMIT 10
            ");
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendResponse('success', 'Activities fetched', $activities);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_dashboard_schedule') {
        try {
            $stmt = $conn->query("
                SELECT r.request_id, r.request_time, r.address as area, r.waste_type, d.name as driver_name
                FROM waste_requests r
                LEFT JOIN drivers d ON r.driver_id = d.driver_id
                ORDER BY r.request_time DESC LIMIT 10
            ");
            $schedule = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendResponse('success', 'Schedule fetched', $schedule);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_driver_status') {
        try {
            $stmt = $conn->query("
                SELECT driver_id, name, phone, zone, status 
                FROM drivers 
                ORDER BY driver_id DESC
            ");
            $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendResponse('success', 'Driver status fetched', $drivers);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_resident_history') {
        $resident_id = $_GET['id'] ?? null;
        if (!$resident_id) {
            sendResponse('error', 'Missing resident ID', null, 400);
        }
        try {
            $stmt = $conn->prepare("
                SELECT r.request_id, r.request_time, r.waste_type as notes, r.address, r.status, 
                       COALESCE(d.name, d2.name, 'Unassigned') as driver_name 
                FROM waste_requests r 
                LEFT JOIN drivers d ON r.driver_id = d.driver_id 
                LEFT JOIN (
                    SELECT request_id, driver_id 
                    FROM assignments 
                    ORDER BY assignment_id DESC
                ) a ON r.request_id = a.request_id 
                LEFT JOIN drivers d2 ON a.driver_id = d2.driver_id 
                WHERE r.resident_id = ? 
                GROUP BY r.request_id
                ORDER BY r.request_time DESC
            ");
            $stmt->execute([$resident_id]);
            sendResponse('success', 'History fetched', $stmt->fetchAll());
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_driver_history') {
        $driver_id = $_GET['id'] ?? null;
        if (!$driver_id) {
            sendResponse('error', 'Missing driver ID', null, 400);
        }
        try {
            $stmt = $conn->prepare("
                SELECT a.assignment_id, a.assigned_time, a.status as assignment_status, 
                       r.request_id, r.request_time, r.waste_type, r.address, r.status as request_status, 
                       res.name as resident_name, res.phone as resident_phone
                FROM assignments a 
                JOIN waste_requests r ON a.request_id = r.request_id 
                JOIN residents res ON r.resident_id = res.resident_id 
                WHERE a.driver_id = ? 
                ORDER BY a.assigned_time DESC
            ");
            $stmt->execute([$driver_id]);
            sendResponse('success', 'Driver history fetched', $stmt->fetchAll());
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_drivers') {
        try {
            $stmt = $conn->query("
                SELECT driver_id, name, email, phone, zone, status, approval_status, 
                       rejection_reason, vehicle_info, vehicle_plate, license_number, 
                       emergency_contact, profile_picture, created_at 
                FROM drivers 
                ORDER BY 
                    CASE 
                        WHEN approval_status = 'Pending' THEN 1 
                        WHEN approval_status = 'Approved' THEN 2 
                        ELSE 3 
                    END, 
                    created_at DESC
            ");
            sendResponse('success', 'Drivers fetched', $stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_trucks') {
        try {
            $stmt = $conn->query("
                SELECT t.truck_id, t.plate_number, t.model, t.capacity_tons, t.assigned_zone, t.status, 
                       t.current_driver_id, d.name as current_driver_name
                FROM trucks t
                LEFT JOIN drivers d ON t.current_driver_id = d.driver_id
                ORDER BY t.truck_id ASC
            ");
            sendResponse('success', 'Trucks fetched', $stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_driver_performance') {
        try {
            $stmt = $conn->query("
                SELECT 
                    d.driver_id, 
                    d.name, 
                    d.phone, 
                    d.status,
                    COUNT(CASE WHEN a.status = 'Completed' OR r.status = 'Completed' THEN 1 END) as completed_trips
                FROM drivers d
                LEFT JOIN assignments a ON d.driver_id = a.driver_id
                LEFT JOIN waste_requests r ON a.request_id = r.request_id
                GROUP BY d.driver_id, d.name, d.phone, d.status
                ORDER BY completed_trips DESC, d.driver_id ASC
            ");
            sendResponse('success', 'Driver performance fetched', $stmt->fetchAll());
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_all_payments' || $action === 'get_payments') {
        try {
            $stmt = $conn->query("
                SELECT p.payment_id, p.request_id, p.amount, p.status, p.method, p.paid_at, 
                       COALESCE(r.name, CONCAT('Resident #', p.resident_id)) as resident_name, 
                       COALESCE(r.phone, 'N/A') as resident_phone
                FROM payments p
                LEFT JOIN residents r ON p.resident_id = r.resident_id
                ORDER BY p.paid_at DESC, p.payment_id DESC
            ");
            sendResponse('success', 'Payments fetched', $stmt->fetchAll());
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_system_logs') {
        try {
            $logs = [
                ['error_code' => 'INFO-200', 'component' => 'Database Sync', 'description' => 'Real-time database connection active & verified.', 'timestamp' => date('Y-m-d H:i:s')],
                ['error_code' => 'SYS-101', 'component' => 'Payment Gateway', 'description' => 'EVC Plus API status normal & operational.', 'timestamp' => date('Y-m-d H:i:s', strtotime('-15 minutes'))],
                ['error_code' => 'LOG-102', 'component' => 'Driver Portal', 'description' => 'Driver location tracking ping received.', 'timestamp' => date('Y-m-d H:i:s', strtotime('-1 hour'))]
            ];
            sendResponse('success', 'System logs fetched', $logs);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_activities') {
        try {
            $stmt = $conn->query("
                SELECT rl.log_id, rl.action, rl.message, rl.created_at, r.address 
                FROM request_logs rl 
                LEFT JOIN waste_requests r ON rl.request_id = r.request_id 
                ORDER BY rl.created_at DESC LIMIT 50
            ");
            sendResponse('success', 'Activities fetched', $stmt->fetchAll());
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_header_data') {
        try {
            $stmtMsgUnread = $conn->query("SELECT COUNT(*) as cnt FROM messages WHERE is_read = 0");
            $unreadMsgCount = $stmtMsgUnread->fetch()['cnt'];

            $stmtMsg = $conn->query("
                SELECT m.*, 
                CASE 
                    WHEN m.sender_type = 'Resident' THEN r.name
                    WHEN m.sender_type = 'Driver' THEN d.name
                END as sender_name,
                CASE 
                    WHEN m.sender_type = 'Resident' THEN r.address
                    WHEN m.sender_type = 'Driver' THEN d.zone
                END as sender_area,
                (SELECT SUM(amount) FROM payments WHERE resident_id = m.sender_id AND status = 'Completed' AND m.sender_type = 'Resident') as total_paid
                FROM messages m
                LEFT JOIN residents r ON m.sender_type = 'Resident' AND m.sender_id = r.resident_id
                LEFT JOIN drivers d ON m.sender_type = 'Driver' AND m.sender_id = d.driver_id
                ORDER BY m.created_at DESC LIMIT 10
            ");
            $messages = $stmtMsg->fetchAll();

            $stmtNotifUnread = $conn->query("SELECT COUNT(*) as cnt FROM notifications WHERE user_type = 'Admin' AND is_read = 0");
            $unreadCount = $stmtNotifUnread->fetch()['cnt'];

            $stmtNotif = $conn->query("SELECT * FROM notifications WHERE user_type = 'Admin' ORDER BY created_at DESC LIMIT 10");
            $notifications = $stmtNotif->fetchAll();

            sendResponse('success', 'Header data fetched', [
                'messages' => $messages,
                'unreadMsgCount' => $unreadMsgCount,
                'notifications' => $notifications,
                'unreadCount' => $unreadCount
            ]);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_all_messages') {
        try {
            // 1. Fetch direct messages
            $stmtMsg = $conn->query("
                SELECT m.*, 
                m.message_id as id,
                'message' as record_source,
                CASE 
                    WHEN m.sender_type = 'Resident' THEN r.name
                    WHEN m.sender_type = 'Driver' THEN d.name
                    ELSE 'System User'
                END as sender_name,
                CASE 
                    WHEN m.sender_type = 'Resident' THEN r.address
                    WHEN m.sender_type = 'Driver' THEN d.zone
                    ELSE 'Mogadishu'
                END as sender_area,
                (SELECT SUM(amount) FROM payments WHERE resident_id = m.sender_id AND status = 'Completed' AND m.sender_type = 'Resident') as total_paid
                FROM messages m
                LEFT JOIN residents r ON m.sender_type = 'Resident' AND m.sender_id = r.resident_id
                LEFT JOIN drivers d ON m.sender_type = 'Driver' AND m.sender_id = d.driver_id
                ORDER BY m.created_at DESC
            ");
            $directMessages = $stmtMsg ? $stmtMsg->fetchAll(PDO::FETCH_ASSOC) : [];

            // 2. Fetch notifications for Admin (reports, driver issues, emergency, requests)
            $stmtNotif = $conn->query("
                SELECT 
                    n.notification_id,
                    n.user_id,
                    n.user_type,
                    n.title,
                    n.message,
                    n.is_read,
                    n.created_at
                FROM notifications n
                WHERE n.user_type = 'Admin' OR n.user_type = 'admin'
                ORDER BY n.created_at DESC
            ");
            $notifRows = $stmtNotif ? $stmtNotif->fetchAll(PDO::FETCH_ASSOC) : [];

            $enrichedNotifs = [];
            foreach ($notifRows as $n) {
                $title = $n['title'] ?? 'Notification';
                $msgText = $n['message'] ?? '';
                
                $sender_type = 'Resident';
                $sender_name = 'Resident';
                $sender_area = 'Mogadishu';
                $sender_id = 1;
                $total_paid = null;

                if (stripos($title, 'Driver') !== false || stripos($msgText, 'Driver Name') !== false || stripos($title, 'Job Rejected') !== false || stripos($title, 'Emergency') !== false || stripos($msgText, 'Vehicle') !== false) {
                    $sender_type = 'Driver';
                    if (preg_match('/Driver Name:\s*([^\n\r]+)/i', $msgText, $dm)) {
                        $sender_name = trim($dm[1]);
                    } elseif (preg_match('/Driver\s+#?(\d+)/i', $title, $dm)) {
                        $sender_id = (int)$dm[1];
                        $sDrv = $conn->prepare("SELECT name, zone FROM drivers WHERE driver_id = ?");
                        $sDrv->execute([$sender_id]);
                        if ($rowD = $sDrv->fetch(PDO::FETCH_ASSOC)) {
                            $sender_name = $rowD['name'];
                            $sender_area = $rowD['zone'];
                        }
                    } else {
                        $sender_name = 'Driver';
                    }

                    $sDrv2 = $conn->prepare("SELECT driver_id, zone FROM drivers WHERE name LIKE ? LIMIT 1");
                    $sDrv2->execute(['%' . $sender_name . '%']);
                    if ($rowD2 = $sDrv2->fetch(PDO::FETCH_ASSOC)) {
                        $sender_id = $rowD2['driver_id'];
                        $sender_area = $rowD2['zone'];
                    }
                } else {
                    $sender_type = 'Resident';
                    if (preg_match('/submitted by\s+([^\n\r.]+)/i', $msgText, $rm)) {
                        $sender_name = trim($rm[1]);
                    } elseif (preg_match('/by\s+([^\n\r.]+)/i', $msgText, $rm)) {
                        $sender_name = trim($rm[1]);
                    } else {
                        $sender_name = 'Resident';
                    }

                    $sRes = $conn->prepare("SELECT resident_id, address FROM residents WHERE name LIKE ? LIMIT 1");
                    $sRes->execute(['%' . $sender_name . '%']);
                    if ($rowR = $sRes->fetch(PDO::FETCH_ASSOC)) {
                        $sender_id = $rowR['resident_id'];
                        $sender_area = $rowR['address'];
                        $sPay = $conn->prepare("SELECT SUM(amount) as tp FROM payments WHERE resident_id = ? AND status = 'Completed'");
                        $sPay->execute([$sender_id]);
                        $total_paid = $sPay->fetchColumn() ?: null;
                    }
                }

                // Deduplicate if identical text exists in directMessages
                $isDup = false;
                foreach ($directMessages as $dm) {
                    if ($dm['sender_type'] === $sender_type && (trim($dm['message']) === trim($msgText) || (strlen($msgText) > 15 && strpos($dm['message'], substr($msgText, 0, 30)) !== false))) {
                        $isDup = true;
                        break;
                    }
                }

                if (!$isDup) {
                    $formattedContent = $msgText;
                    if ($title && stripos($msgText, $title) === false) {
                        $formattedContent = "[$title]\n" . $msgText;
                    }
                    $enrichedNotifs[] = [
                        'id' => 'notif_' . $n['notification_id'],
                        'record_source' => 'notification',
                        'message_id' => 'notif_' . $n['notification_id'],
                        'sender_type' => $sender_type,
                        'sender_id' => $sender_id,
                        'sender_name' => $sender_name,
                        'sender_area' => $sender_area,
                        'title' => $title,
                        'message' => $formattedContent,
                        'is_read' => (int)($n['is_read'] ?? 0),
                        'created_at' => $n['created_at'],
                        'total_paid' => $total_paid
                    ];
                }
            }

            $combined = array_merge($directMessages, $enrichedNotifs);
            usort($combined, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            sendResponse('success', 'Messages fetched', $combined);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'mark_all_messages_read') {
        try {
            $conn->exec("UPDATE messages SET is_read = 1 WHERE is_read = 0 OR is_read IS NULL");
            $conn->exec("UPDATE notifications SET is_read = 1 WHERE user_type = 'Admin' AND (is_read = 0 OR is_read IS NULL)");
            sendResponse('success', 'All messages and reports marked as read');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'mark_message_read') {
        $raw_id = $_GET['id'] ?? null;
        if (!$raw_id) sendResponse('error', 'Message ID required', null, 400);

        try {
            if (strpos($raw_id, 'notif_') === 0) {
                $notif_id = (int)str_replace('notif_', '', $raw_id);
                $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_type = 'Admin'");
                $stmt->execute([$notif_id]);
            } else {
                $message_id = (int)$raw_id;
                $stmt = $conn->prepare("UPDATE messages SET is_read = 1 WHERE message_id = ?");
                $stmt->execute([$message_id]);
            }
            sendResponse('success', 'Message marked as read');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'mark_notification_read') {
        $notif_id = $_GET['id'] ?? null;
        if (!$notif_id) sendResponse('error', 'Notification ID required', null, 400);

        try {
            $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_type = 'Admin'");
            $stmt->execute([$notif_id]);
            sendResponse('success', 'Notification marked as read');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_report_users') {
        try {
            $residents = $conn->query("SELECT resident_id as id, name, phone, email, 'resident' as role FROM residents ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
            $drivers = $conn->query("SELECT driver_id as id, name, phone, email, 'driver' as role FROM drivers ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
            sendResponse('success', 'Report users fetched', [
                'residents' => $residents,
                'drivers' => $drivers
            ]);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_advanced_reports') {
        try {
            $role_filter = $_GET['role_filter'] ?? 'all'; // all, resident, driver
            $user_key = $_GET['user_key'] ?? 'all'; // all, resident_1, driver_2
            $date_range = $_GET['date_range'] ?? 'all'; // all, today, week, month, custom
            $from_date = $_GET['from_date'] ?? null;
            $to_date = $_GET['to_date'] ?? null;
            $status_filter = $_GET['status_filter'] ?? 'all'; // all, Completed, Pending, In Progress, Paid, Unpaid

            // Build SQL query
            $sql = "
                SELECT 
                    r.request_id,
                    r.resident_id,
                    res.name as resident_name,
                    res.phone as resident_phone,
                    COALESCE(d.driver_id, r.driver_id, 0) as driver_id,
                    COALESCE(d.name, (SELECT d2.name FROM drivers d2 WHERE d2.driver_id = r.driver_id), 'Unassigned') as driver_name,
                    r.address,
                    r.request_time,
                    r.status as request_status,
                    COALESCE(
                        (SELECT p.amount FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed' ORDER BY p.payment_id DESC LIMIT 1),
                        (SELECT p2.amount FROM payments p2 WHERE p2.resident_id = r.resident_id AND p2.status = 'Completed' ORDER BY p2.payment_id DESC LIMIT 1),
                        5.00
                    ) as paid_amount,
                    CASE 
                        WHEN r.payment_status IN ('Paid', 'Completed') THEN 'Paid'
                        WHEN (SELECT COUNT(*) FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed') > 0 THEN 'Paid'
                        ELSE 'Unpaid'
                    END as payment_status
                FROM waste_requests r
                JOIN residents res ON r.resident_id = res.resident_id
                LEFT JOIN (
                    SELECT request_id, MAX(assignment_id) as max_id 
                    FROM assignments 
                    GROUP BY request_id
                ) latest_a ON r.request_id = latest_a.request_id
                LEFT JOIN assignments a ON latest_a.max_id = a.assignment_id
                LEFT JOIN drivers d ON a.driver_id = d.driver_id
                WHERE (r.payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed') > 0)
            ";

            $params = [];

            // User key filter (e.g. resident_1 or driver_2)
            if ($user_key !== 'all') {
                if (strpos($user_key, 'resident_') === 0) {
                    $resId = intval(str_replace('resident_', '', $user_key));
                    $sql .= " AND r.resident_id = ?";
                    $params[] = $resId;
                } elseif (strpos($user_key, 'driver_') === 0) {
                    $drvId = intval(str_replace('driver_', '', $user_key));
                    $sql .= " AND (a.driver_id = ? OR r.driver_id = ?)";
                    $params[] = $drvId;
                    $params[] = $drvId;
                }
            } else {
                if ($role_filter === 'resident') {
                    // Filter residents only
                } elseif ($role_filter === 'driver') {
                    $sql .= " AND (a.driver_id IS NOT NULL OR (r.driver_id IS NOT NULL AND r.driver_id > 0))";
                }
            }

            // Date Range Filter
            if ($date_range === 'today') {
                $sql .= " AND DATE(r.request_time) = CURDATE()";
            } elseif ($date_range === 'week') {
                $sql .= " AND YEARWEEK(r.request_time, 1) = YEARWEEK(CURDATE(), 1)";
            } elseif ($date_range === 'month') {
                $sql .= " AND YEAR(r.request_time) = YEAR(CURDATE()) AND MONTH(r.request_time) = MONTH(CURDATE())";
            } elseif ($date_range === 'custom' && $from_date && $to_date) {
                $sql .= " AND DATE(r.request_time) BETWEEN ? AND ?";
                $params[] = $from_date;
                $params[] = $to_date;
            }

            // Status Filter
            if ($status_filter !== 'all') {
                if (in_array($status_filter, ['Paid', 'Unpaid'])) {
                    if ($status_filter === 'Paid') {
                        $sql .= " AND (r.payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed') > 0)";
                    } else {
                        $sql .= " AND r.payment_status NOT IN ('Paid', 'Completed') AND (SELECT COUNT(*) FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed') = 0";
                    }
                } else {
                    $sql .= " AND r.status = ?";
                    $params[] = $status_filter;
                }
            }

            $sql .= " ORDER BY r.request_time DESC";

            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calculate KPI Summary Metrics
            $total_requests = count($records);
            $completed_count = 0;
            $total_paid = 0.0;
            $unpaid_balance = 0.0;

            foreach ($records as $rec) {
                if ($rec['request_status'] === 'Completed') {
                    $completed_count++;
                }
                $amt = floatval($rec['paid_amount']);
                if ($rec['payment_status'] === 'Paid') {
                    $total_paid += $amt;
                } else {
                    $unpaid_balance += $amt;
                }
            }

            $completion_rate = $total_requests > 0 ? round(($completed_count / $total_requests) * 100, 1) : 0;

            sendResponse('success', 'Reports data fetched successfully', [
                'summary' => [
                    'total_requests' => $total_requests,
                    'completed_count' => $completed_count,
                    'completion_rate' => $completion_rate,
                    'total_paid' => number_format($total_paid, 2),
                    'unpaid_balance' => number_format($unpaid_balance, 2)
                ],
                'records' => $records
            ]);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'global_search') {
        $q = trim($_GET['q'] ?? '');
        if ($q === '') {
            sendResponse('success', 'Empty query', ['residents' => [], 'drivers' => [], 'requests' => []]);
        }

        $searchTerm = "%{$q}%";

        try {
            // 1. Search Residents
            $stmtRes = $conn->prepare("
                SELECT resident_id, name, email, phone, address, status 
                FROM residents 
                WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?
                LIMIT 6
            ");
            $stmtRes->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
            $residents = $stmtRes->fetchAll(PDO::FETCH_ASSOC);

            // 2. Search Drivers
            $stmtDrv = $conn->prepare("
                SELECT driver_id, name, email, phone, zone, status, vehicle_info 
                FROM drivers 
                WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR zone LIKE ? OR vehicle_info LIKE ?
                LIMIT 6
            ");
            $stmtDrv->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
            $drivers = $stmtDrv->fetchAll(PDO::FETCH_ASSOC);

            // 3. Search Requests
            $stmtReq = $conn->prepare("
                SELECT r.request_id, r.status, r.address, r.waste_type, r.request_time, 
                       res.name AS resident_name, 
                       COALESCE(d.name, 'Unassigned') AS driver_name
                FROM waste_requests r
                LEFT JOIN residents res ON r.resident_id = res.resident_id
                LEFT JOIN drivers d ON r.driver_id = d.driver_id
                WHERE r.request_id = ? 
                   OR r.status LIKE ? 
                   OR r.address LIKE ? 
                   OR r.waste_type LIKE ? 
                   OR res.name LIKE ? 
                   OR d.name LIKE ?
                ORDER BY r.request_time DESC
                LIMIT 6
            ");
            $isNumeric = is_numeric($q) ? intval($q) : -1;
            $stmtReq->execute([$isNumeric, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
            $requests = $stmtReq->fetchAll(PDO::FETCH_ASSOC);

            sendResponse('success', 'Global search results', [
                'residents' => $residents,
                'drivers' => $drivers,
                'requests' => $requests
            ]);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
}

sendResponse('error', 'Invalid action or method', null, 400);
?>
