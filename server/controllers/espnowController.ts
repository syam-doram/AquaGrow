import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  EspDevice,
  EspSensorReading,
  EspAeratorCommand,
  EspHeartbeat,
  Pond as PondMongo,
} from '../db.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a cryptographically secure 64-char hex API key */
const generateApiKey = (): string => crypto.randomBytes(32).toString('hex');

/** Normalize a MAC address to uppercase colon-delimited format */
const normalizeMac = (mac: string): string =>
  mac.toUpperCase().replace(/[^0-9A-F]/g, '').replace(/(.{2})(?!$)/g, '$1:');

/** DB guard — returns 503 when mongoose is disconnected */
const dbOffline = (res: Response) =>
  res.status(503).json({ error: 'Database unavailable. Please try again later.' });

/** Format "X seconds ago" / "X minutes ago" relative time */
const relativeTime = (date: Date | null | undefined): string => {
  if (!date) return 'Never';
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
};

// ─── Water Quality Alert Thresholds ──────────────────────────────────────────
// Acceptable ranges for shrimp (Vannamei) pond water quality
const THRESHOLDS: Record<string, { min?: number; max?: number; label: string }> = {
  do:       { min: 4.0,  label: 'DO_LOW'       },   // dissolved oxygen mg/L
  ph:       { min: 7.0,  max: 8.5, label: 'PH' },
  temp:     { min: 25.0, max: 32.0, label: 'TEMP' },
  salinity: { min: 5,    max: 35,  label: 'SALINITY' },
  ammonia:  { max: 0.1,  label: 'AMMONIA_HIGH' },
  turbidity:{ max: 60,   label: 'TURBIDITY_HIGH' },
  nitrite:  { max: 1.0,  label: 'NITRITE_HIGH' },
};

/**
 * Compute alert flags from a sensor reading object.
 * Returns an array of string codes like ['DO_LOW', 'PH_HIGH'].
 */
const computeAlerts = (data: Record<string, number | undefined>): string[] => {
  const alerts: string[] = [];
  for (const [key, cfg] of Object.entries(THRESHOLDS)) {
    const val = data[key];
    if (val === undefined || val === null) continue;
    if (cfg.min !== undefined && val < cfg.min) alerts.push(`${cfg.label}_LOW`);
    if (cfg.max !== undefined && val > cfg.max) alerts.push(`${cfg.label}_HIGH`);
  }
  return alerts;
};

// ─────────────────────────────────────────────────────────────────────────────
//  DEVICE MANAGEMENT  (JWT-protected — farmer must be logged in)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/espnow/devices/register
 * Register a new Master or Slave ESP32 device for a pond.
 * Body: { pondId, mac, role, label?, masterMac?, firmwareVersion? }
 * Response: { device, apiKey }  ← apiKey is shown ONCE, store it in device flash
 */
