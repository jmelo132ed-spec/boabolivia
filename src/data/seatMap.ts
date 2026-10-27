export type SeatType = 'plus' | 'economy' | 'exit' | 'unavailable';

export type SeatCell = {
  letter: string;
  type: SeatType;
  available: boolean;
  price: number;
};

export type SeatRow = {
  row: number;
  section?: 'economy' | 'plus' | 'exit';
  seats: SeatCell[];
};

export type SeatCategory = {
  id: SeatType;
  name: string;
  fromPrice: number;
  accent: string;
  description: string;
  image?: string;
};

export const SEAT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'K'] as const;

export const seatCategories: SeatCategory[] = [
  {
    id: 'plus',
    name: 'Asiento Plus',
    fromPrice: 0,
    accent: '#5b7d82',
    description: 'Asientos en la parte delantera del avión con reclinación y apoyacabezas ajustable.',
    image: '/images/seats/plus-cabin.webp',
  },
  {
    id: 'economy',
    name: 'Asiento Economy',
    fromPrice: 0,
    accent: '#c9e8ea',
    description: 'Asientos en la parte posterior del avión con espacio estándar y reclinación.',
    image: '/images/seats/economy-cabin.webp',
  },
  {
    id: 'exit',
    name: 'Salida de emergencia',
    fromPrice: 0,
    accent: '#f0b429',
    description: 'Mayor espacio para las piernas. Debes cumplir requisitos de seguridad para ocuparlo.',
    image: '/images/seats/exit-cabin.webp',
  },
];

type RawCell = { type: Exclude<SeatType, 'unavailable'>; avail: boolean };

const PLUS = { type: 'plus' as const, avail: true };
const PLUS_OFF = { type: 'plus' as const, avail: false };
const ECO = { type: 'economy' as const, avail: true };
const ECO_OFF = { type: 'economy' as const, avail: false };
const EXIT = { type: 'exit' as const, avail: true };
const EXIT_OFF = { type: 'exit' as const, avail: false };

/** Mapa A320 estilo Avianca (A B C | D E K). Las filas 4-9 copian el original GUA–BOG. */
const RAW_MAP: Record<number, { section?: SeatRow['section']; seats: Record<string, RawCell> }> = {
  4: {
    section: 'economy',
    seats: { A: ECO_OFF, B: ECO_OFF, C: ECO_OFF, D: ECO_OFF, E: ECO_OFF, K: ECO_OFF },
  },
  5: {
    section: 'plus',
    seats: { A: PLUS_OFF, B: PLUS, C: PLUS_OFF, D: PLUS_OFF, E: PLUS, K: PLUS_OFF },
  },
  6: {
    seats: { A: PLUS_OFF, B: PLUS_OFF, C: PLUS_OFF, D: PLUS, E: PLUS_OFF, K: PLUS_OFF },
  },
  7: {
    seats: { A: PLUS_OFF, B: PLUS, C: PLUS_OFF, D: PLUS_OFF, E: PLUS, K: PLUS_OFF },
  },
  8: {
    seats: { A: PLUS_OFF, B: PLUS_OFF, C: PLUS, D: PLUS_OFF, E: PLUS, K: PLUS_OFF },
  },
  9: {
    seats: { A: PLUS_OFF, B: PLUS_OFF, C: PLUS, D: PLUS_OFF, E: PLUS, K: PLUS_OFF },
  },
  10: {
    seats: { A: PLUS, B: PLUS_OFF, C: PLUS, D: PLUS_OFF, E: PLUS, K: PLUS_OFF },
  },
  11: {
    seats: { A: PLUS_OFF, B: PLUS, C: PLUS_OFF, D: PLUS, E: PLUS_OFF, K: PLUS },
  },
  12: {
    section: 'exit',
    seats: { A: EXIT, B: EXIT_OFF, C: EXIT, D: EXIT, E: EXIT_OFF, K: EXIT },
  },
  13: {
    seats: { A: EXIT_OFF, B: EXIT, C: EXIT_OFF, D: EXIT_OFF, E: EXIT, K: EXIT_OFF },
  },
  14: {
    section: 'economy',
    seats: { A: ECO, B: ECO_OFF, C: ECO, D: ECO_OFF, E: ECO, K: ECO_OFF },
  },
  15: {
    seats: { A: ECO_OFF, B: ECO, C: ECO_OFF, D: ECO, E: ECO_OFF, K: ECO },
  },
  16: {
    seats: { A: ECO, B: ECO, C: ECO_OFF, D: ECO_OFF, E: ECO, K: ECO },
  },
  17: {
    seats: { A: ECO_OFF, B: ECO_OFF, C: ECO, D: ECO, E: ECO_OFF, K: ECO_OFF },
  },
  18: {
    seats: { A: ECO, B: ECO_OFF, C: ECO_OFF, D: ECO, E: ECO, K: ECO_OFF },
  },
  19: {
    seats: { A: ECO_OFF, B: ECO, C: ECO, D: ECO_OFF, E: ECO_OFF, K: ECO },
  },
  20: {
    seats: { A: ECO, B: ECO, C: ECO, D: ECO_OFF, E: ECO, K: ECO },
  },
  21: {
    seats: { A: ECO_OFF, B: ECO_OFF, C: ECO, D: ECO, E: ECO_OFF, K: ECO_OFF },
  },
  22: {
    seats: { A: ECO, B: ECO_OFF, C: ECO, D: ECO_OFF, E: ECO, K: ECO_OFF },
  },
  23: {
    seats: { A: ECO_OFF, B: ECO, C: ECO_OFF, D: ECO, E: ECO_OFF, K: ECO },
  },
  24: {
    seats: { A: ECO, B: ECO, C: ECO_OFF, D: ECO_OFF, E: ECO, K: ECO },
  },
  25: {
    seats: { A: ECO_OFF, B: ECO_OFF, C: ECO, D: ECO, E: ECO_OFF, K: ECO_OFF },
  },
  26: {
    seats: { A: ECO, B: ECO_OFF, C: ECO_OFF, D: ECO, E: ECO, K: ECO_OFF },
  },
  27: {
    seats: { A: ECO_OFF, B: ECO, C: ECO, D: ECO_OFF, E: ECO_OFF, K: ECO },
  },
  28: {
    seats: { A: ECO, B: ECO_OFF, C: ECO, D: ECO, E: ECO_OFF, K: ECO },
  },
  29: {
    seats: { A: ECO_OFF, B: ECO, C: ECO_OFF, D: ECO_OFF, E: ECO, K: ECO_OFF },
  },
  30: {
    seats: { A: ECO, B: ECO, C: ECO_OFF, D: ECO, E: ECO_OFF, K: ECO },
  },
};

export const EMERGENCY_BEFORE_ROW = 12;
export const AIRCRAFT_LABEL = 'Airbus 320';

export function buildSeatRows(): SeatRow[] {
  return Object.keys(RAW_MAP)
    .map(Number)
    .sort((a, b) => a - b)
    .map((row) => {
      const raw = RAW_MAP[row];
      return {
        row,
        section: raw.section,
        seats: SEAT_LETTERS.map((letter) => {
          const cell = raw.seats[letter];
          return {
            letter,
            type: cell.avail ? cell.type : 'unavailable',
            available: cell.avail,
            price: 0,
          };
        }),
      };
    });
}
