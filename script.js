/// SCRIPT_URL sẽ tự động thay đổi dựa trên môi trường
// SỬA LẠI PHẦN NÀY
window.SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyd0HQnHTucW_QfiSutEmPQ0tH-gZJ3wm4VQSlh8Y3R/exec';
console.log('Đã sửa SCRIPT_URL thành:', window.SCRIPT_URL);
let currentUser = null;
let currentPage = 1;
let itemsPerPage = 10;

// ===== HÀM TIỆN ÍCH =====
const Utils = {
    // Format tiền tệ
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },
    
    // Format ngày tháng
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },
    
    // Format ngày giờ
    formatDateTime: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Tạo UUID đơn giản
    generateId: () => {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Validate email
    isValidEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Copy to clipboard
    copyToClipboard: (text) => {
        navigator.clipboard.writeText(text).then(() => {
            Utils.showToast('Đã sao chép vào clipboard');
        }).catch(err => {
            console.error('Lỗi sao chép: ', err);
        });
    },
    
    // Hiển thị toast message
    showToast: (message, type = 'info') => {
        // Tạo toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="toast-icon ${Utils.getToastIcon(type)}"></i>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        
        // Thêm vào DOM
        const container = document.getElementById('toast-container') || (() => {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
            return container;
        })();
        
        container.appendChild(toast);
        
        // Tự động xóa sau 5 giây
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Xử lý nút đóng
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        });
    },
    
    getToastIcon: (type) => {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }
};

// ===== XỬ LÝ ĐĂNG NHẬP =====
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('.btn-login');
    const messageBox = document.getElementById('loginMessage');
    
    // Lấy dữ liệu form
    const formData = {
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value.trim(),
        rememberMe: document.getElementById('rememberMe').checked
    };
    
    // Validation
    if (!formData.username || !formData.password) {
        Utils.showToast('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }
    
    // Hiển thị loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        // Gọi API đăng nhập
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                username: formData.username,
                password: formData.password
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Lưu thông tin đăng nhập
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('token', result.token);
            
            if (formData.rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
            
            // Hiển thị thông báo thành công
            Utils.showToast('Đăng nhập thành công!', 'success');
            
            // Chuyển hướng sau 1.5 giây
            setTimeout(() => {
                if (result.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1500);
            
        } else {
            throw new Error(result.message || 'Đăng nhập thất bại');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        Utils.showToast(error.message || 'Lỗi kết nối đến server', 'error');
        
        // Hiệu ứng lắc form
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
        
    } finally {
        // Ẩn loading
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// ===== XỬ LÝ ĐĂNG XUẤT =====
function handleLogout() {
    // Hiển thị confirm dialog
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        // Xóa dữ liệu localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        
        // Chuyển hướng về trang đăng nhập
        window.location.href = 'index.html';
    }
}

// ===== KIỂM TRA ĐĂNG NHẬP =====
function checkAuth() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
        window.location.href = 'index.html';
        return null;
    }
    
    try {
        currentUser = JSON.parse(user);
        return currentUser;
    } catch (error) {
        localStorage.clear();
        window.location.href = 'index.html';
        return null;
    }
}

// ===== LOAD THÔNG TIN NGƯỜI DÙNG =====
function loadUserInfo() {
    const user = checkAuth();
    if (!user) return;
    
    // Cập nhật thông tin header
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-name');
    const userRole = document.querySelector('.user-role');
    
    if (userAvatar) {
        userAvatar.textContent = user.fullname.charAt(0).toUpperCase();
    }
    if (userName) {
        userName.textContent = user.fullname;
    }
    if (userRole) {
        userRole.textContent = user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên';
    }
    
    // Cập nhật sidebar
    const profileAvatar = document.querySelector('.profile-avatar');
    const profileName = document.querySelector('.profile-info h3');
    const profileRole = document.querySelector('.profile-info p');
    
    if (profileAvatar) {
        profileAvatar.textContent = user.fullname.charAt(0).toUpperCase();
    }
    if (profileName) {
        profileName.textContent = user.fullname;
    }
    if (profileRole) {
        profileRole.textContent = user.department + ' • ' + (user.role === 'admin' ? 'Quản lý' : 'Nhân viên');
    }
    
    // Load thống kê
    if (user.role === 'user') {
        loadUserStats();
    } else {
        loadAdminStats();
    }
}

// ===== LOAD THỐNG KÊ NGƯỜI DÙNG =====
async function loadUserStats() {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getUserStats',
                userId: currentUser.id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateUserStats(result.data);
        }
    } catch (error) {
        console.error('Lỗi load thống kê:', error);
    }
}

