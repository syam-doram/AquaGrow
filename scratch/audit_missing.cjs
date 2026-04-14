
const fs = require('fs');

const content = fs.readFileSync('src/translations.ts', 'utf8');

function getKeys(sectionContent) {
    const lines = sectionContent.split('\n');
    const keys = new Set();
    lines.forEach(line => {
        const match = line.match(/^\s*(\w+):/);
        if (match) {
            keys.add(match[1]);
        }
    });
    return keys;
}

const interfaceMatch = content.match(/export interface Translations \{([\s\S]*?)\}/);
if (!interfaceMatch) {
    console.error('Interface not found');
    process.exit(1);
}
const interfaceKeys = getKeys(interfaceMatch[1]);

const objects = ['English', 'Telugu'];
objects.forEach(name => {
    const regex = new RegExp(`const ${name}: Translations = \\{([\\s\\S]*?)\\};`, 'm');
    const match = content.match(regex);
    if (match) {
        const objectKeys = getKeys(match[1]);
        const missing = [...interfaceKeys].filter(k => !objectKeys.has(k));
        const extra = [...objectKeys].filter(k => !interfaceKeys.has(k));
        
        if (missing.length > 0) {
            console.log(`Missing keys in ${name}: ${missing.join(', ')}`);
        }
        if (extra.length > 0) {
            console.log(`Extra keys in ${name}: ${extra.join(', ')}`);
        }
    } else {
        console.log(`${name} object not found or incomplete`);
    }
});