export const registerDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { pondId, mac, role, label, masterMac, firmwareVersion } = req.body;

    // Validate required fields
    if (!pondId) { res.status(400).json({ error: 'pondId is required' }); return; }
    if (!mac)    { res.status(400).json({ error: 'mac (MAC address) is required' }); return; }
    if (!role || !['master', 'slave'].includes(role)) {
      res.status(400).json({ error: 'role must be "master" or "slave"' }); return;
    }
    if (role === 'slave' && !masterMac) {
      res.status(400).json({ error: 'masterMac is required for slave devices' }); return;
    }

    // Validate pond ownership
    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) {
      res.status(403).json({ error: 'Pond does not belong to your account' }); return;
    }

    const normalizedMac = normalizeMac(mac);
    const apiKey = generateApiKey();

    // Upsert: if device with this MAC already exists, update it (re-registration)
    const device = await EspDevice.findOneAndUpdate(
      { mac: normalizedMac },
      {
        userId,
        pondId,
        mac: normalizedMac,
        role,
        masterMac: masterMac ? normalizeMac(masterMac) : undefined,
        label: label || (role === 'master' ? 'Master ESP32' : 'Aerator Slave'),
        apiKey,
        firmwareVersion,
        isActive: true,
        lastSeen: null,
        heartbeatAt: null,
        aeratorState: 'UNKNOWN',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Return apiKey separately — it's the only time we expose it as plaintext
    res.status(201).json({
      message: 'Device registered successfully. Store the apiKey in the device flash — it will not be shown again.',
      device: {
        _id:              device._id,
        mac:              device.mac,
        role:             device.role,
        label:            device.label,
        pondId:           device.pondId,
        masterMac:        device.masterMac,
        firmwareVersion:  device.firmwareVersion,
        isActive:         device.isActive,
        createdAt:        (device as any).createdAt,
      },
      apiKey, // ← show once on registration
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/devices
 * List all ESP32 devices for the authenticated farmer.
 * Query params: pondId (optional filter)
 */
export const listDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const filter: Record<string, any> = { userId };
    if (req.query.pondId) filter.pondId = req.query.pondId;

    const devices = await EspDevice.find(filter, { apiKey: 0 }) // never return apiKey in list
      .sort({ createdAt: -1 });

    res.json(devices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/devices/:deviceId
 * Get a single device's details (no apiKey).
 */
export const getDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const device = await EspDevice.findById(req.params.deviceId, { apiKey: 0 });
    if (!device) { res.status(404).json({ error: 'Device not found' }); return; }
    if (device.userId !== userId) { res.status(403).json({ error: 'Access denied' }); return; }

    res.json(device);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/espnow/devices/:deviceId
 * Deregister a device. Marks it inactive (soft delete).
 */
export const deregisterDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const device = await EspDevice.findById(req.params.deviceId);
    if (!device) { res.status(404).json({ error: 'Device not found' }); return; }
    if (device.userId !== userId) { res.status(403).json({ error: 'Access denied' }); return; }

    await EspDevice.findByIdAndUpdate(req.params.deviceId, { isActive: false });
    res.json({ success: true, message: 'Device deregistered' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/espnow/devices/:deviceId/rotate-key
 * Regenerate the device's API key (security rotation).
 * The new key must be re-flashed to the device.
 */
export const rotateDeviceKey = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const device = await EspDevice.findById(req.params.deviceId);
    if (!device) { res.status(404).json({ error: 'Device not found' }); return; }
    if (device.userId !== userId) { res.status(403).json({ error: 'Access denied' }); return; }

    const newApiKey = generateApiKey();
    await EspDevice.findByIdAndUpdate(req.params.deviceId, { apiKey: newApiKey });

    res.json({
      message: 'API key rotated. Flash the new apiKey to your device immediately.',
      apiKey: newApiKey,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DEVICE → SERVER  (API-Key-protected — used by ESP32 firmware)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/espnow/heartbeat
 * Master ESP32 sends a lightweight ping every 30 seconds.
 * Header: X-Device-ApiKey: <key>
 * Body: (empty — no body required)
 *
 * - Updates device.lastSeen and device.heartbeatAt
 * - Inserts a heartbeat log doc (TTL 2 hours)
 * - Returns { ok: true, serverTime }
 */
export const heartbeat = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const device = (req as any).device;
    const now = new Date();

    // Update device timestamps (fire-and-forget for speed)
    await Promise.all([
      EspDevice.findByIdAndUpdate(device._id, { lastSeen: now, heartbeatAt: now }),
      EspHeartbeat.create({ deviceId: String(device._id), pondId: device.pondId, mac: device.mac, at: now }),
    ]);

    res.json({ ok: true, serverTime: now.toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/espnow/ingest
 * Master ESP32 pushes a batch of sensor readings + per-slave status.
 * Header: X-Device-ApiKey: <key>
 * Body:
 * {
 *   "readings": [
 *     {
 *       "do": 5.2,
 *       "ph": 7.8,
 *       "temp": 29.5,
 *       "salinity": 15,
 *       "ammonia": 0.02,
 *       "turbidity": 35,
 *       "tds": 450,
 *       "nitrite": 0.05,
 *       "nitrate": 1.2,
 *       "voltage": 220.5,         // optional: master power
 *       "current": 3.2,           // optional
 *       "powerWatts": 705.6,      // optional
 *       "aeratorState": "ON",     // optional: master aerator state
 *       "timestamp": "2026-06-14T05:30:00Z"  // optional, uses server time if omitted
 *     }
 *   ],
 *   "slaveReadings": [             // optional: per-slave real-time status
 *     {
 *       "mac": "AA:BB:CC:DD:EE:FF",
 *       "aeratorState": "ON",
 *       "voltage": 218.0,
 *       "current": 2.8,
 *       "powerWatts": 610.4,
 *       "rssi": -62
 *     }
 *   ]
 * }
 */
export const ingestReadings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const device = (req as any).device;
    const { readings, slaveReadings } = req.body;

    if (!Array.isArray(readings) || readings.length === 0) {
      res.status(400).json({ error: 'readings must be a non-empty array' }); return;
    }
    if (readings.length > 100) {
      res.status(400).json({ error: 'Maximum 100 readings per batch' }); return;
    }

    const now = new Date();

    // ── 1. Insert sensor readings ────────────────────────────────────────────
    const docs = readings.map((r: any) => {
      const alerts = computeAlerts(r);
      return {
        deviceId:     String(device._id),
        pondId:       device.pondId,
        userId:       device.userId,
        do:           r.do,
        ph:           r.ph,
        temp:         r.temp,
        salinity:     r.salinity,
        ammonia:      r.ammonia,
        turbidity:    r.turbidity,
        tds:          r.tds,
        nitrite:      r.nitrite,
        nitrate:      r.nitrate,
        voltage:      r.voltage,
        current:      r.current,
        powerWatts:   r.powerWatts,
        aeratorState: r.aeratorState,
        slaveReadings: Array.isArray(slaveReadings)
          ? slaveReadings.map((s: any) => ({
              mac:          normalizeMac(s.mac || ''),
              aeratorState: s.aeratorState,
              voltage:      s.voltage,
              current:      s.current,
              powerWatts:   s.powerWatts,
              rssi:         s.rssi,
            }))
          : [],
        alerts,
        rawPayload:   r,
        recordedAt:   r.timestamp ? new Date(r.timestamp) : now,
      };
    });

    const saved = await EspSensorReading.insertMany(docs, { ordered: false });

    // ── 2. Update Master device lastSeen + power state ───────────────────────
    const latestReading = readings[readings.length - 1];
    const masterUpdate: Record<string, any> = { lastSeen: now };
    if (latestReading.voltage   != null) masterUpdate.voltage     = latestReading.voltage;
    if (latestReading.current   != null) masterUpdate.current     = latestReading.current;
    if (latestReading.powerWatts != null) masterUpdate.powerWatts = latestReading.powerWatts;
    if (latestReading.aeratorState)      masterUpdate.aeratorState = latestReading.aeratorState;

    // ── 3. Update each Slave device with its latest reported state ───────────
    // Use bulkWrite for efficiency — one round-trip for all slaves
    const slaveOps: any[] = [];
    if (Array.isArray(slaveReadings) && slaveReadings.length > 0) {
      for (const s of slaveReadings) {
        if (!s.mac) continue;
        const slaveMac = normalizeMac(s.mac);
        const slaveSet: Record<string, any> = { lastSeen: now };
        if (s.aeratorState)  slaveSet.aeratorState  = s.aeratorState;
        if (s.voltage  != null) slaveSet.voltage     = s.voltage;
        if (s.current  != null) slaveSet.current     = s.current;
        if (s.powerWatts != null) slaveSet.powerWatts = s.powerWatts;
        if (s.rssi     != null) slaveSet.signalStrength = s.rssi;
        slaveOps.push({
          updateOne: {
            filter: { mac: slaveMac, isActive: true },
            update: { $set: slaveSet },
          },
        });
      }
    }

    await Promise.all([
      EspDevice.findByIdAndUpdate(device._id, masterUpdate),
      slaveOps.length > 0 ? EspDevice.bulkWrite(slaveOps) : Promise.resolve(),
    ]);

    // ── 4. Collect alerts across batch ───────────────────────────────────────
    const allAlerts = [...new Set(docs.flatMap(d => d.alerts))];

    res.status(201).json({
      saved: saved.length,
      alerts: allAlerts,
      slaveUpdated: slaveOps.length,
      message: allAlerts.length > 0
        ? `⚠️ ${allAlerts.length} alert(s) detected: ${allAlerts.join(', ')}`
        : '✅ All readings within normal range',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/command/pending
 * Master ESP32 polls for the next undelivered command for its MAC address.
 * Header: X-Device-ApiKey: <key>
 *
 * - Returns the oldest pending command for this master's MAC
 * - Marks it as 'sent' immediately so it's not returned on the next poll
 * - If no pending commands, returns { command: null }
 */
export const pollPendingCommand = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const device = (req as any).device;

    // Auto-timeout commands older than 5 minutes that are still pending
    const timeoutBefore = new Date(Date.now() - 5 * 60 * 1000);
    await EspAeratorCommand.updateMany(
      { masterMac: device.mac, status: 'pending', issuedAt: { $lt: timeoutBefore } },
      { status: 'timeout' }
    );

    // Fetch oldest pending command for this master
    const command = await EspAeratorCommand.findOneAndUpdate(
      { masterMac: device.mac, status: 'pending' },
      { status: 'sent', sentAt: new Date() },
      { sort: { issuedAt: 1 }, new: true }
    );

    // Update device lastSeen
    await EspDevice.findByIdAndUpdate(device._id, { lastSeen: new Date() });

    if (!command) {
      res.json({ command: null });
      return;
    }

    res.json({
      command: {
        commandId:   command._id,
        targetMac:   command.targetMac,
        action:      command.action,
        params:      command.params,
        issuedAt:    command.issuedAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/espnow/command/:commandId/ack
 * Master confirms a command was executed (or failed) by the slave.
 * Header: X-Device-ApiKey: <key>
 * Body: { status: 'confirmed' | 'failed', errorMessage? }
 *
 * On 'confirmed': updates the target slave device's aeratorState to reflect
 * the executed action (ON/OFF/RESET → OFF etc.) so the app sees real-time state.
 */
export const acknowledgeCommand = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const device = (req as any).device;
    const { commandId } = req.params;
    const { status, errorMessage } = req.body;

    if (!['confirmed', 'failed'].includes(status)) {
      res.status(400).json({ error: 'status must be "confirmed" or "failed"' }); return;
    }

    const command = await EspAeratorCommand.findById(commandId);
    if (!command) { res.status(404).json({ error: 'Command not found' }); return; }

    // Security: master can only ack commands assigned to its own MAC
    if (command.masterMac !== device.mac) {
      res.status(403).json({ error: 'This command does not belong to your device' }); return;
    }

    const update: Record<string, any> = {
      status,
      confirmedAt: new Date(),
    };
    if (errorMessage) update.errorMessage = errorMessage;

    const [updated] = await Promise.all([
      EspAeratorCommand.findByIdAndUpdate(commandId, update, { new: true }),
      EspDevice.findByIdAndUpdate(device._id, { lastSeen: new Date() }),
    ]);

    // ── On confirmed ACK: flip the slave device's live aeratorState ──────────
    if (status === 'confirmed') {
      const newAeratorState =
        command.action === 'ON'   ? 'ON'  :
        command.action === 'OFF'  ? 'OFF' :
        command.action === 'RESET'? 'OFF' :
        undefined; // SPEED doesn't change ON/OFF — preserve existing state

      if (newAeratorState) {
        await EspDevice.updateOne(
          { mac: command.targetMac, isActive: true },
          { aeratorState: newAeratorState }
        );
      }
    }

    res.json({ success: true, command: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  APP → SERVER  (JWT-protected — farmer sends commands & reads data)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/espnow/command
 * Farmer app sends an aerator control command.
 * Body: { pondId, targetMac, action, params? { speed, durationMinutes }, notes? }
 *
 * - Validates pond ownership
 * - Looks up the Master for this pond to set masterMac
 * - Creates a pending EspAeratorCommand
 */
export const sendCommand = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { pondId, targetMac, action, params, notes } = req.body;

    if (!pondId)     { res.status(400).json({ error: 'pondId is required' }); return; }
    if (!targetMac)  { res.status(400).json({ error: 'targetMac is required' }); return; }
    if (!action || !['ON', 'OFF', 'SPEED', 'RESET'].includes(action)) {
      res.status(400).json({ error: 'action must be ON | OFF | SPEED | RESET' }); return;
    }

    // Validate pond ownership
    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) {
      res.status(403).json({ error: 'Pond does not belong to your account' }); return;
    }

    const normalizedTarget = normalizeMac(targetMac);

    // Find the slave device
    const slave = await EspDevice.findOne({ mac: normalizedTarget, role: 'slave', isActive: true });
    if (!slave) {
      res.status(404).json({ error: 'Slave device with that MAC not found or inactive' }); return;
    }
    if (slave.pondId !== pondId) {
      res.status(400).json({ error: 'Slave device belongs to a different pond' }); return;
    }

    // Find the Master for this slave
    const master = await EspDevice.findOne({
      mac: slave.masterMac,
      role: 'master',
      isActive: true,
    });
    if (!master) {
      res.status(404).json({ error: 'No active Master device found for this slave' }); return;
    }

    const command = await new EspAeratorCommand({
      userId,
      pondId,
      masterMac: master.mac,
      targetMac: normalizedTarget,
      action,
      params: params || {},
      notes,
      status: 'pending',
      issuedAt: new Date(),
    }).save();

    res.status(201).json({
      message: 'Command queued. Master will relay it on next poll (within ~5 seconds).',
      command,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/readings/:pondId
 * App fetches latest sensor readings for a pond.
 * Query params:
 *   limit  (default 50, max 500)
 *   from   (ISO date string — start of time range)
 *   to     (ISO date string — end of time range)
 *   latest (if 'true', returns only the single most recent reading)
 */
export const getReadings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { pondId } = req.params;

    // Ownership check
    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }

    if (req.query.latest === 'true') {
      const reading = await EspSensorReading.findOne({ pondId }).sort({ recordedAt: -1 });
      res.json(reading ? [reading] : []);
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const filter: Record<string, any> = { pondId };
    if (req.query.from || req.query.to) {
      filter.recordedAt = {};
      if (req.query.from) filter.recordedAt.$gte = new Date(req.query.from as string);
      if (req.query.to)   filter.recordedAt.$lte = new Date(req.query.to as string);
    }

    const readings = await EspSensorReading.find(filter)
      .sort({ recordedAt: -1 })
      .limit(limit);

    res.json(readings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/commands/:pondId
 * App fetches command history for a pond.
 * Query params: limit (default 50), status (filter by status)
 */
export const getCommandHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { pondId } = req.params;

    // Ownership check
    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const filter: Record<string, any> = { pondId };
    if (req.query.status) filter.status = req.query.status;

    const commands = await EspAeratorCommand.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(commands);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/status/:pondId
 * Returns a real-time status summary for the pond's IoT setup:
 *   - All registered devices with online/offline, aeratorState, power, heartbeat
 *   - Latest sensor reading (with slaveReadings)
 *   - Pending commands count + details
 */
export const getPondIoTStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { pondId } = req.params;

    // Ownership check
    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }

    const [devices, latestReading, pendingCommands] = await Promise.all([
      EspDevice.find({ pondId }, { apiKey: 0 }),
      EspSensorReading.findOne({ pondId }).sort({ recordedAt: -1 }),
      EspAeratorCommand.find({ pondId, status: { $in: ['pending', 'sent'] } }).sort({ issuedAt: 1 }),
    ]);

    // A device is online if lastSeen within 30 seconds
    const thirtySecsAgo = new Date(Date.now() - 30 * 1000);

    const devicesWithStatus = devices.map(d => {
      const obj = d.toObject() as any;
      obj.online        = d.lastSeen ? d.lastSeen > thirtySecsAgo : false;
      obj.lastSeenAgo   = relativeTime(d.lastSeen);
      obj.heartbeatAgo  = relativeTime((d as any).heartbeatAt);
      return obj;
    });

    res.json({
      pondId,
      pondName:              (pond as any).name,
      devices:               devicesWithStatus,
      latestReading:         latestReading || null,
      pendingCommands:       pendingCommands.length,
      pendingCommandDetails: pendingCommands,
      serverTime:            new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
