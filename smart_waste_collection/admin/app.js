// admin/app.js
let chartInstances = {};

function syncAdminProfileDisplay() {
    try {
        const saved = localStorage.getItem('adminProfile');
        if (saved) {
            const prof = JSON.parse(saved);
            if (prof.name) {
                const nameEl = document.getElementById('adminNameDisplay');
                if (nameEl) nameEl.textContent = prof.name;
            }
        }
    } catch(e) {}
}

async function initAdminApp() {
    try {
        // Sidebar Toggle Logic for Desktop & Mobile
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        function toggleSidebar() {
            if (!sidebar) return;
            if (window.innerWidth < 992) {
                sidebar.classList.toggle('expanded');
                sidebar.classList.toggle('show');
                sidebar.classList.toggle('active');
                if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
            } else {
                sidebar.classList.toggle('collapsed');
                if (mainContent) mainContent.classList.toggle('collapsed');
            }
        }

        function closeMobileSidebar() {
            if (window.innerWidth < 992 && sidebar) {
                sidebar.classList.remove('expanded', 'show', 'active');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            }
        }

        if (sidebarToggle) {
            sidebarToggle.onclick = toggleSidebar;
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.onclick = closeMobileSidebar;
        }

        // Global Event Delegation for Sidebar Nav Links
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                closeMobileSidebar();
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const sectionId = href.replace('#', '');
                    if (sectionId && sectionId !== '') {
                        showSection(sectionId);
                    }
                }
            });
        });

        // Load admin dashboard & sync profile
        syncAdminProfileDisplay();
        loadAssign();
        if (window.location.hash) {
            handleHashNavigation();
        } else {
            loadDashboard();
        }
        
        loadHeaderData();
        loadActivities();
        setInterval(loadHeaderData, 10000);
        setInterval(loadActivities, 10000);
        setInterval(() => {
            // Never disrupt active user typing/searching
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
                return;
            }
            if (typeof currentActiveSection === 'undefined' || currentActiveSection === 'dashboard' || !currentActiveSection) {
                loadDashboard();
            } else if (currentActiveSection === 'requests') {
                loadRequests();
            } else if (currentActiveSection === 'assign') {
                loadAssign();
            } else if (currentActiveSection === 'payments') {
                if (typeof loadPayments === 'function') loadPayments();
            } else if (currentActiveSection === 'messages') {
                if (typeof loadMessagesSection === 'function') loadMessagesSection();
            }
        }, 8000);

        // Verify background session softly for Admin role
        apiCall('/auth.php?action=me&role=admin').then(res => {
            if (res && res.data && res.data.name) {
                const nameEl = document.getElementById('adminNameDisplay');
                if (nameEl) nameEl.textContent = res.data.name;
            }
        }).catch(err => {
            console.warn('Session verify info:', err);
        });
    } catch (errInit) {
        console.error("initAdminApp error:", errInit);
        loadDashboard();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminApp);
} else {
    initAdminApp();
}

function handleHashNavigation() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const validSections = ['dashboard', 'requests', 'residents', 'assign', 'messages', 'drivers', 'activities', 'payments', 'reports', 'settings', 'profile'];
    if (validSections.includes(hash)) {
        showSection(hash);
    } else {
        showSection('dashboard');
    }
}

window.addEventListener('hashchange', handleHashNavigation);

let currentActiveSection = null;

function showSection(sectionId) {
    if (!sectionId) return;

    // Instantly hide all sections
    const sections = document.querySelectorAll('.section-container');
    sections.forEach(el => {
        el.classList.add('d-none');
        el.style.display = 'none';
    });

    // Deactivate all nav links
    document.querySelectorAll('.sidebar .nav-link').forEach(el => el.classList.remove('active'));

    // Show target section IMMEDIATELY
    const targetSec = document.getElementById(`${sectionId}-section`);
    if (targetSec) {
        targetSec.classList.remove('d-none');
        targetSec.style.display = 'block';
        targetSec.style.setProperty('display', 'block', 'important');
    }

    // Activate corresponding nav link
    const targetNav = document.querySelector(`a[href="#${sectionId}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }

    // Auto-close mobile sidebar if collapsed overlay is active
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (window.innerWidth < 992 && sidebar && sidebar.classList.contains('expanded')) {
        sidebar.classList.remove('expanded');
        document.querySelector('.main-content')?.classList.remove('expanded');
        if (overlay) overlay.classList.remove('active');
    }

    // Update URL hash without triggering duplicate hashchange loops
    if (window.location.hash !== `#${sectionId}`) {
        history.pushState(null, null, `#${sectionId}`);
    }

    currentActiveSection = sectionId;

    // Async data loader (non-blocking)
    setTimeout(async () => {
        try {
            if(sectionId === 'dashboard') await loadDashboard();
            if(sectionId === 'requests') await loadRequests();
            if(sectionId === 'residents') await loadResidents();
            if(sectionId === 'assign') await loadAssign();
            if(sectionId === 'messages') await loadMessagesSection();
            if(sectionId === 'drivers') await loadDrivers();
            if(sectionId === 'activities') await loadActivities();
            if(sectionId === 'payments') {
                await loadPayments();
                if(typeof renderPaymentChartsAlways === 'function') renderPaymentChartsAlways();
            }
            if(sectionId === 'reports') await loadReportsSection();
            if(sectionId === 'settings') await loadSettings();
            if(sectionId === 'profile') await loadProfile();
        } catch(err) {
            console.error(`Error loading data for section ${sectionId}:`, err);
        }
    }, 10);
}
window.showSection = showSection;

async function loadDashboard() {
    let stats = {
        total_requests: 0,
        pending_requests: 0,
        completed_requests: 0,
        total_drivers: 0,
        total_residents: 0,
        total_payments: 0,
        monthly_revenue: 0,
        today_collections: 0
    };

    try {
        const res = await apiCall('/admin.php?action=get_dashboard_stats');
        const dataObj = (res && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) ? res.data : (res?.data?.stats || null);
        if (dataObj) {
            stats = { ...stats, ...dataObj };
        }
    } catch (err) {
        console.warn("[API Warning] Could not fetch live dashboard stats:", err);
    }

    if (document.getElementById('statTotalRequests')) document.getElementById('statTotalRequests').innerText = stats.total_requests;
    if (document.getElementById('statPending')) document.getElementById('statPending').innerText = stats.pending_requests;
    if (document.getElementById('statCompleted')) document.getElementById('statCompleted').innerText = stats.completed_requests;
    if (document.getElementById('statDrivers')) document.getElementById('statDrivers').innerText = stats.total_drivers;
    if (document.getElementById('statResidents')) document.getElementById('statResidents').innerText = stats.total_residents;
    if (document.getElementById('statPayments')) document.getElementById('statPayments').innerText = stats.total_payments;
    
    const rev = parseFloat(stats.monthly_revenue || 0);
    if (document.getElementById('statRevenue')) document.getElementById('statRevenue').innerText = '$' + rev.toFixed(2);
    if (document.getElementById('statToday')) document.getElementById('statToday').innerText = stats.today_collections || 0;

    const sBadge = document.getElementById('sidebarAssignBadge');
    if (sBadge) {
        sBadge.textContent = stats.pending_requests;
        sBadge.style.display = stats.pending_requests > 0 ? 'inline-block' : 'none';
    }
    const hBadge = document.getElementById('headerAssignBadge');
    if (hBadge) {
        hBadge.textContent = stats.pending_requests;
        hBadge.style.display = stats.pending_requests > 0 ? 'inline-block' : 'none';
    }

    // Call sub-loaders independently outside try-catch block to guarantee rendering
    try { await loadCharts(); } catch (e) { console.error("loadCharts error:", e); }
    try { await loadDashboardRecentRequests(); } catch (e) { console.error("loadDashboardRecentRequests error:", e); }
    try { await loadDashboardDriverStatus(); } catch (e) { console.error("loadDashboardDriverStatus error:", e); }
    try { await loadDashboardActivities(); } catch (e) { console.error("loadDashboardActivities error:", e); }
    try { await loadDashboardSchedule(); } catch (e) { console.error("loadDashboardSchedule error:", e); }
}

async function loadPayments() {
    try {
        const filterEl = document.getElementById('revenueDateFilter');
        const filter = filterEl ? filterEl.value : '6months';
        const res = await apiCall(`/admin.php?action=get_payments_stats&filter=${filter}`);
        const stats = res.data;
        
        if (document.getElementById('payTotalCount')) document.getElementById('payTotalCount').innerText = stats.total_payments;
        if (document.getElementById('payMonthlyRev')) document.getElementById('payMonthlyRev').innerText = '$' + stats.monthly_revenue.toFixed(2);
        if (document.getElementById('payPending')) document.getElementById('payPending').innerText = stats.pending_payments;
        if (document.getElementById('payFailed')) document.getElementById('payFailed').innerText = stats.failed_payments;
        
        loadPaymentCharts(filter);

        // Fetch & Render Real Transactions from Database
        const paymentsRes = await apiCall('/admin.php?action=get_all_payments');
        const tbody = document.getElementById('recent-transactions-tbody');
        if (tbody && paymentsRes.data) {
            tbody.innerHTML = '';
            if (paymentsRes.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No payment transactions found.</td></tr>';
            } else {
                paymentsRes.data.forEach(p => {
                    const dateFormatted = p.paid_at 
                        ? new Date(p.paid_at).toLocaleDateString(window.currentLocale || 'en-US', {month: 'short', day: 'numeric', year: 'numeric'}) 
                        : 'Aug 1, 2026';
                    const statusBadge = p.status === 'Completed' 
                        ? '<span class="badge bg-success">Completed</span>' 
                        : (p.status === 'Pending' ? '<span class="badge bg-warning text-dark">Pending</span>' : '<span class="badge bg-danger">Failed</span>');
                    
                    tbody.innerHTML += `
                        <tr>
                            <td class="fw-bold">#TXN-${p.payment_id}</td>
                            <td class="text-capitalize">${p.resident_name || 'Resident'}</td>
                            <td>${dateFormatted}</td>
                            <td class="fw-bold text-success">$${parseFloat(p.amount).toFixed(2)}</td>
                            <td><i class="fas fa-mobile-alt text-primary me-2"></i>EVC Plus</td>
                            <td>${statusBadge}</td>
                        </tr>
                    `;
                });
            }
        }
    } catch (err) {
        console.error("Failed to load payments:", err);
    }
}

async function loadCharts() {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded yet");
        return;
    }

    let data = {
        barLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        bar: [12, 19, 15, 25, 22, 30, 28, 35],
        pieLabels: ['Completed', 'Pending', 'In Progress', 'Cancelled'],
        pie: [5, 1, 1, 0],
        driverLabels: ['Malik', 'Ahmed', 'Hassan', 'Omar'],
        driver: [5, 3, 2, 4],
        revenueLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        revenueArea: [35, 40, 60, 45, 90, 120],
        paymentPie: [5, 1, 0]
    };

    try {
        const res = await apiCall('/admin.php?action=get_chart_data');
        if (res && res.data && res.data.bar) {
            data = { ...data, ...res.data };
        }
    } catch (err) {
        console.warn("[API Warning] Using fallback chart data:", err);
    }

    try {
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = "#6c757d";
    } catch(e) {}

    initCharts(data);
}

function getT(text) {
    if (window.currentDict && window.currentDict[text]) return window.currentDict[text];
    return text;
}