function updateUserStats(data) {
    // Cập nhật các card thống kê
    const statCards = {
        'total-leave': data.totalLeave || 0,
        'pending-requests': data.pendingRequests || 0,
        'approved-requests': data.approvedRequests || 0,
        'remaining-days': data.remainingDays || 0
    };
    
    Object.entries(statCards).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// ===== XỬ LÝ ĐĂNG KÝ NGHỈ PHÉP =====
async function handleLeaveRequest(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('.btn-primary');
    const originalText = submitBtn.innerHTML;
    
    // Lấy dữ liệu form
    const formData = {
        action: 'submitLeave',
        userId: currentUser.id,
        username: currentUser.username,
        fullname: currentUser.fullname,
        department: currentUser.department,
        leaveType: document.getElementById('leaveType').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        totalDays: parseFloat(document.getElementById('totalDays').value),
        reason: document.getElementById('reason').value.trim(),
        contactInfo: document.getElementById('contactInfo').value.trim(),
        status: 'pending',
        submitDate: new Date().toISOString()
    };
    
    // Validation
    if (!formData.leaveType || !formData.startDate || !formData.endDate || 
        !formData.reason || !formData.contactInfo) {
        Utils.showToast('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }
    
    if (formData.startDate > formData.endDate) {
        Utils.showToast('Ngày bắt đầu không thể sau ngày kết thúc', 'error');
        return;
    }
    
    // Hiển thị loading
    submitBtn.innerHTML = '<div class="loading-spinner spinner-sm"></div> Đang gửi...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            Utils.showToast('Đã gửi đơn nghỉ phép thành công!', 'success');
            form.reset();
            calculateDays(); // Reset ngày
            loadLeaveHistory(); // Load lại lịch sử
        } else {
            throw new Error(result.message || 'Gửi đơn thất bại');
        }
        
    } catch (error) {
        Utils.showToast(error.message, 'error');
        console.error('Submit leave error:', error);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ===== TÍNH SỐ NGÀY NGHỈ =====
function calculateDays() {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const totalDays = document.getElementById('totalDays');
    
    if (startDate.value && endDate.value) {
        const start = new Date(startDate.value);
        const end = new Date(endDate.value);
        
        if (start <= end) {
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            totalDays.value = diffDays;
        }
    }
}

// ===== LOAD LỊCH SỬ NGHỈ PHÉP =====
async function loadLeaveHistory() {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getLeaveHistory',
                userId: currentUser.id,
                page: currentPage,
                limit: itemsPerPage
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderLeaveHistory(result.data);
            updatePagination(result.total, result.pages);
        }
    } catch (error) {
        console.error('Lỗi load lịch sử:', error);
        Utils.showToast('Không thể tải lịch sử', 'error');
    }
}

function renderLeaveHistory(data) {
    const tbody = document.getElementById('historyBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state-cell">
                    <div class="empty-state-sm">
                        <i class="fas fa-history empty-icon-sm"></i>
                        <p>Chưa có đơn nghỉ phép nào</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map((item, index) => `
        <tr>
            <td>${(currentPage - 1) * itemsPerPage + index + 1}</td>
            <td>${item.requestId || 'N/A'}</td>
            <td>${item.leaveType}</td>
            <td>${Utils.formatDate(item.startDate)}</td>
            <td>${Utils.formatDate(item.endDate)}</td>
            <td>${item.totalDays} ngày</td>
            <td class="reason-cell">${item.reason}</td>
            <td>
                <span class="status-badge badge-${getStatusClass(item.status)}">
                    ${getStatusText(item.status)}
                </span>
            </td>
            <td>
                ${item.approvedBy ? item.approvedBy : 'Chờ duyệt'}
                ${item.approveDate ? '<br><small>' + Utils.formatDate(item.approveDate) + '</small>' : ''}
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    const statusMap = {
        'pending': 'pending',
        'approved': 'approved',
        'rejected': 'rejected'
    };
    return statusMap[status.toLowerCase()] || 'pending';
}

function getStatusText(status) {
    const textMap = {
        'pending': 'Chờ duyệt',
        'approved': 'Đã duyệt',
        'rejected': 'Từ chối'
    };
    return textMap[status.toLowerCase()] || status;
}

// ===== PHÂN TRANG =====
function updatePagination(totalItems, totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Nút Previous
    paginationHTML += `
        <a href="#" class="page-link ${currentPage === 1 ? 'disabled' : ''}" 
           onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </a>
    `;
    
    // Các nút số trang
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <a href="#" class="page-link ${i === currentPage ? 'active' : ''}" 
                   onclick="changePage(${i})">
                    ${i}
                </a>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span class="page-dots">...</span>`;
        }
    }
    
    // Nút Next
    paginationHTML += `
        <a href="#" class="page-link ${currentPage === totalPages ? 'disabled' : ''}" 
           onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </a>
    `;
    
    // Hiển thị thông tin
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Hiển thị ${Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-${Math.min(currentPage * itemsPerPage, totalItems)} của ${totalItems}`;
    }
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page < 1 || page > document.querySelectorAll('.page-link:not(.disabled):not(.active)').length) return;
    
    currentPage = page;
    loadLeaveHistory();
    
    // Scroll lên đầu bảng
    const table = document.querySelector('.table-responsive');
    if (table) {
        table.scrollIntoView({ behavior: 'smooth' });
    }
}

// ===== ADMIN FUNCTIONS =====
async function loadAdminStats() {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getAdminStats'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateAdminStats(result.data);
        }
    } catch (error) {
        console.error('Lỗi load thống kê admin:', error);
    }
}

function updateAdminStats(data) {
    const stats = {
        'total-users': data.totalUsers || 0,
        'pending-requests': data.pendingRequests || 0,
        'total-leave': data.totalLeaveDays || 0,
        'avg-processing': data.avgProcessingTime || '0h'
    };
    
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// ===== LOAD ĐƠN CHỜ DUYỆT =====
async function loadPendingRequests() {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getPendingRequests',
                page: currentPage,
                limit: itemsPerPage
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderPendingRequests(result.data);
            updatePagination(result.total, result.pages);
        }
    } catch (error) {
        console.error('Lỗi load đơn chờ duyệt:', error);
    }
}

function renderPendingRequests(data) {
    const tbody = document.getElementById('pendingBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state-cell">
                    <div class="empty-state-sm">
                        <i class="fas fa-inbox empty-icon-sm"></i>
                        <p>Không có đơn nào chờ duyệt</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map((item, index) => `
        <tr>
            <td>${(currentPage - 1) * itemsPerPage + index + 1}</td>
            <td>
                <div class="user-cell">
                    <div class="user-avatar-sm">${item.fullname?.charAt(0) || 'U'}</div>
                    <div class="user-details">
                        <strong>${item.fullname || 'N/A'}</strong>
                        <small>${item.department || ''}</small>
                    </div>
                </div>
            </td>
            <td>${item.leaveType || 'N/A'}</td>
            <td>
                ${Utils.formatDate(item.startDate)}<br>
                <small>đến ${Utils.formatDate(item.endDate)}</small>
            </td>
            <td><strong>${item.totalDays || 0} ngày</strong></td>
            <td class="reason-cell">
                <span class="reason-text">${item.reason || ''}</span>
                ${item.contactInfo ? `<br><small><i class="fas fa-phone"></i> ${item.contactInfo}</small>` : ''}
            </td>
            <td>${Utils.formatDate(item.submitDate)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-success btn-sm" onclick="approveRequest('${item.requestId || item.id}', true)">
                        <i class="fas fa-check"></i> Duyệt
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="approveRequest('${item.requestId || item.id}', false)">
                        <i class="fas fa-times"></i> Từ chối
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="viewRequestDetails('${item.requestId || item.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== DUYỆT/TỪ CHỐI ĐƠN =====
async function approveRequest(requestId, isApproved) {
    const action = isApproved ? 'duyệt' : 'từ chối';
    
    if (!confirm(`Bạn có chắc chắn muốn ${action} đơn này?`)) {
        return;
    }
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'approveRequest',
                requestId: requestId,
                approved: isApproved,
                approvedBy: currentUser.fullname,
                approveDate: new Date().toISOString()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            Utils.showToast(`Đã ${action} đơn thành công!`, 'success');
            loadPendingRequests();
            loadAdminStats();
        } else {
            throw new Error(result.message || `Lỗi khi ${action} đơn`);
        }
    } catch (error) {
        Utils.showToast(error.message, 'error');
        console.error('Approve request error:', error);
    }
}

// ===== XEM CHI TIẾT ĐƠN =====
async function viewRequestDetails(requestId) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getRequestDetails',
                requestId: requestId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showRequestModal(result.data);
        }
    } catch (error) {
        console.error('Lỗi load chi tiết đơn:', error);
    }
}

