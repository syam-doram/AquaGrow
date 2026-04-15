const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';

let content = fs.readFileSync(path, 'utf8');

// Fix comment divider patterns - line by line approach
const lines = content.split('\n');
const fixed = lines.map(line => {
  // Fix "// €——‚¬ SectionName €—‚¬" style comments (section dividers)
  // Match pattern: starts with // then has garbage chars then label then more garbage
  if (/^\/\/ €/.test(line)) {
    // Extract the label between garbage sequences
    const cleaned = line
      .replace(/^\/\/ €[—\-–€‚¬]*/, '// ── ')
      .replace(/[€—‚¬\s]*$/, ' ──');
    return cleaned;
  }
  // Fix "{/* €—‚¬ ... €—‚¬ */}" JSX comments
  if (/\{\s*\/\* €/.test(line)) {
    return line.replace(/\{\s*\/\* €[—€‚¬\s]*([A-Z][A-Z \-''–]+?)[\s€—‚¬]* \*\/\}/g, (m, label) => `{/* ── ${label.trim()} ── */}`);
  }
  // Fix inline JSX text with €—... patterns (not comments)
  if (/'[^']*€[—‚¬€]+[^']*'/.test(line)) {
    return line
      .replace(/'([^']*?)€[—‚¬€]+ ([^']*?)'/g, "'$1→ $2'")
      .replace(/'([^']*?)€[—‚¬€]+([^']*?)'/g, "'$1 $2'");
  }
  // Fix '"€œ SOP Met' (checkmark)
  if (line.includes('"€œ SOP Met')) {
    return line.replace('"€œ SOP Met', "'✓ SOP Met");
  }
  // Fix " Go to Pond Details € ' Aerator"
  if (line.includes('Pond Details €')) {
    return line.replace('€ \'', '→');
  }
  return line;
});

content = fixed.join('\n');

// Fix remaining single-line inline corruption in strings
// '{isSopMet ? "€œ SOP Met' => fix checkmark
content = content.replace(/"€œ SOP Met'/g, "'✓ SOP Met'");
content = content.replace(/"€œ /g, '✓ ');

// Fix '€——‚¬' in single-line comments  
content = content.replace(/\/\/ €[—–\-€‚¬ ]+/g, '// ── ');
content = content.replace(/ [€—–‚¬ ]+$/gm, ' ──');

// Final cleanup: remove any standalone garbage chars near end of comment lines
content = content.replace(/(\/\/ [^\r\n]+?)[ €—‚¬]+(\r?\n)/g, '$1 ──$2');

fs.writeFileSync(path, content, 'utf8');

// Report
const remaining = content.split('\n').filter(l => /[^\x00-\x7F\u20B9\u2013\u2014\u2022\u00B7\u2019\u2018\u201C\u201D\u2192\u1F40F\uD83D\uDC1F\uD83C\uDF0A\uD83C\uDF3F]/.test(l));
console.log(`Remaining bad lines: ${remaining.length}`);
remaining.slice(0, 10).forEach((l, i) => console.log(`  ${l.substring(0, 100).trim()}`));
