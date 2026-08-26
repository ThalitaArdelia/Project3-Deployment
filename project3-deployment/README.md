# Proyek 3 — Deployment Aplikasi Web di Cloud

Aplikasi **Task Manager** sederhana (Express + SQLite) yang dilengkapi seluruh
perangkat deployment untuk mendemonstrasikan materi Pertemuan 15: konfigurasi
environment, CI/CD, manajemen domain & SSL, serta monitoring — sesuai
**Sub-CPMK-3.3**.

## Struktur Proyek

```
project3-deployment/
├── public/                       # frontend (HTML/CSS/JS)
├── server.js                     # Express + SQLite + endpoint /api/health
├── Dockerfile                    # image untuk deployment berbasis container
├── .dockerignore
├── Procfile                      # untuk deployment ke Heroku
├── .env.example                  # template variabel lingkungan
├── .gitignore
└── .github/workflows/deploy.yml   # pipeline CI/CD (build → test → deploy)
```

## 1. Konfigurasi Environment

Salin `.env.example` menjadi `.env` untuk pengembangan lokal:

```bash
cp .env.example .env
npm install
npm start
# buka http://localhost:4000
```

Variabel lingkungan yang digunakan:

| Variabel   | Deskripsi                          | Contoh        |
|------------|--------------------------------------|----------------|
| `PORT`      | Port server                          | `4000`         |
| `NODE_ENV`  | Mode environment                     | `production`   |

Di **production**, variabel ini **tidak** ditaruh di file `.env` yang di-commit,
melainkan diatur langsung di dashboard/CLI platform cloud (lihat langkah 3).

## 2. Menjalankan dengan Docker (opsional, untuk deployment berbasis container)

```bash
docker build -t task-manager .
docker run -p 4000:4000 -e NODE_ENV=production task-manager
```

## 3. Deployment ke Cloud

### Opsi A — Heroku (PaaS, paling sederhana)

```bash
heroku login
heroku create nama-aplikasi-anda
heroku config:set NODE_ENV=production
git push heroku main
heroku open
```

`Procfile` sudah menentukan cara Heroku menjalankan aplikasi (`web: node server.js`).

### Opsi B — Render / Railway (alternatif PaaS)

1. Hubungkan repository GitHub ke dashboard Render/Railway.
2. Build command: `npm install`
3. Start command: `node server.js`
4. Tambahkan environment variable `NODE_ENV=production` di dashboard.

### Opsi C — Container di cloud manapun (AWS/GCP/Azure)

Gunakan `Dockerfile` yang tersedia, push image ke registry (Docker Hub / ECR / GCR),
lalu deploy ke layanan container seperti AWS ECS, Google Cloud Run, atau Azure
Container Apps.

## 4. CI/CD Otomatis (GitHub Actions)

File `.github/workflows/deploy.yml` menjalankan pipeline berikut setiap ada
`push` ke branch `main`:

1. **Checkout** kode terbaru.
2. **Build**: install dependencies (`npm ci`).
3. **Test**: menjalankan `npm test` (jika ada) + smoke test — server dinyalakan
   sebentar dan endpoint `/api/health` dipanggil untuk memastikan aplikasi hidup.
4. **Deploy**: jika build & test sukses, aplikasi otomatis dideploy ke Heroku.

Agar deploy otomatis berjalan, tambahkan secrets berikut di
**GitHub repo → Settings → Secrets and variables → Actions**:

| Secret               | Isi                                      |
|------------------------|--------------------------------------------|
| `HEROKU_API_KEY`         | API key dari akun Heroku Anda                |
| `HEROKU_APP_NAME`        | Nama aplikasi Heroku yang sudah dibuat        |
| `HEROKU_EMAIL`           | Email akun Heroku Anda                        |

Jika Anda memakai Render/Railway alih-alih Heroku, ganti step "Deploy" di
`deploy.yml` dengan action/CLI yang sesuai (kedua platform ini juga menyediakan
deploy-via-webhook yang lebih sederhana daripada action GitHub khusus).

## 5. Manajemen Domain dan SSL

1. **Beli domain** melalui registrar (Namecheap, Niagahoster, GoDaddy, dll).
2. **Arahkan DNS** ke aplikasi:
   - Heroku: tambahkan domain via `heroku domains:add www.namadomainanda.com`,
     lalu buat **CNAME record** di DNS registrar yang menunjuk ke domain target
     yang diberikan Heroku.
   - Layanan berbasis IP (VM/EC2): buat **A record** yang menunjuk ke IP publik server.
3. **Aktifkan SSL**:
   - Heroku & Render: SSL otomatis via **Let's Encrypt**, tidak perlu konfigurasi tambahan.
   - AWS: gunakan **Route 53** untuk DNS dan **AWS Certificate Manager (ACM)** untuk
     menerbitkan sertifikat SSL secara gratis dan otomatis diperpanjang.
4. Setelah aktif, aplikasi dapat diakses melalui `https://` — browser akan
   menampilkan ikon gembok yang menandakan koneksi terenkripsi (TLS).

**Dampak jika tidak memakai SSL:** data yang dikirim antara browser dan server
(termasuk data sensitif) dapat disadap pihak ketiga (serangan Man-in-the-Middle),
browser modern menampilkan peringatan "Not Secure" yang menurunkan kepercayaan
pengguna, dan beberapa fitur browser (mis. geolocation, service worker) memang
mensyaratkan koneksi HTTPS.

## 6. Monitoring dan Pemeliharaan

- Endpoint `GET /api/health` disediakan khusus untuk **health check** — dapat
  dipakai oleh load balancer, platform PaaS, atau layanan uptime monitoring
  pihak ketiga (mis. UptimeRobot) untuk mendeteksi aplikasi down.
- Di Heroku: gunakan `heroku logs --tail` untuk melihat log real-time, atau
  add-on **Heroku Metrics** untuk memantau response time & error rate.
- Di AWS: gunakan **CloudWatch** untuk memantau CPU, memory, dan log aplikasi.
- Lakukan **backup database** secara berkala (untuk demo ini, `tasks.db` dapat
  di-backup manual; pada aplikasi produksi nyata disarankan memakai managed
  database seperti Amazon RDS/PostgreSQL yang punya fitur backup otomatis).
- Perbarui dependensi secara rutin (`npm outdated`, `npm update`) untuk
  menutup celah keamanan.

## Ringkasan Alur Deployment End-to-End

```
Developer push kode ke GitHub (branch main)
        │
        ▼
GitHub Actions: build → test (smoke test /api/health)
        │  (lulus)
        ▼
Deploy otomatis ke Heroku
        │
        ▼
Domain custom (DNS CNAME) + SSL otomatis (Let's Encrypt)
        │
        ▼
Aplikasi live di https://namadomainanda.com
        │
        ▼
Monitoring via /api/health + Heroku Metrics / CloudWatch
```
