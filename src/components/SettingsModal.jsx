// src/components/SettingsModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  Globe,
  Lock,
  User
} from 'lucide-react';
import { Storage } from '../services/storage';
import { Api } from '../services/api';

export function SettingsModal({ isOpen, onClose, onSyncComplete }) {
  const [serverUrl, setServerUrl] = useState('https://kaswifi.my.id');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [footerNote, setFooterNote] = useState('');
  const [connStatus, setConnStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setServerUrl(Storage.getServerUrl() || 'https://kaswifi.my.id');
      const u = Storage.getUser();
      setUsername(u?.username || 'admin');
      const s = Storage.getSettings();
      setShopName(s.shopName || 'KAS WIFI');
      setShopAddress(s.shopAddress || 'Hotspot Voucher & RT/RW Net Berkah');
      setFooterNote(s.footerNote || 'Terima kasih telah berlangganan!');
      setConnStatus(null);
      setSyncMsg(null);
      handleTestConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnStatus(null);
    Storage.setServerUrl(serverUrl);
    const res = await Api.testConnection();
    setIsTesting(false);
    if (res.success) {
      setConnStatus({ ok: true, message: `⚡ Terhubung ke Server: ${serverUrl}` });
    } else {
      setConnStatus({
        ok: false,
        message: 'Tidak dapat terhubung ke Server: ' + res.error
      });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    Storage.setServerUrl(serverUrl);
    Storage.setUser({ username, nama_lengkap: 'Kasir WiFi', role: 'admin' });
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
    Storage.setServerUrl(serverUrl);
    const res = await Api.getDashboardSummary();
    setIsSyncing(false);
    if (res.success) {
      setSyncMsg({ success: true, message: `✅ Berhasil sinkronisasi dengan ${serverUrl}!` });
      if (onSyncComplete) onSyncComplete();
    } else {
      setSyncMsg({ success: false, message: 'Gagal sinkron: server tidak merespon' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">Pengaturan & Sinkronisasi Server</h2>
              <p className="text-[11px] text-slate-500">Koneksi Database Kas WiFi (kaswifi.my.id)</p>
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
          {/* 1. KONEKSI SERVER 192.168.66.18 */}
          <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Target Server Database</span>
              </span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                LAN / Cloud
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Alamat Server Kas WiFi:
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://kaswifi.my.id"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="flex items-center space-x-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setServerUrl('https://kaswifi.my.id')}
                  className="text-[10px] font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-blue-700 hover:bg-blue-100"
                >
                  Gunakan kaswifi.my.id (Online)
                </button>
                <button
                  type="button"
                  onClick={() => setServerUrl('http://192.168.66.18')}
                  className="text-[10px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 hover:bg-slate-50"
                >
                  Gunakan 192.168.66.18 (Lokal)
                </button>
              </div>
            </div>

            {/* Tombol Test Connection */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Memeriksa Server...' : 'Tes Koneksi Server'}</span>
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

          {/* 2. SINKRONISASI MANUAL DENGAN SERVER */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Tarik Data dari kaswifi.my.id</span>
              <span className="text-[10px] text-slate-500">Sinkronkan saldo dan seluruh riwayat transaksi</span>
            </div>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
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

          {/* 3. INFO USAHA & NOTA */}
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 block">Pengaturan Struk Thermal & Toko</span>

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
                Alamat / Keterangan Usaha
              </label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Hotspot Voucher RT/RW Net Berkah"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                Catatan Kaki Struk
              </label>
              <input
                type="text"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                placeholder="Terima kasih telah berlangganan!"
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
