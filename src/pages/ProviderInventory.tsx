import React from 'react';
import { Plus, Utensils, Waves, Settings } from 'lucide-react';
import { Header } from '../components/Header';
import { Translations } from '../translations';
import { cn } from '../utils/cn';

const mockInventory = [
  { id: '1', name: 'Vannamei Seed (SPF)', price: 0.45, stock: 500000, category: 'Seed' },
  { id: '2', name: 'Premium Growth Feed', price: 85, stock: 1200, category: 'Feed' },
  { id: '3', name: 'Water Probiotic', price: 450, stock: 85, category: 'Medicine' },
];

export const ProviderInventory = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen">
      <Header title={t.inventory} onMenuClick={onMenuClick} />
      <div className="pt-24 px-8 py-8">
        <button className="w-full bg-[#C78200] text-white font-black py-6 rounded-[2.5rem] shadow-xl shadow-[#C78200]/30 flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-[11px] mb-10 active:scale-95 transition-all">
          <Plus size={20} /> {t.addProduct}
        </button>
        
        <div className="space-y-8">
          {mockInventory.map((item, i) => (
            <div key={item.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center gap-6 group hover:border-[#C78200]/30 transition-all relative overflow-hidden border border-black/5">
              <div className={cn(
                "absolute top-0 left-0 w-1.5 h-full",
                i % 4 === 0 ? "bg-[#C78200]" : 
                i % 4 === 1 ? "bg-[#4A2C2A]" : 
                i % 4 === 2 ? "bg-emerald-500" : "bg-blue-500"
              )} />
              <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm",
                i % 4 === 0 ? "bg-[#C78200]/10 text-[#C78200]" : 
                i % 4 === 1 ? "bg-[#4A2C2A]/10 text-[#4A2C2A]" : 
                i % 4 === 2 ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
              )}>
                {item.category === 'Seed' ? <Waves size={32} /> : <Utensils size={32} />}
              </div>
              <div className="flex-1">
                <p className="font-black text-lg text-[#4A2C2A] tracking-tight">{item.name}</p>
                <div className="flex items-center gap-6 mt-2">
                  <p className="text-[#4A2C2A]/40 text-[11px] font-black uppercase tracking-widest">₹{item.price}</p>
                  <p className="text-[#4A2C2A]/40 text-[11px] font-black uppercase tracking-widest">{t.stock}: <span className="text-[#4A2C2A]">{item.stock}</span></p>
                </div>
              </div>
              <button className="p-4 rounded-2xl bg-[#F8F9FE] text-[#4A2C2A]/20 hover:text-[#C78200] hover:bg-white transition-all shadow-sm border border-black/5">
                <Settings size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
