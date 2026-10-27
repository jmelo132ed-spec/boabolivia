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
  const tab = list.find((t) => (t.url || '').includes('4325/ofertas')) || list.find((t) => (t.url || '').includes('4325'));
  if (!tab) throw new Error('no tab');
  const client = await cdp(tab.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Page.reload', { ignoreCache: true });
  await new Promise((r) => setTimeout(r, 1500));
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send('Runtime.evaluate', {
    expression: `document.getElementById('accept-cookies')?.click(); window.scrollTo(0,0)`,
  });
  await new Promise((r) => setTimeout(r, 500));
  await fs.mkdir(OUT, { recursive: true });
  const shot = async (name, y) => {
    await client.send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y})` });
    await new Promise((r) => setTimeout(r, 250));
    const r = await client.send('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(path.join(OUT, name), Buffer.from(r.data, 'base64'));
    console.log(name);
  };
  const title = await client.send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
  const h1 = await client.send('Runtime.evaluate', { expression: 'document.querySelector("h1")?.innerText', returnByValue: true });
  console.log(title.result.value, h1.result.value);
  await shot('icons-check.png', 0);
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
