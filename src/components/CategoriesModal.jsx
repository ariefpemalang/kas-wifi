// src/components/CategoriesModal.jsx
import React, { useState } from 'react';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import { Storage } from '../services/storage';

export function CategoriesModal({ isOpen, onClose, categories = [], onUpdateCategories }) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('pemasukan');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat = {
      id: Date.now(),
      name: newCatName.trim(),
      type: newCatType
    };

    const updated = [...categories, newCat];
    Storage.saveCategories(updated);
    onUpdateCategories(updated);
    setNewCatName('');
  };

  const handleDelete = (id) => {
    if (confirm('Hapus kategori ini?')) {
      const updated = categories.filter((c) => c.id !== id);
      Storage.saveCategories(updated);
      onUpdateCategories(updated);
    }
  };

  const incomeCats = categories.filter((c) => c.type === 'pemasukan');
  const expenseCats = categories.filter((c) => c.type === 'pengeluaran');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-800">Kelola Kategori Kas</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Form Tambah */}
          <form onSubmit={handleAdd} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Tambah Kategori Baru</span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nama kategori..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="pemasukan">Masuk</option>
                <option value="pengeluaran">Keluar</option>
              </select>
              <button
                type="submit"
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                title="Tambah"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* List Kategori Pemasukan */}
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1.5">
              Kategori Pemasukan ({incomeCats.length})
            </span>
            <div className="space-y-1.5">
              {incomeCats.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
                >
                  <span className="font-medium">{c.name}</span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* List Kategori Pengeluaran */}
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1.5">
              Kategori Pengeluaran ({expenseCats.length})
            </span>
            <div className="space-y-1.5">
              {expenseCats.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
                >
                  <span className="font-medium">{c.name}</span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
