// Privacy-friendly analytics (Plausible): no cookies, no personal data.
// Loaded on the landing page and every blog page (built to /js/analytics.js).
import { init, track } from '@plausible-analytics/tracker';

init({
  domain: 'getmovieshelf.app',
  outboundLinks: true,
  fileDownloads: true,
  customProperties: () => ({ section: location.pathname.startsWith('/blog') ? 'blog' : 'site' }),
});

// Conversion goals. A "Get the app" button opens the store popup ("Get App Open", tagged with where it was
// clicked); the store badges inside the popup are the real downloads ("App Store Click" / "Google Play Click").
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href*="apps.apple.com"], a[href*="play.google.com"]');
  if (!a) return;
  const page = location.pathname;
  if (a.closest('.ga-modal')) {
    track(a.href.includes('play.google.com') ? 'Google Play Click' : 'App Store Click', { props: { placement: 'popup', page } });
    return;
  }
  let placement = 'unknown';
  try { placement = new URL(a.href).searchParams.get('ct') || a.dataset.placement || a.className || 'link'; } catch {}
  track('Get App Open', { props: { placement: String(placement).slice(0, 60), page } });
}, { capture: true });
