import fs from 'node:fs';

const html = fs.readFileSync('scripts/output-boa/review/availability.html', 'utf8');
const urls = [...html.matchAll(/https?:[^"' )\s]+?\.(?:jpg|jpeg|png|webp)/gi)].map((m) => m[0]);
console.log([...new Set(urls)].join('\n'));
const i = html.indexOf('Selecciona tu vuelo de ida');
console.log('\nAROUND', i);
console.log(html.slice(Math.max(0, i - 1800), i + 600).replace(/\s+/g, ' ').slice(0, 1800));
