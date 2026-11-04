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
  const [mode, setMode] = useState('offline');
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

  // Load initial data
  const loadData = useCallback(async () => {
    Storage.seedSampleDataIfEmpty();
    const currentMode = Storage.getMode();
    setMode(currentMode);

    const cats = Storage.getCategories();
    setCategories(cats);

    const w = Storage.getWallets();
    setWallets(w);

    const res = await Api.getDashboardSummary();
    if (res.success && res.data) {
      setSummary(res.data);
      setWallets(res.data.wallets || []);
    }

    setTransactions(Storage.getTransactions());
    setTransfers(Storage.getTransfers());

    const queue = Storage.getOfflineQueue();
    const count = (queue.transactions?.length || 0) + (queue.transfers?.length || 0);
    setPendingCount(count);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Save Transaction
  const handleSaveTransaction = async (txData) => {
    await Api.createTransaction(txData);
    await loadData();
    // Open receipt modal for this new transaction
    const latestTx = Storage.getTransactions()[0];
    if (latestTx) {
      setActiveReceiptTx(latestTx);
      setIsReceiptModalOpen(true);
    }
  };

  // Handle Save Transfer
  const handleSaveTransfer = async (trData) => {
    await Api.createTransfer(trData);
    await loadData();
  };

  // Handle Delete Transaction
  const handleDeleteTransaction = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      Storage.deleteTransaction(id);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Header */}
      <Header
        mode={mode}
        setMode={setMode}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isSyncing={isSyncing}
        onSync={handleManualSync}
        pendingCount={pendingCount}
      />

      {/* Main Content Area (Mobile Container) */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-3 pb-24 space-y-4">
        {/* Render based on active tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Wallet Carousel & Total Balances */}
            <WalletCarousel
              summary={summary}
              wallets={wallets}
              activeWalletFilter={selectedWalletId}
              onSelectWallet={setSelectedWalletId}
            />

            {/* Quick Actions (Kasir Bar) */}
            <QuickActions
              onOpenAddModal={(type) => {
                setAddModalType(type);
                setIsAddModalOpen(true);
              }}
              onOpenTransferModal={() => setIsTransferModalOpen(true)}
              onOpenReceiptModal={handleOpenLatestReceipt}
            />

            {/* Transactions List Preview */}
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

        {activeTab === 'categories' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">Kategori Transaksi Kas</h2>
              <button
                onClick={() => setIsCategoriesModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30"
              >
                + Tambah Kategori
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Kategori voucher WiFi, operasional, bandwidth, dan kebutuhan kasir lainnya.
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-slate-200">{c.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                      c.type === 'pemasukan'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {c.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'categories') {
            setIsCategoriesModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
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
        onUpdateCategories={(newCats) => {
          setCategories(newCats);
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
