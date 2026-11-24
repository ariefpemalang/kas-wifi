// src/components/ReportView.jsx
import React, { useState, useMemo } from 'react';
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
import { formatRupiah, decodeHtmlEntities } from '../utils/format';

export function ReportView({ summary, transactions = [], wallets = [] }) {
  const [reportPeriod, setReportPeriod] = useState('today'); // 'today' or 'month'

  const today = summary?.today || { income: 0, expense: 0, net: 0 };
  const month = summary?.month || { income: 0, expense: 0, net: 0 };

  const currentStats = reportPeriod === 'today' ? today : month;

  // Breakdown per kategori
  const categoryBreakdown = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const cat = decodeHtmlEntities(t.category_name || (t.type === 'pemasukan' ? 'Pemasukan Lain' : 'Pengeluaran Lain'));
      if (!map[cat]) {
        map[cat] = { name: cat, type: t.type, total: 0, count: 0 };
      }
      map[cat].total += Number(t.amount || 0);
      map[cat].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const incomeCategories = categoryBreakdown.filter((c) => c.type === 'pemasukan');
  const expenseCategories = categoryBreakdown.filter((c) => c.type === 'pengeluaran');

  return (
    <div className="space-y-4 pb-6">
      {/* Header Laporan */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-extrabold text-slate-800">Laporan Kas WiFi</h2>
          <p className="text-[11px] text-slate-500">Rekapitulasi keuangan usaha RT/RW Net</p>
        </div>
        <button
          onClick={() => window.print()}
          className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs flex items-center space-x-1.5 text-xs font-bold transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-blue-600" />
          <span>Cetak</span>
        </button>
      </div>

      {/* Period Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-2xl border border-slate-200">
        <button
          onClick={() => setReportPeriod('today')}
          className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
            reportPeriod === 'today'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Laporan Hari Ini
        </button>
        <button
          onClick={() => setReportPeriod('month')}
          className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
            reportPeriod === 'month'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Laporan Bulan Ini
        </button>
      </div>

      {/* 3 Kartu Ringkasan (Pemasukan, Pengeluaran, Saldo Bersih) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Pemasukan */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs text-center">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block">Total Masuk</span>
          <span className="text-xs font-bold text-emerald-600 block mt-0.5 truncate">
            {formatRupiah(currentStats.income)}
          </span>
        </div>

        {/* Pengeluaran */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs text-center">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-1">
            <TrendingDown className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block">Total Keluar</span>
          <span className="text-xs font-bold text-rose-600 block mt-0.5 truncate">
            {formatRupiah(currentStats.expense)}
          </span>
        </div>

        {/* Saldo Bersih */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs text-center">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1">
            <Scale className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block">Kas Bersih</span>
          <span
            className={`text-xs font-bold block mt-0.5 truncate ${
              currentStats.net >= 0 ? 'text-blue-700' : 'text-rose-600'
            }`}
          >
            {formatRupiah(currentStats.net)}
          </span>
        </div>
      </div>

      {/* Rekap Saldo Per Dompet */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <Wallet className="w-4 h-4 text-blue-600" />
          <span>Rekapitulasi Saldo Kasir</span>
        </h3>
        <div className="space-y-2">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
            >
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">{w.name}</span>
                <span className="text-[10px] text-slate-400">
                  {w.name === 'TUNAI' ? 'Kas Fisik' : w.name === 'DANA' ? 'E-Wallet' : 'QRIS'}
                </span>
              </div>
              <span className="text-xs font-extrabold text-slate-900">
                {formatRupiah(w.current_balance || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rekapitulasi Per Kategori */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
          <PieChart className="w-4 h-4 text-emerald-600" />
          <span>Rincian Pemasukan Per Kategori</span>
        </h3>

        {incomeCategories.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Belum ada transaksi pemasukan</p>
        ) : (
          <div className="space-y-2">
            {incomeCategories.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-700 font-medium">
                  {c.name} <span className="text-[10px] text-slate-400">({c.count}x)</span>
                </span>
                <span className="font-bold text-emerald-600">{formatRupiah(c.total)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 pt-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>Rincian Pengeluaran Per Kategori</span>
          </h3>

          {expenseCategories.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada transaksi pengeluaran</p>
          ) : (
            <div className="space-y-2">
              {expenseCategories.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-700 font-medium">
                    {c.name} <span className="text-[10px] text-slate-400">({c.count}x)</span>
                  </span>
                  <span className="font-bold text-rose-600">{formatRupiah(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
