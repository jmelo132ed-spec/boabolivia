import fs from 'node:fs';

const h = fs.readFileSync('scripts/output-boa/page-full.html', 'utf8');
const start = h.indexOf('"airports":[');
if (start < 0) throw new Error('airports not found');
const slice = h.slice(start + 11);
const end = slice.indexOf(']');
const arr = JSON.parse(slice.slice(0, end + 1));
fs.writeFileSync('scripts/output-boa/airports.json', JSON.stringify(arr, null, 2));
console.log('count', arr.length);
console.log(arr.map((a) => `${a.codigoIata}\t${a.cityName}\t${a.countryName}\t${a.name}`).join('\n'));
