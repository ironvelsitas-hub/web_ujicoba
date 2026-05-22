let tugasData = null;
let studentData = null;
let jawaban = [];
let timer = null;
let waktuTersisa = 0;
let hasilUjian = null; // Untuk menyimpan hasil ujian

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const tugasId = urlParams.get('id');

// Load student data
studentData = JSON.parse(localStorage.getItem('studentData'));

if (!studentData || studentData.tugasId != tugasId) {
    alert('Data siswa tidak ditemukan. Silakan isi form terlebih dahulu.');
    window.location.href = '/';
}

// Load tugas
async function loadTugas() {
    try {
        const response = await fetch('/api/tugas');
        const semuaTugas = await response.json();
        tugasData = semuaTugas.find(t => t.id == tugasId);
        
        if (!tugasData) {
            alert('Tugas tidak ditemukan');
            window.location.href = '/';
            return;
        }
        
        document.getElementById('judulUjian').textContent = tugasData.judul;
        document.getElementById('mapelUjian').textContent = `📖 ${tugasData.mapel}|👨‍🏫 ${tugasData.namaGuru || 'Guru'}`;
        
        waktuTersisa = tugasData.waktu * 60;
        startTimer();
        displaySoal();
        createSoalNav();
        
        // Initialize jawaban array
        jawaban = new Array(tugasData.jumlahSoal).fill(null);
        
        // Load saved answers from localStorage
        const savedAnswers = localStorage.getItem(`jawaban_${tugasId}_${studentData.nis}`);
        if (savedAnswers) {
            jawaban = JSON.parse(savedAnswers);
            updateNavButtons();
            restoreAnswers();
        }
    } catch (error) {
        console.error('Error loading tugas:', error);
        alert('Gagal memuat tugas. Silakan coba lagi.');
    }
}

function restoreAnswers() {
    for (let i = 0; i < jawaban.length; i++) {
        if (jawaban[i] !== null) {
            const radio = document.querySelector(`input[name="soal${i}"][value="${jawaban[i]}"]`);
            if (radio) {
                radio.checked = true;
            }
        }
    }
}

