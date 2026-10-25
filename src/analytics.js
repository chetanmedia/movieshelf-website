// Privacy-friendly analytics (Plausible): no cookies, no personal data.
// Loaded on the landing page and every blog page (built to /js/analytics.js).
import { init, track } from '@plausible-analytics/tracker';

init({
  domain: 'getmovieshelf.app',
  outboundLinks: true,
  fileDownloads: true,
  customProperties: () => ({ section: location.pathname.startsWith('/blog') ? 'blog' : 'site' }),
});

// Conversion goal: every click on an App Store link, tagged with where it was clicked.
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href*="apps.apple.com"]');
  if (!a) return;
  let placement = 'unknown';
  try { placement = new URL(a.href).searchParams.get('ct') || a.dataset.placement || a.className || 'link'; } catch {}
  track('App Store Click', { props: { placement: String(placement).slice(0, 60), page: location.pathname } });
}, { capture: true });
