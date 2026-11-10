// Downloads film data from TMDB (The Movie Database) at build time, for the free tools.
// The key comes from the TMDB_KEY environment variable (set in Netlify), so it never reaches the browser
// or the public repo. Accepts a v3 API key or a v4 read access token.
// Output: data/tmdb/films.json. Refreshed at most once a week; Netlify keeps it between builds
// (netlify/plugins/tmdb-cache). This script never fails the build: on any problem it keeps the old file.
//
// This product uses the TMDB API but is not endorsed or certified by TMDB.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'tmdb', 'films.json');
const API = process.env.TMDB_API_BASE || 'https://api.themoviedb.org/3';
const KEY = (process.env.TMDB_KEY || process.env.TMDB_API_KEY || '').trim();
const MAX_AGE_DAYS = +(process.env.TMDB_MAX_AGE_DAYS || 7);
const POPULAR_PAGES = 100;   // 20 films a page → the 2,000 most-voted films
const GEMS_PAGES = 25;       // ~500 highly rated, less famous films
const XMAS_PAGES = 6;        // ~120 Christmas films (TMDB keyword "christmas")
const XMAS_KEYWORD = 207317;
const log = (...a) => console.log('tmdb:', ...a);

async function tmdb(p, params = {}, tries = 4) {
  const u = new URL(API + p);
  const bearer = KEY.startsWith('eyJ');
  if (!bearer) u.searchParams.set('api_key', KEY);
  for (const [k, v] of Object.entries({ language: 'en-US', ...params })) u.searchParams.set(k, v);
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(u, { headers: { accept: 'application/json', ...(bearer ? { authorization: `Bearer ${KEY}` } : {}) }, signal: AbortSignal.timeout(15000) });
      if (r.status === 429) { await new Promise(s => setTimeout(s, (+(r.headers.get('retry-after') || 2)) * 1000)); continue; }
      if (r.status === 401) throw Object.assign(new Error('TMDB rejected the key (401). Check TMDB_KEY in Netlify.'), { fatal: true });
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${p}`);
      return await r.json();
    } catch (e) {
      if (e.fatal || i === tries - 1) throw e;
      await new Promise(s => setTimeout(s, 600 * (i + 1)));
    }
  }
}

async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]).catch(() => null); } }));
  return out;
}

async function discover(pages, params) {
  const ids = [];
  for (let page = 1; page <= pages; page++) {
    const j = await tmdb('/discover/movie', { include_adult: 'false', include_video: 'false', page, ...params });
    ids.push(...(j.results || []).map(m => m.id));
    if (page >= (j.total_pages || 0)) break;
  }
  return ids;
}

const trim = (s, n) => !s ? '' : s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)) + '…';

export async function fetchFilms({ force = false } = {}) {
  if (!KEY) { log('no TMDB_KEY set, skipping (tools fall back to sample data)'); return false; }
  if (!force && fs.existsSync(OUT)) {
    const age = (Date.now() - fs.statSync(OUT).mtimeMs) / 864e5;
    if (age < MAX_AGE_DAYS) { log(`cached data is ${age.toFixed(1)} days old, keeping it`); return true; }
  }
  const t0 = Date.now();
  try {
    const g = await tmdb('/genre/movie/list');
    const genres = Object.fromEntries((g.genres || []).map(x => [x.id, x.name]));
    const popular = await discover(POPULAR_PAGES, { sort_by: 'vote_count.desc' });
    const gems = await discover(GEMS_PAGES, { sort_by: 'vote_average.desc', 'vote_count.gte': 300, 'vote_count.lte': 4000, 'vote_average.gte': 7.2 });
    const xmas = await discover(XMAS_PAGES, { sort_by: 'vote_count.desc', with_keywords: XMAS_KEYWORD, 'vote_count.gte': 80 });
    const tags = new Map();
    const tag = (ids, t) => ids.forEach(id => { const s = tags.get(id) || new Set(); s.add(t); tags.set(id, s); });
    tag(popular, 'p'); tag(gems, 'h'); tag(xmas, 'x');
    const ids = [...tags.keys()];
    log(`fetching details for ${ids.length} films…`);
    const details = await pool(ids, 8, id => tmdb(`/movie/${id}`, { append_to_response: 'credits' }));
    const films = details.filter(Boolean).filter(m => m.title && m.release_date).map(m => {
      const t = tags.get(m.id);
      return {
        i: m.id, t: m.title, y: +m.release_date.slice(0, 4), r: m.runtime || 0,
        g: (m.genres || []).map(x => x.id), o: trim(m.overview, 260), tg: m.tagline || '',
        d: (m.credits?.crew || []).filter(c => c.job === 'Director').map(c => c.name).slice(0, 2),
        c: (m.credits?.cast || []).slice(0, 4).map(c => c.name),
        p: m.poster_path || '', v: Math.round((m.vote_average || 0) * 10) / 10, n: m.vote_count || 0,
        l: m.original_language || '', ...(t.has('x') ? { x: 1 } : {}), ...(t.has('h') && !t.has('p') ? { h: 1 } : {}),
      };
    });
    if (films.length < 300) throw new Error(`only ${films.length} films came back`);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), source: 'TMDB', genres, films }));
    log(`saved ${films.length} films (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    return true;
  } catch (e) {
    log(`download failed: ${e.message.replace(/\.$/, '')}. ${fs.existsSync(OUT) ? 'Keeping the previous data.' : 'Tools fall back to sample data.'}`);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) fetchFilms({ force: process.argv.includes('--force') });
