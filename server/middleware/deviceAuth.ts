import { Request, Response, NextFunction } from 'express';
import { EspDevice } from '../db.js';

/**
 * authenticateDevice — validates the X-Device-ApiKey header.
 *
 * Used on all device-facing ESP-NOW endpoints (ingest, poll, ack).
 * On success, attaches the full EspDevice document to `req.device`.
 * On failure, responds with 401.
 *
 * Usage:
 *   router.post('/ingest', authenticateDevice, espnowController.ingest);
 */
export const authenticateDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const apiKey = req.headers['x-device-apikey'] as string | undefined;

  if (!apiKey) {
    res.status(401).json({ error: 'Missing X-Device-ApiKey header' });
    return;
  }

  try {
    const device = await EspDevice.findOne({ apiKey, isActive: true });
    if (!device) {
      res.status(401).json({ error: 'Invalid or inactive device API key' });
      return;
    }

    // Attach device to request for downstream use
    (req as any).device = device;
    next();
  } catch (err: any) {
    res.status(500).json({ error: 'Device authentication failed', detail: err.message });
  }
};

/**
 * requireMaster — ensures the authenticated device is a Master ESP32.
 * Must be used AFTER authenticateDevice.
 *
 * Usage:
 *   router.post('/ingest', authenticateDevice, requireMaster, espnowController.ingest);
 */
export const requireMaster = (req: Request, res: Response, next: NextFunction): void => {
  const device = (req as any).device;
  if (!device || device.role !== 'master') {
    res.status(403).json({ error: 'Only Master ESP32 devices can use this endpoint' });
    return;
  }
  next();
};
