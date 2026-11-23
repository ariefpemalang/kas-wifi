// src/services/supabase.js
// Supabase Cloud Realtime Client untuk KAS WIFI
import { createClient } from '@supabase/supabase-js';
import { Storage } from './storage';

const SUPABASE_CONFIG = {
  url: 'https://umysveuuvouchvnakgwu.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVteXN2ZXV1dm91Y2h2bmFrZ3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5ODgyNzksImV4cCI6MjEwOTU2NDI3OX0.-H1ZhcT50KXLSlfFN7qCwxzZ1lgyC4-ZjRsLPLoxVOY',
  tableId: 'kas_wifi_database'
};

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export const SupabaseService = {
  config: SUPABASE_CONFIG,

  // Tes koneksi ke Supabase Cloud
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('id, updated_at')
        .eq('id', SUPABASE_CONFIG.tableId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return { success: true, message: 'Terhubung ke Supabase Cloud (PostgreSQL)' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Ambil seluruh data Kas WiFi dari Supabase
  async fetchAll() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('data, updated_at')
        .eq('id', SUPABASE_CONFIG.tableId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Data belum ada di cloud, inisialisasi dari default lokal
          return await this.initializeCloudDatabase();
        }
        throw error;
      }

      if (data && data.data) {
        const cloudData = data.data;
        // Simpan ke local storage sebagai cache offline
        if (Array.isArray(cloudData.wallets)) Storage.saveWallets(cloudData.wallets);
        if (Array.isArray(cloudData.categories)) Storage.saveCategories(cloudData.categories);
        if (Array.isArray(cloudData.transactions)) Storage.saveTransactions(cloudData.transactions);
        if (Array.isArray(cloudData.transfers)) Storage.saveTransfers(cloudData.transfers);

        return { success: true, data: cloudData, source: 'supabase' };
      }

      return { success: false, message: 'Data cloud kosong' };
    } catch (err) {
      console.warn('[Supabase] Gagal fetch data dari cloud, gunakan data lokal:', err.message);
      return { success: false, error: err.message, source: 'local' };
    }
  },

  // Simpan seluruh data Kas WiFi ke Supabase
  async saveAll(newData) {
    try {
      const payload = {
        id: SUPABASE_CONFIG.tableId,
        data: {
          wallets: newData.wallets || Storage.getWallets(),
          categories: newData.categories || Storage.getCategories(),
          transactions: newData.transactions || Storage.getTransactions(),
          transfers: newData.transfers || Storage.getTransfers(),
          updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('[Supabase] Gagal menyimpan ke cloud:', err);
      return { success: false, error: err.message };
    }
  },

  // Inisialisasi database awal di Supabase
  async initializeCloudDatabase() {
    const initialData = {
      wallets: Storage.getWallets(),
      categories: Storage.getCategories(),
      transactions: Storage.getTransactions(),
      transfers: Storage.getTransfers()
    };
    await this.saveAll(initialData);
    return { success: true, data: initialData, source: 'supabase' };
  },

  // Tambah transaksi baru & sinkronkan langsung ke Supabase
  async createTransaction(tx) {
    const localTx = Storage.addTransaction({ ...tx, synced: true });
    const computed = Storage.computeWalletBalances();

    // Simpan ke Supabase Cloud
    await this.saveAll({
      wallets: computed.wallets,
      transactions: Storage.getTransactions()
    });

    return { success: true, data: localTx };
  },

  // Tambah transfer antar dompet & sinkronkan ke Supabase
  async createTransfer(tr) {
    const localTr = Storage.addTransfer({ ...tr, synced: true });
    const computed = Storage.computeWalletBalances();

    await this.saveAll({
      wallets: computed.wallets,
      transfers: Storage.getTransfers()
    });

    return { success: true, data: localTr };
  },

  // Hapus transaksi & sinkronkan ke Supabase
  async deleteTransaction(id) {
    Storage.deleteTransaction(id);
    const computed = Storage.computeWalletBalances();

    await this.saveAll({
      wallets: computed.wallets,
      transactions: Storage.getTransactions()
    });

    return { success: true };
  },

  // Berlangganan Real-time WebSocket Supabase
  subscribeRealtime(onCloudUpdate) {
    try {
      const channel = supabase
        .channel('kas-wifi-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'settings',
            filter: `id=eq.${SUPABASE_CONFIG.tableId}`
          },
          (payload) => {
            console.log('⚡ [Supabase Realtime] Perubahan data diterima dari perangkat lain:', payload);
            if (payload.new && payload.new.data) {
              const cloudData = payload.new.data;
              if (Array.isArray(cloudData.wallets)) Storage.saveWallets(cloudData.wallets);
              if (Array.isArray(cloudData.categories)) Storage.saveCategories(cloudData.categories);
              if (Array.isArray(cloudData.transactions)) Storage.saveTransactions(cloudData.transactions);
              if (Array.isArray(cloudData.transfers)) Storage.saveTransfers(cloudData.transfers);
              if (onCloudUpdate) onCloudUpdate(cloudData);
            }
          }
        )
        .subscribe();

      return channel;
    } catch (err) {
      console.warn('[Supabase Realtime] Gagal menghubungkan WebSocket:', err);
      return null;
    }
  }
};
