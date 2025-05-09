document.addEventListener('DOMContentLoaded', () => {
    let doctorId = null;
    let patients = [];

    fetch('/api/auth/me', { credentials: 'include' })
        .then(res => res.json())
        .then(user => {
            if (user.role !== 'doctor') {
                window.location.href = '/';
                return;
            }
            doctorId = user.id;
            loadPatients();
        })
        .catch(() => window.location.href = '/');

    function loadPatients() {
        const tbody = document.querySelector('#patientTable tbody');
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Memuat data pasien...</td></tr>';
        
        fetch(`/api/doctors/${doctorId}/patients`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                patients = data;
                if (!Array.isArray(patients) || patients.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Belum ada pasien</td></tr>';
                    return;
                }
                renderPatients(patients);
            })
            .catch(() => {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Gagal memuat data pasien</td></tr>';
            });
    }

    function renderPatients(patientsToRender) {
        const tbody = document.querySelector('#patientTable tbody');
        tbody.innerHTML = '';
        patientsToRender.forEach((patient, i) => {
            tbody.innerHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${patient.name}</td>
                    <td>${patient.age}</td>
                    <td>${patient.gender}</td>
                    <td>${formatDate(patient.last_consultation)}</td>
                    <td>${patient.last_complaint || '-'}</td>
                    <td><span class="badge ${patient.status === 'active' ? 'badge-success' : 'badge-warning'}">${patient.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-info view-details" data-id="${patient.id}">
                            <i class="fa fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', () => showPatientDetails(btn.dataset.id));
        });
    }

    function showPatientDetails(patientId) {
        const patient = patients.find(p => p.id == patientId);
        if (!patient) return;

        document.getElementById('detailName').textContent = patient.name;
        document.getElementById('detailAge').textContent = patient.age;
        document.getElementById('detailGender').textContent = patient.gender;
        document.getElementById('detailAddress').textContent = patient.address || '-';

        const historyDiv = document.getElementById('consultationHistory');
        historyDiv.innerHTML = '<p class="text-muted">Memuat riwayat...</p>';

        fetch(`/api/patients/${patientId}/consultations`, { credentials: 'include' })
            .then(res => res.json())
            .then(consultations => {
                if (!Array.isArray(consultations) || consultations.length === 0) {
                    historyDiv.innerHTML = '<p class="text-muted">Belum ada riwayat konsultasi</p>';
                    return;
                }

                historyDiv.innerHTML = consultations.map(consult => `
                    <div class="border-bottom mb-2 pb-2">
                        <div class="d-flex justify-content-between">
                            <strong>${formatDate(consult.date)}</strong>
                            <span class="badge ${consult.status === 'completed' ? 'badge-success' : 'badge-warning'}">
                                ${consult.status === 'completed' ? 'Selesai' : 'Menunggu'}
                            </span>
                        </div>
                        <div class="small text-muted">Keluhan: ${consult.complaint}</div>
                        ${consult.notes ? `<div class="small">Catatan: ${consult.notes}</div>` : ''}
                    </div>
                `).join('');
            })
            .catch(() => {
                historyDiv.innerHTML = '<p class="text-danger">Gagal memuat riwayat konsultasi</p>';
            });

        $('#patientDetailModal').modal('show');
    }

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        
        const filteredPatients = patients.filter(patient => {
            const matchesSearch = patient.name.toLowerCase().includes(searchTerm) ||
                                patient.last_complaint?.toLowerCase().includes(searchTerm);
            const matchesStatus = !statusFilter || patient.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        renderPatients(filteredPatients);
    });

    document.getElementById('statusFilter').addEventListener('change', (e) => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = e.target.value;
        
        const filteredPatients = patients.filter(patient => {
            const matchesSearch = patient.name.toLowerCase().includes(searchTerm) ||
                                patient.last_complaint?.toLowerCase().includes(searchTerm);
            const matchesStatus = !statusFilter || patient.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        renderPatients(filteredPatients);
    });

    document.getElementById('addMedicalRecordBtn').addEventListener('click', () => {
        const patientId = document.querySelector('.view-details.active')?.dataset.id;
        if (patientId) {
            window.location.href = `/rekam-medis?patient_id=${patientId}`;
        }
    });

    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }
}); 