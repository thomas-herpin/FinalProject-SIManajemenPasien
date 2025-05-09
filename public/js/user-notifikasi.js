document.addEventListener('DOMContentLoaded', function() {
    if (!AuthHandler.isAuthenticated()) {
        window.location.href = '/auth';
        return;
    }
    
    // Initialize
    setupProfileDropdown();
    fetchNotifications();
    setupEventListeners();
});

function setupProfileDropdown() {
    const profileBtn = document.querySelector('.profile-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (profileBtn && dropdownMenu) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'flex' ? 'none' : 'flex';
        });
        
        document.addEventListener('click', function() {
            if (dropdownMenu.style.display === 'flex') {
                dropdownMenu.style.display = 'none';
            }
        });
        
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

async function fetchWithAuth(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include' 
        });
        
        if (response.status === 401) {
            AuthHandler.clearAuth();
            window.location.href = '/auth';
            return null;
        }
        
        if (response.headers.get('content-type')?.includes('application/json')) {
            return await response.json();
        }
        
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getNotificationIcon(type) {
    switch (type) {
        case 'appointment':
            return 'fa-calendar-check';
        case 'reminder':
            return 'fa-bell';
        case 'system':
            return 'fa-cog';
        default:
            return 'fa-info-circle';
    }
}

async function fetchNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    
    try {
        const notifications = await fetchWithAuth('/api/notifications');
        updateNotificationBadge(notifications);
        notificationsList.innerHTML = '';
        
        if (!notifications || notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>Tidak ada notifikasi saat ini</p>
                </div>
            `;
            return;
        }
        
        notifications.sort((a, b) => {
            if (a.is_read !== b.is_read) {
                return a.is_read ? 1 : -1;
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });
        
        notifications.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = `notification-item ${notification.is_read ? 'read' : 'unread'}`;
            notificationElement.dataset.id = notification.id;
            
            notificationElement.innerHTML = `
                <div class="notification-icon">
                    <i class="fas ${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">
                        <h4>${notification.title}</h4>
                        <span class="timestamp">${formatDate(notification.created_at)}</span>
                    </div>
                    <p>${notification.message}</p>
                </div>
                ${!notification.is_read ? '<div class="unread-indicator"></div>' : ''}
            `;
            
            notificationsList.appendChild(notificationElement);
        });
        
        addNotificationClickListeners();
        
    } catch (error) {
        console.error('Error fetching notifications:', error);
        notificationsList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Gagal memuat notifikasi</p>
                <button class="retry-button" onclick="fetchNotifications()">Coba Lagi</button>
            </div>
        `;
    }
}

function updateNotificationBadge(notifications) {
    if (!notifications) return;
    
    const badge = document.getElementById('notification-badge');
    if (badge) {
        const unreadCount = notifications.filter(n => !n.is_read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function addNotificationClickListeners() {
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.addEventListener('click', async function() {
            const id = this.dataset.id;
            if (!id) return;
            
            try {
                await markNotificationAsRead(id);
                this.classList.remove('unread');
                this.classList.add('read');
                
                const indicator = this.querySelector('.unread-indicator');
                if (indicator) {
                    indicator.remove();
                }
                
                const badge = document.getElementById('notification-badge');
                if (badge) {
                    const currentCount = parseInt(badge.textContent) || 0;
                    if (currentCount > 0) {
                        const newCount = currentCount - 1;
                        badge.textContent = newCount;
                        badge.style.display = newCount > 0 ? 'flex' : 'none';
                    }
                }
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        });
    });
}

async function markNotificationAsRead(id) {
    return fetchWithAuth(`/api/notifications/${id}/read`, {
        method: 'PUT'
    });
}

async function markAllNotificationsAsRead() {
    try {
        const unreadNotifications = document.querySelectorAll('.notification-item.unread');
        
        if (unreadNotifications.length === 0) {
            return;
        }
        
        const markingPromises = Array.from(unreadNotifications).map(item => {
            const id = item.dataset.id;
            return markNotificationAsRead(id);
        });
        
        await Promise.all(markingPromises);
        
        unreadNotifications.forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
            
            const indicator = item.querySelector('.unread-indicator');
            if (indicator) {
                indicator.remove();
            }
        });
        
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

function setupEventListeners() {
    const markAllReadBtn = document.getElementById('mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    }
} 