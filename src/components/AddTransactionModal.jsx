// src/components/AddTransactionModal.jsx
import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
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
    } else {
      setCategoryId('');
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div
        style={{ backgroundColor: '#ffffff', color: '#1e293b' }}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200"
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div
              style={
                type === 'pemasukan'
                  ? { backgroundColor: '#d1fae5', color: '#047857' }
                  : { backgroundColor: '#ffe4e6', color: '#be123c' }
              }
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
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
          <div
            style={{ backgroundColor: '#f1f5f9' }}
            className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border border-slate-200"
          >
            <button
              type="button"
              onClick={() => handleTypeChange('pemasukan')}
              style={
                type === 'pemasukan'
                  ? { backgroundColor: '#059669', color: '#ffffff' }
                  : { backgroundColor: 'transparent', color: '#475569' }
              }
              className="py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('pengeluaran')}
              style={
                type === 'pengeluaran'
                  ? { backgroundColor: '#e11d48', color: '#ffffff' }
                  : { backgroundColor: 'transparent', color: '#475569' }
              }
              className="py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
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
                style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
                className="w-full border border-slate-300 rounded-xl pl-11 pr-4 py-2.5 text-base font-extrabold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
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
                    style={
                      isSelected
                        ? { backgroundColor: '#2563eb', color: '#ffffff', borderColor: '#2563eb' }
                        : { backgroundColor: '#ffffff', color: '#334155', borderColor: '#cbd5e1' }
                    }
                    className="py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1 shadow-2xs"
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
              style={{ backgroundColor: '#ffffff', color: '#1e293b' }}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {filteredCategories.length === 0 ? (
                <option value="">-- Tanpa Kategori --</option>
              ) : (
                filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
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
              style={{ backgroundColor: '#ffffff', color: '#1e293b' }}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              style={{ backgroundColor: '#ffffff', color: '#1e293b' }}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2">
            <button
              type="submit"
              style={{
                backgroundColor: type === 'pemasukan' ? '#059669' : '#e11d48',
                color: '#ffffff'
              }}
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all"
            >
              Simpan {type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
