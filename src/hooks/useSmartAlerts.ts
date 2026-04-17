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

// ─── Get current logged-in user ID ───────────────────────────────────────────
const getCurrentUserId = (): string => {
  try {
    const u = localStorage.getItem('aqua_user');
    if (u) {
      const parsed = JSON.parse(u);
      const id = parsed?.id || parsed?._id || '';
      if (id) return id;
    }
  } catch { /* */ }
  return 'anonymous';
};

// User-scoped key builders — ensures no cross-farmer data leakage
const storageKey    = (uid: string) => `aquagrow_smart_alerts_v1_${uid}`;
const prefsKey      = (uid: string) => `aquagrow_alert_prefs_v1_${uid}`;
const suppressedKey = (uid: string) => `aquagrow_suppressed_alerts_v1_${uid}`;

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// ─── Helpers for persisted suppression list ──────────────────────────────────
const loadSuppressed = (uid: string): Set<string> => {
  try {
    const raw = localStorage.getItem(suppressedKey(uid));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const saveSuppressed = (s: Set<string>, uid: string) => {
  try { localStorage.setItem(suppressedKey(uid), JSON.stringify([...s])); } catch {}
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export const useSmartAlerts = (params: {
  ponds: any[];
  waterRecords: any[];
  feedRecords: any[];
  marketPrices: any[];
  enabled: boolean;
  language?: string;
}) => {
  const { ponds, waterRecords, feedRecords, marketPrices, enabled, language } = params;

  // Resolve user ID once (stable for the lifetime of the hook session)
  const uid = getCurrentUserId();

  const [alerts, setAlerts] = useState<SmartAlert[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey(uid));
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [prefs, setPrefs] = useState<NotificationPrefs>(() => {
    try {
      const saved = localStorage.getItem(prefsKey(uid));
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
    } catch { return DEFAULT_PREFS; }
  });

  const lastRunRef    = useRef<number>(0);
  const suppressedIds = useRef<Set<string>>(loadSuppressed(uid));
  const alertsRef      = useRef<SmartAlert[]>(alerts);
  const sessionFiredRef = useRef<Set<string>>(new Set());

  // Keep alertsRef in sync with state
  useEffect(() => { alertsRef.current = alerts; }, [alerts]);

  // ── Save to localStorage whenever alerts change (user-scoped) ──
  useEffect(() => {
    try {
      const trimmed = alerts.slice(0, 100);
      localStorage.setItem(storageKey(uid), JSON.stringify(trimmed));
    } catch { /**/ }
  }, [alerts, uid]);

  // ── Persist preferences (user-scoped) ──
  const updatePrefs = useCallback((newPrefs: Partial<NotificationPrefs>) => {
    setPrefs(prev => {
      const updated = { ...prev, ...newPrefs };
      try { localStorage.setItem(prefsKey(uid), JSON.stringify(updated)); } catch { /**/ }
      return updated;
    });
  }, [uid]);

  // ── Fire a local OS-level notification (browser or native) ──
  const fireLocalNotification = useCallback(async (alert: SmartAlert) => {
    if (!enabled) return;

    // Priority → channel + accent color mapping
    const CHANNEL_MAP: Record<string, { channelId: string; accentColor: string; importance: string }> = {
      critical: { channelId: 'aquagrow-critical',  accentColor: '#FF3B30', importance: 'high' },
      high:     { channelId: 'aquagrow-high',       accentColor: '#FF9500', importance: 'high' },
      medium:   { channelId: 'aquagrow-medium',     accentColor: '#C78200', importance: 'default' },
      info:     { channelId: 'aquagrow-info',       accentColor: '#10b981', importance: 'low' },
    };
    const ch = CHANNEL_MAP[alert.priority] ?? CHANNEL_MAP.info;

    // Stable numeric ID from alert string ID
    const numericId = Math.abs(alert.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)) % 2147483647;

    // Browser Web Notifications
    if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`${alert.icon} ${alert.title}`, {
          body: alert.body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: alert.id,
          requireInteraction: alert.priority === 'critical',
          silent: alert.priority === 'info',
        });
      } catch {/**/ }
      return;
    }

    // Native Capacitor Notifications (Android/iOS) — rich style
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }

        // Ensure notification channels exist (Android O+)
        try {
          await (LocalNotifications as any).createChannel?.({
            id: 'aquagrow-critical',
            name: '🚨 AquaGrow Critical Alerts',
            description: 'Urgent pond health & disease alerts',
            importance: 5, // IMPORTANCE_HIGH
            visibility: 1,
            sound: 'alarm.wav',
            vibration: true,
            lights: true,
            lightColor: '#FF3B30',
          });
          await (LocalNotifications as any).createChannel?.({
            id: 'aquagrow-high',
            name: '⚠️ AquaGrow High Priority',
            description: 'Feed, water quality, and SOP alerts',
            importance: 4,
            visibility: 1,
            sound: 'default',
            vibration: true,
            lights: true,
            lightColor: '#FF9500',
          });
          await (LocalNotifications as any).createChannel?.({
            id: 'aquagrow-medium',
            name: '📢 AquaGrow Reminders',
            description: 'Harvest timing, lunar phase alerts',
            importance: 3,
            visibility: 0,
            sound: 'default',
            vibration: false,
            lights: false,
          });
          await (LocalNotifications as any).createChannel?.({
            id: 'aquagrow-info',
            name: 'ℹ️ AquaGrow Tips',
            description: 'Daily SOP tips & market insights',
            importance: 2,
            visibility: -1,
            sound: undefined,
            vibration: false,
            lights: false,
          });
        } catch { /* channel creation fails gracefully on iOS */ }

        await LocalNotifications.schedule({
          notifications: [{
            id: numericId,
            title: `${alert.icon} ${alert.title}`,
            body: alert.body,
            // Subtitle visible on iOS & Notification shade large view
            ...(alert.pondName ? { summaryText: `📍 ${alert.pondName}` } : {}),
            schedule: { at: new Date(Date.now() + 500) },
            sound: alert.priority === 'critical' ? 'alarm.wav' : 'default',
            channelId: ch.channelId,
            // Android-specific rich styling
            smallIcon: 'ic_stat_aquagrow',   // must exist in android/app/src/main/res/drawable
            iconColor: ch.accentColor,
            // Group same-category alerts together
            group: `aquagrow-${alert.category}`,
            groupSummary: false,
            ongoing: alert.priority === 'critical',   // sticky for critical
            autoCancel: alert.priority !== 'critical',
            extra: {
              route: alert.actionRoute,
              category: alert.category,
              priority: alert.priority,
              alertId: alert.id,
            },
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
      language: language as any,
    });

    // Filter out suppressed alerts and already-shown alerts from today
    const todayKey = new Date().toDateString();
    const newAlerts: SmartAlert[] = [];

    for (const alert of generated) {
      // Systemic synchronous guard to prevent race-condition duplicates if hook runs back-to-back
      if (sessionFiredRef.current.has(todayKey + alert.title)) continue;

      // Check if a similar alert (same title) was already shown today — use ref for fresh state
      const alreadyShown = alertsRef.current.some(
        a => a.title === alert.title &&
        new Date(a.timestamp).toDateString() === todayKey
      );
      // Also skip if user has dismissed an alert with this title
      if (alreadyShown) continue;
      if (suppressedIds.current.has(alert.title)) continue;

      sessionFiredRef.current.add(todayKey + alert.title);
      newAlerts.push(alert);

      // Fire OS-level push for high+ priority alerts
      if (['critical', 'high'].includes(alert.priority)) {
        await fireLocalNotification(alert);
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 100));
    }
  }, [enabled, ponds, waterRecords, feedRecords, marketPrices, prefs, fireLocalNotification, language]);

  // When language changes, clear stale cached alerts (stored with old-language titles)
  // so the engine re-generates fresh Telugu/English alerts without false "alreadyShown" matches
  useEffect(() => {
    lastRunRef.current = 0;
    setAlerts([]);
    suppressedIds.current.clear();
    sessionFiredRef.current.clear();
    try { localStorage.removeItem(storageKey(uid)); } catch {}
    try { localStorage.removeItem(suppressedKey(uid)); } catch {}
  }, [language, uid]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setAlerts(prev => {
      const alert = prev.find(a => a.id === id);
      if (alert && !suppressedIds.current.has(alert.title)) {
        suppressedIds.current.add(alert.title);
        saveSuppressed(suppressedIds.current, uid);
      }
      return prev.map(a => a.id === id ? { ...a, isRead: true } : a);
    });
  }, [uid]);

  const markAllRead = useCallback(() => {
    setAlerts(prev => {
      prev.forEach(a => {
        if (!suppressedIds.current.has(a.title)) suppressedIds.current.add(a.title);
      });
      saveSuppressed(suppressedIds.current, uid);
      return prev.map(a => ({ ...a, isRead: true }));
    });
  }, [uid]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const alert = prev.find(a => a.id === id);
      if (alert) {
        suppressedIds.current.add(alert.title);
        saveSuppressed(suppressedIds.current, uid);
      }
      const updated = prev.filter(a => a.id !== id);
      try { localStorage.setItem(storageKey(uid), JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [uid]);

  const clearAll = useCallback(() => {
    setAlerts([]);
    suppressedIds.current.clear();
    saveSuppressed(suppressedIds.current, uid);
    try { localStorage.removeItem(storageKey(uid)); } catch {}
  }, [uid]);

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
