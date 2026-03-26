import { readFileSync, writeFileSync } from 'fs';
const path = 'c:\\Users\\syamk\\Downloads\\Aquagrow\\src\\translations.ts';
let content = readFileSync(path, 'utf8');

// Clear Interface Duplicates
const interfaceMatch = content.match(/export interface Translations \{([\s\S]+?)\}/);
if (interfaceMatch) {
  const keys = interfaceMatch[1].split('\n').map(l => l.trim()).filter(l => l);
  const uniqueKeys = Array.from(new Set(keys)).join('\n  ');
  content = content.replace(interfaceMatch[1], '\n  ' + uniqueKeys + '\n');
}

const langs = ['English', 'Telugu', 'Bengali', 'Odia', 'Gujarati', 'Tamil', 'Malayalam'];

langs.forEach(lang => {
  const match = content.match(new RegExp(`${lang}: \\{([\\s\\S]+?)\\},`));
  if (match) {
    const lines = match[1].split('\n');
    const seen = new Set();
    const uniqueLines = [];
    lines.forEach(line => {
      const keyMatch = line.match(/(\w+):/);
      if (keyMatch) {
        const key = keyMatch[1];
        if (!seen.has(key)) {
          seen.add(key);
          uniqueLines.push(line);
        }
      } else {
         uniqueLines.push(line);
      }
    });
    content = content.replace(match[1], uniqueLines.join('\n'));
  }
});

writeFileSync(path, content, 'utf8');
console.log('Cleaned up duplicates in translations.ts');
