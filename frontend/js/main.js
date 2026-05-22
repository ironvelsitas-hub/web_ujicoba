// Generate particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
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

// Load tugas
async function loadTugas() {
    try {
        const response = await fetch('/api/tugas');
        const tugas = await response.json();
        
        const tugasGrid = document.getElementById('tugasGrid');
        const totalTugasSpan = document.getElementById('totalTugas');
        
        if (totalTugasSpan) totalTugasSpan.textContent = tugas.length;
        
        if (tugas.length === 0) {
            tugasGrid.innerHTML = '<div class="loading-spinner">Belum ada tugas. Silakan cek lagi nanti 📚</div>';
            return;
        }
        
        tugasGrid.innerHTML = tugas.map(t => `
            <div class="tugas-card" onclick="openFormModal(${t.id})">
                <h3>${escapeHtml(t.judul)}</h3>
                <div class="mapel">📖 ${escapeHtml(t.mapel)}</div>
                <p class="deskripsi">${escapeHtml(t.deskripsi.substring(0, 100))}...</p>
                <div class="meta">
                    <span>⏱️ ${t.waktu} menit</span>
                    <span>📝 ${t.jumlahSoal} soal</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading tugas:', error);
    }
}

// Load latest pengumuman untuk ditampilkan di beranda
async function loadLatestPengumuman() {
    try {
        const response = await fetch('/api/pengumuman');
        const pengumuman = await response.json();
        const latest = pengumuman.slice(0, 3); // Ambil 3 pengumuman terbaru
        
        const container = document.getElementById('latestPengumuman');
        if (!container) return;
        
        if (latest.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        container.innerHTML = `
            <div class="latest-pengumuman-card">
                <div class="latest-header">
                    <span class="latest-icon">📢</span>
                    <h3>Pengumuman Terbaru</h3>
                    <a href="/pengumuman.html" class="lihat-semua">Lihat Semua →</a>
                </div>
                <div class="latest-list">
                    ${latest.map(p => `
                        <div class="latest-item ${p.prioritas || 'umum'}" onclick="window.location.href='/pengumuman.html'">
                            <div class="latest-title">${escapeHtml(p.judul)}</div>
                            <div class="latest-excerpt">${escapeHtml(p.isi.substring(0, 100))}${p.isi.length > 100 ? '...' : ''}</div>
                            <div class="latest-date">📅 ${new Date(p.tanggal).toLocaleDateString('id-ID')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading latest pengumuman:', error);
    }
}

// Load data siswa aktif
async function loadActiveStudents() {
    try {
        const response = await fetch('/api/jawaban/all');
        const jawaban = await response.json();
        const totalSiswaSpan = document.getElementById('totalSiswa');
        if (totalSiswaSpan) {
            const uniqueStudents = new Set(jawaban.map(j => j.nis));
            totalSiswaSpan.textContent = uniqueStudents.size;
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let selectedTugasId = null;

function openFormModal(tugasId) {
    selectedTugasId = tugasId;
    const modal = document.getElementById('formModal');
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('formModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('studentForm');
    if (form) form.reset();
}

document.getElementById('studentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const studentData = {
        nama: document.getElementById('studentName').value,
        nis: document.getElementById('studentId').value,
        kelas: document.getElementById('studentClass').value,
        tugasId: selectedTugasId
    };
    
    localStorage.setItem('studentData', JSON.stringify(studentData));
    window.location.href = `/ujian.html?id=${selectedTugasId}`;
});

function scrollToTugas() {
    const tugasSection = document.getElementById('tugasSection');
    if (tugasSection) {
        tugasSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    loadTugas();
    loadActiveStudents();
    loadLatestPengumuman(); // Tambahkan fungsi pengumuman terbaru
});

// Close modal when clicking outside
window.onclick = (event) => {
    const modal = document.getElementById('formModal');
    if (event.target === modal) {
        closeModal();
    }
};