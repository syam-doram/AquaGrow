import React from 'react';
import { useParams } from 'react-router-dom';
import { Utensils, Plus } from 'lucide-react';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';

export const PondFeedingLog = ({ t }: { t: Translations }) => {
  const { id } = useParams();
  const { ponds, feedLogs } = useData();
  const pond = ponds.find(p => p.id === id) || ponds[0];
  
  if (!pond) return null;

  const logs = feedLogs.filter(l => l.pondId === id);

  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen">
      <Header title={`${pond.name} - ${t.feedingLog}`} showBack />
      <div className="pt-24 px-6 py-8 space-y-10">
        <div className="bg-[#C78200] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-[#C78200]/20">
          <div className="relative z-10">
            <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em]">Total Feed Today</p>
            <h2 className="text-5xl font-black tracking-tighter mt-2">45.5 kg</h2>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">Target: 48.0 kg</p>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 blur-[80px] rounded-full"></div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A] px-1">Feeding Schedule</h3>
          <div className="space-y-4">
            {logs.length > 0 ? logs.map((log, i) => (
              <FeedingItem key={log.id} time={log.time} amount={`${log.quantity} kg`} type={log.brand} status="Completed" />
            )) : (
              <>
                <FeedingItem time="06:00 AM" amount="12.0 kg" type="Starter" status="Completed" />
                <FeedingItem time="10:30 AM" amount="11.5 kg" type="Starter" status="Completed" />
              </>
            )}
          </div>
        </div>
      </div>
      <div className="fixed bottom-32 right-8">
        <button className="w-16 h-16 bg-[#C78200] text-white rounded-[2.5rem] shadow-2xl shadow-[#C78200]/30 flex items-center justify-center hover:scale-110 active:scale-90 transition-all">
          <Plus size={36} />
        </button>
      </div>
    </div>
  );
};

const FeedingItem = ({ time, amount, type, status }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 flex items-center justify-between group hover:border-[#C78200]/30 transition-all">
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 rounded-2xl bg-[#C78200]/5 flex items-center justify-center text-[#C78200] group-hover:bg-[#C78200]/10 transition-colors">
        <Utensils size={24} />
      </div>
      <div>
        <p className="font-black text-sm tracking-tight text-[#4A2C2A]">{time}</p>
        <p className="text-[#4A2C2A]/40 text-[10px] font-bold uppercase tracking-widest mt-1">{amount} • {type}</p>
      </div>
    </div>
    <div className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest", status === 'Completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-[#4A2C2A]/5 text-[#4A2C2A]/30")}>
      {status}
    </div>
  </div>
);
