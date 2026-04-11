/**
 * firebaseAuth.ts — Firebase Phone Authentication
 * ─────────────────────────────────────────────────────────────────────────────
 * Platform detection:
 *   Android/iOS (Capacitor APK)  → @capacitor-firebase/authentication v8
 *                                  Uses listener pattern (phoneCodeSent event)
 *                                  No reCAPTCHA, native SafetyNet/Play Integrity
 *   Browser (dev / web fallback) → Firebase web SDK + invisible RecaptchaVerifier
 *
 * Why listener pattern on native?
 *   In @capacitor-firebase/authentication v8, signInWithPhoneNumber() returns
 *   Promise<void> (not the verificationId). The verificationId is delivered
 *   via the 'phoneCodeSent' listener event — so we wrap that in a Promise.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Capacitor } from '@capacitor/core';

// ── Platform flag ─────────────────────────────────────────────────────────────
const IS_NATIVE = Capacitor.isNativePlatform();

// ── Session type ──────────────────────────────────────────────────────────────
export type OtpSession =
  | { type: 'native'; verificationId: string }
  | { type: 'web';    confirmation: any };

// ── reCAPTCHA ref (web only) ──────────────────────────────────────────────────
let _recaptchaVerifier: any = null;

export const clearRecaptcha = (): void => {
  try { _recaptchaVerifier?.clear(); } catch { /* ignore */ }
  _recaptchaVerifier = null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export const toE164India = (digits: string): string =>
  `+91${digits.replace(/\D/g, '').slice(-10)}`;

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Send OTP
// ─────────────────────────────────────────────────────────────────────────────
export const sendOtp = async (
  phoneE164: string,
  buttonId = 'recaptcha-login-container'
): Promise<OtpSession> => {

  if (IS_NATIVE) {
    // ── Native Android path ────────────────────────────────────────────────
    // @capacitor-firebase/authentication v8:
    //   signInWithPhoneNumber() → Promise<void>  (NOT the verificationId)
    //   verificationId arrives via 'phoneCodeSent' listener event
    //
    // We wrap the listener in a Promise so callers can just await sendOtp().
    console.log('[FirebaseAuth] Native → signInWithPhoneNumber', phoneE164);
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    return new Promise<OtpSession>((resolve, reject) => {

      // ✅ Success: SMS was sent, verificationId received
      FirebaseAuthentication.addListener('phoneCodeSent', async (event: any) => {
        await FirebaseAuthentication.removeAllListeners();
        if (!event.verificationId) {
          reject(Object.assign(
            new Error('Firebase did not return a verificationId. Check Phone Auth is enabled in Firebase Console.'),
            { code: 'auth/no-verification-id' }
          ));
          return;
        }
        console.log('[FirebaseAuth] ✅ SMS sent, verificationId ready');
        resolve({ type: 'native', verificationId: event.verificationId });
      });

      // ❌ Failure: Firebase rejected the phone number or throttled
      FirebaseAuthentication.addListener('phoneVerificationFailed', async (event: any) => {
        await FirebaseAuthentication.removeAllListeners();
        console.error('[FirebaseAuth] ❌ Verification failed:', event.message);
        reject(Object.assign(
          new Error(event.message || 'Phone verification failed'),
          { code: 'auth/verification-failed' }
        ));
      });

      // Trigger SMS send — result comes via listeners above, not the return value
      FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: phoneE164 })
        .catch((err: any) => {
          FirebaseAuthentication.removeAllListeners();
          reject(err);
        });
    });

  } else {
    // ── Web / browser fallback ─────────────────────────────────────────────
    console.log('[FirebaseAuth] Web → RecaptchaVerifier', phoneE164);

    const { getAuth, signInWithPhoneNumber, RecaptchaVerifier } = await import('firebase/auth');
    const { app } = await import('./firebase');
    const auth = getAuth(app);

    clearRecaptcha();
    _recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: 'invisible',
      callback: () => {},
    });

    const confirmation = await signInWithPhoneNumber(auth, phoneE164, _recaptchaVerifier);
    console.log('[FirebaseAuth] ✅ SMS sent (web)');
    return { type: 'web', confirmation };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Verify OTP → Firebase ID token
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOtp = async (
  session: OtpSession,
  code: string
): Promise<string> => {

  if (session.type === 'native') {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    // Confirm code → signs user into Firebase on device
    await FirebaseAuthentication.confirmVerificationCode({
      verificationId:   session.verificationId,
      verificationCode: code,
    });

    // Get ID token for our server
    const tokenResult = await FirebaseAuthentication.getIdToken({ forceRefresh: true });

    if (!tokenResult.token)
      throw Object.assign(
        new Error('Failed to get ID token after phone verification.'),
        { code: 'auth/token-fetch-failed' }
      );

    console.log('[FirebaseAuth] ✅ Native OTP verified, ID token obtained');
    return tokenResult.token;

  } else {
    const credential = await session.confirmation.confirm(code);
    const idToken    = await credential.user.getIdToken();
    clearRecaptcha();
    console.log('[FirebaseAuth] ✅ Web OTP verified, ID token obtained');
    return idToken;
  }
};
