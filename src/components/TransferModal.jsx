// src/components/TransferModal.jsx
import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Check, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../utils/format';

export function TransferModal({ isOpen, onClose, onSave, wallets = [] }) {
  const [fromWalletId, setFromWalletId] = useState(3); // default QRIN
  const [toWalletId, setToWalletId] = useState(1);   // default TUNAI
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transferTime, setTransferTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (wallets.length >= 2) {
        setFromWalletId(wallets[2]?.id || wallets[0]?.id || 1);
        setToWalletId(wallets[0]?.id || 2);
      }
      setAmount('');
      setDescription('Tarik saldo QRIS ke Kas Fisik Laci');

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTransferTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [isOpen, wallets]);

  if (!isOpen) return null;

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);
  const sourceBalance = fromWallet?.current_balance || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (fromWalletId === toWalletId) {
      alert('Dompet asal dan tujuan tidak boleh sama!');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      alert('Nominal transfer harus lebih dari 0!');
      return;
    }
    if (numAmount > sourceBalance && sourceBalance > 0) {
      if (!confirm(`Saldo ${fromWallet?.name} (${formatRupiah(sourceBalance)}) lebih kecil dari nominal transfer. Tetap lanjutkan?`)) {
        return;
      }
    }

    onSave({
      from_wallet_id: fromWalletId,
      to_wallet_id: toWalletId,
      amount: numAmount,
      description: description || `Transfer ${fromWallet?.name} ke ${toWallet?.name}`,
      transfer_time: transferTime.replace('T', ' ') + ':00'
    });
    onClose();
  };

  const handleSwap = () => {
    const temp = fromWalletId;
    setFromWalletId(toWalletId);
    setToWalletId(temp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">Transfer Antar Dompet</h2>
              <p className="text-[11px] text-slate-500">Pindah saldo kasir (misal: Tarik QRIS ke Tunai)</p>
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
          {/* Dompet Asal & Tujuan */}
          <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            {/* Sumber */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Dari Dompet (Sumber)
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Tersedia: {formatRupiah(w.current_balance || 0)})
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Swap */}
            <div className="flex justify-center -my-1">
              <button
                type="button"
                onClick={handleSwap}
                className="p-1.5 rounded-full bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 shadow-xs transition-colors"
                title="Tukar Dompet"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tujuan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Ke Dompet (Tujuan)
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                    {w.name} {w.id === fromWalletId ? '(Sama dengan asal)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nominal Transfer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nominal Transfer (Rp) <span className="text-rose-500">*</span>
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
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan Transfer
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Tarik saldo QRIS ke Kasir"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Waktu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Waktu Transfer
            </label>
            <input
              type="datetime-local"
              value={transferTime}
              onChange={(e) => setTransferTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs uppercase tracking-wider text-white shadow-md active:scale-98 transition-all"
            >
              Proses Pindah Saldo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
