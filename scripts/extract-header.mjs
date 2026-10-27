import fs from 'node:fs/promises';
import path from 'node:path';

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
  const send = (method, params = {}, timeout = 25000) =>
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
  const tab = list.find((t) => (t.url || '').includes('avianca.com') && t.type === 'page');
  if (!tab) throw new Error('no original tab');
  const client = await cdp(tab.webSocketDebuggerUrl);
  await client.send('Runtime.enable');
  await client.send('Page.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 200,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send('Runtime.evaluate', { expression: 'window.scrollTo(0,0)' });
  await new Promise((r) => setTimeout(r, 400));

  const dump = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const header = document.querySelector('.header-wrapper, .header-bottom, [class*="header"]');
      const topbar = document.querySelector('.topbar-super-wrapper, .topbar-wrapper');
      const usdBtns = [...document.querySelectorAll('button, a, div')].filter((el) => {
        const t = (el.innerText || '').replace(/\\s+/g,' ').trim();
        return t === 'USD' || t.startsWith('USD');
      }).slice(0, 12).map((el) => ({
        tag: el.tagName,
        className: String(el.className||'').slice(0, 200),
        text: (el.innerText||'').replace(/\\s+/g,' ').trim().slice(0, 40),
        html: el.outerHTML.slice(0, 2500),
        rect: { x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) },
      }));
      const headerEl = document.querySelector('.header-wrapper') || document.querySelector('header');
      const cs = headerEl ? getComputedStyle(headerEl) : null;
      return {
        title: document.title,
        topbarHtml: topbar ? topbar.outerHTML.slice(0, 4000) : '',
        headerHtml: headerEl ? headerEl.outerHTML.slice(0, 12000) : '',
        headerBg: cs ? cs.backgroundColor : '',
        headerH: headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 0,
        usdBtns,
      };
    })()`,
    returnByValue: true,
  });
  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(path.join(OUT, 'header-extract.json'), JSON.stringify(dump.result.value, null, 2), 'utf8');
  console.log('usd count', dump.result.value.usdBtns?.length);
  console.log(JSON.stringify(dump.result.value.usdBtns, null, 2).slice(0, 5000));
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(path.join(OUT, 'orig-header.png'), Buffer.from(shot.data, 'base64'));
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
