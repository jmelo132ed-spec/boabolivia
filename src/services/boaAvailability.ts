import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BOA_STATIONS } from '../data/boaStations';
import { type FareOption } from '../data/fareBrands';
import { sortRecommended, uniqueFlights, type FlightOperator, type FlightResult, type FlightSegmentDetail } from './flightApi';

const BOA_HOME = 'https://www.boa.bo';

export type BoaCalendarDay = {
  date: string;
  price: number;
};

type BoaSearchParams = {
  origin: string;
  destination: string;
  depart: string;
  returnDate?: string;
  adults: string;
  children: string;
  infants: string;
  cabin: string;
};

function money2(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function ymdToIso(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return '';
}

function isoToYmd(iso: string) {
  return String(iso || '').replace(/-/g, '');
}

function hhmm(raw?: string) {
  const digits = String(raw || '').replace(/\D/g, '').padStart(4, '0').slice(-4);
  if (!/^\d{4}$/.test(digits)) return '--:--';
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function hhmmMinutes(raw?: string) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length >= 4) {
    const n = digits.slice(-4);
    return Number(n.slice(0, 2)) * 60 + Number(n.slice(2));
  }
  if (digits.length === 3) return Number(digits[0]) * 60 + Number(digits.slice(1));
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

function periodFromClock(time: string): FlightResult['period'] {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function boaDurationLabel(mins: number) {
  const n = Math.max(0, Math.round(mins) || 0);
  if (n < 60) return `${n} minutos`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (!m) return `${h} ${h === 1 ? 'hora' : 'horas'}`;
  return `${h} ${h === 1 ? 'hora' : 'horas'} y ${m} minutos`;
}

function planeType(raw?: string) {
  const value = String(raw || '').toUpperCase().trim();
  const digits = value.match(/(\d{3,4})/);
  if (digits) return digits[1];
  return value.replace(/^B/, '') || '737';
}

function station(code: string) {
  const iata = String(code || '').toUpperCase();
  return BOA_STATIONS.find((item) => item.code === iata) ?? {
    city: iata,
    country: '',
    code: iata,
    airport: iata,
  };
}

function parseJson<T = unknown>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('BoA devolvió una respuesta inválida.');
  }
}

function unwrapJson(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return unwrapJson(parseJson(trimmed));
  }
  return value;
}

