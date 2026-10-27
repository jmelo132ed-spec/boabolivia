import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HEADLESS_CDP = 'http://127.0.0.1:9223';
const OUT = path.resolve('scripts/output-boa/review');
const BOA_HOME = 'https://www.boa.bo';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function chromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  ];
  return candidates.find((file) => file && fs.existsSync(file)) || '';
}

async function connectOrLaunch() {
  try {
    const res = await fetch(`${HEADLESS_CDP}/json/version`, { signal: AbortSignal.timeout(800) });
    if (res.ok) {
      const { webSocketDebuggerUrl } = await res.json();
      return puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl,
        defaultViewport: { width: 1440, height: 900 },
      });
    }
  } catch {
    /* launch */
  }
  const exe = chromePath();
  if (!exe) throw new Error('Chrome no encontrado');
  const userDataDir = path.join(os.tmpdir(), 'boa-bolivia-headless');
  fs.mkdirSync(userDataDir, { recursive: true });
  return puppeteer.launch({
    executablePath: exe,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--remote-debugging-port=9223',
      `--user-data-dir=${userDataDir}`,
    ],
  });
}

async function dump(page, name) {
  fs.mkdirSync(OUT, { recursive: true });
  const data = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        className: String(el.className || '').slice(0, 220),
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 280),
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        color: s.color,
        bg: s.backgroundColor,
        bgImg: s.backgroundImage.slice(0, 300),
        font: `${s.fontWeight} ${s.fontSize}/${s.lineHeight} ${s.fontFamily.split(',')[0]}`,
        pad: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        margin: `${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`,
        radius: s.borderRadius,
        shadow: s.boxShadow,
        border: s.border,
      };
    };
    const imgs = [...document.querySelectorAll('img')].map((img) => ({
      src: img.currentSrc || img.src,
      w: img.naturalWidth,
      h: img.naturalHeight,
      rect: img.getBoundingClientRect().toJSON(),
      alt: img.alt,
    }));
    const headings = [...document.querySelectorAll('h1,h2,h3,h4')].map(box);
    const buttons = [...document.querySelectorAll('button, a[role="button"]')].slice(0, 50).map((el) => ({
      ...box(el),
      aria: el.getAttribute('aria-label'),
    }));
    return {
      url: location.href,
      title: document.title,
      text: (document.body.innerText || '').slice(0, 12000),
      body: box(document.body),
      headings,
      buttons,
      imgs: imgs.slice(0, 40),
    };
  });
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(OUT, `${name}.html`), await page.content());
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }).catch(() => {});
  await page.screenshot({ path: path.join(OUT, `${name}-view.png`) }).catch(() => {});
  return data;
}

async function waitText(page, re, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const text = await page.evaluate(() => document.body.innerText || '');
    if (re.test(text)) return text;
    await sleep(800);
  }
  return '';
}

