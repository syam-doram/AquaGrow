const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';

let content = fs.readFileSync(path, 'utf8');

// Remove BOM if present
content = content.replace(/^\uFEFF/, '');

// Fix comment decorators - replace all variations of garbled dashes
// The pattern is like: // €——‚¬ SectionName €———...—‚¬
content = content.replace(/\/\/ €[—\-–\s‚¬€]*([A-Za-z][^\r\n]*?)(\s*€[—\-–\s‚¬€]*)/g, '// ── $1 ──');

// Fix inline JSX spans with emoji garbage like <span className="text-sm">°¦</span>
// Replace fish emoji span
content = content.replace(/<span className="text-sm">°¦<\/span>/g, '<span className="text-sm">🐟</span>');
content = content.replace(/<span className="text-xs">°€œ€ <\/span>/g, '<span className="text-xs">📅</span>');

// Fix the '→' arrow in modal text  
content = content.replace(/Smart Farm € →/g, 'Smart Farm → ');

// Fix remaining rupee signs in template literals
// These appear as €š¹ but were already fixed - check for any missed €-starting sequences
// in template literals
content = content.replace(/`€š¹\$\{/g, '`₹${');
content = content.replace(/>€š¹\{/g, '>₹{');
content = content.replace(/>€š¹/g, '>₹');
content = content.replace(/'€š¹/g, "'₹");

// Fix the ‚¬º bullet character used in step arrows
content = content.replace(/‚¬º/g, '→');

// Fix remaining '€' garbage that aren't needed - in JSX text
content = content.replace(/<span className="text-\[8px\]">°¦<\/span>/g, '<span className="text-[8px]">🐟</span>');

// Fix "€" left in JSX text nodes
content = content.replace(/>\s*€["€‚ž›œš¹—–‚¬·]+\s*</g, match => {
  // Clean up the garbage between > and <
  return match.replace(/€[^\x00-\x7F]*/g, '').replace(/>(\s*)</, (m, space) => `>${space}<`);
});

// Write back
fs.writeFileSync(path, content, 'utf8');

// Final check
const lines = content.split('\n');
let remaining = [];
lines.forEach((line, i) => {
  if (/[^\x00-\x7F\u20B9\u2013\u2014\u2022\u00B7\u2019\u2018\u201C\u201D\u2026\u00B0\u2192\u2190\u2193\u2191]/.test(line)) {
    remaining.push(`L${i+1}: ${line.substring(0, 100).trim()}`);
  }
});
console.log(`Remaining corrupt lines: ${remaining.length}`);
remaining.slice(0, 20).forEach(l => console.log(l));
