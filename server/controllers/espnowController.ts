import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  EspDevice,
  EspSensorReading,
  EspAeratorCommand,
  EspHeartbeat,
  EspDiscoverQueue,
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

/**
 * Strip internal MAC addresses from a device object before sending to the farmer app.
 * Box ID (e.g. SB001) and displayName are the farmer-visible identifiers.
 */
const sanitizeDeviceForApp = (obj: any): any => {
  const sanitized = { ...obj };
  // Keep MAC hidden — only expose it in a non-prominent 'technicalId' field for support use
  delete sanitized.mac;
  delete sanitized.masterMac;
  delete sanitized.apiKey;
  return sanitized;
};

// ─── Water Quality Alert Thresholds ──────────────────────────────────────────
const THRESHOLDS: Record<string, { min?: number; max?: number; label: string }> = {
  do:       { min: 4.0,  label: 'DO_LOW'       },
  ph:       { min: 7.0,  max: 8.5, label: 'PH' },
  temp:     { min: 25.0, max: 32.0, label: 'TEMP' },
  salinity: { min: 5,    max: 35,  label: 'SALINITY' },
  ammonia:  { max: 0.1,  label: 'AMMONIA_HIGH' },
  turbidity:{ max: 60,   label: 'TURBIDITY_HIGH' },
  nitrite:  { max: 1.0,  label: 'NITRITE_HIGH' },
};

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
 * Register a new Master or Smart Box for a pond.
 * Body: { pondId, mac, role, label?, boxId?, masterMac?, firmwareVersion? }
 * Response: { device, apiKey }  ← apiKey shown ONCE, store in device flash
 */
