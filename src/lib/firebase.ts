import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } from 'firebase/app-check';

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

// ── App Check ───────────────────────────────────────────────────────────────
// ON NATIVE ANDROID: App Check is handled automatically by Play Integrity
//   via the @capacitor-firebase/authentication plugin — no code needed here.
// ON WEB (localhost): Enable debug mode so Storage/Firestore calls work during dev.
// ON WEB (production / Vercel): Skip App Check — the demo reCAPTCHA key
//   (6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI) is Google's test-only key and
//   returns 400 in production, causing an infinite throttle loop that blocks
//   Storage uploads. Replace this with a real reCAPTCHA v3 key registered for
//   your domain in Google reCAPTCHA admin console, then un-comment the else branch.
const IS_NATIVE = 'Capacitor' in window && (window as any).Capacitor?.isNativePlatform?.();
const IS_LOCALHOST = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

if (!IS_NATIVE && IS_LOCALHOST) {
  // Dev-only: enable App Check debug mode.
  // A debug token is printed in the browser console — add it in:
  // Firebase Console → App Check → Apps → Manage debug tokens
  try {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    initializeAppCheck(app, {
      provider: new CustomProvider({
        getToken: async () => ({ token: 'debug', expireTimeMillis: Date.now() + 3600000 }),
      }),
      isTokenAutoRefreshEnabled: true,
    });
    console.log('[AppCheck] Debug mode active (localhost)');
  } catch (e) {
    console.warn('[AppCheck] init skipped:', e);
  }
}
// NOTE: To enable App Check in Vercel production, register a real reCAPTCHA v3
// site key at https://www.google.com/recaptcha/admin and replace the block above with:
//
// if (!IS_NATIVE) {
//   initializeAppCheck(app, {
//     provider: new ReCaptchaV3Provider('YOUR_REAL_RECAPTCHA_V3_SITE_KEY'),
//     isTokenAutoRefreshEnabled: true,
//   });
// }


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

// Initialize Storage
export const storage = getStorage(app);

// Legacy sync export — kept for any imports that reference `messaging` directly.
export const messaging = null;
