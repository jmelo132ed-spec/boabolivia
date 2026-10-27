import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('public');
const files = [
  ['https://www.boa.bo/boa.svg', 'favicon-boa.svg'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/b3e6dda0-86a4-468b-9f68-6560d4699339.png', 'images/boa/logo.png'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/e1a5531f-f4f6-4344-a070-a3e7708e6690.jpg', 'images/boa/hero-madrid.jpg'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/8811fbf3-61ee-46b7-a34d-e567af4ada00.jpg', 'images/boa/exp-mascota.jpg'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/2598990a-7e2c-44e8-9730-158270469e45.jpg', 'images/boa/exp-equipaje.jpg'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/72eb1e29-5d6a-426a-9a2f-7729d4db9abd.jpg', 'images/boa/exp-ninos.jpg'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/5e4dc155-88c3-457a-9d8d-81aee2c304e1.jpg', 'images/boa/exp-asiento.jpg'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/bea0dd15-6f09-4060-a477-5f1045b080de.png', 'images/boa/exp-mamas.png'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/2f027e69-22b7-4604-a292-255cd9afe6fd.png', 'images/boa/info-pago.png'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/ec60aec4-76cd-4d89-bb59-ccbb5e7aecd6.png', 'images/boa/info-especiales.png'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/0722627f-5388-4543-a952-e5302274c81d.jpg', 'images/boa/info-docs.jpg'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/ba92e883-7490-4d61-bcca-c361c76a51e5.jpg', 'images/boa/destinos.jpg'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/images/c6ab815d-6f07-492d-93b0-f174b9af57fb.png', 'images/boa/inspire.png'],
  ['https://www.boa.bo/assets/iosa-D-KZA1e7.png', 'images/boa/iosa.png'],
  ['https://www.boa.bo/assets/logoBolivia2026-6RIkbCxl.png', 'images/boa/bolivia-2026.png'],
  ['https://www.boa.bo/assets/instagram-AirKJaVE.png', 'images/boa/instagram.png'],
  ['https://www.boa.bo/assets/twitter-CGYeuuR0.png', 'images/boa/twitter.png'],
  ['https://cdnboa-aab8augderd2cff4.a02.azurefd.net/icons/cfe66386-8e1f-4553-954a-c9ee86579e90.png', 'images/boa/icon-avisos.png'],
  ['https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.woff2', 'fonts/lato-400.woff2'],
  ['https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.woff2', 'fonts/lato-700.woff2'],
  ['https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh50XSwiPGQ.woff2', 'fonts/lato-900.woff2'],
  ['https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh7USSwiPGQ.woff2', 'fonts/lato-300.woff2'],
];

async function save(url, rel) {
  const dest = path.join(OUT, rel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log('ok', rel);
}

for (const [url, rel] of files) {
  try {
    await save(url, rel);
  } catch (err) {
    console.error('fail', rel, err.message);
  }
}
