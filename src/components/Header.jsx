// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw, Settings, ShieldCheck, WifiOff } from 'lucide-react';
import { Storage } from '../services/storage';

export function Header({ mode, setMode, onOpenSettings, isSyncing, onSync, pendingCount, onRefresh }) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()];
      const tgl = now.getDate();
      const bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][now.getMonth()];
      const jam = String(now.getHours()).padStart(2, '0');
      const mnt = String(now.getMinutes()).padStart(2, '0');
      const dtk = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hari}, ${tgl} ${bln} • ${jam}:${mnt}:${dtk} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 text-white shadow-lg border-b border-blue-900/50 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Brand & Jam */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white text-blue-700 flex items-center justify-center shadow-md font-bold ring-2 ring-blue-400/30">
            <Wifi className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-lg tracking-tight text-white">
                KAS <span className="text-amber-400">WIFI</span>
              </h1>
              <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                MOBILE
              </span>
            </div>
            <p className="text-[11px] text-blue-200/90 font-medium">{currentTime}</p>
          </div>
        </div>

        {/* Status Pill & Aksi */}
        <div className="flex items-center space-x-2">
          {/* Tombol Antrean Sync Offline */}
          {pendingCount > 0 && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center space-x-1 text-xs bg-amber-500 text-slate-950 font-bold px-2 py-1 rounded-lg shadow-sm animate-pulse"
              title="Ada transaksi belum tersinkron, tap untuk sinkronkan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">{pendingCount} Pending</span>
            </button>
          )}

          {/* Tombol Refresh Data */}
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
            title="Muat ulang data dari server"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {/* Status Koneksi */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all bg-white/10 hover:bg-white/20 border border-white/15 text-white"
            title="Klik untuk membuka pengaturan server"
          >
            <span className={`w-2 h-2 rounded-full ${mode === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-[11px]">{mode === 'online' ? 'Online' : 'Offline'}</span>
          </button>

          {/* Pengaturan */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15"
            aria-label="Pengaturan"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