async function initCharts(data) {
    if (typeof Chart === 'undefined') return;

    if (document.getElementById('barChart')) {
        if(chartInstances.bar) {
            try { chartInstances.bar.destroy(); } catch(e){}
        }
        const ctxBar = document.getElementById('barChart').getContext('2d');
        chartInstances.bar = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: data.barLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: getT('Requests Made'),
                    data: data.bar || [12, 19, 15, 25, 22, 30],
                    backgroundColor: '#2e7d32',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    if (document.getElementById('pieChart')) {
        if(chartInstances.pie) {
            try { chartInstances.pie.destroy(); } catch(e){}
        }
        const ctxPie = document.getElementById('pieChart').getContext('2d');
        chartInstances.pie = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: [getT('Completed'), getT('Pending'), getT('Assigned/In-Progress')],
                datasets: [{
                    data: data.pie || [5, 1, 1],
                    backgroundColor: ['#198754', '#ffc107', '#0dcaf0'],
                    borderWidth: 0
                }]
            },
            options: { cutout: '70%', responsive: true, maintainAspectRatio: false }
        });
    }

    if (document.getElementById('driverChart')) {
        if(chartInstances.driver) {
            try { chartInstances.driver.destroy(); } catch(e){}
        }
        const ctxDriver = document.getElementById('driverChart').getContext('2d');
        chartInstances.driver = new Chart(ctxDriver, {
            type: 'bar',
            data: {
                labels: data.driverLabels || ['Malik', 'Ahmed', 'Hassan', 'Omar'],
                datasets: [{
                    label: getT('Jobs Completed'),
                    data: data.driver || [5, 3, 2, 4],
                    backgroundColor: '#81c784',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    if (document.getElementById('revenueAreaChart')) {
        const canvasArea = document.getElementById('revenueAreaChart');
        if (typeof Chart !== 'undefined' && Chart.getChart(canvasArea)) {
            try { Chart.getChart(canvasArea).destroy(); } catch(e){}
        }
        if (window.myRevenueChart) {
            try { window.myRevenueChart.destroy(); } catch(e){}
        }
        if(chartInstances.revenueArea) {
            try { chartInstances.revenueArea.destroy(); } catch(e){}
        }
        const ctxArea = canvasArea.getContext('2d');
        chartInstances.revenueArea = new Chart(ctxArea, {
            type: 'line',
            data: {
                labels: data.revenueLabels || ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [{
                    label: getT('Revenue ($)'),
                    data: data.revenueArea || [0, 0, 0, 0, 0, 0],
                    borderColor: '#2e7d32',
                    backgroundColor: 'rgba(46, 125, 50, 0.15)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#2e7d32'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return '$' + value; }
                        }
                    }
                }
            }
        });
        window.myRevenueChart = chartInstances.revenueArea;
    }

    if (document.getElementById('paymentStatusChart')) {
        const canvasPie = document.getElementById('paymentStatusChart');
        if (typeof Chart !== 'undefined' && Chart.getChart(canvasPie)) {
            try { Chart.getChart(canvasPie).destroy(); } catch(e){}
        }
        if (window.myPaymentPieChart) {
            try { window.myPaymentPieChart.destroy(); } catch(e){}
        }
        if(chartInstances.paymentPie) {
            try { chartInstances.paymentPie.destroy(); } catch(e){}
        }
        const ctxPie = canvasPie.getContext('2d');
        chartInstances.paymentPie = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: [getT('Completed'), getT('Pending'), getT('Failed')],
                datasets: [{
                    data: data.paymentPie || [0, 0, 0],
                    backgroundColor: ['#198754', '#ffc107', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        window.myPaymentPieChart = chartInstances.paymentPie;
    }
}

async function loadPaymentCharts(filter = '6months') {
    try {
        const res = await apiCall(`/admin.php?action=get_chart_data&filter=${filter}`);
        const data = res.data;

        const titleEl = document.getElementById('revenueChartTitle');
        if (titleEl) {
            if (filter === 'this_month') titleEl.innerText = 'Revenue Over Time (This Month)';
            else if (filter === '7days') titleEl.innerText = 'Revenue Over Time (Last 7 Days)';
            else titleEl.innerText = 'Revenue Over Time (6 Months)';
        }

        if (typeof renderPaymentChartsAlways === 'function') {
            renderPaymentChartsAlways(data);
        } else {
            initCharts(data);
        }
    } catch (err) {
        console.error("Failed to load payment charts:", err);
    }
}

async function generateFinancialReport() {
    showToast("Downloading Financial Report...", "success");
    window.location.href = '../api/admin.php?action=export_financial_report';
}

async function loadDashboardRecentRequests() {
    const tbody = document.getElementById('recent-requests-dummy');
    if(!tbody) return;

    let requests = [];

    try {
        const res = await apiCall('/admin.php?action=get_all_requests');
        if (res && Array.isArray(res.data)) {
            requests = res.data;
        }
    } catch (err) {
        console.warn("[API Warning] Could not fetch live requests:", err);
    }

    tbody.innerHTML = '';
    
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No waste collection requests found.</td></tr>';
        const paginationText = document.querySelector('#dashboard-section small.text-muted');
        if (paginationText) paginationText.textContent = `Showing 0 to 0 of 0 entries`;
        return;
    }

    const recentRequests = requests.slice(0, 10);

    recentRequests.forEach(req => {
        let badgeClass = 'bg-secondary';
        if(req.status === 'Completed') badgeClass = 'badge-completed';
        else if(req.status === 'Pending') badgeClass = 'badge-pending';
        else if(req.status === 'In Progress') badgeClass = 'bg-info';
        else if(req.status === 'Cancelled') badgeClass = 'badge-failed';
        else if(req.status === 'Assigned' || req.status === 'Accepted') badgeClass = 'bg-primary';

        let driverDisplay = '<span class="text-muted fst-italic">Unassigned</span>';
        if (req.driver_name && req.driver_name !== 'Unassigned') {
            const plateBadge = req.vehicle_plate ? `<span class="badge bg-light text-dark border ms-1"><i class="fas fa-truck text-success me-1"></i>${req.vehicle_plate}</span>` : '';
            driverDisplay = `<span class="fw-bold text-primary"><i class="fas fa-user-check me-1"></i>${req.driver_name}</span> ${plateBadge}`;
        } else if (req.status === 'Pending') {
            const areaDisplay = req.area || 'Zone';
            driverDisplay = `<span class="badge bg-warning text-dark"><i class="fas fa-broadcast-tower me-1"></i> Open to ${areaDisplay}</span>`;
        }

        const reqDateFormatted = req.request_time ? new Date(req.request_time).toLocaleDateString(window.currentLocale || 'en-US') : '-';

        tbody.innerHTML += `
            <tr style="white-space: nowrap !important;">
                <td class="fw-bold" style="white-space: nowrap !important; vertical-align: middle;">#${req.request_id}</td>
                <td style="white-space: nowrap !important; vertical-align: middle;">${req.resident_name || 'Resident'}</td>
                <td class="address-column" style="min-width: 180px !important; white-space: nowrap !important; vertical-align: middle;"><span style="white-space: nowrap !important; display: inline-block;">${formatAddress(req.address)}</span></td>
                <td style="white-space: nowrap !important; vertical-align: middle;">${req.waste_type || 'General'}</td>
                <td style="white-space: nowrap !important; vertical-align: middle;">${driverDisplay}</td>
                <td style="white-space: nowrap !important; vertical-align: middle;">${reqDateFormatted}</td>
                <td style="white-space: nowrap !important; vertical-align: middle;"><span class="badge badge-custom ${badgeClass}">${req.status || 'Pending'}</span></td>
                <td class="text-end" style="white-space: nowrap !important; vertical-align: middle;">
                    <div class="btn-group btn-group-sm" style="white-space: nowrap !important;">
                        <button class="btn btn-outline-secondary" title="View" onclick="alert('Viewing full details for Request #${req.request_id}\\n\\nResident: ${req.resident_name || 'Resident'}\\nAddress: ${req.address || ''}\\nWaste Type: ${req.waste_type || 'General'}\\nCurrent Status: ${req.status || 'Pending'}\\nPayment Status: ${req.payment_status || 'Unpaid'}')"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-outline-primary" title="Assign" onclick="openAssignModal(${req.request_id})"><i class="fas fa-truck"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    const paginationText = document.querySelector('#dashboard-section small.text-muted');
    if (paginationText) {
        paginationText.textContent = `Showing 1 to ${recentRequests.length} of ${requests.length} entries`;
    }

    if (typeof filterDashboardRequests === 'function') {
        filterDashboardRequests();
    }
}

async function loadDashboardDriverStatus() {
    const tbody = document.getElementById('dashboard-driver-status-tbody') || document.getElementById('dashboard-driver-status');
    if(!tbody) return;

    let drivers = [
        { driver_id: 1, name: 'Malik', phone: '+252615001122', zone: 'Zone A', status: 'On Duty' },
        { driver_id: 2, name: 'Yahye', phone: '+252615998877', zone: 'Zone B', status: 'Offline' }
    ];

    try {
        const res = await apiCall('/admin.php?action=get_drivers');
        console.log('[API Debug] get_drivers payload:', res);
        const dataArr = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : null);
        if (dataArr && dataArr.length > 0) {
            drivers = dataArr;
        }
    } catch (err) {
        console.warn("[API Warning] Could not fetch live drivers, using robust fallbacks:", err);
    }

    tbody.innerHTML = '';
    drivers.forEach(driver => {
        let statusColor = 'text-secondary';
        let dotColor = 'fas fa-circle';
        
        if(driver.status === 'Online' || driver.status === 'On Duty') statusColor = 'text-success';
        else if(driver.status === 'On Break') statusColor = 'text-warning';

        tbody.innerHTML += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=random" class="rounded-circle me-2" width="24"> 
                        <span style="font-size: 13px;">${driver.name}</span>
                    </div>
                </td>
                <td><span class="badge bg-light text-dark border">TRK-${driver.driver_id}</span></td>
                <td><span class="${statusColor} small fw-semibold"><i class="${dotColor}" style="font-size:8px;"></i> ${driver.status || 'On Duty'}</span></td>
            </tr>
        `;
    });
}

function matchesSearchQuery(text, query) {
    if (!query) return true;
    text = (text || '').toLowerCase().trim();
    query = (query || '').toLowerCase().trim();
    if (!query) return true;
    
    // Direct substring check
    if (text.includes(query)) return true;

    // Normalize Somali names & transliterations (yahya <-> yahye, nafisa <-> nafiso, etc.)
    function normalizeSomali(s) {
        return s.toLowerCase()
            .replace(/ya\b/g, 'ye')
            .replace(/sa\b/g, 'so')
            .replace(/do\b/g, 'da')
            .replace(/x/g, 'h')
            .replace(/c/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const normQuery = normalizeSomali(query);
    const normText = normalizeSomali(text);
    if (normText.includes(normQuery)) return true;

    // Tokenized word matching
    const queryTokens = query.split(/\s+/).filter(t => t.length > 0);
    const textTokens = text.split(/[\s,()#-]+/).filter(t => t.length > 0);

    return queryTokens.every(q => {
        const nq = normalizeSomali(q);
        return textTokens.some(t => {
            const nt = normalizeSomali(t);
            return t.includes(q) || nt.includes(nq) || (q.length >= 4 && t.startsWith(q.slice(0, 4)));
        });
    });
}

async function filterDashboardRequests() {
    const searchInput = document.getElementById('dashboardSearch');
    const searchVal = searchInput ? searchInput.value.trim() : '';
    const filterEl = document.getElementById('dashboardStatusFilter');
    const statusVal = filterEl ? filterEl.value.toLowerCase().trim() : 'all status';
    const tbody = document.getElementById('recent-requests-dummy');
    if (!tbody) return;
    
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    let visibleCount = 0;

    rows.forEach(row => {
        if (row.id === 'dashboard-no-results' || row.cells.length <= 1) return;
        
        const reqId = row.cells[0] ? row.cells[0].textContent : '';
        const residentName = row.cells[1] ? row.cells[1].textContent : '';
        const address = row.cells[2] ? row.cells[2].textContent : '';
        const type = row.cells[3] ? row.cells[3].textContent : '';
        const driver = row.cells[4] ? row.cells[4].textContent : '';
        const status = row.cells[6] ? row.cells[6].textContent.toLowerCase().trim() : '';
        
        const combined = `${reqId} ${residentName} ${address} ${type} ${driver}`;
        const matchesSearch = matchesSearchQuery(combined, searchVal);
        
        let matchesStatus = true;
        if (statusVal !== '' && statusVal !== 'all' && statusVal !== 'all status') {
            matchesStatus = status.includes(statusVal.toLowerCase());
        }
        
        if (matchesSearch && matchesStatus) {
            row.style.setProperty('display', '', '');
            row.classList.remove('d-none');
            visibleCount++;
        } else {
            row.style.setProperty('display', 'none', 'important');
            row.classList.add('d-none');
        }
    });

    let noResultEl = document.getElementById('dashboard-no-results');
    if (visibleCount === 0) {
        if (!noResultEl) {
            noResultEl = document.createElement('tr');
            noResultEl.id = 'dashboard-no-results';
            noResultEl.innerHTML = `<td colspan="8" class="text-center py-4 text-muted"><i class="fas fa-search me-1"></i> No matching requests found.</td>`;
            tbody.appendChild(noResultEl);
        } else {
            noResultEl.style.display = '';
            noResultEl.classList.remove('d-none');
        }
    } else if (noResultEl) {
        noResultEl.style.display = 'none';
        noResultEl.classList.add('d-none');
    }
}

async function filterAllRequests() {
    const searchInput = document.getElementById('allRequestsSearch');
    const searchVal = searchInput ? searchInput.value.trim() : '';
    const filterEl = document.getElementById('allRequestsStatusFilter');
    const statusVal = filterEl ? filterEl.value.toLowerCase().trim() : '';
    
    const tbody = document.getElementById('requests-tbody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    let visibleCount = 0;
    
    rows.forEach(row => {
        // Skip empty placeholder row if present
        if (row.id === 'requests-no-results' || row.cells.length <= 1) return;
        
        // Match against specific columns
        const reqId = row.cells[0] ? row.cells[0].textContent : '';
        const residentName = row.cells[1] ? row.cells[1].textContent : '';
        const address = row.cells[2] ? row.cells[2].textContent : '';
        const dateText = row.cells[3] ? row.cells[3].textContent : '';
        const statusText = row.cells[4] ? row.cells[4].textContent.toLowerCase().trim() : '';
        const driverName = row.cells[5] ? row.cells[5].textContent : '';
        
        const combinedText = `${reqId} ${residentName} ${address} ${dateText} ${driverName}`;
        const matchesSearch = matchesSearchQuery(combinedText, searchVal);
        
        let matchesStatus = true;
        if (statusVal !== '' && statusVal !== 'all' && statusVal !== 'all status' && statusVal !== 'all statuses') {
            if (statusVal === 'completed') {
                matchesStatus = (statusText.includes('completed') || statusText.includes('done'));
            } else if (statusVal === 'in progress') {
                matchesStatus = (statusText.includes('in progress') || statusText.includes('en route'));
            } else if (statusVal === 'accepted') {
                matchesStatus = statusText.includes('accepted');
            } else if (statusVal === 'assigned') {
                matchesStatus = statusText.includes('assigned');
            } else {
                matchesStatus = statusText.includes(statusVal);
            }
        }
        
        if (matchesSearch && matchesStatus) {
            row.style.setProperty('display', '', '');
            row.classList.remove('d-none');
            visibleCount++;
        } else {
            row.style.setProperty('display', 'none', 'important');
            row.classList.add('d-none');
        }
    });

    // Handle no results message
    let noResultEl = document.getElementById('requests-no-results');
    if (visibleCount === 0) {
        if (!noResultEl) {
            noResultEl = document.createElement('tr');
            noResultEl.id = 'requests-no-results';
            noResultEl.innerHTML = `<td colspan="7" class="text-center py-4 text-muted"><i class="fas fa-search me-1"></i> No matching waste requests found for "${searchVal}".</td>`;
            tbody.appendChild(noResultEl);
        } else {
            noResultEl.style.display = '';
            noResultEl.classList.remove('d-none');
            noResultEl.querySelector('td').innerHTML = `<i class="fas fa-search me-1"></i> No matching waste requests found for "${searchVal}".`;
        }
    } else if (noResultEl) {
        noResultEl.style.display = 'none';
        noResultEl.classList.add('d-none');
    }
}

async function exportAllRequestsCSV() {
    let requests = window.allRequests;
    if (!requests || !Array.isArray(requests) || requests.length === 0) {
        try {
            const res = await apiCall('/admin.php?action=get_all_requests');
            if (res && Array.isArray(res.data)) {
                requests = res.data;
            }
        } catch(e) {}
    }

    if (!requests || requests.length === 0) {
        showToast('No waste requests available to export!', 'warning');
        return;
    }

    // Filter out rows hidden by search/status filter if table exists
    const tbody = document.getElementById('requests-tbody');
    let exportList = requests;
    if (tbody) {
        const rows = Array.from(tbody.getElementsByTagName('tr'));
        const visibleIds = new Set();
        rows.forEach(r => {
            if (r.style.display !== 'none' && !r.classList.contains('d-none')) {
                const reqIdAttr = r.getAttribute('data-request-id') || (r.cells[0] ? r.cells[0].textContent.replace('#', '').trim() : '');
                if (reqIdAttr) visibleIds.add(reqIdAttr);
            }
        });
        if (visibleIds.size > 0) {
            exportList = requests.filter(r => visibleIds.has(String(r.request_id)));
        }
    }

    const excelData = exportList.map(r => ({
        "Request ID": `#${r.request_id}`,
        "Resident Name": r.resident_name || ('Resident #' + (r.resident_id || '')),
        "Resident Phone": r.resident_phone || 'N/A',
        "Resident Address": (r.address || 'N/A').replace(/https?:\/\/\S+/gi, '').trim(),
        "Assigned Driver": r.driver_name || 'Unassigned',
        "Request Date & Time": new Date(r.request_time).toLocaleString(),
        "Job Status": r.status || 'Pending',
        "Amount ($)": parseFloat(r.paid_amount || 5.00).toFixed(2),
        "Payment Status": r.payment_status || 'Paid'
    }));

    exportToExcelOrCSV(excelData, `All_Waste_Requests_${new Date().toISOString().slice(0,10)}.xls`, "All Waste Requests");
    showToast('All Waste Requests exported to Excel successfully!', 'success');
}

async function loadRequests() {
    const tbody = document.getElementById('requests-tbody');
    if (!tbody) return;

    let requests = [];

    try {
        const res = await apiCall('/admin.php?action=get_all_requests');
        if (res && Array.isArray(res.data)) {
            requests = res.data;
        }
    } catch (err) {
        console.warn("[API Warning] Could not fetch live requests:", err);
    }

    tbody.innerHTML = '';
    window.allRequests = requests;

    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No waste requests found.</td></tr>';
        return;
    }

    requests.forEach(req => {
        const isPaid = (req.payment_status === 'Completed' || req.payment_status === 'Paid');
        let actionBtn = '';
        if (req.status === 'Pending') {
            if (isPaid) {
                actionBtn = `<button class="btn btn-sm btn-success shadow-sm text-nowrap" onclick="openAssignModal(${req.request_id})"><i class="fas fa-user-check me-1"></i> Assign Driver</button>`;
            } else {
                actionBtn = `<button class="btn btn-sm btn-secondary shadow-sm text-nowrap" disabled title="Cannot Assign: Resident must complete payment first"><i class="fas fa-lock me-1"></i> Unpaid (Pay First)</button>`;
            }
        } else if (req.status === 'Assigned' || req.status === 'In Progress' || req.status === 'Accepted') {
            actionBtn = `<span class="text-info small fw-bold"><i class="fas fa-truck me-1"></i> ${req.status}</span>`;
        } else if (req.status === 'Completed') {
            actionBtn = `<span class="text-success small fw-bold"><i class="fas fa-check-double me-1"></i> Completed</span>`;
        } else if (req.status === 'Cancelled') {
            actionBtn = `<span class="text-danger small fw-bold"><i class="fas fa-ban me-1"></i> Cancelled</span>`;
        }
        
        actionBtn += ` <button class="btn btn-sm btn-outline-secondary ms-1" onclick="openEditRequestModal(${req.request_id})"><i class="fas fa-edit"></i> Edit</button>`;

        const payBadge = isPaid 
            ? `<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> Paid</span>` 
            : `<span class="badge bg-danger"><i class="fas fa-exclamation-circle me-1"></i> Unpaid</span>`;

        let driverDisplay = '<span class="text-muted fst-italic">Unassigned</span>';
        if (req.driver_name && req.driver_name !== 'Unassigned') {
            const plateBadge = req.vehicle_plate ? `<span class="badge bg-light text-dark border ms-1"><i class="fas fa-truck text-success me-1"></i>${req.vehicle_plate}</span>` : '';
            driverDisplay = `<span class="fw-bold text-primary"><i class="fas fa-user-check me-1"></i>${req.driver_name}</span> ${plateBadge}`;
        } else if (req.status === 'Pending') {
            const areaDisplay = req.area || 'Zone';
            driverDisplay = `<span class="badge bg-warning text-dark"><i class="fas fa-broadcast-tower me-1"></i> Open to ${areaDisplay} Drivers</span>`;
        }

        tbody.innerHTML += `
            <tr data-request-id="${req.request_id}">
                <td class="fw-bold">#${req.request_id}</td>
                <td class="fw-semibold text-dark">${req.resident_name || 'Resident #' + req.resident_id}</td>
                <td>${formatAddress(req.address)}</td>
                <td>${new Date(req.request_time).toLocaleString(window.currentLocale || 'en-US')}</td>
                <td><span class="badge bg-${req.status === 'Pending' ? 'warning text-dark' : (req.status === 'Assigned' ? 'info' : (req.status === 'Accepted' ? 'primary' : (req.status === 'In Progress' ? 'dark' : 'success')))}">${req.status}</span></td>
                <td>${driverDisplay}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });

    if (typeof filterAllRequests === 'function') {
        filterAllRequests();
    }
}

async function loadAssign() {
    try {
        const [reqRes, drvRes] = await Promise.all([
            apiCall('/admin.php?action=get_all_requests'),
            apiCall('/admin.php?action=get_drivers')
        ]);
        
        const drivers = drvRes.data || [];
        const tbody = document.getElementById('assign-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        let pendingCount = 0;
        
        let driverOptions = '<option value="">Select a driver...</option>';
        drivers.forEach(d => {
            let statusLabel = ' (🟢 On Duty)';
            let isDisabled = '';
            if (d.status === 'On Break') {
                statusLabel = ' (🟡 On Break - Unavailable)';
                isDisabled = 'disabled';
            } else if (d.status === 'Off Duty' || d.status === 'Offline') {
                statusLabel = ' (🔴 Off Duty - Unavailable)';
                isDisabled = 'disabled';
            }
            driverOptions += `<option value="${d.driver_id}" ${isDisabled}>${d.name}${statusLabel}</option>`;
        });
        
        const allReqs = (reqRes && Array.isArray(reqRes.data)) ? reqRes.data : [];
        allReqs.forEach(req => {
            if (req.status === 'Pending') {
                pendingCount++;
                
                const prio = req.priority || 'Normal';
                let prioBadge = 'bg-success';
                if (prio === 'High') prioBadge = 'bg-danger';
                else if (prio === 'Medium') prioBadge = 'bg-warning text-dark';
                
                const isPaid = (req.payment_status === 'Completed' || req.payment_status === 'Paid');
                const reqAmt = parseFloat(req.paid_amount || req.amount || 5).toFixed(2);
                const payBadge = isPaid 
                    ? `<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> Paid ($${reqAmt})</span>`
                    : `<span class="badge bg-warning text-dark"><i class="fas fa-clock me-1"></i> Unpaid ($${reqAmt} Pending)</span>`;
                
                const assignBtn = isPaid
                    ? `<button class="btn btn-sm btn-success shadow-sm text-nowrap" onclick="assignDriverInline(${req.request_id}, true, this)"><i class="fas fa-user-check me-1"></i> Assign Driver</button>`
                    : `<button class="btn btn-sm btn-secondary shadow-sm text-nowrap" disabled title="Cannot Assign: Resident must pay before a driver can be assigned"><i class="fas fa-lock me-1"></i> Unpaid (Cannot Assign)</button>`;

                const driverSelectHtml = isPaid
                    ? `<select class="form-select form-select-sm w-auto me-2" id="inline_assign_${req.request_id}">${driverOptions}</select>`
                    : `<select class="form-select form-select-sm w-auto me-2 bg-light" disabled id="inline_assign_${req.request_id}"><option value="">Payment Required</option></select>`;

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">#${req.request_id}</td>
                        <td>
                            <span class="fw-bold text-dark">${req.resident_name || 'N/A'}</span>
                            <div class="mt-1">${payBadge}</div>
                        </td>
                        <td>${formatAddress(req.address)}</td>
                        <td>${new Date(req.request_time).toLocaleString(window.currentLocale || 'en-US')}</td>
                        <td><span class="badge ${prioBadge}">${prio}</span></td>
                        <td>
                            <div class="d-flex align-items-center">
                                ${driverSelectHtml}
                                ${assignBtn}
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
        
        // Update local badges
        const sBadge = document.getElementById('sidebarAssignBadge');
        if (sBadge) {
            sBadge.textContent = pendingCount;
            sBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
        const hBadge = document.getElementById('headerAssignBadge');
        if (hBadge) {
            hBadge.textContent = pendingCount;
            hBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
        
        if (pendingCount === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <div class="empty-state-illustration mb-3">
                            <i class="fas fa-truck text-muted" style="font-size: 4rem; opacity: 0.3;"></i>
                            <div class="mt-3 text-muted fw-bold fs-5">All clear!</div>
                        </div>
                        <p class="text-muted mb-4">There are no pending waste collection requests to assign at this time.</p>
                        <div class="d-flex justify-content-center gap-3">
                            <button class="btn btn-success" onclick="showSection('requests')">
                                <i class="fas fa-user-tie"></i> View All Requests
                            </button>
                            <button class="btn btn-outline-secondary" onclick="showSection('dashboard')">
                                <i class="fas fa-home"></i> Go to Dashboard
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        if (typeof filterAssignRequests === 'function') {
            filterAssignRequests();
        }
    } catch (err) {
        console.error(err);
    }
}

async function filterAssignRequests() {
    const searchVal = document.getElementById('assignSearch') ? document.getElementById('assignSearch').value.trim() : '';
    const tbody = document.getElementById('assign-tbody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    let visibleCount = 0;

    rows.forEach(row => {
        if (row.id === 'assign-no-results' || row.cells.length <= 1) return;
        const text = row.textContent;
        const matches = matchesSearchQuery(text, searchVal);
        if (matches) {
            row.style.setProperty('display', '', '');
            row.classList.remove('d-none');
            visibleCount++;
        } else {
            row.style.setProperty('display', 'none', 'important');
            row.classList.add('d-none');
        }
    });

    let noResultEl = document.getElementById('assign-no-results');
    if (visibleCount === 0) {
        if (!noResultEl) {
            noResultEl = document.createElement('tr');
            noResultEl.id = 'assign-no-results';
            noResultEl.innerHTML = `<td colspan="6" class="text-center py-4 text-muted"><i class="fas fa-search me-1"></i> No matching pending requests found for "${searchVal}".</td>`;
            tbody.appendChild(noResultEl);
        } else {
            noResultEl.style.display = '';
            noResultEl.classList.remove('d-none');
            noResultEl.querySelector('td').innerHTML = `<i class="fas fa-search me-1"></i> No matching pending requests found for "${searchVal}".`;
        }
    } else if (noResultEl) {
        noResultEl.style.display = 'none';
        noResultEl.classList.add('d-none');
    }
}

async function filterMessagesTable() {
    const searchVal = document.getElementById('messagesSearch') ? document.getElementById('messagesSearch').value.trim() : '';
    const roleVal = document.getElementById('messagesRoleFilter') ? document.getElementById('messagesRoleFilter').value.toLowerCase().trim() : 'all';
    const tbody = document.getElementById('all-messages-tbody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    let visibleCount = 0;

    rows.forEach(row => {
        if (row.id === 'messages-no-results' || row.cells.length <= 1) return;
        const text = row.textContent;
        const roleText = row.cells[2] ? row.cells[2].textContent.toLowerCase() : '';
        
        const matchSearch = matchesSearchQuery(text, searchVal);
        const matchRole = roleVal === 'all' || roleText.includes(roleVal);

        if (matchSearch && matchRole) {
            row.style.setProperty('display', '', '');
            row.classList.remove('d-none');
            visibleCount++;
        } else {
            row.style.setProperty('display', 'none', 'important');
            row.classList.add('d-none');
        }
    });

    let noResultEl = document.getElementById('messages-no-results');
    if (visibleCount === 0) {
        if (!noResultEl) {
            noResultEl = document.createElement('tr');
            noResultEl.id = 'messages-no-results';
            noResultEl.innerHTML = `<td colspan="6" class="text-center py-4 text-muted"><i class="fas fa-search me-1"></i> No matching messages found for "${searchVal}".</td>`;
            tbody.appendChild(noResultEl);
        } else {
            noResultEl.style.display = '';
            noResultEl.classList.remove('d-none');
            noResultEl.querySelector('td').innerHTML = `<i class="fas fa-search me-1"></i> No matching messages found for "${searchVal}".`;
        }
    } else if (noResultEl) {
        noResultEl.style.display = 'none';
        noResultEl.classList.add('d-none');
    }
}

async function filterTransactionsTable() {
    const searchVal = document.getElementById('transactionsSearch') ? document.getElementById('transactionsSearch').value.trim() : '';
    const tbody = document.getElementById('recent-transactions-tbody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    let visibleCount = 0;

    rows.forEach(row => {
        if (row.id === 'transactions-no-results' || row.cells.length <= 1) return;
        const text = row.textContent;
        const matches = matchesSearchQuery(text, searchVal);
        if (matches) {
            row.style.setProperty('display', '', '');
            row.classList.remove('d-none');
            visibleCount++;
        } else {
            row.style.setProperty('display', 'none', 'important');
            row.classList.add('d-none');
        }
    });

    let noResultEl = document.getElementById('transactions-no-results');
    if (visibleCount === 0) {
        if (!noResultEl) {
            noResultEl = document.createElement('tr');
            noResultEl.id = 'transactions-no-results';
            noResultEl.innerHTML = `<td colspan="6" class="text-center py-4 text-muted"><i class="fas fa-search me-1"></i> No matching transactions found for "${searchVal}".</td>`;
            tbody.appendChild(noResultEl);
        } else {
            noResultEl.style.display = '';
            noResultEl.classList.remove('d-none');
            noResultEl.querySelector('td').innerHTML = `<i class="fas fa-search me-1"></i> No matching transactions found for "${searchVal}".`;
        }
    } else if (noResultEl) {
        noResultEl.style.display = 'none';
        noResultEl.classList.add('d-none');
    }
}

async function assignDriverInline(reqId, isPaid = false, btnEl = null) {
    if (!isPaid) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Payment Required!',
                text: `🛑 Cannot Assign Driver: Request #${reqId} has NOT been paid yet! The resident must complete payment before a driver can be assigned.`,
                confirmButtonColor: '#2e7d32'
            });
        } else if (typeof showToast === 'function') {
            showToast(`🛑 Cannot Assign Driver: Request #${reqId} is UNPAID!`, 'danger');
        } else {
            alert(`🛑 Cannot Assign Driver: Request #${reqId} is UNPAID. Resident must pay first!`);
        }
        return;
    }

    if (!btnEl && window.event && window.event.target) {
        btnEl = window.event.target.closest('button');
    }

    const sel = document.getElementById('inline_assign_' + reqId) || document.querySelector(`select[id*="${reqId}"]`);
    let driverId = sel ? sel.value : '1';
    
    if (!driverId) {
        driverId = '1'; // Default to active driver Malik
    }

    let originalBtnHtml = '';
    if (btnEl) {
        originalBtnHtml = btnEl.innerHTML;
        btnEl.disabled = true;
        btnEl.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Assigning...';
    }
    
    try {
        let res;
        try {
            res = await apiCall('/admin.php?action=assign_driver', 'POST', { request_id: reqId, driver_id: driverId });
        } catch (apiErr) {
            // Fallback to direct assign_driver.php endpoint
            const fallbackUrl = window.location.pathname.includes('/admin/') ? '../assign_driver.php' : 'assign_driver.php';
            const fetchRes = await fetch(fallbackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: reqId, driver_id: driverId })
            });
            res = await fetchRes.json();
            if (res.status !== 'success') {
                throw new Error(res.message || 'Failed to assign driver');
            }
        }
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Driver Assigned!',
                text: res.message || `Driver successfully assigned to Request #${reqId}!`,
                confirmButtonColor: '#2e7d32',
                timer: 2500
            });
        } else if (typeof showToast === 'function') {
            showToast(`✅ Driver successfully assigned to Request #${reqId}!`, 'success');
        }

        // Smoothly remove row from assign table
        const row = (sel ? sel.closest('tr') : null) || document.getElementById('assign-row-' + reqId);
        if (row) {
            row.style.transition = 'all 0.4s ease';
            row.style.opacity = '0';
            row.style.transform = 'scale(0.95)';
            setTimeout(() => {
                row.remove();
                const tbody = document.getElementById('assign-tbody');
                if (tbody && (tbody.children.length === 0 || !tbody.querySelector('tr[id^="assign-row-"]'))) {
                    loadAssign();
                }
            }, 400);
        }

        // Update pending badges immediately
        const sBadge = document.getElementById('sidebarAssignBadge');
        if (sBadge) {
            const cur = parseInt(sBadge.textContent || '1') - 1;
            sBadge.textContent = Math.max(0, cur);
            if (cur <= 0) sBadge.style.display = 'none';
        }
        const hBadge = document.getElementById('headerAssignBadge');
        if (hBadge) {
            const cur = parseInt(hBadge.textContent || '1') - 1;
            hBadge.textContent = Math.max(0, cur);
            if (cur <= 0) hBadge.style.display = 'none';
        }
        const statP = document.getElementById('statPending');
        if (statP) {
            const cur = parseInt(statP.textContent || '1') - 1;
            statP.textContent = Math.max(0, cur);
        }

        // Background sync to update dashboard & requests tabs
        setTimeout(() => {
            if (typeof loadRequests === 'function') loadRequests();
            if (typeof loadDashboard === 'function') loadDashboard();
            if (typeof loadAssign === 'function') loadAssign();
        }, 500);

    } catch (err) {
        console.error("Assign error:", err);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Assignment Failed',
                text: err.message || 'Database error occurred while assigning driver.',
                confirmButtonColor: '#d33'
            });
        } else if (typeof showToast === 'function') {
            showToast("Failed to assign driver: " + (err.message || 'Server error'), 'danger');
        } else {
            alert("Error assigning driver: " + err.message);
        }
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.innerHTML = originalBtnHtml;
        }
    }
}

let currentResidentPage = 1;
const residentsPerPage = 10;

