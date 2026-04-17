import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Plus, ChevronDown, CheckCircle2, AlertTriangle, Zap, MapPin, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useData } from '../../context/DataContext';
import { Pond } from '../../types';
import { AeratorPopup, getAeratorStageLabel, getRecommendedAerators } from '../../components/AeratorPopup';
import { calculateDOC } from '../../utils/pondUtils';

interface AeratorManagementProps {
  pond: Pond;
  isDark: boolean;
  readOnly?: boolean;
}

export const AeratorManagement = ({ pond, isDark, readOnly = false }: AeratorManagementProps) => {
  const { updatePond } = useData();
  const [showPopup, setShowPopup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const doc = calculateDOC(pond.stockingDate);
  const aerators = pond.aerators;
  const recommended = getRecommendedAerators(pond.size, doc);
  const isMet = (aerators?.count ?? 0) >= recommended;
  const totalHp = aerators ? aerators.count * aerators.hp : 0;
  const hpPerAcre = pond.size > 0 ? (totalHp / pond.size).toFixed(1) : '0';

  return (
    <div className="space-y-3 pb-4">

      {/* Header banner */}
      <div className={cn('rounded-[2rem] border p-5 relative overflow-hidden',
        isDark ? 'bg-[#0A1628] border-white/5' : 'bg-white border-slate-100 shadow-sm'
      )}>
        <div className="absolute -right-4 -bottom-4 opacity-5">
          <Wind size={100} strokeWidth={0.5} />
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/25' : 'text-slate-400')}>
                Aerator Management · DOC {doc}
              </p>
              <h3 className={cn('text-base font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                {aerators ? `${aerators.count} Aerators Active` : 'No Record Yet'}
              </h3>
              <p className={cn('text-[9px] font-medium', isDark ? 'text-blue-400' : 'text-blue-600')}>
                {getAeratorStageLabel(doc)}
              </p>
            </div>
            {!readOnly && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPopup(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest shadow-md"
              >
                <Plus size={11} /> Update
              </motion.button>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Count',
                value: aerators ? `${aerators.count}` : '--',
                sub: `Rec. ${recommended}`,
                color: isMet ? 'text-emerald-500' : 'text-red-400',
                icon: Wind,
              },
              {
                label: 'HP / Aerator',
                value: aerators ? `${aerators.hp} HP` : '--',
                sub: `${aerators ? aerators.count : 0} × ${aerators?.hp ?? 1} HP`,
                color: 'text-blue-500',
                icon: Zap,
              },
              {
                label: 'Total Power',
                value: aerators ? `${totalHp.toFixed(1)} HP` : '--',
                sub: `${hpPerAcre} HP/acre`,
                color: isDark ? 'text-white/60' : 'text-slate-700',
                icon: Clock,
              },
            ].map((s, i) => (
              <div key={i} className={cn('rounded-2xl border p-3 text-center',
                isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100'
              )}>
                <s.icon size={12} className={cn('mx-auto mb-1', s.color)} />
                <p className={cn('text-[13px] font-black tracking-tight', s.color)}>{s.value}</p>
                <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{s.label}</p>
                <p className={cn('text-[7px] font-medium mt-0.5', isDark ? 'text-white/30' : 'text-slate-500')}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Equation summary: N × HP = Total */}
          {aerators && (
            <div className={cn('flex items-center justify-center gap-1.5 py-2 rounded-2xl border font-black text-[10px]',
              isDark ? 'bg-white/3 border-white/5 text-white/50' : 'bg-slate-50 border-slate-100 text-slate-600'
            )}>
              <Wind size={11} className="text-blue-400" />
              <span>{aerators.count} aerators</span>
              <span className={isDark ? 'text-white/20' : 'text-slate-300'}>×</span>
              <span>{aerators.hp} HP</span>
              <span className={isDark ? 'text-white/20' : 'text-slate-300'}>=</span>
              <span className="text-blue-500">{totalHp.toFixed(1)} HP</span>
              <span className={isDark ? 'text-white/20' : 'text-slate-300'}>·</span>
              <span className={isDark ? 'text-white/40' : 'text-slate-500'}>{hpPerAcre} HP/acre</span>
            </div>
          )}



          {/* Warning if below recommendation */}
          {aerators && !isMet && (
            <div className={cn('flex items-center gap-2 mt-3 px-3 py-2 rounded-xl border',
              isDark ? 'bg-red-500/8 border-red-500/20' : 'bg-red-50 border-red-200'
            )}>
              <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
              <p className={cn('text-[8px] font-black', isDark ? 'text-red-400' : 'text-red-700')}>
                {recommended - aerators.count} more aerators needed for SOP compliance at {pond.size} acres.
              </p>
            </div>
          )}

          {aerators && isMet && (
            <div className={cn('flex items-center gap-2 mt-3 px-3 py-2 rounded-xl border',
              isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
            )}>
              <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
              <p className={cn('text-[8px] font-black', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                Aeration SOP met · {aerators.count}/{recommended} aerators deployed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Positions */}
      {aerators && aerators.positions.length > 0 && (
        <div className={cn('rounded-2xl border p-4', isDark ? 'bg-[#0A1628] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5', isDark ? 'text-white/20' : 'text-slate-400')}>
            <MapPin size={9} /> Current Positions
          </p>
          <div className="flex gap-2 flex-wrap">
            {aerators.positions.map(pos => (
              <span key={pos} className={cn('px-2.5 py-1 rounded-xl border text-[8px] font-black uppercase tracking-widest',
                isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'
              )}>{pos}</span>
            ))}
          </div>
          {aerators.addedNew && (
            <p className={cn('text-[8px] font-black mt-2', isDark ? 'text-amber-400' : 'text-amber-700')}>
              ✦ New aerators were added this stage
            </p>
          )}
        </div>
      )}

      {/* History */}
      {aerators && aerators.log.length > 0 && (
        <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-[#0A1628] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
          <button
            onClick={() => setShowHistory(h => !h)}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
              Stage History ({aerators.log.length} checks)
            </p>
            <motion.div animate={{ rotate: showHistory ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} className={isDark ? 'text-white/20' : 'text-slate-400'} />
            </motion.div>
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  {[...aerators.log].reverse().map((entry, i) => (
                    <div key={i} className={cn('rounded-xl border p-3',
                      isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100'
                    )}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className={cn('text-[9px] font-black', isDark ? 'text-white/70' : 'text-slate-900')}>
                          DOC {entry.doc} · {entry.count} aerators · {entry.count * entry.hp} HP
                        </p>
                        <p className={cn('text-[7px] font-black', isDark ? 'text-white/20' : 'text-slate-400')}>
                          {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {entry.positions.map(p => (
                          <span key={p} className={cn('px-1.5 py-0.5 rounded-lg text-[7px] font-black',
                            isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                          )}>{p}</span>
                        ))}
                      </div>
                      {entry.addedNew && <p className="text-[7px] font-black text-amber-500 mt-1">+ New aerators added</p>}
                      {entry.notes && <p className={cn('text-[7px] mt-1 italic', isDark ? 'text-white/30' : 'text-slate-500')}>{entry.notes}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!aerators && (
        <div className={cn('rounded-2xl border p-6 text-center', isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100')}>
          <Wind size={28} className={cn('mx-auto mb-3', isDark ? 'text-white/15' : 'text-slate-300')} />
          <p className={cn('text-[10px] font-black', isDark ? 'text-white/30' : 'text-slate-500')}>No aerator data recorded yet</p>
          <p className={cn('text-[8px] font-medium mt-1', isDark ? 'text-white/20' : 'text-slate-400')}>
            Record your current aerator setup to track compliance across stages.
          </p>
          {!readOnly && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowPopup(true)}
              className="mt-4 flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest shadow-md"
            >
              <Plus size={11} /> Add First Record
            </motion.button>
          )}
        </div>
      )}

      {/* Popup */}
      <AnimatePresence>
        {showPopup && (
          <AeratorPopup
            pond={pond}
            doc={doc}
            isDark={isDark}
            onClose={() => setShowPopup(false)}
            onSaved={() => setShowPopup(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
