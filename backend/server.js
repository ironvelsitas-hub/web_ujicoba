import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Untuk Vercel, gunakan /tmp untuk menyimpan data sementara
// Untuk local development, gunakan folder data lokal
const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp/ruang-ujian-data' : path.join(__dirname, 'data');
const TUGAS_FILE = path.join(DATA_DIR, 'tugas.json');
const JAWABAN_FILE = path.join(DATA_DIR, 'jawaban.json');
const PENGUMUMAN_FILE = path.join(DATA_DIR, 'pengumuman.json');
const JADWAL_FILE = path.join(DATA_DIR, 'jadwal.json');

// Pastikan folder data ada
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inisialisasi file jika belum ada
if (!fs.existsSync(TUGAS_FILE)) {
  fs.writeFileSync(TUGAS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(JAWABAN_FILE)) {
  fs.writeFileSync(JAWABAN_FILE, JSON.stringify([]));
}
if (!fs.existsSync(PENGUMUMAN_FILE)) {
  fs.writeFileSync(PENGUMUMAN_FILE, JSON.stringify([]));
}
if (!fs.existsSync(JADWAL_FILE)) {
  fs.writeFileSync(JADWAL_FILE, JSON.stringify([]));
}

// ==================== ROUTES TUGAS ====================
app.get('/api/tugas', (req, res) => {
  try {
    const tugas = JSON.parse(fs.readFileSync(TUGAS_FILE, 'utf-8'));
    res.json(tugas);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/tugas', (req, res) => {
  try {
    const tugas = JSON.parse(fs.readFileSync(TUGAS_FILE, 'utf-8'));
    const newTugas = {
      id: Date.now(),
      ...req.body,
      tanggal: new Date().toISOString()
    };
    tugas.push(newTugas);
    fs.writeFileSync(TUGAS_FILE, JSON.stringify(tugas, null, 2));
    res.json({ success: true, tugas: newTugas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tugas/:id', (req, res) => {
  try {
    const tugas = JSON.parse(fs.readFileSync(TUGAS_FILE, 'utf-8'));
    const filtered = tugas.filter(t => t.id != req.params.id);
    fs.writeFileSync(TUGAS_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROUTES JAWABAN ====================
app.post('/api/jawaban', (req, res) => {
  try {
    const jawaban = JSON.parse(fs.readFileSync(JAWABAN_FILE, 'utf-8'));
    const newJawaban = {
      id: Date.now(),
      ...req.body,
      waktuSubmit: new Date().toISOString()
    };
    jawaban.push(newJawaban);
    fs.writeFileSync(JAWABAN_FILE, JSON.stringify(jawaban, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/jawaban/:tugasId', (req, res) => {
  try {
    const jawaban = JSON.parse(fs.readFileSync(JAWABAN_FILE, 'utf-8'));
    const filtered = jawaban.filter(j => j.tugasId == req.params.tugasId);
    res.json(filtered);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/jawaban/all', (req, res) => {
  try {
    const jawaban = JSON.parse(fs.readFileSync(JAWABAN_FILE, 'utf-8'));
    res.json(jawaban);
  } catch (error) {
    res.json([]);
  }
});

// ==================== ROUTES PENGUMUMAN ====================
app.get('/api/pengumuman', (req, res) => {
  try {
    const pengumuman = JSON.parse(fs.readFileSync(PENGUMUMAN_FILE, 'utf-8'));
    // Urutkan dari yang terbaru
    pengumuman.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json(pengumuman);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/pengumuman', (req, res) => {
  try {
    const pengumuman = JSON.parse(fs.readFileSync(PENGUMUMAN_FILE, 'utf-8'));
    const newPengumuman = {
      id: Date.now(),
      ...req.body,
      tanggal: new Date().toISOString(),
      status: 'active'
    };
    pengumuman.push(newPengumuman);
    fs.writeFileSync(PENGUMUMAN_FILE, JSON.stringify(pengumuman, null, 2));
    res.json({ success: true, pengumuman: newPengumuman });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/pengumuman/:id', (req, res) => {
  try {
    const pengumuman = JSON.parse(fs.readFileSync(PENGUMUMAN_FILE, 'utf-8'));
    const filtered = pengumuman.filter(p => p.id != req.params.id);
    fs.writeFileSync(PENGUMUMAN_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/pengumuman/:id', (req, res) => {
  try {
    const pengumuman = JSON.parse(fs.readFileSync(PENGUMUMAN_FILE, 'utf-8'));
    const index = pengumuman.findIndex(p => p.id == req.params.id);
    if (index !== -1) {
      pengumuman[index] = { ...pengumuman[index], ...req.body };
      fs.writeFileSync(PENGUMUMAN_FILE, JSON.stringify(pengumuman, null, 2));
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Pengumuman tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROUTES JADWAL UJIAN ====================

// Get all jadwal
app.get('/api/jadwal', (req, res) => {
  try {
    const jadwal = JSON.parse(fs.readFileSync(JADWAL_FILE, 'utf-8'));
    res.json(jadwal);
  } catch (error) {
    res.json([]);
  }
});

// Get jadwal by tugas ID
app.get('/api/jadwal/tugas/:tugasId', (req, res) => {
  try {
    const jadwal = JSON.parse(fs.readFileSync(JADWAL_FILE, 'utf-8'));
    const filtered = jadwal.filter(j => j.tugasId == req.params.tugasId);
    res.json(filtered[0] || null);
  } catch (error) {
    res.json(null);
  }
});

// Create or update jadwal
app.post('/api/jadwal', (req, res) => {
  try {
    const jadwal = JSON.parse(fs.readFileSync(JADWAL_FILE, 'utf-8'));
    const existingIndex = jadwal.findIndex(j => j.tugasId === req.body.tugasId);
    
    const newJadwal = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    if (existingIndex !== -1) {
      jadwal[existingIndex] = newJadwal;
    } else {
      jadwal.push(newJadwal);
    }
    
    fs.writeFileSync(JADWAL_FILE, JSON.stringify(jadwal, null, 2));
    res.json({ success: true, jadwal: newJadwal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete jadwal
app.delete('/api/jadwal/:id', (req, res) => {
  try {
    const jadwal = JSON.parse(fs.readFileSync(JADWAL_FILE, 'utf-8'));
    const filtered = jadwal.filter(j => j.id != req.params.id);
    fs.writeFileSync(JADWAL_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATIC FILES & ROUTING ====================
// Serve static files dari folder frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Route untuk halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Route untuk halaman dashboard
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Route untuk halaman dashboard admin
app.get('/dashboard-admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard-admin.html'));
});

// Route untuk halaman ujian
app.get('/ujian.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/ujian.html'));
});

// Route untuk halaman pengumuman
app.get('/pengumuman.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pengumuman.html'));
});

// Handle semua route lainnya (fallback ke index.html untuk SPA)
app.get('*', (req, res) => {
  // Cek apakah request untuk file static (css, js, assets)
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|json)$/)) {
    res.status(404).send('File not found');
  } else {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${isVercel ? 'Vercel (Production)' : 'Local Development'}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
  console.log(`\n📋 Available routes:`);
  console.log(`   - GET  /api/tugas`);
  console.log(`   - POST /api/tugas`);
  console.log(`   - DELETE /api/tugas/:id`);
  console.log(`   - POST /api/jawaban`);
  console.log(`   - GET  /api/jawaban/:tugasId`);
  console.log(`   - GET  /api/jawaban/all`);
  console.log(`   - GET  /api/pengumuman`);
  console.log(`   - POST /api/pengumuman`);
  console.log(`   - DELETE /api/pengumuman/:id`);
  console.log(`   - PUT  /api/pengumuman/:id`);
  console.log(`   - GET  /api/jadwal`);
  console.log(`   - GET  /api/jadwal/tugas/:tugasId`);
  console.log(`   - POST /api/jadwal`);
  console.log(`   - DELETE /api/jadwal/:id`);
  console.log(`\n🌐 Frontend: http://localhost:${PORT}`);
});

// Export untuk Vercel
export default app;