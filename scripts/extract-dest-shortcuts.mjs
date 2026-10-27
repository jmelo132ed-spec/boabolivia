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

async function ev(client, expression) {
  const res = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
  return res.result.value;
}

async function main() {
  const list = await fetch('http://127.0.0.1:9222/json/list').then((r) => r.json());
  const orig = list.find((t) => t.type === 'page' && (t.url || '').includes('avianca.com/es/ofertas'));
  if (!orig) throw new Error('no original');
  const client = await cdp(orig.webSocketDebuggerUrl);
  await client.send('Runtime.enable');
  await client.send('Page.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 375, height: 812, deviceScaleFactor: 2, mobile: true,
  });
  await ev(client, 'window.scrollTo(0,0)');
  await new Promise((r) => setTimeout(r, 400));

  const destClick = await ev(client, `(() => {
    const el = [...document.querySelectorAll('input, button, [role="combobox"], div, span')]
      .find((n) => {
        const t = (n.getAttribute('placeholder') || n.innerText || '').replace(/\\s+/g,' ').trim();
        const aria = n.getAttribute('aria-label') || '';
        return t === 'Destino' || aria.toLowerCase().includes('destino') || n.id?.toLowerCase().includes('destination');
      });
    if (!el) return { found: false };
    el.click();
    el.focus?.();
    return { found: true, tag: el.tagName, className: String(el.className||'').slice(0,120), id: el.id };
  })()`);
  await new Promise((r) => setTimeout(r, 700));

  const panel = await ev(client, `(() => {
    const vis = [...document.querySelectorAll('[class*="suggest"], [class*="dropdown"], [class*="list"], [role="listbox"], [class*="airport"], [class*="station"], ul, div')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const t = (el.innerText || '').replace(/\\s+/g,' ').trim();
        return r.height > 80 && r.width > 120 && cs.display !== 'none' && /Miami|Cancún|Bogotá|Destino|aeropuerto/i.test(t);
      })
      .slice(0, 6)
      .map((el) => ({
        className: String(el.className||'').slice(0,140),
        text: (el.innerText||'').replace(/\\s+/g,' ').trim().slice(0, 1200),
      }));
    return vis;
  })()`);

  const png = await client.send('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(path.join(OUT, 'orig-dest-open-375.png'), Buffer.from(png.data, 'base64'));
  await fs.writeFile(path.join(OUT, 'orig-dest.json'), JSON.stringify({ destClick, panel }, null, 2), 'utf8');
  console.log(JSON.stringify({ destClick, panel }, null, 2).slice(0, 6000));
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
