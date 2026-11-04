// src/services/storage.js
// Manajemen data lokal & sinkronisasi dengan Server MySQL PHP

const STORAGE_KEYS = {
  SERVER_URL: 'kas_wifi_server_url',
  MODE: 'kas_wifi_mode', // 'online' or 'offline'
  WALLETS: 'kas_wifi_wallets_v1',
  CATEGORIES: 'kas_wifi_categories_v1',
  TRANSACTIONS: 'kas_wifi_transactions_v1',
  TRANSFERS: 'kas_wifi_transfers_v1',
  OFFLINE_QUEUE: 'kas_wifi_offline_queue_v1',
  APP_SETTINGS: 'kas_wifi_settings_v1',
  USER: 'kas_wifi_user_v1'
};

const DEFAULT_WALLETS = [
  { id: 1, name: 'TUNAI', initial_balance: 0 },
  { id: 2, name: 'DANA', initial_balance: 0 },
  { id: 3, name: 'QRIN', initial_balance: 0 }
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
  shopName: 'ARCELL WIFI',
  shopAddress: 'Hotspot Voucher & RT/RW Net Berkah',
  printerWidth: '58mm',
  cashierName: 'Kasir Utama',
  footerNote: 'Terima kasih telah berlangganan! Password voucher tidak dapat diuangkan kembali.'
};

export const Storage = {
  getServerUrl() {
    return localStorage.getItem(STORAGE_KEYS.SERVER_URL) || 'http://192.168.66.18';
  },

  setServerUrl(url) {
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
    return JSON.parse(raw);
  },

  getCategories() {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  },

  saveCategories(cats) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
  },

  getTransactions() {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  },

  saveTransactions(trans) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(trans));
  },

  getTransfers() {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    return raw ? JSON.parse(raw) : [];
  },

  saveTransfers(transfers) {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  },

  getOfflineQueue() {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return raw ? JSON.parse(raw) : { transactions: [], transfers: [] };
  },

  saveOfflineQueue(queue) {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  // Perhitungan saldo otomatis
  computeWalletBalances() {
    const wallets = this.getWallets();
    const transactions = this.getTransactions();
    const transfers = this.getTransfers();

    let totalAll = 0;
    const computedWallets = wallets.map(w => {
      const wId = Number(w.id);
      
      const inAmount = transactions
        .filter(t => Number(t.wallet_id) === wId && t.type === 'pemasukan')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const outAmount = transactions
        .filter(t => Number(t.wallet_id) === wId && t.type === 'pengeluaran')
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

  // Tambah transaksi
  addTransaction(tx) {
    const transactions = this.getTransactions();
    const categories = this.getCategories();
    const wallets = this.getWallets();

    const cat = categories.find(c => Number(c.id) === Number(tx.category_id));
    const wallet = wallets.find(w => Number(w.id) === Number(tx.wallet_id));

    const newTx = {
      id: Date.now(),
      type: tx.type,
      wallet_id: Number(tx.wallet_id),
      wallet_name: wallet ? wallet.name : 'TUNAI',
      category_id: tx.category_id ? Number(tx.category_id) : null,
      category_name: cat ? cat.name : (tx.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'),
      amount: Number(tx.amount),
      description: tx.description || '',
      transaction_time: tx.transaction_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
      created_at: new Date().toISOString(),
      synced: false
    };

    transactions.unshift(newTx);
    this.saveTransactions(transactions);

    // Tambahkan ke offline queue
    const queue = this.getOfflineQueue();
    queue.transactions.push(newTx);
    this.saveOfflineQueue(queue);

    return newTx;
  },

  // Hapus transaksi
  deleteTransaction(id) {
    const transactions = this.getTransactions().filter(t => t.id !== id);
    this.saveTransactions(transactions);
  },

  // Tambah transfer
  addTransfer(tr) {
    const transfers = this.getTransfers();
    const wallets = this.getWallets();

    const fromWallet = wallets.find(w => Number(w.id) === Number(tr.from_wallet_id));
    const toWallet = wallets.find(w => Number(w.id) === Number(tr.to_wallet_id));

    const newTr = {
      id: Date.now(),
      from_wallet_id: Number(tr.from_wallet_id),
      from_wallet_name: fromWallet ? fromWallet.name : '',
      to_wallet_id: Number(tr.to_wallet_id),
      to_wallet_name: toWallet ? toWallet.name : '',
      amount: Number(tr.amount),
      description: tr.description || '',
      transfer_time: tr.transfer_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
      created_at: new Date().toISOString(),
      synced: false
    };

    transfers.unshift(newTr);
    this.saveTransfers(transfers);

    const queue = this.getOfflineQueue();
    queue.transfers.push(newTr);
    this.saveOfflineQueue(queue);

    return newTr;
  },

  // Inisialisasi data contoh jika baru pertama kali
  seedSampleDataIfEmpty() {
    const transactions = this.getTransactions();
    if (transactions.length === 0) {
      const now = new Date();
      const formatDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

      const samples = [
        {
          id: 1,
          type: 'pemasukan',
          wallet_id: 1,
          wallet_name: 'TUNAI',
          category_id: 2,
          category_name: 'Voucher 5 Jam',
          amount: 5000,
          description: 'Penjualan voucher 5 jam meja kasir',
          transaction_time: formatDate(now),
          synced: true
        },
        {
          id: 2,
          type: 'pemasukan',
          wallet_id: 3,
          wallet_name: 'QRIN',
          category_id: 4,
          category_name: 'Voucher 24 Jam',
          amount: 15000,
          description: 'Voucher 24 jam via QRIS Statis',
          transaction_time: formatDate(new Date(now.getTime() - 3600000 * 2)),
          synced: true
        },
        {
          id: 3,
          type: 'pemasukan',
          wallet_id: 2,
          wallet_name: 'DANA',
          category_id: 5,
          category_name: 'Langganan Bulanan Member',
          amount: 150000,
          description: 'Iuran bulanan Rumah Pak Budi',
          transaction_time: formatDate(new Date(now.getTime() - 3600000 * 5)),
          synced: true
        },
        {
          id: 4,
          type: 'pengeluaran',
          wallet_id: 1,
          wallet_name: 'TUNAI',
          category_id: 12,
          category_name: 'Konsumsi & Operasional',
          amount: 12000,
          description: 'Kopi dan cemilan kasir shift siang',
          transaction_time: formatDate(new Date(now.getTime() - 3600000 * 6)),
          synced: true
        }
      ];

      this.saveTransactions(samples);
    }
  }
};
