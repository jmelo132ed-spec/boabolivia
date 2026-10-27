import citiesJson from './cities.json';

export const siteConfig = {
  name: 'BoA',
  country: 'Bolivia',
  locale: 'es-GT',
  currency: 'USD',
  currencySymbol: '$',
  title: 'Reserva vuelos nacionales e internacionales | BoA',
  description:
    'Cotiza y compra vuelos con Boliviana de Aviación.',
};

export type NavLink = {
  label: string;
  href: string;
  external?: boolean;
  icon?: string;
};

export type NavGroup = {
  label: string;
  href?: string;
  items?: NavLink[];
};

export const discoverMenu: NavLink[] = [
  { label: 'Ofertas', href: '/ofertas' },
  { label: 'Destinos', href: '/destinos' },
  { label: 'Paquetes turísticos', href: '/paquetes' },
  { label: 'Alojamientos', href: '/alojamientos' },
  { label: 'Alquiler de autos', href: '/autos' },
  { label: 'Universal', href: '/universal' },
  { label: 'Actividades', href: '/actividades' },
  { label: 'eSIM', href: '/esim' },
  { label: 'Traslados', href: '/traslados' },
  { label: 'Asistencia en viaje', href: '/asistencia' },
  { label: 'Más servicios', href: '/servicios' },
];

export const tripsMenu: NavLink[] = [
  { label: 'Administrar tus viajes', href: '/mis-viajes' },
  { label: 'Check-in', href: '/check-in' },
];

export const headerLinks = {
  help: { label: 'Centro de ayuda', href: '/ayuda' },
  flightStatus: { label: 'Estado de vuelo', href: '/estado-de-vuelo' },
  pass: { label: 'Lifemiles', href: 'https://www.lifemiles.com', external: true },
  login: { label: 'Iniciar sesión', href: '/login' },
};

export const currencies = [
  { code: 'USD', symbol: '$', name: 'Dólares americanos', country: 'GT' },
  { code: 'COP', symbol: '$', name: 'Pesos colombianos', country: 'CO' },
  { code: 'EUR', symbol: '€', name: 'Euros', country: 'ES' },
  { code: 'BRL', symbol: 'R$', name: 'Reales brasileños', country: 'BR' },
];

export type City = {
  code: string;
  city: string;
  country: string;
  airport: string;
  type?: 'AIRPORT' | 'CITY' | 'RAILWAY_STATION';
};

export const cities: City[] = citiesJson as City[];

export const bookingTabs = [
  { id: 'vuelos', label: 'Vuelos' },
  { id: 'alojamientos', label: 'Alojamientos' },
  { id: 'carros', label: 'Autos' },
  { id: 'asistencia', label: 'Asistencia en viaje' },
  { id: 'upgrade', label: 'Upgrade' },
  { id: 'esim', label: 'eSIM' },
];

export const cabins = ['Economy', 'Premium Economy', 'Premium Business'];

export const loginInvite = {
  title: 'Inicia sesión en LATAM y podrás:',
  items: [
    'Acumular y canjear Millas LATAM Pass por pasajes y más.',
    'Administrar tus viajes.',
    'Pagar con tu LATAM Wallet.',
  ],
};

export const promoBanner = {
  badge: '¡CYBER LATAM!',
  title: 'Hasta 42% dcto. 🚨 ¡Ofertas Cyber activas!',
  text: 'Paraguay y el mundo se recorren mejor en avión. ✈️ Compra pasajes hoy y vuela con el servicio que mereces.',
  cta: 'Comprar pasajes',
  href: '/ofertas',
  image: '/images/promo-cyber.png',
};

export const serviceLinks = [
  { id: 'esim', label: 'eSIM', href: '/esim', icon: 'esim' },
  { id: 'traslados', label: 'Traslados', href: '/traslados', icon: 'transfer' },
  { id: 'actividades', label: 'Actividades', href: '/actividades', icon: 'activity' },
];

export type Offer = {
  id: string;
  city: string;
  image: string;
  badge: string;
  trip: string;
  date: string;
  cabin: string;
  price: number;
  miles: number;
  discount: number;
  direct: boolean;
  category: string;
  from: string;
};

