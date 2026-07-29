/**
 * ==============================================================================
 * SISTEM ABSENSI KKN DESA WEDELAN 2026
 * Google Apps Script Web App - All-in-One
 *
 * doGet()  → Menampilkan Form Absensi HTML (tujuan QR Code)
 * doPost() → Menerima & menyimpan data absensi ke Google Sheets
 *
 * CARA DEPLOY:
 * 1. Buka Spreadsheet → Ekstensi → Apps Script
 * 2. Tempel seluruh kode ini, lalu Ctrl+S
 * 3. Klik "Deploy" → "New Deployment"
 * 4. Type: Web App | Execute as: Me | Who has access: Anyone
 * 5. Klik Deploy → Authorize → SALIN URL Web App
 * 6. URL itulah yang digunakan sebagai tujuan QR Code!
 * ==============================================================================
 */

const SHEET_ID    = '16rp1nNW21Tbq-ct0adzWVk2PXk71fH1ViDmbQ54Nz5o';
const SHEET_ABSEN = 'Absensi KKN';
const SHEET_DB    = 'Database Peserta';
const SHEET_REKAP = 'Rekap Kehadiran';

// ─────────────────────────────────────────────────────────────────────────────
// doGet — Sajikan Form Absensi HTML (ini yang dibuka saat scan QR)
// ─────────────────────────────────────────────────────────────────────────────
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === 'getMembers') return jsonResponse(getMembers());
  if (action === 'getLogs')    return jsonResponse(getLogs());
  if (action === 'getRekap')   return jsonResponse(getRekap());
  if (action === 'init')       return jsonResponse(initSheets());

  // Default: tampilkan form absensi HTML
  return HtmlService.createHtmlOutput(buildFormHtml())
    .setTitle('Absensi KKN Desa Wedelan 2026')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─────────────────────────────────────────────────────────────────────────────
// doPost — Terima data absensi & simpan ke Sheets
// ─────────────────────────────────────────────────────────────────────────────
function doPost(e) {
  let result;
  try {
    const data   = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'submitAbsensi') result = submitAbsensi(data);
    else if (action === 'addMember')  result = addMember(data);
    else if (action === 'init')       result = initSheets();
    else result = { status: 'error', message: 'Action tidak dikenal: ' + action };
  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }
  return jsonResponse(result);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper JSON response dengan CORS header
