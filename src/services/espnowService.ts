/**
 * espnowService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Typed API client for all farmer-facing ESP-NOW endpoints.
 * All calls require a valid JWT (handled via Authorization header by the
 * DataContext / auth interceptor).
 *
 * Base: GET /api/espnow/* → requires JWT
 * Device endpoints are firmware-only (X-Device-ApiKey) and NOT called here.
 */

import { API_BASE_URL } from '../config';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type AeratorState = 'ON' | 'OFF' | 'UNKNOWN';
export type CommandStatus = 'pending' | 'sent' | 'confirmed' | 'failed' | 'timeout';
export type CommandAction = 'ON' | 'OFF' | 'SPEED' | 'RESET';
export type DeviceRole = 'master' | 'slave';

export interface SlaveReading {
  mac: string;
  aeratorState?: AeratorState;
  voltage?: number;
  current?: number;
  powerWatts?: number;
  rssi?: number;
}

export interface EspDevice {
  _id: string;
  userId: string;
  pondId: string;
  mac: string;
  role: DeviceRole;
  masterMac?: string;
  label: string;
  firmwareVersion?: string;
  isActive: boolean;
  lastSeen?: string;          // ISO date
  heartbeatAt?: string;       // ISO date
  aeratorState: AeratorState;
  voltage?: number;
  current?: number;
  powerWatts?: number;
  signalStrength?: number;    // RSSI (dBm)
  createdAt: string;
  // Enriched by server status endpoint:
  online?: boolean;
  lastSeenAgo?: string;
  heartbeatAgo?: string;
}

export interface EspSensorReading {
  _id: string;
  deviceId: string;
  pondId: string;
  userId: string;
  do?: number;
  ph?: number;
  temp?: number;
  salinity?: number;
  ammonia?: number;
  turbidity?: number;
  tds?: number;
  nitrite?: number;
  nitrate?: number;
  voltage?: number;
  current?: number;
  powerWatts?: number;
  aeratorState?: AeratorState;
  slaveReadings?: SlaveReading[];
  alerts: string[];
  recordedAt: string;         // ISO date
}

export interface EspAeratorCommand {
  _id: string;
  userId: string;
  pondId: string;
  masterMac: string;
  targetMac: string;
  action: CommandAction;
  params: {
    speed?: number;
    durationMinutes?: number;
  };
  status: CommandStatus;
  issuedAt: string;
  sentAt?: string;
  confirmedAt?: string;
  errorMessage?: string;
  notes?: string;
}

export interface PondIoTStatus {
  pondId: string;
  pondName: string;
  devices: EspDevice[];
  latestReading: EspSensorReading | null;
  pendingCommands: number;
  pendingCommandDetails: EspAeratorCommand[];
  serverTime: string;
}

export interface SendCommandPayload {
  pondId: string;
  targetMac: string;
  action: CommandAction;
  params?: {
    speed?: number;
    durationMinutes?: number;
  };
  notes?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Read the JWT from localStorage (same key used by DataContext) */
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('aqua_token') || '';
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
};

// ─── Service ─────────────────────────────────────────────────────────────────

export const espnowService = {
  /**
   * GET /api/espnow/status/:pondId
   * Full real-time snapshot: devices + aerator states + latest reading + pending commands.
   * Poll this every 5 seconds on the IoT dashboard.
   */
  async getPondStatus(pondId: string): Promise<PondIoTStatus> {
    const res = await fetch(`${API_BASE_URL}/espnow/status/${pondId}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<PondIoTStatus>(res);
  },

  /**
   * GET /api/espnow/readings/:pondId
   * Sensor reading history.
   */
  async getReadings(
    pondId: string,
    opts: { limit?: number; from?: string; to?: string; latest?: boolean } = {}
  ): Promise<EspSensorReading[]> {
    const params = new URLSearchParams();
    if (opts.limit)  params.set('limit', String(opts.limit));
    if (opts.from)   params.set('from', opts.from);
    if (opts.to)     params.set('to', opts.to);
    if (opts.latest) params.set('latest', 'true');
    const res = await fetch(
      `${API_BASE_URL}/espnow/readings/${pondId}?${params.toString()}`,
      { headers: getAuthHeader() }
    );
    return handleResponse<EspSensorReading[]>(res);
  },

  /**
   * GET /api/espnow/commands/:pondId
   * Aerator command history.
   */
  async getCommandHistory(
    pondId: string,
    opts: { limit?: number; status?: CommandStatus } = {}
  ): Promise<EspAeratorCommand[]> {
    const params = new URLSearchParams();
    if (opts.limit)  params.set('limit', String(opts.limit));
    if (opts.status) params.set('status', opts.status);
    const res = await fetch(
      `${API_BASE_URL}/espnow/commands/${pondId}?${params.toString()}`,
      { headers: getAuthHeader() }
    );
    return handleResponse<EspAeratorCommand[]>(res);
  },

  /**
   * POST /api/espnow/command
   * Issue an aerator command from the app (ON / OFF / SPEED / RESET).
   */
  async sendCommand(payload: SendCommandPayload): Promise<{ message: string; command: EspAeratorCommand }> {
    const res = await fetch(`${API_BASE_URL}/espnow/command`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; command: EspAeratorCommand }>(res);
  },

  /**
   * GET /api/espnow/devices
   * List registered devices, optionally filtered by pond.
   */
  async getDevices(pondId?: string): Promise<EspDevice[]> {
    const params = pondId ? `?pondId=${pondId}` : '';
    const res = await fetch(`${API_BASE_URL}/espnow/devices${params}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<EspDevice[]>(res);
  },

  /**
   * GET /api/espnow/devices/:deviceId
   */
  async getDevice(deviceId: string): Promise<EspDevice> {
    const res = await fetch(`${API_BASE_URL}/espnow/devices/${deviceId}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<EspDevice>(res);
  },

  // ── Utility ──────────────────────────────────────────────────────────────

  /** True if lastSeen is within the last 30 seconds */
  isOnline(lastSeen?: string | null): boolean {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 30_000;
  },

  /** Human-readable relative time ("5s ago", "2m ago", "Never") */
  relativeTime(isoDate?: string | null): string {
    if (!isoDate) return 'Never';
    const secs = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (secs < 60)   return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  },
};
