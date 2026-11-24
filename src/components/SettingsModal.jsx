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
  EyeOff,
  Server,
  RefreshCw,
  Save
} from 'lucide-react';
import { Storage } from '../services/storage';
import { Api } from '../services/api';

export function SettingsModal({ isOpen, onClose, onSyncComplete }) {
  // Profil & Kredensial Login Server
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [fullName, setFullName] = useState('Kasir Utama');
  const [role, setRole] = useState('admin');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginTestLoading, setLoginTestLoading] = useState(false);
  const [loginMsg, setLoginMsg] = useState(null);

  // Form Ganti Password Akun
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
      setPassword(u?.password || 'admin');
      setFullName(u?.nama_lengkap || 'Kasir WiFi');
      setRole(u?.role || 'admin');

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoginMsg(null);
      setPassMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Simpan & Tes Koneksi / Login ke Server kaswifi.my.id
  const handleSaveAndTestLogin = async (e) => {
    e.preventDefault();
    setLoginMsg(null);
    setLoginTestLoading(true);

    Storage.setUser({ username, password, nama_lengkap: fullName, role });

    const res = await Api.testConnection(username, password);
    setLoginTestLoading(false);

    if (res.success) {
      setLoginMsg({
        success: true,
        message: '✅ Berhasil login & terhubung ke kaswifi.my.id! Seluruh data transaksi & kategori tersinkron.'
      });
      if (onSyncComplete) onSyncComplete();
    } else {
      setLoginMsg({
        success: false,
        message: '❌ ' + (res.error || 'Login gagal. Periksa kembali username & password server Anda!')
      });
    }
  };

  // 2. Ganti Password di Server
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
      setPassword(newPassword);
      Storage.setUser({ password: newPassword });
      setPassMsg({ success: true, message: res.message });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onSyncComplete) onSyncComplete();
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
            <div
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-800 tracking-tight">Pengaturan Kelola Akun</h2>
              <p className="text-[11px] text-slate-500">Kredensial Server & Profil Kasir</p>
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

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Card 1: Akun & Kredensial Login Server */}
          <form
            onSubmit={handleSaveAndTestLogin}
            style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
            className="p-4 rounded-2xl border space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Akun & Password Server (kaswifi.my.id)</span>
              </span>
              <span
                style={{ backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase"
              >
                {role}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-tight">
              Pastikan Username & Password sesuai dengan akun kasir Anda di website <strong>kaswifi.my.id</strong> agar sinkronisasi lancar.
            </p>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Username Server
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Password Login Server
                </label>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password akun server"
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-9 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Nama Lengkap Kasir
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Kasir"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {loginMsg && (
                <div
                  style={
                    loginMsg.success
                      ? { backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }
                      : { backgroundColor: '#fff1f2', color: '#9f1239', borderColor: '#fecdd3' }
                  }
                  className="p-2.5 rounded-xl text-xs flex items-start space-x-2 border"
                >
                  {loginMsg.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-tight">{loginMsg.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginTestLoading}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="w-full py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 active:scale-98"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loginTestLoading ? 'animate-spin' : ''}`} />
                <span>{loginTestLoading ? 'Menghubungkan ke Server...' : 'Simpan & Tes Koneksi Server'}</span>
              </button>
            </div>
          </form>

          {/* Card 2: Form Ganti Password Akun */}
          <form
            onSubmit={handleChangePassword}
            style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
            className="p-4 rounded-2xl border space-y-3"
          >
            <div className="flex items-center space-x-1.5">
              <Key className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-950">Ganti Password Akun di Server</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-9 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Password Baru (Min. 4 karakter)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password baru minimal 4 karakter"
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-9 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {passMsg && (
                <div
                  style={
                    passMsg.success
                      ? { backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }
                      : { backgroundColor: '#fff1f2', color: '#9f1239', borderColor: '#fecdd3' }
                  }
                  className="p-2.5 rounded-xl text-xs flex items-center space-x-2 border"
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
                style={{ backgroundColor: '#f59e0b', color: '#020617' }}
                className="w-full py-2.5 rounded-xl font-extrabold text-xs tracking-wide shadow-xs transition-all flex items-center justify-center space-x-1.5 active:scale-98"
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
