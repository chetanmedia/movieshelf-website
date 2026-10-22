// Movieshelf blog: Markdown in content/blog → static, crawlable HTML in public/blog.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const CONTENT = path.join(ROOT, 'content/blog');
const cfgFile = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
// On Netlify, URL is the site's primary address (custom domain once you add one).
export const SITE = { ...cfgFile, siteUrl: (process.env.SITE_URL || cfgFile.siteUrl || process.env.URL).replace(/\/$/, '') };

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const slugify = s => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const abs = p => SITE.siteUrl + (p.startsWith('/') ? p : '/' + p);
const iso = d => new Date(d).toISOString();
const ymd = d => new Date(d).toISOString().slice(0, 10);
const human = d => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/* ---------- loading ---------- */
export function loadPosts({ includeFuture = false, includeDrafts = false } = {}) {
  if (!fs.existsSync(CONTENT)) return [];
  const today = new Date(); today.setUTCHours(23, 59, 59, 999);
  const posts = fs.readdirSync(CONTENT).filter(f => f.endsWith('.md') && !f.startsWith('_')).map(file => {
    const raw = fs.readFileSync(path.join(CONTENT, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = data.slug || file.replace(/\.md$/, '');
    const words = content.replace(/<[^>]+>|\{\{[^}]+\}\}|[#>*_`|\-]/g, ' ').split(/\s+/).filter(Boolean).length;
    return {
      ...data, slug, file, body: content, words,
      date: new Date(data.date), updated: new Date(data.updated || data.date),
      category: data.category || 'Guides', tags: data.tags || [], faq: data.faq || [],
      url: `/blog/${slug}/`, minutes: Math.max(1, Math.round(words / 230)),
      coverUrl: data.cover ? `/blog/${data.cover.replace(/^\.?\/?/, '')}` : '/og/default.jpg',
    };
  });
  return posts
    .filter(p => (includeDrafts || !p.draft) && (includeFuture || p.date <= today))
    .sort((a, b) => b.date - a.date || a.title.localeCompare(b.title));
}

/* ---------- markdown ---------- */
function renderMarkdown(post, posts) {
  const toc = [];
  const md = new Marked({ gfm: true });
  md.use({
    renderer: {
      heading(text, depth, raw) {
        const id = slugify(raw);
        if (depth === 2 || depth === 3) toc.push({ id, text: raw.replace(/<[^>]+>/g, ''), depth });
        if (depth === 2) return `<h2 id="${id}"><a class="anchor" href="#${id}" aria-label="Link to this section">#</a>${text}</h2>\n`;
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
      link(href, title, text) {
        const ext = /^https?:\/\//.test(href) && !href.startsWith(SITE.siteUrl);
        return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ''}${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
      },
      image(href, title, text) {
        return `<figure><img src="${esc(href)}" alt="${esc(text)}" loading="lazy" decoding="async">${title ? `<figcaption>${esc(title)}</figcaption>` : ''}</figure>`;
      },
      table(header, body) { return `<div class="table"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>\n`; },
    },
  });
  let html = md.parse(post.body);
  html = html.replace(/<p>\{\{app-cta\}\}<\/p>|\{\{app-cta\}\}/g, appCta('inline'))
    .replace(/<p>\{\{app-cta-end\}\}<\/p>|\{\{app-cta-end\}\}/g, appCta('end'))
    .replace(/<p>\{\{faq\}\}<\/p>|\{\{faq\}\}/g, faqHtml(post.faq))
    .replace(/<p>\{\{related:([a-z0-9-]+)\}\}<\/p>/g, (_, s) => { const r = posts.find(p => p.slug === s); return r ? `<p class="also">Related: <a href="${r.url}">${esc(r.title)}</a></p>` : ''; });
  if (!/class="faq"/.test(html) && post.faq.length) html += `<h2 id="faq">Frequently asked questions</h2>` + faqHtml(post.faq);
  return { html, toc };
}

const faqHtml = faq => !faq.length ? '' : `<div class="faq">${faq.map((f, i) =>
  `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><div><p>${esc(f.a)}</p></div></details>`).join('')}</div>`;

/* ---------- shared pieces ---------- */
const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="7" width="6" height="20" rx="1.5" fill="#6b8aff"/><rect x="11" y="4" width="6" height="23" rx="1.5" fill="#eef0f8"/><rect x="20.5" y="8" width="6" height="19" rx="1.5" fill="#ffb547" transform="rotate(12 23.5 27)"/><rect x="1" y="27" width="30" height="2.5" rx="1.2" fill="#969cb2"/></svg>`;
const APPLE = `<svg viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>`;
export const storeBadge = (src = 'blog') => `<a class="store" href="${SITE.appStoreUrl}?ct=${src}&amp;mt=8" target="_blank" rel="noopener" aria-label="Download Movieshelf on the App Store">${APPLE}<span><small>Download on the</small><b>App Store</b></span></a>`;

function appCta(kind) {
  if (kind === 'end') return `<aside class="cta-end" aria-label="Get Movieshelf">
    <div><span class="eyebrow"><i></i>Movieshelf for iPhone</span><h2 class="cta-h">Your whole collection, <em>one scan at a time.</em></h2>
    <p>Scan barcodes in batches of ten, track editions and formats, and know which shelf every disc lives on. Free for your first 25 titles.</p>
    ${storeBadge('blog-end')}</div></aside>`;
  return `<aside class="cta-card" aria-label="Get Movieshelf"><span class="cta-icon">${LOGO}</span>
    <div><b>Catalog your discs with Movieshelf</b><p>Scan up to 10 barcodes in one pass, track DVD, Blu-ray and 4K UHD editions, and find any disc's shelf in seconds. Free to start on iPhone.</p></div>
    ${storeBadge('blog-inline')}</aside>`;
}

function head({ title, description, url, image, imageAlt, type = 'website', jsonld = [], extra = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${abs(url)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="theme-color" content="#07080c">
<meta name="apple-itunes-app" content="app-id=${SITE.appStoreId}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${abs(url)}">
<meta property="og:image" content="${abs(image)}">
<meta property="og:image:alt" content="${esc(imageAlt || title)}">
<meta property="og:locale" content="${SITE.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${abs(image)}">
${extra}
<link rel="alternate" type="application/rss+xml" title="${esc(SITE.blog.title)}" href="${abs('/rss.xml')}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Figtree:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/blog-assets/blog.css">
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body>`;
}

const nav = active => `<header class="nav"><div class="nav-in">
  <a class="logo" href="/" aria-label="Movieshelf home">${LOGO}movieshelf</a>
  <nav aria-label="Primary"><a href="/#scan">Scanning</a><a href="/#organize">Organize</a><a href="/#features">Features</a><a href="/#pricing">Pricing</a><a href="/blog/"${active ? ' aria-current="page"' : ''}>Journal</a></nav>
  <a class="btn btn-accent" href="${SITE.appStoreUrl}?ct=blog-nav&amp;mt=8" target="_blank" rel="noopener">Get the app</a>
</div></header>`;

const footer = cats => `<footer class="foot"><div class="wrap">
  <div class="foot-top"><a class="logo" href="/">${LOGO}movieshelf</a>${storeBadge('blog-footer')}</div>
  <div class="foot-cols">
    <div><b>App</b><a href="/#scan">Barcode scanning</a><a href="/#organize">Organize your shelf</a><a href="/#boxsets">Box sets</a><a href="/#pricing">Pricing</a><a href="/#faq">FAQ</a></div>
    <div><b>Journal</b><a href="/blog/">All articles</a>${cats.map(c => `<a href="/blog/category/${slugify(c)}/">${esc(c)}</a>`).join('')}<a href="/rss.xml">RSS feed</a></div>
    <div><b>Company</b><a href="${SITE.appStoreUrl}" target="_blank" rel="noopener">App Store</a><a href="${SITE.privacyUrl}" target="_blank" rel="noopener">Privacy</a><a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener">Terms of Use</a></div>
  </div>
  <p class="legal">© ${new Date().getFullYear()} Movieshelf · Made by ${esc(SITE.author.name)}. Movie titles and artwork belong to their respective owners. Apple, the Apple logo, App Store and iPhone are trademarks of Apple Inc.</p>
</div></footer>
<script src="/blog-assets/blog.js" defer></script>
</body></html>`;

const card = (p, big = false) => `<article class="card${big ? ' big' : ''}">
  <a class="card-img" href="${p.url}" tabindex="-1" aria-hidden="true"><img src="${p.coverUrl}" alt="" loading="${big ? 'eager' : 'lazy'}" decoding="async" width="1600" height="900"></a>
  <div class="card-body"><a class="pill" href="/blog/category/${slugify(p.category)}/">${esc(p.category)}</a>
  <h${big ? 2 : 3}><a href="${p.url}">${esc(p.title)}</a></h${big ? 2 : 3}>
  <p>${esc(p.summary || p.description)}</p>
  <span class="meta"><time datetime="${ymd(p.date)}">${human(p.date)}</time> · ${p.minutes} min read</span></div></article>`;

const orgLd = () => ({ '@type': 'Organization', '@id': abs('/#org'), name: SITE.name, url: abs('/'), logo: { '@type': 'ImageObject', url: abs('/logo-512.png'), width: 512, height: 512 }, sameAs: [SITE.appStoreUrl] });

/* ---------- pages ---------- */
export function renderPost(post, posts) {
  const { html, toc } = renderMarkdown(post, posts);
  const related = posts.filter(p => p.slug !== post.slug)
    .map(p => ({ p, s: p.tags.filter(t => post.tags.includes(t)).length * 2 + (p.category === post.category ? 1 : 0) }))
    .sort((a, b) => b.s - a.s || b.p.date - a.p.date).slice(0, 3).map(x => x.p);
  const cats = [...new Set(posts.map(p => p.category))];
  const title = post.seoTitle || post.title;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': abs(post.url) + '#article', headline: post.title, description: post.description,
      image: [abs(post.coverUrl)], datePublished: iso(post.date), dateModified: iso(post.updated), inLanguage: 'en',
      author: { '@type': 'Person', name: post.author || SITE.author.name, description: SITE.author.bio, url: abs('/blog/') },
      publisher: orgLd(), mainEntityOfPage: { '@type': 'WebPage', '@id': abs(post.url) }, articleSection: post.category,
      keywords: post.tags.join(', '), wordCount: post.words,
      about: { '@type': 'MobileApplication', name: SITE.name, operatingSystem: 'iOS', applicationCategory: 'EntertainmentApplication', url: SITE.appStoreUrl } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
      { '@type': 'ListItem', position: 2, name: 'Journal', item: abs('/blog/') },
      { '@type': 'ListItem', position: 3, name: post.category, item: abs(`/blog/category/${slugify(post.category)}/`) },
      { '@type': 'ListItem', position: 4, name: post.title, item: abs(post.url) }] },
  ];
  if (post.faq.length) jsonld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: post.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });

  return head({ title: `${title} | ${SITE.name}`, description: post.description, url: post.url, image: post.coverUrl, imageAlt: post.coverAlt, type: 'article', jsonld,
    extra: `<meta property="article:published_time" content="${iso(post.date)}">\n<meta property="article:modified_time" content="${iso(post.updated)}">\n<meta property="article:section" content="${esc(post.category)}">\n${post.tags.map(t => `<meta property="article:tag" content="${esc(t)}">`).join('\n')}\n<meta name="author" content="${esc(post.author || SITE.author.name)}">` })
  + nav(true) + `
<main class="post">
  <div class="progress" aria-hidden="true"><i></i></div>
  <header class="post-head wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog/">Journal</a><span>/</span><a href="/blog/category/${slugify(post.category)}/">${esc(post.category)}</a></nav>
    <h1>${esc(post.title)}</h1>
    ${post.summary ? `<p class="dek">${esc(post.summary)}</p>` : ''}
    <div class="byline"><span class="av" aria-hidden="true">${esc((post.author || SITE.author.name)[0])}</span>
      <span><b>${esc(post.author || SITE.author.name)}</b><small>${esc(SITE.author.role)}</small></span>
      <span class="sep"></span>
      <span><small>Published</small><time datetime="${ymd(post.date)}">${human(post.date)}</time></span>
      ${+post.updated > +post.date ? `<span><small>Updated</small><time datetime="${ymd(post.updated)}">${human(post.updated)}</time></span>` : ''}
      <span><small>Reading time</small>${post.minutes} min</span></div>
  </header>
  <figure class="post-cover wrap"><img src="${post.coverUrl}" alt="${esc(post.coverAlt || post.title)}" width="1600" height="900" fetchpriority="high" decoding="async"></figure>
  <div class="post-grid wrap">
    <aside class="toc" aria-label="On this page"><b>On this page</b><ol>${toc.filter(t => t.depth === 2).map(t => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol>
      <div class="toc-app"><span>${LOGO}</span><p>Catalog your collection with Movieshelf.</p>${storeBadge('blog-toc')}</div></aside>
    <article class="prose">${html}</article>
  </div>
  <section class="wrap author-box" aria-label="About the author"><span class="av lg">${esc((post.author || SITE.author.name)[0])}</span><div><b>${esc(post.author || SITE.author.name)}</b><p>${esc(SITE.author.bio)}</p></div></section>
  ${related.length ? `<section class="wrap related" aria-label="Related articles"><h2>Keep reading</h2><div class="grid">${related.map(p => card(p)).join('')}</div></section>` : ''}
</main>` + footer(cats);
}

