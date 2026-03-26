import { readFileSync, writeFileSync } from 'fs';
const path = 'c:\\Users\\syamk\\Downloads\\Aquagrow\\src\\translations.ts';
let content = readFileSync(path, 'utf8');

const tKeys = [
  "cultureSOP: string;",
  "stockingDensity: string;",
  "aeratorRequirement: string;",
  "cultureSchedule: string;",
  "medicinesPlan: string;",
  "warningSigns: string;",
  "productionExpectation: string;",
  "practicalTips: string;",
  "earlyStage: string;",
  "highRiskPeriod: string;",
  "finalStage: string;",
  "lowOxygenSigns: string;",
  "diseaseSymptoms: string;"
];

const tValues = [
  "cultureSOP: 'Culture SOP'",
  "stockingDensity: 'Stocking Density'",
  "aeratorRequirement: 'Aerator Needs'",
  "cultureSchedule: 'Culture Schedule'",
  "medicinesPlan: 'Medicine Plan'",
  "warningSigns: 'Warning Signs'",
  "productionExpectation: 'Yield Forecast'",
  "practicalTips: 'Practical Tips'",
  "earlyStage: 'Early Stage (DOC 1-10)'",
  "highRiskPeriod: 'High Risk (DOC 30-45)'",
  "finalStage: 'Final Stage (DOC 70-100)'",
  "lowOxygenSigns: 'Low Oxygen Signs'",
  "diseaseSymptoms: 'Disease Symptoms'"
];

// Interface Update
const interfaceSearch = "export interface Translations {\n";
const startIdx = content.indexOf(interfaceSearch) + interfaceSearch.length;
const keysStr = tKeys.map(k => `  ${k}`).join('\n');
content = content.slice(0, startIdx) + keysStr + '\n' + content.slice(startIdx);

// Lang Update
const langs = ['English', 'Telugu', 'Bengali', 'Odia', 'Gujarati', 'Tamil', 'Malayalam'];
langs.forEach(lang => {
  const search = `${lang}: {`;
  const idx = content.indexOf(search) + search.length;
  const valuesStr = tValues.map(v => `    ${v},`).join('\n');
  content = content.slice(0, idx) + '\n' + valuesStr + content.slice(idx);
});

writeFileSync(path, content, 'utf8');
console.log('Updated translations for Culture SOP');
