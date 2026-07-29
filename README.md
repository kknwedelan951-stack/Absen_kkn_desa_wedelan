# KKN Absensi - Simple Self-hosted Backend

This is a minimal Node/Express backend storing attendance logs and members in a local SQLite database. It's intended as a simple self-hosted option to centralize attendance across devices.

Quick start:

1. Install dependencies

```bash
cd server
npm install
```

2. Run locally

```bash
npm start
# server runs on http://localhost:7777 by default
```

3. Endpoints used by frontend

- `GET /api/members` → {status: 'ok', data: [...]}
- `GET /api/logs` → {status: 'ok', data: [...]}
- `POST /api/submit` → accept JSON { nama, nim, prodi, kegiatan, shift, status, lokasi, tanggal }
- `POST /api/addMember` → accept JSON { nama, nim, prodi, hp }

Deploy: you can deploy this on any Node-capable host (Railway, Render, VPS). After deploy, set `SELF_HOSTED_URL` in `app.js` to your server base URL (e.g. `https://yourdomain.com/api`).
