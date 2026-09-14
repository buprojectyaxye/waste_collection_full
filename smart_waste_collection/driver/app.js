function setupDriverSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebarMenu') || document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    function toggleSidebar() {
        if (!sidebar) return;
        if (window.innerWidth < 992) {
            const isOpen = sidebar.classList.contains('expanded') || sidebar.classList.contains('show') || sidebar.classList.contains('active');
            if (isOpen) {
                sidebar.classList.remove('expanded', 'show', 'active', 'open');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active', 'show');
            } else {
                sidebar.classList.add('expanded', 'show', 'active', 'open');
                if (sidebarOverlay) sidebarOverlay.classList.add('active', 'show');
            }
        } else {
            sidebar.classList.toggle('collapsed');
            if (mainContent) mainContent.classList.toggle('collapsed');
        }
    }

    function hideSidebar() {
        if (sidebar) {
            sidebar.classList.remove('expanded', 'show', 'active', 'open');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active', 'show');
        }
    }

    if (sidebarToggle) {
        sidebarToggle.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        };
    }

    if (sidebarOverlay) {
        sidebarOverlay.onclick = function(e) {
            e.preventDefault();
            hideSidebar();
        };
    }

    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 992) {
                hideSidebar();
            }
        });
    });
}

window.allDriverNotifications = [];

async function initDriverApp() {
    setupDriverSidebar();
    apiCall('/auth.php?action=me&role=driver').then(res => {
        if(res.data.type !== 'driver') {
            window.location.href = 'login.html';
        } else {
            loadJobs();
            loadSettings();
            loadDriverNotifications();
            // Start periodic updates
            setInterval(loadDriverNotifications, 15000); // Check for admin replies every 15s
            setInterval(updateLocation, 60000); // every minute
        }
    }).catch(() => {
        window.location.href = 'login.html';
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupDriverSidebar();
        initDriverApp();
    });
} else {
    setupDriverSidebar();
    initDriverApp();
}

async function showSection(sectionId) {
    if (window.innerWidth < 992) {
        const sidebar = document.getElementById('sidebarMenu') || document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('expanded', 'show', 'active', 'open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active', 'show');
    }

    document.querySelectorAll('.section-container').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('.sidebar .nav-link').forEach(el => el.classList.remove('active'));
    
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) targetSection.classList.remove('d-none');
    
    const navLink = document.querySelector(`.sidebar a[href="#${sectionId}"]`);
    if (navLink) navLink.classList.add('active');

    if(sectionId === 'jobs') loadJobs();
    if(sectionId === 'history') loadHistory();
    if(sectionId === 'messages') loadDriverNotifications(true);
    if(sectionId === 'settings') loadSettings();
    if(sectionId === 'map') {
        setTimeout(() => {
            if (typeof initMap === 'function') {
                initMap();
            }
            if (routeMap) {
                routeMap.invalidateSize(true);
            }
        }, 100);
        setTimeout(() => {
            if (routeMap) {
                routeMap.invalidateSize(true);
            }
        }, 350);
    }
}
window.showSection = showSection;

async function loadDriverNotifications(isManual = false) {
    try {
        const res = await apiCall('/driver.php?action=get_notifications');
        const rawNotifs = (res && res.data && Array.isArray(res.data)) ? res.data : [];
        const notifs = rawNotifs.filter(n => {
            const title = (n.title || '').toLowerCase();
            const msg = (n.message || '').toLowerCase();
            if (title.includes('job assigned') || title.includes('new job') || title.includes('job assign')) return false;
            if (msg.includes('you have been assigned to pickup request')) return false;
            return true;
        });
        window.allDriverNotifications = notifs;

        const unreadList = notifs.filter(n => n.is_read == 0);
        const unreadCount = unreadList.length;

        // Update Navbar Bell Badge
        const badge = document.getElementById('driverNotifBadge');
        const countText = document.getElementById('driverNotifCount');
        if (badge) {
            badge.innerText = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }
        if (countText) {
            countText.innerText = `${unreadCount} New`;
        }

        // Update Sidebar Badge
        const sideBadge = document.getElementById('driverSidebarMsgBadge');
        if (sideBadge) {
            sideBadge.innerText = unreadCount;
            if (unreadCount > 0) {
                sideBadge.classList.remove('d-none');
            } else {
                sideBadge.classList.add('d-none');
            }
        }

        // Render Navbar Dropdown List
        const listEl = document.getElementById('driverNotifList');
        if (listEl) {
            if (notifs.length === 0) {
                listEl.innerHTML = '<div class="p-3 text-center text-muted small">No notifications or replies yet.</div>';
            } else {
                listEl.innerHTML = '';
                notifs.slice(0, 10).forEach(n => {
                    const isUnread = n.is_read == 0;
                    const bgClass = isUnread ? 'bg-success-subtle text-dark fw-semibold' : 'bg-white text-muted';
                    const iconBg = isUnread ? 'bg-success text-white' : 'bg-light text-secondary';
                    const timeFormatted = new Date(n.created_at).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
                    
                    listEl.innerHTML += `
                        <a href="javascript:void(0)" onclick="openDriverNotification(${n.notification_id}); return false;" class="list-group-item list-group-item-action p-3 border-bottom ${bgClass} d-flex align-items-start gap-2 cursor-pointer">
                            <div class="rounded-circle ${iconBg} p-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; min-width: 32px;">
                                <i class="fas fa-comment-dots" style="font-size: 13px;"></i>
                            </div>
                            <div class="flex-grow-1 overflow-hidden">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong class="text-dark small text-truncate" style="max-width: 170px;">${n.title || 'Admin Message'}</strong>
                                    <small class="text-muted" style="font-size: 11px;">${timeFormatted}</small>
                                </div>
                                <div class="text-muted small text-truncate" style="font-size: 12px;">
                                    ${(n.message || '').replace(/</g, '&lt;')}
                                </div>
                            </div>
                        </a>
                    `;
                });
            }
        }

        // Render Feed in Messages Section
        const feedEl = document.getElementById('driverMessagesFeed');
        if (feedEl) {
            if (notifs.length === 0) {
                feedEl.innerHTML = `
                    <div class="p-5 text-center text-muted">
                        <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                        <h6>No Messages or Admin Responses Yet</h6>
                        <p class="small mb-0">When you send emergency reports or vehicle issues, Admin replies will appear here in real time.</p>
                    </div>
                `;
            } else {
                feedEl.innerHTML = '';
                notifs.forEach(n => {
                    const isUnread = n.is_read == 0;
                    const unreadBadge = isUnread ? '<span class="badge bg-danger rounded-pill ms-2">New</span>' : '';
                    const timeFormatted = new Date(n.created_at).toLocaleString();

                    feedEl.innerHTML += `
                        <div class="list-group-item p-4 border-bottom ${isUnread ? 'bg-light' : 'bg-white'}">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="d-flex align-items-center">
                                    <div class="bg-success text-white rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                        <i class="fas fa-user-shield fs-5"></i>
                                    </div>
                                    <div>
                                        <h6 class="fw-bold mb-0 text-dark">${n.title || 'Admin Response'} ${unreadBadge}</h6>
                                        <small class="text-muted"><i class="fas fa-clock me-1"></i>${timeFormatted}</small>
                                    </div>
                                </div>
                                <button class="btn btn-outline-success btn-sm rounded-pill px-3" onclick="openDriverNotification(${n.notification_id})">
                                    <i class="fas fa-eye me-1"></i> View Details
                                </button>
                            </div>
                            <div class="p-3 bg-white rounded-3 border mt-2 text-dark" style="font-size: 14px; line-height: 1.6;">
                                ${formatMessageWithContext(n.message || '')}
                            </div>
                        </div>
                    `;
                });
            }
        }

    } catch (err) {
        console.error("Failed to load driver notifications:", err);
    }
}

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

