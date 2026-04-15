const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';
const raw = fs.readFileSync(path, 'utf8');

// Split on actual line boundaries (handles mixed \r\n and \n)
const lines = raw.split(/\r?\n/);

console.log(`Total lines: ${lines.length}`);

// Find and report lines with unbalanced quotes that could cause parse issues
// Also find lines with bare non-ASCII in JSX text that could be quote-like
const probLines = [];
lines.forEach((line, i) => {
  // Check for lines that have JSX content (not in className strings) with non-ASCII
  if (line.includes('}>') || line.includes(')}>')) return; // skip class closings
  if (/>\s*[^\x00-\x7F<{]/.test(line)) {
    probLines.push({ line: i + 1, text: line.trim().substring(0, 120) });
  }
});

console.log('Potentially problematic JSX text lines:');
probLines.slice(0, 20).forEach(l => console.log(`  L${l.line}: ${l.text}`));

// Now fix them
const fixed = lines.map((line, i) => {
  // Replace any non-ASCII characters that appear directly inside JSX text content
  // Pattern: >GARBAGE{...} — replace garbage with appropriate symbol
  
  // Fix lines with non-ASCII directly after > and before {
  let newLine = line.replace(/>([^\x00-\x7F]+)\s*\{/g, (match, garbage, offset) => {
    // Determine what the garbage char was supposed to be
    // Check surrounding context
    if (/warning|problem|issue|error/i.test(line)) return '>⚠ {';
    if (/fix|solution|action/i.test(line)) return '>→ {';
    return '>'; // just remove the garbage
  });
  
  return newLine;
});

const output = fixed.join('\r\n');
fs.writeFileSync(path, output, 'utf8');
console.log('\nFix applied');
