# 📶 KAS WIFI Mobile

Aplikasi Mobile Kasir & Pembukuan Kas Multi-Wallet khusus usaha **RT/RW Net, Hotspot Voucher, dan Internet Rumahan**.

Aplikasi ini dibuat khusus untuk folder:
`c:\PROJECT ARCELL\APLIKASI KAS WIFI\kas-wifi-mobile`
dan terhubung langsung dengan backend PHP & MySQL di folder:
`c:\PROJECT ARCELL\APLIKASI KAS WIFI\kas-wifi`

---

## ✨ Fitur Utama Mobile

1. **📱 Multi-Wallet Bawaan:**
   - 💵 **TUNAI** (Kas fisik laci kasir)
   - 📱 **DANA** (E-Wallet DANA)
   - 💳 **QRIN** (QRIS Merchant)
   - Kartu total saldo kasir bersih + toggle privasi saldo (sembunyikan nominal saat dilihat pembeli).

2. **⚡ Kasir Cepat (Quick Cashier Action):**
   - **+ Pemasukan:** Penjualan voucher 2 Jam, 5 Jam, 12 Jam, 24 Jam, Langganan Bulanan Member, Jasa Setting / Pasang Baru. Dilengkapi tombol nominal cepat (+2rb, +5rb, +10rb, +20rb, +50rb, +100rb).
   - **- Pengeluaran:** Biaya operasional, Bandwidth ISP, Listrik & Token PLN, Kabel/Router, Gaji Kasir.
   - **⇄ Transfer Dompet:** Pindahkan saldo antar dompet (misal: Tarik saldo QRIN/DANA ke Kas Laci Tunai).
   - **🧾 Struk / Nota Kasir:** Format struk thermal 58mm, kirim nota otomatis ke **WhatsApp pembeli**, cetak struk via printer Bluetooth / PDF.

3. **📶 Dual-Mode (Online & Offline Standalone):**
   - **Mode Standalone / Offline:** Tetap bisa input transaksi kasir saat HP tidak terhubung ke PC / listrik mati. Data tersimpan aman di HP.
   - **Mode Online & Sync:** Sinkronkan seluruh data transaksi offline ke database MySQL server PHP di komputer dengan 1 klik.

4. **📊 Laporan & Mutasi Realtime:**
   - Rekap Pemasukan, Pengeluaran, dan Laba Bersih (Hari Ini & Bulan Ini).
   - Mutasi per dompet (Total Masuk, Keluar, Saldo Akhir).
   - Breakdown kategori voucher & pengeluaran terlaris.

---

## 🚀 Cara Menjalankan & Memakai di HP

### Opsi 1: Pakai Langsung di HP Android via Wi-Fi (Paling Praktis)
1. Hubungkan HP Android Anda ke **Wi-Fi yang sama** dengan komputer ini.
2. Klik dua kali file:
   ```
   JALANKAN_MOBILE.bat
   ```
   *(atau buka CMD di folder ini lalu ketik `npm run dev`)*
3. Di layar terminal akan muncul alamat IP lokal, contoh:
   ```
   ➜  Network: http://192.168.1.5:5173/
   ```
4. Buka browser **Google Chrome** di HP Anda, ketik alamat tersebut (`http://192.168.1.5:5173`).
5. **Pasang sebagai Aplikasi (APK PWA):**
   - Di Chrome HP, tap menu titik tiga (⋮) di pojok kanan atas.
   - Pilih **"Tambahkan ke Layar Utama"** / **"Install App"**.
   - Ikon **KAS WIFI** akan muncul di menu aplikasi HP Anda seperti aplikasi native dari Play Store dan bisa dibuka secara mandiri!

---

### Opsi 2: Build Menjadi File APK Android Native (Capacitor)
Folder native Android sudah disiapkan di dalam folder `android/`.
1. Pastikan komputer Anda terpasang **Android Studio**.
2. Klik dua kali file:
   ```
   BUKA_ANDROID_STUDIO.bat
   ```
   *(atau ketik `npx cap open android` di terminal)*
3. Android Studio akan terbuka memuat proyek aplikasi.
4. Di Android Studio, pilih menu:
   **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. File `.apk` siap diinstal di semua smartphone Android!

---

## 🔌 Menghubungkan ke Server PHP Kas WiFi di PC
1. Buka menu **Pengaturan** (ikon gerigi di pojok kanan atas aplikasi mobile).
2. Ubah mode menjadi **Online (Sync MySQL)**.
3. Masukkan URL server komputer Anda, contoh:
   `http://192.168.1.5/kas-wifi` *(ganti dengan IP Wi-Fi PC Anda)*.
4. Tap tombol **"Tes IP"** untuk memastikan koneksi berhasil.
5. Tap **"Simpan Pengaturan"**. Seluruh transaksi akan otomatis terhubung ke database `kas_wifi` MySQL!

---
*Dibuat oleh PROJECT ARCELL*
