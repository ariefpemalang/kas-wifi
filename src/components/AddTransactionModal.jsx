// src/components/AddTransactionModal.jsx
import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Check, Sparkles } from 'lucide-react';
import { formatRupiah } from '../utils/format';

export function AddTransactionModal({ isOpen, onClose, onSave, initialType = 'pemasukan', categories = [], wallets = [] }) {
  const [type, setType] = useState(initialType);
  const [walletId, setWalletId] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionTime, setTransactionTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      // Set default wallet: TUNAI (id 1)
      setWalletId(wallets[0]?.id || 1);
      
      // Filter categories matching type
      const defaultCats = categories.filter(c => c.type === initialType);
      if (defaultCats.length > 0) {
        setCategoryId(defaultCats[0].id);
      } else {
        setCategoryId('');
      }

      setAmount('');
      setDescription('');

      // Waktu saat ini format YYYY-MM-DDTHH:mm
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTransactionTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [isOpen, initialType, categories, wallets]);

  if (!isOpen) return null;

  // Filter categories by type
  const filteredCategories = categories.filter(c => c.type === type);

  const handleTypeChange = (newType) => {
    setType(newType);
    const newCats = categories.filter(c => c.type === newType);
    if (newCats.length > 0) {
      setCategoryId(newCats[0].id);
    }
  };

  const handleQuickAmount = (val) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Nominal harus lebih besar dari 0!');
      return;
    }

    onSave({
      type,
      wallet_id: walletId,
      category_id: categoryId ? Number(categoryId) : null,
      amount: numAmount,
      description,
      transaction_time: transactionTime.replace('T', ' ') + ':00'
    });
    onClose();
  };

  const quickAmounts = type === 'pemasukan' 
    ? [2000, 3000, 5000, 10000, 20000, 50000, 100000]
    : [10000, 20000, 50000, 100000, 250000, 500000];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${type === 'pemasukan' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {type === 'pemasukan' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {type === 'pemasukan' ? 'Catat Pemasukan Kasir' : 'Catat Pengeluaran Kasir'}
              </h2>
              <p className="text-[11px] text-slate-400">Pembukuan Kas WiFi RT/RW Net</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Switch Pemasukan / Pengeluaran */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('pemasukan')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                type === 'pemasukan'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Pemasukan (+ Voucher)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('pengeluaran')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                type === 'pengeluaran'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pengeluaran (- Biaya)</span>
            </button>
          </div>

          {/* Nominal Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nominal Transaksi (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-base">Rp</span>
              <input
                type="number"
                inputMode="numeric"
                required
                autoFocus
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-12 pr-4 py-2.5 text-lg font-extrabold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            {amount > 0 && (
              <p className="text-[11px] font-semibold text-cyan-400 mt-1 pl-1">
                Terbilang: {formatRupiah(amount)}
              </p>
            )}

            {/* Quick nominal chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleQuickAmount(val)}
                  className="px-2 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 active:scale-95 transition-all"
                >
                  +{val >= 1000 ? `${val / 1000}rb` : val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2 py-1 text-[11px] font-semibold bg-slate-800/50 hover:bg-slate-800 text-rose-400 rounded-lg border border-rose-500/30 transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Dompet / Wallet Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Pilih Dompet / Wallet
            </label>
            <div className="grid grid-cols-3 gap-2">
              {wallets.map((w) => {
                const isSelected = walletId === w.id;
                return (
                  <button
                    type="button"
                    key={w.id}
                    onClick={() => setWalletId(w.id)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400'
                        : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block text-xs">{w.name}</span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      {w.name === 'TUNAI' ? 'Kas Laci' : w.name === 'DANA' ? 'E-Wallet' : 'QRIS'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Kategori Kas
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              {filteredCategories.map((c) => {
                const isSelected = Number(categoryId) === Number(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-all text-left ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Keterangan / Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder={type === 'pemasukan' ? 'Misal: Voucher 5 Jam Meja 3 / Rumah Pak RT' : 'Misal: Beli kabel LAN 20m & konektor'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Waktu Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Waktu Transaksi (WIB)
            </label>
            <input
              type="datetime-local"
              value={transactionTime}
              onChange={(e) => setTransactionTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-2xl font-extrabold text-sm text-white shadow-xl flex items-center justify-center space-x-2 active:scale-98 transition-all ${
                type === 'pemasukan'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700'
                  : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/25 hover:from-rose-600 hover:to-red-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Simpan Transaksi Kasir</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
