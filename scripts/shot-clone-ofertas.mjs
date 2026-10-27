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
  const list = await fetch('http://127.0.0.1:9222/json/list').then((r) => r.json());
  const tab = list.find((t) => t.type === 'page' && (t.url || '').includes('127.0.0.1:4325/ofertas'));
  if (!tab) throw new Error('clone tab missing');
  const client = await cdp(tab.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Page.reload', { ignoreCache: true });
  await new Promise((r) => setTimeout(r, 1800));
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await client.send('Runtime.evaluate', { expression: 'window.scrollTo(0,0)' });
  await new Promise((r) => setTimeout(r, 400));
  let png = await client.send('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(path.join(OUT, 'clone-ofertas-1440.png'), Buffer.from(png.data, 'base64'));
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 375, height: 812, deviceScaleFactor: 2, mobile: true,
  });
  await client.send('Runtime.evaluate', { expression: 'window.scrollTo(0,0)' });
  await new Promise((r) => setTimeout(r, 500));
  png = await client.send('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(path.join(OUT, 'clone-ofertas-375.png'), Buffer.from(png.data, 'base64'));
  client.close();
  console.log('saved clone shots');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
