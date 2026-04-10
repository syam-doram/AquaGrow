import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  generateSmartAlerts,
  SmartAlert,
  NotificationPrefs,
  DEFAULT_PREFS,
  PRIORITY_CONFIG,
} from '../services/notificationEngine';

const STORAGE_KEY     = 'aquagrow_smart_alerts_v1';
const PREFS_KEY       = 'aquagrow_alert_prefs_v1';
const SUPPRESSED_KEY  = 'aquagrow_suppressed_alerts_v1';
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// ─── Helpers for persisted suppression list ──────────────────────────────────
const loadSuppressed = (): Set<string> => {
  try {
    const raw = localStorage.getItem(SUPPRESSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const saveSuppressed = (s: Set<string>) => {
  try { localStorage.setItem(SUPPRESSED_KEY, JSON.stringify([...s])); } catch {}
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export const useSmartAlerts = (params: {
  ponds: any[];
  waterRecords: any[];
  feedRecords: any[];
  marketPrices: any[];
  enabled: boolean;
}) => {
  const { ponds, waterRecords, feedRecords, marketPrices, enabled } = params;

  const [alerts, setAlerts] = useState<SmartAlert[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [prefs, setPrefs] = useState<NotificationPrefs>(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
    } catch { return DEFAULT_PREFS; }
  });

  const lastRunRef     = useRef<number>(0);
  const suppressedIds  = useRef<Set<string>>(loadSuppressed());

  // ── Save to localStorage whenever alerts change ──
  useEffect(() => {
    try {
      // Only keep last 100 alerts to avoid storage overflow
      const trimmed = alerts.slice(0, 100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch { /**/ }
  }, [alerts]);

  // ── Persist preferences ──
  const updatePrefs = useCallback((newPrefs: Partial<NotificationPrefs>) => {
    setPrefs(prev => {
      const updated = { ...prev, ...newPrefs };
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(updated)); } catch { /**/ }
      return updated;
    });
  }, []);

  // ── Fire a local OS-level notification (browser or native) ──
  const fireLocalNotification = useCallback(async (alert: SmartAlert) => {
    if (!enabled) return;
    const cfg = PRIORITY_CONFIG[alert.priority];

    // Browser Web Notifications
    if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`${alert.icon} ${alert.title}`, {
          body: alert.body,
          icon: '/logo192.png',
          tag: alert.id,
          requireInteraction: alert.priority === 'critical',
          silent: alert.priority === 'info',
        });
      } catch {/**/ }
      return;
    }

    // Native Capacitor Notifications (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
        await LocalNotifications.schedule({
          notifications: [{
            id: Math.abs(alert.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)),
            title: `${alert.icon} ${alert.title}`,
            body: alert.body,
            schedule: { at: new Date(Date.now() + 500) },
            sound: alert.priority === 'critical' ? 'alarm' : 'default',
            channelId: 'aquagrow-premium',
            extra: { route: alert.actionRoute, category: alert.category },
          }]
        });
      } catch (e) {
        console.warn('[SmartAlerts] Native notify failed:', e);
      }
    }
  }, [enabled]);

  // ── Core run engine ──
  const runEngine = useCallback(async () => {
    if (!enabled || ponds.length === 0) return;

    const now = Date.now();
    // Throttle: don't run more than once every 14 minutes
    if (now - lastRunRef.current < CHECK_INTERVAL_MS - 60000) return;
    lastRunRef.current = now;

    const generated = generateSmartAlerts({
      ponds,
      waterRecords,
      feedRecords,
      marketPrices,
      prefs,
    });

    // Filter out suppressed alerts and already-shown alerts from today
    const todayKey = new Date().toDateString();
    const newAlerts: SmartAlert[] = [];

    for (const alert of generated) {
      // Check if a similar alert (same title) was already shown today
      const alreadyShown = alerts.some(
        a => a.title === alert.title &&
        new Date(a.timestamp).toDateString() === todayKey
      );
      // Also skip if user has dismissed an alert with this title today
      if (alreadyShown) continue;
      if (suppressedIds.current.has(alert.title)) continue;

      newAlerts.push(alert);

      // Fire OS-level push for high+ priority alerts
      if (['critical', 'high'].includes(alert.priority)) {
        await fireLocalNotification(alert);
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 100));
    }
  }, [enabled, ponds, waterRecords, feedRecords, marketPrices, prefs, alerts, fireLocalNotification]);

  // ── Auto-run on interval ──
  useEffect(() => {
    if (!enabled) return;
    // Immediate run
    const timeout = setTimeout(runEngine, 2000);
    // Periodic check
    const interval = setInterval(runEngine, CHECK_INTERVAL_MS);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [enabled, runEngine]);

  // ── Actions ──
  const markRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const alert = prev.find(a => a.id === id);
      if (alert) {
        suppressedIds.current.add(alert.title);
        saveSuppressed(suppressedIds.current);
      }
      const updated = prev.filter(a => a.id !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
    suppressedIds.current.clear();
    saveSuppressed(suppressedIds.current);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const forceRun = useCallback(() => {
    lastRunRef.current = 0;
    runEngine();
  }, [runEngine]);

  // ── Derived counts ──
  const unreadCount   = alerts.filter(a => !a.isRead).length;
  const criticalCount = alerts.filter(a => a.priority === 'critical' && !a.isRead).length;
  const alertsByCategory = alerts.reduce((acc, a) => {
      if (!acc[a.category]) acc[a.category] = [];
      acc[a.category]!.push(a);
      return acc;
    }, {} as Record<string, SmartAlert[]>);

  return {
    alerts,
    prefs,
    updatePrefs,
    unreadCount,
    criticalCount,
    alertsByCategory,
    markRead,
    markAllRead,
    dismissAlert,
    clearAll,
    forceRun,
  };
};
