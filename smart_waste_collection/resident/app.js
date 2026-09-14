// resident/app.js
document.addEventListener('DOMContentLoaded', () => {
    apiCall('/auth.php?action=me&role=resident').then(res => {
        if(res.data.type !== 'resident') {
            window.location.href = 'login.html';
        } else {
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) userNameEl.innerText = res.data.name;
            const navNameEl = document.getElementById('nav-resident-name');
            if (navNameEl) navNameEl.innerText = res.data.name;
            loadDashboard();
            
            // Load profile picture & subscription plan for navbar and modals
            apiCall('/resident.php?action=get_profile').then(profileRes => {
                if (profileRes && profileRes.data) {
                    window.currentUserProfile = profileRes.data;
                    localStorage.setItem('resident', JSON.stringify(profileRes.data));
                    if (profileRes.data.name) {
                        if (userNameEl) userNameEl.innerText = profileRes.data.name;
                        if (navNameEl) navNameEl.innerText = profileRes.data.name;
                    }
                    syncResidentActivePlan(profileRes.data);
                    if(profileRes.data.profile_picture) {
                        const navPic = document.getElementById('nav-profile-pic');
                        const navIcon = document.getElementById('nav-profile-icon');
                        if (navPic) {
                            navPic.src = profileRes.data.profile_picture.startsWith('http') || profileRes.data.profile_picture.startsWith('data:') ? profileRes.data.profile_picture : '../' + profileRes.data.profile_picture;
                            navPic.classList.remove('d-none');
                        }
                        if (navIcon) navIcon.classList.add('d-none');
                    }
                }
            }).catch(e => console.error(e));
        }
    }).catch(() => {
        window.location.href = 'login.html';
    });
});

function formatMessageWithContext(msgText) {
    if (!msgText) return '';
    if (msgText.includes('📌 Re:') || msgText.includes('----------------------------------------') || msgText.includes('💬 Admin Reply:')) {
        const parts = msgText.split(/----------------------------------------|\n💬 Admin Reply:\n|\n💬 Admin Reply:/);
        if (parts.length >= 2) {
            let quotePart = parts[0].replace(/^📌\s*Re:\s*/i, '').trim().replace(/^["']|["']$/g, '');
            let replyPart = parts.slice(1).join('\n').replace(/^💬\s*Admin\s*Reply:\s*/i, '').trim();
            
            return `
                <div class="quoted-context-box p-2.5 mb-2 bg-light border-start border-3 border-success rounded text-secondary" style="font-size: 0.85rem; line-height: 1.4;">
                    <small class="text-success fw-bold d-block mb-1"><i class="fas fa-quote-left me-1"></i> Your Original Report / Message:</small>
                    <span class="fst-italic text-dark">"${quotePart.replace(/</g, '&lt;')}"</span>
                </div>
                <div class="reply-content text-dark fw-semibold" style="font-size: 0.95rem;">
                    <i class="fas fa-reply text-success me-1"></i> ${replyPart.replace(/</g, '&lt;')}
                </div>
            `;
        }
    }
    return msgText.replace(/</g, '&lt;');
}

function syncResidentActivePlan(profile) {
    if (!profile) {
        try {
            profile = JSON.parse(localStorage.getItem('resident') || '{}');
        } catch (e) { profile = {}; }
    }
    const plan = profile.subscription_plan || '';

    // Sync Settings dropdown
    const profilePlanEl = document.getElementById('profile-plan');
    if (profilePlanEl) {
        if (plan.includes('45') || plan.toLowerCase().includes('commercial')) {
            profilePlanEl.value = 'Commercial Plan ($45.00)';
        } else if (plan.includes('15') || plan.toLowerCase().includes('monthly')) {
            profilePlanEl.value = 'Monthly Subscription ($15.00)';
        } else {
            profilePlanEl.value = 'Pay Per Pickup ($5.00)';
        }
    }

    // Sync Modal UI
    const selectEl = document.getElementById('req-plan');
    const planContainer = document.getElementById('req-plan-container');
    const activeBanner = document.getElementById('req-active-plan-banner');
    const bannerTitle = document.getElementById('banner-plan-title');

    const isMonthly = (plan.includes('15') || plan.toLowerCase().includes('monthly') || plan.includes('45') || plan.toLowerCase().includes('commercial'));

    if (isMonthly) {
        // Hide option chooser container so resident is NOT asked to choose an option!
        if (planContainer) planContainer.classList.add('d-none');
        if (activeBanner) activeBanner.classList.remove('d-none');
        
        if (bannerTitle) {
            if (plan.includes('45') || plan.toLowerCase().includes('commercial')) {
                bannerTitle.innerText = '🏢 Active Plan: Commercial Plan ($45.00)';
            } else {
                bannerTitle.innerText = '🗓️ Active Plan: Monthly Subscription ($15.00)';
            }
        }
        if (selectEl) {
            if (plan.includes('45') || plan.toLowerCase().includes('commercial')) {
                selectEl.value = 'Commercial Plan ($45.00)';
            } else {
                selectEl.value = 'Monthly Subscription ($15.00)';
            }
        }
    } else {
        // Show option chooser container for pay-per-pickup residents
        if (planContainer) planContainer.classList.remove('d-none');
        if (activeBanner) activeBanner.classList.add('d-none');
        if (selectEl) selectEl.value = 'Pay Per Pickup ($5.00)';
    }
}

function setupResidentSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const brandContainer = document.getElementById('navbarBrandContainer');
    const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mainContent = document.getElementById('mainContent') || document.querySelector('.main-content');

    window.toggleResidentSidebar = function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!sidebar) return;
        if (window.innerWidth < 992) {
            const isOpen = sidebar.classList.contains('show-mobile') || sidebar.classList.contains('expanded') || sidebar.classList.contains('show');
            if (isOpen) {
                sidebar.classList.remove('show-mobile', 'expanded', 'show', 'active');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active', 'show');
            } else {
                sidebar.classList.add('show-mobile', 'expanded', 'show', 'active');
                if (sidebarOverlay) sidebarOverlay.classList.add('active', 'show');
            }
        } else {
            sidebar.classList.toggle('collapsed');
            if (mainContent) mainContent.classList.toggle('collapsed');
        }
    };

    window.hideResidentSidebar = function() {
        if (sidebar) {
            sidebar.classList.remove('show-mobile', 'expanded', 'show', 'active');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active', 'show');
        }
    };

    if (sidebarToggle) {
        sidebarToggle.onclick = window.toggleResidentSidebar;
    }

    if (brandContainer) {
        brandContainer.onclick = window.toggleResidentSidebar;
    }

    if (sidebarOverlay) {
        sidebarOverlay.onclick = window.hideResidentSidebar;
    }

    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 992) {
                window.hideResidentSidebar();
            }
        });
    });
}

