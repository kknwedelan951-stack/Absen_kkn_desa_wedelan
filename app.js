/**
 * ==============================================================================
 * SISTEM ABSENSI KKN BERBASIS QR CODE - APPLICATION ENGINE
 * Berjalan penuh melalui browser dengan penyimpanan lokal (localStorage)
 * ==============================================================================
 */

// ============================================================
// ⚙️ KONFIGURASI - tidak perlu URL Google Sheets untuk mode dasar
// ============================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbycTLPuYGjJDvO7Ny4QoSIn8TJqdZaMhK41FUYs8s7Gn5wesBqaYy6-mHvLBbC6Qzgu/exec';

// ============================================================
// MODE: gunakan mode online jika API Google Apps Script tersedia
// ============================================================
let APP_MODE = 'online';

// ============================================================
// SELF-HOSTED BACKEND (opsional)
// Jika Anda men-deploy template `server/` di sini, set URL ke BASE API (tanpa trailing slash),
// contoh: 'https://mydomain.com' atau 'https://myapp.up.railway.app'
// Aplikasi akan menggunakan endpoint `/api/members`, `/api/logs`, `/api/submit` dll.
// ============================================================
const SELF_HOSTED_URL = '';

// ============================================================
// DATA DEFAULT (FALLBACK offline)
// ============================================================
const DEFAULT_MEMBERS = [
  { id: '1', no: 1, nim: '231110003585', nama: 'Sandy Irham Ramadhani', prodi: 'Manajemen', hp: '0895412663995', kelompok: 'Kelompok KKN' },
  { id: '2', no: 2, nim: '231110003695', nama: 'Nabila Nathania Nafia', prodi: 'Manajemen', hp: '085867837828', kelompok: 'Kelompok KKN' },
  { id: '3', no: 3, nim: '231110003640', nama: 'Ela Indriani', prodi: 'Manajemen', hp: '087865948676', kelompok: 'Kelompok KKN' },
  { id: '4', no: 4, nim: '231110003683', nama: 'Nawa Sabillah', prodi: 'Manajemen', hp: '089530838336', kelompok: 'Kelompok KKN' },
  { id: '5', no: 5, nim: '231330001356', nama: 'Aulia Fatma Sari', prodi: 'PGSD', hp: '089501655537', kelompok: 'Kelompok KKN' },
  { id: '6', no: 6, nim: '231330001417', nama: 'Adina Nisa Alhaq', prodi: 'PGSD', hp: '087821010226', kelompok: 'Kelompok KKN' },
  { id: '7', no: 7, nim: '231330001419', nama: 'Cykha Fadilla Rivanny', prodi: 'PGSD', hp: '0895360785224', kelompok: 'Kelompok KKN' },
  { id: '8', no: 8, nim: '231330001394', nama: 'Diana Atik Susanti', prodi: 'PGSD', hp: '0895413447807', kelompok: 'Kelompok KKN' },
  { id: '9', no: 9, nim: '231240001395', nama: 'Arum Desy Ariyanti', prodi: 'Teknik Informatika', hp: '081804067087', kelompok: 'Kelompok KKN' },
  { id: '10', no: 10, nim: '231240001362', nama: 'Muhammad Syahrur', prodi: 'Teknik Informatika', hp: '081226545344', kelompok: 'Kelompok KKN' },
  { id: '11', no: 11, nim: '231210000465', nama: 'Farel Muhammad Revansa Revikasa', prodi: 'Teknik Industri', hp: '085866015055', kelompok: 'Kelompok KKN' },
  { id: '12', no: 12, nim: '231120002740', nama: 'Adam Dimas Setiansyah', prodi: 'Akuntansi', hp: '088233167601', kelompok: 'Kelompok KKN' },
  { id: '13', no: 13, nim: '231120002678', nama: 'Muhammad Hisyam Annabil Muwaffaq', prodi: 'Akuntansi', hp: '081226723810', kelompok: 'Kelompok KKN' },
  { id: '14', no: 14, nim: '231310005055', nama: 'Aji Jaya Kusuma', prodi: 'PAI', hp: '085755070965', kelompok: 'Kelompok KKN' },
  { id: '15', no: 15, nim: '231310004951', nama: 'Taqiyyatur Rohimah', prodi: 'PAI', hp: '087845243583', kelompok: 'Kelompok KKN' }
];

