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

  const fromWallet = wallets.find(w => w.id === fromWalletId);
  const toWallet = wallets.find(w => w.id === toWalletId);
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
    if (numAmount > sourceBalance) {
      alert(`Saldo ${fromWallet?.name} tidak mencukupi! Maksimal transfer: ${formatRupiah(sourceBalance)}`);
      return;
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Transfer Antar Dompet</h2>
              <p className="text-[11px] text-slate-400">Pindahkan saldo (Contoh: QRIN / DANA → Tunai)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Source and Destination */}
          <div className="grid grid-cols-5 gap-2 items-center">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Dari (Sumber)
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatRupiah(w.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 flex justify-center pt-4">
              <button
                type="button"
                onClick={handleSwap}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:rotate-180 transition-all"
                title="Tukar Asal dan Tujuan"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Ke (Tujuan)
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Saldo info */}
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
            <span className="text-slate-400">Saldo {fromWallet?.name} saat ini:</span>
            <span className="font-extrabold text-blue-300">{formatRupiah(sourceBalance)}</span>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nominal Transfer (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-base">Rp</span>
              <input
                type="number"
                inputMode="numeric"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-12 pr-4 py-2.5 text-lg font-extrabold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            {/* Quick buttons */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(String(sourceBalance))}
                className="px-2.5 py-1 text-xs font-bold bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30"
              >
                Semua Saldo
              </button>
              <button
                type="button"
                onClick={() => setAmount('50000')}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-800 text-slate-300 rounded-lg border border-slate-700"
              >
                Rp 50.000
              </button>
              <button
                type="button"
                onClick={() => setAmount('100000')}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-800 text-slate-300 rounded-lg border border-slate-700"
              >
                Rp 100.000
              </button>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Keterangan
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Waktu */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Waktu Transfer
            </label>
            <input
              type="datetime-local"
              value={transferTime}
              onChange={(e) => setTransferTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2 active:scale-98 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Konfirmasi Pindah Saldo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
