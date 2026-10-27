import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('C:/Users/manue/Desktop/peru/avianca guatemala/public');

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
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const nid = ++id;
      pending.set(nid, { resolve, reject });
      ws.send(JSON.stringify({ id: nid, method, params }));
      setTimeout(() => {
        if (pending.has(nid)) {
          pending.delete(nid);
          reject(new Error('timeout ' + method));
        }
      }, 20000);
    });
  return { send, close: () => ws.close() };
}

async function main() {
  const list = await fetch('http://127.0.0.1:9222/json/list').then((r) => r.json());
  const tab = list.find((t) => (t.url || '').includes('avianca.com'));
  if (!tab) throw new Error('No avianca tab');
  const client = await cdp(tab.webSocketDebuggerUrl);
  await client.send('Runtime.enable');

  const icons = {
    takeoff: '/airmkt/avianca/icons/takeoff.svg',
    land: '/airmkt/avianca/icons/land-icon.svg',
    swap: '/airmkt/avianca/icons/swap-routes.svg',
    calendar: '/airmkt/avianca/icons/calendar-icon.svg',
    pax: '/airmkt/avianca/icons/pax-plus-icon.svg',
    chevron: '/airmkt/avianca/icons/trailingIcon.svg',
    external: '/airmkt/avianca/icons/navigation-icon.svg',
    promo: '/airmkt/avianca/icons/promocode-icon.svg',
    promoBtn: '/airmkt/avianca/icons/promo-button.svg',
    chevronDown: '/airmkt/icons/chevron-down.svg',
  };

  const r = await client.send('Runtime.evaluate', {
    expression: `Promise.all(${JSON.stringify(Object.entries(icons))}.map(async ([k,u]) => {
      const res = await fetch(u);
      return [k, await res.text()];
    })).then(Object.fromEntries)`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  const files = r.result.value;
  await fs.mkdir(path.join(OUT, 'icons/avianca'), { recursive: true });
  for (const [k, text] of Object.entries(files)) {
    const dest = path.join(OUT, 'icons/avianca', `${k}.svg`);
    await fs.writeFile(dest, text, 'utf8');
    console.log(k, text.slice(0, 40), text.length);
  }
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
