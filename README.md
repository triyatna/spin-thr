# 🎊 Spin THR Lebaran

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5.13-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-Better--SQLite3-003B57?logo=sqlite)](https://sqlite.org/)

**Spin THR Lebaran** adalah aplikasi permainan _slot/spin_ interaktif berbasis web yang khusus dirancang untuk membagikan Tunjangan Hari Raya (THR) secara seru, modern, dan terdokumentasi. Dibuat menggunakan paduan teknologi Vue 3 (Vite), Node.js (Express), dan database SQLite berkinerja tinggi.

---

## 🌟 Fitur Utama

1. **🎮 Permainan Spin Interaktif**
   - Animasi _burst_, _cascade_ efek runtuh, dan suara _autoplay_ Lebaran.
   - Algoritma unik: Multiplier (Pengganda hadiah), Free Spin 🎁, Zonk 💀, dan Rare Item ⭐.
2. **📱 Desain UI/UX Super Responsif**
   - Layar akan selalu menyesuaikan (kompresi ukuran pintar) baik di dalam monitor PC maupun ponsel jadul, 100% tanpa perlu _scrolling_.
3. **🛡️ Keamanan Sistem & Anti-Curang Tingkat Lanjut**
   - **Anti-Spam & AutoClicker**: _Rate Limiting_ aktif di rute _spin_.
   - **Anti-Brute Force**: Perlindungan ketat pada halaman _Login Admin_.
   - **Anti-SQL Injection**: Penggunaan _prepared statements_ & `better-sqlite3`.
   - **Anti-Timing Attack**: Verifikasi sandi administrator dengan `crypto.timingSafeEqual`.
4. **🔗 Integrasi Otomatis Klaim ke WhatsApp**
   - URL pesan dibentuk khusus dengan sandi Unicode agar rincian pemain seperti dompet _E-Wallet_ dan tautan klik-langsung (_Admin Preview Link_) tidak hancur atau rentan terpotong.
5. **⚙️ Backend + Frontend Monolithic yang Ringkas**
   - Peladen Node.js dapat langsung mendistribusikan berkas kompilasi antarmuka klien. Sama sekali terbebas dari pengaturan letih _CORS_, cukup pasang 1 Domain/Port.

---

## ⚙️ Variabel Lingkungan (`.env`)

Seluruh pengaturan terpusat berada di satu file `.env` di _root_ proyek.

```env
# KONFIGURASI SERVER UTAMA
PORT=3001
JWT_SECRET=rahasia_jwt_anda

# PENGATURAN DEFAULT PERMAINAN
DEFAULT_MAX_PLAYERS=100
DEFAULT_SPIN_COUNT=6
DEFAULT_MIN_PRIZE=5000
DEFAULT_MAX_PRIZE=20000
DEFAULT_ADMIN_WA=6281234567890
DEFAULT_ADMIN_PASSWORD=rahasia_admin

# KONFIGURASI VITE (FRONT-END)
VITE_PORT=5173
VITE_APP_TITLE=Spin THR Lebaran
# VITE_API_BASE_URL= # (Kosongkan bila deploy gabungan Monolithic)
```

---

## 🚀 Panduan Rilis / Instalasi (_Deployment_)

Kami telah menyediakan 3 metode rilis "Tancap-Gas" (Hanya modal 1 perintah). Pilih yang paling cocok dengan _server_ Anda:

### 1. Metode Manual (Untuk cPanel/Terminal Biasa)

Cukup ketik perintah ini untuk memasang paket, nge-_build_ UI, dan menyalakan Node.js:

```bash
npm run deploy
```

### 2. Metode PM2 (Rekomendasi Terbaik untuk VPS Node.js)

Pastikan Anda sudah menginstal PM2 (`npm i -g pm2`), ketikkan perintah peluncuran ini (_Zero-Downtime_):

```bash
npm run setup
pm2 start ecosystem.config.js
```

### 3. Metode Docker & Compose (Containerization)

Jika server Anda berbasis kontainer Docker, jalankan:

```bash
docker compose up -d
```

_(Ini akan membangun Image Node:18-Alpine yang teroptimasi, menjalankan `npm install:all`, menyalin aset, hingga menyatukan server)_.

### 4. Menambahkan Domain Kustom (Nginx Reverse Proxy)

Oleh karena aplikasi ini berjalan secara merangkap Monolitik di peladen lokal (Port bawaan `.env` = `3001`), menautkan Domain Publik sangatlah gampang. Anda cukup menggunakan fitur *Reverse Proxy* milik ekosistem Nginx atau sejenisnya.

Sebelum mengatur *reverse proxy*, pastikan DNS domain/subdomain Anda sudah mengarah ke IP server (misalnya melalui record `A` atau `CNAME`).

Di file blok peladen Nginx (`/etc/nginx/sites-available/...`), salin pola dasar berikut:

```nginx
server {
    listen 80;
    server_name thr.domain-anda.com; # Ganti dengan domain asli Anda

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

_Tip: Setelah Nginx dimuat ulang (`sudo systemctl reload nginx`), jalankan Certbot SSL (`sudo certbot --nginx`) agar URL langsung memuat jalur aman `HTTPS`!_

#### Alternatif: Menggunakan Caddy

Jika Anda memakai Caddy, konfigurasi domain kustom justru lebih ringkas karena sertifikat HTTPS bisa diurus otomatis selama DNS domain sudah mengarah ke server.

Di file `Caddyfile` (umumnya di `/etc/caddy/Caddyfile`), gunakan pola berikut:

```caddy
thr.domain-anda.com {
    reverse_proxy 127.0.0.1:3001
}
```

Jika ingin sekaligus melayani domain utama dan subdomain `www`, gunakan contoh ini:

```caddy
domain-anda.com, www.domain-anda.com {
    reverse_proxy 127.0.0.1:3001
}
```

Setelah itu, muat ulang konfigurasi Caddy:

```bash
sudo systemctl reload caddy
```

_Tip: Bila Caddy berjalan normal dan port `80/443` terbuka, HTTPS biasanya akan aktif otomatis tanpa perlu Certbot tambahan._

#### Alternatif: Menggunakan Apache (VirtualHost)

Jika peladen Anda menggunakan Apache, pastikan modul *proxy* telah aktif (`sudo a2enmod proxy proxy_http`), lalu buat konfigurasi blok berikut:

```apache
<VirtualHost *:80>
    ServerName thr.domain-anda.com # Ganti dengan domain asli Anda

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3001/
    ProxyPassReverse / http://127.0.0.1:3001/
</VirtualHost>
```

---

## 🛠️ Stack Teknologi

| Komponen                 | Teknologi                                                 |
| :----------------------- | :-------------------------------------------------------- |
| **Antarmuka (Frontend)** | Vue 3 (Composition API), Vite, Pinia (State), Vanilla CSS |
| **Peladen (Backend)**    | Node.js, Express.js                                       |
| **Basis Data Utama**     | SQLite (`better-sqlite3`)                                 |
| **Keamanan Protektif**   | `express-rate-limit`, `jsonwebtoken`, Hash Standar        |
| **Ekosistem Server**     | Docker, PM2                                               |

---

## 📝 Catatan Pembaruan (_Changelogs_)

**v1.0.0 - Major Refactor & Production Ready (Maret 2026)**

- 🎉 **Fitur**: Peluncuran repositori penuh dengan konfigurasi tata letak awal (Vue + Vite + Pinia).
- ✨ **Pembaruan Visual**: Membuang emoji latar usang, kini menggunakan Logo Lebaran berfilter _drop-shadow_, favicon baru, dan perpaduan _Radial Gradient_.
- 🔊 **Audio**: Menambahkan komponen pemutar BGM Lebaran di antarmuka web, terintegrasi pada tombol _Mute_.
- 📱 **Pembaruan Layout Responsif**: Mengecilkan _margin_, teks UI, dan bingkai secara merata; khusus di _viewport_ kecil sistem otomatis mengecil sehingga seluruh arena selalu muat di satu layar (kecuali untuk area blok-spin yang dijaga presisi-nya).
- 🛡️ **Peningkatan Keamanan Server (Hardening)**: Menutup racun dan kelemahan! Mengintegrasikan _express-rate-limit_ ke _register_, _login_, dan jalur _spin_. Membangun cek silang sandi anti-curang tipe _timing attack_ (_crypto.timingSafeEqual_).
- 🔗 **Smart Deployment & Environment**: Meleburkan kekacauan tata letak variabel. Kode sekarang bersatu secara Monolitik hanya menggunakan _SATU_ `package.json` sentral, _SATU_ `.env` sentral, `docker-compose.yml`, dan `ecosystem.config.js`. Menghapus isu CORS lintas-domain secara permanen.
- 📦 **Perbaikan _Render_ & _Gitignore_**: Kesalahan perujukannya dihapus (memperbaiki latar belakang gambar putus dari `.jpg` ke `.png`), menghilangkan dekorasi latar "melayang", dan menyesuaikan filter GIT agar lebih kebal dari file rahasia/log sampah.
- 💬 **WhatsApp Terstandar**: Restrukturisasi tombol lapor hasil (_Result_) khusus Admin menggunakan _URI Encoder_ + sisipan _Link Preview_ bagi Admin berbasis API WhatsApp Resmi.

## ⚠️ Disclaimer

Proyek ini dibuat **hanya untuk hiburan** dalam konteks bagi-bagi THR Lebaran di lingkungan keluarga/kantor. Hadiah bersifat **predetermined** (sudah ditentukan sebelum permainan) — bukan perjudian sungguhan. Tidak ada uang sungguhan yang diproses oleh aplikasi ini.

---

## 📄 Lisensi

MIT License — bebas digunakan, dimodifikasi, dan didistribusikan.

---

_Dikembangkan dengan dedikasi tinggi demi memeriahkan kemenangan Hari Raya!_ 🙏

---

<div align="center">
  <b>Selamat Hari Raya Idul Fitri 🌙</b><br>
  <i>Minal Aidin Wal Faizin — Mohon Maaf Lahir & Batin</i>
</div>
