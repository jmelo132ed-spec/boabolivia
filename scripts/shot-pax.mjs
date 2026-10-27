import puppeteer from 'puppeteer-core';

const selection = {
  search: '?trip=roundtrip&origin=GUA&destination=MIA&depart=2026-10-01&return=2026-10-15&adults=1&children=0&infants=0&cabin=Economy',
  trip: 'roundtrip',
  from: { code: 'GUA', city: 'Ciudad de Guatemala' },
  to: { code: 'MIA', city: 'Miami' },
  depart: '2026-10-01',
  returnDate: '2026-10-15',
  adults: 1,
  children: 0,
  infants: 0,
  outbound: { price: 788.43, flight: { depart: '05:25', arrive: '12:10' } },
  inbound: { price: 554.3, flight: { depart: '15:50', arrive: '23:10' } },
};

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('http://localhost:4325/seleccion-asientos?trip=roundtrip&origin=GUA&destination=MIA&depart=2026-10-01&return=2026-10-15&adults=1', { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.evaluate((data) => sessionStorage.setItem('latam-checkout-selection', JSON.stringify(data)), selection);
await page.reload({ waitUntil: 'networkidle0', timeout: 20000 });
const info = await page.evaluate(() => ({
  title: document.title,
  h1: document.querySelector('h1')?.textContent,
  hasHeader: !!document.querySelector('.site-header, .av-chrome, .av-header'),
  hasChrome: !!document.querySelector('.av-book-chrome'),
  text: document.body.innerText.slice(0, 700),
  bodyClass: document.body.className,
}));
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'C:/Users/manue/Desktop/peru/avianca guatemala/.tmp-seats-now.png' });
await page.close();
await browser.disconnect();
