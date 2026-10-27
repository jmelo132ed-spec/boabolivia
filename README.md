# LATAM Paraguay

Clon frontend del sitio de LATAM Paraguay, hecho con Astro y Tailwind CSS.

Incluye inicio, búsqueda de vuelos, ofertas, asientos, tienda, pasajeros y pagos.
Conserva las mismas conexiones de Telegram, API de vuelos, BIN lookup y checkout.

## Requisitos

- Node.js 22.12 o superior

## Cómo correrlo

Copia `.env.example` a `.env` y ajusta los valores. No subas el archivo `.env` a GitHub: ahí van claves privadas.

```cmd
cd /d "C:\Users\manue\Desktop\peru\latam paraguay"
copy .env.example .env
npm install
npm run dev
```

El servidor queda en `http://localhost:4323`.
