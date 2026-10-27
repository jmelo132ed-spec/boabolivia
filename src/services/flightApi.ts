import { FLIGHTAPI_KEY } from 'astro:env/server';
import { buildFareOptions, type FareOption } from '../data/fareBrands';

export type FlightLegInfo = {
  depart: string;
  arrive: string;
  duration: string;
  durationMinutes: number;
  stops: string;
  stopCount: number;
  flightNumber: string;
  period: 'morning' | 'afternoon' | 'evening';
};

export type FlightOperator = {
  name: string;
  code: string;
};

export type FlightSegmentDetail = {
  flightNumber: string;
  operator: string;
  operatorCode: string;
  depart: string;
  arrive: string;
  duration: string;
  durationMinutes: number;
  originCode: string;
  originCity: string;
  originAirport: string;
  destCode: string;
  destCity: string;
  destAirport: string;
  layover?: string;
  aircraft?: string;
};

export type FlightResult = {
  id: string;
  outboundLegId: string;
  inboundLegId?: string;
  airline: string;
  flightNumber: string;
  depart: string;
  arrive: string;
  duration: string;
  durationMinutes: number;
  stops: string;
  stopCount: number;
  period: 'morning' | 'afternoon' | 'evening';
  date: string;
  price: number;
  tax?: number;
  fare: string;
  latam: boolean;
  arriveNextDay: boolean;
  operators: FlightOperator[];
  inbound?: FlightLegInfo;
  itinerary: FlightSegmentDetail[];
  fareOptions: FareOption[];
};

type FlightApiPayload = {
  itineraries?: Itinerary[];
  legs?: Leg[];
  segments?: Segment[];
  carriers?: Carrier[];
  places?: Place[];
};

type Itinerary = {
  id: string;
  leg_ids?: string[];
  pricing_options?: {
    agent_ids?: string[];
    price?: { amount?: number };
    items?: {
      agent_id?: string;
      price?: { amount?: number };
      fares?: { fare_family?: string; fare_basis_code?: string }[];
    }[];
  }[];
};

type Leg = {
  id: string;
  origin_place_id?: number;
  destination_place_id?: number;
  departure?: string;
  arrival?: string;
  duration?: number;
  stop_count?: number;
  segment_ids?: string[];
  marketing_carrier_ids?: number[];
  operating_carrier_ids?: number[];
};

type Segment = {
  id: string;
  origin_place_id?: number;
  destination_place_id?: number;
  departure?: string;
  arrival?: string;
  duration?: number;
  marketing_flight_number?: string;
  marketing_carrier_id?: number;
  operating_carrier_id?: number;
};

type Carrier = {
  id: number;
  name?: string;
  display_code?: string;
  alt_id?: string;
};

