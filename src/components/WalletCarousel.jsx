// src/components/WalletCarousel.jsx
import React, { useState } from 'react';
import {
  Wallet,
  Smartphone,
  QrCode,
  Banknote,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  CheckCircle2
} from 'lucide-react';
import { formatRupiah } from '../utils/format';

export function WalletCarousel({ summary, onSelectWallet, activeWalletFilter }) {
  const [showBalance, setShowBalance] = useState(true);

  const wallets = summary?.wallets || [
    { id: 1, name: 'TUNAI', current_balance: 0 },
    { id: 2, name: 'DANA', current_balance: 0 },
    { id: 3, name: 'QRIN', current_balance: 0 }
  ];

  const totalBalance = summary?.total_balance || 0;
  const todayIncome = summary?.today?.income || 0;
  const todayExpense = summary?.today?.expense || 0;
  const monthIncome = summary?.month?.income || 0;
  const monthExpense = summary?.month?.expense || 0;

  const getWalletConfig = (name) => {
    switch (name?.toUpperCase()) {
      case 'TUNAI':
        return {
          icon: Banknote,
          bgGradient: 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800',
          badgeBg: 'bg-emerald-950/40 text-emerald-100',
          label: 'Kas Fisik / Laci'
        };
      case 'DANA':
        return {
          icon: Smartphone,
          bgGradient: 'bg-gradient-to-br from-sky-500 via-blue-600 to-blue-700',
          badgeBg: 'bg-blue-950/40 text-sky-100',
          label: 'E-Wallet DANA'
        };
      case 'QRIN':
        return {
          icon: QrCode,
          bgGradient: 'bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700',
          badgeBg: 'bg-orange-950/40 text-orange-100',
          label: 'QRIS Merchant'
        };
      default:
        return {
          icon: Wallet,
          bgGradient: 'bg-gradient-to-br from-slate-700 to-slate-800',
          badgeBg: 'bg-slate-900/40 text-slate-100',
          label: 'Dompet Kas'
        };
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 1. KARTU TOTAL SALDO KASIR */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-4 shadow-md border border-slate-700/50">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              TOTAL KAS SEMUA WALLET
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Toggle Saldo"
            >
              {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span className="text-[10px] font-bold bg-white/15 text-blue-200 px-2.5 py-0.5 rounded-full border border-white/10">
            3 Dompet Kasir
          </span>
        </div>

        <div className="my-1">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {showBalance ? formatRupiah(totalBalance) : 'Rp ••••••••'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Akumulasi seluruh kas fisik, DANA, dan QRIS
          </p>
        </div>
      </div>

      {/* 2. DAFTAR KARTU 3 DOMPET (TUNAI, DANA, QRIN) */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Rincian Per Dompet
          </span>
          {activeWalletFilter && (
            <button
              onClick={() => onSelectWallet(null)}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Tampilkan Semua
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {wallets.map((w) => {
            const cfg = getWalletConfig(w.name);
            const Icon = cfg.icon;
            const isSelected = activeWalletFilter === w.id;
            const balance = Number(w.current_balance || 0);

            return (
              <button
                key={w.id}
                onClick={() => onSelectWallet(isSelected ? null : w.id)}
                className={`relative overflow-hidden rounded-xl p-3 text-left transition-all ${cfg.bgGradient} text-white shadow-sm hover:shadow-md active:scale-98 ${
                  isSelected ? 'ring-3 ring-blue-500 ring-offset-2 scale-102 shadow-lg' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.badgeBg}`}>
                    {w.name}
                  </span>
                </div>

                <div className="text-[10px] text-white/80 font-medium truncate">
                  {cfg.label}
                </div>
                <div className="text-sm font-bold text-white tracking-tight mt-0.5 truncate">
                  {showBalance ? formatRupiah(balance) : '••••••'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. RINGKASAN STATISTIK HARI INI & BULAN INI (Sama seperti Web Kas WiFi) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {/* Pemasukan Hari Ini */}
        <div className="bg-white rounded-xl p-2.5 border-l-4 border-emerald-500 shadow-sm border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 block">Pemasukan Hari Ini</span>
          <span className="text-xs font-bold text-emerald-600 block mt-0.5">
            {showBalance ? formatRupiah(todayIncome) : '••••••'}
          </span>
        </div>

        {/* Pengeluaran Hari Ini */}
        <div className="bg-white rounded-xl p-2.5 border-l-4 border-rose-500 shadow-sm border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 block">Pengeluaran Hari Ini</span>
          <span className="text-xs font-bold text-rose-600 block mt-0.5">
            {showBalance ? formatRupiah(todayExpense) : '••••••'}
          </span>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div className="bg-white rounded-xl p-2.5 border-l-4 border-blue-500 shadow-sm border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 block">Pemasukan Bulan Ini</span>
          <span className="text-xs font-bold text-blue-600 block mt-0.5">
            {showBalance ? formatRupiah(monthIncome) : '••••••'}
          </span>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="bg-white rounded-xl p-2.5 border-l-4 border-amber-500 shadow-sm border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 block">Pengeluaran Bulan Ini</span>
          <span className="text-xs font-bold text-amber-600 block mt-0.5">
            {showBalance ? formatRupiah(monthExpense) : '••••••'}
          </span>
        </div>
      </div>
    </div>
  );
}
