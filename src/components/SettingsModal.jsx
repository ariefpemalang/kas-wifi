// src/components/SettingsModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  Wifi,
  CloudUpload,
  Printer,
  Smartphone,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Storage } from '../services/storage';
import { Api } from '../services/api';

export function SettingsModal({ isOpen, onClose, onSyncComplete }) {
  const [serverUrl, setServerUrl] = useState('');
  const [mode, setMode] = useState('offline');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [footerNote, setFooterNote] = useState('');
  const [connStatus, setConnStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setServerUrl(Storage.getServerUrl());
      setMode(Storage.getMode());
      const s = Storage.getSettings();
      setShopName(s.shopName || 'ARCELL WIFI');
      setShopAddress(s.shopAddress || 'Hotspot Voucher & RT/RW Net Berkah');
      setFooterNote(s.footerNote || 'Terima kasih telah berlangganan!');
      setConnStatus(null);
      setSyncMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnStatus(null);
    const res = await Api.testConnection(serverUrl);
    setIsTesting(false);
    if (res.success) {
      setConnStatus({ ok: true, message: 'Server Kas WiFi Terhubung!' });
    } else {
      setConnStatus({
        ok: false,
        message: 'Tidak dapat terhubung: ' + res.error + ' (Pastikan Apache/Laragon aktif dan IP benar)'
      });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    Storage.setServerUrl(serverUrl);
    Storage.setMode(mode);
    Storage.saveSettings({
      shopName,
      shopAddress,
      footerNote
    });
    alert('Pengaturan berhasil disimpan!');
    onClose();
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMsg(null);
    const res = await Api.syncOfflineData();
    setIsSyncing(false);
    setSyncMsg(res);
    if (res.success && onSyncComplete) {
      onSyncComplete();
    }
  };

  const offlineQueue = Storage.getOfflineQueue();
  const pendingCount = (offlineQueue.transactions?.length || 0) + (offlineQueue.transfers?.length || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-sm text-white">Pengaturan Aplikasi Mobile</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
          {/* Mode Operasi */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 block">Mode Aplikasi</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('offline')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all ${
                  mode === 'offline'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span>Standalone (Offline)</span>
                <span className="text-[9px] font-normal opacity-80">Data tersimpan di HP</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('online')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all ${
                  mode === 'online'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span>Online (Sync MySQL)</span>
                <span className="text-[9px] font-normal opacity-80">Konek ke Server PC</span>
              </button>
            </div>
          </div>

          {/* URL Server Kas WiFi */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Alamat Server Kas WiFi (PHP / Laragon)
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                placeholder="http://192.168.1.100/kas-wifi"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 whitespace-nowrap"
              >
                {isTesting ? 'Cek...' : 'Tes IP'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              💡 Tips: Masukkan IP Wi-Fi komputer Anda (misal: <code>http://192.168.1.5/kas-wifi</code>) agar HP dapat terhubung.
            </p>

            {connStatus && (
              <div
                className={`mt-2 p-2 rounded-xl text-xs flex items-center space-x-1.5 ${
                  connStatus.ok
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}
              >
                {connStatus.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{connStatus.message}</span>
              </div>
            )}
          </div>

          {/* Antrean Offline & Sinkronisasi */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 block">Antrean Sinkronisasi</span>
                <span className="text-[10px] text-slate-400">
                  {pendingCount} transaksi belum tersinkron ke PC
                </span>
              </div>
              <button
                type="button"
                disabled={isSyncing || pendingCount === 0}
                onClick={handleManualSync}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
                  pendingCount > 0
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Proses...' : 'Kirim ke PC'}</span>
              </button>
            </div>

            {syncMsg && (
              <p className={`text-[10px] ${syncMsg.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                {syncMsg.message}
              </p>
            )}
          </div>

          {/* Pengaturan Struk / Nota */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Profil Usaha & Format Nota Kasir</span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Nama Usaha / Hotspot</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Alamat / Keterangan Usaha</label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Catatan Bawah Nota</label>
              <input
                type="text"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl font-extrabold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
