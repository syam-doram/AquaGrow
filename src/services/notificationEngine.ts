// ─────────────────────────────────────────────────────────────────────────────
// AquaGrow · Smart Notification Engine
// Generates context-aware, time-sensitive alerts based on:
//   - Pond water quality (DO, pH, ammonia)
//   - Feed over-limit and tray residue
//   - Weather risk (heat, rain, AQI)
//   - Harvest readiness and caution windows
//   - Disease outbreak early warnings
//   - Market price spikes
// ─────────────────────────────────────────────────────────────────────────────

export type AlertCategory =
  | 'pond_danger'
  | 'feed'
  | 'weather'
  | 'harvest'
  | 'disease'
  | 'market'
  | 'lunar'
  | 'tip'
  | 'system';

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SmartAlert {
  id: string;
  category: AlertCategory;
  priority: AlertPriority;
  title: string;
  body: string;
  action?: string;         // CTA text
  actionRoute?: string;    // Navigate route
  pondId?: string;
  pondName?: string;
  icon: string;            // emoji icon
  timestamp: number;
  isRead: boolean;
  isSuppressed?: boolean;  // user dismissed
}

export interface NotificationPrefs {
  pond_danger: boolean;
  feed: boolean;
  weather: boolean;
  harvest: boolean;
  disease: boolean;
  market: boolean;
  lunar: boolean;
  tips: boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  pond_danger: true,
  feed: true,
  weather: true,
  harvest: true,
  disease: true,
  market: false,
  lunar: true,
  tips: true,
};

// ─── LUNAR PHASE CALCULATOR ────────────────────────────────────────────────
// Uses the synodic period of the moon (29.53059 days) anchored to a
// known new moon reference date (2000-01-06 UTC).
export type LunarPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export interface LunarPhase {
  name: LunarPhaseName;
  age: number;          // days since last new moon (0–29.53)
  illumination: number; // 0–100 %
  emoji: string;
  daysTillFull: number;
  daysTillNew: number;
}

export function getLunarPhase(date: Date = new Date()): LunarPhase {
  const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();
  const SYNODIC = 29.53059;   // days
  const MS_PER_DAY = 86400000;

  const elapsed = (date.getTime() - KNOWN_NEW_MOON) / MS_PER_DAY;
  const age = ((elapsed % SYNODIC) + SYNODIC) % SYNODIC;
  const illum = Math.round((1 - Math.cos((age / SYNODIC) * 2 * Math.PI)) / 2 * 100);

  const daysTillFull = age <= SYNODIC / 2
    ? SYNODIC / 2 - age
    : SYNODIC + SYNODIC / 2 - age;
  const daysTillNew = SYNODIC - age;

  let name: LunarPhaseName;
  let emoji: string;

  if (age < 1.85) { name = 'New Moon'; emoji = '🌑'; }
  else if (age < SYNODIC * 0.25 - 1) { name = 'Waxing Crescent'; emoji = '🌒'; }
  else if (age < SYNODIC * 0.25 + 1) { name = 'First Quarter'; emoji = '🌓'; }
  else if (age < SYNODIC * 0.50 - 1) { name = 'Waxing Gibbous'; emoji = '🌔'; }
  else if (age < SYNODIC * 0.50 + 1) { name = 'Full Moon'; emoji = '🌕'; }
  else if (age < SYNODIC * 0.75 - 1) { name = 'Waning Gibbous'; emoji = '🌖'; }
  else if (age < SYNODIC * 0.75 + 1) { name = 'Last Quarter'; emoji = '🌗'; }
  else { name = 'Waning Crescent'; emoji = '🌘'; }

  return { name, age: Math.round(age * 10) / 10, illumination: illum, emoji, daysTillFull: Math.round(daysTillFull), daysTillNew: Math.round(daysTillNew) };
}

import { getAlertTranslations } from './alertTranslations';
import type { Language } from '../types';

