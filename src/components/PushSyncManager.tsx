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
  const { user, apiFetch } = useData();
  const { requestNotificationPermission, fcmToken } = useFirebaseAlerts(user?.language || 'English');

  // Initial Permission/Registration Request
  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  // Token Sync Logic
  useEffect(() => {
    const syncToken = async () => {
      if (user && fcmToken && fcmToken !== user.fcmToken) {
        console.log("[PushSyncManager] Token update detected. Syncing with backend engine...");
        try {
          await apiFetch(`${API_BASE_URL}/user/${user.id || (user as any)._id}/notifications`, {
            method: 'PUT',
            body: JSON.stringify({ 
               fcmToken: fcmToken,
               notifications: user.notifications || { water: true, feed: true, market: false, expert: true, security: true }
            })
          });
          
          // Update local state/storage
          const uInfo = { ...user, fcmToken: fcmToken };
          localStorage.setItem('aqua_user', JSON.stringify(uInfo));
        } catch (err) {
          console.warn("[PushSyncManager] Token sync failed:", err);
        }
      }
    };
    syncToken();
  }, [fcmToken, user]);

  return null;
};