function setLocalDeviceTimeToReqTime() {
    const timeInput = document.getElementById('req-time');
    if (!timeInput) return;
    const now = new Date();
    const pad = num => String(num).padStart(2, '0');
    const localIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    timeInput.value = localIso;
    timeInput.min = localIso;
}

function syncResidentRegisteredAddress() {
    const addrInput = document.getElementById('req-address');
    if (!addrInput) return;
    const profile = window.currentUserProfile || JSON.parse(localStorage.getItem('resident') || '{}');
    if (profile && profile.address) {
        addrInput.value = profile.address;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupResidentSidebar();
    setLocalDeviceTimeToReqTime();
    syncResidentRegisteredAddress();

    const newReqModalEl = document.getElementById('newRequestModal');
    if (newReqModalEl) {
        newReqModalEl.addEventListener('show.bs.modal', (e) => {
            // Check for existing active requests
            const activeReq = (allRequests || []).find(r => ['Pending', 'Assigned', 'Accepted', 'In Progress'].includes(r.status));
            if (activeReq) {
                e.preventDefault();
                alert(`🛑 Waxaad horey u leedahay codsi furan (Request #${activeReq.request_id} - Status: ${activeReq.status}).\n\nMa codsan kartid qaadis cusub ilaa codsigaaga hadda shaqadiisa la dhameeyo (Completed) ama aad baajiso (Cancelled).`);
                return;
            }

            syncResidentActivePlan(window.currentUserProfile);
            setLocalDeviceTimeToReqTime();
            syncResidentRegisteredAddress();
        });
    }
});

async function showSection(sectionId, event = null) {
    if (typeof sectionId === 'object' && sectionId !== null) {
        event = sectionId;
        const target = event.currentTarget || event.target;
        const href = target ? (target.getAttribute('href') || target.closest('a')?.getAttribute('href')) : null;
        sectionId = href ? href.replace('#', '') : 'dashboard';
    }
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }
    if (!sectionId || typeof sectionId !== 'string') return;

    try {
        if (window.innerWidth < 992) {
            const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            if (sidebar) sidebar.classList.remove('show-mobile', 'expanded', 'show', 'active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active', 'show');
        }

        // Hide all section containers
        document.querySelectorAll('.section-container').forEach(el => {
            el.classList.add('d-none');
            el.style.display = 'none';
        });

        // Deactivate all sidebar nav links
        document.querySelectorAll('.sidebar .nav-link').forEach(el => el.classList.remove('active'));
        
        // Show target section
        const targetSec = document.getElementById(`${sectionId}-section`);
        if (targetSec) {
            targetSec.classList.remove('d-none');
            targetSec.style.display = 'block';
        }

        // Activate corresponding nav links
        const navLinks = document.querySelectorAll(`a[href="#${sectionId}"]`);
        navLinks.forEach(link => link.classList.add('active'));

        // Update URL hash
        if (window.location.hash !== '#' + sectionId) {
            history.pushState(null, null, '#' + sectionId);
        }

        if (sectionId === 'dashboard') try { await loadDashboard(); } catch(e) { console.error(e); }
        if (sectionId === 'requests') try { await loadRequests(); } catch(e) { console.error(e); }
        if (sectionId === 'payments') try { await loadPayments(); } catch(e) { console.error(e); }
        if (sectionId === 'settings') try { await loadSettings(); } catch(e) { console.error(e); }
    } catch (e) {
        console.error('Error in showSection:', e);
    }
}
window.showSection = showSection;

function handleHashNavigation() {
    let hash = window.location.hash.replace('#', '').trim();
    if (!hash || hash === 'index' || hash === 'login') {
        hash = 'dashboard';
    }
    showSection(hash);
}
window.addEventListener('hashchange', handleHashNavigation);

async function loadSettings() {
    try {
        const res = await apiCall('/auth.php?action=check_session');
        if (res && res.data) {
            const u = res.data;
            window.currentUserProfile = u;
            const pName = document.getElementById('profile-name');
            const pEmail = document.getElementById('profile-email');
            const pPhone = document.getElementById('profile-phone');
            const pAddress = document.getElementById('profile-address');
            const pPlan = document.getElementById('profile-plan');
            const pPic = document.getElementById('profile-preview');

            if (pName) pName.value = u.name || '';
            if (pEmail) pEmail.value = u.email || '';
            if (pPhone) pPhone.value = u.phone || '';
            if (pAddress) pAddress.value = u.address || '';
            if (pPlan) pPlan.value = u.subscription_plan || u.plan || 'Pay Per Pickup ($5.00)';
            if (pPic && u.profile_picture) pPic.src = u.profile_picture;
        }
    } catch (err) {
        console.error('Error loading resident settings:', err);
    }
}
window.loadSettings = loadSettings;

