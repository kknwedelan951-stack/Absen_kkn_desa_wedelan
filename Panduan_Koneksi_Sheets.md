# 🔗 Panduan Koneksi Web Absensi KKN ke Google Sheets

## Ringkasan Alur

```
[index.html] ──POST/GET──▶ [Google Apps Script Web App] ──▶ [Google Sheets]
```

Sistem sudah siap. Hanya perlu **1 kali setup** deploy Apps Script.

---

## Langkah-Langkah (±10 Menit)

### Step 1 — Buka Google Spreadsheet
🔗 https://docs.google.com/spreadsheets/d/16rp1nNW21Tbq-ct0adzWVk2PXk71fH1ViDmbQ54Nz5o/edit

### Step 2 — Buka Apps Script
Klik menu: **Ekstensi** → **Apps Script**

### Step 3 — Tempel Kode
1. Hapus semua kode yang ada di editor
2. Salin seluruh isi file `Code.gs` dari folder `c:\Users\LOQ\Documents\Qr kkn\Code.gs`
3. Tempel ke editor Apps Script
4. Tekan **Ctrl+S** untuk menyimpan

### Step 4 — Deploy sebagai Web App
1. Klik tombol **Deploy** (kanan atas) → **New Deployment**
2. Klik ikon ⚙️ → pilih **Web App**
3. Isi pengaturan:
   - **Description**: Sistem Absensi KKN
   - **Execute as**: **Me** (akun Google Anda)
   - **Who has access**: **Anyone**
4. Klik **Deploy**
5. Klik **Authorize access** → pilih akun Google → **Allow**
6. **Salin URL Web App** yang muncul (contoh: `https://script.google.com/macros/s/AKfycbx.../exec`)

### Step 5 — Inisialisasi Sheet
Buka URL ini di browser (ganti `YOUR_URL` dengan URL Web App Anda):
```
YOUR_URL?action=init
```
Halaman akan menampilkan:
```json
{"status":"ok","message":"Inisialisasi sheet berhasil!..."}
```
Ini akan **otomatis membuat** sheet `Database Peserta`, `Absensi KKN`, dan `Rekap Kehadiran` di Spreadsheet Anda, termasuk mengisi 15 data anggota KKN!

### Step 6 — Hubungkan ke Web
1. Buka file `c:\Users\LOQ\Documents\Qr kkn\app.js`
2. Temukan baris:
   ```js
   const GOOGLE_SCRIPT_URL = 'TEMPEL_URL_WEB_APP_DISINI';
   ```
3. Ganti `TEMPEL_URL_WEB_APP_DISINI` dengan URL Web App dari Step 4
4. Simpan file

### Step 7 — Verifikasi
1. Buka `index.html` di browser
2. Di kanan atas navbar akan muncul: **🟢 Terhubung Google Sheets**
3. Coba isi form absensi → submit
4. Cek Google Sheets → tab **Absensi KKN** akan langsung terisi!

---

## Cara Kerja QR Code

1. Buka tab **🖨️ Poster QR Code**
2. Di kolom "Link Absensi", masukkan URL file `index.html` (jika di-host online) atau URL Google Form
3. QR Code otomatis terbuat
4. Peserta scan → langsung ke form absensi → submit → tersimpan ke Sheets ✅

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Badge masih merah/offline | Pastikan URL sudah benar di `app.js` dan file disimpan |
| Error "Access denied" | Ulangi authorize di Apps Script |
| Data tidak muncul di Sheets | Cek apakah URL `?action=init` sudah berhasil dijalankan |
| QR Code tidak muncul | Masukkan URL yang valid di kolom Link Absensi |

---

> ✅ Setelah berhasil terhubung, setiap absensi akan **real-time** masuk ke Google Sheets dan rekap otomatis diperbarui!
