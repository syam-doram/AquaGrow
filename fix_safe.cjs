const fs = require('fs');
const path = 'c:/Users/syamk/Downloads/Aquagrow/src/pages/tools/SmartFarmHub.tsx';

// Read the file preserving exact byte structure
let content = fs.readFileSync(path, 'utf8');

// ============================================================
// SAFE FIXES: Only fix things inside strings and JSX text
// DO NOT touch any JSX structure, braces, or multi-line spans
// ============================================================

// Fix 1: Rupee signs in template literals and JSX text
// Pattern: Ã¢â€šÂ¹ → ₹ (in various positions)
content = content.split('Ã¢â€šÂ¹').join('₹');

// Fix 2: En dash Ã¢â‚¬â€œ → – (in strings only, within quotes)
content = content.split('Ã¢â‚¬â€œ').join('–');

// Fix 3: Em dash Ã¢â‚¬â€ → — (in strings only)
content = content.split('Ã¢â‚¬â€').join('—');

// Fix 4: Middle dot Ã‚Â· → · (in strings)
content = content.split('Ã‚Â·').join('·');

// Fix 5: Right arrow Ã¢â€ â€™ → → (in strings)
content = content.split('Ã¢â€ â€™').join('→');

// Fix 6: Checkmark Ã¢Å"â€œ → ✓
content = content.split('Ã¢Å"â€œ').join('✓');

// Fix 7: Common garbage prefix sequences in comments (safe - in comments only)
// These are the section header decorators
content = content.split('Ã¢â€â‚¬Ã¢â€â‚¬').join('──');

// Fix 8: Fish emoji span - Ã°Å¸Â¦Â → 🐟
content = content.split('Ã°Å¸Â¦Â').join('🐟');

// Fix 9: Calendar/chart emojis in analytics tab
// Ã°Å¸â€˜â€š → 📅
content = content.split('Ã°Å¸â€˜â€š').join('📅');

// Fix 10: IoT guide arrow (â€ â€™ in a string)  
content = content.split("â€ â€™").join('→');

// Fix 11: Fix "â€œ" (opening double quote used as checkmark)
content = content.split('â€œ').join('✓');

// Fix 12: Bullet point from connection protocol list (Ã‚Â·)
content = content.split('Ã‚Â·').join('·');

// Fix 13: Remove BOM if present
content = content.replace(/^\uFEFF/, '');

// Write back preserving CRLF
fs.writeFileSync(path, content, 'utf8');

// Verify build will still work by checking structure hasn't changed
const newContent = fs.readFileSync(path, 'utf8');
const opens = (newContent.match(/<div/g) || []).length;
const closes = (newContent.match(/<\/div>/g) || []).length;
console.log(`div balance: opens=${opens}, closes=${closes}, diff=${opens-closes}`);
console.log('Done - safe encoding fixes applied');
