import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const codes = ['LPB','CBB','VVI','SRE','TJA','CIJ','EZE','GRU','TDD','MIA','MAD','UYU','ORU','BCN','LIM','DCA','ASU','SCL','IQQ','GIG'];
const out = path.resolve('public/images/boa/cities');
fs.mkdirSync(out, { recursive: true });

const { webSocketDebuggerUrl } = await (await fetch('http://127.0.0.1:9223/json/version')).json();
const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl });
const page = await browser.newPage();
page.setDefaultTimeout(25000);
await page.setBypassCSP(true);

let ok = 0;
for (const code of codes) {
  const url = `https://ef.boa.bo:5097/Resources/Media/BookingFlowDestination/${code}`;
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
    const buf = res && res.ok() ? await res.buffer() : null;
    if (!buf || buf.length < 800) {
      console.log('skip', code, res && res.status(), buf && buf.length);
      continue;
    }
    fs.writeFileSync(path.join(out, `${code.toLowerCase()}.jpg`), buf);
    ok += 1;
    console.log('saved', code, buf.length);
  } catch (err) {
    console.log('fail', code, err.message);
  }
}
await page.close();
await browser.disconnect();
console.log('done', ok);
