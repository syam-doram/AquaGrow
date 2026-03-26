// This script automatically executes when the React UI is completely closed or running silently in the background.
// E.g., if the backend 'Auto Schedule Engine' triggers a DO < 5 oxygen alert at 2 AM, this file catches it.

importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyD_iW71nzdyxqLi0RjYlg6lKYHdyvPAgOw",
  authDomain: "aquagrow-37a3e.firebaseapp.com",
  projectId: "aquagrow-37a3e",
  storageBucket: "aquagrow-37a3e.firebasestorage.app",
  messagingSenderId: "451031188680",
  appId: "1:451031188680:web:e1575f44c59b7ae85591fd",
  measurementId: "G-7L3LM3GTZD"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Auto Schedule Alert Received in Background: ', payload);
  
  const notificationTitle = payload?.notification?.title || 'AquaGrow System Alert';
  const notificationOptions = {
    body: payload?.notification?.body || 'New operational alert from the Master Schedule.',
    icon: '/favicon.ico', 
    badge: '/favicon.ico',
    requireInteraction: true // Keeps notification open until farmer dismisses it
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