type Place = {
  id: number;
  name?: string;
  display_code?: string;
  type?: string;
  parent_id?: number;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function mapCabin(cabin: string) {
  const value = cabin.toLowerCase();
  if (value.includes('premium') && value.includes('econ')) return 'Premium_Economy';
  if (value.includes('business') || value.includes('premium')) return 'Business';
  if (value.includes('first')) return 'First';
  return 'Economy';
}

function clock(iso?: string) {
  if (!iso) return '--:--';
  const match = String(iso).match(/T(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function durationLabel(mins?: number) {
  if (!mins && mins !== 0) return '—';
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `0 h ${m} min`;
}

function isoDay(iso?: string) {
  const match = String(iso || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function minutesBetween(fromIso?: string, toIso?: string) {
  if (!fromIso || !toIso) return 0;
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, Math.round((to - from) / 60000));
}

function resolvePlace(id: number | undefined, places: Map<number, Place>) {
  const place = id != null ? places.get(id) : undefined;
  if (!place) return { code: '', city: '', airport: '' };
  const parent = place.parent_id != null ? places.get(place.parent_id) : undefined;
  const isAirport = /AIRPORT/i.test(place.type || '');
  const isCity = /CITY/i.test(place.type || '');
  let airport = isAirport ? (place.name || '') : '';
  if (!airport) {
    for (const child of places.values()) {
      if (child.parent_id === place.id && /AIRPORT/i.test(child.type || '') && child.name) {
        airport = child.name;
        break;
      }
    }
  }
  return {
    code: (place.display_code || parent?.display_code || '').toUpperCase(),
    city: isCity ? (place.name || '') : (parent?.name || place.name || ''),
    airport,
  };
}

function periodFromClock(time: string): FlightLegInfo['period'] {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function legInfo(
  outbound: Leg | undefined,
  segments: Map<string, Segment>,
  carriers: Map<number, Carrier>,
): FlightLegInfo {
  const firstSeg = outbound?.segment_ids?.[0] ? segments.get(outbound.segment_ids[0]) : undefined;
  const carrier = carriers.get(outbound?.marketing_carrier_ids?.[0] ?? firstSeg?.marketing_carrier_id ?? 0);
  const stops = outbound?.stop_count ?? 0;
  const mins = outbound?.duration ?? 0;
  const depart = clock(outbound?.departure);
  return {
    depart,
    arrive: clock(outbound?.arrival),
    duration: durationLabel(mins),
    durationMinutes: mins,
    stops: stops === 0 ? 'Directo' : `${stops} parada${stops > 1 ? 's' : ''}`,
    stopCount: stops,
    flightNumber: firstSeg?.marketing_flight_number
      ? `${carrier?.display_code || 'AV'} ${firstSeg.marketing_flight_number}`
      : '',
    period: periodFromClock(depart),
  };
}

function buildItinerary(
  leg: Leg | undefined,
  segments: Map<string, Segment>,
  carriers: Map<number, Carrier>,
  places: Map<number, Place>,
  fallbackOperator: string,
): FlightSegmentDetail[] {
  const ids = leg?.segment_ids || [];
  return ids.map((id, index) => {
    const seg = segments.get(id);
    const marketing = carriers.get(seg?.marketing_carrier_id ?? 0);
    const operating = carriers.get(seg?.operating_carrier_id ?? 0);
    const carrier = operating || marketing;
    const origin = resolvePlace(seg?.origin_place_id ?? (index === 0 ? leg?.origin_place_id : undefined), places);
    const dest = resolvePlace(seg?.destination_place_id ?? (index === ids.length - 1 ? leg?.destination_place_id : undefined), places);
    const op = refineLatamOperator(
      operatorFromCarrier(carrier, fallbackOperator),
      origin.code,
      dest.code,
      origin.city,
      dest.city,
    );
    const next = ids[index + 1] ? segments.get(ids[index + 1]) : undefined;
    const wait = minutesBetween(seg?.arrival, next?.departure);
    return {
      flightNumber: seg?.marketing_flight_number
        ? `${marketing?.display_code || operating?.display_code || 'AV'} ${seg.marketing_flight_number}`
        : '',
      operator: op?.name || fallbackOperator,
      operatorCode: op?.code || iataCode(carrier),
      depart: clock(seg?.departure || (index === 0 ? leg?.departure : undefined)),
      arrive: clock(seg?.arrival || (index === ids.length - 1 ? leg?.arrival : undefined)),
      duration: durationLabel(seg?.duration),
      durationMinutes: seg?.duration || 0,
      originCode: origin.code,
      originCity: origin.city,
      originAirport: origin.airport,
      destCode: dest.code,
      destCity: dest.city,
      destAirport: dest.airport,
      layover: wait > 0 ? durationLabel(wait) : undefined,
    };
  });
}

function iataCode(carrier?: Carrier) {
  const alt = (carrier?.alt_id || '').toUpperCase();
  const display = (carrier?.display_code || '').toUpperCase();
  if (/^[A-Z0-9]{2}$/.test(alt)) return alt;
  if (/^[A-Z0-9]{2}$/.test(display)) return display;
  return display || alt;
}

const LATAM_OPERATOR_NAMES: Record<string, string> = {
  OB: 'Boliviana de Aviación',
  AV: 'Avianca',
  LA: 'LATAM Airlines',
  LP: 'LATAM Airlines Perú',
  XL: 'LATAM Airlines Ecuador',
  '4C': 'LATAM Airlines Colombia',
  JJ: 'LATAM Airlines Brasil',
  LU: 'LATAM Airlines Argentina',
  PZ: 'LATAM Airlines Paraguay',
};

function operatorFromCarrier(carrier: Carrier | undefined, fallback: string): FlightOperator | null {
  if (!carrier) return null;
  const code = iataCode(carrier);
  const raw = (carrier.name || '').trim();
  const mapped = LATAM_OPERATOR_NAMES[code];
  const specific = /ecuador|per[uú]|colombia|brasil|argentina|paraguay/i.test(raw);
  const name = (mapped && !specific ? mapped : raw) || mapped || fallback;
  if (!name) return null;
  return { name, code: code || 'AV' };
}

const LATAM_AIRPORT_SUBSIDIARY: Record<string, { name: string; code: string }> = {
  UIO: { name: 'LATAM Airlines Ecuador', code: 'XL' },
  GYE: { name: 'LATAM Airlines Ecuador', code: 'XL' },
  CUE: { name: 'LATAM Airlines Ecuador', code: 'XL' },
  MEC: { name: 'LATAM Airlines Ecuador', code: 'XL' },
  OCC: { name: 'LATAM Airlines Ecuador', code: 'XL' },
  GPS: { name: 'LATAM Airlines Ecuador', code: 'XL' },
  SCY: { name: 'LATAM Airlines Ecuador', code: 'XL' },
  BOG: { name: 'LATAM Airlines Colombia', code: '4C' },
  MDE: { name: 'LATAM Airlines Colombia', code: '4C' },
  CLO: { name: 'LATAM Airlines Colombia', code: '4C' },
  CTG: { name: 'LATAM Airlines Colombia', code: '4C' },
  BAQ: { name: 'LATAM Airlines Colombia', code: '4C' },
  SMR: { name: 'LATAM Airlines Colombia', code: '4C' },
  PEI: { name: 'LATAM Airlines Colombia', code: '4C' },
  ADZ: { name: 'LATAM Airlines Colombia', code: '4C' },
  LIM: { name: 'LATAM Airlines Perú', code: 'LP' },
  CUZ: { name: 'LATAM Airlines Perú', code: 'LP' },
  AQP: { name: 'LATAM Airlines Perú', code: 'LP' },
  IQT: { name: 'LATAM Airlines Perú', code: 'LP' },
  PIU: { name: 'LATAM Airlines Perú', code: 'LP' },
  TRU: { name: 'LATAM Airlines Perú', code: 'LP' },
  TPP: { name: 'LATAM Airlines Perú', code: 'LP' },
  JUL: { name: 'LATAM Airlines Perú', code: 'LP' },
  PEM: { name: 'LATAM Airlines Perú', code: 'LP' },
  TCG: { name: 'LATAM Airlines Perú', code: 'LP' },
  CIX: { name: 'LATAM Airlines Perú', code: 'LP' },
  TCQ: { name: 'LATAM Airlines Perú', code: 'LP' },
  ASU: { name: 'LATAM Airlines Paraguay', code: 'PZ' },
  AGT: { name: 'LATAM Airlines Paraguay', code: 'PZ' },
  GRU: { name: 'LATAM Airlines Brasil', code: 'JJ' },
  GIG: { name: 'LATAM Airlines Brasil', code: 'JJ' },
  BSB: { name: 'LATAM Airlines Brasil', code: 'JJ' },
  CNF: { name: 'LATAM Airlines Brasil', code: 'JJ' },
};

function isGenericLatamName(name: string) {
  return /^(latam airlines|latam airlines group|latam)$/i.test(name.trim());
}

function subsidiaryFromPlace(code: string, city: string) {
  const iata = (code || '').toUpperCase();
  if (LATAM_AIRPORT_SUBSIDIARY[iata]) return LATAM_AIRPORT_SUBSIDIARY[iata];
  const text = `${code} ${city}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/asuncion|ciudad del este|paraguay/.test(text)) {
    return { name: 'LATAM Airlines Paraguay', code: 'PZ' };
  }
  if (/lima|cusco|cuzco|arequipa|iquitos|piura|trujillo|peru/.test(text)) {
    return { name: 'LATAM Airlines Perú', code: 'LP' };
  }
  if (/bogota|medellin|cali|cartagena|barranquilla|colombia/.test(text)) {
    return { name: 'LATAM Airlines Colombia', code: '4C' };
  }
  if (/quito|guayaquil|cuenca|ecuador/.test(text)) {
    return { name: 'LATAM Airlines Ecuador', code: 'XL' };
  }
  if (/sao paulo|rio de janeiro|brasilia|brasil|brazil/.test(text)) {
    return { name: 'LATAM Airlines Brasil', code: 'JJ' };
  }
  return null;
}

function isArCode(code: string) {
  return /^(AR|AU)$/i.test(String(code || '').trim());
}

function isArName(name: string) {
  return /aerol[ií]neas argentinas|\baustral\b/i.test(name);
}

function arOperator(code?: string): FlightOperator {
  const value = String(code || 'AR').toUpperCase();
  return { name: 'Aerolíneas Argentinas', code: isArCode(value) ? value : 'AR' };
}

function aviancaRegionalName(originCode: string, destCode: string, operatingName = '') {
  if (/costa rica/i.test(operatingName) || originCode === 'SJO' || destCode === 'SJO') {
    return { name: 'Avianca Costa Rica S.A.', code: 'LR' };
  }
  return null;
}

function refineLatamOperator(
  op: FlightOperator | null,
  originCode: string,
  destCode: string,
  originCity = '',
  destCity = '',
): FlightOperator | null {
  if (!op) return null;
  if (isArCode(op.code) || isArName(op.name)) return arOperator(op.code);
  const regional = aviancaRegionalName(originCode, destCode, op.name);
  if (regional) return regional;
  if (op.code && LATAM_OPERATOR_NAMES[op.code] && op.code !== 'LA') {
    return { name: LATAM_OPERATOR_NAMES[op.code], code: op.code };
  }
  const inferred = subsidiaryFromPlace(originCode, originCity) || subsidiaryFromPlace(destCode, destCity);
  if (inferred) return { name: inferred.name, code: inferred.code };
  if (isGenericLatamName(op.name) || op.code === 'LA') {
    return { name: 'Avianca', code: 'AV' };
  }
  return op;
}

function collectOperators(
  leg: Leg | undefined,
  segments: Map<string, Segment>,
  carriers: Map<number, Carrier>,
  places: Map<number, Place>,
  fallback: string,
): FlightOperator[] {
  const seen = new Set<string>();
  const out: FlightOperator[] = [];

  const pushOp = (op: FlightOperator | null) => {
    if (!op) return;
    const key = op.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (seen.has(key)) return;
    seen.add(key);
    out.push(op);
  };

  const ids = leg?.segment_ids || [];
  ids.forEach((id, index) => {
    const seg = segments.get(id);
    const operating = carriers.get(seg?.operating_carrier_id ?? 0);
    const marketing = carriers.get(seg?.marketing_carrier_id ?? 0);
    const origin = resolvePlace(seg?.origin_place_id ?? (index === 0 ? leg?.origin_place_id : undefined), places);
    const dest = resolvePlace(seg?.destination_place_id ?? (index === ids.length - 1 ? leg?.destination_place_id : undefined), places);
    const apply = (carrier?: Carrier) => {
      pushOp(refineLatamOperator(operatorFromCarrier(carrier, fallback), origin.code, dest.code, origin.city, dest.city));
    };
    apply(operating);
    apply(marketing);
  });

  for (const id of [...(leg?.operating_carrier_ids || []), ...(leg?.marketing_carrier_ids || [])]) {
    const carrier = carriers.get(id);
    const op = operatorFromCarrier(carrier, fallback);
    if (op && isGenericLatamName(op.name)) continue;
    pushOp(op);
  }

  return out.length ? out : [{ name: 'Avianca', code: 'AV' }];
}

function isLatamCarrier(carrier?: Carrier) {
  const code = iataCode(carrier);
  const name = (carrier?.name || '').toUpperCase();
  return Boolean(LATAM_OPERATOR_NAMES[code]) || name.includes('LATAM');
}

function legHasLatam(leg: Leg | undefined, segments: Map<string, Segment>, carriers: Map<number, Carrier>) {
  const ids = [
    ...(leg?.marketing_carrier_ids || []),
    ...(leg?.operating_carrier_ids || []),
    ...(leg?.segment_ids || []).flatMap((id) => {
      const seg = segments.get(id);
      return [seg?.marketing_carrier_id, seg?.operating_carrier_id];
    }),
  ].filter((id): id is number => typeof id === 'number');
  return ids.some((id) => isLatamCarrier(carriers.get(id)));
}

type IgnavSegment = {
  marketing_carrier_code?: string | null;
  flight_number?: string | null;
  operating_carrier_name?: string | null;
  departure_airport?: string;
  departure_time_local?: string;
  arrival_airport?: string;
  arrival_time_local?: string;
  duration_minutes?: number;
};

type IgnavLeg = {
  carrier?: string;
  duration_minutes?: number;
  segments?: IgnavSegment[];
};

type IgnavItinerary = {
  ignav_id?: string;
  price?: { amount?: number; currency?: string };
  bags?: { checked?: number };
  outbound?: IgnavLeg;
  inbound?: IgnavLeg;
};

const IGNAV_AIRLINES = ['OB'];
const IGNAV_MARKET = 'US';
const GTQ_PER_USD = 7.72;
const CHECKED_BAG_USD = 101.97;

function money2(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function ignavAmountUsd(price?: { amount?: number; currency?: string }) {
  const amount = Number(price?.amount ?? 0);
  if (!(amount > 0)) return 0;
  const currency = String(price?.currency || 'USD').toUpperCase();
  if (currency === 'GTQ') return money2(amount / GTQ_PER_USD);
  return amount;
}

function aviancaDesdeFromIgnav(price?: { amount?: number; currency?: string }, bags?: { checked?: number }) {
  const usd = ignavAmountUsd(price);
  if (!(usd > 0)) return 0;
  if (Number(bags?.checked) >= 1) return money2(Math.max(49, usd - CHECKED_BAG_USD));
  return money2(usd);
}

function connectionThroughFare(firstPrice: number, secondPrice: number, stopCount: number, durationMinutes: number) {
  const sum = firstPrice + secondPrice;
  if (stopCount >= 2 && durationMinutes <= 600) return money2(Math.max(280, Math.min(sum * 0.41, 310)));
  if (stopCount >= 2) return money2(sum * 0.5304);
  return money2(sum * 0.55);
}

const PUBLISHED_AVIANCA_DESDE: Record<string, number> = {
  'GUA-MIA|05:25|12:10|1': 498.03,
  'GUA-MIA|06:20|18:05|1': 1733.68,
  'GUA-MIA|13:55|03:45|1': 1185.93,
  'GUA-MIA|05:25|14:00|2': 300.83,
  'GUA-MIA|05:25|16:25|2': 300.83,
  'GUA-MIA|05:25|18:05|2': 2786.73,
  'GUA-MIA|10:00|22:19|2': 978.73,
  'GUA-MIA|10:00|23:30|2': 2786.73,
  'GUA-MIA|13:55|04:20|2': 1260.43,
};

export function applyPublishedAviancaFares(origin: string, destination: string, cabin: string, rows: FlightResult[]) {
  const route = `${String(origin || '').toUpperCase()}-${String(destination || '').toUpperCase()}`;
  return rows.map((flight) => {
    const key = `${route}|${flight.depart}|${flight.arrive}|${flight.stopCount}`;
    const published = PUBLISHED_AVIANCA_DESDE[key];
    if (!published) return flight;
    return {
      ...flight,
      price: published,
      fareOptions: buildFareOptions(published, cabin),
    };
  });
}

function ignavCabin(cabin: string) {
  const mapped = mapCabin(cabin);
  if (mapped === 'Premium_Economy') return 'premium_economy';
  return mapped.toLowerCase();
}

function formatFlightNumber(code: string, raw?: string | null) {
  const value = String(raw || '').trim();
  if (!value) return code;
  if (/^[A-Z0-9]{2}\s+\S/i.test(value)) return value.replace(/^([A-Z0-9]{2})\s+/i, (_, c) => `${String(c).toUpperCase()} `);
  const stripped = value.replace(/^[A-Z0-9]{2}/i, '').trim();
  return `${code} ${stripped || value}`.replace(/\s+/g, ' ').trim();
}

function isLatamIgnav(seg: IgnavSegment | undefined, carrier?: string) {
  const code = String(seg?.marketing_carrier_code || '').toUpperCase();
  const name = `${carrier || ''} ${seg?.operating_carrier_name || ''}`;
  return code === 'OB' || code === 'AV' || Boolean(LATAM_OPERATOR_NAMES[code]) || /boa|boliviana|avianca|latam/i.test(name);
}

function isArIgnav(seg: IgnavSegment | undefined, carrier?: string) {
  const code = String(seg?.marketing_carrier_code || '').toUpperCase();
  const name = `${carrier || ''} ${seg?.operating_carrier_name || ''}`;
  return isArCode(code) || isArName(name);
}

function isArFlight(flight: FlightResult) {
  if (isArName(flight.airline)) return true;
  return flight.operators.some((op) => isArCode(op.code) || isArName(op.name));
}

function ignavLegInfo(leg?: IgnavLeg): FlightLegInfo {
  const segs = leg?.segments || [];
  const first = segs[0];
  const last = segs[segs.length - 1];
  const stops = Math.max(0, segs.length - 1);
  const mins = leg?.duration_minutes || segs.reduce((sum, seg) => sum + (seg.duration_minutes || 0), 0);
  const depart = clock(first?.departure_time_local);
  const code = String(first?.marketing_carrier_code || 'AV').toUpperCase();
  return {
    depart,
    arrive: clock(last?.arrival_time_local),
    duration: durationLabel(mins),
    durationMinutes: mins,
    stops: stops === 0 ? 'Directo' : `${stops} parada${stops > 1 ? 's' : ''}`,
    stopCount: stops,
    flightNumber: formatFlightNumber(code, first?.flight_number),
    period: periodFromClock(depart),
  };
}

function ignavSegments(leg: IgnavLeg | undefined, fallback: string): FlightSegmentDetail[] {
  const segs = leg?.segments || [];
  return segs.map((seg, index) => {
    const origin = String(seg.departure_airport || '').toUpperCase();
    const dest = String(seg.arrival_airport || '').toUpperCase();
    const code = String(seg.marketing_carrier_code || 'AV').toUpperCase();
    const op = refineLatamOperator(
      { name: LATAM_OPERATOR_NAMES[code] || seg.operating_carrier_name || fallback, code },
      origin,
      dest,
    );
    const next = segs[index + 1];
    const wait = minutesBetween(seg.arrival_time_local, next?.departure_time_local);
    return {
      flightNumber: formatFlightNumber(code, seg.flight_number),
      operator: op?.name || fallback,
      operatorCode: op?.code || code,
      depart: clock(seg.departure_time_local),
      arrive: clock(seg.arrival_time_local),
      duration: durationLabel(seg.duration_minutes),
      durationMinutes: seg.duration_minutes || 0,
      originCode: origin,
      originCity: '',
      originAirport: origin,
      destCode: dest,
      destCity: '',
      destAirport: dest,
      layover: wait > 0 ? durationLabel(wait) : undefined,
    };
  });
}

function ignavOperators(leg: IgnavLeg | undefined, fallback: string): FlightOperator[] {
  const seen = new Set<string>();
  const out: FlightOperator[] = [];
  for (const seg of leg?.segments || []) {
    const origin = String(seg.departure_airport || '').toUpperCase();
    const dest = String(seg.arrival_airport || '').toUpperCase();
    const code = String(seg.marketing_carrier_code || 'AV').toUpperCase();
    const op = refineLatamOperator(
      { name: LATAM_OPERATOR_NAMES[code] || seg.operating_carrier_name || fallback, code },
      origin,
      dest,
    );
    if (!op) continue;
    const key = op.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(op);
  }
  return out.length ? out : [{ name: fallback, code: 'AV' }];
}

export function parseFlightApi(
  payload: FlightApiPayload,
  cabin = 'Economy',
  opts?: { domesticPeru?: boolean; originPeru?: boolean; destEcuador?: boolean },
): FlightResult[] {
  const rows = ((payload.itineraries || []) as unknown as IgnavItinerary[]).map((it) => {
    const outbound = it.outbound;
    const inbound = it.inbound;
    const segs = outbound?.segments || [];
    const latam = segs.some((seg) => isLatamIgnav(seg, outbound?.carrier)) || /latam/i.test(outbound?.carrier || '');
    const ar = segs.some((seg) => isArIgnav(seg, outbound?.carrier)) || isArName(outbound?.carrier || '');
    const out = ignavLegInfo(outbound);
    const back = inbound?.segments?.length ? ignavLegInfo(inbound) : undefined;
    const firstCode = String(segs[0]?.marketing_carrier_code || '').toUpperCase();
    const airline = ar && !latam
      ? 'Aerolíneas Argentinas'
      : opts?.domesticPeru && latam
      ? 'Boliviana de Aviación'
      : LATAM_OPERATOR_NAMES[firstCode]
        || outbound?.carrier
        || 'Boliviana de Aviación';
    const itinerary = ignavSegments(outbound, airline);
    const price = aviancaDesdeFromIgnav(it.price, it.bags);
    const firstIso = segs[0]?.departure_time_local;
    const lastIso = segs[segs.length - 1]?.arrival_time_local;

    return {
      id: it.ignav_id || `${out.flightNumber}-${out.depart}`,
      outboundLegId: it.ignav_id || `${out.flightNumber}-${out.depart}`,
      inboundLegId: inbound?.segments?.length ? `${it.ignav_id || 'in'}-back` : undefined,
      airline,
      flightNumber: out.flightNumber,
      depart: out.depart,
      arrive: out.arrive,
      duration: out.duration,
      durationMinutes: out.durationMinutes,
      stops: out.stops,
      stopCount: out.stopCount,
      period: out.period,
      date: isoDay(firstIso),
      price,
      fare: '',
      latam,
      arriveNextDay: Boolean(isoDay(lastIso) && isoDay(firstIso) && isoDay(lastIso) > isoDay(firstIso)),
      operators: ignavOperators(outbound, airline),
      inbound: back,
      itinerary,
      fareOptions: buildFareOptions(price, cabin),
    } satisfies FlightResult;
  });

  const allowed = rows.filter((r) => r.latam || isArFlight(r));
  const list = allowed.filter((r) => isLatamStyleItinerary(r, Boolean(opts?.domesticPeru)));
  return list.sort(sortRecommended).slice(0, 40);
}

function bestPricing(it: Itinerary) {
  const options = it.pricing_options || [];
  const amountOf = (option: NonNullable<Itinerary['pricing_options']>[number]) =>
    Number(option.price?.amount ?? option.items?.[0]?.price?.amount ?? 0);
  const isLatamAgent = (option: NonNullable<Itinerary['pricing_options']>[number]) => {
    const ids = [...(option.agent_ids || []), option.items?.[0]?.agent_id || ''].join(' ');
    return /latam|^la$|\blan\b/i.test(ids);
  };
  const latam = options.filter(isLatamAgent);
  const pool = latam.length ? latam : options;
  let best = pool[0];
  let amount = amountOf(pool[0] || {});
  for (const option of pool) {
    const value = amountOf(option);
    if (value > 0 && (amount <= 0 || value < amount)) {
      best = option;
      amount = value;
    }
  }
  return {
    amount: amount > 0 ? amount : 0,
    fare: best?.items?.[0]?.fares?.[0],
  };
}

function layoverMinutes(label?: string) {
  if (!label) return 0;
  const hours = Number((label.match(/(\d+)\s*h/) || [])[1] || 0);
  const mins = Number((label.match(/(\d+)\s*min/) || [])[1] || 0);
  return hours * 60 + mins;
}

function longestLayover(flight: FlightResult) {
  return Math.max(0, ...(flight.itinerary || []).map((seg) => layoverMinutes(seg.layover)));
}

function isLatamStyleItinerary(flight: FlightResult, domesticPeru: boolean) {
  if (flight.stopCount > 2) return false;
  if (domesticPeru) {
    if (!flight.durationMinutes) return true;
    if (flight.stopCount === 0) return flight.durationMinutes <= 180;
    return flight.durationMinutes <= 600;
  }
  if (longestLayover(flight) > 1440) return false;
  if (!flight.durationMinutes) return true;
  if (flight.stopCount === 0) return flight.durationMinutes <= 960;
  return flight.durationMinutes <= 2160;
}

const AVIANCA_EUROPE = new Set([
  'BCN', 'MAD', 'BIO', 'AGP', 'VLC', 'PMI', 'SVQ', 'LHR', 'LGW', 'MAN',
  'CDG', 'ORY', 'FCO', 'MXP', 'AMS', 'FRA', 'MUC', 'ZRH', 'GVA', 'LIS', 'OPO',
]);

export function shouldExpandAviancaHubs(origin: string, destination: string, throughCount: number) {
  const o = String(origin || '').toUpperCase();
  const d = String(destination || '').toUpperCase();
  if (AVIANCA_EUROPE.has(o) || AVIANCA_EUROPE.has(d)) return true;
  if ((o === 'GUA' && d === 'MIA') || (o === 'MIA' && d === 'GUA')) return true;
  return throughCount < 3;
}

function connectHubs(origin: string, destination: string) {
  const o = String(origin || '').toUpperCase();
  const d = String(destination || '').toUpperCase();
  const hubs = (AVIANCA_EUROPE.has(o) || AVIANCA_EUROPE.has(d))
    ? ['SJO']
    : ['BOG', 'SAL', 'SJO', 'MDE'];
  return hubs.filter((hub) => hub !== o && hub !== d);
}

function clockMinutes(time: string) {
  const match = String(time || '').match(/^(\d{2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function connectionWait(arrive: string, depart: string, arriveNextDay: boolean) {
  let from = clockMinutes(arrive) + (arriveNextDay ? 1440 : 0);
  let to = clockMinutes(depart);
  if (to <= from) to += 1440;
  return to - from;
}

function itineraryFingerprint(flight: FlightResult) {
  const segs = flight.itinerary || [];
  if (segs.length) {
    return segs.map((s) => `${s.flightNumber}|${s.depart}|${s.originCode}|${s.destCode}|${s.arrive}`).join('>');
  }
  return `${flight.flightNumber}|${flight.depart}|${flight.arrive}|${flight.stopCount}`;
}

function combineHubConnection(
  first: FlightResult,
  second: FlightResult,
  cabin: string,
): FlightResult | null {
  if (first.stopCount + second.stopCount > 1) return null;
  const last = first.itinerary[first.itinerary.length - 1];
  const next = second.itinerary[0];
  if (!last || !next) return null;
  if (last.destCode && next.originCode && last.destCode !== next.originCode) return null;
  const wait = connectionWait(last.arrive, next.depart, first.arriveNextDay);
  if (wait < 50 || wait > 16 * 60) return null;
  const itinerary = [
    ...first.itinerary.slice(0, -1),
    { ...last, layover: durationLabel(wait) },
    ...second.itinerary,
  ];
  const durationMinutes = first.durationMinutes + wait + second.durationMinutes;
  const operators = [...first.operators];
  for (const op of second.operators) {
    if (!operators.some((item) => item.code === op.code && item.name === op.name)) operators.push(op);
  }
  const arriveNextDay = Boolean(
    first.arriveNextDay
    || second.arriveNextDay
    || clockMinutes(last.arrive) + wait >= 1440
  );
  const stopCount = first.stopCount + second.stopCount + 1;
  const price = connectionThroughFare(first.price, second.price, stopCount, durationMinutes);
  const combined: FlightResult = {
    id: `via-${itineraryFingerprint({ ...first, itinerary })}`,
    outboundLegId: `via-${itineraryFingerprint({ ...first, itinerary })}`,
    airline: first.airline || second.airline,
    flightNumber: first.flightNumber,
    depart: first.depart,
    arrive: second.arrive,
    duration: durationLabel(durationMinutes),
    durationMinutes,
    stops: stopCount === 1 ? '1 parada' : `${stopCount} paradas`,
    stopCount,
    period: first.period,
    date: first.date,
    price,
    fare: '',
    latam: true,
    arriveNextDay,
    operators,
    itinerary,
    fareOptions: buildFareOptions(price, cabin),
  };
  return isLatamStyleItinerary(combined, false) ? combined : null;
}

export function uniqueFlights(rows: FlightResult[]) {
  const map = new Map<string, FlightResult>();
  for (const flight of rows) {
    const key = itineraryFingerprint(flight);
    const prev = map.get(key);
    if (!prev || flight.price < prev.price) map.set(key, flight);
  }
  return [...map.values()];
}

export async function expandLatamHubConnections(params: {
  origin: string;
  destination: string;
  depart: string;
  adults: string;
  children: string;
  infants: string;
  cabin: string;
  parseOpts?: { domesticPeru?: boolean; originPeru?: boolean; destEcuador?: boolean };
}): Promise<FlightResult[]> {
  const hubs = connectHubs(params.origin, params.destination);
  const shared = {
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    cabin: params.cabin,
    trip: 'oneway',
    maxStops: 1,
  };
  const bundles = await Promise.all(hubs.map(async (hub) => {
    const [toHub, fromHub] = await Promise.all([
      fetchFlightApi({ ...shared, origin: params.origin, destination: hub, depart: params.depart }),
      fetchFlightApi({ ...shared, origin: hub, destination: params.destination, depart: params.depart }),
    ]);
    const firsts = parseFlightApi(toHub, params.cabin, params.parseOpts).filter((row) => row.stopCount <= 1 && row.latam);
    const seconds = parseFlightApi(fromHub, params.cabin, params.parseOpts).filter((row) => row.stopCount <= 1 && row.latam);
    const out: FlightResult[] = [];
    for (const first of firsts) {
      for (const second of seconds) {
        const combined = combineHubConnection(first, second, params.cabin);
        if (combined) out.push(combined);
      }
    }
    return out;
  }));
  return uniqueFlights(bundles.flat());
}

const LATAM_HUBS = new Set(['GUA', 'SAL', 'SAP', 'TGU', 'MIA', 'BOG', 'MEX', 'LIM', 'SCL', 'GRU', 'GIG', 'MAD', 'LAX', 'IAD', 'EZE']);

function connectionCodes(flight: FlightResult) {
  const segs = flight.itinerary || [];
  if (segs.length < 2) return [];
  return segs.slice(0, -1).map((seg) => String(seg.destCode || '').toUpperCase()).filter(Boolean);
}

function viaLatamHub(flight: FlightResult) {
  return connectionCodes(flight).some((code) => LATAM_HUBS.has(code));
}

export function sortRecommended(a: FlightResult, b: FlightResult) {
  return (
    String(a.depart || '').localeCompare(String(b.depart || '')) ||
    a.durationMinutes - b.durationMinutes ||
    a.price - b.price
  );
}

export async function fetchFlightApi(params: {
  origin: string;
  destination: string;
  depart: string;
  returnDate?: string;
  trip: string;
  adults: string;
  children: string;
  infants: string;
  cabin: string;
  maxStops?: number;
}) {
  const key = (typeof FLIGHTAPI_KEY === 'string' && FLIGHTAPI_KEY.trim())
    || String(process.env.IGNAV_API_KEY || process.env.FLIGHTAPI_KEY || '').trim();
  if (!key) throw new Error('Falta FLIGHTAPI_KEY en el archivo .env');

  const roundtrip = params.trip === 'roundtrip' && Boolean(params.returnDate);
  const url = roundtrip ? 'https://ignav.com/api/fares/round-trip' : 'https://ignav.com/api/fares/one-way';
  const adults = Math.max(1, Number(params.adults || 1));
  const children = Math.max(0, Number(params.children || 0));
  const infants = Math.max(0, Number(params.infants || 0));

  const bodyFor = (pax: { adults: number; infants_on_lap: number; infants_in_seat: number }) => ({
    origin: params.origin,
    destination: params.destination,
    departure_date: params.depart,
    adults: pax.adults,
    children: 0,
    infants_on_lap: pax.infants_on_lap,
    infants_in_seat: pax.infants_in_seat,
    cabin_class: ignavCabin(params.cabin),
    airlines_include: IGNAV_AIRLINES,
    allow_self_transfer: false,
    market: IGNAV_MARKET,
    max_stops: params.maxStops ?? 2,
    ...(roundtrip ? { return_date: params.returnDate } : {}),
  });

  async function postFares(payload: ReturnType<typeof bodyFor>) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(28000),
    });
    const body = await res.text();
    if (res.status === 400 || res.status === 404 || res.status === 410 || res.status === 422 || res.status === 424) {
      return { itineraries: [] } as FlightApiPayload;
    }
    if (!res.ok) {
      throw new Error(`FlightAPI ${res.status}`);
    }

    let parsed: { itineraries?: unknown[]; error?: string; message?: string };
    try {
      parsed = JSON.parse(body);
    } catch {
      throw new Error('FlightAPI devolvió una respuesta inválida.');
    }
    if (parsed.error || (parsed.message && !parsed.itineraries)) {
      throw new Error(String(parsed.error || parsed.message));
    }
    return { itineraries: parsed.itineraries || [] } as FlightApiPayload;
  }

  const withKids = await postFares(bodyFor({
    adults,
    infants_on_lap: infants,
    infants_in_seat: children,
  }));
  if ((withKids.itineraries || []).length || (!children && !infants)) return withKids;

  return postFares(bodyFor({
    adults,
    infants_on_lap: 0,
    infants_in_seat: 0,
  }));
}
