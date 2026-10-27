import fs from 'node:fs';
const html = fs.readFileSync('scripts/output-boa/page-full.html', 'utf8');
const urls = [...html.matchAll(/https?:\/\/[^"'\\\s]+/g)].map((m) => m[0]);
const interesting = urls.filter((u) => /api|content|cms|azure|cdnboa/i.test(u));
const uniq = [...new Set(interesting)];
console.log(uniq.slice(0, 80).join('\n'));
console.log('count', uniq.length);
