import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { FILMS } from './films.js';
import { phoneHTML, setScreen, autoScale, statusBar, tabBar, PW, PH } from './app-ui.js';
import { playDemo, demoWhenVisible } from './app-demos.js';
import { makeScanPhone } from './scanphone.js';
import './app-ui.css';
import './bento.css';
import './shelfmagic.css';

gsap.registerPlugin(ScrollTrigger);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const seg = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!RM) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); const el = id === '#top' ? document.body : $(id); if (!el) return;
  e.preventDefault(); lenis ? lenis.scrollTo(id === '#top' ? 0 : el, { offset: -20, duration: 1.6 }) : el.scrollIntoView({ behavior: 'smooth' });
}));

/* ---------- chrome ---------- */
const nav = $('#nav'); const onScroll = () => nav.classList.toggle('scrolled', scrollY > 30);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
(() => { const c = document.createElement('canvas'); c.width = c.height = 220; const g = c.getContext('2d'); const d = g.createImageData(220, 220); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); $('#grain').style.backgroundImage = `url(${c.toDataURL()})`; })();
(() => { const w = ['DVD', 'BLU-RAY', '4K ULTRA HD', 'STEELBOOKS', 'BOX SETS', 'DOLBY ATMOS', 'DTS-HD MA', 'SPECIAL EDITIONS', 'SHELF LOCATIONS', 'REGION CODES']; const html = w.map(x => `<span>${x}</span><span><i>✦</i></span>`).join(''); $('#ticker').innerHTML = html + html; })();

/* ---------- WebGL scenes, initialised as they approach ---------- */
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
function lazy(el, init) {
  if (!hasGL) { el.closest('.gl').style.display = 'none'; return Promise.resolve(null); }
  return new Promise(res => {
    const io = new IntersectionObserver(async es => { if (!es[0].isIntersecting) return; io.disconnect(); try { res(await init()); } catch (err) { console.error(err); el.closest('.gl').style.display = 'none'; res(null); } }, { rootMargin: '800px 0px' });
    io.observe(el);
  });
}

