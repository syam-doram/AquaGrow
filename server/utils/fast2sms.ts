/**
 * fast2sms.ts — Server-side OTP via Fast2SMS Indian SMS gateway
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes:
 *   otp  → GET with query params, bypasses DND, 24/7 (DEFAULT ✅)
 *   dlt  → POST JSON, TRAI DLT, needs pre-approved template
 *   q    → POST JSON, promotional, BLOCKED by DND — avoid for OTP
 *
 * OTP route exact URL (per Fast2SMS docs):
 *   GET https://www.fast2sms.com/dev/bulkV2
 *     ?authorization=API_KEY
 *     &route=otp
 *     &variables_values=XXXXXX
 *     &numbers=10_DIGIT_PHONE
 *     &flash=1
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API_KEY    = process.env.FAST2SMS_API_KEY   || '';
const SENDER_ID  = process.env.FAST2SMS_SENDER_ID || '';   // DLT only
const MESSAGE_ID = process.env.FAST2SMS_MESSAGE_ID || '';  // DLT template ID

const OTP_TTL_MS   = 10 * 60 * 1000;  // 10 minutes
const MAX_ATTEMPTS = 5;

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

// ── Helpers ───────────────────────────────────────────────────────────────────
function genOtp(len = 6): string {
  return Math.floor(10 ** (len - 1) + Math.random() * (9 * 10 ** (len - 1))).toString();
}

function norm(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Generate + store + send OTP via Fast2SMS. Returns { success, error? }. */
export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  const key = norm(phone);

  if (!/^[6789]\d{9}$/.test(key))
    return { success: false, error: 'Invalid Indian mobile number (must start with 6-9 and be 10 digits).' };

  const otp = genOtp();
  _store.set(key, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

  // Dev mode — no key configured, log to console for manual testing
  if (!API_KEY) {
    console.log(`[OTP-DEV] 📱 Phone: +91-${key}  OTP: ${otp}`);
    return { success: true };
  }

  const route = process.env.FAST2SMS_ROUTE || 'otp';
  console.log(`[Fast2SMS] → ${key}  OTP: ${otp}  route: ${route}`);

  try {
    let res: Response;

    // ── OTP Route (DEFAULT) ─────────────────────────────────────────────────
    // Official Fast2SMS format: GET with all params in query string
    // GET /bulkV2?authorization=KEY&route=otp&variables_values=OTP&numbers=PHONE&flash=1
    if (route === 'otp') {
      const qs = new URLSearchParams({
        authorization:    API_KEY,
        route:            'otp',
        variables_values: otp,
        numbers:          key,
        flash:            '1',
      });

      res = await fetch(`https://www.fast2sms.com/dev/bulkV2?${qs.toString()}`, {
        method: 'GET',
      });

    // ── DLT Route ───────────────────────────────────────────────────────────
    } else if (route === 'dlt') {
      res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method:  'POST',
        headers: { authorization: API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route:            'dlt',
          sender_id:        SENDER_ID,
          message:          MESSAGE_ID,
          variables_values: otp,
          flash:            0,
          numbers:          key,
        }),
      });

    // ── Quick / Promotional Route ────────────────────────────────────────────
    } else {
      res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method:  'POST',
        headers: { authorization: API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route:    'q',
          message:  `Your AquaGrow OTP is ${otp}. Valid for 10 minutes. Do not share.`,
          language: 'english',
          flash:    0,
          numbers:  key,
        }),
      });
    }

    const data = await res.json() as any;
    console.log('[Fast2SMS Response]', JSON.stringify(data));

    if (data.return === true) {
      console.log(`[Fast2SMS] ✅ Delivered  request_id: ${data.request_id}`);
      return { success: true };
    }

    const errMsg = Array.isArray(data.message)
      ? data.message.join(', ')
      : (typeof data.message === 'string' ? data.message : JSON.stringify(data));
    console.error('[Fast2SMS] ❌ Failed:', errMsg);
    return { success: false, error: errMsg };

  } catch (err: any) {
    console.error('[Fast2SMS Error]', err.message);
    return { success: false, error: 'SMS service unavailable. Please try again.' };
  }
}

/** Verify OTP entered by user. Consumes it (one-time use). */
export function verifyOtp(
  phone: string,
  code: string
): { valid: boolean; error?: string } {
  const key   = norm(phone);
  const entry = _store.get(key);

  if (!entry)
    return { valid: false, error: 'OTP not found or expired. Please request a new OTP.' };

  if (Date.now() > entry.expiresAt) {
    _store.delete(key);
    return { valid: false, error: 'OTP expired. Please request a new one.' };
  }

  entry.attempts++;
  if (entry.attempts > MAX_ATTEMPTS) {
    _store.delete(key);
    return { valid: false, error: 'Too many wrong attempts. Request a new OTP.' };
  }

  if (entry.otp !== code.trim())
    return { valid: false, error: `Wrong OTP (${MAX_ATTEMPTS - entry.attempts + 1} attempts left).` };

  // ✅ Correct — consume it (one-time use)
  _store.delete(key);
  return { valid: true };
}
