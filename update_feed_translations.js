import { readFileSync, writeFileSync } from 'fs';
const path = 'c:\\Users\\syamk\\Downloads\\Aquagrow\\src\\translations.ts';
let content = readFileSync(path, 'utf8');

const mKeys = [
  "nextFeed: string;",
  "fcrCalculator: string;",
  "feedConversionRatio: string;",
  "currentFCR: string;",
  "biomassEst: string;",
  "recalculateRatio: string;",
  "todaysConsumption: string;",
  "seeHistory: string;",
  "logFeedEntry: string;",
  "brand: string;",
  "qtyKg: string;",
  "scheduled: string;"
];

const mValues = [
  "nextFeed: 'Next Feed',",
  "fcrCalculator: 'FCR Calculator',",
  "feedConversionRatio: 'Feed Conversion Ratio',",
  "currentFCR: 'Current FCR',",
  "biomassEst: 'Biomass Est.',",
  "recalculateRatio: 'Recalculate Ratio',",
  "todaysConsumption: 'Today\\'s Consumption',",
  "seeHistory: 'See History',",
  "logFeedEntry: 'Log Feed Entry',",
  "brand: 'Brand',",
  "qtyKg: 'Qty (KG)',",
  "scheduled: 'Scheduled',"
];

// Interface
const interfaceSearch = "export interface Translations {\n";
const startIdx = content.indexOf(interfaceSearch) + interfaceSearch.length;
const keysStr = mKeys.map(k => `  ${k}`).join('\n');
content = content.slice(0, startIdx) + keysStr + '\n' + content.slice(startIdx);

// Languge Update
const langs = ['English', 'Telugu', 'Bengali', 'Odia', 'Gujarati', 'Tamil', 'Malayalam'];
langs.forEach(l => {
  const search = `${l}: {`;
  const lidx = content.indexOf(search) + search.length;
  const valuesStr = mValues.map(v => `    ${v}`).join('\n');
  content = content.slice(0, lidx) + '\n' + valuesStr + content.slice(lidx);
});

writeFileSync(path, content, 'utf8');
console.log('Updated translations for Feed Management system.');
