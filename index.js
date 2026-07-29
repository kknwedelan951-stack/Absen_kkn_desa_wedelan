const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const DATA_DIR = path.join(__dirname);
const DB_PATH = path.join(DATA_DIR, 'data.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    no INTEGER,
    nim TEXT,
    nama TEXT,
    prodi TEXT,
    hp TEXT,
    kelompok TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    tanggal TEXT,
    nama TEXT,
    nim TEXT,
    prodi TEXT,
    kegiatan TEXT,
    shift TEXT,
    status TEXT,
    lokasi TEXT
  )`);
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/members', (req, res) => {
  db.all('SELECT * FROM members ORDER BY no ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', error: err.message });
    res.json({ status: 'ok', data: rows });
  });
});

app.get('/api/logs', (req, res) => {
  db.all('SELECT * FROM logs ORDER BY ROWID DESC LIMIT 2000', [], (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', error: err.message });
    res.json({ status: 'ok', data: rows });
  });
});

app.post('/api/submit', (req, res) => {
  const { nama, nim, prodi, kegiatan, shift, status, lokasi } = req.body;
  if (!nama || !nim) return res.status(400).json({ status: 'error', error: 'Missing nama or nim' });
  const id = Date.now().toString();
  const timestamp = new Date().toLocaleString('id-ID');
  const tanggal = req.body.tanggal || new Date().toLocaleDateString('id-ID');
  const stmt = db.prepare(`INSERT INTO logs (id,timestamp,tanggal,nama,nim,prodi,kegiatan,shift,status,lokasi) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  stmt.run(id, timestamp, tanggal, nama, nim, prodi || '', kegiatan || '', shift || '', status || '', lokasi || '-', function (err) {
    if (err) return res.status(500).json({ status: 'error', error: err.message });
    res.json({ status: 'ok', id });
  });
});

app.post('/api/addMember', (req, res) => {
  const { nama, nim, prodi, hp } = req.body;
  if (!nama || !nim) return res.status(400).json({ status: 'error', error: 'Missing nama or nim' });
  const id = Date.now().toString();
  db.get('SELECT MAX(no) as maxNo FROM members', [], (err, row) => {
    const nextNo = (row && row.maxNo) ? row.maxNo + 1 : 1;
    const stmt = db.prepare(`INSERT INTO members (id,no,nim,nama,prodi,hp,kelompok) VALUES (?,?,?,?,?,?,?)`);
    stmt.run(id, nextNo, nim, nama, prodi || '', hp || '-', 'Kelompok KKN', function (err) {
      if (err) return res.status(500).json({ status: 'error', error: err.message });
      res.json({ status: 'ok', id });
    });
  });
});

const PORT = process.env.PORT || 7777;
app.listen(PORT, () => {
  console.log(`KKN attendance server listening on port ${PORT}`);
});
