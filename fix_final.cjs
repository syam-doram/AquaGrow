const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';

let content = fs.readFileSync(path, 'utf8');

// Fix the specific broken string on the IoT guide step
// It has: 'In AquaGrow, go to Smart Farm € ' Add Device...
// The € ' breaks the string - replace with the correct arrow
content = content.replace(
  /go to Smart Farm [^\w]+ ['']? Add Device/,
  'go to Smart Farm \u2192 Add Device'
);

// Also fix the watermonitor LIVE badge reference
content = content.replace(/You should see [^\w]+ LIVE badge/g, 'You should see 🔴 LIVE badge');

// Fix checkmark string: {isSopMet ? '"€œ SOP Met'
content = content.replace(/'\u201c\u20ac\u0153 SOP Met'|'"€œ SOP Met'|'\u201c SOP Met'/g, "'✓ SOP Met'");
content = content.replace(/"€œ SOP Met"/g, '"✓ SOP Met"');

// Fix the ✓ SOP met that may still have a garbage char
content = content.replace(/['"]\u2018€\u0153 SOP Met['"]/g, "'✓ SOP Met'");

// Fix the arrow in checkmark
content = content.replace(/→ Aerator Management/g, '→ Aerator Management');

// Fix troubleshoot arrows
content = content.replace(/>\u2018€- \{item\.problem\}/g, '>⚠ {item.problem}');
content = content.replace(/>\u2018€T \{item\.fix\}/g, '>→ {item.fix}');

// Save
fs.writeFileSync(path, content, 'utf8');
console.log('Done');

// Run a quick build check by parsing
try {
  const lines = content.split('\n');
  let singleQuotes = 0;
  lines.forEach((line, i) => {
    // Simply check for unterminated strings in desc: lines
    if (line.trim().startsWith("desc:")) {
      const inStr = line.indexOf("'");
      const outStr = line.lastIndexOf("'");
      if (inStr === outStr) {
        console.log(`Possible unterminated string at L${i+1}: ${line.substring(0, 80)}`);
      }
    }
  });
  console.log('String check complete');
} catch(e) {
  console.error(e);
}
