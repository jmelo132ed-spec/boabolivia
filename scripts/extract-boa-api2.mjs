import fs from 'node:fs';

const s = fs.readFileSync('scripts/output-boa/js/index-CBVAL4rd.js', 'utf8');

function around(re, n = 6) {
  const out = [];
  const rx = new RegExp(re, 'gi');
  let m;
  let i = 0;
  while ((m = rx.exec(s)) && i < n) {
    out.push(s.slice(Math.max(0, m.index - 120), m.index + 220).replace(/\s+/g, ' '));
    i += 1;
  }
  return out;
}

const terms = [
  'getAvailableSeats',
  'closeSession',
  'sendBoardingByEmail',
  'antiForgery',
  'checkInToken',
  'goingFlights',
  'setGoingFlights',
  'mocked',
  'USE_MOCKED',
  'apiUrl',
  'API_URL',
  'baseUrl',
  'BASE_API',
  'dotrez',
  'amadeus',
  'navitaire',
  'newskies',
  'xmlHttp',
  'application/json",RequestVerificationToken',
  'Token:`Bearer',
  '/Checkin',
  '/Booking',
  'GetAvailability',
  'LowFare',
  'pricedItinerary',
  'departureStation',
  'destinationStation',
  'SearchFlights',
  'searchFlights',
  'fetchFlights',
  'getFlights',
];

for (const t of terms) {
  const hits = around(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 2);
  if (hits.length) {
    console.log('\n====', t, hits.length);
    hits.forEach((h) => console.log(h, '\n'));
  }
}
