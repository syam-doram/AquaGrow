import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authenticateDevice, requireMaster } from '../middleware/deviceAuth.js';
import {
  registerDevice, listDevices, getDevice, deregisterDevice, rotateDeviceKey,
  forwardDiscover, getPendingDiscoveries, assignDevice,
  ingestReadings, pollPendingCommand, acknowledgeCommand, heartbeat,
  sendCommand, sendCommandById, getReadings, getCommandHistory, getPondIoTStatus,
} from '../controllers/espnowController.js';

const router = express.Router();

router.post('/devices/register', authenticate, registerDevice);
router.get('/devices/:pondId', authenticate, listDevices);
router.get('/device/:boxId', authenticate, getDevice);
router.delete('/devices/:boxId', authenticate, deregisterDevice);
router.post('/devices/:boxId/rotate-key', authenticate, rotateDeviceKey);

router.post('/discover', authenticateDevice, requireMaster, forwardDiscover);
router.get('/discover/pending', authenticate, getPendingDiscoveries);
router.post('/devices/assign', authenticate, assignDevice);

router.post('/reading', authenticateDevice, requireMaster, ingestReadings);
// Firmware polls this with X-API-Key to fetch the next pending command
router.get('/commands/:pondId', authenticateDevice, requireMaster, pollPendingCommand);
router.post('/ack', authenticateDevice, requireMaster, acknowledgeCommand);
router.post('/heartbeat', authenticateDevice, heartbeat);
router.post('/confirm', authenticateDevice, requireMaster, acknowledgeCommand);

router.post('/command-by-id', authenticate, sendCommandById);
router.post('/command', authenticate, sendCommand);
router.get('/readings/:pondId', authenticate, getReadings);
// App command history (JWT-protected — separate from device poll)
router.get('/command-history/:pondId', authenticate, getCommandHistory);
router.get('/status/:pondId', authenticate, getPondIoTStatus);

export default router;