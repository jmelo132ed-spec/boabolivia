import { FLIGHTAPI_KEY } from 'astro:env/server';
import {
  siteConfig,
  discoverMenu,
  tripsMenu,
  headerLinks,
  currencies,
  cities,
  bookingTabs,
  cabins,
  loginInvite,
  promoBanner,
  serviceLinks,
  offers,
  offerCategories,
  hotels,
  campaigns,
  moreOptions,
  popularDestinations,
  passCta,
  experienceSlides,
  creditCard,
  footerColumns,
  socials,
  cookieBanner,
  type City,
} from '../data/mockData';
import { landingContent } from '../data/landing';
import { getTicketsUrl } from '../lib/geoRedirect';
import { buildFareOptions } from '../data/fareBrands';
import { fetchFlightApi, isoDate, parseFlightApi, sortRecommended, expandLatamHubConnections, uniqueFlights, applyPublishedAviancaFares, shouldExpandAviancaHubs, type FlightResult } from './flightApi';
import { searchBoaFlights, type BoaCalendarDay } from './boaAvailability';
import { buildFlightCodeResolver } from './flightCodes';

const USE_MOCK = import.meta.env.USE_MOCK !== 'false';
const flightCodes = buildFlightCodeResolver(cities);

export async function getLandingPageData() {
  if (USE_MOCK) {
    return {
      config: {
        ...siteConfig,
        title: landingContent.title,
        description: landingContent.description,
      },
      discoverMenu,
      tripsMenu,
      headerLinks,
      footerColumns,
      socials,
      cookieBanner,
      landing: landingContent,
      ticketsHref: getTicketsUrl(),
    };
  }

  const res = await fetch(`${import.meta.env.PUBLIC_API_URL}/landing`);
  if (!res.ok) throw new Error('Failed to fetch landing data');
  return res.json();
}

export async function getHomePageData() {
  if (USE_MOCK) {
    return {
      config: siteConfig,
      discoverMenu,
      tripsMenu,
      headerLinks,
      currencies,
      cities,
      bookingTabs,
      cabins,
      loginInvite,
      promoBanner,
      serviceLinks,
      offers,
      offerCategories,
      hotels,
      campaigns,
      moreOptions,
      popularDestinations,
      passCta,
      experienceSlides,
      creditCard,
      footerColumns,
      socials,
      cookieBanner,
    };
  }

  const res = await fetch(`${import.meta.env.PUBLIC_API_URL}/homepage`);
  if (!res.ok) throw new Error('Failed to fetch homepage data');
  return res.json();
}

