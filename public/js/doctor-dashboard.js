async function getUserId() {
    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error('Failed to get user data');
            window.location.href = '/';
            return null;
        }
        
        const userData = await response.json();
        return userData.id;
    } catch (error) {
        console.error('Error fetching user data:', error);
        window.location.href = '/';
        return null;
    }
}

function safelyUpdateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    } else {
        console.warn(`Element with id "${id}" not found`);
    }
}

function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function formatTime(timeString) {
    return timeString;
}

async function updateDoctorDashboard() {
    try {
        const doctorId = await getUserId();
        if (!doctorId) return;
        
        const response = await fetch(`/api/dashboard/doctor-statistics/${doctorId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/';
                return;
            }
            throw new Error('Failed to fetch doctor statistics');
        }
        
        const data = await response.json();
        
        const appointments = data.appointments !== undefined ? data.appointments : 0;
        const patients = data.patients !== undefined ? data.patients : 0;
        const workHours = data.workHours !== undefined ? data.workHours : 0;
        
        safelyUpdateElement('appointmentsCount', appointments);
        safelyUpdateElement('patientsCount', patients);
        safelyUpdateElement('workHoursCount', workHours);
    } catch (error) {
        safelyUpdateElement('appointmentsCount', '0');
        safelyUpdateElement('patientsCount', '0');
        safelyUpdateElement('workHoursCount', '0');
    }
}

async function loadTodayAppointments() {
    try {
        const doctorId = await getUserId();
        if (!doctorId) return;
        
        const response = await fetch(`/api/appointments/doctor/${doctorId}/today`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/';
                return;
            }
            throw new Error('Failed to fetch today\'s appointments');
        }
        
        const appointments = await response.json();
        
        const notificationBox = document.getElementById("notifikasiJadwal");
        const notificationContent = document.getElementById("isiNotifikasi");
        
        if (notificationBox && notificationContent) {
            if (appointments.length > 0) {
                const appointmentMsg = appointments
                    .map(app => `pukul <strong>${app.appointment_time || app.appointmentTime}</strong> dengan pasien <strong>${app.patientName}</strong>`)
                    .join(", dan ");
                
                notificationBox.style.display = "block";
                notificationContent.innerHTML = `Anda memiliki jadwal konsultasi hari ini ${appointmentMsg}.`;
            } else {
                notificationBox.style.display = "block";
                notificationBox.classList.remove("alert-warning");
                notificationBox.classList.add("alert-info");
                notificationContent.innerHTML = "Anda tidak memiliki jadwal konsultasi hari ini.";
            }
        }
        
        updateTodayAppointmentsUI(appointments);
    } catch (error) {
        console.error('Error loading today\'s appointments:', error);
        
        const container = document.getElementById('todayAppointmentsContainer');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Gagal memuat jadwal hari ini. Silakan refresh halaman.
                </div>
            `;
        }
    }
}

