const AuthHandler = {
    isAuthenticated: function() {
        try {
            if (!document.cookie) {
                return false;
            }
            
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith('auth_status=authenticated')) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error("Error checking authentication:", error);
            return false;
        }
    },
    
    verifyAuth: async function() {
        try {
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include', 
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Authentication verification failed');
            }
            
            const userData = await response.json();
            return userData;
        } catch (error) {
            console.error('Auth verification error:', error);
            throw error;
        }
    },
    
    getUserData: async function() {
        try {
            return await this.verifyAuth();
        } catch (error) {
            console.error('Failed to get user data:', error);
            return null;
        }
    },
    
    logout: async function() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            window.location.href = '/auth.html';
        }
    },
    
    redirectToLogin: function() {
        window.location.href = '/auth.html';
    },
    
    redirectToDashboard: async function() {
        try {
            const userData = await this.getUserData();
            
            if (!userData || !userData.role) {
                console.log('No valid user data or role found, redirecting to login');
                this.redirectToLogin();
                return;
            }
            
            console.log('Redirecting to dashboard for role:', userData.role);
            
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Error redirecting to dashboard:', error);
            this.redirectToLogin();
        }
    }
};

console.log('AuthHandler initialized (JWT-based)'); 