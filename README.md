# 📶 KAS WIFI Mobile (Proxmox CT 2201)

Aplikasi Mobile Android untuk **KAS WIFI** yang sudah live di **Proxmox CT 2201** (`http://192.168.66.18`).

Lokasi folder:
`c:\PROJECT ARCELL\APLIKASI KAS WIFI\kas-wifi-mobile`

---

## 🎯 Konfigurasi Server
- **Server Proxmox Live:** `http://192.168.66.18`
- **Tipe Aplikasi Android:** Native Android App via Capacitor
- **Fitur Khusus:**
  - Full-screen tampilan aplikasi Kas WiFi tanpa address bar browser.
  - Sudah dikonfigurasi `android:usesCleartextTraffic="true"` sehingga koneksi HTTP ke `192.168.66.18` diizinkan penuh oleh Android.
  - Dilengkapi GitHub Actions CI/CD (`.github/workflows/build-apk.yml`) untuk build file APK secara otomatis di cloud.

---

## 🚀 2 Cara Mendapatkan & Menggunakan APK di HP Android

### Cara 1: Build Otomatis Jadi APK via GitHub (Sangat Mudah & Gratis)
Sama seperti aplikasi `AR Service` Anda sebelumnya, folder ini sudah dilengkapi skrip build APK otomatis:
1. Buat repository baru di akun GitHub Anda (misal: `kas-wifi-mobile`).
2. Di folder ini, jalankan perintah git remote:
   ```bash
   git remote add origin https://github.com/USERNAME_ANDA/kas-wifi-mobile.git
   git branch -M main
   git push -u origin main
   ```
3. Buka tab **Actions** di repository GitHub Anda.
4. GitHub Actions akan otomatis meng-compile Android Native dan menghasilkan file:
   - **`KAS-WIFI-Release-APK`** (File `.apk` siap download dan install di HP).

---

### Cara 2: Build APK Lewat Android Studio di Komputer
Jika di komputer Anda terpasang Android Studio:
1. Klik file:
   `BUKA_ANDROID_STUDIO.bat`
2. Android Studio akan terbuka memuat folder `android/`.
3. Klik menu **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
4. Tunggu beberapa detik, APK akan terbentuk di folder:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Cara 3: Pasang Instan di HP (Tanpa Perlu Compile APK)
1. Sambungkan HP ke Wi-Fi yang satu jaringan dengan `192.168.66.18`.
2. Buka browser **Google Chrome** di HP Anda.
3. Buka alamat:
   ```
   http://192.168.66.18
   ```
4. Tekan tombol titik tiga (**⋮**) di pojok kanan atas Chrome HP.
5. Pilih **"Tambahkan ke Layar Utama"** / **"Install App"**.
6. Ikon **KAS WIFI** akan langsung muncul di menu aplikasi HP Anda dan bisa dibuka fullscreen!
