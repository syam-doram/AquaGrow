import { readFileSync, writeFileSync } from 'fs';
const path = 'c:\\Users\\syamk\\Downloads\\Aquagrow\\src\\translations.ts';
let content = readFileSync(path, 'utf8');

const sopKeys = [
  "dailyLogTitle: string;",
  "acclimatizationDone: string;",
  "probioticApplied: string;",
  "aerationLevel: string;",
  "mineralsApplied: string;",
  "gutProbioticMixed: string;",
  "zeoliteApplied: string;",
  "sludgeChecked: string;",
  "vibriosisSigns: string;",
  "feedTrayCheck: string;",
  "immunityBoostersAdded: string;",
  "aerator24h: string;",
  "pondBottomCleaned: string;",
  "waterExchangeDone: string;",
  "targetSizeAchieved: string;"
];

const sopValues = [
  "dailyLogTitle: 'Daily SOP Log'",
  "acclimatizationDone: 'Acclimatization Done?'",
  "probioticApplied: 'Probiotic Applied?'",
  "aerationLevel: 'Aeration Level'",
  "mineralsApplied: 'Minerals Applied?'",
  "gutProbioticMixed: 'Gut Probiotic Mixed?'",
  "zeoliteApplied: 'Zeolite Applied?'",
  "sludgeChecked: 'Sludge Checked?'",
  "vibriosisSigns: 'Vibriosis Signs?'",
  "feedTrayCheck: 'Feed Tray Checked?'",
  "immunityBoostersAdded: 'Immurity Boosters Added?'",
  "aerator24h: 'Aerators running 24h?'",
  "pondBottomCleaned: 'Pond Bottom Cleaned?'",
  "waterExchangeDone: 'Water Exchange Done?'",
  "targetSizeAchieved: 'Target Size Achieved?'"
];

// Interface
const interfaceSearch = "export interface Translations {\n";
const startIdx = content.indexOf(interfaceSearch) + interfaceSearch.length;
const keysStr = sopKeys.map(k => `  ${k}`).join('\n');
content = content.slice(0, startIdx) + keysStr + '\n' + content.slice(startIdx);

// Lang
const langs = ['English', 'Telugu', 'Bengali', 'Odia', 'Gujarati', 'Tamil', 'Malayalam'];
langs.forEach(lang => {
  const search = `${lang}: {`;
  const idx = content.indexOf(search) + search.length;
  const valuesStr = sopValues.map(v => `    ${v},`).join('\n');
  content = content.slice(0, idx) + '\n' + valuesStr + content.slice(idx);
});

writeFileSync(path, content, 'utf8');
console.log('Updated translations for Daily SOP Logging');