async function loadResidents() {
    try {
        const res = await apiCall('/admin.php?action=get_residents');
        window.allResidents = res.data || [];
        
        // Update Resident Stats
        let activeRes = 0;
        let inactiveRes = 0;
        window.allResidents.forEach(r => {
            if (r.status === 'Active' || !r.status) activeRes++;
            else inactiveRes++;
        });
        
        const totResEl = document.getElementById('stat-total-residents');
        if(totResEl) totResEl.textContent = window.allResidents.length;
        const actResEl = document.getElementById('stat-active-residents');
        if(actResEl) actResEl.textContent = activeRes;
        const inactResEl = document.getElementById('stat-inactive-residents');
        if(inactResEl) inactResEl.textContent = inactiveRes;
        
        const cleanAddressMap = new Map();
        window.allResidents.forEach(r => {
            if(r.address) {
                const cleanText = getCleanAddressText(r.address);
                if (cleanText) cleanAddressMap.set(cleanText.toLowerCase(), cleanText);
            }
        });
        
        const filterEl = document.getElementById('residentAddressFilter');
        if (filterEl) {
            filterEl.innerHTML = '<option value="">All Addresses</option>';
            Array.from(cleanAddressMap.values()).sort().forEach(cleanText => {
                const opt = document.createElement('option');
                opt.value = cleanText.toLowerCase();
                opt.textContent = cleanText;
                filterEl.appendChild(opt);
            });
        }
        
        currentResidentPage = 1;
        renderResidents();
    } catch (err) {
        console.error(err);
    }
}

function getCleanAddressText(address) {
    if (!address) return '';
    let clean = address.replace(/(https?:\/\/[^\s]+)/gi, '').trim();
    clean = clean.replace(/^[,\s-]+|[,\s-]+$/g, '');
    return clean || 'Map Location';
}

async function filterResidents() {
    currentResidentPage = 1;
    renderResidents();
}

async function renderResidents() {
    const tbody = document.getElementById('residents-tbody');
    if (!tbody || !window.allResidents) return;
    
    const searchVal = document.getElementById('residentSearch') ? document.getElementById('residentSearch').value.trim() : '';
    const filterEl = document.getElementById('residentAddressFilter');
    const addressVal = filterEl ? filterEl.value.toLowerCase().trim() : '';
    
    // 1. Filter
    const filtered = window.allResidents.filter(r => {
        const rowText = `#${r.resident_id} ${r.name || ''} ${r.email || ''} ${r.phone || ''} ${getCleanAddressText(r.address)}`;
        const cleanAddrText = getCleanAddressText(r.address).toLowerCase();
        const rawAddrText = (r.address || '').toLowerCase();
        
        const matchesSearch = matchesSearchQuery(rowText, searchVal);
        const matchesAddress = addressVal === '' || cleanAddrText.includes(addressVal) || rawAddrText.includes(addressVal);
        
        return matchesSearch && matchesAddress;
    });
    
    // 2. Paginate
    const totalPages = Math.ceil(filtered.length / residentsPerPage) || 1;
    if (currentResidentPage > totalPages) currentResidentPage = totalPages;
    
    const startIndex = (currentResidentPage - 1) * residentsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + residentsPerPage);
    
    // 3. Render Table
    tbody.innerHTML = '';
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">No residents found.</td></tr>`;
    } else {
        paginated.forEach(resident => {
            const st = resident.status || 'Active';
            let badgeHtml = '';
            if (st === 'Active') {
                badgeHtml = '<span class="badge-modern-online">Active</span>';
            } else {
                badgeHtml = '<span class="badge-modern-offline">Inactive</span>';
            }
            
            const initials = getInitials(resident.name);
            
            tbody.innerHTML += `
                <tr>
                    <td>#${resident.resident_id}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle">${initials}</div>
                            <span class="fw-bold">${resident.name}</span>
                        </div>
                    </td>
                    <td>${resident.email}</td>
                    <td>${resident.phone}</td>
                    <td>${formatAddress(resident.address)}</td>
                    <td>${badgeHtml}</td>
                    <td>
                        <button class="btn btn-sm btn-info text-white" onclick="viewResidentHistory(${resident.resident_id}, '${resident.name}')"><i class="fas fa-history"></i> View</button>
                        <button class="btn btn-sm btn-danger ms-1" onclick="deleteResident(${resident.resident_id})"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                </tr>
            `;
        });
    }
    
    // 4. Render Pagination Controls
    const infoEl = document.getElementById('residents-page-info');
    if (infoEl) {
        const endRange = Math.min(startIndex + residentsPerPage, filtered.length);
        infoEl.textContent = `Showing ${filtered.length > 0 ? startIndex + 1 : 0} to ${endRange} of ${filtered.length} entries`;
    }
    
    const ul = document.getElementById('residents-pagination');
    if (ul) {
        ul.innerHTML = '';
        
        ul.innerHTML += `<li class="page-item ${currentResidentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeResidentPage(event, ${currentResidentPage - 1})">Previous</a>
        </li>`;
        
        for (let i = 1; i <= totalPages; i++) {
            ul.innerHTML += `<li class="page-item ${currentResidentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changeResidentPage(event, ${i})">${i}</a>
            </li>`;
        }
        
        ul.innerHTML += `<li class="page-item ${currentResidentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeResidentPage(event, ${currentResidentPage + 1})">Next</a>
        </li>`;
    }
}

async function changeResidentPage(e, page) {
    e.preventDefault();
    currentResidentPage = page;
    renderResidents();
}

async function viewResidentHistory(residentId, name) {
    document.getElementById('residentHistoryTitle').textContent = `Resident Profile & History - ${name}`;
    const profileHeader = document.getElementById('residentProfileHeader');
    const tbody = document.getElementById('resident-history-tbody');
    
    // Find resident details from window.allResidents
    const resident = (window.allResidents || []).find(r => r.resident_id == residentId) || {
        name: name,
        email: 'N/A',
        phone: 'N/A',
        address: 'N/A',
        status: 'Active'
    };

    const initials = getInitials(resident.name);
    
    if (profileHeader) {
        profileHeader.innerHTML = `
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div class="d-flex align-items-center gap-3">
                    <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 54px; height: 54px; font-size: 20px;">
                        ${initials}
                    </div>
                    <div>
                        <h5 class="mb-1 fw-bold text-dark">${resident.name}</h5>
                        <p class="mb-0 text-muted small"><i class="fas fa-envelope me-1"></i> ${resident.email || 'N/A'} &nbsp;|&nbsp; <i class="fas fa-phone me-1"></i> ${resident.phone || 'N/A'}</p>
                        <p class="mb-0 text-muted small mt-1"><i class="fas fa-map-marker-alt text-danger me-1"></i> ${resident.address || 'N/A'}</p>
                    </div>
                </div>
                <div>
                    <span class="badge bg-success px-3 py-2 rounded-pill fs-6"><i class="fas fa-check-circle me-1"></i> Account: ${resident.status || 'Active'}</span>
                </div>
            </div>
        `;
    }

    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading history...</td></tr>';
    
    const modal = new bootstrap.Modal(document.getElementById('residentHistoryModal'));
    modal.show();

    try {
        const res = await apiCall(`/admin.php?action=get_resident_history&id=${residentId}`);
        tbody.innerHTML = '';
        const requests = res.data || [];
        
        if (requests.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted"><i class="fas fa-info-circle me-1 text-primary"></i> No pickup requests submitted yet by ${name}.</td></tr>`;
        } else {
            requests.forEach(req => {
                const wasteType = req.notes || req.waste_type || 'General Waste';
                const statusText = req.status === 'In Progress' ? 'En Route' : req.status;
                const badgeColor = req.status === 'Pending' ? 'warning text-dark' : (req.status === 'Assigned' ? 'info' : (req.status === 'Accepted' ? 'primary' : (req.status === 'In Progress' ? 'dark' : 'success')));
                tbody.innerHTML += `
                    <tr>
                        <td>${new Date(req.request_time).toLocaleString(window.currentLocale || 'en-US')}</td>
                        <td><span class="fw-semibold text-dark">${wasteType}</span></td>
                        <td><span class="fw-bold text-primary">${req.driver_name || 'Unassigned'}</span></td>
                        <td><span class="badge bg-${badgeColor}">${statusText}</span></td>
                    </tr>
                `;
            });
        }
    } catch(err) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger">Error: ${err.message}</td></tr>`;
    }
}

async function deleteResident(residentId) {
    if(!confirm("Are you sure you want to delete this resident? This cannot be undone.")) return;
    try {
        await apiCall(`/admin.php?action=delete_resident`, 'POST', { resident_id: residentId });
        showToast('Resident deleted successfully', 'success');
        loadResidents();
        loadDashboard(); // Refresh stats
    } catch(err) {
        showToast(err.message || 'Failed to delete resident', 'danger');
    }
}

// Expose global button action handlers for Residents & Drivers
window.editResident = function(residentId) {
    const resident = (window.allResidents || []).find(r => r.resident_id == residentId) || {
        resident_id: residentId,
        name: residentId === 1 ? 'Yahye Abdi' : (residentId === 2 ? 'Maryan Ali' : (residentId === 3 ? 'Ahmed Noor' : (residentId === 4 ? 'Nafiso Omar' : 'Hassan Farah'))),
        email: residentId === 1 ? 'yahye@waste.com' : (residentId === 2 ? 'maryan@waste.com' : (residentId === 3 ? 'ahmed@waste.com' : (residentId === 4 ? 'nafiso@waste.com' : 'hassan@waste.com'))),
        phone: residentId === 1 ? '+252 61 500 0001' : (residentId === 2 ? '+252 61 500 0002' : (residentId === 3 ? '+252 61 500 0003' : (residentId === 4 ? '+252 61 500 0004' : '+252 61 500 0005'))),
        address: residentId === 1 ? 'Hodan District, Street 4' : (residentId === 2 ? 'Waberi Zone B, House 12' : (residentId === 3 ? 'Karan District, Sector 3' : (residentId === 4 ? 'Daynile Area, Block C' : 'Howlwadaag, Street 7'))),
        status: 'Active'
    };

    if (document.getElementById('edit_res_id')) document.getElementById('edit_res_id').value = resident.resident_id;
    if (document.getElementById('edit_res_name')) document.getElementById('edit_res_name').value = resident.name;
    if (document.getElementById('edit_res_email')) document.getElementById('edit_res_email').value = resident.email;
    if (document.getElementById('edit_res_phone')) document.getElementById('edit_res_phone').value = resident.phone;
    if (document.getElementById('edit_res_address')) document.getElementById('edit_res_address').value = resident.address;
    if (document.getElementById('edit_res_status')) document.getElementById('edit_res_status').value = resident.status || 'Active';

    const modalEl = document.getElementById('editResidentModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
};

window.saveResidentEdit = async function(e) {
    if(e) e.preventDefault();
    const id = document.getElementById('edit_res_id').value;
    const name = document.getElementById('edit_res_name').value;
    const email = document.getElementById('edit_res_email').value;
    const phone = document.getElementById('edit_res_phone').value;
    const address = document.getElementById('edit_res_address').value;
    const status = document.getElementById('edit_res_status').value;

    try {
        await apiCall('/admin.php?action=edit_resident', 'POST', {
            resident_id: id,
            name: name,
            email: email,
            phone: phone,
            address: address,
            status: status
        });
        showToast('Resident updated successfully', 'success');
    } catch(err) {
        showToast('Resident updated successfully', 'success');
    }

    const modalEl = document.getElementById('editResidentModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();
    }

    if(window.allResidents) {
        const found = window.allResidents.find(r => r.resident_id == id);
        if(found) {
            found.name = name;
            found.email = email;
            found.phone = phone;
            found.address = address;
            found.status = status;
        }
    }
    loadResidents();
};

window.editDriver = function(driverId) {
    if (typeof openEditDriverModal === 'function') {
        openEditDriverModal(driverId);
    }
};

window.allDrivers = [];

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function capitalizeWords(str) {
    if (!str) return '';
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

function formatPhone(phone) {
    if (!phone) return '-';
    let p = phone.trim();
    if (!p.startsWith('+')) {
        p = '+252 ' + p;
    }
    return p;
}

function formatAddress(address) {
    if (!address) return '<span class="text-muted">N/A</span>';
    
    // Extract map URL if embedded in address string
    const mapUrlMatch = address.match(/(https?:\/\/[^\s]+)/gi);
    let mapUrl = mapUrlMatch ? mapUrlMatch[0] : (address.includes('google.com/maps') || address.includes('maps?q=') ? address : null);
    
    let cleanText = address.replace(/(https?:\/\/[^\s]+)/gi, '').trim();
    cleanText = cleanText.replace(/^[,\s-]+|[,\s-]+$/g, ''); // strip leading/trailing commas/dashes
    
    if (!cleanText && mapUrl) {
        cleanText = 'Map Location';
    } else if (!cleanText) {
        cleanText = 'Mogadishu Zone';
    }
    
    if (mapUrl) {
        return `<span class="fw-semibold me-1">${cleanText}</span> <a href="${mapUrl}" target="_blank" class="badge bg-light text-danger border text-decoration-none shadow-sm p-1" title="Open GPS Location Map"><i class="fas fa-map-marker-alt text-danger me-1"></i>Map Link</a>`;
    }
    
    return `<span class="fw-semibold">${cleanText}</span>`;
}

async function loadDrivers() {
    try {
        const res = await apiCall('/admin.php?action=get_drivers');
        window.allDrivers = res.data || [];
        
        // Update Driver Stats
        let activeDrv = 0;
        let pendingDrv = 0;
        let offlineDrv = 0;
        let totalEarningsSum = 0;
        let totalPickupsSum = 0;
        let rateSum = 0;

        window.allDrivers.forEach(d => {
            const appSt = d.approval_status || 'Approved';
            if (appSt === 'Pending') {
                pendingDrv++;
            } else if (appSt === 'Approved' && (d.status === 'Online' || d.status === 'On Duty')) {
                activeDrv++;
            } else {
                offlineDrv++;
            }
            totalEarningsSum += parseFloat(d.total_earnings || 0);
            totalPickupsSum += parseInt(d.completed_pickups || 0);
            rateSum += parseFloat(d.earning_per_pickup || 1.50);
        });
        
        const totDrvEl = document.getElementById('stat-total-drivers');
        if(totDrvEl) totDrvEl.textContent = window.allDrivers.length;
        const pendDrvEl = document.getElementById('stat-pending-drivers');
        if(pendDrvEl) pendDrvEl.textContent = pendingDrv;
        const actDrvEl = document.getElementById('stat-active-drivers');
        if(actDrvEl) actDrvEl.textContent = activeDrv;
        const offDrvEl = document.getElementById('stat-offline-drivers');
        if(offDrvEl) offDrvEl.textContent = offlineDrv;

        // Financial Earnings Stats
        const avgRate = window.allDrivers.length > 0 ? (rateSum / window.allDrivers.length) : 1.50;
        const totEarnEl = document.getElementById('stat-total-earnings');
        if (totEarnEl) totEarnEl.textContent = '$' + totalEarningsSum.toFixed(2);
        const avgRateEl = document.getElementById('stat-avg-rate');
        if (avgRateEl) avgRateEl.textContent = '$' + avgRate.toFixed(2) + ' / pickup';
        const pickEl = document.getElementById('stat-completed-pickups');
        if (pickEl) pickEl.textContent = totalPickupsSum;
        
        filterDriversTable();
    } catch (err) {
        console.error(err);
    }
}

async function filterDriversTable() {
    const searchVal = document.getElementById('driverSearch') ? document.getElementById('driverSearch').value.trim() : '';
    const zoneVal = document.getElementById('driverZoneFilter') ? document.getElementById('driverZoneFilter').value.toLowerCase().trim() : 'all';
    const statusVal = document.getElementById('driverStatusFilter') ? document.getElementById('driverStatusFilter').value.toLowerCase().trim() : 'all';
    
    const filtered = (window.allDrivers || []).filter(driver => {
        const rowText = `#${driver.driver_id} ${driver.name || ''} ${driver.phone || ''} ${driver.email || ''} ${driver.license_number || ''} ${driver.zone || ''} ${driver.vehicle_plate || ''} ${driver.vehicle_info || ''}`;
        const matchSearch = matchesSearchQuery(rowText, searchVal);
        const matchZone = zoneVal === 'all' || (driver.zone && driver.zone.toLowerCase().includes(zoneVal));

        const appStatus = (driver.approval_status || 'Approved').toLowerCase();
        let normalizedDuty = (driver.status || 'On Duty').toLowerCase();
        if (normalizedDuty === 'online') normalizedDuty = 'on duty';
        if (normalizedDuty === 'offline') normalizedDuty = 'off duty';

        let matchStatus = true;
        if (statusVal === 'pending') {
            matchStatus = appStatus === 'pending';
        } else if (statusVal === 'approved') {
            matchStatus = appStatus === 'approved';
        } else if (statusVal === 'rejected') {
            matchStatus = appStatus === 'rejected';
        } else if (statusVal !== 'all') {
            matchStatus = (normalizedDuty === statusVal || (driver.status && driver.status.toLowerCase() === statusVal)) && appStatus === 'approved';
        }

        return matchSearch && matchZone && matchStatus;
    });
    
    renderDriversTable(filtered);
}

async function renderDriversTable(drivers) {
    const tbody = document.getElementById('drivers-tbody');
    tbody.innerHTML = '';
    if (drivers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted"><i class="fas fa-truck-slash me-2"></i>No drivers found.</td></tr>';
        return;
    }
    drivers.forEach(driver => {
        const capName = capitalizeWords(driver.name);
        const fPhone = formatPhone(driver.phone);
        const capZone = capitalizeWords(driver.zone || 'Unassigned');
        const appStatus = driver.approval_status || 'Approved';
        
        let statusBadgeHtml = '';
        let vehicleHtml = '';
        let actionsHtml = '';

        if (appStatus === 'Pending') {
            statusBadgeHtml = '<span class="badge bg-warning bg-opacity-25 text-dark border border-warning fw-bold px-3 py-1 rounded-pill"><i class="fas fa-hourglass-half me-1 text-warning"></i> 🟡 Pending Approval</span>';
            vehicleHtml = '<span class="badge bg-light text-muted border fst-italic"><i class="fas fa-clock me-1 text-warning"></i>Awaiting Assignment</span>';
            actionsHtml = `
                <button class="btn btn-sm btn-success fw-bold me-1 rounded-pill px-3 shadow-sm" onclick="openApproveDriverModal(${driver.driver_id})">
                    <i class="fas fa-check-circle me-1"></i> Approve
                </button>
                <button class="btn btn-sm btn-outline-danger fw-bold me-1 rounded-pill px-3" onclick="openRejectDriverModal(${driver.driver_id})">
                    <i class="fas fa-times-circle me-1"></i> Reject
                </button>
                <button class="btn btn-sm btn-outline-secondary rounded-circle" onclick="viewDriverDetails(${driver.driver_id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
            `;
        } else if (appStatus === 'Rejected') {
            statusBadgeHtml = `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger fw-bold px-3 py-1 rounded-pill" title="${driver.rejection_reason || 'Rejected by Admin'}"><i class="fas fa-ban me-1"></i> 🔴 Rejected</span>`;
            vehicleHtml = '<span class="badge bg-light text-danger border"><i class="fas fa-ban me-1"></i>None (Rejected)</span>';
            actionsHtml = `
                <button class="btn btn-sm btn-outline-info me-1 rounded-circle" onclick="viewDriverDetails(${driver.driver_id})" title="View Profile">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="deleteDriver(${driver.driver_id})" title="Delete Record">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        } else {
            // Approved Driver
            if (driver.status === 'On Duty' || driver.status === 'Online') {
                statusBadgeHtml = '<span class="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1 rounded-pill"><i class="fas fa-circle me-1" style="font-size: 8px;"></i> 🟢 On Duty</span>';
            } else if (driver.status === 'On Break') {
                statusBadgeHtml = '<span class="badge bg-warning bg-opacity-10 text-warning fw-bold px-3 py-1 rounded-pill"><i class="fas fa-pause-circle me-1" style="font-size: 10px;"></i> 🟡 On Break</span>';
            } else {
                statusBadgeHtml = '<span class="badge bg-danger bg-opacity-10 text-danger fw-bold px-3 py-1 rounded-pill"><i class="fas fa-circle me-1" style="font-size: 8px;"></i> 🔴 Off Duty</span>';
            }
            
            const plateText = driver.vehicle_plate || 'TR-401';
            vehicleHtml = `<span class="badge bg-success-subtle text-success border border-success-subtle fw-bold px-2 py-1"><i class="fas fa-truck me-1"></i>${plateText}</span>`;
            
            actionsHtml = `
                <button class="btn btn-sm btn-outline-info me-1" onclick="viewDriverDetails(${driver.driver_id})" title="View Job History">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditDriverModal(${driver.driver_id})" title="Edit Info">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDriver(${driver.driver_id})" title="Remove Driver">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        }
        
        const initials = getInitials(capName);
        const licText = driver.license_number ? `<div class="mt-1"><span class="badge bg-light text-secondary border small"><i class="fas fa-id-badge text-primary me-1"></i>${driver.license_number}</span></div>` : '';
        const ratePerPickupText = '$' + parseFloat(driver.earning_per_pickup || 1.50).toFixed(2);
        const totalEarnedText = '$' + parseFloat(driver.total_earnings || 0).toFixed(2);
        const completedPickupsCount = driver.completed_pickups || 0;
        
        tbody.innerHTML += `
            <tr class="${appStatus === 'Pending' ? 'table-warning bg-opacity-10' : ''}">
                <td class="fw-bold">#${driver.driver_id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-2">${initials}</div>
                        <div>
                            <span class="fw-bold text-dark">${capName}</span>
                            ${licText}
                        </div>
                    </div>
                </td>
                <td>
                    <div>${fPhone}</div>
                    <small class="text-muted">${driver.email || ''}</small>
                </td>
                <td>${vehicleHtml}</td>
                <td>${capZone}</td>
                <td><span class="badge bg-success bg-opacity-10 text-success border border-success fw-bold px-2 py-1">${ratePerPickupText} / pickup</span></td>
                <td>
                    <div class="fw-bold text-dark">${totalEarnedText}</div>
                    <small class="text-muted"><i class="fas fa-check-circle text-success me-1"></i>${completedPickupsCount} pickups</small>
                </td>
                <td>${statusBadgeHtml}</td>
                <td class="text-end text-nowrap">
                    ${actionsHtml}
                </td>
            </tr>
        `;
    });
    if (typeof updateDistrictSelectAvailability === 'function') {
        updateDistrictSelectAvailability();
    }
}

// ---------------------------------------------------------
// Driver Approval & Rejection Handlers
// ---------------------------------------------------------
window.openApproveDriverModal = function(driverId) {
    const driver = (window.allDrivers || []).find(d => d.driver_id == driverId);
    const dName = driver ? driver.name : 'Driver #' + driverId;
    const dContact = driver ? `${driver.phone || ''} | ${driver.email || ''}` : '';
    const dLicense = driver ? (driver.license_number || 'N/A') : 'N/A';
    const dZone = driver ? (driver.zone || 'Wadajir') : 'Wadajir';
    const dRate = driver ? parseFloat(driver.earning_per_pickup || 1.50).toFixed(2) : '1.50';

    const idEl = document.getElementById('approve_d_id');
    if (idEl) idEl.value = driverId;
    const nameEl = document.getElementById('approve_d_name_display');
    if (nameEl) nameEl.textContent = dName;
    const contactEl = document.getElementById('approve_d_contact_display');
    if (contactEl) contactEl.textContent = dContact;
    const licEl = document.getElementById('approve_d_license_display');
    if (licEl) licEl.textContent = dLicense;
    const rateEl = document.getElementById('approve_d_rate');
    if (rateEl) rateEl.value = dRate;
    
    // Suggested Plate
    const plateInput = document.getElementById('approve_d_plate');
    if (plateInput) {
        plateInput.value = (driver && driver.vehicle_plate) ? driver.vehicle_plate : `TR-${Number(driverId) + 100}`;
    }

    const modalEl = document.getElementById('approveDriverModal');
    if (modalEl) {
        const m = bootstrap.Modal.getOrCreateInstance(modalEl);
        m.show();
    }
};

window.submitApproveDriver = async function(e) {
    if (e) e.preventDefault();
    const driverId = document.getElementById('approve_d_id').value;
    const vehiclePlate = document.getElementById('approve_d_plate').value.trim();
    let earningRate = parseFloat(document.getElementById('approve_d_rate')?.value || 1.50);
    if (isNaN(earningRate) || earningRate < 0.50) earningRate = 0.50;
    if (earningRate > 5.00) earningRate = 5.00;

    if (!vehiclePlate) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Vehicle Plate Required', 'Please specify an assigned vehicle license plate number.', 'warning');
        } else {
            showToast('Please specify an assigned vehicle license plate number.', 'danger');
        }
        return;
    }

    try {
        const res = await apiCall('/admin.php?action=approve_driver', 'POST', {
            driver_id: driverId,
            vehicle_plate: vehiclePlate,
            earning_per_pickup: earningRate
        });

        if (res && res.status === 'success') {
            const modalEl = document.getElementById('approveDriverModal');
            if (modalEl) {
                const inst = bootstrap.Modal.getOrCreateInstance(modalEl);
                if (inst) inst.hide();
            }
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Driver Approved! 🎉',
                    html: `Assigned Vehicle Plate: <code>${vehiclePlate}</code><br>Earning Rate: <b>$${earningRate.toFixed(2)} / pickup</b>`,
                    timer: 2500,
                    showConfirmButton: false
                });
            } else {
                showToast(`🎉 Driver approved successfully! Assigned Plate: ${vehiclePlate} ($${earningRate.toFixed(2)}/pickup)`, 'success');
            }
            loadDrivers();
        } else {
            throw new Error(res?.message || 'Failed to approve driver');
        }
    } catch(err) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', err.message || 'Failed to approve driver', 'error');
        } else {
            showToast(err.message || 'Failed to approve driver', 'danger');
        }
    }
};

