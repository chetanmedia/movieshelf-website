// Downloads the generated cover art into public/covers as optimised JPEGs.
// Runs automatically before `npm run dev` and `npm run build` (Netlify included).
import { mkdir, writeFile, access } from 'node:fs/promises';
import { REMOTE } from '../src/films.js';

if (process.env.SKIP_COVERS) { console.log('covers: skipped'); process.exit(0); }
const out = new URL('../public/covers/', import.meta.url);
await mkdir(out, { recursive: true });
let sharp = null; try { sharp = (await import('sharp')).default; } catch {}

let ok = 0, skipped = 0, failed = 0;
for (const [key, url] of Object.entries(REMOTE)) {
  const file = new URL(`${key}.jpg`, out);
  try { await access(file); skipped++; continue; } catch {}
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) }); if (!res.ok) throw new Error(res.status);
    let buf = Buffer.from(await res.arrayBuffer());
    if (sharp) buf = await sharp(buf).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    await writeFile(file, buf); ok++;
  } catch (e) { failed++; console.warn(`covers: could not fetch ${key} (${e.message}) — the page will draw a fallback`); }
}
console.log(`covers: ${ok} downloaded, ${skipped} already present, ${failed} failed`);
