document.addEventListener('DOMContentLoaded', function() {
    const userName = document.getElementById('user-name');
    if (userName) {
        userName.textContent = AuthHandler.getUserName() || 'User';
    }

    setupSidebarNavigation();
    loadDashboardStats();
    loadRecentAppointments();
    loadRecommendedDoctors();
    loadNotificationCount();
    setInterval(loadNotificationCount, 30000);
});

async function fetchWithAuth(url, options = {}) {
    const token = AuthHandler.getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
        throw error;
    }
}

function setupSidebarNavigation() {
    const viewAllBtn = document.getElementById('view-all-appointments');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            window.location.href = '/user-appointment';
        });
    }
    
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-button');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                window.location.href = `/dokter?search=${encodeURIComponent(searchTerm)}`;
            } else {
                window.location.href = '/dokter';
            }
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchButton.click();
            }
        });
    }
    
    const profileBtn = document.querySelector('.profile-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (profileBtn && dropdownMenu) {
        profileBtn.addEventListener('click', function() {
            dropdownMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }
}

async function loadNotificationCount() {
    try {
        const badge = document.getElementById('notification-badge');
        const notifBtn = document.querySelector('.notif-btn');
        
        if (!badge && !notifBtn) return;
        
        const notifications = await fetchWithAuth('/api/notifications?unreadOnly=true');
        
        if (notifications && Array.isArray(notifications)) {
            const count = notifications.length || 0;
            
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'block' : 'none';
            } 
            else if (notifBtn && count > 0) {
                const newBadge = document.createElement('span');
                newBadge.className = 'notification-badge';
                newBadge.textContent = count;
                notifBtn.appendChild(newBadge);
            }
        }
    } catch (error) {
    }
}

async function loadDashboardStats() {
    try {
        const stats = await fetchWithAuth('/api/appointments/stats');
        if (stats) {
            updateElementText('upcoming-appointments', stats.upcoming || 0);
            updateElementText('pending-appointments', stats.pending || 0);
            updateElementText('completed-appointments', stats.completed || 0);
        }
        
        const doctorsData = await fetchWithAuth('/api/doctors/count');
        if (doctorsData) {
            updateElementText('total-doctors', doctorsData.count || 0);
        }
    } catch (error) {
    }
}

async function loadRecentAppointments() {
    try {
        const tableBody = document.getElementById('recent-appointments-table');
        if (!tableBody) return;
        
        const appointments = await fetchWithAuth('/api/appointments?limit=5');
        
        if (appointments && Array.isArray(appointments) && appointments.length) {
            tableBody.innerHTML = '';
            
            appointments.forEach(appointment => {
                const row = document.createElement('tr');
                
                const date = new Date(appointment.appointmentDate);
                const formattedDate = date.toLocaleDateString() + ' ' + 
                    date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                row.innerHTML = `
                    <td>${appointment.doctorName || 'Unknown'}</td>
                    <td>${appointment.department || 'General'}</td>
                    <td>${formattedDate}</td>
                    <td><span class="status ${appointment.status.toLowerCase()}">${appointment.status}</span></td>
                `;
                
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center;">No recent appointments found</td>
                </tr>
            `;
        }
    } catch (error) {
        const tableBody = document.getElementById('recent-appointments-table');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center;">Unable to load appointments</td>
                </tr>
            `;
        }
    }
}

async function loadRecommendedDoctors() {
    try {
        const response = await fetch('/api/recommended-doctors', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const mockDoctors = [
                {
                    id: '1',
                    name: 'Dr. Mock Siti Aminah',
                    specialty: 'Kardiologi',
                    image: '../assets/doctor1.jpg',
                    rating: 4.8
                },
                {
                    id: '2',
                    name: 'Dr. Mock Budi Santoso',
                    specialty: 'Neurologi',
                    image: '../assets/doctor2.jpg',
                    rating: 4.7
                },
                {
                    id: '3',
                    name: 'Dr. Mock Dewi Putri',
                    specialty: 'Dermatologi',
                    image: '../assets/doctor3.jpg',
                    rating: 4.9
                }
            ];
            displayRecommendedDoctors(mockDoctors);
            return;
        }
        
        const doctors = await response.json();
        displayRecommendedDoctors(doctors);
    } catch (error) {
        const mockDoctors = [
            {
                id: '1',
                name: 'Dr. Mock Siti Aminah',
                specialty: 'Kardiologi',
                image: '../assets/doctor1.jpg',
                rating: 4.8
            },
            {
                id: '2',
                name: 'Dr. Mock Budi Santoso',
                specialty: 'Neurologi',
                image: '../assets/doctor2.jpg',
                rating: 4.7
            },
            {
                id: '3',
                name: 'Dr. Mock Dewi Putri',
                specialty: 'Dermatologi',
                image: '../assets/doctor3.jpg',
                rating: 4.9
            }
        ];
        displayRecommendedDoctors(mockDoctors);
    }
}

function displayRecommendedDoctors(doctors) {
    const container = document.getElementById('doctor-cards-container');
    const template = document.getElementById('doctor-card-template');
    if (!container || !template) {
        return;
    }
    container.innerHTML = '';
    if (!Array.isArray(doctors) || doctors.length === 0) {
        container.innerHTML = '<p>No recommended doctors found at this time.</p>';
        return;
    }
    doctors.forEach(doctor => {
        const clone = document.importNode(template.content, true);
        const card = clone.querySelector('.doctor-card');
        const img = clone.querySelector('.doctor-image');
        const name = clone.querySelector('.doctor-name');
        const specialtyBadge = clone.querySelector('.doctor-specialty-badge');
        const experienceText = clone.querySelector('.experience-text');
        const stars = clone.querySelector('.rating .stars');
        const ratingValue = clone.querySelector('.rating .rating-value');
        const bookBtn = clone.querySelector('.book-button');

        if (img) {
            img.src = doctor.image_url || doctor.image || '../assets/doctor-placeholder.jpg';
            img.alt = `Photo of ${doctor.name}`;
        }
        
        if (name) {
            name.textContent = doctor.name || 'Unknown Doctor';
        }
        
        if (specialtyBadge) {
            specialtyBadge.textContent = doctor.specialty || 'General Practice';
        }
        
        if (experienceText) {
            experienceText.textContent = doctor.specialty || 'Spesialis';
        }
        
        const rating = parseFloat(doctor.rating);
        if (!isNaN(rating)) {
            if (stars) {
                stars.innerHTML = generateStars(rating);
            }
            if (ratingValue) {
                ratingValue.textContent = rating.toFixed(1);
            }
        } else {
            if (stars) {
                stars.innerHTML = generateStars(0);
            }
            if (ratingValue) {
                ratingValue.textContent = 'N/A';
            }
        }
        
        if (bookBtn) {
            bookBtn.onclick = () => {
                window.location.href = `/booking?id=${doctor.id}`;
            };
        }
        
        container.appendChild(clone);
    });
}

function generateStars(rating) {
    const totalStars = 5;
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    return starsHtml;
}

function updateElementText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
} 