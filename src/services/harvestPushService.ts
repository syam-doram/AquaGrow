/**
 * harvestPushService.ts — language-aware harvest stage push notifications
 */
import { API_BASE_URL } from '../config';
import { getAccessToken } from './pushToken';
import { getAlertTranslations } from './alertTranslations';
import type { Language } from '../types';

/** Returns stage emoji colors (display only, not translated) */
export const HARVEST_STAGE_COLORS: Record<string, string> = {
  pending:         '#6366F1',
  accepted:        '#10B981',
  quality_checked: '#0EA5E9',
  weighed:         '#F59E0B',
  rate_confirmed:  '#8B5CF6',
  harvested:       '#EC4899',
  paid:            '#22C55E',
  completed:       '#64748B',
  cancelled:       '#EF4444',
};

/** Returns stage emoji (language-independent) */
export const HARVEST_STAGE_EMOJI: Record<string, string> = {
  pending:         '📋',
  accepted:        '🤝',
  quality_checked: '🔬',
  weighed:         '⚖️',
  rate_confirmed:  '💰',
  harvested:       '🎣',
  paid:            '💸',
  completed:       '🏆',
  cancelled:       '❌',
};

/** Language-aware stage title + body builder */
export const getHarvestStageMeta = (
  status: string,
  pondName: string,
  language: Language = 'English'
): { emoji: string; title: string; body: string; color: string } | null => {
  const AT = getAlertTranslations(language);
  const stages = AT.harvest.stage as Record<string, { title: string; body: (p: string) => string }>;
  const stage  = stages[status];
  if (!stage) return null;
  return {
    emoji: HARVEST_STAGE_EMOJI[status] ?? '📋',
    title: stage.title,
    body:  stage.body(pondName),
    color: HARVEST_STAGE_COLORS[status] ?? '#6366F1',
  };
};

/** @deprecated Use getHarvestStageMeta instead. Kept for backward compatibility. */
export const HARVEST_STAGE_META: Record<string, {
  emoji: string; title: string; body: (pondName: string) => string; color: string;
}> = {
  pending:         { emoji: '📋', color: '#6366F1', title: 'Harvest Request Submitted',          body: (p) => `${p}: Your request is live. Waiting for a buyer to accept.` },
  accepted:        { emoji: '🤝', color: '#10B981', title: 'Buyer Accepted Your Order!',         body: (p) => `${p}: A buyer has accepted your harvest. Prepare for quality inspection.` },
  quality_checked: { emoji: '🔬', color: '#0EA5E9', title: 'Quality Check Completed ✓',         body: (p) => `${p}: Quality passed! Buyer is proceeding to weigh your harvest.` },
  weighed:         { emoji: '⚖️', color: '#F59E0B', title: 'Weighing Done — Rate Next',         body: (p) => `${p}: Harvest weighed. Buyer is confirming the final rate per kg.` },
  rate_confirmed:  { emoji: '💰', color: '#8B5CF6', title: 'Rate Confirmed — Harvest Starting!', body: (p) => `${p}: Final rate agreed. Physical harvest is now beginning!` },
  harvested:       { emoji: '🎣', color: '#EC4899', title: 'Harvest Done! Payment Processing',   body: (p) => `${p}: Harvest is complete! Payment is being processed.` },
  paid:            { emoji: '💸', color: '#22C55E', title: '💸 Payment Released to You!',       body: (p) => `${p}: Payment released! Check your wallet for the transfer.` },
  completed:       { emoji: '🏆', color: '#64748B', title: 'Harvest Cycle Archived',             body: (p) => `${p}: Cycle complete. Excellent work this season!` },
  cancelled:       { emoji: '❌', color: '#EF4444', title: 'Harvest Order Cancelled',            body: (p) => `${p}: Your order was cancelled. Submit a new request when ready.` },
};

export interface HarvestNotificationData {
  type: 'harvest_update';
  pondId: string;
  pondName: string;
  requestId: string;
  status: string;
  deepLink: string;
}

export const parseHarvestNotification = (data: Record<string, any>): HarvestNotificationData | null => {
  if (data?.type === 'harvest_update' && data?.pondId) {
    return {
      type: 'harvest_update',
      pondId: data.pondId,
      pondName: data.pondName || 'Pond',
      requestId: data.requestId || '',
      status: data.status || '',
      deepLink: data.deepLink || `/ponds/${data.pondId}/tracking`,
    };
  }
  return null;
};

export const sendHarvestStagePush = async (
  pondId: string,
  pondName: string,
  requestId: string,
  newStatus: string,
  language: Language = 'English',
): Promise<void> => {
  try {
    const token = getAccessToken();
    if (!token) return;

    // Deduplicate — don't resend same status push
    const dedupKey = `harvest_push_${requestId}_${newStatus}`;
    if (sessionStorage.getItem(dedupKey)) return;

    const meta = getHarvestStageMeta(newStatus, pondName, language);
    if (!meta) return;

    await fetch(`${API_BASE_URL}/push/harvest-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        pondId, pondName, requestId, status: newStatus,
        // Pass translated strings to the server so the FCM payload is in the user's language
        notificationTitle: meta.title,
        notificationBody:  meta.body,
        language,
      }),
    });

    sessionStorage.setItem(dedupKey, '1');
  } catch (err) {
    console.warn('[HarvestPush] Failed:', err);
  }
};