async function openDriverNotification(notifId) {
    const notif = (window.allDriverNotifications || []).find(n => n.notification_id == notifId);
    if (!notif) return;

    const titleEl = document.getElementById('driverNotifModalTitle');
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-comment-dots me-2"></i>${notif.title || 'Admin Response'}`;

    const timeEl = document.getElementById('driverNotifModalTime');
    if (timeEl) timeEl.innerText = new Date(notif.created_at).toLocaleString();

    const contentEl = document.getElementById('driverNotifModalContent');
    if (contentEl) contentEl.innerHTML = formatMessageWithContext(notif.message || '');

    const modalEl = document.getElementById('driverNotifModal');
    if (modalEl) {
        const m = bootstrap.Modal.getOrCreateInstance(modalEl);
        m.show();
    }

    // Mark as read in backend
    try {
        await apiCall(`/driver.php?action=mark_notification_read&id=${notifId}`);
        notif.is_read = 1;
        loadDriverNotifications();
    } catch(e){}
}

async function updateDriverStatus() {
    const status = document.getElementById('driver-status').value;
    try {
        await apiCall('/driver.php?action=update_status', 'POST', { status });
    } catch (err) {
        alert(err.message);
    }
}

async function updateLocation() {
    // In a real app, use navigator.geolocation
    // Simulating GPS location update
    const lat = 40.7128 + (Math.random() - 0.5) * 0.01;
    const lng = -74.0060 + (Math.random() - 0.5) * 0.01;
    
    try {
        await apiCall('/driver.php?action=update_location', 'POST', { lat, lng });
    } catch (err) {
        console.error('Location update failed', err);
    }
}

let allJobsData = [];
let currentJobFilter = 'All';

async function loadJobs() {
    try {
        const res = await apiCall('/driver.php?action=get_jobs');
        allJobsData = res.data;
        updateStats();
        renderJobs();
        loadHistory();
    } catch (err) {
        console.error(err);
    }
}

async function updateStats() {
    const total = allJobsData.length;
    const pending = allJobsData.filter(j => j.status === 'Pending' || j.status === 'Assigned').length;
    const progress = allJobsData.filter(j => j.status === 'In Progress').length;
    
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-pending').innerText = pending;
    document.getElementById('stat-progress').innerText = progress;
}

document.querySelectorAll('#jobFilterTabs .nav-link').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('#jobFilterTabs .nav-link').forEach(t => {
            t.classList.remove('active');
            t.classList.add('text-muted');
        });
        e.target.classList.add('active');
        e.target.classList.remove('text-muted');
        currentJobFilter = e.target.getAttribute('data-filter');
        renderJobs();
    });
});

