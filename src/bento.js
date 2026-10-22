// Collector tools: each tile is a small live demo.
import { FILMS } from './films.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, ms));
function whenVisible(el, cb, threshold = .25) { let v = false; new IntersectionObserver(es => { v = es[0].isIntersecting; if (v) cb(); }, { threshold }).observe(el); return () => v; }

/* spotlight */
$$('.cell').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }));

/* ---------- duplicate guard ---------- */
(() => {
  const el = $('#dup'), done = $('.dup-done', el); let running = false, choice = null;
  const set = s => { el.classList.remove('s-scan', 's-alert', 's-done'); if (s) el.classList.add(s); };
  $$('.dup-btns button', el).forEach(b => b.addEventListener('click', () => { choice = b.dataset.a; }));
  async function loop() {
    if (running) return; running = true;
    while (visible()) {
      choice = null; set(null); await wait(700);
      set('s-scan'); await wait(1900);
      set('s-alert');
      for (let t = 0; t < 60 && !choice; t++) await wait(100);
      done.innerHTML = choice === 'add' ? '<span><em>Added.</em>Saved as a second edition: 4K UHD.</span>' : '<span><em>Skipped.</em>No double-dip this time.</span>';
      if (!choice) done.innerHTML = '<span><em>Caught it.</em>Your Blu-ray is already on Shelf A.</span>';
      set('s-done'); await wait(2600);
    }
    running = false;
  }
  const visible = whenVisible(el, () => RM ? set('s-alert') : loop());
})();

/* ---------- three ways in ---------- */
(() => {
  const el = $('#ways'), ways = $$('.way', el), typed = $('.typed', el), wvS = $('.wv-search', el), wvC = $('.wv-csv', el);
  let idx = 0, token = 0, hold = false;
  async function activate(i) {
    idx = i; const my = ++token;
    ways.forEach((w, k) => w.classList.toggle('on', k === i));
    wvS.classList.remove('res'); wvC.classList.remove('go'); typed.textContent = '';
    if (ways[i].dataset.w === 'search') { for (const ch of 'incep') { await wait(140); if (my !== token) return; typed.textContent += ch; } await wait(250); if (my === token) wvS.classList.add('res'); }
    if (ways[i].dataset.w === 'csv') { await wait(900); if (my === token) wvC.classList.add('go'); }
  }
  ways.forEach((w, i) => { w.addEventListener('pointerenter', () => { hold = true; if (idx !== i) activate(i); }); w.addEventListener('pointerleave', () => { hold = false; }); w.addEventListener('click', () => activate(i)); });
  const visible = whenVisible(el, () => {});
  activate(0);
  if (!RM) setInterval(() => { if (visible() && !hold) activate((idx + 1) % ways.length); }, 4200);
})();

/* ---------- shelf locator ---------- */
(() => {
  const el = $('#locator'), row = $('#spines'), tag = $('#locTag'), q = $('#locQ');
  const order = ['matrix', 'jurassic', 'darkknight', 'avatar', 'dune', 'joker', 'interstellar', 'inception', 'oppenheimer', 'endgame', 'matrix', 'dune', 'avatar', 'jurassic', 'joker', 'darkknight'];
  const byId = Object.fromEntries(FILMS.map(f => [f.id, f]));
  const n = innerWidth < 640 ? 10 : order.length;
  const spines = order.slice(0, n).map((id, i) => {
    const s = document.createElement('span'); s.className = 'spn'; s.style.backgroundImage = `url(scans/${id}-spine.jpg)`;
    s.style.height = (byId[id].fmt === 'dvd' ? 205 : 182) + 'px'; s.style.width = (byId[id].fmt === 'dvd' ? 27 : 24) + 'px';
    s.dataset.id = id; s.dataset.slot = i + 1; row.appendChild(s); return s;
  });
  let hover = false, cur = 6;
  function focus(i, typeIt) {
    cur = i; const s = spines[i], f = byId[s.dataset.id];
    spines.forEach(x => x.classList.toggle('hl', x === s)); row.classList.add('dim');
    tag.querySelector('b').textContent = f.t; tag.querySelector('span').textContent = `Living room · Shelf B · Slot ${s.dataset.slot}`;
    if (typeIt) { q.textContent = ''; [...f.t].forEach((ch, k) => setTimeout(() => { q.textContent += ch; }, k * 45)); } else q.textContent = f.t;
    requestAnimationFrame(() => setTimeout(() => {
      const cr = el.getBoundingClientRect(), sr = s.getBoundingClientRect();
      const tw = tag.offsetWidth / 2 + 8; tag.style.left = Math.max(tw, Math.min(cr.width - tw, sr.left + sr.width / 2 - cr.left)) + 'px'; tag.style.top = (sr.top - cr.top - 10) + 'px';
    }, 380));
  }
  spines.forEach((s, i) => { s.addEventListener('pointerenter', () => { hover = true; focus(i, false); }); s.addEventListener('pointerleave', () => { hover = false; }); });
  const visible = whenVisible(el, () => focus(cur, false));
  addEventListener('resize', () => focus(cur, false));
  if (!RM) setInterval(() => { if (visible() && !hover) focus((cur + 5) % spines.length, true); }, 3000);
})();

