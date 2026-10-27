import fs from 'node:fs';

const s = fs.readFileSync('scripts/output-boa/js/index-CBVAL4rd.js', 'utf8');

const i = s.indexOf('/api/Reserve/GetComponent');
console.log(s.slice(i - 800, i + 2500).replace(/\s+/g, ' '));

console.log('\n\n===== CFF / flightClass =====');
let idx = 0;
for (let n = 0; n < 5; n++) {
  const j = s.indexOf('flightClass', idx);
  if (j < 0) break;
  console.log(s.slice(j - 200, j + 250).replace(/\s+/g, ' '), '\n---');
  idx = j + 12;
}
