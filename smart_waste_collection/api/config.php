<?php
// api/config.php
ob_start();

// Database configuration
$host = '127.0.0.1';
$db_name = 'smart_waste_db';
$username = 'root';
$password = '';

// Default headers for REST API
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: " . $origin);
header("Access-Control-Allow-Credentials: true");
if (strpos($_SERVER['SCRIPT_NAME'] ?? '', '/api/') !== false || strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false) {
    header("Content-Type: application/json; charset=UTF-8");
}
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Handle preflight requests
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configure long-lived 30-day persistent session parameters (2,592,000 seconds)
ini_set('session.gc_maxlifetime', 2592000);
ini_set('session.cookie_lifetime', 2592000);

// Start session for authentication state if not active
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 2592000,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

try {
    try {
        $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    } catch (PDOException $eDb) {
        $rootConn = new PDO("mysql:host=" . $host, $username, $password);
        $rootConn->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    }
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Auto-create all required tables if missing
    $conn->exec("CREATE TABLE IF NOT EXISTS admins (
        admin_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Admin',
        profile_picture VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS residents (
        resident_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        profile_picture VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS drivers (
        driver_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20) DEFAULT NULL,
        zone VARCHAR(100) DEFAULT NULL,
        status VARCHAR(20) DEFAULT 'Online',
        password VARCHAR(255) NOT NULL,
        vehicle_info VARCHAR(100) DEFAULT 'Compact Dump Truck',
        vehicle_plate VARCHAR(50) DEFAULT NULL,
        license_number VARCHAR(50) DEFAULT NULL,
        emergency_contact VARCHAR(50) DEFAULT NULL,
        profile_picture VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS waste_requests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        resident_id INT NOT NULL,
        driver_id INT DEFAULT NULL,
        address TEXT DEFAULT NULL,
        waste_type VARCHAR(50) DEFAULT 'General',
        priority VARCHAR(20) DEFAULT 'Normal',
        area VARCHAR(100) DEFAULT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        payment_status VARCHAR(20) DEFAULT 'Unpaid',
        request_time DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS assignments (
        assignment_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        driver_id INT NOT NULL,
        assigned_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_time DATETIME DEFAULT NULL,
        completed_time DATETIME DEFAULT NULL,
        status VARCHAR(20) DEFAULT 'Assigned',
        waste_type VARCHAR(50) DEFAULT 'General',
        weight_kg DECIMAL(8,2) DEFAULT 25.00,
        driver_notes TEXT DEFAULT NULL,
        payment_status VARCHAR(20) DEFAULT 'Unpaid'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS payments (
        payment_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT DEFAULT NULL,
        resident_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'Completed',
        paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        method VARCHAR(50) DEFAULT 'EVC Plus',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS messages (
        message_id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        sender_type VARCHAR(20) DEFAULT 'Resident',
        recipient_id INT DEFAULT 1,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_type VARCHAR(20) DEFAULT 'Resident',
        title VARCHAR(150) DEFAULT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS request_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        message TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS request_logs (
            log_id INT AUTO_INCREMENT PRIMARY KEY,
            request_id INT NOT NULL,
            action VARCHAR(50) NOT NULL,
            message TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    } catch (Exception $e) {}

    // Auto-create notifications table if missing
    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS notifications (
            notification_id INT AUTO_INCREMENT PRIMARY KEY,
            user_type VARCHAR(20) NOT NULL DEFAULT 'Admin',
            user_id INT NOT NULL DEFAULT 1,
            title VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    } catch (Exception $e) {}

    // Auto-create assignments table if missing
    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS assignments (
            assignment_id INT AUTO_INCREMENT PRIMARY KEY,
            request_id INT NOT NULL,
            driver_id INT NOT NULL,
            assigned_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            started_time DATETIME DEFAULT NULL,
            completed_time DATETIME DEFAULT NULL,
            status VARCHAR(50) DEFAULT 'Assigned',
            waste_type VARCHAR(50) DEFAULT 'General',
            weight_kg DECIMAL(10,2) DEFAULT 25.00,
            driver_notes TEXT DEFAULT NULL,
            before_image VARCHAR(255) DEFAULT NULL,
            after_image VARCHAR(255) DEFAULT NULL,
            rating INT DEFAULT 5,
            payment_status VARCHAR(50) DEFAULT 'Unpaid'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    } catch (Exception $e) {}

    // Ensure all critical columns exist in case table was created from an older schema
    try {
        $conn->exec("ALTER TABLE admins ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL AFTER role");
    } catch (Exception $e) {}

    try {
        $conn->exec("ALTER TABLE residents ADD COLUMN subscription_plan VARCHAR(100) DEFAULT 'Pay Per Pickup ($5/Pickup)' AFTER address");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE residents ADD COLUMN status VARCHAR(20) DEFAULT 'Active' AFTER password");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE residents ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL AFTER status");
    } catch (Exception $e) {}

    try {
        $conn->exec("ALTER TABLE drivers ADD COLUMN approval_status VARCHAR(20) DEFAULT 'Approved' AFTER status");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE drivers ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER approval_status");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE drivers ADD COLUMN vehicle_plate VARCHAR(50) DEFAULT NULL AFTER vehicle_info");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE drivers ADD COLUMN license_number VARCHAR(50) DEFAULT NULL AFTER vehicle_plate");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE drivers ADD COLUMN emergency_contact VARCHAR(50) DEFAULT NULL AFTER license_number");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE drivers ADD COLUMN earning_per_pickup DECIMAL(5,2) DEFAULT 1.50 AFTER emergency_contact");
    } catch (Exception $e) {}

    try {
        $conn->exec("ALTER TABLE waste_requests ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 5.00 AFTER payment_status");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE waste_requests ADD COLUMN notes TEXT DEFAULT NULL AFTER paid_amount");
    } catch (Exception $e) {}

    try {
        $conn->exec("ALTER TABLE payments ADD COLUMN request_id INT DEFAULT NULL AFTER payment_id");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE payments ADD COLUMN method VARCHAR(50) DEFAULT 'EVC Plus' AFTER amount");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE assignments ADD COLUMN started_time TIMESTAMP NULL DEFAULT NULL AFTER assigned_time");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE assignments ADD COLUMN completed_time TIMESTAMP NULL DEFAULT NULL AFTER started_time");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE payments MODIFY COLUMN status VARCHAR(50) DEFAULT 'Completed'");
    } catch (Exception $e) {}
    // Fleet Management: Trucks table
    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS trucks (
            truck_id INT AUTO_INCREMENT PRIMARY KEY,
            plate_number VARCHAR(50) NOT NULL UNIQUE,
            model VARCHAR(100) NOT NULL,
            capacity_tons DECIMAL(5,2) DEFAULT 5.00,
            assigned_zone VARCHAR(100) NOT NULL,
            status VARCHAR(50) DEFAULT 'Available',
            current_driver_id INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // Seed 35 Trucks across all Mogadishu districts if table is empty
        // Seed 18 Fleet Trucks (1 Dedicated Truck per Mogadishu District)
        $truckCount = (int)$conn->query("SELECT COUNT(*) FROM trucks")->fetchColumn();
        if ($truckCount < 18) {
            $trucksList = [
                ['BU-101', 'Isuzu NPR Compactor 5-Ton', 5.0, 'Wadajir'],
                ['BU-102', 'Mitsubishi Fuso Tipper 6-Ton', 6.0, 'Hodan'],
                ['BU-103', 'Hino 500 Heavy Compactor 8-Ton', 8.0, 'Waberi'],
                ['BU-104', 'Isuzu Forward Skip Loader 7-Ton', 7.0, 'Deyniile'],
                ['BU-105', 'Mercedes Benz Econic 10-Ton', 10.0, 'Karaan'],
                ['BU-106', 'Toyota Dyna Light Tipper 4-Ton', 4.0, 'Hamarweyne'],
                ['BU-107', 'Isuzu Giga Heavy Lift 12-Ton', 12.0, 'Howlwadaag'],
                ['BU-108', 'Mitsubishi Canter Tipper 5-Ton', 5.0, 'Kaxda'],
                ['BU-109', 'Hino Dutro Compactor 6-Ton', 6.0, 'Shangani'],
                ['BU-110', 'Isuzu NPR Dump Truck 5-Ton', 5.0, 'Shibis'],
                ['BU-111', 'UD Trucks Quester 9-Ton', 9.0, 'Bondhere'],
                ['BU-112', 'Toyota Dyna Urban Lifter 4-Ton', 4.0, 'Abdiaziz'],
                ['BU-113', 'Isuzu Elf Mini Compactor 4-Ton', 4.0, 'Dharkenley'],
                ['BU-114', 'Mitsubishi Fuso Heavy Tipper 7-Ton', 7.0, 'Garasbaley'],
                ['BU-115', 'Hino 300 Eco Compactor 5-Ton', 5.0, 'Yaqshid'],
                ['BU-116', 'Isuzu Forward Tipper 6-Ton', 6.0, 'Huriwa'],
                ['BU-117', 'UD Croner Waste Loader 8-Ton', 8.0, 'Warta Nabada'],
                ['BU-118', 'Toyota Hilux Rapid Response 2-Ton', 2.0, 'Hamar Jajab']
            ];
            $stmtTrk = $conn->prepare("INSERT IGNORE INTO trucks (plate_number, model, capacity_tons, assigned_zone, status) VALUES (?, ?, ?, ?, 'Available')");
            foreach ($trucksList as $trk) {
                $stmtTrk->execute($trk);
            }
        }
    } catch (Exception $e) {}

    // Drop legacy foreign keys pointing to old requests table if present
    try {
        $conn->exec("ALTER TABLE assignments DROP FOREIGN KEY assignments_ibfk_1");
    } catch (Exception $e) {}
    try {
        $conn->exec("ALTER TABLE request_logs DROP FOREIGN KEY request_logs_ibfk_1");
    } catch (Exception $e) {}
} catch(PDOException $exception) {
    echo json_encode(['status' => 'error', 'message' => "Connection error: " . $exception->getMessage()]);
    exit();
}