function renderResidentHeaderNotifications(notifData) {
    const headerList = document.getElementById('resNotifHeaderList');
    const badge = document.getElementById('resNotifBadge');
    const countEl = document.getElementById('resNotifCount');
    
    if (!headerList) return;
    
    const notifs = Array.isArray(notifData) ? notifData : [];
    headerList.innerHTML = '';
    
    if (notifs.length === 0) {
        headerList.innerHTML = '<div class="p-3 text-center text-muted small"><i class="fas fa-bell-slash text-secondary mb-1 d-block fs-5"></i> Wax notification ah maku jiraan.</div>';
        if (badge) badge.style.display = 'none';
        if (countEl) countEl.innerText = '0 New';
    } else {
        if (badge) {
            badge.innerText = notifs.length;
            badge.style.display = 'inline-block';
        }
        if (countEl) countEl.innerText = `${notifs.length} New`;
        
        notifs.forEach(notif => {
            const formattedBody = formatMessageWithContext(notif.message);
            const timeStr = notif.created_at ? new Date(notif.created_at).toLocaleString([], {month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : '';
            headerList.innerHTML += `
                <div class="list-group-item p-3 border-bottom bg-white">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <strong class="text-success fw-bold" style="font-size: 13px;"><i class="fas fa-bell me-1"></i> ${notif.title || 'Notification'}</strong>
                        <small class="text-muted" style="font-size: 10px;">${timeStr}</small>
                    </div>
                    <div class="text-dark" style="font-size: 12px; line-height: 1.4;">${formattedBody}</div>
                </div>
            `;
        });
    }
}
window.renderResidentHeaderNotifications = renderResidentHeaderNotifications;

async function loadDashboard() {
    try {
        // Fetch real notifications
        const res = await apiCall('/resident.php?action=get_notifications');
        const notifs = (res && res.data) ? res.data : [];
        renderResidentHeaderNotifications(notifs);

        const list = document.getElementById('notifications-list');
        if (list) {
            list.innerHTML = '';
            if (notifs.length === 0) {
                list.innerHTML = '<li class="list-group-item text-muted">No new notifications.</li>';
            } else {
                notifs.forEach(notif => {
                    const formattedBody = formatMessageWithContext(notif.message);
                    list.innerHTML += `
                        <li class="list-group-item d-flex justify-content-between align-items-start notification-card p-3 rounded mb-2 shadow-sm border-0 bg-white">
                            <div class="w-100">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 class="fw-bold mb-0 text-success"><i class="fas fa-bell me-1"></i> ${notif.title}</h6>
                                    <small class="text-muted" style="font-size: 11px;">${new Date(notif.created_at).toLocaleString()}</small>
                                </div>
                                <div style="font-size: 13px;">${formattedBody}</div>
                            </div>
                        </li>
                    `;
                });
            }
        }
        
        // Fetch active requests count and update quick status widget
        const reqRes = await apiCall('/resident.php?action=get_requests');
        if (reqRes && reqRes.data) {
            allRequests = reqRes.data;
            const activeReq = allRequests.find(r => ['Pending', 'Assigned', 'Accepted', 'In Progress'].includes(r.status));
            const statusCardEl = document.getElementById('dash-active-status');
            if (statusCardEl) {
                if (activeReq) {
                    statusCardEl.innerHTML = `
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="badge bg-warning text-dark mb-1">Active Request #${activeReq.request_id}</span>
                                <h6 class="fw-bold mb-0 text-dark">${activeReq.status}</h6>
                                <small class="text-muted">${activeReq.driver_name ? 'Driver: ' + activeReq.driver_name : 'Awaiting Driver Assignment'}</small>
                            </div>
                            <button class="btn btn-sm btn-outline-primary" onclick="showSection('requests')">View</button>
                        </div>
                    `;
                } else {
                    statusCardEl.innerHTML = `<p class="text-muted mb-0 small">No active pickups. You're ready to schedule a new one!</p>`;
                }
            }
        }

        // Fetch outstanding dues
        const duesRes = await apiCall('/resident.php?action=get_dues');
        if (duesRes && duesRes.data) {
            const dues = parseFloat(duesRes.data.dues || 0);
            const dueDisplay = document.getElementById('outstandingDues');
            if (dueDisplay) {
                dueDisplay.innerText = '$' + dues.toFixed(2);
                dueDisplay.className = dues > 0 ? 'text-danger fw-bold fs-4' : 'text-success fw-bold fs-4';
            }
        }
    } catch(err) {
        console.error("loadDashboard error:", err);
    }
}

document.getElementById('newRequestForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const profile = window.currentUserProfile || JSON.parse(localStorage.getItem('resident') || '{}');
    const reqTime = document.getElementById('req-time')?.value || new Date().toISOString();
    const reqAddress = (document.getElementById('req-address')?.value || profile.address || '').trim();
    const reqNotes = document.getElementById('req-notes')?.value || '';
    const chosenPlan = document.getElementById('req-plan')?.value || 'Pay Per Pickup ($5.00)';

    // Pre-check for active request
    const existingActive = (allRequests || []).find(r => ['Pending', 'Assigned', 'Accepted', 'In Progress'].includes(r.status));
    if (existingActive) {
        alert(`🛑 Waxaad horey u leedahay codsi furan (Request #${existingActive.request_id} - Status: ${existingActive.status}).\n\nMa codsan kartid qaadis cusub ilaa codsigaaga hadda shaqadiisa la dhameeyo (Completed) ama aad baajiso (Cancelled).`);
        return;
    }

    const regPlan = profile.subscription_plan || '';
    const isAlreadyMonthly = (regPlan.includes('15') || regPlan.toLowerCase().includes('monthly') || regPlan.includes('45') || regPlan.toLowerCase().includes('commercial'));
    const isChoosingMonthly = (chosenPlan.includes('15') || chosenPlan.toLowerCase().includes('monthly') || chosenPlan.includes('45') || chosenPlan.toLowerCase().includes('commercial'));

    // Hide newRequestModal
    const reqModalEl = document.getElementById('newRequestModal');
    if (reqModalEl) {
        const reqModal = bootstrap.Modal.getInstance(reqModalEl) || new bootstrap.Modal(reqModalEl);
        reqModal.hide();
    }

    // Check if resident is already on active monthly/commercial plan or selecting their active monthly plan
    if (isAlreadyMonthly || (isChoosingMonthly && chosenPlan === regPlan)) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const payPayload = {
                amount: 0.00,
                method: 'Monthly Subscription',
                request_time: reqTime,
                address: reqAddress,
                notes: reqNotes,
                plan: regPlan || chosenPlan
            };

            const res = await apiCall('/resident.php?action=create_and_pay_request', 'POST', payPayload);
            e.target.reset();

            alert('🎉 Pickup Request Scheduled Successfully!\nYour pickup request is covered under your active Monthly Subscription ($0.00 fee).');
            showSection('requests');
            loadDashboard();
            loadRequests();
            loadPayments();
        } catch (err) {
            alert(err.message || 'Error scheduling pickup request.');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
        return;
    }

    // Determine plan amount for non-monthly users or new monthly subscription signups
    let amt = 5.00;
    if (chosenPlan.includes('45') || chosenPlan.toLowerCase().includes('commercial')) {
        amt = 45.00;
    } else if (chosenPlan.includes('15') || chosenPlan.toLowerCase().includes('monthly')) {
        amt = 15.00;
    } else if (chosenPlan.includes('5') || chosenPlan.toLowerCase().includes('pickup')) {
        amt = 5.00;
    }

    // Save pending pickup form data in memory (DO NOT insert into DB until PIN is entered!)
    window.pendingPickupData = {
        request_time: reqTime,
        address: reqAddress,
        notes: reqNotes,
        plan: chosenPlan,
        amount: amt
    };

    e.target.reset();

    // Auto-fill Payment Modal with chosen plan, amount, and resident phone number
    const payAmountInput = document.getElementById('pay-amount');
    if (payAmountInput) payAmountInput.value = amt.toFixed(2);

    const payBtn = document.getElementById('payBtn');
    if (payBtn) payBtn.innerHTML = `<i class="fas fa-lock me-1"></i> Pay Now ($${amt.toFixed(2)})`;

    const ussdAmt = document.getElementById('ussd-amount');
    if (ussdAmt) ussdAmt.innerText = amt.toFixed(2);

    // Fetch resident phone
    const resUser = window.currentUserProfile || JSON.parse(localStorage.getItem('resident') || '{}');
    const payPhoneInput = document.getElementById('pay-phone');
    if (payPhoneInput) {
        payPhoneInput.value = resUser.phone || '+252 615 000 000';
    }

    // Immediately open Make a Payment modal
    setTimeout(() => {
        const payModalEl = document.getElementById('paymentModal');
        if (payModalEl) {
            const payModal = bootstrap.Modal.getInstance(payModalEl) || new bootstrap.Modal(payModalEl);
            payModal.show();
        }
    }, 200);
});

