import fs from 'node:fs/promises';
import path from 'node:path';

const IMG = path.resolve('C:/Users/manue/Desktop/peru/avianca guatemala/public/images/avianca');
const ICO = path.resolve('C:/Users/manue/Desktop/peru/avianca guatemala/public/icons/avianca');

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
  const send = (method, params = {}, timeout = 60000) =>
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
  await fs.mkdir(IMG, { recursive: true });
  await fs.mkdir(ICO, { recursive: true });
  const list = await fetch('http://127.0.0.1:9222/json/list').then((r) => r.json());
  const tab = list.find((t) => t.type === 'page' && (t.url || '').includes('avianca.com/es/ofertas'));
  const client = await cdp(tab.webSocketDebuggerUrl);
  await client.send('Runtime.enable');

  const assets = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const out = [];
      const hero = document.querySelector('picture img, .hero img, [class*="hero"] img');
      if (hero) out.push({ kind: 'hero', src: hero.currentSrc || hero.src });
      const sources = [...document.querySelectorAll('picture source')].map((s) => ({
        media: s.media, src: s.srcset
      }));
      const cards = [...document.querySelectorAll('.destination-card-promo-container, .destination-card')].map((el) => {
        const cs = getComputedStyle(el);
        const img = el.querySelector('img');
        const bg = cs.backgroundImage;
        const m = bg && bg.match(/url\\(["']?(.*?)["']?\\)/);
        return {
          text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
          img: img ? (img.currentSrc || img.src) : '',
          bg: m ? m[1] : '',
        };
      });
      return { sources, cards };
    })()`,
    returnByValue: true,
  });
  const data = assets.result.value;
  console.log('sources', data.sources);
  console.log('cards', data.cards.length);

  const downloads = [];
  for (const s of data.sources || []) {
    if (/1024/.test(s.media)) downloads.push({ name: 'offers-hero.jpg', url: s.src.split(' ')[0] });
    if (/769/.test(s.media)) downloads.push({ name: 'offers-hero-tablet.jpg', url: s.src.split(' ')[0] });
    if (/768/.test(s.media)) downloads.push({ name: 'offers-hero-mobile.jpg', url: s.src.split(' ')[0] });
  }
  const codeMap = {
    Miami: 'mia', Washington: 'was', 'Flores, Guatemala': 'flores', Cancún: 'cun',
    'Ciudad de México': 'mex', Managua: 'mga', 'Ciudad de Panamá': 'pty', Cartagena: 'ctg',
    Barranquilla: 'baq', 'San José, Costa Rica': 'sjo', Medellín: 'mde', Tegucigalpa: 'tgu',
    'San Salvador': 'sal', Curazao: 'cur', Guayaquil: 'gye', Orlando: 'mco',
    'Punta Cana': 'puj', Cali: 'clo', Bogotá: 'bog',
  };
  for (const c of data.cards || []) {
    const key = Object.keys(codeMap).find((k) => c.text.includes(k));
    const url = c.bg || c.img;
    if (key && url && url.startsWith('http')) downloads.push({ name: `${codeMap[key]}.jpg`, url });
  }

  const unique = [];
  const seen = new Set();
  for (const d of downloads) {
    if (!d.url || seen.has(d.name)) continue;
    seen.add(d.name);
    unique.push(d);
  }

  const saved = [];
  for (const d of unique) {
    const res = await client.send('Runtime.evaluate', {
      expression: `fetch(${JSON.stringify(d.url)}).then(r => r.arrayBuffer()).then(b => {
        const u = new Uint8Array(b);
        let s = '';
        const chunk = 0x8000;
        for (let i = 0; i < u.length; i += chunk) s += String.fromCharCode(...u.subarray(i, i + chunk));
        return btoa(s);
      })`,
      awaitPromise: true,
      returnByValue: true,
    }, 60000);
    const buf = Buffer.from(res.result.value, 'base64');
    await fs.writeFile(path.join(IMG, d.name), buf);
    saved.push({ name: d.name, bytes: buf.length });
    console.log('saved', d.name, buf.length);
  }

  client.close();
  console.log(JSON.stringify({ saved, count: saved.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
