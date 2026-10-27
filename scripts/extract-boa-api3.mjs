import fs from 'node:fs';

const s = fs.readFileSync('scripts/output-boa/js/index-CBVAL4rd.js', 'utf8');

function around(term, n = 4, pad = 250) {
  const out = [];
  const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  let m;
  let i = 0;
  while ((m = rx.exec(s)) && i < n) {
    out.push(s.slice(Math.max(0, m.index - pad), m.index + pad).replace(/\s+/g, ' '));
    i += 1;
  }
  return out;
}

for (const t of [
  'reservePathname',
  'setReservePathname',
  'reserveNames',
  'iframe',
  'booking.boa',
  'reservas.',
  'travelhub',
  'radixx',
  'accelya',
  'ibs',
  'radixx',
  'travelport',
  'navitaire',
  'newskies',
  'dotrez',
  'flyboa',
  'websky',
  'sirena',
  'sabre',
  'amadeus.net',
  'altair',
]) {
  const hits = around(t, 3);
  if (hits.length) {
    console.log('\n====', t);
    hits.forEach((h) => console.log(h, '\n---'));
  }
}