function num(value: unknown) {
  const n = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function cffForCabin(cabin: string) {
  return /business|first/i.test(cabin) ? '1' : '2';
}

type BoaSegment = {
  num_opcion?: string;
  num_vuelo?: string;
  linea?: string;
  co_operador?: string;
  origen?: string;
  destino?: string;
  fecha_salida?: string;
  fecha_llegada?: string;
  hora_salida?: string;
  hora_llegada?: string;
  tiempo_vuelo?: string;
  tiempo_vuelo_segmento?: string;
  tiempo_espera?: string | null;
  tipo_avion?: string;
};

type BoaFare = {
  FI?: string;
  totalAmount?: string;
  totalTaxes?: string;
  IVs?: { IV?: { I?: string; IDisponibility?: string } | { I?: string; IDisponibility?: string }[] };
  TarifasPersoCombinabilityID?: {
    TarifaPersoCombinabilityID?: {
      importe?: string;
      tax_orig?: string;
      origen?: string;
      destino?: string;
    } | {
      importe?: string;
      tax_orig?: string;
    }[];
  };
};

function faresForOption(fares: BoaFare[], optionId: string) {
  const matches: { fare: number; tax: number; seats: number }[] = [];
  for (const fare of fares) {
    const ivs = asArray(fare.IVs?.IV);
    const iv = ivs.find((item) => String(item?.I || '') === optionId);
    const hit = Boolean(iv) || String(fare.FI || '') === optionId;
    if (!hit) continue;
    const details = asArray(fare.TarifasPersoCombinabilityID?.TarifaPersoCombinabilityID);
    const first = details[0];
    const amount = money2(num(first?.importe ?? fare.totalAmount));
    const tax = money2(num(first?.tax_orig ?? fare.totalTaxes));
    const seats = Math.max(0, Math.round(num(iv?.IDisponibility) || 9));
    if (amount > 0) matches.push({ fare: amount, tax, seats });
  }
  matches.sort((a, b) => a.fare - b.fare);
  const seen = new Set<string>();
  return matches.filter((item) => {
    const key = item.fare.toFixed(2);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function boaBrandOptions(
  tiers: { fare: number; tax: number; seats: number }[],
  cabin: string,
  standardPrice: number,
): FareOption[] {
  if (!tiers.length) return [];
  const economy = cabin !== 'business';
  const make = (
    id: FareOption['id'],
    name: string,
    tone: FareOption['tone'],
    tier: { fare: number; tax: number; seats: number },
  ): FareOption => ({
    id,
    name,
    price: tier.fare,
    extra: 0,
    accent: '#002e6e',
    tone,
    cabin: economy ? 'economy' : 'business',
    restrictions: false,
    headerIcons: [],
    perks: [],
    details: { includes: [], extras: [] },
    seats: tier.seats,
  });
  const cheapest = tiers[0];
  const isStandard = Number.isFinite(standardPrice)
    && Math.abs(cheapest.fare - standardPrice) < 0.05;
  return [
    make(
      isStandard ? 'light' : 'pe',
      isStandard ? 'Standard' : 'Flex',
      isStandard ? 'light' : 'flex',
      cheapest,
    ),
  ];
}

function calendarFromPayload(payload: unknown): BoaCalendarDay[] {
  const root = unwrapJson(payload) as Record<string, unknown>;
  const calendar = unwrapJson(
    (root as { CalendarResult?: unknown }).CalendarResult
    ?? (root as { ResultCalendar?: unknown }).ResultCalendar
    ?? root,
  ) as Record<string, unknown>;
  const result = (calendar.ResultCalendar || calendar) as Record<string, unknown>;
  const ow = result.calendarioOW as Record<string, unknown> | undefined;
  const rt = result.calendarioRT as Record<string, unknown> | undefined;
  const ida = (ow?.OW_Ida || rt?.RT_Ida || ow || rt) as Record<string, unknown> | undefined;
  const salidas = (ida?.salidas as Record<string, unknown> | undefined)?.salida
    ?? (ida as { salida?: unknown })?.salida;
  const days = asArray(salidas as { fecha?: string; tarifas?: { tarifaCalen?: { importe?: string } | { importe?: string }[] } }[]);
  const out: BoaCalendarDay[] = [];
  for (const day of days) {
    const date = ymdToIso(String(day?.fecha || ''));
    const tariffs = asArray(day?.tarifas?.tarifaCalen);
    const price = Math.min(...tariffs.map((item) => num(item?.importe)).filter((n) => n > 0));
    if (date && Number.isFinite(price)) out.push({ date, price: money2(price) });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  const seen = new Set<string>();
  return out.filter((day) => {
    if (seen.has(day.date)) return false;
    seen.add(day.date);
    return true;
  });
}

function mapFlights(payload: unknown, cabin: string): FlightResult[] {
  const root = unwrapJson(payload) as Record<string, unknown>;
  const inner = unwrapJson(
    (root as { AvailabilityPlusValuationsShortResult?: unknown }).AvailabilityPlusValuationsShortResult
    ?? root,
  ) as Record<string, unknown>;
  const result = (inner.ResultAvailabilityPlusValuationsShort || inner) as Record<string, unknown>;
  const bundle = (result.vuelosYTarifas || result) as Record<string, unknown>;
  const vuelos = (bundle.Vuelos || bundle.vuelos) as Record<string, unknown> | undefined;
  const ida = (vuelos?.ida || vuelos?.Ida) as Record<string, unknown> | undefined;
  const item = (ida?.Item || ida) as Record<string, unknown> | undefined;
  const segments = asArray(item?.vuelo as BoaSegment | BoaSegment[]);
  const fares = asArray(
    ((bundle.Tarifas as Record<string, unknown> | undefined)?.TarifaPersoCombinabilityIdaVueltaShort) as BoaFare | BoaFare[],
  );

  const groups = new Map<string, BoaSegment[]>();
  for (const seg of segments) {
    const id = String(seg?.num_opcion || '').trim();
    if (!id) continue;
    const list = groups.get(id) || [];
    list.push(seg);
    groups.set(id, list);
  }

  const optionTiers = new Map<string, { fare: number; tax: number; seats: number }[]>();
  for (const optionId of groups.keys()) {
    optionTiers.set(optionId, faresForOption(fares, optionId));
  }
  const standardPrice = Math.min(
    ...[...optionTiers.values()].flat().map((tier) => tier.fare).filter((fare) => fare > 0),
  );

  const rows: FlightResult[] = [];
  for (const [optionId, segs] of groups) {
    const tiers = optionTiers.get(optionId) || [];
    const pricing = tiers[0];
    if (!pricing) continue;
    const first = segs[0];
    const last = segs[segs.length - 1];
    const itinerary: FlightSegmentDetail[] = segs.map((seg, index) => {
      const origin = station(String(seg.origen || ''));
      const dest = station(String(seg.destino || ''));
      const next = segs[index + 1];
      const wait = next
        ? Math.max(
          0,
          Date.parse(`${ymdToIso(String(next.fecha_salida || ''))}T${hhmm(next.hora_salida)}:00`)
            - Date.parse(`${ymdToIso(String(seg.fecha_llegada || ''))}T${hhmm(seg.hora_llegada)}:00`),
        ) / 60000
        : 0;
      const mins = hhmmMinutes(seg.tiempo_vuelo_segmento) || hhmmMinutes(seg.tiempo_vuelo);
      const code = String(seg.linea || seg.co_operador || 'OB').toUpperCase();
      return {
        flightNumber: `${code} ${String(seg.num_vuelo || '').trim()}`.trim(),
        operator: 'Boliviana de Aviación',
        operatorCode: code || 'OB',
        depart: hhmm(seg.hora_salida),
        arrive: hhmm(seg.hora_llegada),
        duration: boaDurationLabel(mins),
        durationMinutes: mins,
        originCode: origin.code,
        originCity: origin.city,
        originAirport: origin.airport,
        destCode: dest.code,
        destCity: dest.city,
        destAirport: dest.airport,
        layover: wait > 0 ? boaDurationLabel(wait) : undefined,
        aircraft: planeType(seg.tipo_avion),
      };
    });
    const totalMins = hhmmMinutes(first?.tiempo_vuelo)
      || itinerary.reduce((sum, seg) => sum + (seg.durationMinutes || 0), 0);
    const stopCount = Math.max(0, segs.length - 1);
    const depart = hhmm(first?.hora_salida);
    const arrive = hhmm(last?.hora_llegada);
    const departIso = ymdToIso(String(first?.fecha_salida || ''));
    const arriveIso = ymdToIso(String(last?.fecha_llegada || ''));
    const operators: FlightOperator[] = [{ name: 'Boliviana de Aviación', code: 'OB' }];
    rows.push({
      id: `boa-${optionId}-${departIso}-${depart}`,
      outboundLegId: `boa-${optionId}-${departIso}-${depart}`,
      airline: 'Boliviana de Aviación',
      flightNumber: itinerary[0]?.flightNumber || 'OB',
      depart,
      arrive,
      duration: boaDurationLabel(totalMins),
      durationMinutes: totalMins,
      stops: stopCount === 0 ? 'Directo' : `${stopCount} parada${stopCount > 1 ? 's' : ''}`,
      stopCount,
      period: periodFromClock(depart),
      date: departIso,
      price: pricing.fare,
      tax: pricing.tax,
      fare: '',
      latam: true,
      arriveNextDay: Boolean(arriveIso && departIso && arriveIso > departIso),
      operators,
      itinerary,
      fareOptions: boaBrandOptions(tiers, cabin, standardPrice),
    });
  }

  return uniqueFlights(rows).sort(sortRecommended);
}

function chromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  return candidates.find((file) => file && fs.existsSync(file)) || '';
}

const HEADLESS_CDP = 'http://127.0.0.1:9223';
type BoaBrowser = Awaited<ReturnType<typeof import('puppeteer-core')['launch']>>;
const boaGlobal = globalThis as typeof globalThis & { __boaHeadlessBrowser?: BoaBrowser };
let boaQueue: Promise<unknown> = Promise.resolve();

function enqueueBoa<T>(fn: () => Promise<T>) {
  const run = boaQueue.then(fn, fn);
  boaQueue = run.then(() => undefined, () => undefined);
  return run;
}

async function getHeadlessBrowser() {
  const cached = boaGlobal.__boaHeadlessBrowser;
  if (cached) {
    try {
      await cached.pages();
      return cached;
    } catch {
      boaGlobal.__boaHeadlessBrowser = undefined;
    }
  }

  const puppeteer = await import('puppeteer-core');
  try {
    const res = await fetch(`${HEADLESS_CDP}/json/version`, { signal: AbortSignal.timeout(800) });
    if (res.ok) {
      const { webSocketDebuggerUrl } = await res.json() as { webSocketDebuggerUrl: string };
      const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl, defaultViewport: { width: 1280, height: 800 } });
      boaGlobal.__boaHeadlessBrowser = browser;
      return browser;
    }
  } catch {
    // Launch a dedicated headless Chrome below.
  }

  const exe = chromePath();
  if (!exe) throw new Error('No se pudo iniciar la sesión de BoA.');
  const userDataDir = path.join(os.tmpdir(), 'boa-bolivia-headless');
  fs.mkdirSync(userDataDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
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
  boaGlobal.__boaHeadlessBrowser = browser;
  return browser;
}

async function waitForCsrf(page: { evaluate: (fn: () => unknown) => Promise<unknown> }, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const token = await page.evaluate(() => document.getElementsByName('__RequestVerificationToken')[0]?.value || '');
    if (token) return String(token);
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error('No se pudo iniciar la sesión de BoA.');
}

async function fetchBoaAvailability(params: BoaSearchParams) {
  const adults = Math.max(1, Number(params.adults || 1));
  const children = Math.max(0, Number(params.children || 0));
  const infants = Math.max(0, Number(params.infants || 0));
  const paxDetails = [
    adults > 0 ? { seats: adults, paxType: 'ADT' } : null,
    children > 0 ? { seats: children, paxType: 'CHD' } : null,
    infants > 0 ? { seats: infants, paxType: 'INF' } : null,
  ].filter(Boolean);
  const reserveBody = {
    language: 'es',
    componentType: 'AVA',
    behabiorCode: 'TK',
    AvailabilityComponent: {
      from: params.origin,
      to: params.destination,
      paxDetails,
      departureDate: params.depart,
      CFF: cffForCabin(params.cabin),
      ...(params.returnDate ? { returnDate: params.returnDate } : {}),
    },
    ValidationTime: 2000,
  };
  const departing = isoToYmd(params.depart);

  const browser = await getHeadlessBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    await page.goto(`${BOA_HOME}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForCsrf(page);

    const reserve = await page.evaluate(async (body) => {
      const token = document.getElementsByName('__RequestVerificationToken')[0]?.value || '';
      const res = await fetch('/api/Reserve/GetReserveComponent', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          RequestVerificationToken: token,
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      return { ok: res.ok, status: res.status, json: await res.json() };
    }, reserveBody) as { ok: boolean; json: { data?: string; message?: string } };

    if (!reserve.ok || !reserve.json?.data) {
      throw new Error(reserve.json?.message || 'BoA no devolvió disponibilidad.');
    }

    const sessionUrl = reserve.json.data;
    const componentId = new URL(sessionUrl).pathname.split('/').filter(Boolean).pop() || '';
    if (!componentId) throw new Error('BoA no devolvió el identificador de búsqueda.');

    await page.goto(sessionUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForCsrf(page);

    const availability = await page.evaluate(async (id, date) => {
      const token = document.getElementsByName('__RequestVerificationToken')[0]?.value || '';
      const headers = {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        RequestVerificationToken: token,
      };
      const post = async (url, extra = {}) => {
        const payload = { ComponentId: id, departing: date, documentsSelecteds: [], ...extra };
        let res = await fetch(url, { method: 'POST', headers, credentials: 'include', body: JSON.stringify(payload) });
        let text = await res.text();
        if (!res.ok || /stringToUnescape|An error occurred/i.test(text)) {
          res = await fetch(url, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ ...payload, reFetch: crypto.randomUUID() }),
          });
          text = await res.text();
        }
        return { ok: res.ok, status: res.status, text };
      };
      const [calendar, upsell] = await Promise.all([
        post('/Api/Availability/Calendar', { language: 'es' }),
        post('/Api/Availability/Upsell'),
      ]);
      return { calendar, upsell };
    }, componentId, departing) as {
      calendar: { ok: boolean; text: string };
      upsell: { ok: boolean; text: string };
    };

    if (!availability.upsell.ok) throw new Error('BoA no devolvió vuelos.');
    return {
      calendar: availability.calendar.ok ? parseJson(availability.calendar.text) : {},
      upsell: parseJson(availability.upsell.text),
    };
  } finally {
    await page.close().catch(() => undefined);
  }
}

export async function searchBoaFlights(params: BoaSearchParams): Promise<{
  results: FlightResult[];
  calendar: BoaCalendarDay[];
}> {
  const origin = String(params.origin || '').toUpperCase();
  const destination = String(params.destination || '').toUpperCase();
  const depart = String(params.depart || '');
  if (!origin || !destination || !/^\d{4}-\d{2}-\d{2}$/.test(depart)) {
    return { results: [], calendar: [] };
  }

  return enqueueBoa(async () => {
    const payload = await fetchBoaAvailability({ ...params, origin, destination, depart });
    return {
      results: mapFlights(payload.upsell, params.cabin),
      calendar: calendarFromPayload(payload.calendar),
    };
  });
}
