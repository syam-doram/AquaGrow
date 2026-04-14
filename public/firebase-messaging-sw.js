// firebase-messaging-sw.js
// ─────────────────────────────────────────────────────────────────────────────
// Service Worker: handles FCM background messages (app closed / minimised).
//
// PAYLOAD STRATEGY: We use  notification + data  (dual key) from the server.
//   • notification key → Android OS shows system notification automatically ✅
//   • data key         → Available here for deep-link routing & custom options ✅
//   • priority: high   → Delivered even with screen off ✅
//
// This SW fires ONLY when the app is NOT in the foreground.
// Foreground is handled by pushNotificationReceived + LocalNotifications in
// useFirebaseAlerts.ts.
// ─────────────────────────────────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyD_iW71nzdyxqLi0RjYlg6lKYHdyvPAgOw",
  authDomain:        "aquagrow-37a3e.firebaseapp.com",
  projectId:         "aquagrow-37a3e",
  storageBucket:     "aquagrow-37a3e.firebasestorage.app",
  messagingSenderId: "451031188680",
  appId:             "1:451031188680:web:e1575f44c59b7ae85591fd",
});

const messaging = firebase.messaging();

// ── Notification config per type ─────────────────────────────────────────────
const TYPE_CONFIG = {
  harvest_update: {
    icon:             '/app_icon.png',
    badge:            '/favicon.ico',
    color:            '#10B981',
    requireInteraction: true,     // stays in shade until farmer dismisses
    vibrate:          [0, 400, 150, 400],
    actions: [
      { action: 'view_tracking', title: '📊 View Tracking'  },
      { action: 'dismiss',       title: 'Dismiss'            },
    ],
  },
  aerator_check: {
    icon:             '/app_icon.png',
    badge:            '/favicon.ico',
    color:            '#3B82F6',
    requireInteraction: true,
    vibrate:          [0, 300, 100, 300],
    actions: [
      { action: 'update_aerator', title: '⚙️ Update Now'        },
      { action: 'snooze',         title: '🔔 Remind Tomorrow'   },
    ],
  },
  lunar: {
    icon:             '/app_icon.png',
    badge:            '/favicon.ico',
    color:            '#6366F1',
    requireInteraction: true,
    vibrate:          [0, 500, 200, 500, 200, 500],
    actions: [
      { action: 'view_pond',   title: '🌑 View Pond'   },
      { action: 'dismiss',     title: 'OK, Got It'     },
    ],
  },
  feed_reminder: {
    icon:             '/app_icon.png',
    badge:            '/favicon.ico',
    color:            '#F59E0B',
    requireInteraction: false,
    vibrate:          [0, 200, 100, 200],
    actions: [
      { action: 'view_pond', title: '🦐 Open Pond'   },
      { action: 'dismiss',   title: 'Done'            },
    ],
  },
  milestone: {
    icon:             '/app_icon.png',
    badge:            '/favicon.ico',
    color:            '#10B981',
    requireInteraction: false,
    vibrate:          [0, 300, 150, 300],
    actions: [
      { action: 'view_pond', title: '📈 View Details' },
      { action: 'dismiss',   title: 'OK'              },
    ],
  },
  general: {
    icon:             '/app_icon.png',
    badge:            '/favicon.ico',
    color:            '#6366F1',
    requireInteraction: false,
    vibrate:          [0, 200],
    actions: [],
  },
};

// ── Background message handler ────────────────────────────────────────────────
// Fires when app is NOT in the foreground (minimised, closed, screen off).
// With notification + data payload, Android OS already shows the notification
// natively — this handler lets us CUSTOMISE it (actions, vibration, deep-link).
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background FCM received:', payload);

  const data       = payload.data       || {};
  const notif      = payload.notification || {};

  // Read title/body from notification key first, fall back to data key
  const title      = notif.title || data.title || 'AquaGrow Alert 🦐';
  const body       = notif.body  || data.body  || 'New alert from AquaGrow.';
  const type       = data.type   || 'general';
  const deepLink   = data.deepLink || '/';
  const pondId     = data.pondId   || '';
  const cfg        = TYPE_CONFIG[type] || TYPE_CONFIG.general;

  const options = {
    body,
    icon:               cfg.icon,
    badge:              cfg.badge,
    requireInteraction: cfg.requireInteraction,
    tag:                `aquagrow-${type}-${pondId || Date.now()}`,  // groups by pond
    data:               { deepLink, type, pondId },
    vibrate:            cfg.vibrate,
    actions:            cfg.actions,
    silent:             false,
  };

  // We call showNotification to customise the display.
  // On Android, FCM would also show it natively from the notification key —
  // calling this replaces/updates that notification with our richer version.
  self.registration.showNotification(title, options);
});

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data     = event.notification.data || {};
  const deepLink = data.deepLink || '/';
  const action   = event.action;

  // Snooze / dismiss: just close, no navigation
  if (action === 'snooze' || action === 'dismiss') return;

  // All other taps → focus / open app at the deep-link URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url: deepLink });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(deepLink);
      }
    })
  );
});
