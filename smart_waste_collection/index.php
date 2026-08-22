<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Waste Management System | Next-Gen City Sanitation</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <style>
        html {
            scroll-behavior: smooth;
        }
        body, html {
            margin: 0;
            font-family: 'Inter', sans-serif;
            overflow-x: hidden;
            background-color: #ffffff;
        }
        
        /* Navbar Styles */
        .navbar-brand { font-weight: 800; font-size: 1.5rem; }
        .nav-link { font-weight: 600; color: #2c3e50 !important; margin: 0 10px; transition: color 0.2s; }
        .nav-link:hover { color: #2e7d32 !important; }
        .btn-nav-login { border-radius: 50px; padding: 10px 26px; font-weight: 700; background: #2e7d32; color: white; transition: all 0.25s ease; border: none; }
        .btn-nav-login:hover { background: #1b5e20; color: white; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(46,125,50,0.35); }

        /* Hero Section */
        .hero-section {
            background: linear-gradient(180deg, #e8f5e9 0%, #ffffff 100%);
            padding: 5rem 0 4rem;
            position: relative;
            overflow: hidden;
        }
        .hero-badge {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(46, 125, 50, 0.3);
            color: #1b5e20;
            font-size: 0.9rem;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(46, 125, 50, 0.12);
            animation: pulseGlow 3s infinite alternate;
        }
        @keyframes pulseGlow {
            from { box-shadow: 0 0 10px rgba(46, 125, 50, 0.15); }
            to { box-shadow: 0 0 20px rgba(46, 125, 50, 0.35); }
        }

        .hero-title {
            font-weight: 900;
            color: #1b5e20;
            letter-spacing: -0.5px;
            line-height: 1.15;
            font-size: 3.25rem;
        }
        .hero-subtitle {
            color: #4a5568;
            font-weight: 500;
            font-size: 1.2rem;
            line-height: 1.6;
        }

        .btn-hero-primary {
            background: #2e7d32;
            color: white;
            border-radius: 50px;
            padding: 14px 32px;
            font-weight: 700;
            transition: all 0.3s ease;
            border: none;
        }
        .btn-hero-primary:hover {
            background: #1b5e20;
            color: white;
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(46, 125, 50, 0.35);
        }

        .btn-hero-secondary {
            background: transparent;
            color: #2e7d32;
            border: 2px solid #2e7d32;
            border-radius: 50px;
            padding: 13px 30px;
            font-weight: 700;
            transition: all 0.3s ease;
        }
        .btn-hero-secondary:hover {
            background: rgba(46, 125, 50, 0.08);
            color: #1b5e20;
            transform: translateY(-3px);
        }

        /* Mockup Frame */
        .hero-mockup-wrapper {
            position: relative;
            margin-top: 3.5rem;
            max-width: 950px;
            margin-left: auto;
            margin-right: auto;
        }
        .hero-mockup-card {
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 25px 60px rgba(0,0,0,0.12);
            border: 1px solid rgba(0,0,0,0.06);
            overflow: hidden;
            transition: transform 0.4s ease;
        }
        .hero-mockup-card:hover {
            transform: translateY(-5px);
        }
        
        .floating-pill {
            position: absolute;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 12px 20px;
            border-radius: 50px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.12);
            border: 1px solid rgba(255,255,255,0.8);
            font-weight: 700;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10;
            animation: floatAnim 4s ease-in-out infinite alternate;
        }
        .pill-top-left {
            top: 20px;
            left: -20px;
            color: #2e7d32;
        }
        .pill-bottom-right {
            bottom: 30px;
            right: -20px;
            color: #1565c0;
            animation-delay: 2s;
        }
        @keyframes floatAnim {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-10px); }
        }

        /* Stats Bar */
        .stats-bar-section {
            background: #1b5e20;
            color: white;
            padding: 3rem 0;
        }
        .stat-item {
            text-align: center;
        }
        .stat-number {
            font-weight: 900;
            font-size: 2.75rem;
            color: #ffffff;
            margin-bottom: 0.25rem;
            letter-spacing: -1px;
        }
        .stat-label {
            color: #a5d6a7;
            font-weight: 600;
            font-size: 0.95rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }

        /* How it works */
        .how-it-works-section {
            padding: 6rem 0;
            background: #f8faf9;
        }
        .section-tag {
            color: #2e7d32;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.85rem;
        }
        .section-heading {
            font-weight: 900;
            color: #1b5e20;
            font-size: 2.5rem;
        }
        
        .step-box {
            background: white;
            border-radius: 20px;
            padding: 2.5rem 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.04);
            height: 100%;
            transition: all 0.3s ease;
            position: relative;
            border: 1px solid #edf2f7;
        }
        .step-box:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 35px rgba(46,125,50,0.12);
            border-color: #c8e6c9;
        }
        .step-icon-wrapper {
            width: 64px;
            height: 64px;
            background: #e8f5e9;
            color: #2e7d32;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.75rem;
            margin-bottom: 1.5rem;
            font-weight: 800;
        }

        /* Features Section */
        .features-section {
            padding: 6rem 0;
            background: #ffffff;
        }
        .feature-card {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 2.25rem;
            transition: all 0.3s ease;
            height: 100%;
        }
        .feature-card:hover {
            transform: translateY(-6px);
            border-color: #81c784;
            box-shadow: 0 15px 35px rgba(0,0,0,0.08);
        }
        .feature-icon {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-bottom: 1.25rem;
        }

        /* FAQ Section */
        .faq-section {
            padding: 5rem 0;
            background: #f8faf9;
        }
        .accordion-button:not(.collapsed) {
            background-color: #e8f5e9;
            color: #1b5e20;
            font-weight: 700;
        }

        /* Footer */
        .footer { background: #0e3a13; color: rgba(255,255,255,0.8); padding: 4rem 0 2rem; }
        .footer-brand { color: white; font-weight: 800; font-size: 1.5rem; text-decoration: none; display: inline-block; }
        .footer h5 { color: white; font-weight: 700; margin-bottom: 1.5rem; }
        .footer-links { list-style: none; padding: 0; margin: 0; }
        .footer-links li { margin-bottom: 0.8rem; }
        .footer-links a { color: rgba(255,255,255,0.8); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: white; text-decoration: underline; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 3rem; padding-top: 1.5rem; text-align: center; font-size: 0.9rem; }

        /* Back to Top */
        #backToTop {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #2e7d32;
            color: white;
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 999;
        }
        #backToTop.show { opacity: 1; visibility: visible; }
        #backToTop:hover { background: #1b5e20; transform: translateY(-3px); }
    </style>