let allRequests = [];
let currentRequestFilter = 'All';

async function loadRequests() {
    try {
        const res = await apiCall('/resident.php?action=get_requests');
        allRequests = res.data;
        renderRequests();
    } catch (err) {
        document.getElementById('requests-container').innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
}

function renderRequests() {
    const container = document.getElementById('requests-container');
    container.innerHTML = '';
    
    let filteredRequests = allRequests;
    if (currentRequestFilter === 'Pending') {
        filteredRequests = allRequests.filter(r => r.status === 'Pending');
    } else if (currentRequestFilter === 'Assigned') {
        filteredRequests = allRequests.filter(r => r.status === 'Assigned' || r.status === 'Accepted' || r.status === 'In Progress');
    } else if (currentRequestFilter === 'Completed') {
        filteredRequests = allRequests.filter(r => r.status === 'Completed');
    }

    if (filteredRequests.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-muted">No pick-up requests found for this filter.</p></div>';
        return;
    }

    filteredRequests.forEach(req => {
        const badgeClass = req.status === 'Pending' ? 'bg-warning text-dark' : 
                         (req.status === 'Assigned' ? 'bg-info text-white' : 
                         (req.status === 'Accepted' ? 'bg-primary text-white' : 
                         (req.status === 'In Progress' ? 'text-white' : 'bg-success text-white')));
        const badgeStyle = req.status === 'In Progress' ? 'background-color: #6f42c1 !important; color: white;' : '';
        
        const isPaid = (req.payment_status === 'Paid' || req.payment_status === 'Completed' || (req.logs && req.logs.some(l => l.action === 'Payment Received')));
        const payBadgeHtml = isPaid 
            ? `<span class="badge bg-success ms-2" style="border-radius: 20px; padding: 6px 10px;"><i class="fas fa-check-circle me-1"></i> Paid</span>` 
            : `<span class="badge bg-danger ms-2" style="border-radius: 20px; padding: 6px 10px;"><i class="fas fa-exclamation-circle me-1"></i> Unpaid</span>`;

        let cancelBtnHtml = '';
        if (req.status === 'Pending') {
            cancelBtnHtml = `<button class="btn btn-outline-danger btn-sm mt-3 w-100 fw-bold" style="border-radius: 8px;" onclick="cancelRequest(${req.request_id})"><i class="fas fa-times me-1"></i> Cancel Request</button>`;
        }

        // Render logs
        let logsHtml = '';
        if (req.logs && req.logs.length > 0) {
            req.logs.forEach(log => {
                logsHtml += `
                    <li>
                        <span class="timeline-date">${new Date(log.created_at).toLocaleString([], {month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true})}</span>
                        <span class="timeline-text">${log.message}</span>
                    </li>
                `;
            });
        } else {
            // fallback generic log
            logsHtml = `
                <li>
                    <span class="timeline-date">${new Date(req.request_time).toLocaleString()}</span>
                    <span class="timeline-text">Request submitted by resident</span>
                </li>
            `;
        }

        container.innerHTML += `
            <div class="card shadow-sm border-0" style="border-radius: 12px;">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="card-title mb-0 fw-bold">Request #${req.request_id}</h5>
                        <div>
                            <span class="badge ${badgeClass} fw-bold" style="border-radius: 20px; padding: 6px 12px; ${badgeStyle}">${req.status}</span>
                            ${payBadgeHtml}
                        </div>
                    </div>
                    <p class="card-text mb-2"><strong>Pickup Time:</strong> ${new Date(req.request_time).toLocaleString()}</p>
                    ${req.driver_name ? `<p class="card-text mb-2 text-primary"><i class="fas fa-truck me-1"></i> <strong>Driver:</strong> ${req.driver_name}</p>` : '<p class="card-text mb-2 text-muted"><i class="fas fa-clock me-1"></i> <strong>Driver:</strong> Pending Admin Assignment</p>'}
                    <div class="card-text mb-3"><strong>Address:</strong> ${formatAddress(req.address)}</div>
                    
                    <hr class="text-muted">
                    <h6 class="mb-3 fw-bold text-muted" style="font-size: 14px;">Status Logs</h6>
                    <ul class="timeline-list">
                        ${logsHtml}
                    </ul>
                    ${cancelBtnHtml}
                </div>
            </div>
        `;
    });
}

// Request Filter Tabs Click Logic
document.addEventListener('DOMContentLoaded', () => {
    const filterTabs = document.querySelectorAll('#requestFilterTabs .nav-link');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            // Remove active classes
            filterTabs.forEach(t => {
                t.classList.remove('active');
                t.classList.add('text-muted');
                t.classList.remove('text-white');
            });
            // Set active class
            this.classList.add('active');
            this.classList.remove('text-muted');
            this.classList.add('text-white');
            
            currentRequestFilter = this.getAttribute('data-filter');
            renderRequests();
        });
    });
});

