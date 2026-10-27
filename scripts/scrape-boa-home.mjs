import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const CDP_URL = 'http://127.0.0.1:9222';
const OUT = path.resolve('scripts/output-boa');

function pick(s, keys) {
  const out = {};
  for (const k of keys) out[k] = s[k];
  return out;
}

const STYLE_KEYS = [
  'display', 'position', 'top', 'left', 'right', 'bottom', 'zIndex',
  'width', 'height', 'minHeight', 'maxWidth', 'margin', 'padding',
  'color', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition',
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign',
  'border', 'borderRadius', 'boxShadow', 'opacity', 'overflow',
  'alignItems', 'justifyContent', 'gap', 'flexDirection', 'flexWrap', 'gridTemplateColumns',
];

async function main() {
  const list = await (await fetch(`${CDP_URL}/json/list`)).json();
  const tab = list.find((t) => (t.url || '').includes('boa.bo') && t.type === 'page');
  if (!tab) throw new Error('No hay pestaña boa.bo en CDP');

  const { webSocketDebuggerUrl } = await (await fetch(`${CDP_URL}/json/version`)).json();
  const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl, defaultViewport: null });
  const pages = await browser.pages();
  let page = pages.find((p) => (p.url() || '').includes('boa.bo'));
  if (!page) {
    page = await browser.newPage();
    await page.goto(tab.url, { waitUntil: 'networkidle2', timeout: 120000 });
  }

  await page.bringToFront();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  const dump = await page.evaluate((STYLE_KEYS) => {
    const css = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const out = {
        tag: el.tagName.toLowerCase(),
        id: el.id,
        className: String(el.className || '').slice(0, 220),
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 180),
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      };
      for (const k of STYLE_KEYS) out[k] = s[k];
      return out;
    };

    const q = (sel) => document.querySelector(sel);
    const qa = (sel) => [...document.querySelectorAll(sel)];

    const vars = {};
    const root = getComputedStyle(document.documentElement);
    for (const name of root) if (name.startsWith('--')) vars[name] = root.getPropertyValue(name).trim();

    const interesting = [
      'header', 'nav', 'main', 'footer',
      '[class*="hero"]', '[class*="banner"]', '[class*="slider"]',
      '[class*="search"]', '[class*="booking"]', '[class*="reserva"]',
      '[class*="tab"]', 'form',
    ];

    const nodes = [];
    const seen = new Set();
    for (const sel of interesting) {
      for (const el of qa(sel).slice(0, 12)) {
        if (seen.has(el)) continue;
        seen.add(el);
        nodes.push({ sel, ...css(el) });
      }
    }

    const byText = (re) => {
      const walk = [...document.querySelectorAll('button, a, span, p, h1, h2, h3, label, li, div')];
      return walk.find((el) => re.test((el.innerText || '').trim()) && (el.innerText || '').trim().length < 80);
    };

    const headerEl = q('header') || q('nav') || q('[class*="header"]') || q('[class*="navbar"]');
    const h1 = q('h1');
    const searchHints = qa('button, a, span, div').filter((el) =>
      /Reserva|Check-in|Estado De Vuelo|Buscar vuelo|Ida y Vuelta|Solo Ida/i.test((el.innerText || '').trim())
      && (el.innerText || '').trim().length < 40,
    ).slice(0, 30).map((el) => css(el));

    const imgs = qa('img').slice(0, 120).map((img) => ({
      src: img.currentSrc || img.src,
      alt: img.alt,
      w: img.naturalWidth,
      h: img.naturalHeight,
      rect: (() => {
        const r = img.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.height ? Math.round(r.height) : Math.round(r.height) };
      })(),
      className: String(img.className || '').slice(0, 120),
    }));

    const bgImgs = qa('*').filter((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      return bg && bg !== 'none' && /url\(/.test(bg);
    }).slice(0, 40).map((el) => ({
      className: String(el.className || '').slice(0, 160),
      bg: getComputedStyle(el).backgroundImage,
      rect: (() => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      })(),
    }));

    const sheets = [...document.styleSheets].map((s) => s.href).filter(Boolean);

    return {
      title: document.title,
      url: location.href,
      htmlLen: document.documentElement.outerHTML.length,
      fonts: [...new Set([...document.fonts].map((f) => `${f.family} ${f.weight}`))],
      vars,
      sheets,
      header: css(headerEl),
      h1: css(h1),
      body: css(document.body),
      searchHints,
      siente: css(byText(/^Siente Madrid$/i)),
      reserva: css(byText(/^Reserva$/i)),
      checkin: css(byText(/Iniciar Check-in/i)),
      estado: css(byText(/Estado De Vuelo/i)),
      idaVuelta: css(byText(/Ida y Vuelta/i)),
      soloIda: css(byText(/Solo Ida/i)),
      buscar: css(byText(/Buscar vuelo/i)),
      origen: css(byText(/^Origen$/i)),
      destino: css(byText(/^Destino$/i)),
      nodes,
      imgs,
      bgImgs,
      bodyText: (document.body.innerText || '').slice(0, 4000),
    };
  }, STYLE_KEYS);

  const html = await page.evaluate(() => document.documentElement.outerHTML);
  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(path.join(OUT, 'home-dump.json'), JSON.stringify(dump, null, 2));
  await fs.writeFile(path.join(OUT, 'page-full.html'), html);

  const heroClip = { x: 0, y: 0, width: 1440, height: 900 };
  await page.screenshot({ path: path.join(OUT, 'home-hero.png'), clip: heroClip });
  await page.screenshot({ path: path.join(OUT, 'home-full.png'), fullPage: true, captureBeyondViewport: true });

  const cssDir = path.join(OUT, 'css');
  await fs.mkdir(cssDir, { recursive: true });
  for (const href of dump.sheets.slice(0, 20)) {
    try {
      const res = await fetch(href);
      if (!res.ok) continue;
      const name = href.split('/').pop().split('?')[0] || 'sheet.css';
      await fs.writeFile(path.join(cssDir, name.slice(0, 80)), await res.text());
    } catch {
      /* ignore */
    }
  }

  console.log(JSON.stringify({
    title: dump.title,
    url: dump.url,
    htmlLen: dump.htmlLen,
    fonts: dump.fonts.slice(0, 15),
    header: dump.header,
    h1: dump.h1,
    siente: dump.siente,
    reserva: dump.reserva,
    buscar: dump.buscar,
    searchHints: dump.searchHints?.map((x) => ({ text: x?.text, className: x?.className, bg: x?.backgroundColor, color: x?.color, radius: x?.borderRadius, pad: x?.padding, font: `${x?.fontSize} ${x?.fontWeight}` })),
    sheets: dump.sheets,
  }, null, 2));

  await browser.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