export const offers: Offer[] = [
  {
    id: 'mia',
    city: 'Miami',
    image: '/images/landing/miami.png',
    badge: 'Acumula millas',
    trip: 'Ida y vuelta',
    date: '02/04/26',
    cabin: 'Economy',
    price: 347,
    miles: 69400,
    discount: 0,
    direct: true,
    category: 'en-oferta',
    from: 'GUA',
  },
  {
    id: 'lax',
    city: 'Los Ángeles',
    image: '/images/landing/manta.png',
    badge: 'Acumula millas',
    trip: 'Ida y vuelta',
    date: '07/07/26',
    cabin: 'Economy',
    price: 597,
    miles: 119400,
    discount: 0,
    direct: true,
    category: 'aventuras-urbanas',
    from: 'GUA',
  },
  {
    id: 'iad',
    city: 'Washington D.C.',
    image: '/images/landing/bogota.png',
    badge: 'Acumula millas',
    trip: 'Ida y vuelta',
    date: '18/09/26',
    cabin: 'Economy',
    price: 796,
    miles: 159200,
    discount: 0,
    direct: true,
    category: 'joyas-sudamericanas',
    from: 'GUA',
  },
];

export const offerCategories = [
  { id: 'en-oferta', label: 'En oferta', icon: 'tag' },
  { id: 'destinos-playeros', label: 'Destinos playeros', icon: 'palm' },
  { id: 'aventuras-urbanas', label: 'Aventuras urbanas', icon: 'city' },
  { id: 'vida-nocturna', label: 'Vida nocturna', icon: 'night' },
  { id: 'retiros-naturales', label: 'Retiros naturales', icon: 'nature' },
  { id: 'joyas-sudamericanas', label: 'Joyas Sudamericanas', icon: 'gem' },
];

export const hotels = [
  {
    city: 'Río de Janeiro, Brasil',
    image: '/images/hotels/rio.jpg',
    price: 110.76,
    unit: 'Por noche',
    people: '2 adultos',
    href: '/alojamientos?destino=GIG',
  },
  {
    city: 'Cancún, México',
    image: '/images/offers/miami.jpg',
    price: 111.28,
    unit: 'Por noche',
    people: '2 adultos',
    href: '/alojamientos?destino=CUN',
  },
];

export const campaigns = [
  {
    kicker: '¿Viajás por negocios o de vacaciones? Elegí viajar premium.',
    title: 'Disfrutá la experiencia de las Cabinas Premium Economy o Premium Business.',
    cta: 'Comprá acá',
    image: '/images/campaigns/paquete.jpg',
    href: '/upgrade',
  },
  {
    kicker: '¡Canjeá tus Millas LATAM Pass y elegí tu próximo destino!',
    title: 'Completá con dinero y transformá tus millas en más viajes inolvidables.',
    cta: 'Canjeá ahora',
    image: '/images/campaigns/assist.jpg',
    href: '/canje-millas',
  },
  {
    kicker: 'Tu hotel ideal para las próximas vacaciones lo encontrás en LATAM.com.',
    title: 'Acumulá 3 Millas LATAM Pass y 6 Puntos Calificables por dólar gastado',
    cta: 'Reservá acá',
    image: '/images/campaigns/hotel.jpg',
    href: '/alojamientos',
  },
];

export const moreOptions = [
  {
    title: 'Encuentra tu descanso en cualquier lugar',
    badge: 'Acumula millas',
    cta: 'Reservar alojamiento',
    href: '/alojamientos',
    image: '/images/more/hotels.svg',
  },
  {
    title: 'Ten un auto esperando en tu próximo destino',
    badge: 'Acumula millas',
    cta: 'Arrendar un auto',
    href: '/autos',
    image: '/images/more/cars.svg',
  },
  {
    title: 'Viaja con tranquilidad y obtén cobertura donde estés + acumula 3 Millas LATAM Pass por dólar gastado',
    badge: 'Acumula millas',
    cta: 'Cotizar asistencia',
    href: '/asistencia',
    image: '/images/more/insurance.svg',
  },
];

export const popularDestinations = [
  { rank: 1, city: 'Río de Janeiro', image: '/images/hotels/rio.jpg', href: '/destinos/rio-de-janeiro' },
  { rank: 2, city: 'Santiago de Chile', image: '/images/landing/bogota.png', href: '/destinos/santiago' },
  { rank: 3, city: 'São Paulo', image: '/images/landing/guayaquil.png', href: '/destinos/sao-paulo' },
  { rank: 4, city: 'Buenos Aires', image: '/images/landing/buenos-aires.png', href: '/destinos/buenos-aires' },
];

