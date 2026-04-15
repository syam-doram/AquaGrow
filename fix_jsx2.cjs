const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';
let raw = fs.readFileSync(path, 'utf8');
const lines = raw.split(/\r?\n/);

// Fix L579 (0-indexed: 578) - restore {posLabel}
const l578 = lines[578];
console.log('L579 current:', JSON.stringify(l578.trim().substring(0, 100)));
if (l578.includes('posLabel}') && !l578.includes('{posLabel}')) {
  lines[578] = l578.replace('posLabel}', '{posLabel}').replace('></span>', '> — {posLabel}</span>').replace('{posLabel}</span>', '— {posLabel}</span>');
  // Simpler: just replace the broken portion
  lines[578] = `  Aerator {ai + 1} <span className={cn('font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>— {posLabel}</span>`;
}

// Fix L999 (0-indexed: 998) - restore ₹{entry.amount...}
const l998 = lines[998];
console.log('L999 current:', JSON.stringify(l998.trim().substring(0, 120)));
if (l998.includes("entry.amount.toLocaleString('en-IN')}") && !l998.includes('{entry.amount')) {
  lines[998] = l998.replace(/>[^<]*entry\.amount\.toLocaleString\('en-IN'\)\}/, '>₹{entry.amount.toLocaleString(\'en-IN\')}');
}

// Write back
const output = lines.join('\r\n');
fs.writeFileSync(path, output, 'utf8');

console.log('\nAfter fix:');
console.log('L579:', lines[578].trim().substring(0, 100));
console.log('L999:', lines[998].trim().substring(0, 120));
