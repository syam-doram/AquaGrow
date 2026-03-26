import React, { useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useFirebaseAlerts } from '../hooks/useFirebaseAlerts';
import { API_BASE_URL } from '../config';

/**
 * PushSyncManager
 * Automatically handles the background synchronization of Push Notification tokens.
 * This ensures the farming engine can deliver alerts without requiring manual clicks in settings.
 */
export const PushSyncManager = () => {
  const { user } = useData();
  const { requestNotificationPermission } = useFirebaseAlerts(user?.language || 'English');

  useEffect(() => {
    const handleSilentSync = async () => {
      // We only attempt auto-sync if:
      // 1. User is logged in
      // 2. User hasn't been unlinked (if we have a flag for it)
      // 3. Browser supports notifications
      if (user && (user.id || (user as any)._id)) {
        // If the user already has a token in their profile, we might still want to refresh it 
        // to ensure it's still valid or if they are on a new device.
        console.log("[PushSyncManager] Initiating background sync check...");
        
        try {
          // Attempting to get token. If permission was already granted, this is silent.
          // If not granted, the browser *might* show a prompt depending on context.
          // Note: Some browsers block permission prompts if not triggered by user gesture.
          // However, for a PWA/Farm app, users expect these alerts.
          const token = await requestNotificationPermission();
          
          if (token && token !== user.fcmToken) {
            console.log("[PushSyncManager] New token detected. Syncing with backend engine...");
            await fetch(`${API_BASE_URL}/user/${user.id || (user as any)._id}/notifications`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                   fcmToken: token,
                   notifications: user.notifications || { water: true, feed: true, market: false }
                })
             });
             
             // Update local storage to reflect the sync
             const uInfo = { ...user, fcmToken: token };
             localStorage.setItem('aqua_user', JSON.stringify(uInfo));
          }
        } catch (err) {
          console.warn("[PushSyncManager] Background sync skipped or failed:", err);
        }
      }
    };

    // Delay slightly to not interfere with initial page load/splash
    const timer = setTimeout(handleSilentSync, 3000);
    return () => clearTimeout(timer);
  }, [user]);

  return null; // This is a logic-only component
};
