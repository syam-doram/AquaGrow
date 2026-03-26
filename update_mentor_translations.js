import { readFileSync, writeFileSync } from 'fs';
const path = 'c:\\Users\\syamk\\Downloads\\Aquagrow\\src\\translations.ts';
let content = readFileSync(path, 'utf8');

const mKeys = [
  "expertMentor: string;",
  "todayTask: string;",
  "sopDescription: string;",
  "medicineBrand: string;",
  "recommendedDose: string;",
  "viewChecklist: string;",
  "complianceRule: string;",
  "criticalStageAlert: string;"
];

const mValues = [
  "expertMentor: 'Expert Mentor',",
  "todayTask: 'Today\\'s SOP Task',",
  "sopDescription: 'SOP Description',",
  "medicineBrand: 'Medicine / Brand',",
  "recommendedDose: 'Recommended Dose',",
  "viewChecklist: 'View Checklist',",
  "complianceRule: 'Compliance Rule',",
  "criticalStageAlert: 'CRITICAL STAGE ALERT',"
];

// Interface update
const interfaceSearch = "export interface Translations {\n";
const startIdx = content.indexOf(interfaceSearch) + interfaceSearch.length;
const keysStr = mKeys.map(k => `  ${k}`).join('\n');
content = content.slice(0, startIdx) + keysStr + '\n' + content.slice(startIdx);

// Language blocks update
const languages = ['English', 'Telugu', 'Bengali', 'Odia', 'Gujarati', 'Tamil', 'Malayalam'];
languages.forEach(lang => {
  const search = `${lang}: {`;
  const langStart = content.indexOf(search) + search.length;
  const valuesStr = mValues.map(v => `    ${v}`).join('\n');
  content = content.slice(0, langStart) + '\n' + valuesStr + content.slice(langStart);
});

writeFileSync(path, content, 'utf8');
console.log('Updated translations for Expert Mentor system.');
