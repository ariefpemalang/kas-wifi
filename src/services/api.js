// src/services/api.js
// Client API untuk sinkronisasi Mobile App dengan Backend PHP Kas WiFi di Server / PC
import { Storage } from './storage';

export const Api = {
  // Kandidat URL server kas wifi
  SERVER_CANDIDATES: [
    'https://kaswifi.my.id',
    'http://192.168.66.18',
    'http://localhost/kas-wifi',
    'http://127.0.0.1/kas-wifi'
  ],

  async testConnection(serverUrl) {
    const url = (serverUrl || Storage.getServerUrl()).replace(/\/+$/, '');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${url}/api/index.php?action=ping`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { success: true, data, url };
    } catch (err) {
      return { success: false, error: err.message, url };
    }
  },

  // Cari otomatis server yang aktif
  async findActiveServer() {
    const current = Storage.getServerUrl();
    const testCurrent = await this.testConnection(current);
    if (testCurrent.success) return current;

    for (const cand of this.SERVER_CANDIDATES) {
      if (cand === current) continue;
      const test = await this.testConnection(cand);
      if (test.success) {
        Storage.setServerUrl(cand);
        return cand;
      }
    }
    return current;
  },

  async getDashboardSummary() {
    const mode = Storage.getMode();
    const url = Storage.getServerUrl().replace(/\/+$/, '');

    if (mode === 'online') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${url}/api/index.php?action=summary`, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success' && json.data) {
            // Update cache lokal
            if (json.data.wallets) Storage.saveWallets(json.data.wallets);
            if (json.data.categories) Storage.saveCategories(json.data.categories);
            if (json.data.recent_transactions) {
              const fullTxs = Storage.getTransactions();
              if (fullTxs.length === 0) {
                Storage.saveTransactions(json.data.recent_transactions.map(t => ({ ...t, synced: true })));
              }
            }
            if (json.data.recent_transfers) {
              const fullTrs = Storage.getTransfers();
              if (fullTrs.length === 0) {
                Storage.saveTransfers(json.data.recent_transfers.map(tr => ({ ...tr, synced: true })));
              }
            }

            return { success: true, data: json.data, source: 'server' };
          }
        }
      } catch (e) {
        console.warn('Gagal terhubung ke API server, beralih ke cache lokal:', e.message);
      }
    }

    // Perhitungan kalkulasi lokal jika offline
    const computed = Storage.computeWalletBalances();
    const transactions = Storage.getTransactions();
    const transfers = Storage.getTransfers();
    const categories = Storage.getCategories();

    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);

    const inToday = transactions
      .filter(t => t.type === 'pemasukan' && (t.transaction_time || '').startsWith(todayStr))
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const outToday = transactions
      .filter(t => t.type === 'pengeluaran' && (t.transaction_time || '').startsWith(todayStr))
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const inMonth = transactions
      .filter(t => t.type === 'pemasukan' && (t.transaction_time || '').startsWith(monthStr))
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const outMonth = transactions
      .filter(t => t.type === 'pengeluaran' && (t.transaction_time || '').startsWith(monthStr))
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    return {
      success: true,
      source: 'local',
      data: {
        wallets: computed.wallets,
        total_balance: computed.total_balance,
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
        recent_transactions: transactions.slice(0, 20),
        recent_transfers: transfers.slice(0, 10)
      }
    };
  },

  async getTransactions(params = {}) {
    const mode = Storage.getMode();
    const url = Storage.getServerUrl().replace(/\/+$/, '');

    if (mode === 'online') {
      try {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${url}/api/index.php?action=transactions&${query}`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success' && Array.isArray(json.data)) {
            // Update local storage
            Storage.saveTransactions(json.data.map(t => ({ ...t, synced: true })));
            return { success: true, data: json.data, source: 'server' };
          }
        }
      } catch (err) {
        console.warn('Gagal ambil transaksi server, gunakan data lokal:', err.message);
      }
    }

    return { success: true, data: Storage.getTransactions(), source: 'local' };
  },

  async createTransaction(tx) {
    const mode = Storage.getMode();
    const url = Storage.getServerUrl().replace(/\/+$/, '');

    const localTx = Storage.addTransaction(tx);

    if (mode === 'online') {
      try {
        const res = await fetch(`${url}/api/index.php?action=create_transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tx)
        });
        const resData = await res.json();
        if (res.ok && resData.status === 'success') {
          // Tandai sudah synced
          const all = Storage.getTransactions();
          const target = all.find(t => t.id === localTx.id);
          if (target) {
            target.synced = true;
            Storage.saveTransactions(all);
          }
          return { success: true, data: localTx, synced: true };
        }
      } catch (err) {
        console.warn('Gagal simpan ke server, transaksi disimpan di antrean offline:', err.message);
      }
    }

    return { success: true, data: localTx, synced: false };
  },

  async createTransfer(tr) {
    const mode = Storage.getMode();
    const url = Storage.getServerUrl().replace(/\/+$/, '');

    const localTr = Storage.addTransfer(tr);

    if (mode === 'online') {
      try {
        const res = await fetch(`${url}/api/index.php?action=create_transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tr)
        });
        const resData = await res.json();
        if (res.ok && resData.status === 'success') {
          return { success: true, data: localTr, synced: true };
        }
      } catch (err) {
        console.warn('Gagal kirim transfer ke server, disimpan offline:', err.message);
      }
    }

    return { success: true, data: localTr, synced: false };
  },

  async deleteTransaction(id) {
    const mode = Storage.getMode();
    const url = Storage.getServerUrl().replace(/\/+$/, '');

    Storage.deleteTransaction(id);

    if (mode === 'online') {
      try {
        await fetch(`${url}/api/index.php?action=delete_transaction&id=${id}`, {
          method: 'POST'
        });
      } catch (e) {
        console.warn('Gagal hapus transaksi di server:', e);
      }
    }
  },

  async syncOfflineData() {
    const url = Storage.getServerUrl().replace(/\/+$/, '');
    const queue = Storage.getOfflineQueue();

    if (queue.transactions.length === 0 && queue.transfers.length === 0) {
      return { success: true, message: 'Semua data sudah tersinkronisasi!' };
    }

    try {
      const res = await fetch(`${url}/api/index.php?action=sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queue)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        Storage.saveOfflineQueue({ transactions: [], transfers: [] });
        return { success: true, message: data.message || 'Sinkronisasi berhasil!' };
      }
      return { success: false, message: data.message || 'Sinkronisasi gagal' };
    } catch (err) {
      return { success: false, message: 'Gagal menghubungi server: ' + err.message };
    }
  }
};
