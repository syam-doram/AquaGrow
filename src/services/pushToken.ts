/**
 * pushToken.ts — shared helper to read the bearer access token from localStorage
 */
export const getAccessToken = (): string | null => {
  try {
    const raw = localStorage.getItem('aqua_tokens');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access || null;
  } catch {
    return null;
  }
};
