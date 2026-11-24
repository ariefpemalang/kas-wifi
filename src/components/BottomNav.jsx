// src/components/BottomNav.jsx
import React from 'react';
import { LayoutDashboard, Receipt, BarChart3 } from 'lucide-react';

export function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'reports', label: 'Laporan', icon: BarChart3 }
  ];

  return (
    <nav style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} className="fixed bottom-0 left-0 right-0 z-40 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-2">
      <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{ color: isActive ? '#2563eb' : '#64748b' }}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
                isActive ? 'font-bold' : 'hover:opacity-80'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {isActive && (
                  <span style={{ backgroundColor: '#2563eb' }} className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"></span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