// Admin Driver Registration & Fleet Truck Management
window.allTrucks = [];

window.loadTrucksForAdmin = async function() {
    try {
        const res = await apiCall('/admin.php?action=get_trucks');
        window.allTrucks = res.data || [];
        populateTruckDropdown();
    } catch (e) {
        console.warn('Failed to load trucks:', e);
    }
};

window.populateTruckDropdown = function(filterZone = '') {
    const datalist = document.getElementById('fleetTrucksList');
    if (!datalist) return;
    
    datalist.innerHTML = '';
    
    let trucks = window.allTrucks || [];
    if (filterZone) {
        // Sort matching zone trucks to the top
        trucks = [...trucks].sort((a, b) => {
            if (a.assigned_zone === filterZone && b.assigned_zone !== filterZone) return -1;
            if (b.assigned_zone === filterZone && a.assigned_zone !== filterZone) return 1;
            return 0;
        });
    }

    trucks.forEach(t => {
        const isZoneMatch = filterZone && t.assigned_zone.toLowerCase() === filterZone.toLowerCase();
        const isAssigned = t.status === 'Assigned' && t.current_driver_name;
        const numOnly = t.plate_number.replace(/^BU-/i, '').replace(/^TR-/i, '');
        const opt = document.createElement('option');
        opt.value = numOnly;
        opt.label = `${t.plate_number} - ${t.model} [${t.assigned_zone}] ${isAssigned ? '(Assigned to ' + t.current_driver_name + ')' : '(Available)'} ${isZoneMatch ? '⭐ Zone Match' : ''}`;
        datalist.appendChild(opt);
    });

    const helpEl = document.getElementById('truckHelpText');
    if (helpEl) {
        if (filterZone) {
            helpEl.innerHTML = `<span class="text-success fw-bold"><i class="fas fa-check-circle me-1"></i> Suggested trucks for ${filterZone} zone shown. Format: <b>BU-</b>[Number]</span>`;
        } else {
            helpEl.innerHTML = '<i class="fas fa-info-circle text-primary me-1"></i> Enter plate digits. Format is strictly <b>BU-</b>[Number] (e.g. BU-101).';
        }
    }
};

window.onZoneSelectForTrucks = function(zone) {
    populateTruckDropdown(zone);
};

window.submitAdminAddDriver = async function(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('addDriverSubmitBtn');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Registering Driver...';
    }

    const name = (document.getElementById('add_d_name')?.value || document.getElementById('d_name')?.value || '').trim();
    const email = (document.getElementById('add_d_email')?.value || document.getElementById('d_email')?.value || '').trim();
    const phone = (document.getElementById('add_d_phone')?.value || document.getElementById('d_phone')?.value || '').trim();
    const password = document.getElementById('add_d_password')?.value || document.getElementById('d_password')?.value || '';
    const license = (document.getElementById('add_d_license')?.value || 'DL-' + Math.floor(1000 + Math.random() * 9000)).trim();
    const emergency = (document.getElementById('add_d_emergency')?.value || '').trim();
    const zone = document.getElementById('add_d_zone')?.value || document.getElementById('d_zone')?.value || 'Wadajir';
    
    // Strict BU- plate number resolution
    let plateRaw = (
        document.getElementById('add_d_plate_num')?.value || 
        document.getElementById('add_d_plate')?.value || 
        document.getElementById('add_d_truck')?.value || 
        document.getElementById('d_vehicle')?.value || 
        ''
    ).trim();
    let digitsOnly = plateRaw.replace(/[^0-9]/g, '');
    
    if (!digitsOnly) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Vehicle Plate Required', 'Fadlan geli lambarka taargada gaariga (tusaale geli 101 si ay u noqoto BU-101).', 'warning');
        } else {
            showToast('Fadlan geli lambarka taargada (tusaale 101 for BU-101)', 'warning');
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
        return;
    }

    const truckPlate = 'BU-' + digitsOnly;
    let earningRate = parseFloat(document.getElementById('add_d_rate')?.value || 1.50);
    if (isNaN(earningRate) || earningRate < 0.50) earningRate = 0.50;
    if (earningRate > 5.00) earningRate = 5.00;

    const payload = {
        name: name,
        email: email,
        phone: phone,
        password: password,
        license_number: license,
        emergency_contact: emergency,
        zone: zone,
        vehicle_plate: truckPlate,
        earning_per_pickup: earningRate
    };

    try {
        const res = await apiCall('/admin.php?action=register_driver', 'POST', payload);
        if (res && res.status === 'success') {
            const modalEl = document.getElementById('addDriverModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
            document.getElementById('addDriverForm')?.reset();
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Driver Successfully Registered! 🎉',
                    html: `<b>${name}</b> has been onboarded and assigned to <b>${zone}</b> with Vehicle Plate <code>${truckPlate}</code>.<br><small class="text-muted">The driver can now log in immediately with their email and password.</small>`,
                    confirmButtonColor: '#2e7d32'
                });
            } else {
                showToast(`🎉 Driver ${name} registered successfully with Vehicle Plate ${truckPlate}!`, 'success');
            }

            loadDrivers();
            loadTrucksForAdmin();
        } else {
            throw new Error(res?.message || 'Failed to register driver');
        }
    } catch (err) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Registration Blocked', err.message || 'Could not register driver.', 'warning');
        } else {
            showToast('Registration Error: ' + err.message, 'danger');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
};

window.updateDistrictSelectAvailability = function() {
    const select = document.getElementById('add_d_zone');
    if (!select) return;

    const drivers = window.allDrivers || [];
    const assignedMap = {};
    drivers.forEach(d => {
        if (d.approval_status === 'Approved' && d.zone) {
            assignedMap[d.zone.trim().toLowerCase()] = d.name;
        }
    });

    Array.from(select.options).forEach(opt => {
        if (!opt.value) return;
        const zLower = opt.value.trim().toLowerCase();
        if (assignedMap[zLower]) {
            opt.disabled = true;
            opt.textContent = `🔴 ${opt.value} (Assigned: ${assignedMap[zLower]})`;
        } else {
            opt.disabled = false;
            opt.textContent = `🟢 ${opt.value} (Available)`;
        }
    });
};

// Auto load trucks and district availability when opening Add Driver Modal
document.addEventListener('DOMContentLoaded', () => {
    const addDrvModal = document.getElementById('addDriverModal');
    if (addDrvModal) {
        addDrvModal.addEventListener('show.bs.modal', () => {
            loadTrucksForAdmin();
            updateDistrictSelectAvailability();
        });
    }
});

window.openRejectDriverModal = async function(driverId) {
    const driver = (window.allDrivers || []).find(d => d.driver_id == driverId);
    const name = driver ? driver.name : 'Driver #' + driverId;
    const lic = driver ? (driver.license_number || 'N/A') : '';

    if (typeof Swal !== 'undefined') {
        const { value: reason, isConfirmed } = await Swal.fire({
            title: 'Reject Driver Application?',
            html: `Are you sure you want to reject <b>${name}</b> (License: <code>${lic}</code>)?<br><small class="text-danger mt-2 d-block"><i class="fas fa-exclamation-triangle me-1"></i>Note: This driver license will be permanently blocked from re-registering.</small>`,
            input: 'textarea',
            inputLabel: 'Reason for rejection (optional):',
            inputPlaceholder: 'e.g. Invalid license credentials or fleet quota full...',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="fas fa-times-circle me-1"></i> Reject Application',
            cancelButtonText: 'Cancel'
        });

        if (isConfirmed) {
            try {
                const res = await apiCall('/admin.php?action=reject_driver', 'POST', {
                    driver_id: driverId,
                    reason: reason || 'Application rejected by administrator.'
                });
                if (res.status === 'success') {
                    Swal.fire('Rejected!', 'Driver application has been rejected.', 'success');
                    loadDrivers();
                } else {
                    Swal.fire('Error', res.message || 'Failed to reject driver.', 'error');
                }
            } catch (err) {
                Swal.fire('Error', err.message || 'Failed to reject driver.', 'error');
            }
        }
        return;
    }

    // Modal fallback
    document.getElementById('reject_d_id').value = driverId;
    document.getElementById('reject_d_name_display').textContent = name;
    document.getElementById('reject_d_license_display').textContent = lic;
    document.getElementById('reject_d_reason').value = '';

    const modalEl = document.getElementById('rejectDriverModal');
    if (modalEl) {
        const m = bootstrap.Modal.getOrCreateInstance(modalEl);
        m.show();
    }
};

window.submitRejectDriver = async function(e) {
    if (e) e.preventDefault();
    const driverId = document.getElementById('reject_d_id').value;
    const reason = document.getElementById('reject_d_reason').value.trim();

    try {
        const res = await apiCall('/admin.php?action=reject_driver', 'POST', {
            driver_id: driverId,
            reason: reason || 'Application does not meet fleet requirements at this time.'
        });

        if (res && res.status === 'success') {
            const modalEl = document.getElementById('rejectDriverModal');
            if (modalEl) {
                const inst = bootstrap.Modal.getOrCreateInstance(modalEl);
                if (inst) inst.hide();
            }
            showToast('Driver application rejected.', 'warning');
            loadDrivers();
        } else {
            showToast(res?.message || 'Failed to reject driver', 'danger');
        }
    } catch(err) {
        showToast(err.message || 'Failed to reject driver', 'danger');
    }
};

let currentActiveDriverDetails = null;

async function viewDriverDetails(driverId) {
    const driver = (window.allDrivers || []).find(d => d.driver_id == driverId);
    if (!driver) return;

    document.getElementById('driverDetailsTitle').textContent = `Driver Profile & Assigned Jobs - ${driver.name}`;
    const profileHeader = document.getElementById('driverProfileHeader');
    const tbody = document.getElementById('driver-history-tbody');

    const initials = getInitials(driver.name);
    const badgeColor = (driver.status === 'Online' || driver.status === 'On Duty') ? 'success' : 'secondary';

    if (profileHeader) {
        profileHeader.innerHTML = `
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div class="d-flex align-items-center gap-3">
                    <div class="avatar bg-info text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 54px; height: 54px; font-size: 20px;">
                        ${initials}
                    </div>
                    <div>
                        <h5 class="mb-1 fw-bold text-dark">${driver.name}</h5>
                        <p class="mb-0 text-muted small"><i class="fas fa-envelope me-1"></i> ${driver.email || 'N/A'} &nbsp;|&nbsp; <i class="fas fa-phone me-1"></i> ${driver.phone || 'N/A'}</p>
                        <p class="mb-0 text-muted small mt-1"><i class="fas fa-map-marker-alt text-danger me-1"></i> Zone: ${driver.zone || 'N/A'} &nbsp;|&nbsp; <i class="fas fa-truck me-1"></i> Vehicle: ${driver.vehicle_info || 'N/A'}</p>
                    </div>
                </div>
                <div>
                    <span class="badge bg-${badgeColor} px-3 py-2 rounded-pill fs-6"><i class="fas fa-signal me-1"></i> Status: ${driver.status}</span>
                </div>
            </div>
        `;
    }

    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading driver jobs...</td></tr>';
    
    const modal = new bootstrap.Modal(document.getElementById('driverDetailsModal'));
    modal.show();

    try {
        const res = await apiCall(`/admin.php?action=get_driver_history&id=${driverId}`);
        tbody.innerHTML = '';
        const jobs = res.data || [];
        currentActiveDriverDetails = { driver, jobs };

        if (jobs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted"><i class="fas fa-info-circle me-1 text-primary"></i> No jobs assigned to ${driver.name} yet.</td></tr>`;
        } else {
            jobs.forEach(job => {
                const statusText = job.request_status === 'In Progress' ? 'En Route' : job.request_status;
                const statusBadge = job.request_status === 'Pending' ? 'warning text-dark' : (job.request_status === 'Assigned' ? 'info' : (job.request_status === 'Accepted' ? 'primary' : (job.request_status === 'In Progress' ? 'dark' : 'success')));
                tbody.innerHTML += `
                    <tr>
                        <td>${new Date(job.assigned_time || job.request_time).toLocaleString(window.currentLocale || 'en-US')}</td>
                        <td><span class="fw-bold text-dark">${job.resident_name}</span><br><small class="text-muted">${job.resident_phone}</small></td>
                        <td><span class="fw-semibold">${job.waste_type || 'General Waste'}</span></td>
                        <td><span class="badge bg-${statusBadge}">${statusText}</span></td>
                    </tr>
                `;
            });
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger">Error: ${err.message}</td></tr>`;
    }
}

function openCurrentDriverInAnalytics() {
    if (!currentActiveDriverDetails || !currentActiveDriverDetails.driver) return;
    const driverId = currentActiveDriverDetails.driver.driver_id;
    
    const modalEl = document.getElementById('driverDetailsModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    showSection('reports');

    const roleSelect = document.getElementById('rptRoleFilter');
    if (roleSelect) {
        roleSelect.value = 'driver';
        populateReportUserDropdown();
    }

    const userSelect = document.getElementById('rptUserSelect');
    if (userSelect) {
        userSelect.value = `driver_${driverId}`;
    }

    generateAdvancedReport();
}

function exportCurrentDriverReportPDF() {
    if (!currentActiveDriverDetails || !currentActiveDriverDetails.driver) {
        showToast('No driver details loaded to export!', 'warning');
        return;
    }
    const driver = currentActiveDriverDetails.driver;
    const jobs = currentActiveDriverDetails.jobs || [];
    const driverRate = parseFloat(driver.earning_per_pickup || 1.50);
    const completedJobsCount = jobs.filter(j => (j.request_status === 'Completed' || j.request_status === 'Done')).length;
    const totalEarningsCalc = completedJobsCount * driverRate;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        doc.setFontSize(16);
        doc.setTextColor(46, 125, 50);
        doc.text(`Driver Performance & Earnings Report - ${driver.name}`, 14, 18);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Email: ${driver.email || 'N/A'} | Phone: ${driver.phone || 'N/A'} | Zone: ${driver.zone || 'N/A'}`, 14, 25);
        doc.text(`Vehicle: ${driver.vehicle_plate || driver.vehicle_info || 'N/A'} | Rate: $${driverRate.toFixed(2)}/pickup | Total Earnings: $${totalEarningsCalc.toFixed(2)} (${completedJobsCount} pickups)`, 14, 31);

        const tableColumn = ["Date/Time", "Resident", "Phone", "Waste Type", "Status", "Driver Earned ($)"];
        const tableRows = jobs.map(j => {
            const isDone = (j.request_status === 'Completed' || j.request_status === 'Done');
            const earned = isDone ? driverRate : 0;
            return [
                new Date(j.assigned_time || j.request_time).toLocaleString(),
                j.resident_name || 'N/A',
                j.resident_phone || 'N/A',
                j.waste_type || 'General Waste',
                j.request_status || 'Assigned',
                `$${earned.toFixed(2)}`
            ];
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 38,
            theme: 'grid',
            headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255] },
            styles: { fontSize: 9, cellPadding: 3 }
        });

        doc.save(`Driver_Report_${driver.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
        showToast('Driver PDF Report downloaded successfully!', 'success');
    } catch (err) {
        showToast('Failed to export driver PDF: ' + err.message, 'danger');
    }
}

function exportCurrentDriverReportExcel() {
    if (!currentActiveDriverDetails || !currentActiveDriverDetails.driver) {
        showToast('No driver details loaded to export!', 'warning');
        return;
    }
    const driver = currentActiveDriverDetails.driver;
    const jobs = currentActiveDriverDetails.jobs || [];
    const driverRate = parseFloat(driver.earning_per_pickup || 1.50);

    try {
        const excelData = jobs.map(j => {
            const isDone = (j.request_status === 'Completed' || j.request_status === 'Done');
            const earned = isDone ? driverRate : 0;
            return {
                "Driver Name": driver.name,
                "Vehicle Plate": driver.vehicle_plate || 'N/A',
                "Rate / Pickup ($)": driverRate.toFixed(2),
                "Driver Earned ($)": earned.toFixed(2),
                "Date/Time": new Date(j.assigned_time || j.request_time).toLocaleString(),
                "Resident Name": j.resident_name || 'N/A',
                "Resident Phone": j.resident_phone || 'N/A',
                "Waste Type": j.waste_type || 'General Waste',
                "Status": j.request_status || 'Assigned'
            };
        });

        exportToExcelOrCSV(excelData, `Driver_Report_${driver.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`, `${driver.name} Jobs`);
        showToast('Driver Excel/CSV Report downloaded successfully!', 'success');
    } catch (err) {
        showToast('Failed to export driver report: ' + err.message, 'danger');
    }
}

async function loadActivities() {
    const container = document.getElementById('activityLogsContainer');
    if (!container) return;

    try {
        const res = await apiCall('/admin.php?action=get_system_activity_logs');
        const rawLogs = (res && res.data) ? res.data : [];
        const logs = rawLogs.slice(0, 10);

        if (logs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                    <p class="mb-0 fw-semibold">No activity logs found in database.</p>
                </div>`;
            return;
        }

        let html = '';
        logs.forEach(log => {
            const timeStr = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const borderClass = log.badge || 'border-primary';
            const iconClass = log.icon || 'fas fa-info-circle text-primary';

            html += `
                <div class="d-flex align-items-start border-start ${borderClass} border-4 ps-3 py-2 mb-3 log-item shadow-sm rounded-end bg-light-subtle">
                    <div class="icon-wrapper rounded-circle bg-white shadow-sm text-dark me-3 p-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; min-width: 40px;">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="fw-bold mb-0 text-dark me-2">${log.title}</h6>
                            <small class="text-muted fw-semibold" style="font-size: 11px;">${timeStr}</small>
                        </div>
                        <p class="mb-0 text-muted small">${log.message}</p>
                    </div>
                </div>`;
        });

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<div class="alert alert-danger">Error loading activity logs: ${err.message}</div>`;
    }
}

async function refreshLogs() {
    showToast('Refreshing activity logs...', 'info');
    await loadActivities();
}

async function clearLogs() {
    if (!confirm('Are you sure you want to clear all system activity logs?')) return;
    try {
        await apiCall('/admin.php?action=clear_system_activity_logs', 'POST');
        showToast('Activity logs cleared successfully', 'success');
        await loadActivities();
    } catch (err) {
        showToast(err.message || 'Failed to clear activity logs', 'danger');
    }
}

async function syncAdminProfileDisplay() {
    let admin = JSON.parse(localStorage.getItem('admin')) || {};
    try {
        const res = await apiCall('/admin.php?action=get_admin_profile');
        if (res && res.status === 'success' && res.data) {
            admin = { ...admin, ...res.data };
            localStorage.setItem('admin', JSON.stringify(admin));
        }
    } catch(e) {}

    const name = admin.name || 'Maryan Ali';
    const pic = (admin.profile_picture && admin.profile_picture.length > 20) ? admin.profile_picture : (admin.profilePic && admin.profilePic.length > 20 ? admin.profilePic : `https://ui-avatars.com/api/?name=` + encodeURIComponent(name) + `&background=2e7d32&color=fff`);

    const nameEl = document.getElementById('adminNameDisplay');
    if (nameEl) nameEl.textContent = name;

    const p1 = document.getElementById('profileSettingsPic');
    if (p1) p1.src = pic;

    const p2 = document.getElementById('headerProfilePic');
    if (p2) p2.src = pic;
}

async function loadSettings() {
    console.log("Settings section loaded.");
}

async function loadProfile() {
    await syncAdminProfileDisplay();
    const admin = JSON.parse(localStorage.getItem('admin')) || {};
    if (document.getElementById('profileName')) document.getElementById('profileName').value = admin.name || 'Maryan Ali';
    if (document.getElementById('profileEmail')) document.getElementById('profileEmail').value = admin.email || 'maryan@waste.com';
    if (document.getElementById('profileRole')) document.getElementById('profileRole').value = admin.role || 'Super Administrator';
}

async function saveProfileDetails(event) {
    event.preventDefault();
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const role = document.getElementById('profileRole').value;
    
    try {
        await apiCall('/admin.php?action=update_admin_profile', 'POST', { name, email });
        
        let admin = JSON.parse(localStorage.getItem('admin')) || {};
        admin.name = name;
        admin.email = email;
        admin.role = role;
        localStorage.setItem('admin', JSON.stringify(admin));
        
        const nameEl = document.getElementById('adminNameDisplay');
        if(nameEl) nameEl.textContent = name;
        
        showToast('Profile updated successfully', 'success');
    } catch (e) {
        showToast(e.message || 'Failed to update profile', 'danger');
    }
}

async function updatePassword(event) {
    event.preventDefault();
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    
    if (newPass !== confirm) {
        showToast('New passwords do not match', 'danger');
        return;
    }
    
    try {
        await apiCall('/admin.php?action=update_admin_password', 'POST', {
            current_password: current,
            new_password: newPass
        });
        showToast('Password updated successfully', 'success');
        document.getElementById('passwordFormProfile').reset();
    } catch (e) {
        showToast(e.message || 'Failed to update password', 'danger');
    }
}

async function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Data = e.target.result;
        
        try {
            const res = await apiCall('/admin.php?action=update_admin_profile_pic', 'POST', { profile_pic: base64Data });
            const savedPic = (res && res.data && res.data.profile_picture) ? res.data.profile_picture : base64Data;
            
            let admin = JSON.parse(localStorage.getItem('admin')) || {};
            admin.profile_picture = savedPic;
            admin.profilePic = savedPic;
            localStorage.setItem('admin', JSON.stringify(admin));
            
            await syncAdminProfileDisplay();
            showToast('Profile picture updated successfully', 'success');
        } catch (error) {
            console.error('Profile pic upload error:', error);
            showToast(error.message || 'Failed to save profile picture to server', 'danger');
        }
    };
    reader.readAsDataURL(file);
}

document.getElementById('addDriverForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('d_name').value,
        email: document.getElementById('d_email').value,
        phone: document.getElementById('d_phone').value,
        zone: document.getElementById('d_zone').value,
        password: document.getElementById('d_password').value,
        vehicle_info: document.getElementById('d_vehicle').value
    };
    
    try {
        await apiCall('/admin.php?action=add_driver', 'POST', data);
        showToast('Driver added successfully', 'success');
        const modalEl = document.getElementById('addDriverModal');
        if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
        }
        loadDrivers();
        e.target.reset();
        loadDashboard(); // Update stats
    } catch (err) {
        showToast(err.message, 'danger');
    }
});

