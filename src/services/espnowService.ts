/**
 * espnowService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Typed API client for all farmer-facing ESP-NOW endpoints.
 * All calls require a valid JWT (handled via Authorization header).
 *
 * IMPORTANT: MAC addresses are NEVER used in the app. All device operations
 * use Box IDs (e.g. SB001, MB001) and displayNames (e.g. "Pond 1 Aerator").
 */

import { API_BASE_URL } from '../config';

// ─── Enums & primitive types ──────────────────────────────────────────────────

export type AeratorState   = 'ON' | 'OFF' | 'UNKNOWN';
export type CommandStatus  = 'pending' | 'sent' | 'confirmed' | 'failed' | 'timeout';
export type CommandAction  = 'ON' | 'OFF' | 'SPEED' | 'RESET';
export type DeviceRole     = 'master' | 'slave';
export type DeviceType     = 'AERATOR' | 'SENSOR' | 'FEEDER' | 'PUMP' | 'CUSTOM' | 'MASTER';
export type PairingStatus  = 'unpaired' | 'discovered' | 'assigned';

// ─── Device type metadata for UI ─────────────────────────────────────────────

export interface DeviceTypeOption {
  value: DeviceType;
  label: string;
  emoji: string;
  description: string;
}

export const DEVICE_TYPE_OPTIONS: DeviceTypeOption[] = [
  { value: 'AERATOR', label: 'Aerator',           emoji: '💨', description: 'Controls aerator relay for oxygen' },
  { value: 'SENSOR',  label: 'Water Quality Sensor', emoji: '🔬', description: 'Reads pH, DO, temperature, etc.' },
  { value: 'FEEDER',  label: 'Auto Feeder',        emoji: '🐟', description: 'Automated feed dispenser' },
  { value: 'PUMP',    label: 'Water Pump',         emoji: '💧', description: 'Water inlet/outlet pump control' },
  { value: 'CUSTOM',  label: 'Custom Device',      emoji: '⚙️',  description: 'Any other connected device' },
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SlaveReading {
  boxId?: string;          // preferred identifier (Box ID from firmware)
  aeratorState?: AeratorState;
  voltage?: number;
  current?: number;
  powerWatts?: number;
  rssi?: number;
}

/**
 * EspDevice as returned from the farmer-facing API.
 * NOTE: MAC address is intentionally absent — only boxId and displayName are
 * the farmer-visible identifiers. MAC is kept server-side for ESP-NOW routing.
 */
export interface EspDevice {
  _id: string;
  userId: string;
  pondId: string;
  boxId?: string;            // e.g. 'SB001' — shown to farmer as device ID
  displayName?: string;      // e.g. 'Pond 1 Aerator' — farmer-assigned friendly name
  deviceType?: DeviceType;   // AERATOR | SENSOR | FEEDER | PUMP | CUSTOM | MASTER
  pairingStatus?: PairingStatus;
  masterId?: string;         // boxId of the Master this device is paired with
  role: DeviceRole;
  label?: string;            // legacy label, fallback for displayName
  firmwareVersion?: string;
  isActive: boolean;
  lastSeen?: string;         // ISO date
  heartbeatAt?: string;      // ISO date
  aeratorState: AeratorState;
  voltage?: number;
  current?: number;
  powerWatts?: number;
  signalStrength?: number;   // RSSI (dBm)
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
  recordedAt: string;
}

export interface EspAeratorCommand {
  _id: string;
  userId: string;
  pondId: string;
  // Farmer-visible fields (no MAC):
  targetBoxId?: string;        // e.g. 'SB001'
  targetDisplayName?: string;  // e.g. 'Pond 1 Aerator'
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

/**
 * An entry in the discover queue — a Smart Box that powered on and is waiting
 * for the farmer to assign a name and device type.
 */
export interface EspDiscoverEntry {
  boxId: string;           // e.g. 'SB003' — from device firmware
  masterId: string;        // which Master Box detected it
  pondId: string;
  discoveredAt: string;    // ISO date
}

export interface SendCommandByIdPayload {
  boxId: string;           // target Smart Box ID
  action: CommandAction;
  pondId?: string;         // optional — auto-resolved from boxId
  params?: {
    speed?: number;
    durationMinutes?: number;
  };
  notes?: string;
}

/** Legacy MAC-based command payload — kept for backward compat */
export interface SendCommandPayload {
  pondId: string;
  targetMac: string;
  action: CommandAction;
  params?: { speed?: number; durationMinutes?: number };
  notes?: string;
}

export interface AssignDevicePayload {
  boxId: string;
  displayName: string;
  deviceType: DeviceType;
  pondId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getAuthHeader = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem('aqua_tokens');
    const tokens = raw ? JSON.parse(raw) : null;
    const token = tokens?.access || '';
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
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

  // ── Dashboard / Status ─────────────────────────────────────────────────────

  /**
   * GET /api/espnow/status/:pondId
   * Full real-time snapshot. Poll every 5 seconds on the IoT dashboard.
   * Returns devices with boxId/displayName — no MAC addresses.
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
   * Command history — returns boxId/displayName, not MAC addresses.
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

  // ── Commands ───────────────────────────────────────────────────────────────

  /**
   * POST /api/espnow/command-by-id   ← PREFERRED
   * Send an aerator command using Box ID only. Farmer never needs a MAC address.
   *
   * @example
   *   espnowService.sendCommandById({ boxId: 'SB001', action: 'ON' })
   */
  async sendCommandById(
    payload: SendCommandByIdPayload
  ): Promise<{ message: string; command: EspAeratorCommand }> {
    const res = await fetch(`${API_BASE_URL}/espnow/command-by-id`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; command: EspAeratorCommand }>(res);
  },

  /**
   * POST /api/espnow/command   ← Legacy
   * Kept for backward compat. Prefer sendCommandById.
   */
  async sendCommand(
    payload: SendCommandPayload
  ): Promise<{ message: string; command: EspAeratorCommand }> {
    const res = await fetch(`${API_BASE_URL}/espnow/command`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; command: EspAeratorCommand }>(res);
  },

  // ── Auto-Pairing / Discovery ───────────────────────────────────────────────

  /**
   * GET /api/espnow/discover/pending
   * Get all unassigned Smart Boxes in the discover queue for the farmer's ponds.
   * These are devices that powered on and broadcast DISCOVER but haven't been
   * assigned a name yet by the farmer.
   */
  async getPendingDiscoveries(pondId?: string): Promise<EspDiscoverEntry[]> {
    const params = pondId ? `?pondId=${pondId}` : '';
    const res = await fetch(`${API_BASE_URL}/espnow/discover/pending${params}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<EspDiscoverEntry[]>(res);
  },

  /**
   * POST /api/espnow/devices/assign
   * Assign a friendly name and device type to a discovered Smart Box.
   * This completes the plug-and-play pairing flow.
   *
   * @example
   *   espnowService.assignDevice({
   *     boxId: 'SB001',
   *     displayName: 'Pond 1 Aerator',
   *     deviceType: 'AERATOR',
   *     pondId: 'abc123',
   *   })
   */
  async assignDevice(
    payload: AssignDevicePayload
  ): Promise<{ message: string; device: EspDevice }> {
    const res = await fetch(`${API_BASE_URL}/espnow/devices/assign`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; device: EspDevice }>(res);
  },

  // ── Device Management ──────────────────────────────────────────────────────

  /**
   * GET /api/espnow/devices
   * List devices by pond. No MAC addresses in response.
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

  // ── Utility ────────────────────────────────────────────────────────────────

  /** True if lastSeen is within the last 30 seconds */
  isOnline(lastSeen?: string | null): boolean {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 30_000;
  },

  /** "5s ago" / "2m ago" / "Never" */
  relativeTime(isoDate?: string | null): string {
    if (!isoDate) return 'Never';
    const secs = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (secs < 60)   return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  },

  /**
   * Get the display label for a device — prefers displayName, falls back to
   * label, then to a generated name from boxId/role.
   */
  getDeviceLabel(device: EspDevice): string {
    if (device.displayName) return device.displayName;
    if (device.label)       return device.label;
    if (device.role === 'master') return `Master Box${device.boxId ? ` (${device.boxId})` : ''}`;
    return device.boxId ? `Smart Box ${device.boxId}` : 'Unknown Device';
  },

  /** Get the icon emoji for a device type */
  getDeviceTypeEmoji(type?: DeviceType | null): string {
    const opt = DEVICE_TYPE_OPTIONS.find(o => o.value === type);
    return opt?.emoji ?? '📦';
  },
};
