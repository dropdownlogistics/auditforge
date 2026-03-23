const fs = require('fs');
let c = fs.readFileSync('src/app/app/page.js', 'utf8');

const fixes = [
  ['\u00c2\u00b7', '\u00b7'],        // Â· → ·
  ['\u00e2\u0080\u0094', '\u2014'],  // â€" → —
  ['\u00e2\u0080\u0099', '\u2019'],  // â€™ → '
  ['\u00e2\u0086\u0092', '\u2192'],  // â†' → →
  ['\u00e2\u0080\u00a2', '\u2022'],  // â€¢ → •
  ['\u00e2\u0080\u0093', '\u2013'],  // â€" → –
];

fixes.forEach(([bad, good]) => {
  const count = (c.split(bad)).length - 1;
  if (count > 0) console.log(`Fixed ${count}x: U+${bad.charCodeAt(0).toString(16)}`);
  c = c.split(bad).join(good);
});

fs.writeFileSync('src/app/app/page.js', c, 'utf8');
console.log('done');