async function renderJobs() {
    const container = document.getElementById('jobs-container');
    container.innerHTML = '';
    
    const filteredJobs = currentJobFilter === 'All' 
        ? allJobsData 
        : (currentJobFilter === 'Pending' 
            ? allJobsData.filter(j => j.status === 'Pending' || j.status === 'Assigned') 
            : allJobsData.filter(j => j.status === currentJobFilter));

    if (routeMap) {
        plotJobsOnMap();
    }

    if(filteredJobs.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-muted">No jobs found for this filter.</p></div>';
        return;
    }

    filteredJobs.forEach(job => {
        const mapUrl = getMapsLink(job.address);
        const addressText = job.address.replace(extractMapUrl(job.address) || '', '').trim() || 'No address text provided';
        
        let actionBtn = '';
        if (job.status === 'Pending' || job.status === 'Assigned') {
            actionBtn = `
                <div class="mt-3">
                    <button class="btn btn-success btn-sm w-100 fw-bold shadow-sm" onclick="submitJobStatusDirect(${job.assignment_id}, ${job.request_id}, 'Accepted')">
                        <i class="fas fa-check-circle me-1"></i> Accept Job
                    </button>
                </div>
            `;
        } else if (job.status === 'Accepted') {
            actionBtn = `
                <div class="mt-3">
                    <button class="btn btn-warning btn-sm w-100 fw-bold shadow-sm" onclick="submitJobStatusDirect(${job.assignment_id}, ${job.request_id}, 'In Progress')">
                        <i class="fas fa-play me-1"></i> Start Trip
                    </button>
                </div>
            `;
        } else if (job.status === 'In Progress') {
            actionBtn = `
                <div class="mt-3">
                    <button class="btn btn-success btn-sm w-100 fw-bold shadow-sm" onclick="submitJobStatusDirect(${job.assignment_id}, ${job.request_id}, 'Completed')">
                        <i class="fas fa-check-circle me-1"></i> Mark Picked Up
                    </button>
                </div>
            `;
        }

        container.innerHTML += `
            <div class="col-md-6 col-lg-4" id="job-card-col-${job.request_id}">
                <div class="card card-custom h-100 border-0 shadow-sm">
                    <div class="card-body p-3 d-flex flex-column">
                        <div class="d-flex justify-content-between mb-3 border-bottom pb-2 align-items-center">
                            <h6 class="card-title fw-bold text-dark mb-0">Job #${job.assignment_id || job.request_id}</h6>
                            <span class="badge bg-${job.status === 'Pending' ? 'warning text-dark' : (job.status === 'Accepted' ? 'info' : (job.status === 'In Progress' ? 'primary' : 'success'))} px-2 py-1" style="font-size: 0.75rem;" id="badge-status-${job.request_id}">
                                ${job.status === 'Pending' ? 'Available' : job.status}
                            </span>
                        </div>
                        <h6 class="text-dark fw-bold mb-1" style="font-size: 0.9rem;"><i class="fas fa-user-circle text-muted me-1"></i> ${job.resident_name}</h6>
                        <p class="text-muted mb-2" style="font-size: 0.85rem;"><i class="fas fa-phone-alt me-1"></i> ${job.resident_phone}</p>
                        
                        <div class="mb-2 bg-light p-2 rounded" style="font-size: 0.85rem;">
                            <strong><i class="fas fa-map-marker-alt text-danger me-1"></i> Location:</strong><br>
                            <span class="text-muted" style="text-transform: capitalize;">${addressText}</span>
                        </div>
                        
                        <p class="card-text mb-3" style="font-size: 0.8rem;"><small class="text-muted"><i class="far fa-clock me-1"></i> Requested: ${new Date(job.request_time).toLocaleString()}</small></p>
                        
                        <div class="d-flex gap-2 mt-auto">
                            <a href="${mapUrl}" target="_blank" class="btn btn-outline-primary btn-sm flex-fill fw-bold rounded-pill shadow-sm" style="font-size: 0.75rem;"><i class="fas fa-location-arrow me-1"></i> Map</a>
                            <a href="tel:${job.resident_phone}" class="btn btn-outline-secondary btn-sm flex-fill fw-bold rounded-pill shadow-sm text-nowrap" style="font-size: 0.75rem;"><i class="fas fa-phone me-1"></i> Call</a>
                        </div>
                        <div id="job-action-container-${job.request_id}">
                            ${actionBtn}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

async function cancelJobByDriver(assignmentId, requestId) {
    if (typeof Swal !== 'undefined') {
        const result = await Swal.fire({
            title: 'Baaji Codsiga?',
            text: `Ma hubtaa inaad baajiso/cancel dhayso codsiga qaadista ee #${requestId}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Haa, Baaji (Cancel)',
            cancelButtonText: 'Maya'
        });
        if (!result.isConfirmed) return;
    } else {
        if (!confirm(`Ma hubtaa inaad baajiso/cancel dhayso codsiga qaadista ee #${requestId}?`)) return;
    }

    await submitJobStatusDirect(assignmentId, requestId, 'Cancelled');
}
window.cancelJobByDriver = cancelJobByDriver;

async function submitJobStatusDirect(assignmentId, requestId, status) {
    try {
        const res = await apiCall('/driver.php?action=update_job_status', 'POST', {
            assignment_id: assignmentId,
            request_id: requestId,
            status: status
        });

        loadJobs(); // refresh
        if (typeof showToast === 'function') {
            showToast(`Status updated to: ${status}`, 'success');
        }
    } catch (err) {
        const errMsg = err.message || '';
        const isAlreadyAccepted = errMsg.toLowerCase().includes('already accepted') || err.status === 409;

        if (isAlreadyAccepted) {
            handleAlreadyAcceptedJob(requestId, errMsg);
        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire('Error', errMsg || 'Error updating job status', 'error');
            } else {
                alert(errMsg || 'Error updating job status');
            }
        }
    }
}

