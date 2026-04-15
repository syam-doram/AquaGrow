const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';

let content = fs.readFileSync(path, 'utf8');

// Map of corrupted sequences → correct replacements
const fixes = [
  // Rupee sign (₹) encoded as various garbage
  [/\?s\?/g, '₹'],
  // En dash (–)
  [/\?o/g, '–'],
  // Em dash (—)  typically ǽ sequence
  [/ǽ[^\x00-\x7F]*/g, ''],
  // Arrow →
  [/\?T/g, '→'],
  // Bullet ·
  [/\?·/g, '·'],
  // Any remaining non-ASCII junk that ISN'T an emoji or valid symbol
];

// More targeted approach: replace known bad sequences
const replacements = [
  // Year ranges like 2022–23
  ['2022ǽ\u00b4?o23', '2022–23'],
  ['2023ǽ\u00b4?o24', '2023–24'],
  ['2024ǽ\u00b4?o25', '2024–25'],
];

// Remove all non-ASCII characters that appear to be corrupted
// Keep: standard ASCII (0x00-0x7F) + actual Unicode symbols we want
// Remove: garbage mojibake sequences
content = content.replace(/[\u01BD\u00B4\u00AB\u00BB\u00C3\u00A2\u00E2\u0080\u0082\u0083\u0086\u0087\u0088\u0089\u008A\u008B\u009A\u009B\u009C\u009D\u009E\u009F\u00C2\u00B4\u00C5\u00BD\u00C4\u00B8\u00C9\u00BD\u0139]+/g, '');

// Fix comment separators that lost characters
content = content.replace(/\u2014+/g, '──');

// Fix rupee signs that survived
content = content.replace(/\?s\?/g, '₹');
content = content.replace(/Rs\./g, '₹');

// Clean up any double spaces that might have appeared
content = content.replace(/  +/g, ' ');

fs.writeFileSync(path, content, 'utf8');

// Count remaining non-ASCII
const remaining = (content.match(/[^\x00-\x7F]/g) || []).length;
console.log(`Done. Remaining non-ASCII chars: ${remaining}`);

// Show what remains  
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (/[^\x00-\x7F]/.test(line)) {
    console.log(`L${i+1}: ${line.substring(0, 100)}`);
  }
});
