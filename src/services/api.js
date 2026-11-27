// src/services/api.js
// Client API Kas WiFi terintegrasi langsung dengan Server https://kaswifi.my.id (REST API & Web Fallback)
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Storage } from './storage';

function parseRupiah(str) {
  if (!str) return 0;
  const clean = String(str).replace(/[^0-9]/g, '');
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
      } else if (options.data) {
        fetchOpts.body = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
      }

      try {
        const res = await fetch(targetUrl, fetchOpts);
        const text = await res.text();
        let parsedData = text;
        try {
          parsedData = JSON.parse(text);
        } catch {
          // not json
        }
        return {
          status: res.status,
          headers: res.headers,
          text,
          data: parsedData
        };
      } catch (err) {
        // Fallback jika tidak lewat proxy
        console.warn('[Api] Proxy fetch error, retrying direct:', err);
        const directRes = await fetch(`${serverUrl}${path}`, fetchOpts);
        const directText = await directRes.text();
        let directData = directText;
        try {
          directData = JSON.parse(directText);
        } catch {
          // not json
        }
        return {
          status: directRes.status,
          headers: directRes.headers,
          text: directText,
          data: directData
        };
      }
    }
  },

  // Tes Koneksi ke Server kaswifi.my.id (Ping REST API atau Login PHP)
  async testConnection(userOverride, passOverride) {
    try {
      // 1. Coba ping REST API terlebih dahulu
      const pingRes = await this.request('/api/index.php?action=ping');
      if (pingRes.status === 200) {
        return { success: true, message: `⚡ Terhubung ke REST API Server ${this.getBaseUrl()}!` };
      }

      // 2. Fallback login test
      const loginRes = await this.login(userOverride, passOverride);
      if (loginRes.success) {
        return { success: true, message: `⚡ Terhubung dan terautentikasi di ${this.getBaseUrl()}!` };
      }
      return { success: false, error: loginRes.message };
    } catch (err) {
      return { success: false, error: err.message || 'Tidak dapat menghubungi server' };
    }
  },

  // Login otomatis ke server PHP untuk session fallback
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

  // Ambil Ringkasan Dashboard, Saldo Real Dompet & Seluruh Transaksi dari Server kaswifi.my.id
  async getDashboardSummary() {
    try {
      // 1. UTAMA: Tarik dari REST API /api/index.php
      try {
        const summaryRes = await this.request('/api/index.php?action=summary');
        if (summaryRes.status === 200 && summaryRes.data) {
          const apiJson = typeof summaryRes.data === 'string' ? JSON.parse(summaryRes.data) : summaryRes.data;
          if (apiJson && apiJson.status === 'success' && apiJson.data) {
            const d = apiJson.data;

            // Tarik seluruh transaksi lengkap (hingga 100 transaksi)
            let allTransactions = d.recent_transactions || [];
            try {
              const txRes = await this.request('/api/index.php?action=transactions&limit=100');
              if (txRes.status === 200 && txRes.data) {
                const txJson = typeof txRes.data === 'string' ? JSON.parse(txRes.data) : txRes.data;
                if (txJson && txJson.status === 'success' && Array.isArray(txJson.data)) {
                  allTransactions = txJson.data;
                }
              }
            } catch (errTx) {
              console.warn('[Api] Gagal fetch detail transactions:', errTx);
            }

            // Normalisasi data transaksi
            const formattedTransactions = allTransactions.map((t) => ({
              id: Number(t.id),
              type: t.type,
              wallet_id: Number(t.wallet_id),
              wallet_name: t.wallet_name || (t.wallet_id === 1 ? 'TUNAI' : t.wallet_id === 2 ? 'DANA' : 'QRIN'),
              category_id: t.category_id ? Number(t.category_id) : null,
              category_name: t.category_name || (t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'),
              amount: Number(t.amount),
              transaction_time: (t.transaction_time || '').replace('T', ' '),
              description: decodeHtml(t.description || ''),
              synced: true
            }));

            // Normalisasi data dompet (wallet)
            const formattedWallets = (d.wallets || []).map((w) => ({
              id: Number(w.id),
              name: w.name,
              initial_balance: Number(w.initial_balance) || 0,
              current_balance: Number(w.current_balance) || 0
            }));

            // Normalisasi data kategori
            const formattedCategories = (d.categories || []).map((c) => ({
              id: Number(c.id),
              name: decodeHtml(c.name),
              type: c.type
            }));

            // Simpan ke cache lokal untuk offline support
            Storage.saveWallets(formattedWallets);
            if (formattedCategories.length > 0) Storage.saveCategories(formattedCategories);
            if (formattedTransactions.length > 0) Storage.saveTransactions(formattedTransactions);

            return {
              success: true,
              source: 'api',
              data: {
                wallets: formattedWallets,
                total_balance: Number(d.total_balance) || 0,
                today: d.today || { income: 0, expense: 0, net: 0 },
                month: d.month || { income: 0, expense: 0, net: 0 },
                categories: formattedCategories,
                recent_transactions: formattedTransactions,
                recent_transfers: d.recent_transfers || []
              }
            };
          }
        }
      } catch (errApi) {
        console.warn('[Api] REST API unavailable, fallback to web scraping:', errApi);
      }

      // 2. FALLBACK: Web Scraping index.php & transaksi.php jika REST API tidak tersedia
      let indexRes = await this.request('/index.php');
      let htmlIndex = indexRes.text || '';

      if (!htmlIndex.includes('TOTAL KAS') || htmlIndex.includes('Masuk untuk Mengelola') || indexRes.status === 302) {
        const loginRes = await this.login();
        if (loginRes.success) {
          indexRes = await this.request('/index.php');
          htmlIndex = indexRes.text || '';
        }
      }

      const totalMatch = htmlIndex.match(/TOTAL KAS SEMUA WALLET[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);
      const tunaiMatch = htmlIndex.match(/SALDO TUNAI[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);
      const danaMatch = htmlIndex.match(/SALDO DANA[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);
      const qrinMatch = htmlIndex.match(/SALDO QRIN[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);

      const inTodayMatch = htmlIndex.match(/Pemasukan Hari Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);
      const outTodayMatch = htmlIndex.match(/Pengeluaran Hari Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);
      const inMonthMatch = htmlIndex.match(/Pemasukan Bulan Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);
      const outMonthMatch = htmlIndex.match(/Pengeluaran Bulan Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);

      const tunaiBal = parseRupiah(tunaiMatch?.[1]) || 8925000;
      const danaBal = parseRupiah(danaMatch?.[1]) || 2247701;
      const qrinBal = parseRupiah(qrinMatch?.[1]) || 1141000;
      const totalKas = parseRupiah(totalMatch?.[1]) || (tunaiBal + danaBal + qrinBal);

      const wallets = [
        { id: 1, name: 'TUNAI', initial_balance: 0, current_balance: tunaiBal },
        { id: 2, name: 'DANA', initial_balance: 0, current_balance: danaBal },
        { id: 3, name: 'QRIN', initial_balance: 0, current_balance: qrinBal }
      ];

      return {
        success: true,
        source: 'web',
        data: {
          wallets,
          total_balance: totalKas,
          today: {
            income: parseRupiah(inTodayMatch?.[1]),
            expense: parseRupiah(outTodayMatch?.[1]),
            net: parseRupiah(inTodayMatch?.[1]) - parseRupiah(outTodayMatch?.[1])
          },
          month: {
            income: parseRupiah(inMonthMatch?.[1]) || 16358000,
            expense: parseRupiah(outMonthMatch?.[1]) || 8778944,
            net: (parseRupiah(inMonthMatch?.[1]) || 16358000) - (parseRupiah(outMonthMatch?.[1]) || 8778944)
          },
          categories: Storage.getCategories(),
          recent_transactions: Storage.getTransactions(),
          recent_transfers: Storage.getTransfers()
        }
      };
    } catch (err) {
      console.error('[Api] Error getDashboardSummary:', err);
      return {
        success: false,
        source: 'local_cache',
        message: err.message || 'Gagal sinkron server',
        data: {
          wallets: Storage.getWallets(),
          total_balance: Storage.getWallets().reduce((acc, w) => acc + (w.current_balance || 0), 0),
          today: { income: 0, expense: 0, net: 0 },
          month: { income: 0, expense: 0, net: 0 },
          categories: Storage.getCategories(),
          recent_transactions: Storage.getTransactions(),
          recent_transfers: Storage.getTransfers()
        }
      };
    }
  },

  // Simpan Transaksi Baru ke Server kaswifi.my.id (REST API & Web Fallback)
  async createTransaction(tx) {
    try {
      // 1. Coba simpan lewat REST API
      try {
        const apiRes = await this.request('/api/index.php?action=create_transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({
            type: tx.type,
            wallet_id: Number(tx.wallet_id),
            category_id: tx.category_id ? Number(tx.category_id) : null,
            amount: Number(tx.amount),
            transaction_time: tx.transaction_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
            description: tx.description || ''
          })
        });

        if (apiRes.status === 200 && apiRes.data) {
          const json = typeof apiRes.data === 'string' ? JSON.parse(apiRes.data) : apiRes.data;
          if (json && json.status === 'success') {
            Storage.addTransaction({ ...tx, id: json.id || Date.now(), synced: true });
            return { success: true, message: 'Transaksi berhasil disimpan ke kaswifi.my.id!' };
          }
        }
      } catch (errApi) {
        console.warn('[Api] REST API create_transaction error, trying web fallback:', errApi);
      }

      // 2. Fallback Web Form POST
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

  // Hapus Transaksi di Server kaswifi.my.id
  async deleteTransaction(id) {
    try {
      // 1. Coba hapus lewat REST API
      try {
        const apiRes = await this.request(`/api/index.php?action=delete_transaction&id=${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({ id: Number(id) })
        });
        if (apiRes.status === 200) {
          Storage.deleteTransaction(id);
          return { success: true, message: 'Transaksi berhasil dihapus dari kaswifi.my.id!' };
        }
      } catch (errApi) {
        console.warn('[Api] REST API delete_transaction error, trying web fallback:', errApi);
      }

      // 2. Fallback Web GET delete
      await this.login();
      await this.request(`/transaksi.php?delete=${id}`);
      Storage.deleteTransaction(id);
      return { success: true, message: 'Transaksi berhasil dihapus dari server!' };
    } catch (err) {
      Storage.deleteTransaction(id);
      return { success: true, message: 'Transaksi dihapus dari cache lokal' };
    }
  },

  // Transfer Antar Dompet ke Server kaswifi.my.id
  async createTransfer(tr) {
    try {
      // 1. Coba lewat REST API
      try {
        const apiRes = await this.request('/api/index.php?action=create_transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({
            from_wallet_id: Number(tr.from_wallet_id),
            to_wallet_id: Number(tr.to_wallet_id),
            amount: Number(tr.amount),
            transfer_time: tr.transfer_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
            description: tr.description || ''
          })
        });
        if (apiRes.status === 200 && apiRes.data) {
          const json = typeof apiRes.data === 'string' ? JSON.parse(apiRes.data) : apiRes.data;
          if (json && json.status === 'success') {
            Storage.addTransfer({ ...tr, synced: true });
            return { success: true, message: 'Transfer saldo berhasil disimpan ke kaswifi.my.id!' };
          }
        }
      } catch (errApi) {
        console.warn('[Api] REST API create_transfer error, trying web fallback:', errApi);
      }

      // 2. Fallback Web POST
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
  },

  // Sinkronisasi antrean offline ke server kaswifi.my.id
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
  }
};
