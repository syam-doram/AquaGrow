import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Plus, Minus, CheckCircle2, X, MapPin, ChevronRight, Zap } from 'lucide-react';
import { cn } from '../utils/cn';
import { useData } from '../context/DataContext';
import { Pond } from '../types';

// ─── POSITION OPTIONS ────────────────────────────────────────────────────────
const POSITION_OPTIONS = ['North', 'South', 'East', 'West', 'Center', 'NE Corner', 'NW Corner', 'SE Corner', 'SW Corner', 'Middle Row'];

const HP_OPTIONS = [0.5, 1, 1.5, 2, 3, 5];

// ─── STAGE LABEL ─────────────────────────────────────────────────────────────
export function getAeratorStageLabel(doc: number): string {
  if (doc <= 20)  return 'Stage 1 — Nursery (DOC 1–20)';
  if (doc <= 40)  return 'Stage 2 — Early Growth (DOC 21–40)';
  if (doc <= 60)  return 'Stage 3 — Mid Growth (DOC 41–60)';
  if (doc <= 80)  return 'Stage 4 — Pre-Harvest (DOC 61–80)';
  return 'Stage 5 — Harvest Prep (DOC 80+)';
}

// ─── RECOMMENDED COUNT ───────────────────────────────────────────────────────
export function getRecommendedAerators(pondSizeAcres: number, doc: number): number {
  const base = Math.ceil(pondSizeAcres * 4); // 4 aerators/acre base
  if (doc <= 20)  return base;
  if (doc <= 40)  return Math.ceil(base * 1.25);
  if (doc <= 60)  return Math.ceil(base * 1.5);
  return Math.ceil(base * 2); // pre-harvest — maximum
}

// ─── PROPS ───────────────────────────────────────────────────────────────────
interface AeratorPopupProps {
  pond: Pond;
  doc: number;
  isDark: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// ─── POPUP COMPONENT ─────────────────────────────────────────────────────────
export const AeratorPopup = ({ pond, doc, isDark, onClose, onSaved }: AeratorPopupProps) => {
  const { updatePond } = useData();

  const existing = pond.aerators;
  const recommended = getRecommendedAerators(pond.size, doc);

  const [count, setCount]       = useState(existing?.count ?? recommended);
  const [hp, setHp]             = useState(existing?.hp ?? 1);
  const [positions, setPositions] = useState<string[]>(existing?.positions ?? []);
  const [addedNew, setAddedNew] = useState(false);
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);

  const togglePosition = (pos: string) =>
    setPositions(p => p.includes(pos) ? p.filter(x => x !== pos) : [...p, pos]);