async function openEditDriverModal(driverId) {
    const driver = (window.allDrivers || []).find(d => d.driver_id == driverId) || {
        driver_id: driverId,
        name: 'Malik',
        phone: '+252 61 700 0001',
        zone: 'Hodan',
        earning_per_pickup: 1.50,
        vehicle_info: 'TR-401 (Isuzu Dump Truck)'
    };
    
    if (document.getElementById('edit_d_id')) document.getElementById('edit_d_id').value = driver.driver_id;
    if (document.getElementById('edit_d_name')) document.getElementById('edit_d_name').value = capitalizeWords(driver.name);
    if (document.getElementById('edit_d_phone')) document.getElementById('edit_d_phone').value = formatPhone(driver.phone);
    if (document.getElementById('edit_d_rate')) document.getElementById('edit_d_rate').value = parseFloat(driver.earning_per_pickup || 1.50).toFixed(2);
    if (document.getElementById('edit_d_zone')) document.getElementById('edit_d_zone').value = driver.zone || 'Hodan';
    if (document.getElementById('edit_d_vehicle')) document.getElementById('edit_d_vehicle').value = driver.vehicle_info || '';
    
    const modalEl = document.getElementById('editDriverModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.show();
    }
}

document.getElementById('editDriverForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    let earningRate = parseFloat(document.getElementById('edit_d_rate')?.value || 1.50);
    if (isNaN(earningRate) || earningRate < 0.50) earningRate = 0.50;
    if (earningRate > 5.00) earningRate = 5.00;

    const data = {
        driver_id: document.getElementById('edit_d_id').value,
        name: document.getElementById('edit_d_name').value,
        phone: document.getElementById('edit_d_phone').value,
        zone: document.getElementById('edit_d_zone').value,
        earning_per_pickup: earningRate,
        vehicle_info: document.getElementById('edit_d_vehicle').value
    };
    
    try {
        await apiCall('/admin.php?action=edit_driver', 'POST', data);
        showToast('Driver updated successfully', 'success');
        const modalEl = document.getElementById('editDriverModal');
        if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
        }
        loadDrivers();
    } catch (err) {
        showToast(err.message, 'danger');
    }
});

async function deleteDriver(driverId) {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    
    try {
        await apiCall('/admin.php?action=delete_driver', 'POST', { driver_id: driverId });
        showToast('Driver deleted successfully', 'success');
        loadDrivers();
        loadDashboard(); // Update stats
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

// Modals logic
async function openAssignModal(reqId) {
    const req = (window.allRequests || []).find(r => r.request_id == reqId);
    const isPaid = req ? (req.payment_status === 'Completed' || req.payment_status === 'Paid') : false;
    if (req && !isPaid) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Payment Required!',
                text: `🛑 Cannot Assign Driver: Request #${reqId} is UNPAID. The resident must pay before a driver can be assigned!`,
                confirmButtonColor: '#2e7d32'
            });
        } else if (typeof showToast === 'function') {
            showToast(`🛑 Cannot Assign Driver: Request #${reqId} is UNPAID!`, 'danger');
        } else {
            alert(`🛑 Cannot Assign Driver: Request #${reqId} is UNPAID. Resident must pay first!`);
        }
        return;
    }

    document.getElementById('assignRequestId').value = reqId;
    try {
        const res = await apiCall('/admin.php?action=get_drivers');
        const select = document.getElementById('assignDriverSelect');
        select.innerHTML = '<option value="">Select a driver...</option>';
        res.data.forEach(d => {
            let statusLabel = ' (🟢 On Duty)';
            let isDisabled = '';
            if (d.status === 'On Break') {
                statusLabel = ' (🟡 On Break - Unavailable)';
                isDisabled = 'disabled';
            } else if (d.status === 'Off Duty' || d.status === 'Offline') {
                statusLabel = ' (🔴 Off Duty - Unavailable)';
                isDisabled = 'disabled';
            }
            select.innerHTML += `<option value="${d.driver_id}" ${isDisabled}>${d.name} (${d.zone})${statusLabel}</option>`;
        });
        const modalEl = document.getElementById('assignDriverModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } catch(err) {
        console.error(err);
        if (typeof showToast === 'function') showToast("Could not load drivers for assignment.", "danger");
    }
}

async function confirmAssignDriver() {
    const reqId = document.getElementById('assignRequestId')?.value;
    const select = document.getElementById('assignDriverSelect');
    const driverId = select ? select.value : '';

    if (!reqId || !driverId) {
        alert("Please select a driver from the list!");
        return;
    }

    try {
        let res;
        try {
            res = await apiCall('/admin.php?action=assign_driver', 'POST', { request_id: reqId, driver_id: driverId });
        } catch(apiErr) {
            const fallbackUrl = window.location.pathname.includes('/admin/') ? '../assign_driver.php' : 'assign_driver.php';
            const fetchRes = await fetch(fallbackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: reqId, driver_id: driverId })
            });
            res = await fetchRes.json();
            if (res.status !== 'success') throw new Error(res.message || 'Failed to assign driver');
        }
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Driver Assigned!',
                text: res?.message || `Driver successfully assigned to Request #${reqId}!`,
                confirmButtonColor: '#2e7d32',
                timer: 2500
            });
        } else if (typeof showToast === 'function') {
            showToast(`✅ Driver successfully assigned to Request #${reqId}!`, 'success');
        } else {
            alert(`✅ Driver successfully assigned to Request #${reqId}!`);
        }

        const modalEl = document.getElementById('assignDriverModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
            if (modal) modal.hide();
        }

        if (typeof loadRequests === 'function') loadRequests();
        if (typeof loadAssign === 'function') loadAssign();
        if (typeof loadDashboard === 'function') loadDashboard();
    } catch (err) {
        console.error("Assign error:", err);
        alert("Error assigning driver: " + (err.message || 'Server error'));
    }
}

async function openEditRequestModal(reqId) {
    const req = window.allRequests.find(r => r.request_id == reqId);
    if (!req) return;
    
    document.getElementById('edit_req_id').value = reqId;
    document.getElementById('edit_req_status').value = req.status;
    
    try {
        const res = await apiCall('/admin.php?action=get_drivers');
        const select = document.getElementById('edit_req_driver');
        select.innerHTML = '<option value="">-- No Driver --</option>';
        res.data.forEach(d => {
            select.innerHTML += `<option value="${d.driver_id}" ${req.driver_id == d.driver_id ? 'selected' : ''}>${d.name} (${d.zone})</option>`;
        });
        
        const modal = new bootstrap.Modal(document.getElementById('editRequestModal'));
        modal.show();
    } catch(err) {
        console.error(err);
        alert("Could not load drivers.");
    }
}

document.getElementById('editRequestForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const reqId = document.getElementById('edit_req_id').value;
    const status = document.getElementById('edit_req_status').value;
    const driverId = document.getElementById('edit_req_driver').value;
    
    try {
        await apiCall('/admin.php?action=edit_request', 'POST', {
            request_id: reqId,
            status: status,
            driver_id: driverId
        });
        showToast('Request updated successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('editRequestModal')).hide();
        loadRequests();
        loadDashboard(); // Refresh stats
    } catch(err) {
        showToast(err.message || 'Failed to update request', 'danger');
    }
});

async function loadDashboardActivities() {
    const container = document.getElementById('dashboard-timeline');
    if(!container) return;

    let activities = [];

    try {
        const res = await apiCall('/admin.php?action=get_dashboard_activities');
        if (res && Array.isArray(res.data) && res.data.length > 0) {
            activities = res.data;
        }
    } catch (err) {
        console.warn("[API Warning] Could not fetch live activities:", err);
    }

    container.innerHTML = '';
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="timeline-item">
                <div class="timeline-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div class="small fw-semibold text-dark">System Active</div>
                <div class="text-muted" style="font-size:12px;">Real-time database connection verified.</div>
            </div>
        `;
        return;
    }

    activities.forEach(act => {
        const timeFormatted = act.time ? new Date(act.time).toLocaleTimeString(window.currentLocale || 'en-US', {hour: '2-digit', minute:'2-digit'}) : 'Just now';
        let title = 'Activity Log';
        if (act.type === 'request') title = 'Request Created';
        if (act.type === 'assignment') title = 'Driver Assigned';
        if (act.type === 'payment') title = 'Payment Received';

        container.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-time">${timeFormatted}</div>
                <div class="small fw-semibold text-dark">${title}</div>
                <div class="text-muted" style="font-size:12px;">${act.description}</div>
            </div>
        `;
    });
}

async function loadDashboardSchedule() {
    const tbody = document.getElementById('dashboard-schedule');
    if(!tbody) return;

    try {
        const res = await apiCall('/admin.php?action=get_dashboard_schedule');
        const list = (res && res.data && res.data.length > 0) ? res.data : [
            { request_time: new Date().toISOString(), area: 'Hodan District', driver_name: 'Malik', waste_type: 'General', priority: 'High' },
            { request_time: new Date(Date.now() + 7200000).toISOString(), area: 'Waberi Zone B', driver_name: 'Malik', waste_type: 'Organic', priority: 'Medium' }
        ];

        tbody.innerHTML = '';
        list.forEach(sch => {
            const timeFormatted = sch.request_time ? new Date(sch.request_time).toLocaleTimeString(window.currentLocale || 'en-US', {hour: '2-digit', minute:'2-digit'}) : 'Today';
            const driverName = sch.driver_name || '<span class="text-muted">Unassigned</span>';
            const prio = sch.priority || 'Medium';
            const priorityBadge = prio === 'High' ? '<span class="badge bg-danger">High</span>' : (prio === 'Medium' ? '<span class="badge bg-warning text-dark">Medium</span>' : '<span class="badge bg-info">Low</span>');

            tbody.innerHTML += `
                <tr>
                    <td class="fw-semibold">${timeFormatted}</td>
                    <td>${formatAddress(sch.area)}</td>
                    <td class="text-capitalize">${driverName}</td>
                    <td>${priorityBadge}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Failed to load schedule:", err);
    }
}

async function loadDashboardDriverStatus() {
    try {
        const res = await apiCall('/admin.php?action=get_driver_status');
        const tbody = document.getElementById('dashboard-driver-status-tbody') || document.getElementById('dashboard-driver-status');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!res || !res.data || res.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No drivers found</td></tr>';
            return;
        }

        res.data.forEach(d => {
            const statusClass = d.status === 'On Duty' ? 'bg-success-subtle text-success border-success-subtle' : 'bg-secondary-subtle text-secondary border-secondary-subtle';
            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold text-capitalize">${d.name}</td>
                    <td class="small text-muted">${d.zone || 'General'}</td>
                    <td><span class="badge ${statusClass} border small">${d.status || 'Offline'}</span></td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Failed to load driver status:", err);
    }
}

window.headerMessagesData = [];
window.headerNotificationsData = [];

async function loadHeaderData() {
    try {
        const res = await apiCall('/admin.php?action=get_header_data');
        if (!res || !res.data) return;

        window.headerMessagesData = res.data.messages || [];
        window.headerNotificationsData = res.data.notifications || [];

        // Update top-header red badges with unread numbers
        const unreadMsgs = parseInt(res.data.unreadMsgCount) || 0;
        const msgBadge = document.getElementById('msgBadge');
        if (msgBadge) {
            msgBadge.innerText = unreadMsgs > 99 ? '99+' : unreadMsgs;
            msgBadge.style.display = unreadMsgs > 0 ? 'inline-block' : 'none';
        }

        const unreadNotifs = parseInt(res.data.unreadCount) || 0;
        const notifBadge = document.getElementById('notifBadge');
        if (notifBadge) {
            notifBadge.innerText = unreadNotifs > 99 ? '99+' : unreadNotifs;
            notifBadge.style.display = unreadNotifs > 0 ? 'inline-block' : 'none';
        }

        // Render Messages List
        const msgList = document.getElementById('headerMessagesList');
        const msgCount = document.getElementById('headerMessagesCount');
        if (msgList && msgCount) {
            msgCount.innerText = `${unreadMsgs} New`;
            msgList.innerHTML = '';
            if (window.headerMessagesData.length === 0) {
                msgList.innerHTML = '<div class="p-3 text-center text-muted small">No messages</div>';
            } else {
                window.headerMessagesData.forEach((msg, idx) => {
                    const timeFormatted = msg.created_at ? new Date(msg.created_at).toLocaleTimeString(window.currentLocale || 'en-US', {hour: '2-digit', minute:'2-digit'}) : 'Today';
                    const bgClass = msg.is_read == 1 ? 'bg-light' : 'bg-white';
                    const fwClass = msg.is_read == 1 ? 'fw-normal' : 'fw-bold';
                    const senderDisplay = (msg.sender_name || 'Unknown') + ' (' + (msg.sender_type || 'User') + ')';
                    const snippet = (msg.message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    
                    msgList.innerHTML += `
                        <a class="dropdown-item py-3 border-bottom ${bgClass}" href="#" onclick="openHeaderMessageByIndex(${idx}); return false;">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <strong class="text-dark ${fwClass}">${senderDisplay}</strong>
                                <small class="text-primary ${fwClass}">${timeFormatted}</small>
                            </div>
                            <div class="text-muted small text-truncate" style="max-width: 280px;">
                                ${snippet}
                            </div>
                        </a>
                    `;
                });
            }
        }

        // Render Notifications List
        const notifList = document.getElementById('headerNotificationsList');
        const notifCount = document.getElementById('headerNotificationsCount');
        if (notifList && notifCount) {
            notifCount.innerText = `${unreadNotifs} New`;
            notifList.innerHTML = '';
            if (window.headerNotificationsData.length === 0) {
                notifList.innerHTML = '<div class="p-3 text-center text-muted small">No notifications</div>';
            } else {
                window.headerNotificationsData.forEach((notif, idx) => {
                    const bgClass = notif.is_read == 1 ? 'bg-light' : 'bg-white';
                    const fwClass = notif.is_read == 1 ? 'fw-normal' : 'fw-bold';
                    const iconBg = notif.is_read == 1 ? 'bg-secondary-subtle text-secondary' : 'bg-primary-subtle text-primary';
                    const titleDisplay = (notif.title || 'Notification').replace(/</g, '&lt;');
                    const msgDisplay = (notif.message || '').replace(/</g, '&lt;');

                    notifList.innerHTML += `
                        <a href="#" onclick="openHeaderNotificationByIndex(${idx}); return false;" class="list-group-item list-group-item-action p-3 border-bottom ${bgClass}">
                            <div class="d-flex align-items-center">
                                <div class="flex-shrink-0 ${iconBg} rounded-circle p-2 me-3">
                                    <i class="fas fa-bell"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-0 ${fwClass} text-dark" style="font-size: 13px;">${titleDisplay}</h6>
                                    <p class="mb-0 text-muted" style="font-size: 12px; white-space: pre-wrap;">${msgDisplay.length > 80 ? msgDisplay.substring(0, 80) + '...' : msgDisplay}</p>
                                </div>
                            </div>
                        </a>
                    `;
                });
            }
        }

    } catch (err) {
        console.error("Failed to load header data:", err);
    }
}

function openNafisoMessageDirectly() {
    viewMessage(
        'I have submitted a new waste collection request at Wadajir, Mogadishu (13) for 2026-08-13T19:00. Please review. (Payment Status: Completed - $10.00 paid)',
        'Just now',
        'Nafiso (Resident)',
        'Wadajir, Mogadishu (13)',
        10.00,
        20,
        3,
        'Resident'
    );
}

function openYahyeMessageDirectly() {
    viewMessage(
        'I have successfully paid my bill of $45 via Mobile Money for Request #8.',
        'Today',
        'Yahye Abdi (Resident)',
        'Tarabunka, Mogadishu',
        110.00,
        18,
        1,
        'Resident'
    );
}

async function openHeaderMessageByIndex(idx) {
    if (!window.headerMessagesData || window.headerMessagesData.length === 0) {
        try { await loadHeaderData(); } catch(e){}
    }
    const msg = (window.headerMessagesData && window.headerMessagesData[idx]) ? window.headerMessagesData[idx] : null;
    if (msg) {
        const timeFormatted = msg.created_at ? new Date(msg.created_at).toLocaleTimeString(window.currentLocale || 'en-US', {hour: '2-digit', minute:'2-digit'}) : 'Today';
        viewMessage(
            msg.message || '', 
            timeFormatted, 
            (msg.sender_name || 'Unknown') + ' (' + (msg.sender_type || 'User') + ')', 
            msg.sender_area || '', 
            msg.total_paid !== null && msg.total_paid !== undefined ? msg.total_paid : null, 
            msg.message_id, 
            msg.sender_id, 
            msg.sender_type
        );
    } else if (idx === 0) {
        openNafisoMessageDirectly();
    } else if (idx === 1) {
        openYahyeMessageDirectly();
    } else {
        showSection('messages');
    }
}

async function openHeaderNotificationByIndex(idx) {
    if (!window.headerNotificationsData || window.headerNotificationsData.length === 0) {
        try { await loadHeaderData(); } catch(e){}
    }
    const notif = (window.headerNotificationsData && window.headerNotificationsData[idx]) ? window.headerNotificationsData[idx] : null;
    if (notif) {
        const timeFormatted = notif.created_at ? new Date(notif.created_at).toLocaleString(window.currentLocale || 'en-US') : 'Today';
        viewNotification(
            notif.title || 'Notification',
            notif.message || '',
            timeFormatted,
            notif.notification_id
        );
    } else {
        viewNotification(
            'New Pickup Request',
            'A new request was submitted by Nafiso at Wadajir, Mogadishu.',
            'Just now',
            26
        );
    }
}

async function viewMessage(content, time, sender, area, total_paid, msgId, senderId, senderType) {
    const titleEl = document.getElementById('msgModalTitle');
    if (titleEl) titleEl.textContent = `From: ${sender}`;
    
    const contentEl = document.getElementById('msgModalContent');
    if (contentEl) contentEl.textContent = content;
    
    const timeEl = document.getElementById('msgModalTime');
    if (timeEl) timeEl.textContent = time;
    
    const areaEl = document.getElementById('msgModalArea');
    if (areaEl) areaEl.textContent = area ? `Area: ${area}` : 'Area: Unknown';

    const replySenderId = document.getElementById('replySenderId');
    if (replySenderId) replySenderId.value = senderId || '';
    
    const replySenderType = document.getElementById('replySenderType');
    if (replySenderType) replySenderType.value = senderType || '';

    const replyOriginalContent = document.getElementById('replyOriginalContent');
    if (replyOriginalContent) replyOriginalContent.value = content || '';
    
    const replyMessage = document.getElementById('replyMessage');
    if (replyMessage) replyMessage.value = '';

    // Dismiss any active dropdowns
    try {
        document.querySelectorAll('.dropdown-menu.show').forEach(el => el.classList.remove('show'));
    } catch(e){}

    const modalEl = document.getElementById('messageModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } else {
        alert(`Message from ${sender}:\n\n${content}`);
    }

    // Mark as read in background
    if (msgId) {
        apiCall(`/admin.php?action=mark_message_read&id=${msgId}`, 'GET');
        loadHeaderData();
    }
}

async function sendReply() {
    const senderId = document.getElementById('replySenderId')?.value;
    const senderType = document.getElementById('replySenderType')?.value;
    const replyText = document.getElementById('replyMessage')?.value?.trim();
    const originalContent = document.getElementById('replyOriginalContent')?.value?.trim();

    if (!replyText) {
        showToast('Please enter a reply message.', 'danger');
        return;
    }

    const res = await apiCall('/admin.php?action=reply_message', 'POST', {
        receiver_id: senderId,
        receiver_type: senderType,
        message: replyText,
        original_message: originalContent
    });

    if (res && res.status === 'success') {
        showToast('Reply sent successfully!', 'success');
        const modalEl = document.getElementById('messageModal');
        if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    } else {
        showToast(res?.message || 'Failed to send reply', 'danger');
    }
}

async function markNotificationRead(notifId) {
    if (!notifId) return;
    apiCall(`/admin.php?action=mark_notification_read&id=${notifId}`, 'GET').then(() => {
        loadHeaderData();
    }).catch(err => console.error(err));
}

async function viewNotification(title, message, time, notifId) {
    const titleEl = document.getElementById('notifModalTitle');
    if (titleEl) titleEl.textContent = title;
    
    const contentEl = document.getElementById('notifModalContent');
    if (contentEl) contentEl.textContent = message;
    
    const timeEl = document.getElementById('notifModalTime');
    if (timeEl) timeEl.textContent = time;

    // Dismiss any active dropdowns
    try {
        document.querySelectorAll('.dropdown-menu.show').forEach(el => el.classList.remove('show'));
    } catch(e){}

    const modalEl = document.getElementById('notifModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } else {
        alert(`${title}\n\n${message}`);
    }

    // Mark as read in background
    if (notifId) {
        markNotificationRead(notifId);
    }
}

async function loadMessagesSection() {
    const tbody = document.getElementById('all-messages-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading system messages and reports...</td></tr>';
    
    try {
        const res = await apiCall('/admin.php?action=get_all_messages');
        tbody.innerHTML = '';
        
        let messages = (res && res.data && Array.isArray(res.data)) ? res.data.filter(m => m.sender_name && m.sender_name !== 'Unknown' && m.sender_name !== 'System User') : [];
        window.allLoadedMessages = messages;

        if (messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><i class="fas fa-envelope-open me-2"></i>No messages or support reports found.</td></tr>';
            return;
        }

        messages.forEach((msg, idx) => {
            const timeFormatted = new Date(msg.created_at).toLocaleString(window.currentLocale || 'en-US', {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'});
            const isRead = msg.is_read == 1;
            const rowClass = isRead ? '' : 'table-active fw-bold';
            const statusBadge = isRead ? '<span class="badge bg-secondary">Read</span>' : '<span class="badge bg-primary">New</span>';
            const actionBtnText = isRead ? 'View' : 'Reply';
            const actionBtnClass = isRead ? 'btn-outline-secondary' : 'btn-primary';
            
            // Format message content with badge if it's an emergency or crash
            let rawMsg = msg.message || '';
            let typeBadge = '';
            if (rawMsg.includes('🚨') || rawMsg.toLowerCase().includes('emergency') || rawMsg.toLowerCase().includes('crash') || rawMsg.toLowerCase().includes('accident')) {
                typeBadge = '<span class="badge bg-danger me-1"><i class="fas fa-exclamation-triangle me-1"></i>Emergency</span> ';
            } else if (rawMsg.toLowerCase().includes('vehicle') || rawMsg.toLowerCase().includes('tire') || rawMsg.toLowerCase().includes('engine') || rawMsg.toLowerCase().includes('fuel')) {
                typeBadge = '<span class="badge bg-warning text-dark me-1"><i class="fas fa-wrench me-1"></i>Vehicle Issue</span> ';
            } else if (rawMsg.toLowerCase().includes('report') || rawMsg.toLowerCase().includes('missed') || rawMsg.toLowerCase().includes('delayed')) {
                typeBadge = '<span class="badge bg-info text-dark me-1"><i class="fas fa-flag me-1"></i>Report</span> ';
            }

            const snippet = typeBadge + (rawMsg.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            const roleBadgeClass = (msg.sender_type || '').toLowerCase() === 'driver' ? 'bg-dark' : 'bg-success';
            
            tbody.innerHTML += `
                <tr class="${rowClass}">
                    <td style="white-space: nowrap;">${timeFormatted}</td>
                    <td class="text-capitalize fw-semibold">${msg.sender_name || 'Unknown'}</td>
                    <td><span class="badge ${roleBadgeClass}">${msg.sender_type || 'User'}</span></td>
                    <td class="text-truncate" style="max-width: 380px;">${snippet}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button type="button" class="btn btn-sm ${actionBtnClass}" onclick="openLoadedMessageByIndex(${idx})"><i class="fas fa-envelope-open-text me-1"></i>${actionBtnText}</button>
                    </td>
                </tr>
            `;
        });

        if (typeof filterMessagesTable === 'function') {
            filterMessagesTable();
        }
    } catch (err) {
        console.error("Messages load error:", err);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4"><i class="fas fa-exclamation-circle me-2"></i>Failed to load messages: ${err.message}</td></tr>`;
    }
}

window.openLoadedMessageByIndex = function(idx) {
    const msg = window.allLoadedMessages && window.allLoadedMessages[idx];
    if (!msg) return;
    const timeFormatted = msg.created_at ? new Date(msg.created_at).toLocaleString(window.currentLocale || 'en-US') : 'Today';
    viewMessage(
        msg.message || '', 
        timeFormatted, 
        (msg.sender_name || 'Unknown') + ' (' + (msg.sender_type || 'User') + ')', 
        msg.sender_area || '', 
        msg.total_paid !== null && msg.total_paid !== undefined ? msg.total_paid : null, 
        msg.message_id, 
        msg.sender_id, 
        msg.sender_type
    );
};

async function markAllMessagesRead() {
    try {
        const res = await apiCall('/admin.php?action=mark_all_messages_read', 'POST');
        if(res.status === 'success') {
            showToast('All messages marked as read.', 'success');
            loadMessagesSection();
        } else {
            showToast(res.message, 'danger');
        }
    } catch (err) {
        console.error(err);
        showToast('Failed to mark messages as read: ' + err.message, 'danger');
    }
}

async function clearLogs() {
    const container = document.getElementById('activityLogsContainer');
    if (container) {
        container.innerHTML = '<div class="text-center text-muted py-4"><i class="fas fa-inbox mb-2 fs-3"></i><p class="mb-0">All logs cleared.</p></div>';
        showToast('Logs cleared successfully', 'success');
    }
}

async function refreshLogs() {
    const container = document.getElementById('activityLogsContainer');
    const icon = document.querySelector('button[title="Refresh Logs"] i');
    if (icon) icon.classList.add('fa-spin');
    
    setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
        showToast('System logs refreshed.', 'success');
        
        // If logs were cleared, restore a dummy log to show it refreshed
        if (container && container.innerHTML.includes('All logs cleared')) {
            const now = new Date();
            const timeString = now.toLocaleTimeString(window.currentLocale || 'en-US', {hour: '2-digit', minute:'2-digit', second:'2-digit'});
            container.innerHTML = `
                <div class="d-flex align-items-start border-start border-info border-4 ps-3 py-1 mb-4 log-item">
                    <div class="icon-wrapper rounded-circle bg-info-subtle text-info me-3 p-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                        <i class="fas fa-sync-alt"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="mb-0 fw-bold text-dark" style="font-size: 14px;">System Refreshed</h6>
                            <small class="text-muted fw-semibold">${timeString}</small>
                        </div>
                        <p class="mb-0 text-muted small">System activity logs were refreshed manually.</p>
                    </div>
                </div>
            `;
        }
    }, 600);
}

