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
  const send = (method, params = {}, timeout = 15000) =>
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
  let tab = list.find((t) => (t.url || '').includes('4325'));
  if (!tab) {
    const version = await fetch('http://127.0.0.1:9222/json/version').then((r) => r.json());
    const browser = await cdp(version.webSocketDebuggerUrl);
    const created = await browser.send('Target.createTarget', { url: 'http://127.0.0.1:4325/' });
    browser.close();
    await new Promise((r) => setTimeout(r, 2000));
    const list2 = await fetch('http://127.0.0.1:9222/json/list').then((r) => r.json());
    tab = list2.find((t) => t.id === created.targetId) || list2.find((t) => (t.url || '').includes('4325'));
  }
  const client = await cdp(tab.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Page.reload', { ignoreCache: true });
  await new Promise((r) => setTimeout(r, 1800));
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send('Runtime.evaluate', {
    expression: `document.getElementById('accept-cookies')?.click(); window.scrollTo(0,0)`,
  });
  await new Promise((r) => setTimeout(r, 400));
  const r = await client.send('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(path.join(OUT, 'clone-top.png'), Buffer.from(r.data, 'base64'));
  console.log('ok');
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
