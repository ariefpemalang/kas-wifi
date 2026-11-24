// src/components/SettingsModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Storage } from '../services/storage';
import { Api } from '../services/api';

export function SettingsModal({ isOpen, onClose, onSyncComplete }) {
  // User Profile & Password State
  const [username, setUsername] = useState('admin');
  const [fullName, setFullName] = useState('Kasir Utama');
  const [role, setRole] = useState('admin');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const u = Storage.getUser();
      setUsername(u?.username || 'admin');
      setFullName(u?.nama_lengkap || 'Kasir WiFi');
      setRole(u?.role || 'admin');

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Simpan Profil Akun
  const handleSaveProfile = (e) => {
    e.preventDefault();
    Storage.setUser({ username, nama_lengkap: fullName, role });
    setPassMsg({ success: true, message: 'Profil akun kasir berhasil diperbarui!' });
    setTimeout(() => setPassMsg(null), 3000);
    if (onSyncComplete) onSyncComplete();
  };

  // 2. Ganti Password ke Server
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg(null);

    if (!oldPassword) {
      setPassMsg({ success: false, message: 'Masukkan password saat ini!' });
      return;
    }
    if (newPassword.length < 4) {
      setPassMsg({ success: false, message: 'Password baru minimal harus 4 karakter!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ success: false, message: 'Konfirmasi password baru tidak cocok!' });
      return;
    }

    setPassLoading(true);
    const res = await Api.changePassword(oldPassword, newPassword, confirmPassword);
    setPassLoading(false);

    if (res.success) {
      setPassMsg({ success: true, message: res.message });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPassMsg({ success: false, message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 overflow-y-auto">
      <div
        style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
        className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200"
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-800 tracking-tight">Pengaturan Kelola Akun</h2>
              <p className="text-[11px] text-slate-500">Profil Kasir & Keamanan Sandi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-600 active:scale-95 transition-all"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Khusus Kelola Akun & Ganti Password */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Profil Kasir Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Profil Akun Kasir</span>
              </span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200 uppercase">
                {role}
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Username Login
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username kasir"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Nama Lengkap Kasir
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkap kasir"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all active:scale-98"
              >
                Simpan Perubahan Profil
              </button>
            </div>
          </div>

          {/* Form Ganti Password */}
          <form onSubmit={handleChangePassword} className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center space-x-1.5">
              <Key className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-950">Ganti Password Akun</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 pr-9 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Password Baru (Min. 4 karakter)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password baru minimal 4 karakter"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 pr-9 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {passMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 border ${
                    passMsg.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {passMsg.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{passMsg.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={passLoading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs tracking-wide shadow-xs transition-all flex items-center justify-center space-x-1.5 active:scale-98"
              >
                <Key className={`w-3.5 h-3.5 ${passLoading ? 'animate-spin' : ''}`} />
                <span>{passLoading ? 'Menyimpan ke Server...' : 'Perbarui Password Akun'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
