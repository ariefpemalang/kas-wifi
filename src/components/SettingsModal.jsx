// src/components/SettingsModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  Zap
} from 'lucide-react';
import { Storage } from '../services/storage';
import { Api } from '../services/api';
import { SupabaseService } from '../services/supabase';

export function SettingsModal({ isOpen, onClose, onSyncComplete }) {
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [footerNote, setFooterNote] = useState('');
  const [connStatus, setConnStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
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
    const res = await Api.testConnection();
    setIsTesting(false);
    if (res.success) {
      setConnStatus({ ok: true, message: '⚡ Terhubung ke Supabase Cloud (PostgreSQL Realtime)!' });
    } else {
      setConnStatus({
        ok: false,
        message: 'Tidak dapat terhubung ke Supabase: ' + res.error
      });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    Storage.saveSettings({
      shopName,
      shopAddress,
      footerNote
    });
    alert('Pengaturan toko berhasil disimpan!');
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
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">Status Database Supabase Cloud</h2>
              <p className="text-[11px] text-slate-500">Sinkronisasi Realtime Dua Arah (Multi-Device)</p>
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
          {/* 1. KONEKSI SUPABASE */}
          <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase PostgreSQL Cloud</span>
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                ⚡ Realtime WebSocket
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Project URL:</span>
                <span className="font-mono text-slate-800 truncate max-w-[200px]">
                  {SupabaseService.config.url}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Status Sinkron:</span>
                <span className="font-bold text-emerald-600">Aktif Real-time</span>
              </div>
            </div>

            {/* Tombol Test Connection */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Memeriksa Koneksi...' : 'Periksa Koneksi Supabase'}</span>
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

          {/* 2. SINKRONISASI MANUAL KE CLOUD */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Kirim Data ke Supabase</span>
              <span className="text-[10px] text-slate-500">Paksa sinkronisasi seluruh catatan kasir</span>
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

          {/* 3. INFO USAHA & NOTA */}
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 block">Pengaturan Struk Thermal</span>

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
