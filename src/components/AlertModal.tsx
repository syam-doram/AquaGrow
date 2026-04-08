import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

export const AlertModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText = 'Got It'
}: AlertModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-card w-full max-w-sm rounded-[2.5rem] border border-card-border shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/10">
                <ShieldAlert size={32} />
              </div>
              
              <h3 className="text-ink font-black text-xl tracking-tight mb-2 uppercase">{title}</h3>
              <p className="text-ink/40 text-[11px] font-bold uppercase tracking-widest leading-relaxed px-4">
                {message}
              </p>
            </div>
            
            <div className="p-4 pt-0">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-[#C78200] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#C78200]/20 active:scale-95 transition-all"
              >
                {buttonText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