// Helper function to send JSON response cleanly
function sendResponse($status, $message, $data = null, $statusCode = 200) {
    if (ob_get_length()) {
        ob_clean();
    }
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code($statusCode);
    $response = ['status' => $status, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit();
}

// Helper to seamlessly restore session from persistent 30-day role-specific auth token cookie
function restoreSessionFromCookie($role = null) {
    global $conn;
    $cookieNames = [];
    if ($role) {
        $cookieNames[] = 'swcms_token_' . $role;
    } else {
        $cookieNames = ['swcms_token_admin', 'swcms_token_driver', 'swcms_token_resident'];
    }

    foreach ($cookieNames as $cName) {
        if (!empty($_COOKIE[$cName])) {
            $decoded = base64_decode($_COOKIE[$cName]);
            $parts = explode(':', $decoded);
            if (count($parts) === 3) {
                list($type, $userId, $tokenHash) = $parts;
                if ($role && $type !== $role) continue;
                
                $table = 'residents';
                $idField = 'resident_id';
                if ($type === 'driver') {
                    $table = 'drivers';
                    $idField = 'driver_id';
                } elseif ($type === 'admin') {
                    $table = 'admins';
                    $idField = 'admin_id';
                }

                try {
                    $stmt = $conn->prepare("SELECT * FROM $table WHERE $idField = ?");
                    $stmt->execute([$userId]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);

                    if ($user) {
                        $secretKey = "SWCMS_SECRET_KEY_2026";
                        $expectedHash = hash_hmac('sha256', "$type:$userId:" . $user['password'], $secretKey);
                        if (hash_equals($expectedHash, $tokenHash)) {
                            if ($type === 'driver' && ($user['approval_status'] ?? 'Approved') !== 'Approved') {
                                continue;
                            }
                            $_SESSION['user_id'] = $user[$idField];
                            $_SESSION['user_type'] = $type;
                            $_SESSION['name'] = $user['name'];
                            $_SESSION['email'] = $user['email'] ?? $user['name'];
                            if (!isset($_SESSION['sessions'])) $_SESSION['sessions'] = [];
                            $_SESSION['sessions'][$type] = [
                                'user_id' => $user[$idField],
                                'type' => $type,
                                'name' => $user['name'],
                                'email' => $user['email'] ?? $user['name']
                            ];
                            return true;
                        }
                    }
                } catch (Exception $exCookie) {}
            }
        }
    }
    return false;
}

// Helper to check if logged in with role-keyed session isolation & persistent cookie restoration
function requireAuth($role = null) {
    if ($role && isset($_SESSION['sessions'][$role])) {
        // Activate role-specific session for this API request
        $sess = $_SESSION['sessions'][$role];
        $_SESSION['user_id'] = $sess['user_id'];
        $_SESSION['user_type'] = $role;
        $_SESSION['name'] = $sess['name'];
        $_SESSION['email'] = $sess['email'] ?? $sess['name'];
        return;
    }

    if (isset($_SESSION['user_id']) && isset($_SESSION['user_type'])) {
        if (!$role || $_SESSION['user_type'] === $role) {
            if ($role) {
                $_SESSION['sessions'][$role] = [
                    'user_id' => $_SESSION['user_id'],
                    'type' => $_SESSION['user_type'],
                    'name' => $_SESSION['name'] ?? '',
                    'email' => $_SESSION['email'] ?? ''
                ];
            }
            return;
        }
    }

    // Attempt transparent session recovery from 30-day persistent auth cookie
    if (restoreSessionFromCookie($role)) {
        return;
    }

    sendResponse('error', 'Unauthorized. Please log in.', null, 401);
}
?>
