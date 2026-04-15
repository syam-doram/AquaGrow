const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';

let content = fs.readFileSync(path, 'utf8');

// Fix all known corrupted sequences (in order of specificity)
const fixes = [
  // Rupee sign ₹
  ['€š¹', '₹'],
  // En dash –
  ['‚¬€œ', '–'],
  // Em dash —
  ['‚¬€', '—'],
  // Middle dot ·
  ['‚·', '·'],
  // Comment dividers ── 
  ['€‚¬€‚¬', '──'],
  // Arrow →
  ['€ €™', '→'],
  ['€™', "'"],
  // Checkmark ✅
  ['"€œ', '✓'],
  // Fish emoji 🐟
  ['°¦', '🐟'],
  // Wave emoji 🌊
  ['°€œ€¦', '📅'],
  ['°€œ€ ', '📆'],
  // Bullet •
  ['‚¬º', '•'],
  // Warning emoji remainders
  ['€"', '🔴'],
  // Special dash in year ranges
  ['‚¬€œ', '–'],
  // Right single quotation
  ['€™', "'"],
  // Remove remaining multi-byte garbage sequences
  ['€€', ''],
  // Any remaining € sequences that are garbage
];

for (const [from, to] of fixes) {
  content = content.split(from).join(to);
}

fs.writeFileSync(path, content, 'utf8');

// Report remaining
const lines = content.split('\n');
let count = 0;
lines.forEach((line, i) => {
  if (/[^\x00-\x7F\u20B9\u2013\u2014\u2022\u00B7\u2019\u2018\u201C\u201D\u2026\u00B0\u2192\u2190\u2193\u2191\u2665\u2764\u2714\u2718\u25CF]/.test(line)) {
    count++;
    if (count <= 5) console.log(`L${i+1}: ${line.substring(0, 80)}`);
  }
});
console.log(`\nDone. Lines with remaining non-ASCII: ${count}`);
