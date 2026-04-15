const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';
let raw = fs.readFileSync(path, 'utf8');

const lines = raw.split(/\r?\n/);

// Fix L1027 - calendar emoji span  
lines[1026] = `  <span className="text-xs">📅</span>`;

// Fix L1379 and L1380 - JSX text corruption (0-indexed 1378, 1379)
// These have €œ and € ' directly in JSX text
const l1379 = lines[1378];
console.log('L1379:', JSON.stringify(l1379.trim().substring(0, 80)));

const l1380 = lines[1379];
console.log('L1380:', JSON.stringify(l1380.trim().substring(0, 80)));

// Replace the garbage before {item.problem}  
lines[1378] = l1379.replace(/>[^{<]*\{item\.problem\}/, '>⚠ {item.problem}');
lines[1379] = l1380.replace(/>[^{<]*\{item\.fix\}/, '>→ {item.fix}');

const output = lines.join('\r\n');
fs.writeFileSync(path, output, 'utf8');

console.log('\nAfter fix:');
console.log('L1027:', lines[1026].trim());
console.log('L1379:', lines[1378].trim().substring(0, 80));
console.log('L1380:', lines[1379].trim().substring(0, 80));
