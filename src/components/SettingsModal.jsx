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
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Storage } from '../services/storage';
import { Api } from '../services/api';

export function SettingsModal({ isOpen, onClose, onSyncComplete }) {
  const [serverUrl, setServerUrl] = useState('');
  const [mode, setMode] = useState('online');
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
      setShopName(s.shopName || 'KAS WIFI');
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
      setConnStatus({ ok: true, message: 'Server Kas WiFi Terhubung & Siap Sinkron!' });
    } else {
      setConnStatus({
        ok: false,
        message: 'Tidak dapat terhubung: ' + res.error + '. Pastikan server aktif & URL benar.'
      });
    }
  };

  const handleQuickUrl = (url) => {
    setServerUrl(url);
    setConnStatus(null);
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
    if (onSyncComplete) onSyncComplete();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">Pengaturan & Sinkronisasi Server</h2>
              <p className="text-[11px] text-slate-500">Hubungkan mobile app ke database MySQL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
          {/* 1. KONEKSI SERVER */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Wifi className="w-4 h-4 text-blue-600" />
              <span>Alamat Server Database Kas WiFi</span>
            </span>

            <div>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://kaswifi.my.id"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Quick URL Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickUrl('https://kaswifi.my.id')}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white border border-slate-200 text-blue-700 hover:bg-blue-50"
              >
                🌐 https://kaswifi.my.id (Live)
              </button>
              <button
                type="button"
                onClick={() => handleQuickUrl('http://192.168.66.18')}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                🖥️ 192.168.66.18 (LXC Proxmox)
              </button>
              <button
                type="button"
                onClick={() => handleQuickUrl('http://localhost/kas-wifi')}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                💻 localhost/kas-wifi (Laragon)
              </button>
            </div>

            {/* Tombol Test Connection */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Memeriksa Koneksi...' : 'Tes Koneksi Server'}</span>
              </button>

              {connStatus && (
                <div
                  className={`mt-2 p-2.5 rounded-xl text-xs flex items-start space-x-2 border ${
                    connStatus.ok
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {connStatus.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-tight">{connStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. MODE OPERASIONAL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mode Aplikasi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('online')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === 'online'
                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-800">Online (Sinkron)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Data otomatis terhubung ke database MySQL.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('offline')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === 'offline'
                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-bold text-slate-800">Offline (Lokal)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Tersimpan di memori HP, sinkron saat online.
                </p>
              </button>
            </div>
          </div>

          {/* 3. SINKRONISASI MANUAL */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Kirim Data Offline</span>
              <span className="text-[10px] text-slate-500">Kirim transaksi tertunda ke server sekarang</span>
            </div>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition-colors"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkron...' : 'Sinkronkan'}</span>
            </button>
          </div>

          {syncMsg && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 border ${
                syncMsg.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {syncMsg.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{syncMsg.message}</span>
            </div>
          )}

          {/* 4. INFO USAHA & NOTA */}
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 block">Informasi Struk Thermal</span>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                Nama Usaha / Hotspot
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="KAS WIFI"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                Alamat / Keterangan
              </label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Hotspot Voucher RT/RW Net Berkah"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tombol Simpan Pengaturan */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs uppercase tracking-wider text-white shadow-md active:scale-98 transition-all flex items-center justify-center space-x-1.5"
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