export const registerDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { pondId, mac, role, label, boxId, masterMac, firmwareVersion } = req.body;

    if (!pondId) { res.status(400).json({ error: 'pondId is required' }); return; }
    if (!mac)    { res.status(400).json({ error: 'mac (MAC address) is required' }); return; }
    if (!role || !['master', 'slave'].includes(role)) {
      res.status(400).json({ error: 'role must be "master" or "slave"' }); return;
    }
    if (role === 'slave' && !masterMac) {
      res.status(400).json({ error: 'masterMac is required for slave devices' }); return;
    }

    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) {
      res.status(403).json({ error: 'Pond does not belong to your account' }); return;
    }

    const normalizedMac = normalizeMac(mac);
    const apiKey = generateApiKey();

    // Resolve masterId from masterMac if available
    let masterId: string | undefined;
    if (masterMac) {
      const masterDevice = await EspDevice.findOne({ mac: normalizeMac(masterMac) });
      masterId = masterDevice?.boxId || undefined;
    }

    const device = await EspDevice.findOneAndUpdate(
      { mac: normalizedMac },
      {
        userId,
        pondId,
        mac: normalizedMac,
        role,
        masterMac: masterMac ? normalizeMac(masterMac) : undefined,
        masterId,
        boxId: boxId || undefined,
        displayName: label || (role === 'master' ? 'Master Box' : 'Smart Box'),
        label: label || (role === 'master' ? 'Master Box' : 'Smart Box'),
        deviceType: role === 'master' ? 'MASTER' : 'AERATOR',
        pairingStatus: boxId ? 'discovered' : 'unpaired',
        apiKey,
        firmwareVersion,
        isActive: true,
        lastSeen: null,
        heartbeatAt: null,
        aeratorState: 'UNKNOWN',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      message: 'Device registered successfully. Store the apiKey in the device flash — it will not be shown again.',
      device: {
        _id:            device._id,
        boxId:          device.boxId,
        displayName:    device.displayName,
        deviceType:     device.deviceType,
        role:           device.role,
        pondId:         device.pondId,
        firmwareVersion: device.firmwareVersion,
        isActive:       device.isActive,
        pairingStatus:  device.pairingStatus,
        createdAt:      (device as any).createdAt,
      },
      apiKey, // ← show once on registration
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/devices
 * List all devices owned by the authenticated farmer (no MAC, no apiKey).
 * Query params: pondId (optional filter)
 */
export const listDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const filter: Record<string, any> = { userId };
    if (req.query.pondId) filter.pondId = req.query.pondId;

    const devices = await EspDevice.find(filter, { apiKey: 0, mac: 0, masterMac: 0 })
      .sort({ createdAt: -1 });

    res.json(devices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/devices/:deviceId
 */
export const getDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const device = await EspDevice.findById(req.params.deviceId, { apiKey: 0, mac: 0, masterMac: 0 });
    if (!device) { res.status(404).json({ error: 'Device not found' }); return; }
    if (device.userId !== userId) { res.status(403).json({ error: 'Access denied' }); return; }

    res.json(device);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/espnow/devices/:deviceId
 * Soft deregister — marks isActive: false.
 */
export const deregisterDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const device = await EspDevice.findById(req.params.deviceId);
    if (!device) { res.status(404).json({ error: 'Device not found' }); return; }
    if (device.userId !== userId) { res.status(403).json({ error: 'Access denied' }); return; }

    await EspDevice.findByIdAndUpdate(req.params.deviceId, { isActive: false, pairingStatus: 'unpaired' });
    res.json({ success: true, message: 'Device deregistered' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/espnow/devices/:deviceId/rotate-key
 * Regenerate the device's API key.
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
//  AUTO-PAIRING: DISCOVER FLOW  (farmer app + device endpoints)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/espnow/discover
 * Master Box receives a DISCOVER broadcast from a Smart Box and forwards it here.
 * Header: X-Device-ApiKey
 * Body: { boxId: "SB001", senderMac?: "AA:BB:CC:DD:EE:FF" }
 *
 * Flow:
 *   1. Smart Box powers on → broadcasts { type:"DISCOVER", boxId:"SB001" }
 *   2. Master receives it via ESP-NOW → forwards to this endpoint
 *   3. Server upserts EspDiscoverQueue — farmer app will see "New Device Found"
 *   4. Server also upserts EspDevice with pairingStatus: 'discovered'
 */
export const forwardDiscover = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const master = (req as any).device;
    const { boxId, senderMac } = req.body;

    if (!boxId) { res.status(400).json({ error: 'boxId is required' }); return; }

    const normalizedSenderMac = senderMac ? normalizeMac(senderMac) : undefined;

    // Upsert the discover queue entry (idempotent — repeated DISCOVERs just refresh discoveredAt)
    await EspDiscoverQueue.findOneAndUpdate(
      { boxId },
      {
        boxId,
        senderMac: normalizedSenderMac,
        masterId:  master.boxId || master.mac, // use boxId if available, fallback to mac
        masterMac: master.mac,
        userId:    master.userId,
        pondId:    master.pondId,
        discoveredAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Also upsert a basic EspDevice record so the device exists in the system
    // The farmer's assign step will fill in displayName and deviceType
    const existingDevice = await EspDevice.findOne({ boxId });
    if (!existingDevice) {
      // We don't have a full apiKey yet — the device gets one when fully registered
      // For now, create a placeholder with a temporary apiKey
      const placeholderApiKey = generateApiKey();
      await EspDevice.findOneAndUpdate(
        { boxId },
        {
          boxId,
          userId:      master.userId,
          pondId:      master.pondId,
          mac:         normalizedSenderMac || `PENDING_${boxId}`, // placeholder if MAC not sent
          role:        'slave',
          masterMac:   master.mac,
          masterId:    master.boxId || undefined,
          displayName: `Smart Box ${boxId}`,
          label:       `Smart Box ${boxId}`,
          deviceType:  'AERATOR',
          pairingStatus: 'discovered',
          apiKey:      placeholderApiKey,
          isActive:    true,
          aeratorState: 'UNKNOWN',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (existingDevice.pairingStatus === 'unpaired') {
      // Update to discovered if previously unpaired
      await EspDevice.findOneAndUpdate({ boxId }, {
        pairingStatus: 'discovered',
        masterMac: master.mac,
        masterId: master.boxId || undefined,
        pondId: master.pondId,
        userId: master.userId,
        ...(normalizedSenderMac && normalizedSenderMac !== `PENDING_${boxId}` ? { mac: normalizedSenderMac } : {}),
      });
    }

    res.json({ status: 'queued', message: `DISCOVER from ${boxId} queued for farmer assignment` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/discover/pending
 * Farmer app polls for unassigned Smart Boxes (those in discover queue).
 * JWT-protected. Returns items for the authenticated farmer's ponds.
 */
export const getPendingDiscoveries = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const filter: Record<string, any> = { userId };
    if (req.query.pondId) filter.pondId = req.query.pondId;

    const entries = await EspDiscoverQueue.find(filter).sort({ discoveredAt: -1 });

    res.json(entries.map(e => ({
      boxId:        e.boxId,
      masterId:     e.masterId,
      pondId:       e.pondId,
      discoveredAt: e.discoveredAt,
      // No MAC exposed to farmer
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/espnow/devices/assign
 * Farmer assigns a discovered Smart Box a displayName, deviceType, and pond.
 * JWT-protected.
 * Body: { boxId: "SB001", displayName: "Pond 1 Aerator", deviceType: "AERATOR", pondId: "..." }
 */
export const assignDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { boxId, displayName, deviceType, pondId, role: reqRole } = req.body;

    if (!boxId)       { res.status(400).json({ error: 'boxId is required' }); return; }
    if (!displayName) { res.status(400).json({ error: 'displayName is required' }); return; }
    if (!deviceType)  { res.status(400).json({ error: 'deviceType is required' }); return; }
    if (!pondId)      { res.status(400).json({ error: 'pondId is required' }); return; }

    const validTypes = ['AERATOR', 'SENSOR', 'FEEDER', 'PUMP', 'CUSTOM', 'MASTER'];
    if (!validTypes.includes(deviceType)) {
      res.status(400).json({ error: `deviceType must be one of: ${validTypes.join(', ')}` }); return;
    }

    // Verify pond ownership
    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) {
      res.status(403).json({ error: 'Pond does not belong to your account' }); return;
    }

    // Derive role — explicit body.role takes priority, then infer from deviceType
    const isMaster = deviceType === 'MASTER' || reqRole === 'master';
    const role     = isMaster ? 'master' : 'slave';

    // Check if this device already exists (previously discovered via ESP-NOW)
    const existing = await EspDevice.findOne({ boxId });

    // Generate a fresh API key for brand new registrations.
    // If device was already discovered via ESP-NOW it already has a key — keep it.
    const freshApiKey = generateApiKey();

    const updated = await EspDevice.findOneAndUpdate(
      { boxId },
      {
        $set: {
          displayName,
          label:         displayName,
          deviceType,
          pondId,
          userId,
          role,
          pairingStatus: 'assigned',
          isActive:      true,
          aeratorState:  'UNKNOWN',
        },
        // $setOnInsert only runs on upsert-create, not on update of existing doc
        $setOnInsert: {
          apiKey: freshApiKey,
          // Placeholder MAC — replaced when device physically connects via ESP-NOW
          mac: `APP_REG_${boxId}`,
        },
      },
      { upsert: true, new: true }
    );

    // Remove from discover queue if it was there
    await EspDiscoverQueue.deleteOne({ boxId });

    // Determine which API key to show (existing or freshly generated)
    const apiKeyToShow = existing?.apiKey || freshApiKey;

    res.json({
      message: isMaster
        ? `Master Box "${displayName}" registered! Copy the apiKey into DEVICE_API_KEY in your firmware.`
        : `${displayName} assigned successfully!`,
      device: {
        _id:           updated!._id,
        boxId:         updated!.boxId,
        displayName:   updated!.displayName,
        deviceType:    updated!.deviceType,
        role:          updated!.role,
        pondId:        updated!.pondId,
        isActive:      updated!.isActive,
        pairingStatus: updated!.pairingStatus,
        createdAt:     (updated as any).createdAt,
      },
      // apiKey returned ONLY for Master Box — user must copy this into firmware
      ...(isMaster ? { apiKey: apiKeyToShow } : {}),
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
 * Header: X-Device-ApiKey
 */
export const heartbeat = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const device = (req as any).device;
    const now = new Date();

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
 * Header: X-Device-ApiKey
 * Body:
 * {
 *   "readings": [ { do, ph, temp, salinity, ammonia, turbidity, tds, nitrite, nitrate,
 *                   voltage, current, powerWatts, aeratorState, timestamp? } ],
 *   "slaveReadings": [
 *     { "boxId": "SB001",  // preferred — or fallback to mac
 *       "mac": "AA:...",   // optional, used only if boxId absent
 *       "aeratorState": "ON", "voltage": 218, "current": 2.8, "powerWatts": 610, "rssi": -62 }
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
              mac:          s.mac ? normalizeMac(s.mac) : undefined,
              boxId:        s.boxId,      // box ID from firmware
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

    // Update Master device lastSeen + power state
    const latestReading = readings[readings.length - 1];
    const masterUpdate: Record<string, any> = { lastSeen: now };
    if (latestReading.voltage   != null) masterUpdate.voltage     = latestReading.voltage;
    if (latestReading.current   != null) masterUpdate.current     = latestReading.current;
    if (latestReading.powerWatts != null) masterUpdate.powerWatts = latestReading.powerWatts;
    if (latestReading.aeratorState)      masterUpdate.aeratorState = latestReading.aeratorState;

    // Update each Slave device state — match by boxId first, fallback to MAC
    const slaveOps: any[] = [];
    if (Array.isArray(slaveReadings) && slaveReadings.length > 0) {
      for (const s of slaveReadings) {
        const slaveSet: Record<string, any> = { lastSeen: now };
        if (s.aeratorState)    slaveSet.aeratorState  = s.aeratorState;
        if (s.voltage  != null) slaveSet.voltage      = s.voltage;
        if (s.current  != null) slaveSet.current      = s.current;
        if (s.powerWatts != null) slaveSet.powerWatts = s.powerWatts;
        if (s.rssi     != null) slaveSet.signalStrength = s.rssi;

        // Prefer boxId lookup, fall back to mac lookup
        if (s.boxId) {
          slaveOps.push({ updateOne: { filter: { boxId: s.boxId, isActive: true }, update: { $set: slaveSet } } });
        } else if (s.mac) {
          slaveOps.push({ updateOne: { filter: { mac: normalizeMac(s.mac), isActive: true }, update: { $set: slaveSet } } });
        }
      }
    }

    await Promise.all([
      EspDevice.findByIdAndUpdate(device._id, masterUpdate),
      slaveOps.length > 0 ? EspDevice.bulkWrite(slaveOps) : Promise.resolve(),
    ]);

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
 * Master ESP32 polls for the next undelivered command.
 * Header: X-Device-ApiKey
 * Returns targetBoxId in addition to targetMac so firmware can log Box ID.
 */
export const pollPendingCommand = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const device = (req as any).device;

    // Auto-timeout stale pending commands (>5 minutes)
    const timeoutBefore = new Date(Date.now() - 5 * 60 * 1000);
    await EspAeratorCommand.updateMany(
      { masterMac: device.mac, status: 'pending', issuedAt: { $lt: timeoutBefore } },
      { status: 'timeout' }
    );

    const command = await EspAeratorCommand.findOneAndUpdate(
      { masterMac: device.mac, status: 'pending' },
      { status: 'sent', sentAt: new Date() },
      { sort: { issuedAt: 1 }, new: true }
    );

    await EspDevice.findByIdAndUpdate(device._id, { lastSeen: new Date() });

    if (!command) {
      res.json({ command: null });
      return;
    }

    res.json({
      command: {
        commandId:         command._id,
        targetMac:         command.targetMac,         // for ESP-NOW routing
        targetBoxId:       command.targetBoxId,       // informational
        targetDisplayName: command.targetDisplayName, // informational
        action:            command.action,
        params:            command.params,
        issuedAt:          command.issuedAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/espnow/command/:commandId/ack
 * Master confirms a command was executed (or failed) by the slave.
 * Header: X-Device-ApiKey
 * Body: { status: 'confirmed' | 'failed', errorMessage? }
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
    if (command.masterMac !== device.mac) {
      res.status(403).json({ error: 'This command does not belong to your device' }); return;
    }

    const update: Record<string, any> = { status, confirmedAt: new Date() };
    if (errorMessage) update.errorMessage = errorMessage;

    const [updated] = await Promise.all([
      EspAeratorCommand.findByIdAndUpdate(commandId, update, { new: true }),
      EspDevice.findByIdAndUpdate(device._id, { lastSeen: new Date() }),
    ]);

    // On confirmed ACK: flip the slave device's live aeratorState
    if (status === 'confirmed') {
      const newAeratorState =
        command.action === 'ON'   ? 'ON'  :
        command.action === 'OFF'  ? 'OFF' :
        command.action === 'RESET'? 'OFF' :
        undefined;

      if (newAeratorState) {
        // Update by boxId if available, otherwise by MAC
        if (command.targetBoxId) {
          await EspDevice.updateOne({ boxId: command.targetBoxId, isActive: true }, { aeratorState: newAeratorState });
        } else {
          await EspDevice.updateOne({ mac: command.targetMac, isActive: true }, { aeratorState: newAeratorState });
        }
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
 * Legacy command endpoint — accepts targetMac for backward compat.
 * Prefer /command-by-id for new integrations.
 */
export const sendCommand = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { pondId, targetMac, action, params, notes } = req.body;

    if (!pondId)    { res.status(400).json({ error: 'pondId is required' }); return; }
    if (!targetMac) { res.status(400).json({ error: 'targetMac is required' }); return; }
    if (!action || !['ON', 'OFF', 'SPEED', 'RESET'].includes(action)) {
      res.status(400).json({ error: 'action must be ON | OFF | SPEED | RESET' }); return;
    }

    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) {
      res.status(403).json({ error: 'Pond does not belong to your account' }); return;
    }

    const normalizedTarget = normalizeMac(targetMac);
    const slave = await EspDevice.findOne({ mac: normalizedTarget, role: 'slave', isActive: true });
    if (!slave) {
      res.status(404).json({ error: 'Slave device with that MAC not found or inactive' }); return;
    }
    if (slave.pondId !== pondId) {
      res.status(400).json({ error: 'Slave device belongs to a different pond' }); return;
    }

    const master = await EspDevice.findOne({ mac: slave.masterMac, role: 'master', isActive: true });
    if (!master) {
      res.status(404).json({ error: 'No active Master device found for this slave' }); return;
    }

    const command = await new EspAeratorCommand({
      userId,
      pondId,
      masterMac:        master.mac,
      targetMac:        normalizedTarget,
      targetBoxId:      slave.boxId,
      targetDisplayName: slave.displayName || slave.label,
      action,
      params:   params || {},
      notes,
      status:   'pending',
      issuedAt: new Date(),
    }).save();

    res.status(201).json({
      message: 'Command queued. Master will relay it on next poll (within ~5 seconds).',
      command: {
        _id:               command._id,
        targetBoxId:       command.targetBoxId,
        targetDisplayName: command.targetDisplayName,
        action:            command.action,
        status:            command.status,
        issuedAt:          command.issuedAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/espnow/command-by-id
 * Send an aerator command using Box ID — the farmer-friendly endpoint.
 * Body: { boxId: "SB001", action: "ON", pondId?, params?, notes? }
 *
 * The app never needs to know MAC addresses — just the Box ID.
 */
export const sendCommandById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { boxId, action, pondId: reqPondId, params, notes } = req.body;

    if (!boxId)   { res.status(400).json({ error: 'boxId is required (e.g. SB001)' }); return; }
    if (!action || !['ON', 'OFF', 'SPEED', 'RESET'].includes(action)) {
      res.status(400).json({ error: 'action must be ON | OFF | SPEED | RESET' }); return;
    }

    // Find the device by Box ID
    const slave = await EspDevice.findOne({ boxId, role: 'slave', isActive: true });
    if (!slave) {
      res.status(404).json({ error: `No active Smart Box found with boxId: ${boxId}` }); return;
    }

    const pondId = reqPondId || slave.pondId;

    // Verify pond ownership
    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) {
      res.status(403).json({ error: 'Pond does not belong to your account' }); return;
    }

    // Find Master by MAC or masterId
    const master = slave.masterMac
      ? await EspDevice.findOne({ mac: slave.masterMac, role: 'master', isActive: true })
      : slave.masterId
      ? await EspDevice.findOne({ boxId: slave.masterId, role: 'master', isActive: true })
      : null;

    if (!master) {
      res.status(404).json({ error: `No active Master Box found for Smart Box ${boxId}` }); return;
    }

    const command = await new EspAeratorCommand({
      userId,
      pondId,
      masterMac:         master.mac,
      targetMac:         slave.mac,
      targetBoxId:       slave.boxId,
      targetDisplayName: slave.displayName || slave.label || `Smart Box ${boxId}`,
      action,
      params:   params || {},
      notes,
      status:   'pending',
      issuedAt: new Date(),
    }).save();

    res.status(201).json({
      message: `Command sent to ${slave.displayName || boxId}. Master will relay within ~5 seconds.`,
      command: {
        _id:               command._id,
        targetBoxId:       command.targetBoxId,
        targetDisplayName: command.targetDisplayName,
        action:            command.action,
        status:            command.status,
        issuedAt:          command.issuedAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/readings/:pondId
 * App fetches latest sensor readings for a pond.
 */
export const getReadings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { pondId } = req.params;

    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) { res.status(403).json({ error: 'Access denied' }); return; }

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

    const readings = await EspSensorReading.find(filter).sort({ recordedAt: -1 }).limit(limit);
    res.json(readings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/commands/:pondId
 * App fetches command history for a pond.
 * Returns farmer-friendly fields (boxId, displayName) — not MAC addresses.
 */
export const getCommandHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { pondId } = req.params;

    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) { res.status(403).json({ error: 'Access denied' }); return; }

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const filter: Record<string, any> = { pondId };
    if (req.query.status) filter.status = req.query.status;

    const commands = await EspAeratorCommand.find(
      filter,
      { masterMac: 0, targetMac: 0 } // suppress internal MAC fields
    ).sort({ createdAt: -1 }).limit(limit);

    res.json(commands);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/espnow/status/:pondId
 * Full real-time IoT status for a pond — used by the app dashboard.
 * Returns devices with boxId/displayName, NOT MAC addresses.
 */
export const getPondIoTStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) { dbOffline(res); return; }

    const userId = (req as any).user?.id;
    const { pondId } = req.params;

    const pond = await PondMongo.findById(pondId);
    if (!pond) { res.status(404).json({ error: 'Pond not found' }); return; }
    if (String(pond.userId) !== userId) { res.status(403).json({ error: 'Access denied' }); return; }

    const [devices, latestReading, pendingCommands] = await Promise.all([
      EspDevice.find({ pondId }, { apiKey: 0, mac: 0, masterMac: 0 }), // strip internal fields
      EspSensorReading.findOne({ pondId }).sort({ recordedAt: -1 }),
      EspAeratorCommand.find(
        { pondId, status: { $in: ['pending', 'sent'] } },
        { masterMac: 0, targetMac: 0 } // strip internal fields
      ).sort({ issuedAt: 1 }),
    ]);

    const thirtySecsAgo = new Date(Date.now() - 30 * 1000);

    const devicesWithStatus = devices.map(d => {
      const obj = d.toObject() as any;
      obj.online       = d.lastSeen ? d.lastSeen > thirtySecsAgo : false;
      obj.lastSeenAgo  = relativeTime(d.lastSeen);
      obj.heartbeatAgo = relativeTime((d as any).heartbeatAt);
      // Ensure every device has a human-readable name
      obj.displayName  = d.displayName || d.label || (d.role === 'master' ? 'Master Box' : `Smart Box ${d.boxId || 'Unknown'}`);
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
