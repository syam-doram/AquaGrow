// firebase-messaging-sw.js
// ─────────────────────────────────────────────────────────────────────────────
// Runs in background when the app is closed or minimised.
// Firebase Cloud Messaging delivers the push to this SW which then shows
// an OS-level notification with rich Android styling.
// ─────────────────────────────────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD_iW71nzdyxqLi0RjYlg6lKYHdyvPAgOw",
  authDomain: "aquagrow-37a3e.firebaseapp.com",
  projectId: "aquagrow-37a3e",
  storageBucket: "aquagrow-37a3e.firebasestorage.app",
  messagingSenderId: "451031188680",
  appId: "1:451031188680:web:e1575f44c59b7ae85591fd",
});

const messaging = firebase.messaging();

// ── Icon map by notification type ────────────────────────────────────────────
const TYPE_ICONS = {
  harvest_update: '/app_icon.png',
  aerator_check:  '/app_icon.png',
  general:        '/app_icon.png',
};

const TYPE_BADGE = '/favicon.ico';

// ── Rich background notification handler ──────────────────────────────────────
// Only fires when the app is NOT in the foreground.
// When app IS in the foreground, the Capacitor pushNotificationReceived listener handles it.
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const data        = payload.data || {};
  const notifTitle  = payload.notification?.title || data.title || 'AquaGrow Alert';
  const notifBody   = payload.notification?.body  || data.body  || 'New alert from AquaGrow.';
  const notifType   = data.type || 'general';
  const deepLink    = data.deepLink || '/';

  // ── Determine accent color by type ──────────────────────────────────────────
  const accentColor =
    notifType === 'harvest_update' ? '#10B981' :
    notifType === 'aerator_check'  ? '#3B82F6' :
    '#6366F1';

  // ── Build rich notification options ─────────────────────────────────────────
  const options = {
    body: notifBody,
    icon: TYPE_ICONS[notifType] || '/app_icon.png',
    badge: TYPE_BADGE,

    // Keeps notification visible until farmer dismisses it (harvest payments etc.)
    requireInteraction: notifType === 'harvest_update' || notifType === 'aerator_check',

    // Group notifications by type so they stack cleanly in the shade
    tag: `aquagrow-${notifType}-${data.pondId || Date.now()}`,

    // Android O+ action will open deep link on tap
    data: { deepLink, type: notifType, pondId: data.pondId || '' },

    // Vibration pattern: [delay, vib, pause, vib] ms
    vibrate: [0, 300, 150, 300],

    // Notification actions (shown as buttons below the notification on Android)
    actions: notifType === 'harvest_update'
      ? [
          { action: 'view_tracking', title: '📊 View Tracking' },
          { action: 'dismiss',       title: 'Dismiss' },
        ]
      : notifType === 'aerator_check'
      ? [
          { action: 'update_aerator', title: '⚙️ Update Now' },
          { action: 'snooze',         title: '🔔 Remind Tomorrow' },
        ]
      : [],

    // Shown in notification shade as expand body on Android
    // Note: the Web Notification API does not support bigText natively,
    // but this body text will expand on long-press on Android Chrome.
    silent: false,
  };

  self.registration.showNotification(notifTitle, options);
});

// ── Notification click handler ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data     = event.notification.data || {};
  const deepLink = data.deepLink || '/';
  const action   = event.action;

  // Snooze action: just close
  if (action === 'snooze' || action === 'dismiss') return;

  // All other actions (or body tap): open/focus the app at the deep link
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app already open in a tab, focus + navigate it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url: deepLink });
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(deepLink);
      }
    })
  );
});
