// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw, Smartphone, ShieldCheck, Settings, Eye, EyeOff } from 'lucide-react';
import { Storage } from '../services/storage';

export function Header({ mode, setMode, onOpenSettings, isSyncing, onSync, pendingCount }) {
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
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
            <Wifi className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-base tracking-tight text-white">KAS WIFI</h1>
              <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Mobile
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{currentTime}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {pendingCount > 0 && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center space-x-1 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg animate-pulse"
              title="Ada transaksi offline, tap untuk sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="font-semibold text-[11px]">{pendingCount}</span>
            </button>
          )}

          <button
            onClick={() => onOpenSettings()}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
          >
            <span className={`w-2 h-2 rounded-full ${mode === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className="text-[11px] capitalize">{mode}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            aria-label="Pengaturan"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
}
