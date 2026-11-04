// src/components/TransactionList.jsx
import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  Filter,
  Receipt,
  Trash2,
  Calendar,
  CloudOff,
  CheckCircle2
} from 'lucide-react';
import { formatRupiah, formatTanggalIndo, formatJamIndo, getHariIndo } from '../utils/format';

export function TransactionList({
  transactions = [],
  transfers = [],
  onDeleteTransaction,
  onOpenReceipt,
  selectedWalletId
}) {
  const [filterType, setFilterType] = useState('all'); // all, pemasukan, pengeluaran, transfer
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Gabungkan transaksi dan transfer
  const combinedList = useMemo(() => {
    let list = [];

    // Transaksi normal
    transactions.forEach((tx) => {
      list.push({
        ...tx,
        isTransfer: false,
        sortTime: new Date((tx.transaction_time || '').replace(' ', 'T')).getTime() || tx.id
      });
    });

    // Transfer antar wallet
    transfers.forEach((tr) => {
      list.push({
        ...tr,
        type: 'transfer',
        isTransfer: true,
        sortTime: new Date((tr.transfer_time || '').replace(' ', 'T')).getTime() || tr.id
      });
    });

    // Urutkan dari yang terbaru
    list.sort((a, b) => b.sortTime - a.sortTime);

    // Filter Wallet
    if (selectedWalletId) {
      list = list.filter((item) => {
        if (item.isTransfer) {
          return item.from_wallet_id === selectedWalletId || item.to_wallet_id === selectedWalletId;
        }
        return item.wallet_id === selectedWalletId;
      });
    }

    // Filter Tipe
    if (filterType !== 'all') {
      list = list.filter((item) => item.type === filterType);
    }

    // Filter Tanggal
    if (selectedDate) {
      list = list.filter((item) => {
        const timeStr = item.transaction_time || item.transfer_time || '';
        return timeStr.startsWith(selectedDate);
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => {
        const desc = (item.description || '').toLowerCase();
        const cat = (item.category_name || '').toLowerCase();
        const wallet = (item.wallet_name || item.from_wallet_name || item.to_wallet_name || '').toLowerCase();
        return desc.includes(q) || cat.includes(q) || wallet.includes(q);
      });
    }

    return list;
  }, [transactions, transfers, filterType, searchQuery, selectedDate, selectedWalletId]);

  const getWalletBadgeClass = (name) => {
    switch (name?.toUpperCase()) {
      case 'TUNAI':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'DANA':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'QRIN':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-200">Riwayat Transaksi</h3>
        <span className="text-[11px] text-slate-400 font-medium">
          {combinedList.length} Transaksi
        </span>
      </div>

      {/* Search & Date Filter Bar */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari voucher, keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700/70 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-800/90 border border-slate-700/70 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tabs Filter Tipe */}
      <div className="flex space-x-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'pemasukan', label: 'Masuk' },
          { id: 'pengeluaran', label: 'Keluar' },
          { id: 'transfer', label: 'Transfer' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterType === tab.id
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List items */}
      <div className="space-y-2">
        {combinedList.length === 0 ? (
          <div className="text-center py-8 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700/60 p-6">
            <Filter className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-slate-400">Belum ada transaksi yang sesuai</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gunakan tombol di atas untuk mencatat transaksi kasir
            </p>
          </div>
        ) : (
          combinedList.map((item) => {
            const timeStr = item.transaction_time || item.transfer_time;
            const hari = getHariIndo(timeStr);
            const tgl = formatTanggalIndo(timeStr);
            const jam = formatJamIndo(timeStr);

            if (item.isTransfer) {
              return (
                <div
                  key={`tr-${item.id}`}
                  className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 mb-0.5">
                        <span className="text-xs font-bold text-white">Transfer Antar Dompet</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        {item.from_wallet_name} → {item.to_wallet_name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {hari}, {tgl} • {jam}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-blue-400 tracking-tight">
                      {formatRupiah(item.amount)}
                    </p>
                    <span className="inline-block text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30 mt-1">
                      Mutasi
                    </span>
                  </div>
                </div>
              );
            }

            const isIncome = item.type === 'pemasukan';

            return (
              <div
                key={`tx-${item.id}`}
                className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      <span className="text-xs font-bold text-white">
                        {item.category_name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getWalletBadgeClass(
                          item.wallet_name
                        )}`}
                      >
                        {item.wallet_name}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-300 font-normal line-clamp-1">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[10px] text-slate-400">
                        {hari}, {tgl} • {jam}
                      </span>
                      {!item.synced && (
                        <span className="text-[9px] text-amber-400 flex items-center space-x-0.5">
                          <CloudOff className="w-2.5 h-2.5" />
                          <span>Offline</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p
                      className={`text-xs font-extrabold tracking-tight ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatRupiah(item.amount)}
                    </p>
                    <span
                      className={`inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => onOpenReceipt(item)}
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-700/60 transition-colors"
                      title="Cetak / Bagikan Struk Nota"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(item.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
