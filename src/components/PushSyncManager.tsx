import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useFirebaseAlerts } from '../hooks/useFirebaseAlerts';
import { useSmartAlerts } from '../hooks/useSmartAlerts';
import { API_BASE_URL } from '../config';

/**
 * PushSyncManager
 * ─────────────────────────────────────────────────────────────────────────────
 * Invisible background manager mounted once the user is logged in. Handles:
 *
 * 1. FCM token registration immediately after login (Capacitor native or web).
 * 2. Token → backend sync so the server can send FCM pushes to this device.
 * 3. Smart alert engine — evaluates pond health, DO, feed FCR, harvest DOC
 *    every 15 min and fires OS-level push notifications based on user prefs.
 * 4. Deep-link routing from Service Worker notification taps (NAVIGATE message).
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const PushSyncManager = () => {
  const navigate = useNavigate();
  const { user, apiFetch, ponds, waterRecords, feedLogs, marketPrices } = useData();
  const { requestNotificationPermission, fcmToken } = useFirebaseAlerts(user?.language || 'English');
  const bootedRef    = useRef(false);
  const tokenSentRef = useRef<string | null>(null); // track last synced token to avoid re-sends

  // ── 1. Smart Alert Engine ──────────────────────────────────────────────────
  const { forceRun, criticalCount } = useSmartAlerts({
    ponds:        ponds        ?? [],
    waterRecords: waterRecords ?? [],
    feedRecords:  feedLogs     ?? [],
    marketPrices: marketPrices ?? [],
    enabled:      !!user,
    language:     user?.language,
  });

  // Force an alert engine run once when pond data first loads
  useEffect(() => {
    if (user && ponds.length > 0 && !bootedRef.current) {
      bootedRef.current = true;
      setTimeout(forceRun, 3000); // slight delay so all context data settles
    }
  }, [user, ponds, forceRun]);

  // Log critical count for debugging
  useEffect(() => {
    if (criticalCount > 0 && user) {
      console.log(`[PushSyncManager] ${criticalCount} critical alerts detected`);
    }
  }, [criticalCount, user]);

  // ── 2. Request Permission + Register FCM Token (immediately after login) ───
  // useRef guard prevents duplicate permission requests on re-renders.
  const permRequestedRef = useRef(false);
  useEffect(() => {
    if (user && !permRequestedRef.current) {
      permRequestedRef.current = true;
      requestNotificationPermission();
    }
    // Reset on logout so next login re-registers
    if (!user) permRequestedRef.current = false;
  }, [user]);

  // ── 3. FCM Token → Backend Sync ────────────────────────────────────────────
  // Only re-sync when the token actually changes to avoid redundant API calls.
  useEffect(() => {
    const syncToken = async () => {
      if (!user || !fcmToken) return;
      if (fcmToken === tokenSentRef.current) return; // already sent this token
      console.log('[PushSyncManager] New FCM token detected — syncing with backend...');
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
        tokenSentRef.current = fcmToken;
        const uInfo = { ...user, fcmToken };
        localStorage.setItem('aqua_user', JSON.stringify(uInfo));
        console.log('[PushSyncManager] FCM token synced ✓');
      } catch (err) {
        console.warn('[PushSyncManager] Token sync failed:', err);
      }
    };
    syncToken();
  }, [fcmToken, user]);

  // ── 4. Service Worker → App deep-link bridge ───────────────────────────────
  // When farmer taps a notification while app is closed, SW opens the app and
  // sends a NAVIGATE postMessage. We listen here and route accordingly.
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE' && event.data?.url) {
        console.log('[PushSyncManager] SW deep-link navigation:', event.data.url);
        navigate(event.data.url);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
  }, [navigate]);

  return null; // invisible manager
};
