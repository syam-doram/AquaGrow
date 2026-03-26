import { readFileSync, writeFileSync } from 'fs';
const path = 'c:\\Users\\syamk\\Downloads\\Aquagrow\\src\\translations.ts';
let content = readFileSync(path, 'utf8');

const interfaceKeys = [
  "cultureTimeline: string;",
  "growthMilestones: string;",
  "logEntry: string;",
  "weightLabel: string;",
  "stage10g: string;",
  "stage20g: string;",
  "stage30g: string;",
  "dailyStats: string;",
  "readyForHarvest: string;"
];

const keys = [
  "cultureTimeline: 'Culture Timeline'",
  "growthMilestones: 'Growth Milestones'",
  "logEntry: 'Register Daily Log'",
  "weightLabel: 'Avg. Body Weight'",
  "stage10g: '10g Growth'",
  "stage20g: '20g Growth'",
  "stage30g: '30g Growth'",
  "dailyStats: 'Daily Statistics'",
  "readyForHarvest: 'Ready for Harvest'"
];

// Update Interface
const interfaceSearch = "export interface Translations {\n";
const interfaceStartIdx = content.indexOf(interfaceSearch);
const interfaceEndIdx = content.indexOf('}', interfaceStartIdx);
if (interfaceEndIdx !== -1) {
    const keysStr = interfaceKeys.map(k => `  ${k}`).join('\n');
    content = content.slice(0, interfaceEndIdx) + keysStr + '\n' + content.slice(interfaceEndIdx);
}

const langs = ['English', 'Telugu', 'Bengali', 'Odia', 'Gujarati', 'Tamil', 'Malayalam'];

langs.forEach(lang => {
  const searchStr = `${lang}: {`;
  const startIdx = content.indexOf(searchStr);
  if (startIdx !== -1) {
    let endIdx = content.indexOf('  },', startIdx);
    if (endIdx === -1) endIdx = content.indexOf('  }', startIdx); 
    if (endIdx !== -1) {
      const keysStr = keys.map(k => `    ${k},`).join('\n');
      content = content.slice(0, endIdx) + keysStr + '\n  ' + content.slice(endIdx);
    }
  }
});

writeFileSync(path, content, 'utf8');
console.log('Updated translations.ts for Pond Culture Timeline');
