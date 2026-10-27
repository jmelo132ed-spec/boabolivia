import fs from 'node:fs';

const s = fs.readFileSync('scripts/output-boa/js/ef-bundle.js', 'utf8');
const needles = [
  'familyInformation',
  'Económica',
  'Economica',
  'Business',
  'Promo',
  'Flex',
  'Light',
  'Classic',
  'equipaje',
  'Selecciona tu tarifa',
  'Tarifa',
  'cabin',
];
for (const n of needles) {
  let i = 0;
  let c = 0;
  while (c < 2) {
    const idx = s.indexOf(n, i);
    if (idx < 0) break;
    const chunk = s.slice(Math.max(0, idx - 180), idx + 220).replace(/\s+/g, ' ');
    if (!/react-dom|license|webpack/i.test(chunk)) {
      console.log('\n====', n, idx);
      console.log(chunk);
      c += 1;
    }
    i = idx + n.length;
    if (i > s.length) break;
  }
}
