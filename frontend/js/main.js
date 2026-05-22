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

// Load tugas dengan debug dan error handling
async function loadTugas() {
    const tugasGrid = document.getElementById('tugasGrid');
    const totalTugasSpan = document.getElementById('totalTugas');
    
    if (!tugasGrid) return;
    
    // Tampilkan loading state
    tugasGrid.innerHTML = '<div class="loading-spinner">📚 Memuat daftar tugas...</div>';
    
    try {
        console.log('🔄 Fetching tugas from API...');
        const response = await fetch('/api/tugas');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const tugas = await response.json();
        console.log(`✅ Tugas loaded: ${tugas.length} items`, tugas);
        
        if (totalTugasSpan) totalTugasSpan.textContent = tugas.length;
        
        if (tugas.length === 0) {
            tugasGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h3>Belum Ada Tugas</h3>
                    <p>Belum ada tugas yang diupload oleh guru.<br>Silakan cek kembali nanti.</p>
                    <button class="btn-primary" onclick="window.location.href='/dashboard.html'" style="margin-top: 1rem;">
                        Hubungi Guru →
                    </button>
                </div>
            `;
            return;
        }
        
        tugasGrid.innerHTML = tugas.map(t => `
            <div class="tugas-card" onclick="openFormModal(${t.id})">
                <h3>${escapeHtml(t.judul)}</h3>
                <div class="mapel">📖 ${escapeHtml(t.mapel)}</div>
                <div class="guru">👨‍🏫 ${escapeHtml(t.namaGuru || 'Guru')}</div>
                <p class="deskripsi">${escapeHtml(t.deskripsi ? t.deskripsi.substring(0, 100) : 'Tidak ada deskripsi')}...</p>
                <div class="meta">
                    <span>⏱️ ${t.waktu || 0} menit</span>
                    <span>📝 ${t.jumlahSoal || 0} soal</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error loading tugas:', error);
        tugasGrid.innerHTML = `
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <h3>Gagal Memuat Tugas</h3>
                <p>Terjadi kesalahan saat menghubungi server.<br>Error: ${error.message}</p>
                <button class="btn-primary" onclick="location.reload()" style="margin-top: 1rem;">
                    🔄 Coba Lagi
                </button>
            </div>
        `;
    }
}

// Load latest pengumuman untuk ditampilkan di beranda
async function loadLatestPengumuman() {
    const container = document.getElementById('latestPengumuman');
    if (!container) return;
    
    try {
        console.log('🔄 Fetching announcements...');
        const response = await fetch('/api/pengumuman');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const pengumuman = await response.json();
        const latest = pengumuman.slice(0, 3);
        console.log(`✅ Announcements loaded: ${pengumuman.length} items`);
        
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
                            <div class="latest-excerpt">${escapeHtml(p.isi ? p.isi.substring(0, 100) : '')}${p.isi && p.isi.length > 100 ? '...' : ''}</div>
                            <div class="latest-date">📅 ${new Date(p.tanggal).toLocaleDateString('id-ID')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('❌ Error loading announcements:', error);
        container.style.display = 'none';
    }
}

// Load data siswa aktif
async function loadActiveStudents() {
    const totalSiswaSpan = document.getElementById('totalSiswa');
    if (!totalSiswaSpan) return;
    
    try {
        const response = await fetch('/api/jawaban/all');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jawaban = await response.json();
        const uniqueStudents = new Set(jawaban.map(j => j.nis));
        totalSiswaSpan.textContent = uniqueStudents.size;
        console.log(`✅ Active students: ${uniqueStudents.size}`);
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
        totalSiswaSpan.textContent = '0';
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
    if (modal) {
        modal.style.display = 'flex';
        console.log(`📝 Opening form for tugas ID: ${tugasId}`);
    }
}

function closeModal() {
    const modal = document.getElementById('formModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('📝 Modal closed');
    }
    const form = document.getElementById('studentForm');
    if (form) form.reset();
}

// Handle student form submission
document.getElementById('studentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const studentName = document.getElementById('studentName')?.value;
    const studentId = document.getElementById('studentId')?.value;
    const studentClass = document.getElementById('studentClass')?.value;
    
    if (!studentName || !studentId || !studentClass) {
        alert('❌ Semua field harus diisi!');
        return;
    }
    
    const studentData = {
        nama: studentName,
        nis: studentId,
        kelas: studentClass,
        tugasId: selectedTugasId
    };
    
    console.log('📝 Student data saved:', studentData);
    localStorage.setItem('studentData', JSON.stringify(studentData));
    
    // Redirect ke halaman ujian
    window.location.href = `/ujian.html?id=${selectedTugasId}`;
});

function scrollToTugas() {
    const tugasSection = document.getElementById('tugasSection');
    if (tugasSection) {
        tugasSection.scrollIntoView({ behavior: 'smooth' });
        console.log('📜 Scrolled to tugas section');
    }
}

// Cek koneksi API saat halaman dimuat
async function checkAPI() {
    try {
        console.log('🔍 Checking API connection...');
        const response = await fetch('/api/tugas');
        if (response.ok) {
            console.log('✅ API connection OK');
        } else {
            console.warn('⚠️ API responded with status:', response.status);
        }
    } catch (error) {
        console.error('❌ API connection failed:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Ruang Ujian App Started');
    createParticles();
    checkAPI();
    loadTugas();
    loadActiveStudents();
    loadLatestPengumuman();
});

// Close modal when clicking outside
window.onclick = (event) => {
    const modal = document.getElementById('formModal');
    if (event.target === modal) {
        closeModal();
    }
};