async function clickText(page, re) {
  return page.evaluate((source) => {
    const rx = new RegExp(source, 'i');
    const el = [...document.querySelectorAll('button, a, [role="button"], span, div')].find((n) => {
      const t = (n.innerText || n.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      return rx.test(t) && t.length < 80 && n.getBoundingClientRect().height > 8;
    });
    if (!el) return false;
    el.click();
    return (el.innerText || '').slice(0, 80);
  }, re.source);
}

async function fillInput(page, labelRe, value) {
  return page.evaluate((source, val) => {
    const rx = new RegExp(source, 'i');
    const labels = [...document.querySelectorAll('label, p, span, legend')];
    for (const lab of labels) {
      if (!rx.test((lab.innerText || '').trim())) continue;
      const wrap = lab.closest('label') || lab.parentElement;
      const input = wrap?.querySelector('input, textarea') || lab.parentElement?.querySelector('input, textarea');
      if (input) {
        const proto = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        setter?.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }, labelRe.source, value);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await connectOrLaunch();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  page.setDefaultTimeout(60000);

  await page.goto(`${BOA_HOME}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(1500);
  const tokenReady = await page.evaluate(() => document.getElementsByName('__RequestVerificationToken')[0]?.value || '');
  if (!tokenReady) await sleep(2000);

  const reserve = await page.evaluate(async () => {
    const token = document.getElementsByName('__RequestVerificationToken')[0]?.value || '';
    const res = await fetch('/api/Reserve/GetReserveComponent', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        RequestVerificationToken: token,
      },
      credentials: 'include',
      body: JSON.stringify({
        language: 'es',
        componentType: 'AVA',
        behabiorCode: 'TK',
        AvailabilityComponent: {
          from: 'CBB',
          to: 'LPB',
          paxDetails: [{ seats: 1, paxType: 'ADT' }],
          departureDate: '2026-11-03',
          CFF: 'Y',
        },
        ValidationTime: 2000,
      }),
    });
    return { ok: res.ok, json: await res.json() };
  });
  fs.writeFileSync(path.join(OUT, 'reserve.json'), JSON.stringify(reserve, null, 2));
  if (!reserve.json?.data) throw new Error('No session URL');

  await page.goto(reserve.json.data, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitText(page, /Seleccionar|Vuelo de ida|Económica|Desde/i, 90000);
  await sleep(2000);
  await dump(page, 'availability');

  await clickText(page, /^Seleccionar$/);
  await sleep(2500);
  await dump(page, 'fares');
  await clickText(page, /^Seleccionar$/);
  await waitText(page, /Pasajero|Nombres|Correo/i, 60000);
  await sleep(1500);
  await dump(page, 'passengers');

  await fillInput(page, /^Nombres/, 'Jose');
  await fillInput(page, /^Apellidos/, 'Melo');
  await fillInput(page, /Fecha de Nacimiento|nacimiento/i, '12/05/1990');
  await page.evaluate(() => {
    const gender = document.querySelector('select, [role="combobox"]');
    const selects = [...document.querySelectorAll('select')];
    for (const sel of selects) {
      const opt = [...sel.options].find((o) => /masculino|male/i.test(o.textContent || ''));
      if (opt) {
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    const combo = [...document.querySelectorAll('[role="combobox"], [aria-haspopup="listbox"]')];
    combo[0]?.click();
  });
  await sleep(400);
  await clickText(page, /^MASCULINO$/);
  await sleep(300);
  await page.evaluate(() => {
    const selects = [...document.querySelectorAll('select')];
    for (const sel of selects) {
      const opt = [...sel.options].find((o) => /c[eé]dula de identidad|CI/i.test(o.textContent || ''));
      if (opt) {
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await fillInput(page, /documento/i, '12345678');
  await fillInput(page, /Correo/i, 'jose.melo@test.com');
  await fillInput(page, /N[uú]mero|Celular/i, '70000000');
  await sleep(400);
  await clickText(page, /^Continuar$/);
  await waitText(page, /Revisar y Pagar|Detalle de la reserva|Ver detalle/i, 60000);
  await sleep(1500);
  const closed = await dump(page, 'review-closed');

  const clicks = [];
  for (const re of [/Ver detalle/i, /Precio del viaje/i]) {
    clicks.push(await clickText(page, re));
    await sleep(800);
  }
  const open = await dump(page, 'review-open');

  const pay = await page.evaluate(() => {
    return [...document.querySelectorAll('button, a')].map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  });

  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({
    url: open.url,
    title: open.title,
    clicks,
    pay,
    text: open.text.slice(0, 4000),
    closedStart: closed.text.slice(0, 1500),
  }, null, 2));
  console.log(JSON.stringify({ url: open.url, title: open.title, clicks, buttons: pay.slice(0, 30) }, null, 2));

  await page.close().catch(() => {});
  try { await browser.disconnect(); } catch { try { await browser.close(); } catch { /* ignore */ } }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