// Payment Form Submit / Pay Now Click with USSD Simulation
window.handlePayNowClick = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    let amount = parseFloat(document.getElementById('pay-amount')?.value) || 5.00;
    if (isNaN(amount) || amount <= 0) {
        amount = 5.00;
    }
    
    const activeTab = document.querySelector('#paymentTab .active')?.id;
    let method = activeTab === 'credit-card-tab' ? 'Credit Card' : 'Mobile Money';
    
    if (method === 'Mobile Money') {
        let phoneInput = document.getElementById('pay-phone');
        let phone = phoneInput ? phoneInput.value.trim() : '';
        
        // If phone is empty, fill with default resident phone
        if (!phone) {
            const resUser = window.currentUserProfile || JSON.parse(localStorage.getItem('resident') || '{}');
            phone = resUser.phone || '+252 615 000 000';
            if (phoneInput) phoneInput.value = phone;
        }
        
        // Hide payment modal
        const payModalEl = document.getElementById('paymentModal');
        if (payModalEl) {
            const m = bootstrap.Modal.getInstance(payModalEl) || bootstrap.Modal.getOrCreateInstance(payModalEl);
            m.hide();
        }
        
        // Open EVC Plus USSD PIN prompt
        setTimeout(() => {
            const ussdAmtEl = document.getElementById('ussd-amount');
            if (ussdAmtEl) ussdAmtEl.innerText = parseFloat(amount).toFixed(2);
            
            const pinEl = document.getElementById('ussd-pin');
            if (pinEl) {
                pinEl.value = '';
            }

            const ussdModalEl = document.getElementById('ussdModal');
            if (ussdModalEl) {
                const ussdModal = bootstrap.Modal.getOrCreateInstance(ussdModalEl);
                ussdModal.show();
                setTimeout(() => {
                    if (pinEl) pinEl.focus();
                }, 350);
            }
            
            // Handle USSD Send
            const sendBtn = document.getElementById('ussd-send');
            if (sendBtn) {
                sendBtn.onclick = async function() {
                    const pin = document.getElementById('ussd-pin')?.value || '';
                    if (pin.length < 4) {
                        alert('Fadlan geli PIN-kaaga 4-ta lambar ah (e.g. 1234).');
                        document.getElementById('ussd-pin')?.focus();
                        return;
                    }
                    
                    const uModal = bootstrap.Modal.getInstance(ussdModalEl) || bootstrap.Modal.getOrCreateInstance(ussdModalEl);
                    if (uModal) uModal.hide();
                    await processPayment(amount, method);
                };
            }
            
            // Handle Enter key on PIN
            if (pinEl) {
                pinEl.onkeyup = function(evt) {
                    if (evt.key === 'Enter') {
                        if (sendBtn) sendBtn.click();
                    }
                };
            }

            // Handle USSD Cancel
            const cancelBtn = document.getElementById('ussd-cancel');
            if (cancelBtn) {
                cancelBtn.onclick = function() {
                    const uModal = bootstrap.Modal.getInstance(ussdModalEl) || bootstrap.Modal.getOrCreateInstance(ussdModalEl);
                    if (uModal) uModal.hide();
                    alert("Lacag bixintii EVC Plus waa la joojiyey.");
                };
            }
        }, 200);

    } else {
        // Credit Card logic
        processPayment(amount, method);
    }
};

document.getElementById('paymentForm')?.addEventListener('submit', window.handlePayNowClick);

async function processPayment(amount, method) {
    const payBtn = document.getElementById('payBtn');
    const originalText = payBtn ? payBtn.innerHTML : 'Pay';
    if (payBtn) {
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Processing...';
        payBtn.disabled = true;
    }

    try {
        const pickupData = window.pendingPickupData || {};
        const payPayload = { 
            amount: parseFloat(amount), 
            method: method,
            request_time: pickupData.request_time || new Date().toISOString(),
            address: pickupData.address || '',
            notes: pickupData.notes || '',
            plan: pickupData.plan || 'Pay Per Pickup ($5.00)'
        };
        
        await apiCall('/resident.php?action=create_and_pay_request', 'POST', payPayload);
        window.pendingPickupData = null;
        
        // Refresh user profile after payment so frontend immediately knows resident is on Monthly Subscription
        try {
            const profRes = await apiCall('/resident.php?action=get_profile');
            if (profRes && profRes.data) {
                window.currentUserProfile = profRes.data;
                localStorage.setItem('resident', JSON.stringify(profRes.data));
                syncResidentActivePlan(profRes.data);
            }
        } catch (eProf) {}
        
        setTimeout(() => {
            alert(method === 'Mobile Money' ? `🎉 EVC Plus Payment Successful!\n$${parseFloat(amount).toFixed(2)} has been paid for your waste collection request.` : `🎉 Payment of $${parseFloat(amount).toFixed(2)} via ${method} successful!`);
            const payModalEl = document.getElementById('paymentModal');
            if (payModalEl) {
                const m = bootstrap.Modal.getInstance(payModalEl);
                if (m) m.hide();
            }
            
            // Reset button
            if (payBtn) {
                payBtn.innerHTML = originalText;
                payBtn.disabled = false;
            }
            
            // Automatically switch resident view to "My Requests" tab
            showSection('requests');

            // Refresh dashboard, requests & payments
            loadDashboard();
            loadRequests();
            loadPayments();
            
        }, 500);

    } catch (err) {
        alert(err.message || 'Payment processing failed');
        if (payBtn) {
            payBtn.innerHTML = originalText;
            payBtn.disabled = false;
        }
    }
}