  // Hide BottomNav while aerator sheet is open
  useEffect(() => {
    document.body.classList.add('aerator-sheet-open');
    return () => document.body.classList.remove('aerator-sheet-open');
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const newLog = { doc, date: now, count, hp, positions, addedNew, notes };
    const updatedAerators = {
      count, hp, positions, addedNew,
      lastUpdated: now,
      lastDoc: doc,
      log: [...(existing?.log ?? []), newLog],
    };
    await updatePond(pond.id, { aerators: updatedAerators });
    setSaving(false);
    setDone(true);
    setTimeout(() => { onSaved(); onClose(); }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={cn('relative w-full max-w-md rounded-t-[2.5rem] shadow-2xl overflow-hidden',
          isDark ? 'bg-[#0A1628] border-t border-white/8' : 'bg-white'
        )}
      >
        {/* Handle */}
        <div className={cn('w-10 h-1 rounded-full mx-auto mt-3 mb-1', isDark ? 'bg-white/15' : 'bg-slate-300')} />

        {/* Done state */}
        <AnimatePresence>
          {done && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center py-12 px-6 text-center"
            >
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-xl animate-bounce">
                <CheckCircle2 size={30} className="text-white" />
              </div>
              <p className={cn('text-lg font-black', isDark ? 'text-white' : 'text-slate-900')}>Aerators Saved!</p>
              <p className={cn('text-[9px] font-black uppercase tracking-widest mt-1', isDark ? 'text-white/30' : 'text-slate-400')}>
                {pond.name} · DOC {doc}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {!done && (
          <div className="px-5 pb-8 space-y-4 max-h-[82vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pt-1">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Wind size={14} className="text-blue-500" />
                  <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                    Aerator Check · DOC {doc}
                  </p>
                </div>
                <h2 className={cn('text-base font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                  {pond.name}
                </h2>
                <p className={cn('text-[8px] font-bold', isDark ? 'text-blue-400' : 'text-blue-600')}>
                  {getAeratorStageLabel(doc)}
                </p>
              </div>
              <button onClick={onClose} className={cn('w-8 h-8 rounded-full flex items-center justify-center', isDark ? 'bg-white/10 text-white/40' : 'bg-slate-100 text-slate-500')}>
                <X size={14} />
              </button>
            </div>

            {/* SOP Recommendation */}
            <div className={cn('rounded-2xl border px-4 py-3 flex items-center gap-3',
              isDark ? 'bg-blue-500/8 border-blue-500/15' : 'bg-blue-50 border-blue-200'
            )}>
              <Zap size={14} className="text-blue-500 flex-shrink-0" />
              <div>
                <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-blue-400' : 'text-blue-700')}>SOP Recommendation</p>
                <p className={cn('text-[9px] font-medium', isDark ? 'text-white/50' : 'text-slate-600')}>
                  For {pond.size} acre pond at DOC {doc}: <strong>{recommended} aerators</strong> minimum ({Math.ceil(recommended * hp)} HP total)
                </p>
              </div>
            </div>

            {/* Count stepper */}
            <div>
              <label className={cn('text-[7px] font-black uppercase tracking-widest mb-2 block px-1', isDark ? 'text-white/25' : 'text-slate-400')}>
                Number of Aerators in Pond
              </label>
              <div className={cn('flex items-center justify-between rounded-2xl border p-3', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200')}>
                <button onClick={() => setCount(c => Math.max(1, c - 1))}
                  className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all',
                    isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                  )}>
                  <Minus size={16} />
                </button>
                <div className="text-center">
                  <span className={cn('text-4xl font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>{count}</span>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest', count < recommended ? 'text-red-400' : 'text-emerald-500')}>
                    {count < recommended ? `Need ${recommended - count} more` : 'SOP Met ✓'}
                  </p>
                </div>
                <button onClick={() => setCount(c => c + 1)}
                  className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all',
                    isDark ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm'
                  )}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* HP selector */}
            <div>
              <label className={cn('text-[7px] font-black uppercase tracking-widest mb-2 block px-1', isDark ? 'text-white/25' : 'text-slate-400')}>
                HP Per Aerator
              </label>
              <div className="flex gap-2 flex-wrap">
                {HP_OPTIONS.map(h => (
                  <button key={h} onClick={() => setHp(h)}
                    className={cn('px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all',
                      hp === h
                        ? isDark ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-blue-100 border-blue-400 text-blue-700'
                        : isDark ? 'bg-white/5 border-white/8 text-white/30' : 'bg-white border-slate-200 text-slate-500'
                    )}
                  >{h} HP</button>
                ))}
              </div>
              <p className={cn('text-[8px] font-medium mt-1.5 px-1', isDark ? 'text-white/30' : 'text-slate-500')}>
                Total power: <strong>{(count * hp).toFixed(1)} HP</strong> · {(count * hp / pond.size).toFixed(1)} HP/acre
              </p>
            </div>

            {/* Positions */}
            <div>
              <label className={cn('text-[7px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1', isDark ? 'text-white/25' : 'text-slate-400')}>
                <MapPin size={9} /> Aerator Positions (select all that apply)
              </label>
              <div className="flex gap-2 flex-wrap">
                {POSITION_OPTIONS.map(pos => (
                  <button key={pos} onClick={() => togglePosition(pos)}
                    className={cn('px-2.5 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all',
                      positions.includes(pos)
                        ? isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : isDark ? 'bg-white/3 border-white/8 text-white/25' : 'bg-white border-slate-200 text-slate-400'
                    )}
                  >{pos}</button>
                ))}
              </div>
            </div>

            {/* Added new aerators? */}
            <label className={cn('flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all',
              addedNew
                ? isDark ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-300'
                : isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-200'
            )} onClick={() => setAddedNew(v => !v)}>
              <div className={cn('w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all',
                addedNew ? 'bg-amber-500 border-amber-500' : isDark ? 'border-white/20' : 'border-slate-300'
              )}>
                {addedNew && <CheckCircle2 size={11} className="text-white" />}
              </div>
              <div>
                <p className={cn('text-[9px] font-black', isDark ? 'text-white/70' : 'text-slate-800')}>New aerators added this stage?</p>
                <p className={cn('text-[7px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>Tick if you added more since last check</p>
              </div>
            </label>

            {/* Notes */}
            <div>
              <label className={cn('text-[7px] font-black uppercase tracking-widest mb-1 block px-1', isDark ? 'text-white/25' : 'text-slate-400')}>
                Notes (optional)
              </label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Replaced 2 paddle aerators, added 1 surface aerator near NE corner"
                rows={2}
                className={cn('w-full px-3 py-2.5 rounded-2xl border text-[9px] font-medium outline-none resize-none transition-all',
                  isDark ? 'bg-white/5 border-white/8 text-white placeholder:text-white/15 focus:border-blue-500/30' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-blue-300'
                )}
              />
            </div>

            {/* Save button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Wind size={14} /> Save Aerator Status</>
              }
            </motion.button>

            <p className={cn('text-center text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/10' : 'text-slate-300')}>
              Next check due at DOC {Math.ceil(doc / 20) * 20 + 20}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
