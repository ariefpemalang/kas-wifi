// src/components/QuickActions.jsx
import React from 'react';
import { PlusCircle, MinusCircle, ArrowLeftRight } from 'lucide-react';

export function QuickActions({ onOpenAddModal, onOpenTransferModal }) {
  const actions = [
    {
      id: 'pemasukan',
      title: 'Pemasukan',
      icon: PlusCircle,
      iconColor: '#059669',
      iconBg: '#ecfdf5',
      iconBorder: '#a7f3d0',
      onClick: () => onOpenAddModal('pemasukan')
    },
    {
      id: 'pengeluaran',
      title: 'Pengeluaran',
      icon: MinusCircle,
      iconColor: '#e11d48',
      iconBg: '#fff1f2',
      iconBorder: '#fecdd3',
      onClick: () => onOpenAddModal('pengeluaran')
    },
    {
      id: 'transfer',
      title: 'Transfer',
      icon: ArrowLeftRight,
      iconColor: '#2563eb',
      iconBg: '#eff6ff',
      iconBorder: '#bfdbfe',
      onClick: onOpenTransferModal
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            onClick={act.onClick}
            style={{ backgroundColor: '#ffffff' }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md active:scale-95 transition-all text-center group"
          >
            <div
              style={{ backgroundColor: act.iconBg, color: act.iconColor, borderColor: act.iconBorder }}
              className="w-11 h-11 rounded-xl border flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform"
            >
              <Icon className="w-5 h-5" />
            </div>
            <span style={{ color: '#1e293b' }} className="text-xs font-bold">{act.title}</span>
          </button>
        );
      })}
    </div>
  );
}
