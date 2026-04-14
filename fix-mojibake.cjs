const fs = require('fs');
const iconv = require('iconv-lite');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const newContent = content.replace(/[^\x00-\x7F]+/g, (match) => {
    try {
      // Encode it as win1252 (recovering the original utf8 bytes)
      const bytes = iconv.encode(match, 'win1252');
      // If the encode produced a '?' (0x3F) for chars that aren't in win1252, skip it
      if (bytes.includes(0x3F)) {
        return match;
      }
      
      const decoded = iconv.decode(bytes, 'utf8');
      
      // If the decoded string contains replacement characters, it means it wasn't valid utf8 bytes
      if (decoded.includes('\uFFFD')) {
        return match;
      }

      // If the text looks like a valid recovery (length typically shrinks because 3-4 corrupted bytes become 1 char)
      if (decoded.length < match.length) {
        changed = true;
        return decoded;
      }
      return match;
    } catch(e) {
      return match;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed ${filePath}`);
  } else {
    console.log(`No changes made to ${filePath}`);
  }
}

fixFile('src/pages/management/MedicineSchedule.tsx');
fixFile('src/pages/management/FeedManagement.tsx');
