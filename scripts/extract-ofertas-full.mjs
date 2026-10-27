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

async function ev(client, expression) {
  const res = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
  });
  if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
  return res.result.value;
}

async function shot(client, file) {
  const png = await client.send('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(path.join(OUT, file), Buffer.from(png.data, 'base64'));
  console.log('shot', file);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const list = await fetch('http://127.0.0.1:9222/json/list').then((r) => r.json());
  const orig = list.find((t) => t.type === 'page' && (t.url || '').includes('avianca.com/es/ofertas'));
  if (!orig) throw new Error('no original');
  const client = await cdp(orig.webSocketDebuggerUrl);
  await client.send('Runtime.enable');
  await client.send('Page.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await ev(client, 'window.scrollTo(0,0)');
  await new Promise((r) => setTimeout(r, 500));

  const header = await ev(client, `(() => {
    const q = s => document.querySelector(s);
    const cs = el => el ? getComputedStyle(el) : null;
    const r = el => { const b = el.getBoundingClientRect(); return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}; };
    const pick = (el) => {
      if (!el) return null;
      const s = cs(el);
      return {
        display: s.display, bg: s.backgroundColor, color: s.color, w: s.width, h: s.height,
        pad: s.padding, radius: s.borderRadius, border: s.border, gap: s.gap, fw: s.fontWeight,
        fs: s.fontSize, shadow: s.boxShadow, rect: r(el),
      };
    };
    const h1 = q('h1');
    return {
      url: location.href,
      title: document.title,
      h1: (h1?.innerText||'').trim(),
      lead: (h1?.nextElementSibling?.innerText||'').trim(),
      topbarH: q('.topbar-super-wrapper') ? Math.round(q('.topbar-super-wrapper').getBoundingClientRect().height) : 0,
      headerH: q('.header-wrapper') ? Math.round(q('.header-wrapper').getBoundingClientRect().height) : 0,
      styles: {
        topbar: pick(q('.topbar-super-wrapper')),
        header: pick(q('.header-wrapper')),
        headerBottom: pick(q('.header-bottom')),
        trigger: pick(q('.container_trigger')),
        bandera: pick(q('.bandera_trigger')),
        currency: pick(q('.currency_trigger')),
        expand: pick(q('.icon_expand_selector')),
        logo: pick(q('.header-logo')),
        h1: pick(h1),
        lead: pick(h1?.nextElementSibling),
      },
      triggerHtml: q('.container_trigger')?.outerHTML || '',
    };
  })()`);
  console.log('header ok', header.h1, header.topbarH, header.headerH);
  await shot(client, 'orig-ofertas-1440-top.png');

  const cards = await ev(client, `([...document.querySelectorAll('.destination-card-promo-container')].map(el => ({
    text: (el.innerText||'').replace(/\\s+/g,' ').trim(),
    href: (el.closest('a')||el.querySelector('a')||{}).href || ''
  })))`);
  const rows = await ev(client, `([...document.querySelectorAll('.destination-card')].map(el => ({
    text: (el.innerText||'').replace(/\\s+/g,' ').trim().slice(0,160),
    href: (el.closest('a')||el.querySelector('a')||{}).href || ''
  })))`);
  console.log('cards', cards.length, 'rows', rows.length);

  await ev(client, 'window.scrollTo(0, 720)');
  await new Promise((r) => setTimeout(r, 350));
  const afterScroll = await ev(client, `({
    topbarH: document.querySelector('.topbar-super-wrapper')?.getBoundingClientRect().height || 0,
    triggerY: document.querySelector('.container_trigger')?.getBoundingClientRect().y || null,
    triggerDisplay: document.querySelector('.container_btns_selector_desktop') ? getComputedStyle(document.querySelector('.container_btns_selector_desktop')).display : ''
  })`);
  await shot(client, 'orig-ofertas-1440-scrolled.png');
  console.log('afterScroll', afterScroll);

  await ev(client, 'window.scrollTo(0,0)');
  await new Promise((r) => setTimeout(r, 250));
  await ev(client, `document.querySelector('.container_trigger')?.dispatchEvent(new MouseEvent('click',{bubbles:true}))`);
  await new Promise((r) => setTimeout(r, 400));
  const usd = await ev(client, `(() => {
    const p = document.querySelector('.container_selector');
    return p ? { display: getComputedStyle(p).display, text: (p.innerText||'').replace(/\\s+/g,' ').trim().slice(0,900) } : null;
  })()`);
  await shot(client, 'orig-usd-open.png');
  console.log('usd', usd);
  await ev(client, `document.querySelector('.close_selector')?.click()`);

  const dump = { ...header, cards, rows, afterScroll, usd };
  await fs.writeFile(path.join(OUT, 'ofertas-full.json'), JSON.stringify(dump, null, 2), 'utf8');

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 375, height: 812, deviceScaleFactor: 2, mobile: true,
  });
  await ev(client, 'window.scrollTo(0,0)');
  await new Promise((r) => setTimeout(r, 400));
  await shot(client, 'orig-ofertas-375.png');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  client.close();
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
