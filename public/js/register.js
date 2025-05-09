document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = "pasien";
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.style.display = 'none';

    if (!name || !email || !password || !confirmPassword) {
        errorMessage.textContent = 'Silakan lengkapi semua bidang formulir';
        errorMessage.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.textContent = 'Kata sandi tidak cocok';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password,
                role
            })
        });

        const data = await response.json();

        if (response.ok) {
            document.body.classList.remove('transition-in');
            document.body.classList.add('transitioning', 'transition-out');
            
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 300);
        } else {
            errorMessage.textContent = data.msg || 'Pendaftaran gagal. Silakan coba lagi.';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorMessage.textContent = 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.';
        errorMessage.style.display = 'block';
    }
}); 