// After every successful production deploy, tell search engines what changed:
//  - IndexNow (Bing, Yandex, Seznam, Naver; Bing also feeds ChatGPT search and Copilot)
//  - WebSub hub for the RSS feed (Google's hub, used by Google and feed readers)
// Google itself reads sitemap.xml (with accurate <lastmod>) on its own schedule.
// Never fails the deploy: problems are logged and skipped.
import fs from 'node:fs';
import path from 'node:path';

export const onSuccess = async ({ constants, utils }) => {
  if (process.env.CONTEXT !== 'production') return console.log('indexing: not production, skipped');
  try {
    const cfg = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
    const site = (process.env.SITE_URL || cfg.siteUrl).replace(/\/$/, '');
    const host = new URL(site).host;
    const xml = fs.readFileSync(path.join(constants.PUBLISH_DIR, 'sitemap.xml'), 'utf8');
    const entries = [...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map(m => ({ loc: m[1], lastmod: m[2] }));
    const since = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
    // Submit everything the first time this site deploys, afterwards only what changed in the last two days.
    const first = !(await utils.cache.has('.indexnow-done'));
    const urls = [...new Set([`${site}/`, `${site}/blog/`, ...entries.filter(e => first || e.lastmod >= since).map(e => e.loc)])];

    if (cfg.indexNowKey) {
      const r = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host, key: cfg.indexNowKey, keyLocation: `${site}/${cfg.indexNowKey}.txt`, urlList: urls }),
      });
      console.log(`indexing: IndexNow ${r.status} for ${urls.length} URL(s)`);
      if (r.ok) { fs.writeFileSync('.indexnow-done', '1'); await utils.cache.save('.indexnow-done'); }
    }
    const hub = await fetch('https://pubsubhubbub.appspot.com/', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'hub.mode': 'publish', 'hub.url': `${site}/rss.xml` }),
    });
    console.log(`indexing: WebSub ping ${hub.status}`);
  } catch (e) {
    console.log(`indexing: skipped (${e.message})`);
  }
};