function updateTodayAppointmentsUI(appointments) {
    const container = document.getElementById('todayAppointmentsContainer');
    if (!container) return;
    
    if (appointments.length === 0) {
        container.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-calendar-times text-muted mb-3" style="font-size: 3rem;"></i>
                <p class="text-muted">Tidak ada jadwal konsultasi hari ini</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="thead-light">
                    <tr>
                        <th>Waktu</th>
                        <th>Nama Pasien</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Catatan</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    appointments.forEach(appointment => {
        const time = appointment.appointment_time || appointment.appointmentTime;
        const status = appointment.status || 'pending';
        const statusClass = getStatusClass(status);
        
        html += `
            <tr>
                <td>${time}</td>
                <td>${appointment.patientName}</td>
                <td>${appointment.patientEmail}</td>
                <td><span class="badge ${statusClass}">${formatStatus(status)}</span></td>
                <td>${appointment.notes || '-'}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'completed':
            return 'badge-success';
        case 'cancelled':
            return 'badge-danger';
        case 'rescheduled':
            return 'badge-warning';
        case 'pending':
        default:
            return 'badge-info';
    }
}

function formatStatus(status) {
    switch(status.toLowerCase()) {
        case 'completed':
            return 'Selesai';
        case 'cancelled':
            return 'Dibatalkan';
        case 'rescheduled':
            return 'Dijadwalkan Ulang';
        case 'pending':
        default:
            return 'Menunggu';
    }
}

async function sendNotificationToPatient(patientId, message) {
    try {
        const response = await fetch('/api/notifications/send', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                patientId,
                message,
                type: 'doctor_message'
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send notification');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let doctorId = null;

    fetch('/api/auth/me', { credentials: 'include' })
        .then(res => res.json())
        .then(user => {
            if (user.role !== 'doctor') {
                window.location.href = '/';
                return;
            }
            doctorId = user.id;
            loadDashboardData();
            loadTodayAppointments();
        })
        .catch(() => window.location.href = '/');

    function loadDashboardData() {
        fetch(`/api/doctors/${doctorId}/appointments/count`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                document.getElementById('appointmentsCount').textContent = data.count || 0;
            })
            .catch(() => {
                document.getElementById('appointmentsCount').textContent = 'Error';
            });

        fetch(`/api/doctors/${doctorId}/patients/count`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                document.getElementById('patientsCount').textContent = data.count || 0;
            })
            .catch(() => {
                document.getElementById('patientsCount').textContent = 'Error';
            });

        fetch(`/api/doctors/${doctorId}/work-hours`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                document.getElementById('workHoursCount').textContent = `${data.hours || 0} jam`;
            })
            .catch(() => {
                document.getElementById('workHoursCount').textContent = 'Error';
            });
    }

    function loadTodayAppointments() {
        const container = document.getElementById('todayAppointmentsContainer');
        container.innerHTML = '<p class="text-center text-muted">Memuat jadwal konsultasi hari ini...</p>';

        fetch(`/api/doctors/${doctorId}/appointments/today`, { credentials: 'include' })
            .then(res => res.json())
            .then(appointments => {
                if (!Array.isArray(appointments) || appointments.length === 0) {
                    container.innerHTML = '<p class="text-center text-muted">Tidak ada jadwal konsultasi hari ini</p>';
                    return;
                }

                container.innerHTML = `
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Waktu</th>
                                    <th>Pasien</th>
                                    <th>Keluhan</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${appointments.map(apt => `
                                    <tr>
                                        <td>${formatTime(apt.time)}</td>
                                        <td>${apt.patient_name}</td>
                                        <td>${apt.complaint || '-'}</td>
                                        <td>
                                            <span class="badge ${getStatusBadgeClass(apt.status)}">
                                                ${getStatusText(apt.status)}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            })
            .catch(() => {
                container.innerHTML = '<p class="text-center text-danger">Gagal memuat jadwal konsultasi</p>';
            });
    }

    document.getElementById('sendNotificationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const patientId = document.getElementById('patientSelect').value;
        const message = document.getElementById('notificationMessage').value;

        if (!patientId || !message) {
            alert('Mohon lengkapi semua field');
            return;
        }

        fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                patient_id: patientId,
                doctor_id: doctorId,
                message: message
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Pemberitahuan berhasil dikirim');
                document.getElementById('notificationMessage').value = '';
            } else {
                alert('Gagal mengirim pemberitahuan');
            }
        })
        .catch(() => {
            alert('Gagal mengirim pemberitahuan');
        });
    });

    function formatTime(timeString) {
        if (!timeString) return '-';
        return timeString.substring(0, 5);
    }

    function getStatusBadgeClass(status) {
        switch (status) {
            case 'completed': return 'badge-success';
            case 'cancelled': return 'badge-danger';
            case 'pending': return 'badge-warning';
            default: return 'badge-secondary';
        }
    }

    function getStatusText(status) {
        switch (status) {
            case 'completed': return 'Selesai';
            case 'cancelled': return 'Dibatalkan';
            case 'pending': return 'Menunggu';
            default: return 'Tidak Diketahui';
        }
    }

    setInterval(updateDoctorDashboard, 5 * 60 * 1000);
}); 