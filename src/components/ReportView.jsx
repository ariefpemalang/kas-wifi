// src/components/ReportView.jsx
import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Wallet,
  PieChart,
  Printer,
  ChevronRight
} from 'lucide-react';
import { formatRupiah } from '../utils/format';

export function ReportView({ summary, transactions = [], wallets = [] }) {
  const [reportPeriod, setReportPeriod] = useState('today'); // 'today' or 'month'

  const today = summary?.today || { income: 0, expense: 0, net: 0 };
  const month = summary?.month || { income: 0, expense: 0, net: 0 };

  const currentStats = reportPeriod === 'today' ? today : month;

  // Breakdown per kategori
  const categoryBreakdown = React.useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const cat = t.category_name || (t.type === 'pemasukan' ? 'Pemasukan Lain' : 'Pengeluaran Lain');
      if (!map[cat]) {
        map[cat] = { name: cat, type: t.type, total: 0, count: 0 };
      }
      map[cat].total += Number(t.amount || 0);
      map[cat].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const incomeCategories = categoryBreakdown.filter(c => c.type === 'pemasukan');
  const expenseCategories = categoryBreakdown.filter(c => c.type === 'pengeluaran');

  return (
    <div className="space-y-4 pb-4">
      {/* Header Laporan */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Laporan Kas WiFi</h2>
          <p className="text-[11px] text-slate-400">Rekapitulasi keuangan usaha RT/RW Net</p>
        </div>
        <button
          onClick={() => window.print()}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 text-xs font-bold"
        >
          <Printer className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cetak</span>
        </button>
      </div>

      {/* Period Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
        <button
          onClick={() => setReportPeriod('today')}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            reportPeriod === 'today'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setReportPeriod('month')}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            reportPeriod === 'month'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Bulan Ini
        </button>
      </div>

      {/* 3 Kartu Ringkasan (Pemasukan, Pengeluaran, Laba Bersih) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Pemasukan */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/30 shadow-lg">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block">Total Masuk</span>
          <p className="text-xs font-extrabold text-emerald-400 tracking-tight mt-0.5">
            {formatRupiah(currentStats.income)}
          </p>
        </div>

        {/* Pengeluaran */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-950/70 to-slate-900 border border-rose-500/30 shadow-lg">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1.5">
            <TrendingDown className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block">Total Keluar</span>
          <p className="text-xs font-extrabold text-rose-400 tracking-tight mt-0.5">
            {formatRupiah(currentStats.expense)}
          </p>
        </div>

        {/* Laba Bersih */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-950/70 to-slate-900 border border-cyan-500/30 shadow-lg">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1.5">
            <Scale className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block">Laba Bersih</span>
          <p className="text-xs font-extrabold text-cyan-400 tracking-tight mt-0.5">
            {formatRupiah(currentStats.net)}
          </p>
        </div>
      </div>

      {/* Rekap Saldo Per Dompet */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2">
          <Wallet className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs text-white">Mutasi & Saldo Akhir Per Dompet</h3>
        </div>

        <div className="space-y-2">
          {summary?.wallets?.map((w) => (
            <div
              key={w.id}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-white block">{w.name}</span>
                <span className="text-[10px] text-slate-400">
                  Masuk: {formatRupiah(w.total_in)} | Keluar: {formatRupiah(w.total_out)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-cyan-400">
                  {formatRupiah(w.current_balance)}
                </span>
                <span className="text-[9px] text-slate-500 block">Saldo Terkini</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Kategori Pemasukan */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs text-white">Pemasukan Terbesar (Voucher & Paket)</h3>
          </div>
          <span className="text-[10px] text-slate-400">{incomeCategories.length} Kategori</span>
        </div>

        <div className="space-y-1.5">
          {incomeCategories.slice(0, 5).map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-800/60 text-xs">
              <span className="text-slate-300 font-medium">{cat.name} ({cat.count}x)</span>
              <span className="font-bold text-emerald-400">{formatRupiah(cat.total)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Kategori Pengeluaran */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-xs text-white">Pengeluaran Operasional</h3>
          </div>
          <span className="text-[10px] text-slate-400">{expenseCategories.length} Kategori</span>
        </div>

        <div className="space-y-1.5">
          {expenseCategories.slice(0, 5).map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-800/60 text-xs">
              <span className="text-slate-300 font-medium">{cat.name} ({cat.count}x)</span>
              <span className="font-bold text-rose-400">{formatRupiah(cat.total)}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