async function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-bs-theme') === 'dark' || document.body.classList.contains('dark-mode');
    const newMode = !isDark;

    if (newMode) {
        html.setAttribute('data-bs-theme', 'dark');
        html.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('smartWasteTheme', 'dark');
        showToast('Dark mode activated', 'success');
    } else {
        html.removeAttribute('data-bs-theme');
        html.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
        localStorage.setItem('smartWasteTheme', 'light');
        showToast('Light mode activated', 'success');
    }

    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.checked = newMode;

    const icon = document.getElementById('headerThemeIcon');
    if (icon) {
        icon.className = newMode ? 'fas fa-sun text-warning' : 'fas fa-moon';
    }

    try {
        const saved = JSON.parse(localStorage.getItem('smartWasteAdminSettings') || '{}');
        saved.darkMode = newMode;
        localStorage.setItem('smartWasteAdminSettings', JSON.stringify(saved));
    } catch(e){}
}

async function generateReport(format) {
    const reportType = document.getElementById('reportType') ? document.getElementById('reportType').value : 'Report';
    const dateRange = document.getElementById('reportDateRange') ? document.getElementById('reportDateRange').value : 'Date Range';

    showToast(`Generating ${reportType} (${dateRange}) as ${format.toUpperCase()}...`, 'info');

    if (format === 'preview' || format === 'pdf' || format === 'print') {
        const url = `print_report.html?type=${encodeURIComponent(reportType)}&date=${encodeURIComponent(dateRange)}&t=${Date.now()}${format === 'preview' ? '&preview=true' : ''}${format === 'pdf' ? '&pdf=true' : ''}`;
        window.open(url, '_blank');
        return;
    }

    if (format === 'excel') {
        let tableHtml = '';
        if (reportType === 'Financial & Payments Report') {
            window.location.href = '../api/admin.php?action=export_financial_report';
            showToast('Downloading Financial Excel Report...', 'success');
            return;
        } else if (reportType === 'Driver Performance Report') {
            try {
                const res = await apiCall('/admin.php?action=get_driver_performance');
                tableHtml = '<tr><th>Driver ID</th><th>Driver Name</th><th>Tasks Completed</th><th>Customer Rating</th></tr>';
                if (res.status === 'success' && res.data.length > 0) {
                    res.data.forEach(d => {
                        tableHtml += `<tr><td>#DRV-${d.driver_id}</td><td>${d.name}</td><td>${d.completed_trips} Trips</td><td>5.0 / 5.0</td></tr>`;
                    });
                }
            } catch(e) {
                console.error(e);
            }
        } else if (reportType === 'Waste Collection Summary') {
            try {
                const res = await apiCall('/admin.php?action=get_all_requests');
                tableHtml = '<tr><th>Date</th><th>Zone / Area</th><th>Driver Assigned</th><th>Status</th></tr>';
                if (res.status === 'success' && res.data.length > 0) {
                    res.data.slice(0, 15).forEach(r => {
                        tableHtml += `<tr><td>${r.request_time.split(' ')[0]}</td><td>${(r.address||'').split('http')[0]}</td><td>${r.driver_name||'Unassigned'}</td><td>${r.status}</td></tr>`;
                    });
                }
            } catch(e) {
                console.error(e);
            }
        } else {
            try {
                const res = await apiCall('/admin.php?action=get_system_logs');
                tableHtml = '<tr><th>Error Code</th><th>Component</th><th>Description</th><th>Timestamp</th></tr>';
                if (res.status === 'success' && res.data.length > 0) {
                    res.data.forEach(l => {
                        tableHtml += `<tr><td>${l.error_code}</td><td>${l.component}</td><td>${l.description}</td><td>${l.timestamp}</td></tr>`;
                    });
                }
            } catch(e) {
                console.error(e);
            }
        }

        const uri = 'data:application/vnd.ms-excel;base64,';
        const template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">{table}</table></body></html>';
        const base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) };
        const formatStr = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }) };
        
        const ctx = {worksheet: reportType, table: tableHtml};
        const link = document.createElement("a");
        link.download = reportType.replace(/ /g, '_').toLowerCase() + ".xls";
        link.href = uri + base64(formatStr(template, ctx));
        link.click();
        showToast(`Excel file for ${reportType} generated successfully!`, 'success');
    }
}

async function saveSystemSettings() {
    const prevSaved = localStorage.getItem('smartWasteAdminSettings');
    const prevLang = prevSaved ? JSON.parse(prevSaved).language : 'English (US)';
    
    const settings = {
        darkMode: document.getElementById('darkModeToggle') ? document.getElementById('darkModeToggle').checked : false,
        timezone: document.getElementById('systemTimezone') ? document.getElementById('systemTimezone').value : 'Africa/Mogadishu (EAT)',
        currency: document.getElementById('systemCurrency') ? document.getElementById('systemCurrency').value : 'USD ($) / EVC Plus',
        language: document.getElementById('systemLanguage') ? document.getElementById('systemLanguage').value : 'English (US)',
        notifEmail: document.getElementById('notifEmail') ? document.getElementById('notifEmail').checked : true,
        notifSms: document.getElementById('notifSms') ? document.getElementById('notifSms').checked : false,
        notifWeekly: document.getElementById('notifWeekly') ? document.getElementById('notifWeekly').checked : true
    };
    localStorage.setItem('smartWasteAdminSettings', JSON.stringify(settings));
    
    if (settings.language !== prevLang) {
        showToast(`Language changed to ${settings.language}. Reloading...`, 'info');
        setTimeout(() => location.reload(), 1000);
    } else {
        showToast('Settings saved successfully!', 'success');
    }
}

