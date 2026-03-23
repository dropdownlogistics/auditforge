const fs = require('fs');
let c = fs.readFileSync('src/app/app/page.js', 'utf8');

// These are the LITERAL ASCII mojibake strings stored in the file
// Verified by JSON.stringify inspection
const fixes = [
  ['Ã¢â‚¬â€"', '\u2014'],   // — em dash (long)
  ['Ã¢â‚¬â€', '\u2014'],    // — em dash (short form)
  ['Ã¢â€ â€™', '\u2192'],   // → right arrow
  ['Ã¢â€ â€"', '\u2190'],   // ← left arrow  
  ['Ã¢â‚¬â€™', '\u2019'],   // ' right single quote
  ['Ã¢Å"â€œ', '\u2713'],    // ✓ checkmark
  ['Ã¢Å"â€¢', '\u2715'],    // ✕ cross
  ['Ã¢Å¡Â ', '\u26A0 '],    // ⚠ warning
  ['Ã¢â€"Â²', '\u25B2'],    // ▲ up triangle
  ['Ã¢â€"Â¼', '\u25BC'],    // ▼ down triangle
  ['Ã¢â€"Â«', '\u25AB'],    // ▫ small square
  ['Ã¢â€"Â§', '\u25A7'],    // ▧ hatched square
  ['Ã¢â€"Ë†', '\u25A6'],    // ▦ square
  ['Ã¢â€"â€°', '\u25A4'],   // ▤ square
  ['Ã¢â€"â€¹', '\u25B9'],   // ▹ right triangle
  ['Ã¢â€"Â³', '\u25B3'],    // △ up triangle outline
  ['Ã¢Â¬Â¡', '\u2B21'],    // ⬡ hexagon
  ['Ã¢Â¬Â¢', '\u2B22'],    // ⬢ hexagon filled
  ['Ã¢Â¬â€™', '\u2B19'],   // ⬙ diamond
  ['Ã¢Å'â€¢', '\u2315'],    // ⌕ search
  ['Ã¢Å'Ëœ', '\u2318'],     // ⌘ cmd
  ['Ã¢â€â€œ', '\u2B07'],    // ⬇ download
  ['Ã¢â€â€˜Ã¢â€â€œ', '\u2191\u2193'], // ↑↓ nav arrows
  ['Ã¢â€Âµ', '\u21B5'],     // ↵ enter
  ['Ãƒâ€"', '\u00D7'],      // × multiply
  // Chaos → Structured → Automated (full string)
  ['Chaos Ã¢â€ â€™ Structured Ã¢â€ â€™ Automated', 'Chaos \u2192 Structured \u2192 Automated'],
  ['Sign In Ã¢â€â€™', 'Sign In \u2192'],
  ['Next Ã¢â€ â€™', 'Next \u2192'],
  ['\u201C Back', '\u2190 Back'],
  // FY2025 with em dash
  ['TIMELINE Ã¢â‚¬â€ FY', 'TIMELINE \u2014 FY'],
  // Separator dots already fixed but catch remaining
  ['Â·', '\u00B7'],
];

let totalFixed = 0;
fixes.forEach(([bad, good]) => {
  const count = c.split(bad).length - 1;
  if (count > 0) {
    console.log('Fixed ' + count + 'x: ' + JSON.stringify(bad) + ' -> ' + good);
    totalFixed += count;
    c = c.split(bad).join(good);
  }
});

fs.writeFileSync('src/app/app/page.js', c, 'utf8');
console.log('\nTotal fixes: ' + totalFixed);
console.log('done');
