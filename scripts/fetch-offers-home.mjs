import fs from 'node:fs/promises';
import path from 'node:path';

const DIR = path.resolve('C:/Users/manue/Desktop/peru/avianca guatemala/public/images/avianca');

const files = [
  ['offers-hero.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Offers/2026/W32/SAM/326306b8-262f-41a8-ac86-97ce7b9bd882'],
  ['offers-hero-mobile.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Offers/2026/W32/SAM/326306b8-262f-41a8-ac86-97ce7b9bd882'],
  ['mia.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Cities/MIA/Destination%20Card/52b9f457-608c-48ec-b982-5461583611bc'],
  ['was.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Cities/WAS/Destination%20Card/9e67ba07-7586-4a51-b47c-49d81c2a1d55'],
  ['flores.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Cities/FRS/Destination%20Card/126da56e-1e20-4ac1-b8ff-653e1001a953'],
  ['cun.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Cities/CUN/Destination%20Card/07194ceb-2e70-42fa-8add-7d9fa3822553'],
  ['mex.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Cities/MEX/Destination%20Card/e0855f63-6ac9-462a-91e7-c3d52fdbaa04'],
  ['mga.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Cities/MGA/Destination%20Card/0a489f17-0d27-415e-9665-798dc479b5cf'],
  ['pty.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Cities/PTY/Destination%20Card/d4ca53ce-a19e-4c8e-9246-ad38c5d8093f'],
  ['ctg.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Cities/CTG/Destination%20Card/d6dbb73b-ec27-47ad-a884-c504c27092c9'],
  ['baq.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Cities/BAQ/Destination%20Card/e74a2f92-d11c-4e34-8910-52c288eca1f9'],
  ['sjo.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Cities/SJO/Destination%20Card/24719518-874b-4749-b4d7-2750e2b4e22c'],
  ['mde.jpg', 'https://apairmarketingstoragepro.blob.core.windows.net/media/Avianca/Cities/MDE/Destination%20Card/b49fbd2e-7fc1-42bc-ad89-372b4df3b7cb'],
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
  console.log('ok', name, buf.length);
}
