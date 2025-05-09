
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            console.log('Logout requested');
            
            try {
                await AuthHandler.logout();
            } catch (error) {
                console.error('Error during logout:', error);
                window.location.href = '/auth.html';
            }
        });
    }
}); 