function showRequestModal(data) {
    const modal = document.getElementById('requestModal') || createRequestModal();
    
    // Điền thông tin vào modal
    modal.querySelector('.modal-title').textContent = `Chi tiết đơn nghỉ phép - ${data.requestId || 'N/A'}`;
    
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="request-details">
            <div class="detail-section">
                <h4><i class="fas fa-user"></i> Thông tin nhân viên</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Họ và tên:</span>
                        <span class="detail-value">${data.fullname || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Phòng ban:</span>
                        <span class="detail-value">${data.department || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Mã nhân viên:</span>
                        <span class="detail-value">${data.username || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-calendar-alt"></i> Thông tin nghỉ phép</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Loại nghỉ:</span>
                        <span class="detail-value">${data.leaveType || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Từ ngày:</span>
                        <span class="detail-value">${Utils.formatDate(data.startDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Đến ngày:</span>
                        <span class="detail-value">${Utils.formatDate(data.endDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Số ngày:</span>
                        <span class="detail-value"><strong>${data.totalDays || 0} ngày</strong></span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-file-alt"></i> Lý do & Thông tin bổ sung</h4>
                <div class="detail-item-full">
                    <span class="detail-label">Lý do nghỉ:</span>
                    <div class="detail-value-box">${data.reason || 'Không có'}</div>
                </div>
                <div class="detail-item-full">
                    <span class="detail-label">Thông tin liên hệ:</span>
                    <div class="detail-value-box">
                        <i class="fas fa-phone"></i> ${data.contactInfo || 'Không có'}
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-history"></i> Trạng thái & Lịch sử</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Trạng thái:</span>
                        <span class="detail-value">
                            <span class="status-badge badge-${getStatusClass(data.status)}">
                                ${getStatusText(data.status)}
                            </span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Ngày gửi:</span>
                        <span class="detail-value">${Utils.formatDateTime(data.submitDate)}</span>
                    </div>
                    ${data.approvedBy ? `
                    <div class="detail-item">
                        <span class="detail-label">Người duyệt:</span>
                        <span class="detail-value">${data.approvedBy}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Ngày duyệt:</span>
                        <span class="detail-value">${Utils.formatDateTime(data.approveDate)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Hiển thị modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function createRequestModal() {
    const modalHTML = `
        <div class="modal" id="requestModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Chi tiết đơn nghỉ phép</h3>
                    <button class="modal-close" onclick="closeModal('requestModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <!-- Nội dung sẽ được điền động -->
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('requestModal')">
                        <i class="fas fa-times"></i> Đóng
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    return document.getElementById('requestModal');
}

// ===== ĐÓNG MODAL =====
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ===== QUẢN LÝ NGƯỜI DÙNG =====
async function loadUsers() {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getUsers',
                page: currentPage,
                limit: itemsPerPage
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderUsers(result.data);
            updatePagination(result.total, result.pages);
        }
    } catch (error) {
        console.error('Lỗi load người dùng:', error);
    }
}

function renderUsers(data) {
    const tbody = document.getElementById('usersBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state-cell">
                    <div class="empty-state-sm">
                        <i class="fas fa-users empty-icon-sm"></i>
                        <p>Chưa có người dùng nào</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map((user, index) => `
        <tr>
            <td>${(currentPage - 1) * itemsPerPage + index + 1}</td>
            <td>
                <div class="user-cell">
                    <div class="user-avatar-sm">${user.fullname?.charAt(0) || 'U'}</div>
                    <div class="user-details">
                        <strong>${user.username || 'N/A'}</strong>
                        <small>${user.fullname || ''}</small>
                    </div>
                </div>
            </td>
            <td>${user.fullname || 'N/A'}</td>
            <td>${user.department || 'N/A'}</td>
            <td>${user.position || 'Nhân viên'}</td>
            <td>
                <span class="role-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}">
                    ${user.role === 'admin' ? 'Quản trị' : 'Nhân viên'}
                </span>
            </td>
            <td>${user.leaveDays || 12} ngày/năm</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-success btn-sm" onclick="editUser('${user.id || user.username}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="resetPassword('${user.id || user.username}')">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id || user.username}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== THÊM NGƯỜI DÙNG MỚI =====
function showAddUserModal() {
    const modal = document.getElementById('addUserModal') || createAddUserModal();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function createAddUserModal() {
    const modalHTML = `
        <div class="modal" id="addUserModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title"><i class="fas fa-user-plus"></i> Thêm người dùng mới</h3>
                    <button class="modal-close" onclick="closeModal('addUserModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="addUserForm" class="user-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newUsername"><i class="fas fa-user"></i> Tên đăng nhập *</label>
                                <input type="text" id="newUsername" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="newPassword"><i class="fas fa-lock"></i> Mật khẩu *</label>
                                <input type="password" id="newPassword" class="form-control" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newFullname"><i class="fas fa-id-card"></i> Họ và tên *</label>
                                <input type="text" id="newFullname" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="newEmail"><i class="fas fa-envelope"></i> Email</label>
                                <input type="email" id="newEmail" class="form-control">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newDepartment"><i class="fas fa-building"></i> Phòng ban</label>
                                <select id="newDepartment" class="form-control">
                                    <option value="">Chọn phòng ban</option>
                                    <option value="Nhân sự">Nhân sự</option>
                                    <option value="Kế toán">Kế toán</option>
                                    <option value="Kinh doanh">Kinh doanh</option>
                                    <option value="Kỹ thuật">Kỹ thuật</option>
                                    <option value="Marketing">Marketing</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="newPosition"><i class="fas fa-briefcase"></i> Chức vụ</label>
                                <input type="text" id="newPosition" class="form-control">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newRole"><i class="fas fa-user-tag"></i> Vai trò</label>
                                <select id="newRole" class="form-control">
                                    <option value="user">Nhân viên</option>
                                    <option value="admin">Quản trị viên</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="newLeaveDays"><i class="fas fa-calendar-day"></i> Ngày phép/năm</label>
                                <input type="number" id="newLeaveDays" class="form-control" value="12" min="1" max="30">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="newNotes"><i class="fas fa-sticky-note"></i> Ghi chú</label>
                            <textarea id="newNotes" class="form-control" rows="3"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('addUserModal')">
                        <i class="fas fa-times"></i> Hủy
                    </button>
                    <button class="btn btn-primary" onclick="submitAddUser()">
                        <i class="fas fa-save"></i> Lưu người dùng
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    return document.getElementById('addUserModal');
}

async function submitAddUser() {
    const form = document.getElementById('addUserForm');
    if (!form.checkValidity()) {
        Utils.showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
        return;
    }
    
    const userData = {
        action: 'addUser',
        username: document.getElementById('newUsername').value.trim(),
        password: document.getElementById('newPassword').value,
        fullname: document.getElementById('newFullname').value.trim(),
        email: document.getElementById('newEmail').value.trim(),
        department: document.getElementById('newDepartment').value,
        position: document.getElementById('newPosition').value.trim(),
        role: document.getElementById('newRole').value,
        leaveDays: parseInt(document.getElementById('newLeaveDays').value) || 12,
        notes: document.getElementById('newNotes').value.trim(),
        joinDate: new Date().toISOString().split('T')[0]
    };
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            Utils.showToast('Đã thêm người dùng thành công!', 'success');
            closeModal('addUserModal');
            loadUsers();
            form.reset();
        } else {
            throw new Error(result.message || 'Thêm người dùng thất bại');
        }
    } catch (error) {
        Utils.showToast(error.message, 'error');
        console.error('Add user error:', error);
    }
}

// ===== QUẢN LÝ LƯƠNG =====
async function calculateSalary() {
    const month = document.getElementById('salaryMonth').value;
    const baseSalary = parseInt(document.getElementById('baseSalary').value) || 10000000;
    
    if (!month) {
        Utils.showToast('Vui lòng chọn tháng', 'error');
        return;
    }
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'calculateSalary',
                month: month,
                baseSalary: baseSalary
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderSalaryTable(result.data);
            updateSalarySummary(result.summary);
        }
    } catch (error) {
        console.error('Lỗi tính lương:', error);
        Utils.showToast('Không thể tính lương', 'error');
    }
}

function renderSalaryTable(data) {
    const tbody = document.getElementById('salaryBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state-cell">
                    <div class="empty-state-sm">
                        <i class="fas fa-calculator empty-icon-sm"></i>
                        <p>Không có dữ liệu lương cho tháng này</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let totalSalary = 0;
    let totalDeduction = 0;
    
    tbody.innerHTML = data.map((item, index) => {
        totalSalary += item.actualSalary || 0;
        totalDeduction += item.deduction || 0;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${item.employeeId || 'N/A'}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-sm">${item.fullname?.charAt(0) || 'U'}</div>
                        <div class="user-details">
                            <strong>${item.fullname || 'N/A'}</strong>
                            <small>${item.department || ''}</small>
                        </div>
                    </div>
                </td>
                <td>${item.workDays || 0}</td>
                <td>${item.leaveDays || 0}</td>
                <td>${Utils.formatCurrency(item.baseSalary || 0)}</td>
                <td class="${item.deduction ? 'text-danger' : ''}">
                    ${Utils.formatCurrency(item.deduction || 0)}
                </td>
                <td><strong>${Utils.formatCurrency(item.actualSalary || 0)}</strong></td>
                <td>${item.notes || ''}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewSalaryDetails('${item.employeeId}', '${month}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Cập nhật tổng
    const totalRow = document.getElementById('salaryTotal');
    if (totalRow) {
        totalRow.innerHTML = `
            <td colspan="5"><strong>TỔNG CỘNG</strong></td>
            <td><strong>${Utils.formatCurrency(data.reduce((sum, item) => sum + (item.baseSalary || 0), 0))}</strong></td>
            <td><strong class="text-danger">${Utils.formatCurrency(totalDeduction)}</strong></td>
            <td><strong class="text-success">${Utils.formatCurrency(totalSalary)}</strong></td>
            <td colspan="2"></td>
        `;
    }
}

function updateSalarySummary(summary) {
    const elements = {
        'totalEmployees': summary.totalEmployees || 0,
        'totalWorkDays': summary.totalWorkDays || 0,
        'totalLeaveDays': summary.totalLeaveDays || 0,
        'totalSalary': Utils.formatCurrency(summary.totalSalary || 0)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// ===== XUẤT FILE =====
async function exportToExcel(type) {
    const month = document.getElementById('filterMonth')?.value || 
                  document.getElementById('salaryMonth')?.value ||
                  new Date().toISOString().slice(0, 7);
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'exportData',
                type: type || 'all',
                month: month
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.fileUrl) {
            Utils.showToast('Đã xuất file thành công!', 'success');
            
            // Mở file trong tab mới
            window.open(result.fileUrl, '_blank');
        } else {
            throw new Error(result.message || 'Xuất file thất bại');
        }
    } catch (error) {
        Utils.showToast(error.message, 'error');
        console.error('Export error:', error);
    }
}

// ===== FILTER & SEARCH =====
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchHandler = Utils.debounce((value) => {
        applyFilters({ search: value });
    }, 500);
    
    searchInput.addEventListener('input', (e) => {
        searchHandler(e.target.value);
    });
}

function applyFilters(filters) {
    // Lưu filters vào URL hoặc state
    const params = new URLSearchParams(window.location.search);
    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
    });
    
    // Cập nhật URL không reload page
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
    
    // Load lại dữ liệu với filter
    loadDataWithFilters(filters);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo dựa trên trang hiện tại
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/') {
        // Trang đăng nhập
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Auto-focus vào username
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.focus();
        }
        
    } else if (path.includes('dashboard.html')) {
        // Dashboard nhân viên
        checkAuth();
        loadUserInfo();
        
        // Xử lý form đăng ký nghỉ
        const leaveForm = document.getElementById('leaveForm');
        if (leaveForm) {
            leaveForm.addEventListener('submit', handleLeaveRequest);
            
            // Setup date calculations
            const startDate = document.getElementById('startDate');
            const endDate = document.getElementById('endDate');
            
            if (startDate && endDate) {
                const today = new Date().toISOString().split('T')[0];
                startDate.min = today;
                endDate.min = today;
                
                startDate.addEventListener('change', function() {
                    endDate.min = this.value;
                    calculateDays();
                });
                
                endDate.addEventListener('change', calculateDays);
            }
        }
        
        // Load lịch sử
        loadLeaveHistory();
        
        // Setup tabs
        setupTabs();
        
    } else if (path.includes('admin.html')) {
        // Dashboard admin
        const user = checkAuth();
        if (user && user.role !== 'admin') {
            Utils.showToast('Bạn không có quyền truy cập trang này', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
            return;
        }
        
        loadUserInfo();
        loadPendingRequests();
        loadUsers();
        
        // Setup admin tabs
        setupAdminTabs();
        
        // Setup search và filter
        setupSearch();
    }
    
    // Setup chung
    setupModals();
    setupNotifications();
    
    // Xử lý back/forward browser
    window.addEventListener('popstate', () => {
        const params = new URLSearchParams(window.location.search);
        const filters = Object.fromEntries(params);
        loadDataWithFilters(filters);
    });
});

// ===== SETUP FUNCTIONS =====
function setupTabs() {
    const tabLinks = document.querySelectorAll('[data-tab]');
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            
            // Xóa active cũ
            tabLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Thêm active mới
            link.classList.add('active');
            const tabContent = document.getElementById(`${tabId}Tab`);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            // Load dữ liệu cho tab
            switch(tabId) {
                case 'history':
                    loadLeaveHistory();
                    break;
                case 'profile':
                    loadUserProfile();
                    break;
            }
        });
    });
}

