import fs from 'node:fs';

const html = fs.readFileSync('scripts/output-boa/review/availability.html', 'utf8');
for (const cls of ['css-2gctiz', 'css-164r41r', 'css-szzxqf', 'css-d7ktep', 'css-14nkf6d']) {
  const i = html.indexOf(cls);
  console.log('\n====', cls, i);
  const slice = html.slice(Math.max(0, i - 80), i + 900);
  const url = slice.match(/url\(([^)]+)\)/);
  console.log(url ? url[0] : slice.replace(/\s+/g, ' ').slice(0, 500));
}

const bg = [...html.matchAll(/background(?:-image)?:\s*url\(([^)]+)\)/gi)].map((m) => m[1].replace(/['"]/g, ''));
console.log('\nALL BG URLS', [...new Set(bg)].slice(0, 40));
