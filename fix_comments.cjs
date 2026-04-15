const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';
let raw = fs.readFileSync(path, 'utf8');
const lines = raw.split(/\r?\n/);

// Find and fix JSX comments with non-ASCII content
let fixCount = 0;
const fixed = lines.map((line, i) => {
  // Detect JSX comment with non-ASCII: {/* ... */}
  if (line.includes('{/*') && /[^\x00-\x7F]/.test(line)) {
    // Extract the comment label (between the junk chars)
    const cleanLine = line.replace(/\{\/\*\s*[€—‚¬\s]*([A-Z][A-Z\s]*?)[\s€—‚¬]*\s*\*\/\}/g, (m, label) => {
      fixCount++;
      return `{/* ── ${label.trim()} ── */}`;
    });
    if (cleanLine !== line) {
      console.log(`Fixed L${i+1}: ${cleanLine.trim().substring(0, 80)}`);
      return cleanLine;
    }
    // If pattern didn't match, just remove non-ASCII from within the comment
    return line.replace(/[^\x00-\x7F]/g, '');
  }
  return line;
});

const output = fixed.join('\r\n');
fs.writeFileSync(path, output, 'utf8');
console.log(`\nTotal JSX comment fixes: ${fixCount}`);

// Double check build-breaking patterns
const remaining = fixed.filter(l => l.includes('{/*') && /[^\x00-\x7F]/.test(l));
console.log(`Remaining bad JSX comments: ${remaining.length}`);
remaining.forEach(l => console.log('  ' + l.trim().substring(0, 80)));
