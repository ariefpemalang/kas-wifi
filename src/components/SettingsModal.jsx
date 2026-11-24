// src/components/SettingsModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Key,
  ShieldCheck,
  Server,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  Globe,
  Store,
  Eye,
  EyeOff
} from 'lucide-react';
import { Storage } from '../services/storage';
import { Api } from '../services/api';

export function SettingsModal({ isOpen, onClose, onSyncComplete }) {
  const [activeTab, setActiveTab] = useState('account'); // 'account', 'server', 'shop'

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

  // Server Connection State
  const [serverUrl, setServerUrl] = useState('https://kaswifi.my.id');
  const [connStatus, setConnStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  // Shop & Receipt State
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [footerNote, setFooterNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setServerUrl(Storage.getServerUrl() || 'https://kaswifi.my.id');
      const u = Storage.getUser();
      setUsername(u?.username || 'admin');
      setFullName(u?.nama_lengkap || 'Kasir WiFi');
      setRole(u?.role || 'admin');

      const s = Storage.getSettings();
      setShopName(s.shopName || 'KAS WIFI');
      setShopAddress(s.shopAddress || 'Hotspot Voucher & RT/RW Net Berkah');
      setFooterNote(s.footerNote || 'Terima kasih telah berlangganan!');

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassMsg(null);
      setConnStatus(null);
      setSyncMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Simpan Profil Akun
  const handleSaveProfile = (e) => {
    e.preventDefault();
    Storage.setUser({ username, nama_lengkap: fullName, role });
    setPassMsg({ success: true, message: 'Profil akun kasir berhasil diperbarui!' });
    setTimeout(() => setPassMsg(null), 3000);
  };

  // 2. Ganti Password ke Server
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg(null);

    if (!oldPassword) {
      setPassMsg({ success: false, message: 'Masukkan password lama saat ini!' });
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

  // 3. Tes Koneksi Server
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

  // 4. Sinkronisasi Manual dengan Server
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

  // 5. Simpan Pengaturan Usaha & Struk
  const handleSaveShopSettings = (e) => {
    e.preventDefault();
    Storage.saveSettings({
      shopName,
      shopAddress,
      footerNote
    });
    alert('Pengaturan Toko & Struk berhasil disimpan!');
    if (onSyncComplete) onSyncComplete();
    onClose();
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
              <h2 className="font-extrabold text-sm text-slate-800 tracking-tight">Pengaturan & Kelola Akun</h2>
              <p className="text-[11px] text-slate-500">KAS WIFI • kaswifi.my.id</p>
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'account'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Akun & Sandi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('server')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'server'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Server</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'shop'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Info Struk</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* TAB 1: KELOLA AKUN & GANTI PASSWORD */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              {/* Profil Kasir Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Profil Pengguna Kasir</span>
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200 uppercase">
                    {role}
                  </span>
                </div>

                <div className="space-y-2">
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
                    className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all"
                  >
                    Simpan Profil Kasir
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
                        placeholder="Password baru minimal 4 huruf/angka"
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
                    <span>{passLoading ? 'Menyimpan...' : 'Perbarui Password Akun'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: KONEKSI SERVER */}
          {activeTab === 'server' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Target Server Database</span>
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                    Online / Cloud
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Alamat Server:
                  </label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="https://kaswifi.my.id"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setServerUrl('https://kaswifi.my.id')}
                      className="text-[10px] font-semibold bg-blue-100/70 border border-blue-300 px-2.5 py-1 rounded-lg text-blue-800 hover:bg-blue-100"
                    >
                      kaswifi.my.id (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() => setServerUrl('http://192.168.66.18')}
                      className="text-[10px] font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 hover:bg-slate-50"
                    >
                      192.168.66.18 (Lokal)
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

              {/* SINKRONISASI MANUAL */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Sinkronisasi Database</span>
                  <span className="text-[10px] text-slate-500">Tarik saldo dan transaksi terbaru</span>
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
            </div>
          )}

          {/* TAB 3: INFO STRUK & TOKO */}
          {activeTab === 'shop' && (
            <form onSubmit={handleSaveShopSettings} className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">Pengaturan Struk & Usaha</span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    Nama Usaha / Hotspot
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="KAS WIFI"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white shadow-md active:scale-98 transition-all flex items-center justify-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Struk</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
