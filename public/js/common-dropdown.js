document.addEventListener('DOMContentLoaded', function() {
    setupProfileDropdown();
});

function setupProfileDropdown() {
    const profileBtns = document.querySelectorAll('.profile-btn');
    const dropdownMenus = document.querySelectorAll('.dropdown-menu');
    
    if (profileBtns.length > 0 && dropdownMenus.length > 0) {
        profileBtns.forEach((btn, index) => {
            if (index < dropdownMenus.length) {
                const menu = dropdownMenus[index];
                
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const isVisible = menu.style.display === 'flex' || menu.style.display === 'block';
                    menu.style.display = isVisible ? 'none' : 'flex';
                });
            }
        });
        
        document.addEventListener('click', function() {
            dropdownMenus.forEach(menu => {
                if (menu.style.display === 'flex' || menu.style.display === 'block') {
                    menu.style.display = 'none';
                }
            });
        });
        
        dropdownMenus.forEach(menu => {
            menu.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
    }
} 