// src/components/AddTransactionModal.jsx
import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Check, Sparkles, Calendar, Clock } from 'lucide-react';
import { formatRupiah } from '../utils/format';

export function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  initialType = 'pemasukan',
  categories = [],
  wallets = []
}) {
  const [type, setType] = useState(initialType);
  const [walletId, setWalletId] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionTime, setTransactionTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setWalletId(wallets[0]?.id || 1);

      const defaultCats = categories.filter((c) => c.type === initialType);
      if (defaultCats.length > 0) {
        setCategoryId(defaultCats[0].id);
      } else {
        setCategoryId('');
      }

      setAmount('');
      setDescription('');

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

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleTypeChange = (newType) => {
    setType(newType);
    const newCats = categories.filter((c) => c.type === newType);
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

  const quickAmounts =
    type === 'pemasukan'
      ? [2000, 3000, 5000, 10000, 20000, 50000, 100000]
      : [10000, 20000, 50000, 100000, 250000, 500000];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                type === 'pemasukan'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {type === 'pemasukan' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">
                {type === 'pemasukan' ? 'Catat Pemasukan Kasir' : 'Catat Pengeluaran Kasir'}
              </h2>
              <p className="text-[11px] text-slate-500">Pembukuan Kas WiFi RT/RW Net</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Switch Pemasukan / Pengeluaran */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleTypeChange('pemasukan')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                type === 'pemasukan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
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
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pengeluaran (- Biaya)</span>
            </button>
          </div>

          {/* Nominal Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                inputMode="numeric"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 py-2.5 text-base font-extrabold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Quick Amount Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors"
                >
                  +{formatRupiah(val).replace('Rp ', '')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-rose-600 text-[11px] font-semibold border border-slate-200 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Pilih Dompet (Wallet) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Masuk / Keluar dari Dompet <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {wallets.map((w) => {
                const isSelected = walletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWalletId(w.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 mr-0.5" />}
                    <span>{w.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kategori Transaksi <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Catatan Transaksi
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Voucher 5 Jam Meja Kasir / Kopi Shift Malam"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Tanggal & Waktu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Waktu Transaksi (WIB)
            </label>
            <input
              type="datetime-local"
              value={transactionTime}
              onChange={(e) => setTransactionTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md active:scale-98 transition-all ${
                type === 'pemasukan'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
              }`}
            >
              Simpan {type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
