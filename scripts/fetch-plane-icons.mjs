import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('C:/Users/manue/Desktop/peru/avianca guatemala/public/icons/avianca');

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
  const version = await fetch('http://127.0.0.1:9222/json/version').then((r) => r.json());
  const browser = await cdp(version.webSocketDebuggerUrl);
  const created = await browser.send('Target.createTarget', {
    url: 'https://www.avianca.com/es/ofertas/ofertas-vuelos?poscode=GT',
  });
  await new Promise((r) => setTimeout(r, 5000));
  const list = await fetch('http://127.0.0.1:9222/json/list').then((r) => r.json());
  const tab = list.find((t) => t.id === created.targetId) || list.find((t) => (t.url || '').includes('avianca.com'));
  browser.close();
  if (!tab) throw new Error('no tab');
  const client = await cdp(tab.webSocketDebuggerUrl);
  await client.send('Runtime.enable');
  const data = await client.send('Runtime.evaluate', {
    expression: `Promise.all([
      fetch('/airmkt/avianca/icons/takeoff.svg').then((r) => r.text()),
      fetch('/airmkt/avianca/icons/land-icon.svg').then((r) => r.text()),
      fetch('/airmkt/avianca/icons/swap-routes.svg').then((r) => r.text()),
      fetch('/airmkt/avianca/icons/calendar-icon.svg').then((r) => r.text()),
    ]).then(([takeoff, land, swap, calendar]) => ({ takeoff, land, swap, calendar }))`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (data.exceptionDetails) throw new Error(JSON.stringify(data.exceptionDetails));
  const files = data.result.value;
  await fs.mkdir(OUT, { recursive: true });
  for (const [k, v] of Object.entries(files)) {
    await fs.writeFile(path.join(OUT, `${k}.svg`), v, 'utf8');
    console.log(k, String(v).slice(0, 200), String(v).length);
  }
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
