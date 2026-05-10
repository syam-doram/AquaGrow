/**
 * geminiService.ts
 * ─────────────────────────────────────────────────────────────
 * All AI calls are proxied through the AquaGrow backend server.
 * The Gemini API key lives ONLY in server environment variables.
 * It is never bundled into the frontend / APK.
 * ─────────────────────────────────────────────────────────────
 */

import { API_BASE_URL } from '../config';

const MAX_RETRIES = 3;
const RETRY_DELAY = (attempt: number) => 2000 * Math.pow(2, attempt); // 2s, 4s, 8s

// ─── Token helpers (localStorage — same keys as DataContext) ──────────────────
const getTokens = (): { access: string; refresh: string } | null => {
  try {
    const raw = localStorage.getItem('aqua_tokens');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveTokens = (t: { access: string; refresh: string }) => {
  localStorage.setItem('aqua_tokens', JSON.stringify(t));
};

/**
 * Attempt a silent token refresh via POST /auth/refresh.
 * Returns the new token pair or null on failure.
 */
const refreshAccessToken = async (): Promise<{ access: string; refresh: string } | null> => {
  const t = getTokens();
  if (!t?.refresh) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: t.refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newTokens = {
      access:  data.access_token,
      refresh: data.refresh_token || t.refresh, // preserve refresh if not rotated
    };
    saveTokens(newTokens);
    return newTokens;
  } catch {
    return null;
  }
};

/**
 * fetch wrapper that auto-refreshes the access token on 401,
 * mirrors the DataContext `apiFetch` behaviour without needing the React context.
 */
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const tokens = getTokens();
  const authHeader = tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {};

  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeader, ...options.headers },
  });

  // If 401, attempt a silent token refresh then retry once
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshed.access}`,
          ...options.headers,
        },
      });
    }
  }

  return res;
};

// ─── Shared quota/error throw helper ─────────────────────────────────────────
const throwIfError = async (res: Response, genericMsg: string): Promise<void> => {
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const e: any = new Error(body.message || 'AI daily quota exhausted. Please wait and try again.');
    e.code = body.code || 'QUOTA_EXCEEDED';
    e.retryAfterSeconds = body.retryAfterSeconds || 60;
    throw e;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || genericMsg);
  }
};

// ─── Disease Detection ────────────────────────────────────────────────────────
export async function analyzeShrimpHealth(base64Image: string, language: string = 'English') {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await authFetch(`${API_BASE_URL}/ai/analyze-health`, {
        method: 'POST',
        body: JSON.stringify({ base64Image, language }),
      });

      if (res.status === 503) {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY(attempt);
          console.warn(`AI 503 — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})…`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error('AI server is temporarily overloaded. Please wait and try again.');
      }

      await throwIfError(res, 'AI analysis failed. Please try again.');
      return await res.json();
    } catch (error: any) {
      // Never retry quota errors — the quota won't recover in seconds
      if (error.code === 'QUOTA_EXCEEDED') throw error;
      if (error.name === 'AbortError') throw new Error('Analysis timed out. Please try again.');
      if (attempt >= MAX_RETRIES) throw error;
      const delay = RETRY_DELAY(attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('AI analysis failed after maximum retries.');
}

// ─── Water Test Scanner ───────────────────────────────────────────────────────
export async function analyzeWaterTest(base64Image: string): Promise<any> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await authFetch(`${API_BASE_URL}/ai/analyze-water`, {
        method: 'POST',
        body: JSON.stringify({ base64Image }),
      });

      if (res.status === 503) {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY(attempt)));
          continue;
        }
        throw new Error('AI server is temporarily overloaded. Please wait and try again.');
      }

      await throwIfError(res, 'Water test analysis failed.');
      return await res.json();
    } catch (error: any) {
      if (error.code === 'QUOTA_EXCEEDED') throw error;
      if (attempt >= MAX_RETRIES) throw error;
      await new Promise(r => setTimeout(r, RETRY_DELAY(attempt)));
    }
  }
  throw new Error('Analysis failed after maximum retries.');
}

// ─── Live Stream Frame Analysis ───────────────────────────────────────────────
export async function analyzeLiveStream(base64Image: string): Promise<any | null> {
  try {
    const res = await authFetch(`${API_BASE_URL}/ai/analyze-live`, {
      method: 'POST',
      body: JSON.stringify({ base64Image }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Live Analysis Error:', error);
    return null;
  }
}
