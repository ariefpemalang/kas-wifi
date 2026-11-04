// src/services/api.js
// Client API untuk menghubungkan Mobile App dengan Backend PHP Kas WiFi di PC
import { Storage } from './storage';

export const Api = {
  async testConnection(serverUrl) {
    const url = serverUrl || Storage.getServerUrl();
    try {
      const res = await fetch(`${url}/api/index.php?action=ping`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async login(username, password) {
    const url = Storage.getServerUrl();
    const mode = Storage.getMode();

    if (mode === 'offline') {
      // Offline fallback login
      if (username === 'admin' && password === 'admin') {
        const user = { id: 1, username: 'admin', nama_lengkap: 'Administrator WiFi', role: 'admin' };
        Storage.setUser(user);
        return { success: true, user };
      }
      return { success: false, message: 'Mode offline: gunakan username: admin & password: admin' };
    }

    try {
      const res = await fetch(`${url}/api/index.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        Storage.setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Login gagal' };
    } catch (err) {
      return { success: false, message: 'Gagal terhubung ke server kas-wifi: ' + err.message };
    }
  },

  async getDashboardSummary() {
    const mode = Storage.getMode();
    const url = Storage.getServerUrl();

    if (mode === 'online') {
      try {
        const res = await fetch(`${url}/api/index.php?action=summary`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success') {
            return { success: true, data: json.data, source: 'server' };
          }
        }
      } catch (e) {
        console.warn('API error, falling back to local storage', e);
      }
    }

    // Local / Offline calculation
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

  async createTransaction(tx) {
    const mode = Storage.getMode();
    const url = Storage.getServerUrl();

    // Simpan di local storage dulu
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
        console.warn('Gagal sync ke server saat ini, disimpan di antrean offline', err);
      }
    }

    return { success: true, data: localTx, synced: false };
  },

  async createTransfer(tr) {
    const mode = Storage.getMode();
    const url = Storage.getServerUrl();

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
        console.warn('Gagal sync transfer ke server, disimpan offline', err);
      }
    }

    return { success: true, data: localTr, synced: false };
  },

  async syncOfflineData() {
    const url = Storage.getServerUrl();
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
        // Bersihkan antrean offline
        Storage.saveOfflineQueue({ transactions: [], transfers: [] });
        return { success: true, message: data.message || 'Sinkronisasi berhasil!' };
      }
      return { success: false, message: data.message || 'Sinkronisasi gagal' };
    } catch (err) {
      return { success: false, message: 'Gagal menghubungi server: ' + err.message };
    }
  }
};
