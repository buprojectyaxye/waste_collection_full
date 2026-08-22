// Determine base path cleanly for XAMPP / relative deployments
const isSubfolder = window.location.pathname.includes('/admin/') || 
                    window.location.pathname.includes('/driver/') || 
                    window.location.pathname.includes('/resident/');

function getApiUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const base = isSubfolder ? '../api' : 'api';
    return `${base}/${cleanEndpoint}`;
}

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include' // Send cookies across same-origin and localhost port variations
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    try {
        let finalEndpoint = endpoint;
        if (method === 'GET') {
            finalEndpoint += (finalEndpoint.includes('?') ? '&' : '?') + '_t=' + new Date().getTime();
        }
        
        const fullUrl = getApiUrl(finalEndpoint);
        const response = await fetch(fullUrl, options);
        const result = await response.json();
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                const targetLogin = isSubfolder ? '../portal_select.html' : 'portal_select.html';
                if (!window.location.pathname.includes('portal_select.html') && !window.location.pathname.includes('login')) {
                    window.location.href = targetLogin;
                }
            }
            throw new Error(result.message || 'Something went wrong');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function showToast(message, type = 'success') {
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'danger' || type === 'error' ? 'bg-danger' : (type === 'info' ? 'bg-info' : (type === 'warning' ? 'bg-warning text-dark' : 'bg-success'));
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0 show mb-2 shadow-lg" role="alert" style="position: fixed; bottom: 20px; right: 20px; z-index: 99999; min-width: 280px; border-radius: 8px;">
            <div class="d-flex p-2">
                <div class="toast-body fw-bold" style="font-size: 0.9rem;">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="document.getElementById('${toastId}')?.remove()"></button>
            </div>
        </div>
    `;
    
    const div = document.createElement('div');
    div.innerHTML = toastHtml;
    document.body.appendChild(div.firstElementChild);
    
    setTimeout(() => {
        const el = document.getElementById(toastId);
        if (el) el.remove();
    }, 3500);
}

function logout() {
    apiCall('/auth.php?action=logout', 'POST')
        .then(() => {
            window.location.href = '../index.html';
        })
        .catch(err => alert(err.message));
}

// Helpers for addresses that contain Google Maps links
function extractMapUrl(address) {
    if(!address) return null;
    const urlMatch = address.match(/(https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[0] : null;
}

function formatAddress(address) {
    if (!address) return 'Mogadishu';
    const mapUrl = extractMapUrl(address);
    if (mapUrl) {
        let textPart = address.replace(mapUrl, '').trim();
        const linkHtml = `<a href="${mapUrl}" target="_blank" class="btn btn-light btn-sm rounded-circle shadow-sm border ms-1" style="width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: #db4437; text-decoration: none;" title="View on Google Maps"><i class="fas fa-map-marker-alt"></i></a>`;
        if (!textPart) {
            textPart = 'Mogadishu Area';
        }
        return `<span style="white-space: nowrap; text-transform: capitalize;">${textPart}</span> ${linkHtml}`;
    }
    return `<span style="white-space: nowrap; text-transform: capitalize;">${address}</span>`;
}

function getMapsLink(address) {
    const mapUrl = extractMapUrl(address);
    if (mapUrl) return mapUrl;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// Auto-load SweetAlert2 CDN if not present
if (typeof Swal === 'undefined' && !document.querySelector('script[src*="sweetalert2"]')) {
    const swalScript = document.createElement('script');
    swalScript.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
    document.head.appendChild(swalScript);
}

// Global SweetAlert2 helper & window.alert override
window.showAlert = function(title, message, icon = 'info') {
    if (typeof Swal !== 'undefined') {
        return Swal.fire({
            icon: icon,
            title: title,
            text: message,
            confirmButtonColor: '#2e7d32',
            customClass: {
                popup: 'rounded-4 shadow-lg border-0'
            }
        });
    } else {
        showToast(title + ': ' + message, icon === 'error' ? 'danger' : icon);
    }
};

// Smart native window.alert override to convert ALL alerts to SweetAlert2 popups!
window.alert = function(msg) {
    if (!msg) return;
    const str = String(msg);
    let icon = 'info';
    let title = 'Notification';

    if (str.includes('Error') || str.includes('🛑') || str.includes('Invalid') || str.includes('Failed') || str.includes('Cannot') || str.includes('baajiyey') || str.includes('match') || str.includes('Unpaid')) {
        icon = 'error';
        title = 'Notice';
    } else if (str.includes('Successful') || str.includes('🎉') || str.includes('successfully') || str.includes('Paid')) {
        icon = 'success';
        title = 'Success!';
    } else if (str.includes('Warning') || str.includes('Fadlan') || str.includes('Please')) {
        icon = 'warning';
        title = 'Attention';
    }

    const cleanStr = str.replace(/🛑|🎉|🗓️|🟢|🟡|🔴/g, '').trim();
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: icon,
            title: title,
            text: cleanStr,
            confirmButtonColor: '#2e7d32',
            customClass: {
                popup: 'rounded-4 shadow-lg border-0'
            }
        });
    } else {
        showToast(cleanStr, icon === 'error' ? 'danger' : icon);
    }
};

// Global strict numeric and phone input enforcement for dedicated phone/pin inputs only
function isPhoneInputField(input) {
    if (!input || input.tagName !== 'INPUT') return false;
    const id = (input.id || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    const type = (input.type || '').toLowerCase();
    const cls = (input.className || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    
    // Explicitly allow all characters for search, filter, query, email, username, address, etc.
    if (type === 'search' || type === 'password' || type === 'hidden' || type === 'email' || type === 'text') {
        if (id.includes('search') || name.includes('search') || cls.includes('search') || placeholder.includes('search')) {
            return false;
        }
        if (id.includes('filter') || name.includes('filter') || cls.includes('filter')) {
            return false;
        }
        if (id.includes('name') || name.includes('name') || id.includes('address') || name.includes('address')) {
            return false;
        }
        if (id.includes('email') || name.includes('email') || id.includes('username') || name.includes('username')) {
            return false;
        }
        if (id.includes('plate') || name.includes('plate') || id.includes('license') || name.includes('license')) {
            return false;
        }
        if (id.includes('zone') || name.includes('zone') || id.includes('vehicle') || name.includes('vehicle')) {
            return false;
        }
    }

    if (type === 'tel' || input.hasAttribute('data-phone')) {
        return true;
    }

    // Exact dedicated phone fields only
    return (
        id === 'phone' ||
        name === 'phone' ||
        id === 'user_phone' ||
        name === 'user_phone' ||
        id === 'driver_phone' ||
        name === 'driver_phone' ||
        id === 'resident_phone' ||
        name === 'resident_phone' ||
        id === 'emergency_contact' ||
        name === 'emergency_contact' ||
        id === 'emergency_phone' ||
        name === 'emergency_phone' ||
        id === 'phone_number' ||
        name === 'phone_number'
    );
}

function isPinOrCardInputField(input) {
    if (!input || input.tagName !== 'INPUT') return false;
    const id = (input.id || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    const type = (input.type || '').toLowerCase();
    if (id.includes('search') || name.includes('search') || id.includes('filter') || name.includes('filter')) return false;
    if (id === 'email' || name === 'email' || type === 'email' || id === 'password' || type === 'password') return false;
    return id.includes('pin') || id.includes('cvv') || id.includes('otp') || id.includes('ussd') || input.hasAttribute('data-pin');
}

function isAmountInputField(input) {
    if (!input || input.tagName !== 'INPUT') return false;
    const id = (input.id || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    const type = (input.type || '').toLowerCase();
    if (id.includes('search') || name.includes('search') || id.includes('filter') || name.includes('filter')) return false;
    if (id === 'email' || name === 'email' || type === 'email' || id === 'password' || type === 'password') return false;
    return (
        type === 'number' ||
        id.includes('amount') ||
        name.includes('amount') ||
        id.includes('weight') ||
        input.hasAttribute('data-amount')
    );
}

document.addEventListener('keypress', function(e) {
    const target = e.target;
    if (!target || target.tagName !== 'INPUT') return;

    // Allow control keys (backspace, delete, enter, tab, copy/paste)
    if (e.ctrlKey || e.metaKey || e.key.length !== 1) return;

    if (isPhoneInputField(target)) {
        if (!/[0-9+ ]/.test(e.key)) {
            e.preventDefault();
        }
    } else if (isPinOrCardInputField(target)) {
        if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    } else if (isAmountInputField(target)) {
        if (!/[0-9.]/.test(e.key)) {
            e.preventDefault();
        }
        if (e.key === '.' && target.value.includes('.')) {
            e.preventDefault();
        }
    }
}, true);

document.addEventListener('input', function(e) {
    const target = e.target;
    if (!target || target.tagName !== 'INPUT') return;

    if (isPhoneInputField(target)) {
        target.value = target.value.replace(/[^0-9+ ]/g, '');
    } else if (isPinOrCardInputField(target)) {
        target.value = target.value.replace(/[^0-9]/g, '');
    } else if (isAmountInputField(target)) {
        if (target.type !== 'number') {
            target.value = target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
        }
    }
}, true);

document.addEventListener('paste', function(e) {
    const target = e.target;
    if (!target || target.tagName !== 'INPUT') return;

    if (isPhoneInputField(target) || isPinOrCardInputField(target) || isAmountInputField(target)) {
        setTimeout(() => {
            if (isPhoneInputField(target)) {
                target.value = target.value.replace(/[^0-9+ ]/g, '');
            } else if (isPinOrCardInputField(target)) {
                target.value = target.value.replace(/[^0-9]/g, '');
            }
              if (isAmountInputField(target) && target.type !== 'number') {
                target.value = target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
            }
        }, 0);
    }
}, true);

// Global Dark Mode Theme Initializer
(function initGlobalTheme() {
    function applyTheme() {
        let savedTheme = localStorage.getItem('smartWasteTheme');
        if (!savedTheme) {
            try {
                const adminSettings = JSON.parse(localStorage.getItem('smartWasteAdminSettings') || '{}');
                if (adminSettings.darkMode) savedTheme = 'dark';
            } catch(e){}
        }
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            document.documentElement.classList.add('dark-mode');
            if (document.body) document.body.classList.add('dark-mode');
            const toggles = document.querySelectorAll('#darkModeToggle, .dark-mode-switch');
            toggles.forEach(t => t.checked = true);
        } else if (savedTheme === 'light') {
            document.documentElement.removeAttribute('data-bs-theme');
            document.documentElement.classList.remove('dark-mode');
            if (document.body) document.body.classList.remove('dark-mode');
            const toggles = document.querySelectorAll('#darkModeToggle, .dark-mode-switch');
            toggles.forEach(t => t.checked = false);
        }
    }
    applyTheme();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTheme);
    }
})();

window.toggleGlobalDarkMode = function() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-bs-theme') === 'dark' || document.body.classList.contains('dark-mode');
    const newMode = !isDark;
    if (newMode) {
        html.setAttribute('data-bs-theme', 'dark');
        html.classList.add('dark-mode');
        if (document.body) document.body.classList.add('dark-mode');
        localStorage.setItem('smartWasteTheme', 'dark');
    } else {
        html.removeAttribute('data-bs-theme');
        html.classList.remove('dark-mode');
        if (document.body) document.body.classList.remove('dark-mode');
        localStorage.setItem('smartWasteTheme', 'light');
    }
    const toggles = document.querySelectorAll('#darkModeToggle, .dark-mode-switch');
    toggles.forEach(t => t.checked = newMode);

    try {
        const saved = JSON.parse(localStorage.getItem('smartWasteAdminSettings') || '{}');
        saved.darkMode = newMode;
        localStorage.setItem('smartWasteAdminSettings', JSON.stringify(saved));
    } catch(e){}

    return newMode;
};