export function renderIndex(posts, { page = 1, pages = 1, category = null, all = posts } = {}) {
  const cats = [...new Set(all.map(p => p.category))];
  const base = category ? `/blog/category/${slugify(category)}/` : '/blog/';
  const url = page > 1 ? `${base}page/${page}/` : base;
  const title = category ? `${category} | ${SITE.blog.title}` : (page > 1 ? `${SITE.blog.title}, page ${page}` : `${SITE.blog.title}: DVD, Blu-ray & 4K Collecting Guides`);
  const desc = category ? `${category} from the Movieshelf Journal: practical articles for DVD, Blu-ray and 4K UHD collectors.` : SITE.blog.description;
  const [lead, ...rest] = page === 1 && !category ? posts : [null, ...posts];
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Blog', '@id': abs('/blog/#blog'), name: SITE.blog.title, description: SITE.blog.description, url: abs('/blog/'), publisher: orgLd(), inLanguage: 'en',
      blogPost: posts.slice(0, 20).map(p => ({ '@type': 'BlogPosting', headline: p.title, url: abs(p.url), datePublished: iso(p.date), image: abs(p.coverUrl) })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') }, { '@type': 'ListItem', position: 2, name: 'Journal', item: abs('/blog/') },
      ...(category ? [{ '@type': 'ListItem', position: 3, name: category, item: abs(base) }] : [])] },
  ];
  const prev = page > 1 ? (page === 2 ? base : `${base}page/${page - 1}/`) : null, next = page < pages ? `${base}page/${page + 1}/` : null;
  return head({ title, description: desc, url, image: lead ? lead.coverUrl : '/og/default.jpg', jsonld,
    extra: `${prev ? `<link rel="prev" href="${abs(prev)}">` : ''}${next ? `<link rel="next" href="${abs(next)}">` : ''}` })
  + nav(true) + `
<main class="index">
  <header class="index-head wrap">
    <span class="eyebrow"><i></i>${category ? 'Category' : 'The Movieshelf Journal'}</span>
    <h1>${category ? esc(category) : 'Guides for people who <em>still buy discs.</em>'}</h1>
    <p class="lede">${category ? esc(desc) : 'Cataloging, shelving, editions, formats and the small habits that make a physical movie collection a joy to own. New articles every day.'}</p>
    <nav class="chips" aria-label="Categories"><a href="/blog/"${!category ? ' aria-current="page"' : ''}>All</a>${cats.map(c => `<a href="/blog/category/${slugify(c)}/"${c === category ? ' aria-current="page"' : ''}>${esc(c)}</a>`).join('')}</nav>
  </header>
  ${lead ? `<section class="wrap lead">${card(lead, true)}</section>` : ''}
  ${rest.length ? `<section class="wrap"><div class="grid">${rest.map(p => card(p)).join('')}</div></section>` : ''}
  ${!posts.length ? '<p class="wrap empty">The first articles are on their way.</p>' : ''}
  ${pages > 1 ? `<nav class="wrap pager" aria-label="Pagination">${prev ? `<a href="${prev}">← Newer</a>` : '<span></span>'}<span>Page ${page} of ${pages}</span>${next ? `<a href="${next}">Older →</a>` : '<span></span>'}</nav>` : ''}
  <section class="wrap">${appCta('end')}</section>
</main>` + footer(cats);
}

