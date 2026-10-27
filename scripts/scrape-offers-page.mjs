import fs from 'node:fs/promises';
import path from 'node:path';

const TARGET = 'https://www.avianca.com/es/ofertas/ofertas-vuelos?poscode=GT';
const OUT = path.resolve('C:/Users/manue/Desktop/peru/avianca guatemala/scripts/output-gt');

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
  const send = (method, params = {}, timeout = 30000) =>
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
  const version = await fetch('http://127.0.0.1:9222/json/version').then((r) => r.json());
  const browser = await cdp(version.webSocketDebuggerUrl);
  const created = await browser.send('Target.createTarget', { url: TARGET });
  await new Promise((r) => setTimeout(r, 6000));
  const list = await fetch('http://127.0.0.1:9222/json/list').then((r) => r.json());
  const tab = list.find((t) => t.id === created.targetId) || list.find((t) => (t.url || '').includes('ofertas-vuelos'));
  browser.close();
  if (!tab) throw new Error('no offers tab ' + JSON.stringify(list.map((t) => t.url)));
  console.log('TAB', tab.url, tab.title);

  const client = await cdp(tab.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 800));

  const dump = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const text = (el) => (el && el.innerText ? el.innerText.trim() : '');
      const bgCards = [...document.querySelectorAll('[class*="destination-card-promo-container"], [class*="destination-card"]')].map((el) => {
        const bg = el.querySelector('[style*="background-image"]');
        const style = bg?.getAttribute('style') || '';
        const m = style.match(/url\\(["']?([^"')]+)["']?\\)/);
        return {
          text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 200),
          img: m ? m[1] : '',
        };
      });
      return {
        title: document.title,
        url: location.href,
        h1: text(document.querySelector('h1')),
        h2s: [...document.querySelectorAll('h2')].map(text).slice(0, 20),
        filters: text(document.querySelector('.destination-filters-bar, [class*="filters"]')),
        bodyText: (document.body.innerText || '').slice(0, 16000),
        bgCards: bgCards.slice(0, 40),
      };
    })()`,
    returnByValue: true,
  });
  if (dump.exceptionDetails) throw new Error(JSON.stringify(dump.exceptionDetails));
  const data = dump.result.value;
  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(path.join(OUT, 'offers-dump.json'), JSON.stringify(data, null, 2), 'utf8');
  console.log('H1', data.h1);
  console.log('H2', (data.h2s || []).join(' | '));
  console.log('cards', (data.bgCards || []).length);

  await client.send('Runtime.evaluate', {
    expression: `(() => { const b=[...document.querySelectorAll('button')].find(x=>/Aceptar/i.test(x.textContent||'')); b?.click(); return !!b; })()`,
    returnByValue: true,
  });
  await new Promise((r) => setTimeout(r, 700));

  const shot = async (name, y) => {
    await client.send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y})` });
    await new Promise((r) => setTimeout(r, 250));
    const r = await client.send('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(path.join(OUT, name), Buffer.from(r.data, 'base64'));
    console.log('shot', name);
  };
  await shot('offers-top.png', 0);
  await shot('offers-900.png', 900);
  await shot('offers-1800.png', 1800);
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
