const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';
let raw = fs.readFileSync(path, 'utf8');
const lines = raw.split(/\r?\n/);

// Find all lines matching patterns like:
// - Something without { at start but has } inside JSX text
// - Pattern: >WORD.something} or just word}
const issues = [];
lines.forEach((line, i) => {
  // In JSX text, a lone } that's not in an expression is a syntax error
  // Check for patterns like >word.method()} which means the { was eaten
  const m1 = line.match(/>[^{}\r\n]*[a-z][a-z0-9.'\(\)']*\}/g);
  if (m1) {
    // Filter out className etc
    const valid = m1.filter(m => !m.includes('className') && !m.includes('style=') && !m.includes('=>'));
    if (valid.length > 0) {
      issues.push({ line: i + 1, text: line.trim().substring(0, 120), matches: valid });
    }
  }
});

console.log('Suspicious lines with bare } in JSX text:');
issues.forEach(iss => {
  console.log(`  L${iss.line}: ${iss.text}`);
  console.log(`    Pattern: ${iss.matches.join(', ')}`);
});

// Now fix them
const fixed = lines.map((line, i) => {
  // Line 579 (0-indexed 578): restore posLabel
  if (i === 578 && line.includes("— ") && !line.includes('{posLabel}')) {
    return line + '{posLabel}</span>';
  }
  // Line 999 (0-indexed 998): restore ₹{entry.amount
  if (i === 998) {
    return line.replace(/>[^<]*entry\.amount\.toLocaleString\('en-IN'\)\}/, '>₹{entry.amount.toLocaleString(\'en-IN\')}');
  }
  // General pattern: detect bare expressions missing { 
  // Pattern: >word.method(args)} - add { before word
  return line.replace(/>([a-z][a-zA-Z0-9.'\(\),']+)\}/g, (match, expr) => {
    // Only fix if this looks like a JS expression, not normal text
    if (expr.includes('.') || expr.includes('(')) {
      return `>{${expr}}`;
    }
    return match;
  });
});

const output = fixed.join('\r\n');
fs.writeFileSync(path, output, 'utf8');
console.log('\nApplied fixes. Key lines:');
console.log('L579:', fixed[578].trim().substring(0, 100));
console.log('L999:', fixed[998].trim().substring(0, 120));
