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
      const updated = categories.filter(c => c.id !== id);
      Storage.saveCategories(updated);
      onUpdateCategories(updated);
    }
  };

  const incomeCats = categories.filter(c => c.type === 'pemasukan');
  const expenseCats = categories.filter(c => c.type === 'pengeluaran');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-sm text-white">Kelola Kategori Kas</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Form Tambah */}
          <form onSubmit={handleAdd} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 block">Tambah Kategori Baru</span>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                placeholder="Nama kategori..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="pemasukan">Pemasukan</option>
                <option value="pengeluaran">Pengeluaran</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </div>
          </form>

          {/* List Pemasukan */}
          <div>
            <span className="text-xs font-bold text-emerald-400 block mb-1.5">
              Kategori Pemasukan ({incomeCats.length})
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {incomeCats.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
                  <span className="text-slate-200">{c.name}</span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* List Pengeluaran */}
          <div>
            <span className="text-xs font-bold text-rose-400 block mb-1.5">
              Kategori Pengeluaran ({expenseCats.length})
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {expenseCats.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
                  <span className="text-slate-200">{c.name}</span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
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
