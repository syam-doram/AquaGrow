/**
 * AeratorMapping.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Dedicated screen showing the complete aerator-to-Smart-Box mapping for a pond.
 *
 *   Aerator 1  → SB001 (Starter Group 1)  🟢 Online
 *   Aerator 2  → SB001 (Starter Group 1)  🟢 Online
 *   ...
 *   Aerator 5  → SB002 (Starter Group 2)  ⚫ Offline
 *   ...
 *   Aerator 9  → SB003 (Starter Group 3)  🟢 Online  (Unassigned)
 *   ...
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronLeft, Wind, CircuitBoard, AlertTriangle, RefreshCw, Zap,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import { espnowService } from '../../services/espnowService';
import { calcStarterGroups, type StarterGroup } from '../../utils/starterGroupUtils';

export const AeratorMapping = () => {
  const navigate = useNavigate();
  const { pondId } = useParams<{ pondId: string }>();
  const { ponds, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [devices, setDevices]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  const pond = ponds.find(p => (p.id || (p as any)._id) === pondId);
  const totalAerators: number   = pond?.aerators?.count ?? 0;
  const aeratorHp: number       = pond?.aerators?.hp ?? 0;

  const starterGroups: StarterGroup[] = (() => {
    const saved = pond?.aerators?.starterGroups;
    if (saved && (saved as any[]).length > 0) return saved as StarterGroup[];
    return calcStarterGroups(totalAerators);
  })();

  useEffect(() => {
    if (!pondId) return;
    setLoading(true);
    espnowService.getDevices(pondId)
      .then(devs => setDevices(devs.filter((d: any) => d.role === 'slave' && d.deviceType === 'AERATOR')))
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  }, [pondId]);

  // For each aerator number → find its Smart Box
  const getSmartBoxForAerator = (aeratorName: string) => {
    return devices.find(d =>
      (d.aeratorLabels ?? []).includes(aeratorName)
    ) ?? null;
  };

  const getGroupForAerator = (g: StarterGroup, aerName: string) =>
    g.aeratorNames.includes(aerName) ? g : null;

  const onlineCount   = devices.filter(d => d.online).length;
  const assignedCount = devices.length;

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      {/* Header */}
      <header className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 border-b',
        isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100 shadow-sm'
      )}>
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border', isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-600 shadow-sm')}
          >
            <ChevronLeft size={18} />
          </motion.button>
          <div className="text-center">
            <h1 className={cn('text-xs font-black tracking-tight uppercase', isDark ? 'text-white' : 'text-slate-900')}>
              Aerator Mapping
            </h1>
            <p className={cn('text-[8px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>
              {pond?.name ?? 'Pond'}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setLoading(true);
              espnowService.getDevices(pondId!)
                .then(devs => setDevices(devs.filter((d: any) => d.role === 'slave' && d.deviceType === 'AERATOR')))
                .catch(() => setDevices([]))
                .finally(() => setLoading(false));
            }}
            className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border', isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-400 shadow-sm')}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </header>

      <main className="max-w-md mx-auto pt-24 pb-32 px-4 space-y-4">

        {/* Pond summary card */}
        {pond && (
          <div className={cn('rounded-2xl border p-4', isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐟</span>
                <div>
                  <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{pond.name}</p>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                    Aerator Mapping Overview
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Aerators', value: totalAerators, icon: Wind, color: 'text-violet-400' },
                { label: 'Groups', value: starterGroups.length, icon: Zap, color: isDark ? 'text-white/50' : 'text-slate-700' },
                { label: 'Assigned', value: assignedCount, icon: CircuitBoard, color: 'text-violet-400' },
                { label: 'Online', value: onlineCount, icon: CircuitBoard, color: onlineCount === assignedCount && assignedCount > 0 ? 'text-emerald-400' : 'text-amber-400' },
              ].map(s => (
                <div key={s.label} className={cn('rounded-xl p-2 text-center', isDark ? 'bg-white/3' : 'bg-slate-50 border border-slate-100')}>
                  <p className={cn('text-[13px] font-black tracking-tight', s.color)}>{s.value}</p>
                  <p className={cn('text-[5.5px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2">
            <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
            <p className={cn('text-[9px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>Loading assignments…</p>
          </div>
        )}

        {/* No pond */}
        {!pond && !loading && (
          <div className={cn('rounded-2xl border p-6 text-center', isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-100')}>
            <AlertTriangle size={28} className="mx-auto mb-3 text-amber-500" />
            <p className={cn('text-[10px] font-black', isDark ? 'text-white/50' : 'text-slate-600')}>Pond not found</p>
          </div>
        )}

        {/* Mapping list */}
        {!loading && pond && starterGroups.length > 0 && (
          <div className="space-y-4">
            {starterGroups.map(g => {
              const smartBox = devices.find(d => {
                if (d.starterGroup === g.groupNumber) return true;
                return (d.aeratorLabels ?? []).some((l: string) => g.aeratorNames.includes(l));
              });

              return (
                <motion.div
                  key={g.groupNumber}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: g.groupNumber * 0.06 }}
                  className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/4 border-white/10' : 'bg-white border-slate-100 shadow-sm')}
                >
                  {/* Group header */}
                  <div className={cn('px-4 py-3 flex items-center justify-between border-b', isDark ? 'bg-violet-500/5 border-violet-500/15' : 'bg-violet-50 border-violet-100')}>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center text-[8px] font-black', isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-700')}>
                        {g.groupNumber}
                      </div>
                      <div>
                        <p className={cn('text-[9px] font-black', isDark ? 'text-violet-300' : 'text-violet-700')}>
                          Starter Group {g.groupNumber}
                        </p>
                        <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>
                          Aerator{g.aeratorStart !== g.aeratorEnd ? `s ${g.aeratorStart}–${g.aeratorEnd}` : ` ${g.aeratorStart}`} · {g.aeratorCount} unit{g.aeratorCount !== 1 ? 's' : ''}
                          {aeratorHp > 0 ? ` · ${aeratorHp} HP each` : ''}
                        </p>
                      </div>
                    </div>
                    {/* Smart Box badge */}
                    <div className={cn('rounded-xl px-2.5 py-1.5 border text-center', smartBox
                      ? smartBox.online
                        ? isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                        : isDark ? 'bg-red-500/8 border-red-500/15' : 'bg-red-50 border-red-100'
                      : isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100'
                    )}>
                      {smartBox ? (
                        <>
                          <p className={cn('text-[7.5px] font-black', smartBox.online ? 'text-emerald-400' : 'text-red-400')}>
                            {espnowService.getDeviceLabel(smartBox)}
                          </p>
                          <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                            {smartBox.boxId} · {smartBox.online ? '🟢 Online' : '🔴 Offline'}
                          </p>
                        </>
                      ) : (
                        <p className={cn('text-[7px] font-black uppercase', isDark ? 'text-white/20' : 'text-slate-400')}>
                          No Smart Box
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Aerator rows */}
                  <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                    {g.aeratorNames.map((aerName, ai) => {
                      const isRunning = smartBox?.relayOn === true;
                      const isOnline  = smartBox?.online === true;
                      const aerNum    = g.aeratorStart + ai;
                      return (
                        <div key={aerName} className={cn('px-4 py-3 flex items-center gap-3', isDark ? 'bg-white/1' : 'bg-white')}>
                          {/* Aerator number */}
                          <span className={cn(
                            'w-7 h-7 rounded-xl flex items-center justify-center text-[8px] font-black flex-shrink-0',
                            isRunning && isOnline ? 'bg-emerald-500 text-white'
                            : isOnline ? isDark ? 'bg-white/8 text-white/40' : 'bg-slate-100 text-slate-500'
                            : isDark ? 'bg-white/5 text-white/20' : 'bg-slate-100 text-slate-300'
                          )}>
                            {aerNum}
                          </span>

                          {/* Aerator info */}
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[9px] font-black', isDark ? 'text-white/80' : 'text-slate-800')}>
                              💨 {aerName}
                            </p>
                            <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>
                              Starter Group {g.groupNumber} · Slot {ai + 1}
                              {aeratorHp > 0 ? ` · ${aeratorHp} HP` : ''}
                            </p>
                          </div>

                          {/* Arrow */}
                          <div className={cn('text-[10px] font-black', isDark ? 'text-white/15' : 'text-slate-300')}>→</div>

                          {/* Smart Box badge */}
                          <div className="text-right">
                            {smartBox ? (
                              <>
                                <p className={cn('text-[8px] font-black', isRunning && isOnline ? 'text-emerald-400' : isOnline ? isDark ? 'text-white/50' : 'text-slate-600' : 'text-red-400')}>
                                  {smartBox.boxId}
                                </p>
                                <p className={cn('text-[6.5px] font-black uppercase tracking-widest',
                                  isRunning && isOnline ? 'text-emerald-400'
                                  : isOnline ? isDark ? 'text-white/25' : 'text-slate-400'
                                  : 'text-red-400'
                                )}>
                                  {!isOnline ? 'Offline' : isRunning ? 'Running' : 'Stopped'}
                                </p>
                              </>
                            ) : (
                              <p className={cn('text-[8px] font-black', isDark ? 'text-white/20' : 'text-slate-300')}>Unassigned</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* No aerators in pond */}
        {!loading && pond && starterGroups.length === 0 && (
          <div className={cn('rounded-2xl border p-6 text-center', isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-100')}>
            <Wind size={32} className={cn('mx-auto mb-3', isDark ? 'text-white/15' : 'text-slate-200')} />
            <p className={cn('text-[10px] font-black mb-1', isDark ? 'text-white/40' : 'text-slate-600')}>No aerators recorded</p>
            <p className={cn('text-[8px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>
              Go to Pond Details → Aerator Management to set up aerator count. Starter Groups will auto-calculate.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
