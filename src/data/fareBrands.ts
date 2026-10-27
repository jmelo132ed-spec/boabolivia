export type FareId = 'basic' | 'light' | 'full' | 'pe' | 'business';

export type PerkIcon =
  | 'check'
  | 'warn'
  | 'up'
  | 'personal'
  | 'carry'
  | 'hold'
  | 'miles'
  | 'seat'
  | 'plus'
  | 'food'
  | 'change'
  | 'refund'
  | 'norefund'
  | 'checkin';

export type FareTone = 'light' | 'classic' | 'flex' | 'business';

export type FareDetailIcon = 'bag' | 'carry' | 'hold' | 'change' | 'refund' | 'seat' | 'upgrade' | 'food' | 'legroom' | 'board' | 'elite';

export type FareDetailItem = {
  icon: FareDetailIcon;
  title: string;
  subtitle?: string;
  text: string;
};

export type FareDetails = {
  includes: FareDetailItem[];
  extras: FareDetailItem[];
};

export type FareBrand = {
  id: FareId;
  name: string;
  extraAt91: number;
  theme?: 'light' | 'premium';
  accent: string;
  tone: FareTone;
  cabin: 'economy' | 'business';
  recommended?: boolean;
  restrictions?: boolean;
  headerIcons: PerkIcon[];
  perks: { label: string; icon: PerkIcon }[];
  details: FareDetails;
};

const economy: FareBrand[] = [
  {
    id: 'light',
    name: 'Light',
    extraAt91: 0,
    accent: '#ff0000',
    tone: 'light',
    cabin: 'economy',
    restrictions: true,
    headerIcons: ['personal', 'carry'],
    perks: [
      { label: '1 artículo personal (bajo el asiento)', icon: 'personal' },
      { label: '1 equipaje de mano (10 kg)', icon: 'carry' },
      { label: '3 millas por USD', icon: 'miles' },
    ],
    details: {
      includes: [
        { icon: 'bag', title: 'Artículo personal', text: 'Un bolso, mochila o maletín que quepa debajo del asiento (45 × 35 × 20 cm).' },
        { icon: 'carry', title: 'Equipaje de mano', text: '1 pieza de hasta 10 kg en el compartimento superior.' },
      ],
      extras: [
        {
          icon: 'change',
          title: 'Cambios',
          subtitle: 'Rutas nacionales e internacionales',
          text: 'Se permiten cambios <strong>con cargo adicional</strong> antes de la hora del vuelo, más la diferencia de tarifa (si aplica).',
        },
        {
          icon: 'refund',
          title: 'Devoluciones',
          subtitle: 'Rutas nacionales e internacionales',
          text: 'No aplica reembolso de la tarifa. Solo podrás solicitar la devolución de tasas cuando corresponda.',
        },
        {
          icon: 'elite',
          title: 'BoA millas',
          subtitle: 'Acumulación',
          text: 'Acumulas 3 millas BoA por cada USD.',
        },
      ],
    },
  },
  {
    id: 'full',
    name: 'Classic',
    extraAt91: 14.02,
    accent: '#c21887',
    tone: 'classic',
    cabin: 'economy',
    recommended: true,
    headerIcons: ['personal', 'carry', 'hold'],
    perks: [
      { label: '1 artículo personal (bajo el asiento)', icon: 'personal' },
      { label: '1 equipaje de mano (10 kg)', icon: 'carry' },
      { label: '1 equipaje de bodega (23 kg)', icon: 'hold' },
      { label: 'Check-in en aeropuerto', icon: 'checkin' },
      { label: 'Asiento Economy', icon: 'seat' },
      { label: '6 millas por USD', icon: 'miles' },
      { label: 'Menú a bordo', icon: 'food' },
      { label: 'Cambios (antes del vuelo)', icon: 'change' },
      { label: 'Reembolsos', icon: 'norefund' },
    ],
    details: {
      includes: [
        { icon: 'bag', title: 'Artículo personal', text: 'Un bolso, mochila o maletín que quepa debajo del asiento.' },
        { icon: 'carry', title: 'Equipaje de mano', text: '1 pieza de hasta 10 kg.' },
        { icon: 'hold', title: 'Equipaje de bodega', text: '1 pieza con un peso máximo de 23 kg.' },
      ],
      extras: [
        {
          icon: 'change',
          title: 'Cambios',
          subtitle: 'Rutas nacionales e internacionales',
          text: 'Se permiten cambios <strong>con cargo adicional</strong> antes de la hora del vuelo, más la diferencia de tarifa (si aplica).',
        },
        {
          icon: 'seat',
          title: 'Selección de asiento',
          subtitle: 'Asiento Economy',
          text: 'Incluye la selección de asiento Economy sin cargo adicional.',
        },
        {
          icon: 'food',
          title: 'Menú a bordo',
          text: 'Incluye menú a bordo en rutas donde el servicio esté disponible.',
        },
        {
          icon: 'elite',
          title: 'BoA millas',
          subtitle: 'Acumulación',
          text: 'Acumulas 6 millas BoA por cada USD.',
        },
      ],
    },
  },
  {
    id: 'pe',
    name: 'Flex',
    extraAt91: 26.76,
    accent: '#f15a22',
    tone: 'flex',
    cabin: 'economy',
    headerIcons: ['personal', 'carry', 'hold', 'plus'],
    perks: [
      { label: '1 artículo personal (bajo el asiento)', icon: 'personal' },
      { label: '1 equipaje de mano (10 kg)', icon: 'carry' },
      { label: '1 equipaje de bodega (23 kg)', icon: 'hold' },
      { label: 'Check-in en aeropuerto', icon: 'checkin' },
      { label: 'Asiento Plus (sujeto a disponibilidad)', icon: 'plus' },
      { label: '8 millas por USD', icon: 'miles' },
      { label: 'Cambios (antes del vuelo)', icon: 'change' },
      { label: 'Reembolsos (antes del vuelo)', icon: 'refund' },
      { label: 'Menú a bordo', icon: 'food' },
    ],
    details: {
      includes: [
        { icon: 'bag', title: 'Artículo personal', text: 'Un bolso, mochila o maletín que quepa debajo del asiento.' },
        { icon: 'carry', title: 'Equipaje de mano', text: '1 pieza de hasta 10 kg.' },
        { icon: 'hold', title: 'Equipaje de bodega', text: '1 pieza con un peso máximo de 23 kg.' },
      ],
      extras: [
        {
          icon: 'change',
          title: 'Cambios',
          subtitle: 'Rutas nacionales e internacionales',
          text: 'Se permiten cambios <strong>sin cargo</strong> antes de la hora del vuelo, más la diferencia de tarifa (si aplica).',
        },
        {
          icon: 'refund',
          title: 'Devoluciones',
          subtitle: 'Rutas nacionales e internacionales',
          text: 'Puedes solicitar reembolso de la tarifa antes del vuelo, según condiciones de la tarifa Flex.',
        },
        {
          icon: 'seat',
          title: 'Asiento',
          subtitle: 'Plus',
          text: 'Puedes elegir asiento Plus sujeto a disponibilidad.',
        },
        {
          icon: 'elite',
          title: 'BoA millas',
          subtitle: 'Acumulación',
          text: 'Acumulas 8 millas BoA por cada USD.',
        },
      ],
    },
  },
];

