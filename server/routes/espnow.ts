import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authenticateDevice, requireMaster } from '../middleware/deviceAuth.js';
import {
  // Device management (JWT-protected)
  registerDevice,
  listDevices,
  getDevice,
  deregisterDevice,
  rotateDeviceKey,
  // Auto-pairing flow
  forwardDiscover,
  getPendingDiscoveries,
  assignDevice,
  // Device → Server (API-Key-protected)
  ingestReadings,
  pollPendingCommand,
  acknowledgeCommand,
  heartbeat,
  // App → Server (JWT-protected)
  sendCommand,
  sendCommandById,
  getReadings,
  getCommandHistory,
  getPondIoTStatus,
} from '../controllers/espnowController.js';
import { EspDevice } from '../db.js';


const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
//  DEVICE MANAGEMENT  (JWT — farmer must be logged in)
//  Base path: /api/espnow/devices
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/espnow/devices/register
 * Register a Master Box or Smart Box to a pond (admin/setup flow).
 * Body: { pondId, mac, role, label?, boxId?, masterMac?, firmwareVersion? }
 * Returns: { device, apiKey }  ← apiKey shown once, store on device flash
 */
router.post('/devices/register', authenticate, registerDevice);

/**
 * GET /api/espnow/devices
 * List all devices owned by the farmer. No MAC addresses returned.
 * Query: ?pondId=<id>  (optional filter)
 */
router.get('/devices', authenticate, listDevices);

/**
 * GET /api/espnow/devices/:deviceId
 * Get details of a single device (no MAC, no apiKey).
 */
router.get('/devices/:deviceId', authenticate, getDevice);

/**
 * DELETE /api/espnow/devices/:deviceId
 * Soft-deregister a device (marks isActive: false, pairingStatus: unpaired).
 */
router.delete('/devices/:deviceId', authenticate, deregisterDevice);

/**
 * POST /api/espnow/devices/:deviceId/rotate-key
 * Regenerate the device's API key (must be re-flashed to the physical device).
 */
router.post('/devices/:deviceId/rotate-key', authenticate, rotateDeviceKey);

/**
 * POST /api/espnow/devices/assign
 * Farmer assigns a discovered Smart Box a name and device type.
 * Body: { boxId: "SB001", displayName: "Pond 1 Aerator", deviceType: "AERATOR", pondId: "..." }
 *
 * This is the core of the plug-and-play pairing flow:
 *   1. Smart Box powers on → broadcasts DISCOVER
 *   2. Master forwards to /discover
 *   3. App sees "New Device Found" from /discover/pending
 *   4. Farmer taps "Assign" → calls this endpoint
 *   5. Device appears on dashboard with friendly name
 */
