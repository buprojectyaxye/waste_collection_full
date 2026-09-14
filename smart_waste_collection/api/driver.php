<?php
// api/driver.php
require_once 'config.php';
requireAuth('driver');

$driver_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

// Verify driver is Approved
try {
    $stmtCheckApproval = $conn->prepare("SELECT approval_status, rejection_reason FROM drivers WHERE driver_id = ?");
    $stmtCheckApproval->execute([$driver_id]);
    $drvRow = $stmtCheckApproval->fetch(PDO::FETCH_ASSOC);

    if (!$drvRow || ($drvRow['approval_status'] ?? 'Approved') !== 'Approved') {
        $status = $drvRow['approval_status'] ?? 'Pending';
        if ($status === 'Pending') {
            sendResponse('error', '⏳ Your driver account is pending admin approval. Please wait for the admin team to review and approve your application.', ['approval_status' => 'Pending'], 403);
        } else {
            $reason = !empty($drvRow['rejection_reason']) ? (" Reason: " . $drvRow['rejection_reason']) : '';
            sendResponse('error', '❌ Your driver application has been rejected by the administrator.' . $reason, ['approval_status' => 'Rejected'], 403);
        }
    }
} catch (Exception $exAp) {}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if ($action === 'update_status') {
        $status = $data['status'] ?? ''; // Online, Offline, On Duty
        
        if (!in_array($status, ['Offline', 'Online', 'On Duty', 'On Break', 'Off Duty'])) {
            sendResponse('error', 'Invalid status', null, 400);
        }

        try {
            $stmt = $conn->prepare("UPDATE drivers SET status = ? WHERE driver_id = ?");
            $stmt->execute([$status, $driver_id]);
            sendResponse('success', 'Status updated successfully');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'update_job_status') {
        $assignment_id = $data['assignment_id'] ?? null;
        $job_status = $data['status'] ?? ''; // Accepted, In Progress, Completed, Failed
        $request_id = $data['request_id'] ?? null;

        if (!$request_id && $assignment_id) {
            $stmtFindReq = $conn->prepare("SELECT request_id FROM assignments WHERE assignment_id = ?");
            $stmtFindReq->execute([$assignment_id]);
            $request_id = $stmtFindReq->fetchColumn();
        }

        if (!$job_status || !$request_id) {
            sendResponse('error', 'Job Status and Request ID are required', null, 400);
        }

        if (in_array($job_status, ['Cancelled', 'Rejected', 'Failed'])) {
            sendResponse('error', 'Drivers are not permitted to cancel pickup requests. Drivers can only accept and complete assigned requests.', null, 403);
        }

        try {
            $conn->beginTransaction();

            // Fetch current request details
            $checkClaim = $conn->prepare("SELECT request_id, resident_id, driver_id, status, area FROM waste_requests WHERE request_id = ? FOR UPDATE");
            $checkClaim->execute([$request_id]);
            $currentReq = $checkClaim->fetch(PDO::FETCH_ASSOC);

            if (!$currentReq) {
                $conn->rollBack();
                sendResponse('error', 'Request not found', null, 404);
            }

            // Strict Atomic Check: If request is already assigned to a driver, ONLY that assigned driver can accept/start/complete it
            if (!empty($currentReq['driver_id']) && (int)$currentReq['driver_id'] !== (int)$driver_id) {
                $conn->rollBack();
                $otherDrvStmt = $conn->prepare("SELECT name, vehicle_plate FROM drivers WHERE driver_id = ?");
                $otherDrvStmt->execute([$currentReq['driver_id']]);
                $otherDrv = $otherDrvStmt->fetch(PDO::FETCH_ASSOC);
                $otherName = $otherDrv ? $otherDrv['name'] : 'another driver';

                sendResponse('already_accepted', "This pickup request is assigned to driver $otherName. You cannot modify requests assigned to another driver.", [
                    'accepted_by_other' => true,
                    'accepted_by_name' => $otherName,
                    'request_id' => $request_id
                ], 409);
            }

            $target_driver_id = !empty($currentReq['driver_id']) ? (int)$currentReq['driver_id'] : (int)$driver_id;

            if (!$assignment_id) {
                $stmtFindAss = $conn->prepare("SELECT assignment_id FROM assignments WHERE request_id = ? AND (driver_id = ? OR driver_id = ?) ORDER BY assignment_id DESC LIMIT 1");
                $stmtFindAss->execute([$request_id, $driver_id, $target_driver_id]);
                $assignment_id = $stmtFindAss->fetchColumn();
                if (!$assignment_id) {
                    $stmtNewAss = $conn->prepare("INSERT INTO assignments (request_id, driver_id, status, assigned_time) VALUES (?, ?, 'Assigned', NOW())");
                    $stmtNewAss->execute([$request_id, $target_driver_id]);
                    $assignment_id = $conn->lastInsertId();
                }
            }

            $completed_time = null;
            if ($job_status === 'Completed') {
                $completed_time = date('Y-m-d H:i:s');
            }

            // Update assignment
            if ($completed_time) {
                $stmt = $conn->prepare("UPDATE assignments SET status = ?, completed_time = ? WHERE (assignment_id = ? OR request_id = ?) AND (driver_id = ? OR driver_id = ? OR driver_id IS NULL)");
                $stmt->execute([$job_status, $completed_time, $assignment_id, $request_id, $driver_id, $target_driver_id]);
            } else {
                $stmt = $conn->prepare("UPDATE assignments SET status = ? WHERE (assignment_id = ? OR request_id = ?) AND (driver_id = ? OR driver_id = ? OR driver_id IS NULL)");
                $stmt->execute([$job_status, $assignment_id, $request_id, $driver_id, $target_driver_id]);
            }

            $request_status_map = [
                'Accepted' => 'Accepted',
                'In Progress' => 'In Progress',
                'Completed' => 'Completed',
                'Failed' => 'Pending',
                'Cancelled' => 'Cancelled',
                'Rejected' => 'Cancelled'
            ];
            
            $req_status = $request_status_map[$job_status] ?? $job_status;
            
            if ($job_status === 'Cancelled' || $job_status === 'Rejected') {
                $stmtReq = $conn->prepare("UPDATE waste_requests SET status = 'Cancelled', driver_id = NULL WHERE request_id = ?");
                $stmtReq->execute([$request_id]);
            } else {
                $stmtReq = $conn->prepare("UPDATE waste_requests SET status = ?, driver_id = ? WHERE request_id = ?");
                $stmtReq->execute([$req_status, $target_driver_id, $request_id]);
            }

            // Add system log and notification to Admin & Resident
            $driverName = $_SESSION['name'] ?? 'Driver';
            $stmtDrvInfo = $conn->prepare("SELECT name, vehicle_plate FROM drivers WHERE driver_id = ?");
            $stmtDrvInfo->execute([$target_driver_id]);
            $drvRow = $stmtDrvInfo->fetch(PDO::FETCH_ASSOC);
            if ($drvRow && !empty($drvRow['name'])) $driverName = $drvRow['name'];
            $plateStr = !empty($drvRow['vehicle_plate']) ? " (" . $drvRow['vehicle_plate'] . ")" : "";

            if ($job_status === 'In Progress') {
                $logMsg = "Driver {$driverName}{$plateStr} started trip to pickup location (In Progress).";
            } elseif ($job_status === 'Accepted') {
                $logMsg = "Driver {$driverName}{$plateStr} accepted pickup request.";
            } elseif ($job_status === 'Completed') {
                $logMsg = "Waste collection completed by driver {$driverName}{$plateStr}.";
            } elseif ($job_status === 'Cancelled' || $job_status === 'Rejected') {
                $logMsg = "Driver {$driverName}{$plateStr} cancelled/rejected assigned pickup request.";
            } else {
                $logMsg = "Driver {$driverName}{$plateStr} updated status to: $job_status";
            }

            $logAction = ($job_status === 'Cancelled' || $job_status === 'Rejected') ? 'Cancelled' : 'Status Update';
            $stmtLog = $conn->prepare("INSERT INTO request_logs (request_id, action, message) VALUES (?, ?, ?)");
            $stmtLog->execute([$request_id, $logAction, $logMsg]);

            if ($job_status === 'Accepted') {
                try {
                    $notifAdmin = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Admin', 1, 'Job Accepted by Driver', ?)");
                    $notifAdmin->execute(["Driver {$driverName}{$plateStr} has officially accepted Pickup Request #$request_id."]);
                } catch (Exception $exN) {}
            } elseif ($job_status === 'In Progress') {
                try {
                    $resId = $currentReq['resident_id'] ?? null;
                    if ($resId) {
                        $notifRes = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Resident', ?, 'Driver En Route', ?)");
                        $notifRes->execute([$resId, "Driver {$driverName} has started the trip and is en route to collect your waste (In Progress)."]);
                    }
                    $notifAdmin = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Admin', 1, 'Driver En Route', ?)");
                    $notifAdmin->execute(["Driver {$driverName}{$plateStr} started trip for Request #$request_id (In Progress)."]);
                } catch (Exception $exN) {}
            } elseif ($job_status === 'Cancelled' || $job_status === 'Rejected') {
                try {
                    $resId = $currentReq['resident_id'] ?? null;
                    if ($resId) {
                        $notifRes = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Resident', ?, 'Pickup Request Cancelled', ?)");
                        $notifRes->execute([$resId, "Driver {$driverName} has cancelled assigned Pickup Request #$request_id."]);
                    }
                    $notifAdmin = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Admin', 1, 'Job Cancelled by Driver', ?)");
                    $notifAdmin->execute(["Driver {$driverName}{$plateStr} cancelled assigned Pickup Request #$request_id."]);
                } catch (Exception $exN) {}
            }

            $conn->commit();
            sendResponse('success', 'Job status updated successfully', [
                'request_id' => $request_id,
                'status' => $job_status,
                'driver_name' => $driverName
            ]);
        } catch (PDOException $e) {
            $conn->rollBack();
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'update_location') {
        $lat = $data['lat'] ?? null;
        $lng = $data['lng'] ?? null;

        if ($lat && $lng) {
            try {
                $stmt = $conn->prepare("UPDATE drivers SET current_lat = ?, current_lng = ? WHERE driver_id = ?");
                $stmt->execute([$lat, $lng, $driver_id]);
                sendResponse('success', 'Location updated');
            } catch (PDOException $e) {
                sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
            }
        }
        sendResponse('error', 'Lat and Lng required', null, 400);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'get_jobs') {
        try {
            $drvZoneStmt = $conn->prepare("SELECT zone FROM drivers WHERE driver_id = ?");
            $drvZoneStmt->execute([$driver_id]);
            $driverZone = trim($drvZoneStmt->fetchColumn() ?: '');

            $stmt = $conn->prepare("
                SELECT 
                    COALESCE(a.assignment_id, r.request_id) as assignment_id,
                    r.request_id,
                    r.resident_id,
                    r.driver_id,
                    r.address,
                    r.waste_type,
                    r.priority,
                    r.area,
                    r.request_time,
                    r.status,
                    COALESCE(res.name, CONCAT('Resident #', r.resident_id)) as resident_name,
                    COALESCE(res.phone, 'N/A') as resident_phone
                FROM waste_requests r
                LEFT JOIN residents res ON r.resident_id = res.resident_id
                LEFT JOIN assignments a ON r.request_id = a.request_id AND a.driver_id = r.driver_id
                WHERE (
                    r.driver_id = ? OR (r.driver_id IS NULL AND r.status = 'Pending' AND (? != '' AND (r.area LIKE ? OR r.address LIKE ?)))
                )
                  AND r.status IN ('Assigned', 'Pending', 'Accepted', 'In Progress')
                  AND (r.payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed') > 0)
                ORDER BY r.request_time DESC
            ");
            $stmt->execute([$driver_id, $driverZone, "%$driverZone%", "%$driverZone%"]);
            sendResponse('success', 'Current jobs fetched', $stmt->fetchAll());
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_history') {
        try {
            $fromDate = $_GET['from_date'] ?? $data['from_date'] ?? null;
            $toDate = $_GET['to_date'] ?? $data['to_date'] ?? null;

            // Fetch driver rate per pickup ($0.50 - $5.00)
            $drvRateStmt = $conn->prepare("SELECT COALESCE(earning_per_pickup, 1.50) FROM drivers WHERE driver_id = ?");
            $drvRateStmt->execute([$driver_id]);
            $earningRate = floatval($drvRateStmt->fetchColumn() ?: 1.50);

            // Real Summary Stats Query for Driver
            $statsStmt = $conn->prepare("
                SELECT 
                    COUNT(DISTINCT r.request_id) as completed_jobs,
                    COUNT(DISTINCT CASE WHEN DATE(COALESCE(a.completed_time, r.request_time)) = CURDATE() THEN r.request_id END) as todays_jobs,
                    COALESCE(COUNT(DISTINCT r.request_id) * 25, 0) as total_waste
                FROM waste_requests r
                LEFT JOIN assignments a ON r.request_id = a.request_id AND a.driver_id = r.driver_id
                WHERE r.driver_id = ?
                  AND r.status = 'Completed'
                  AND (r.payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed') > 0)
            ");
            $statsStmt->execute([$driver_id]);
            $stats = $statsStmt->fetch(PDO::FETCH_ASSOC) ?: [];

            $completedCount = (int)($stats['completed_jobs'] ?? 0);
            $stats['earning_per_pickup'] = number_format($earningRate, 2);
            $stats['total_earnings'] = number_format($completedCount * $earningRate, 2);

            // Real History Records Query for Driver
            $sql = "
                SELECT 
                    COALESCE(a.assignment_id, r.request_id) as assignment_id,
                    r.request_id,
                    r.driver_id,
                    COALESCE(a.assigned_time, r.request_time) as assigned_time,
                    COALESCE(a.assigned_time, r.request_time) as started_time,
                    COALESCE(a.completed_time, r.request_time) as completed_time,
                    r.status,
                    r.waste_type,
                    COALESCE(a.weight_kg, 25.0) as weight_kg,
                    5 as rating,
                    'Paid' as payment_status,
                    r.address,
                    r.request_time,
                    COALESCE(res.name, CONCAT('Resident #', r.resident_id)) as customer_name,
                    COALESCE(res.phone, 'N/A') as customer_phone
                FROM waste_requests r
                LEFT JOIN residents res ON r.resident_id = res.resident_id
                LEFT JOIN assignments a ON r.request_id = a.request_id AND a.driver_id = r.driver_id
                WHERE r.driver_id = ?
                  AND r.status = 'Completed'
                  AND (r.payment_status IN ('Paid', 'Completed') OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed') > 0)
            ";

            $params = [$driver_id];

            if (!empty($fromDate)) {
                $sql .= " AND DATE(COALESCE(a.completed_time, a.assigned_time, r.request_time)) >= ?";
                $params[] = $fromDate;
            }
            if (!empty($toDate)) {
                $sql .= " AND DATE(COALESCE(a.completed_time, a.assigned_time, r.request_time)) <= ?";
                $params[] = $toDate;
            }

            $sql .= " GROUP BY r.request_id ORDER BY COALESCE(a.completed_time, a.assigned_time, r.request_time) DESC, r.request_id DESC";

            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendResponse('success', 'History fetched', [
                'stats' => $stats,
                'history' => $history
            ]);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_profile') {
        try {
            $stmt = $conn->prepare("SELECT name, email, phone, vehicle_plate, zone, COALESCE(earning_per_pickup, 1.50) as earning_per_pickup, profile_picture, status FROM drivers WHERE driver_id = ?");
            $stmt->execute([$driver_id]);
            sendResponse('success', 'Profile fetched', $stmt->fetch());
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_notifications') {
        try {
            $stmt = $conn->prepare("
                SELECT notification_id, title, message, is_read, created_at 
                FROM notifications 
                WHERE user_type IN ('Driver', 'driver') 
                  AND user_id = ? 
                  AND title NOT LIKE '%Job Assigned%'
                  AND title NOT LIKE '%New Job%'
                ORDER BY created_at DESC 
                LIMIT 50
            ");
            $stmt->execute([$driver_id]);
            sendResponse('success', 'Notifications fetched', $stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'mark_notification_read') {
        $notif_id = $_GET['id'] ?? null;
        try {
            if ($notif_id) {
                $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_type IN ('Driver', 'driver') AND user_id = ?");
                $stmt->execute([$notif_id, $driver_id]);
            } else {
                $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE user_type IN ('Driver', 'driver') AND user_id = ?");
                $stmt->execute([$driver_id]);
            }
            sendResponse('success', 'Marked as read');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_driver_reports') {
        try {
            $stmt = $conn->prepare("
                SELECT message_id, sender_type, sender_id, message, is_read, created_at 
                FROM messages 
                WHERE (sender_type IN ('Driver', 'driver') AND sender_id = ?)
                   OR (message LIKE ?)
                ORDER BY created_at DESC 
                LIMIT 50
            ");
            $stmt->execute([$driver_id, "%Driver #$driver_id%"]);
            sendResponse('success', 'Reports fetched', $stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
}

// Handle multipart/form-data for profile updates
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_profile') {
    $name = trim($_POST['name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    
    if (!$name || !$phone) {
        sendResponse('error', 'Name and Phone are required', null, 400);
    }
    
    try {
        $profile_picture = null;
        if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = '../uploads/profiles/';
            if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
            
            $file_ext = pathinfo($_FILES['profile_picture']['name'], PATHINFO_EXTENSION);
            $file_name = 'driver_' . $driver_id . '_' . time() . '.' . $file_ext;
            $upload_path = $upload_dir . $file_name;
            
            if (move_uploaded_file($_FILES['profile_picture']['tmp_name'], $upload_path)) {
                $profile_picture = 'uploads/profiles/' . $file_name;
            }
        }

        if ($profile_picture) {
            $stmt = $conn->prepare("UPDATE drivers SET name = ?, phone = ?, profile_picture = ? WHERE driver_id = ?");
            $stmt->execute([$name, $phone, $profile_picture, $driver_id]);
        } else {
            $stmt = $conn->prepare("UPDATE drivers SET name = ?, phone = ? WHERE driver_id = ?");
            $stmt->execute([$name, $phone, $driver_id]);
        }
        
        sendResponse('success', 'Profile updated successfully');
    } catch (Exception $e) {
        sendResponse('error', 'Update error: ' . $e->getMessage(), null, 500);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_password') {
    $data = json_decode(file_get_contents("php://input"), true);
    $current_password = $data['current_password'] ?? '';
    $new_password = $data['new_password'] ?? '';
    
    try {
        $stmt = $conn->prepare("SELECT password FROM drivers WHERE driver_id = ?");
        $stmt->execute([$driver_id]);
        $driver = $stmt->fetch();
        
        $isValid = false;
        if ($driver && !empty($driver['password'])) {
            if (password_verify($current_password, $driver['password'])) {
                $isValid = true;
            } elseif ($current_password === $driver['password']) {
                $isValid = true;
            }
        }
        
        if (!$isValid) {
            sendResponse('error', 'Incorrect current password', null, 400);
        }
        
        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE drivers SET password = ? WHERE driver_id = ?");
        $stmt->execute([$hashed_password, $driver_id]);
        
        sendResponse('success', 'Password updated successfully');
    } catch (PDOException $e) {
        sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'report_issue') {
    $data = json_decode(file_get_contents("php://input"), true);
    $issue_type = $data['issue_type'] ?? 'Vehicle Issue';
    $message = $data['message'] ?? '';
    
    if(!$message) {
        sendResponse('error', 'Message is required', null, 400);
    }
    
    try {
        // Fetch admin and driver info
        $stmt = $conn->prepare("SELECT admin_id FROM admins LIMIT 1");
        $stmt->execute();
        $admin = $stmt->fetch();
        
        $stmt2 = $conn->prepare("SELECT name, phone, vehicle_plate FROM drivers WHERE driver_id = ?");
        $stmt2->execute([$driver_id]);
        $driver_info = $stmt2->fetch();

        if($admin && $driver_info) {
            $title = "🚨 " . $issue_type . " (Driver #" . $driver_id . ")";
            
            $formatted_message = "Driver Name: " . $driver_info['name'] . "\n";
            $formatted_message .= "Phone: " . $driver_info['phone'] . "\n";
            $formatted_message .= "Vehicle Plate: " . $driver_info['vehicle_plate'] . "\n\n";
            $formatted_message .= "Details:\n" . $message;

            $stmt = $conn->prepare("INSERT INTO notifications (user_id, user_type, title, message) VALUES (?, 'Admin', ?, ?)");
            $stmt->execute([$admin['admin_id'], $title, $formatted_message]);

            try {
                $msgStmt = $conn->prepare("INSERT INTO messages (sender_type, sender_id, message) VALUES ('Driver', ?, ?)");
                $msgStmt->execute([$driver_id, "[$title]\n" . $formatted_message]);
            } catch (Exception $exM) {}
        }
        sendResponse('success', 'Issue reported successfully');
    } catch (PDOException $e) {
        sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
    }
}

sendResponse('error', 'Invalid action or method', null, 400);
?>
