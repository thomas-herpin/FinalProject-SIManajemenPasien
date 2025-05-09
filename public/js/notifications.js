async function loadNotifications() {
    try {
        const response = await api.get('/api/notifications');
        const notifications = response.data || [];

        const notificationsList = document.getElementById('notificationsList');
        notificationsList.innerHTML = '';

        notifications.forEach(notification => {
            const notificationItem = document.createElement('div');
            notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
            notificationItem.innerHTML = `
                <div class="notification-content">
                    <h5>${notification.title}</h5>
                    <p>${notification.message}</p>
                    <small>${new Date(notification.date).toLocaleString()}</small>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? 
                        `<button class="btn btn-sm btn-primary" onclick="markAsRead('${notification.id}')">Mark as Read</button>` : 
                        `<button class="btn btn-sm btn-danger" onclick="deleteNotification('${notification.id}')">Delete</button>`
                    }
                </div>
            `;
            notificationsList.appendChild(notificationItem);
        });

        const unreadCount = notifications.filter(n => !n.read).length;
        document.getElementById('notificationCount').textContent = unreadCount;
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function markAsRead(notificationId) {
    try {
        const response = await api.put(`/api/notifications/${notificationId}/read`);
        if (response.success) {
            loadNotifications();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function deleteNotification(notificationId) {
    try {
        const response = await api.delete(`/api/notifications/${notificationId}`);
        if (response.success) {
            loadNotifications();
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

async function markAllAsRead() {
    try {
        const response = await api.put('/api/notifications/read-all');
        if (response.success) {
            loadNotifications();
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

async function deleteAllNotifications() {
    if (confirm('Are you sure you want to delete all notifications?')) {
        try {
            const response = await api.delete('/api/notifications');
            if (response.success) {
                loadNotifications();
            }
        } catch (error) {
            console.error('Error deleting all notifications:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', loadNotifications); 