/* ---------- feeds ---------- */
export function sitemap(posts) {
  const cats = [...new Set(posts.map(p => p.category))];
  const latest = posts[0] ? ymd(posts[0].updated) : ymd(new Date());
  const urls = [
    { loc: '/', lastmod: ymd(new Date()), pri: '1.0', freq: 'weekly' },
    { loc: '/blog/', lastmod: latest, pri: '0.9', freq: 'daily' },
    ...cats.map(c => ({ loc: `/blog/category/${slugify(c)}/`, lastmod: latest, pri: '0.6', freq: 'daily' })),
    ...posts.map(p => ({ loc: p.url, lastmod: ymd(p.updated), pri: '0.8', freq: 'monthly', img: p.coverUrl, imgTitle: p.coverAlt || p.title })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url><loc>${abs(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority>${u.img ? `<image:image><image:loc>${abs(u.img)}</image:loc><image:title>${esc(u.imgTitle)}</image:title></image:image>` : ''}</url>`).join('\n')}
</urlset>\n`;
}

export function rss(posts) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(SITE.blog.title)}</title>
<link>${abs('/blog/')}</link>
<atom:link href="${abs('/rss.xml')}" rel="self" type="application/rss+xml"/>
<description>${esc(SITE.blog.description)}</description>
<language>en</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${posts.slice(0, 40).map(p => `<item><title>${esc(p.title)}</title><link>${abs(p.url)}</link><guid isPermaLink="true">${abs(p.url)}</guid><pubDate>${p.date.toUTCString()}</pubDate><category>${esc(p.category)}</category><description>${esc(p.description)}</description></item>`).join('\n')}
</channel>
</rss>\n`;
}

export function robots() {
  const ai = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'Bingbot', 'CCBot'];
  return `# Movieshelf: everyone is welcome to read and cite this site.
User-agent: *
Allow: /

${ai.map(a => `User-agent: ${a}\nAllow: /`).join('\n\n')}

Sitemap: ${abs('/sitemap.xml')}
`;
}

export function llms(posts) {
  return `# ${SITE.name}

> ${SITE.description}

Movieshelf is an iPhone app (iOS 15.1 or later) for people who collect physical movies. Key facts:

- Catalogs DVD, Blu-ray and 4K UHD discs by scanning the barcode on the case, searching by title, or importing a CSV list.
- Queues up to 10 barcodes in one scan pass, then imports them together.
- Tracks editions, box sets, formats, audio, subtitles, custom fields and notes for each disc.
- Records the shelf location of every disc and warns before you add a film you already own.
- Collections (folders), Watchlist and Wishlist.
- Free to start: up to 25 titles and 10 collection folders. Premium (monthly, annual with free trial, or lifetime) removes the limits.
- Download: ${SITE.appStoreUrl}

## Pages

- [Home](${abs('/')}): what Movieshelf does, features and pricing.
- [Movieshelf Journal](${abs('/blog/')}): guides for DVD, Blu-ray and 4K UHD collectors.

## Articles

${posts.map(p => `- [${p.title}](${abs(p.url)}): ${p.description}`).join('\n')}
`;
}

/* ---------- landing page snippets (used by the Vite plugin) ---------- */
export function latestSection(posts) {
  const top = posts.slice(0, 3);
  if (!top.length) return '';
  return `<section class="journal" id="journal" aria-labelledby="journal-h"><div class="wrap">
    <div class="journal-head"><div><span class="eyebrow"><i></i>The Movieshelf Journal</span><h2 id="journal-h" class="rv" style="margin-top:18px">Collect smarter. <em>Read the guides.</em></h2></div>
    <a class="link" href="/blog/">All articles <span>→</span></a></div>
    <div class="journal-grid">${top.map(p => `<article class="jcard"><a href="${p.url}"><span class="jimg"><img src="${p.coverUrl}" alt="" loading="lazy" decoding="async" width="1600" height="900"></span>
      <span class="jcat">${esc(p.category)} · ${p.minutes} min read</span><h3>${esc(p.title)}</h3><p>${esc(p.summary || p.description)}</p></a></article>`).join('')}</div>
  </div></section>`;
}

export function landingJsonLd() {
  return [
    { '@context': 'https://schema.org', '@type': 'WebSite', '@id': abs('/#website'), name: SITE.name, url: abs('/'), description: SITE.description, publisher: { '@id': abs('/#org') }, inLanguage: 'en' },
    { '@context': 'https://schema.org', ...orgLd() },
    { '@context': 'https://schema.org', '@type': 'MobileApplication', '@id': abs('/#app'), name: 'MovieShelf: Media Organizer', alternateName: 'Movieshelf',
      operatingSystem: 'iOS 15.1 or later', applicationCategory: 'EntertainmentApplication', description: SITE.description, url: abs('/'), downloadUrl: SITE.appStoreUrl, installUrl: SITE.appStoreUrl,
      image: abs('/og/default.jpg'), author: { '@type': 'Person', name: SITE.author.name }, publisher: { '@id': abs('/#org') },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', category: 'Free', availability: 'https://schema.org/InStock' },
      featureList: ['Barcode scanning for DVD, Blu-ray and 4K UHD', 'Bulk scan up to 10 barcodes at a time', 'Bulk CSV import', 'Shelf locations', 'Duplicate warnings', 'Box set tracking', 'Custom fields and notes', 'Collections, Watchlist and Wishlist', 'Collection analytics'] },
  ];
}
export { abs, iso, ymd };
