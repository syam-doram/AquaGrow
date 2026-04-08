import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  isDestructive = true 
}: ConfirmModalProps) => {
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
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg",
                isDestructive ? "bg-red-500/10 text-red-500 shadow-red-500/10" : "bg-primary/10 text-primary shadow-primary/10"
              )}>
                {isDestructive ? <Trash2 size={32} /> : <AlertCircle size={32} />}
              </div>
              
              <h3 className="text-ink font-black text-xl tracking-tight mb-2 uppercase">{title}</h3>
              <p className="text-ink/40 text-[11px] font-bold uppercase tracking-widest leading-relaxed px-4">
                {message}
              </p>
            </div>
            
            <div className="grid grid-cols-2 border-t border-card-border h-16 group">
              <button 
                onClick={onClose}
                className="h-full text-[10px] font-black uppercase tracking-widest text-ink/40 hover:bg-ink/5 transition-colors border-r border-card-border"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={cn(
                  "h-full text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110",
                  isDestructive ? "bg-red-500 text-white shadow-inner" : "bg-[#C78200] text-white"
                )}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