/* hero */
const heroP = lazy($('#heroGL'), async () => (await import('./three/hero.js')).initHero($('#heroGL'), $('#chip'), { reduced: RM }));
if (!RM) {
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('#h1 .ln > span', { yPercent: 115, duration: 1.3, stagger: .12 }, .2)
    .from('.hero-in', { y: 26, opacity: 0, duration: 1.1, stagger: .1 }, .55)
    .from('.hero-hint', { opacity: 0, duration: 1 }, 1.4);
  heroP.then(h => h && ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: s => h.setScroll(s.progress) }));
  gsap.to('.hero-copy', { yPercent: -18, opacity: .2, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
}

/* scan reel */
const scanSteps = $$('#scanSteps .sstep'), scanRail = $('#scanRail');
let scanObj = null;
const scanP = lazy($('#scanGL'), async () => (await import('./three/scan.js')).initScan($('#scanGL'), { reduced: RM }));
scanP.then(o => { scanObj = o; });
let scanProg = 0, flyProg = 0, orgIdx = 0;
function setScan(p) {
  scanProg = p;
  const idx = p < .16 ? 0 : p < .47 ? 1 : p < .66 ? 2 : 3;
  scanSteps.forEach((s, i) => s.classList.toggle('on', i === idx));
  scanRail.style.transform = `scaleX(${p})`;
  updateScanUI(p);
}

/* ---------- the phone: scans the real barcode, then flies to Organize ---------- */
const fly = $('#fly');
fly.innerHTML = phoneHTML(['scan', 'detail', 'latest', 'det-inception', 'all', 'coll', 'folder', 'det-interstellar', 'watch'], 'scan');
const scanScr = fly.querySelector('[data-s="scan"]'), rows = $$('[data-s="detail"] .a-row', fly), codeEl = fly.querySelector('.a-code'), nEl = fly.querySelector('.a-n');
const feed = fly.querySelector('.a-feed');
const CODE = '5051891184725', ORG = ['latest', 'all', 'coll', 'watch'];
const slotScan = $('#slotScan'), slotSide = $('#slotSide'), slotOrg = $('#slotOrg');
const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
let curScreen = 'scan', demoName = null, demoStop = null;
const desktop = () => innerWidth > 900;
const R = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, s: r.width / PW }; };
const L = (a, b, t) => a + (b - a) * t, E = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const BC = { u: .83, v: .903, ratio: 1113 / 960 }; // barcode centre on the Dune back scan
const RET = { x: 196.5, y: 275, off: 151 };         // viewfinder centre in screen points; offset from phone centre
function updateScanUI(p) {
  const c = seg(p, .3, .47);
  scanScr.classList.toggle('scanning', c > 0 && c < .62);
  scanScr.classList.toggle('found', c >= .62);
  scanScr.classList.toggle('added', c >= .86);
  codeEl.textContent = CODE.slice(0, Math.round(seg(c, .12, .62) * CODE.length));
  nEl.textContent = c >= .86 ? 1 : 0;
  const k = seg(p, .49, .63); rows.forEach((r, i) => r.classList.toggle('on', k * rows.length > i + .2));
}
function placePhone(time) {
  tilt.x += (tilt.tx - tilt.x) * .08; tilt.y += (tilt.ty - tilt.y) * .08;
  const D = R(slotSide), S = R(slotScan);
  const sA = desktop() ? Math.min(.62, innerHeight * .54 / PH) : Math.min(.36, innerWidth * .38 / PW, innerHeight * .34 / PH);
  let bc = scanObj && scanObj.barcode ? scanObj.barcode() : null; if (bc && !bc.x && !bc.y) bc = null;
  const ax = bc ? bc.x : S.x, ay = bc ? bc.y + RET.off * sA : S.y;
  const inK = E(seg(scanProg, .13, .25)), near = E(seg(scanProg, .24, .34)), side = E(seg(scanProg, .47, .6));
  const jig = scanProg > .3 && scanProg < .47 ? 1 : 0, t = (time || 0);
  // off-screen → hovering a little away from the barcode → right over it
  const fx = ax - (desktop() ? 70 : 34), fy = ay + (desktop() ? 90 : 50), fs = sA * .8;
  let x = L(innerWidth + sA * PW * .7, fx, inK), y = L(innerHeight + 100, fy, inK), s = L(sA * .7, fs, inK);
  let rx = L(16, 12, inK), ry = L(-50, -26, inK), rz = L(18, -8, inK);
  x = L(x, ax, near) + Math.sin(t * 2.1) * 1.6 * jig; y = L(y, ay, near) + Math.cos(t * 1.7) * 1.4 * jig; s = L(s, sA, near);
  rx = L(rx, 3, near); ry = L(ry, -4, near); rz = L(rz, -1.5, near);
  x = L(x, D.x, side); y = L(y, D.y, side); s = L(s, D.s, side); rx = L(rx, 3, side); ry = L(ry, -12, side); rz = L(rz, 1.5, side);
  // live camera feed: the barcode grows as the phone moves in
  const W = L(520, 860, near) * (1 + .015 * Math.sin(t * 1.3)), H = W * BC.ratio;
  feed.style.backgroundSize = `${W}px ${H}px`;
  feed.style.backgroundPosition = `${RET.x - BC.u * W + Math.sin(t * 2.3) * 2 * jig}px ${RET.y - BC.v * H + Math.cos(t * 1.9) * 2 * jig}px`;
  feed.style.filter = `saturate(1.08) contrast(1.06) brightness(.96) blur(${(1 - near) * 1.6}px)`;
  let want = null;
  if (desktop()) {
    const O = R(slotOrg), f = E(flyProg), arc = Math.sin(flyProg * Math.PI);
    x = L(x, O.x, f) - arc * innerWidth * .1; y = L(y, O.y, f); s = L(s, O.s, f) * (1 + arc * .14);
    rx = L(rx, 0, f) - arc * 8 - tilt.y * 12 * f; ry = L(ry, 0, f) + arc * 32 + tilt.x * 18 * f; rz = L(rz, 0, f) - arc * 8;
    if (flyProg > .55) want = ORG[orgIdx];
  }
  fly.style.visibility = scanProg > .13 || (desktop() && flyProg > 0) ? 'visible' : 'hidden';
  fly.style.transform = `translate3d(${x - PW / 2}px, ${y - PH / 2}px, 0) perspective(2400px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;
  if (want !== demoName) {
    if (demoStop) { demoStop(); demoStop = null; }
    demoName = want; curScreen = null;
    if (want && !RM) demoStop = playDemo(fly, want);
    else if (want) setScreen(fly, want);
  }
  if (!demoName) { const name = scanProg < .475 ? 'scan' : 'detail'; if (name !== curScreen) { setScreen(fly, name); curScreen = name; } }
}
gsap.ticker.add(placePhone);
ScrollTrigger.create({ trigger: '#scan', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: s => { setScan(s.progress); scanP.then(sc => sc && sc.setProgress(s.progress)); } });
ScrollTrigger.create({ trigger: '#scan', start: 'bottom bottom', endTrigger: '.org-grid', end: 'top 90px', scrub: true, onUpdate: s => { flyProg = s.progress; } });
setScan(0);

/* box set reel */
const boxSteps = $$('#boxSteps .sstep'), boxRail = $('#boxRail'), boxSw = $('#boxSw');
const boxP = lazy($('#boxGL'), async () => (await import('./three/boxset.js')).initBoxset($('#boxGL')));
function setBox(p) {
  const idx = p < .3 ? 0 : p < .64 ? 1 : 2;
  boxSteps.forEach((s, i) => s.classList.toggle('on', i === idx));
  boxSw.classList.toggle('on', p > .38); boxRail.style.transform = `scaleX(${p})`;
}
ScrollTrigger.create({ trigger: '#boxsets', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: s => { setBox(s.progress); boxP.then(b => b && b.setProgress(s.progress)); } });
setBox(0);

/* wall */
const wallP = lazy($('#wallGL'), async () => (await import('./three/wall.js')).initWall($('#wallGL')));
ScrollTrigger.create({ trigger: '#wall', start: 'top bottom', end: 'bottom top', scrub: true, onUpdate: s => wallP.then(w => w && w.setProgress(s.progress)) });
if (!RM) {
  const n = { v: 20 };
  gsap.fromTo(n, { v: 20 }, { v: 2000, ease: 'power2.inOut', scrollTrigger: { trigger: '#wall', start: 'top 80%', end: 'top 20%', scrub: .6 }, onUpdate: () => { $('#bigNum').textContent = Math.round(n.v).toLocaleString('en-US'); } });
}

/* ---------- organize ---------- */
(() => {
  const steps = $$('.ostep'), halo = $('#halo');
  const set = i => { orgIdx = i; steps.forEach((s, k) => s.classList.toggle('on', k === i)); halo.style.setProperty('--gc', steps[i].dataset.c); };
  set(0);
  if (desktop()) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(steps.indexOf(e.target)); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
    const st = $('.phone-stick');
    st.addEventListener('pointermove', e => { const r = st.getBoundingClientRect(); tilt.tx = (e.clientX - r.left) / r.width - .5; tilt.ty = (e.clientY - r.top) / r.height - .5; });
    st.addEventListener('pointerleave', () => { tilt.tx = tilt.ty = 0; });
    st.style.pointerEvents = 'auto';
  }
  const SETS = { latest: ['latest', 'det-inception'], all: ['all'], coll: ['coll', 'folder', 'det-interstellar'], watch: ['watch'] };
  $$('.mshot .pwrap').forEach(w => { const n = w.dataset.screen; w.innerHTML = phoneHTML(SETS[n], n); autoScale(w); if (!RM) demoWhenVisible(w, w, n); });
})();

/* ---------- finale ---------- */
(() => {
  const st = $('#finStage'); if (!st) return;
  const phone = makeScanPhone($('#finPhone'), { max: 10 });
  const onScan = f => { phone.scan(f, { speed: 1.5 }); };
  const finP = lazy($('#finGL'), async () => (await import('./three/finale.js')).initFinale($('#finGL'), { onScan, reduced: RM }));
  ScrollTrigger.create({ trigger: st, start: 'top bottom', end: 'bottom top', onUpdate: s => finP.then(f => f && f.boost(Math.min(.25, Math.abs(s.getVelocity()) / 6000))) });
})();

/* ---------- features ---------- */
import('./bento.js');
import('./shelfmagic.js');

/* ---------- pricing ---------- */
(() => {
  const P = { m: ['$3.99', 'per month', ''], y: ['$29.99', 'per year', 'Free trial · save 37% vs monthly'], l: ['$99.99', 'one time', 'Pay once, keep it forever'] };
  const seg = $('#seg'), bg = $('#pillbg'), val = $('#priceVal');
  const place = b => { bg.style.width = b.offsetWidth + 'px'; bg.style.transform = `translateX(${b.offsetLeft}px)`; };
  $$('button', seg).forEach(b => b.addEventListener('click', () => {
    $$('button', seg).forEach(x => x.setAttribute('aria-pressed', x === b)); place(b); const p = P[b.dataset.p];
    if (!RM) gsap.timeline().to(val, { y: -16, opacity: 0, duration: .18 }).call(() => { val.textContent = p[0]; }).fromTo(val, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: 'power3.out' });
    else val.textContent = p[0];
    $('#pricePer').textContent = p[1]; $('#save').textContent = p[2];
  }));
  const init = () => place($('button[aria-pressed="true"]', seg)); init(); addEventListener('resize', init); document.fonts && document.fonts.ready.then(init);
})();

/* ---------- FAQ ---------- */
$$('.qa button').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') !== 'true')));

/* ---------- reveals ---------- */
if (!RM) {
  $$('.rv').forEach(h => gsap.from(h, { y: 50, opacity: .15, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } }));
  gsap.utils.toArray('.cell').forEach((c, i) => gsap.from(c, { y: 60, opacity: .2, duration: 1, ease: 'expo.out', delay: (i % 3) * .08, scrollTrigger: { trigger: c, start: 'top 92%' } }));
  gsap.from('.plan', { y: 60, opacity: .2, duration: 1.1, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.plans', start: 'top 85%' } });
}
addEventListener('load', () => ScrollTrigger.refresh());
