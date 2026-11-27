// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import appLogo from '../assets/app-icon.png';

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
    <header
      style={{
        background: 'linear-gradient(135deg, #090d16 0%, #0f172a 45%, #1e3a8a 100%)',
        color: '#ffffff',
        borderBottom: '1px solid rgba(59, 130, 246, 0.25)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}
      className="sticky top-0 z-30 px-4 py-2.5"
    >
      <div className="flex items-center justify-between">
        {/* Brand Logo & Info */}
        <div className="flex items-center space-x-2.5">
          {/* Icon Title Aplikasi KAS WIFI */}
          <div
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              border: '1.5px solid rgba(96, 165, 250, 0.5)'
            }}
            className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-slate-900"
          >
            <img
              src={appLogo}
              alt="Logo KAS WIFI"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = '/app-icon.png'; }}
            />
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-1.5 leading-tight">
              <h1 className="font-extrabold text-base tracking-tight" style={{ color: '#ffffff' }}>
                KAS <span style={{ color: '#fbbf24' }}>WIFI</span>
              </h1>
              <span
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
                className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full tracking-wider flex items-center space-x-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse"></span>
                <span>kaswifi.my.id</span>
              </span>
            </div>
            <p className="text-[10.5px] font-medium leading-normal mt-0.5" style={{ color: '#93c5fd' }}>
              {currentTime}
            </p>
          </div>
        </div>

        {/* Action Buttons (Refresh & Gear Pengaturan) */}
        <div className="flex items-center space-x-2">
          {/* Tombol Antrean Sync Offline jika ada data pending */}
          {pendingCount > 0 && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              style={{
                backgroundColor: '#f59e0b',
                color: '#090d16'
              }}
              className="flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-xl shadow-sm animate-pulse active:scale-95 transition-all"
              title="Ada data belum tersinkron ke cloud, tap untuk sinkronkan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">{pendingCount}</span>
            </button>
          )}

          {/* Tombol Refresh Data */}
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff'
            }}
            className="p-2 rounded-xl hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center shadow-xs"
            title="Sinkronkan ulang data dari server"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {/* Tombol Pengaturan Kelola Akun (Pojok Kanan Atas) */}
          <button
            onClick={onOpenSettings}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff'
            }}
            className="p-2 rounded-xl hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center shadow-xs"
            title="Pengaturan Kelola Akun"
            aria-label="Pengaturan Kelola Akun"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
