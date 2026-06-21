/**
 * server/routes/masterbox.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Firmware-facing Master Box provisioning endpoint.
 *
 * No JWT required — authentication is via factoryKey in the request body.
 * Called by the Master Box ESP32 on first boot (or after factory reset)
 * to obtain its pondId + apiKey from the cloud.
 *
 * Mounted at: /api/masterbox
 *
 * POST /api/masterbox/register
 *   Body: { boxId, factoryKey, deviceType }
 *   Response 200: { success, pondId, apiKey }
 *
 * The firmware saves pondId + apiKey to NVS via saveProvisionData().
 * On every subsequent boot, NVS is read and this endpoint is NOT called.
 */

import express from 'express';
import { EspDevice } from '../db.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/masterbox/register
//
//  Called by the Master Box firmware on first boot when NVS has no apiKey.
//
//  Request body (JSON):
//    {
//      "boxId":      "MB001",
//      "deviceType": "MASTER",
//      "factoryKey": "AQUAGROW_FACTORY_2025"
//    }
//
//  Validation:
//    1. factoryKey must match FACTORY_KEY env var
//    2. deviceType must be "MASTER"
//    3. boxId must exist in the DB and be assigned to a pond
//
//  Response 200:
//    { "success": true, "pondId": "...", "apiKey": "aqg_xxx..." }
//
//  The firmware saves pondId + apiKey to NVS via saveProvisionData().
//  On every subsequent boot, NVS is read and this endpoint is NOT called.
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const { boxId, deviceType, factoryKey } = req.body || {};

    // 1. Validate factoryKey
    const expectedKey = process.env.FACTORY_KEY || 'AQUAGROW_FACTORY_2025';
    if (!factoryKey || factoryKey !== expectedKey) {
      res.status(401).json({
        success: false,
        error: 'Invalid factoryKey. Check #define FACTORY_KEY in firmware.',
      });
      return;
    }

    // 2. Validate deviceType
    if (!deviceType || String(deviceType).toUpperCase() !== 'MASTER') {
      res.status(400).json({
        success: false,
        error: 'deviceType must be "MASTER".',
      });
      return;
    }

    // 3. Validate boxId
    if (!boxId || typeof boxId !== 'string' || boxId.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'boxId is required.',
      });
      return;
    }

    // 4. Look up device — must exist and be assigned to a pond in the app
    const device = await EspDevice.findOne({
      boxId: boxId.trim(),
      isActive: true,
      role: 'master',
    });

    if (!device) {
      res.status(404).json({
        success: false,
        error: `Master Box "${boxId}" not found. Register it in the AquaGrow app first.`,
        hint:  'App → IoT → Register Device → Master Box → enter Box ID → assign to pond',
      });
      return;
    }

    if (!device.pondId || !device.apiKey) {
      res.status(409).json({
        success: false,
        error:  'Device found but not yet assigned to a pond. Complete app registration first.',
        boxId:  device.boxId,
      });
      return;
    }

    // 5. Stamp lastSeen so dashboard shows the device coming online
    await EspDevice.findByIdAndUpdate(device._id, {
      lastSeen:     new Date(),
      pairingStatus: 'assigned',
    });

    console.log(`[PROVISION] ✓ Box ${boxId} provisioned → pond ${device.pondId}`);

    // 6. Return credentials to firmware
    //    apiKey is the same field used for X-API-Key on heartbeat / poll / ingest
    res.json({
      success: true,
      pondId:  String(device.pondId),
      apiKey:  device.apiKey,   // firmware stores as NVS "apiKey" key
      boxId:   device.boxId,
    });

  } catch (err: any) {
    console.error('[PROVISION] Error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Server error during provisioning.',
    });
  }
});

export default router;