function setupAdminTabs() {
    const adminTabs = document.querySelectorAll('.admin-tab');
    adminTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const section = tab.getAttribute('data-section');
            
            // Xóa active cũ
            adminTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            
            // Thêm active mới
            tab.classList.add('active');
            const sectionEl = document.getElementById(`${section}Section`);
            if (sectionEl) {
                sectionEl.classList.add('active');
            }
            
            // Load dữ liệu cho section
            switch(section) {
                case 'pending':
                    loadPendingRequests();
                    break;
                case 'users':
                    loadUsers();
                    break;
                case 'reports':
                    loadReports();
                    break;
                case 'salary':
                    calculateSalary();
                    break;
            }
        });
    });
}

function setupModals() {
    // Đóng modal khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Đóng modal bằng ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        }
    });
}

function setupNotifications() {
    // Kiểm tra notification mỗi 30 giây
    if (currentUser && currentUser.role === 'admin') {
        setInterval(checkNotifications, 30000);
    }
}

async function checkNotifications() {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getNotifications'
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            updateNotificationBadge(result.data.length);
            
            // Hiển thị desktop notification
            if (Notification.permission === 'granted') {
                result.data.forEach(notif => {
                    new Notification('LeavePro - Thông báo mới', {
                        body: notif.message,
                        icon: '/favicon.ico'
                    });
                });
            }
        }
    } catch (error) {
        console.error('Lỗi check notification:', error);
    }
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
        
        // Animation
        if (count > 0) {
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 1000);
        }
    }
}

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    Utils.showToast('Đã xảy ra lỗi không mong muốn', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    Utils.showToast('Lỗi kết nối đến server', 'error');
});

// ===== OFFLINE SUPPORT =====
window.addEventListener('online', function() {
    Utils.showToast('Đã kết nối lại internet', 'success');
    // Sync dữ liệu offline nếu có
    syncOfflineData();
});

window.addEventListener('offline', function() {
    Utils.showToast('Mất kết nối internet', 'warning');
});

async function syncOfflineData() {
    // Đồng bộ dữ liệu đã lưu offline
    const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
    
    if (offlineRequests.length > 0) {
        Utils.showToast(`Đang đồng bộ ${offlineRequests.length} yêu cầu...`, 'info');
        
        for (const request of offlineRequests) {
            try {
                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(request)
                });
            } catch (error) {
                console.error('Lỗi sync request:', error);
            }
        }
        
        localStorage.removeItem('offlineRequests');
        Utils.showToast('Đã đồng bộ dữ liệu thành công!', 'success');
    }
}

// ===== SERVICE WORKER (PWA) =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful');
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