function handleAlreadyAcceptedJob(requestId, errorMsg) {
    // 1. Update UI card badge
    const badgeEl = document.getElementById(`badge-status-${requestId}`);
    if (badgeEl) {
        badgeEl.className = 'badge bg-danger px-2 py-1';
        badgeEl.innerHTML = '<i class="fas fa-lock me-1"></i> Already Accepted';
    }

    // 2. Replace Action Container with 5-second countdown alert
    const actionCont = document.getElementById(`job-action-container-${requestId}`);
    if (actionCont) {
        actionCont.innerHTML = `
            <div class="alert alert-danger py-2 px-3 small mb-0 fw-bold text-center border-0 shadow-sm mt-3" style="border-radius: 8px;">
                <i class="fas fa-exclamation-triangle text-danger me-1"></i> Already accepted by another driver.
                <div class="mt-1 text-dark small fw-normal">
                    This pickup will be removed in <span id="cd-timer-${requestId}" class="badge bg-danger text-white fs-6">5</span> seconds...
                </div>
            </div>
        `;
    }

    // 3. Show Toast Notice
    if (typeof showToast === 'function') {
        showToast('⚠️ This pickup was already accepted by another driver!', 'warning');
    }

    // 4. Start 5-second Countdown
    let timeLeft = 5;
    const cdTimerEl = document.getElementById(`cd-timer-${requestId}`);
    const timerInterval = setInterval(() => {
        timeLeft--;
        if (cdTimerEl) cdTimerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            const cardCol = document.getElementById(`job-card-col-${requestId}`);
            if (cardCol) {
                cardCol.style.transition = 'all 0.5s ease-out';
                cardCol.style.opacity = '0';
                cardCol.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    cardCol.remove();
                    // If no jobs remaining, show empty message
                    const container = document.getElementById('jobs-container');
                    if (container && container.querySelectorAll('.col-md-6').length === 0) {
                        container.innerHTML = '<div class="col-12"><p class="text-muted">No jobs found for this filter.</p></div>';
                    }
                }, 500);
            }
        }
    }, 1000);
}

