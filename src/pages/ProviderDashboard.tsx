import React from 'react';
import { Header } from '../components/Header';
import { Translations } from '../translations';
import { cn } from '../utils/cn';

const mockOrders = [
  { id: 'ORD-001', farmer: 'Ramesh Kumar', items: 'Vannamei Seed x 50,000', total: 22500, status: 'pending', date: '2026-03-19' },
  { id: 'ORD-002', farmer: 'Suresh Chen', items: 'Premium Growth Feed x 10', total: 850, status: 'shipped', date: '2026-03-18' },
];

export const ProviderDashboard = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen">
      <Header title={t.providerDashboard} onMenuClick={onMenuClick} />
      
      <div className="px-8 py-8 grid grid-cols-2 gap-6 pt-24">
        <div className="bg-[#4A2C2A] p-8 rounded-[2.5rem] shadow-sm text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-3">{t.totalSales}</p>
            <p className="text-3xl font-black tracking-tighter">₹23,350</p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#C78200]/20 blur-3xl rounded-full group-hover:scale-125 transition-transform"></div>
        </div>
        <div className="bg-[#C78200] p-8 rounded-[2.5rem] shadow-sm text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-3">{t.activeOrders}</p>
            <p className="text-3xl font-black tracking-tighter">12</p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform"></div>
        </div>
      </div>

      <section className="px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black tracking-tighter text-[#4A2C2A]">{t.recentActivity}</h2>
        </div>
        <div className="space-y-4">
          {mockOrders.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-black/5 flex items-center justify-between group hover:border-[#C78200]/30 transition-all">
              <div>
                <p className="font-black text-sm text-[#4A2C2A]">{order.farmer}</p>
                <p className="text-[10px] font-bold text-[#4A2C2A]/40 uppercase tracking-widest mt-1">{order.items}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-sm text-[#4A2C2A]">₹{order.total}</p>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                  order.status === 'pending' ? "bg-[#C78200]/20 text-[#C78200]" : "bg-emerald-500/10 text-emerald-500"
                )}>
                  {order.status === 'pending' ? t.pending : t.shipped}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
