import fs from 'node:fs';

const css = fs.readFileSync('scripts/output-boa/css/index-BPPwiJ2Y.css', 'utf8');
const start = css.indexOf('.rdrCalendarWrapper');
const alt = css.indexOf('.rdrDateRangeWrapper');
const i = start >= 0 ? start : alt;
console.log('start', i, 'cal', start, 'range', alt);

const chunk = css.slice(i, i + 25000);
fs.writeFileSync('scripts/output-boa/rdr-chunk.css', chunk);
console.log(chunk.slice(0, 4000));
