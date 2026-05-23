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

// Display tugas function
function displayTugas(tugas) {
    const tugasGrid = document.getElementById('tugasGrid');
    const totalTugasSpan = document.getElementById('totalTugas');
    
    if (!tugasGrid) return;
    
    if (totalTugasSpan) totalTugasSpan.textContent = tugas.length;
    
    if (tugas.length === 0) {
        tugasGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>Belum Ada Tugas</h3>
                <p>Belum ada tugas yang tersedia saat ini.<br>Silakan cek kembali nanti.</p>
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
}

// Load tugas dengan filter jadwal (hanya tampilkan tugas yang jadwalnya aktif)
async function loadTugasWithSchedule() {
    const tugasGrid = document.getElementById('tugasGrid');
    if (!tugasGrid) return;
    
    tugasGrid.innerHTML = '<div class="loading-spinner">📚 Memuat daftar tugas...</div>';
    
    try {
        const [tugasRes, jadwalRes] = await Promise.all([
            fetch('/api/tugas'),
            fetch('/api/jadwal')
        ]);
        
        const semuaTugas = await tugasRes.json();
        const jadwal = await jadwalRes.json();
        const now = new Date();
        
        const tugasWithSchedule = semuaTugas.map(tugas => {
            const schedule = jadwal.find(j => j.tugasId === tugas.id);
            if (!schedule) return { ...tugas, isAvailable: true, schedule: null };
            
            const examStart = new Date(`${schedule.tanggal}T${schedule.jamMulai}`);
            const examEnd = new Date(`${schedule.tanggal}T${schedule.jamSelesai}`);
            const isAvailable = now >= examStart && now <= examEnd && schedule.status === 'active';
            
            return { ...tugas, isAvailable, schedule, examStart, examEnd };
        });
        
        const availableTugas = tugasWithSchedule.filter(t => t.isAvailable);
        displayTugas(availableTugas);
        
    } catch (error) {
        console.error('Error loading tugas with schedule:', error);
        loadTugas();
    }
}

// Load tugas biasa (tanpa filter jadwal) - fallback
async function loadTugas() {
    const tugasGrid = document.getElementById('tugasGrid');
    if (!tugasGrid) return;
    
    tugasGrid.innerHTML = '<div class="loading-spinner">📚 Memuat daftar tugas...</div>';
    
    try {
        const response = await fetch('/api/tugas');
        const tugas = await response.json();
        displayTugas(tugas);
    } catch (error) {
        console.error('Error loading tugas:', error);
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

// Cek jadwal ujian terdekat
async function checkUpcomingExam() {
    try {
        const response = await fetch('/api/jadwal');
        const jadwal = await response.json();
        const now = new Date();
        
        const upcoming = jadwal.filter(j => {
            const examDate = new Date(`${j.tanggal}T${j.jamMulai}`);
            return examDate > now && j.status === 'upcoming';
        }).sort((a, b) => new Date(`${a.tanggal}T${a.jamMulai}`) - new Date(`${b.tanggal}T${b.jamMulai}`));
        
        const countdownSection = document.getElementById('countdownSection');
        
        if (upcoming.length > 0 && upcoming[0]) {
            const nextExam = upcoming[0];
            const tugasRes = await fetch('/api/tugas');
            const semuaTugas = await tugasRes.json();
            const tugasItem = semuaTugas.find(t => t.id == nextExam.tugasId);
            
            const examDateTime = new Date(`${nextExam.tanggal}T${nextExam.jamMulai}`);
            const timeDiff = examDateTime - now;
            
            if (timeDiff > 0 && timeDiff <= 7 * 24 * 60 * 60 * 1000) {
                countdownSection.style.display = 'block';
                startCountdown(examDateTime, {
                    judul: tugasItem?.judul || 'Ujian',
                    jamMulai: nextExam.jamMulai
                });
            } else {
                countdownSection.style.display = 'none';
            }
        } else {
            countdownSection.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error checking jadwal:', error);
    }
}

// Start countdown timer
function startCountdown(targetDate, examData) {
    const clockElement = document.getElementById('countdownClock');
    const infoElement = document.getElementById('countdownInfo');
    if (!clockElement) return;
    
    function updateCountdown() {
        const now = new Date();
        const diff = targetDate - now;
        
        if (diff <= 0) {
            clockElement.innerHTML = "🚀 Ujian Dimulai!";
            infoElement.innerHTML = `Ujian ${examData.judul} sudah dimulai. Silakan refresh halaman.`;
            setTimeout(() => location.reload(), 5000);
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        let timeString = '';
        if (days > 0) timeString += `${days} hari `;
        timeString += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        clockElement.innerHTML = timeString;
        infoElement.innerHTML = `📢 ${examData.judul} akan dimulai pada ${targetDate.toLocaleDateString('id-ID')} pukul ${examData.jamMulai}`;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Load latest pengumuman
async function loadLatestPengumuman() {
    const container = document.getElementById('latestPengumuman');
    if (!container) return;
    
    try {
        const response = await fetch('/api/pengumuman');
        const pengumuman = await response.json();
        const latest = pengumuman.slice(0, 3);
        
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
        console.error('Error loading announcements:', error);
        container.style.display = 'none';
    }
}

// Load data siswa aktif
async function loadActiveStudents() {
    const totalSiswaSpan = document.getElementById('totalSiswa');
    if (!totalSiswaSpan) return;
    
    try {
        const response = await fetch('/api/jawaban/all');
        const jawaban = await response.json();
        const uniqueStudents = new Set(jawaban.map(j => j.nis));
        totalSiswaSpan.textContent = uniqueStudents.size;
    } catch (error) {
        console.error('Error loading students:', error);
        totalSiswaSpan.textContent = '0';
    }
}

// ==================== ZOOM ROOMS FUNCTIONS ====================

// Load zoom rooms for students (UPDATED - shows all active rooms with status)
async function loadZoomRooms() {
    try {
        console.log('🔄 Loading zoom rooms from API...');
        const response = await fetch('/api/rooms');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rooms = await response.json();
        console.log('📋 All rooms from API:', rooms);
        
        const now = new Date();
        console.log('📅 Current date/time:', now.toString());
        
        // Filter hanya room yang aktif
        const activeRooms = rooms.filter(room => {
            // Cek apakah room aktif
            if (!room.isActive) {
                console.log(`❌ Room ${room.title} - not active`);
                return false;
            }
            
            // Buat tanggal meeting dari data room
            let meetingDateTime;
            try {
                // Format: room.date = "2026-05-23", room.startTime = "16:00"
                const dateTimeString = `${room.date}T${room.startTime}:00`;
                meetingDateTime = new Date(dateTimeString);
                
                console.log(`📌 Room: ${room.title}`);
                console.log(`   - Date: ${room.date}`);
                console.log(`   - Start time: ${room.startTime}`);
                console.log(`   - Full datetime: ${dateTimeString}`);
                console.log(`   - Parsed: ${meetingDateTime.toString()}`);
                console.log(`   - Current: ${now.toString()}`);
                
                // Hitung selisih waktu dalam menit
                const diffMs = meetingDateTime - now;
                const diffMins = Math.floor(diffMs / 60000);
                console.log(`   - Selisih: ${diffMins} menit`);
                
                // Tampilkan semua room aktif (tanpa filter waktu untuk testing)
                const shouldDisplay = true;
                console.log(`   - Should display: ${shouldDisplay}`);
                
                return shouldDisplay;
                
            } catch (e) {
                console.error(`Error parsing date for room ${room.title}:`, e);
                return false;
            }
        });
        
        console.log(`✅ Active rooms found: ${activeRooms.length}`);
        
        const grid = document.getElementById('zoomRoomsGrid');
        if (!grid) {
            console.warn('zoomRoomsGrid element not found');
            return;
        }
        
        if (activeRooms.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-icon">🎥</div>
                    <h3>Tidak Ada Zoom Meeting Aktif</h3>
                    <p>Saat ini belum ada zoom meeting yang dijadwalkan.</p>
                    <button class="btn-primary" onclick="loadZoomRooms()" style="margin-top: 1rem;">
                        🔄 Refresh
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = activeRooms.map(room => {
            // Hitung status meeting
            const meetingDateTime = new Date(`${room.date}T${room.startTime}:00`);
            const now = new Date();
            const diffMs = meetingDateTime - now;
            const diffMins = Math.floor(diffMs / 60000);
            
            let statusBadge = '';
            let statusClass = '';
            
            if (diffMins > 0) {
                statusBadge = `<span class="status-badge upcoming">⏰ Akan datang (${diffMins} menit lagi)</span>`;
                statusClass = 'upcoming';
            } else if (diffMins <= 0 && diffMins > -120) {
                statusBadge = `<span class="status-badge active">🔴 LIVE - Sedang Berlangsung</span>`;
                statusClass = 'active';
            } else {
                statusBadge = `<span class="status-badge ended">✅ Telah Selesai</span>`;
                statusClass = 'ended';
            }
            
            return `
            <div class="zoom-room-card ${statusClass}" onclick="showJoinModal('${room.roomId}')">
                <h3>${escapeHtml(room.title)}</h3>
                <p>${escapeHtml(room.description || 'Tidak ada deskripsi')}</p>
                ${statusBadge}
                <div class="room-code">🔑 Kode: <strong>${room.roomId}</strong></div>
                <div class="room-time">📅 ${room.date} | ⏰ ${room.startTime} - ${room.endTime}</div>
                <div class="room-mapel">📖 ${room.mapel || 'Umum'}</div>
                <div class="room-participants">👥 ${room.participants?.length || 0} peserta</div>
                <button class="btn-join" onclick="event.stopPropagation(); showJoinModal('${room.roomId}')">🎥 Join Meeting</button>
            </div>
        `}).join('');
        
        console.log(`✅ ${activeRooms.length} zoom rooms displayed`);
        
    } catch (error) {
        console.error('❌ Error loading zoom rooms:', error);
        const grid = document.getElementById('zoomRoomsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="error-message" style="grid-column: 1/-1;">
                    <div class="error-icon">⚠️</div>
                    <h3>Gagal Memuat Zoom Meeting</h3>
                    <p>Terjadi kesalahan saat menghubungi server.<br>Error: ${error.message}</p>
                    <button class="btn-primary" onclick="loadZoomRooms()" style="margin-top: 1rem;">
                        🔄 Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

// Show join modal
function showJoinModal(roomId) {
    const modal = document.getElementById('joinZoomModal');
    const roomCodeInput = document.getElementById('roomCode');
    if (roomCodeInput) roomCodeInput.value = roomId;
    if (modal) modal.style.display = 'flex';
}

function closeJoinZoomModal() {
    const modal = document.getElementById('joinZoomModal');
    if (modal) modal.style.display = 'none';
    const roomCode = document.getElementById('roomCode');
    const participantName = document.getElementById('participantName');
    if (roomCode) roomCode.value = '';
    if (participantName) participantName.value = '';
}

// Join room
async function joinRoom() {
    const roomCode = document.getElementById('roomCode')?.value.toUpperCase();
    const participantName = document.getElementById('participantName')?.value;
    
    if (!roomCode || !participantName) {
        alert('❌ Masukkan kode room dan nama Anda!');
        return;
    }
    
    try {
        const response = await fetch(`/api/rooms/join/${roomCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: participantName })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            alert(data.error || 'Gagal bergabung ke room');
            return;
        }
        
        closeJoinZoomModal();
        alert(`✅ Berhasil bergabung ke room: ${data.room.title}\n\nSilakan tunggu guru memulai meeting.`);
        
        // Refresh daftar room
        loadZoomRooms();
        
    } catch (error) {
        console.error('Error joining room:', error);
        alert('❌ Gagal bergabung ke room');
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
    
    localStorage.setItem('studentData', JSON.stringify(studentData));
    window.location.href = `/ujian.html?id=${selectedTugasId}`;
});

function scrollToTugas() {
    const tugasSection = document.getElementById('tugasSection');
    if (tugasSection) tugasSection.scrollIntoView({ behavior: 'smooth' });
}

async function checkAPI() {
    try {
        const response = await fetch('/api/tugas');
        if (response.ok) console.log('✅ API connection OK');
        else console.warn('⚠️ API responded with status:', response.status);
    } catch (error) {
        console.error('❌ API connection failed:', error);
    }
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Ruang Ujian App Started');
    createParticles();
    checkAPI();
    checkUpcomingExam();
    loadTugasWithSchedule();
    loadActiveStudents();
    loadLatestPengumuman();
    loadZoomRooms(); // Memuat zoom rooms dengan status badge
});

// Close modal when clicking outside
window.onclick = (event) => {
    const modal = document.getElementById('formModal');
    if (event.target === modal) closeModal();
    
    const joinModal = document.getElementById('joinZoomModal');
    if (event.target === joinModal) closeJoinZoomModal();
};