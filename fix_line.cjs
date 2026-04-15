const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';

const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Fix line 1285 (0-indexed: 1284)
const targetIdx = 1284;
const line = lines[targetIdx];
console.log('Current line:', JSON.stringify(line.substring(0, 120)));

// Replace the entire desc line with a clean version
lines[targetIdx] = `  desc: 'In AquaGrow, go to Smart Farm, tap Add Device. Select the device type, enter its serial number (on label), and assign it to a pond. The sensor will sync live readings in 2-3 minutes.',`;

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Fixed line 1285');
