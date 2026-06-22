/**
 * starterGroupUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure utilities for Starter Group calculations.
 *
 * Rule: 1 Smart Box = 1 Starter = controls 1–4 aerators (max).
 *
 * Example: 10 aerators → 3 Smart Boxes
 *   Group 1: Aerators 1–4  (4 units)
 *   Group 2: Aerators 5–8  (4 units)
 *   Group 3: Aerators 9–10 (2 units)
 */

export const MAX_AERATORS_PER_STARTER = 4;

export interface StarterGroup {
  groupNumber: number;     // 1-based (1, 2, 3…)
  aeratorStart: number;    // 1-based aerator index start
  aeratorEnd: number;      // 1-based aerator index end
  aeratorCount: number;    // how many aerators in this group
  aeratorNames: string[];  // ["Aerator 1", "Aerator 2", ...]
}

/**
 * Calculate required Starter Groups from total aerator count.
 * Returns array of StarterGroup objects.
 *
 * @example
 *   calcStarterGroups(10)
 *   // → [
 *   //     { groupNumber:1, aeratorStart:1, aeratorEnd:4, aeratorCount:4, aeratorNames:["Aerator 1",...,"Aerator 4"] },
 *   //     { groupNumber:2, aeratorStart:5, aeratorEnd:8, aeratorCount:4, aeratorNames:["Aerator 5",...,"Aerator 8"] },
 *   //     { groupNumber:3, aeratorStart:9, aeratorEnd:10, aeratorCount:2, aeratorNames:["Aerator 9","Aerator 10"] },
 *   //   ]
 */
export function calcStarterGroups(totalAerators: number): StarterGroup[] {
  if (!totalAerators || totalAerators <= 0) return [];

  const groups: StarterGroup[] = [];
  const numGroups = Math.ceil(totalAerators / MAX_AERATORS_PER_STARTER);

  for (let g = 0; g < numGroups; g++) {
    const aeratorStart = g * MAX_AERATORS_PER_STARTER + 1;
    const aeratorEnd   = Math.min(aeratorStart + MAX_AERATORS_PER_STARTER - 1, totalAerators);
    const aeratorCount = aeratorEnd - aeratorStart + 1;
    const aeratorNames = Array.from(
      { length: aeratorCount },
      (_, i) => `Aerator ${aeratorStart + i}`
    );

    groups.push({
      groupNumber: g + 1,
      aeratorStart,
      aeratorEnd,
      aeratorCount,
      aeratorNames,
    });
  }

  return groups;
}

/**
 * Total Smart Boxes required for a given aerator count.
 */
export function calcRequiredSmartBoxes(totalAerators: number): number {
  if (!totalAerators || totalAerators <= 0) return 0;
  return Math.ceil(totalAerators / MAX_AERATORS_PER_STARTER);
}

/**
 * Get the starter group a given aerator index belongs to (1-based).
 */
export function getGroupForAerator(aeratorNumber: number): number {
  return Math.ceil(aeratorNumber / MAX_AERATORS_PER_STARTER);
}

/**
 * Get display label for a starter group card.
 * e.g. "Group 1 · Aerators 1–4"
 */
export function starterGroupLabel(group: StarterGroup): string {
  if (group.aeratorCount === 1) {
    return `Group ${group.groupNumber} · Aerator ${group.aeratorStart}`;
  }
  return `Group ${group.groupNumber} · Aerators ${group.aeratorStart}–${group.aeratorEnd}`;
}
