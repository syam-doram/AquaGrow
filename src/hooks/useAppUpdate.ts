import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

// ─── Current app version ─────────────────────────────────────────────────────
// Bump this manually (or via CI) every time you push a new APK build.
// Format: MAJOR.MINOR.PATCH  (e.g., 1.0.0 → 1.1.0 for new features)
export const CURRENT_APP_VERSION = '1.0.0';

// ─── Semver comparison ────────────────────────────────────────────────────────
// Returns  1 if a > b,  0 if a === b,  -1 if a < b
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff > 0) return 1;
    if (diff < 0) return -1;
  }
  return 0;
}

export interface AppUpdateInfo {
  latestVersion: string;
  minVersion: string;       // below this → force update (cannot dismiss)
  releaseNotes: string[];
  updateUrl: string;        // Play Store URL
  forceUpdate: boolean;     // true when currentVersion < minVersion
}

interface UseAppUpdateResult {
  hasUpdate: boolean;
  updateInfo: AppUpdateInfo | null;
  currentVersion: string;
  dismissed: boolean;
  dismiss: () => void;
}

export function useAppUpdate(): UseAppUpdateResult {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [dismissed, setDismissed]   = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/app-version`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return;
        const data: AppUpdateInfo = await res.json();
        if (cancelled) return;

        // Only surface if server version is newer than what's running
        if (compareSemver(data.latestVersion, CURRENT_APP_VERSION) > 0) {
          setUpdateInfo({
            ...data,
            forceUpdate: compareSemver(CURRENT_APP_VERSION, data.minVersion) < 0,
          });
        }
      } catch {
        // Silently swallow — no network / server unavailable is OK
      }
    };

    // Check on mount (slight delay so splash+auth is not blocked)
    const tid = setTimeout(check, 4000);
    return () => { cancelled = true; clearTimeout(tid); };
  }, []);

  const dismiss = useCallback(() => {
    if (updateInfo && !updateInfo.forceUpdate) setDismissed(true);
  }, [updateInfo]);

  return {
    hasUpdate: !!updateInfo,
    updateInfo,
    currentVersion: CURRENT_APP_VERSION,
    dismissed,
    dismiss,
  };
}
