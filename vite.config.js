import { defineConfig } from 'vite';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Builds the static blog into /public and injects SEO markup + latest posts into the landing page.
function movieshelfBlog() {
  let lib, build;
  const load = async () => {
    const v = Date.now();
    const u = f => pathToFileURL(path.resolve('scripts', f)).href + '?v=' + v;
    lib = await import(/* @vite-ignore */ u('blog-lib.mjs'));
    build = (await import(/* @vite-ignore */ u('build-blog.mjs'))).buildBlog;
  };
  return {
    name: 'movieshelf-blog',
    async buildStart() { await load(); build(); },
    configureServer(server) {
      const dir = path.resolve('content/blog');
      server.watcher.add(dir);
      server.watcher.on('all', async (_, file) => {
        if (!file.startsWith(dir) && !file.includes('scripts/blog-lib') && !file.endsWith('site.config.json')) return;
        await load(); build({ quiet: true }); server.ws.send({ type: 'full-reload' });
      });
    },
    async transformIndexHtml(html) {
      if (!lib) await load();
      const posts = lib.loadPosts();
      const faq = [...html.matchAll(/<div class="qa"><button[^>]*>(.*?)<span class="pl"><\/span><\/button><div class="ans"><div><p>(.*?)<\/p>/gs)]
        .map(m => ({ q: m[1].replace(/<[^>]+>/g, '').trim(), a: m[2].replace(/<[^>]+>/g, '').trim() }));
      const ld = [...lib.landingJsonLd(), faq.length && { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }].filter(Boolean);
      return html
        .replaceAll('__SITE__', lib.SITE.siteUrl)
        .replace('<!--JSONLD-->', ld.map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n'))
        .replace('<!--JOURNAL-->', lib.latestSection(posts));
    },
  };
}

export default defineConfig({ base: '/', plugins: [movieshelfBlog()], build: {
  target: 'es2020', chunkSizeWarningLimit: 900,
  rollupOptions: {
    input: { main: path.resolve('index.html'), analytics: path.resolve('src/analytics.js') },
    // Fixed, uncached-by-hash name so the static blog pages can load it.
    output: { entryFileNames: c => (c.name === 'analytics' ? 'js/analytics.js' : 'assets/[name]-[hash].js') },
  },
} });
