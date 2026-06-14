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
  // Device → Server (API-Key-protected)
  ingestReadings,
  pollPendingCommand,
  acknowledgeCommand,
  heartbeat,
  // App → Server (JWT-protected)
  sendCommand,
  getReadings,
  getCommandHistory,
  getPondIoTStatus,
} from '../controllers/espnowController.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
//  DEVICE MANAGEMENT  (JWT — farmer must be logged in)
//  Base path: /api/espnow/devices
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/espnow/devices/register
 * Register a Master or Slave ESP32 to a pond.
 * Body: { pondId, mac, role, label?, masterMac?, firmwareVersion? }
 * Returns: { device, apiKey }  ← apiKey shown once, must be stored on device
 */
router.post('/devices/register', authenticate, registerDevice);

/**
 * GET /api/espnow/devices
 * List all devices owned by the authenticated farmer.
 * Query: ?pondId=<id>  (optional filter)
 */
router.get('/devices', authenticate, listDevices);

/**
 * GET /api/espnow/devices/:deviceId
 * Get details of a single device (no apiKey in response).
 */
router.get('/devices/:deviceId', authenticate, getDevice);

/**
 * DELETE /api/espnow/devices/:deviceId
 * Soft-deregister a device (marks isActive: false).
 */
router.delete('/devices/:deviceId', authenticate, deregisterDevice);

/**
 * POST /api/espnow/devices/:deviceId/rotate-key
 * Regenerate the device's API key.
 * New key must be re-flashed to the physical device.
 */
router.post('/devices/:deviceId/rotate-key', authenticate, rotateDeviceKey);

// ═══════════════════════════════════════════════════════════════════════════════
//  DEVICE → SERVER  (X-Device-ApiKey — used by ESP32 firmware)
//  These endpoints are called by the Master ESP32 over WiFi.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/espnow/ingest
 * Master pushes a batch of sensor readings.
 * Header: X-Device-ApiKey: <64-char-hex-key>
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
 *       "timestamp": "2026-06-14T05:30:00Z"  // optional, uses server time if omitted
 *     }
 *   ]
 * }
 */
router.post('/ingest', authenticateDevice, requireMaster, ingestReadings);

/**
 * GET /api/espnow/command/pending
 * Master polls for the next aerator command to relay to a slave.
 * Header: X-Device-ApiKey: <64-char-hex-key>
 * Response:
 *   { command: null }                          — no pending commands
 *   { command: { commandId, targetMac, action, params, issuedAt } }
 *
 * NOTE: Command is immediately marked as 'sent' on retrieval to prevent
 * duplicate delivery. Always call /ack after executing.
 */
router.get('/command/pending', authenticateDevice, requireMaster, pollPendingCommand);

/**
 * PATCH /api/espnow/command/:commandId/ack
 * Master confirms a command was executed (or failed) by the slave.
 * Header: X-Device-ApiKey: <64-char-hex-key>
 * Body: { status: 'confirmed' | 'failed', errorMessage?: string }
 */
router.patch('/command/:commandId/ack', authenticateDevice, requireMaster, acknowledgeCommand);

// ═══════════════════════════════════════════════════════════════════════════════
//  HEARTBEAT  (X-Device-ApiKey — Master pings every 30 s)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/espnow/heartbeat
 * Master ESP32 sends a 30-second keep-alive ping.
 * Header: X-Device-ApiKey: <64-char-hex-key>
 * Body: (empty)
 * Response: { ok: true, serverTime: "ISO string" }
 *
 * Server-side:
 *  - Updates device.lastSeen and device.heartbeatAt
 *  - Inserts a lightweight EspHeartbeat doc (TTL 2 hours)
 * A device that has not called this endpoint in > 30 s is considered offline.
 */
router.post('/heartbeat', authenticateDevice, requireMaster, heartbeat);

// ═══════════════════════════════════════════════════════════════════════════════
//  APP → SERVER  (JWT — farmer sends commands & reads data)
//  These endpoints are called by the mobile app (Ionic/Capacitor).
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/espnow/command
 * Farmer issues an aerator control command.
 * Body:
 * {
 *   "pondId": "<pondId>",
 *   "targetMac": "AA:BB:CC:DD:EE:FF",   // slave aerator MAC
 *   "action": "ON",                       // ON | OFF | SPEED | RESET
 *   "params": {
 *     "speed": 80,                         // 0-100%, for SPEED action
 *     "durationMinutes": 60                // optional timed ON
 *   },
 *   "notes": "Night-time aeration"         // optional
 * }
 */
router.post('/command', authenticate, sendCommand);

/**
 * GET /api/espnow/readings/:pondId
 * Fetch sensor readings for a pond.
 * Query params:
 *   limit   (default 50, max 500)
 *   from    (ISO date — start of range)
 *   to      (ISO date — end of range)
 *   latest  ('true' to return only the most recent reading)
 */
router.get('/readings/:pondId', authenticate, getReadings);

/**
 * GET /api/espnow/commands/:pondId
 * Fetch aerator command history for a pond.
 * Query params:
 *   limit   (default 50, max 200)
 *   status  (pending | sent | confirmed | failed | timeout)
 */
router.get('/commands/:pondId', authenticate, getCommandHistory);

/**
 * GET /api/espnow/status/:pondId
 * Get a real-time IoT status dashboard for a pond:
 *   - All registered devices with online/offline status
 *   - Latest sensor reading
 *   - Count and details of pending commands
 *
 * A device is considered "online" if lastSeen < 30 seconds ago.
 */
router.get('/status/:pondId', authenticate, getPondIoTStatus);

export default router;
