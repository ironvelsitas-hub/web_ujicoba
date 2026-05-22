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

// ==================== FITUR SOAL BARU DENGAN JAWABAN BENAR ====================

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
            options: ['', '', '', ''],
            jawabanBenar: 'A'
        });
    }
    renderSoalEditor();
    document.getElementById('jumlahSoal').value = jumlahSoal;
}

// Render editor soal dengan pilihan jawaban benar
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
            
            <!-- Pilihan Jawaban Benar -->
            <div class="jawaban-benar-container">
                <label class="jawaban-benar-label">✅ Jawaban Benar:</label>
                <div class="jawaban-benar-options">
                    ${soal.options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        return `
                            <label class="jawaban-benar-option ${soal.jawabanBenar === letter ? 'selected' : ''}">
                                <input type="radio" name="jawabanBenar_${idx}" value="${letter}"
                                    ${soal.jawabanBenar === letter ? 'checked' : ''}
                                    onchange="setJawabanBenar(${idx}, '${letter}')">
                                <span class="option-letter-badge">${letter}</span>
                            </label>
                        `;
                    }).join('')}
                    ${soal.options.length < 6 ? `
                        <button type="button" class="btn-add-option-small" onclick="addOption(${idx})">+</button>
                    ` : ''}
                </div>
            </div>
            
            <div class="options-container">
                ${soal.options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isCorrect = soal.jawabanBenar === letter;
                    return `
                        <div class="option-row ${isCorrect ? 'correct-option' : ''}">
                            <span class="option-letter">${letter}.</span>
                            <input type="text" class="option-input" placeholder="Jawaban ${letter}" 
                                   value="${escapeHtml(opt)}" onchange="updateSoalOption(${idx}, ${optIdx}, this.value)">
                            ${isCorrect ? '<span class="correct-badge">✓ Benar</span>' : ''}
                            <button type="button" class="btn-remove-option" onclick="removeOption(${idx}, ${optIdx})" title="Hapus opsi">✗</button>
                        </div>
                    `;
                }).join('')}
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

// Set jawaban benar untuk suatu soal
function setJawabanBenar(soalIndex, jawaban) {
    if (soalItems[soalIndex]) {
        soalItems[soalIndex].jawabanBenar = jawaban;
        renderSoalEditor();
    }
}

// Tambah option baru
function addOption(soalIndex) {
    if (soalItems[soalIndex]) {
        soalItems[soalIndex].options.push('');
        renderSoalEditor();
    }
}

// Hapus option
function removeOption(soalIndex, optionIndex) {
    if (soalItems[soalIndex] && soalItems[soalIndex].options.length > 2) {
        soalItems[soalIndex].options.splice(optionIndex, 1);
        
        const currentCorrect = soalItems[soalIndex].jawabanBenar;
        const letterIndex = currentCorrect.charCodeAt(0) - 65;
        if (letterIndex === optionIndex || letterIndex >= soalItems[soalIndex].options.length) {
            soalItems[soalIndex].jawabanBenar = 'A';
        }
        
        renderSoalEditor();
    } else {
        alert('Minimal 2 pilihan jawaban!');
    }
}

// Tambah soal baru
function addSoal() {
    soalItems.push({
        nomor: soalItems.length + 1,
        pertanyaan: '',
        options: ['', '', '', ''],
        jawabanBenar: 'A'
    });
    renderSoalEditor();
}

// Hapus soal
function deleteSoal(index) {
    if (confirm('Hapus soal ini?')) {
        soalItems.splice(index, 1);
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

// Validasi format soal (termasuk jawaban benar)
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
        
        const jawabanBenarIndex = soal.jawabanBenar.charCodeAt(0) - 65;
        if (!soal.options[jawabanBenarIndex] || !soal.options[jawabanBenarIndex].trim()) {
            errors.push(`Soal ${idx + 1}: Jawaban benar "${soal.jawabanBenar}" tidak memiliki teks`);
        }
    });
    
    if (errors.length > 0) {
        alert('❌ Validasi gagal:\n' + errors.join('\n'));
        return false;
    }
    
    alert('✅ Format soal valid! (Semua soal memiliki jawaban benar)');
    return true;
}

