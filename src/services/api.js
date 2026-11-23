// src/services/api.js
// Client API Kas WiFi terintegrasi dengan Supabase Cloud (PostgreSQL Realtime)
import { Storage } from './storage';
import { SupabaseService } from './supabase';

export const Api = {
  // Mode sinkronisasi: 'supabase' (Cloud Realtime)
  async testConnection() {
    return await SupabaseService.testConnection();
  },

  // Ambil Ringkasan Dashboard & Seluruh Data Kas dari Supabase
  async getDashboardSummary() {
    // 1. Ambil data terbaru dari Supabase Cloud
    await SupabaseService.fetchAll();

    // 2. Hitung statistik saldo, pemasukan, dan pengeluaran
    const computed = Storage.computeWalletBalances();
    const transactions = Storage.getTransactions();
    const transfers = Storage.getTransfers();
    const categories = Storage.getCategories();

    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);

    const inToday = transactions
      .filter((t) => t.type === 'pemasukan' && (t.transaction_time || '').startsWith(todayStr))
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const outToday = transactions
      .filter((t) => t.type === 'pengeluaran' && (t.transaction_time || '').startsWith(todayStr))
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const inMonth = transactions
      .filter((t) => t.type === 'pemasukan' && (t.transaction_time || '').startsWith(monthStr))
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const outMonth = transactions
      .filter((t) => t.type === 'pengeluaran' && (t.transaction_time || '').startsWith(monthStr))
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    return {
      success: true,
      source: 'supabase',
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
        recent_transactions: transactions.slice(0, 30),
        recent_transfers: transfers.slice(0, 15)
      }
    };
  },

  // Ambil Daftar Transaksi
  async getTransactions() {
    const list = Storage.getTransactions();
    return { success: true, data: list, source: 'supabase' };
  },

  // Tambah Transaksi (Otomatis Tersimpan di Supabase Cloud)
  async createTransaction(tx) {
    return await SupabaseService.createTransaction(tx);
  },

  // Tambah Transfer Saldo (Otomatis Tersimpan di Supabase Cloud)
  async createTransfer(tr) {
    return await SupabaseService.createTransfer(tr);
  },

  // Hapus Transaksi
  async deleteTransaction(id) {
    return await SupabaseService.deleteTransaction(id);
  },

  // Sinkronisasi antrean offline jika ada
  async syncOfflineData() {
    try {
      const computed = Storage.computeWalletBalances();
      await SupabaseService.saveAll({
        wallets: computed.wallets,
        transactions: Storage.getTransactions(),
        transfers: Storage.getTransfers(),
        categories: Storage.getCategories()
      });
      Storage.saveOfflineQueue({ transactions: [], transfers: [] });
      return { success: true, message: '⚡ Berhasil disinkronkan ke Supabase Cloud!' };
    } catch (err) {
      return { success: false, message: 'Gagal sinkron: ' + err.message };
    }
  }
};