</head>
<body id="top">
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
                    <li class="nav-item"><a class="nav-link active" href="#top">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="#how-it-works">How It Works</a></li>
                    <li class="nav-item"><a class="nav-link" href="#features">Features</a></li>
                    <li class="nav-item"><a class="nav-link" href="#faq">FAQ</a></li>
                    <li class="nav-item"><a class="nav-link" href="#contact">Contact Us</a></li>
                </ul>
                <div class="d-flex">
                    <a href="portal_select.php" class="btn btn-nav-login text-decoration-none shadow-sm">
                        <i class="fas fa-sign-in-alt me-2"></i>Login / Register
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section (Modernized SaaS Style) -->
    <section class="hero-section text-center">
        <div class="container">
            <div class="d-inline-flex align-items-center gap-2 hero-badge px-3 py-2 rounded-pill mb-4">
                <span>♻️ Next-Gen Smart City Sanitation</span>
            </div>
            <h1 class="display-4 hero-title mb-3">
                Smart Waste Management for<br class="d-none d-md-block"> Cleaner, Greener Cities.
            </h1>
            <p class="lead hero-subtitle mx-auto mb-4" style="max-width: 720px;">
                Request on-demand waste pickups, track collection trucks in real-time with live GPS, and manage hassle-free digital payments.
            </p>
            
            <div class="d-flex justify-content-center gap-3 flex-wrap mt-4">
                <a href="portal_select.php" class="btn btn-hero-primary shadow">
                    <i class="fas fa-rocket me-2"></i>Get Started / Choose Portal
                </a>
                <a href="#how-it-works" class="btn btn-hero-secondary">
                    <i class="fas fa-play-circle me-2"></i>Watch How It Works
                </a>
            </div>

            <!-- Hero Visual / Floating Mockup -->
            <div class="hero-mockup-wrapper d-none d-sm-block">
                <!-- Floating Pill 1 -->
                <div class="floating-pill pill-top-left">
                    <i class="fas fa-truck-moving fs-5 text-success"></i>
                    <span>🚛 Truck Arriving in 10 mins</span>
                </div>

                <!-- Floating Pill 2 -->
                <div class="floating-pill pill-bottom-right">
                    <i class="fas fa-check-circle fs-5 text-primary"></i>
                    <span>✅ 99.4% On-time Pickups</span>
                </div>

                <!-- Interactive App/Dashboard Mockup Graphic -->
                <div class="hero-mockup-card p-3 p-md-4">
                    <div class="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-success rounded-circle p-2"></span>
                            <span class="fw-bold text-dark">Live GPS Dispatch Console</span>
                        </div>
                        <span class="badge bg-success-subtle text-success fw-bold px-3 py-1 rounded-pill">Active Route #104</span>
                    </div>

                    <div class="bg-light rounded-4 p-4 text-center border" style="background: radial-gradient(circle, #e8f5e9 0%, #ffffff 100%); min-height: 260px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <div class="d-flex align-items-center gap-4 mb-3">
                            <div class="p-3 bg-white rounded-circle shadow-sm text-success fs-3">
                                <i class="fas fa-map-marked-alt"></i>
                            </div>
                            <div class="text-start">
                                <h6 class="fw-bold text-dark mb-0">Tarabunka Zone • Mogadishu</h6>
                                <small class="text-muted">Driver: Malik Abdi (Vehicle #ST-402)</small>
                            </div>
                        </div>
                        <div class="progress w-75 rounded-pill mb-2" style="height: 10px;">
                            <div class="progress-bar bg-success progress-bar-striped progress-bar-animated" role="progressbar" style="width: 75%;"></div>
                        </div>
                        <small class="text-success fw-bold"><i class="fas fa-location-arrow me-1"></i> Vehicle En Route • Estimated Arrival: 12:40 PM</small>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Live Metrics / Stats Counter Bar -->
    <section class="stats-bar-section">
        <div class="container">
            <div class="row g-4 justify-content-center">
                <div class="col-6 col-md-3">
                    <div class="stat-item">
                        <div class="stat-number">15,000+</div>
                        <p class="stat-label">Households Served</p>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-item">
                        <div class="stat-number">98.9%</div>
                        <p class="stat-label">On-Time Efficiency</p>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-item">
                        <div class="stat-number">50+</div>
                        <p class="stat-label">Active Fleets</p>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-item">
                        <div class="stat-number">24/7</div>
                        <p class="stat-label">Live Dispatch</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- How It Works Section -->
    <section id="how-it-works" class="how-it-works-section text-center">
        <div class="container">
            <span class="section-tag mb-2 d-block">Simple 3-Step Process</span>
            <h2 class="section-heading mb-5">How Smart Waste System Works</h2>

            <div class="row g-4">
                <div class="col-md-4">
                    <div class="step-box">
                        <div class="step-icon-wrapper mx-auto">
                            <i class="fas fa-mobile-alt"></i>
                        </div>
                        <h4 class="fw-bold text-dark mb-3">1. Request Pickup</h4>
                        <p class="text-muted mb-0">Resident selects pickup plan/amount and confirms location on the interactive map.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="step-box">
                        <div class="step-icon-wrapper mx-auto text-warning bg-warning-subtle">
                            <i class="fas fa-truck-loading"></i>
                        </div>
                        <h4 class="fw-bold text-dark mb-3">2. Smart Fleet Dispatch</h4>
                        <p class="text-muted mb-0">System automatically assigns the nearest available driver with optimized GPS routing.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="step-box">
                        <div class="step-icon-wrapper mx-auto text-primary bg-primary-subtle">
                            <i class="fas fa-map-marker-check"></i>
                        </div>
                        <h4 class="fw-bold text-dark mb-3">3. Real-time Tracking & Pay</h4>
                        <p class="text-muted mb-0">Track pickup arrival live on map and settle payment securely via EVC Plus / Mobile Money.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Key Features Grid -->
    <section id="features" class="features-section">
        <div class="container">
            <div class="text-center mb-5">
                <span class="section-tag mb-2 d-block">Powerful Capabilities</span>
                <h2 class="section-heading">Everything You Need for Clean Cities</h2>
            </div>

            <div class="row g-4">
                <div class="col-md-6 col-lg-3">
                    <div class="feature-card">
                        <div class="feature-icon bg-success-subtle text-success">
                            <i class="fas fa-map-marked-alt"></i>
                        </div>
                        <h5 class="fw-bold text-dark mb-2">Live GPS Route Tracking</h5>
                        <p class="text-muted small mb-0">Real-time map updates for residents and dispatchers to eliminate missed collections.</p>
                    </div>
                </div>

                <div class="col-md-6 col-lg-3">
                    <div class="feature-card">
                        <div class="feature-icon bg-primary-subtle text-primary">
                            <i class="fas fa-credit-card"></i>
                        </div>
                        <h5 class="fw-bold text-dark mb-2">Seamless Mobile Payments</h5>
                        <p class="text-muted small mb-0">Instant receipts and automatic balance settlement via EVC Plus, Zaad & cards.</p>
                    </div>
                </div>

                <div class="col-md-6 col-lg-3">
                    <div class="feature-card">
                        <div class="feature-icon bg-warning-subtle text-warning">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h5 class="fw-bold text-dark mb-2">Eco & Fleet Analytics</h5>
                        <p class="text-muted small mb-0">Detailed insights on daily waste collection volumes, route efficiency, and fuel logs.</p>
                    </div>
                </div>

                <div class="col-md-6 col-lg-3">
                    <div class="feature-card">
                        <div class="feature-icon bg-danger-subtle text-danger">
                            <i class="fas fa-bell"></i>
                        </div>
                        <h5 class="fw-bold text-dark mb-2">Instant SMS & App Alerts</h5>
                        <p class="text-muted small mb-0">Automated real-time notifications when truck is nearby or pickup is completed.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="faq-section">
        <div class="container">
            <div class="text-center mb-5">
                <span class="section-tag mb-2 d-block">Got Questions?</span>
                <h2 class="section-heading">Frequently Asked Questions</h2>
            </div>
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="accordion shadow-sm rounded-4" id="faqAccordion">
                        <div class="accordion-item border-0 mb-3 rounded-3 shadow-sm overflow-hidden">
                            <h2 class="accordion-header" id="headingOne">
                                <button class="accordion-button py-3" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true">
                                    How do I request a waste pickup?
                                </button>
                            </h2>
                            <div id="collapseOne" class="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                                <div class="accordion-body text-muted">
                                    Simply log into your Resident Portal, select your subscription plan or one-time pickup, confirm your address on the map, and click submit.
                                </div>
                            </div>
                        </div>

                        <div class="accordion-item border-0 mb-3 rounded-3 shadow-sm overflow-hidden">
                            <h2 class="accordion-header" id="headingTwo">
                                <button class="accordion-button collapsed py-3" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">
                                    Which mobile money payment methods are supported?
                                </button>
                            </h2>
                            <div id="collapseTwo" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                <div class="accordion-body text-muted">
                                    We support EVC Plus, Zaad, Sahal, Credit Cards, and direct mobile wallet integration with instant confirmation.
                                </div>
                            </div>
                        </div>

                        <div class="accordion-item border-0 rounded-3 shadow-sm overflow-hidden">
                            <h2 class="accordion-header" id="headingThree">
                                <button class="accordion-button collapsed py-3" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree">
                                    Can I track the collection truck in real time?
                                </button>
                            </h2>
                            <div id="collapseThree" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                <div class="accordion-body text-muted">
                                    Yes! Once a driver accepts your pickup job, you can view their live GPS position and estimated arrival time directly from your dashboard.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer Section -->
    <footer id="contact" class="footer">
        <div class="container">
            <div class="row g-4">
                <div class="col-lg-4 col-md-6">
                    <a href="index.html" class="footer-brand mb-3"><i class="fas fa-leaf me-2 text-success"></i> Smart Waste</a>
                    <p class="mb-4">Efficient, eco-friendly, and real-time waste management for a cleaner, healthier, and greener city.</p>
                </div>
                <div class="col-lg-4 col-md-6">
                    <h5>Quick Links</h5>
                    <ul class="footer-links">
                        <li><a href="#top">Home</a></li>
                        <li><a href="#how-it-works">How It Works</a></li>
                        <li><a href="#features">Features</a></li>
                        <li><a href="portal_select.php">Choose Portal</a></li>
                    </ul>
                </div>
                <div class="col-lg-4 col-md-12">
                    <h5>Contact Info</h5>
                    <ul class="list-unstyled text-white-50">
                        <li class="mb-2"><i class="fas fa-map-marker-alt text-success me-2"></i> Mogadishu, Somalia</li>
                        <li class="mb-2"><i class="fas fa-phone-alt text-success me-2"></i> +252 61 2345678</li>
                        <li class="mb-2"><i class="fas fa-envelope text-success me-2"></i> support@smartwaste.com</li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p class="mb-0">&copy; 2026 Smart Waste Management System. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- Back to Top Button -->
    <button id="backToTop" title="Go to top">
        <i class="fas fa-arrow-up"></i>
    </button>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const backToTopBtn = document.getElementById("backToTop");
        window.onscroll = function() {
            if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
                backToTopBtn.classList.add("show");
            } else {
                backToTopBtn.classList.remove("show");
            }
        };
        backToTopBtn.addEventListener("click", function() {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    </script>
</body>
</html>
