import { useState, useEffect } from 'react';
import { requestFcmToken, onMessageListener } from '../lib/firebase';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const useFirebaseAlerts = (userLanguage: string) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [incomingAlert, setIncomingAlert] = useState<{ title: string, body: string, timestamp: number } | null>(null);
  const [alertHistory, setAlertHistory] = useState<{ title: string, body: string, timestamp: number }[]>(() => {
    const saved = localStorage.getItem('aqua_alert_history');
    return saved ? JSON.parse(saved) : [];
  });

  const requestNotificationPermission = async () => {
    // ─── NATIVE (ANDROID/IOS) PUSH ───
    if (Capacitor.isNativePlatform()) {
      try {
        // Create the high-priority channel for Lock Screen visibility
        await PushNotifications.createChannel({
          id: 'aquagrow-premium',
          name: 'AquaGrow Farming Alerts',
          description: 'Critical notifications for pond conditions',
          importance: 5, // Max importance
          visibility: 1, // Public (shows on lock screen)
          vibration: true,
        });

        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
        }
        
        if (perm.receive === 'granted') {
          // In Capacitor, we register the plugin. The token comes via the 'registration' listener
          await PushNotifications.register();
          return "PENDING_NATIVE_AUTO_REGISTER"; // Token will be caught by PushSyncManager or listener
        } else {
          console.warn("Native notification permission denied.");
        }
      } catch (err) {
        console.error("Error in Native Push Permission: ", err);
      }
      return null;
    }

    // ─── WEB (BROWSER/PWA) PUSH ───
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await requestFcmToken("BEBZl6-WrZ0gOSVSZLeWNUhgMeejDpVqAF-WUgxomclCoSPe9ZrpLYyGHPdGrI2BkqzjA_Iev-JZD5yDGWAZynM");
          if (token) {
             setFcmToken(token);
             console.log(`[FCM-WEB Sync] Token ready for backend -> ${userLanguage}`);
             return token;
          }
        } else {
           console.warn("Web notification permission denied.");
        }
      } catch (err) {
        console.error("Error in Web Push Permission: ", err);
      }
    }
    return null;
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Add Listeners for Native Push
      PushNotifications.addListener('registration', (token) => {
        console.log(`[FCM-NATIVE Sync] Native Token ready: ${token.value}`);
        setFcmToken(token.value);
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('Registration error: ', err.error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        const newAlert = {
          title: notification.title || 'New Alert',
          body: notification.body || 'You have a new message',
          timestamp: Date.now()
        };
        setIncomingAlert(newAlert);
        setAlertHistory(prev => {
          const updated = [newAlert, ...prev].slice(0, 50);
          localStorage.setItem('aqua_alert_history', JSON.stringify(updated));
          return updated;
        });
      });

      return () => {
        PushNotifications.removeAllListeners();
      };
    } else if (fcmToken) {
      // For Web FCM, we listen via the standard Firebase SDK listener
      onMessageListener().then((payload: any) => {
        console.log("Web Foreground Message: ", payload);
        if (payload?.notification) {
          const newAlert = {
            title: payload.notification.title,
            body: payload.notification.body,
            timestamp: Date.now()
          };
          setIncomingAlert(newAlert);
          setAlertHistory(prev => {
            const updated = [newAlert, ...prev].slice(0, 50);
            localStorage.setItem('aqua_alert_history', JSON.stringify(updated));
            return updated;
          });
        }
      }).catch(err => console.log('Web message listener failed: ', err));
    }
  }, [fcmToken]);

  return { 
    requestNotificationPermission, 
    fcmToken, 
    incomingAlert, 
    alertHistory,
    triggerLocalAlert: (title: string, body: string) => {
      const newAlert = { title, body, timestamp: Date.now() };
      setIncomingAlert(newAlert);
      setAlertHistory(prev => [newAlert, ...prev].slice(0, 50));
    },
    clearAlert: () => setIncomingAlert(null),
    clearHistory: () => {
      localStorage.removeItem('aqua_alert_history');
      setAlertHistory([]);
    }
  };
};
