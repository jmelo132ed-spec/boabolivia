import fs from 'node:fs/promises';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';

const OUT = path.resolve('C:/Users/manue/Desktop/peru/avianca guatemala/scripts/output-gt');
const IMG = path.resolve('C:/Users/manue/Desktop/peru/avianca guatemala/public/images/avianca');

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  const send = (method, params = {}, timeout = 20000) =>
    new Promise((resolve, reject) => {
      const nid = ++id;
      pending.set(nid, { resolve, reject });
      ws.send(JSON.stringify({ id: nid, method, params }));
      setTimeout(() => {
        if (pending.has(nid)) {
          pending.delete(nid);
          reject(new Error('timeout ' + method));
        }
      }, timeout);
    });
  return { send, close: () => ws.close() };
}

async function main() {
  const list = await fetch('http://127.0.0.1:9222/json/list').then((r) => r.json());
  const tab = list.find((t) => (t.url || '').includes('ofertas-vuelos') && (t.url || '').includes('avianca.com'));
  const client = await cdp(tab.webSocketDebuggerUrl);
  await client.send('Runtime.enable');
  const data = await client.send('Runtime.evaluate', {
    expression: `(() => {
      document.querySelectorAll('details').forEach((d) => { d.open = true; });
      const urls = [...document.querySelectorAll('[style*="background-image"], img')].map((el) => {
        if (el.tagName === 'IMG') return el.currentSrc || el.src;
        const s = el.getAttribute('style') || '';
        const m = s.match(/url\\(["']?([^"')]+)["']?\\)/);
        return m ? m[1] : '';
      }).filter((u) => u && /Cities|Offers|Destination/i.test(u));
      const rows = [...document.querySelectorAll('[class*="list"], [class*="row-card"], [class*="offer-card"], a')].filter((el) => /USD \\d/.test(el.innerText||'') && el.innerText.length < 120).map((el) => ({
        className: String(el.className||'').slice(0,120),
        text: el.innerText.replace(/\\s+/g,' ').trim(),
        img: el.querySelector('img')?.src || '',
        bg: (el.querySelector('[style*="background"]')?.getAttribute('style') || ''),
      }));
      const faqs = [...document.querySelectorAll('details')].map((el) => ({
        q: el.querySelector('summary')?.innerText?.trim() || '',
        a: [...el.querySelectorAll('p, li')].map((p) => p.innerText.trim()).join('\\n').slice(0, 500),
      }));
      return { urls: [...new Set(urls)], rows: rows.slice(0, 25), faqs };
    })()`,
    returnByValue: true,
  });
  await fs.writeFile(path.join(OUT, 'offers-assets.json'), JSON.stringify(data.result.value, null, 2), 'utf8');
  console.log(JSON.stringify(data.result.value, null, 2).slice(0, 8000));
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
