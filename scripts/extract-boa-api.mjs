import fs from 'node:fs';

const s = fs.readFileSync('scripts/output-boa/js/index-CBVAL4rd.js', 'utf8');
const urls = [...s.matchAll(/https?:\/\/[^"'\\\s`]{8,200}/g)].map((m) => m[0]);
const uniq = [...new Set(urls)].filter((u) => !/google|facebook|w3\.org|schema\.org|gstatic|doubleclick|sentry|facebook/i.test(u));
console.log('URLS');
for (const u of uniq.slice(0, 100)) console.log(u);

const keys = [...s.matchAll(/VITE_[A-Z0-9_]+/g)].map((m) => m[0]);
console.log('\nVITE', [...new Set(keys)]);

const paths = [...s.matchAll(/["'`](\/(?:api|booking|reserva|availability|flights|fare|token|session|checkin|nvs)[^"'`]{0,100})["'`]/gi)].map((m) => m[1]);
console.log('\nPATHS', [...new Set(paths)].slice(0, 80));

const hosts = [...s.matchAll(/["'`]([a-z0-9.-]+\.(?:azurewebsites\.net|boa\.bo|on\.aws|amazonaws\.com|azurefd\.net|cloudapp\.azure\.com)[^"'`]{0,80})["'`]/gi)].map((m) => m[1]);
console.log('\nHOSTS', [...new Set(hosts)].slice(0, 40));

const snippets = [];
for (const re of [/getAvailability/i, /searchFlights/i, /goingFlights/i, /Authorization/i, /Bearer /i, /ndc/i, /navitaire/i, /newskies/i, /dotrez/i]) {
  const i = s.search(re);
  if (i >= 0) snippets.push({ re: String(re), around: s.slice(Math.max(0, i - 80), i + 160) });
}
console.log('\nSNIPPETS', snippets);
