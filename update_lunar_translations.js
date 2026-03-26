import { readFileSync, writeFileSync } from 'fs';
const path = 'c:\\Users\\syamk\\Downloads\\Aquagrow\\src\\translations.ts';
let content = readFileSync(path, 'utf8');

const mKeys = [
  "amavasyaWarning: string;",
  "ashtamiWarning: string;",
  "moonPhaseTitle: string;",
  "massMoltingRisk: string;",
  "newMoonDay: string;",
  "fullAerationNight: string;",
  "reduceFeedBy30: string;",
  "immunityBoosterVitaminC: string;",
  "lunarPlanApplied: string;"
];

const mValues = [
  "amavasyaWarning: 'Amavasya (New Moon) - High Risk Period',",
  "ashtamiWarning: 'Ashtami / Navami - Moderate Risk Days',",
  "moonPhaseTitle: 'Lunar Cycle Alert',",
  "massMoltingRisk: 'High risk of mass molting and DO drop tonight.',",
  "newMoonDay: 'Amavasya Day',",
  "fullAerationNight: 'Strong aeration at night (Full Night)',",
  "reduceFeedBy30: 'Reduce feed by 20-30% tonight.',",
  "immunityBoosterVitaminC: 'Add Vitamin C / Immunity booster.',",
  "lunarPlanApplied: 'Lunar Management Plan Applied',"
];

// Interface
const interfaceSearch = "export interface Translations {\n";
const startIdx = content.indexOf(interfaceSearch) + interfaceSearch.length;
const keysStr = mKeys.map(k => `  ${k}`).join('\n');
content = content.slice(0, startIdx) + keysStr + '\n' + content.slice(startIdx);

// Lang
const langs = ['English', 'Telugu', 'Bengali', 'Odia', 'Gujarati', 'Tamil', 'Malayalam'];
langs.forEach(lang => {
  const search = `${lang}: {`;
  const idx = content.indexOf(search) + search.length;
  const valuesStr = mValues.map(v => `    ${v}`).join('\n');
  content = content.slice(0, idx) + '\n' + valuesStr + content.slice(idx);
});

writeFileSync(path, content, 'utf8');
console.log('Updated translations for Lunar Management system.');
