/**
 * aeratorPushService.ts — fixed token key
 */
import { API_BASE_URL } from '../config';
import { getAeratorStageLabel } from '../components/AeratorPopup';
import { getAccessToken } from './pushToken';

export const triggerAeratorCheckPush = async (
  pondId: string,
  pondName: string,
  doc: number,
): Promise<{ sent: boolean; simulated?: boolean }> => {
  try {
    const token = getAccessToken();
    if (!token) return { sent: false };

    const sentKey = `aerator_push_sent_${pondId}_stage${Math.ceil(doc / 20)}`;
    if (sessionStorage.getItem(sentKey)) return { sent: false };

    const stageLabel = getAeratorStageLabel(doc);
    const res = await fetch(`${API_BASE_URL}/push/aerator-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pondId, pondName, doc, stageLabel }),
    });

    const data = await res.json();
    if (data.sent || data.simulated) sessionStorage.setItem(sentKey, '1');
    return data;
  } catch (err) {
    console.warn('[AeratorPush] Failed:', err);
    return { sent: false };
  }
};

export const confirmAeratorFromNotification = async (
  pondId: string, doc: number, count: number, hp: number, positions: string[],
): Promise<boolean> => {
  try {
    const token = getAccessToken();
    if (!token) return false;
    const res = await fetch(`${API_BASE_URL}/ponds/${pondId}/aerator-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ doc, count, hp, positions, addedNew: false }),
    });
    return res.ok;
  } catch { return false; }
};

export const snoozeAeratorCheck = async (pondId: string): Promise<boolean> => {
  try {
    const token = getAccessToken();
    if (!token) return false;
    const res = await fetch(`${API_BASE_URL}/ponds/${pondId}/aerator-snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    return res.ok;
  } catch { return false; }
};

export interface AeratorNotificationData {
  type: 'aerator_check';
  pondId: string;
  pondName: string;
  doc: number;
  deepLink: string;
}

export const parseAeratorNotification = (data: Record<string, any>): AeratorNotificationData | null => {
  if (data?.type === 'aerator_check' && data?.pondId) {
    return {
      type: 'aerator_check',
      pondId: data.pondId,
      pondName: data.pondName || 'Pond',
      doc: Number(data.doc) || 0,
      deepLink: data.deepLink || `/ponds/${data.pondId}?tab=aerators`,
    };
  }
  return null;
};