export const passCta = {
  title: 'Crea tu cuenta y obtén beneficios LATAM Pass',
  items: [
    'Acumula Millas LATAM Pass en todas tus compras.',
    'Obtén beneficios exclusivos en equipaje, Upgrade de cabina y más.',
    'Canjea pasajes y productos con tus Millas LATAM Pass.',
  ],
  login: 'Iniciar sesión',
  signup: 'Crear cuenta',
};

export const experienceSlides = [
  {
    title: 'Prepara tu viaje',
    text: 'Conoce más sobre lo que necesitas saber con anticipación al preparar tu viaje.',
    image: '/images/experience/prepare.jpg',
    href: '/experiencia/prepara-tu-viaje',
  },
  {
    title: 'Embarque',
    text: 'Conoce más sobre el embarque, información relevante si tienes que hacer una conexión, y más.',
    image: '/images/experience/board.jpg',
    href: '/experiencia/embarque',
  },
  {
    title: 'A bordo',
    text: 'Conoce más sobre nuestros servicios a bordo durante el vuelo.',
    image: '/images/experience/inflight.jpg',
    href: '/experiencia/a-bordo',
  },
  {
    title: 'Experiencia LATAM',
    text: 'Conoce toda la experiencia LATAM',
    image: '/images/experience/prepare.jpg',
    href: '/experiencia',
  },
];

export const creditCard = {
  title: 'Pide tu Tarjeta LATAM Pass Banco de Crédito y obtén hasta 6.000 millas.',
  cta: 'Solicitar tarjeta',
  image: '/images/latam-pass-card.svg',
  href: '/tarjeta-latam-pass',
};

export const footerColumns = [
  {
    title: 'Avianca',
    links: [
      { label: 'Somos Avianca', href: '/acerca-de' },
      { label: 'Experiencia Avianca', href: '/experiencia' },
      { label: 'Prepara tu viaje', href: '/prepara-tu-viaje' },
      { label: 'Gestiona tu reserva', href: '/mis-viajes' },
      { label: 'Estado de vuelos', href: '/estado-de-vuelo' },
      { label: 'Check-in', href: '/check-in' },
      { label: 'Nuestros destinos', href: '/destinos' },
      { label: 'LifeMiles', href: 'https://www.lifemiles.com', external: true },
      { label: 'Crea tu cuenta', href: '/login' },
      { label: 'Contáctanos', href: '/ayuda' },
      { label: 'Noticias corporativas', href: '/prensa' },
      { label: 'Responsabilidad corporativa', href: '/sostenibilidad' },
    ],
  },
  {
    title: 'Información legal',
    links: [
      { label: 'Condiciones de contrato de transporte', href: '/legal/contrato' },
      { label: 'Cargos por servicio', href: '/legal/cargos' },
      { label: 'Privacidad, seguridad y recomendaciones', href: '/legal/privacidad' },
      { label: 'Términos y condiciones generales', href: '/legal/terminos' },
      { label: 'Política sobre cookies', href: '/legal/cookies' },
      { label: 'Términos de uso', href: '/legal/uso' },
      { label: 'Intercambio de slots Sao Paulo (GRU)', href: '/legal/slots-gru' },
    ],
  },
  {
    title: 'Portales asociados',
    links: [
      { label: 'LifeMiles', href: 'https://www.lifemiles.com', external: true },
      { label: 'Avianca Cargo', href: 'https://www.aviancacargo.com', external: true },
      { label: 'Staff Travel', href: '/staff-travel' },
      { label: 'Relación con inversionistas', href: '/inversionistas' },
      { label: 'Aviancadirect (Portal Agencias de Viajes)', href: '/trade' },
    ],
  },
];

export const socials = [
  { label: 'Facebook', href: 'https://es-la.facebook.com/AviancaGlobal/', color: '#3A5795' },
  { label: 'Twitter', href: 'https://x.com/avianca', color: '#5EA9DD' },
  { label: 'Youtube', href: 'https://www.youtube.com/user/aviancachannel', color: '#CC181E' },
  { label: 'Instagram', href: 'https://www.instagram.com/avianca', color: '#DC3175' },
];

export const cookieBanner = {
  text: 'En BoA utilizamos cookies propias y de terceros para garantizar la funcionalidad del sitio y mejorar tu experiencia. Al continuar, aceptas nuestra política de cookies.',
  accept: 'Aceptar',
  more: 'Política de cookies',
};
