// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { WalletCarousel } from './components/WalletCarousel';
import { QuickActions } from './components/QuickActions';
import { TransactionList } from './components/TransactionList';
import { AddTransactionModal } from './components/AddTransactionModal';
import { TransferModal } from './components/TransferModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ReportView } from './components/ReportView';
import { CategoriesModal } from './components/CategoriesModal';
import { SettingsModal } from './components/SettingsModal';
import { BottomNav } from './components/BottomNav';
import { Storage } from './services/storage';
import { Api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, transactions, reports, categories
  const [mode, setMode] = useState('online');
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [selectedWalletId, setSelectedWalletId] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState('pemasukan');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptTx, setActiveReceiptTx] = useState(null);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Load initial data dari Supabase Cloud & Local Cache
  const loadData = useCallback(async () => {
    // 1. Tampilkan data dari memori lokal terlebih dahulu
    setCategories(Storage.getCategories());
    setWallets(Storage.getWallets());
    setTransactions(Storage.getTransactions());
    setTransfers(Storage.getTransfers());

    const queue = Storage.getOfflineQueue();
    const count = (queue.transactions?.length || 0) + (queue.transfers?.length || 0);
    setPendingCount(count);

    // 2. Tarik data terbaru dari Supabase Cloud
    setIsSyncing(true);
    try {
      const res = await Api.getDashboardSummary();
      if (res.success && res.data) {
        setSummary(res.data);
        if (res.data.wallets) setWallets(res.data.wallets);
        if (res.data.categories) setCategories(res.data.categories);
        if (res.data.recent_transactions) setTransactions(Storage.getTransactions());
        if (res.data.recent_transfers) setTransfers(Storage.getTransfers());
      }
      setMode('online');
    } catch (e) {
      console.warn('[App] Mode offline aktif:', e);
      setMode('offline');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Smart sync: interval 60 detik dan HANYA berjalan jika aplikasi sedang aktif di layar
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 60000);

    // Otomatis refresh seketika saat aplikasi dibuka kembali (dari layar kunci / minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };

    // Deteksi koneksi internet perangkat
    const handleOnline = () => {
      setMode('online');
      loadData();
    };
    const handleOffline = () => setMode('offline');

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData]);

  // Handle Save Transaction (Otomatis ke Supabase)
  const handleSaveTransaction = async (txData) => {
    setIsSyncing(true);
    const res = await Api.createTransaction(txData);
    setIsSyncing(false);
    await loadData();

    if (res.data) {
      setActiveReceiptTx(res.data);
      setIsReceiptModalOpen(true);
    }
  };

  // Handle Save Transfer (Otomatis ke Supabase)
  const handleSaveTransfer = async (trData) => {
    setIsSyncing(true);
    await Api.createTransfer(trData);
    setIsSyncing(false);
    await loadData();
  };

  // Handle Delete Transaction
  const handleDeleteTransaction = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      setIsSyncing(true);
      await Api.deleteTransaction(id);
      setIsSyncing(false);
      loadData();
    }
  };

  // Handle Open Receipt Modal
  const handleOpenReceipt = (tx) => {
    setActiveReceiptTx(tx);
    setIsReceiptModalOpen(true);
  };

  // Handle Quick Receipt button (latest transaction)
  const handleOpenLatestReceipt = () => {
    const list = Storage.getTransactions();
    if (list.length > 0) {
      setActiveReceiptTx(list[0]);
      setIsReceiptModalOpen(true);
    } else {
      alert('Belum ada transaksi untuk dicetak struk!');
    }
  };

  // Manual Sync trigger
  const handleManualSync = async () => {
    setIsSyncing(true);
    const res = await Api.syncOfflineData();
    setIsSyncing(false);
    alert(res.message);
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header Bersih Khas Web KAS WIFI */}
      <Header
        mode={mode}
        setMode={setMode}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isSyncing={isSyncing}
        onSync={handleManualSync}
        pendingCount={pendingCount}
        onRefresh={loadData}
      />

      {/* Main Content Area (Mobile Container) */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-3.5 pb-24 space-y-4">
        {/* Render Berdasarkan Tab Aktif */}
        {activeTab === 'dashboard' && (
          <>
            {/* Kartu Dompet & Ringkasan Saldo */}
            <WalletCarousel
              summary={summary}
              wallets={wallets}
              activeWalletFilter={selectedWalletId}
              onSelectWallet={setSelectedWalletId}
            />

            {/* Quick Actions (Tombol Kasir Utama) */}
            <QuickActions
              onOpenAddModal={(type) => {
                setAddModalType(type);
                setIsAddModalOpen(true);
              }}
              onOpenTransferModal={() => setIsTransferModalOpen(true)}
              onOpenReceiptModal={handleOpenLatestReceipt}
            />

            {/* Riwayat Transaksi */}
            <TransactionList
              transactions={transactions}
              transfers={transfers}
              selectedWalletId={selectedWalletId}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenReceipt={handleOpenReceipt}
            />
          </>
        )}

        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            transfers={transfers}
            selectedWalletId={selectedWalletId}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenReceipt={handleOpenReceipt}
          />
        )}

        {activeTab === 'reports' && (
          <ReportView
            summary={summary}
            transactions={transactions}
            wallets={wallets}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveTransaction}
        initialType={addModalType}
        categories={categories}
        wallets={wallets}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSave={handleSaveTransfer}
        wallets={wallets}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={activeReceiptTx}
      />

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categories}
        onUpdateCategories={async (newCats) => {
          setCategories(newCats);
          Storage.saveCategories(newCats);
          loadData();
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSyncComplete={loadData}
      />
    </div>
  );
}

export default App;
