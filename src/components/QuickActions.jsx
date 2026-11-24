// src/components/QuickActions.jsx
import React from 'react';
import { PlusCircle, MinusCircle, ArrowLeftRight } from 'lucide-react';

export function QuickActions({ onOpenAddModal, onOpenTransferModal }) {
  const actions = [
    {
      id: 'pemasukan',
      title: 'Pemasukan',
      icon: PlusCircle,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200/60',
      hoverBorder: 'hover:border-emerald-300',
      onClick: () => onOpenAddModal('pemasukan')
    },
    {
      id: 'pengeluaran',
      title: 'Pengeluaran',
      icon: MinusCircle,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 border-rose-200/60',
      hoverBorder: 'hover:border-rose-300',
      onClick: () => onOpenAddModal('pengeluaran')
    },
    {
      id: 'transfer',
      title: 'Transfer',
      icon: ArrowLeftRight,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-200/60',
      hoverBorder: 'hover:border-blue-300',
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
            className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md active:scale-95 transition-all text-center group ${act.hoverBorder}`}
          >
            <div
              className={`w-11 h-11 rounded-xl ${act.iconBg} border flex items-center justify-center ${act.iconColor} mb-1.5 shadow-2xs group-hover:scale-105 transition-transform`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{act.title}</span>
          </button>
        );
      })}
    </div>
  );
}
