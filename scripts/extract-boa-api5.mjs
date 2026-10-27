import fs from 'node:fs';

const s = fs.readFileSync('scripts/output-boa/js/index-CBVAL4rd.js', 'utf8');

const urls = [...s.matchAll(/https?:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+/g)].map((m) => m[0]);
const uniq = [...new Set(urls)].filter(
  (u) =>
    !/fonts|google|gstatic|youtube|facebook|contentsquare|hotjar|sentry|cloudflare|w3\.org|schema\.org|reactjs|vitejs|unpkg|jsdelivr|googleapis|doubleclick|analytics|gtm|twitter|linkedin|instagram|tiktok|whatsapp|fbcdn|maps\.google/i.test(
      u,
    ),
);
console.log('=== URLs ===');
console.log(uniq.join('\n'));

console.log('\n=== /api/ paths ===');
const apis = [...s.matchAll(/["'`](\/api\/[^"'`]+)["'`]/g)].map((m) => m[1]);
console.log([...new Set(apis)].join('\n'));

console.log('\n=== fetch( ===');
const fetches = [...s.matchAll(/fetch\([^)]{0,500}/g)].map((m) => m[0]);
console.log([...new Set(fetches)].join('\n---\n'));

function dump(term, n = 6, pad = 1000) {
  let idx = 0;
  let c = 0;
  while (c < n) {
    const i = s.indexOf(term, idx);
    if (i < 0) break;
    console.log('\n====', term, i);
    console.log(s.slice(Math.max(0, i - pad), i + pad).replace(/\s+/g, ' '));
    idx = i + term.length;
    c += 1;
  }
}

dump('setReservePathname(');
dump('componentType');
dump('behabiorCode');
dump('/api/Reserve');
dump('/api/Booking');
dump('CallAvailability');
dump('GetAvailability');
dump('AirAvailability');
dump('SearchFlights');
dump('searchFlights');
dump('GetCalendarFares');
dump('calendarFares');
dump('lowestPrice');
dump('lowestFare');
dump('CallSearch');
dump('BookingEngine');
dump('bookingEngine');
dump('IBE');
dump('navitaire');
dump('radixx');
dump('dotREZ');
dump('NewSkies');
dump('Travelport');
dump('GetQuote');
dump('CallGet');
