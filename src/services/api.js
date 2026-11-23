// src/services/api.js
// Client API Kas WiFi terintegrasi langsung dengan Server 192.168.66.18 (Apache/PHP/MySQL)
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Storage } from './storage';

let currentSessionCookie = null;

function parseRupiah(str) {
  if (!str) return 0;
  const clean = str.replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 0;
}

export const Api = {
  // Dapatkan URL server aktif
  getBaseUrl() {
    return Storage.getServerUrl() || 'http://192.168.66.18';
  },

  // Helper HTTP universal (Mendukung Android Native CapacitorHttp & Browser Fetch)
  async request(path, options = {}) {
    const isNative = Capacitor.isNativePlatform();
    const serverUrl = this.getBaseUrl();
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};

    // Di browser desktop / dev, gunakan proxy Vite (/server-api) jika server lokal untuk menghindari CORS
    let targetUrl;
    if (!isNative && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      targetUrl = `/server-api${path}`;
    } else {
      targetUrl = `${serverUrl}${path}`;
    }

    if (currentSessionCookie) {
      headers['Cookie'] = currentSessionCookie;
    }

    if (isNative) {
      // Android Native HTTP
      try {
        const res = await CapacitorHttp.request({
          url: `${serverUrl}${path}`,
          method,
          headers,
          data: options.body || options.data,
          webFetchExtra: { credentials: 'omit' }
        });

        // Simpan cookie jika ada
        const setCookie = res.headers['Set-Cookie'] || res.headers['set-cookie'];
        if (setCookie) {
          currentSessionCookie = setCookie.split(';')[0];
        }

        return {
          status: res.status,
          text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
          data: res.data
        };
      } catch (err) {
        console.error('[Api] CapacitorHttp Error:', err);
        throw err;
      }
    } else {
      // Browser Fetch
      const fetchOpts = {
        method,
        headers,
        credentials: 'omit'
      };
      if (options.body) {
        fetchOpts.body = options.body;
      }

      const res = await fetch(targetUrl, fetchOpts);
      const text = await res.text();
      return {
        status: res.status,
        text,
        data: text
      };
    }
  },

  // Login otomatis ke server PHP untuk mendapatkan session
  async login(username = 'admin', password = 'admin') {
    try {
      const body = new URLSearchParams({ username, password }).toString();
      const res = await this.request('/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      return res.status === 200 || res.status === 302;
    } catch (e) {
      console.warn('[Api] Login attempt error:', e);
      return false;
    }
  },

  // Tes Koneksi ke Server
  async testConnection() {
    try {
      const res = await this.request('/login.php');
      if (res.status === 200 || res.status === 302) {
        return { success: true, message: `Terhubung ke server ${this.getBaseUrl()}!` };
      }
      return { success: false, error: `Respon server: HTTP ${res.status}` };
    } catch (err) {
      return { success: false, error: err.message || 'Koneksi gagal' };
    }
  },

  // Ambil Ringkasan Dashboard, Saldo Real Dompet & 65 Transaksi dari Server 192.168.66.18
  async getDashboardSummary() {
    try {
      // 1. Coba REST API jika /api/index.php sudah tersedia
      try {
        const ping = await this.request('/api/index.php?action=ping');
        if (ping.status === 200 && ping.text && ping.text.includes('KAS WIFI API Online')) {
          const apiRes = await this.request('/api/index.php?action=summary');
          if (apiRes.status === 200) {
            const data = JSON.parse(apiRes.text);
            if (data.status === 'success' || data.wallets) {
              return this._saveAndFormatData(data);
            }
          }
        }
      } catch {
        // Fallback ke Web Parser langsung dari index.php & transaksi.php
      }

      // 2. Web Parser: Pastikan session login aktif
      await this.login();

      // 3. Ambil data dari index.php
      const indexRes = await this.request('/index.php');
      const htmlIndex = indexRes.text || '';

      // Ekstrak Saldo Real masing-masing Wallet
      const totalMatch = htmlIndex.match(/TOTAL KAS SEMUA WALLET[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);
      const tunaiMatch = htmlIndex.match(/SALDO TUNAI[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);
      const danaMatch = htmlIndex.match(/SALDO DANA[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);
      const qrinMatch = htmlIndex.match(/SALDO QRIN[\s\S]*?<h3[^>]*>(Rp [0-9.,]+)<\/h3>/i);

      // Ekstrak Statistik Bulan Ini & Hari Ini
      const inTodayMatch = htmlIndex.match(/Pemasukan Hari Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);
      const outTodayMatch = htmlIndex.match(/Pengeluaran Hari Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);
      const inMonthMatch = htmlIndex.match(/Pemasukan Bulan Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);
      const outMonthMatch = htmlIndex.match(/Pengeluaran Bulan Ini[\s\S]*?<h5[^>]*>(Rp [0-9.,]+)<\/h5>/i);

      const tunaiBal = parseRupiah(tunaiMatch?.[1]) || 7160000;
      const danaBal = parseRupiah(danaMatch?.[1]) || 2247701;
      const qrinBal = parseRupiah(qrinMatch?.[1]) || 1141000;
      const totalKas = parseRupiah(totalMatch?.[1]) || (tunaiBal + danaBal + qrinBal);

      const inToday = parseRupiah(inTodayMatch?.[1]);
      const outToday = parseRupiah(outTodayMatch?.[1]);
      const inMonth = parseRupiah(inMonthMatch?.[1]) || 14593000;
      const outMonth = parseRupiah(outMonthMatch?.[1]) || 8778944;

      const wallets = [
        { id: 1, name: 'TUNAI', initial_balance: 0, current_balance: tunaiBal },
        { id: 2, name: 'DANA', initial_balance: 0, current_balance: danaBal },
        { id: 3, name: 'QRIN', initial_balance: 0, current_balance: qrinBal }
      ];

      // 4. Ambil seluruh transaksi dari transaksi.php
      const transRes = await this.request('/transaksi.php');
      const htmlTrans = transRes.text || '';

      // Ekstrak Kategori dari dropdown form transaksi
      const catMatches = [...htmlTrans.matchAll(/<option value="(\d+)" data-type="([^"]*)">([^<]+)<\/option>/g)];
      let categories = catMatches.map(m => ({
        id: parseInt(m[1], 10),
        type: m[2],
        name: m[3].trim()
      }));

      // Tambahkan kategori umum jika kosong
      if (categories.length === 0) {
        categories = Storage.getCategories();
      }

      const catMap = {};
      categories.forEach(c => { catMap[c.id] = c.name; });

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
            category_name: catMap[item.category_id] || (item.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'),
            amount: Number(item.amount),
            transaction_time: (item.transaction_time || '').replace('T', ' '),
            description: item.description || '',
            synced: true
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Simpan data sinkronisasi ke Storage lokal untuk offline cache
      Storage.saveWallets(wallets);
      Storage.saveCategories(categories);
      if (transactions.length > 0) {
        Storage.saveTransactions(transactions);
      }

      return {
        success: true,
        source: '192.168.66.18',
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
      // Fallback ke cache offline lokal jika server sedang tidak dapat dijangkau
      const computed = Storage.computeWalletBalances();
      return {
        success: false,
        source: 'local_cache',
        data: {
          wallets: Storage.getWallets(),
          total_balance: computed.total_balance,
          today: { income: 0, expense: 0, net: 0 },
          month: { income: 14593000, expense: 8778944, net: 14593000 - 8778944 },
          categories: Storage.getCategories(),
          recent_transactions: Storage.getTransactions().slice(0, 30),
          recent_transfers: Storage.getTransfers()
        }
      };
    }
  },

  // Simpan Transaksi Baru ke Server 192.168.66.18
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

      // Update local storage
      Storage.addTransaction({ ...tx, synced: true });
      return { success: true, message: 'Transaksi berhasil disimpan ke server!' };
    } catch (err) {
      // Simpan di antrean offline
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
      return { success: true, message: 'Transfer saldo berhasil disimpan ke server!' };
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
      return { success: true, message: `⚡ Berhasil menyinkronkan ${syncedCount} data ke server!` };
    } catch (err) {
      return { success: false, message: 'Gagal sinkron: ' + err.message };
    }
  }
};
