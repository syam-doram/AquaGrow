import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_iW71nzdyxqLi0RjYlg6lKYHdyvPAgOw",
  authDomain: "aquagrow-37a3e.firebaseapp.com",
  projectId: "aquagrow-37a3e",
  storageBucket: "aquagrow-37a3e.firebasestorage.app",
  messagingSenderId: "451031188680",
  appId: "1:451031188680:web:e1575f44c59b7ae85591fd",
  measurementId: "G-7L3LM3GTZD"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Functions
export const functions = getFunctions(app);

// ── Firebase Cloud Messaging ────────────────────────────────────────────────
// Firebase Messaging requires Service Workers, which are NOT available in:
//   • Capacitor Android/iOS WebViews
//   • Non-HTTPS origins
// We use isSupported() — Firebase's own async check — instead of a naive
// `typeof window` guard which only protects against SSR, not WebViews.

let _messaging: ReturnType<typeof getMessaging> | null = null;

const getMessagingInstance = async () => {
  if (_messaging) return _messaging;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  _messaging = getMessaging(app);
  return _messaging;
};

// Helper to request FCM push tokens
export const requestFcmToken = async (vapidKey: string): Promise<string | null> => {
  try {
    const m = await getMessagingInstance();
    if (!m) return null;
    const currentToken = await getToken(m, { vapidKey });
    if (currentToken) {
      console.log('Firebase FCM token generated:', currentToken);
      return currentToken;
    }
    console.log('No FCM registration token available. Request permission first.');
    return null;
  } catch (err) {
    console.error('Error retrieving FCM token:', err);
    return null;
  }
};

// Foreground message listener
export const onMessageListener = async (): Promise<unknown> => {
  const m = await getMessagingInstance();
  if (!m) return new Promise(() => {});
  return new Promise((resolve) => {
    onMessage(m, (payload) => resolve(payload));
  });
};

// Legacy sync export — kept for any imports that reference `messaging` directly.
// Always null because initialization is now async; use requestFcmToken instead.
export const messaging = null;
