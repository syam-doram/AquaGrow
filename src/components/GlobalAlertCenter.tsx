import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { useFirebaseAlerts } from '../hooks/useFirebaseAlerts';
import { useData } from '../context/DataContext';
import { Translations } from '../translations';
import { cn } from '../utils/cn';

export const GlobalAlertCenter = ({ t }: { t: Translations }) => {
  const { user } = useData();
  const { incomingAlert, clearAlert } = useFirebaseAlerts(user?.language || 'English');

  return (
    <div className="fixed top-20 left-4 right-4 z-[100] pointer-events-none space-y-3">
      <AnimatePresence mode="popLayout">
        {incomingAlert && (
          <motion.div
            key="global-firebase-alert"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto"
          >
            <div className="bg-[#0D523C]/95 backdrop-blur-xl text-white p-5 rounded-[2rem] shadow-2xl border border-emerald-500/30 flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Bell size={20} className="text-emerald-300" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">
                    {t.autoEngineAlert || 'Automated Alert'}
                  </p>
                  <h3 className="font-black text-base tracking-tight">{incomingAlert.title}</h3>
                  <p className="text-[10px] text-white/60 mt-0.5 leading-tight">{incomingAlert.body}</p>
                </div>
              </div>
              <button 
                onClick={clearAlert} 
                className="text-white/20 hover:text-white p-1.5 rounded-xl bg-card/5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
