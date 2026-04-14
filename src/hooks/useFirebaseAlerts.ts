import { useState, useEffect, useCallback } from 'react';
import { requestFcmToken, onMessageListener } from '../lib/firebase';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { parseAeratorNotification } from '../services/aeratorPushService';
import { parseHarvestNotification } from '../services/harvestPushService';
import { API_BASE_URL } from '../config';

// Helper: get JWT token from stored session (no localStorage for business data)
const getAuthHeaders = (): HeadersInit => {
  const raw = localStorage.getItem('aqua_tokens'); // auth tokens are OK in localStorage
  if (!raw) return { 'Content-Type': 'application/json' };
  try {
    const tokens = JSON.parse(raw);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.access || tokens.accessToken || ''}`,
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

const getUserId = (): string | null => {
  try {
    const u = localStorage.getItem('aqua_user');
    if (!u) return null;
    const parsed = JSON.parse(u);
    return parsed?.id || parsed?._id || null;
  } catch { return null; }
};

export const useFirebaseAlerts = (userLanguage: string) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [incomingAlert, setIncomingAlert] = useState<{
    title: string; body: string; timestamp: number; type?: string; color?: string;
  } | null>(null);

  // Alert history starts empty — gets populated from DB via DataContext or on-arrival
  const [alertHistory, setAlertHistory] = useState<{
    title: string; body: string; timestamp: number; type?: string; color?: string;
  }[]>([]);

  // Deep-link queued from a notification tap
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(() =>
    sessionStorage.getItem('aqua_notification_deeplink') || null
  );

  const queueDeepLink = (link: string) => {
    setDeepLinkUrl(link);
    sessionStorage.setItem('aqua_notification_deeplink', link);
  };

  // ── Persist a new notification to MongoDB ────────────────────────────────────
  const persistNotification = useCallback(async (alert: {
    title: string; body: string; type?: string; deepLink?: string;
  }) => {
    try {
      await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...alert,
          date: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.warn('[ALERTS] Failed to persist notification to DB:', err);
    }
  }, []);

  // ── Load alert history from DB on mount ──────────────────────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      const uid = getUserId();
      if (!uid) return;
      try {
        const res = await fetch(`${API_BASE_URL}/user/${uid}/notifications`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setAlertHistory(data.map((n: any) => ({
            title: n.title || '',
            body: n.body || '',
            timestamp: new Date(n.createdAt || n.date || Date.now()).getTime(),
            type: n.type || 'general',
            color: n.type === 'harvest' ? '#10B981' : n.type === 'aerator' ? '#3B82F6' : '#6366F1',
          })));
        }
      } catch (err) {
        console.warn('[ALERTS] Could not load notification history from DB:', err);
      }
    };
    loadHistory();
  }, []);

  const requestNotificationPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await PushNotifications.createChannel({
          id: 'aquagrow-premium',
          name: 'AquaGrow Farming Alerts',
          description: 'Critical notifications for pond conditions',
          importance: 5, visibility: 1, vibration: true,
        });
        await PushNotifications.createChannel({
          id: 'aquagrow-aerator',
          name: 'AquaGrow Aerator Checks',
          description: 'Stage-wise aerator management reminders',
          importance: 4, visibility: 1, vibration: true,
        });
        await PushNotifications.createChannel({
          id: 'aquagrow-harvest',
          name: 'AquaGrow Harvest & Payments',
          description: 'Live harvest tracking and payment notifications',
          importance: 5, visibility: 1, vibration: true,
        });

        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') {
          await PushNotifications.register();
          return 'PENDING_NATIVE_AUTO_REGISTER';
        }
        console.warn('Native notification permission denied.');
      } catch (err) {
        console.error('Error in Native Push Permission:', err);
      }
      return null;
    }

    // Web / PWA
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await requestFcmToken(
            'BEBZl6-WrZ0gOSVSZLeWNUhgMeejDpVqAF-WUgxomclCoSPe9ZrpLYyGHPdGrI2BkqzjA_Iev-JZD5yDGWAZynM'
          );
          if (token) {
            setFcmToken(token);
            return token;
          }
        }
      } catch (err) {
        console.error('Error in Web Push Permission:', err);
      }
    }
    return null;
  };

  // ── Parse deep-link from notification data ───────────────────────────────────
  const handleNotificationData = (data: Record<string, any>): string | null => {
    const harvestData = parseHarvestNotification(data);
    if (harvestData) return harvestData.deepLink;
    const aeratorData = parseAeratorNotification(data);
    if (aeratorData) return aeratorData.deepLink;
    return data?.deepLink || null;
  };

  // ── Incoming push handlers ───────────────────────────────────────────────────
  const addAlert = useCallback((rawData: {
    title: string; body: string; type?: string; color?: string; deepLink?: string;
  }) => {
    const newAlert = {
      title: rawData.title,
      body: rawData.body,
      timestamp: Date.now(),
      type: rawData.type || 'general',
      color: rawData.color || '#6366F1',
    };
    setIncomingAlert(newAlert);
    setAlertHistory(prev => [newAlert, ...prev].slice(0, 50));

    // Persist to DB (fire-and-forget)
    persistNotification({ title: rawData.title, body: rawData.body, type: rawData.type, deepLink: rawData.deepLink });
  }, [persistNotification]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      PushNotifications.addListener('registration', (token) => {
        console.log(`[FCM-NATIVE] Token: ${token.value}`);
        setFcmToken(token.value);
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('FCM Registration error:', err.error);
      });

      // Foreground: show OS-level notification + save to DB
      // NOTE: On Android, FCM suppresses the system notification when the app
      // is in the foreground. We manually schedule a LocalNotification so the
      // farmer sees it in the notification shade regardless of which screen they're on.
      PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        const data = notification.data || {};
        const meta = data.type === 'harvest_update'
          ? { type: 'harvest', color: '#10B981', channelId: 'aquagrow-harvest' }
          : data.type === 'aerator_check'
          ? { type: 'aerator', color: '#3B82F6', channelId: 'aquagrow-aerator' }
          : { type: 'general', color: '#6366F1', channelId: 'aquagrow-premium' };

        // Show real OS notification even while app is open
        try {
          await LocalNotifications.schedule({
            notifications: [{
              id: Date.now() & 0x7fffffff, // must be positive int32
              title: notification.title || 'AquaGrow Alert',
              body: notification.body || '',
              channelId: meta.channelId,
              extra: data,
              smallIcon: 'ic_launcher',
              iconColor: meta.color,
            }],
          });
        } catch (e) {
          console.warn('[FCM] LocalNotifications.schedule failed:', e);
        }

        addAlert({
          title: notification.title || 'New Alert',
          body: notification.body || '',
          type: meta.type,
          color: meta.color,
          deepLink: handleNotificationData(data) || undefined,
        });
      });

      // Notification tap → deep-link routing
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data: Record<string, any> = action.notification?.data || {};
        const link = handleNotificationData(data);
        if (link) queueDeepLink(link);
      });

      return () => { PushNotifications.removeAllListeners(); };

    } else if (fcmToken) {
      // Web FCM foreground listener
      onMessageListener().then((payload: any) => {
        if (payload?.notification) {
          const data = payload?.data || {};
          addAlert({
            title: payload.notification.title,
            body: payload.notification.body,
            type: data.type || 'general',
            color: data.type === 'harvest_update' ? '#10B981' : '#6366F1',
            deepLink: handleNotificationData(data) || undefined,
          });
          const link = handleNotificationData(data);
          if (link) queueDeepLink(link);
        }
      }).catch(err => console.warn('Web message listener failed:', err));
    }
  }, [fcmToken, addAlert]);

  return {
    requestNotificationPermission,
    fcmToken,
    incomingAlert,
    alertHistory,
    deepLinkUrl,
    clearDeepLink: () => {
      setDeepLinkUrl(null);
      sessionStorage.removeItem('aqua_notification_deeplink');
    },
    triggerLocalAlert: (title: string, body: string, type = 'general', color = '#6366F1') => {
      addAlert({ title, body, type, color });
    },
    clearAlert: () => setIncomingAlert(null),
    clearHistory: async () => {
      // Mark all as read in DB
      try {
        await fetch(`${API_BASE_URL}/notifications/mark-read`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
        });
      } catch { /* silent */ }
      setAlertHistory([]);
    },
  };
};
