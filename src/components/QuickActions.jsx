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
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200/60',
      hoverBorder: 'hover:border-emerald-300',
      onClick: () => onOpenAddModal('pemasukan')
    },
    {
      id: 'pengeluaran',
      title: 'Pengeluaran',
      subtitle: '- Biaya & PLN',
      icon: MinusCircle,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 border-rose-200/60',
      hoverBorder: 'hover:border-rose-300',
      onClick: () => onOpenAddModal('pengeluaran')
    },
    {
      id: 'transfer',
      title: 'Transfer',
      subtitle: 'Pindah Dompet',
      icon: ArrowLeftRight,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-200/60',
      hoverBorder: 'hover:border-blue-300',
      onClick: onOpenTransferModal
    },
    {
      id: 'struk',
      title: 'Nota / Struk',
      subtitle: 'Cetak & WA',
      icon: ReceiptText,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-200/60',
      hoverBorder: 'hover:border-amber-300',
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
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md active:scale-95 transition-all text-center group ${act.hoverBorder}`}
          >
            <div
              className={`w-11 h-11 rounded-xl ${act.iconBg} border flex items-center justify-center ${act.iconColor} mb-1.5 shadow-xs group-hover:scale-105 transition-transform`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{act.title}</span>
            <span className="text-[9px] text-slate-500 truncate w-full mt-0.5">{act.subtitle}</span>
          </button>
        );
      })}
    </div>
  );
}