function updatePayModalPlanAmount(planText) {
    let amt = 5.00;
    if (planText.includes('15') || planText.toLowerCase().includes('monthly')) {
        amt = 15.00;
    } else if (planText.includes('45') || planText.toLowerCase().includes('commercial')) {
        amt = 45.00;
    } else if (planText.includes('5') || planText.toLowerCase().includes('pickup')) {
        amt = 5.00;
    }
    
    const amtInput = document.getElementById('pay-amount');
    if (amtInput) amtInput.value = amt.toFixed(2);
    
    const btn = document.getElementById('payBtn');
    if (btn) btn.innerHTML = `<i class="fas fa-lock me-1"></i> Pay Now ($${amt.toFixed(2)})`;
    
    const ussdAmt = document.getElementById('ussd-amount');
    if (ussdAmt) ussdAmt.innerText = amt.toFixed(2);
}

// Set initial button text & unchangeable amount when modal opens
document.getElementById('paymentModal')?.addEventListener('show.bs.modal', function () {
    const resident = window.currentUserProfile || JSON.parse(localStorage.getItem('resident') || '{}');
    const regPlan = resident.subscription_plan || resident.plan || '';
    const reqPlan = document.getElementById('req-plan');
    
    let val = 5.00; // default
    if (reqPlan && reqPlan.value) {
        if (reqPlan.value.includes('45') || reqPlan.value.toLowerCase().includes('commercial')) val = 45.00;
        else if (reqPlan.value.includes('15') || reqPlan.value.toLowerCase().includes('monthly')) val = 15.00;
        else if (reqPlan.value.includes('5') || reqPlan.value.toLowerCase().includes('pickup')) val = 5.00;
    } else if (regPlan) {
        if (regPlan.includes('45') || regPlan.toLowerCase().includes('commercial')) val = 45.00;
        else if (regPlan.includes('15') || regPlan.toLowerCase().includes('monthly')) val = 15.00;
        else if (regPlan.includes('5') || regPlan.toLowerCase().includes('pickup')) val = 5.00;
    }

    const amountInput = document.getElementById('pay-amount');
    if (amountInput) {
        if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
            amountInput.value = val.toFixed(2);
        }
    }

    const currentAmt = parseFloat(amountInput ? amountInput.value : val) || val;
    const payBtn = document.getElementById('payBtn');
    if (payBtn) payBtn.innerHTML = `<i class="fas fa-lock me-1"></i> Pay Now ($${currentAmt.toFixed(2)})`;
    const ussdAmt = document.getElementById('ussd-amount');
    if (ussdAmt) ussdAmt.innerText = currentAmt.toFixed(2);

    const payPhone = document.getElementById('pay-phone');
    if (payPhone && !payPhone.value) {
        payPhone.value = resident.phone || '+252 615 000 000';
    }
});

