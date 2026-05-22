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

// Load pengumuman
async function loadPengumuman() {
    try {
        const response = await fetch('/api/pengumuman');
        const pengumuman = await response.json();
        
        const grid = document.getElementById('pengumumanGrid');
        
        if (pengumuman.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h3>Belum Ada Pengumuman</h3>
                    <p>Belum ada pengumuman dari guru. Silakan cek kembali nanti.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = pengumuman.map(p => {
            const date = new Date(p.tanggal);
            const formattedDate = date.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const priorityClass = p.prioritas === 'penting' ? 'priority-high' : 
                                 p.prioritas === 'sedang' ? 'priority-medium' : 'priority-low';
            
            const priorityIcon = p.prioritas === 'penting' ? '🔴' : 
                                p.prioritas === 'sedang' ? '🟡' : '🟢';
            
            return `
                <div class="pengumuman-card ${priorityClass}" data-id="${p.id}">
                    <div class="pengumuman-header-card">
                        <div class="pengumuman-tag ${priorityClass}">
                            ${priorityIcon} ${p.prioritas?.toUpperCase() || 'UMUM'}
                        </div>
                        <div class="pengumuman-date">📅 ${formattedDate}</div>
                    </div>
                    <h3 class="pengumuman-title">${p.judul}</h3>
                    <div class="pengumuman-content">${p.isi}</div>
                    ${p.lampiran ? `
                        <div class="pengumuman-lampiran">
                            <a href="${p.lampiran}" target="_blank" class="lampiran-link">
                                📎 Lampiran: ${p.lampiran_nama || 'Download File'}
                            </a>
                        </div>
                    ` : ''}
                    <div class="pengumuman-footer">
                        <span class="pengumuman-author">👨‍🏫 ${p.author || 'Guru'}</span>
                        <button class="btn-detail" onclick="lihatDetail(${p.id})">Baca Selengkapnya →</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading pengumuman:', error);
        document.getElementById('pengumumanGrid').innerHTML = `
            <div class="error-message">
                ⚠️ Gagal memuat pengumuman. Silakan coba lagi.
            </div>
        `;
    }
}

// Lihat detail pengumuman (modal)
async function lihatDetail(id) {
    try {
        const response = await fetch('/api/pengumuman');
        const pengumuman = await response.json();
        const p = pengumuman.find(p => p.id === id);
        
        if (!p) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        const date = new Date(p.tanggal);
        const formattedDate = date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        modal.innerHTML = `
            <div class="modal-content modal-detail">
                <div class="modal-header">
                    <h3>📢 ${p.judul}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detail-meta">
                        <span>👨‍🏫 ${p.author || 'Guru'}</span>
                        <span>📅 ${formattedDate}</span>
                        <span class="priority-tag ${p.prioritas}">${p.prioritas?.toUpperCase() || 'UMUM'}</span>
                    </div>
                    <div class="detail-content">
                        ${p.isi}
                    </div>
                    ${p.lampiran ? `
                        <div class="detail-lampiran">
                            <h4>📎 Lampiran</h4>
                            <a href="${p.lampiran}" target="_blank" class="btn-download">
                                ⬇️ Download ${p.lampiran_nama || 'File'}
                            </a>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Tutup</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
        alert('Gagal memuat detail pengumuman');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    loadPengumuman();
});