// Preview soal (menampilkan jawaban benar dengan highlight)
function previewSoal() {
    const modal = document.getElementById('previewModal');
    const body = document.getElementById('previewBody');
    
    let html = '<div class="preview-container">';
    soalItems.forEach((soal, idx) => {
        html += `
            <div class="preview-soal-item">
                <div class="preview-soal-text"><strong>${idx + 1}.</strong> ${escapeHtml(soal.pertanyaan || '(Kosong)')}</div>
                <div class="preview-options">
                    ${soal.options.filter(opt => opt.trim()).map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isCorrect = soal.jawabanBenar === letter;
                        return `
                            <div class="preview-option ${isCorrect ? 'preview-correct' : ''}">
                                <span class="preview-option-letter">${letter}.</span>
                                <span class="preview-option-text">${escapeHtml(opt)}</span>
                                ${isCorrect ? '<span class="preview-correct-badge">✓ Jawaban Benar</span>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="preview-answer-key">
                    🔑 <strong>Kunci Jawaban:</strong> ${soal.jawabanBenar}
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

// Konversi soalItems ke format text untuk disimpan (dengan jawaban benar)
function convertSoalToText() {
    return soalItems.map(soal => {
        let text = `${soal.pertanyaan}`;
        soal.options.forEach((opt, idx) => {
            if (opt.trim()) {
                const letter = String.fromCharCode(65 + idx);
                text += `\n${letter}. ${opt}`;
            }
        });
        text += `\n[JAWABAN: ${soal.jawabanBenar}]`;
        return text;
    }).join('\n\n');
}

// Load template soal (dengan jawaban benar preset)
function loadTemplate(template) {
    const templates = {
        matematika: [
            { pertanyaan: "Hasil dari 2 + 2 adalah...", options: ["3", "4", "5", "6"], jawabanBenar: "B" },
            { pertanyaan: "Akar kuadrat dari 144 adalah...", options: ["10", "11", "12", "13"], jawabanBenar: "C" },
            { pertanyaan: "Berapa hasil dari 15 × 4?", options: ["50", "60", "70", "80"], jawabanBenar: "B" },
            { pertanyaan: "Bilangan prima berikut ini adalah...", options: ["4", "6", "7", "9"], jawabanBenar: "C" },
            { pertanyaan: "Hasil dari 100 ÷ 5 adalah...", options: ["15", "20", "25", "30"], jawabanBenar: "B" }
        ],
        ipa: [
            { pertanyaan: "Organ pernapasan manusia adalah...", options: ["Jantung", "Paru-paru", "Lambung", "Hati"], jawabanBenar: "B" },
            { pertanyaan: "Planet terdekat dengan matahari adalah...", options: ["Venus", "Bumi", "Mars", "Merkurius"], jawabanBenar: "D" },
            { pertanyaan: "Proses pembuatan makanan pada tumbuhan disebut...", options: ["Fotosintesis", "Respirasi", "Transpirasi", "Fermentasi"], jawabanBenar: "A" }
        ],
        bahasa: [
            { pertanyaan: "Sinonim dari kata 'Cepat' adalah...", options: ["Lambat", "Cepat", "Pelan", "Perlahan"], jawabanBenar: "B" },
            { pertanyaan: "Kata baku yang benar adalah...", options: ["Aktifitas", "Aktivitas", "Aktipitas", "Aktifitas"], jawabanBenar: "B" },
            { pertanyaan: "Amanat dalam cerita disebut juga...", options: ["Tema", "Alur", "Pesan Moral", "Latar"], jawabanBenar: "C" }
        ],
        inggris: [
            { pertanyaan: "What is the meaning of 'Book'?", options: ["Buku", "Pensil", "Meja", "Kursi"], jawabanBenar: "A" },
            { pertanyaan: "How do you say 'Selamat pagi' in English?", options: ["Good Night", "Good Evening", "Good Afternoon", "Good Morning"], jawabanBenar: "D" },
            { pertanyaan: "The opposite of 'big' is...", options: ["Large", "Small", "Tall", "Wide"], jawabanBenar: "B" }
        ]
    };
    
    const selectedTemplate = templates[template] || templates.matematika;
    soalItems = selectedTemplate.map((item, idx) => ({
        nomor: idx + 1,
        pertanyaan: item.pertanyaan,
        options: item.options,
        jawabanBenar: item.jawabanBenar || 'A'
    }));
    renderSoalEditor();
    alert(`✅ Template ${template} berhasil dimuat! ${soalItems.length} soal siap digunakan.`);
}

// Submit tugas dengan format baru (termasuk jawaban benar)
if (document.getElementById('tugasForm')) {
    document.getElementById('tugasForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateSoal()) return;
        
        const namaGuru = document.getElementById('namaGuru').value;
        if (!namaGuru || namaGuru.trim() === '') {
            alert('❌ Nama Guru harus diisi!');
            return;
        }
        
        const soalText = convertSoalToText();
        
        const soalWithAnswers = soalItems.map(soal => ({
            pertanyaan: soal.pertanyaan,
            options: soal.options,
            jawabanBenar: soal.jawabanBenar
        }));
        
        const tugasData = {
            judul: document.getElementById('judul').value,
            mapel: document.getElementById('mapel').value,
            namaGuru: namaGuru.trim(),
            deskripsi: document.getElementById('deskripsi').value,
            waktu: parseInt(document.getElementById('waktu').value),
            jumlahSoal: soalItems.length,
            soal: soalText.split('\n\n'),
            soalDetail: soalWithAnswers
        };
        
        try {
            const response = await fetch('/api/tugas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tugasData)
            });
            
            if (response.ok) {
                alert(`✅ Tugas berhasil diupload!\n📝 Jumlah soal: ${soalItems.length}\n✅ Semua soal memiliki kunci jawaban`);
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
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        btn.classList.add('active');
        
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