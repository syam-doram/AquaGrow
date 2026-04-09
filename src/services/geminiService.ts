/**
 * geminiService.ts
 * ─────────────────────────────────────────────────────────────
 * All AI calls are proxied through the AquaGrow backend server.
 * The Gemini API key lives ONLY in server environment variables.
 * It is never bundled into the frontend / APK.
 * ─────────────────────────────────────────────────────────────
 */

import { API_BASE_URL } from '../config';

const MAX_RETRIES  = 3;
const RETRY_DELAY  = (attempt: number) => 2000 * Math.pow(2, attempt); // 2s, 4s, 8s

const getAuthHeader = (): Record<string, string> => {
  try {
    // Tokens are stored as JSON under 'aqua_tokens' by DataContext
    const raw = localStorage.getItem('aqua_tokens');
    if (!raw) return {};
    const tokens = JSON.parse(raw);
    const token = tokens?.access;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

// ─── Disease Detection ────────────────────────────────────────────────────────
export async function analyzeShrimpHealth(base64Image: string, language: string = 'English') {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/analyze-health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'AI analysis failed. Please try again.');
      }

      return await res.json();
    } catch (error: any) {
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
      const res = await fetch(`${API_BASE_URL}/ai/analyze-water`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ base64Image }),
      });

      if (res.status === 503) {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY(attempt)));
          continue;
        }
        throw new Error('AI server is temporarily overloaded. Please wait and try again.');
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Water test analysis failed.');
      }

      return await res.json();
    } catch (error: any) {
      if (attempt >= MAX_RETRIES) throw error;
      await new Promise(r => setTimeout(r, RETRY_DELAY(attempt)));
    }
  }
  throw new Error('Analysis failed after maximum retries.');
}

// ─── Live Stream Frame Analysis ───────────────────────────────────────────────
export async function analyzeLiveStream(base64Image: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/analyze-live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ base64Image }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Live Analysis Error:', error);
    return null;
  }
}
