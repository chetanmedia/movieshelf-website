// Generates the static blog, sitemap, RSS, robots.txt and llms.txt into /public.
// Runs before `vite build` and `vite dev`. Posts dated in the future stay unpublished until that day's build.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, CONTENT, SITE, loadPosts, renderPost, renderIndex, sitemap, rss, robots, llms, slugify } from './blog-lib.mjs';

const PUB = path.join(ROOT, 'public');
const OUT = path.join(PUB, 'blog');
const PER_PAGE = 12;

const write = (rel, html) => { const f = path.join(PUB, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };

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
  write('sitemap.xml', sitemap(posts));
  write('rss.xml', rss(posts));
  write('robots.txt', robots());
  write('llms.txt', llms(posts));
  const upcoming = loadPosts({ includeFuture: true }).length - posts.length;
  if (!quiet) console.log(`blog: ${posts.length} published${upcoming ? `, ${upcoming} scheduled` : ''} → ${SITE.siteUrl}/blog/`);
  return posts;
}

if (import.meta.url === `file://${process.argv[1]}`) buildBlog();
