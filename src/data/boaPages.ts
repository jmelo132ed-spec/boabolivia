export type BoaSection = {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
};

export type BoaPage = {
  slug: string;
  title: string;
  kicker?: string;
  intro?: string;
  sections: BoaSection[];
};

export const BOA_PAGES: BoaPage[] = [
  {
    slug: 'mascotas',
    title: 'Mascotas a bordo',
    kicker: 'Ayuda',
    intro: 'Si viajas con tu mascota, BoA tiene un servicio pensado exclusivamente para ella. Requiere reserva previa y los cupos son limitados.',
    sections: [
      {
        heading: 'Mascota en cabina',
        paragraphs: [
          'Se aceptan perros y gatos mayores de 3 meses. Si viajas a Estados Unidos, la edad mínima es de 6 meses.',
          'Necesitas un transportín flexible, ventilado y completamente cerrado, con base impermeable y material absorbente. Durante todo el vuelo tu mascota debe permanecer dentro del bolso, debajo del asiento delantero.',
        ],
        list: [
          'Peso máximo: 8 kg, incluyendo el transportín.',
          'Medidas máximas: 25 cm de alto × 33 cm de ancho × 36 cm de profundidad.',
          'Si supera peso o medidas, viaja en bodega en un kennel rígido.',
          'Disponible en vuelos nacionales e internacionales de BoA. No incluye conexiones con otras aerolíneas ni códigos compartidos.',
        ],
      },
      {
        heading: 'Documentos importantes',
        paragraphs: [
          'El día del viaje presenta los certificados y documentos originales y entrega dos copias impresas en el aeropuerto.',
        ],
        list: [
          'Vuelos dentro de Bolivia',
          'Vuelos hacia y dentro de Sudamérica',
          'Vuelos a Madrid',
          'Vuelos a Miami',
        ],
      },
      {
        heading: 'Tarifa del servicio',
        paragraphs: [
          'El cobro se calcula por tramo (solo ida). Si tu itinerario tiene más de un tramo o es ida y vuelta, el servicio se cobra en cada tramo donde se solicite el transporte de la mascota.',
        ],
      },
    ],
  },
  {
    slug: 'equipaje',
    title: 'Equipaje',
    kicker: 'Experiencia',
    intro: 'Empaca tranquilo: el equipaje de mano y el documentado están incluidos según tu tarifa.',
    sections: [
      {
        heading: 'Equipaje de mano',
        paragraphs: ['Puedes llevar una pieza de cabina dentro de las medidas y peso permitidos, más un artículo personal (cartera, notebook o mochila pequeña).'],
        list: ['Medida máxima referencial: 55 × 35 × 25 cm.', 'Peso máximo referencial: 8 kg en cabina.'],
      },
      {
        heading: 'Equipaje documentado',
        paragraphs: ['La franquicia de bodega depende de la ruta y de la tarifa comprada. En mostrador debes identificar cada maleta con tu nombre y un teléfono de contacto.'],
      },
      {
        heading: 'Artículos restringidos',
        paragraphs: ['No se aceptan líquidos inflamables, explosivos ni baterías sueltas fuera de la normativa. Consulta en aeropuerto si viajas con instrumentos musicales, equipos deportivos o sillas de ruedas.'],
      },
    ],
  },
  {
    slug: 'menores',
    title: 'Menores, niños y bebés',
    kicker: 'Experiencia',
    intro: 'Viaja y crea recuerdos con los más pequeños. BoA tiene condiciones claras para niños, infantes y menores no acompañados.',
    sections: [
      {
        heading: 'Bebés',
        paragraphs: ['Menores de 2 años viajan en falda de un adulto. Deben tener documento de identidad o pasaporte vigente y no ocupan asiento propio, salvo que se compre un asiento adicional.'],
      },
      {
        heading: 'Niños',
        paragraphs: ['De 2 a 11 años pagan tarifa niño, ocupan asiento y tienen la misma franquicia de equipaje que el adulto, según la tarifa.'],
      },
      {
        heading: 'Menor no acompañado',
        paragraphs: ['El servicio de menor no acompañado se reserva con anticipación en oficinas o contact center. Un adulto debe entregar y recibir al menor en el aeropuerto con documento de identidad.'],
      },
    ],
  },
  {
    slug: 'embarazadas',
    title: 'Mujeres embarazadas',
    kicker: 'Experiencia',
    intro: 'Comodidad y seguridad para futuras mamás. El viaje está permitido según la semana de gestación y con la documentación médica correspondiente.',
    sections: [
      {
        paragraphs: [
          'Hasta la semana 28, por lo general no se exige certificado médico para vuelos de corta duración, salvo indicación especial.',
          'Entre las semanas 28 y 36 se requiere un certificado médico emitido como máximo 10 días antes del vuelo, que indique que estás apta para viajar.',
          'A partir de la semana 36 (o 32 en embarazo múltiple) el viaje no está permitido, salvo autorización médica expresa y evaluación de BoA.',
        ],
      },
    ],
  },
  {
    slug: 'clase-business',
    title: 'Clase Business',
    kicker: 'Business',
    intro: 'La libertad de elegir tu asiento, sin costo, y una experiencia más cómoda a bordo.',
    sections: [
      {
        heading: 'Qué incluye',
        list: [
          'Asiento más amplio y selección de asiento sin cargo.',
          'Equipaje adicional según ruta.',
          'Embarque preferente y atención diferenciada.',
          'Servicio de a bordo Business en rutas donde aplica.',
        ],
      },
      {
        paragraphs: ['Reserva Clase Business desde el buscador de vuelos eligiendo la cabina correspondiente en la cotización.'],
      },
    ],
  },
  {
    slug: 'avisos',
    title: 'Avisos importantes',
    kicker: 'Información',
    intro: 'Entérate de las últimas noticias, eventos y anuncios importantes de Boliviana de Aviación.',
    sections: [
      {
        list: [
          'Llega al aeropuerto con anticipación: 2 horas en vuelos nacionales y 3 horas en internacionales.',
          'Verifica vigencia de cédula o pasaporte y requisitos del país de destino.',
          'El check-in online cierra según la hora límite de cada aeropuerto.',
          'Revisa alertas meteorológicas o operativas antes de salir de casa.',
        ],
      },
    ],
  },
  {
    slug: 'oficinas',
    title: 'Nuestras oficinas',
    kicker: 'Contáctanos',
    intro: 'Descubre nuestras oficinas y horarios de atención. Estamos aquí para ayudarte cuando lo necesites.',
    sections: [
      {
        heading: 'Contact Center',
        paragraphs: ['Atención telefónica para reservas, cambios, check-in y servicios especiales.'],
        list: ['Bolivia: 800-10-4141', 'Santa Cruz: +591 3 315 9800', 'La Paz: +591 2 215 8900', 'Cochabamba: +591 4 412 1000'],
      },
      {
        heading: 'Oficinas de venta',
        list: [
          'Santa Cruz — Viru Viru y oficinas en la ciudad',
          'La Paz — El Alto y zona central',
          'Cochabamba — Jorge Wilstermann y oficina urbana',
          'Sucre, Tarija, Trinidad, Cobija, Uyuni y Oruro',
        ],
      },
    ],
  },
  {
    slug: 'hora-limite',
    title: 'Hora límite',
    kicker: 'Información',
    intro: 'Asegúrate de llegar a tiempo para iniciar tu viaje y mejorar tu experiencia.',
    sections: [
      {
        heading: 'Cierre de check-in y embarque',
        list: [
          'Vuelos nacionales: preséntate 2 horas antes. El check-in cierra 45 minutos antes de la salida.',
          'Vuelos internacionales: preséntate 3 horas antes. El check-in cierra 60 minutos antes de la salida.',
          'El embarque cierra 15 a 20 minutos antes de la hora programada.',
          'Pasajeros con mascotas, menores no acompañados o asistencia especial deben llegar con mayor anticipación.',
        ],
      },
    ],
  },
  {
    slug: 'asistencia-especial',
    title: 'Asistencia especial',
    kicker: 'Información',
    intro: 'Nos preocupamos por tus necesidades. Por eso contamos con un servicio exclusivo ante los requerimientos de nuestros clientes.',
    sections: [
      {
        heading: 'Cómo solicitarlo',
        paragraphs: ['Pide el servicio al reservar o hasta 48 horas antes del vuelo a través del contact center u oficinas. El día del viaje preséntate con tiempo extra en el mostrador.'],
        list: [
          'Silla de ruedas hasta la puerta de la aeronave o hasta el asiento',
          'Pasajeros con movilidad reducida',
          'Pasajeros con discapacidad visual o auditiva',
          'Oxígeno medicinal (sujeto a autorización previa)',
          'Viaje con perro de servicio',
        ],
      },
    ],
  },
  {
    slug: 'metodos-de-pago',
    title: '¿Cómo pago mi boleto?',
    kicker: 'Prepárate',
    intro: 'Puedes pagar tu reserva con los medios habilitados en Bolivia y en el exterior.',
    sections: [
      {
        list: [
          'Tarjetas de crédito y débito Visa, Mastercard y American Express',
          'Pago en oficinas BoA',
          'Pago en aeropuerto, sujeto a disponibilidad',
        ],
      },
      {
        paragraphs: ['El cargo aparece a nombre de Boliviana de Aviación. Conserva el comprobante y el código de reserva (PNR) para check-in y cambios.'],
      },
    ],
  },
  {
    slug: 'documentos',
    title: '¿Qué documentos necesito?',
    kicker: 'Prepárate',
    intro: 'Lleva documentos vigentes. Sin ellos no podrás embarcar, aunque tengas boleto pagado.',
    sections: [
      {
        heading: 'Vuelos nacionales',
        paragraphs: ['Cédula de identidad boliviana vigente. Niños y bebés también requieren documento de identidad o certificado de nacimiento según la edad.'],
      },
      {
        heading: 'Vuelos internacionales',
        paragraphs: ['Pasaporte vigente (con la validez que exija el destino) y visa si corresponde. Verifica requisitos sanitarios y de ingreso del país al que viajas.'],
      },
    ],
  },
  {
    slug: 'destinos',
    title: 'Nuestros destinos',
    kicker: 'Viajar',
    intro: 'Conoce las ciudades donde vuela BoA y elige tu próximo destino desde el buscador.',
    sections: [
      {
        heading: 'Bolivia',
        list: ['Santa Cruz (VVI)', 'La Paz (LPB)', 'Cochabamba (CBB)', 'Sucre (SRE)', 'Tarija (TJA)', 'Cobija (CIJ)', 'Trinidad (TDD)', 'Uyuni (UYU)', 'Oruro (ORU)'],
      },
      {
        heading: 'Internacional',
        list: ['Madrid (MAD)', 'Barcelona (BCN)', 'Miami (MIA)', 'São Paulo (GRU)', 'Río de Janeiro (GIG)', 'Buenos Aires (EZE)', 'Lima (LIM)', 'Santiago (SCL)', 'Iquique (IQQ)', 'Asunción (ASU)', 'Washington DC (DCA)'],
      },
    ],
  },
  {
    slug: 'tarifas',
    title: 'Nuestras tarifas',
    kicker: 'Viajar',
    intro: 'Cada tarifa define cambios, reembolsos, asiento y equipaje. Elige en la cotización la que mejor se adapte a tu viaje.',
    sections: [
      {
        list: [
          'Tarifa más económica: sujeta a condiciones de cambio y equipaje reducido.',
          'Tarifa estándar: incluye equipaje y permite cambios con penalidad.',
          'Tarifa flexible / Business: mayor libertad de cambios y beneficios a bordo.',
        ],
      },
      {
        paragraphs: ['Los impuestos, tasas y cargos aeroportuarios se suman al valor de la tarifa aérea y se muestran desglosados antes de pagar.'],
      },
    ],
  },
  {
    slug: 'ayuda',
    title: 'Centro de ayuda',
    kicker: 'Ayuda',
    intro: 'Encuentra respuestas rápidas o comunícate con nosotros.',
    sections: [
      {
        list: [
          'Reservas y cambios: usa el buscador o visita Oficinas.',
          'Check-in online: pestaña Iniciar Check-in en la portada.',
          'Estado de vuelo: pestaña Estado de vuelo en la portada.',
          'Mascotas, equipaje, menores y asistencia: entra a cada sección desde la portada.',
        ],
      },
    ],
  },
  {
    slug: 'acerca-de',
    title: 'Quiénes somos',
    kicker: 'Acerca de BoA',
    intro: 'Boliviana de Aviación (BoA) es la línea aérea bandera de Bolivia. Conectamos el país con Sudamérica, Estados Unidos y Europa.',
    sections: [
      {
        paragraphs: [
          'Operamos bajo estándares de seguridad internacional y formamos parte del programa IOSA de IATA.',
          'Nuestra base principal está en Santa Cruz de la Sierra (Viru Viru), con operación nacional e internacional.',
        ],
      },
    ],
  },
  {
    slug: 'prensa',
    title: 'Prensa',
    kicker: 'Acerca de BoA',
    intro: 'Comunicados y avisos institucionales de Boliviana de Aviación.',
    sections: [{ paragraphs: ['Para solicitudes de prensa escribe a través del Centro de Ayuda o visita las oficinas institucionales.'] }],
  },
  {
    slug: 'empleos',
    title: 'Trabaja con nosotros',
    kicker: 'Acerca de BoA',
    intro: 'Conoce las convocatorias vigentes de BoA.',
    sections: [
      {
        paragraphs: ['Las convocatorias se publican en el portal institucional de BoA. Completa tu postulación solo en los canales oficiales.'],
      },
    ],
  },
  {
    slug: 'sostenibilidad',
    title: 'Responsabilidad social',
    kicker: 'Acerca de BoA',
    intro: 'Trabajamos para conectar Bolivia con un enfoque de servicio, seguridad y compromiso con las comunidades.',
    sections: [{ paragraphs: ['BoA impulsa acciones de responsabilidad social, cultura y apoyo a destinos nacionales como Uyuni, Sucre y Tarija.'] }],
  },
  {
    slug: 'legal/contrato',
    title: 'Contrato de transporte',
    kicker: 'Información legal',
    intro: 'El contrato de transporte aéreo rige la relación entre BoA y el pasajero desde la emisión del boleto hasta la finalización del viaje.',
    sections: [
      {
        paragraphs: [
          'Incluye condiciones de emisión, check-in, equipaje, responsabilidad por retrasos o denegación de embarque, y reclamos.',
          'Al comprar aceptas estas condiciones junto con las tarifas aplicables y la normativa aeronáutica vigente.',
        ],
      },
    ],
  },
  {
    slug: 'legal/privacidad',
    title: 'Política de privacidad',
    kicker: 'Información legal',
    intro: 'Cuidamos tus datos personales usados para reservas, pagos, check-in y atención al cliente.',
    sections: [
      {
        paragraphs: ['Tratamos nombre, documento, contacto, itinerario y datos de pago solo para prestar el servicio. Puedes solicitar acceso o corrección a través del Centro de Ayuda.'],
      },
    ],
  },
  {
    slug: 'legal/terminos',
    title: 'Términos y condiciones',
    kicker: 'Información legal',
    intro: 'El uso de este sitio implica la aceptación de estos términos.',
    sections: [
      {
        paragraphs: ['Los contenidos, marcas y el sistema de reservas son de Boliviana de Aviación. Las tarifas pueden cambiar hasta emitir el boleto. Las ofertas están sujetas a disponibilidad.'],
      },
    ],
  },
  {
    slug: 'legal/cookies',
    title: 'Política de cookies',
    kicker: 'Información legal',
    intro: 'Usamos cookies para que el sitio funcione, recordar tu idioma y mejorar la experiencia.',
    sections: [
      {
        list: ['Cookies necesarias: sesión y seguridad.', 'Cookies de preferencia: idioma y país.', 'Cookies de medición: estadísticas de uso anónimas.'],
      },
      { paragraphs: ['Puedes aceptar o rechazar el aviso de cookies en la portada.'] },
    ],
  },
  {
    slug: 'legal/derechos',
    title: 'Derechos y obligaciones de los pasajeros',
    kicker: 'Información legal',
    intro: 'Conoce tus derechos al viajar y las obligaciones para un vuelo seguro.',
    sections: [
      {
        list: [
          'Derecho a información clara de itinerario, tarifas e impuestos.',
          'Derecho a asistencia en demoras prolongadas o cancelaciones, según normativa.',
          'Obligación de presentarte a tiempo, con documentos vigentes y cumplir las instrucciones de tripulación.',
        ],
      },
    ],
  },
  {
    slug: 'somos-iosa',
    title: 'Somos IOSA',
    kicker: 'Acerca de BoA',
    intro: 'BoA está registrada en la Auditoría de Seguridad Operacional de IATA (IOSA).',
    sections: [{ paragraphs: ['IOSA certifica que los procesos de operación, mantenimiento y despacho cumplen estándares internacionales de seguridad.'] }],
  },
  {
    slug: 'mapa-de-sitio',
    title: 'Mapa de sitio',
    kicker: 'Enlaces rápidos',
    intro: 'Accede a las secciones principales del sitio.',
    sections: [
      {
        list: [
          'Buscar vuelos',
          'Nuestros destinos',
          'Nuestras tarifas',
          'Check-in online',
          'Centro de ayuda',
          'Oficinas',
          'Contrato de transporte',
        ],
      },
    ],
  },
  {
    slug: 'estado-de-vuelo',
    title: 'Estado de vuelo',
    kicker: 'Mis vuelos',
    intro: 'Consulta el estado de tu vuelo con el número y la fecha.',
    sections: [
      {
        paragraphs: ['Ingresa el número de vuelo (por ejemplo OB 123) y la fecha. La información mostrada corresponde a la programación vigente y puede actualizarse por operación o clima.'],
      },
    ],
  },
];

const PAGE_MAP = new Map(BOA_PAGES.map((page) => [page.slug, page]));

export function getBoaPage(slug: string) {
  return PAGE_MAP.get(slug) || null;
}

export function getBoaPageSlugs() {
  return BOA_PAGES.map((page) => page.slug);
}
