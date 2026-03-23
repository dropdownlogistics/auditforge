const fs = require('fs');
let c = fs.readFileSync('src/app/app/page.js', 'utf8');

// All bad strings expressed as Buffer.from() to avoid encoding issues
const fixes = [
  // Middle dot
  [Buffer.from([0xC2, 0xB7]).toString(), '\u00B7'],
  // Em dash
  [Buffer.from([0xE2, 0x80, 0x94]).toString(), '\u2014'],
  // Right arrow
  [Buffer.from([0xE2, 0x86, 0x92]).toString(), '\u2192'],
  // Bullet
  [Buffer.from([0xE2, 0x80, 0xA2]).toString(), '\u2022'],
  // Checkmark
  [Buffer.from([0xE2, 0x9C, 0x93]).toString(), '\u2713'],
  // Cross
  [Buffer.from([0xE2, 0x9C, 0x95]).toString(), '\u2715'],
  // Warning
  [Buffer.from([0xE2, 0x9A, 0xA0]).toString(), '\u26A0'],
  // Triangle up
  [Buffer.from([0xE2, 0x96, 0xB2]).toString(), '\u25B2'],
  // Triangle down
  [Buffer.from([0xE2, 0x96, 0xBC]).toString(), '\u25BC'],
  // En dash
  [Buffer.from([0xE2, 0x80, 0x93]).toString(), '\u2013'],
];

let totalFixed = 0;
fixes.forEach(([bad, good]) => {
  const count = c.split(bad).length - 1;
  if (count > 0) {
    console.log('Fixed ' + count + 'x: U+' + good.codePointAt(0).toString(16).toUpperCase());
    totalFixed += count;
    c = c.split(bad).join(good);
  }
});

fs.writeFileSync('src/app/app/page.js', c, 'utf8');
console.log('Total fixes: ' + totalFixed);
console.log('done');
