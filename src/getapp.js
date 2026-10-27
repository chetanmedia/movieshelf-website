// "Get the app" popup. Any link to the App Store outside the popup opens it instead of navigating,
// so visitors can choose iPhone or Android. The links stay plain <a href> for no-JS and crawlers.
// Built to /js/getapp.js so the static blog pages can load it too.
import { phoneHTML, autoScale } from './app-ui.js';
import { playDemo } from './app-demos.js';
import appCss from './app-ui.css?inline';
import css from './getapp.css?inline';

const APPLE = 'https://apps.apple.com/us/app/movieshelf-media-organizer/id6760224869';
const PLAY = 'https://play.google.com/store/apps/details?id=com.movieshelf.app';
const APPLE_BADGE = 'https://tools.applemarketingtools.com/api/badges/download-on-the-app-store/black/en-us?size=250x83';
const PLAY_BADGE = 'https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png';
const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

const ua = navigator.userAgent;
const isAndroid = /Android/i.test(ua);
const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let modal, stopDemo, lastFocus;

function build() {
  if (!document.querySelector('style[data-app-ui]')) {
    const s = document.createElement('style'); s.dataset.appUi = ''; s.textContent = appCss; document.head.append(s);
  }
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
  modal = document.createElement('div');
  modal.className = 'ga-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'ga-title');
  modal.innerHTML = `<div class="ga-back" data-close></div>
  <div class="ga-card">
    <button class="ga-x" type="button" aria-label="Close" data-close><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <div class="ga-stage" aria-hidden="true"><div class="ga-halo"></div><div class="ga-phone"></div></div>
    <div class="ga-copy">
      <span class="ga-eyebrow"><i></i>Movieshelf · iPhone &amp; Android</span>
      <h2 id="ga-title">Your shelf, <em>in your pocket.</em></h2>
      <p>Scan barcodes ten at a time, track every edition and format, and always know which shelf a disc is on.</p>
      <div class="ga-badges">
        <a class="ga-badge as${isIOS ? ' pref' : ''}" href="${APPLE}?ct=website-popup&amp;mt=8" target="_blank" rel="noopener" data-as-goal="app-store" aria-label="Download on the App Store">
          <img src="${APPLE_BADGE}" alt="Download on the App Store" width="168" height="56" loading="eager"></a>
        <a class="ga-badge gp${isAndroid ? ' pref' : ''}" href="${PLAY}&amp;referrer=utm_source%3Dwebsite%26utm_medium%3Dpopup" target="_blank" rel="noopener" data-as-goal="google-play" aria-label="Get it on Google Play">
          <img src="${PLAY_BADGE}" alt="Get it on Google Play" width="212" height="82" loading="eager"></a>
      </div>
      <div class="ga-note"><span>${TICK}Free for your first 50 titles</span><span>${TICK}No account needed to start</span></div>
    </div>
  </div>`;
  document.body.append(modal);
  // If a badge image can't load (blocked or offline), show a plain labelled button instead.
  modal.querySelectorAll('.ga-badge img').forEach(img => img.addEventListener('error', () => {
    const a = img.parentElement, apple = a.classList.contains('as'); a.classList.add('fallback');
    a.innerHTML = (apple ? '<svg viewBox="0 0 384 512" width="22" height="26"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#34a853" d="M3.6 2.2 13.5 12l-9.9 9.8c-.3-.2-.5-.6-.5-1V3.2c0-.4.2-.8.5-1z"/><path fill="#fbbc04" d="m16.8 15.3-3.3-3.3 3.3-3.3 3.8 2.2c1 .6 1 1.6 0 2.2z"/><path fill="#ea4335" d="M16.8 15.3 13.5 12l-9.9 9.8c.4.3 1 .3 1.6 0z"/><path fill="#4285f4" d="M16.8 8.7 5.2 2.2c-.6-.3-1.2-.3-1.6 0L13.5 12z"/></svg>')
      + `<span class="ga-fb"><small>${apple ? 'Download on the' : 'GET IT ON'}</small><b>${apple ? 'App Store' : 'Google Play'}</b></span>`;
  }));
  const wrap = modal.querySelector('.ga-phone');
  wrap.innerHTML = phoneHTML(['latest', 'det-inception'], 'latest');
  autoScale(wrap);
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = [...modal.querySelectorAll('a, button')]; const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
}

function open() {
  if (!modal) build();
  lastFocus = document.activeElement;
  modal.classList.add('open');
  document.documentElement.classList.add('ga-lock');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !stopDemo) stopDemo = playDemo(modal.querySelector('.ga-phone'), 'latest');
  setTimeout(() => modal.querySelector('.ga-badge.pref, .ga-badge')?.focus({ preventScroll: true }), 60);
}

function close() {
  modal.classList.remove('open');
  document.documentElement.classList.remove('ga-lock');
  if (stopDemo) { stopDemo(); stopDemo = null; }
  lastFocus?.focus?.({ preventScroll: true });
}

document.addEventListener('click', e => {
  const a = e.target.closest?.('a[href*="apps.apple.com"]');
  if (!a || a.closest('.ga-modal') || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
  e.preventDefault();
  open();
});

window.movieshelfGetApp = open;
