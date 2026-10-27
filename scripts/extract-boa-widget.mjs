import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const CDP_URL = 'http://127.0.0.1:9222';
const OUT = path.resolve('scripts/output-boa');

async function main() {
  const { webSocketDebuggerUrl } = await (await fetch(`${CDP_URL}/json/version`)).json();
  const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl, defaultViewport: null });
  const page = (await browser.pages()).find((p) => (p.url() || '').includes('boa.bo'));
  if (!page) throw new Error('no boa tab');

  await page.bringToFront();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 }).catch(() => {});

  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button, a')];
    const accept = btns.find((b) => /aceptar/i.test(b.textContent || ''));
    accept?.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const data = await page.evaluate(() => {
    const css = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        className: String(el.className || '').slice(0, 280),
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120),
        rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        color: s.color,
        bg: s.backgroundColor,
        bgImg: s.backgroundImage,
        font: `${s.fontFamily}|${s.fontSize}|${s.fontWeight}|${s.lineHeight}`,
        pad: s.padding,
        margin: s.margin,
        radius: s.borderRadius,
        border: s.border,
        shadow: s.boxShadow,
        display: s.display,
        gap: s.gap,
        align: s.alignItems,
        justify: s.justifyContent,
        maxWidth: s.maxWidth,
        width: s.width,
        height: s.height,
      };
    };

    const nav = document.querySelector('nav');
    const logo = document.querySelector('nav img');
    const lang = [...document.querySelectorAll('nav button, nav span, nav div')].find((el) => /COLOMBIA|BOLIVIA/i.test(el.innerText || '') && (el.innerText || '').length < 40);
    const links = [...document.querySelectorAll('nav a')].filter((a) => /Viajes|Contáctanos|Centro de Ayuda/i.test(a.innerText || '')).map(css);

    const titleBox = document.querySelector('h1')?.closest('div');
    const heroImg = document.querySelector('img.absolute, header img, [class*="object-cover"]');

    const reservaBtn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').trim() === 'Reserva' && b.getBoundingClientRect().width > 80);
    const tabRow = reservaBtn?.parentElement;
    const searchCard = tabRow?.parentElement;

    const fields = [...document.querySelectorAll('input, button')].filter((el) => {
      const t = (el.getAttribute('placeholder') || el.innerText || el.value || '').trim();
      return /Origen|Destino|Salida|Regreso|Pasajero|Económica|Buscar vuelo|Ida y Vuelta|Solo Ida/i.test(t);
    }).slice(0, 20).map(css);

    const swap = [...document.querySelectorAll('button')].find((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 20 && r.width < 60 && r.y > 300 && r.y < 520;
    });

    return {
      nav: css(nav),
      navInner: css(nav?.firstElementChild),
      navBar: css(nav?.querySelector(':scope > div')),
      logo: css(logo),
      lang: css(lang),
      links,
      titleBox: css(titleBox),
      titleBoxParent: css(titleBox?.parentElement),
      h1: css(document.querySelector('h1')),
      h1sub: css(document.querySelector('h1')?.nextElementSibling),
      heroImg: css(heroImg),
      tabRow: css(tabRow),
      tabRowHTML: tabRow?.outerHTML?.slice(0, 8000),
      searchCard: css(searchCard),
      searchCardHTML: searchCard?.outerHTML?.slice(0, 18000),
      reserva: css(reservaBtn),
      fields,
      swap: css(swap),
      lgMax: getComputedStyle(document.querySelector('.lg-max-width') || document.body).maxWidth,
    };
  });

  await fs.writeFile(path.join(OUT, 'widget.json'), JSON.stringify(data, null, 2));
  await page.screenshot({ path: path.join(OUT, 'home-clean.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });
  console.log(JSON.stringify({
    nav: data.nav,
    logo: data.logo,
    lang: data.lang,
    links: data.links,
    titleBox: data.titleBox,
    h1: data.h1,
    h1sub: data.h1sub,
    tabRow: data.tabRow,
    searchCard: data.searchCard,
    reserva: data.reserva,
    fields: data.fields,
    swap: data.swap,
    lgMax: data.lgMax,
  }, null, 2));
  await browser.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
