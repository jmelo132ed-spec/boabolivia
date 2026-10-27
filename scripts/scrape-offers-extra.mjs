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
  const send = (method, params = {}, timeout = 20000) =>
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
  const tab = list.find((t) => (t.url || '').includes('ofertas-vuelos') && (t.url || '').includes('avianca.com'));
  if (!tab) throw new Error('no tab');
  const client = await cdp(tab.webSocketDebuggerUrl);
  await client.send('Runtime.enable');
  const data = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const heroImg = document.querySelector('.searchbar-banner-bg-p img, picture.searchbar-banner-bg-p img, .searchbar-banner-p img');
      const heroSources = [...document.querySelectorAll('.searchbar-banner-bg-p source')].map((s) => ({ media: s.media, src: s.srcset }));
      const cards = [...document.querySelectorAll('.destination-card-promo-container, .list-card, [class*="route-card"], [class*="offer-row"]')].map((el) => {
        const bg = getComputedStyle(el.querySelector('[class*="bg"], [class*="image"]') || el).backgroundImage;
        const styleEl = el.querySelector('[style*="background-image"]');
        const img = el.querySelector('img');
        return {
          className: String(el.className||'').slice(0,160),
          text: (el.innerText||'').replace(/\\s+/g,' ').trim().slice(0,180),
          bg: styleEl?.getAttribute('style') || bg,
          img: img?.src || '',
        };
      });
      const faqs = [...document.querySelectorAll('details, .faq-item')].map((el) => ({
        q: (el.querySelector('summary, .faq-question, h3')?.innerText || el.innerText).trim().slice(0,180),
        a: (el.querySelector('.faq-answer, p')?.innerText || '').trim().slice(0,400),
      }));
      const footer = document.querySelector('footer, .footer, [class*="footer-grid"]');
      return {
        heroSrc: heroImg?.currentSrc || heroImg?.src || '',
        heroSources,
        tip: document.querySelector('[class*="hint"], [class*="banner-info"], [class*="info-banner"]')?.innerText || '',
        cards: cards.filter((c) => c.text).slice(0, 30),
        faqs,
        footerHtml: footer ? footer.outerHTML.slice(0, 12000) : '',
        footerText: footer ? footer.innerText.slice(0, 3000) : '',
      };
    })()`,
    returnByValue: true,
  });
  await fs.writeFile(path.join(OUT, 'offers-extra.json'), JSON.stringify(data.result.value, null, 2), 'utf8');
  console.log(JSON.stringify(data.result.value, null, 2).slice(0, 6000));
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
