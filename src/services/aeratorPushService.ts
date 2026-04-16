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

    // Use localStorage + daily date stamp so the push fires at most ONCE per stage per day,
    // even if the farmer restarts the app multiple times (sessionStorage was clearing on restart).
    const todayDate = new Date().toISOString().split('T')[0];
    const sentKey = `aerator_push_sent_${pondId}_stage${Math.ceil(doc / 20)}_${todayDate}`;
    if (localStorage.getItem(sentKey)) return { sent: false };

    const stageLabel = getAeratorStageLabel(doc);
    const res = await fetch(`${API_BASE_URL}/push/aerator-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pondId, pondName, doc, stageLabel }),
    });

    const data = await res.json();
    if (data.sent || data.simulated) localStorage.setItem(sentKey, '1');
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
