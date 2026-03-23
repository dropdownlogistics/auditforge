const fs = require('fs');
let c = fs.readFileSync('src/app/app/page.js', 'utf8');

// These are UTF-8 sequences that were double-encoded
// Each bad string is the mojibake, each good string is the correct character
const fixes = [
  // Middle dot ·
  ['Â·', '·'],
  // Em dash —
  ['â€"', '—'],
  // En dash –
  ['â€"', '–'],
  // Right arrow →
  ['â†'', '→'],
  ['Ã¢â€ â€™', '→'],
  ['Ã¢â€ â€"', '→'],
  // Left arrow ←
  ['Ã¢â€ Â Back', '← Back'],
  // Bullet •
  ['â€¢', '•'],
  // Checkmark ✓
  ['Ã¢Å"â€œ', '✓'],
  // Cross ✕ / ✗
  ['Ã¢Å"â€¢', '✕'],
  // Warning ⚠
  ['Ã¢Å¡Â ', '⚠ '],
  // Triangle up ▲
  ['Ã¢â€"Â²', '▲'],
  // Triangle down ▼
  ['Ã¢â€"Â¼', '▼'],
  // Box drawing ─
  ['Ã¢â€â‚¬', '─'],
  // Multiplication ×
  ['Ãƒâ€"', '×'],
  // Search icon ⌕
  ['Ã¢Å'â€¢', '⌕'],
  // Cmd ⌘
  ['Ã¢Å'Ëœ', '⌘'],
  // Download ⬇
  ['Ã¢â€â€œ', '⬇'],
  // Various box icons used as nav icons
  ['Ã¢â€"â€°', '▤'],
  ['Ã¢â€"Ë†', '▦'],
  ['Ã¢Â¬Â¡', '⬡'],
  ['Ã¢â€"Â³', '▵'],
  ['Ã¢â€"Â«', '▫'],
  ['Ã¢Â¬Â¢', '⬢'],
  ['Ã¢Â¬â€™', '⬙'],
  ['Ã¢â€"â€¹', '▹'],
  ['Ã¢â€"Â§', '▧'],
  // Arrow keys in search hint
  ['Ã¢â€Âµ', '↵'],
  ['Ã¢â€â€˜Ã¢â€â€œ', '↑↓'],
  // Em dash used as separator
  ['Ã¢â‚¬â€"', '—'],
  ['Ã¢â‚¬â€', '—'],
  // Next button arrow
  ['Next Ã¢â€ â€™', 'Next →'],
  // Sign in arrow
  ['Sign In Ã¢â€â€™', 'Sign In →'],
  // Chaos → Structured → Automated
  ['Chaos Ã¢â€ â€™ Structured Ã¢â€ â€™ Automated', 'Chaos → Structured → Automated'],
];

let totalFixed = 0;
fixes.forEach(([bad, good]) => {
  const count = (c.split(bad)).length - 1;
  if (count > 0) {
    console.log(`Fixed ${count}x: ${JSON.stringify(bad)} → ${JSON.stringify(good)}`);
    totalFixed += count;
    c = c.split(bad).join(good);
  }
});

// Also fix comment box drawing characters (cosmetic only, in comments)
c = c.replace(/â"€â"€/g, '──');
c = c.replace(/Ã¢â€â‚¬Ã¢â€â‚¬/g, '──');

fs.writeFileSync('src/app/app/page.js', c, 'utf8');
console.log(`\nTotal fixes: ${totalFixed}`);
console.log('done');
