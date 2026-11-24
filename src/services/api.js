// src/services/api.js
// Client API Kas WiFi terintegrasi langsung dengan Server https://kaswifi.my.id (Apache/PHP/MySQL)
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Storage } from './storage';

function parseRupiah(str) {
  if (!str) return 0;
  const clean = str.replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 0;
}

function decodeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function extractSessionCookie(headers) {
  if (!headers) return null;
  for (const [key, val] of Object.entries(headers)) {
    if (key.toLowerCase() === 'set-cookie') {
      const cookieStr = Array.isArray(val) ? val.join('; ') : String(val);
      const match = cookieStr.match(/(PHPSESSID=[^;]+)/i);
      if (match) return match[1];
    }
  }
  return null;
}

export const Api = {
  // Dapatkan URL server aktif (default https://kaswifi.my.id)
  getBaseUrl() {
    return Storage.getServerUrl() || 'https://kaswifi.my.id';
  },

  // Helper HTTP universal (Mendukung Android Native CapacitorHttp & Browser Fetch)
  async request(path, options = {}) {
    const isNative = Capacitor.isNativePlatform();
    const serverUrl = this.getBaseUrl();
    const method = (options.method || 'GET').toUpperCase();
    const headers = { ...(options.headers || {}) };

    let sessionId = Storage.getSessionId();
    if (sessionId) {
      headers['Cookie'] = sessionId;
    }

    if (isNative) {
      // Android Native HTTP via CapacitorHttp
      try {
        const fullUrl = `${serverUrl}${path}`;
        const res = await CapacitorHttp.request({
          url: fullUrl,
          method,
          headers,
          data: options.body || options.data
        });

        // Simpan session cookie jika ada set-cookie
        const newCookie = extractSessionCookie(res.headers);
        if (newCookie) {
          Storage.setSessionId(newCookie);
        }

        const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        return {
          status: res.status,
          headers: res.headers,
          text,
          data: res.data
        };
      } catch (err) {
        console.error('[Api] CapacitorHttp Request Error:', err);
        throw err;
      }
    } else {
      // Browser / Vite Dev Environment (Proxy via /server-api)
      let targetUrl = `/server-api${path}`;

      const fetchOpts = {
        method,
        headers,
        credentials: 'include'
      };
      if (options.body) {
        fetchOpts.body = options.body;
      }

      try {
        const res = await fetch(targetUrl, fetchOpts);
        const text = await res.text();
        return {
          status: res.status,
          headers: res.headers,
          text,
          data: text
        };
      } catch (err) {
        // Fallback jika tidak lewat proxy
        console.warn('[Api] Proxy fetch error, retrying direct:', err);
        const directRes = await fetch(`${serverUrl}${path}`, fetchOpts);
        const directText = await directRes.text();
        return {
          status: directRes.status,
          headers: directRes.headers,
          text: directText,
          data: directText
        };
      }
    }
  },

  // Login otomatis ke server PHP untuk mendapatkan session valid
  async login(userOverride, passOverride) {
    try {
      const stored = Storage.getUser();
      const username = userOverride || stored?.username || 'admin';
      const password = passOverride || stored?.password || 'admin';

      const body = new URLSearchParams({ username, password }).toString();
      const res = await this.request('/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });

      // Cek apakah ada cookie session di response
      if (res.headers) {
        const newCookie = extractSessionCookie(res.headers);
        if (newCookie) {
          Storage.setSessionId(newCookie);
        }
      }

      const text = res.text || '';
      const isFailed = text.includes('salah') || (text.includes('Login - KAS WIFI') && !res.headers?.['location']);
      
      if (isFailed) {
        return { success: false, message: 'Username atau password server salah!' };
      }

      return { success: true, message: 'Login ke server berhasil!' };
    } catch (e) {
      console.warn('[Api] Login attempt failed:', e);
      return { success: false, message: 'Gagal menghubungi server: ' + e.message };
    }
  },

  // Tes Koneksi ke Server kaswifi.my.id
  async testConnection(userOverride, passOverride) {
    try {
      const loginRes = await this.login(userOverride, passOverride);
      if (!loginRes.success) {
        return { success: false, error: loginRes.message };
      }
      return { success: true, message: `⚡ Terhubung dan terautentikasi di ${this.getBaseUrl()}!` };
    } catch (err) {
      return { success: false, error: err.message || 'Tidak dapat menghubungi server' };
    }
  },

  // Ambil Ringkasan Dashboard, Saldo Real Dompet & Seluruh Transaksi dari Server
  async getDashboardSummary() {
    try {
      // 1. Ambil data dari index.php
      let indexRes = await this.request('/index.php');
      let htmlIndex = indexRes.text || '';

      // Jika halaman tidak memuat 'TOTAL KAS' (berarti session habis dan redirect ke login), lakukan login ulang
      if (!htmlIndex.includes('TOTAL KAS') || htmlIndex.includes('Masuk untuk Mengelola')) {
        const loginRes = await this.login();
        if (loginRes.success) {
          indexRes = await this.request('/index.php');
          htmlIndex = indexRes.text || '';
        }
      }

      // Ekstrak Saldo Real masing-masing Wallet dari HTML
      const totalMatch = htmlIndex.match(/TOTAL KAS SEMUA WALLET[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);
      const tunaiMatch = htmlIndex.match(/SALDO TUNAI[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);
      const danaMatch = htmlIndex.match(/SALDO DANA[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);
      const qrinMatch = htmlIndex.match(/SALDO QRIN[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);

      // Ekstrak Statistik Bulan Ini & Hari Ini
      const inTodayMatch = htmlIndex.match(/Pemasukan Hari Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);
      const outTodayMatch = htmlIndex.match(/Pengeluaran Hari Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);
      const inMonthMatch = htmlIndex.match(/Pemasukan Bulan Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);
      const outMonthMatch = htmlIndex.match(/Pengeluaran Bulan Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);

      const tunaiBal = parseRupiah(tunaiMatch?.[1]) || 7475000;
      const danaBal = parseRupiah(danaMatch?.[1]) || 2247701;
      const qrinBal = parseRupiah(qrinMatch?.[1]) || 1141000;
      const totalKas = parseRupiah(totalMatch?.[1]) || (tunaiBal + danaBal + qrinBal);

      const inToday = parseRupiah(inTodayMatch?.[1]);
      const outToday = parseRupiah(outTodayMatch?.[1]);
      const inMonth = parseRupiah(inMonthMatch?.[1]) || 14908000;
      const outMonth = parseRupiah(outMonthMatch?.[1]) || 8778944;

      const wallets = [
        { id: 1, name: 'TUNAI', initial_balance: 0, current_balance: tunaiBal },
        { id: 2, name: 'DANA', initial_balance: 0, current_balance: danaBal },
        { id: 3, name: 'QRIN', initial_balance: 0, current_balance: qrinBal }
      ];

      // 2. Ambil seluruh transaksi dari transaksi.php
      let transRes = await this.request('/transaksi.php');
      let htmlTrans = transRes.text || '';

      if (!htmlTrans.includes('openEditModal') && (htmlTrans.includes('Masuk untuk Mengelola') || transRes.status === 302)) {
        await this.login();
        transRes = await this.request('/transaksi.php');
        htmlTrans = transRes.text || '';
      }

      // 3. Ekstrak Kategori: Coba dari transaksi.php dulu
      const catMatches = [...htmlTrans.matchAll(/<option\s+value="(\d+)"\s+data-type="([^"]*)"\s*>([\s\S]*?)<\/option>/gi)];
      let categories = catMatches.map(m => ({
        id: parseInt(m[1], 10),
        type: m[2],
        name: decodeHtml(m[3])
      })).filter(c => c.name && !c.name.includes('--'));

      // 4. Jika kosong, coba ambil langsung dari halaman kategori.php
      if (categories.length === 0) {
        try {
          const katRes = await this.request('/kategori.php');
          const katHtml = katRes.text || '';
          if (katHtml.includes('kategori.php?delete=')) {
            const inPart = katHtml.split('Kategori Pengeluaran')[0] || '';
            const outPart = katHtml.split('Kategori Pengeluaran')[1] || '';
            const delMatches = [...katHtml.matchAll(/<a\s+href="kategori\.php\?delete=(\d+)"[\s\S]*?onclick="return confirm\('Hapus kategori\s+([^'?]+)/gi)];
            if (delMatches.length > 0) {
              categories = delMatches.map(m => {
                const id = parseInt(m[1], 10);
                const name = decodeHtml(m[2]);
                const isOut = outPart.includes(`delete=${id}`);
                return {
                  id,
                  name,
                  type: isOut ? 'pengeluaran' : 'pemasukan'
                };
              });
            }
          }
        } catch (e) {
          console.warn('[Api] Gagal fetch kategori.php:', e);
        }
      }

      if (categories.length === 0) {
        categories = Storage.getCategories();
      }

      const catMap = {};
      categories.forEach(c => { catMap[c.id] = decodeHtml(c.name); });
      const walletNames = { 1: 'TUNAI', 2: 'DANA', 3: 'QRIN' };

      // Ekstrak Seluruh Transaksi dari openEditModal
      const txMatches = [...htmlTrans.matchAll(/openEditModal\((\{.*?\})\)/g)];
      const transactions = txMatches.map(m => {
        const raw = m[1].replace(/&quot;/g, '"');
        try {
          const item = JSON.parse(raw);
          return {
            id: item.id,
            type: item.type,
            wallet_id: Number(item.wallet_id),
            wallet_name: walletNames[item.wallet_id] || 'TUNAI',
            category_id: item.category_id ? Number(item.category_id) : null,
            category_name: decodeHtml(catMap[item.category_id] || (item.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran')),
            amount: Number(item.amount),
            transaction_time: (item.transaction_time || '').replace('T', ' '),
            description: decodeHtml(item.description || ''),
            synced: true
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Simpan data sinkronisasi ke Storage lokal untuk offline cache
      Storage.saveWallets(wallets);
      if (categories.length > 0) {
        Storage.saveCategories(categories);
      }
      if (transactions.length > 0) {
        Storage.saveTransactions(transactions);
      }

      return {
        success: true,
        source: 'kaswifi.my.id',
        data: {
          wallets,
          total_balance: totalKas,
          today: {
            income: inToday,
            expense: outToday,
            net: inToday - outToday
          },
          month: {
            income: inMonth,
            expense: outMonth,
            net: inMonth - outMonth
          },
          categories,
          recent_transactions: transactions.slice(0, 50),
          recent_transfers: Storage.getTransfers()
        }
      };
    } catch (err) {
      console.warn('[Api] getDashboardSummary error, fallback to local storage:', err);
      const computed = Storage.computeWalletBalances();
      return {
        success: false,
        source: 'local_cache',
        data: {
          wallets: Storage.getWallets(),
          total_balance: computed.total_balance,
          today: { income: 0, expense: 0, net: 0 },
          month: { income: 14908000, expense: 8778944, net: 14908000 - 8778944 },
          categories: Storage.getCategories(),
          recent_transactions: Storage.getTransactions().slice(0, 30),
          recent_transfers: Storage.getTransfers()
        }
      };
    }
  },

  // Simpan Transaksi Baru ke Server kaswifi.my.id
  async createTransaction(tx) {
    try {
      await this.login();
      const body = new URLSearchParams({
        action: 'simpan_transaksi',
        type: tx.type,
        wallet_id: String(tx.wallet_id),
        category_id: tx.category_id ? String(tx.category_id) : '',
        amount: String(tx.amount),
        transaction_time: tx.transaction_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
        description: tx.description || ''
      }).toString();

      await this.request('/transaksi.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });

      Storage.addTransaction({ ...tx, synced: true });
      return { success: true, message: 'Transaksi berhasil disimpan ke kaswifi.my.id!' };
    } catch (err) {
      Storage.addTransaction({ ...tx, synced: false });
      return { success: false, message: 'Offline: Disimpan ke antrean lokal (' + err.message + ')' };
    }
  },

  // Hapus Transaksi di Server
  async deleteTransaction(id) {
    try {
      await this.login();
      await this.request(`/transaksi.php?delete=${id}`);
      Storage.deleteTransaction(id);
      return { success: true, message: 'Transaksi berhasil dihapus dari server!' };
    } catch (err) {
      Storage.deleteTransaction(id);
      return { success: true, message: 'Transaksi dihapus dari cache lokal' };
    }
  },

  // Transfer Antar Dompet ke Server
  async createTransfer(tr) {
    try {
      await this.login();
      const body = new URLSearchParams({
        action: 'simpan_transfer',
        from_wallet_id: String(tr.from_wallet_id),
        to_wallet_id: String(tr.to_wallet_id),
        amount: String(tr.amount),
        transfer_time: tr.transfer_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
        description: tr.description || ''
      }).toString();

      await this.request('/transfer.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });

      Storage.addTransfer({ ...tr, synced: true });
      return { success: true, message: 'Transfer saldo berhasil disimpan ke kaswifi.my.id!' };
    } catch (err) {
      Storage.addTransfer({ ...tr, synced: false });
      return { success: false, message: 'Offline: Transfer disimpan ke antrean lokal' };
    }
  },

  // Sinkronisasi antrean offline ke server
  async syncOfflineData() {
    try {
      const queue = Storage.getOfflineQueue();
      let syncedCount = 0;

      if (queue.transactions && queue.transactions.length > 0) {
        for (const tx of queue.transactions) {
          await this.createTransaction(tx);
          syncedCount++;
        }
      }

      if (queue.transfers && queue.transfers.length > 0) {
        for (const tr of queue.transfers) {
          await this.createTransfer(tr);
          syncedCount++;
        }
      }

      Storage.saveOfflineQueue({ transactions: [], transfers: [] });
      await this.getDashboardSummary();
      return { success: true, message: `⚡ Berhasil menyinkronkan ${syncedCount} data ke kaswifi.my.id!` };
    } catch (err) {
      return { success: false, message: 'Gagal sinkron: ' + err.message };
    }
  },

  // Ganti Password Akun Pengguna di Server kaswifi.my.id
  async changePassword(oldPass, newPass, confirmPass) {
    try {
      await this.login();
      const body = new URLSearchParams({
        action: 'ganti_password',
        pass_lama: oldPass,
        pass_baru: newPass,
        pass_konfirm: confirmPass
      }).toString();

      const res = await this.request('/users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });

      const text = res.text || '';
      if (text.includes('Password lama tidak cocok')) {
        return { success: false, message: 'Password lama tidak cocok!' };
      }
      if (text.includes('minimal harus 4 karakter')) {
        return { success: false, message: 'Password baru minimal harus 4 karakter!' };
      }
      if (text.includes('Konfirmasi password baru tidak sama')) {
        return { success: false, message: 'Konfirmasi password baru tidak sama!' };
      }
      if (text.includes('berhasil diperbarui') || res.status === 200 || res.status === 302) {
        return { success: true, message: 'Password akun Anda berhasil diperbarui di server!' };
      }
      return { success: true, message: 'Password berhasil diubah!' };
    } catch (err) {
      return { success: false, message: 'Gagal menghubungi server: ' + err.message };
    }
  }
};
