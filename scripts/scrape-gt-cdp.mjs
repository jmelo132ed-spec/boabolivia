import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('C:/Users/manue/Desktop/peru/avianca guatemala/scripts/output-gt');

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
  const tab = list.find((t) => (t.url || '').includes('vuelos-a-guatemala'));
  if (!tab) throw new Error('No tab');
  const client = await cdp(tab.webSocketDebuggerUrl);
  await client.send('Runtime.enable');
  await client.send('Page.enable');

  const evalExpr = async (expression) => {
    const r = await client.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };

  await evalExpr(`(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /Aceptar/i.test(b.textContent || ''));
    btn?.click();
    return btn ? 'clicked' : 'no-btn';
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const dump = await evalExpr(`(() => {
    const pick = (sel) => {
      const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!el) return null;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        className: String(el.className || '').slice(0, 220),
        text: (el.innerText || '').slice(0, 220),
        color: s.color,
        bg: s.backgroundColor,
        bgImg: s.backgroundImage.slice(0, 400),
        font: s.fontFamily,
        size: s.fontSize,
        weight: s.fontWeight,
        line: s.lineHeight,
        pad: s.padding,
        mar: s.margin,
        radius: s.borderRadius,
        border: s.border,
        shadow: s.boxShadow,
        h: Math.round(r.height),
        w: Math.round(r.width),
        display: s.display,
        gap: s.gap,
      };
    };

    const all = [...document.querySelectorAll('div,header,nav,section,h1,button,a,input,span')];
    const topBar = all.find((el) => /Español/.test(el.innerText || '') && el.innerText.length < 80 && getComputedStyle(el).backgroundColor.includes('0, 0, 0'));
    const logo = document.querySelector('img[alt*="vianca" i], a[aria-label*="vianca" i] img, img[src*="cf28aa84"]');
    const h1 = document.querySelector('h1');
    const searchBtn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').trim() === 'Buscar');

    const bgHero = [...document.querySelectorAll('*')].find((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      return bg && bg.includes('url(') && el.getBoundingClientRect().height > 300;
    });

    const offerCards = [...document.querySelectorAll('[class*="offer"], [class*="card"], article, a')]
      .filter((el) => /USD|Ida y vuelta desde|Flores|Acumula millas/i.test(el.innerText || ''))
      .slice(0, 12)
      .map((el) => ({
        className: String(el.className || '').slice(0, 160),
        text: (el.innerText || '').slice(0, 220),
        img: el.querySelector('img')?.src || '',
      }));

    const faqs = [...document.querySelectorAll('h2, h3, button, [class*="faq"], [class*="accordion"]')]
      .filter((el) => /\\?/.test(el.innerText || ''))
      .map((el) => (el.innerText || '').trim())
      .filter((t) => t.length > 10 && t.length < 180)
      .slice(0, 20);

    const fontUrls = [...document.styleSheets].flatMap((ss) => {
      try { return [...ss.cssRules]; } catch { return []; }
    }).filter((r) => r.constructor && r.constructor.name === 'CSSFontFaceRule')
      .map((r) => r.cssText)
      .slice(0, 20);

    return {
      topBar: pick(topBar),
      logo: logo ? { src: logo.src, w: logo.naturalWidth, h: logo.naturalHeight, ...pick(logo) } : null,
      h1: pick(h1),
      searchBtn: pick(searchBtn),
      heroBg: bgHero ? { ...pick(bgHero), bgImg: getComputedStyle(bgHero).backgroundImage.slice(0, 800) } : null,
      offerCards,
      faqs,
      fontUrls,
      headerEls: [...document.querySelectorAll('header, [class*="header"], nav')].slice(0, 8).map((el) => ({
        className: String(el.className||'').slice(0,180),
        h: Math.round(el.getBoundingClientRect().height),
        bg: getComputedStyle(el).backgroundColor,
        text: (el.innerText||'').slice(0,120)
      })),
    };
  })()`);

  await fs.writeFile(path.join(OUT_DIR, 'styles.json'), JSON.stringify(dump, null, 2), 'utf8');
  console.log(JSON.stringify(dump, null, 2).slice(0, 5000));

  const shot = async (name, y) => {
    if (typeof y === 'number') await evalExpr(`window.scrollTo(0, ${y})`);
    await new Promise((r) => setTimeout(r, 250));
    const r = await client.send('Page.captureScreenshot', { format: 'png' }, 40000);
    await fs.writeFile(path.join(OUT_DIR, name), Buffer.from(r.data, 'base64'));
    console.log('shot', name);
  };

  await shot('desktop-top.png', 0);
  await shot('fold-700.png', 700);
  await shot('fold-1400.png', 1400);
  await shot('fold-2100.png', 2100);

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await shot('mobile-top.png', 0);
  await shot('mobile-700.png', 700);

  client.close();
  console.log('DONE');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