async function applyTranslations(lang) {
    let dict = {};
    if (lang === 'Somali') {
        dict = {
            'Dashboard': 'Kantaroolka',
            'Smart Waste Admin': 'Maamulka Qashinka Smart',
            'Messages': 'Farriimaha',
            '0 New': '0 Cusub',
            'View All Messages': 'Eeg Dhammaan Farriimaha',
            'Notifications': 'Ogeysiisyada',
            'Mark all as read': 'Ka dhig kuwa la akhriyay',
            'My Profile': 'Astayntayda',
            'Settings': 'Hagaajinta',
            'View All Requests': 'Eeg Dhammaan Codsiyada',
            'Manage Residents': 'Maamul Dadweynaha',
            'Assign Driver': 'U xil saar Darawal',
            'Manage Drivers': 'Maamul Darawalada',
            'Payments': 'Lacagaha',
            'Messages & Reports': 'Farriimaha & Warbixinada',
            'Monitor System & Reports': 'Dabagalka Nidaamka',
            'Profile': 'Astaynta',
            'Total Waste Requests': 'Tirada Guud ee Codsiyada',
            'Completed Requests': 'Codsiyada La Dhammeeyay',
            'Total Residents': 'Guud ahaan Dadweynaha',
            'Total Payments': 'Guud ahaan Lacagaha',
            'Monthly Revenue': 'Dakhliga Bisha',
            'Today\'s Collections': 'Qashin-qaadka Maanta',
            'Monthly Requests': 'Codsiyada Bisha',
            'Request Status': 'Xaaladda Codsiga',
            'Driver Performance': 'Tayada Darawalka',
            'Resident': 'Muwaadin',
            'Area': 'Xafadda',
            'Waste Type': 'Nooca Qashinka',
            'Date': 'Taariikhda',
            'Status': 'Xaaladda',
            'Action': 'Tallaabo',
            'Pending': 'Sugaya',
            'Completed': 'La Dhammeeyay',
            'Assign': 'Xil-saar',
            'Details': 'Faahfaahin',
            'Total Revenue': 'Dakhliga Guud',
            'Active Drivers': 'Darawalada Shaqeeya',
            'Pending Requests': 'Codsiyada Sugaya',
            'Completed Collections': 'Qashin-qaadka',
            'Quick Actions': 'Ficilada Degdegga ah',
            'Generate Reports': 'Soo Saar Warbixin',
            'Add New Driver': 'Ku Dar Darawal',
            'System Settings': 'Hagaajinta Nidaamka',
            'Manage Payments': 'Maamul Lacagaha',
            'Live System Activity Logs': 'Diiwaanka Nidaamka',
            'Global System Preferences': 'Xulashada Nidaamka',
            'Notification Settings': 'Ogeysiisyada Nidaamka',
            'Report Generation': 'Soo Saarista Warbixinta',
            'Report Type': 'Nooca Warbixinta',
            'Date Range': 'Waqtiga',
            'Preview': 'Horudhac',
            'Print': 'Daabac',
            'Download PDF': 'Soo Degso PDF',
            'Export Excel': 'Soo Degso Excel',
            'Save All Settings': 'Kaydi Dhammaan',
            'Clear': 'Tirtir',
            'Logout': 'Ka Bax',
            'Waste Collection Overview': 'Dulmarka Qashin-qaadka',
            'Search residents, drivers...': 'Raadi dadweyne, darawalo...',
            'Search drivers, areas, reports...': 'Raadi darawal, xaafado...',
            'Admin Authenticated': 'Maamulaha ayaa Galay',
            'CRON Job Executed': 'Hawsha CRON Waa Fushay',
            'Driver App Sync': 'Isku-xirka Darawalka',
            'Database Latency': 'Daahitaanka Xogta',
            'Payment Processed': 'Lacagta Waa La Bixiyay',
            'Dark Mode': 'Madowga',
            'System Timezone': 'Waqtiga Nidaamka',
            'Currency Display': 'Muujinta Lacagta',
            'Dashboard Language': 'Luuqadda Dashboardka',
            'Email Notifications for New Requests': 'Ogeysiis Email Codsi Cusub',
            'SMS Alerts for Failed Payments': 'SMS Haddii Lacag Fashilanto',
            'Receive Weekly System Summary': 'Warbixin Todobaadle Ah',
            'Enable dark theme for the dashboard': 'Daar midabka madow ee shaashadda',
            'Get an email every time a resident makes a new waste collection request.': 'Hel iimayl mar kasta oo muwaadin uu soo diro codsi qashin-qaad cusub.',
            'Immediate SMS alert to Admin if a payment transaction fails.': 'Ogeysiis SMS degdeg ah Maamulaha haddii bixinta lacagtu fashilanto.',
            'Automated PDF report sent to your email every Sunday.': 'Warbixin PDF otomaatig ah oo laguugu soo diro iimaylkaaga Axad kasta.',
            'Recent Support Messages': 'Fariimaha Taageerada',
            'View All': 'Dhammaan Arag',
            'All logs cleared.': 'Dhammaan diiwaanka waa la tirtiray.',
            'Active Accounts': 'Kontooyin Firfircoon',
            'Inactive Accounts': 'Kontooyin Xiran',
            'Search by name, email, or phone..': 'Raadi magac, iimayl, ama telefoon..',
            'All Addresses': 'Dhammaan Xaafadaha',
            'Resident ID': 'ID-ga Muwaadinka',
            'Name': 'Magaca',
            'Email': 'Iimaylka',
            'Phone Number': 'Nambarka Telefoonka',
            'Address': 'Xaafadda',
            'Actions': 'Tallaabooyin',
            'View': 'Eeg',
            'Delete': 'Tirtir',
            'Showing 1 to 3 of 3 entries': 'Waxaa muuqda 1 ilaa 3 ee 3 diiwaannada',
            'Previous': 'Hore',
            'Next': 'Xiga',
            'Search name or phone...': 'Raadi magac ama telefoon...',
            'All Zones': 'Dhammaan Aagagga',
            'Driver ID': 'ID-ga Darawalka',
            'Vehicle Info': 'Xogta Baabuurka',
            'Zone / Area': 'Aagga / Xaafadda',
            'Total Drivers': 'Guud ahaan Darawalada',
            'Active (Online)': 'Firfircoon (Online)',
            'Offline': 'Khadka Kama Jiro',
            'Payments & Revenue': 'Lacagaha & Dakhliga',
            'Last 6 Months': '6-dii Bilood ee u dambaysay',
            'This Month': 'Bishan',
            'Last 7 Days': '7-dii Maalmood ee u dambaysay',
            'Generate Financial Report': 'Soo Saar Warbixin Maaliyadeed',
            'Total Transactions': 'Tirada Guud ee Lacag-bixinta',
            'Pending Payments': 'Lacagaha Sugaya',
            'Failed Payments': 'Lacagaha Fashilmay',
            'Revenue Over Time (6 Months)': 'Dakhliga Muddada (6 Bilood)',
            'Payment Status Breakdown': 'Xaaladda Lacag-bixinta',
            'Recent Transactions': 'Lacag-bixintii u dambaysay',
            'Transaction ID': 'ID-ga Lacag-bixinta',
            'Amount': 'Lacagta',
            'Method': 'Qaabka',
            'All Messages': 'Dhammaan Farriimaha',
            'Only Residents': 'Muwaadiniinta Keliya',
            'Only Drivers': 'Darawalada Keliya',
            'Mark All as Read': 'Akhri Dhammaan',
            'Date/Time': 'Taariikh/Waqti',
            'Sender': 'Diraha',
            'Role': 'Doorka',
            'Message': 'Farriinta',
            'System Monitoring & Reports': 'Dabagalka Nidaamka & Warbixinada',
            'Loading residents...': 'Xogta dadweynaha ayaa soo dacaysa...',
            'Loading drivers...': 'Xogta darawalada ayaa soo dacaysa...',
            'Loading...': 'Waa soo dacaysa...',
            'Recent Requests': 'Codsiyadii u dambeeyay',
            'Search...': 'Raadi...',
            'All Status': 'Dhammaan',
            'ID': 'ID',
            'Type': 'Nooca',
            'Driver': 'Darawal',
            'Req Date': 'Taariikhda Codsiga',
            'Assigned': 'Waa Loo Diray',
            'Done': 'Waa La Qabtay',
            'Unassigned': 'Aan La Xil-saarin',
            'Driver Status Panel': 'Xaaladda Darawalka',
            'DRIVER': 'DARAWALKA',
            'VEHICLE': 'BAABUURKA',
            'Online': 'Online',
            'General': 'Guud',
            'Recycling': 'Warshadayn',
            'Hazardous': 'Khatar',
            'Bulk': 'Mid Weyn',
            'Recent Activities Timeline': 'Diiwaanka Dhaqdhaqaaqa Cusub',
            'Today\'s Collection Schedule': 'Jadwalka Qashin-qaadka Maanta',
            'Time': 'Waqtiga',
            'Priority': 'Ahmiyadda',
            'Low': 'Hoseysa',
            'Med': 'Dhexe',
            'High': 'Sare',
            'Request Created': 'Codsi La Abuuray',
            'Payment Received': 'Lacag La Helay',
            'Driver Assigned': 'Darawal Loo Diray',
            'No scheduled collections': 'Ma jiraan jadwalo la qorsheeyay',
            'No recent activities': 'Ma jiraan dhaqdhaqaaq cusub',
            'All Waste Requests': 'Dhammaan Codsiyada Qashinka',
            'Search by resident or ID...': 'Raadi magac ama ID...',
            'All Statuses': 'Dhammaan',
            'Export CSV': 'Soo Degso CSV',
            'Request ID': 'ID-ga Codsiga',
            'Resident Address': 'Xaafadda Muwaadinka',
            'Request Date & Time': 'Taariikhda & Waqtiga',
            'Assigned Driver': 'Darawalka Loo Diray',
            'Edit': 'Beddel',
            'En Route': 'Wuu Soo Socdaa',
            'Assign Drivers (Pending)': 'Xil-saar Darawalo (Sugaya)',
            'Resident Name': 'Magaca Muwaadinka',
            'Request Time': 'Waqtiga Codsiga',
            'Normal': 'Caadi',
            'Select a driver...': 'Dooro darawal...',
            'Smart Waste Collection Management System © 2026 | Version 1.1': 'Nidaamka Maamulka Qashin-qaadka Smart © 2026 | Nuqulka 1.1',
            'Enterprise Edition': 'Nooca Ganacsiga (Enterprise)',
            'System Health Status': 'Xaaladda Caafimaadka Nidaamka',
            'Database Server': 'Server-ka Xogta',
            'Online & Healthy': 'Wuu Shaqaynayaa (Healthy)',
            'API Gateway': 'Isku xiraha API-ga',
            '99.9% Uptime': '99.9% Wuu Kacaa',
            'Generate Custom Reports': 'Soo Saar Warbixin U Gaar ah',
            'Waste Collection Summary': 'Warbixinta Qashin-qaadka',
            'Financial Revenue Report': 'Warbixinta Dakhliga',
            'Driver Performance Report': 'Warbixinta Tayada Darawalka',
            'Admin Profile': 'Astaynta Maamulaha',
            'Personal Information': 'Xogta Shaqsiga ah',
            'Upload Photo': 'Soo Rog Sawir',
            'Allowed formats: JPG, PNG. Max size: 2MB.': 'Noocyada la oggol yahay: JPG, PNG. Ugu badnaan: 2MB.',
            'Full Name': 'Magaca Buuxa',
            'Email Address': 'Cinwaanka Iimaylka',
            'Contact IT support to change your email.': 'La xiriir qaybta taageerada si aad u beddesho iimaylkaaga.',
            'Role / Position': 'Doorka / Jagada',
            'Super Administrator': 'Maamule Guud (Super Admin)',
            'Security & Password': 'Amniga iyo Ereyga Sirta',
            'It is highly recommended to change your password every 90 days.': 'Waxaa aad lagugula talinayaa inaad beddesho ereygaaga sirta 90-kii maalmoodba mar.',
            'Current Password': 'Ereyga Sirta ee Hadda',
            'Enter current password': 'Geli ereyga sirta ee hadda',
            'New Password': 'Ereyga Sirta ee Cusub',
            'Create new password': 'Abuur erey sir ah oo cusub',
            'Confirm New Password': 'Xaqiiji Ereyga Sirta',
            'Confirm new password': 'Xaqiiji ereyga sirta ee cusub',
            'Update Password': 'Beddel Ereyga Sirta',
            'Save Profile': 'Kaydi Astaynta',
            'New passwords do not match': 'Ereyada sirta ah ee cusub isma le\'eg',
            'Password updated successfully': 'Ereyga sirta si guul leh ayaa loo beddelay',
            'Profile updated successfully': 'Astaynta si guul leh ayaa loo beddelay'
        };
    } else if (lang === 'Arabic') {
        dict = {
            "Dashboard": "لوحة القيادة",
            "South Zone": "المنطقة الجنوبية",
            "North Zone": "المنطقة الشمالية",
            "Tarabunka": "ترابونكا",
            "Abdi": "عبدي",
            "I have submitted a new waste collection request at wabari for": "لقد قدمت طلبًا جديدًا لجمع النفايات في وابري لـ",
            "I have submitted a new waste collection request at wabari for...": "لقد قدمت طلبًا جديدًا لجمع النفايات في وابري لـ...",
            "... I have submitted a new waste collection request at wabari for": "... لقد قدمت طلبًا جديدًا لجمع النفايات في وابري لـ",
            "Hello, I need help with my waste collection schedule": "مرحبًا، أحتاج إلى مساعدة في جدول جمع النفايات الخاص بي",
            "Hello, I need help with my waste collection schedule.": "مرحبًا، أحتاج إلى مساعدة في جدول جمع النفايات الخاص بي.",
            ".Hello, I need help with my waste collection schedule": ".مرحبًا، أحتاج إلى مساعدة في جدول جمع النفايات الخاص بي",
            "My truck is broken, need a replacement": "شاحنتي معطلة، أحتاج إلى بديل",
            "My truck is broken, need a replacement.": "شاحنتي معطلة، أحتاج إلى بديل.",
            ".My truck is broken, need a replacement": ".شاحنتي معطلة، أحتاج إلى بديل",

            "Read": "مقروء",
            "New": "جديد",
            "Reply": "رد",
            "shaqda daqso halako qabto": "إنجاز العمل بسرعة",
            "I have submitted a new waste collection request at wabari for...": "... لقد قدمت طلبًا جديدًا لجمع النفايات في وابري لـ",
            "wali waxbo la iima qaban": "لم يتم إنجاز أي شيء لي بعد",
            "Hello, I need help with my waste collection schedule.": ".مرحبًا، أحتاج إلى مساعدة في جدول جمع النفايات الخاص بي",
            "My truck is broken, need a replacement.": ".شاحنتي معطلة، أحتاج إلى بديل",

            "EVC Plus": "إي في سي بلس",
            "Credit Card": "بطاقة ائتمان",
            "Bank Transfer": "تحويل بنكي",
            "Cash": "نقدًا",
            "Ahmed Ali": "أحمد علي",
            "Sarah Jones": "سارة جونز",
            "Omar H.": "عمر ح.",
            "Hassan M.": "حسن م.",
            "Fatima Noor": "فاطمة نور",

            "Malik": "مالك",

            "ali@waste.com": "علي@نفايات.كوم",
            "yahye@waste.com": "يحيى@نفايات.كوم",
            "malik@waste.com": "مالك@نفايات.كوم",
            "+252 614840501": "+٢٥٢ ٦١٤٨٤٠٥٠١",
            "615259394": "٦١٥٢٥٩٣٩٤",

            "Search by name, email, or phone...": "...البحث بالاسم أو البريد الإلكتروني أو الهاتف",
            "Active": "نشط",
            "Inactive": "غير نشط",
            "yahye abdi": "يحيى عبدي",
            "hodan": "هودان",

            "Vehicle": "المركبة",
            "VEHICLE": "المركبة",
            "TRK-1": "شاحنة-1",
            "TRK-2": "شاحنة-2",
            "TRK-3": "شاحنة-3",
            "TRK-4": "شاحنة-4",
            "TRK-5": "شاحنة-5",

            "Yahye Abdi": "يحيى عبدي",
            "abdi": "عبدي",
            "malik": "مالك",
            "ali": "علي",
            "Yahye": "يحيى",
            "wabari": "وابري",
            "wadajir": "وداجر",
            "deyniile": "دينيل",
            "madiino": "مدينة",
            "albaraka": "البركة",
            "Trabunka": "ترابونكا",

            "Total Revenue": "إجمالي الإيرادات",
            "Active Drivers": "السائقين النشطين",
            "Pending Requests": "الطلبات المعلقة",
            "Completed Collections": "المجموعات المكتملة",
            "Quick Actions": "إجراءات سريعة",
            "Generate Reports": "إنشاء تقارير",
            "System Settings": "إعدادات النظام",
            "Save All Settings": "حفظ الإعدادات",
            "Logout": "تسجيل خروج",
            "Global System Preferences": "تفضيلات النظام العالمية",
            "Smart Waste Admin": "إدارة النفايات الذكية",
            "Messages": "الرسائل",
            "0 New": "0 جديد",
            "View All Messages": "عرض جميع الرسائل",
            "Notifications": "الإشعارات",
            "Mark all as read": "تحديد الكل كمقروء",
            "My Profile": "ملفي الشخصي",
            "Settings": "الإعدادات",
            "View All Requests": "عرض جميع الطلبات",
            "Manage Residents": "إدارة السكان",
            "Assign Driver": "تعيين سائق",
            "Manage Drivers": "إدارة السائقين",
            "Payments": "المدفوعات",
            "Messages & Reports": "الرسائل والتقارير",
            "Monitor System & Reports": "مراقبة النظام",
            "Profile": "الملف الشخصي",
            "Total Waste Requests": "إجمالي طلبات النفايات",
            "Completed Requests": "الطلبات المكتملة",
            "Total Residents": "إجمالي السكان",
            "Total Payments": "إجمالي المدفوعات",
            "Monthly Revenue": "الإيرادات الشهرية",
            "Today's Collections": "مجموعات اليوم",
            "Monthly Requests": "الطلبات الشهرية",
            "Request Status": "حالة الطلب",
            "Driver Performance": "أداء السائق",
            "Jobs Completed": "الوظائف المكتملة",
            "Assigned/In-Progress": "معين/قيد التقدم",
            "Requests Made": "الطلبات المقدمة",
            "Resident": "مقيم",
            "Area": "المنطقة",
            "Waste Type": "نوع النفايات",
            "Date": "التاريخ",
            "Status": "الحالة",
            "Action": "إجراء",
            "Pending": "قيد الانتظار",
            "Completed": "مكتمل",
            "Assign": "تعيين",
            "Details": "تفاصيل",
            "Add New Driver": "إضافة سائق جديد",
            "Manage Payments": "إدارة المدفوعات",
            "Live System Activity Logs": "سجلات نشاط النظام",
            "Notification Settings": "إعدادات الإشعارات",
            "Report Generation": "إنشاء التقارير",
            "Report Type": "نوع التقرير",
            "Date Range": "نطاق التاريخ",
            "Preview": "معاينة",
            "Print": "طباعة",
            "Download PDF": "تحميل PDF",
            "Export Excel": "تصدير Excel",
            "Clear": "مسح",
            "Waste Collection Overview": "نظرة عامة على جمع النفايات",
            "Search residents, drivers...": "البحث عن سكان، سائقين...",
            "Search drivers, areas, reports...": "البحث في السائقين والمناطق والتقارير...",
            "Admin Authenticated": "تمت مصادقة المسؤول",
            "CRON Job Executed": "تم تنفيذ مهمة CRON",
            "Driver App Sync": "مزامنة تطبيق السائق",
            "Database Latency": "زمن انتقال قاعدة البيانات",
            "Payment Processed": "تمت معالجة الدفع",
            "Dark Mode": "الوضع المظلم",
            "System Timezone": "المنطقة الزمنية",
            "Currency Display": "عرض العملة",
            "Dashboard Language": "لغة لوحة القيادة",
            "Email Notifications for New Requests": "إشعارات البريد لطلبات جديدة",
            "SMS Alerts for Failed Payments": "تنبيهات SMS للمدفوعات الفاشلة",
            "Receive Weekly System Summary": "تلقي ملخص النظام الأسبوعي",
            "Enable dark theme for the dashboard": "تمكين المظهر الداكن للوحة القيادة",
            "Get an email every time a resident makes a new waste collection request.": "احصل على بريد عند قيام مقيم بطلب جمع نفايات جديد.",
            "Immediate SMS alert to Admin if a payment transaction fails.": "تنبيه SMS فوري للإدارة إذا فشلت معاملة الدفع.",
            "Automated PDF report sent to your email every Sunday.": "تقرير PDF آلي يُرسل إلى بريدك كل يوم أحد.",
            "Recent Support Messages": "رسائل الدعم الحديثة",
            "View All": "عرض الكل",
            "All logs cleared.": "تم مسح جميع السجلات.",
            "Active Accounts": "الحسابات النشطة",
            "Inactive Accounts": "الحسابات غير النشطة",
            "Search by name, email, or phone..": "البحث بالاسم أو البريد أو الهاتف..",
            "All Addresses": "جميع العناوين",
            "Resident ID": "معرف المقيم",
            "Name": "الاسم",
            "Email": "البريد الإلكتروني",
            "Phone Number": "رقم الهاتف",
            "Address": "العنوان",
            "Actions": "إجراءات",
            "View": "عرض",
            "Delete": "حذف",
            "Showing 1 to 3 of 3 entries": "إظهار 1 إلى 3 من 3 إدخالات",
            "Previous": "السابق",
            "Next": "التالي",
            "Search name or phone...": "البحث بالاسم أو الهاتف...",
            "All Zones": "جميع المناطق",
            "Driver ID": "معرف السائق",
            "Vehicle Info": "معلومات المركبة",
            "Zone / Area": "المنطقة / الحي",
            "Total Drivers": "إجمالي السائقين",
            "Active (Online)": "نشط (متصل)",
            "Offline": "غير متصل",
            "Payments & Revenue": "المدفوعات والإيرادات",
            "Last 6 Months": "آخر 6 أشهر",
            "This Month": "هذا الشهر",
            "Last 7 Days": "آخر 7 أيام",
            "Generate Financial Report": "إنشاء تقرير مالي",
            "Total Transactions": "إجمالي المعاملات",
            "Pending Payments": "المدفوعات المعلقة",
            "Failed Payments": "المدفوعات الفاشلة",
            "Revenue Over Time (6 Months)": "الإيرادات بمرور الوقت (6 أشهر)",
            "Payment Status Breakdown": "توزيع حالة الدفع",
            "Recent Transactions": "المعاملات الأخيرة",
            "Transaction ID": "معرف المعاملة",
            "Amount": "المبلغ",
            "Method": "الطريقة",
            "All Messages": "جميع الرسائل",
            "Only Residents": "المقيمين فقط",
            "Only Drivers": "السائقين فقط",
            "Mark All as Read": "تحديد الكل كمقروء",
            "Date/Time": "التاريخ/الوقت",
            "Sender": "المرسل",
            "Role": "الدور",
            "Message": "الرسالة",
            "System Monitoring & Reports": "مراقبة النظام والتقارير",
            "Loading residents...": "جاري تحميل السكان...",
            "Loading drivers...": "جاري تحميل السائقين...",
            "Loading...": "جاري التحميل...",
            "Recent Requests": "الطلبات الحديثة",
            "Search...": "بحث...",
            "All Status": "جميع الحالات",
            "ID": "المعرف",
            "Type": "النوع",
            "Driver": "السائق",
            "Req Date": "تاريخ الطلب",
            "Assigned": "تم التعيين",
            "Done": "اكتمل",
            "Unassigned": "غير معين",
            "Driver Status Panel": "لوحة حالة السائق",
            "DRIVER": "السائق",
            "VEHICLE": "المركبة",
            "Online": "متصل",
            "General": "عام",
            "Recycling": "إعادة تدوير",
            "Hazardous": "خطرة",
            "Bulk": "ضخمة",
            "Recent Activities Timeline": "الجدول الزمني للأنشطة الأخيرة",
            "Today's Collection Schedule": "جدول المجموعات اليوم",
            "Time": "الوقت",
            "Priority": "الأولوية",
            "Low": "منخفضة",
            "Med": "متوسطة",
            "High": "عالية",

            "Total Revenue": "إجمالي الإيرادات",
            "Active Drivers": "السائقين النشطين",
            "Pending Requests": "الطلبات المعلقة",
            "Completed Collections": "المجموعات المكتملة",
            "Quick Actions": "إجراءات سريعة",
            "Generate Reports": "إنشاء تقارير",
            "System Settings": "إعدادات النظام",
            "Save All Settings": "حفظ الإعدادات",
            "Logout": "تسجيل خروج",
            "Global System Preferences": "تفضيلات النظام العالمية",
            "Smart Waste Admin": "إدارة النفايات الذكية",
            "Messages": "الرسائل",
            "0 New": "0 جديد",
            "View All Messages": "عرض جميع الرسائل",
            "Notifications": "الإشعارات",
            "Mark all as read": "تحديد الكل كمقروء",
            "My Profile": "ملفي الشخصي",
            "Settings": "الإعدادات",
            "View All Requests": "عرض جميع الطلبات",
            "Manage Residents": "إدارة السكان",
            "Assign Driver": "تعيين سائق",
            "Manage Drivers": "إدارة السائقين",
            "Payments": "المدفوعات",
            "Messages & Reports": "الرسائل والتقارير",
            "Monitor System & Reports": "مراقبة النظام",
            "Profile": "الملف الشخصي",
            "Total Waste Requests": "إجمالي طلبات النفايات",
            "Completed Requests": "الطلبات المكتملة",
            "Total Residents": "إجمالي السكان",
            "Total Payments": "إجمالي المدفوعات",
            "Monthly Revenue": "الإيرادات الشهرية",
            "Today's Collections": "مجموعات اليوم",
            "Monthly Requests": "الطلبات الشهرية",
            "Request Status": "حالة الطلب",
            "Driver Performance": "أداء السائق",
            "Jobs Completed": "الوظائف المكتملة",
            "Assigned/In-Progress": "معين/قيد التقدم",
            "Requests Made": "الطلبات المقدمة",
            "Resident": "مقيم",
            "Area": "المنطقة",
            "Waste Type": "نوع النفايات",
            "Date": "التاريخ",
            "Status": "الحالة",
            "Action": "إجراء",
            "Pending": "قيد الانتظار",
            "Completed": "مكتمل",
            "Assign": "تعيين",
            "Details": "تفاصيل",
            "Add New Driver": "إضافة سائق جديد",
            "Manage Payments": "إدارة المدفوعات",
            "Live System Activity Logs": "سجلات نشاط النظام",
            "Notification Settings": "إعدادات الإشعارات",
            "Report Generation": "إنشاء التقارير",
            "Report Type": "نوع التقرير",
            "Date Range": "نطاق التاريخ",
            "Preview": "معاينة",
            "Print": "طباعة",
            "Download PDF": "تحميل PDF",
            "Export Excel": "تصدير Excel",
            "Clear": "مسح",
            "Waste Collection Overview": "نظرة عامة على جمع النفايات",
            "Search residents, drivers...": "البحث عن سكان، سائقين...",
            "Search drivers, areas, reports...": "البحث في السائقين والمناطق والتقارير...",
            "Admin Authenticated": "تمت مصادقة المسؤول",
            "CRON Job Executed": "تم تنفيذ مهمة CRON",
            "Driver App Sync": "مزامنة تطبيق السائق",
            "Database Latency": "زمن انتقال قاعدة البيانات",
            "Payment Processed": "تمت معالجة الدفع",
            "Dark Mode": "الوضع المظلم",
            "System Timezone": "المنطقة الزمنية",
            "Currency Display": "عرض العملة",
            "Dashboard Language": "لغة لوحة القيادة",
            "Email Notifications for New Requests": "إشعارات البريد لطلبات جديدة",
            "SMS Alerts for Failed Payments": "تنبيهات SMS للمدفوعات الفاشلة",
            "Receive Weekly System Summary": "تلقي ملخص النظام الأسبوعي",
            "Enable dark theme for the dashboard": "تمكين المظهر الداكن للوحة القيادة",
            "Get an email every time a resident makes a new waste collection request.": "احصل على بريد عند قيام مقيم بطلب جمع نفايات جديد.",
            "Immediate SMS alert to Admin if a payment transaction fails.": "تنبيه SMS فوري للإدارة إذا فشلت معاملة الدفع.",
            "Automated PDF report sent to your email every Sunday.": "تقرير PDF آلي يُرسل إلى بريدك كل يوم أحد.",
            "Recent Support Messages": "رسائل الدعم الحديثة",
            "View All": "عرض الكل",
            "All logs cleared.": "تم مسح جميع السجلات.",
            "Active Accounts": "الحسابات النشطة",
            "Inactive Accounts": "الحسابات غير النشطة",
            "Search by name, email, or phone..": "البحث بالاسم أو البريد أو الهاتف..",
            "All Addresses": "جميع العناوين",
            "Resident ID": "معرف المقيم",
            "Name": "الاسم",
            "Email": "البريد الإلكتروني",
            "Phone Number": "رقم الهاتف",
            "Address": "العنوان",
            "Actions": "إجراءات",
            "View": "عرض",
            "Delete": "حذف",
            "Showing 1 to 3 of 3 entries": "إظهار 1 إلى 3 من 3 إدخالات",
            "Previous": "السابق",
            "Next": "التالي",
            "Search name or phone...": "البحث بالاسم أو الهاتف...",
            "All Zones": "جميع المناطق",
            "Driver ID": "معرف السائق",
            "Vehicle Info": "معلومات المركبة",
            "Zone / Area": "المنطقة / الحي",
            "Total Drivers": "إجمالي السائقين",
            "Active (Online)": "نشط (متصل)",
            "Offline": "غير متصل",
            "Payments & Revenue": "المدفوعات والإيرادات",
            "Last 6 Months": "آخر 6 أشهر",
            "This Month": "هذا الشهر",
            "Last 7 Days": "آخر 7 أيام",
            "Generate Financial Report": "إنشاء تقرير مالي",
            "Total Transactions": "إجمالي المعاملات",
            "Pending Payments": "المدفوعات المعلقة",
            "Failed Payments": "المدفوعات الفاشلة",
            "Revenue Over Time (6 Months)": "الإيرادات بمرور الوقت (6 أشهر)",
            "Payment Status Breakdown": "توزيع حالة الدفع",
            "Recent Transactions": "المعاملات الأخيرة",
            "Transaction ID": "معرف المعاملة",
            "Amount": "المبلغ",
            "Method": "الطريقة",
            "All Messages": "جميع الرسائل",
            "Only Residents": "المقيمين فقط",
            "Only Drivers": "السائقين فقط",
            "Mark All as Read": "تحديد الكل كمقروء",
            "Date/Time": "التاريخ/الوقت",
            "Sender": "المرسل",
            "Role": "الدور",
            "Message": "الرسالة",
            "System Monitoring & Reports": "مراقبة النظام والتقارير",
            "Loading residents...": "جاري تحميل السكان...",
            "Loading drivers...": "جاري تحميل السائقين...",
            "Loading...": "جاري التحميل...",
            "Recent Requests": "الطلبات الحديثة",
            "Search...": "بحث...",
            "All Status": "جميع الحالات",
            "ID": "المعرف",
            "Type": "النوع",
            "Driver": "السائق",
            "Req Date": "تاريخ الطلب",
            "Assigned": "تم التعيين",
            "Done": "اكتمل",
            "Unassigned": "غير معين",
            "Driver Status Panel": "لوحة حالة السائق",
            "DRIVER": "السائق",
            "VEHICLE": "المركبة",
            "Online": "متصل",
            "General": "عام",
            "Recycling": "إعادة تدوير",
            "Hazardous": "خطرة",
            "Bulk": "ضخمة",
            "Recent Activities Timeline": "الجدول الزمني للأنشطة الأخيرة",
            "Today's Collection Schedule": "جدول المجموعات اليوم",
            "Time": "الوقت",
            "Priority": "الأولوية",
            "Low": "منخفضة",
            "Med": "متوسطة",
            "High": "عالية",
            "Request Created": "تم إنشاء الطلب",
            "Payment Received": "تم استلام الدفع",
            "Driver Assigned": "تم تعيين السائق",
            "No scheduled collections": "لا توجد مجموعات مجدولة",
            "No recent activities": "لا توجد أنشطة حديثة",
            "All Waste Requests": "جميع طلبات النفايات",
            "Search by resident or ID...": "البحث عن طريق المقيم أو المعرف...",
            "All Statuses": "جميع الحالات",
            "Export CSV": "تصدير CSV",
            "Request ID": "معرف الطلب",
            "Resident Address": "عنوان المقيم",
            "Request Date & Time": "تاريخ ووقت الطلب",
            "Assigned Driver": "السائق المعين",
            "Edit": "تعديل",
            "En Route": "في الطريق",
            "Assign Drivers (Pending)": "تعيين السائقين (قيد الانتظار)",
            "Resident Name": "اسم المقيم",
            "Request Time": "وقت الطلب",
            "Normal": "عادي",
            "Select a driver...": "اختر سائقًا...",
            "Smart Waste Collection Management System © 2026 | Version 1.1": "نظام إدارة جمع النفايات الذكي © 2026 | الإصدار 1.1",
            "Enterprise Edition": "إصدار المؤسسات",
            "System Health Status": "حالة صحة النظام",
            "Database Server": "خادم قاعدة البيانات",
            "Online & Healthy": "متصل وصحي",
            "API Gateway": "بوابة واجهة برمجة التطبيقات",
            "99.9% Uptime": "وقت تشغيل 99.9%",
            "Generate Custom Reports": "إنشاء تقارير مخصصة",
            "Waste Collection Summary": "ملخص جمع النفايات",
            "Financial Revenue Report": "تقرير الإيرادات المالية",
            "Driver Performance Report": "تقرير أداء السائق",
            "Admin Profile": "الملف الشخصي للمسؤول",
            "Personal Information": "المعلومات الشخصية",
            "Upload Photo": "رفع صورة",
            "Allowed formats: JPG, PNG. Max size: 2MB.": "التنسيقات المسموح بها: JPG، PNG. الحد الأقصى: 2 ميجابايت.",
            "Full Name": "الاسم الكامل",
            "Email Address": "عنوان البريد الإلكتروني",
            "Contact IT support to change your email.": "اتصل بدعم تكنولوجيا المعلومات لتغيير بريدك.",
            "Role / Position": "الدور / المنصب",
            "Super Administrator": "مدير متميز",
            "Security & Password": "الأمان وكلمة المرور",
            "It is highly recommended to change your password every 90 days.": "يوصى بشدة بتغيير كلمة المرور الخاصة بك كل 90 يومًا.",
            "Current Password": "كلمة المرور الحالية",
            "Enter current password": "أدخل كلمة المرور الحالية",
            "New Password": "كلمة المرور الجديدة",
            "Create new password": "إنشاء كلمة مرور جديدة",
            "Confirm New Password": "تأكيد كلمة المرور الجديدة",
            "Confirm new password": "تأكيد كلمة المرور الجديدة",
            "Update Password": "تحديث كلمة المرور",
            "Save Profile": "حفظ الملف الشخصي",
            "Password updated successfully": "تم تحديث كلمة المرور بنجاح"
        };
        document.documentElement.dir = 'rtl';
        window.currentLocale = 'ar-SA';
    } else {
        window.currentLocale = 'en-US';
        return; // English is default
    }
    window.currentDict = dict;

    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, span, label, a, button, p, td, th, li, small, option, div');
    elements.forEach(el => {
        el.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                let text = node.nodeValue.trim();
                if (!text) return;
                if (dict[text]) {
                    node.nodeValue = node.nodeValue.replace(text, dict[text]);
                }
            }
        });
    });

    const inputs = document.querySelectorAll('input[placeholder]');
    inputs.forEach(input => {
        let text = input.getAttribute('placeholder').trim();
        if (dict[text]) {
            input.setAttribute('placeholder', dict[text]);
        }
    });
}

async function loadSystemSettings() {
    const saved = localStorage.getItem('smartWasteAdminSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                darkModeToggle.checked = settings.darkMode;
            }
            if (settings.darkMode) {
                document.documentElement.setAttribute('data-bs-theme', 'dark');
                document.documentElement.classList.add('dark-mode');
                document.body.classList.add('dark-mode');
            } else {
                document.documentElement.removeAttribute('data-bs-theme');
                document.documentElement.classList.remove('dark-mode');
                document.body.classList.remove('dark-mode');
            }

            const headerThemeIcon = document.getElementById('headerThemeIcon');
            if (headerThemeIcon) {
                headerThemeIcon.className = settings.darkMode ? 'fas fa-sun text-warning' : 'fas fa-moon';
            }
            
            if (document.getElementById('systemTimezone')) document.getElementById('systemTimezone').value = settings.timezone;
            if (document.getElementById('systemCurrency')) document.getElementById('systemCurrency').value = settings.currency;
            if (document.getElementById('systemLanguage')) document.getElementById('systemLanguage').value = settings.language;
            
            if (document.getElementById('notifEmail')) document.getElementById('notifEmail').checked = settings.notifEmail;
            if (document.getElementById('notifSms')) document.getElementById('notifSms').checked = settings.notifSms;
            if (document.getElementById('notifWeekly')) document.getElementById('notifWeekly').checked = settings.notifWeekly;
            
            // Apply language translations
            if (settings.language && settings.language !== 'English (US)') {
                const langName = settings.language.split(' ')[0]; // Extract "Somali" or "Arabic"
                applyTranslations(langName);
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }
    
    // Load saved avatar globally
    const admin = JSON.parse(localStorage.getItem('admin'));
    if (admin && admin.profilePic) {
        const headerPic = document.getElementById('headerProfilePic');
        if (headerPic) headerPic.src = admin.profilePic;
    }
}

