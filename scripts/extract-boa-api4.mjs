import fs from 'node:fs';

const s = fs.readFileSync('scripts/output-boa/js/index-CBVAL4rd.js', 'utf8');

function dumpAround(label, idx, pad = 1200) {
  const start = Math.max(0, idx - pad);
  const chunk = s.slice(start, idx + pad).replace(/\s+/g, ' ');
  console.log('\n====', label, 'idx', idx);
  console.log(chunk);
}

const terms = [
  'setReservePathname(',
  'setReservePathname:',
  'componentType',
  'behabiorCode',
  'BookComponent',
  '/api/',
  'CallGet',
  'Availability',
  'availability',
  'AirShopping',
  'GetFlights',
  'SearchFlight',
  'searchFlight',
  'flightSearch',
  'FlightSearch',
  'GetAvailability',
  'GetRoutes',
  'GetCalendar',
  'lowestFare',
  'LowestFare',
  'FareQuote',
  'GetFares',
  'https://',
];

for (const t of terms) {
  let idx = 0;
  let n = 0;
  while (n < 8) {
    const i = s.indexOf(t, idx);
    if (i < 0) break;
    dumpAround(t, i, t === 'https://' ? 180 : 900);
    idx = i + t.length;
    n += 1;
  }
}