// ─── ENGINE ────────────────────────────────────────────────────────────────────
export function generateSmartAlerts(params: {
  ponds: any[];
  waterRecords: any[];
  feedRecords: any[];
  marketPrices: any[];
  prefs: NotificationPrefs;
  language?: Language;
  hour?: number;
}): SmartAlert[] {

  const { ponds, waterRecords, feedRecords, marketPrices, prefs } = params;
  const AT = getAlertTranslations(params.language ?? 'English');
  const now = new Date();
  const hour = params.hour ?? now.getHours();
  const alerts: SmartAlert[] = [];

  const uid = () => `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. POND DANGER — Water Quality Out of Range
  // ──────────────────────────────────────────────────────────────────────────
  if (prefs.pond_danger) {
    for (const pond of ponds.filter(p => p.status === 'active')) {
      const records = waterRecords
        .filter((r: any) => r.pondId === pond.id)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = records[0];
      if (!latest) continue;

      const doc = pond.stockingDate
        ? Math.floor((Date.now() - new Date(pond.stockingDate).getTime()) / 86400000)
        : 0;

      // DO critical
      if (latest.do !== undefined && latest.do < 3) {
        alerts.push({
          id: uid(), category: 'pond_danger', priority: 'critical',
          title: AT.pondDanger.criticalDO.title(pond.name, latest.do),
          body: AT.pondDanger.criticalDO.body(pond.name, latest.do),
          action: AT.actions.viewPond, actionRoute: `/pond/${pond.id}`,
          pondId: pond.id, pondName: pond.name,
          icon: '🚨', timestamp: Date.now(), isRead: false,
        });
      } else if (latest.do !== undefined && latest.do < 4.5) {
        alerts.push({
          id: uid(), category: 'pond_danger', priority: 'high',
          title: AT.pondDanger.lowDO.title(pond.name, latest.do),
          body: AT.pondDanger.lowDO.body(pond.name, latest.do),
          action: AT.actions.logWater, actionRoute: `/logs/conditions`,
          pondId: pond.id, pondName: pond.name,
          icon: '⚠️', timestamp: Date.now(), isRead: false,
        });
      }

      // pH out of range
      if (latest.ph !== undefined) {
        if (latest.ph < 7.0 || latest.ph > 9.0) {
          alerts.push({
            id: uid(), category: 'pond_danger', priority: 'critical',
            title: AT.pondDanger.pHCritical.title(pond.name, latest.ph),
            body: AT.pondDanger.pHCritical.body(pond.name, latest.ph),
            action: AT.actions.logConditions, actionRoute: `/logs/conditions`,
            pondId: pond.id, pondName: pond.name,
            icon: '🔴', timestamp: Date.now(), isRead: false,
          });
        } else if (latest.ph < 7.5 || latest.ph > 8.5) {
          alerts.push({
            id: uid(), category: 'pond_danger', priority: 'medium',
            title: AT.pondDanger.pHDrifting.title(pond.name, latest.ph),
            body: AT.pondDanger.pHDrifting.body(pond.name, latest.ph),
            action: AT.actions.logWater, actionRoute: `/logs/conditions`,
            pondId: pond.id, pondName: pond.name,
            icon: '🟡', timestamp: Date.now(), isRead: false,
          });
        }
      }

      // Ammonia too high
      if (latest.ammonia !== undefined && latest.ammonia > 0.3) {
        alerts.push({
          id: uid(), category: 'pond_danger', priority: 'high',
          title: AT.pondDanger.highAmmonia.title(pond.name, latest.ammonia),
          body: AT.pondDanger.highAmmonia.body(pond.name, latest.ammonia),
          action: AT.actions.logTreatment, actionRoute: `/logs/conditions`,
          pondId: pond.id, pondName: pond.name,
          icon: '☠️', timestamp: Date.now(), isRead: false,
        });
      }

      // WSSV risk window
      if (doc >= 25 && doc <= 35) {
        alerts.push({
          id: uid(), category: 'disease', priority: 'medium',
          title: AT.pondDanger.wssVRisk.title(pond.name, doc),
          body: AT.pondDanger.wssVRisk.body(pond.name, doc),
          action: AT.actions.scanShrimp, actionRoute: `/disease-detection`,
          pondId: pond.id, pondName: pond.name,
          icon: '🦠', timestamp: Date.now(), isRead: false,
        });
      }

      // Mortality spike
      if (latest.mortality !== undefined && latest.mortality > 50) {
        alerts.push({
          id: uid(), category: 'pond_danger', priority: 'critical',
          title: AT.pondDanger.highMortality.title(pond.name, latest.mortality),
          body: AT.pondDanger.highMortality.body(pond.name, latest.mortality),
          action: AT.actions.callExpert, actionRoute: `/consultations`,
          pondId: pond.id, pondName: pond.name,
          icon: '💀', timestamp: Date.now(), isRead: false,
        });
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. FEED ALERTS
  // ──────────────────────────────────────────────────────────────────────────
  if (prefs.feed) {
    // Morning feed reminder
    if (hour >= 5 && hour <= 7) {
      for (const pond of ponds.filter(p => p.status === 'active')) {
        alerts.push({
          id: uid(), category: 'feed', priority: 'medium',
          title: AT.feed.morningFeed.title(pond.name),
          body: AT.feed.morningFeed.body(pond.name),
          action: AT.actions.logFeed, actionRoute: `/logs/feed`,
          pondId: pond.id, pondName: pond.name,
          icon: '🍤', timestamp: Date.now(), isRead: false,
        });
      }
    }

    // Evening feed reminder
    if (hour >= 17 && hour <= 19) {
      for (const pond of ponds.filter(p => p.status === 'active')) {
        alerts.push({
          id: uid(), category: 'feed', priority: 'low',
          title: AT.feed.eveningFeed.title(pond.name),
          body: AT.feed.eveningFeed.body(pond.name),
          action: AT.actions.logFeed, actionRoute: `/logs/feed`,
          pondId: pond.id, pondName: pond.name,
          icon: '🌆', timestamp: Date.now(), isRead: false,
        });
      }
    }

    // FCR warning
    for (const pond of ponds.filter(p => p.status === 'active')) {
      const pondFeeds = feedRecords.filter((f: any) => f.pondId === pond.id);
      const totalFeed = pondFeeds.reduce((s: number, f: any) => s + (f.quantity || 0), 0);
      const biomass = (pond.seedCount || 0) * ((pond.currentWeight || 0) / 1000);
      if (totalFeed > 0 && biomass > 0) {
        const fcr = totalFeed / biomass;
        if (fcr > 2.0) {
          alerts.push({
            id: uid(), category: 'feed', priority: 'high',
            title: AT.feed.fcrHigh.title(pond.name, fcr),
            body: AT.feed.fcrHigh.body(pond.name, fcr),
            action: AT.actions.reviewFeedLog, actionRoute: `/logs/feed`,
            pondId: pond.id, pondName: pond.name,
            icon: '📈', timestamp: Date.now(), isRead: false,
          });
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. WEATHER ALERTS
  // ──────────────────────────────────────────────────────────────────────────
  if (prefs.weather) {
    const month = now.getMonth();

    if (hour >= 3 && hour <= 5) {
      alerts.push({
        id: uid(), category: 'weather', priority: 'high',
        title: AT.weather.preDawnDO.title,
        body: AT.weather.preDawnDO.body,
        action: AT.actions.logWater, actionRoute: '/logs/conditions',
        icon: '🌙', timestamp: Date.now(), isRead: false,
      });
    }

    if (month >= 5 && month <= 8 && hour >= 6 && hour <= 9) {
      alerts.push({
        id: uid(), category: 'weather', priority: 'medium',
        title: AT.weather.monsoonMorning.title,
        body: AT.weather.monsoonMorning.body,
        action: AT.actions.logWater, actionRoute: '/logs/conditions',
        icon: '🌧️', timestamp: Date.now(), isRead: false,
      });
    }

    if (month >= 2 && month <= 4 && hour >= 11 && hour <= 15) {
      alerts.push({
        id: uid(), category: 'weather', priority: 'medium',
        title: AT.weather.summerHeat.title,
        body: AT.weather.summerHeat.body,
        action: AT.actions.logFeed, actionRoute: '/logs/feed',
        icon: '☀️', timestamp: Date.now(), isRead: false,
      });
    }

    if (month >= 11 || month <= 1) {
      alerts.push({
        id: uid(), category: 'weather', priority: 'high',
        title: AT.weather.winterWSSV.title,
        body: AT.weather.winterWSSV.body,
        action: AT.actions.scanShrimp, actionRoute: '/disease-detection',
        icon: '🥶', timestamp: Date.now(), isRead: false,
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. HARVEST ALERTS
  // ──────────────────────────────────────────────────────────────────────────
  if (prefs.harvest) {
    for (const pond of ponds.filter(p => p.status === 'active')) {
      const doc = pond.stockingDate
        ? Math.floor((Date.now() - new Date(pond.stockingDate).getTime()) / 86400000)
        : 0;

      if (doc >= 85 && doc <= 95 && pond.species === 'Vannamei') {
        alerts.push({
          id: uid(), category: 'harvest', priority: 'high',
          title: AT.harvest.vannameiWindow.title(pond.name, doc),
          body: AT.harvest.vannameiWindow.body(pond.name, doc),
          action: AT.actions.viewMarket, actionRoute: '/market',
          pondId: pond.id, pondName: pond.name,
          icon: '🦐', timestamp: Date.now(), isRead: false,
        });
      }

      if (doc >= 120 && doc <= 150 && pond.species === 'Tiger') {
        alerts.push({
          id: uid(), category: 'harvest', priority: 'high',
          title: AT.harvest.tigerWindow.title(pond.name, doc),
          body: AT.harvest.tigerWindow.body(pond.name, doc),
          action: AT.actions.startHarvest, actionRoute: `/pond/${pond.id}`,
          pondId: pond.id, pondName: pond.name,
          icon: '🦞', timestamp: Date.now(), isRead: false,
        });
      }

      if ((doc >= 80 && doc <= 84 && pond.species === 'Vannamei') ||
        (doc >= 115 && doc <= 119 && pond.species === 'Tiger')) {
        alerts.push({
          id: uid(), category: 'harvest', priority: 'medium',
          title: AT.harvest.preHarvestPrep.title(pond.name, doc),
          body: AT.harvest.preHarvestPrep.body(pond.name, doc),
          action: AT.actions.harvestGuide, actionRoute: `/pond/${pond.id}`,
          pondId: pond.id, pondName: pond.name,
          icon: '📋', timestamp: Date.now(), isRead: false,
        });
      }

      if ((doc > 100 && pond.species === 'Vannamei') || (doc > 160 && pond.species === 'Tiger')) {
        alerts.push({
          id: uid(), category: 'harvest', priority: 'critical',
          title: AT.harvest.overAge.title(pond.name, doc),
          body: AT.harvest.overAge.body(pond.name, doc),
          action: AT.actions.emgHarvest, actionRoute: `/pond/${pond.id}`,
          pondId: pond.id, pondName: pond.name,
          icon: '⏰', timestamp: Date.now(), isRead: false,
        });
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. DISEASE EARLY WARNINGS
  // ──────────────────────────────────────────────────────────────────────────
  if (prefs.disease) {
    for (const pond of ponds.filter(p => p.status === 'active')) {
      const doc = pond.stockingDate
        ? Math.floor((Date.now() - new Date(pond.stockingDate).getTime()) / 86400000)
        : 0;
      const records = waterRecords
        .filter((r: any) => r.pondId === pond.id)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = records[0];

      if (doc >= 7 && doc <= 30) {
        alerts.push({
          id: uid(), category: 'disease', priority: 'medium',
          title: AT.disease.emsRisk.title(pond.name, doc),
          body: AT.disease.emsRisk.body(pond.name, doc),
          action: AT.actions.scanShrimp, actionRoute: '/disease-detection',
          pondId: pond.id, pondName: pond.name,
          icon: '🔬', timestamp: Date.now(), isRead: false,
        });
      }

      if (latest && latest.do !== undefined && latest.do < 4.5 && doc >= 20) {
        alerts.push({
          id: uid(), category: 'disease', priority: 'medium',
          title: AT.disease.whiteGutRisk.title(pond.name),
          body: AT.disease.whiteGutRisk.body(pond.name, doc),
          action: AT.actions.scanShrimp, actionRoute: '/disease-detection',
          pondId: pond.id, pondName: pond.name,
          icon: '🧬', timestamp: Date.now(), isRead: false,
        });
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. MARKET ALERTS
  // ──────────────────────────────────────────────────────────────────────────
  if (prefs.market && marketPrices.length > 0) {
    const highDemand = marketPrices.filter((p: any) => p.demand === 'HIGH');
    if (highDemand.length > 0) {
      const best = highDemand.sort((a: any, b: any) => b.price - a.price)[0];
      alerts.push({
        id: uid(), category: 'market', priority: 'medium',
        title: AT.market.priceSpike.title(best.price, best.shrimpSize),
        body: AT.market.priceSpike.body(best.price, best.location, best.shrimpSize),
        action: AT.actions.viewMarket, actionRoute: '/market',
        icon: '📊', timestamp: Date.now(), isRead: false,
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. DAILY TIPS
  // ──────────────────────────────────────────────────────────────────────────
  if (prefs.tips) {
    type TipEntry = [number, number, { title: string; body: string }];
    const tips: TipEntry[] = [
      [5, 7, AT.tips.morning],
      [9, 11, AT.tips.trayCheck],
      [20, 22, AT.tips.nightAeration],
      [6, 8, AT.tips.logData],
    ];
    for (const [sh, eh, tip] of tips) {
      if (hour >= sh && hour <= eh) {
        alerts.push({
          id: uid(), category: 'tip', priority: 'info',
          title: tip.title, body: tip.body,
          action: AT.actions.viewSOP, actionRoute: '/logs/sop',
          icon: '💡', timestamp: Date.now(), isRead: false,
        });
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. LUNAR ALERTS
  // ──────────────────────────────────────────────────────────────────────────
  if (prefs.lunar) {
    const lunar = getLunarPhase(now);
    const activePonds = ponds.filter(p => p.status === 'active');

    switch (lunar.name) {
      case 'New Moon':
        alerts.push({
          id: uid(), category: 'lunar', priority: 'high',
          title: AT.lunar.newMoon.global.title,
          body: AT.lunar.newMoon.global.body(lunar.age),
          action: AT.actions.logFeed, actionRoute: '/logs/feed',
          icon: '🌑', timestamp: Date.now(), isRead: false,
        });
        for (const pond of activePonds) {
          alerts.push({
            id: uid(), category: 'lunar', priority: 'medium',
            title: AT.lunar.newMoon.perPond.title(pond.name),
            body: AT.lunar.newMoon.perPond.body,
            action: AT.actions.logTreatment, actionRoute: '/logs/conditions',
            pondId: pond.id, pondName: pond.name,
            icon: '🌑', timestamp: Date.now(), isRead: false,
          });
        }
        break;

      case 'Waxing Crescent':
        alerts.push({
          id: uid(), category: 'lunar', priority: 'medium',
          title: AT.lunar.waxingCrescent.title,
          body: AT.lunar.waxingCrescent.body(lunar.age),
          action: AT.actions.logWater, actionRoute: '/logs/conditions',
          icon: '🌒', timestamp: Date.now(), isRead: false,
        });
        break;

      case 'First Quarter':
        alerts.push({
          id: uid(), category: 'lunar', priority: 'low',
          title: AT.lunar.firstQuarter.title,
          body: AT.lunar.firstQuarter.body(lunar.age),
          action: AT.actions.logFeed, actionRoute: '/logs/feed',
          icon: '🌓', timestamp: Date.now(), isRead: false,
        });
        break;

      case 'Waxing Gibbous':
        alerts.push({
          id: uid(), category: 'lunar', priority: 'medium',
          title: AT.lunar.waxingGibbous.title,
          body: AT.lunar.waxingGibbous.body(lunar.age, lunar.daysTillFull),
          action: AT.actions.logFeed, actionRoute: '/logs/feed',
          icon: '🌔', timestamp: Date.now(), isRead: false,
        });
        break;

      case 'Full Moon':
        alerts.push({
          id: uid(), category: 'lunar', priority: 'high',
          title: AT.lunar.fullMoon.global.title,
          body: AT.lunar.fullMoon.global.body(lunar.illumination),
          action: AT.actions.logWater, actionRoute: '/logs/conditions',
          icon: '🌕', timestamp: Date.now(), isRead: false,
        });
        for (const pond of activePonds) {
          const doc = pond.stockingDate
            ? Math.floor((Date.now() - new Date(pond.stockingDate).getTime()) / 86400000)
            : 0;
          alerts.push({
            id: uid(), category: 'lunar', priority: 'high',
            title: AT.lunar.fullMoon.perPond.title(pond.name, doc),
            body: AT.lunar.fullMoon.perPond.body,
            action: AT.actions.viewPond, actionRoute: `/pond/${pond.id}`,
            pondId: pond.id, pondName: pond.name,
            icon: '🌕', timestamp: Date.now(), isRead: false,
          });
        }
        break;

      case 'Waning Gibbous':
        alerts.push({
          id: uid(), category: 'lunar', priority: 'low',
          title: AT.lunar.waningGibbous.title,
          body: AT.lunar.waningGibbous.body(lunar.age),
          action: AT.actions.logFeed, actionRoute: '/logs/feed',
          icon: '🌖', timestamp: Date.now(), isRead: false,
        });
        break;

      case 'Last Quarter':
        alerts.push({
          id: uid(), category: 'lunar', priority: 'medium',
          title: AT.lunar.lastQuarter.title,
          body: AT.lunar.lastQuarter.body(lunar.age, lunar.daysTillNew),
          action: AT.actions.logTreatment, actionRoute: '/logs/conditions',
          icon: '🌗', timestamp: Date.now(), isRead: false,
        });
        break;

      case 'Waning Crescent':
        alerts.push({
          id: uid(), category: 'lunar', priority: 'medium',
          title: AT.lunar.waningCrescent.title,
          body: AT.lunar.waningCrescent.body(lunar.age, lunar.daysTillNew),
          action: AT.actions.logFeed, actionRoute: '/logs/feed',
          icon: '🌘', timestamp: Date.now(), isRead: false,
        });
        break;
    }

    // Harvest + moon caution
    if (prefs.harvest) {
      if (lunar.daysTillFull <= 2 || lunar.name === 'Full Moon') {
        alerts.push({
          id: uid(), category: 'lunar', priority: 'high',
          title: AT.lunar.harvestCaution.fullMoon.title,
          body: AT.lunar.harvestCaution.fullMoon.body(lunar.daysTillFull),
          action: AT.actions.viewMarket, actionRoute: '/market',
          icon: '🚫', timestamp: Date.now(), isRead: false,
        });
      }
      if (lunar.daysTillNew <= 2 || lunar.name === 'New Moon') {
        alerts.push({
          id: uid(), category: 'lunar', priority: 'medium',
          title: AT.lunar.harvestCaution.newMoon.title,
          body: AT.lunar.harvestCaution.newMoon.body(lunar.daysTillNew),
          action: AT.actions.viewMarket, actionRoute: '/market',
          icon: '⚠️', timestamp: Date.now(), isRead: false,
        });
      }
    }
  }

  // Deduplicate and sort by priority
  const seen = new Set<string>();
  return alerts.filter(a => {
    if (seen.has(a.title)) return false;
    seen.add(a.title);
    return true;
  }).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return order[a.priority] - order[b.priority];
  });
}

// ─── PRIORITY CONFIG ───────────────────────────────────────────────────────
export const PRIORITY_CONFIG = {
  critical: { color: 'bg-red-500', light: 'bg-red-50 border-red-200', dark: 'bg-red-500/10 border-red-500/20', text: 'text-red-500', label: 'CRITICAL' },
  high: { color: 'bg-orange-500', light: 'bg-orange-50 border-orange-200', dark: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-500', label: 'HIGH' },
  medium: { color: 'bg-amber-500', light: 'bg-amber-50 border-amber-200', dark: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-500', label: 'MEDIUM' },
  low: { color: 'bg-blue-500', light: 'bg-blue-50 border-blue-200', dark: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-500', label: 'LOW' },
  info: { color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200', dark: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-500', label: 'TIP' },
};

export const CATEGORY_CONFIG: Record<AlertCategory, { label: string; icon: string; color: string }> = {
  pond_danger: { label: 'Pond Danger', icon: '🚨', color: 'text-red-500' },
  feed: { label: 'Feed', icon: '🍤', color: 'text-amber-500' },
  weather: { label: 'Weather', icon: '🌦️', color: 'text-blue-500' },
  harvest: { label: 'Harvest', icon: '🦐', color: 'text-emerald-500' },
  disease: { label: 'Disease', icon: '🦠', color: 'text-purple-500' },
  market: { label: 'Market', icon: '📊', color: 'text-teal-500' },
  lunar: { label: 'Lunar', icon: '🌕', color: 'text-indigo-400' },
  tip: { label: 'Daily Tip', icon: '💡', color: 'text-indigo-500' },
  system: { label: 'System', icon: '⚙️', color: 'text-slate-500' },
};
