export type AviancaOfferCard = {
  code: string;
  city: string;
  price: number;
  image: string;
  featured?: boolean;
};

export const aviancaOfferCards: AviancaOfferCard[] = [
  { code: 'MIA', city: 'Miami', price: 552, image: '/images/avianca/mia.jpg', featured: true },
  { code: 'WAS', city: 'Washington', price: 703, image: '/images/avianca/was.jpg', featured: true },
  { code: 'FRS', city: 'Flores, Guatemala', price: 124, image: '/images/avianca/flores.jpg', featured: true },
  { code: 'DFW', city: 'Dallas', price: 204, image: '/images/avianca/dfw.jpg' },
  { code: 'MGA', city: 'Managua', price: 279, image: '/images/avianca/mga.jpg' },
  { code: 'CUN', city: 'Cancún', price: 287, image: '/images/avianca/cun.jpg' },
  { code: 'MEX', city: 'Ciudad de México', price: 292, image: '/images/avianca/mex.jpg' },
  { code: 'MCO', city: 'Orlando', price: 310, image: '/images/avianca/mco.jpg' },
  { code: 'PTY', city: 'Ciudad de Panamá', price: 327, image: '/images/avianca/pty.jpg' },
  { code: 'CTG', city: 'Cartagena', price: 330, image: '/images/avianca/ctg.jpg' },
  { code: 'SJO', city: 'San José, Costa Rica', price: 360, image: '/images/avianca/sjo.jpg' },
  { code: 'SAL', city: 'San Salvador', price: 362, image: '/images/avianca/sal.jpg' },
  { code: 'SAP', city: 'San Pedro Sula', price: 371, image: '/images/avianca/sap.jpg' },
  { code: 'TGU', city: 'Tegucigalpa', price: 377, image: '/images/avianca/tgu.jpg' },
  { code: 'BAQ', city: 'Barranquilla', price: 382, image: '/images/avianca/baq.jpg' },
  { code: 'PEI', city: 'Pereira', price: 387, image: '/images/avianca/pei.jpg' },
  { code: 'PUJ', city: 'Punta Cana', price: 388, image: '/images/avianca/puj.jpg' },
  { code: 'GYE', city: 'Guayaquil', price: 401, image: '/images/avianca/gye.jpg' },
  { code: 'BOS', city: 'Boston', price: 423, image: '/images/avianca/bos.jpg' },
];

export const aviancaOfferFaqs = [
  {
    q: '¿Cómo puedo encontrar las mejores ofertas de vuelos con Avianca?',
    a: 'En esta página encontrarás tarifas y ofertas disponibles para distintos destinos. Explora fechas cercanas y alternativas de viaje para encontrar la opción que mejor se adapte a tus planes.',
  },
  {
    q: '¿Las ofertas de vuelos de Avianca aplican para todas las rutas?',
    a: 'Las ofertas varían según el destino, la temporada y la disponibilidad. Revisa esta página con frecuencia para identificar las rutas disponibles y tomar la mejor decisión antes de que cambien.',
  },
  {
    q: '¿Puedo acumular Lifemiles al comprar una oferta?',
    a: 'Sí. Puedes acumular o canjear Lifemiles en todas tus compras. Si aún no estás inscrito, <a href="https://www.Lifemiles.com/enrollment/step/1?utm_source=avianca&utm_medium=referral&utm_campaign=airplane_afiliacion_es">regístrate aquí</a> y empieza a disfrutar beneficios exclusivos, descuentos y más oportunidades para ahorrar en tus vuelos.',
  },
  {
    q: '¿Con qué frecuencia Avianca actualiza sus ofertas?',
    a: 'Las ofertas se actualizan constantemente según la disponibilidad y la demanda. Vuelve a esta página regularmente para no perder la oportunidad de concretar el viaje que tienes en mente.',
  },
];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function offerSearchHref(code: string) {
  const depart = new Date();
  depart.setDate(depart.getDate() + 21);
  const back = new Date(depart);
  back.setDate(back.getDate() + 7);
  return `/ofertas-vuelos?origin=GUA&destination=${code}&trip=roundtrip&cabin=Economy&depart=${iso(depart)}&return=${iso(back)}&adults=1`;
}
