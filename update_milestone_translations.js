import { readFileSync, writeFileSync } from 'fs';
const path = 'c:\\Users\\syamk\\Downloads\\Aquagrow\\src\\translations.ts';
let content = readFileSync(path, 'utf8');

const mKeys = [
  "stage5g: string;",
  "stage15g: string;",
  "stage25g: string;",
  "stage35g: string;",
  "daysTaken: string;",
  "sinceStocking: string;"
];

const mValues = [
  "stage5g: '5g Growth'",
  "stage15g: '15g Growth'",
  "stage25g: '25g Growth'",
  "stage35g: '35g Growth'",
  "daysTaken: 'Days Taken'",
  "sinceStocking: 'Since Stocking'"
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
  const valuesStr = mValues.map(v => `    ${v},`).join('\n');
  content = content.slice(0, idx) + '\n' + valuesStr + content.slice(idx);
});

writeFileSync(path, content, 'utf8');
console.log('Updated translations for expanded Growth Milestones');
