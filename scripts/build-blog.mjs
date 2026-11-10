// Generates the static blog, sitemap, RSS, robots.txt and llms.txt into /public.
// Runs before `vite build` and `vite dev`. Posts dated in the future stay unpublished until that day's build.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, CONTENT, SITE, loadPosts, loadPages, renderPage, loadTools, renderTool, renderToolsHub, renderPost, renderIndex, sitemap, rss, robots, llms, slugify } from './blog-lib.mjs';

const PUB = path.join(ROOT, 'public');
const OUT = path.join(PUB, 'blog');
const PER_PAGE = 12;

const write = (rel, html) => { const f = path.join(PUB, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };

function filmData() {
  const live = path.join(ROOT, 'data', 'tmdb', 'films.json');
  const sample = path.join(ROOT, 'tools', 'random-movie', '_sample.json');
  const f = fs.existsSync(live) ? live : sample;
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { films: [], genres: {} };
}
const normTitle = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'and').replace(/^(the|a|an) /, '').replace(/[^a-z0-9]+/g, '');
function buildPuzzles(t, quiet) {
  const src = JSON.parse(fs.readFileSync(path.join(t.dir, '_puzzles.json'), 'utf8'));
  const { films } = filmData();
  const by = new Map();
  for (const f of films) { const k = normTitle(f.t); if (!by.has(k)) by.set(k, []); by.get(k).push(f); }
  const notes = [];
  const out = src.puzzles.map((p, i) => {
    const cands = [p.t, ...(p.alt || [])].flatMap(x => by.get(normTitle(x)) || []);
    const f = cands.sort((a, b) => Math.abs(a.y - p.y) - Math.abs(b.y - p.y) || b.n - a.n)[0];
    const q = { ...p };
    if (f && Math.abs(f.y - p.y) <= 1) {
      q.i = f.i; q.poster = f.p || '';
      if (f.y !== p.y) notes.push(`#${i + 1} ${p.t}: year ${p.y} vs TMDB ${f.y}`);
      const dirs = (f.d || []).map(normTitle), mine = p.d.split(/\s*&\s*/).map(normTitle);
      if (dirs.length && !mine.some(m => dirs.some(d => d.includes(m) || m.includes(d)))) notes.push(`#${i + 1} ${p.t}: director "${p.d}" vs TMDB "${f.d.join(', ')}"`);
      if (f.c?.length && !f.c.map(normTitle).includes(normTitle(p.a))) notes.push(`#${i + 1} ${p.t}: lead "${p.a}" not in TMDB top cast (${f.c.join(', ')})`);
    }
    return q;
  });
  const matched = out.filter(q => q.i).length;
  const enc = Buffer.from(JSON.stringify({ start: src.start, puzzles: out }), 'utf8').toString('base64').split('').reverse().join('');
  fs.writeFileSync(path.join(PUB, 'tools', t.slug, 'puzzles.dat'), enc);
  if (!quiet) { console.log(`tools: ${t.slug} has ${out.length} puzzles, ${matched} checked against film data`); notes.forEach(n => console.log('  check:', n)); }
}

export function buildBlog({ quiet = false } = {}) {
  fs.rmSync(OUT, { recursive: true, force: true });
  const posts = loadPosts();
  // images
  const img = path.join(CONTENT, 'images');
  if (fs.existsSync(img)) fs.cpSync(img, path.join(OUT, 'images'), { recursive: true });
  // posts
  for (const p of posts) write(`blog/${p.slug}/index.html`, renderPost(p, posts));
  // index + pagination
  const pages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  for (let i = 1; i <= pages; i++) write(i === 1 ? 'blog/index.html' : `blog/page/${i}/index.html`, renderIndex(posts.slice((i - 1) * PER_PAGE, i * PER_PAGE), { page: i, pages, all: posts }));
  // categories
  for (const c of new Set(posts.map(p => p.category))) {
    const list = posts.filter(p => p.category === c), cp = Math.max(1, Math.ceil(list.length / PER_PAGE));
    for (let i = 1; i <= cp; i++) write(i === 1 ? `blog/category/${slugify(c)}/index.html` : `blog/category/${slugify(c)}/page/${i}/index.html`, renderIndex(list.slice((i - 1) * PER_PAGE, i * PER_PAGE), { page: i, pages: cp, category: c, all: posts }));
  }
  const sitePages = loadPages(), allCats = [...new Set(posts.map(p => p.category))];
  for (const pg of sitePages) write(`${pg.slug}/index.html`, renderPage({ ...pg, cats: allCats }));
  // free tools
  fs.rmSync(path.join(PUB, 'tools'), { recursive: true, force: true });
  const tools = loadTools();
  for (const t of tools) {
    // files starting with _ are source material and stay private (e.g. _sample.json)
    for (const f of fs.readdirSync(t.dir)) if (!/\.(md|html)$/.test(f) && !f.startsWith('_') && f !== 'card.svg') fs.cpSync(path.join(t.dir, f), path.join(PUB, 'tools', t.slug, f), { recursive: true });
    // tools that use the TMDB film data share /tools/films.json (falls back to the tool's _sample.json)
    if (t.data === 'films') {
      const live = path.join(ROOT, 'data', 'tmdb', 'films.json'), sample = path.join(t.dir, '_sample.json');
      const src = fs.existsSync(live) ? live : sample;
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(PUB, 'tools', 'films.json')); // shared by every film tool
      if (!quiet) console.log(`tools: ${t.slug} uses ${src === live ? 'TMDB' : 'sample'} film data`);
    }
    write(`tools/${t.slug}/index.html`, renderTool(t, posts));
  }
  if (tools.length) write('tools/index.html', renderToolsHub(posts));
  // daily puzzles for Guess the Movie: checked against the film data and published scrambled (no spoilers in view-source)
  for (const t of tools) if (fs.existsSync(path.join(t.dir, '_puzzles.json'))) buildPuzzles(t, quiet);
  // quiz questions are published scrambled too, so the answers aren't sitting in view-source
  for (const t of tools) {
    const q = path.join(t.dir, '_questions.json');
    if (!fs.existsSync(q)) continue;
    const enc = Buffer.from(fs.readFileSync(q, 'utf8').replace(/\n/g, ''), 'utf8').toString('base64').split('').reverse().join('');
    fs.writeFileSync(path.join(PUB, 'tools', t.slug, 'questions.dat'), enc);
  }
  write('sitemap.xml', sitemap(posts, sitePages));
  write('rss.xml', rss(posts));
  write('robots.txt', robots());
  write('llms.txt', llms(posts));
  const upcoming = loadPosts({ includeFuture: true }).length - posts.length;
  if (!quiet) console.log(`blog: ${posts.length} published${upcoming ? `, ${upcoming} scheduled` : ''} → ${SITE.siteUrl}/blog/`);
  return posts;
}

if (import.meta.url === `file://${process.argv[1]}`) buildBlog();
