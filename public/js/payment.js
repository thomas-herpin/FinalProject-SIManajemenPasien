document.addEventListener('DOMContentLoaded', function() {
    if (!AuthHandler.isAuthenticated()) {
        setTimeout(() => {
            window.location.href = '/auth.html';
        }, 100);
        return;
    }
    
    setupProfileDropdown();
    loadAppointmentDetails();
    
    document.getElementById('backButton').addEventListener('click', function() {
        window.history.back();
    });
    
    document.getElementById('payButton').addEventListener('click', processPayment);
    
    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', function() {
            const popup = this.closest('.popup-overlay');
            popup.style.display = 'none';
        });
    });
    
    document.querySelector('.retry-btn').addEventListener('click', function() {
        document.getElementById('errorPopup').style.display = 'none';
    });
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

function loadAppointmentDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('doctorId') || '';
    const doctorName = urlParams.get('doctorName') || 'Dokter';
    const specialty = urlParams.get('specialty') || 'Umum';
    const date = urlParams.get('date') || '';
    const time = urlParams.get('time') || '';
    if (!doctorId || !date || !time) {
        console.error('Missing required parameters');
        alert('Data janji temu tidak lengkap. Kembali ke halaman booking.');
        window.history.back();
        return;
    }
    
    document.getElementById('doctorName').textContent = doctorName;
    document.getElementById('doctorSpecialty').textContent = specialty;
    
    const formattedDate = formatDate(date);
    document.getElementById('appointmentDate').textContent = formattedDate;
    
    const formattedTime = formatTime(time);
    document.getElementById('appointmentTime').textContent = formattedTime;
    
    const consultationFee = (Math.floor(Math.random() * 5) + 1) * 50000;
    document.getElementById('totalAmount').textContent = `Rp ${consultationFee.toLocaleString('id-ID')}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'Tanggal tidak tersedia';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    return date.toLocaleDateString('id-ID', options);
}

function formatTime(timeStr) {
    if (!timeStr) return 'Waktu tidak tersedia';
    
    if (timeStr.length <= 5) {
        const dummyDate = new Date();
        const [hours, minutes] = timeStr.split(':');
        dummyDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
        
        return dummyDate.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }
    
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    
    return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

function processPayment() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'flex';
    
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    const urlParams = new URLSearchParams(window.location.search);
    const appointmentData = {
        doctorId: urlParams.get('doctorId'),
        doctorName: urlParams.get('doctorName'),
        specialty: urlParams.get('specialty'),
        date: urlParams.get('date'),
        time: urlParams.get('time'),
        notes: urlParams.get('notes') || '',
        paymentMethod: paymentMethod,
        amount: document.getElementById('totalAmount').textContent,
        status: 'confirmed'
    };
    setTimeout(() => {
        loadingIndicator.style.display = 'none';
        
        saveAppointmentToDatabase(appointmentData)
            .then(response => {
                document.getElementById('successPopup').style.display = 'flex';
            })
            .catch(error => {
                console.error('Error saving appointment:', error);
                document.getElementById('errorPopup').style.display = 'flex';
            });
    }, 2000);
}

async function saveAppointmentToDatabase(appointmentData) {
    try {
        const userData = await AuthHandler.getUserData();
        if (!userData || !userData.id) {
            throw new Error('User data not available');
        }
        
        const appointmentPayload = {
            userId: userData.id,
            doctorId: appointmentData.doctorId,
            patientName: userData.name,
            patientEmail: userData.email,
            patientPhone: userData.phone || '0812345678',
            appointmentDate: appointmentData.date,
            appointmentTime: appointmentData.time,
            notes: appointmentData.notes,
            status: 'confirmed'
        };
        
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentPayload),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in saveAppointmentToDatabase:', error);
        throw error;
    }
} 