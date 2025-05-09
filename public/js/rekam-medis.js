document.addEventListener('DOMContentLoaded', function() {
    console.log('Rekam Medis page loaded');
    
    if (!AuthHandler.isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        setTimeout(() => {
            window.location.href = '/auth.html';
        }, 100);
        return;
    }
    
    setupProfileDropdown();
    setupFilterChange();
    loadMedicalRecords();
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

function setupFilterChange() {
    const filterDropdown = document.getElementById('filter');
    
    if (filterDropdown) {
        filterDropdown.addEventListener('change', function() {
            const value = this.value;
            loadMedicalRecords(value);
        });
    }
}

function loadMedicalRecords(filter = 'all') {
    const recordsList = document.getElementById('records-list');
    
    if (!recordsList) return;
    
    
    recordsList.innerHTML = `
        <div class="empty-state">
            <i class="far fa-clipboard"></i>
            <p>Belum ada rekam medis yang tersedia</p>
        </div>
    `;
} 