router.post('/devices/assign', authenticate, assignDevice);

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTO-PAIRING  (mixed auth)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/espnow/discover
 * Master Box forwards a DISCOVER packet received from a Smart Box.
 * Header: X-Device-ApiKey (Master's key)
 * Body: { boxId: "SB001", senderMac?: "AA:BB:CC:DD:EE:FF" }
 *
 * Server queues the entry in EspDiscoverQueue for the farmer to assign.
 */
router.post('/discover', authenticateDevice, requireMaster, forwardDiscover);

/**
 * GET /api/espnow/discover/pending
 * Farmer app polls for unassigned Smart Boxes in the discover queue.
 * JWT-protected. Returns { boxId, masterId, pondId, discoveredAt } — no MACs.
 */
router.get('/discover/pending', authenticate, getPendingDiscoveries);

// ═══════════════════════════════════════════════════════════════════════════════
//  DEVICE → SERVER  (X-Device-ApiKey — used by Master ESP32 firmware)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/espnow/ingest
 * Master pushes a batch of sensor readings + per-slave telemetry.
 * Header: X-Device-ApiKey
 * Body:
 * {
 *   "readings": [{ do, ph, temp, salinity, ammonia, turbidity, tds, nitrite, nitrate,
 *                  voltage, current, powerWatts, aeratorState, timestamp? }],
 *   "slaveReadings": [
 *     { "boxId": "SB001",            // preferred identifier
 *       "aeratorState": "ON",
 *       "voltage": 218, "current": 2.8, "powerWatts": 610, "rssi": -62 }
 *   ]
 * }
 */
router.post('/ingest', authenticateDevice, requireMaster, ingestReadings);

/**
 * GET /api/espnow/command/pending
 * Master polls for the next aerator command to relay to a Smart Box.
 * Header: X-Device-ApiKey
 * Response includes targetBoxId for firmware logging (targetMac for actual ESP-NOW send).
 */
router.get('/command/pending', authenticateDevice, requireMaster, pollPendingCommand);

/**
 * PATCH /api/espnow/command/:commandId/ack
 * Master confirms a command was executed (or failed) by the Smart Box.
 * Header: X-Device-ApiKey
 * Body: { status: 'confirmed' | 'failed', errorMessage?: string }
 */
router.patch('/command/:commandId/ack', authenticateDevice, requireMaster, acknowledgeCommand);

// ═══════════════════════════════════════════════════════════════════════════════
//  HEARTBEAT  (X-Device-ApiKey — Master pings every 30 s)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/espnow/heartbeat
 * Master ESP32 sends a 30-second keep-alive ping.
 * A device that has not called this endpoint in > 30 s is considered offline.
 */
router.post('/heartbeat', authenticateDevice, requireMaster, heartbeat);

// ═══════════════════════════════════════════════════════════════════════════════
//  APP → SERVER  (JWT — farmer sends commands & reads data)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/espnow/command-by-id   ← RECOMMENDED (farmer-friendly)
 * Issue an aerator command using Box ID only — no MAC required.
 * Body:
 * {
 *   "boxId": "SB001",       // Smart Box to command
 *   "action": "ON",         // ON | OFF | SPEED | RESET
 *   "pondId": "...",        // optional (auto-resolved from boxId if omitted)
 *   "params": { "speed": 80, "durationMinutes": 60 },
 *   "notes": "Night aeration"
 * }
 */
router.post('/command-by-id', authenticate, sendCommandById);

/**
 * POST /api/espnow/command   ← Legacy (uses targetMac — kept for backward compat)
 * Prefer /command-by-id for all new integrations.
 */
router.post('/command', authenticate, sendCommand);

/**
 * GET /api/espnow/readings/:pondId
 * Fetch sensor readings for a pond.
 * Query: limit (max 500), from (ISO), to (ISO), latest ('true')
 */
router.get('/readings/:pondId', authenticate, getReadings);

/**
 * GET /api/espnow/commands/:pondId
 * Fetch command history. Returns boxId/displayName — not MAC addresses.
 * Query: limit (max 200), status (pending|sent|confirmed|failed|timeout)
 */
router.get('/commands/:pondId', authenticate, getCommandHistory);

/**
 * GET /api/espnow/status/:pondId
 * Full real-time IoT status dashboard for a pond:
 *   - All devices with boxId, displayName, online/offline, aeratorState, power
 *   - Latest sensor reading
 *   - Pending commands (with boxId/displayName, no MAC)
 *
 * A device is "online" if lastSeen < 30 seconds ago.
 */
router.get('/status/:pondId', authenticate, getPondIoTStatus);

// ═══════════════════════════════════════════════════════════════════════════════
//  FIRMWARE SELF-PROVISIONING  (no JWT — uses X-Factory-Key + X-Device-Type)
//
//  GET /api/espnow/device/:boxId
//
//  Called automatically by the Master Box firmware after WiFi connects,
//  when it has no deviceToken in NVS.
//
//  Headers:
//    X-Factory-Key : must match FACTORY_KEY env var (or 'AQUAGROW_FACTORY_2025')
//    X-Device-Type : must be 'MASTER'
//
//  Response 200:
//    { success: true, pondId: "...", deviceToken: "..." }
//
//  Firmware saves pondId + deviceToken to NVS via saveProvisionData(),
//  then uses deviceToken as the X-API-Key on all subsequent calls.
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/device/:boxId', async (req, res) => {
  try {
    const { boxId } = req.params;
    const factoryKey = req.headers['x-factory-key']  as string | undefined;
    const deviceType = req.headers['x-device-type']  as string | undefined;

    // 1. Validate factory key
    const expectedKey = process.env.FACTORY_KEY || 'AQUAGROW_FACTORY_2025';
    if (!factoryKey || factoryKey !== expectedKey) {
      res.status(401).json({ success: false, error: 'Invalid factory key' });
      return;
    }

    // 2. Validate device type
    if (!deviceType || deviceType.toUpperCase() !== 'MASTER') {
      res.status(400).json({ success: false, error: 'X-Device-Type must be MASTER' });
      return;
    }

    // 3. Look up device — must exist and have been assigned in the app
    const device = await EspDevice.findOne({ boxId, isActive: true });
    if (!device) {
      res.status(404).json({
        success: false,
        error: `Box ${boxId} not registered. Add this Box ID in the AquaGrow app first.`,
      });
      return;
    }

    if (!device.pondId || !device.apiKey) {
      res.status(409).json({
        success: false,
        error: 'Device exists but is not fully assigned to a pond yet. Complete app registration first.',
      });
      return;
    }

    // 4. Stamp lastSeen so dashboard shows device coming online
    await EspDevice.findByIdAndUpdate(device._id, {
      lastSeen: new Date(),
      ...(device.pairingStatus !== 'assigned' ? { pairingStatus: 'assigned' } : {}),
    });

    // 5. Return provisioning data — firmware key name is "deviceToken"
    res.json({
      success:     true,
      pondId:      String(device.pondId),
      deviceToken: device.apiKey,
      boxId:       device.boxId,
    });
  } catch (err: any) {
    console.error('[PROVISION]', err.message);
    res.status(500).json({ success: false, error: 'Server error during provisioning' });
  }
});

export default router;

