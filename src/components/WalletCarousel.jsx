// src/components/WalletCarousel.jsx
import React, { useState } from 'react';
import { Wallet, Smartphone, QrCode, Banknote, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
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

  const getWalletTheme = (name) => {
    switch (name?.toUpperCase()) {
      case 'TUNAI':
        return {
          icon: Banknote,
          bg: 'from-emerald-700 via-emerald-800 to-teal-950',
          border: 'border-emerald-500/30',
          accent: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300',
          label: 'Kas Fisik / Laci'
        };
      case 'DANA':
        return {
          icon: Smartphone,
          bg: 'from-sky-700 via-blue-800 to-slate-950',
          border: 'border-sky-500/30',
          accent: 'text-sky-400',
          badge: 'bg-sky-500/20 text-sky-300',
          label: 'E-Wallet DANA'
        };
      case 'QRIN':
        return {
          icon: QrCode,
          bg: 'from-orange-700 via-amber-800 to-stone-950',
          border: 'border-orange-500/30',
          accent: 'text-orange-400',
          badge: 'bg-orange-500/20 text-orange-300',
          label: 'QRIS Merchant'
        };
      default:
        return {
          icon: Wallet,
          bg: 'from-slate-700 via-slate-800 to-slate-950',
          border: 'border-slate-500/30',
          accent: 'text-slate-300',
          badge: 'bg-slate-500/20 text-slate-300',
          label: 'Dompet Kas'
        };
    }
  };

  return (
    <div className="space-y-3">
      {/* Kartu Utama: Total Saldo */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 p-4 shadow-xl">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Kasir Bersih
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Sembunyikan Saldo"
            >
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
            3 Dompet Aktif
          </span>
        </div>

        <div className="mb-3">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {showBalance ? formatRupiah(totalBalance) : 'Rp ••••••••'}
          </h2>
        </div>

        {/* Mini stats hari ini */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Masuk Hari Ini</p>
              <p className="text-xs font-bold text-emerald-400">
                {showBalance ? formatRupiah(todayIncome) : '••••••'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Keluar Hari Ini</p>
              <p className="text-xs font-bold text-rose-400">
                {showBalance ? formatRupiah(todayExpense) : '••••••'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Baris Dompet: TUNAI, DANA, QRIN (Scroll Horizontal) */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-xs font-bold text-slate-300">Rincian Per Dompet</span>
          {activeWalletFilter && (
            <button
              onClick={() => onSelectWallet(null)}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="flex space-x-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
          {wallets.map((wallet) => {
            const theme = getWalletTheme(wallet.name);
            const Icon = theme.icon;
            const isSelected = activeWalletFilter === wallet.id;

            return (
              <button
                key={wallet.id}
                onClick={() => onSelectWallet(isSelected ? null : wallet.id)}
                className={`flex-none w-[150px] text-left p-3 rounded-xl bg-gradient-to-br ${theme.bg} border transition-all ${
                  isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-[1.02]' : theme.border
                } shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center text-white">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${theme.badge}`}>
                    {wallet.name}
                  </span>
                </div>

                <p className="text-[10px] text-slate-300 font-medium truncate">{theme.label}</p>
                <p className="text-sm font-extrabold text-white tracking-tight mt-0.5">
                  {showBalance ? formatRupiah(wallet.current_balance) : '••••••'}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
