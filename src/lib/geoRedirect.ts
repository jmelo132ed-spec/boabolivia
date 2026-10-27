export function getTicketsUrl(): string {
  return '/reservar';
}

export function getForeignRedirectUrl(): string {
  const value = import.meta.env.PUBLIC_FOREIGN_REDIRECT_URL;
  return typeof value === 'string' ? value.trim() : '';
}

export function getRequestCountry(request: Request): string {
  const header =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code') ||
    '';

  return header.trim().toUpperCase();
}

export function isParaguayCountry(country: string): boolean {
  return country === 'GT';
}

export function isGuatemalaCountry(country: string): boolean {
  return country === 'GT';
}
