import React from 'react';
import { Activity } from 'lucide-react';
import { cn } from '../utils/cn';
import { Translations } from '../translations';

interface MetricCardProps {
  label: string;
  value: string;
  target: string;
  status: 'optimal' | 'warning';
  t: Translations;
}

export const MetricCard = ({ label, value, target, status, t }: MetricCardProps) => (
  <div className="glass-card p-4 premium-shadow hover:border-accent/30 transition-all group relative overflow-hidden">
    <div className={cn(
      "absolute top-0 right-0 w-16 h-16 opacity-5 translate-x-4 -translate-y-4 rounded-full",
      status === 'optimal' ? "bg-vibrant-green" : "bg-accent"
    )} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={cn(
        "p-2 rounded-xl transition-transform group-hover:scale-110",
        status === 'optimal' ? "bg-vibrant-green/10 text-vibrant-green" : "bg-accent/10 text-accent"
      )}>
        <Activity size={18} />
      </div>
      <span className={cn(
        "text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
        status === 'optimal' ? "bg-vibrant-green/10 text-vibrant-green" : "bg-accent/10 text-accent"
      )}>
        {status === 'optimal' ? t.optimal : t.warning}
      </span>
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest text-[#4A2C2A]/30 mb-1 relative z-10">{label}</p>
    <div className="flex items-baseline gap-2 relative z-10">
      <h4 className="text-2xl font-black text-[#4A2C2A] tracking-tighter">{value}</h4>
      <span className="text-[9px] font-black text-[#4A2C2A]/20 uppercase tracking-widest">{t.targetLabel}: {target}</span>
    </div>
  </div>
);