function cityByCode(code: string): City {
  return cities.find((c) => c.code === code) ?? { code, city: code, country: '', airport: '' };
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

function isIsoDate(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isParaguay(country?: string) {
  return /guatemala/i.test(country || '');
}

function isEcuador(country?: string) {
  return /ecuador/i.test(country || '');
}

async function fetchResolvedFlights(params: {
  origin: string;
  destination: string;
  depart: string;
  adults: string;
  children: string;
  infants: string;
  cabin: string;
  domesticPeru: boolean;
  originPeru: boolean;
  destEcuador: boolean;
  trip?: string;
  returnDate?: string;
}) {
  const origin = flightCodes.resolve(params.origin)[0];
  const destination = flightCodes.resolve(params.destination)[0];
  const payload = await fetchFlightApi({
    origin,
    destination,
    depart: params.depart,
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    cabin: params.cabin,
    trip: 'oneway',
  }).catch(() => ({ itineraries: [] }));
  const results = parseFlightApi(payload, params.cabin, {
    domesticPeru: params.domesticPeru,
    originPeru: params.originPeru,
    destEcuador: params.destEcuador,
  });
  const extra = shouldExpandAviancaHubs(origin, destination, results.length)
    ? await expandLatamHubConnections({
      origin,
      destination,
      depart: params.depart,
      adults: params.adults,
      children: params.children,
      infants: params.infants,
      cabin: params.cabin,
      parseOpts: {
        domesticPeru: params.domesticPeru,
        originPeru: params.originPeru,
        destEcuador: params.destEcuador,
      },
    }).catch(() => [] as FlightResult[])
    : [];
  const combined = applyPublishedAviancaFares(
    origin,
    destination,
    params.cabin,
    uniqueFlights([...results, ...extra]).sort(sortRecommended).slice(0, 40),
  );
  return combined;
}

function mockFlight(
  id: string,
  flightNumber: string,
  depart: string,
  arrive: string,
  price: number,
  cabin: string,
): FlightResult {
  const hour = Number(depart.slice(0, 2));
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return {
    id,
    outboundLegId: id,
    airline: 'Boliviana de Aviación',
    flightNumber,
    depart,
    arrive,
    duration: '0 h 55 min',
    durationMinutes: 55,
    stops: 'Directo',
    stopCount: 0,
    period,
    date: '',
    price,
    fare: '',
    latam: true,
    arriveNextDay: false,
    operators: [{ name: 'Boliviana de Aviación', code: 'OB' }],
    itinerary: [{
      flightNumber,
      operator: 'Boliviana de Aviación',
      operatorCode: 'OB',
      depart,
      arrive,
      duration: '0 h 55 min',
      durationMinutes: 55,
      originCode: '',
      originCity: '',
      originAirport: '',
      destCode: '',
      destCity: '',
      destAirport: '',
    }],
    fareOptions: buildFareOptions(price, cabin),
  };
}

function mockResults(cabin: string): FlightResult[] {
  return [
    mockFlight('1', 'AV 2024', '06:15', '07:30', 64.14, cabin),
    mockFlight('2', 'AV 2028', '10:40', '11:55', 78.9, cabin),
    mockFlight('3', 'AV 2032', '16:20', '17:35', 92.5, cabin),
    mockFlight('4', 'AV 2036', '20:05', '21:20', 54.0, cabin),
  ];
}

export async function searchFlights(params: Record<string, string>) {
  const origin = (params.origin || '').toUpperCase();
  const destination = (params.destination || '').toUpperCase();
  const trip = params.trip || 'roundtrip';
  const cabin = params.cabin || 'Economy';
  const adults = params.adults || '1';
  const children = params.children || '0';
  const infants = params.infants || '0';
  const from = cityByCode(origin);
  const to = cityByCode(destination);
  const today = isoDate(new Date());
  let depart = isIsoDate(params.depart) ? params.depart : addDays(today, 14);
  if (depart < today) depart = today;
  let returnDate = isIsoDate(params.return)
    ? params.return
    : trip === 'oneway'
      ? undefined
      : addDays(depart, 7);
  if (returnDate && returnDate < depart) returnDate = addDays(depart, 7);

  const base = {
    from,
    to,
    trip,
    cabin,
    passengers: Number(adults),
    children: Number(children),
    infants: Number(infants),
    depart,
    returnDate,
  };

  const bound = params.bound === 'return' ? 'return' : 'outbound';
  const quoteOrigin = bound === 'return' ? destination : origin;
  const quoteDest = bound === 'return' ? origin : destination;
  const quoteDate = bound === 'return' ? (returnDate || depart) : depart;
  const emptyCalendar: BoaCalendarDay[] = [];

  try {
    const boa = await searchBoaFlights({
      origin: quoteOrigin,
      destination: quoteDest,
      depart: quoteDate,
      returnDate: bound === 'return' ? undefined : (trip === 'roundtrip' ? returnDate : undefined),
      adults,
      children,
      infants,
      cabin,
    });
    if (boa.results.length) {
      return {
        ...base,
        bound,
        source: 'boa' as const,
        results: boa.results,
        calendar: boa.calendar,
      };
    }
  } catch (err) {
    console.warn('[boa]', err instanceof Error ? err.message : err);
  }

  const key = (typeof FLIGHTAPI_KEY === 'string' && FLIGHTAPI_KEY.trim()) || String(process.env.FLIGHTAPI_KEY || '').trim();
  if (key) {
    try {
      const results = await fetchResolvedFlights({
        origin: quoteOrigin,
        destination: quoteDest,
        depart: quoteDate,
        adults,
        children,
        infants,
        cabin,
        domesticPeru: isParaguay(from.country) && isParaguay(to.country),
        originPeru: isParaguay(cityByCode(quoteOrigin).country),
        destEcuador: isEcuador(cityByCode(quoteDest).country),
        trip: bound === 'return' ? 'oneway' : trip,
        returnDate: bound === 'return' ? undefined : returnDate,
      });
      return {
        ...base,
        bound,
        source: 'flightapi' as const,
        results,
        calendar: emptyCalendar,
      };
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'No se pudieron consultar las tarifas.';
      const message = /<\s*!doctype|FlightAPI \d{3}/i.test(raw)
        ? 'Tuvimos un problema con los resultados. Inténtalo nuevamente.'
        : raw;
      return { ...base, bound, source: 'flightapi' as const, results: [] as FlightResult[], calendar: emptyCalendar, error: message };
    }
  }

  if (USE_MOCK) {
    return { ...base, bound, source: 'mock' as const, results: mockResults(cabin), calendar: emptyCalendar };
  }

  const qs = new URLSearchParams(params);
  const res = await fetch(`${import.meta.env.PUBLIC_API_URL}/flights?${qs}`);
  if (!res.ok) throw new Error('Failed to search flights');
  return res.json();
}

export { cities };
