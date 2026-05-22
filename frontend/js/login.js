// Generate particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.width = Math.random() * 5 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.animationDuration = Math.random() * 3 + 4 + 's';
        particlesContainer.appendChild(particle);
    }
}

// Handle login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Default credentials (bisa diubah sesuai kebutuhan)
    const validUsername = 'admin';
    const validPassword = 'admin123';
    
    if (username === validUsername && password === validPassword) {
        // Simpan status login
        localStorage.setItem('guruLoggedIn', 'true');
        localStorage.setItem('guruUsername', username);
        
        // Animasi sukses
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerHTML = '✅ Login Berhasil...';
        btn.style.background = '#4caf50';
        
        setTimeout(() => {
            window.location.href = '/dashboard-admin.html';
        }, 1000);
    } else {
        // Animasi error
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerHTML = '❌ Login Gagal!';
        btn.style.background = '#f44336';
        
        setTimeout(() => {
            btn.innerHTML = 'Login →';
            btn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }, 2000);
        
        alert('Username atau password salah!\n\nDemo: admin / admin123');
    }
});

// Cek apakah sudah login
if (localStorage.getItem('guruLoggedIn') === 'true') {
    window.location.href = '/dashboard-admin.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
});