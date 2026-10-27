import fs from 'node:fs';

const s = fs.readFileSync('scripts/output-boa/js/ef-bundle.js', 'utf8');

const apis = [...s.matchAll(/["'`](\/Api\/[^"'`]+)["'`]/g)].map((m) => m[1]);
console.log('=== /Api/ paths ===');
console.log([...new Set(apis)].join('\n'));

const more = [...s.matchAll(/["'`](\/(Api|API|api|Availability|Resources)\/[^"'`]{0,80})["'`]/g)].map(
  (m) => m[1],
);
console.log('\n=== more paths ===');
console.log([...new Set(more)].join('\n'));

function dump(term, n = 3, pad = 700) {
  let idx = 0;
  for (let c = 0; c < n; c++) {
    const i = s.indexOf(term, idx);
    if (i < 0) break;
    console.log('\n====', term, i);
    console.log(s.slice(Math.max(0, i - pad), i + pad).replace(/\s+/g, ' '));
    idx = i + term.length;
  }
}

dump('/Api/Availability/Calendar');
dump('/Api/Availability/Upsell');
dump('Availability/Calendar');
dump('Availability/Upsell');
