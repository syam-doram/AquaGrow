import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Header } from '../components/Header';
import { Translations } from '../translations';
import { cn } from '../utils/cn';

export const AdminDashboard = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen">
      <Header title={t.adminControl} showBack onMenuClick={onMenuClick} />
      <div className="pt-24 px-6 py-8 space-y-10">
        <div className="grid grid-cols-2 gap-6">
          <AdminStat label={t.totalUsers} value="12,482" trend="+12%" />
          <AdminStat label={t.activeSubs} value="8,210" trend="+5%" />
          <AdminStat label={t.revenue} value="₹ 4.2M" trend="+18%" />
          <AdminStat label={t.health} value="99.9%" trend="Stable" />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-black/5">
          <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#C78200]/5">
            <h3 className="font-black text-sm tracking-tight text-[#4A2C2A]">{t.marketPrice} {t.updatePrice}</h3>
            <TrendingUp size={18} className="text-[#C78200]" />
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">{t.region}</label>
                <select className="w-full bg-[#F8F9FE] p-4 rounded-xl text-sm font-black text-[#4A2C2A] outline-none border border-black/5 focus:border-[#C78200]/30 transition-all appearance-none">
                  <option>Bhimavaram</option>
                  <option>Nellore</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">{t.count}</label>
                <input className="w-full bg-[#F8F9FE] p-4 rounded-xl text-sm font-black text-[#4A2C2A] border border-black/5 focus:border-[#C78200]/30 outline-none transition-all" placeholder="40" />
              </div>
            </div>
            <button className="w-full py-5 bg-[#C78200] text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#C78200]/20 active:scale-95 transition-all">{t.updatePrice}</button>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A] px-1">{t.recentActivity}</h3>
          <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden divide-y divide-[#4A2C2A]/5 border border-black/5">
            {[
              { u: 'Ravi Kumar', a: 'Sub Renewal', l: 'Bhimavaram', t: '2m ago' },
              { u: 'P. Lakshmi', a: 'Price Check', l: 'Nellore', t: '15m ago' },
            ].map(row => (
              <div key={row.u} className="p-5 flex items-center justify-between hover:bg-[#C78200]/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C78200]/5 flex items-center justify-center font-black text-[#C78200] text-xs">
                    {row.u[0]}
                  </div>
                  <div>
                    <p className="font-black text-sm tracking-tight text-[#4A2C2A]">{row.u}</p>
                    <p className="text-[#4A2C2A]/40 text-[10px] font-bold uppercase tracking-widest">{row.a}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-[#4A2C2A]/40 uppercase tracking-widest">{row.l}</p>
                  <p className="text-[9px] text-[#4A2C2A]/20 font-bold uppercase tracking-widest">{row.t}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminStat = ({ label, value, trend, negative }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5">
    <p className="text-[#4A2C2A]/30 text-[9px] font-black uppercase tracking-widest mb-2">{label}</p>
    <p className="text-2xl font-black tracking-tighter text-[#4A2C2A]">{value}</p>
    <p className={cn("text-[9px] font-black uppercase tracking-widest mt-2", negative ? "text-red-500" : "text-[#C78200]")}>{trend}</p>
  </div>
);
