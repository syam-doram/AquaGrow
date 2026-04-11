/**
 * fast2sms.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side OTP management using Fast2SMS (Indian SMS gateway).
 *
 * Flow:
 *   1. generateAndStore(phone)  → creates 6-digit OTP, stores with 10-min TTL
 *   2. sendViaSMS(phone, otp)   → calls Fast2SMS API
 *   3. verify(phone, code)      → checks OTP, marks as used
 *
 * Uses an in-memory Map with periodic cleanup (no Redis needed).
 * For multi-instance deployments replace with MongoDB TTL collection.
 *
 * Fast2SMS DLT Route:
 *   Requires pre-approved TRAI DLT template (sender_id + message template_id).
 *   Set FAST2SMS_ROUTE=dlt + FAST2SMS_SENDER_ID + FAST2SMS_MESSAGE_ID in .env.
 *
 * Fast2SMS Quick Route (default - good for testing, no DLT needed):
 *   Set FAST2SMS_ROUTE=q in .env (or leave unset).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API_KEY    = process.env.FAST2SMS_API_KEY  || '';
const ROUTE      = (process.env.FAST2SMS_ROUTE   || 'q') as 'q' | 'dlt';
const SENDER_ID  = process.env.FAST2SMS_SENDER_ID || '';   // DLT only
const MESSAGE_ID = process.env.FAST2SMS_MESSAGE_ID || '';  // DLT template ID

const OTP_TTL_MS     = 10 * 60 * 1000;  // 10 minutes
const MAX_ATTEMPTS   = 5;

// ── In-memory OTP store ───────────────────────────────────────────────────────
interface OtpEntry {
  otp:       string;
  expiresAt: number;
  attempts:  number;
}
const _store = new Map<string, OtpEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _store) if (v.expiresAt < now) _store.delete(k);
}, 5 * 60 * 1000);

// ── OTP helpers ───────────────────────────────────────────────────────────────
function genOtp(len = 6): string {
  return Math.floor(10 ** (len - 1) + Math.random() * (9 * 10 ** (len - 1))).toString();
}

function norm(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate OTP, store it, and send via Fast2SMS.
 * Returns { success, error? }.
 */
export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  const key = norm(phone);
  if (!/^[6789]\d{9}$/.test(key))
    return { success: false, error: 'Invalid Indian mobile number (must be 10 digits starting with 6-9).' };

  const otp = genOtp();
  _store.set(key, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

  // Dev/test mode — no API key set, just log OTP
  if (!API_KEY) {
    console.log(`[OTP-DEV] Phone: ${key}  OTP: ${otp}`);
    return { success: true };
  }

  try {
    let body: Record<string, any>;

    if (ROUTE === 'dlt') {
      // ── DLT route (TRAI compliant, requires pre-approved template) ──────────
      body = {
        route:            'dlt',
        sender_id:        SENDER_ID,
        message:          MESSAGE_ID,       // numeric template ID from Fast2SMS panel
        variables_values: otp,
        flash:            0,
        numbers:          key,
      };
    } else {
      // ── Quick route (no DLT, good for testing) ──────────────────────────────
      body = {
        route:    'q',
        message:  `Your AquaGrow OTP is ${otp}. Valid for 10 minutes. Do not share it with anyone. -AquaGrow`,
        language: 'english',
        flash:    0,
        numbers:  key,
      };
    }

    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method:  'POST',
      headers: {
        authorization:  API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as any;
    console.log('[Fast2SMS]', data);

    if (data.return === true) return { success: true };

    const errMsg = Array.isArray(data.message)
      ? data.message.join(', ')
      : (data.message || 'SMS send failed');
    return { success: false, error: errMsg };

  } catch (err: any) {
    console.error('[Fast2SMS Error]', err.message);
    return { success: false, error: 'SMS service unavailable. Please try again.' };
  }
}

/**
 * Verify the OTP code entered by the user.
 * Consumes the OTP (one-time use). Returns { valid, error? }.
 */
export function verifyOtp(
  phone: string,
  code: string
): { valid: boolean; error?: string } {
  const key   = norm(phone);
  const entry = _store.get(key);

  if (!entry)
    return { valid: false, error: 'OTP expired or not found. Please request a new OTP.' };

  if (Date.now() > entry.expiresAt) {
    _store.delete(key);
    return { valid: false, error: 'OTP expired. Please request a new one.' };
  }

  entry.attempts++;
  if (entry.attempts > MAX_ATTEMPTS) {
    _store.delete(key);
    return { valid: false, error: 'Too many wrong attempts. Request a new OTP.' };
  }

  if (entry.otp !== code.trim()) {
    return {
      valid: false,
      error: `Wrong OTP (${MAX_ATTEMPTS - entry.attempts + 1} attempts left).`,
    };
  }

  // ✅ Correct — consume it
  _store.delete(key);
  return { valid: true };
}
