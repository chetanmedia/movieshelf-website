// Blocks visitors from selected countries at Netlify's edge (runs before any page is served).
// Owner bypass: open any page once with ?access=<KEY> and a 1-year cookie lets that browser through.
const BLOCKED = new Set(['IN', 'PK', 'BD', 'NP']); // India, Pakistan, Bangladesh, Nepal
const KEY = 'DF4Fm_OcxVgtttte';
const COOKIE = 'ms_access';

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Not available in your region</title>
<style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#07080c;color:#eef0f8;font:17px/1.5 system-ui,-apple-system,sans-serif;text-align:center;padding:24px}
h1{font-size:26px;margin:0 0 8px}p{color:#969cb2;margin:0}</style></head>
<body><div><h1>Movieshelf isn't available in your region</h1><p>Sorry, this website can't be viewed from your country.</p></div></body></html>`;

export default async (request, context) => {
  const country = context.geo?.country?.code;
  if (!country || !BLOCKED.has(country)) return; // everyone else: serve the site as normal

  const url = new URL(request.url);
  if (url.searchParams.get('access') === KEY) {
    url.searchParams.delete('access');
    return new Response(null, { status: 302, headers: {
      location: url.pathname + url.search,
      'set-cookie': `${COOKIE}=${KEY}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`,
      'cache-control': 'no-store',
    } });
  }
  if ((request.headers.get('cookie') || '').includes(`${COOKIE}=${KEY}`)) return;

  return new Response(PAGE, { status: 403, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
};

export const config = { path: '/*' };
