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
            loadSchedules();
        })
        .catch(() => window.location.href = '/');

    function loadSchedules() {
        const tbody = document.querySelector('#scheduleTable tbody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Memuat jadwal...</td></tr>';

        fetch(`/api/doctors/${doctorId}/schedules`, { credentials: 'include' })
            .then(res => res.json())
            .then(schedules => {
                if (!Array.isArray(schedules) || schedules.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Tidak ada jadwal</td></tr>';
                    return;
                }

                tbody.innerHTML = schedules.map((schedule, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${formatDate(schedule.date)}</td>
                        <td>${formatTime(schedule.start_time)}</td>
                        <td>${formatTime(schedule.end_time)}</td>
                        <td>
                            <span class="badge ${getStatusBadgeClass(schedule.status)}">
                                ${getStatusText(schedule.status)}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-info mr-1" onclick="editSchedule(${JSON.stringify(schedule).replace(/"/g, '&quot;')})">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteSchedule(${schedule.id})">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            })
            .catch(() => {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Gagal memuat jadwal</td></tr>';
            });
    }

    document.getElementById('scheduleForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const scheduleId = document.getElementById('scheduleId').value;
        const date = document.getElementById('scheduleDate').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const status = document.getElementById('status').value;

        if (!date || !startTime || !endTime) {
            alert('Mohon lengkapi semua field');
            return;
        }

        const scheduleData = {
            date,
            start_time: startTime,
            end_time: endTime,
            status
        };

        const method = scheduleId ? 'PUT' : 'POST';
        const url = scheduleId 
            ? `/api/doctors/${doctorId}/schedules/${scheduleId}`
            : `/api/doctors/${doctorId}/schedules`;

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(scheduleData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                $('#addScheduleModal').modal('hide');
                loadSchedules();
                alert(scheduleId ? 'Jadwal berhasil diperbarui' : 'Jadwal berhasil ditambahkan');
            } else {
                alert(data.message || 'Gagal menyimpan jadwal');
            }
        })
        .catch(() => {
            alert('Gagal menyimpan jadwal');
        });
    });

    window.editSchedule = function(schedule) {
        document.getElementById('scheduleId').value = schedule.id;
        document.getElementById('scheduleDate').value = schedule.date;
        document.getElementById('startTime').value = schedule.start_time;
        document.getElementById('endTime').value = schedule.end_time;
        document.getElementById('status').value = schedule.status;
        
        $('#addScheduleModal').modal('show');
    };

    window.deleteSchedule = function(scheduleId) {
        if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
            return;
        }

        fetch(`/api/doctors/${doctorId}/schedules/${scheduleId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadSchedules();
                alert('Jadwal berhasil dihapus');
            } else {
                alert(data.message || 'Gagal menghapus jadwal');
            }
        })
        .catch(() => {
            alert('Gagal menghapus jadwal');
        });
    };

    $('#addScheduleModal').on('hidden.bs.modal', function() {
        document.getElementById('scheduleForm').reset();
        document.getElementById('scheduleId').value = '';
    });

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    function formatTime(timeString) {
        if (!timeString) return '-';
        return timeString.substring(0, 5);
    }

    function getStatusBadgeClass(status) {
        switch (status) {
            case 'active': return 'badge-success';
            case 'inactive': return 'badge-danger';
            default: return 'badge-secondary';
        }
    }

    function getStatusText(status) {
        switch (status) {
            case 'active': return 'Aktif';
            case 'inactive': return 'Tidak Aktif';
            default: return 'Tidak Diketahui';
        }
    }
}); 