// ─────────────────────────────────────────────────────────────────────────────
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────────────────────────
// INISIALISASI SHEET
// ─────────────────────────────────────────────────────────────────────────────
function initSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  // Sheet Database Peserta
  let dbSheet = ss.getSheetByName(SHEET_DB);
  if (!dbSheet) dbSheet = ss.insertSheet(SHEET_DB);
  if (dbSheet.getLastRow() === 0) {
    const h = ['No','Nama Lengkap','NIM','Program Studi','Kelompok KKN','Nomor HP'];
    dbSheet.getRange(1,1,1,6).setValues([h]).setFontWeight('bold')
      .setBackground('#1e3a8a').setFontColor('#ffffff');
    const rows = [
      [1,'Sandy Irham Ramadhani','231110003585','Manajemen','KKN Desa Wedelan 2026','0895412663995'],
      [2,'Nabila Nathania Nafia','231110003695','Manajemen','KKN Desa Wedelan 2026','085867837828'],
      [3,'Ela Indriani','231110003640','Manajemen','KKN Desa Wedelan 2026','087865948676'],
      [4,'Nawa Sabillah','231110003683','Manajemen','KKN Desa Wedelan 2026','089530838336'],
      [5,'Aulia Fatma Sari','231330001356','PGSD','KKN Desa Wedelan 2026','089501655537'],
      [6,'Adina Nisa Alhaq','231330001417','PGSD','KKN Desa Wedelan 2026','087821010226'],
      [7,'Cykha Fadilla Rivanny','231330001419','PGSD','KKN Desa Wedelan 2026','0895360785224'],
      [8,'Diana Atik Susanti','231330001394','PGSD','KKN Desa Wedelan 2026','0895413447807'],
      [9,'Arum Desy Ariyanti','231240001395','Teknik Informatika','KKN Desa Wedelan 2026','081804067087'],
      [10,'Muhammad Syahrur','231240001362','Teknik Informatika','KKN Desa Wedelan 2026','081226545344'],
      [11,'Farel Muhammad Revansa Revikasa','231210000465','Teknik Industri','KKN Desa Wedelan 2026','085866015055'],
      [12,'Adam Dimas Setiansyah','231120002740','Akuntansi','KKN Desa Wedelan 2026','088233167601'],
      [13,'Muhammad Hisyam Annabil Muwaffaq','231120002678','Akuntansi','KKN Desa Wedelan 2026','081226723810'],
      [14,'Aji Jaya Kusuma','231310005055','PAI','KKN Desa Wedelan 2026','085755070965'],
      [15,'Taqiyyatur Rohimah','231310004951','PAI','KKN Desa Wedelan 2026','087845243583']
    ];
    dbSheet.getRange(2,1,rows.length,6).setValues(rows);
    for(let i=1;i<=6;i++) dbSheet.autoResizeColumn(i);
  }

  // Sheet Absensi KKN
  let absenSheet = ss.getSheetByName(SHEET_ABSEN);
  if (!absenSheet) {
    absenSheet = ss.insertSheet(SHEET_ABSEN);
    const h = ['Timestamp','Nama Lengkap','NIM','Program Studi','Kegiatan','Shift','Status','Koordinat GPS'];
    absenSheet.getRange(1,1,1,8).setValues([h]).setFontWeight('bold')
      .setBackground('#1e3a8a').setFontColor('#ffffff');
    for(let i=1;i<=8;i++) absenSheet.autoResizeColumn(i);
  }

  // Sheet Rekap
  let rekapSheet = ss.getSheetByName(SHEET_REKAP);
  if (!rekapSheet) rekapSheet = ss.insertSheet(SHEET_REKAP);

  return { status:'ok', message:'✅ Sheet berhasil diinisialisasi! Data 15 peserta sudah tersedia.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT ABSENSI
// ─────────────────────────────────────────────────────────────────────────────
function submitAbsensi(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_ABSEN);
  if (!sheet) { initSheets(); sheet = ss.getSheetByName(SHEET_ABSEN); }

  const now = new Date();
  sheet.appendRow([now, data.nama||'', data.nim||'', data.prodi||'',
                   data.kegiatan||'', data.shift||'', data.status||'', data.lokasi||'Posko KKN']);

  // Update rekap otomatis
  try { updateRekap(ss); } catch(e) {}

  return { status:'ok', message:`✅ Absensi ${data.nama} berhasil dicatat!` };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET MEMBERS
// ─────────────────────────────────────────────────────────────────────────────
function getMembers() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_DB);
  if (!sheet || sheet.getLastRow() < 2) return { status:'ok', data:[] };
  const rows = sheet.getRange(2,1,sheet.getLastRow()-1,6).getValues();
  const data = rows.filter(r=>r[1]).map((r,i)=>({
    id:String(r[0]||i+1), no:r[0]||i+1,
    nama:r[1].toString().trim(), nim:r[2].toString().trim(),
    prodi:r[3].toString().trim(), kelompok:r[4].toString().trim(),
    hp:r[5].toString().trim()
  }));
  return { status:'ok', data };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET LOGS
// ─────────────────────────────────────────────────────────────────────────────
function getLogs() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_ABSEN);
  if (!sheet || sheet.getLastRow() < 2) return { status:'ok', data:[] };
  const rows = sheet.getRange(2,1,sheet.getLastRow()-1,8).getValues();
  const data = rows.filter(r=>r[0]).map((r,i)=>({
    id:String(i+1),
    timestamp: r[0] instanceof Date
      ? Utilities.formatDate(r[0],'Asia/Jakarta','dd/MM/yyyy HH:mm')
      : r[0].toString(),
    nama:r[1].toString(), nim:r[2].toString(), prodi:r[3].toString(),
    kegiatan:r[4].toString(), shift:r[5].toString(),
    status:r[6].toString(), lokasi:r[7].toString()
  })).reverse();
  return { status:'ok', data };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET REKAP
// ─────────────────────────────────────────────────────────────────────────────
function getRekap() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_REKAP);
  if (!sheet || sheet.getLastRow() < 2) return { status:'ok', data:[] };
  const rows = sheet.getRange(2,1,sheet.getLastRow()-1,10).getValues();
  return { status:'ok', data: rows.filter(r=>r[0]) };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD MEMBER
