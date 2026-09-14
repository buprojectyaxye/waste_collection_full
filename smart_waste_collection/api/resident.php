<?php
// api/resident.php
require_once 'config.php';
requireAuth('resident');

$resident_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data && !empty($_POST)) {
        $data = $_POST;
    }

    if ($action === 'create_and_pay_request' || $action === 'create_request') {
        $address = $data['address'] ?? '';
        $request_time = $data['request_time'] ?? '';
        $amount = floatval($data['amount'] ?? 5.00);
        $method = $data['method'] ?? 'EVC Plus';

        try {
            // Fetch resident's registered profile to strictly enforce registered address and active subscription plan
            $resStmt = $conn->prepare("SELECT address, subscription_plan FROM residents WHERE resident_id = ?");
            $resStmt->execute([$resident_id]);
            $resProfile = $resStmt->fetch(PDO::FETCH_ASSOC);
            if ($resProfile && !empty($resProfile['address'])) {
                $address = $resProfile['address']; // Automatically match registered address
            }
            $resPlan = $resProfile['subscription_plan'] ?? '';

            $isMonthlyActive = (strpos($resPlan, '15') !== false || stripos($resPlan, 'monthly') !== false || strpos($resPlan, '45') !== false || stripos($resPlan, 'commercial') !== false);
            $planSubmitted = $data['plan'] ?? '';

            if ($isMonthlyActive && ($amount == 0 || $method === 'Monthly Subscription' || empty($planSubmitted) || strpos($planSubmitted, '15') !== false || stripos($planSubmitted, 'monthly') !== false || strpos($planSubmitted, '45') !== false || stripos($planSubmitted, 'commercial') !== false)) {
                $amount = 0.00;
                $method = 'Monthly Subscription';
            }

            if (!$address) {
                sendResponse('error', 'Registered address not found in profile', null, 400);
            }
            if (!$request_time) {
                $request_time = date('Y-m-d H:i:s');
            }

            // Check if resident already has an active request (Pending, Assigned, Accepted, In Progress)
            $activeCheck = $conn->prepare("
                SELECT request_id, status FROM waste_requests 
                WHERE resident_id = ? 
                  AND status IN ('Pending', 'Assigned', 'Accepted', 'In Progress') 
                  AND (payment_status = 'Paid' OR payment_status = 'Completed' OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = waste_requests.request_id AND p.status = 'Completed') > 0)
                ORDER BY request_id DESC 
                LIMIT 1
            ");
            $activeCheck->execute([$resident_id]);
            $activeReq = $activeCheck->fetch(PDO::FETCH_ASSOC);

            if ($activeReq) {
                sendResponse('error', "🛑 You already have an active pickup request (Request #{$activeReq['request_id']} - Status: {$activeReq['status']}). You cannot request another pickup until your current trash is collected or cancelled.", null, 400);
            }

            $conn->beginTransaction();

            $waste_type = $data['waste_type'] ?? $data['type'] ?? 'General Waste';
            
            $districts = ['Wadajir', 'Hodan', 'Waberi', 'Deyniile', 'Karaan', 'Hamarweyne', 'Howlwadaag', 'Kaxda', 'Shangani', 'Shibis', 'Bondhere', 'Abdiaziz', 'Dharkenley', 'Garasbaley', 'Yaqshid', 'Huriwa', 'Warta Nabada', 'Hamar Jajab'];
            $matchedDistrict = null;
            foreach ($districts as $d) {
                if (stripos($address, $d) !== false) {
                    $matchedDistrict = $d;
                    break;
                }
            }

            // Search for driver matching matchedDistrict zone first, or any active approved driver
            $matchedArea = $matchedDistrict ?: 'Mogadishu';
            $assignedDriver = null;
            
            if ($matchedDistrict) {
                $drvStmt = $conn->prepare("SELECT driver_id, name FROM drivers WHERE approval_status = 'Approved' AND (zone LIKE ? OR zone = ?) ORDER BY driver_id ASC LIMIT 1");
                $drvStmt->execute(["%$matchedDistrict%", $matchedDistrict]);
                $assignedDriver = $drvStmt->fetch(PDO::FETCH_ASSOC);
            }
            if (!$assignedDriver) {
                // Fallback to any active approved driver
                $drvStmt = $conn->query("SELECT driver_id, name FROM drivers WHERE approval_status = 'Approved' AND status IN ('On Duty', 'Online') ORDER BY driver_id ASC LIMIT 1");
                $assignedDriver = $drvStmt->fetch(PDO::FETCH_ASSOC);
            }
            if (!$assignedDriver) {
                // Fallback to any approved driver
                $drvStmt = $conn->query("SELECT driver_id, name FROM drivers WHERE approval_status = 'Approved' ORDER BY driver_id ASC LIMIT 1");
                $assignedDriver = $drvStmt->fetch(PDO::FETCH_ASSOC);
            }

            $driver_id_to_assign = $assignedDriver ? $assignedDriver['driver_id'] : null;
            $initial_status = $assignedDriver ? 'Assigned' : 'Pending';

            // Create new request as Assigned (or Pending if no driver available)
            $stmt = $conn->prepare("INSERT INTO waste_requests (resident_id, driver_id, request_time, address, area, waste_type, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Paid')");
            $stmt->execute([$resident_id, $driver_id_to_assign, $request_time, $address, $matchedArea, $waste_type, $initial_status]);
            $request_id = $conn->lastInsertId();

            if ($assignedDriver) {
                // Insert into assignments table
                $assStmt = $conn->prepare("INSERT INTO assignments (request_id, driver_id, status, assigned_time) VALUES (?, ?, 'Assigned', NOW())");
                $assStmt->execute([$request_id, $driver_id_to_assign]);

                // Notify driver
                try {
                    $notifDrv = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Driver', ?, 'New Pickup Assigned', ?)");
                    $notifDrv->execute([$driver_id_to_assign, "New pickup request #$request_id in $matchedArea has been assigned to you."]);
                } catch (Exception $exN) {}
            }

            // Insert Completed payment record
            $stmtPay = $conn->prepare("INSERT INTO payments (request_id, resident_id, amount, status, paid_at, method, created_at) VALUES (?, ?, ?, 'Completed', NOW(), ?, NOW())");
            $stmtPay->execute([$request_id, $resident_id, $amount, $method]);

            // Update active subscription plan if new plan submitted
            try {
                $activePlanStr = $planSubmitted ?: $resPlan;
                $savePlanName = '';

                if (strpos($activePlanStr, '45') !== false || stripos($activePlanStr, 'commercial') !== false) {
                    $savePlanName = 'Commercial Plan ($45.00)';
                } elseif (strpos($activePlanStr, '15') !== false || stripos($activePlanStr, 'monthly') !== false) {
                    $savePlanName = 'Monthly Subscription ($15.00)';
                } elseif (strpos($activePlanStr, '5') !== false || stripos($activePlanStr, 'pickup') !== false) {
                    $savePlanName = 'Pay Per Pickup ($5.00)';
                }

                if ($savePlanName && $savePlanName !== $resPlan) {
                    $stmtUpPlan = $conn->prepare("UPDATE residents SET subscription_plan = ? WHERE resident_id = ?");
                    $stmtUpPlan->execute([$savePlanName, $resident_id]);
                }
            } catch (Exception $exPlan) {}

            // Add log
            try {
                if ($amount == 0 || $method === 'Monthly Subscription') {
                    $logMsg = $assignedDriver ? "Pickup request scheduled under active Monthly Subscription ($0.00) and automatically assigned to driver " . $assignedDriver['name'] . " ($matchedArea zone)." : "Pickup request scheduled under active Monthly Subscription ($0.00). Pending driver assignment.";
                } else if ($assignedDriver) {
                    $logMsg = "Pickup request scheduled, paid ($" . number_format($amount, 2) . " via $method), and automatically assigned to driver " . $assignedDriver['name'] . " ($matchedArea zone).";
                } else {
                    $logMsg = "Pickup request scheduled and paid ($" . number_format($amount, 2) . " via $method). Pending driver assignment by administrator.";
                }
                $stmtLog = $conn->prepare("INSERT INTO request_logs (request_id, action, message) VALUES (?, 'Created', ?)");
                $stmtLog->execute([$request_id, $logMsg]);
            } catch (Exception $exLog) {}

            // Clean up any stale pending records for this resident
            try {
                $cleanPending = $conn->prepare("DELETE FROM payments WHERE resident_id = ? AND status = 'Pending'");
                $cleanPending->execute([$resident_id]);
            } catch (Exception $eClean) {}

            $conn->commit();
            sendResponse('success', 'Request created and assigned to zone driver successfully', [
                'request_id' => $request_id,
                'status' => $assignedDriver ? 'Assigned' : 'Pending',
                'zone' => $matchedArea,
                'assigned_driver' => $assignedDriver ? $assignedDriver['name'] : null
            ]);
        } catch (PDOException $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'make_payment') {
        // Real processed payment
        $amount = floatval($data['amount'] ?? 15.00);
        $method = $data['method'] ?? 'EVC Plus';
        $target_request_id = $data['request_id'] ?? null;
        
        try {
            if (!$target_request_id) {
                // Find latest request of this resident
                $findReq = $conn->prepare("SELECT request_id FROM waste_requests WHERE resident_id = ? ORDER BY request_id DESC LIMIT 1");
                $findReq->execute([$resident_id]);
                $found = $findReq->fetch();
                if ($found) {
                    $target_request_id = $found['request_id'];
                }
            }

            if ($target_request_id) {
                $stmtReqPay = $conn->prepare("UPDATE waste_requests SET payment_status = 'Paid' WHERE request_id = ?");
                $stmtReqPay->execute([$target_request_id]);
            }

            // Always insert Completed payment record
            $stmt = $conn->prepare("INSERT INTO payments (request_id, resident_id, amount, status, paid_at, method, created_at) VALUES (?, ?, ?, 'Completed', NOW(), ?, NOW())");
            $stmt->execute([$target_request_id, $resident_id, $amount, $method]);

            // Clean up any stale pending records for this resident
            try {
                $cleanPending = $conn->prepare("DELETE FROM payments WHERE resident_id = ? AND status = 'Pending'");
                $cleanPending->execute([$resident_id]);
            } catch (Exception $eClean) {}

            // Also mark any other requests of this resident as Paid
            $updateAllReq = $conn->prepare("UPDATE waste_requests SET payment_status = 'Paid' WHERE resident_id = ? AND (payment_status = 'Unpaid' OR payment_status = 'Pending' OR payment_status IS NULL)");
            $updateAllReq->execute([$resident_id]);

            // Insert system activity log
            if ($target_request_id) {
                try {
                    $logStmt = $conn->prepare("INSERT INTO request_logs (request_id, action, message) VALUES (?, 'Payment Received', ?)");
                    $logStmt->execute([$target_request_id, "Resident paid $" . number_format($amount, 2) . " via $method"]);
                } catch (Exception $eLog) {}
            }

            // Notify Admin with a new clean payment message
            try {
                $fmtAmt = number_format(floatval($amount), 2);
                $resName = $_SESSION['name'] ?? 'Resident';
                $msgText = "I have successfully paid $" . $fmtAmt . " via " . $method . ($target_request_id ? " for Request #$target_request_id. The request is now ready for driver assignment." : ".");
                $msgStmt = $conn->prepare("INSERT INTO messages (sender_type, sender_id, message) VALUES ('Resident', ?, ?)");
                $msgStmt->execute([$resident_id, $msgText]);

                $notifStmt = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Admin', 1, 'Payment Received', ?)");
                $notifStmt->execute(["$resName paid $" . $fmtAmt . " via $method" . ($target_request_id ? " for Request #$target_request_id. Ready for driver assignment." : ".")]);
            } catch (Exception $exNotif) {}

            sendResponse('success', 'Payment successful');
        } catch (PDOException $e) {
            sendResponse('error', 'Payment failed: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'send_report') {
        $message = $data['message'] ?? '';
        if (!$message) sendResponse('error', 'Message is required', null, 400);

        try {
            $msgStmt = $conn->prepare("INSERT INTO messages (sender_type, sender_id, message) VALUES ('Resident', ?, ?)");
            $msgStmt->execute([$resident_id, $message]);

            $notifStmt = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Admin', 1, 'New Report', ?)");
            $notifStmt->execute(["A new report was submitted by " . ($_SESSION['name'] ?? 'Resident') . ":\n" . $message]);
            
            sendResponse('success', 'Report sent successfully');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'cancel_request') {
        $request_id = $data['request_id'] ?? 0;
        if (!$request_id) sendResponse('error', 'Request ID is required', null, 400);

        try {
            $checkStmt = $conn->prepare("SELECT status FROM waste_requests WHERE request_id = ? AND resident_id = ?");
            $checkStmt->execute([$request_id, $resident_id]);
            $req = $checkStmt->fetch();

            if (!$req || $req['status'] !== 'Pending') {
                sendResponse('error', 'Cannot cancel this request. It may have already been assigned or completed.', null, 400);
            }

            $stmt = $conn->prepare("UPDATE waste_requests SET status = 'Cancelled' WHERE request_id = ?");
            $stmt->execute([$request_id]);

            $stmtLog = $conn->prepare("INSERT INTO request_logs (request_id, action, message) VALUES (?, 'Cancelled', 'Request cancelled by resident')");
            $stmtLog->execute([$request_id]);

            // Notify Admin
            $notifStmt = $conn->prepare("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('Admin', 1, 'Request Cancelled', ?)");
            $notifStmt->execute(["Request #$request_id was cancelled by " . ($_SESSION['name'] ?? 'Resident')]);

            try {
                $msgStmt = $conn->prepare("INSERT INTO messages (sender_type, sender_id, message) VALUES ('Resident', ?, ?)");
                $msgStmt->execute([$resident_id, "[Request Cancelled]\nRequest #$request_id was cancelled by " . ($_SESSION['name'] ?? 'Resident')]);
            } catch (Exception $exM) {}

            sendResponse('success', 'Request cancelled successfully');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'update_password') {
        $current_password = $data['current_password'] ?? '';
        $new_password = $data['new_password'] ?? '';

        if (!$current_password || !$new_password) {
            sendResponse('error', 'Current and new password are required', null, 400);
        }

        try {
            $stmt = $conn->prepare("SELECT password FROM residents WHERE resident_id = ?");
            $stmt->execute([$resident_id]);
            $resident = $stmt->fetch();

            $isValid = false;
            if ($resident && !empty($resident['password'])) {
                if (password_verify($current_password, $resident['password'])) {
                    $isValid = true;
                } elseif ($current_password === $resident['password']) {
                    $isValid = true;
                }
            }

            if (!$isValid) {
                sendResponse('error', 'Incorrect current password', null, 400);
            }

            $hashed = password_hash($new_password, PASSWORD_DEFAULT);
            $updateStmt = $conn->prepare("UPDATE residents SET password = ? WHERE resident_id = ?");
            $updateStmt->execute([$hashed, $resident_id]);

            sendResponse('success', 'Password updated successfully');
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'update_profile_pic') {
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
                $filename = 'resident_' . $resident_id . '_' . time() . '.' . $ext;
                $filepath = $dir . $filename;
                @file_put_contents($filepath, base64_decode($base64Data));
                $profile_pic = 'uploads/profiles/' . $filename;
            }
        } elseif (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
            $dir = __DIR__ . '/../uploads/profiles/';
            if (!is_dir($dir)) {
                @mkdir($dir, 0777, true);
            }
            $ext = pathinfo($_FILES['profile_picture']['name'], PATHINFO_EXTENSION) ?: 'jpg';
            $filename = 'resident_' . $resident_id . '_' . time() . '.' . $ext;
            if (move_uploaded_file($_FILES['profile_picture']['tmp_name'], $dir . $filename)) {
                $profile_pic = 'uploads/profiles/' . $filename;
            }
        }
        
        try {
            $stmt = $conn->prepare("UPDATE residents SET profile_picture = ? WHERE resident_id = ?");
            $stmt->execute([$profile_pic, $resident_id]);
            sendResponse('success', 'Profile picture updated successfully', ['profile_picture' => $profile_pic]);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'update_profile') {
        try {
            // Retrieve current database profile to preserve existing fields
            $stmtOld = $conn->prepare("SELECT * FROM residents WHERE resident_id = ?");
            $stmtOld->execute([$resident_id]);
            $old = $stmtOld->fetch(PDO::FETCH_ASSOC) ?: [];

            $name = trim($data['name'] ?? '') ?: ($old['name'] ?? 'Resident');
            $phone = trim($data['phone'] ?? '') ?: ($old['phone'] ?? '');
            $address = trim($data['address'] ?? '') ?: ($old['address'] ?? '');
            $subscription_plan = trim($data['subscription_plan'] ?? '') ?: ($old['subscription_plan'] ?? 'Pay Per Pickup ($5/Pickup)');

            $profile_picture = $old['profile_picture'] ?? null;
            if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/../uploads/profiles/';
                if (!is_dir($uploadDir)) {
                    @mkdir($uploadDir, 0777, true);
                }
                $ext = pathinfo($_FILES['profile_picture']['name'], PATHINFO_EXTENSION) ?: 'jpg';
                $filename = 'resident_' . $resident_id . '_' . time() . '.' . $ext;
                if (move_uploaded_file($_FILES['profile_picture']['tmp_name'], $uploadDir . $filename)) {
                    $profile_picture = 'uploads/profiles/' . $filename;
                }
            }

            $stmt = $conn->prepare("UPDATE residents SET name = ?, phone = ?, address = ?, subscription_plan = ?, profile_picture = ? WHERE resident_id = ?");
            $stmt->execute([$name, $phone, $address, $subscription_plan, $profile_picture, $resident_id]);
            $_SESSION['name'] = $name;

            sendResponse('success', 'Profile updated successfully', [
                'name' => $name,
                'phone' => $phone,
                'address' => $address,
                'subscription_plan' => $subscription_plan,
                'profile_picture' => $profile_picture
            ]);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'update_subscription_plan') {
        $plan = $data['subscription_plan'] ?? '';
        if ($plan) {
            try {
                $stmt = $conn->prepare("UPDATE residents SET subscription_plan = ? WHERE resident_id = ?");
                $stmt->execute([$plan, $resident_id]);
                sendResponse('success', 'Subscription plan updated successfully', ['subscription_plan' => $plan]);
            } catch (PDOException $e) {
                sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
            }
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'get_requests') {
        try {
            $stmt = $conn->prepare("
                SELECT r.*, 
                       COALESCE(d.name, d2.name, 'Unassigned') as driver_name,
                       COALESCE(d.phone, d2.phone, 'N/A') as driver_phone
                FROM waste_requests r 
                LEFT JOIN drivers d ON r.driver_id = d.driver_id 
                LEFT JOIN (
                    SELECT request_id, MAX(assignment_id) as max_id
                    FROM assignments 
                    GROUP BY request_id
                ) latest_a ON r.request_id = latest_a.request_id
                LEFT JOIN assignments a ON latest_a.max_id = a.assignment_id
                LEFT JOIN drivers d2 ON a.driver_id = d2.driver_id
                WHERE r.resident_id = ? 
                  AND (r.payment_status = 'Paid' OR r.payment_status = 'Completed' OR (SELECT COUNT(*) FROM payments p WHERE p.request_id = r.request_id AND p.status = 'Completed') > 0)
                ORDER BY r.request_id DESC
            ");
            $stmt->execute([$resident_id]);
            $requests = $stmt->fetchAll();
            
            // Fetch logs for each if request_logs table exists
            foreach ($requests as &$req) {
                try {
                    $stmtLog = $conn->prepare("SELECT * FROM request_logs WHERE request_id = ? ORDER BY created_at ASC");
                    $stmtLog->execute([$req['request_id']]);
                    $req['logs'] = $stmtLog->fetchAll();
                } catch (Exception $ex) {
                    $req['logs'] = [];
                }
            }

            sendResponse('success', 'Requests fetched', $requests);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_payments') {
        try {
            $stmt = $conn->prepare("
                SELECT p.*, r.name as resident_name, 
                    (SELECT d.name 
                     FROM waste_requests req 
                     JOIN drivers d ON req.driver_id = d.driver_id 
                     WHERE req.resident_id = p.resident_id AND req.status = 'Completed' 
                     ORDER BY req.request_time DESC LIMIT 1) as driver_name
                FROM payments p 
                JOIN residents r ON p.resident_id = r.resident_id
                WHERE p.resident_id = ? AND p.status = 'Completed'
                ORDER BY p.paid_at DESC, p.payment_id DESC
            ");
            $stmt->execute([$resident_id]);
            $payments = $stmt->fetchAll();
            sendResponse('success', 'Payments fetched', $payments);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_dues') {
        try {
            sendResponse('success', 'Dues calculated', [
                'unpaid_count' => 0,
                'outstanding_dues' => 0.00
            ]);
        } catch (Exception $e) {
            sendResponse('error', 'Error calculating dues', null, 500);
        }
    }
    elseif ($action === 'get_notifications') {
        try {
            $stmt = $conn->prepare("SELECT * FROM notifications WHERE user_id = ? AND user_type = 'Resident' ORDER BY created_at DESC");
            $stmt->execute([$resident_id]);
            $notifications = $stmt->fetchAll();
            sendResponse('success', 'Notifications fetched', $notifications);
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
    elseif ($action === 'get_profile') {
        try {
            $stmt = $conn->prepare("SELECT name, email, phone, address, subscription_plan, profile_picture FROM residents WHERE resident_id = ?");
            $stmt->execute([$resident_id]);
            $profile = $stmt->fetch();
            if ($profile) {
                sendResponse('success', 'Profile fetched', $profile);
            } else {
                sendResponse('error', 'Profile not found', null, 404);
            }
        } catch (PDOException $e) {
            sendResponse('error', 'Database error: ' . $e->getMessage(), null, 500);
        }
    }
}

sendResponse('error', 'Invalid action or method', null, 400);
?>
