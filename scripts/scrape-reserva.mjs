import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const CDP_URL = 'http://127.0.0.1:9222';
const OUT = path.resolve('scripts/output-boa/reserva');

const STYLE_KEYS = [
  'display', 'position', 'top', 'left', 'right', 'bottom', 'zIndex',
  'width', 'height', 'minHeight', 'maxWidth', 'maxHeight', 'margin', 'padding',
  'color', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition',
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform',
  'border', 'borderRadius', 'boxShadow', 'opacity', 'overflow',
  'alignItems', 'justifyContent', 'gap', 'flexDirection', 'flexWrap', 'gridTemplateColumns',
];

function pick(s, keys) {
  const out = {};
  for (const k of keys) out[k] = s[k];
  return out;
}

async function dumpPage(page, name) {
  const dump = await page.evaluate((STYLE_KEYS) => {
    const css = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const out = {
        tag: el.tagName.toLowerCase(),
        id: el.id,
        className: String(el.className || '').slice(0, 280),
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 240),
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      };
      for (const k of STYLE_KEYS) out[k] = s[k];
      return out;
    };
    const qa = (sel) => [...document.querySelectorAll(sel)];
    const interesting = [
      'header', 'nav', 'main', 'footer',
      '[class*="step"]', '[class*="banner"]', '[class*="flight"]',
      '[class*="fare"]', '[class*="sort"]', '[class*="date"]',
      '[class*="loader"]', '[class*="spinner"]', '[class*="pulse"]',
    ];
    const nodes = [];
    const seen = new Set();
    for (const sel of interesting) {
      for (const el of qa(sel).slice(0, 20)) {
        if (seen.has(el)) continue;
        seen.add(el);
        nodes.push({ sel, ...css(el) });
      }
    }
    const vars = {};
    const root = getComputedStyle(document.documentElement);
    for (const name of root) if (name.startsWith('--')) vars[name] = root.getPropertyValue(name).trim();
    return {
      url: location.href,
      title: document.title,
      htmlLen: document.documentElement.outerHTML.length,
      vars,
      body: css(document.body),
      nodes,
      sheets: [...document.styleSheets].map((s) => s.href).filter(Boolean),
      text: (document.body.innerText || '').slice(0, 8000),
    };
  }, STYLE_KEYS);

  await fs.writeFile(path.join(OUT, `${name}.json`), JSON.stringify(dump, null, 2));
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  await fs.writeFile(path.join(OUT, `${name}.html`), html);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true, captureBeyondViewport: true }).catch(() => {});
  await page.screenshot({ path: path.join(OUT, `${name}-view.png`) });
  return dump;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const { webSocketDebuggerUrl } = await (await fetch(`${CDP_URL}/json/version`)).json();
  const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl, defaultViewport: null });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const requests = [];
  page.on('request', (req) => {
    const url = req.url();
    if (/reserva|flight|fare|tarifa|oferta|search|availability|booking/i.test(url)) {
      requests.push({ type: req.resourceType(), method: req.method(), url });
    }
  });

  await page.goto('https://www.boa.bo/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await new Promise((r) => setTimeout(r, 2500));

  await page.evaluate(() => {
    [...document.querySelectorAll('div,aside,section')].forEach((el) => {
      const t = el.innerText || '';
      if (/Selecciona el idioma/.test(t) && t.length < 600) el.remove();
    });
    document.querySelectorAll('.backdrop-blur-sm, [class*="white-transparent"]').forEach((el) => el.remove());
  });

  await page.locator('button').filter({ hasText: /One Way|Solo Ida/ }).first().click().catch(() => {});
  await new Promise((r) => setTimeout(r, 400));

  const origin = await page.$('input[placeholder="Origin"], input[placeholder="Origen"]');
  if (origin) {
    await origin.click({ clickCount: 3 });
    await origin.type('Cochabamba', { delay: 40 });
    await new Promise((r) => setTimeout(r, 800));
    const opt = await page.$x("//*[contains(., 'CBB') or contains(., 'Cochabamba')]");
    for (const el of opt.slice(0, 12)) {
      const t = await el.evaluate((n) => (n.innerText || '').trim());
      if (/CBB|Cochabamba/i.test(t) && t.length < 80 && /airport|aeropuerto|BOLIVIA|CBB/i.test(t)) {
        await el.click();
        break;
      }
    }
  }

  await new Promise((r) => setTimeout(r, 400));
  const dest = await page.$('input[placeholder="Destination"], input[placeholder="Destino"]');
  if (dest) {
    await dest.click({ clickCount: 3 });
    await dest.type('La Paz', { delay: 40 });
    await new Promise((r) => setTimeout(r, 800));
    const opt = await page.$x("//*[contains(., 'LPB') or contains(., 'La Paz')]");
    for (const el of opt.slice(0, 12)) {
      const t = await el.evaluate((n) => (n.innerText || '').trim());
      if (/LPB|La Paz/i.test(t) && t.length < 90 && /airport|aeropuerto|BOLIVIA|LPB/i.test(t)) {
        await el.click();
        break;
      }
    }
  }

  await new Promise((r) => setTimeout(r, 600));
  const depart = await page.$('input[placeholder="Departure"], input[placeholder="Salida"]');
  if (depart) {
    await page.evaluate((el) => el.removeAttribute('disabled'), depart);
    await depart.click({ delay: 50 }).catch(() => {});
  }
  await new Promise((r) => setTimeout(r, 800));
  const day = await page.$x("//button[normalize-space()='24'] | //span[normalize-space()='24']/ancestor::button[1]");
  if (day[0]) await day[0].click();
  await new Promise((r) => setTimeout(r, 400));

  await dumpPage(page, 'before-search');

  const searchBtn = await page.$x("//button[contains(., 'Search flight') or contains(., 'Buscar vuelo')]");
  if (searchBtn[0]) await searchBtn[0].click();

  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT, `loader-${i}.png`) });
    const info = await page.evaluate(() => {
      const loaders = [...document.querySelectorAll('[class*="load"], [class*="spin"], [class*="pulse"], [class*="wait"]')]
        .slice(0, 10)
        .map((el) => ({
          cls: String(el.className).slice(0, 180),
          w: Math.round(el.getBoundingClientRect().width),
          h: Math.round(el.getBoundingClientRect().height),
          html: el.outerHTML.slice(0, 500),
          styles: {
            bg: getComputedStyle(el).backgroundColor,
            w: getComputedStyle(el).width,
            h: getComputedStyle(el).height,
            radius: getComputedStyle(el).borderRadius,
            anim: getComputedStyle(el).animation,
          },
        }));
      return { url: location.href, title: document.title, loaders, text: (document.body.innerText || '').slice(0, 400) };
    });
    await fs.writeFile(path.join(OUT, `loader-${i}.json`), JSON.stringify(info, null, 2));
    if (/Reserva|Vuelo de ida|Selecciona tu vuelo/i.test(info.text) && !/Search flight|Buscar vuelo/.test(info.text.slice(0, 80))) break;
  }

  await page.waitForFunction(
    () => /Selecciona tu vuelo|Vuelo de ida|Vuelos directos|Select your flight/i.test(document.body.innerText || ''),
    { timeout: 45000 },
  ).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  const dump = await dumpPage(page, 'results');
  await fs.writeFile(path.join(OUT, 'requests.json'), JSON.stringify(requests.slice(0, 80), null, 2));

  const cssDir = path.join(OUT, 'css');
  await fs.mkdir(cssDir, { recursive: true });
  for (const href of (dump.sheets || []).slice(0, 12)) {
    try {
      const res = await fetch(href);
      if (!res.ok) continue;
      const name = href.split('/').pop().split('?')[0] || 'sheet.css';
      await fs.writeFile(path.join(cssDir, name.slice(0, 80)), await res.text());
    } catch { /* ignore */ }
  }

  // Open sort and fare dropdowns
  const sortBtns = await page.$x("//button[contains(., 'Más relevante') or contains(., 'Most relevant') or contains(., 'Ordenar')]");
  if (sortBtns[0]) {
    await sortBtns[0].click();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT, 'sort-open.png') });
    await dumpPage(page, 'sort-open');
    await page.keyboard.press('Escape').catch(() => {});
  }

  const fare = await page.$x("//button[contains(., 'Económica') or contains(., 'Economy') or contains(., 'Desde')]");
  if (fare[0]) {
    await fare[0].click();
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT, 'fare-open.png') });
    await dumpPage(page, 'fare-open');
  }

  const edit = await page.$x("//button[contains(., 'Editar') or contains(., 'Edit')] | //a[contains(., 'Editar')]");
  if (edit[0]) {
    await edit[0].click();
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT, 'edit-open.png') });
    await dumpPage(page, 'edit-open');
  }

  console.log(JSON.stringify({
    url: dump.url,
    title: dump.title,
    htmlLen: dump.htmlLen,
    requests: requests.slice(0, 20),
    textStart: dump.text.slice(0, 500),
  }, null, 2));

  await page.close();
  await browser.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
