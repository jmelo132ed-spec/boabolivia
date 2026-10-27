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

  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button, a')];
    btns.find((b) => /aceptar/i.test(b.textContent || ''))?.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const origin = await page.evaluateHandle(() => {
    const inputs = [...document.querySelectorAll('input')];
    return inputs.find((el) => /origen/i.test(el.placeholder || el.getAttribute('aria-label') || el.previousElementSibling?.textContent || ''))
      || [...document.querySelectorAll('input, button, [role="combobox"]')].find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 80 && r.y > 450 && r.y < 650 && r.x < 400;
      });
  });

  const box = await origin.asElement();
  if (box) {
    await box.click({ delay: 40 });
  } else {
    await page.mouse.click(180, 590);
  }
  await new Promise((r) => setTimeout(r, 800));

  const dump = await page.evaluate(() => {
    const css = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        className: String(el.className || '').slice(0, 260),
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 160),
        rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        color: s.color,
        bg: s.backgroundColor,
        font: `${s.fontFamily}|${s.fontSize}|${s.fontWeight}|${s.lineHeight}`,
        pad: s.padding,
        radius: s.borderRadius,
        border: s.border,
        shadow: s.boxShadow,
        overflow: s.overflowY,
        maxH: s.maxHeight,
        display: s.display,
        gap: s.gap,
      };
    };

    const list = [...document.querySelectorAll('ul, [role="listbox"], [class*="dropdown"], [class*="suggest"], [class*="airport"], [class*="station"]')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const t = el.innerText || '';
        return r.height > 80 && r.y > 200 && /CBB|LPB|VVI|Cochabamba|La Paz/i.test(t);
      })
      .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];

    const items = list
      ? [...list.querySelectorAll('li, button, [role="option"], a')].map((el) => ({
        text: (el.innerText || '').replace(/\s+/g, '\n').trim(),
        html: el.innerHTML.slice(0, 800),
        className: String(el.className || '').slice(0, 220),
        style: css(el),
      }))
      : [];

    const allText = (list?.innerText || document.body.innerText || '');

    return {
      list: css(list),
      listHTML: list?.outerHTML?.slice(0, 25000) || '',
      items,
      bodyHas: /Cochabamba|Jorge Wilstermann|Viru Viru|Alcantari/i.test(allText),
    };
  });

  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(path.join(OUT, 'stations-dropdown.json'), JSON.stringify(dump, null, 2));
  const clip = dump.list?.rect;
  if (clip && clip.w > 40) {
    await page.screenshot({
      path: path.join(OUT, 'stations-dropdown.png'),
      clip: {
        x: Math.max(0, clip.x - 16),
        y: Math.max(0, clip.y - 80),
        width: Math.min(900, clip.w + 40),
        height: Math.min(700, clip.h + 100),
      },
    });
  } else {
    await page.screenshot({ path: path.join(OUT, 'stations-dropdown.png'), clip: { x: 80, y: 480, width: 720, height: 520 } });
  }

  console.log(JSON.stringify({
    list: dump.list,
    itemCount: dump.items.length,
    sample: dump.items.slice(0, 8).map((i) => ({ text: i.text, className: i.className, bg: i.style?.bg, pad: i.style?.pad, font: i.style?.font })),
    htmlStart: dump.listHTML.slice(0, 1500),
  }, null, 2));

  await browser.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
