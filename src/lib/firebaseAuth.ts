/**
 * firebaseAuth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase Phone Authentication: native Capacitor plugin on Android/iOS,
 * web RecaptchaVerifier fallback for browser testing.
 *
 * WHY TWO PATHS?
 * ──────────────
 * Web Firebase SDK uses reCAPTCHA (Enterprise or v2) to verify the caller.
 * In a Capacitor Android WebView the host is "https://localhost" which:
 *   • Is not authorized in Firebase Console → reCAPTCHA v2 400 Bad Request
 *   • Is not set up for reCAPTCHA Enterprise → 404 Not Found
 *
 * The @capacitor-firebase/authentication native plugin bypasses reCAPTCHA
 * entirely by using Android's SafetyNet/Play Integrity API, which is
 * the Google-recommended approach for native Android apps.
 *
 * Flow (native Capacitor):
 *   1. sendOtp(+91XXXXXXXXXX) → FirebaseAuthentication.signInWithPhoneNumber()
 *                             → Google sends real SMS, no reCAPTCHA widget
 *   2. verifyOtp(session, code) → FirebaseAuthentication.confirmVerificationCode()
 *                              → returns Firebase user
 *   3. getFirebaseIdToken()   → FirebaseAuthentication.getIdToken()
 *                            → returns idToken to send to our backend
 *
 * Flow (web browser fallback):
 *   Same concept but uses existing RecaptchaVerifier (only used in dev browser)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Capacitor } from '@capacitor/core';

// ── Detect native platform once ───────────────────────────────────────────────
const IS_NATIVE = Capacitor.isNativePlatform();

// ── Shared OTP session type ───────────────────────────────────────────────────
export type OtpSession =
  | { type: 'native'; verificationId: string }
  | { type: 'web'; confirmationResult: import('firebase/auth').ConfirmationResult };

// ── Web-only state (reCAPTCHA cleanup) ────────────────────────────────────────
let _webVerifier: import('firebase/auth').RecaptchaVerifier | null = null;

export const clearRecaptcha = () => {
  if (_webVerifier) {
    try { _webVerifier.clear(); } catch (_) { /* ignore */ }
    _webVerifier = null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Send OTP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends an OTP SMS to the given E.164 phone number.
 * On native Android/iOS → uses @capacitor-firebase/authentication (no reCAPTCHA).
 * On web browser → uses Firebase Web SDK RecaptchaVerifier.
 *
 * @param phoneE164  Phone in E.164 format e.g. "+919876543210"
 * @param buttonId   DOM element id for invisible reCAPTCHA (web only, ignored on native)
 */
export const sendOtp = async (
  phoneE164: string,
  buttonId: string = 'recaptcha-container'
): Promise<OtpSession> => {

  if (IS_NATIVE) {
    // ── NATIVE PATH (Android / iOS) ──────────────────────────────────────────
    // Uses @capacitor-firebase/authentication — NO reCAPTCHA, NO WebView issues.
    // Android uses SafetyNet/Play Integrity for verification.
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    const result = await FirebaseAuthentication.signInWithPhoneNumber({
      phoneNumber: phoneE164,
    });

    if (!result.verificationId) {
      throw new Error('No verificationId returned from Firebase. Check phone auth is enabled in Firebase Console.');
    }

    console.log('[FirebaseAuth] Native OTP sent to', phoneE164);
    return { type: 'native', verificationId: result.verificationId };

  } else {
    // ── WEB FALLBACK (browser dev testing only) ───────────────────────────────
    // Requires:
    //   • Phone sign-in enabled in Firebase Console → Authentication → Sign-in methods
    //   • "localhost" added to Firebase Console → Authentication → Settings → Authorized domains
    const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
    const { app } = await import('./firebase');

    clearRecaptcha();

    const auth = getAuth(app);
    _webVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: 'invisible',
      callback: () => { /* OTP auto-sent */ },
      'expired-callback': () => { clearRecaptcha(); },
    });

    const confirmationResult = await signInWithPhoneNumber(auth, phoneE164, _webVerifier);
    console.log('[FirebaseAuth] Web OTP sent to', phoneE164);
    return { type: 'web', confirmationResult };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Verify OTP → return Firebase ID token
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifies the OTP code entered by the user.
 * Returns the Firebase ID token — send this to your backend for verification.
 *
 * @param session  The OtpSession object returned from sendOtp()
 * @param code     The 6-digit OTP entered by the user
 */
export const verifyOtp = async (session: OtpSession, code: string): Promise<string> => {

  if (session.type === 'native') {
    // ── NATIVE PATH ───────────────────────────────────────────────────────────
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    await FirebaseAuthentication.confirmVerificationCode({
      verificationId: session.verificationId,
      verificationCode: code,
    });

    // Get the Firebase ID token from the now-authenticated session
    const { token } = await FirebaseAuthentication.getIdToken({ forceRefresh: false });
    if (!token) throw new Error('Failed to get Firebase ID token after OTP verification.');

    console.log('[FirebaseAuth] Native OTP verified OK');
    return token;

  } else {
    // ── WEB FALLBACK ──────────────────────────────────────────────────────────
    const userCredential = await session.confirmationResult.confirm(code);
    const token = await userCredential.user.getIdToken();
    console.log('[FirebaseAuth] Web OTP verified OK');
    return token;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a 10-digit Indian number to E.164 format.
 * e.g. "9876543210" → "+919876543210"
 */
export const toE164India = (digits: string): string => {
  const clean = digits.replace(/\D/g, '').slice(-10);
  return `+91${clean}`;
};