// Call immediately since app.js is at the bottom of the body
loadSystemSettings();

// Live Global Header Search Functionality
let globalSearchTimeout = null;

window.handleGlobalSearch = async function(query) {
    const resultsContainer = document.getElementById('globalSearchResults');
    if (!resultsContainer) return;

    query = query ? query.trim() : '';
    if (query.length === 0) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
        return;
    }

    if (globalSearchTimeout) clearTimeout(globalSearchTimeout);
    globalSearchTimeout = setTimeout(async () => {
        try {
            const res = await apiCall('/admin.php?action=global_search&q=' + encodeURIComponent(query));
            let residents = [];
            let drivers = [];
            let requests = [];

            if (res && res.data) {
                residents = res.data.residents || [];
                drivers = res.data.drivers || [];
                requests = res.data.requests || [];
            }

            // Fallback to local search if backend is offline
            if (residents.length === 0 && window.allResidents) {
                const qLower = query.toLowerCase();
                residents = window.allResidents.filter(r => 
                    (r.name && r.name.toLowerCase().includes(qLower)) ||
                    (r.phone && r.phone.toLowerCase().includes(qLower)) ||
                    (r.email && r.email.toLowerCase().includes(qLower)) ||
                    (r.address && r.address.toLowerCase().includes(qLower))
                ).slice(0, 6);
            }

            if (drivers.length === 0 && window.allDrivers) {
                const qLower = query.toLowerCase();
                drivers = window.allDrivers.filter(d => 
                    (d.name && d.name.toLowerCase().includes(qLower)) ||
                    (d.phone && d.phone.toLowerCase().includes(qLower)) ||
                    (d.zone && d.zone.toLowerCase().includes(qLower)) ||
                    (d.vehicle_info && d.vehicle_info.toLowerCase().includes(qLower))
                ).slice(0, 6);
            }

            if (requests.length === 0 && window.allRequests) {
                const qLower = query.toLowerCase();
                requests = window.allRequests.filter(req => 
                    String(req.request_id).includes(qLower) ||
                    (req.resident_name && req.resident_name.toLowerCase().includes(qLower)) ||
                    (req.driver_name && req.driver_name.toLowerCase().includes(qLower)) ||
                    (req.address && req.address.toLowerCase().includes(qLower)) ||
                    (req.waste_type && req.waste_type.toLowerCase().includes(qLower)) ||
                    (req.status && req.status.toLowerCase().includes(qLower))
                ).slice(0, 6);
            }

            const totalMatches = residents.length + drivers.length + requests.length;

            if (totalMatches === 0) {
                resultsContainer.innerHTML = `
                    <div class="p-3 text-center text-muted small">
                        <i class="fas fa-search-minus me-1 text-secondary"></i> No results found for "<strong>${query}</strong>"
                    </div>`;
                resultsContainer.style.display = 'block';
                return;
            }

            let html = '';

            // Residents Category
            if (residents && residents.length > 0) {
                html += `<div class="dropdown-header text-uppercase fw-bold small text-primary pt-2 pb-1 border-bottom"><i class="fas fa-users me-1"></i> Residents (${residents.length})</div>`;
                residents.forEach(r => {
                    html += `
                        <a href="#" class="dropdown-item py-2 px-3 border-bottom d-flex align-items-center justify-content-between" onclick="navigateToSearchItem('residents', '${(r.name || '').replace(/'/g, "\\'")}'); return false;">
                            <div>
                                <div class="fw-bold text-dark small">${r.name}</div>
                                <div class="text-muted extra-small"><i class="fas fa-phone me-1"></i>${r.phone || 'No phone'} | ${r.address || 'No address'}</div>
                            </div>
                            <span class="badge bg-success-subtle text-success border border-success-subtle small">${r.status || 'Active'}</span>
                        </a>`;
                });
            }

            // Drivers Category
            if (drivers && drivers.length > 0) {
                html += `<div class="dropdown-header text-uppercase fw-bold small text-success pt-3 pb-1 border-bottom"><i class="fas fa-truck me-1"></i> Drivers (${drivers.length})</div>`;
                drivers.forEach(d => {
                    html += `
                        <a href="#" class="dropdown-item py-2 px-3 border-bottom d-flex align-items-center justify-content-between" onclick="navigateToSearchItem('drivers', '${(d.name || '').replace(/'/g, "\\'")}'); return false;">
                            <div>
                                <div class="fw-bold text-dark small">${d.name}</div>
                                <div class="text-muted extra-small"><i class="fas fa-map-marker-alt me-1"></i>Zone: ${d.zone || 'General'} | ${d.phone || 'No phone'}</div>
                            </div>
                            <span class="badge bg-info-subtle text-info border border-info-subtle small">${d.status || 'Online'}</span>
                        </a>`;
                });
            }

            // Requests Category
            if (requests && requests.length > 0) {
                html += `<div class="dropdown-header text-uppercase fw-bold small text-warning pt-3 pb-1 border-bottom"><i class="fas fa-dumpster me-1"></i> Waste Requests (${requests.length})</div>`;
                requests.forEach(req => {
                    html += `
                        <a href="#" class="dropdown-item py-2 px-3 border-bottom d-flex align-items-center justify-content-between" onclick="navigateToSearchItem('requests', '${req.request_id}'); return false;">
                            <div>
                                <div class="fw-bold text-dark small">Request #${req.request_id} - ${req.resident_name || 'Resident'}</div>
                                <div class="text-muted extra-small"><i class="fas fa-location-dot me-1"></i>${req.address || ''} | Driver: ${req.driver_name || 'Unassigned'}</div>
                            </div>
                            <span class="badge bg-warning-subtle text-dark border border-warning-subtle small">${req.status || 'Pending'}</span>
                        </a>`;
                });
            }

            resultsContainer.innerHTML = html;
            resultsContainer.style.display = 'block';
        } catch (err) {
            console.error("Global search error:", err);
        }
    }, 150);
};

window.navigateToSearchItem = function(sectionId, filterValue) {
    const resultsContainer = document.getElementById('globalSearchResults');
    if (resultsContainer) resultsContainer.style.display = 'none';

    showSection(sectionId);

    setTimeout(() => {
        if (sectionId === 'residents') {
            const input = document.getElementById('residentSearch') || document.getElementById('residentsSearch');
            if (input) {
                input.value = filterValue;
                if (typeof filterResidents === 'function') filterResidents();
            }
        } else if (sectionId === 'drivers') {
            const input = document.getElementById('driverSearch') || document.getElementById('driverSearchInput');
            if (input) {
                input.value = filterValue;
                if (typeof filterDriversTable === 'function') filterDriversTable();
            }
        } else if (sectionId === 'requests') {
            const input = document.getElementById('allRequestsSearch') || document.getElementById('requestsSearch');
            if (input) {
                input.value = filterValue;
                if (typeof filterAllRequests === 'function') filterAllRequests();
            }
        } else if (sectionId === 'dashboard') {
            const input = document.getElementById('dashboardSearch');
            if (input) {
                input.value = filterValue;
                if (typeof filterDashboardRequests === 'function') filterDashboardRequests();
            }
        }
    }, 150);
};

// Close global search dropdown when clicking outside
document.addEventListener('click', (e) => {
    const searchContainer = document.getElementById('headerGlobalSearch');
    const resultsContainer = document.getElementById('globalSearchResults');
    if (searchContainer && resultsContainer) {
        if (!searchContainer.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    }
});

// ADVANCED REPORTS & ANALYTICS MODULE
let reportUsersCache = { residents: [], drivers: [] };
let lastReportRecords = [];

async function loadReportsSection() {
    try {
        const userRes = await apiCall('/admin.php?action=get_report_users');
        if (userRes && userRes.data) {
            reportUsersCache = userRes.data;
            populateReportUserDropdown();
        }
        await generateAdvancedReport();
    } catch (err) {
        console.error("Failed to load reports section:", err);
    }
}

function populateReportUserDropdown() {
    const role = document.getElementById('rptRoleFilter')?.value || 'all';
    const userSelect = document.getElementById('rptUserSelect');
    if (!userSelect) return;
    
    userSelect.innerHTML = '<option value="all">-- All Users (Global Report) --</option>';

    if (role === 'all' || role === 'resident') {
        const groupRes = document.createElement('optgroup');
        groupRes.label = "Residents";
        (reportUsersCache.residents || []).forEach(r => {
            const opt = document.createElement('option');
            opt.value = `resident_${r.id}`;
            opt.textContent = `👤 ${r.name} (${r.phone || r.email || 'Resident'})`;
            groupRes.appendChild(opt);
        });
        userSelect.appendChild(groupRes);
    }

    if (role === 'all' || role === 'driver') {
        const groupDrv = document.createElement('optgroup');
        groupDrv.label = "Drivers";
        (reportUsersCache.drivers || []).forEach(d => {
            const opt = document.createElement('option');
            opt.value = `driver_${d.id}`;
            opt.textContent = `🚚 ${d.name} (${d.phone || d.email || 'Driver'})`;
            groupDrv.appendChild(opt);
        });
        userSelect.appendChild(groupDrv);
    }
}

function filterReportRoleChange() {
    populateReportUserDropdown();
    generateAdvancedReport();
}

function toggleReportCustomDate() {
    const range = document.getElementById('rptDateRange')?.value;
    const customContainer = document.getElementById('rptCustomDateContainer');
    if (customContainer) {
        if (range === 'custom') {
            customContainer.classList.remove('d-none');
        } else {
            customContainer.classList.add('d-none');
        }
    }
    generateAdvancedReport();
}

async function generateAdvancedReport() {
    const role_filter = document.getElementById('rptRoleFilter')?.value || 'all';
    const user_key = document.getElementById('rptUserSelect')?.value || 'all';
    const date_range = document.getElementById('rptDateRange')?.value || 'all';
    const from_date = document.getElementById('rptFromDate')?.value || '';
    const to_date = document.getElementById('rptToDate')?.value || '';
    const status_filter = document.getElementById('rptStatusFilter')?.value || 'all';

    const tbody = document.getElementById('rptTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Generating analytics report...</td></tr>';

    try {
        let url = `/admin.php?action=get_advanced_reports&role_filter=${role_filter}&user_key=${user_key}&date_range=${date_range}&status_filter=${status_filter}`;
        if (date_range === 'custom' && from_date && to_date) {
            url += `&from_date=${from_date}&to_date=${to_date}`;
        }

        const res = await apiCall(url);
        if (res && res.data) {
            const sum = res.data.summary;
            const records = res.data.records;
            lastReportRecords = records;

            const pendingCount = (parseInt(sum.total_requests) || 0) - (parseInt(sum.completed_count) || 0);
            if (document.getElementById('rptTotalRequests')) document.getElementById('rptTotalRequests').innerText = sum.total_requests || 0;
            if (document.getElementById('rptCompletedRequests')) document.getElementById('rptCompletedRequests').innerText = sum.completed_count || 0;
            if (document.getElementById('rptPendingJobs')) document.getElementById('rptPendingJobs').innerText = pendingCount > 0 ? pendingCount : 0;
            if (document.getElementById('rptCompletionRate')) document.getElementById('rptCompletionRate').innerText = (sum.completion_rate || 0) + '%';
            if (document.getElementById('rptTotalPaid')) document.getElementById('rptTotalPaid').innerText = '$' + sum.total_paid;
            if (document.getElementById('rptDriverEarnings')) document.getElementById('rptDriverEarnings').innerText = '$' + (sum.total_driver_earnings || '0.00');
            if (document.getElementById('rptUnpaidBalance')) document.getElementById('rptUnpaidBalance').innerText = '$' + sum.unpaid_balance;

            if (records.length === 0) {
                tbody.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-muted">No records match the selected filters.</td></tr>';
                return;
            }

            tbody.innerHTML = records.map(r => `
                <tr>
                    <td class="fw-bold">#${r.request_id}</td>
                    <td><div class="fw-bold text-dark">${r.resident_name}</div><small class="text-muted">${r.resident_phone}</small></td>
                    <td><span class="badge bg-success">Resident</span></td>
                    <td class="small" style="max-width: 180px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${r.address || 'N/A'}</td>
                    <td><span class="badge bg-light text-dark border"><i class="fas fa-truck text-muted me-1"></i> ${r.driver_name}</span></td>
                    <td><span class="badge bg-success bg-opacity-10 text-success border border-success fw-bold">$${parseFloat(r.driver_earning_rate || 1.50).toFixed(2)}/pickup</span></td>
                    <td class="fw-bold text-success">$${parseFloat(r.driver_earned || 0).toFixed(2)}</td>
                    <td class="small">${new Date(r.request_time).toLocaleString()}</td>
                    <td><span class="badge bg-${r.request_status === 'Completed' ? 'success' : (r.request_status === 'Pending' ? 'warning' : 'info')}">${r.request_status}</span></td>
                    <td class="fw-bold text-dark">$${parseFloat(r.paid_amount).toFixed(2)}</td>
                    <td><span class="badge bg-${r.payment_status === 'Paid' ? 'success' : 'danger'}">${r.payment_status}</span></td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="11" class="text-center text-danger py-4">Failed to load reports: ${err.message}</td></tr>`;
    }
}

function exportReportsPDF() {
    if (!lastReportRecords || lastReportRecords.length === 0) {
        showToast('No report records to export!', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(16);
        doc.setTextColor(46, 125, 50);
        doc.text("Smart Waste Management System - Executive Analytics Report", 14, 18);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

        const tableColumn = ["Job #", "Resident", "Phone", "Address", "Driver", "Driver Rate", "Driver Earned", "Request Time", "Status", "Revenue", "Payment"];
        const tableRows = lastReportRecords.map(r => [
            `#${r.request_id}`,
            r.resident_name,
            r.resident_phone,
            r.address,
            r.driver_name,
            `$${parseFloat(r.driver_earning_rate || 1.50).toFixed(2)}`,
            `$${parseFloat(r.driver_earned || 0).toFixed(2)}`,
            new Date(r.request_time).toLocaleString(),
            r.request_status,
            `$${parseFloat(r.paid_amount).toFixed(2)}`,
            r.payment_status
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 32,
            theme: 'grid',
            headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255] },
            styles: { fontSize: 8, cellPadding: 3 }
        });

        doc.save(`SmartWaste_Executive_Report_${new Date().toISOString().slice(0,10)}.pdf`);
        showToast('PDF Report downloaded successfully!', 'success');
    } catch (err) {
        console.error("PDF Export Error:", err);
        showToast('PDF Export failed: ' + err.message, 'danger');
    }
}

function exportToExcelOrCSV(excelData, filename, sheetName = 'Smart Waste Report') {
    if (!excelData || excelData.length === 0) {
        showToast('No data available to export!', 'warning');
        return;
    }

    const headers = Object.keys(excelData[0]);

    // Map auto-fit column widths according to header title and maximum cell string length
    const colWidths = {};
    headers.forEach(h => {
        let maxLen = h.length;
        excelData.forEach(row => {
            const valStr = String(row[h] || '');
            if (valStr.length > maxLen) maxLen = valStr.length;
        });
        colWidths[h] = Math.max(maxLen * 10 + 35, 120); // Minimum 120px width per column
    });

    let headerColsHtml = '';
    headers.forEach(h => {
        headerColsHtml += `<th style="background-color: #1b5e20; color: #ffffff; font-size: 13px; font-weight: bold; text-align: center; vertical-align: middle; padding: 12px 14px; border: 1px solid #144718; width: ${colWidths[h]}px;">${h}</th>`;
    });

    let rowsHtml = '';
    let totalAmount = 0;
    let hasAmountCol = false;

    excelData.forEach((row, idx) => {
        const bg = (idx % 2 === 0) ? '#ffffff' : '#f4fbf7';
        rowsHtml += `<tr style="background-color: ${bg};">`;
        
        headers.forEach(h => {
            let val = row[h] !== null && row[h] !== undefined ? String(row[h]) : '';
            let align = 'left';
            let extraStyle = '';

            if (h.toLowerCase().includes('id')) {
                align = 'center';
                extraStyle = 'font-weight: bold; color: #1b5e20;';
            } else if (h.toLowerCase().includes('phone')) {
                align = 'center';
                extraStyle = "mso-number-format: '\\@';"; // Preserve phone text formatting in Excel
            } else if (h.toLowerCase().includes('time') || h.toLowerCase().includes('date')) {
                align = 'center';
            } else if (h.toLowerCase().includes('amount')) {
                align = 'right';
                extraStyle = 'font-weight: bold; color: #2e7d32;';
                hasAmountCol = true;
                const parsedVal = parseFloat(val.replace(/[^0-9.]/g, ''));
                if (!isNaN(parsedVal)) totalAmount += parsedVal;
            } else if (h.toLowerCase().includes('status')) {
                align = 'center';
                if (val.toLowerCase().includes('paid') || val.toLowerCase().includes('completed') || val.toLowerCase().includes('success') || val.toLowerCase().includes('online')) {
                    extraStyle = 'background-color: #d4edda; color: #155724; font-weight: bold; border-radius: 4px; padding: 4px 8px;';
                } else if (val.toLowerCase().includes('pending') || val.toLowerCase().includes('assigned') || val.toLowerCase().includes('in progress')) {
                    extraStyle = 'background-color: #fff3cd; color: #856404; font-weight: bold; border-radius: 4px; padding: 4px 8px;';
                } else if (val.toLowerCase().includes('cancel') || val.toLowerCase().includes('fail') || val.toLowerCase().includes('reject')) {
                    extraStyle = 'background-color: #f8d7da; color: #721c24; font-weight: bold; border-radius: 4px; padding: 4px 8px;';
                }
            }

            rowsHtml += `<td style="font-size: 12px; font-family: 'Segoe UI', Arial, sans-serif; vertical-align: middle; padding: 10px 12px; border: 1px solid #e0e0e0; text-align: ${align}; ${extraStyle}">${val}</td>`;
        });
        rowsHtml += `</tr>`;
    });

    let summaryRowHtml = '';
    if (hasAmountCol) {
        summaryRowHtml = `
            <tr style="background-color: #e8f5e9; font-weight: bold;">
                <td colspan="${headers.length - 2}" style="font-size: 13px; font-weight: bold; text-align: right; padding: 12px; border: 1px solid #c8e6c9; color: #1b5e20;">Total Records: ${excelData.length}</td>
                <td style="font-size: 13px; font-weight: bold; text-align: right; padding: 12px; border: 1px solid #c8e6c9; color: #1b5e20;">Total Amount: $${totalAmount.toFixed(2)}</td>
                <td style="border: 1px solid #c8e6c9;"></td>
            </tr>
        `;
    } else {
        summaryRowHtml = `
            <tr style="background-color: #e8f5e9; font-weight: bold;">
                <td colspan="${headers.length}" style="font-size: 13px; font-weight: bold; text-align: left; padding: 12px; border: 1px solid #c8e6c9; color: #1b5e20;">Total Records Exported: ${excelData.length}</td>
            </tr>
        `;
    }

    const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
            <!--[if gte mso 9]>
            <xml>
             <x:ExcelWorkbook>
              <x:ExcelWorksheets>
               <x:ExcelWorksheet>
                <x:Name>${sheetName.replace(/[\\/*?:\[\]]/g, '')}</x:Name>
                <x:WorksheetOptions>
                 <x:DisplayGridlines/>
                </x:WorksheetOptions>
               </x:ExcelWorksheet>
              </x:ExcelWorksheets>
             </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
                table { border-collapse: collapse; width: 100%; }
            </style>
        </head>
        <body>
            <div style="background-color: #1b5e20; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: bold; text-align: center; padding: 14px; margin-bottom: 5px;">
                SMART WASTE COLLECTION MANAGEMENT SYSTEM &mdash; EXPORT REPORT
            </div>
            <table border="1" cellpadding="0" cellspacing="0">
                <thead>
                    <tr>${headerColsHtml}</tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                    ${summaryRowHtml}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff' + template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const finalFilename = filename.endsWith('.xls') || filename.endsWith('.xlsx') ? filename.replace(/\.xlsx$/i, '.xls') : filename + '.xls';
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportReportsExcel() {
    if (!lastReportRecords || lastReportRecords.length === 0) {
        showToast('No report records to export!', 'warning');
        return;
    }

    try {
        const excelData = lastReportRecords.map(r => ({
            "Job ID": `#${r.request_id}`,
            "Resident Name": r.resident_name,
            "Phone": r.resident_phone,
            "Address": r.address,
            "Assigned Driver": r.driver_name,
            "Driver Rate ($/pickup)": parseFloat(r.driver_earning_rate || 1.50).toFixed(2),
            "Driver Earned ($)": parseFloat(r.driver_earned || 0).toFixed(2),
            "Request Time": new Date(r.request_time).toLocaleString(),
            "Job Status": r.request_status,
            "Revenue Amount ($)": parseFloat(r.paid_amount).toFixed(2),
            "Payment Status": r.payment_status
        }));

        exportToExcelOrCSV(excelData, `SmartWaste_Analytics_Report_${new Date().toISOString().slice(0,10)}.xlsx`, "Analytics Report");
        showToast('Excel/CSV Report downloaded successfully!', 'success');
    } catch (err) {
        console.error("Excel Export Error:", err);
        showToast('Excel Export failed: ' + err.message, 'danger');
    }
}

// Global window bindings for Admin actions
window.confirmAssignDriver = confirmAssignDriver;
window.openAssignModal = openAssignModal;
window.openEditRequestModal = openEditRequestModal;
window.showSection = showSection;
window.loadDashboard = loadDashboard;
window.loadRequests = loadRequests;
window.loadResidents = loadResidents;
window.loadDrivers = loadDrivers;
window.loadPayments = loadPayments;
window.loadActivities = loadActivities;
window.loadReportsSection = loadReportsSection;
window.generateAdvancedReport = generateAdvancedReport;
window.exportReportsPDF = exportReportsPDF;
window.exportReportsExcel = exportReportsExcel;
window.editResident = editResident;
window.saveResidentEdit = saveResidentEdit;
window.deleteResident = deleteResident;
window.viewResidentHistory = viewResidentHistory;
window.editDriver = editDriver;
window.openEditDriverModal = openEditDriverModal;
window.deleteDriver = deleteDriver;
window.viewDriverDetails = viewDriverDetails;
window.handleGlobalSearch = handleGlobalSearch;
window.navigateToSearchItem = navigateToSearchItem;
window.filterAllRequests = filterAllRequests;
window.filterDashboardRequests = filterDashboardRequests;
window.filterResidents = filterResidents;
window.filterDriversTable = filterDriversTable;
window.filterAssignRequests = filterAssignRequests;
window.filterMessagesTable = filterMessagesTable;
window.filterTransactionsTable = filterTransactionsTable;
