/**
 * alertTranslations.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Complete bilingual alert text for ALL push notifications and in-app alerts.
 * Languages: English · Telugu (extensible to Bengali, Odia, Tamil, Malayalam)
 *
 * Usage:
 *   import { getAlertTranslations } from './alertTranslations';
 *   const AT = getAlertTranslations(user.language);
 *   AT.pondDanger.criticalDO.title(pond.name, latest.do)
 * ──────────────────────────────────────────────────────────────────────────────
 */

import type { Language } from '../types';

// ─── Template helpers ──────────────────────────────────────────────────────────
type T0 = string;
type T1<A> = (a: A) => string;
type T2<A, B> = (a: A, b: B) => string;
type T3<A, B, C> = (a: A, b: B, c: C) => string;
type T4<A, B, C, D> = (a: A, b: B, c: C, d: D) => string;
type T5<A, B, C, D, E> = (a: A, b: B, c: C, d: D, e: E) => string;

// ─── Alert Text Schema ─────────────────────────────────────────────────────────
export interface AlertTranslations {

  // ── Priority Labels ─────────────────────────────────────────────
  priority: {
    critical: T0;
    high: T0;
    medium: T0;
    low: T0;
    info: T0;
  };

  // ── Category Labels ─────────────────────────────────────────────
  category: {
    pond_danger: T0;
    feed: T0;
    weather: T0;
    harvest: T0;
    disease: T0;
    market: T0;
    lunar: T0;
    tip: T0;
    system: T0;
  };

  // ── CTA Buttons ─────────────────────────────────────────────────
  actions: {
    viewPond: T0;
    logWater: T0;
    logFeed: T0;
    logTreatment: T0;
    scanShrimp: T0;
    viewMarket: T0;
    viewSOP: T0;
    startHarvest: T0;
    callExpert: T0;
    harvestGuide: T0;
    emgHarvest: T0;
    logConditions: T0;
    reviewFeedLog: T0;
  };

  // ── Pond Danger Alerts ──────────────────────────────────────────
  pondDanger: {
    criticalDO: {
      title: T2<string, number>;   // (pondName, doValue)
      body: T2<string, number>;
    };
    lowDO: {
      title: T2<string, number>;
      body: T2<string, number>;
    };
    pHCritical: {
      title: T2<string, number>;
      body: T2<string, number>;
    };
    pHDrifting: {
      title: T2<string, number>;
      body: T2<string, number>;
    };
    highAmmonia: {
      title: T2<string, number>;
      body: T2<string, number>;
    };
    wssVRisk: {
      title: T2<string, number>;   // (pondName, doc)
      body: T2<string, number>;
    };
    highMortality: {
      title: T2<string, number>;   // (pondName, count)
      body: T2<string, number>;
    };
  };

  // ── Feed Alerts ─────────────────────────────────────────────────
  feed: {
    morningFeed: {
      title: T1<string>;           // (pondName)
      body: T1<string>;
    };
    eveningFeed: {
      title: T1<string>;
      body: T1<string>;
    };
    fcrHigh: {
      title: T2<string, number>;   // (pondName, fcrValue)
      body: T2<string, number>;
    };
    amavasyaReduce: {
      title: T1<string>;
      body: T0;
    };
    fullMoonReduce: {
      title: T1<string>;
      body: T0;
    };
    heatStress: {
      title: T0;
      body: T0;
    };
    rainSuspend: {
      title: T0;
      body: T0;
    };
    moltingPhase: {
      title: T0;
      body: T0;
    };
  };

  // ── Weather Alerts ──────────────────────────────────────────────
  weather: {
    preDawnDO: {
      title: T0;
      body: T0;
    };
    monsoonMorning: {
      title: T0;
      body: T0;
    };
    summerHeat: {
      title: T0;
      body: T0;
    };
    winterWSSV: {
      title: T0;
      body: T0;
    };
  };

  // ── Harvest Alerts ──────────────────────────────────────────────
  harvest: {
    vannameiWindow: {
      title: T2<string, number>;   // (pondName, doc)
      body: T2<string, number>;
    };
    tigerWindow: {
      title: T2<string, number>;
      body: T2<string, number>;
    };
    preHarvestPrep: {
      title: T2<string, number>;
      body: T2<string, number>;
    };
    overAge: {
      title: T2<string, number>;
      body: T2<string, number>;
    };
    // Harvest stage push payloads
    stage: {
      pending: { title: T0; body: T1<string> };
      accepted: { title: T0; body: T1<string> };
      quality_checked: { title: T0; body: T1<string> };
      weighed: { title: T0; body: T1<string> };
      rate_confirmed: { title: T0; body: T1<string> };
      harvested: { title: T0; body: T1<string> };
      paid: { title: T0; body: T1<string> };
      completed: { title: T0; body: T1<string> };
      cancelled: { title: T0; body: T1<string> };
    };
  };

  // ── Disease Alerts ──────────────────────────────────────────────
  disease: {
    emsRisk: {
      title: T2<string, number>;
      body: T2<string, number>;
    };
    whiteGutRisk: {
      title: T1<string>;
      body: T2<string, number>;
    };
  };

  // ── Market Alerts ───────────────────────────────────────────────
  market: {
    priceSpike: {
      title: T2<number, number>;   // (price, size)
      body: T3<number, string, number>; // (price, location, size)
    };
  };

  // ── Daily Tips ──────────────────────────────────────────────────
  tips: {
    morning: { title: T0; body: T0 };
    trayCheck: { title: T0; body: T0 };
    nightAeration: { title: T0; body: T0 };
    logData: { title: T0; body: T0 };
  };

  // ── Lunar Alerts ────────────────────────────────────────────────
  lunar: {
    newMoon: {
      global: { title: T0; body: T1<number> };   // (moonAge)
      perPond: { title: T1<string>; body: T0 };    // (pondName)
    };
    waxingCrescent: { title: T0; body: T1<number> };
    firstQuarter: { title: T0; body: T1<number> };
    waxingGibbous: { title: T0; body: T2<number, number> }; // (moonAge, daysTillFull)
    fullMoon: {
      global: { title: T0; body: T1<number> };   // (illumination)
      perPond: { title: T2<string, number>; body: T0 }; // (pondName, doc)
    };
    waningGibbous: { title: T0; body: T1<number> };
    lastQuarter: { title: T0; body: T2<number, number> }; // (moonAge, daysTillNew)
    waningCrescent: { title: T0; body: T2<number, number> };
    harvestCaution: {
      fullMoon: { title: T0; body: T1<number> }; // (daysTillFull)
      newMoon: { title: T0; body: T1<number> }; // (daysTillNew)
    };
  };

  // ── Aerator Alerts ──────────────────────────────────────────────
  aerator: {
    checkDue: {
      title: T2<string, string>;   // (pondName, stageLabel)
      body: T2<string, number>;   // (pondName, doc)
    };
  };

  // ── Compliance ──────────────────────────────────────────────────
  compliance: {
    noWaterLog: { title: T0; body: T0 };
    noFeedLog: { title: T0; body: T0 };
    streakRisk: { title: T0; body: T0 };
  };

