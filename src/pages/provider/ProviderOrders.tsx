import React from 'react';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { cn } from '../../utils/cn';

const mockOrders = [
  { id: 'ORD-001', farmer: 'Ramesh Kumar', items: 'Vannamei Seed x 50,000', total: 22500, status: 'pending', date: '2026-03-19' },
  { id: 'ORD-002', farmer: 'Suresh Chen', items: 'Premium Growth Feed x 10', total: 850, status: 'shipped', date: '2026-03-18' },
];

export const ProviderOrders = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen">
      <Header title={t.orders} onMenuClick={onMenuClick} />
      <div className="pt-24 px-8 py-8">
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'pending', 'shipped', 'delivered'].map(status => (
            <button key={status} className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              status === 'all' ? "bg-[#C78200] text-white shadow-lg shadow-[#C78200]/20" : "bg-white border border-black/5 text-[#4A2C2A]/40 hover:text-[#C78200]"
            )}>
              {status === 'all' ? 'All' : t[status as keyof Translations] || status}
            </button>
          ))}
        </div>
        
        <div className="space-y-6">
          {mockOrders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 group hover:border-[#C78200]/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black text-[#4A2C2A]/20 uppercase tracking-widest mb-1">{order.id}</p>
                  <p className="font-black text-lg text-[#4A2C2A] tracking-tighter">{order.farmer}</p>
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl",
                  order.status === 'pending' ? "bg-[#C78200]/20 text-[#C78200]" : "bg-emerald-500/10 text-emerald-500"
                )}>
                  {order.status === 'pending' ? t.pending : t.shipped}
                </span>
              </div>
              <p className="text-[#4A2C2A]/60 text-sm font-medium mb-4">{order.items}</p>
              <div className="flex justify-between items-center pt-4 border-t border-black/5">
                <p className="font-black text-xl text-[#4A2C2A] tracking-tighter">₹{order.total}</p>
                <button className="bg-[#4A2C2A] text-white text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest shadow-xl shadow-[#4A2C2A]/10 active:scale-95 transition-all">
                  {t.viewDetails}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
