<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Select Account Type | Smart Waste System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <style>
        body, html {
            min-height: 100vh;
            margin: 0;
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            display: flex;
            flex-direction: column;
        }

        /* Navbar Styles */
        .navbar-brand { font-weight: 800; font-size: 1.5rem; }
        .nav-link { font-weight: 500; color: #2c3e50 !important; margin: 0 10px; transition: color 0.2s; }
        .nav-link:hover { color: #2e7d32 !important; }
        .btn-nav-home { border-radius: 50px; padding: 8px 24px; font-weight: 600; background: #2e7d32; color: white; transition: all 0.2s; }
        .btn-nav-home:hover { background: #1b5e20; color: white; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(46,125,50,0.3); }

        .portal-header {
            text-align: center;
            margin-bottom: 3.5rem;
        }
        .portal-title {
            font-weight: 800;
            color: #1b5e20;
            font-size: 2.75rem;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.05);
        }
        .portal-subtitle {
            color: #2e7d32;
            font-weight: 500;
            font-size: 1.25rem;
        }

        /* Role Cards */
        .role-card {
            border: 2px solid transparent;
            border-radius: 24px;
            box-shadow: 0 12px 35px rgba(0,0,0,0.06);
            transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            text-align: center;
            padding: 3.5rem 2rem;
            position: relative;
            overflow: hidden;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            cursor: pointer;
            user-select: none;
        }
        .role-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 6px; }
        .card-resident::before { background: #2e7d32; }
        .card-driver::before { background: #f57c00; }
        .card-admin::before { background: #1565c0; }

        /* Interactive Card Hover Effects */
        .role-card.card-resident:hover {
            transform: translateY(-12px) scale(1.02);
            border-color: #2e7d32;
            box-shadow: 0 20px 45px rgba(46, 125, 50, 0.22);
        }
        .role-card.card-driver:hover {
            transform: translateY(-12px) scale(1.02);
            border-color: #f57c00;
            box-shadow: 0 20px 45px rgba(245, 124, 0, 0.22);
        }
        .role-card.card-admin:hover {
            transform: translateY(-12px) scale(1.02);
            border-color: #1565c0;
            box-shadow: 0 20px 45px rgba(21, 101, 192, 0.22);
        }

        .role-icon { font-size: 4.5rem; margin-bottom: 1.5rem; transition: transform 0.3s ease; }
        .role-card:hover .role-icon { transform: scale(1.12); }
        .icon-resident { color: #2e7d32; }
        .icon-driver { color: #f57c00; }
        .icon-admin { color: #1565c0; }
        
        .role-card h3 { font-weight: 800; margin-bottom: 1rem; color: #2c3e50; font-size: 1.75rem; }
        .role-card p { color: #6c757d; margin-bottom: 2rem; font-size: 0.98rem; line-height: 1.6; }
        
        .btn-role { border-radius: 50px; padding: 14px 30px; font-weight: 700; letter-spacing: 0.5px; transition: all 0.2s ease; text-transform: uppercase; font-size: 0.9rem; }
        .btn-resident { background: #2e7d32; border-color: #2e7d32; color: white; }
        .btn-resident:hover { background: #1b5e20; border-color: #1b5e20; color: white; }
        .btn-driver { background: #f57c00; border-color: #f57c00; color: white; }
        .btn-driver:hover { background: #e65100; border-color: #e65100; color: white; }
        .btn-admin { background: #1565c0; border-color: #1565c0; color: white; }
        .btn-admin:hover { background: #0d47a1; border-color: #0d47a1; color: white; }

        .main-wrapper {
            flex: 1;
            display: flex;
            align-items: center;
            padding: 3rem 0 5rem;
        }
    </style>
</head>
<body>
    <!-- Top Navigation -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3 sticky-top">
        <div class="container">
            <a class="navbar-brand text-success" href="index.html">
                <i class="fas fa-leaf me-2"></i> Smart Waste Collection
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav mx-auto">
                    <li class="nav-item"><a class="nav-link" href="index.html#top">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="index.html#how-it-works">How It Works</a></li>
                    <li class="nav-item"><a class="nav-link" href="index.html#faq">FAQ</a></li>
                    <li class="nav-item"><a class="nav-link" href="index.html#contact">Contact Us</a></li>
                </ul>
                <div class="d-flex">
                    <a href="index.html" class="btn btn-nav-home text-decoration-none"><i class="fas fa-arrow-left me-2"></i>Back to Home</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="main-wrapper">
        <div class="container">
            <div class="portal-header">
                <h1 class="portal-title mb-2">Welcome to Smart Waste System</h1>
                <p class="portal-subtitle mb-0">Please select your account type to proceed to your portal.</p>
            </div>

            <div class="row justify-content-center g-4">
                <!-- Resident Card -->
                <div class="col-md-4">
                    <div class="role-card card-resident" onclick="window.location.href='resident/login.php'">
                        <div>
                            <i class="fas fa-home role-icon icon-resident"></i>
                            <h3>Resident</h3>
                            <p>Request waste collection, track status, and manage payments.</p>
                        </div>
                        <a href="resident/login.php" class="btn btn-role btn-resident w-100 shadow-sm" onclick="event.stopPropagation();"><i class="fas fa-sign-in-alt me-2"></i>Resident Portal</a>
                    </div>
                </div>

                <!-- Driver Card -->
                <div class="col-md-4">
                    <div class="role-card card-driver" onclick="window.location.href='driver/login.php'">
                        <div>
                            <i class="fas fa-truck-pickup role-icon icon-driver"></i>
                            <h3>Driver</h3>
                            <p>View assigned collection jobs, update status, and navigate routes.</p>
                        </div>
                        <a href="driver/login.php" class="btn btn-role btn-driver w-100 shadow-sm" onclick="event.stopPropagation();"><i class="fas fa-sign-in-alt me-2"></i>Driver Portal</a>
                    </div>
                </div>

                <!-- Admin Card -->
                <div class="col-md-4">
                    <div class="role-card card-admin" onclick="window.location.href='admin/login.php'">
                        <div>
                            <i class="fas fa-user-shield role-icon icon-admin"></i>
                            <h3>Admin</h3>
                            <p>Full system control, fleet monitoring, payments, and analytics.</p>
                        </div>
                        <a href="admin/login.php" class="btn btn-role btn-admin w-100 shadow-sm" onclick="event.stopPropagation();"><i class="fas fa-sign-in-alt me-2"></i>Admin Dashboard</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white py-3 text-center border-top mt-auto">
        <div class="container">
            <small class="text-muted">&copy; 2026 Smart Waste Management System. All rights reserved.</small>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
