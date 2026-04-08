import React from 'react';
import { X, Waves, AlertTriangle, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { Translations } from '../translations';
import { cn } from '../utils/cn';

export const TipsModal = ({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: Translations }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#4A2C2A]/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }}
        className="relative w-full max-w-lg bg-card rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
      >
        <div className="w-16 h-1 bg-[#4A2C2A]/10 rounded-full mx-auto mb-8 sm:hidden" />
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black tracking-tighter text-ink">{t.viewTips}</h2>
          <button onClick={onClose} className="p-3 rounded-2xl bg-[#4A2C2A]/5 text-ink hover:bg-[#4A2C2A]/10 transition-all">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="p-6 rounded-[2rem] bg-[#C78200]/5 border border-[#C78200]/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#C78200] flex items-center justify-center text-white">
                <Waves size={20} />
              </div>
              <h4 className="font-black text-ink tracking-tight">{t.phLevel} Management</h4>
            </div>
            <p className="text-sm text-ink/60 leading-relaxed font-medium">
              Maintain pH between 7.5 and 8.5. If pH is too low, apply agricultural lime (CaCO3) at 100-200kg/acre. If too high, increase aeration and consider partial water exchange.
            </p>
          </div>

          <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                <AlertTriangle size={20} />
              </div>
              <h4 className="font-black text-ink tracking-tight">{t.dissolvedO2} Optimization</h4>
            </div>
            <p className="text-sm text-ink/60 leading-relaxed font-medium">
              Critical levels are below 4.0 mg/L. Increase paddlewheel aerator speed immediately. Avoid feeding during low DO periods (early morning) to reduce oxygen demand.
            </p>
          </div>

          <div className="p-6 rounded-[2rem] bg-[#4A2C2A]/5 border border-[#4A2C2A]/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#4A2C2A] flex items-center justify-center text-white">
                <Info size={20} />
              </div>
              <h4 className="font-black text-ink tracking-tight">{t.ammonia} Control</h4>
            </div>
            <p className="text-sm text-ink/60 leading-relaxed font-medium">
              High ammonia is toxic. Reduce feeding by 50% for 2 days. Apply probiotics to enhance nitrogen cycle. Ensure bottom sludge is removed during pond preparation.
            </p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-10 py-5 bg-[#C78200] text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#C78200]/20 active:scale-95 transition-all"
        >
          Got it
        </button>
      </motion.div>
    </div>
  );
};
