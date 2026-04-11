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
 *
 * Key fixes applied:
 *   1. removeAllListeners() is called BEFORE registering new listeners on every
 *      call — critical for Resend so stale listeners don't resolve with a stale
 *      verificationId from the previous attempt.
 *   2. A module-level in-flight lock prevents two concurrent sendOtp() calls
 *      (e.g. impatient double-tap) from racing each other.
 *   3. Auto-verified sessions expose { type:'native', verificationId:'__auto__...' }
 *      and the UI must detect this prefix and skip manual input.
 *   4. Web RecaptchaVerifier is always cleared before any new call.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Capacitor } from '@capacitor/core';

// ── Platform flag ─────────────────────────────────────────────────────────────
const IS_NATIVE = Capacitor.isNativePlatform();

// ── Session type ──────────────────────────────────────────────────────────────
export type OtpSession =
  | { type: 'native'; verificationId: string }
  | { type: 'web';    confirmation: any };

/** Returns true when Firebase auto-verified the number without user code entry. */
export const isAutoVerified = (session: OtpSession): boolean =>
  session.type === 'native' && session.verificationId.startsWith('__auto__');

/** Extracts the ID token from an auto-verified session — skips OTP step entirely. */
export const getAutoVerifiedToken = (session: OtpSession): string | null => {
  if (isAutoVerified(session)) return session.verificationId.replace('__auto__', '');
  return null;
};

// ── reCAPTCHA ref (web only) ──────────────────────────────────────────────────
let _recaptchaVerifier: any = null;

export const clearRecaptcha = (): void => {
  try { _recaptchaVerifier?.clear(); } catch { /* ignore */ }
  _recaptchaVerifier = null;
};

// ── In-flight lock — prevents concurrent sendOtp() race on double-tap ─────────
let _sendOtpInFlight = false;

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

  // ── In-flight guard ───────────────────────────────────────────────────────
  if (_sendOtpInFlight) {
    console.warn('[FirebaseAuth] sendOtp already in progress — ignoring duplicate call');
    return Promise.reject(Object.assign(
      new Error('OTP request already in progress. Please wait.'),
      { code: 'auth/request-in-progress' }
    ));
  }
  _sendOtpInFlight = true;

  const releaseLock = () => { _sendOtpInFlight = false; };

  if (IS_NATIVE) {
    // ── Native Android path ────────────────────────────────────────────────
    // @capacitor-firebase/authentication v8:
    //   signInWithPhoneNumber() → Promise<void>  (NOT the verificationId)
    //   verificationId arrives via 'phoneCodeSent' listener event
    //
    // CRITICAL: removeAllListeners() is called BEFORE adding new listeners.
    // Without this, a Resend call accumulates a second set of listeners,
    // and the first stale listener can resolve with the new verificationId,
    // while the second listener resolves with a different one — causing
    // "session expired" when the user enters the code from the second SMS.
    console.log('[FirebaseAuth] Native → signInWithPhoneNumber', phoneE164);
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    // 🔑 Remove ALL previous listeners before registering new ones
    await FirebaseAuthentication.removeAllListeners();

    return new Promise<OtpSession>((resolve, reject) => {
      let settled = false;
      const settle = async (fn: () => void) => {
        if (settled) return;
        settled = true;
        releaseLock();
        await FirebaseAuthentication.removeAllListeners();
        fn();
      };

      // ✅ SMS code sent — user must enter it manually
      FirebaseAuthentication.addListener('phoneCodeSent', async (event: any) => {
        await settle(() => {
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
      });

      // ✅ Auto-verified (SafetyNet / Play Integrity auto-retrieval)
      // Firebase verified the code automatically — the user does NOT need to enter it.
      // We embed the ID token in the session so the UI can detect and skip the OTP step.
      FirebaseAuthentication.addListener('phoneVerificationCompleted', async (_event: any) => {
        console.log('[FirebaseAuth] ✅ Auto-verified (SafetyNet/Play Integrity)');
        await settle(async () => {
          try {
            const tokenResult = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
            if (tokenResult.token) {
              // Prefix signals to callers: no manual OTP entry needed
              resolve({ type: 'native', verificationId: `__auto__${tokenResult.token}` });
            } else {
              reject(Object.assign(new Error('Auto-verification succeeded but no ID token.'), { code: 'auth/token-fetch-failed' }));
            }
          } catch (e: any) {
            reject(e);
          }
        });
      });

      // ❌ Firebase rejected the phone number or throttled
      FirebaseAuthentication.addListener('phoneVerificationFailed', async (event: any) => {
        await settle(() => {
          console.error('[FirebaseAuth] ❌ Verification failed:', event.message);
          reject(Object.assign(
            new Error(event.message || 'Phone verification failed'),
            { code: 'auth/verification-failed' }
          ));
        });
      });

      // Trigger SMS send — result comes via listeners above, not the return value
      FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: phoneE164 })
        .catch(async (err: any) => {
          await settle(() => reject(err));
        });

      // Safety timeout — if no listener fires in 90s, reject cleanly
      setTimeout(async () => {
        await settle(() =>
          reject(Object.assign(new Error('OTP request timed out. Please try again.'), { code: 'auth/timeout' }))
        );
      }, 90_000);
    });

  } else {
    // ── Web / browser fallback ─────────────────────────────────────────────
    console.log('[FirebaseAuth] Web → RecaptchaVerifier', phoneE164);

    try {
      const { getAuth, signInWithPhoneNumber, RecaptchaVerifier } = await import('firebase/auth');
      const { app } = await import('./firebase');
      const auth = getAuth(app);

      // Always clear any previous verifier before creating a new one.
      // Failing to do so causes "reCAPTCHA has already been rendered" errors.
      clearRecaptcha();

      // Verify the DOM anchor exists before mounting — this guards against
      // calling sendOtp before the step/UI that renders the anchor has painted.
      if (!document.getElementById(buttonId)) {
        console.error(`[FirebaseAuth] reCAPTCHA anchor #${buttonId} not found in DOM`);
        releaseLock();
        throw Object.assign(
          new Error(`reCAPTCHA container #${buttonId} not found. Ensure it is rendered before calling sendOtp.`),
          { code: 'auth/argument-error' }
        );
      }

      _recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
        size: 'invisible',
        callback: () => {},
      });

      const confirmation = await signInWithPhoneNumber(auth, phoneE164, _recaptchaVerifier);
      console.log('[FirebaseAuth] ✅ SMS sent (web)');
      releaseLock();
      return { type: 'web', confirmation };
    } catch (err) {
      releaseLock();
      clearRecaptcha();
      throw err;
    }
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

    // Auto-verified path (phoneVerificationCompleted fired) — token is embedded in verificationId
    if (session.verificationId.startsWith('__auto__')) {
      const idToken = session.verificationId.replace('__auto__', '');
      console.log('[FirebaseAuth] ✅ Auto-verified path — ID token extracted directly');
      return idToken;
    }

    // Manual path — user entered the 6-digit code
    await FirebaseAuthentication.confirmVerificationCode({
      verificationId:   session.verificationId,
      verificationCode: code,
    });

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
