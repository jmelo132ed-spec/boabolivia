export type PaymentLeg = {
  title: string;
  dateLabel: string;
  depart: string;
  arrive: string;
  fromCode: string;
  toCode: string;
  brand: string;
  kind?: 'ida' | 'vuelta';
  stops?: string;
  duration?: string;
  extraDay?: boolean;
};

export const paymentCopy = {
  title: 'Pagar y confirmar',
  totalLabel: 'Total de tu reserva',
  detailCta: 'Detalles de compra',
  summaryTitle: 'Resumen de compra',
  creditsLabel: 'Quiero pagar con',
  creditsName: 'BoA credits',
  promoPrefix: '¡Aprovecha este precio! Finaliza tu reserva antes de',
  methodsTitle: 'Medios de pago',
  walletTitle: 'Paga con transferencia bancaria',
  walletSubtitle: 'Obtén más opciones de pago y beneficios al iniciar sesión.',
  walletLogin: 'Iniciar Sesión',
  walletUnavailable: 'Este medio de pago no está disponible temporalmente.',
  addCardTitle: 'Tarjeta crédito',
  addCardSubtitle: 'Visa, Mastercard, American Express, Diners Club y Discover.',
  payWithCard: 'Total a pagar',
  cardNumberPh: 'Número de tarjeta',
  cardNamePh: 'Nombre del titular',
  cardExpPh: 'Fecha de vencimiento',
  cardCvvPh: 'Código de seguridad',
  cardEmailPh: 'Correo electrónico',
  receiptTitle: '¿A dónde enviamos tu itinerario?',
  receiptHint:
    'La persona que reciba el itinerario será administradora del viaje y la única que podrá solicitar cambios y devoluciones.',
  invoiceTitle: '¿Necesitas factura?',
  invoiceToggle: 'Solicitar factura',
  invoiceTips: [
    'Factura válida para personas y empresas inscritas en Guatemala.',
    'Para justificar costos o gastos, ingresa el NIT. De lo contrario el documento tendrá validez de factura de consumidor final.',
    'Aplica un solo NIT para toda la compra.',
  ],
  invoiceBusinessName: 'Nombre o razón social',
  invoiceRuc: 'NIT',
  invoiceCountry: 'País',
  invoiceCity: 'Ciudad',
  invoiceEmail: 'Correo electrónico',
  invoiceEmailHint: 'Este correo recibirá la factura',
  invoiceConfirm:
    'Confirmo que los datos son correctos y coinciden con los de la SAT.',
  invoiceDefaultCountry: 'Guatemala',
  termsPrefix: 'Acepto los términos y condiciones del',
  termsLink: 'Contrato de Transporte',
  termsHref: 'https://www.avianca.com/es/informacion-legal/contrato-de-transporte/',
  secureNote: 'Usamos 3D Secure para verificar tu información y asegurar que tu compra sea segura.',
  payPrefix: 'Pagar',
  processingTitle: 'Estamos procesando tu pago',
  processingHint: 'No recargues ni cierres la página',
};

export const defaultPaymentLegs: PaymentLeg[] = [
  {
    kind: 'ida',
    title: 'Ciudad de Guatemala a Cali',
    dateLabel: 'Miércoles, 23 De Septiembre De 2026',
    depart: '07:40',
    arrive: '12:55',
    fromCode: 'GUA',
    toCode: 'CLO',
    brand: 'Light',
    stops: '1 Parada',
    duration: '5h 15m',
  },
  {
    kind: 'vuelta',
    title: 'Cali a Ciudad de Guatemala',
    dateLabel: 'Miércoles, 30 De Septiembre De 2026',
    depart: '14:58',
    arrive: '16:15',
    fromCode: 'CLO',
    toCode: 'GUA',
    brand: 'Light',
    stops: 'Directo',
    duration: '1h 17m',
  },
];
