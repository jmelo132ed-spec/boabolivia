/** Share of tasas/impuestos inside the displayed ticket total. */
export const TICKET_TAX_RATIO = 233.56 / 1162.56;

export function roundMoney(value: number | string) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function splitAirlineAndTax(fullPrice: number | string) {
  const raw = roundMoney(fullPrice);
  const tax = roundMoney(raw * TICKET_TAX_RATIO);
  const fare = Math.max(0, roundMoney(raw - tax));
  return { raw, fare, tax };
}

/** Discount only what the airline sells (tarifa). Taxes stay full. */
export function ticketAfterDiscount(original: number | string, discountPct: number | string) {
  const { fare, tax } = splitAirlineAndTax(original);
  const pct = Number(discountPct) || 0;
  if (!(pct > 0)) return roundMoney(fare + tax);
  const fareAfter = roundMoney(fare * (1 - Math.min(100, pct) / 100));
  return roundMoney(fareAfter + tax);
}

export function airlineAfterDiscount(fareOnly: number | string, discountPct: number | string) {
  const base = roundMoney(fareOnly);
  const pct = Number(discountPct) || 0;
  if (!(pct > 0)) return base;
  return roundMoney(base * (1 - Math.min(100, pct) / 100));
}