function startTimer() {
    updateTimerDisplay();
    timer = setInterval(() => {
        if (waktuTersisa <= 0) {
            clearInterval(timer);
            submitUjian();
        } else {
            waktuTersisa--;
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const menit = Math.floor(waktuTersisa / 60);
    const detik = waktuTersisa % 60;
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = `${String(menit).padStart(2, '0')}:${String(detik).padStart(2, '0')}`;
        
        if (waktuTersisa <= 60) {
            timerElement.style.color = '#ff4444';
        }
    }
}

function displaySoal() {
    const container = document.getElementById('soalContainer');
    
    if (!container) return;
    
    if (!tugasData.soal || tugasData.soal.length === 0) {
        container.innerHTML = '<div class="error-message">⚠️ Tidak ada soal untuk tugas ini</div>';
        return;
    }
    
    container.innerHTML = '';
    
    tugasData.soal.forEach((soal, index) => {
        let questionText = '';
        let options = [];
        
        if (typeof soal === 'string') {
            const lines = soal.split('\n').filter(line => line.trim());
            
            for (let line of lines) {
                if (line.match(/^\d+\./) || !line.match(/^[A-D]\./)) {
                    questionText = line.replace(/^\d+\.\s*/, '').trim();
                    break;
                }
            }
            
            options = lines.filter(line => line.match(/^[A-D]\./));
            
            if (!questionText && lines.length > 0) {
                questionText = lines[0].trim();
                options = lines.slice(1).filter(line => line.match(/^[A-D]\./));
            }
        } else if (typeof soal === 'object') {
            questionText = soal.pertanyaan || `Soal ${index + 1}`;
            options = soal.options || [];
        }
        
        const soalDiv = document.createElement('div');
        soalDiv.className = 'soal-item';
        soalDiv.id = `soal-${index}`;
        
        soalDiv.innerHTML = `
            <div class="soal-text">
                <strong>Soal ${index + 1}.</strong> ${questionText || 'Soal tidak tersedia'}
            </div>
            <div class="options">
                ${options.map(opt => {
                    const letter = opt[0];
                    const text = opt.substring(3).trim();
                    return `
                        <label class="option">
                            <input type="radio" name="soal${index}" value="${letter}"
                                onchange="saveAnswer(${index}, '${letter}')">
                            <span><strong>${letter}.</strong> ${text}</span>
                        </label>
                    `;
                }).join('')}
            </div>
        `;
        
        container.appendChild(soalDiv);
    });
    
    if (container.children.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                ⚠️ Format soal tidak valid.<br>
                Pastikan soal ditulis dengan format:<br>
                1. Pertanyaan soal<br>
                A. Jawaban A<br>
                B. Jawaban B<br>
                C. Jawaban C<br>
                D. Jawaban D
            </div>
        `;
    }
}

function createSoalNav() {
    const nav = document.getElementById('soalNav');
    if (!nav) return;
    
    let buttons = '<div class="nav-buttons">';
    for (let i = 0; i < tugasData.jumlahSoal; i++) {
        buttons += `<button class="nav-btn" onclick="scrollToSoal(${i})">${i + 1}</button>`;
    }
    buttons += '</div>';
    nav.innerHTML = buttons;
    updateNavButtons();
}

function updateNavButtons() {
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach((btn, index) => {
        if (jawaban && jawaban[index] !== null && jawaban[index] !== undefined) {
            btn.classList.add('answered');
        } else {
            btn.classList.remove('answered');
        }
    });
}

function saveAnswer(soalIndex, jawabanValue) {
    if (!jawaban) {
        jawaban = new Array(tugasData.jumlahSoal).fill(null);
    }
    jawaban[soalIndex] = jawabanValue;
    updateNavButtons();
    
    localStorage.setItem(`jawaban_${tugasId}_${studentData.nis}`, JSON.stringify(jawaban));
}

function scrollToSoal(index) {
    const element = document.getElementById(`soal-${index}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

async function submitUjian() {
    if (timer) clearInterval(timer);
    
    // Calculate score
    let benar = 0;
    let jawabanDetail = [];
    
    if (jawaban) {
        jawaban.forEach((jawab, index) => {
            if (jawab && tugasData.soal[index]) {
                const soalText = tugasData.soal[index];
                let correctAnswer = null;
                let questionText = '';
                
                if (typeof soalText === 'string') {
                    const lines = soalText.split('\n');
                    questionText = lines[0].replace(/^\d+\.\s*/, '').trim();
                    for (let line of lines) {
                        if (line.match(/^[A-D]\./)) {
                            correctAnswer = line[0];
                            break;
                        }
                    }
                }
                
                const isCorrect = (jawab === correctAnswer);
                if (isCorrect) benar++;
                
                jawabanDetail.push({
                    nomor: index + 1,
                    soal: questionText,
                    jawabanSiswa: jawab,
                    jawabanBenar: correctAnswer,
                    status: isCorrect
                });
            }
        });
    }
    
    const nilai = Math.round((benar / tugasData.jumlahSoal) * 100);
    const status = nilai >= 70 ? 'LULUS' : 'TIDAK LULUS';
    
    hasilUjian = {
        siswa: {
            nama: studentData.nama,
            nis: studentData.nis,
            kelas: studentData.kelas
        },
        tugas: {
            judul: tugasData.judul,
            mapel: tugasData.mapel,
            namaGuru: tugasData.namaGuru || '-',
            tanggal: new Date().toLocaleString('id-ID')
        },
        hasil: {
            nilai: nilai,
            benar: benar,
            total: tugasData.jumlahSoal,
            status: status,
            persentase: Math.round((benar / tugasData.jumlahSoal) * 100)
        },
        jawabanDetail: jawabanDetail
    };
    
    const submissionData = {
        tugasId: parseInt(tugasId),
        nama: studentData.nama,
        nis: studentData.nis,
        kelas: studentData.kelas,
        jawaban: jawaban || [],
        nilai: nilai,
        benar: benar,
        total: tugasData.jumlahSoal,
        jawabanDetail: jawabanDetail
    };
    
    try {
        await fetch('/api/jawaban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
        });
        
        localStorage.removeItem(`jawaban_${tugasId}_${studentData.nis}`);
        
        // Tampilkan modal hasil
        tampilkanHasilUjian();
        
    } catch (error) {
        console.error('Error submitting:', error);
        alert('❌ Gagal menyimpan jawaban. Silakan coba lagi.');
    }
}

function tampilkanHasilUjian() {
    const modal = document.getElementById('hasilModal');
    const hasilBody = document.getElementById('hasilBody');
    
    if (!hasilUjian) return;
    
    const statusClass = hasilUjian.hasil.status === 'LULUS' ? 'status-lulus' : 'status-gagal';
    const statusIcon = hasilUjian.hasil.status === 'LULUS' ? '🎉' : '😔';
    
    hasilBody.innerHTML = `
        <div class="hasil-container">
            <div class="hasil-header">
                <div class="hasil-icon">${statusIcon}</div>
                <h2>${hasilUjian.hasil.status}</h2>
            </div>
            
            <div class="hasil-skor">
                <div class="skor-circle">
                    <span class="skor-nilai">${hasilUjian.hasil.nilai}</span>
                    <span class="skor-label">Nilai</span>
                </div>
            </div>
            
            <div class="hasil-info">
                <div class="info-row">
                    <span class="info-label">Nama Siswa:</span>
                    <span class="info-value">${hasilUjian.siswa.nama}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">NIS:</span>
                    <span class="info-value">${hasilUjian.siswa.nis}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Kelas:</span>
                    <span class="info-value">${hasilUjian.siswa.kelas}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Mata Pelajaran:</span>
                    <span class="info-value">${hasilUjian.tugas.mapel}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Nama Guru:</span>
                    <span class="info-value">${hasilUjian.tugas.namaGuru || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Judul Tugas:</span>
                    <span class="info-value">${hasilUjian.tugas.judul}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tanggal:</span>
                    <span class="info-value">${hasilUjian.tugas.tanggal}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Jumlah Benar:</span>
                    <span class="info-value">${hasilUjian.hasil.benar} dari ${hasilUjian.hasil.total}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Persentase:</span>
                    <span class="info-value">${hasilUjian.hasil.persentase}%</span>
                </div>
            </div>
            
            <div class="hasil-detail">
                <h3>📝 Detail Jawaban</h3>
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Soal</th>
                            <th>Jawaban</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hasilUjian.jawabanDetail.map(detail => `
                            <tr>
                                <td>${detail.nomor}</td>
                                <td>${escapeHtml(detail.soal.substring(0, 50))}${detail.soal.length > 50 ? '...' : ''}</td>
                                <td>${detail.jawabanSiswa || '-'}</td>
                                <td class="${detail.status ? 'status-benar' : 'status-salah'}">
                                    ${detail.status ? '✅ Benar' : '❌ Salah'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Helper function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function cetakBukti() {
    const hasilBody = document.getElementById('hasilBody');
    const originalContent = hasilBody.innerHTML;
    
    // Buat frame untuk print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bukti Hasil Ujian - ${hasilUjian.siswa.nama}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Poppins', Arial, sans-serif;
                    padding: 40px;
                    background: white;
                }
                .print-container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #667eea;
                }
                .header h1 {
                    color: #667eea;
                    margin-bottom: 10px;
                }
                .header p {
                    color: #666;
                }
                .hasil-skor {
                    text-align: center;
                    margin: 30px 0;
                }
                .skor-circle {
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    display: inline-flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                .skor-nilai {
                    font-size: 48px;
                    font-weight: bold;
                }
                .skor-label {
                    font-size: 14px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }
                .info-label {
                    font-weight: 600;
                    color: #333;
                }
                .info-value {
                    color: #666;
                }
                .detail-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                .detail-table th,
                .detail-table td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                .detail-table th {
                    background: #f8f9fa;
                    font-weight: 600;
                }
                .status-benar {
                    color: #4caf50;
                    font-weight: 600;
                }
                .status-salah {
                    color: #f44336;
                    font-weight: 600;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    font-size: 12px;
                    color: #999;
                }
                @media print {
                    body {
                        padding: 20px;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="header">
                    <h1>📄 BUKTI HASIL UJIAN</h1>
                    <p>Ruang Ujian Online</p>
                </div>
                ${originalContent}
                <div class="footer">
                    <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
                    <p>Bukti ini adalah dokumen resmi dari Ruang Ujian Online</p>
                </div>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function closeHasilModal() {
    const modal = document.getElementById('hasilModal');
    modal.style.display = 'none';
}

function kembaliKeBeranda() {
    window.location.href = '/';
}

document.getElementById('submitBtn')?.addEventListener('click', () => {
    if (confirm('Yakin ingin mengumpulkan ujian?')) {
        submitUjian();
    }
});

document.addEventListener('DOMContentLoaded', loadTugas);