const STORAGE_KEYS = {
  MEMBERS: 'kkn_members_db_v3',
  ATTENDANCE: 'kkn_attendance_logs_v3'
};
const ATTENDANCE_SYNC_KEY = 'kkn_attendance_sync_v1';

// STATE
let members = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS)) || DEFAULT_MEMBERS;
let logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
let logSearchQuery = '';
let isLoading = false;

// ============================================================
// API HELPER - Komunikasi ke Google Apps Script
// ============================================================
async function apiGet(action) {
  try {
    if (SELF_HOSTED_URL) {
      let url = '';
      if (action === 'getMembers') url = `${SELF_HOSTED_URL}/api/members?t=${Date.now()}`;
      else if (action === 'getLogs') url = `${SELF_HOSTED_URL}/api/logs?t=${Date.now()}`;
      else url = `${SELF_HOSTED_URL}?action=${action}&t=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      return await res.json();
    }
    const url = `${GOOGLE_SCRIPT_URL}?action=${action}&t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

async function apiPost(payload) {
  if (SELF_HOSTED_URL) {
    try {
      if (payload.action === 'submitAbsensi') {
        const body = JSON.stringify(payload);
        const res = await fetch(`${SELF_HOSTED_URL}/api/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return await res.json();
      }
      if (payload.action === 'addMember') {
        const body = JSON.stringify(payload);
        const res = await fetch(`${SELF_HOSTED_URL}/api/addMember`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return await res.json();
      }
      // fallback: post raw payload to base
      const res = await fetch(SELF_HOSTED_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  }
  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return await res.json();
}

// ============================================================
// SHOW TOAST NOTIFICATION
// ============================================================
function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || '📢'} ${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================
// SHOW/HIDE LOADING
// ============================================================
function setLoading(show) {
  isLoading = show;
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

// ============================================================
// UPDATE STATUS BADGE KONEKSI
// ============================================================
function updateConnectionStatus(connected) {
  const badge = document.getElementById('connectionBadge');
  if (!badge) return;
  badge.innerHTML = '⚪ Mode Offline (browser/localStorage)';
  badge.className = 'conn-badge conn-offline';
}

// ============================================================
// SAVE OFFLINE
// ============================================================
function saveOffline() {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(logs));
  localStorage.setItem(ATTENDANCE_SYNC_KEY, Date.now().toString());
}

function syncLogsFromStorage() {
  try {
    const storedLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    if (JSON.stringify(storedLogs) !== JSON.stringify(logs)) {
      logs = storedLogs;
      renderDashboard();
      renderLogsTable();
    }
  } catch (err) {
    console.warn('Gagal sinkronisasi data absensi:', err);
  }
}

// ============================================================
// LOAD DATA (online atau offline)
// ============================================================
async function loadAllData() {
  setLoading(true);
  try {
    if (APP_MODE === 'online') {
      const [membersRes, logsRes] = await Promise.all([
        apiGet('getMembers'),
        apiGet('getLogs')
      ]);

      if (membersRes.status === 'ok' && membersRes.data.length > 0) {
        members = membersRes.data;
        saveOffline();
        updateConnectionStatus(true);
      } else {
        updateConnectionStatus(false);
        APP_MODE = 'offline';
      }

      if (logsRes.status === 'ok') {
        logs = logsRes.data;
        saveOffline();
      }
    } else {
      updateConnectionStatus(false);
    }
  } catch (err) {
    console.warn('Gagal terhubung ke Google Sheets, menggunakan data offline:', err);
    updateConnectionStatus(false);
    APP_MODE = 'offline';
  }
  setLoading(false);
  renderDashboard();
  renderLogsTable();
  renderMembersTable();
  populateDropdown();
}

// ============================================================
// REFRESH DATA dari Google Sheets
// ============================================================
async function refreshFromSheets() {
  showToast('Memuat data dari browser...', 'info', 1500);
  await loadAllData();
  showToast('Data berhasil diperbarui!', 'success');
}

// ============================================================
// BATASAN RENTANG ABSENSI
// ============================================================
const ATTENDANCE_START_DATE = new Date('2026-07-27T00:00:00');
const ATTENDANCE_END_DATE = new Date('2026-09-05T23:59:59');

function getDateOnly(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isAttendanceWindowOpen(targetDate = new Date()) {
  const currentDate = getDateOnly(targetDate);
  const startDate = getDateOnly(ATTENDANCE_START_DATE);
  const endDate = getDateOnly(ATTENDANCE_END_DATE);
  return currentDate >= startDate && currentDate <= endDate;
}

function updateAttendanceWindowNotice() {
  const notice = document.getElementById('attendanceWindowNotice');
  const button = document.getElementById('submitAttendanceButton');
  if (!notice && !button) return;

  const isOpen = isAttendanceWindowOpen();
  if (notice) {
    notice.innerHTML = isOpen
      ? '💡 Absensi dibuka mulai 27 Juli 2026 sampai 5 September 2026. Silakan isi form sesuai jadwal.'
      : '⛔ Saat ini di luar rentang absensi. Absensi hanya bisa dilakukan dari 27 Juli 2026 sampai 5 September 2026.';
    notice.style.borderLeftColor = isOpen ? '#2563eb' : '#ef4444';
    notice.style.color = isOpen ? '#1e3a8a' : '#b91c1c';
  }
  if (button) button.disabled = !isOpen;
}

// ============================================================
// SUBMIT ABSENSI
// ============================================================
async function submitAttendance(e) {
  e.preventDefault();
  const nama = document.getElementById('selectNamaPeserta').value;
  const nim = document.getElementById('inputNim').value;
  const prodi = document.getElementById('inputProdi').value;
  const kegiatan = document.getElementById('inputKegiatan').value;
  const shift = document.getElementById('selectShift').value;
  const status = document.getElementById('selectStatus').value;
  const lokasi = document.getElementById('inputLokasiGps').value || 'Posko KKN';

  if (!isAttendanceWindowOpen()) {
    showToast('Absensi hanya dibuka dari 27 Juli 2026 sampai 5 September 2026.', 'warning');
    return;
  }

  const tanggal = document.getElementById('inputTanggalAbsensi').value.trim();
  if (!tanggal) {
    showToast('Harap isi tanggal absensi terlebih dahulu!', 'warning');
    return;
  }

  if (!nama) {
    showToast('Harap pilih nama anggota terlebih dahulu!', 'warning');
    return;
  }

  const now = new Date();
  const timestamp = now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const newLog = {
    id: Date.now().toString(),
    timestamp,
    tanggal,
    nama, nim, prodi, kegiatan, shift, status, lokasi
  };

  setLoading(true);

  if (APP_MODE === 'online') {
    try {
      const result = await apiPost({
        action: 'submitAbsensi',
        nama, nim, prodi, kegiatan, shift, status, lokasi
      });
      if (result.status === 'ok') {
        showToast(`Absensi ${nama} berhasil disimpan! 🎉`, 'success');
        logs.unshift(newLog);
        saveOffline();
      } else {
        showToast('Gagal mengirim data, disimpan di browser.', 'warning');
        logs.unshift(newLog);
        saveOffline();
      }
    } catch (err) {
      showToast('Koneksi gagal, absensi disimpan di browser.', 'warning');
      logs.unshift(newLog);
      saveOffline();
    }
  } else {
    logs.unshift(newLog);
    saveOffline();
    showToast(`Absensi ${nama} dicatat di browser.`, 'info');
  }

  setLoading(false);
  document.getElementById('formAbsensiMain').reset();
  document.getElementById('gpsStatusText').innerText = '';
  switchTab('dashboard');
}

// ============================================================
// TAMBAH ANGGOTA
// ============================================================
async function addMember(e) {
  e.preventDefault();
  const nama = document.getElementById('newNama').value.trim();
  const nim = document.getElementById('newNim').value.trim();
  const prodi = document.getElementById('newProdi').value.trim();
  const hp = document.getElementById('newHp').value.trim();
  if (!nama || !nim) return;

  const newMember = {
    id: Date.now().toString(),
    no: members.length + 1,
    nama, nim,
    prodi: prodi || 'Umum',
    hp: hp || '-',
    kelompok: 'Kelompok KKN'
  };

  setLoading(true);

  if (APP_MODE === 'online') {
    try {
      const result = await apiPost({ action: 'addMember', nama, nim, prodi, hp });
      if (result.status === 'ok') {
        showToast(`Anggota ${nama} berhasil ditambahkan ke Google Sheets!`, 'success');
      }
    } catch (err) {
      showToast('Koneksi gagal, data disimpan offline.', 'warning');
    }
  }

  members.push(newMember);
  saveOffline();
  setLoading(false);
  document.getElementById('formAddMember').reset();
  renderMembersTable();
  populateDropdown();
  showToast(`✅ Anggota ${nama} berhasil ditambahkan!`, 'success');
}

// ============================================================
// HAPUS ANGGOTA
// ============================================================
function deleteMember(id) {
  const m = members.find(m => m.id === id);
  if (!m) return;
  if (!confirm(`Hapus peserta "${m.nama}"?`)) return;
  members = members.filter(m => m.id !== id);
  saveOffline();
  renderMembersTable();
  populateDropdown();
  showToast(`Anggota ${m.nama} telah dihapus.`, 'info');
}

// ============================================================
// GPS DETECTION
// ============================================================
function detectGpsLocation() {
  const statusEl = document.getElementById('gpsStatusText');
  const inputEl = document.getElementById('inputLokasiGps');
  statusEl.innerText = '📡 Mendeteksi koordinat GPS...';

  if (!navigator.geolocation) {
    statusEl.innerText = '❌ Browser tidak mendukung GPS.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      inputEl.value = `${lat}, ${lng}`;
      statusEl.innerText = `✅ Lokasi terdeteksi: Akurasi ${Math.round(pos.coords.accuracy)}m`;
    },
    () => {
      statusEl.innerText = '⚠️ GPS ditolak. Menggunakan koordinat posko.';
      inputEl.value = '-6.200000, 106.816666';
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// ============================================================
// TAB SWITCHING
// ============================================================
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  const activeBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`);
  const activePane = document.getElementById(tabId);
  if (activeBtn) activeBtn.classList.add('active');
  if (activePane) activePane.classList.add('active');

  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'members') renderMembersTable();
  if (tabId === 'logs') renderLogsTable();
  if (tabId === 'form') populateDropdown();
  if (tabId === 'poster') generatePosterQr();
}

// ============================================================
// POPULATE DROPDOWN NAMA
// ============================================================
function populateDropdown() {
  const select = document.getElementById('selectNamaPeserta');
  if (!select) return;
  select.innerHTML = '<option value="">-- Pilih Nama Anggota --</option>' +
    members.map(m => `<option value="${m.nama}" data-nim="${m.nim}" data-prodi="${m.prodi}">${m.nama} (${m.nim})</option>`).join('');
}

// ============================================================
// AUTO-FILL NIM & PRODI
// ============================================================
function handleMemberSelectChange() {
  const select = document.getElementById('selectNamaPeserta');
  const opt = select.options[select.selectedIndex];
  document.getElementById('inputNim').value = opt?.dataset?.nim || '';
  document.getElementById('inputProdi').value = opt?.dataset?.prodi || '';
}

// ============================================================
// RENDER DASHBOARD
// ============================================================
function renderDashboard() {
  const totalHadir = logs.filter(l => l.status === 'Hadir').length;
  const totalIzin = logs.filter(l => l.status === 'Izin').length;
  const totalSakit = logs.filter(l => l.status === 'Sakit').length;
  const totalSesi = logs.length;
  const avgPct = totalSesi > 0 ? ((totalHadir / totalSesi) * 100).toFixed(1) : '0';

  document.getElementById('statTotalHadir').innerText = totalHadir;
  document.getElementById('statTotalIzin').innerText = totalIzin;
  document.getElementById('statTotalSakit').innerText = totalSakit;
  document.getElementById('statPersentaseGroup').innerText = avgPct + '%';

  const tbody = document.getElementById('tableRekapBody');
  if (!tbody) return;

  const countsMap = {};
  members.forEach(m => { countsMap[m.nama] = { Hadir: 0, Izin: 0, Sakit: 0, total: 0 }; });
  logs.forEach(l => {
    if (countsMap[l.nama]) {
      if (l.status === 'Hadir') countsMap[l.nama].Hadir++;
      else if (l.status === 'Izin') countsMap[l.nama].Izin++;
      else if (l.status === 'Sakit') countsMap[l.nama].Sakit++;
      countsMap[l.nama].total++;
    }
  });

  tbody.innerHTML = members.map((m, idx) => {
    const s = countsMap[m.nama] || { Hadir: 0, Izin: 0, Sakit: 0, total: 0 };
    const pct = s.total > 0 ? ((s.Hadir / s.total) * 100).toFixed(1) : '0.0';
    let badge = 'badge-success', eval_ = '🟢 Sangat Baik';
    if (pct < 85 && pct >= 75) { badge = 'badge-warning'; eval_ = '🟡 Baik'; }
    if (pct < 75 && s.total > 0) { badge = 'badge-danger'; eval_ = '🔴 Perlu Perhatian'; }
    if (s.total === 0) { badge = 'badge-info'; eval_ = '⚪ Belum Absen'; }
    return `<tr>
      <td>${idx + 1}</td><td><b>${m.nama}</b></td><td>${m.nim}</td><td>${m.prodi}</td>
      <td><span class="badge badge-success">${s.Hadir}</span></td>
      <td><span class="badge badge-warning">${s.Izin}</span></td>
      <td><span class="badge badge-danger">${s.Sakit}</span></td>
      <td><b>${s.total}</b></td><td><b>${pct}%</b></td>
      <td><span class="badge ${badge}">${eval_}</span></td>
    </tr>`;
  }).join('');
}

// ============================================================
// RENDER LOG TABLE
// ============================================================
function getFilteredLogs() {
  if (!logSearchQuery.trim()) return logs;
  const q = logSearchQuery.toLowerCase();
  return logs.filter(l => {
    return [l.timestamp, l.nama, l.nim, l.kegiatan, l.shift, l.status, l.lokasi]
      .some(value => (value || '').toString().toLowerCase().includes(q));
  });
}

function handleLogSearch(event) {
  logSearchQuery = event.target.value || '';
  renderLogsTable();
}

function renderLogsTable() {
  const tbody = document.getElementById('tableLogsBody');
  if (!tbody) return;
  const filteredLogs = getFilteredLogs();
  if (filteredLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">Tidak ada hasil pencarian untuk "${logSearchQuery.trim()}".</td></tr>`;
    return;
  }

  const badgeClass = (status) => {
    if (status === 'Hadir') return 'success';
    if (status === 'Izin') return 'warning';
    if (status === 'Sakit') return 'danger';
    if (status === 'Dinas / Luar posko') return 'dinas';
    return 'info';
  };

  tbody.innerHTML = filteredLogs.map(l => `<tr>
    <td>${l.timestamp}</td><td><b>${l.nama}</b></td><td>${l.nim}</td>
    <td>${l.kegiatan}</td><td>${l.shift}</td>
    <td><span class="badge badge-${badgeClass(l.status)}">${l.status}</span></td>
    <td><small>${l.lokasi}</small></td>
    <td><button class="btn btn-danger" onclick="deleteAttendanceLog('${l.id}')">Hapus</button></td>
  </tr>`).join('');
}

function deleteAttendanceLog(id) {
  if (!confirm('Hapus data absensi ini?')) return;
  logs = logs.filter(log => log.id !== id);
  saveOffline();
  renderLogsTable();
  renderDashboard();
  showToast('Satu entri absensi berhasil dihapus.', 'success');
}

// ============================================================
// RENDER MEMBERS TABLE
// ============================================================
function renderMembersTable() {
  const tbody = document.getElementById('tableMembersBody');
  if (!tbody) return;
  tbody.innerHTML = members.map((m, idx) => `<tr>
    <td>${idx + 1}</td><td><b>${m.nama}</b></td><td>${m.nim}</td>
    <td>${m.prodi}</td><td>${m.hp}</td>
    <td><button class="btn btn-danger" style="padding:0.3rem 0.6rem;font-size:0.75rem;" onclick="deleteMember('${m.id}')">🗑️ Hapus</button></td>
  </tr>`).join('');
}

// ============================================================
// EXPORT CSV
// ============================================================
function exportToCsv() {
  if (logs.length === 0) { showToast('Tidak ada data untuk di-export!', 'warning'); return; }
  let csv = 'Timestamp,Nama Lengkap,NIM,Kegiatan,Shift,Status,Koordinat Lokasi\n';
  logs.forEach(l => {
    csv += `"${l.timestamp}","${l.nama}","${l.nim}","${l.kegiatan}","${l.shift}","${l.status}","${l.lokasi}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `Rekap_Absensi_KKN_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('File CSV berhasil diunduh!', 'success');
}

function sendRekapEmail() {
  if (logs.length === 0) { showToast('Tidak ada data untuk dikirim!', 'warning'); return; }
  const recipient = prompt('Masukkan alamat email penerima (kosong = kosong):', '');
  let csv = 'Timestamp,Nama Lengkap,NIM,Kegiatan,Shift,Status,Koordinat Lokasi\n';
  logs.forEach(l => {
    csv += `${l.timestamp},${l.nama},${l.nim},${l.kegiatan},${l.shift},${l.status},${l.lokasi}\n`;
  });

  const subject = `Rekap Absensi KKN ${new Date().toISOString().slice(0,10)}`;
  let body = 'Rekap Absensi (CSV):\n\n' + csv;
  const maxLen = 15000; // guard for mailto length limits
  if (body.length > maxLen) body = body.slice(0, maxLen) + '\n\n[...truncated]';

  const mailto = `mailto:${recipient || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
  showToast('Membuka klien email...', 'info');
}

function exportLogsToPdf() {
  if (logs.length === 0) { showToast('Tidak ada data untuk di-export!', 'warning'); return; }

  const html = `
    <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Rekap Absensi KKN</title>
        <style>
          body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #0f172a; margin: 1rem; }
          h2 { margin-bottom: 0.25rem; }
          p { margin: 0.2rem 0 1rem; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th, td { padding: 0.75rem; border: 1px solid #d1d5db; text-align: left; }
          th { background: #f8fafc; }
          tr:nth-child(even) { background: #f9fafb; }
          @media print { body { margin: 0.5cm; } }
        </style>
      </head>
      <body>
        <h2>Rekap Absensi KKN</h2>
        <p>Dicetak: ${new Date().toLocaleString('id-ID')}</p>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Nama</th>
              <th>NIM</th>
              <th>Kegiatan</th>
              <th>Shift</th>
              <th>Status</th>
              <th>Koordinat</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td>${l.timestamp}</td>
                <td>${l.nama}</td>
                <td>${l.nim}</td>
                <td>${l.kegiatan}</td>
                <td>${l.shift}</td>
                <td>${l.status}</td>
                <td>${l.lokasi}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Gagal membuka jendela cetak. Periksa pop-up blocker.', 'error');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.addEventListener('load', () => {
    printWindow.print();
    setTimeout(() => printWindow.close(), 500);
  });
}

// ============================================================
// QR CODE POSTER GENERATOR
// ============================================================
let qrCodeObj = null;
function getAttendanceTargetUrl() {
  const storedUrl = localStorage.getItem('kkn_qr_target_url');
  if (storedUrl) return storedUrl;

  const basePath = window.location.protocol === 'file:'
    ? window.location.href.replace(/[^/]+$/, '')
    : `${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, '/')}`;

  return `${basePath}index.html?tab=form`;
}

function generatePosterQr() {
  const container = document.getElementById('posterQrCode');
  if (!container) return;
  container.innerHTML = '';

  const absensiUrl = getAttendanceTargetUrl();

  qrCodeObj = new QRCode(container, {
    text: absensiUrl,
    width: 200,
    height: 200,
    colorDark: '#0f172a',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

// ============================================================
// INITIALIZE
// ============================================================
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEYS.ATTENDANCE || event.key === ATTENDANCE_SYNC_KEY) {
    syncLogsFromStorage();
  }
});

window.addEventListener('focus', () => {
  syncLogsFromStorage();
});

function getInitialTabFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const paramTab = params.get('tab');
  if (paramTab) return paramTab;

  const hashTab = (window.location.hash || '').replace('#', '');
  return hashTab || null;
}

window.onload = async function () {
  updateConnectionStatus(false);
  await loadAllData();
  updateAttendanceWindowNotice();
  generatePosterQr();

  const initialTab = getInitialTabFromUrl();
  const validTabs = ['dashboard', 'form', 'members', 'logs', 'poster', 'tutorial'];
  const targetTab = validTabs.includes(initialTab) ? initialTab : 'dashboard';

  if (typeof switchTab === 'function') switchTab(targetTab);
  if (typeof populateDropdown === 'function') populateDropdown();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderLogsTable === 'function') renderLogsTable();
  setTimeout(() => generatePosterQr(), 500);
};
