// src/components/ReceiptModal.jsx
import React, { useState } from 'react';
import { X, Printer, Share2, Copy, Check, MessageSquare } from 'lucide-react';
import { formatRupiah, formatTanggalIndo, generateWhatsAppMessage } from '../utils/format';
import { Storage } from '../services/storage';

export function ReceiptModal({ isOpen, onClose, transaction }) {
  const [copied, setCopied] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');

  if (!isOpen) return null;

  const settings = Storage.getSettings();
  const user = Storage.getUser();

  const receiptData = {
    id: transaction?.id || Date.now().toString().slice(-6),
    shopName: settings.shopName || 'ARCELL WIFI',
    shopAddress: settings.shopAddress || 'Hotspot Voucher & RT/RW Net Berkah',
    time: transaction?.transaction_time || new Date().toISOString(),
    cashier: user.nama_lengkap || 'Kasir',
    walletName: transaction?.wallet_name || 'TUNAI',
    categoryName: transaction?.category_name || 'Voucher WiFi',
    description: transaction?.description || 'Pembelian Akses Internet',
    amount: transaction?.amount || 5000,
    footerNote: settings.footerNote || 'Terima kasih atas kunjungan Anda!'
  };

  const handleCopy = () => {
    const rawText = decodeURIComponent(generateWhatsAppMessage(receiptData));
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const msg = generateWhatsAppMessage(receiptData);
    let waUrl = `https://wa.me/?text=${msg}`;
    if (targetPhone.trim()) {
      let cleanPhone = targetPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }
      waUrl = `https://wa.me/${cleanPhone}?text=${msg}`;
    }
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white">Struk Kasir Digital</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
              58mm
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Container */}
        <div className="p-4 overflow-y-auto bg-slate-950/60 flex flex-col items-center">
          <div 
            id="printable-receipt" 
            className="receipt-paper w-full p-4 rounded-lg text-slate-900 shadow-md font-mono text-[11px] leading-relaxed"
          >
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              <h3 className="font-extrabold text-sm uppercase tracking-wider">{receiptData.shopName}</h3>
              <p className="text-[10px] text-slate-600">{receiptData.shopAddress}</p>
            </div>

            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>No. Nota:</span>
                <span className="font-bold">#{receiptData.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatTanggalIndo(receiptData.time, true)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{receiptData.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode Kas:</span>
                <span className="font-bold uppercase">{receiptData.walletName}</span>
              </div>
            </div>

            <div className="py-2.5 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-bold">
                <span className="truncate pr-2">{receiptData.categoryName}</span>
                <span>{formatRupiah(receiptData.amount)}</span>
              </div>
              {receiptData.description && (
                <p className="text-[10px] text-slate-500 italic mt-0.5">
                  {receiptData.description}
                </p>
              )}
            </div>

            <div className="py-2.5 border-b-2 border-slate-800 flex justify-between items-center text-xs font-black">
              <span>TOTAL DIBAYAR</span>
              <span>{formatRupiah(receiptData.amount)}</span>
            </div>

            <div className="text-center pt-3 pb-1 text-[9px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">STATUS: LUNAS / DITERIMA</p>
              <p>{receiptData.footerNote}</p>
              <p className="text-[8px] text-slate-400">Powered by KAS WIFI Mobile</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2.5">
          {/* Nomor WA input (optional) */}
          <div className="flex space-x-1.5">
            <input
              type="tel"
              placeholder="Nomor WA Pelanggan (08xx)..."
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Kirim WA</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 border border-slate-700 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={handleCopy}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 border border-slate-700 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
