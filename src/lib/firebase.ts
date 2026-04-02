import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

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

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Functions
export const functions = getFunctions(app);

// Use local emulator in development
// if (typeof window !== 'undefined' && 
//    (window.location.hostname === 'localhost' || 
//     window.location.hostname === '127.0.0.1' || 
//     window.location.hostname.startsWith('172.20.'))
// ) {
//   const host = window.location.hostname;
//   connectFunctionsEmulator(functions, host, 5001);
//   connectAuthEmulator(auth, `http://${host}:9099`);
//   connectFirestoreEmulator(db, host, 8080);
// }

// Initialize Firebase Cloud Messaging
// Only initialized on client-side
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Helper function to easily request tokens
export const requestFcmToken = async (vapidKey: string) => {
  if (!messaging) return null;
  try {
    const currentToken = await getToken(messaging, { vapidKey });
    if (currentToken) {
      console.log('Firebase Registration Token successfully generated:', currentToken);
      return currentToken;
    } else {
      console.log("No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token. ", err);
    return null;
  }
};

// Listener Wrapper
export const onMessageListener = () => {
  if (!messaging) return new Promise((resolve) => {});
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};
