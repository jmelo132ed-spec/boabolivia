import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const CDP_URL = 'http://127.0.0.1:9222';
const TARGET = 'https://www.boa.bo/';
const OUT_DIR = path.resolve('scripts/output-boa');

async function main() {
  const res = await fetch(`${CDP_URL}/json/version`);
  if (!res.ok) throw new Error('Chrome CDP no disponible en :9222');
  const { webSocketDebuggerUrl } = await res.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl, defaultViewport: null });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 120000 });

  for (let i = 0; i < 40; i += 1) {
    const blocked = await page.evaluate(() =>
      /Pardon Our Interruption|Access Denied/i.test(document.body?.innerText || ''),
    );
    const ready = await page.evaluate(() => Boolean(document.querySelector('header, nav, main, #root, .header, .navbar')));
    if (!blocked && (ready || (await page.title()))) break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  await new Promise((r) => setTimeout(r, 2500));

  const data = await page.evaluate(() => {
    const css = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        id: el.id,
        className: String(el.className || '').slice(0, 180),
        color: s.color,
        background: s.backgroundColor,
        backgroundImage: s.backgroundImage,
        font: `${s.fontFamily} | ${s.fontSize} | ${s.fontWeight}`,
        height: s.height,
        width: s.width,
        padding: s.padding,
        margin: s.margin,
        display: s.display,
        position: s.position,
      };
    };

    const imgs = [...document.images].slice(0, 80).map((img) => ({
      src: img.currentSrc || img.src,
      alt: img.alt,
      w: img.naturalWidth,
      h: img.naturalHeight,
    }));

    const links = [...document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="font"], link[rel="icon"]')].map((l) => ({
      rel: l.rel,
      href: l.href,
    }));

    const fonts = [...new Set([...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`))];

    const vars = {};
    const root = getComputedStyle(document.documentElement);
    for (const name of root) {
      if (name.startsWith('--')) vars[name] = root.getPropertyValue(name).trim();
    }

    const sections = [...document.querySelectorAll('header, nav, main, footer, section, .hero, [class*="banner"], [class*="booking"], [class*="search"]')]
      .slice(0, 40)
      .map((el) => ({
        tag: el.tagName,
        className: String(el.className || '').slice(0, 160),
        id: el.id,
        text: (el.innerText || '').slice(0, 240),
        style: css(el),
      }));

    return {
      title: document.title,
      url: location.href,
      bodyTextStart: (document.body.innerText || '').slice(0, 1500),
      fonts,
      vars,
      links,
      imgs,
      header: css(document.querySelector('header, .header, nav')),
      body: css(document.body),
      sections,
      html: document.documentElement.outerHTML.slice(0, 250000),
    };
  });

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, 'scrape.json'), JSON.stringify({ ...data, html: undefined }, null, 2));
  await fs.writeFile(path.join(OUT_DIR, 'page.html'), data.html);
  await page.screenshot({ path: path.join(OUT_DIR, 'desktop.png'), fullPage: true });
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT_DIR, 'mobile.png'), fullPage: true });
  console.log(JSON.stringify({ title: data.title, url: data.url, fonts: data.fonts.slice(0, 20), sections: data.sections.length, imgs: data.imgs.length }, null, 2));
  await page.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
