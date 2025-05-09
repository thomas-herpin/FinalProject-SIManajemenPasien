// Load user settings
async function loadSettings() {
    try {
        const response = await api.get('/api/settings');
        const settings = response.data || {};

        // Populate form fields
        document.getElementById('email').value = settings.email || '';
        document.getElementById('phone').value = settings.phone || '';
        document.getElementById('language').value = settings.language || 'en';
        document.getElementById('theme').value = settings.theme || 'light';
        document.getElementById('notifications').checked = settings.notifications || false;
        document.getElementById('emailNotifications').checked = settings.emailNotifications || false;
        document.getElementById('smsNotifications').checked = settings.smsNotifications || false;
    } catch (error) {
        console.error('Error loading settings:', error);
        alert('Failed to load settings');
    }
}

// Save user settings
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const settings = {
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        language: document.getElementById('language').value,
        theme: document.getElementById('theme').value,
        notifications: document.getElementById('notifications').checked,
        emailNotifications: document.getElementById('emailNotifications').checked,
        smsNotifications: document.getElementById('smsNotifications').checked
    };

    try {
        const response = await api.put('/api/settings', settings);
        if (response.success) {
            alert('Settings saved successfully!');
            
            // Apply theme changes immediately
            if (settings.theme === 'dark') {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        } else {
            alert(response.message || 'Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings');
    }
});

// Change password
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    try {
        const response = await api.put('/api/settings/password', {
            currentPassword,
            newPassword
        });

        if (response.success) {
            alert('Password changed successfully!');
            document.getElementById('changePasswordForm').reset();
        } else {
            alert(response.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Failed to change password');
    }
});

// Load settings when page loads
document.addEventListener('DOMContentLoaded', loadSettings); 