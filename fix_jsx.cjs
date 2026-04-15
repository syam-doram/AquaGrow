const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\r\n');

// Fix line 1379 (0-indexed: 1378) - warning icon before problem
const l1 = lines[1378];
console.log('L1379:', JSON.stringify(l1.substring(0, 100)));
// Replace whatever garbage is before {item.problem} with a warning emoji
lines[1378] = `  <p className={cn('text-[8px] font-black mb-0.5', isDark ? 'text-white/70' : 'text-slate-700')}>⚠ {item.problem}</p>`;

// Fix line 1380 (0-indexed: 1379) - arrow before fix
const l2 = lines[1379];
console.log('L1380:', JSON.stringify(l2.substring(0, 100)));
lines[1379] = `  <p className={cn('text-[8px] font-medium leading-snug', isDark ? 'text-white/40' : 'text-slate-500')}>→ {item.fix}</p>`;

content = lines.join('\r\n');
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed!');