async function submitJobStatus(status, reqId = null, assignId = null) {
    const assignmentId = assignId || document.getElementById('current-assignment-id')?.value;
    const requestId = reqId || document.getElementById('current-request-id')?.value;
    await submitJobStatusDirect(assignmentId, requestId, status);
    const modalEl = document.getElementById('updateStatusModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
}
window.submitJobStatus = submitJobStatus;
window.submitJobStatusDirect = submitJobStatusDirect;



let allHistoryData = [];
let currentFilteredData = [];
let historyCurrentPage = 1;
const historyRowsPerPage = 5;

async function loadHistory(fromDate = '', toDate = '') {
    try {
        let url = '/driver.php?action=get_history';
        if (fromDate) url += `&from_date=${encodeURIComponent(fromDate)}`;
        if (toDate) url += `&to_date=${encodeURIComponent(toDate)}`;

        const res = await apiCall(url);
        
        let stats = { completed_jobs: 0, todays_jobs: 0, total_earnings: 0.00, total_waste: 0.00 };
        let history = [];

        if (res.data) {
            if (res.data.history) {
                history = res.data.history;
                if (res.data.stats) stats = res.data.stats;
            } else if (Array.isArray(res.data)) {
                history = res.data;
            }
        }

        // Update Summary Cards dynamically
        const compEl = document.getElementById('hist-stat-completed');
        if (compEl) compEl.innerText = stats.completed_jobs !== undefined ? stats.completed_jobs : history.length;
        const todayEl = document.getElementById('hist-stat-today');
        if (todayEl) todayEl.innerText = stats.todays_jobs !== undefined ? stats.todays_jobs : 0;
        const rateEl = document.getElementById('hist-stat-rate');
        if (rateEl) rateEl.innerText = '$' + (stats.earning_per_pickup || '1.50');
        const earnEl = document.getElementById('hist-stat-earnings');
        if (earnEl) earnEl.innerText = '$' + (stats.total_earnings || '0.00');

        const topEarnEl = document.getElementById('stat-driver-earnings');
        if (topEarnEl) topEarnEl.innerText = '$' + (stats.total_earnings || '0.00');
        const topRateBadge = document.getElementById('stat-rate-badge');
        if (topRateBadge) topRateBadge.innerText = '$' + (stats.earning_per_pickup || '1.50') + ' / pickup';

        allHistoryData = history;
        currentFilteredData = [...allHistoryData];
        historyCurrentPage = 1;

        renderHistoryTable();
    } catch (err) {
        console.error('Error loading history:', err);
    }
}

function matchesSearchQuery(text, query) {
    if (!query) return true;
    text = (text || '').toLowerCase().trim();
    query = (query || '').toLowerCase().trim();
    if (!query) return true;
    if (text.includes(query)) return true;

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

function filterHistoryTable() {
    const query = (document.getElementById('history-search').value || '').trim();
    
    if (!query) {
        currentFilteredData = [...allHistoryData];
    } else {
        currentFilteredData = allHistoryData.filter(job => {
            const id = (job.assignment_id || job.request_id || '').toString();
            const customer = job.customer_name || '';
            const address = job.address || '';
            const waste = job.waste_type || '';
            const combined = `${id} ${customer} ${address} ${waste}`;
            return matchesSearchQuery(combined, query);
        });
    }

    historyCurrentPage = 1;
    renderHistoryTable();
}

function applyHistoryDateFilter() {
    const fromDate = document.getElementById('history-from-date').value;
    const toDate = document.getElementById('history-to-date').value;
    loadHistory(fromDate, toDate);
}

function renderHistoryTable() {
    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const totalEntries = currentFilteredData.length;
    if (totalEntries === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted"><i class="fas fa-info-circle me-2"></i>No work history records found.</td></tr>`;
        const info = document.getElementById('history-pagination-info');
        if (info) info.innerText = 'Showing 0 to 0 of 0 entries';
        const pagElem = document.getElementById('history-pagination');
        if (pagElem) pagElem.innerHTML = '';
        return;
    }

    // Pagination calculations
    const totalPages = Math.ceil(totalEntries / historyRowsPerPage);
    if (historyCurrentPage > totalPages) historyCurrentPage = totalPages;
    if (historyCurrentPage < 1) historyCurrentPage = 1;

    const startIdx = (historyCurrentPage - 1) * historyRowsPerPage;
    const endIdx = Math.min(startIdx + historyRowsPerPage, totalEntries);
    const pageData = currentFilteredData.slice(startIdx, endIdx);

    pageData.forEach((job, index) => {
        const jobId = job.assignment_id || job.request_id;
        const driverJobNum = totalEntries - (startIdx + index);
        const displayJobId = '#' + driverJobNum;
        const customer = job.customer_name || 'Resident User';
        const address = formatAddress(job.address || 'Mogadishu');
        const wasteType = job.waste_type || 'General Waste';
        
        // Status Badge & Color
        let statusBadge = '';
        if (job.status === 'Completed' || job.status === 'Done' || job.status === 'In Progress') {
            statusBadge = `<span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2"><i class="fas fa-check-circle me-1"></i> Done</span>`;
        } else if (job.status === 'Accepted') {
            statusBadge = `<span class="badge bg-info bg-opacity-10 text-info rounded-pill px-3 py-2"><i class="fas fa-user-check me-1"></i> Assigned</span>`;
        } else {
            statusBadge = `<span class="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2"><i class="fas fa-times-circle me-1"></i> Cancelled</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td class="ps-3 fw-bold text-success">${displayJobId}</td>
                <td class="fw-semibold">${customer}</td>
                <td><i class="fas fa-map-marker-alt text-danger me-1 small"></i>${address}</td>
                <td><span class="badge bg-light text-dark border px-2 py-1">${wasteType}</span></td>
                <td>${statusBadge}</td>
                <td class="text-end pe-3">
                    <button class="btn btn-sm btn-success rounded-pill px-3 shadow-sm" onclick="viewJobDetails(${jobId})">
                        <i class="fas fa-eye me-1"></i> View
                    </button>
                </td>
            </tr>
        `;
    });

    // Pagination info & buttons
    const pagInfo = document.getElementById('history-pagination-info');
    if (pagInfo) pagInfo.innerText = `Showing ${startIdx + 1} to ${endIdx} of ${totalEntries} entries`;

    let paginationHtml = `
        <li class="page-item ${historyCurrentPage === 1 ? 'disabled' : ''}">
            <a class="page-link rounded-pill px-3" href="#" onclick="changeHistoryPage(${historyCurrentPage - 1}); return false;">&laquo; Previous</a>
        </li>
    `;

    for (let p = 1; p <= totalPages; p++) {
        paginationHtml += `
            <li class="page-item ${p === historyCurrentPage ? 'active' : ''}">
                <a class="page-link rounded-circle ${p === historyCurrentPage ? 'bg-success border-success text-white' : 'text-dark'}" href="#" onclick="changeHistoryPage(${p}); return false;" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">${p}</a>
            </li>
        `;
    }

    paginationHtml += `
        <li class="page-item ${historyCurrentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link rounded-pill px-3" href="#" onclick="changeHistoryPage(${historyCurrentPage + 1}); return false;">Next &raquo;</a>
        </li>
    `;

    const pagContainer = document.getElementById('history-pagination');
    if (pagContainer) pagContainer.innerHTML = paginationHtml;
}

function changeHistoryPage(page) {
    historyCurrentPage = page;
    renderHistoryTable();
}

function viewJobDetails(jobId) {
    const job = allHistoryData.find(j => (j.assignment_id || j.request_id) == jobId);
    if (!job) return;

    document.getElementById('modal-job-id').innerText = jobId;
    document.getElementById('modal-customer-name').innerText = job.customer_name || 'Ali Hassan';
    document.getElementById('modal-customer-phone').innerText = job.customer_phone || '+252 61 555 1234';
    document.getElementById('modal-customer-address').innerText = job.address || 'Wabari, Mogadishu';
    
    // Map link
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address || 'Mogadishu, Somalia')}`;
    document.getElementById('modal-map-link').setAttribute('href', mapUrl);

    document.getElementById('modal-waste-type').innerText = job.waste_type || 'Plastic';
    const weightEl = document.getElementById('modal-weight');
    if (weightEl) weightEl.innerText = parseFloat(job.weight_kg || 25.0).toFixed(1);
    
    const payStatus = job.payment_status || 'Paid';
    const payElem = document.getElementById('modal-payment-status');
    if (payElem) {
        payElem.innerText = payStatus;
        payElem.className = `badge ${payStatus === 'Paid' ? 'bg-success' : 'bg-danger'}`;
    }

    // Time Log & Duration
    const assignedTime = job.assigned_time ? new Date(job.assigned_time) : new Date();
    const startedTime = job.started_time ? new Date(job.started_time) : new Date(assignedTime.getTime() + 10 * 60000);
    const completedTime = job.completed_time ? new Date(job.completed_time) : new Date(startedTime.getTime() + 30 * 60000);

    const assignElem = document.getElementById('modal-assigned-at');
    if (assignElem) assignElem.innerText = assignedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const startElem = document.getElementById('modal-started-at');
    if (startElem) startElem.innerText = startedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const compElem = document.getElementById('modal-completed-at');
    if (compElem) compElem.innerText = completedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Duration in Minutes
    const diffMs = completedTime - startedTime;
    const diffMins = Math.max(1, Math.round(diffMs / 60000));
    const durElem = document.getElementById('modal-duration');
    if (durElem) durElem.innerText = `${diffMins} Minutes`;



    const notesElem = document.getElementById('modal-driver-notes');
    if (notesElem) notesElem.innerText = job.driver_notes || 'Collected successfully. Customer requested morning collection.';

    // Show modal
    const modalElem = new bootstrap.Modal(document.getElementById('jobDetailsModal'));
    modalElem.show();
}

// Export functions
function exportHistoryExcel() {
    if (!currentFilteredData || currentFilteredData.length === 0) return alert('No history data to export!');

    if (!window.XLSX) {
        return alert('Excel library is loading, please try again.');
    }

    const rateValText = document.getElementById('hist-stat-rate')?.innerText || '$1.50';
    const rateVal = parseFloat(rateValText.replace(/[^0-9.]/g, '') || 1.50);

    // Format data rows nicely
    const excelData = currentFilteredData.map(job => {
        const isDone = (job.status === 'Completed' || job.status === 'Done' || job.status === 'In Progress');
        const driverEarned = isDone ? rateVal : 0;
        return {
            "Job ID": `#${job.assignment_id || job.request_id}`,
            "Customer": job.customer_name || 'Resident',
            "Address": job.address || 'Mogadishu',
            "Waste Type": job.waste_type || 'Plastic',
            "Weight (KG)": parseFloat(job.weight_kg || 25).toFixed(1),
            "Status": job.status || 'Completed',
            "Rate / Pickup ($)": rateVal.toFixed(2),
            "Driver Earned ($)": driverEarned.toFixed(2),
            "Rating": parseFloat(job.rating || 5.0).toFixed(1),
            "Completed At": job.completed_time ? new Date(job.completed_time).toLocaleString() : 'N/A'
        };
    });

    // Create worksheet & workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Work History");

    // Auto-fit Column Widths
    ws['!cols'] = [
        { wch: 12 }, // Job ID
        { wch: 22 }, // Customer
        { wch: 28 }, // Address
        { wch: 16 }, // Waste Type
        { wch: 16 }, // Weight (KG)
        { wch: 16 }, // Status
        { wch: 18 }, // Rate / Pickup
        { wch: 18 }, // Driver Earned
        { wch: 12 }, // Rating
        { wch: 25 }  // Completed At
    ];

    // Download native .xlsx file
    XLSX.writeFile(wb, `Work_History_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

async function exportHistoryPDF() {
    if (!currentFilteredData || currentFilteredData.length === 0) return alert('No history data to export!');

    if (!window.jspdf || !window.jspdf.jsPDF) {
        return printHistory();
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Header Banner
    doc.setFillColor(27, 94, 32); // #1b5e20
    doc.rect(0, 0, 210, 16, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("SMART WASTE COLLECTION SYSTEM", 14, 11);

    // Title
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Official Driver Work History & Earnings Report", 14, 26);

    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const profileNameInput = document.getElementById('profile-name');
    const driverName = (profileNameInput && profileNameInput.value) ? profileNameInput.value : 'Active Driver';

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated Date: ${todayStr}  |  Driver Name: ${driverName}`, 14, 33);

    // Summary Box
    const completed = document.getElementById('hist-stat-completed')?.innerText || '0';
    const rateText = document.getElementById('hist-stat-rate')?.innerText || '$1.50';
    const earnings = document.getElementById('hist-stat-earnings')?.innerText || '$0.00';
    const rateVal = parseFloat(rateText.replace(/[^0-9.]/g, '') || 1.50);

    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(245, 248, 245);
    doc.roundedRect(14, 38, 182, 16, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(27, 94, 32);
    doc.text(`Completed Pickups: ${completed}`, 18, 48);
    doc.text(`Rate / Pickup: ${rateText}`, 74, 48);
    doc.text(`Total Accrued Earnings: ${earnings}`, 130, 48);

    // Table Data
    const tableBody = currentFilteredData.map(job => {
        const isDone = (job.status === 'Completed' || job.status === 'Done' || job.status === 'In Progress');
        const driverEarned = isDone ? rateVal : 0;
        return [
            `#${job.assignment_id || job.request_id}`,
            job.customer_name || 'Resident',
            job.address || 'Mogadishu',
            job.waste_type || 'Plastic',
            job.status || 'Completed',
            `$${driverEarned.toFixed(2)}`,
            `⭐ ${parseFloat(job.rating || 5.0).toFixed(1)}`
        ];
    });

    doc.autoTable({
        startY: 59,
        head: [['JOB ID', 'CUSTOMER', 'ADDRESS', 'WASTE TYPE', 'STATUS', 'EARNED ($)', 'RATING']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [27, 94, 32],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 8.5,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [248, 250, 248]
        }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} - Smart Waste Collection Management System`, 14, 288);
    }

    doc.save(`Work_History_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function printHistory() {
    const printDate = document.getElementById('print-date');
    if (printDate) printDate.innerText = new Date().toLocaleDateString();

    const profileNameInput = document.getElementById('profile-name');
    const driverName = (profileNameInput && profileNameInput.value) ? profileNameInput.value : 'Active Driver';
    const printDriver = document.getElementById('print-driver-name');
    if (printDriver) printDriver.innerText = driverName;

    window.print();
}

// ----------------------------------------------------
// New Functionalities (Settings, Vehicle, Emergency)
// ----------------------------------------------------

async function loadSettings() {
    try {
        const res = await apiCall('/driver.php?action=get_profile');
        const profile = res.data;
        if (profile) {
            if (document.getElementById('profile-name')) document.getElementById('profile-name').value = profile.name || '';
            if (document.getElementById('profile-phone')) document.getElementById('profile-phone').value = profile.phone || '';
            if (document.getElementById('profile-vehicle-plate')) document.getElementById('profile-vehicle-plate').value = profile.vehicle_plate || '';
            if (document.getElementById('profile-earning-rate')) document.getElementById('profile-earning-rate').value = '$' + parseFloat(profile.earning_per_pickup || 1.50).toFixed(2) + ' / pickup';
            
            // Sync Driver Header Profile Pill
            const headerName = document.getElementById('driverHeaderName');
            if (headerName) headerName.textContent = profile.name || 'Malik';
            
            const headerPic = document.getElementById('driverHeaderPic');
            if (headerPic) {
                const picSrc = (profile.profile_picture && profile.profile_picture.length > 5) 
                    ? (profile.profile_picture.startsWith('http') || profile.profile_picture.startsWith('data:') ? profile.profile_picture : '../' + profile.profile_picture)
                    : `https://ui-avatars.com/api/?name=` + encodeURIComponent(profile.name || 'Malik') + `&background=1b5e20&color=fff`;
                headerPic.src = picSrc;
            }
            
            if (profile.status && document.getElementById('driver-status')) {
                const sEl = document.getElementById('driver-status');
                if (profile.status === 'On Break') sEl.value = 'On Break';
                else if (profile.status === 'Off Duty' || profile.status === 'Offline') sEl.value = 'Off Duty';
                else sEl.value = 'On Duty';
            }
            
            if (profile.profile_picture && document.getElementById('profile-preview')) {
                const pSrc = (profile.profile_picture.startsWith('http') || profile.profile_picture.startsWith('data:')) ? profile.profile_picture : '../' + profile.profile_picture;
                document.getElementById('profile-preview').src = pSrc;
            }
        }
    } catch (err) {
        console.error('Failed to load profile', err);
    }
}

function previewImage(event, previewId) {
    const reader = new FileReader();
    reader.onload = function() {
        document.getElementById(previewId).src = reader.result;
    }
    if(event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

async function updateProfile(e) {
    e.preventDefault();
    const form = document.getElementById('driverProfileForm');
    const formData = new FormData(form);
    
    try {
        const res = await fetch('../api/driver.php?action=update_profile', {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        
        if (result.status === 'success') {
            alert('Profile updated successfully!');
            loadSettings();
        } else {
            alert(result.message || 'Update failed');
        }
    } catch (err) {
        alert('An error occurred');
    }
}

async function updatePassword(e) {
    e.preventDefault();
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    
    if (newPass !== confirm) {
        return alert("New passwords do not match!");
    }
    
    try {
        await apiCall('/driver.php?action=update_password', 'POST', {
            current_password: current,
            new_password: newPass
        });
        alert('Password updated successfully!');
        document.getElementById('driverPasswordForm').reset();
    } catch (err) {
        alert(err.message);
    }
}

async function submitVehicleIssue(e) {
    e.preventDefault();
    const issueType = document.getElementById('vehicleIssueType').value;
    const message = document.getElementById('vehicleIssueMessage').value;
    
    try {
        await apiCall('/driver.php?action=report_issue', 'POST', {
            issue_type: issueType,
            message: message
        });
        alert('Vehicle issue reported successfully to the Admin.');
        document.getElementById('vehicleStatusForm').reset();
    } catch (err) {
        alert(err.message);
    }
}

async function submitEmergencyHelp(e) {
    e.preventDefault();
    const type = document.getElementById('emergencyType').value;
    const message = document.getElementById('emergencyMessage').value;
    
    try {
        await apiCall('/driver.php?action=report_issue', 'POST', {
            issue_type: 'EMERGENCY: ' + type,
            message: message
        });
        alert('Emergency alert sent to Admin immediately!');
        document.getElementById('emergencyForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('emergencyModal')).hide();
    } catch (err) {
        alert(err.message);
    }
}

// Hook loadSettings into showSection
const originalShowSection = showSection;
showSection = function(sectionId) {
    originalShowSection(sectionId);
    if(sectionId === 'settings') loadSettings();
}

// ----------------------------------------------------
// Interactive Route Map (Leaflet.js)
// ----------------------------------------------------
let routeMap = null;
let routeMarkers = [];

// Helper to extract coordinates from Google Maps URL if present
function parseCoordinates(url) {
    if (!url) return null;
    const match = url.match(/q=([-+]?\d*\.\d+),\s*([-+]?\d*\.\d+)/);
    if (match) {
        return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return null;
}

// Helper to geocode an address using Nominatim API (with localStorage caching)
async function geocodeAddress(addressText) {
    if (!addressText || addressText.length < 3) return null;
    
    // Clean address
    const cleanAddress = addressText.toLowerCase().replace(/[^a-z0-9\s,]/g, '').trim();
    const cacheKey = 'geocode_' + cleanAddress;
    
    // Check cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch(e) {}
    }
    
    try {
        // Search in Mogadishu specifically
        const query = encodeURIComponent(cleanAddress + ', Mogadishu, Somalia');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const data = await res.json();
        
        if (data && data.length > 0) {
            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            localStorage.setItem(cacheKey, JSON.stringify(coords));
            return coords;
        }
    } catch(err) {
        console.error("Geocoding failed", err);
    }
    return null;
}

// Fallback to generate a deterministic pseudo-random offset near Mogadishu center
function generateOffset(id) {
    const center = [2.04693, 45.31816];
    const hash = id * 2654435761 % 1000;
    const offsetLat = (hash % 100) / 10000;
    const offsetLng = (Math.floor(hash / 10) % 100) / 10000;
    return [center[0] + offsetLat - 0.005, center[1] + offsetLng - 0.005];
}

async function initMap() {
    const mapEl = document.getElementById('routeMap');
    if (!mapEl) return;

    if (typeof L === 'undefined') {
        console.warn('Leaflet library is still loading...');
        setTimeout(initMap, 200);
        return;
    }

    if (routeMap) {
        setTimeout(() => {
            if (routeMap) {
                routeMap.invalidateSize(true);
                plotJobsOnMap();
            }
        }, 100);
        return;
    }
    
    // Clear container cleanly before initializing
    mapEl.innerHTML = '';

    // Initialize Leaflet Map centered on Mogadishu / global view
    routeMap = L.map('routeMap', {
        minZoom: 2,
        maxZoom: 19,
        scrollWheelZoom: true,
        touchZoom: true,
        zoomControl: true,
        attributionControl: true
    }).setView([2.04693, 45.31816], 13);
    
    // High-performance, worldwide OpenStreetMap Tile Layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 2,
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        crossOrigin: true
    }).addTo(routeMap);

    // Multiple invalidateSize calls to guarantee perfect rendering inside the card
    setTimeout(() => { if (routeMap) routeMap.invalidateSize(true); }, 150);
    setTimeout(() => { if (routeMap) routeMap.invalidateSize(true); }, 400);
    setTimeout(() => { if (routeMap) routeMap.invalidateSize(true); }, 800);

    window.addEventListener('resize', () => {
        if (routeMap) routeMap.invalidateSize(true);
    });

    plotJobsOnMap();
}

window.recenterMap = function() {
    if (routeMap) {
        routeMap.invalidateSize(true);
        if (routeMarkers && routeMarkers.length > 0) {
            let bounds = L.latLngBounds();
            routeMarkers.forEach(m => bounds.extend(m.getLatLng()));
            routeMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else {
            routeMap.setView([2.04693, 45.31816], 13);
        }
    }
};

async function plotJobsOnMap() {
    if (!routeMap) return;
    
    // Clear old markers
    routeMarkers.forEach(m => routeMap.removeLayer(m));
    routeMarkers = [];
    
    // Get active jobs (Pending + In Progress + Accepted)
    const activeJobs = allJobsData.filter(j => ['Pending', 'In Progress', 'Accepted'].includes(j.status));
    
    if (activeJobs.length === 0) {
        document.getElementById('route-stops').innerText = '0 Houses';
        document.getElementById('route-distance').innerText = '-- km';
        document.getElementById('route-time').innerText = '-- Mins';
        return;
    }

    let bounds = L.latLngBounds();
    let totalDistance = 0; // Simulated distance
    let prevLatLng = null;

    // Use a for...of loop to support await
    for (const [index, job] of activeJobs.entries()) {
        let latLng = null;
        const mapUrl = getMapsLink(job.address);
        const addressText = job.address.replace(extractMapUrl(job.address) || '', '').trim() || 'No address text provided';
        
        latLng = parseCoordinates(mapUrl);
        
        if (!latLng) {
            // Try geocoding
            latLng = await geocodeAddress(addressText);
        }
        
        if (!latLng) {
            // Fallback
            latLng = generateOffset(job.assignment_id || index);
        }
        
        let markerColor = 'blue';
        if (job.status === 'Pending') markerColor = 'orange';
        if (job.status === 'In Progress') markerColor = 'red';
        if (job.status === 'Accepted') markerColor = 'blue';
        
        const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style='background-color:${markerColor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;'>${index+1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker(latLng, { icon: customIcon }).addTo(routeMap);
        
        marker.bindPopup(`
            <div style="font-family: inherit;">
                <h6 style="margin-bottom: 5px; font-weight: bold;">Job #${job.assignment_id}</h6>
                <p style="margin: 0; font-size: 12px; color: #555;">${job.resident_name}</p>
                <p style="margin: 0; font-size: 12px; color: #555;">${job.resident_phone}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #888;">${addressText}</p>
                <span style="display:inline-block; margin-top:5px; padding: 2px 6px; background: #eee; border-radius: 4px; font-size: 10px;">${job.status}</span>
            </div>
        `);
        
        routeMarkers.push(marker);
        bounds.extend(latLng);
        
        // Calculate simulated distance
        if (prevLatLng) {
            // roughly 111km per degree
            const dist = Math.sqrt(Math.pow(latLng[0] - prevLatLng[0], 2) + Math.pow(latLng[1] - prevLatLng[1], 2)) * 111;
            totalDistance += dist;
        }
        prevLatLng = latLng;
    }

    if (routeMarkers.length > 0) {
        if (routeMarkers.length === 1) {
            routeMap.setView(bounds.getCenter(), 14);
        } else {
            routeMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }

    // Update Route Summary Panel
    document.getElementById('route-stops').innerText = `${activeJobs.length} Houses`;
    document.getElementById('route-distance').innerText = `${(totalDistance < 1 ? 1.5 : totalDistance).toFixed(1)} km`; // Fallback to 1.5km minimum
    
    // Estimate 8 mins per stop + 3 mins per km
    const estimatedMins = Math.round((activeJobs.length * 8) + (totalDistance * 3));
    document.getElementById('route-time').innerText = `${estimatedMins} Mins`;
    
    // Build Google Maps Dir URL
    let dirUrl = "https://www.google.com/maps/dir/";
    activeJobs.forEach(job => {
        const url = getMapsLink(job.address);
        const coords = parseCoordinates(url);
        if (coords) {
            dirUrl += `${coords[0]},${coords[1]}/`;
        } else {
            // Just pass the address text and let Google figure it out if possible
            const addressText = job.address.replace(extractMapUrl(job.address) || '', '').trim();
            if (addressText) dirUrl += `${encodeURIComponent(addressText)}/`;
        }
    });
    
    document.getElementById('start-navigation-btn').href = dirUrl;
};