async function loadPayments() {
    try {
        const res = await apiCall('/resident.php?action=get_payments');
        const tbody = document.getElementById('payments-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        const payments = (res && Array.isArray(res.data)) ? res.data.filter(p => p.status === 'Completed') : [];

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No completed payments found.</td></tr>';
            return;
        }

        payments.forEach(pay => {
            const badgeClass = 'badge-completed';
            const methodIcon = (pay.method === 'Mobile Money' || pay.method === 'EVC Plus') ? '<i class="fas fa-mobile-alt me-1 text-primary"></i> EVC Plus' : '<i class="fas fa-credit-card me-1 text-info"></i> Credit Card';
            const payDate = pay.paid_at ? new Date(pay.paid_at).toLocaleString() : new Date().toLocaleString();
            
            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold text-secondary">#${pay.payment_id}</td>
                    <td>${payDate}</td>
                    <td><strong style="font-weight: 600; color: #212529;">$${parseFloat(pay.amount).toFixed(2)}</strong></td>
                    <td>${methodIcon}</td>
                    <td><span class="badge ${badgeClass} fw-bold" style="border-radius: 20px; padding: 6px 12px;">Completed</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary" onclick="downloadReceipt(${pay.payment_id}, '${parseFloat(pay.amount).toFixed(2)}', '${payDate}', '${pay.resident_name || ''}', '${pay.driver_name || 'Not Assigned'}')"><i class="fas fa-file-invoice"></i> Receipt</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('reportForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageBase = document.getElementById('rep-message')?.value || '';
    const category = document.getElementById('rep-category')?.value || 'General';
    
    // Prepend category to the message for the backend
    const message = `[${category}] ${messageBase}`;
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerHTML : 'Send';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Sending...';
        btn.disabled = true;
    }
    
    try {
        await apiCall('/resident.php?action=send_report', 'POST', { message });
        
        setTimeout(() => {
            alert('Report sent successfully!');
            const modalEl = document.getElementById('reportModal');
            if (modalEl) {
                const m = bootstrap.Modal.getInstance(modalEl);
                if (m) m.hide();
            }
            e.target.reset();
            const att = document.getElementById('attachment-name');
            if (att) att.classList.add('d-none');
            
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }, 1000);
        
    } catch (err) {
        alert(err.message);
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
});

// Show attachment file name when selected
document.getElementById('rep-attachment')?.addEventListener('change', function(e) {
    const fileNameDisplay = document.getElementById('attachment-name');
    if(this.files && this.files.length > 0) {
        if (fileNameDisplay) {
            fileNameDisplay.innerHTML = `<i class="fas fa-check-circle me-1"></i> Attached: ${this.files[0].name}`;
            fileNameDisplay.classList.remove('d-none');
        }
    } else {
        if (fileNameDisplay) fileNameDisplay.classList.add('d-none');
    }
});

async function cancelRequest(requestId) {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
        await apiCall('/resident.php?action=cancel_request', 'POST', { request_id: requestId });
        alert('Request cancelled successfully');
        loadRequests();
    } catch (err) {
        alert(err.message);
    }
}

function getLocation() {
    const btn = document.getElementById('getLocationBtn');
    const addressInput = document.getElementById('req-address');
    
    if (navigator.geolocation) {
        if (btn) {
            btn.innerHTML = '⏳ Locating...';
            btn.disabled = true;
        }
        
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
            
            if (addressInput) {
                if(addressInput.value.trim() === '') {
                    addressInput.value = mapsLink;
                } else {
                    addressInput.value += '\n' + mapsLink;
                }
            }
            
            if (btn) btn.innerHTML = '✅ Location Shared';
            setTimeout(() => {
                if (btn) {
                    btn.innerHTML = '📍 Share Live Location';
                    btn.disabled = false;
                }
            }, 3000);
            
        }, function(error) {
            alert('Error getting location: Please allow location access in your browser.');
            if (btn) {
                btn.innerHTML = '📍 Share Live Location';
                btn.disabled = false;
            }
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Auto-fill registered address & default pickup time when newRequestModal opens
const newReqModalEl = document.getElementById('newRequestModal');
if (newReqModalEl) {
    newReqModalEl.addEventListener('show.bs.modal', async function () {
        const addressInput = document.getElementById('req-address');
        const timeInput = document.getElementById('req-time');
        
        // 1. Auto-fill address from resident profile
        let resident = JSON.parse(localStorage.getItem('resident')) || {};
        if (!resident.address) {
            try {
                const res = await apiCall('/resident.php?action=get_profile');
                if (res && res.data) {
                    resident = res.data;
                    localStorage.setItem('resident', JSON.stringify(resident));
                }
            } catch(e) {}
        }
        
        if (addressInput && resident.address) {
            addressInput.value = resident.address;
        }
        
        // 2. Set default date-time to upcoming hour if empty
        if (timeInput && !timeInput.value) {
            const now = new Date();
            now.setHours(now.getHours() + 1);
            now.setMinutes(0);
            timeInput.value = now.toISOString().slice(0, 16);
        }
    });
}

window.downloadReceipt = function(paymentId, amount, date, residentName, driverName) {
    const receiptHtml = `
        <html>
        <head>
            <title>Receipt #${paymentId}</title>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; background: #f9f9f9; }
                .receipt { background: #fff; padding: 30px; border-radius: 10px; max-width: 400px; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                .header { text-align: center; border-bottom: 2px dashed #eee; padding-bottom: 20px; margin-bottom: 20px; }
                .header h2 { color: #28a745; margin: 0; }
                .row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 16px; }
                .total { border-top: 2px solid #eee; padding-top: 15px; font-weight: bold; font-size: 20px; }
                .footer { text-align: center; color: #888; font-size: 14px; margin-top: 30px; }
                .actions { text-align: center; margin-top: 20px; }
                .actions button { padding: 10px 20px; margin: 0 10px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
                .btn-print { background: #6c757d; color: white; }
                .btn-download { background: #0d6efd; color: white; }
                @media print {
                    .no-print { display: none !important; }
                    body { padding: 0; background: #fff; }
                    .receipt { box-shadow: none; max-width: 100%; }
                }
            </style>
        </head>
        <body>
            <div class="receipt" id="receipt-content">
                <div class="header">
                    <h2><span style="font-size: 24px;">&#10003;</span> Payment Receipt</h2>
                    <p style="color:#666; margin-top: 5px;">Smart Waste Collection</p>
                </div>
                <div class="row"><span>Payment ID:</span> <strong>#${paymentId}</strong></div>
                <div class="row"><span>Date:</span> <strong>${date}</strong></div>
                <div class="row"><span>Resident Name:</span> <strong>${residentName}</strong></div>
                <div class="row"><span>Driver / Collector:</span> <strong>${driverName}</strong></div>
                <div class="row total"><span>Amount Paid:</span> <strong>$${amount}</strong></div>
                <div class="footer">Thank you for your payment!</div>
            </div>
            
            <div class="actions no-print">
                <button class="btn-print" onclick="window.print()">🖨️ Print Receipt</button>
                <button class="btn-download" onclick="downloadPDF()">📄 Download PDF</button>
            </div>
            
            <script>
                async function downloadPDF() {
                    const element = document.getElementById('receipt-content');
                    const opt = {
                      margin:       0.5,
                      filename:     'Receipt_${paymentId}.pdf',
                      image:        { type: 'jpeg', quality: 0.98 },
                      html2canvas:  { scale: 2 },
                      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                    };
                    html2pdf().set(opt).from(element).save();
                }
            </script>
        </body>
        </html>
    `;
    const newWindow = window.open('', '_blank', 'width=600,height=700');
    if(newWindow) {
        newWindow.document.write(receiptHtml);
        newWindow.document.close();
    } else {
        alert("Please allow popups to view the receipt.");
    }
};

// --- Settings Section Logic ---

async function loadSettings() {
    try {
        const res = await apiCall('/resident.php?action=get_profile');
        const profile = res.data;
        if (profile) {
            window.currentUserProfile = profile;
            localStorage.setItem('resident', JSON.stringify(profile));

            if (profile.name) {
                const navNameEl = document.getElementById('nav-resident-name');
                if (navNameEl) navNameEl.innerText = profile.name;
            }
            if (document.getElementById('profile-name')) document.getElementById('profile-name').value = profile.name || '';
            if (document.getElementById('profile-email')) document.getElementById('profile-email').value = profile.email || '';
            if (document.getElementById('profile-phone')) document.getElementById('profile-phone').value = profile.phone || '';
            if (document.getElementById('profile-address')) document.getElementById('profile-address').value = profile.address || '';
            if (document.getElementById('profile-plan')) document.getElementById('profile-plan').value = profile.subscription_plan || 'Pay Per Pickup ($5/Pickup)';
            
            if (profile.profile_picture) {
                const preview = document.getElementById('profile-preview');
                if (preview) {
                    preview.src = profile.profile_picture.startsWith('http') || profile.profile_picture.startsWith('data:') ? profile.profile_picture : '../' + profile.profile_picture;
                }
                const navPic = document.getElementById('nav-profile-pic');
                const navIcon = document.getElementById('nav-profile-icon');
                if (navPic) {
                    navPic.src = profile.profile_picture.startsWith('http') || profile.profile_picture.startsWith('data:') ? profile.profile_picture : '../' + profile.profile_picture;
                    navPic.classList.remove('d-none');
                }
                if (navIcon) navIcon.classList.add('d-none');
            }
        }
    } catch (err) {
        console.error("loadSettings error:", err);
    }
}

async function uploadResidentProfilePic(input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
        alert('Fadlan soo geli sawir ka yar 5MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Data = e.target.result;
        const preview = document.getElementById('profile-preview');
        if (preview) preview.src = base64Data;

        try {
            const res = await apiCall('/resident.php?action=update_profile_pic', 'POST', { profile_pic: base64Data });
            const savedPic = (res && res.data && res.data.profile_picture) ? res.data.profile_picture : base64Data;
            
            let resident = JSON.parse(localStorage.getItem('resident') || '{}');
            resident.profile_picture = savedPic;
            localStorage.setItem('resident', JSON.stringify(resident));
            window.currentUserProfile = resident;

            const navPic = document.getElementById('nav-profile-pic');
            const navIcon = document.getElementById('nav-profile-icon');
            if (navPic) {
                navPic.src = savedPic.startsWith('http') || savedPic.startsWith('data:') ? savedPic : '../' + savedPic;
                navPic.classList.remove('d-none');
            }
            if (navIcon) navIcon.classList.add('d-none');

            alert('🎉 Sawirkaaga profile-ka si guul leh ayaa loo beddelay!');
        } catch (err) {
            console.error("Profile picture upload failed:", err);
            alert('Cillad ayaa dhacday markii sawirka la keydinayay: ' + (err.message || 'Server error'));
        }
    };
    reader.readAsDataURL(file);
}

window.uploadResidentProfilePic = uploadResidentProfilePic;

async function updateResidentProfile(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('saveProfileBtn') || document.querySelector('#profileForm button[type="submit"]');
    const originalText = btn ? btn.innerHTML : 'Save Profile Details';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Saving...';
        btn.disabled = true;
    }

    try {
        const name = document.getElementById('profile-name')?.value.trim();
        const phone = document.getElementById('profile-phone')?.value.trim();
        const address = document.getElementById('profile-address')?.value.trim();
        const subscription_plan = document.getElementById('profile-plan')?.value || 'Pay Per Pickup ($5.00)';

        const res = await apiCall('/resident.php?action=update_profile', 'POST', {
            name: name,
            phone: phone,
            address: address,
            subscription_plan: subscription_plan
        });

        if (res && res.status === 'success') {
            alert('🎉 Xogtaada profile-ka si guul leh ayaa loo cusboonaysiiyay!');
            const userEl = document.getElementById('user-name');
            if (userEl && name) userEl.innerText = name;
            const navNameEl = document.getElementById('nav-resident-name');
            if (navNameEl && name) navNameEl.innerText = name;

            let resident = JSON.parse(localStorage.getItem('resident') || '{}');
            resident.name = name || resident.name;
            resident.phone = phone || resident.phone;
            resident.address = address || resident.address;
            resident.subscription_plan = subscription_plan;
            localStorage.setItem('resident', JSON.stringify(resident));
            window.currentUserProfile = resident;
            syncResidentActivePlan(resident);
            syncResidentRegisteredAddress();
        } else {
            alert(res?.message || 'Cillad ayaa dhacday.');
        }
    } catch (err) {
        alert(err.message || 'Cillad ayaa dhacday.');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

window.updateResidentProfile = updateResidentProfile;

document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password')?.value || '';
    const newPassword = document.getElementById('new-password')?.value || '';
    const confirmPassword = document.getElementById('confirm-password')?.value || '';

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerHTML : 'Update';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Updating...';
        btn.disabled = true;
    }

    try {
        await apiCall('/resident.php?action=update_password', 'POST', {
            current_password: currentPassword,
            new_password: newPassword
        });
        alert('Password updated successfully!');
        e.target.reset();
    } catch (err) {
        alert(err.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
});

document.getElementById('notificationsForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerHTML : 'Save';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Saving...';
        btn.disabled = true;
    }

    // Simulate saving preferences
    setTimeout(() => {
        alert('Notification preferences saved successfully!');
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }, 800);
});

function downloadResidentStatementPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const residentName = document.getElementById('user-name')?.innerText || 'Resident';

        doc.setFontSize(16);
        doc.setTextColor(46, 125, 50);
        doc.text("Smart Waste Management System - Personal Statement", 14, 18);

        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`Account Holder: ${residentName}`, 14, 25);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 31);

        const rows = [];
        const tableBody = document.getElementById('requests-tbody');
        if (tableBody) {
            tableBody.querySelectorAll('tr').forEach(tr => {
                const cols = tr.querySelectorAll('td');
                if (cols.length >= 5) {
                    rows.push([
                        cols[0].innerText.trim(),
                        cols[1].innerText.trim(),
                        cols[2].innerText.trim(),
                        cols[3].innerText.trim(),
                        cols[4].innerText.trim()
                    ]);
                }
            });
        }

        if (rows.length === 0) {
            alert("No request records found to generate statement!");
            return;
        }

        doc.autoTable({
            head: [["ID", "Date/Time", "Address / Location", "Status", "Payment"]],
            body: rows,
            startY: 38,
            theme: 'grid',
            headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255] }
        });

        doc.save(`Personal_Waste_Statement_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
        console.error("PDF download error:", err);
        alert("Failed to download PDF statement: " + err.message);
    }
}
