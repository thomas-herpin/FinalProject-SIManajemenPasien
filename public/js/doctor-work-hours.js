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
            loadWorkHours();
        })
        .catch(() => window.location.href = '/');

    function loadWorkHours() {
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Memuat data...</td></tr>';

        fetch(`/api/doctors/${doctorId}/work-hours`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (!Array.isArray(data) || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data jam kerja</td></tr>';
                    return;
                }

                tbody.innerHTML = data.map((record, index) => `
                    <tr>
                        <th scope="row">${index + 1}</th>
                        <td>${formatDate(record.date)}</td>
                        <td>${getDayName(record.date)}</td>
                        <td>${record.shift}</td>
                        <td>${formatTime(record.start_time)}</td>
                        <td>${formatTime(record.end_time)}</td>
                        <td>${calculateDuration(record.start_time, record.end_time)}</td>
                        <td>
                            <span class="badge ${getStatusBadgeClass(record.status)}">
                                ${getStatusText(record.status)}
                            </span>
                        </td>
                        <td>
                            <i class="fa-solid fa-circle-info bg-primary p-2 text-white rounded" 
                               data-toggle="tooltip" 
                               title="Detail"
                               onclick="showWorkHoursDetail(${JSON.stringify(record).replace(/"/g, '&quot;')})">
                            </i>
                        </td>
                    </tr>
                `).join('');

                $('[data-toggle="tooltip"]').tooltip();
            })
            .catch(() => {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Gagal memuat data jam kerja</td></tr>';
            });
    }

    document.getElementById('filterStatus').addEventListener('change', function() {
        const status = this.value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const statusCell = row.querySelector('td:nth-child(8)').textContent.toLowerCase();
            row.style.display = status === '' || statusCell.includes(status) ? '' : 'none';
        });
    });

    window.exportToPDF = function() {
        alert('Otw');
    };

    window.exportToExcel = function() {
        alert('Otw');
    };

    window.showWorkHoursDetail = function(record) {
        const modal = `
            <div class="modal fade" id="workHoursDetailModal" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detail Jam Kerja</h5>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <table class="table">
                                <tr>
                                    <th>Tanggal</th>
                                    <td>${formatDate(record.date)}</td>
                                </tr>
                                <tr>
                                    <th>Hari</th>
                                    <td>${getDayName(record.date)}</td>
                                </tr>
                                <tr>
                                    <th>Shift</th>
                                    <td>${record.shift}</td>
                                </tr>
                                <tr>
                                    <th>Jam Mulai</th>
                                    <td>${formatTime(record.start_time)}</td>
                                </tr>
                                <tr>
                                    <th>Jam Selesai</th>
                                    <td>${formatTime(record.end_time)}</td>
                                </tr>
                                <tr>
                                    <th>Durasi</th>
                                    <td>${calculateDuration(record.start_time, record.end_time)}</td>
                                </tr>
                                <tr>
                                    <th>Status</th>
                                    <td>
                                        <span class="badge ${getStatusBadgeClass(record.status)}">
                                            ${getStatusText(record.status)}
                                        </span>
                                    </td>
                                </tr>
                                ${record.notes ? `
                                    <tr>
                                        <th>Catatan</th>
                                        <td>${record.notes}</td>
                                    </tr>
                                ` : ''}
                            </table>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Tutup</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('workHoursDetailModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modal);
        $('#workHoursDetailModal').modal('show');
    };

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    function getDayName(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { weekday: 'long' });
    }

    function formatTime(timeString) {
        if (!timeString) return '-';
        return timeString.substring(0, 5);
    }

    function calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return '-';
        
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const diff = (end - start) / (1000 * 60 * 60);
        
        return `${diff} jam`;
    }

    function getStatusBadgeClass(status) {
        switch (status) {
            case 'present': return 'badge-success';
            case 'absent': return 'badge-danger';
            case 'late': return 'badge-warning';
            default: return 'badge-secondary';
        }
    }

    function getStatusText(status) {
        switch (status) {
            case 'present': return 'Hadir';
            case 'absent': return 'Tidak Hadir';
            case 'late': return 'Terlambat';
            default: return 'Tidak Diketahui';
        }
    }
}); 