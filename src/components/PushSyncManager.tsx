import React, { useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useFirebaseAlerts } from '../hooks/useFirebaseAlerts';
import { useSmartAlerts } from '../hooks/useSmartAlerts';
import { API_BASE_URL } from '../config';

/**
 * PushSyncManager
 * ─────────────────────────────────────────────────────
 * Background manager that handles:
 * 1. FCM token registration + backend sync (Firebase/Capacitor)
 * 2. Smart alert engine — evaluates pond health, DO, feed FCR,
 *    weather season, harvest DOC, disease risk windows every 15 min
 *    and fires OS-level push notifications based on user's prefs.
 * ─────────────────────────────────────────────────────
 */
export const PushSyncManager = () => {
  const { user, apiFetch, ponds, waterRecords, feedLogs, marketPrices } = useData();
  const { requestNotificationPermission, fcmToken } = useFirebaseAlerts(user?.language || 'English');
  const bootedRef = useRef(false);

  // ── 1. Smart Alert Engine ──────────────────────────────────────────────────
  const { forceRun, criticalCount } = useSmartAlerts({
    ponds: ponds ?? [],
    waterRecords: waterRecords ?? [],
    feedRecords: feedLogs ?? [],
    marketPrices: marketPrices ?? [],
    enabled: !!user,
  });

  // Force an alert engine run when pond data refreshes
  useEffect(() => {
    if (user && ponds.length > 0 && !bootedRef.current) {
      bootedRef.current = true;
      // Slight delay so all data loads first
      setTimeout(forceRun, 3000);
    }
  }, [user, ponds, forceRun]);

  // Re-run every time critical count changes (new data loaded)
  useEffect(() => {
    if (criticalCount > 0 && user) {
      console.log(`[PushSyncManager] ${criticalCount} critical alerts detected`);
    }
  }, [criticalCount, user]);

  // ── 2. Initial Permission / FCM Registration ───────────────────────────────
  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  // ── 3. FCM Token → Backend Sync ────────────────────────────────────────────
  useEffect(() => {
    const syncToken = async () => {
      if (user && fcmToken && fcmToken !== user.fcmToken) {
        console.log('[PushSyncManager] Token update detected. Syncing with backend engine...');
        try {
          await apiFetch(`${API_BASE_URL}/user/${user.id || (user as any)._id}/notifications`, {
            method: 'PUT',
            body: JSON.stringify({
              fcmToken,
              notifications: user.notifications || {
                water: true, feed: true, market: false, expert: true, security: true,
              },
            }),
          });
          const uInfo = { ...user, fcmToken };
          localStorage.setItem('aqua_user', JSON.stringify(uInfo));
        } catch (err) {
          console.warn('[PushSyncManager] Token sync failed:', err);
        }
      }
    };
    syncToken();
  }, [fcmToken, user]);

  return null;
};
