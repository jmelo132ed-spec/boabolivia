/**
 * Scrape Avianca GT destination landing via existing Chrome CDP.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const CDP_URL = 'http://127.0.0.1:9222';
const TARGET = 'https://www.avianca.com/gt/es/vuelos-a-guatemala';
const OUT_DIR = path.resolve('C:/Users/manue/Desktop/peru/avianca guatemala/scripts/output-gt');

async function main() {
  const list = await fetch(`${CDP_URL}/json/list`).then((r) => r.json());
  const target = list.find((t) => (t.url || '').includes('vuelos-a-guatemala'));
  if (!target) throw new Error('No hay tab de vuelos-a-guatemala. Abre la URL en Chrome CDP.');

  const browser = await puppeteer.connect({
    browserWSEndpoint: (await fetch(`${CDP_URL}/json/version`).then((r) => r.json())).webSocketDebuggerUrl,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  let page = pages.find((p) => (p.url() || '').includes('vuelos-a-guatemala'));
  if (!page) {
    page = await browser.newPage();
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 1500));
  await fs.mkdir(OUT_DIR, { recursive: true });

  const dump = await page.evaluate(() => {
    const text = (el) => (el?.innerText || '').trim();
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const h1 = document.querySelector('h1');
    return {
      title: document.title,
      url: location.href,
      htmlLang: document.documentElement.lang,
      bodyFont: getComputedStyle(document.body).fontFamily,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      bodyColor: getComputedStyle(document.body).color,
      h1: text(h1),
      h2s: [...document.querySelectorAll('h2')].map((h) => text(h)).slice(0, 25),
      h3s: [...document.querySelectorAll('h3')].map((h) => text(h)).slice(0, 40),
      navTexts: [...document.querySelectorAll('header a, header button')].map((a) => text(a)).filter(Boolean).slice(0, 40),
      footerTexts: footer ? text(footer).slice(0, 4000) : '',
      headerHtml: header ? header.outerHTML.slice(0, 25000) : '',
      imgs: [...document.querySelectorAll('img')].slice(0, 60).map((img) => ({
        src: img.currentSrc || img.src,
        alt: img.alt,
        w: img.naturalWidth,
        h: img.naturalHeight,
      })),
      bodyText: (document.body.innerText || '').slice(0, 18000),
    };
  });

  await fs.writeFile(path.join(OUT_DIR, 'dump.json'), JSON.stringify(dump, null, 2), 'utf8');

  const html = await page.evaluate(() => document.documentElement.outerHTML);
  await fs.writeFile(path.join(OUT_DIR, 'page.html'), html, 'utf8');

  await page.screenshot({ path: path.join(OUT_DIR, 'desktop-top.png') });
  await page.evaluate(() => window.scrollTo(0, 800));
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: path.join(OUT_DIR, 'fold-800.png') });
  await page.evaluate(() => window.scrollTo(0, 1600));
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: path.join(OUT_DIR, 'fold-1600.png') });
  await page.evaluate(() => window.scrollTo(0, 2400));
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: path.join(OUT_DIR, 'fold-2400.png') });
  await page.evaluate(() => window.scrollTo(0, 3200));
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: path.join(OUT_DIR, 'fold-3200.png') });
  await page.evaluate(() => window.scrollTo(0, 0));

  await page.setViewport({ width: 375, height: 812 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'mobile-top.png') });

  console.log('OK', dump.title);
  console.log('H1', dump.h1);
  console.log('H2', dump.h2s.join(' | '));
  await browser.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
