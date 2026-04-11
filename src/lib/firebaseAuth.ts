/**
 * firebaseAuth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase Phone Authentication helpers for AquaGrow.
 *
 * Flow:
 *   1. sendOtp(phone)       → Firebase sends SMS, returns confirmationResult
 *   2. verifyOtp(result, code) → Firebase verifies code, returns ID token
 *   3. Backend receives ID token via POST /auth/verify-firebase-otp
 *
 * For Capacitor Android (WebView):
 *   - RecaptchaVerifier runs in "invisible" mode so it's transparent to user
 *   - Firebase Phone Auth is whitelisted on the Firebase console for this app
 *   - On real Android the SMS is delivered via Firebase / Google Play Services
 *
 * IMPORTANT: Enable "Phone" sign-in provider in Firebase Console →
 *   Authentication → Sign-in method → Phone → Enable
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  Auth,
} from 'firebase/auth';
import { app } from './firebase';

// Lazy singleton — Firebase Auth instance
let _auth: Auth | null = null;
const getFirebaseAuth = (): Auth => {
  if (!_auth) _auth = getAuth(app);
  return _auth;
};

// Store reCAPTCHA verifier so we can clear it between attempts
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Clears the invisible reCAPTCHA widget so a new one can be created on retry.
 * Necessary because Firebase allows only one verifier per container element.
 */
export const clearRecaptcha = () => {
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch (_) { /* ignore */ }
    recaptchaVerifier = null;
  }
};

/**
 * Step 1 — Send OTP to phone number via Firebase.
 *
 * @param phoneE164  Phone in E.164 format e.g. "+919876543210"
 * @param buttonId   ID of a DOM element to attach the invisible reCAPTCHA to.
 *                   The element must exist in the DOM when this is called.
 *                   Use a hidden div or the submit button's id.
 * @returns          ConfirmationResult object to pass to verifyOtp()
 */
export const sendOtp = async (
  phoneE164: string,
  buttonId: string = 'recaptcha-container'
): Promise<ConfirmationResult> => {
  const auth = getFirebaseAuth();

  // Clear any previous verifier first
  clearRecaptcha();

  // Create invisible reCAPTCHA — user never sees a puzzle
  recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: () => { /* OTP sent */ },
    'expired-callback': () => { clearRecaptcha(); },
  });

  // This triggers the SMS send
  const confirmationResult = await signInWithPhoneNumber(auth, phoneE164, recaptchaVerifier);
  return confirmationResult;
};

/**
 * Step 2 — Verify the OTP code the user typed.
 *
 * @param confirmationResult  The object returned from sendOtp()
 * @param code                The 6-digit OTP entered by user
 * @returns                   Firebase ID token string (send this to your backend)
 */
export const verifyOtp = async (
  confirmationResult: ConfirmationResult,
  code: string
): Promise<string> => {
  const userCredential = await confirmationResult.confirm(code);
  const token = await userCredential.user.getIdToken();
  return token;
};

/**
 * Formats a 10-digit Indian number to E.164 format for Firebase.
 * e.g. "9876543210" → "+919876543210"
 */
export const toE164India = (digits: string): string => {
  const clean = digits.replace(/\D/g, '').slice(-10);
  return `+91${clean}`;
};
