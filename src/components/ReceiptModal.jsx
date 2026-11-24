// src/components/ReceiptModal.jsx
import React, { useState } from 'react';
import { X, Printer, Share2, Copy, Check, MessageSquare } from 'lucide-react';
import { formatRupiah, formatTanggalIndo, generateWhatsAppMessage, decodeHtmlEntities } from '../utils/format';
import { Storage } from '../services/storage';

export function ReceiptModal({ isOpen, onClose, transaction }) {
  const [copied, setCopied] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');

  if (!isOpen) return null;

  const settings = Storage.getSettings();
  const user = Storage.getUser();

  const receiptData = {
    id: transaction?.id || Date.now().toString().slice(-6),
    shopName: settings.shopName || 'KAS WIFI',
    shopAddress: settings.shopAddress || 'Hotspot Voucher & RT/RW Net Berkah',
    time: transaction?.transaction_time || new Date().toISOString(),
    cashier: user.nama_lengkap || 'Kasir WiFi',
    walletName: transaction?.wallet_name || 'TUNAI',
    categoryName: decodeHtmlEntities(transaction?.category_name || 'Voucher WiFi'),
    description: decodeHtmlEntities(transaction?.description || 'Pembelian Akses Internet'),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800">Struk Transaksi Kasir</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Isi Struk Thermal */}
        <div className="p-4 overflow-y-auto bg-slate-100/50 flex-1 flex flex-col items-center">
          <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center font-mono text-xs text-slate-800">
            {/* Header Toko */}
            <h3 className="font-extrabold text-sm uppercase tracking-wide">{receiptData.shopName}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{receiptData.shopAddress}</p>
            <div className="border-b border-dashed border-slate-300 my-2.5"></div>

            {/* Info Transaksi */}
            <div className="text-[10px] text-left space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>No. TRX:</span>
                <span className="font-bold">#{receiptData.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{receiptData.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{receiptData.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="font-bold">{receiptData.walletName}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-slate-300 my-2.5"></div>

            {/* Item Transaksi */}
            <div className="text-left space-y-1">
              <div className="font-bold text-xs">{receiptData.categoryName}</div>
              {receiptData.description && (
                <div className="text-[10px] text-slate-500">{receiptData.description}</div>
              )}
              <div className="flex justify-between items-center pt-1 text-sm font-extrabold text-slate-900">
                <span>TOTAL:</span>
                <span>{formatRupiah(receiptData.amount)}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-slate-300 my-2.5"></div>

            {/* Catatan Footer */}
            <p className="text-[10px] text-slate-500 leading-tight">
              {receiptData.footerNote}
            </p>
          </div>

          {/* Kirim WhatsApp Input */}
          <div className="w-full mt-3 space-y-2">
            <div className="flex items-center space-x-1.5">
              <input
                type="tel"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                placeholder="No WhatsApp pelanggan (0812...)"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition-colors shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Kirim WA</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopy}
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1 border border-slate-200 shadow-2xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Nota</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
