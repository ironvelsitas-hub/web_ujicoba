let tugasData = null;
let studentData = null;
let jawaban = [];
let jawabanEssay = [];
let timer = null;
let waktuTersisa = 0;
let hasilUjian = null;

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const tugasId = urlParams.get('id');

// Load student data
studentData = JSON.parse(localStorage.getItem('studentData'));

if (!studentData || studentData.tugasId != tugasId) {
    alert('Data siswa tidak ditemukan. Silakan isi form terlebih dahulu.');
    window.location.href = '/';
}

// Cek apakah ujian sesuai jadwal
async function checkExamSchedule(tugasId) {
    try {
        const response = await fetch(`/api/jadwal/tugas/${tugasId}`);
        const schedule = await response.json();
        
        if (!schedule) return true;
        
        const now = new Date();
        const examStart = new Date(`${schedule.tanggal}T${schedule.jamMulai}`);
        const examEnd = new Date(`${schedule.tanggal}T${schedule.jamSelesai}`);
        
        if (now < examStart) {
            const timeLeft = examStart - now;
            const minutesLeft = Math.floor(timeLeft / 60000);
            alert(`⏰ Ujian belum dimulai!\n\nUjian akan dimulai pada:\n${schedule.tanggal} pukul ${schedule.jamMulai}\n\nWaktu tersisa: ${minutesLeft} menit lagi.`);
            window.location.href = '/';
            return false;
        }
        
        if (now > examEnd) {
            alert(`🔒 Ujian sudah berakhir!\n\nUjian ditutup pada:\n${schedule.tanggal} pukul ${schedule.jamSelesai}`);
            window.location.href = '/';
            return false;
        }
        
        if (schedule.status !== 'active') {
            alert(`📅 Ujian sedang tidak aktif.\nStatus: ${schedule.status === 'upcoming' ? 'Akan Datang' : 'Ditutup'}`);
            window.location.href = '/';
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Error checking schedule:', error);
        return true;
    }
}

// Load tugas
async function loadTugas() {
    const isAllowed = await checkExamSchedule(tugasId);
    if (!isAllowed) return;
    
    try {
        console.log('📥 Memuat tugas dengan ID:', tugasId);
        const response = await fetch('/api/tugas');
        const semuaTugas = await response.json();
        console.log('📋 Semua tugas:', semuaTugas);
        
        tugasData = semuaTugas.find(t => t.id == tugasId);
        console.log('✅ Tugas ditemukan:', tugasData);
        
        if (!tugasData) {
            alert('Tugas tidak ditemukan');
            window.location.href = '/';
            return;
        }
        
        document.getElementById('judulUjian').textContent = tugasData.judul;
        document.getElementById('mapelUjian').innerHTML = `📖 ${tugasData.mapel} | 👨‍🏫 ${tugasData.namaGuru || 'Guru'}`;
        
        waktuTersisa = tugasData.waktu * 60;
        startTimer();
        
        // Debug: Lihat struktur soal
        console.log('📝 Struktur soal:', {
            soal: tugasData.soal,
            soalDetail: tugasData.soalDetail,
            jenisTugas: tugasData.jenisTugas,
            jumlahSoal: tugasData.jumlahSoal
        });
        
        displaySoal();
        createSoalNav();
        
        // Initialize jawaban arrays
        const jumlahSoalPG = tugasData.soalDetail?.pilihanGanda?.length || tugasData.jumlahSoal || 0;
        const jumlahSoalEssay = tugasData.soalDetail?.esai?.length || 0;
        
        jawaban = new Array(jumlahSoalPG).fill(null);
        jawabanEssay = new Array(jumlahSoalEssay).fill('');
        
        // Load saved answers from localStorage
        const savedAnswers = localStorage.getItem(`jawaban_${tugasId}_${studentData.nis}`);
        if (savedAnswers) {
            const saved = JSON.parse(savedAnswers);
            if (saved.jawaban) jawaban = saved.jawaban;
            if (saved.jawabanEssay) jawabanEssay = saved.jawabanEssay;
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
            if (radio) radio.checked = true;
        }
    }
    
    for (let i = 0; i < jawabanEssay.length; i++) {
        const textarea = document.getElementById(`essay-${i}`);
        if (textarea && jawabanEssay[i]) {
            textarea.value = jawabanEssay[i];
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
    
    container.innerHTML = '';
    
    // CEK APAKAH ADA SOAL DI tugasData.soal
    console.log('🔄 Menampilkan soal...');
    console.log('tugasData.soal:', tugasData.soal);
    console.log('tugasData.soalDetail:', tugasData.soalDetail);
    console.log('tugasData.jenisTugas:', tugasData.jenisTugas);
    
    // STRATEGI 1: Gunakan tugasData.soal (format array string)
    if (tugasData.soal && Array.isArray(tugasData.soal) && tugasData.soal.length > 0) {
        console.log('✅ Menggunakan format soal array, jumlah:', tugasData.soal.length);
        
        tugasData.soal.forEach((soalItem, index) => {
            console.log(`Soal ${index + 1}:`, soalItem);
            
            let questionText = '';
            let options = [];
            
            // Cek apakah soalItem adalah string
            if (typeof soalItem === 'string') {
                const lines = soalItem.split('\n').filter(line => line.trim());
                
                // Cari baris pertama yang berisi pertanyaan
                for (let line of lines) {
                    if (!line.match(/^[A-D]\./) && !line.includes('[JAWABAN:')) {
                        questionText = line.replace(/^\d+\.\s*/, '').trim();
                        break;
                    }
                }
                
                // Ambil option (baris yang dimulai dengan A., B., C., D.)
                options = lines.filter(line => line.match(/^[A-D]\./));
                
                // Jika tidak menemukan pertanyaan, ambil baris pertama
                if (!questionText && lines.length > 0) {
                    questionText = lines[0].replace(/^\d+\.\s*/, '').trim();
                }
            } 
            // Cek apakah soalItem adalah object
            else if (typeof soalItem === 'object' && soalItem.pertanyaan) {
                questionText = soalItem.pertanyaan;
                options = soalItem.options || [];
            }
            
            // Buat elemen soal
            const soalDiv = document.createElement('div');
            soalDiv.className = 'soal-item';
            soalDiv.id = `soal-${index}`;
            soalDiv.style.background = 'white';
            soalDiv.style.borderRadius = '15px';
            soalDiv.style.padding = '1.5rem';
            soalDiv.style.marginBottom = '1.5rem';
            soalDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            
            if (options.length > 0) {
                // Soal Pilihan Ganda
                soalDiv.innerHTML = `
                    <div class="soal-text" style="margin-bottom: 1rem;">
                        <strong style="color: #667eea;">Soal ${index + 1}.</strong> 
                        <span>${escapeHtml(questionText || 'Soal tidak tersedia')}</span>
                        <span style="display: inline-block; background: #667eea; color: white; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; margin-left: 0.5rem;">Pilihan Ganda</span>
                    </div>
                    <div class="options" style="margin-left: 1.5rem;">
                        ${options.map(opt => {
                            const letter = opt[0];
                            const text = opt.substring(3).trim();
                            return `
                                <label class="option" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; cursor: pointer;">
                                    <input type="radio" name="soal${index}" value="${letter}" onchange="saveAnswer(${index}, '${letter}')">
                                    <span><strong>${letter}.</strong> ${escapeHtml(text)}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                `;
            } else {
                // Soal Essay
                soalDiv.style.borderLeft = '4px solid #10b981';
                soalDiv.innerHTML = `
                    <div class="soal-text" style="margin-bottom: 1rem;">
                        <strong style="color: #667eea;">Soal ${index + 1}.</strong> 
                        <span>${escapeHtml(questionText || 'Soal tidak tersedia')}</span>
                        <span style="display: inline-block; background: #10b981; color: white; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; margin-left: 0.5rem;">Essay</span>
                    </div>
                    <textarea class="essay-textarea" id="essay-${jawabanEssay.length}" rows="6" 
                        style="width: 100%; padding: 1rem; border: 1px solid #ddd; border-radius: 10px; font-family: 'Poppins', sans-serif; font-size: 0.95rem; resize: vertical; margin-top: 0.5rem;"
                        placeholder="Tulis jawaban Anda di sini..."
                        oninput="saveEssayAnswer(${jawabanEssay.length}, this.value)">${jawabanEssay[jawabanEssay.length] || ''}</textarea>
                `;
                // Tambahkan ke array jawabanEssay jika belum ada
                if (jawabanEssay.length <= index) {
                    jawabanEssay.push('');
                }
            }
            
            container.appendChild(soalDiv);
        });
        
        // Update jumlah soal
        if (tugasData.jumlahSoal !== container.children.length) {
            tugasData.jumlahSoal = container.children.length;
        }
        
        return;
    }
    
    // STRATEGI 2: Gunakan tugasData.soalDetail
    if (tugasData.soalDetail) {
        console.log('✅ Menggunakan format soalDetail');
        const soalDetail = tugasData.soalDetail;
        const jenisTugas = tugasData.jenisTugas || 'pilihan_ganda';
        let soalCounter = 0;
        
        // Tampilkan pilihan ganda
        if (soalDetail.pilihanGanda && soalDetail.pilihanGanda.length > 0) {
            soalDetail.pilihanGanda.forEach((soal, idx) => {
                const soalDiv = document.createElement('div');
                soalDiv.className = 'soal-item';
                soalDiv.id = `soal-${soalCounter}`;
                soalDiv.style.background = 'white';
                soalDiv.style.borderRadius = '15px';
                soalDiv.style.padding = '1.5rem';
                soalDiv.style.marginBottom = '1.5rem';
                soalDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                
                soalDiv.innerHTML = `
                    <div class="soal-text" style="margin-bottom: 1rem;">
                        <strong style="color: #667eea;">Soal ${soalCounter + 1}.</strong> 
                        <span>${escapeHtml(soal.pertanyaan || '(Soal tidak tersedia)')}</span>
                        <span style="display: inline-block; background: #667eea; color: white; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; margin-left: 0.5rem;">Pilihan Ganda</span>
                    </div>
                    <div class="options" style="margin-left: 1.5rem;">
                        ${soal.options.map((opt, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            return `
                                <label class="option" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; cursor: pointer;">
                                    <input type="radio" name="soal${soalCounter}" value="${letter}" onchange="saveAnswer(${soalCounter}, '${letter}')">
                                    <span><strong>${letter}.</strong> ${escapeHtml(opt)}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                `;
                container.appendChild(soalDiv);
                soalCounter++;
            });
        }
        
        // Tampilkan essay
        if (soalDetail.esai && soalDetail.esai.length > 0) {
            soalDetail.esai.forEach((soal, idx) => {
                const soalDiv = document.createElement('div');
                soalDiv.className = 'soal-item essay';
                soalDiv.id = `soal-${soalCounter}`;
                soalDiv.style.background = '#f8f9fa';
                soalDiv.style.borderRadius = '15px';
                soalDiv.style.padding = '1.5rem';
                soalDiv.style.marginBottom = '1.5rem';
                soalDiv.style.borderLeft = '4px solid #10b981';
                
                soalDiv.innerHTML = `
                    <div class="soal-text" style="margin-bottom: 1rem;">
                        <strong style="color: #667eea;">Soal ${soalCounter + 1}.</strong> 
                        <span>${escapeHtml(soal.pertanyaan || '(Soal tidak tersedia)')}</span>
                        <span style="display: inline-block; background: #10b981; color: white; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; margin-left: 0.5rem;">Essay</span>
                        <span style="display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; margin-left: 0.5rem;">📊 Bobot: ${soal.bobot || 10}</span>
                    </div>
                    ${soal.petunjuk ? `<div style="background: #e8f5e9; padding: 0.5rem; border-radius: 8px; font-size: 0.8rem; margin-bottom: 0.5rem;">💡 ${escapeHtml(soal.petunjuk)}</div>` : ''}
                    <textarea class="essay-textarea" id="essay-${idx}" rows="6" 
                        style="width: 100%; padding: 1rem; border: 1px solid #ddd; border-radius: 10px; font-family: 'Poppins', sans-serif; font-size: 0.95rem; resize: vertical; margin-top: 0.5rem;"
                        placeholder="Tulis jawaban Anda di sini..."
                        oninput="saveEssayAnswer(${idx}, this.value)">${jawabanEssay[idx] || ''}</textarea>
                `;
                container.appendChild(soalDiv);
                soalCounter++;
            });
        }
        
        // Update jumlah soal
        tugasData.jumlahSoal = soalCounter;
        
        if (container.children.length > 0) return;
    }
    
    // JIKA TIDAK ADA SOAL SAMA SEKALI
    console.error('❌ Tidak ada soal yang ditemukan!');
    container.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 3rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 20px;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <h3 style="margin-bottom: 0.5rem;">Tidak Ada Soal untuk Tugas Ini</h3>
            <p style="margin-bottom: 1rem;">Silakan hubungi guru Anda untuk informasi lebih lanjut.</p>
            <button class="btn-primary" onclick="window.location.href='/'" style="padding: 0.75rem 1.5rem; border: none; border-radius: 10px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; cursor: pointer;">
                Kembali ke Beranda
            </button>
        </div>
    `;
}

function createSoalNav() {
    const nav = document.getElementById('soalNav');
    if (!nav) return;
    
    const totalSoal = tugasData.jumlahSoal || 0;
    if (totalSoal === 0) {
        nav.innerHTML = '<div style="text-align: center; padding: 1rem; color: #999;">Tidak ada soal</div>';
        return;
    }
    
    let buttons = '<div class="nav-buttons" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem;">';
    for (let i = 0; i < totalSoal; i++) {
        buttons += `<button class="nav-btn" onclick="scrollToSoal(${i})" style="background: #e9ecef; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;">${i + 1}</button>`;
    }
    buttons += '</div>';
    nav.innerHTML = buttons;
    updateNavButtons();
}

function updateNavButtons() {
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach((btn, index) => {
        let isAnswered = false;
        
        if (index < jawaban.length && jawaban[index] !== null && jawaban[index] !== undefined) {
            isAnswered = true;
        }
        
        const essayIndex = index - jawaban.length;
        if (essayIndex >= 0 && essayIndex < jawabanEssay.length && jawabanEssay[essayIndex] && jawabanEssay[essayIndex].trim() !== '') {
            isAnswered = true;
        }
        
        if (isAnswered) {
            btn.classList.add('answered');
            btn.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
            btn.style.color = 'white';
        } else {
            btn.classList.remove('answered');
            btn.style.background = '#e9ecef';
            btn.style.color = '#333';
        }
    });
}

function saveAnswer(soalIndex, jawabanValue) {
    if (!jawaban) {
        jawaban = new Array(tugasData.jumlahSoal).fill(null);
    }
    jawaban[soalIndex] = jawabanValue;
    updateNavButtons();
    saveToLocalStorage();
}

function saveEssayAnswer(essayIndex, value) {
    if (!jawabanEssay) {
        jawabanEssay = [];
    }
    jawabanEssay[essayIndex] = value;
    updateNavButtons();
    saveToLocalStorage();
}

function saveToLocalStorage() {
    const saveData = {
        jawaban: jawaban,
        jawabanEssay: jawabanEssay
    };
    localStorage.setItem(`jawaban_${tugasId}_${studentData.nis}`, JSON.stringify(saveData));
}

function scrollToSoal(index) {
    const element = document.getElementById(`soal-${index}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

async function submitUjian() {
    if (timer) clearInterval(timer);
    
    let benar = 0;
    let jawabanDetail = [];
    const soalDetail = tugasData.soalDetail;
    const jenisTugas = tugasData.jenisTugas || 'pilihan_ganda';
    
    // Proses nilai pilihan ganda dari tugasData.soal
    if (tugasData.soal && Array.isArray(tugasData.soal) && tugasData.soal.length > 0) {
        for (let i = 0; i < tugasData.soal.length; i++) {
            const soalItem = tugasData.soal[i];
            let correctAnswer = null;
            let questionText = '';
            
            if (typeof soalItem === 'string') {
                const lines = soalItem.split('\n');
                // Cari jawaban benar
                for (let line of lines) {
                    if (line.includes('[JAWABAN:')) {
                        const match = line.match(/\[JAWABAN:\s*([A-D])\]/);
                        if (match) correctAnswer = match[1];
                    }
                    if (!line.match(/^[A-D]\./) && !line.includes('[JAWABAN:')) {
                        questionText = line.replace(/^\d+\.\s*/, '').trim();
                    }
                }
                // Jika tidak ada [JAWABAN], cari dari option (A. xxx)
                if (!correctAnswer) {
                    for (let line of lines) {
                        if (line.match(/^[A-D]\./)) {
                            correctAnswer = line[0];
                            break;
                        }
                    }
                }
            } else if (typeof soalItem === 'object' && soalItem.jawabanBenar) {
                correctAnswer = soalItem.jawabanBenar;
                questionText = soalItem.pertanyaan;
            }
            
            const jawab = jawaban[i];
            const isCorrect = (jawab === correctAnswer);
            if (isCorrect) benar++;
            
            jawabanDetail.push({
                nomor: i + 1,
                tipe: 'PG',
                soal: questionText,
                jawabanSiswa: jawab || '-',
                jawabanBenar: correctAnswer,
                status: isCorrect
            });
        }
    }
    
    const totalSoalPG = tugasData.soal?.length || 0;
    const nilaiPG = totalSoalPG > 0 ? Math.round((benar / totalSoalPG) * 100) : null;
    const status = (nilaiPG !== null && nilaiPG >= 70) ? 'LULUS' : (totalSoalPG > 0 ? 'TIDAK LULUS' : 'PENDING');
    
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
            tanggal: new Date().toLocaleString('id-ID'),
            jenisTugas: jenisTugas
        },
        hasil: {
            nilaiPG: nilaiPG,
            benar: benar,
            totalPG: totalSoalPG,
            status: status,
            persentase: nilaiPG !== null ? Math.round((benar / totalSoalPG) * 100) : null
        },
        jawabanDetail: jawabanDetail
    };
    
    const submissionData = {
        tugasId: parseInt(tugasId),
        nama: studentData.nama,
        nis: studentData.nis,
        kelas: studentData.kelas,
        jawaban: jawaban || [],
        jawabanEssay: jawabanEssay || [],
        nilai: nilaiPG || 0,
        benar: benar,
        total: totalSoalPG,
        jawabanDetail: jawabanDetail,
        jenisTugas: jenisTugas
    };
    
    try {
        await fetch('/api/jawaban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
        });
        
        localStorage.removeItem(`jawaban_${tugasId}_${studentData.nis}`);
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
    
    let html = `
        <div class="hasil-container" style="padding: 1rem;">
            <div class="hasil-header" style="text-align: center; margin-bottom: 2rem;">
                <div class="hasil-icon" style="font-size: 3rem;">📝</div>
                <h2 style="margin-top: 0.5rem;">Hasil Ujian</h2>
            </div>
            
            <div class="hasil-info" style="background: #f8f9fa; border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
                <div class="info-row" style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #eee;">
                    <span class="info-label" style="font-weight: 600;">Nama Siswa:</span>
                    <span class="info-value">${escapeHtml(hasilUjian.siswa.nama)}</span>
                </div>
                <div class="info-row" style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #eee;">
                    <span class="info-label" style="font-weight: 600;">NIS:</span>
                    <span class="info-value">${escapeHtml(hasilUjian.siswa.nis)}</span>
                </div>
                <div class="info-row" style="display: flex; justify-content: space-between; padding: 0.5rem;">
                    <span class="info-label" style="font-weight: 600;">Kelas:</span>
                    <span class="info-value">${escapeHtml(hasilUjian.siswa.kelas)}</span>
                </div>
            </div>
    `;
    
    if (hasilUjian.hasil.nilaiPG !== null) {
        html += `
            <div class="hasil-skor" style="text-align: center; margin: 1.5rem 0;">
                <div class="skor-circle" style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: inline-flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
                    <span class="skor-nilai" style="font-size: 2rem; font-weight: bold;">${hasilUjian.hasil.nilaiPG}</span>
                    <span class="skor-label" style="font-size: 0.8rem;">Nilai</span>
                </div>
                <p style="margin-top: 0.5rem;">Benar: ${hasilUjian.hasil.benar} dari ${hasilUjian.hasil.totalPG} soal</p>
            </div>
        `;
    }
    
    html += `
            <div class="hasil-footer" style="margin-top: 1.5rem; padding: 1rem; background: #e3f2fd; border-radius: 10px; text-align: center;">
                <p style="margin: 0;">✅ Ujian telah selesai. Nilai akan disimpan.</p>
            </div>
        </div>
    `;
    
    hasilBody.innerHTML = html;
    modal.style.display = 'flex';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function cetakBukti() {
    window.print();
}

function closeHasilModal() {
    const modal = document.getElementById('hasilModal');
    if (modal) modal.style.display = 'none';
    window.location.href = '/';
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