// src/components/TransactionList.jsx
import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  Receipt,
  Trash2,
  Calendar,
  XCircle,
  Tag
} from 'lucide-react';
import { formatRupiah, formatTanggalIndo, formatJamIndo, getHariIndo, decodeHtmlEntities } from '../utils/format';

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
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DANA':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'QRIN':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-3">
      {/* 1. Header Riwayat */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Riwayat Transaksi
        </h3>
        <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
          {combinedList.length} Transaksi
        </span>
      </div>

      {/* 2. Filter & Pencarian */}
      <div style={{ backgroundColor: '#ffffff', color: '#1e293b' }} className="rounded-2xl p-2.5 shadow-xs border border-slate-200 space-y-2">
        <div className="flex items-center space-x-2">
          {/* Kolom Cari */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari voucher, keterangan..."
              style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
              className="w-full border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tanggal */}
          <div className="relative w-36">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-50"
                title="Hapus filter tanggal"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Filter Tipe */}
        <div style={{ backgroundColor: '#f1f5f9' }} className="grid grid-cols-4 gap-1 p-0.5 rounded-xl">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'pemasukan', label: 'Masuk' },
            { id: 'pengeluaran', label: 'Keluar' },
            { id: 'transfer', label: 'Transfer' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Daftar Baris Transaksi */}
      {combinedList.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm">
          <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">Belum ada catatan transaksi</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Gunakan tombol Pemasukan atau Pengeluaran untuk mencatat transaksi baru.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {combinedList.map((item) => {
            const isTransfer = item.isTransfer;
            const isIncome = item.type === 'pemasukan';
            const timeStr = item.transaction_time || item.transfer_time || '';

            return (
              <div
                key={isTransfer ? `tr-${item.id}` : `tx-${item.id}`}
                style={{ backgroundColor: '#ffffff', color: '#1e293b' }}
                className="rounded-xl p-3 border border-slate-200 shadow-xs hover:shadow-sm transition-all flex items-center justify-between"
              >
                {/* Bagian Kiri: Ikon & Detail */}
                <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                  {/* Ikon Tipe */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isTransfer
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : isIncome
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}
                  >
                    {isTransfer ? (
                      <ArrowLeftRight className="w-4 h-4" />
                    ) : isIncome ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  {/* Keterangan */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {isTransfer
                          ? `Transfer: ${item.from_wallet_name} → ${item.to_wallet_name}`
                          : decodeHtmlEntities(item.category_name || (isIncome ? 'Pemasukan' : 'Pengeluaran'))}
                      </h4>
                      {!isTransfer && item.wallet_name && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getWalletBadgeClass(
                            item.wallet_name
                          )}`}
                        >
                          {item.wallet_name}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {decodeHtmlEntities(item.description)}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatTanggalIndo(timeStr)} • {formatJamIndo(timeStr)}
                    </p>
                  </div>
                </div>

                {/* Bagian Kanan: Nominal & Tombol Aksi */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-extrabold tracking-tight ${
                      isTransfer
                        ? 'text-blue-600'
                        : isIncome
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {isTransfer ? '' : isIncome ? '+ ' : '- '}
                    {formatRupiah(item.amount)}
                  </div>
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isTransfer ? 'TRANSFER' : isIncome ? 'PEMASUKAN' : 'PENGELUARAN'}
                  </div>

                  {/* Aksi Struk & Hapus */}
                  <div className="flex items-center justify-end space-x-1.5 mt-1.5">
                    {!isTransfer && onOpenReceipt && (
                      <button
                        onClick={() => onOpenReceipt(item)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Lihat / Cetak Struk"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteTransaction && (
                      <button
                        onClick={() => onDeleteTransaction(item.id, isTransfer)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
