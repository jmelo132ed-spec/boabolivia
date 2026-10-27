export type BoaStation = {
  city: string;
  country: string;
  code: string;
  airport: string;
};

export const BOA_STATIONS: BoaStation[] = [
  { city: 'Cochabamba', country: 'BOLIVIA', code: 'CBB', airport: 'Airport Internacional Jorge Wilstermann' },
  { city: 'La Paz', country: 'BOLIVIA', code: 'LPB', airport: 'Airport Internacional El Alto' },
  { city: 'Santa Cruz', country: 'BOLIVIA', code: 'VVI', airport: 'Airport Internacional Viru Viru' },
  { city: 'Sucre', country: 'BOLIVIA', code: 'SRE', airport: 'Airport Internacional Alcantarí' },
  { city: 'Tarija', country: 'BOLIVIA', code: 'TJA', airport: 'Airport Capitán Oriel Lea Plaza' },
  { city: 'Cobija', country: 'BOLIVIA', code: 'CIJ', airport: 'Airport Capitán Anibal Arab' },
  { city: 'Buenos Aires', country: 'ARGENTINA', code: 'EZE', airport: 'Airport Internacional Ministro Pistarini' },
  { city: 'Sao Paulo', country: 'BRASIL', code: 'GRU', airport: 'Airport Internacional de Guarulhos' },
  { city: 'Trinidad', country: 'BOLIVIA', code: 'TDD', airport: 'Airport Teniente Jorge Henrich Arauz' },
  { city: 'Miami (FL)', country: 'ESTADOS UNIDOS', code: 'MIA', airport: 'Airport Internacional de Miami' },
  { city: 'Madrid', country: 'ESPANA', code: 'MAD', airport: 'Airport Internacional Adolfo Suárez Madrid-Barajas' },
  { city: 'Uyuni', country: 'BOLIVIA', code: 'UYU', airport: 'Airport Joya Andina' },
  { city: 'Oruro', country: 'BOLIVIA', code: 'ORU', airport: 'Airport Internacional Juan Mendoza' },
  { city: 'Barcelona', country: 'ESPANA', code: 'BCN', airport: 'Airport Internacional El Prat' },
  { city: 'Lima', country: 'PERU', code: 'LIM', airport: 'Airport Internacional Jorge Chávez' },
  { city: 'Washington DC', country: 'ESTADOS UNIDOS', code: 'DCA', airport: 'Airport Nacional Ronald Reagan de Washington' },
  { city: 'Asunción', country: 'PARAGUAY', code: 'ASU', airport: 'Airport Internacional Silvio Pettirossi' },
  { city: 'Santiago Chile', country: 'CHILE', code: 'SCL', airport: 'Airport Internacional Comodoro Arturo Merino Benítez' },
  { city: 'Iquique', country: 'CHILE', code: 'IQQ', airport: 'Airport Internacional Diego Aracena' },
  { city: 'Rio de Janeiro', country: 'BRASIL', code: 'GIG', airport: 'Airport Internacional de Galeão' },
];

export const BOA_ORIGINS = BOA_STATIONS;
export const BOA_DESTINATIONS = BOA_STATIONS;
