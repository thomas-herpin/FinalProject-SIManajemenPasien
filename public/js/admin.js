// Function to fetch and update dashboard statistics
async function updateDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No authentication token found');
            window.location.href = '/login.html';
            return;
        }
        
        const response = await fetch('/api/dashboard/statistics', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            throw new Error('Failed to fetch statistics');
        }
        
        const data = await response.json();
        
        const schedules = data.schedules !== undefined ? data.schedules : 0;
        const shifts = data.shifts !== undefined ? data.shifts : 0;
        const bookings = data.bookings !== undefined ? data.bookings : 0;
        const reports = data.reports !== undefined ? data.reports : 0;
        
        document.getElementById('schedulesCount').textContent = schedules;
        document.getElementById('shiftsCount').textContent = shifts;
        document.getElementById('bookingsCount').textContent = bookings;
        document.getElementById('reportsCount').textContent = reports;
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        document.getElementById('schedulesCount').textContent = '0';
        document.getElementById('shiftsCount').textContent = '0';
        document.getElementById('bookingsCount').textContent = '0';
        document.getElementById('reportsCount').textContent = '0';
    }
}

document.addEventListener('DOMContentLoaded', updateDashboardStats);

setInterval(updateDashboardStats, 5 * 60 * 1000); 