  // ── Trends & Predictive ─────────────────────────────────────────
  trends: {
    phDeclining: {
      title: T1<string>; 
      body: T4<number, number, number, number>;
    };
    phRising: {
      title: T1<string>; 
      body: T3<number, number, number>;
    };
    doDropping: {
      title: T1<string>; 
      body: T3<number, number, number>;
    };
    ammoniaRising: {
      title: T1<string>; 
      body: T3<number, number, number>;
    };
    compoundRisk: {
      title: T2<number, string>;
      body: T1<string>;
    };
    mineralGap: {
      title: T1<string>;
      body: T3<number | string, string, number>;
    };
    probioticGap: {
      title: T1<string>;
      body: T2<number | string, string>;
    };
    harvestApproaching: {
      title: T1<string>;
      body: T5<number, number, number, string, number>;
    };
    fcrAboveBenchmark: {
      title: T3<number, number, string>;
      body: T3<number, number, number>;
    };
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENGLISH
// ═══════════════════════════════════════════════════════════════════════════════
const English: AlertTranslations = {

  priority: {
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
    info: 'TIP',
  },

  category: {
    pond_danger: 'Pond Danger',
    feed: 'Feed',
    weather: 'Weather',
    harvest: 'Harvest',
    disease: 'Disease',
    market: 'Market',
    lunar: 'Lunar',
    tip: 'Daily Tip',
    system: 'System',
  },

  actions: {
    viewPond: 'View Pond',
    logWater: 'Log Water',
    logFeed: 'Log Feed',
    logTreatment: 'Log Treatment',
    scanShrimp: 'Scan Shrimp',
    viewMarket: 'View Market',
    viewSOP: 'View SOP',
    startHarvest: 'Start Harvest',
    callExpert: 'Call Expert',
    harvestGuide: 'Harvest Guide',
    emgHarvest: 'Emergency Harvest',
    logConditions: 'Log Conditions',
    reviewFeedLog: 'Review Feed Log',
  },

  pondDanger: {
    criticalDO: {
      title: (pond, do_) => `🚨 Critical: Very Low DO — ${pond}`,
      body: (pond, do_) => `DO is ${do_} mg/L in ${pond} — dangerously low. Run ALL aerators immediately. Shrimp mortality risk within 2–4 hours.`,
    },
    lowDO: {
      title: (pond, do_) => `⚠️ Low Oxygen — ${pond}`,
      body: (pond, do_) => `DO at ${do_} mg/L (safe: >5). Increase aeration and avoid feeding until DO recovers. Check at 6 AM.`,
    },
    pHCritical: {
      title: (pond, ph) => `🔴 pH Out of Range — ${pond}`,
      body: (pond, ph) => `pH is ${ph} (safe: 7.5–8.5). Apply dolomite 15 kg/acre if low, or lime if high. Act within 4 hours.`,
    },
    pHDrifting: {
      title: (pond, ph) => `🟡 pH Drifting — ${pond}`,
      body: (pond, ph) => `pH at ${ph} — drifting from optimal. Apply dolomite 5 kg/acre this evening to stabilize. Monitor morning reading.`,
    },
    highAmmonia: {
      title: (pond, nh3) => `☠️ High Ammonia — ${pond}`,
      body: (pond, nh3) => `Ammonia at ${nh3} ppm (safe: <0.1). Apply zeolite 15 kg/acre. Stop feeding for 12 hours. Partial water exchange 10–15%.`,
    },
    wssVRisk: {
      title: (pond, doc) => `🦠 WSSV Risk Window — ${pond} (DOC ${doc})`,
      body: (pond, doc) => `DOC ${doc}: Critical WSSV outbreak window. Inspect shrimp for white spots on shell daily. Cold nights trigger outbreaks — maintain temp >25°C.`,
    },
    highMortality: {
      title: (pond, count) => `💀 High Mortality Alert — ${pond}`,
      body: (pond, count) => `${count} dead shrimp reported in ${pond}. Inspect immediately for WSSV/EMS signs. Consider contacting an expert now.`,
    },
  },

  feed: {
    morningFeed: {
      title: (pond) => `🍤 Morning Feed Time — ${pond}`,
      body: (pond) => `6 AM feed slot for ${pond}. Check DO >5 before feeding. Monitor tray residue after 2 hours. Apply probiotics today.`,
    },
    eveningFeed: {
      title: (pond) => `🌆 Evening Feed — ${pond}`,
      body: (pond) => `6 PM dusk feed for ${pond}. Remove uneaten morning feed. Apply probiotic dose to water after feeding.`,
    },
    fcrHigh: {
      title: (pond, fcr) => `📈 FCR Too High — ${pond}`,
      body: (pond, fcr) => `FCR is ${fcr.toFixed(2)} in ${pond} (target: <1.6). Check tray residue every meal. Reduce feed by 20% and review schedule.`,
    },
    amavasyaReduce: {
      title: (pond) => `🌑 Amavasya — Reduce Feed in ${pond}`,
      body: 'New moon molting risk is high. Reduce feed by 30% today. Run all aerators through the night.',
    },
    fullMoonReduce: {
      title: (pond) => `🌕 Full Moon — Reduce Feed in ${pond}`,
      body: 'Full moon stress peak. Reduce feed by 20–30% tonight. Run all aerators full power. Shrimp will eat less — this is normal.',
    },
    heatStress: {
      title: '☀️ Peak Heat — Reduce Midday Feed',
      body: 'High midday temperature. Skip or halve the noon feed round. Increase aeration during 11 AM–3 PM. Feed at dawn and dusk only.',
    },
    rainSuspend: {
      title: '🌧️ Rain Event — Suspend Feeding',
      body: 'Suspend feeding during rain. Wasted feed raises ammonia quickly. Resume 1 hour after rain stops. Check DO before re-feeding.',
    },
    moltingPhase: {
      title: '🦐 Molting Window — Reduce Feed',
      body: 'Shrimp are molting. Reduce feed by 20%. Add Ca/Mg minerals. Avoid disturbances at night during peak molting hours.',
    },
  },

  weather: {
    preDawnDO: {
      title: '🌙 Pre-Dawn DO Check Required',
      body: 'Between 3–5 AM, DO drops to its lowest point. Check all ponds now. If DO <4 mg/L, run emergency aerators immediately.',
    },
    monsoonMorning: {
      title: '🌧️ Monsoon Season — Morning Check',
      body: 'Heavy rain overnight lowers DO and pH. Check water quality before morning feed. Apply lime 5 kg/acre if pH falls below 7.5.',
    },
    summerHeat: {
      title: '☀️ Peak Heat — Reduce Midday Feed',
      body: 'Midday temperature is high. Reduce feed by 20% or skip noon round. Increase aeration during 11 AM–3 PM window.',
    },
    winterWSSV: {
      title: '🥶 Cold Night Warning — WSSV Risk',
      body: 'Night temperature may drop below 25°C — a key WSSV trigger. Inspect shrimp at 6 AM for white spots on shell.',
    },
  },

  harvest: {
    vannameiWindow: {
      title: (pond, doc) => `🦐 Harvest Window — ${pond} (DOC ${doc})`,
      body: (pond, doc) => `DOC ${doc}: Prime Vannamei harvest window. Check market price now. Target count: 50–60 for best price. Conduct cast net ABW check.`,
    },
    tigerWindow: {
      title: (pond, doc) => `🦞 Tiger Harvest Ready — ${pond} (DOC ${doc})`,
      body: (pond, doc) => `DOC ${doc}: Black Tiger harvest window open. Target count ≤30 for premium pricing. Withhold feed 24 hrs before harvest.`,
    },
    preHarvestPrep: {
      title: (pond, doc) => `📋 Pre-Harvest Prep — ${pond}`,
      body: (pond, doc) => `DOC ${doc}: Harvest is ~5–7 days away. Contact buyers, arrange nets, ice, and transport. No treatments 3 days before harvest.`,
    },
    overAge: {
      title: (pond, doc) => `⏰ Over-Age Pond — Act Now! ${pond}`,
      body: (pond, doc) => `DOC ${doc}: Past prime harvest window. Feed conversion is now inefficient. Harvest immediately to avoid further losses.`,
    },
    stage: {
      pending: { title: '📋 Harvest Request Submitted', body: (p) => `${p}: Your request is live. Waiting for a buyer to accept.` },
      accepted: { title: '🤝 Buyer Accepted Your Order!', body: (p) => `${p}: A buyer accepted your harvest. Prepare for quality inspection.` },
      quality_checked: { title: '🔬 Quality Check Completed ✓', body: (p) => `${p}: Quality passed! Buyer is proceeding to weigh your harvest.` },
      weighed: { title: '⚖️ Weighing Done — Rate Confirmation', body: (p) => `${p}: Harvest weighed. Buyer is now confirming the final rate per kg.` },
      rate_confirmed: { title: '💰 Rate Confirmed — Harvest Starting!', body: (p) => `${p}: Final rate agreed. Physical harvest is now beginning!` },
      harvested: { title: '🎣 Harvest Done! Payment Processing', body: (p) => `${p}: Harvest complete! Payment is being processed now.` },
      paid: { title: '💸 Payment Released to You!', body: (p) => `${p}: Payment released! Check your bank for the transfer.` },
      completed: { title: '🏆 Harvest Cycle Complete', body: (p) => `${p}: Cycle archived. Excellent work this season!` },
      cancelled: { title: '❌ Harvest Order Cancelled', body: (p) => `${p}: Your order was cancelled. Submit a new request when ready.` },
    },
  },

  disease: {
    emsRisk: {
      title: (pond, doc) => `🔬 EMS Risk Window — ${pond} (DOC ${doc})`,
      body: (pond, doc) => `DOC ${doc}: EMS peak risk window. Watch for sudden mass death and empty gut. Check 5 shrimp from tray. Apply probiotic preventively.`,
    },
    whiteGutRisk: {
      title: (pond) => `🧬 White Gut Risk — ${pond}`,
      body: (pond, doc) => `Low DO + DOC ${doc} — gut bacterial infection risk. Check 5 shrimp for white gut line. Apply gut probiotic to feed today.`,
    },
  },

  market: {
    priceSpike: {
      title: (price, size) => `📊 Market Spike — ₹${price}/kg (${size} count)`,
      body: (price, loc, size) => `High demand: ${size} count at ${loc} — ₹${price}/kg. If your pond is DOC 80+, now is a good time to sell.`,
    },
  },

  tips: {
    morning: { title: '🌅 Morning SOP: DO Check First', body: 'Always check DO before morning feed. DO <5 mg/L → run aerators, delay feed 30 min.' },
    trayCheck: { title: '🔬 Mid-Morning: Tray Inspection', body: 'Check feed tray residue 2 hrs after morning feed. If >20% left, reduce next meal by that amount.' },
    nightAeration: { title: '🌙 Night Aeration Check', body: 'Run all aerators through the night. DO dips lowest between 2–5 AM. Disable only one aerator at a time.' },
    logData: { title: '📓 Log Your Data Today', body: 'Daily logging = better AI predictions. Log water quality, feed, and tray observations now.' },
  },

  lunar: {
    newMoon: {
      global: {
        title: '🌑 New Moon Tonight — Mass Molt Starting',
        body: (age) => `New Moon (Day ${age}): Mass molting phase begins. Increase feed 10–15% for 3 days. Add dolomite 5 kg/acre for shell hardening. No sudden water changes.`,
      },
      perPond: {
        title: (pond) => `🌑 New Moon Mineral Dose — ${pond}`,
        body: 'Apply dolomite 5 kg/acre + mineral mix 3 kg/acre tonight. Shrimp shed shells at new moon — calcium is critical. Do NOT change >10% water for 2 days.',
      },
    },
    waxingCrescent: {
      title: '🌒 Waxing Crescent — Shell Hardening Phase',
      body: (age) => `Moon Day ${age}: Post-molt shell hardening. Maintain mineral dosing. Keep DO >5 for maximum hardening. Recover feed rate to normal over 2 days.`,
    },
    firstQuarter: {
      title: '🌓 First Quarter Moon — Peak Growth Window',
      body: (age) => `Moon Day ${age}: Best feeding response period. Maintain feed at 100%. Check ABW — this is peak growth week. Good time for probiotics.`,
    },
    waxingGibbous: {
      title: '🌔 Waxing Gibbous — Pre-Full Moon Prep',
      body: (age, dtf) => `Moon Day ${age}: Full Moon in ${dtf} day(s). Apply immunity booster (Vitamin C 2 g/kg) in feed. Ensure aerators are fully operational.`,
    },
    fullMoon: {
      global: {
        title: '🌕 Full Moon Tonight — Shrimp Stress Peak',
        body: (illum) => `Full Moon (${illum}% lit): Shrimp are highly stressed. Reduce feed 20%. Algae DO crash risk at night. Run ALL aerators. Monitor DO at 3 AM.`,
      },
      perPond: {
        title: (pond, doc) => `🌕 Full Moon Alert — ${pond} (DOC ${doc})`,
        body: 'Reduce tonight\'s feed 20–30%. Run aerators full power. Expect reduced feeding response — normal. No water exchange tonight. Re-check DO at 2 AM and 5 AM.',
      },
    },
    waningGibbous: {
      title: '🌖 Waning Gibbous — Recovery After Full Moon',
      body: (age) => `Moon Day ${age}: Full moon stress easing. Restore feed gradually (+10% every meal). Apply probiotic tonight. Check for soft shells — add dolomite if needed.`,
    },
    lastQuarter: {
      title: '🌗 Last Quarter — Second Molt Approaching',
      body: (age, dtn) => `Moon Day ${age}: New Moon in ${dtn} day(s). Pre-load minerals and immunity supplements now. Maintain stable DO and pH to reduce molt stress.`,
    },
    waningCrescent: {
      title: '🌘 Waning Crescent — Pre-New Moon Caution',
      body: (age, dtn) => `Moon Day ${age}: New Moon in ${dtn} day(s). Shrimp entering pre-molt. Increase feed 5% every 2 days. Apply dolomite 3 kg/acre as pre-loading dose.`,
    },
    harvestCaution: {
      fullMoon: {
        title: '🚫 Harvest Caution — Full Moon Approaching',
        body: (dtf) => `Full Moon in ${dtf} day(s): DO NOT harvest now. Shells are soft — weight is 5–8% lighter than actual. Delay harvest 3–4 days post full moon.`,
      },
      newMoon: {
        title: '⚠️ Harvest Caution — New Moon Window',
        body: (dtn) => `New Moon in ${dtn} day(s): Shrimp entering molt. Wait 3 days after new moon for shells to harden. Soft shrimp give lower weight at market.`,
      },
    },
  },

  aerator: {
    checkDue: {
      title: (pond, stage) => `⚡ Aerator Check — ${pond} (${stage})`,
      body: (pond, doc) => `DOC ${doc}: Time to review aerator coverage for ${pond}. Drag-racing consumption increases with biomass. Confirm count and HP now.`,
    },
  },

  compliance: {
    noWaterLog: { title: '💧 Water Quality Not Logged Today', body: 'Log water quality now to keep your Trust Score high and get accurate AI alerts for your pond.' },
    noFeedLog: { title: '🍤 Feed Not Logged Today', body: 'Feed log missing. Log your feed data to track FCR and get optimal feeding recommendations.' },
    streakRisk: { title: '🔥 Logging Streak at Risk!', body: 'You haven\'t logged today. Maintain your streak to build your Trust Score and unlock Pro insights.' },
  },

  trends: {
    phDeclining: {
      title: (pond) => `📉 pH Declining Trend — ${pond}`,
      body: (r2, r1, r0, count) => `pH dropped from ${r2.toFixed(1)} → ${r1.toFixed(1)} → ${r0.toFixed(1)} over ${count} readings. At this rate, pH will hit danger zone (<7.5) within 1–2 days. Apply Dolomite Lime (15 kg/acre) NOW before it crashes.`,
    },
    phRising: {
      title: (pond) => `📈 pH Rising — Algal Bloom Risk — ${pond}`,
      body: (r2, r1, r0) => `pH rising: ${r2.toFixed(1)} → ${r1.toFixed(1)} → ${r0.toFixed(1)}. Likely algal bloom intensifying. Apply Zeolite (20 kg/acre) and check Secchi depth. If <25cm, reduce feeding by 20%.`,
    },
    doDropping: {
      title: (pond) => `📉 DO Dropping Fast — ${pond}`,
      body: (r2, r1, r0) => `Dissolved oxygen falling: ${r2.toFixed(1)} → ${r1.toFixed(1)} → ${r0.toFixed(1)} mg/L. If trend continues, DO will hit danger zone (<4.5) by next reading. Run extra paddlewheel aerators now, especially at night.`,
    },
    ammoniaRising: {
      title: (pond) => `⬆️ Ammonia Rising — ${pond}`,
      body: (r2, r1, r0) => `Ammonia trend: ${r2.toFixed(2)} → ${r1.toFixed(2)} → ${r0.toFixed(2)} mg/L. Reduce feed by 20% immediately. Apply Zeolite (15 kg/acre). Do NOT apply probiotics until ammonia stabilizes.`,
    },
    compoundRisk: {
      title: (count, pond) => `⚠️ ${count} Risk Factors Active — ${pond}`,
      body: (factors) => `Compound risk detected: ${factors}. Multiple stress factors simultaneously increase disease susceptibility by 3–5×. Immediate action required: fix highest priority parameter first, then apply Vitamin C (5g/kg feed) for stress relief.`,
    },
    mineralGap: {
      title: (pond) => `💊 Mineral Mix Gap — ${pond}`,
      body: (daysAgo, pond, doc) => `No Mineral Mix logged in ${daysAgo === 99 ? 'this crop' : `${daysAgo} days`} for ${pond} (DOC ${doc}). Without regular mineralization, soft-shell molting mortality risk increases. Apply 15–20 kg/acre today.`,
    },
    probioticGap: {
      title: (pond) => `🧫 Probiotic Gap — ${pond}`,
      body: (daysAgo, pond) => `No probiotic logged in ${daysAgo === 99 ? 'this crop' : `${daysAgo} days`} for ${pond}. Water microbial balance is at risk. Pathogenic Vibrio colonies can double without regular probiotic competition. Apply today.`,
    },
    harvestApproaching: {
      title: (pond) => `🎯 Harvest Window Approaching — ${pond}`,
      body: (abw, doc, rate, dateStr, days) => `Based on current ABW (${abw}g at DOC ${doc}) and growth rate (~${rate.toFixed(2)}g/day), your pond is projected to reach 20g harvest size by ~${dateStr} (${days} days). Begin buyer contact and logistics planning now.`,
    },
    fcrAboveBenchmark: {
      title: (fcr, pct, pond) => `📊 FCR ${fcr.toFixed(2)} — ${pct}% Above Benchmark — ${pond}`,
      body: (fcr, pct, waste) => `Your FCR (${fcr.toFixed(2)}) is ${pct}% above the industry target (1.4). This means ~${waste} kg of feed is being wasted. Check: (1) tray residue after each meal, (2) shrimp gut fill under light. Reduce daily feed by 15% for next 3 days.`,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TELUGU (తెలుగు)
// ═══════════════════════════════════════════════════════════════════════════════
const Telugu: AlertTranslations = {

  priority: {
    critical: 'అత్యవసరం',
    high: 'అధికం',
    medium: 'మధ్యస్థం',
    low: 'తక్కువ',
    info: 'చిట్కా',
  },

  category: {
    pond_danger: 'చెరువు ప్రమాదం',
    feed: 'ఆహారం',
    weather: 'వాతావరణం',
    harvest: 'పట్టివేత',
    disease: 'వ్యాధి',
    market: 'మార్కెట్',
    lunar: 'చంద్ర దశ',
    tip: 'నేటి చిట్కా',
    system: 'సిస్టమ్',
  },

  actions: {
    viewPond: 'చెరువు చూడు',
    logWater: 'నీటి డేటా నమోదు',
    logFeed: 'ఆహారం నమోదు',
    logTreatment: 'చికిత్స నమోదు',
    scanShrimp: 'రొయ్యలు స్కాన్ చేయి',
    viewMarket: 'మార్కెట్ చూడు',
    viewSOP: 'SOP చూడు',
    startHarvest: 'పట్టివేత ప్రారంభించు',
    callExpert: 'నిపుణుడిని పిలు',
    harvestGuide: 'పట్టివేత మార్గదర్శి',
    emgHarvest: 'అత్యవసర పట్టివేత',
    logConditions: 'పరిస్థితులు నమోదు',
    reviewFeedLog: 'ఫీడ్ లాగ్ సమీక్ష',
  },

  pondDanger: {
    criticalDO: {
      title: (pond, do_) => `🚨 అత్యవసరం: DO చాలా తక్కువ — ${pond}`,
      body: (pond, do_) => `${pond}లో DO ${do_} mg/L — ప్రమాదకరంగా తక్కువగా ఉంది. వెంటనే అన్ని ఆక్సిజనేటర్లు నడపండి. 2–4 గంటల్లో రొయ్యలు చనిపోయే ప్రమాదం ఉంది.`,
    },
    lowDO: {
      title: (pond, do_) => `⚠️ తక్కువ ఆక్సిజన్ — ${pond}`,
      body: (pond, do_) => `${pond}లో DO ${do_} mg/L (సురక్షితం: >5). ఆక్సిజనేషన్ పెంచండి. DO కుదుర్కునే వరకు ఆహారం వేయకండి. ఉదయం 6కి తనిఖీ చేయండి.`,
    },
    pHCritical: {
      title: (pond, ph) => `🔴 pH పరిమితికి మించింది — ${pond}`,
      body: (pond, ph) => `${pond}లో pH ${ph} (సురక్షితం: 7.5–8.5). తక్కువ అయితే డోలమైట్ 15 కిలో/ఎకరా, ఎక్కువ అయితే సున్నం వేయండి. 4 గంటల్లో చర్య తీసుకోండి.`,
    },
    pHDrifting: {
      title: (pond, ph) => `🟡 pH జారుతోంది — ${pond}`,
      body: (pond, ph) => `${pond}లో pH ${ph} — అనుకూల స్థాయి నుండి జారుతోంది. సాయంత్రం డోలమైట్ 5 కిలో/ఎకరా వేయండి. ఉదయం రీడింగ్ పర్యవేక్షించండి.`,
    },
    highAmmonia: {
      title: (pond, nh3) => `☠️ అధిక అమ్మోనియా — ${pond}`,
      body: (pond, nh3) => `${pond}లో అమ్మోనియా ${nh3} ppm (సురక్షితం: <0.1). జియోలైట్ 15 కిలో/ఎకరా వేయండి. 12 గంటలు ఆహారం వేయకండి. 10–15% నీళ్ళు మార్చండి.`,
    },
    wssVRisk: {
      title: (pond, doc) => `🦠 WSSV ప్రమాద విండో — ${pond} (DOC ${doc})`,
      body: (pond, doc) => `DOC ${doc}: WSSV ప్రమాదకర దశ. ${pond}లో రొయ్యలపై తెల్లని మచ్చలు రోజూ తనిఖీ చేయండి. చల్లని రాత్రులు WSSV ను ప్రేరేపిస్తాయి — ఉష్ణోగ్రత >25°C నిర్వహించండి.`,
    },
    highMortality: {
      title: (pond, count) => `💀 అధిక మరణాల హెచ్చరిక — ${pond}`,
      body: (pond, count) => `${pond}లో ఈ రోజు ${count} రొయ్యలు చనిపోయాయి. వెంటనే WSSV/EMS సంకేతాలు తనిఖీ చేయండి. నిపుణుడిని సంప్రదించండి.`,
    },
  },

  feed: {
    morningFeed: {
      title: (pond) => `🍤 ఉదయం ఆహారం సమయం — ${pond}`,
      body: (pond) => `${pond}కు ఉదయం 6 గంటలకు ఆహారం సమయం. ఆహారం వేయడానికి ముందు DO >5 తనిఖీ చేయండి. 2 గంటల తర్వాత ట్రే అవశేషాలు పరిశీలించండి.`,
    },
    eveningFeed: {
      title: (pond) => `🌆 సాయంత్రం ఆహారం — ${pond}`,
      body: (pond) => `${pond}కు సాయంత్రం 6 గంటలకు ఆహారం. ఉదయం నాటి మిగిలిన ఆహారం తొలగించండి. ఆహారం తర్వాత నీటిలో ప్రోబయోటిక్ వేయండి.`,
    },
    fcrHigh: {
      title: (pond, fcr) => `📈 FCR చాలా ఎక్కువ — ${pond}`,
      body: (pond, fcr) => `${pond}లో FCR ${fcr.toFixed(2)} (లక్ష్యం: <1.6). ప్రతి భోజన సమయం ట్రే అవశేషాలు తనిఖీ చేయండి. ఆహారం 20% తగ్గించి అట్టపడస పర్యవేక్షించండి.`,
    },
    amavasyaReduce: {
      title: (pond) => `🌑 అమావాస్య — ${pond}లో ఆహారం తగ్గించండి`,
      body: 'అమావాస్య పెళ్ళు ప్రమాదం ఎక్కువ. ఈ రోజు ఆహారం 30% తగ్గించండి. రాత్రంతా అన్ని ఆక్సిజనేటర్లు నడపండి.',
    },
    fullMoonReduce: {
      title: (pond) => `🌕 పూర్ణిమ — ${pond}లో ఆహారం తగ్గించండి`,
      body: 'పూర్ణిమ ఒత్తిడి గరిష్ట స్థాయి. నేటి రాత్రి ఆహారం 20–30% తగ్గించండి. అన్ని ఆక్సిజనేటర్లు పూర్తి వేగంతో నడపండి.',
    },
    heatStress: {
      title: '☀️ అధిక వేడి — మధ్యాహ్నం ఆహారం తగ్గించండి',
      body: 'మధ్యాహ్నం ఉష్ణోగ్రత ఎక్కువగా ఉంది. మధ్యాహ్నం ఆహారం స్లాట్ వదలండి లేదా సగం వేయండి. ఉదయం మరియు సాయంత్రం మాత్రమే ఆహారం వేయండి.',
    },
    rainSuspend: {
      title: '🌧️ వర్షం — ఆహారం నిలిపివేయండి',
      body: 'వర్షం సమయంలో ఆహారం వేయకండి. మిగిలిన ఆహారం అమ్మోనియాను పెంచుతుంది. వర్షం ఆగిన 1 గంట తర్వాత పునఃప్రారంభించండి.',
    },
    moltingPhase: {
      title: '🦐 పెళ్ళు సమయం — ఆహారం తగ్గించండి',
      body: 'రొయ్యలు పెళ్ళు వేస్తున్నాయి. ఆహారం 20% తగ్గించండి. Ca/Mg ఖనిజాలు జోడించండి. రాత్రి పెళ్ళు సమయంలో చెరువు దాటుట మానుకోండి.',
    },
  },

  weather: {
    preDawnDO: {
      title: '🌙 తెల్లవారు DO తనిఖీ అవసరం',
      body: 'ఉదయం 3–5 గంటల మధ్య DO అత్యంత తక్కువగా ఉంటుంది. ఇప్పుడు అన్ని చెరువులు తనిఖీ చేయండి. DO <4 mg/L అయితే వెంటనే ఆక్సిజనేటర్లు నడపండి.',
    },
    monsoonMorning: {
      title: '🌧️ వర్షాకాలం — ఉదయం తనిఖీ',
      body: 'రాత్రి భారీ వర్షం DO మరియు pH తగ్గిస్తుంది. ఉదయం ఆహారం ముందు నీటి నాణ్యత తనిఖీ చేయండి. pH 7.5 కింద పడితే సున్నం 5 కిలో/ఎకరా వేయండి.',
    },
    summerHeat: {
      title: '☀️ అధిక వేడి — మధ్యాహ్నం ఆహారం తగ్గించండి',
      body: 'మధ్యాహ్నం ఉష్ణోగ్రత ఎక్కువ. ఆహారం 20% తగ్గించండి లేదా మధ్యాహ్నం స్లాట్ వదలండి. పగలు 11–3 సమయంలో ఆక్సిజనేషన్ పెంచండి.',
    },
    winterWSSV: {
      title: '🥶 చల్లని రాత్రి హెచ్చరిక — WSSV ప్రమాదం',
      body: 'రాత్రి ఉష్ణోగ్రత 25°C కంటే తక్కువకు పడవచ్చు — ఇది WSSV యొక్క ముఖ్య ట్రిగ్గర్. ఉదయం 6 గంటలకు షెల్‌పై తెల్లని మచ్చల తనిఖీ చేయండి.',
    },
  },

  harvest: {
    vannameiWindow: {
      title: (pond, doc) => `🦐 పట్టివేత విండో — ${pond} (DOC ${doc})`,
      body: (pond, doc) => `DOC ${doc}: వన్నమీ పట్టివేతకు అనువైన సమయం. మార్కెట్ ధర ఇప్పుడు తనిఖీ చేయండి. లక్ష్య కౌంట్: 50–60 అత్యుత్తమ ధర కోసం. ABW కాస్ట్ నెట్ తనిఖీ చేయండి.`,
    },
    tigerWindow: {
      title: (pond, doc) => `🦞 టైగర్ పట్టివేతకు సిద్ధం — ${pond} (DOC ${doc})`,
      body: (pond, doc) => `DOC ${doc}: బ్లాక్ టైగర్ పట్టివేత విండో తెరుచుకుంది. ప్రీమియం ధర కోసం కౌంట్ ≤30 లక్ష్యంగా పెట్టుకోండి. పట్టివేత 24 గంటల ముందు ఆహారం నిలిపివేయండి.`,
    },
    preHarvestPrep: {
      title: (pond, doc) => `📋 పట్టివేత ముందు సన్నాహాలు — ${pond}`,
      body: (pond, doc) => `DOC ${doc}: పట్టివేత 5–7 రోజుల్లో. కొనుగోలుదారులను సంప్రదించండి, వలలు, మంచు, రవాణా ఏర్పాటు చేయండి. పట్టివేత 3 రోజుల ముందు ఏ చికిత్స చేయకండి.`,
    },
    overAge: {
      title: (pond, doc) => `⏰ అతిగా పాతబడిన చెరువు — వెంటనే వ్యవహరించండి! ${pond}`,
      body: (pond, doc) => `DOC ${doc}: పట్టివేత యొక్క అనువైన సమయం దాటిపోయింది. ఇప్పుడు FCR పెరిగిపోతోంది. నష్టాలు తగ్గించుకోవడానికి వెంటనే కోయండి.`,
    },
    stage: {
      pending: { title: '📋 పట్టివేత అభ్యర్థన సమర్పించబడింది', body: (p) => `${p}: మీ అభ్యర్థన చురుకుగా ఉంది. కొనుగోలుదారు అంగీకరించడం కోసం వేచిఉన్నారు.` },
      accepted: { title: '🤝 కొనుగోలుదారు అంగీకరించారు!', body: (p) => `${p}: కొనుగోలుదారు మీ పట్టివేతను అంగీకరించారు. నాణ్యత తనిఖీకి సిద్ధం కండి.` },
      quality_checked: { title: '🔬 నాణ్యత తనిఖీ పూర్తైంది ✓', body: (p) => `${p}: నాణ్యత పాస్ అయింది! కొనుగోలుదారు తూకం వేయడానికి వెళ్తున్నారు.` },
      weighed: { title: '⚖️ తూకం పూర్తి — రేటు నిర్ధారణ', body: (p) => `${p}: పట్టివేత తూకం వేయబడింది. కొనుగోలుదారు చివరి రేటు నిర్ధారిస్తున్నారు.` },
      rate_confirmed: { title: '💰 రేటు నిర్ధారించబడింది — పట్టివేత మొదలైంది!', body: (p) => `${p}: చివరి రేటు అంగీకరించబడింది. శారీరక పట్టివేత ఇప్పుడు మొదలైంది!` },
      harvested: { title: '🎣 పట్టివేత పూర్తి! చెల్లింపు ప్రక్రియలో', body: (p) => `${p}: పట్టివేత పూర్తైంది! చెల్లింపు ప్రక్రియ జరుగుతోంది.` },
      paid: { title: '💸 మీకు చెల్లింపు విడుదలైంది!', body: (p) => `${p}: చెల్లింపు విడుదలైంది! మీ బ్యాంకులో ట్రాన్స్‌ఫర్ తనిఖీ చేయండి.` },
      completed: { title: '🏆 పట్టివేత సైకిల్ పూర్తైంది', body: (p) => `${p}: సైకిల్ ఆర్కైవ్ అయింది. ఈ సీజన్లో అద్భుతమైన పని!` },
      cancelled: { title: '❌ పట్టివేత ఆర్డర్ రద్దు అయింది', body: (p) => `${p}: మీ ఆర్డర్ రద్దు అయింది. సిద్ధంగా ఉన్నప్పుడు కొత్త అభ్యర్థన పంపండి.` },
    },
  },

  disease: {
    emsRisk: {
      title: (pond, doc) => `🔬 EMS ప్రమాద విండో — ${pond} (DOC ${doc})`,
      body: (pond, doc) => `DOC ${doc}: EMS ప్రమాద గరిష్ట దశ. హఠాత్తుగా పెద్దమొత్తంలో మరణాలు మరియు ఖాళీ పేగు తనిఖీ చేయండి. ట్రే నుండి 5 రొయ్యలు తనిఖీ చేయండి.`,
    },
    whiteGutRisk: {
      title: (pond) => `🧬 వైట్ గట్ ప్రమాదం — ${pond}`,
      body: (pond, doc) => `తక్కువ DO + DOC ${doc} — పేగు బ్యాక్టీరియల్ ఇన్ఫెక్షన్ ప్రమాదం. 5 రొయ్యలలో తెల్లని పేగు రేఖ తనిఖీ చేయండి. నేడు ఆహారలో పేగు ప్రోబయోటిక్ వేయండి.`,
    },
  },

  market: {
    priceSpike: {
      title: (price, size) => `📊 మార్కెట్ ధర పెరుగుదల — ₹${price}/కిలో (${size} కౌంట్)`,
      body: (price, loc, size) => `అధిక డిమాండ్: ${loc}లో ${size} కౌంట్ — ₹${price}/కిలో. మీ చెరువు DOC 80+ అయితే ఇప్పుడు అమ్మడం మంచిది.`,
    },
  },

  tips: {
    morning: { title: '🌅 ఉదయం SOP: ముందు DO తనిఖీ', body: 'ఉదయం ఆహారానికి ముందు DO తనిఖీ చేయండి. DO <5 mg/L → ఆక్సిజనేటర్లు నడపి, 30 నిమిషాలు ఆహారం ఆపండి.' },
    trayCheck: { title: '🔬 మధ్య ఉదయం: ట్రే తనిఖీ', body: 'ఉదయం ఆహారం తర్వాత 2 గంటల్లో ట్రే అవశేషాలు తనిఖీ చేయండి. >20% మిగిలితే తదుపరి భోజనం తగ్గించండి.' },
    nightAeration: { title: '🌙 రాత్రి ఆక్సిజనేషన్ తనిఖీ', body: 'రాత్రంతా అన్ని ఆక్సిజనేటర్లు నడపండి. ఉదయం 2–5 గంటల మధ్య DO అత్యంత తక్కువగా ఉంటుంది.' },
    logData: { title: '📓 నేడు డేటా నమోదు చేయండి', body: 'రోజువారీ నమోదు = మెరుగైన AI అంచనాలు. ఇప్పుడు నీటి నాణ్యత, ఆహారం మరియు ట్రే పరిశీలనలు నమోదు చేయండి.' },
  },

  lunar: {
    newMoon: {
      global: {
        title: '🌑 నేటి రాత్రి అమావాస్య — పెళ్ళు ప్రారంభం',
        body: (age) => `అమావాస్య (రోజు ${age}): సమూహ పెళ్ళు దశ మొదలవుతోంది. 3 రోజులు ఆహారం 10–15% పెంచండి. షెల్ గట్టిపడటానికి డోలమైట్ 5 కిలో/ఎకరా వేయండి.`,
      },
      perPond: {
        title: (pond) => `🌑 అమావాస్య ఖనిజ మోతాదు — ${pond}`,
        body: 'నేటి రాత్రి డోలమైట్ 5 కిలో/ఎకరా + ఖనిజ మిశ్రమం 3 కిలో/ఎకరా వేయండి. అమావాస్యలో షెల్ వేస్తాయి — కాల్షియం అవసరం. 2 రోజులు >10% నీళ్ళు మార్చకండి.',
      },
    },
    waxingCrescent: {
      title: '🌒 వక్రచంద్రుడు — షెల్ గట్టిపడే దశ',
      body: (age) => `చంద్ర రోజు ${age}: పెళ్ళు తర్వాత షెల్ గట్టిపడుతోంది. ఖనిజ మోతాదు కొనసాగించండి. DO >5 నిర్వహించండి. 2 రోజుల్లో ఆహారం సాధారణ స్థాయికి పెంచండి.`,
    },
    firstQuarter: {
      title: '🌓 అర్ధ చంద్రుడు — అత్యుత్తమ వృద్ధి విండో',
      body: (age) => `చంద్ర రోజు ${age}: అత్యుత్తమ ఆహారం స్పందన కాలం. ఆహారం 100% నిర్వహించండి. ABW తనిఖీ చేయండి — ఇది అత్యుత్తమ వృద్ధి వారం.`,
    },
    waxingGibbous: {
      title: '🌔 వాక్సింగ్ గిబ్బస్ — పూర్ణిమ సన్నాహం',
      body: (age, dtf) => `చంద్ర రోజు ${age}: పూర్ణిమ ${dtf} రోజు(లు)లో. ఆహారంలో విటమిన్ C (2g/కిలో) వేయండి. ఆక్సిజనేటర్లు పూర్తిగా సిద్ధంగా ఉండేలా చూసుకోండి.`,
    },
    fullMoon: {
      global: {
        title: '🌕 నేటి రాత్రి పూర్ణిమ — రొయ్యల ఒత్తిడి గరిష్ట స్థాయి',
        body: (illum) => `పూర్ణిమ (${illum}% వెలుతురు): రొయ్యలు చాలా ఒత్తిడిలో ఉన్నాయి. ఆహారం 20% తగ్గించండి. రాత్రి ఆల్గే DO సంక్షోభ ప్రమాదం. అన్ని ఆక్సిజనేటర్లు నడపండి.`,
      },
      perPond: {
        title: (pond, doc) => `🌕 పూర్ణిమ హెచ్చరిక — ${pond} (DOC ${doc})`,
        body: 'నేటి రాత్రి ఆహారం 20–30% తగ్గించండి. ఆక్సిజనేటర్లు పూర్తి వేగంతో నడపండి. ఆహారం తక్కువగా తింటే సహజం. రాత్రి నీళ్ళు మార్చకండి. ఉదయం 2 మరియు 5 గంటలకు DO తనిఖీ చేయండి.',
      },
    },
    waningGibbous: {
      title: '🌖 వేనింగ్ గిబ్బస్ — పూర్ణిమ తర్వాత కోలుకోవడం',
      body: (age) => `చంద్ర రోజు ${age}: పూర్ణిమ ఒత్తిడి తగ్గుతోంది. ఆహారం క్రమంగా పెంచండి (+10% ప్రతి భోజనం). నేటి రాత్రి ప్రోబయోటిక్ వేయండి.`,
    },
    lastQuarter: {
      title: '🌗 అంతిమ అర్ధ చంద్రుడు — రెండవ పెళ్ళు సమీపిస్తోంది',
      body: (age, dtn) => `చంద్ర రోజు ${age}: అమావాస్య ${dtn} రోజు(లు)లో. ఇప్పుడు ఖనిజాలు మరియు రోగనిరోధక అనుబంధాలు ముందుగా వేయండి.`,
    },
    waningCrescent: {
      title: '🌘 అంతిమ వక్ర చంద్రుడు — అమావాస్య ముందు జాగ్రత్త',
      body: (age, dtn) => `చంద్ర రోజు ${age}: అమావాస్య ${dtn} రోజు(లు)లో. రొయ్యలు పెళ్ళు ముందు దశలో ఉన్నాయి. ప్రతి 2 రోజులకు 5% ఆహారం పెంచండి.`,
    },
    harvestCaution: {
      fullMoon: {
        title: '🚫 పట్టివేత జాగ్రత్త — పూర్ణిమ సమీపిస్తోంది',
        body: (dtf) => `పూర్ణిమ ${dtf} రోజు(లు)లో: ఇప్పుడు కోయకండి. షెల్ మృదువుగా ఉంటుంది — మార్కెట్‌లో బరువు 5–8% తక్కువగా వస్తుంది. పూర్ణిమ తర్వాత 3–4 రోజులు ఆగండి.`,
      },
      newMoon: {
        title: '⚠️ పట్టివేత జాగ్రత్త — అమావాస్య విండో',
        body: (dtn) => `అమావాస్య ${dtn} రోజు(లు)లో: రొయ్యలు మళ్ళీ పెళ్ళు వేస్తున్నాయి. షెల్ గట్టిపడటానికి అమావాస్య తర్వాత 3 రోజులు ఆగండి. మృదువైన రొయ్యలు మార్కెట్‌లో తక్కువ బరువు ఇస్తాయి.`,
      },
    },
  },

  aerator: {
    checkDue: {
      title: (pond, stage) => `⚡ ఆక్సిజనేటర్ తనిఖీ — ${pond} (${stage})`,
      body: (pond, doc) => `DOC ${doc}: ${pond}లో ఆక్సిజనేటర్ కవరేజ్ సమీక్షించే సమయం. బయోమాస్ పెరిగే కొద్దీ ఆక్సిజన్ అవసరం పెరుగుతుంది. సంఖ్య మరియు HP నిర్ధారించండి.`,
    },
  },

  compliance: {
    noWaterLog: { title: '💧 నేడు నీటి నాణ్యత నమోదు చేయలేదు', body: 'ట్రస్ట్ స్కోర్ నిర్వహించడానికి నీటి నాణ్యత ఇప్పుడే నమోదు చేయండి. రోజువారీ నమోదు మెరుగైన AI హెచ్చరికలు ఇస్తుంది.' },
    noFeedLog: { title: '🍤 నేడు ఆహారం నమోదు చేయలేదు', body: 'ఆహారం నమోదు లేదు. FCR ట్రాక్ చేయడానికి మరియు అనుకూల ఆహార సిఫారసులు పొందడానికి ఆహార డేటా నమోదు చేయండి.' },
    streakRisk: { title: '🔥 నమోదు స్ట్రీక్ ప్రమాదంలో!', body: 'మీరు నేడు నమోదు చేయలేదు. స్ట్రీక్ కొనసాగించడానికి మరియు ట్రస్ట్ స్కోర్ నిర్మించుకోవడానికి ఇప్పుడు నమోదు చేయండి.' },
  },

  trends: {
    phDeclining: {
      title: (pond) => `📉 pH తగ్గుతున్న ధోరణి — ${pond}`,
      body: (r2, r1, r0, count) => `pH గత ${count} రీడింగులలో ${r2.toFixed(1)} → ${r1.toFixed(1)} → ${r0.toFixed(1)}కి పడిపోయింది. ఇదే కొనసాగితే, 1–2 రోజుల్లో ప్రమాద స్థాయికి (<7.5) చేరుకుంటుంది. వెంటనే డోలమైట్ లైమ్ (15 కిలోలు/ఎకరా) వేయండి.`,
    },
    phRising: {
      title: (pond) => `📈 pH పెరుగుతోంది — నాచు ప్రమాదం — ${pond}`,
      body: (r2, r1, r0) => `pH పెరుగుతోంది: ${r2.toFixed(1)} → ${r1.toFixed(1)} → ${r0.toFixed(1)}. నాచు (Algal bloom) పెరిగే అవకాశం ఉంది. జియోలైట్ (20 కిలోలు/ఎకరా) వేయండి మరియు పారదర్శకత తనిఖీ చేయండి. <25cm ఉంటే, ఆహారాన్ని 20% తగ్గించండి.`,
    },
    doDropping: {
      title: (pond) => `📉 DO వేగంగా పడిపోతోంది — ${pond}`,
      body: (r2, r1, r0) => `ఆక్సిజన్ పడిపోతోంది: ${r2.toFixed(1)} → ${r1.toFixed(1)} → ${r0.toFixed(1)} mg/L. ఇదే కొనసాగితే తర్వాతి రీడింగ్‌లో ప్రమాద స్థాయి ని (<4.5) చేరుకుంటుంది. రాత్రివేళల్లో అదనపు ఆక్సిజనేటర్లు నడపండి.`,
    },
    ammoniaRising: {
      title: (pond) => `⬆️ అమ్మోనియా పెరుగుతోంది — ${pond}`,
      body: (r2, r1, r0) => `అమ్మోనియా ధోరణి: ${r2.toFixed(2)} → ${r1.toFixed(2)} → ${r0.toFixed(2)} mg/L. వెంటనే ఆహారం 20% తగ్గించండి. జియోలైట్ (15 కిలోలు/ఎకరా) వేయండి. అమ్మోనియా తగ్గేదాకా ప్రోబయోటిక్స్ వేయకండి.`,
    },
    compoundRisk: {
      title: (count, pond) => `⚠️ ${count} ప్రమాద కారకాలు చురుకుగా ఉన్నాయి — ${pond}`,
      body: (factors) => `మిశ్రమ ప్రమాదం గుర్తించబడింది: ${factors}. ఒకేసారి పలు ఒత్తిడి కారకాల వల్ల రోగాల బారిన పడే అవకాశం 3-5 రెట్లు పెరుగుతుంది. ప్రధాన సమస్యను ముందుగా పరిష్కరించి, ఆ తర్వాత విటమిన్ సి (5గ్రా/కిలో ఫీడ్) వేయండి.`,
    },
    mineralGap: {
      title: (pond) => `💊 ఖనిజ మిశ్రమం గ్యాప్ — ${pond}`,
      body: (daysAgo, pond, doc) => `${pond} (DOC ${doc}) కి ${daysAgo === 99 ? 'ఈ క్రాప్‌లో' : `గత ${daysAgo} రోజులుగా`} ఖనిజ మిశ్రమం లాగ్ చేయలేదు. ఖనిజాలు లేకుంటే మెత్తటి షెల్ తో మరణాల ప్రమాదం పెరుగుతుంది. ఈ రోజే 15–20 కిలోలు/ఎకరా వేయండి.`,
    },
    probioticGap: {
      title: (pond) => `🧫 ప్రోబయోటిక్ గ్యాప్ — ${pond}`,
      body: (daysAgo, pond) => `${pond} కి ${daysAgo === 99 ? 'ఈ క్రాప్‌లో' : `గత ${daysAgo} రోజులుగా`} ప్రోబయోటిక్ లాగ్ చేయలేదు. నీటి సూక్ష్మజీవుల సమతుల్యత దెబ్బతింటుంది. ఈ రోజే అప్లై చేయండి.`,
    },
    harvestApproaching: {
      title: (pond) => `🎯 పట్టివేత సమయం సమీపిస్తోంది — ${pond}`,
      body: (abw, doc, rate, dateStr, days) => `ప్రస్తుత ABW (${abw}గ్రా DOC ${doc} వద్ద) మరియు పెరుగుదల రేటు (రోజుకి ~${rate.toFixed(2)}గ్రా) ఆధారంగా, మీ చెరువు ~${dateStr} (${days} రోజులు) నాటికి 20గ్రా పట్టివేత సైజుకి చేరుకుంటుంది. వెంటనే ఏర్పాట్లు మొదలుపెట్టండి.`,
    },
    fcrAboveBenchmark: {
      title: (fcr, pct, pond) => `📊 FCR ${fcr.toFixed(2)} — బెంచ్‌మార్క్ కన్నా ${pct}% ఎక్కువ — ${pond}`,
      body: (fcr, pct, waste) => `మీ FCR (${fcr.toFixed(2)}) పరిశ్రమ లక్ష్యం (1.4) కన్నా ${pct}% ఎక్కువగా ఉంది. అంటే సుమారు ${waste} కిలోల ఆహారం వృధా అవుతోంది. ట్రేలలో మిగిలిన ఆహారాన్ని తనిఖీ చేయండి. రాబోయే 3 రోజుల్లో రోజువారీ ఆహారాన్ని 15% తగ్గించండి.`,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRY + HELPER
// ═══════════════════════════════════════════════════════════════════════════════

export const ALERT_TRANSLATIONS: Record<Language, AlertTranslations> = {
  English,
  Telugu,
  Bengali: English,
  Odia: English,
  Gujarati: English,
  Tamil: English,
  Malayalam: English,
};

/**
 * Returns alert translations for the given language (falls back to English).
 */
export const getAlertTranslations = (language: Language = 'English'): AlertTranslations =>
  ALERT_TRANSLATIONS[language] ?? English;
