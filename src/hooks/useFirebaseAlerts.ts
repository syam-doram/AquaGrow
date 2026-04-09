import { useState, useEffect } from 'react';
import { requestFcmToken, onMessageListener } from '../lib/firebase';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { parseAeratorNotification } from '../services/aeratorPushService';
import { parseHarvestNotification } from '../services/harvestPushService';

export const useFirebaseAlerts = (userLanguage: string) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [incomingAlert, setIncomingAlert] = useState<{
    title: string; body: string; timestamp: number; type?: string; color?: string;
  } | null>(null);
  const [alertHistory, setAlertHistory] = useState<{
    title: string; body: string; timestamp: number; type?: string;
  }[]>(() => {
    const saved = localStorage.getItem('aqua_alert_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Deep-link queued from a notification tap (works in both foreground & background)
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(() =>
    sessionStorage.getItem('aqua_notification_deeplink') || null
  );

  const queueDeepLink = (link: string) => {
    setDeepLinkUrl(link);
    sessionStorage.setItem('aqua_notification_deeplink', link);
  };

  const requestNotificationPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        // Main farming alerts channel
        await PushNotifications.createChannel({
          id: 'aquagrow-premium',
          name: 'AquaGrow Farming Alerts',
          description: 'Critical notifications for pond conditions',
          importance: 5, visibility: 1, vibration: true,
        });
        // Aerator check channel
        await PushNotifications.createChannel({
          id: 'aquagrow-aerator',
          name: 'AquaGrow Aerator Checks',
          description: 'Stage-wise aerator management reminders',
          importance: 4, visibility: 1, vibration: true,
        });
        // Harvest tracking channel (highest visibility — real money!)
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
            console.log(`[FCM-WEB] Token ready → ${userLanguage}`);
            return token;
          }
        }
      } catch (err) {
        console.error('Error in Web Push Permission:', err);
      }
    }
    return null;
  };

  // ── Parse notification data and extract deep-link ─────────────────────────
  const handleNotificationData = (data: Record<string, any>): string | null => {
    // Harvest tracking
    const harvestData = parseHarvestNotification(data);
    if (harvestData) return harvestData.deepLink;

    // Aerator check
    const aeratorData = parseAeratorNotification(data);
    if (aeratorData) return aeratorData.deepLink;

    // Generic fallback
    return data?.deepLink || null;
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      PushNotifications.addListener('registration', (token) => {
        console.log(`[FCM-NATIVE] Token: ${token.value}`);
        setFcmToken(token.value);
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('FCM Registration error:', err.error);
      });

      // ── Foreground: show in-app banner ────────────────────────────────────
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        const data = notification.data || {};
        const meta = data.type === 'harvest_update'
          ? { type: 'harvest', color: '#10B981' }
          : data.type === 'aerator_check'
          ? { type: 'aerator', color: '#3B82F6' }
          : { type: 'general', color: '#6366F1' };

        const newAlert = {
          title: notification.title || 'New Alert',
          body: notification.body || '',
          timestamp: Date.now(),
          type: meta.type,
          color: meta.color,
        };
        setIncomingAlert(newAlert);
        setAlertHistory(prev => {
          const updated = [newAlert, ...prev].slice(0, 50);
          localStorage.setItem('aqua_alert_history', JSON.stringify(updated));
          return updated;
        });
      });

      // ── Notification tap → deep-link routing ──────────────────────────────
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data: Record<string, any> = action.notification?.data || {};
        console.log('[FCM-TAP] actionId:', action.actionId, '| type:', data.type);

        const link = handleNotificationData(data);
        if (link) {
          console.log('[FCM-TAP] Routing to:', link);
          queueDeepLink(link);
        }
      });

      return () => { PushNotifications.removeAllListeners(); };

    } else if (fcmToken) {
      // Web FCM foreground listener
      onMessageListener().then((payload: any) => {
        if (payload?.notification) {
          const data = payload?.data || {};
          const newAlert = {
            title: payload.notification.title,
            body: payload.notification.body,
            timestamp: Date.now(),
            type: data.type || 'general',
            color: data.type === 'harvest_update' ? '#10B981' : '#6366F1',
          };
          setIncomingAlert(newAlert);
          setAlertHistory(prev => {
            const updated = [newAlert, ...prev].slice(0, 50);
            localStorage.setItem('aqua_alert_history', JSON.stringify(updated));
            return updated;
          });

          // Web foreground deep-link queue
          const link = handleNotificationData(data);
          if (link) queueDeepLink(link);
        }
      }).catch(err => console.warn('Web message listener failed:', err));
    }
  }, [fcmToken]);

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
      const newAlert = { title, body, timestamp: Date.now(), type, color };
      setIncomingAlert(newAlert);
      setAlertHistory(prev => [newAlert, ...prev].slice(0, 50));
    },
    clearAlert: () => setIncomingAlert(null),
    clearHistory: () => {
      localStorage.removeItem('aqua_alert_history');
      setAlertHistory([]);
    },
  };
};
