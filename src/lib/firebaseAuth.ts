/**
 * firebaseAuth.ts  →  Fast2SMS server-side OTP adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Previously used Firebase Phone Auth (web reCAPTCHA / Capacitor native plugin).
 * Now replaced with server-side OTP via Fast2SMS — no reCAPTCHA, no Firebase
 * rate limits, no Capacitor plugin dependency for auth.
 *
 * Exported API is IDENTICAL to the old Firebase version so callers
 * (Login.tsx, Register.tsx) don't need major changes:
 *   sendOtp(phoneE164, buttonId?)  → OtpSession
 *   clearRecaptcha()               → no-op
 *   toE164India(digits)            → "+91XXXXXXXXXX"
 *
 * The only change in callers:
 *   OLD: verifyOtp(session, code) → idToken → loginWithFirebaseToken(idToken, role)
 *   NEW: session.phone + code passed directly to otpLogin/otpRegister (DataContext)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://aquagrow.onrender.com/api';

// ── Session type ──────────────────────────────────────────────────────────────
export type OtpSession = {
  type:  'server';
  phone: string;   // 10-digit normalized phone stored for verification step
};

// ── no-op (was for Firebase reCAPTCHA cleanup) ────────────────────────────────
export const clearRecaptcha = (): void => { /* Fast2SMS needs no cleanup */ };

// ── Format helpers ────────────────────────────────────────────────────────────
export const toE164India = (digits: string): string =>
  `+91${digits.replace(/\D/g, '').slice(-10)}`;

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Request OTP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asks the server to generate + send an OTP via Fast2SMS.
 * @param phoneE164  E.164 phone e.g. "+919876543210" (we strip +91 and send 10-digit)
 * @param _buttonId  Ignored (was for reCAPTCHA DOM element)
 */
export const sendOtp = async (
  phoneE164: string,
  _buttonId?: string
): Promise<OtpSession> => {
  const phone = phoneE164.replace(/\D/g, '').slice(-10);

  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ phone }),
  });

  const data = await res.json() as { success?: boolean; error?: string };

  if (!res.ok || !data.success)
    throw Object.assign(new Error(data.error || 'Failed to send OTP.'), { code: 'otp/send-failed' });

  console.log('[Fast2SMS OTP] Sent to', phone);
  return { type: 'server', phone };
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — (stub kept for API compatibility)
// Login.tsx and Register.tsx now call otpLogin/otpRegister from DataContext
// directly instead of verifyOtp().  This function exists only so TypeScript
// doesn't break while callers are updated.
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOtp = async (session: OtpSession, _code: string): Promise<string> => {
  // Returns the phone — the real verification happens inside otpLogin/otpRegister
  return session.phone;
};
