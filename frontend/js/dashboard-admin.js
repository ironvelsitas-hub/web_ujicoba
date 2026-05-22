// Cek autentikasi
if (localStorage.getItem('guruLoggedIn') !== 'true') {
    window.location.href = '/dashboard.html';
}

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

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('guruLoggedIn');
    localStorage.removeItem('guruUsername');
    window.location.href = '/dashboard.html';
});

// Load stats
async function loadStats() {
    try {
        const [tugasRes, jawabanRes, pengumumanRes] = await Promise.all([
            fetch('/api/tugas'),
            fetch('/api/jawaban/all'),
            fetch('/api/pengumuman')
        ]);
        
        const tugas = await tugasRes.json();
        const jawaban = await jawabanRes.json();
        const pengumuman = await pengumumanRes.json();
        
        const uniqueStudents = new Set(jawaban.map(j => j.nis));
        
        document.getElementById('totalTugasStat').textContent = tugas.length;
        document.getElementById('totalSiswaStat').textContent = uniqueStudents.size;
        document.getElementById('totalJawabanStat').textContent = jawaban.length;
        document.getElementById('totalPengumumanStat').textContent = pengumuman.length;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load tugas list
async function loadTugasList() {
    try {
        const response = await fetch('/api/tugas');
        const tugas = await response.json();
        
        const tugasList = document.getElementById('tugasList');
        const filterTugas = document.getElementById('filterTugas');
        
        if (tugas.length === 0) {
            tugasList.innerHTML = '<p style="text-align: center; color: #999;">Belum ada tugas yang diupload</p>';
            if (filterTugas) {
                filterTugas.innerHTML = '<option value="">Pilih Tugas</option>';
            }
            return;
        }
        
        tugasList.innerHTML = tugas.map(t => `
            <div class="tugas-item">
                <div>
                    <strong>${escapeHtml(t.judul)}</strong><br>
                    <small>📖 ${escapeHtml(t.mapel)}</small><br>
                    <small>👨‍🏫 ${escapeHtml(t.namaGuru || 'Guru')}</small><br>
                    <small>⏱️ ${t.waktu} menit | 📝 ${t.jumlahSoal} soal</small>
                    <small>📅 ${new Date(t.tanggal).toLocaleDateString('id-ID')}</small>
                </div>
                <div class="tugas-actions">
                    <button class="edit-btn" onclick="editTugas(${t.id})">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteTugas(${t.id})">Hapus</button>
                </div>
            </div>
        `).join('');
        
        // Update filter dropdown
        if (filterTugas) {
            filterTugas.innerHTML = '<option value="">Semua Tugas</option>' + 
                tugas.map(t => `<option value="${t.id}">${escapeHtml(t.judul)} - ${escapeHtml(t.mapel)} (${escapeHtml(t.namaGuru || 'Guru')})</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading tugas:', error);
    }
}

// Load jawaban siswa
async function loadJawaban() {
    try {
        const filterTugas = document.getElementById('filterTugas');
        const tugasId = filterTugas ? filterTugas.value : '';
        
        let url = '/api/jawaban/all';
        if (tugasId) {
            url = `/api/jawaban/${tugasId}`;
        }
        
        const response = await fetch(url);
        const jawaban = await response.json();
        
        const jawabanList = document.getElementById('jawabanList');
        
        if (jawaban.length === 0) {
            jawabanList.innerHTML = '<p style="text-align: center; color: #999;">Belum ada jawaban siswa</p>';
            return;
        }
        
        jawabanList.innerHTML = `
            <table class="jawaban-table">
                <thead>
                    <tr>
                        <th>Nama Siswa</th>
                        <th>NIS</th>
                        <th>Kelas</th>
                        <th>Nilai</th>
                        <th>Benar</th>
                        <th>Waktu</th>
                    </tr>
                </thead>
                <tbody>
                    ${jawaban.map(j => `
                        <tr>
                            <td>${escapeHtml(j.nama)}</td>
                            <td>${escapeHtml(j.nis)}</td>
                            <td>${escapeHtml(j.kelas)}</td>
                            <td class="nilai ${j.nilai >= 70 ? 'lulus' : 'gagal'}">${j.nilai}</td>
                            <td>${j.benar}/${j.total}</td>
                            <td>${new Date(j.waktuSubmit).toLocaleString('id-ID')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading jawaban:', error);
    }
}

// Load pengumuman list
async function loadPengumumanList() {
    try {
        const response = await fetch('/api/pengumuman');
        const pengumuman = await response.json();
        
        const listContainer = document.getElementById('pengumumanList');
        
        if (pengumuman.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #999;">Belum ada pengumuman</p>';
            return;
        }
        
        listContainer.innerHTML = pengumuman.map(p => {
            const date = new Date(p.tanggal);
            const formattedDate = date.toLocaleDateString('id-ID');
            const priorityClass = p.prioritas === 'penting' ? 'priority-high' : 
                                 p.prioritas === 'sedang' ? 'priority-medium' : 'priority-low';
            
            return `
                <div class="pengumuman-item ${priorityClass}">
                    <div class="pengumuman-info">
                        <div class="pengumuman-judul">
                            <strong>${escapeHtml(p.judul)}</strong>
                            <span class="priority-badge ${p.prioritas}">${p.prioritas?.toUpperCase() || 'UMUM'}</span>
                        </div>
                        <div class="pengumuman-meta">
                            <small>📅 ${formattedDate}</small>
                            <small>👨‍🏫 ${escapeHtml(p.author || 'Guru')}</small>
                        </div>
                        <div class="pengumuman-isi-preview">${escapeHtml(p.isi.substring(0, 100))}${p.isi.length > 100 ? '...' : ''}</div>
                    </div>
                    <div class="pengumuman-actions">
                        <button class="delete-btn" onclick="deletePengumuman(${p.id})">Hapus</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading pengumuman:', error);
    }
}

// Delete tugas
async function deleteTugas(id) {
    if (confirm('Yakin ingin menghapus tugas ini? Semua jawaban siswa untuk tugas ini juga akan terhapus.')) {
        try {
            await fetch(`/api/tugas/${id}`, { method: 'DELETE' });
            alert('✅ Tugas berhasil dihapus');
            loadTugasList();
            loadStats();
            loadJawaban();
        } catch (error) {
            console.error('Error deleting tugas:', error);
            alert('❌ Gagal menghapus tugas');
        }
    }
}

// Submit pengumuman
document.getElementById('pengumumanForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pengumumanData = {
        judul: document.getElementById('judulPengumuman').value,
        prioritas: document.getElementById('prioritasPengumuman').value,
        isi: document.getElementById('isiPengumuman').value,
        lampiran: document.getElementById('lampiranPengumuman').value || null,
        lampiran_nama: document.getElementById('lampiranNama').value || null,
        author: localStorage.getItem('guruUsername') || 'Admin'
    };
    
    try {
        const response = await fetch('/api/pengumuman', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pengumumanData)
        });
        
        if (response.ok) {
            alert('✅ Pengumuman berhasil dipublikasikan!');
            document.getElementById('pengumumanForm').reset();
            loadPengumumanList();
            loadStats();
        } else {
            alert('❌ Gagal mempublikasikan pengumuman');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Gagal mempublikasikan pengumuman');
    }
});

// Delete pengumuman
async function deletePengumuman(id) {
    if (confirm('Yakin ingin menghapus pengumuman ini?')) {
        try {
            await fetch(`/api/pengumuman/${id}`, { method: 'DELETE' });
            alert('✅ Pengumuman berhasil dihapus');
            loadPengumumanList();
            loadStats();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Gagal menghapus pengumuman');
        }
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== FITUR SOAL BARU ====================

let soalItems = [];

// Inisialisasi editor soal
function initSoalEditor(jumlahSoal = 1) {
    const container = document.getElementById('soalEditorContainer');
    if (!container) return;
    
    soalItems = [];
    for (let i = 0; i < jumlahSoal; i++) {
        soalItems.push({
            nomor: i + 1,
            pertanyaan: '',
            options: ['', '', '', '']
        });
    }
    renderSoalEditor();
    document.getElementById('jumlahSoal').value = jumlahSoal;
}

// Render editor soal
function renderSoalEditor() {
    const container = document.getElementById('soalEditorContainer');
    if (!container) return;
    
    container.innerHTML = soalItems.map((soal, idx) => `
        <div class="soal-editor-item" data-soal-idx="${idx}">
            <div class="soal-editor-header">
                <span class="soal-number">Soal ${idx + 1}</span>
                <div class="soal-actions">
                    <button onclick="moveSoalUp(${idx})" title="Pindah ke atas">⬆️</button>
                    <button onclick="moveSoalDown(${idx})" title="Pindah ke bawah">⬇️</button>
                    <button onclick="copySoal(${idx})" title="Duplikat">📋</button>
                    <button onclick="deleteSoal(${idx})" title="Hapus">🗑️</button>
                </div>
            </div>
            <input type="text" class="soal-question-input" placeholder="Masukkan pertanyaan soal..." 
                   value="${escapeHtml(soal.pertanyaan)}" onchange="updateSoal(${idx}, 'pertanyaan', this.value)">
            <div class="options-container">
                ${soal.options.map((opt, optIdx) => `
                    <div class="option-row">
                        <span class="option-letter">${String.fromCharCode(65 + optIdx)}.</span>
                        <input type="text" class="option-input" placeholder="Jawaban ${String.fromCharCode(65 + optIdx)}" 
                               value="${escapeHtml(opt)}" onchange="updateSoalOption(${idx}, ${optIdx}, this.value)">
                    </div>
                `).join('')}
                <button type="button" class="btn-add-option" onclick="addOption(${idx})">+ Tambah Opsi</button>
            </div>
        </div>
    `).join('');
    
    updateJumlahSoal();
}

// Update jumlah soal
function updateJumlahSoal() {
    const jumlahSoalInput = document.getElementById('jumlahSoal');
    if (jumlahSoalInput) {
        jumlahSoalInput.value = soalItems.length;
    }
}

// Update soal
function updateSoal(index, field, value) {
    if (soalItems[index]) {
        soalItems[index][field] = value;
    }
}

// Update option
function updateSoalOption(soalIndex, optionIndex, value) {
    if (soalItems[soalIndex] && soalItems[soalIndex].options[optionIndex] !== undefined) {
        soalItems[soalIndex].options[optionIndex] = value;
    }
}

// Tambah option
function addOption(soalIndex) {
    if (soalItems[soalIndex]) {
        soalItems[soalIndex].options.push('');
        renderSoalEditor();
    }
}

// Tambah soal baru
function addSoal() {
    soalItems.push({
        nomor: soalItems.length + 1,
        pertanyaan: '',
        options: ['', '', '', '']
    });
    renderSoalEditor();
}

// Hapus soal
function deleteSoal(index) {
    if (confirm('Hapus soal ini?')) {
        soalItems.splice(index, 1);
        // Renumber soal
        soalItems.forEach((soal, i) => soal.nomor = i + 1);
        renderSoalEditor();
    }
}

// Duplikat soal
function copySoal(index) {
    const copySoal = JSON.parse(JSON.stringify(soalItems[index]));
    copySoal.nomor = soalItems.length + 1;
    soalItems.push(copySoal);
    renderSoalEditor();
}

// Pindah soal ke atas
function moveSoalUp(index) {
    if (index > 0) {
        [soalItems[index - 1], soalItems[index]] = [soalItems[index], soalItems[index - 1]];
        // Renumber
        soalItems.forEach((soal, i) => soal.nomor = i + 1);
        renderSoalEditor();
    }
}

// Pindah soal ke bawah
function moveSoalDown(index) {
    if (index < soalItems.length - 1) {
        [soalItems[index + 1], soalItems[index]] = [soalItems[index], soalItems[index + 1]];
        soalItems.forEach((soal, i) => soal.nomor = i + 1);
        renderSoalEditor();
    }
}

// Clear semua soal
function clearSoal() {
    if (confirm('Hapus semua soal?')) {
        initSoalEditor(1);
    }
}

// Validasi format soal
function validateSoal() {
    let errors = [];
    
    soalItems.forEach((soal, idx) => {
        if (!soal.pertanyaan.trim()) {
            errors.push(`Soal ${idx + 1}: Pertanyaan kosong`);
        }
        const validOptions = soal.options.filter(opt => opt.trim());
        if (validOptions.length < 2) {
            errors.push(`Soal ${idx + 1}: Minimal 2 pilihan jawaban`);
        }
    });
    
    if (errors.length > 0) {
        alert('❌ Validasi gagal:\n' + errors.join('\n'));
        return false;
    }
    
    alert('✅ Format soal valid!');
    return true;
}

// Preview soal
function previewSoal() {
    const modal = document.getElementById('previewModal');
    if (!modal) return;
    
    const body = document.getElementById('previewBody');
    
    let html = '<div class="preview-container">';
    soalItems.forEach((soal, idx) => {
        html += `
            <div class="preview-soal-item">
                <div class="preview-soal-text"><strong>${idx + 1}.</strong> ${escapeHtml(soal.pertanyaan || '(Kosong)')}</div>
                <div class="preview-options">
                    ${soal.options.filter(opt => opt.trim()).map((opt, optIdx) => `
                        <div class="preview-option">
                            ${String.fromCharCode(65 + optIdx)}. ${escapeHtml(opt)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    body.innerHTML = html;
    modal.style.display = 'flex';
}

function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    if (modal) modal.style.display = 'none';
}

// Konversi soalItems ke format text untuk disimpan
function convertSoalToText() {
    return soalItems.map(soal => {
        let text = `${soal.pertanyaan}`;
        soal.options.forEach((opt, idx) => {
            if (opt.trim()) {
                text += `\n${String.fromCharCode(65 + idx)}. ${opt}`;
            }
        });
        return text;
    }).join('\n\n');
}

// Load template soal
function loadTemplate(template) {
    const templates = {
        matematika: [
            { pertanyaan: "Hasil dari 2 + 2 adalah...", options: ["3", "4", "5", "6"] },
            { pertanyaan: "Akar kuadrat dari 144 adalah...", options: ["10", "11", "12", "13"] },
            { pertanyaan: "Berapa hasil dari 15 × 4?", options: ["50", "60", "70", "80"] },
            { pertanyaan: "Bilangan prima berikut ini adalah...", options: ["4", "6", "7", "9"] },
            { pertanyaan: "Hasil dari 100 ÷ 5 adalah...", options: ["15", "20", "25", "30"] }
        ],
        ipa: [
            { pertanyaan: "Organ pernapasan manusia adalah...", options: ["Jantung", "Paru-paru", "Lambung", "Hati"] },
            { pertanyaan: "Planet terdekat dengan matahari adalah...", options: ["Venus", "Bumi", "Mars", "Merkurius"] },
            { pertanyaan: "Proses pembuatan makanan pada tumbuhan disebut...", options: ["Fotosintesis", "Respirasi", "Transpirasi", "Fermentasi"] }
        ],
        bahasa: [
            { pertanyaan: "Sinonim dari kata 'Cepat' adalah...", options: ["Lambat", "Cepat", "Pelan", "Perlahan"] },
            { pertanyaan: "Kata baku yang benar adalah...", options: ["Aktifitas", "Aktivitas", "Aktipitas", "Aktifitas"] },
            { pertanyaan: "Amanat dalam cerita disebut juga...", options: ["Tema", "Alur", "Pesan Moral", "Latar"] }
        ],
        inggris: [
            { pertanyaan: "What is the meaning of 'Book'?", options: ["Buku", "Pensil", "Meja", "Kursi"] },
            { pertanyaan: "How do you say 'Selamat pagi' in English?", options: ["Good Night", "Good Evening", "Good Afternoon", "Good Morning"] },
            { pertanyaan: "The opposite of 'big' is...", options: ["Large", "Small", "Tall", "Wide"] }
        ]
    };
    
    const selectedTemplate = templates[template] || templates.matematika;
    soalItems = selectedTemplate.map((item, idx) => ({
        nomor: idx + 1,
        pertanyaan: item.pertanyaan,
        options: item.options
    }));
    renderSoalEditor();
    alert(`✅ Template ${template} berhasil dimuat! ${soalItems.length} soal siap digunakan.`);
}

// Submit tugas dengan format baru
if (document.getElementById('tugasForm')) {
    document.getElementById('tugasForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validasi
        if (!validateSoal()) return;
        
        const namaGuru = document.getElementById('namaGuru').value;
        if (!namaGuru || namaGuru.trim() === '') {
            alert('❌ Nama Guru harus diisi!');
            return;
        }
        
        // Konversi soal ke format text untuk kompatibilitas
        const soalText = convertSoalToText();
        
        const tugasData = {
            judul: document.getElementById('judul').value,
            mapel: document.getElementById('mapel').value,
            namaGuru: namaGuru.trim(),
            deskripsi: document.getElementById('deskripsi').value,
            waktu: parseInt(document.getElementById('waktu').value),
            jumlahSoal: soalItems.length,
            soal: soalText.split('\n\n'),
            soalDetail: soalItems
        };
        
        try {
            const response = await fetch('/api/tugas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tugasData)
            });
            
            if (response.ok) {
                alert(`✅ Tugas berhasil diupload!\n📝 Jumlah soal: ${soalItems.length}`);
                document.getElementById('tugasForm').reset();
                initSoalEditor(1);
                loadTugasList();
                loadStats();
                loadJawaban();
            } else {
                alert('❌ Gagal mengupload tugas');
            }
        } catch (error) {
            console.error('Error uploading tugas:', error);
            alert('❌ Gagal mengupload tugas');
        }
    });
}

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab
        btn.classList.add('active');
        
        // Show corresponding content
        const tabId = btn.getAttribute('data-tab');
        const content = document.getElementById(`tab-${tabId}`);
        if (content) {
            content.classList.add('active');
        }
    });
});

// Event listeners
document.getElementById('filterTugas')?.addEventListener('change', () => {
    loadJawaban();
});

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    loadStats();
    loadTugasList();
    loadJawaban();
    loadPengumumanList();
    initSoalEditor(1);
});