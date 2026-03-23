const fs = require('fs');
let c = fs.readFileSync('src/app/app/page.js', 'utf8');

// Build the mojibake strings from char codes to avoid encoding issues
// Each bad string is built from the actual ASCII chars in the file
function chars(...codes) { return codes.map(n => String.fromCharCode(n)).join(''); }

const fixes = [
  // em dash: Ã¢â‚¬â€" (the long one with trailing dash)
  [chars(195,162,226,130,172,226,128,148), '\u2014'],
  // em dash: Ã¢â‚¬â€ (short form)  
  [chars(195,162,226,130,172,226,128,147), '\u2014'],
  // right arrow: Ã¢â€ â€™
  [chars(195,162,195,162,226,128,172,195,162,226,128,153), '\u2192'],
  // checkmark: Ã¢Å"â€œ
  [chars(195,162,195,133,226,128,156), '\u2713'],
  // cross: Ã¢Å"â€¢
  [chars(195,162,195,133,226,128,162), '\u2715'],
  // warning: Ã¢Å¡Â 
  [chars(195,162,195,133,194,161,194,160), '\u26A0 '],
  // middle dot remaining
  [chars(195,130,194,183), '\u00B7'],
];

let totalFixed = 0;
fixes.forEach(([bad, good]) => {
  const count = c.split(bad).length - 1;
  if (count > 0) {
    console.log('Fixed ' + count + 'x -> ' + good);
    totalFixed += count;
    c = c.split(bad).join(good);
  }
});

// Verify the ENGAGEMENT TIMELINE line
const idx = c.indexOf('ENGAGEMENT TIMELINE');
if (idx > -1) {
  console.log('TIMELINE chunk after fix: ' + JSON.stringify(c.slice(idx, idx+35)));
}

fs.writeFileSync('src/app/app/page.js', c, 'utf8');
console.log('Total: ' + totalFixed);
