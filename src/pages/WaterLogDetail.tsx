import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Plus, 
  Clock, 
  Droplet, 
  Thermometer, 
  Activity, 
  Wind,
  Trash2,
  Edit2,
  Calendar
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Translations } from '../translations';
import { cn } from '../utils/cn';
import { format, parseISO } from 'date-fns';

export const WaterLogDetail = ({ t }: { t: Translations }) => {
  const { pondId, date } = useParams();
  const navigate = useNavigate();
  const { ponds, waterRecords } = useData();
  
  const pond = ponds.find(p => p.id === pondId);
  const selectedDate = date ? parseISO(date) : new Date();
  
  const dayRecords = waterRecords
    .filter(r => r.pondId === pondId && r.date === date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen text-left font-sans">
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-md px-6 py-8 flex items-center justify-between border-b border-black/5">
        <button onClick={() => navigate(-1)} className="p-3 text-slate-800 hover:bg-slate-50 rounded-2xl transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
            <h1 className="text-sm font-black text-slate-800 tracking-tighter uppercase">{pond?.name} Logs</h1>
            <p className="text-[10px] font-bold text-[#C78200] uppercase tracking-widest mt-0.5">{format(selectedDate, 'MMMM d, yyyy')}</p>
        </div>
        <button className="p-3 text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all relative">
          <Calendar size={24} />
        </button>
      </header>

      <div className="pt-32 px-6">
        {/* DAY SUMMARY HERO */}
        <div className="bg-[#0D3B2E] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20 mb-10">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
               <div>
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Daily Average</p>
                  <h2 className="text-3xl font-black text-white tracking-tighter">Biological Audit</h2>
               </div>
               <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md">
                  <Activity size={32} />
               </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
               <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">TOTAL LOGS</p>
                  <p className="text-xl font-black">{dayRecords.length}</p>
               </div>
               <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">AVG PH</p>
                  <p className="text-xl font-black">7.8</p>
               </div>
               <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">STABILITY</p>
                  <p className="text-xl font-black text-emerald-400">92%</p>
               </div>
            </div>
          </div>
          <div className="absolute right-[-10%] top-[-10%] w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        </div>

        {/* LOG ENTRIES LIST */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-800 tracking-tighter">Reading History</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{dayRecords.length} Entries Found</p>
           </div>
           
           <div className="space-y-4">
              {dayRecords.length > 0 ? dayRecords.map((record, i) => (
                <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-[#C78200]/20 transition-all">
                   <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#C78200] group-hover:bg-[#C78200] group-hover:text-white transition-all">
                            <Clock size={22} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-800 tracking-tight uppercase">Manual Reading</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Logged at 09:45 AM</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <button className="p-2 text-slate-200 hover:text-slate-400"><Edit2 size={16} /></button>
                         <button className="p-2 text-slate-200 hover:text-red-400"><Trash2 size={16} /></button>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8 mb-4">
                      <div className="flex items-center gap-4">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                         <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">pH LEVEL</p>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{record.ph}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-1.5 h-1.5 bg-[#4F7AFF] rounded-full" />
                         <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">DISSOLVED O2</p>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{record.do} mg/L</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                         <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SALINITY</p>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{record.salinity} ppt</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                         <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">AMMONIA</p>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{record.ammonia} ppm</p>
                         </div>
                      </div>
                   </div>
                </div>
              )) : (
                <div className="bg-white rounded-[3rem] p-16 border border-dashed border-slate-200 flex flex-col items-center text-center">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                      <Clock size={40} />
                   </div>
                   <h4 className="text-lg font-black text-slate-800 tracking-tighter mb-2">No Records Found</h4>
                   <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Log your first reading for {format(selectedDate, 'MMM d')}</p>
                </div>
              )}
           </div>
        </section>

        <button className="fixed bottom-32 right-6 w-16 h-16 bg-[#C78200] text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-amber-500/30 active:scale-95 transition-all z-50">
           <Plus size={32} strokeWidth={3} />
        </button>

        <button className="w-full mt-10 py-6 bg-emerald-500 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-4">
           {t.logEntry || 'Sync New Reading'}
        </button>
      </div>
    </div>
  );
};
