import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download, Zap, Star, ArrowRight, X, Shield, RefreshCw,
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { AppUpdateInfo } from '../hooks/useAppUpdate';
import { CURRENT_APP_VERSION } from '../hooks/useAppUpdate';

interface Props {
  updateInfo: AppUpdateInfo;
  isDark: boolean;
  onDismiss: () => void;
}

export const AppUpdateModal: React.FC<Props> = ({ updateInfo, isDark, onDismiss }) => {
  const { latestVersion, minVersion, releaseNotes, updateUrl, forceUpdate } = updateInfo;

  const handleUpdate = () => {
    window.open(updateUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      >
        {/* Dismiss on backdrop tap (only if not forced) */}
        {!forceUpdate && (
          <div className="absolute inset-0" onClick={onDismiss} />
        )}

        <motion.div
          initial={{ y: '100%', scale: 0.97 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: '100%', scale: 0.97 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className={cn(
            'relative w-full max-w-[420px] rounded-t-[2.5rem] overflow-hidden',
            isDark ? 'bg-[#0D1812]' : 'bg-white'
          )}
        >
          {/* ── Hero banner ─── */}
          <div
            className="relative overflow-hidden px-6 pt-8 pb-6 text-white"
            style={{
              background: forceUpdate
                ? 'linear-gradient(135deg, #0a0a1a 0%, #1e1065 45%, #4f1fa3 80%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #011c15 0%, #023d2b 35%, #047857 70%, #10b981 100%)',
            }}
          >
            {/* Dot mesh */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }}
            />
            {/* Glow blobs */}
            <div className={cn(
              'absolute -top-8 -right-8 w-32 h-32 rounded-full blur-[50px]',
              forceUpdate ? 'bg-violet-500/40' : 'bg-emerald-400/30'
            )} />
            <div className={cn(
              'absolute -bottom-4 -left-4 w-24 h-24 rounded-full blur-[40px]',
              forceUpdate ? 'bg-indigo-500/30' : 'bg-teal-400/20'
            )} />

            {/* Dismiss X (soft update only) */}
            {!forceUpdate && (
              <button
                onClick={onDismiss}
                className="absolute top-4 right-4 w-9 h-9 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-all"
              >
                <X size={15} />
              </button>
            )}

            {/* Icon */}
            <div className="relative z-10">
              <div className={cn(
                'w-16 h-16 rounded-[1.8rem] flex items-center justify-center mb-4 border',
                forceUpdate
                  ? 'bg-violet-500/20 border-violet-400/30'
                  : 'bg-white/15 border-white/20'
              )}>
                {forceUpdate ? (
                  <Shield size={30} className="text-violet-200" />
                ) : (
                  <RefreshCw size={28} className="text-emerald-200" />
                )}
              </div>

              <p className="text-[8px] font-black uppercase tracking-[0.35em] text-white/40 mb-1">
                {forceUpdate ? '⚠ Required Update' : '🚀 New Version Available'}
              </p>
              <h2 className="text-2xl font-black tracking-tighter text-white mb-1">
                AquaGrow {latestVersion}
              </h2>
              <p className="text-white/50 text-[9px] font-bold">
                {forceUpdate
                  ? `Your version ${CURRENT_APP_VERSION} is no longer supported. Please update to continue.`
                  : `You're on v${CURRENT_APP_VERSION} — Update for new features & fixes`
                }
              </p>
            </div>
          </div>

          {/* ── Body ─── */}
          <div className="px-6 pt-5 pb-8 space-y-4">

            {/* Version chips */}
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex-1 rounded-2xl p-3 text-center border',
                isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-100'
              )}>
                <p className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>Current</p>
                <p className={cn('font-black text-sm tracking-tighter', isDark ? 'text-white/60' : 'text-slate-500')}>v{CURRENT_APP_VERSION}</p>
              </div>
              <ArrowRight size={16} className={isDark ? 'text-white/20' : 'text-slate-300'} />
              <div className={cn(
                'flex-1 rounded-2xl p-3 text-center border',
                forceUpdate
                  ? isDark ? 'bg-violet-500/15 border-violet-500/30' : 'bg-violet-50 border-violet-200'
                  : isDark ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              )}>
                <p className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5', forceUpdate ? 'text-violet-400' : 'text-emerald-500')}>Latest</p>
                <p className={cn('font-black text-sm tracking-tighter', forceUpdate ? isDark ? 'text-violet-300' : 'text-violet-700' : isDark ? 'text-emerald-300' : 'text-emerald-700')}>
                  v{latestVersion}
                </p>
              </div>
            </div>

            {/* What's new */}
            {releaseNotes?.length > 0 && (
              <div className={cn(
                'rounded-[1.8rem] p-4 border',
                isDark ? 'bg-white/[0.03] border-white/8' : 'bg-slate-50 border-slate-100'
              )}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3', isDark ? 'text-white/30' : 'text-slate-400')}>
                  ✨ What's New
                </p>
                <div className="space-y-2">
                  {releaseNotes.map((note, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className={cn(
                        'w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                        forceUpdate
                          ? isDark ? 'bg-violet-500/20' : 'bg-violet-100'
                          : isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                      )}>
                        {i === 0 ? (
                          <Zap size={10} className={forceUpdate ? 'text-violet-400' : 'text-emerald-500'} />
                        ) : (
                          <Star size={10} className={forceUpdate ? 'text-violet-400' : 'text-emerald-500'} />
                        )}
                      </div>
                      <p className={cn('text-[10px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Force update notice */}
            {forceUpdate && (
              <div className={cn(
                'rounded-2xl px-4 py-3 flex items-start gap-2.5 border',
                isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
              )}>
                <Shield size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-red-300/80' : 'text-red-700')}>
                  Your current version <strong>v{CURRENT_APP_VERSION}</strong> is below the minimum required <strong>v{minVersion}</strong>. The app cannot be used until you update.
                </p>
              </div>
            )}

            {/* CTA buttons */}
            <div className="space-y-2.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleUpdate}
                className={cn(
                  'w-full py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.15em] text-white flex items-center justify-center gap-2.5 shadow-xl transition-all',
                  forceUpdate
                    ? 'bg-gradient-to-r from-violet-600 to-purple-700 shadow-violet-900/30'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-emerald-900/20'
                )}
              >
                <Download size={16} />
                Update Now on Play Store
              </motion.button>

              {!forceUpdate && (
                <button
                  onClick={onDismiss}
                  className={cn(
                    'w-full py-3.5 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest border transition-all',
                    isDark ? 'border-white/8 text-white/30 hover:text-white/50' : 'border-slate-200 text-slate-400 hover:text-slate-600'
                  )}
                >
                  Remind Me Later
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