/* ---------- Atmos sound field ---------- */
(() => {
  const el = $('#atmos'), cv = $('#atmosCv'), g = cv.getContext('2d'), chips = $$('.sc', el);
  let W = 0, H = 0, color = '#6b8aff', active = 0, hold = false;
  const pts = []; for (let i = 0; i < 360; i++) { const u = Math.random(), v = Math.random(); pts.push({ th: u * Math.PI * 2, ph: Math.acos(1 - v) }); }
  const size = () => { const r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * devicePixelRatio; cv.height = H * devicePixelRatio; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    chips.forEach(c => { c.style.setProperty('--rx', Math.min(W * .34, 150) + 'px'); c.style.setProperty('--ry', Math.min(H * .38, 95) + 'px'); }); };
  size(); new ResizeObserver(size).observe(cv);
  const setActive = i => { active = i; color = chips[i].dataset.c; chips.forEach((c, k) => { c.classList.toggle('on', k === i); c.style.setProperty('--sc', c.dataset.c); }); };
  chips.forEach((c, i) => { c.addEventListener('pointerenter', () => { hold = true; setActive(i); }); c.addEventListener('pointerleave', () => { hold = false; }); });
  setActive(0);
  const visible = whenVisible(el, () => requestAnimationFrame(draw), .05);
  function draw(ts) {
    const t = ts / 1000; g.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * .7, R = Math.min(W * .36, H * .6, 120);
    // listener + floor rings
    for (let k = 0; k < 4; k++) { const ph = ((t * .45 + k / 4) % 1); g.beginPath(); g.ellipse(cx, cy, R * ph * 1.2, R * ph * .32, 0, 0, 7); g.strokeStyle = hexA(color, (1 - ph) * .5); g.lineWidth = 1.5; g.stroke(); }
    const pulse = (t * .7) % 1;
    for (const p of pts) {
      const th = p.th + t * .15, x3 = Math.sin(p.ph) * Math.cos(th), z3 = Math.sin(p.ph) * Math.sin(th), y3 = Math.cos(p.ph);
      const px = cx + x3 * R, py = cy - y3 * R * .95 + z3 * R * .22, depth = (z3 + 1) / 2;
      const ring = Math.max(0, 1 - Math.abs(p.ph / (Math.PI / 2) - pulse) * 6);
      g.fillStyle = ring > .05 ? hexA(color, .35 + ring * .65) : `rgba(206,216,255,${.08 + depth * .32})`;
      const s = .8 + depth * 1.4 + ring * 1.6; g.fillRect(px - s / 2, py - s / 2, s, s);
    }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 3.5, 0, 7); g.fill();
    if (visible() && !RM) requestAnimationFrame(draw);
  }
  if (!RM) setInterval(() => { if (visible() && !hold) setActive((active + 1) % chips.length); }, 2600);
  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
})();

/* ---------- edition tags + note ---------- */
(() => {
  const el = $('#notes'), txt = $('#noteTxt');
  $$('.ed-tags button', el).forEach(b => b.addEventListener('click', () => b.classList.toggle('on')));
  const notes = ['Midnight launch copy. Lenticular slip is mint.', 'Lent to Arjun in March. Got it back!', 'Disc 3 has the IMAX featurette.'];
  let busy = false;
  async function type() {
    if (busy) return; busy = true;
    for (let k = 0; visible(); k = (k + 1) % notes.length) {
      txt.textContent = '';
      for (const ch of notes[k]) { if (!visible()) break; txt.textContent += ch; await wait(38); }
      await wait(2200);
    }
    busy = false;
  }
  const visible = whenVisible(el, () => RM ? (txt.textContent = notes[0]) : type());
})();

/* ---------- stats donut ---------- */
(() => {
  const el = $('#stats'), segs = $$('.seg', el), donut = $('.donut', el), num = $('#dcNum'), lbl = $('#dcLbl'), dash = $('.dash', el);
  const C = 2 * Math.PI * 46, TOTAL = 248; let start = 0;
  segs.forEach(s => { const v = +s.dataset.v; s.dataset.len = v / 100 * C - 2; s.dataset.off = -start; s.style.strokeDasharray = `0 ${C}`; s.style.strokeDashoffset = -start; start += v / 100 * C; s.style.transition = 'stroke-dasharray 1.4s cubic-bezier(.2,.8,.2,1), stroke-width .3s, opacity .3s'; });
  let shown = false;
  whenVisible(el, () => {
    if (shown) return; shown = true; dash.classList.add('in');
    segs.forEach((s, i) => setTimeout(() => { s.style.strokeDasharray = `${s.dataset.len} ${C}`; }, i * 180));
    const t0 = performance.now(); const tick = t => { const k = Math.min(1, (t - t0) / 1400); num.textContent = Math.round(TOTAL * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  }, .4);
  segs.forEach(s => {
    s.addEventListener('pointerenter', () => { donut.classList.add('hov'); num.textContent = s.dataset.v + '%'; lbl.textContent = s.dataset.l; });
    s.addEventListener('pointerleave', () => { donut.classList.remove('hov'); num.textContent = TOTAL; lbl.textContent = 'discs'; });
  });
})();
