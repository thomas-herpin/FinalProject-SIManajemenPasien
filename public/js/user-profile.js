let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page loaded, initializing...');
    
    if (!AuthHandler.isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        AuthHandler.redirectToLogin();
        return;
    }

    setupEditProfile();
    setupProfileDropdown();
    fetchUserProfile().then(() => {
        fetchUserAppointments();
    }).catch(error => {
        console.error('Error initializing profile:', error);
    });
    
    const logoutBtn = document.querySelector('#logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            AuthHandler.logout();
        });
    }
});

function setupProfileDropdown() {
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

function showMessage(message, type = 'info') {
    const userMessage = document.getElementById('userMessage');
    const messageText = document.getElementById('messageText');
    
    if (!userMessage || !messageText) return;
    
    userMessage.className = `alert alert-${type}`;
    messageText.textContent = message;
    userMessage.style.display = 'flex';
    
    setTimeout(() => {
        userMessage.style.display = 'none';
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

async function fetchUserProfile() {
    console.log('Fetching user profile data...');
    
    try {
        const userData = await AuthHandler.getUserData();
        console.log('Retrieved user data from API:', userData);
        
        if (userData) {
            displayUserProfile(userData);
            currentUser = userData;
            return userData;
        } else {
            throw new Error('Could not fetch user profile data');
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        
        showMessage('Terjadi kesalahan saat memuat profil Anda. Silakan coba lagi.', 'error');
        
        throw error;
    }
}

function displayUserProfile(user) {
    console.log('Displaying user profile:', user);
    
    if (!user) {
        console.error('No user data to display');
        return;
    }
    
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = user.name || 'User';
    }
    
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userPhone = document.getElementById('userPhone');
    const userJoinDate = document.getElementById('userJoinDate');
    
    if (userName) {
        userName.textContent = user.name || 'Tidak tersedia';
    }
    
    if (userEmail) {
        userEmail.textContent = user.email || 'Tidak tersedia';
    }
    
    if (userPhone) {
        userPhone.textContent = user.phone || user.phone_number || 'Tidak tersedia';
    }
    
    if (userJoinDate) {
        userJoinDate.textContent = formatDate(user.created_at || user.createdAt);
    }
    
    const loadingMessage = document.getElementById('userLoadingMessage');
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }
    const userInfoSection = document.querySelector('.user-info');
    if (userInfoSection) {
        userInfoSection.style.display = 'flex';
    }
    
    updateEditProfileForm(user);
}

function updateEditProfileForm(user) {
    if (!user) return;
    
    const editNameInput = document.getElementById('editName');
    const editEmailInput = document.getElementById('editEmail');
    const editPhoneInput = document.getElementById('editPhone');
    const editBirthdateInput = document.getElementById('editBirthdate');
    const editGenderSelect = document.getElementById('editGender');
    const editAddressInput = document.getElementById('editAddress');
    
    if (editNameInput) {
        editNameInput.value = user.name || '';
    }
    
    if (editEmailInput) {
        editEmailInput.value = user.email || '';
    }
    
    if (editPhoneInput) {
        editPhoneInput.value = user.phone || user.phone_number || '';
    }
    
    if (editBirthdateInput && user.birthdate) {
        const birthdate = new Date(user.birthdate);
        if (!isNaN(birthdate.getTime())) {
            const year = birthdate.getFullYear();
            const month = String(birthdate.getMonth() + 1).padStart(2, '0');
            const day = String(birthdate.getDate()).padStart(2, '0');
            editBirthdateInput.value = `${year}-${month}-${day}`;
        }
    }
    
    if (editGenderSelect) {
        editGenderSelect.value = user.gender || '';
    }
    
    if (editAddressInput) {
        editAddressInput.value = user.address || '';
    }
}

async function fetchUserAppointments() {
    try {
        const appointmentsContainer = document.getElementById('appointments');
        const loadingMessage = document.getElementById('appointmentsLoading');
        
        if (!appointmentsContainer) {
            console.error('Appointments container not found');
            return;
        }
        
        if (loadingMessage) {
            loadingMessage.style.display = 'block';
        }
        
        let userId = null;
        
        if (!currentUser || !currentUser.id) {
            console.log('User data not available in currentUser, trying to fetch from AuthHandler...');
            try {
                const userData = await AuthHandler.getUserData();
                if (userData && userData.id) {
                    userId = userData.id;
                    currentUser = userData;
                } else {
                    throw new Error('Could not get user data from AuthHandler');
                }
            } catch (authError) {
                console.error('Failed to get user data:', authError);
                throw new Error('User data not available');
            }
        } else {
            userId = currentUser.id;
        }
        
        if (!userId) {
            throw new Error('User ID not available');
        }
        
        const response = await fetch(`/api/appointments?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch appointments');
        }
        
        const appointments = await response.json();
        
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        
        displayAppointments(appointments);
        
    } catch (error) {
        console.error('Error fetching appointments:', error);
        const appointmentsContainer = document.getElementById('appointments');
        
        if (appointmentsContainer) {
            appointmentsContainer.innerHTML = '<p class="error-message">Gagal memuat janji dokter. Silakan coba lagi nanti.</p>';
        }
        
        const loadingMessage = document.getElementById('appointmentsLoading');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
    }
}

function displayAppointments(appointments) {
    const appointmentsContainer = document.getElementById('appointments');
    
    if (!appointmentsContainer) {
        console.error('Appointments container not found');
        return;
    }
    
    appointmentsContainer.innerHTML = '';
    
    if (!appointments || appointments.length === 0) {
        appointmentsContainer.innerHTML = `
            <div class="no-appointments">
                <p>Anda belum memiliki janji dokter.</p>
            </div>
        `;
        return;
    }
    
    const appointmentsList = document.createElement('div');
    appointmentsList.className = 'appointments-list';
    appointments.sort((a, b) => {
        const dateA = new Date(a.appointment_date || a.date);
        const dateB = new Date(b.appointment_date || b.date);
        return dateB - dateA;
    });
    
    appointments.forEach(appointment => {
        const card = createAppointmentCard(appointment);
        appointmentsList.appendChild(card);
    });
    
    appointmentsContainer.appendChild(appointmentsList);
}

function createAppointmentCard(appointment) {
    const card = document.createElement('div');
    card.className = 'appointment-card';
    
    const status = appointment.status || 'pending';
    const statusText = getStatusText(status);
    const statusClass = getStatusClass(status);
    
    const appointmentDate = appointment.appointment_date || appointment.date;
    const formattedDate = formatDate(appointmentDate);
    const formattedTime = appointment.time || '00:00';
    
    const doctorName = appointment.doctor_name || appointment.doctorName || 'Dokter';
    
    card.innerHTML = `
        <div class="appointment-header">
            <h4>${doctorName}</h4>
            <span class="appointment-status ${statusClass}">${statusText}</span>
        </div>
        <div class="appointment-details">
            <div>
                <i class="far fa-calendar-alt"></i>
                <span>${formattedDate}</span>
            </div>
            <div>
                <i class="far fa-clock"></i>
                <span>${formattedTime}</span>
            </div>
            <div>
                <i class="fas fa-stethoscope"></i>
                <span>${appointment.specialty || appointment.doctor_specialty || 'Konsultasi'}</span>
            </div>
        </div>
    `;
    
    if (status === 'pending' || status === 'unpaid') {
        const payButton = document.createElement('button');
        payButton.className = 'btn btn-primary';
        payButton.style.marginTop = '15px';
        payButton.innerHTML = '<i class="fas fa-credit-card"></i> Lanjutkan Pembayaran';
        payButton.addEventListener('click', () => redirectToPayment(appointment));
        card.appendChild(payButton);
    }
    
    return card;
}

function getStatusText(status) {
    switch (status.toLowerCase()) {
        case 'confirmed':
            return 'Terkonfirmasi';
        case 'completed':
            return 'Selesai';
        case 'cancelled':
            return 'Dibatalkan';
        case 'unpaid':
            return 'Belum Dibayar';
        case 'pending':
        default:
            return 'Menunggu';
    }
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'confirmed':
            return 'status-confirmed';
        case 'completed':
            return 'status-completed';
        case 'cancelled':
            return 'status-cancelled';
        case 'unpaid':
            return 'status-pending';
        case 'pending':
        default:
            return 'status-pending';
    }
}

function redirectToPayment(appointment) {
    const params = new URLSearchParams();
    params.append('appointmentId', appointment.id);
    params.append('doctorId', appointment.doctor_id || appointment.doctorId);
    params.append('doctorName', appointment.doctor_name || appointment.doctorName || 'Doctor');
    params.append('date', appointment.appointment_date || appointment.date);
    params.append('time', appointment.time || '00:00');
    
    window.location.href = `/payment?${params.toString()}`;
}

function setupEditProfile() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const editProfileForm = document.getElementById('editProfileForm');
    
    if (editProfileBtn && editProfileModal) {
        editProfileBtn.addEventListener('click', function() {
            editProfileModal.style.display = 'flex';
            setTimeout(() => {
                document.querySelector('.modal-content').classList.add('show');
            }, 10);
        });
    }
    
    if (closeModalBtns && editProfileModal) {
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                editProfileModal.style.display = 'none';
            });
        });
        
        editProfileModal.addEventListener('click', function(e) {
            if (e.target === editProfileModal) {
                editProfileModal.style.display = 'none';
            }
        });
    }
    
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const submitBtn = editProfileForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
                }
                
                const formData = {
                    name: document.getElementById('editName').value,
                    email: document.getElementById('editEmail').value,
                    phone: document.getElementById('editPhone').value,
                    birthdate: document.getElementById('editBirthdate').value,
                    gender: document.getElementById('editGender').value,
                    address: document.getElementById('editAddress').value
                };
                
                if (!formData.name || !formData.email) {
                    throw new Error('Nama dan email harus diisi');
                }
                
                const response = await fetch('/api/users/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to update profile');
                }
                
                const updatedUser = await response.json();
                
                currentUser = {...currentUser, ...updatedUser};
                displayUserProfile(currentUser);
                showEditProfileMessage('Profil berhasil diperbarui', 'success');
                setTimeout(() => {
                    editProfileModal.style.display = 'none';
                    showMessage('Profil berhasil diperbarui', 'success');
                }, 1500);
                
            } catch (error) {
                console.error('Error updating profile:', error);
                showEditProfileMessage(error.message || 'Gagal memperbarui profil. Silakan coba lagi.', 'error');
            } finally {
                const submitBtn = editProfileForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
                }
            }
        });
    }
}

function showEditProfileMessage(message, type = 'error') {
    const messageContainer = document.getElementById('editProfileMessage');
    const messageText = document.getElementById('editMessageText');
    
    if (!messageContainer || !messageText) return;
    
    messageContainer.className = `alert alert-${type === 'success' ? 'success' : 'danger'}`;
    messageText.textContent = message;
    messageContainer.style.display = 'flex';
    
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000);
} 