const business: FareBrand[] = [
  {
    id: 'business',
    name: 'Business Class',
    extraAt91: 165,
    accent: '#1b1b1b',
    tone: 'business',
    cabin: 'business',
    headerIcons: ['personal', 'carry', 'hold', 'seat'],
    perks: [
      { label: '1 artículo personal (bajo el asiento)', icon: 'personal' },
      { label: '1 equipaje de mano (10 kg)', icon: 'carry' },
      { label: '2 equipajes de bodega (23 kg)', icon: 'hold' },
      { label: 'Check-in preferencial', icon: 'checkin' },
      { label: 'Asiento Business', icon: 'seat' },
      { label: '8 millas por USD', icon: 'miles' },
      { label: 'Menú a bordo', icon: 'food' },
      { label: 'Cambios (antes del vuelo)', icon: 'change' },
      { label: 'Reembolsos (antes del vuelo)', icon: 'refund' },
    ],
    details: {
      includes: [
        { icon: 'bag', title: 'Artículo personal', text: 'Un bolso, mochila o maletín que quepa debajo del asiento.' },
        { icon: 'carry', title: 'Equipaje de mano', text: '1 pieza de hasta 10 kg.' },
        { icon: 'hold', title: 'Equipaje de bodega', text: '2 piezas con un peso máximo de 23 kg cada una.' },
      ],
      extras: [
        {
          icon: 'seat',
          title: 'Asiento Business',
          text: 'Asiento en cabina Business Class, sujeto a disponibilidad del avión.',
        },
        {
          icon: 'food',
          title: 'Menú a bordo',
          text: 'Servicio de menú en cabina Business.',
        },
        {
          icon: 'change',
          title: 'Cambios y reembolsos',
          text: 'Cambios y reembolsos antes del vuelo, según condiciones de la tarifa.',
        },
      ],
    },
  },
];

export function brandsForCabin(cabin: string): FareBrand[] {
  if (/business/i.test(cabin)) return business;
  return economy;
}

export type FareOption = {
  id: FareId;
  name: string;
  price: number;
  extra: number;
  seats?: number;
  theme?: 'light' | 'premium';
  accent: string;
  tone: FareTone;
  cabin: 'economy' | 'business';
  recommended?: boolean;
  restrictions?: boolean;
  headerIcons: PerkIcon[];
  perks: FareBrand['perks'];
  details: FareDetails;
};

function mapBrands(brands: FareBrand[], amount: number, scale: number): FareOption[] {
  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    price: amount,
    extra: Math.round(brand.extraAt91 * scale * 100) / 100,
    theme: brand.theme,
    accent: brand.accent,
    tone: brand.tone,
    cabin: brand.cabin,
    recommended: brand.recommended,
    restrictions: brand.restrictions,
    headerIcons: brand.headerIcons,
    perks: brand.perks,
    details: brand.details,
  }));
}

export function buildFareOptions(basePrice: number, cabin: string): FareOption[] {
  const amount = Number(basePrice) || 0;
  const scale = amount > 0 ? amount / 91.72 : 1;
  if (/business/i.test(cabin)) return mapBrands(business, amount, scale);
  return [...mapBrands(economy, amount, scale), ...mapBrands(business, amount, scale)];
}
