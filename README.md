# Movieshelf landing page

A WebGL landing page for the Movieshelf iPhone app: lit 3D disc cases built from real cover scans, a scroll-driven barcode scan, a box set that unpacks, and a pull-from-the-shelf wall.

Built with Vite, Three.js, GSAP ScrollTrigger and Lenis.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production files in dist/
```

## Deploy to Netlify

- **Git deploy (recommended):** push this folder to a repo and import it in Netlify. `netlify.toml` already sets the build command (`npm run build`) and publish folder (`dist`).
- **Drag and drop:** run `npm run build`, then drop the `dist/` folder onto https://app.netlify.com/drop.

`npm run dev` and `npm run build` first run `scripts/fetch-covers.mjs`, which downloads the generated box-set artwork into `public/covers/`. If it can't be downloaded, the page draws a fallback cover instead.

## Where things live

| What | File |
| --- | --- |
| Page markup and copy | `index.html` |
| Styles | `src/style.css` |
| Scroll, sections, pricing toggle, FAQ | `src/main.js` |
| Film list (titles, formats, scans) | `src/films.js` |
| Case, disc and material builder | `src/three/common.js` |
| Hero (floating cases) | `src/three/hero.js` |
| Barcode scan sequence | `src/three/scan.js` |
| Box set unpacking | `src/three/boxset.js` |
| Shelf wall | `src/three/wall.js` |
| Cover scans (front / spine / back) | `public/scans/` |
| App screens shown on the phone (HTML) | `src/app-ui.js`, `src/app-ui.css` |
| Collector tools tiles | `src/bento.js`, `src/bento.css` |
| Phone demos (swipe, filters, folders, watchlist) | `src/app-demos.js` |
| Shelf photos: pull a disc, scan its barcode | `src/shelfmagic.js`, `src/shelfmagic.css`, `public/shelves/`, `src/shelves.json` (spine slots) |
| Scanning phone (shared by shelf + finale) | `src/scanphone.js` |
| Finale conveyor | `src/three/finale.js` |

## Adding a film

1. Split the full cover wrap into `name-front.jpg`, `name-spine.jpg` and `name-back.jpg` and put them in `public/scans/`.
2. Add an entry to `FILMS` in `src/films.js` with `fmt: 'dvd' | 'bluray' | 'uhd'`.

The scan sequence uses the first film in `FILMS` (`DEMO`). Films with a `bc` entry (barcode position on the back scan and its printed number) can be scanned by the phone in the shelf and finale sections.

## Note on artwork

The cover scans are studio artwork. Collector apps commonly show them, but if you want to avoid any rights question on a marketing page, swap them for your own photos or for original art, and keep the footer note.

---

# The Movieshelf Journal (blog)

Posts are Markdown files in `content/blog/`. At build time `scripts/build-blog.mjs` turns them into static HTML pages in `/blog/`, and also writes `sitemap.xml`, `rss.xml`, `robots.txt` and `llms.txt`. The three newest posts appear in the "Journal" section of the landing page.

```bash
npm run new-post -- "How to Store Blu-rays" 2026-10-25   # creates content/blog/how-to-store-blu-rays.md
npm run dev                                               # live preview at /blog/
```

- **Scheduling:** a post whose `date` is in the future is not published until a build runs on or after that date. Write a week of posts ahead, commit them, and the daily rebuild publishes one per day.
- **Rules for every post:** `content/blog/_STYLE.md`. **Keyword backlog:** `content/blog/_topics.md`. Files starting with `_` are never published.
- **Shortcodes:** `{{app-cta}}`, `{{app-cta-end}}`, `{{faq}}` (renders the `faq:` front matter), `{{related:slug}}`.

## What's built in for Google and AI search

| | |
|---|---|
| Crawling | `sitemap.xml` (with image entries and `lastmod`), `robots.txt` that allows Googlebot, Bingbot and the AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Applebot-Extended), RSS feed |
| AI / GEO | `llms.txt` summary of the app and every post; answer-first openings; FAQ blocks; factual tables |
| Structured data | `BlogPosting`, `BreadcrumbList`, `FAQPage` on posts; `Blog` on the index; `MobileApplication`, `Organization`, `WebSite`, `FAQPage` on the home page |
| Page signals | One H1, canonical URLs, Open Graph and Twitter cards, `apple-itunes-app` Smart App Banner, author box, internal related posts, fast static HTML (no JS needed to read) |

## Step-by-step: Netlify setup (one time, ~15 minutes)

1. **Put the project on GitHub.** Create an empty repo (e.g. `movieshelf-web`), then in this folder:
   ```bash
   git init && git add . && git commit -m "Movieshelf site"
   git branch -M main
   git remote add origin https://github.com/<you>/movieshelf-web.git
   git push -u origin main
   ```
2. **Import into Netlify.** app.netlify.com → *Add new project* → *Import an existing project* → GitHub → pick the repo. Build command `npm run build`, publish directory `dist` (both already in `netlify.toml`). Deploy.
3. **Domain.** *Domain management* → add your domain (e.g. `movieshelf.app`) and turn on HTTPS. Then set `siteUrl` in `site.config.json` to that exact domain (no trailing slash) and push. Every canonical URL, the sitemap and the feeds use it. (Without a custom domain, Netlify's `URL` variable is used automatically.)
4. **Daily build hook.** *Project configuration → Build & deploy → Build hooks → Add build hook* (name it "daily"). Copy the URL.
5. **Daily trigger.** On GitHub: *Settings → Secrets and variables → Actions → New repository secret*, name `NETLIFY_BUILD_HOOK`, value = the hook URL. The included workflow `.github/workflows/daily-build.yml` calls it every day at 06:07 UTC, so scheduled posts go live on their date. (*Actions → Daily publish → Run workflow* tests it.)
6. **Google Search Console.** search.google.com/search-console → *Add property* → *Domain* → verify with the DNS TXT record (Netlify DNS: *Domain management → DNS records → Add*). Then *Sitemaps* → submit `sitemap.xml`. Use *URL inspection → Request indexing* for the home page and the first post.
7. **Bing Webmaster Tools.** bing.com/webmasters → *Import from Google Search Console* (one click). Bing also feeds ChatGPT search and Copilot. Submit `sitemap.xml` there too.
8. **App Store link-back.** In App Store Connect, set the Marketing URL and Support URL to your domain. That backlink from apple.com is one of the strongest signals you'll get.

### Publishing a post by hand
Add `content/blog/<slug>.md` (+ cover in `content/blog/images/`), commit and push. Netlify rebuilds within a minute. A future `date` waits for the daily build.

### Fully automated daily posts
A scheduled Claude task can run every morning: research keywords, pick the next `todo` row in `_topics.md`, write the post to `_STYLE.md`, run `npm run build` to verify, then commit and push to `main`. The push triggers Netlify. It needs push access to the GitHub repo. The task prompt is in `AUTOMATION.md`.

## Growth checklist beyond the site
- Get listed: AlternativeTo (as an alternative to CLZ Movies / iCollect), Product Hunt launch, Reddit (r/dvdcollection, r/4kbluray, r/bluray, r/criterion) as the maker, sharing genuinely useful posts.
- Reply in forum threads (Blu-ray.com, AVForums) where people ask "what app do you use to catalog?".
- Ask happy users for App Store ratings; the App Store page itself ranks on Google for "movie collection app".
- Watch Search Console → *Performance* weekly; queries with impressions but low clicks are your next titles to improve; queries ranking 8–20 are your next posts.

## Automatic indexing (no manual steps per post)
- `sitemap.xml` and `rss.xml` are regenerated on every build with accurate `lastmod` dates; Google re-reads the submitted sitemap on its own.
- `netlify/plugins/instant-indexing` runs after every production deploy and pings **IndexNow** (Bing, which also powers ChatGPT search and Copilot, plus Yandex, Seznam and Naver) with new and updated URLs, and Google's **WebSub hub** for the RSS feed. The IndexNow key lives in `site.config.json` and is served at `/<key>.txt`. It never fails a deploy.
- Use Search Console's *Request indexing* only for pages you want crawled faster (optional).
