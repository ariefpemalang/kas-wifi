// src/services/storage.js
// Manajemen data lokal & sinkronisasi dengan Server MySQL PHP

const STORAGE_KEYS = {
  SERVER_URL: 'kas_wifi_server_url',
  MODE: 'kas_wifi_mode', // 'online' or 'offline'
  WALLETS: 'kas_wifi_wallets_v2',
  CATEGORIES: 'kas_wifi_categories_v2',
  TRANSACTIONS: 'kas_wifi_transactions_v2',
  TRANSFERS: 'kas_wifi_transfers_v2',
  OFFLINE_QUEUE: 'kas_wifi_offline_queue_v2',
  APP_SETTINGS: 'kas_wifi_settings_v2',
  USER: 'kas_wifi_user_v2'
};

const DEFAULT_WALLETS = [
  { id: 1, name: 'TUNAI', initial_balance: 0, current_balance: 0 },
  { id: 2, name: 'DANA', initial_balance: 0, current_balance: 0 },
  { id: 3, name: 'QRIN', initial_balance: 0, current_balance: 0 }
];

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Voucher 2 Jam', type: 'pemasukan' },
  { id: 2, name: 'Voucher 5 Jam', type: 'pemasukan' },
  { id: 3, name: 'Voucher 12 Jam', type: 'pemasukan' },
  { id: 4, name: 'Voucher 24 Jam', type: 'pemasukan' },
  { id: 5, name: 'Langganan Bulanan Member', type: 'pemasukan' },
  { id: 6, name: 'Jasa Setting / Pasang Baru', type: 'pemasukan' },
  { id: 7, name: 'Pemasukan Lain-lain', type: 'pemasukan' },
  { id: 8, name: 'Beli Bandwidth / ISP Internet', type: 'pengeluaran' },
  { id: 9, name: 'Listrik & Token PLN', type: 'pengeluaran' },
  { id: 10, name: 'Beli Router / Alat / Kabel', type: 'pengeluaran' },
  { id: 11, name: 'Gaji / Uang Jaga / Kasir', type: 'pengeluaran' },
  { id: 12, name: 'Konsumsi & Operasional', type: 'pengeluaran' },
  { id: 13, name: 'Perawatan / Maintenance', type: 'pengeluaran' },
  { id: 14, name: 'Pengeluaran Lain-lain', type: 'pengeluaran' }
];

const DEFAULT_SETTINGS = {
  shopName: 'KAS WIFI',
  shopAddress: 'Hotspot Voucher & RT/RW Net Berkah',
  printerWidth: '58mm',
  cashierName: 'Kasir Utama',
  footerNote: 'Terima kasih telah berlangganan! Password voucher tidak dapat diuangkan kembali.'
};

export const Storage = {
  getServerUrl() {
    return localStorage.getItem(STORAGE_KEYS.SERVER_URL) || 'https://kaswifi.my.id';
  },

  setServerUrl(url) {
    if (!url) return;
    localStorage.setItem(STORAGE_KEYS.SERVER_URL, url.replace(/\/+$/, ''));
  },

  getMode() {
    return localStorage.getItem(STORAGE_KEYS.MODE) || 'online';
  },

  setMode(mode) {
    localStorage.setItem(STORAGE_KEYS.MODE, mode);
  },

  getUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : { username: 'admin', nama_lengkap: 'Kasir WiFi', role: 'admin' };
  },

  setUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  },

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
  },

  getWallets() {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(DEFAULT_WALLETS));
      return DEFAULT_WALLETS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_WALLETS;
    }
  },

  saveWallets(wallets) {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  },

  getCategories() {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(cats) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
  },

  getTransactions() {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveTransactions(txs) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  },

  getTransfers() {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveTransfers(trs) {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(trs));
  },

  getOfflineQueue() {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return raw ? JSON.parse(raw) : { transactions: [], transfers: [] };
  },

  saveOfflineQueue(queue) {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  // Hitung ulang saldo seluruh dompet berdasarkan transaksi & transfer
  computeWalletBalances() {
    const wallets = this.getWallets();
    const transactions = this.getTransactions();
    const transfers = this.getTransfers();

    let totalAll = 0;

    const computedWallets = wallets.map(w => {
      const wId = Number(w.id);

      const inAmount = transactions
        .filter(t => t.type === 'pemasukan' && Number(t.wallet_id) === wId)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const outAmount = transactions
        .filter(t => t.type === 'pengeluaran' && Number(t.wallet_id) === wId)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const trInAmount = transfers
        .filter(tr => Number(tr.to_wallet_id) === wId)
        .reduce((sum, tr) => sum + Number(tr.amount || 0), 0);

      const trOutAmount = transfers
        .filter(tr => Number(tr.from_wallet_id) === wId)
        .reduce((sum, tr) => sum + Number(tr.amount || 0), 0);

      const currentBalance = Number(w.initial_balance || 0) + inAmount - outAmount + trInAmount - trOutAmount;
      totalAll += currentBalance;

      return {
        ...w,
        total_in: inAmount,
        total_out: outAmount,
        transfer_in: trInAmount,
        transfer_out: trOutAmount,
        current_balance: currentBalance
      };
    });

    return {
      wallets: computedWallets,
      total_balance: totalAll
    };
  },

  addTransaction(tx) {
    const transactions = this.getTransactions();
    const categories = this.getCategories();
    const wallets = this.getWallets();

    const cat = categories.find(c => Number(c.id) === Number(tx.category_id));
    const wallet = wallets.find(w => Number(w.id) === Number(tx.wallet_id));

    const newTx = {
      id: tx.id || Date.now(),
      type: tx.type,
      wallet_id: Number(tx.wallet_id),
      wallet_name: wallet ? wallet.name : (tx.wallet_name || 'TUNAI'),
      category_id: tx.category_id ? Number(tx.category_id) : null,
      category_name: cat ? cat.name : (tx.category_name || (tx.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran')),
      amount: Number(tx.amount),
      description: tx.description || '',
      transaction_time: tx.transaction_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
      created_at: new Date().toISOString(),
      synced: tx.synced || false
    };

    transactions.unshift(newTx);
    this.saveTransactions(transactions);

    if (!tx.synced) {
      const queue = this.getOfflineQueue();
      queue.transactions.push(newTx);
      this.saveOfflineQueue(queue);
    }

    return newTx;
  },

  deleteTransaction(id) {
    const transactions = this.getTransactions().filter(t => t.id !== id);
    this.saveTransactions(transactions);
  },

  addTransfer(tr) {
    const transfers = this.getTransfers();
    const wallets = this.getWallets();

    const fromWallet = wallets.find(w => Number(w.id) === Number(tr.from_wallet_id));
    const toWallet = wallets.find(w => Number(w.id) === Number(tr.to_wallet_id));

    const newTr = {
      id: tr.id || Date.now(),
      from_wallet_id: Number(tr.from_wallet_id),
      from_wallet_name: fromWallet ? fromWallet.name : (tr.from_wallet_name || ''),
      to_wallet_id: Number(tr.to_wallet_id),
      to_wallet_name: toWallet ? toWallet.name : (tr.to_wallet_name || ''),
      amount: Number(tr.amount),
      description: tr.description || '',
      transfer_time: tr.transfer_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
      created_at: new Date().toISOString(),
      synced: tr.synced || false
    };

    transfers.unshift(newTr);
    this.saveTransfers(transfers);

    if (!tr.synced) {
      const queue = this.getOfflineQueue();
      queue.transfers.push(newTr);
      this.saveOfflineQueue(queue);
    }

    return newTr;
  }
};
