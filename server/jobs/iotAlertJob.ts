/**
 * iotAlertJob.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Background job: runs every 30 seconds and detects Smart Box / Master Box
 * devices that have gone offline (no heartbeat for > 30 seconds).
 *
 * When a device transitions from online → offline, a push notification is
 * sent to the owning farmer using their registered FCM token.
 *
 * Notification body always uses the device's displayName (e.g. "Pond 1 Aerator")
 * — never a raw MAC address.
 *
 * Usage:
 *   import { startIoTAlertJob } from './jobs/iotAlertJob.js';
 *   startIoTAlertJob(sendFCM); // call once after DB connects
 */

import mongoose from 'mongoose';
import { EspDevice, User as UserModel } from '../db.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type SendFCMFn = (token: string, payload: any) => Promise<boolean>;

// ─── State ────────────────────────────────────────────────────────────────────

/** Track which devices were online on the previous tick to detect transitions */
const prevOnlineState = new Map<string, boolean>(); // deviceId → was online

const OFFLINE_THRESHOLD_MS = 30_000; // 30 seconds

// ─── Helper ───────────────────────────────────────────────────────────────────

const getDeviceLabel = (device: any): string => {
  if (device.displayName) return device.displayName;
  if (device.label)       return device.label;
  if (device.role === 'master') return `Master Box${device.boxId ? ` (${device.boxId})` : ''}`;
  return device.boxId ? `Smart Box ${device.boxId}` : 'Unknown Device';
};

// ─── Core job ─────────────────────────────────────────────────────────────────

const runOfflineCheck = async (sendFCM: SendFCMFn): Promise<void> => {
  // Skip if DB is not ready
  if (mongoose.connection.readyState !== 1) return;

  try {
    const cutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MS);

    // Fetch all active devices with their farmer's FCM token
    const devices = await EspDevice.find({ isActive: true }).lean();

    for (const device of devices) {
      const id = String(device._id);
      const isOnline = device.lastSeen
        ? new Date(device.lastSeen) > cutoff
        : false;

      const wasOnline = prevOnlineState.get(id);

      // Only alert on the transition: was online → now offline
      const justWentOffline = wasOnline === true && isOnline === false;

      if (justWentOffline) {
        const deviceLabel = getDeviceLabel(device);
        const boxIdLabel = device.boxId ? ` (${device.boxId})` : '';

        console.log(`[IoT-Alert] ${deviceLabel}${boxIdLabel} went OFFLINE`);

        // Fetch farmer's FCM token
        const farmer = await UserModel.findById(device.userId).lean();

        if (farmer?.fcmToken) {
          const payload = {
            notification: {
              title: `⚠️ ${deviceLabel} is Offline`,
              body: `${deviceLabel}${boxIdLabel} hasn't responded in 30+ seconds. Check device connection.`,
            },
            data: {
              type: 'iot_device_offline',
              boxId: String(device.boxId || ''),
              deviceLabel,
              pondId: String(device.pondId || ''),
              deepLink: '/smart-farm?tab=iot',
            },
            android: {
              priority: 'high',
              ttl: 1800000, // 30 min TTL — stale offline alerts aren't useful
              notification: {
                channelId: 'aquagrow-iot-alerts',
                color: '#EF4444',
                icon: 'ic_stat_aquagrow',
                tag: `iot-offline-${id}`,
                sound: 'alert_sound',
                visibility: 'public',
                defaultVibrateTimings: true,
              },
            },
            apns: {
              headers: { 'apns-priority': '10', 'apns-push-type': 'alert' },
              payload: { aps: { badge: 1, sound: 'default', category: 'IOT_OFFLINE', 'content-available': 1 } },
            },
          };

          await sendFCM(farmer.fcmToken, payload);
        }
      }

      // Update state tracker
      prevOnlineState.set(id, isOnline);
    }

    // Clean up state for devices no longer in DB
    for (const id of prevOnlineState.keys()) {
      if (!devices.find(d => String(d._id) === id)) {
        prevOnlineState.delete(id);
      }
    }
  } catch (err: any) {
    // Don't crash the process on transient errors
    console.error('[IoT-Alert] Error during offline check:', err.message);
  }
};

// ─── Job starter ──────────────────────────────────────────────────────────────

let jobTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the IoT offline detection background job.
 * Call this once after the database has connected.
 *
 * @param sendFCM - The sendFCM helper from the parent server module
 */
export const startIoTAlertJob = (sendFCM: SendFCMFn): void => {
  if (jobTimer) {
    console.warn('[IoT-Alert] Job already running — skipping duplicate start');
    return;
  }

  console.log('[IoT-Alert] Starting offline detection job (30s interval)');
  // Run immediately on start to initialise prevOnlineState
  runOfflineCheck(sendFCM);
  // Then every 30 seconds
  jobTimer = setInterval(() => runOfflineCheck(sendFCM), OFFLINE_THRESHOLD_MS);
};

export const stopIoTAlertJob = (): void => {
  if (jobTimer) {
    clearInterval(jobTimer);
    jobTimer = null;
    console.log('[IoT-Alert] Offline detection job stopped');
  }
};
