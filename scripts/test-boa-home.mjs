const res = await fetch('https://www.boa.bo/', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept-Language': 'es-BO,es;q=0.9,en;q=0.8',
    Accept: 'text/html,application/xhtml+xml',
  },
});
const html = await res.text();
console.log('status', res.status, 'len', html.length, 'ok', res.ok);
const idx = html.indexOf('RequestVerificationToken');
console.log('idx', idx);
if (idx >= 0) console.log(html.slice(Math.max(0, idx - 120), idx + 220).replace(/\s+/g, ' '));
const m1 = html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/i);
const m2 = html.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/i);
const m3 = html.match(/__RequestVerificationToken[^>]{0,200}/);
console.log('m1', Boolean(m1), m1?.[1]?.slice(0, 20));
console.log('m2', Boolean(m2), m2?.[1]?.slice(0, 20));
console.log('m3', m3?.[0]);
console.log('cookies', res.headers.getSetCookie?.()?.length, res.headers.get('set-cookie')?.slice(0, 120));