// ─────────────────────────────────────────────────────────────────────────────
function addMember(data) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_DB);
  if (!sheet) return { status:'error', message:'Sheet tidak ditemukan' };
  const no = sheet.getLastRow();
  sheet.appendRow([no, data.nama, data.nim, data.prodi||'', data.kelompok||'KKN Desa Wedelan 2026', data.hp||'']);
  return { status:'ok', message:`✅ Anggota ${data.nama} ditambahkan!` };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE REKAP
// ─────────────────────────────────────────────────────────────────────────────
function updateRekap(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SHEET_ID);
  const dbSheet    = ss.getSheetByName(SHEET_DB);
  const absenSheet = ss.getSheetByName(SHEET_ABSEN);
  if (!dbSheet || !absenSheet) return;

  let rekapSheet = ss.getSheetByName(SHEET_REKAP);
  if (!rekapSheet) rekapSheet = ss.insertSheet(SHEET_REKAP);
  rekapSheet.clearContents();

  const h = ['No','NIM','Nama Lengkap','Program Studi','Hadir','Izin','Sakit','Total','Persentase (%)','Status'];
  rekapSheet.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold')
    .setBackground('#1e3a8a').setFontColor('#ffffff');

  const dbRows    = dbSheet.getLastRow()>1 ? dbSheet.getRange(2,1,dbSheet.getLastRow()-1,6).getValues() : [];
  const absenRows = absenSheet.getLastRow()>1 ? absenSheet.getRange(2,1,absenSheet.getLastRow()-1,8).getValues() : [];

  const c = {};
  absenRows.forEach(r => {
    const nama=r[1].toString().trim(), st=r[6].toString().trim();
    if (!nama) return;
    if (!c[nama]) c[nama]={H:0,I:0,S:0};
    if(st==='Hadir')c[nama].H++; else if(st==='Izin')c[nama].I++; else if(st==='Sakit')c[nama].S++;
  });

  const rows = dbRows.map((r,i) => {
    const nama=r[1].toString().trim(), nim=r[2].toString(), prodi=r[3].toString();
    const cnt=c[nama]||{H:0,I:0,S:0};
    const total=cnt.H+cnt.I+cnt.S;
    const pct=total>0?Number(((cnt.H/total)*100).toFixed(1)):0;
    const ev=pct>=85?'🟢 Sangat Baik':pct>=75?'🟡 Baik':total>0?'🔴 Perlu Perhatian':'⚪ Belum Absen';
    return [r[0]||i+1,nim,nama,prodi,cnt.H,cnt.I,cnt.S,total,pct,ev];
  });

  if (rows.length>0) {
    rekapSheet.getRange(2,1,rows.length,h.length).setValues(rows);
    rekapSheet.getRange(2,9,rows.length,1).setNumberFormat('0.0"%"');
    for(let i=1;i<=h.length;i++) rekapSheet.autoResizeColumn(i);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// onOpen — Menu Kustom
// ─────────────────────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚡ Absensi KKN Wedelan')
    .addItem('🔧 Inisialisasi Sheet & Data Peserta', 'initSheets')
    .addItem('📊 Update Rekap Kehadiran', 'updateRekap')
    .addToUi();
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD FORM HTML — Ini yang ditampilkan saat scan QR Code
// ─────────────────────────────────────────────────────────────────────────────
function buildFormHtml() {
  const MEMBERS = [
    {nama:'Sandy Irham Ramadhani',nim:'231110003585',prodi:'Manajemen'},
    {nama:'Nabila Nathania Nafia',nim:'231110003695',prodi:'Manajemen'},
    {nama:'Ela Indriani',nim:'231110003640',prodi:'Manajemen'},
    {nama:'Nawa Sabillah',nim:'231110003683',prodi:'Manajemen'},
    {nama:'Aulia Fatma Sari',nim:'231330001356',prodi:'PGSD'},
    {nama:'Adina Nisa Alhaq',nim:'231330001417',prodi:'PGSD'},
    {nama:'Cykha Fadilla Rivanny',nim:'231330001419',prodi:'PGSD'},
    {nama:'Diana Atik Susanti',nim:'231330001394',prodi:'PGSD'},
    {nama:'Arum Desy Ariyanti',nim:'231240001395',prodi:'Teknik Informatika'},
    {nama:'Muhammad Syahrur',nim:'231240001362',prodi:'Teknik Informatika'},
    {nama:'Farel Muhammad Revansa Revikasa',nim:'231210000465',prodi:'Teknik Industri'},
    {nama:'Adam Dimas Setiansyah',nim:'231120002740',prodi:'Akuntansi'},
    {nama:'Muhammad Hisyam Annabil Muwaffaq',nim:'231120002678',prodi:'Akuntansi'},
    {nama:'Aji Jaya Kusuma',nim:'231310005055',prodi:'PAI'},
    {nama:'Taqiyyatur Rohimah',nim:'231310004951',prodi:'PAI'}
  ];

  const memberOptions = MEMBERS.map(m =>
    `<option value="${m.nama}" data-nim="${m.nim}" data-prodi="${m.prodi}">${m.nama}</option>`
  ).join('');

  // Dapatkan URL Web App saat ini (untuk digunakan sebagai endpoint POST)
  const webAppUrl = ScriptApp.getService().getUrl();

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Absensi KKN Desa Wedelan 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--p:#1d4ed8;--pd:#1e3a8a;--s:#10b981;--bg:#f0f4ff;--card:#fff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0;}
*{box-sizing:border-box;margin:0;padding:0;font-family:'Plus Jakarta Sans',sans-serif;}
body{background:linear-gradient(160deg,#1e3a8a 0%,#2563eb 55%,#3b82f6 100%);min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:0 0 2rem;}
.hdr{width:100%;padding:1.5rem 1.25rem 1rem;text-align:center;color:#fff;}
.hdr-logo{font-size:3rem;display:block;margin-bottom:.4rem;}
.hdr h1{font-size:1.3rem;font-weight:800;margin-bottom:.2rem;}
.hdr p{font-size:.82rem;opacity:.85;font-weight:500;}
.card{background:#fff;border-radius:1.5rem 1.5rem 1rem 1rem;width:100%;max-width:480px;margin:0 .75rem;box-shadow:0 24px 48px rgba(0,0,0,.18);}
.stripe{height:5px;background:linear-gradient(90deg,#1e3a8a,#2563eb,#06b6d4);border-radius:1.5rem 1.5rem 0 0;}
.body{padding:1.5rem 1.5rem 2rem;}
.ttl{font-size:1.05rem;font-weight:700;color:#1e3a8a;margin-bottom:1.25rem;display:flex;align-items:center;gap:.5rem;}
.fg{margin-bottom:1.1rem;}
label{display:block;font-size:.8rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.4rem;}
select,input{width:100%;padding:.85rem 1rem;border:1.5px solid #e2e8f0;border-radius:.65rem;font-size:.95rem;outline:none;color:#0f172a;background:#f8fafc;transition:all .2s;font-family:inherit;-webkit-appearance:none;appearance:none;}
select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .75rem center;background-size:1.2rem;padding-right:2.5rem;}
select:focus,input:focus{border-color:#1d4ed8;background:#fff;box-shadow:0 0 0 3px rgba(29,78,216,.12);}
input[readonly]{background:#f1f5f9;color:#64748b;cursor:not-allowed;}
.pills{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem;}
.pill{padding:.65rem .5rem;border:2px solid #e2e8f0;border-radius:.6rem;text-align:center;cursor:pointer;font-size:.82rem;font-weight:700;transition:all .15s;background:#f8fafc;user-select:none;}
.ph{border-color:#10b981;background:#d1fae5;color:#065f46;}
.pi{border-color:#f59e0b;background:#fef3c7;color:#92400e;}
.ps{border-color:#ef4444;background:#fee2e2;color:#991b1b;}
.gps-row{display:flex;gap:.5rem;}
.gps-row input{flex:1;}
.btn-gps{padding:.85rem .9rem;border:1.5px solid #e2e8f0;border-radius:.65rem;background:#f1f5f9;cursor:pointer;font-size:1rem;transition:all .2s;font-family:inherit;font-weight:600;color:#334155;}
.btn-sub{width:100%;padding:1rem;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;border:none;border-radius:.75rem;font-size:1rem;font-weight:800;cursor:pointer;margin-top:1.5rem;box-shadow:0 4px 16px rgba(29,78,216,.35);transition:all .2s;font-family:inherit;}
.btn-sub:hover{transform:translateY(-1px);}
.btn-sub:disabled{background:#94a3b8;cursor:not-allowed;transform:none;box-shadow:none;}
.succ{display:none;text-align:center;padding:2rem 1.5rem;}
.succ-ico{font-size:4.5rem;display:block;margin-bottom:1rem;animation:bonce .6s ease;}
@keyframes bonce{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
.succ h2{font-size:1.4rem;font-weight:800;color:#065f46;margin-bottom:.5rem;}
.succ p{color:#64748b;font-size:.9rem;margin-bottom:1.5rem;line-height:1.6;}
.succ-dtl{background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:.75rem;padding:1rem;text-align:left;font-size:.85rem;color:#15803d;margin-bottom:1.25rem;line-height:2;}
.btn-back{display:inline-block;padding:.75rem 2rem;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;border:none;border-radius:.65rem;font-weight:700;font-size:.9rem;cursor:pointer;font-family:inherit;}
.load{display:none;position:fixed;inset:0;background:rgba(15,23,42,.6);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:99;}
.load-box{background:#fff;border-radius:1rem;padding:2rem 2.5rem;text-align:center;}
.spin{width:40px;height:40px;border:4px solid #e2e8f0;border-top-color:#1d4ed8;border-radius:50%;animation:sp .7s linear infinite;margin:0 auto 1rem;}
@keyframes sp{to{transform:rotate(360deg)}}
.load-box p{font-weight:600;color:#64748b;font-size:.9rem;}
.gps-info{font-size:.75rem;color:#64748b;margin-top:.3rem;display:block;}
footer{color:rgba(255,255,255,.6);font-size:.75rem;text-align:center;padding:1.25rem;}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
</style>
</head>
<body>
<div class="load" id="ld"><div class="load-box"><div class="spin"></div><p>Menyimpan absensi...</p></div></div>
<div class="hdr">
  <span class="hdr-logo">📋</span>
  <h1>Absensi KKN Desa Wedelan</h1>
  <p>Kelompok KKN 2026 • Scan &amp; Absen Real-Time</p>
</div>
<div class="card">
  <div class="stripe"></div>
  <div class="body">
    <div id="fs">
      <div class="ttl">📝 Formulir Absensi Harian</div>
      <form id="frm" onsubmit="kirim(event)" novalidate>
        <div class="fg"><label>👤 Nama Lengkap</label>
          <select id="sNama" required onchange="onNama()">
            <option value="">-- Pilih Nama Anda --</option>
            ${memberOptions}
          </select>
        </div>
        <div class="fg"><label>🎓 NIM</label><input type="text" id="iNim" placeholder="Otomatis terisi" readonly></div>
        <div class="fg"><label>📚 Program Studi</label><input type="text" id="iProdi" placeholder="Otomatis terisi" readonly></div>
        <div class="fg"><label>📌 Kegiatan Hari Ini</label>
          <input type="text" id="iKeg" placeholder="Contoh: Mengajar di SD Wedelan, Rapat Posko..." required maxlength="100">
        </div>
        <div class="fg"><label>🕐 Shift Absensi</label>
          <select id="sShift" required>
            <option value="Masuk">🌅 Masuk Pagi (07:30)</option>
            <option value="Pulang">🌆 Pulang Sore (16:00)</option>
          </select>
        </div>
        <div class="fg"><label>📊 Status Kehadiran</label>
          <div class="pills">
            <div class="pill ph" id="pH" onclick="setSt('Hadir')">✅ Hadir</div>
            <div class="pill" id="pI" onclick="setSt('Izin')">📋 Izin</div>
            <div class="pill" id="pS" onclick="setSt('Sakit')">🏥 Sakit</div>
          </div>
          <input type="hidden" id="iSt" value="Hadir">
        </div>
        <div class="fg"><label>📍 Lokasi GPS (Opsional)</label>
          <div class="gps-row">
            <input type="text" id="iLok" placeholder="Klik tombol deteksi" readonly>
            <button type="button" class="btn-gps" onclick="gps()">📍 Deteksi</button>
          </div>
          <span class="gps-info" id="gpsInfo">Klik tombol untuk mendeteksi lokasi Anda</span>
        </div>
        <button type="submit" class="btn-sub" id="bSub">✅ Kirim Absensi Sekarang</button>
      </form>
    </div>
    <div id="ss" class="succ">
      <span class="succ-ico">🎉</span>
      <h2>Absensi Berhasil!</h2>
      <p>Data kehadiran Anda telah dicatat.<br>Terima kasih sudah absen tepat waktu!</p>
      <div class="succ-dtl" id="sDtl"></div>
      <button class="btn-back" onclick="reset()">🔄 Absen Lagi</button>
    </div>
  </div>
</div>
<footer>KKN Desa Wedelan 2026 • Sistem Absensi QR Code</footer>

<script>
const WEB_APP_URL = '${webAppUrl}';

function onNama(){
  const s=document.getElementById('sNama'),o=s.options[s.selectedIndex];
  document.getElementById('iNim').value=o?.dataset?.nim||'';
  document.getElementById('iProdi').value=o?.dataset?.prodi||'';
}
function setSt(v){
  document.getElementById('iSt').value=v;
  document.getElementById('pH').className='pill'+(v==='Hadir'?' ph':'');
  document.getElementById('pI').className='pill'+(v==='Izin'?' pi':'');
  document.getElementById('pS').className='pill'+(v==='Sakit'?' ps':'');
}
function gps(){
  const info=document.getElementById('gpsInfo'),inp=document.getElementById('iLok');
  info.textContent='📡 Mendeteksi lokasi...';
  if(!navigator.geolocation){info.textContent='❌ GPS tidak didukung.';return;}
  navigator.geolocation.getCurrentPosition(p=>{
    inp.value=p.coords.latitude.toFixed(6)+', '+p.coords.longitude.toFixed(6);
    info.textContent='✅ Akurasi: '+Math.round(p.coords.accuracy)+'m';
  },()=>{
    info.textContent='⚠️ GPS ditolak. Menggunakan lokasi posko.';
    inp.value='Posko KKN Desa Wedelan';
  },{timeout:10000,enableHighAccuracy:true});
}
function ts(){
  const n=new Date();
  return n.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+
         n.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
}
async function kirim(e){
  e.preventDefault();
  const nama=document.getElementById('sNama').value;
  const keg=document.getElementById('iKeg').value.trim();
  if(!nama){shake('sNama');return;}
  if(!keg){shake('iKeg');return;}
  const payload={
    action:'submitAbsensi',
    nama, nim:document.getElementById('iNim').value,
    prodi:document.getElementById('iProdi').value,
    kegiatan:keg, shift:document.getElementById('sShift').value,
    status:document.getElementById('iSt').value,
    lokasi:document.getElementById('iLok').value||'Posko KKN Desa Wedelan'
  };
  document.getElementById('ld').style.display='flex';
  document.getElementById('bSub').disabled=true;
  let ok=false;
  try{
    const r=await fetch(WEB_APP_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(payload)});
    const j=await r.json();
    ok=j.status==='ok';
  }catch(err){ok=false;}
  document.getElementById('ld').style.display='none';
  document.getElementById('sDtl').innerHTML=
    '<b>👤 Nama:</b> '+nama+'<br>'+
    '<b>🎓 NIM:</b> '+payload.nim+'<br>'+
    '<b>📌 Kegiatan:</b> '+payload.kegiatan+'<br>'+
    '<b>🕐 Shift:</b> '+payload.shift+'<br>'+
    '<b>📊 Status:</b> '+payload.status+'<br>'+
    '<b>⏰ Waktu:</b> '+ts()+'<br>'+
    '<b>☁️ Tersimpan:</b> '+(ok?'✅ Google Sheets':'⚠️ Gagal, coba lagi');
  document.getElementById('fs').style.display='none';
  document.getElementById('ss').style.display='block';
}
function reset(){
  document.getElementById('ss').style.display='none';
  document.getElementById('fs').style.display='block';
  document.getElementById('frm').reset();
  document.getElementById('iNim').value='';
  document.getElementById('iProdi').value='';
  document.getElementById('bSub').disabled=false;
  setSt('Hadir');
}
function shake(id){
  const el=document.getElementById(id);
  el.style.borderColor='#ef4444';el.style.animation='shake .4s ease';el.focus();
  setTimeout(()=>{el.style.animation='';el.style.borderColor='';},500);
}
window.onload=function(){
  setSt('Hadir');
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(p=>{
      document.getElementById('iLok').value=p.coords.latitude.toFixed(6)+', '+p.coords.longitude.toFixed(6);
      document.getElementById('gpsInfo').textContent='✅ Lokasi terdeteksi otomatis';
    },()=>{
      document.getElementById('iLok').value='Posko KKN Desa Wedelan';
    },{timeout:6000});
  }
};
</script>
</body>
</html>`;
}
