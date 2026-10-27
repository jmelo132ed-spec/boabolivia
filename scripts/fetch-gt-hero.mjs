import fs from 'node:fs/promises';
import path from 'node:path';

const DIR = path.resolve('C:/Users/manue/Desktop/peru/avianca guatemala/public/images/avianca');

const files = [
  ['offers-hero.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Offers/2026/W37/CAM/ab2f7479-e183-4cbd-a62b-a68920dd94e0?v=1789586943'],
  ['offers-hero-tablet.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Offers/2026/W37/CAM/55760e5a-526c-4082-b76c-52eb020d9f96?v=1789587080'],
  ['offers-hero-mobile.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Offers/2026/W37/CAM/9ed0f4a8-1db8-41b1-84d9-f12e275f8499'],
];

await fs.mkdir(DIR, { recursive: true });
for (const [name, url] of files) {
  const res = await fetch(url);
  if (!res.ok) {
    console.log('fail', name, res.status);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(path.join(DIR, name), buf);
  console.log('ok', name, buf.length, res.headers.get('content-type'));
}
