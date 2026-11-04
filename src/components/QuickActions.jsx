// src/components/QuickActions.jsx
import React from 'react';
import { PlusCircle, MinusCircle, ArrowLeftRight, ReceiptText } from 'lucide-react';

export function QuickActions({ onOpenAddModal, onOpenTransferModal, onOpenReceiptModal }) {
  const actions = [
    {
      id: 'pemasukan',
      title: 'Pemasukan',
      subtitle: '+ Voucher / Member',
      icon: PlusCircle,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      onClick: () => onOpenAddModal('pemasukan')
    },
    {
      id: 'pengeluaran',
      title: 'Pengeluaran',
      subtitle: '- Biaya & PLN',
      icon: MinusCircle,
      gradient: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/20',
      onClick: () => onOpenAddModal('pengeluaran')
    },
    {
      id: 'transfer',
      title: 'Transfer',
      subtitle: 'Pindah Dompet',
      icon: ArrowLeftRight,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
      onClick: onOpenTransferModal
    },
    {
      id: 'struk',
      title: 'Nota / Struk',
      subtitle: 'Cetak & WA',
      icon: ReceiptText,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
      onClick: onOpenReceiptModal
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            onClick={act.onClick}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 active:scale-95 transition-all text-center group"
          >
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${act.gradient} flex items-center justify-center text-white mb-1.5 shadow-lg ${act.shadow} group-hover:scale-105 transition-transform`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">{act.title}</span>
            <span className="text-[9px] text-slate-400 truncate w-full">{act.subtitle}</span>
          </button>
        );
      })}
    </div>
  );
}
