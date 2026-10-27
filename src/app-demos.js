// Scripted, looping walkthroughs that play inside a phone.
import { setScreen } from './app-ui.js';

const STOP = Symbol('stop');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = (s, r) => r.querySelector(s), $$ = (s, r) => [...r.querySelectorAll(s)];

/** Position of an element inside the 393×852 screen, ignoring CSS transforms on the phone. */
function pos(el, root) {
  const scr = root.querySelector('.ip-scr');
  let x = 0, y = 0, n = el;
  while (n && n !== scr) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
}

function makeCtx(root) {
  const ctx = { alive: true, root };
  ctx.w = async ms => { await sleep(ms); if (!ctx.alive) throw STOP; };
  const touch = root.querySelector('.a-touch');
  ctx.tap = async (el, { hold = 160 } = {}) => {
    const p = pos(el, root);
    touch.style.transition = 'none'; touch.style.transform = `translate(${p.x}px, ${p.y}px) scale(.6)`; touch.className = 'a-touch';
    void touch.offsetWidth; touch.style.transition = '';
    touch.classList.add('show', 'press'); el.classList.add('pressed');
    await ctx.w(hold); el.classList.remove('pressed'); touch.classList.remove('press');
    await ctx.w(220); touch.classList.remove('show');
  };
  ctx.drag = async (el, dx, dy, ms = 520) => {
    const p = pos(el, root);
    touch.style.transition = 'none'; touch.style.transform = `translate(${p.x}px, ${p.y}px)`; touch.className = 'a-touch show press';
    void touch.offsetWidth; touch.style.transition = `transform ${ms}ms cubic-bezier(.3,.6,.2,1)`;
    touch.style.transform = `translate(${p.x + dx}px, ${p.y + dy}px)`;
    await ctx.w(ms); touch.className = 'a-touch';
  };
  ctx.type = async (el, text, ms = 70) => { el.textContent = ''; for (const ch of text) { el.textContent += ch; el.parentElement.classList.add('typing'); await ctx.w(ms); } };
  ctx.screen = n => setScreen(root, n);
  return ctx;
}

/* ---------- Latest adds: swipe, swipe, tap, flip, details ---------- */
async function latest(c) {
  const scr = $('[data-s="latest"]', c.root), stack = $('.a-stack', scr), dots = $$('.a-dots i', scr), glow = $('.a-glow', scr);
  const det = $('[data-s="det-inception"]', c.root);
  let order = $$('.a-card', stack);
  const layout = (anim = true) => order.forEach((card, i) => {
    card.style.transition = anim ? '' : 'none';
    card.classList.remove('gone', 'flip', 'zoom');
    card.dataset.pos = i === 0 ? 'front' : i === 1 ? 'right' : i === 2 ? 'left' : 'hidden';
    card.style.zIndex = 10 - i;
  });
  const reset = () => { order = $$('.a-card', stack); order.sort((a, b) => STACK_ORDER.indexOf(a.dataset.id) - STACK_ORDER.indexOf(b.dataset.id)); layout(false); dots.forEach((d, i) => d.classList.toggle('on', i === 0)); glow.style.backgroundImage = `url(/scans/dune-front.jpg)`; if (det) { $('.a-dscroll', det).style.transform = ''; det.classList.remove('scrolled'); } };
  reset(); c.screen('latest');
  await c.w(1300);
  for (let k = 0; k < 2; k++) {
    const top = order[0];
    c.drag(top, 150, 10, 420);
    await c.w(160);
    top.classList.add('gone');
    await c.w(260);
    order = [...order.slice(1), top];
    layout(); top.style.zIndex = 0;
    dots.forEach((d, i) => d.classList.toggle('on', i === k + 1));
    glow.style.backgroundImage = `url(/scans/${order[0].dataset.id}-front.jpg)`;
    await c.w(1100);
  }
  const card = order[0];
  await c.tap(card, { hold: 200 });
  card.classList.add('flip');
  await c.w(900);
  card.classList.add('zoom');
  await c.w(320);
  if (det) { c.screen('det-inception'); $$('.a-row', det).forEach(r => r.classList.add('on')); }
  await c.w(3400);
  if (det) { const body = $('.a-dscroll', det); det.classList.add('scrolled'); body.style.transform = 'translateY(-210px)'; await c.w(2200); }
  reset(); c.screen('latest');
  await c.w(600);
}
const STACK_ORDER = ['dune', 'joker', 'inception', 'oppenheimer', 'matrix'];

/* ---------- All Media: format filters, then instant search ---------- */
async function all(c) {
  const scr = $('[data-s="all"]', c.root), tiles = $$('.a-tile', scr), pills = $$('.a-pills i', scr), count = $('.a-count', scr);
  const q = $('.a-q', scr), field = $('.a-field', scr);
  const COLS = 3, TW = 113, GAP = 9, TH = 214;
  const apply = test => {
    let n = 0;
    tiles.forEach(t => {
      const ok = test(t);
      if (ok) { t.style.transform = `translate(${(n % COLS) * (TW + GAP)}px, ${Math.floor(n / COLS) * TH}px)`; t.classList.remove('out'); n++; }
      else t.classList.add('out');
    });
    count.textContent = `${n} ${n === 1 ? 'title' : 'titles'}`;
  };
  const pill = f => pills.forEach(p => p.classList.toggle('on', p.dataset.f === f));
  const reset = () => { q.textContent = ''; field.classList.remove('focus', 'typing'); pill('all'); tiles.forEach(t => { t.style.transition = 'none'; }); apply(() => true); void scr.offsetWidth; tiles.forEach(t => { t.style.transition = ''; }); };
  reset(); c.screen('all');
  await c.w(1200);
  for (const f of ['uhd', 'bluray', 'dvd']) {
    await c.tap(pills.find(p => p.dataset.f === f));
    pill(f); apply(t => t.dataset.fmt === f);
    await c.w(1700);
  }
  await c.tap(pills[0]); pill('all'); apply(() => true);
  await c.w(900);
  await c.tap(field); field.classList.add('focus');
  for (const ch of 'dark') { q.textContent += ch; field.classList.add('typing'); const s = q.textContent; apply(t => t.dataset.t.includes(s)); await c.w(240); }
  await c.w(2200);
  for (let i = q.textContent.length; i > 0; i--) { q.textContent = q.textContent.slice(0, -1); await c.w(60); }
  q.textContent = 'nolan'.slice(0, 0);
  for (const ch of 'the') { q.textContent += ch; const s = q.textContent; apply(t => t.dataset.t.includes(s)); await c.w(240); }
  await c.w(2200);
  reset();
  await c.w(700);
}

/* ---------- Collections: new folder, open a folder, open a film, find its shelf ---------- */
async function coll(c) {
  const scr = $('[data-s="coll"]', c.root), grid = $('.a-folders', scr), modal = $('.a-modal', scr), name = $('.a-mname', scr);
  const folder = $('[data-s="folder"]', c.root), det = $('[data-s="det-interstellar"]', c.root);
  const reset = () => { $$('.a-folder.made', grid).forEach(n => n.remove()); modal.classList.remove('on'); name.textContent = ''; if (det) { $('.a-dscroll', det).style.transform = ''; det.classList.remove('scrolled'); $('.a-shelfloc', det).classList.remove('hl'); } };
  reset(); c.screen('coll');
  await c.w(1100);
  await c.tap($('.a-folder.new', grid));
  modal.classList.add('on');
  await c.w(600);
  await c.type(name, 'Weekend rewatch', 75);
  await c.w(400);
  await c.tap($('.a-create', modal));
  modal.classList.remove('on');
  const made = document.createElement('span'); made.className = 'a-folder made';
  made.innerHTML = '<span class="a-mosaic empty"><i></i><i></i><i></i></span><b>Weekend rewatch</b><small>0 titles</small>';
  $('.a-folder.new', grid).after(made);
  await c.w(1600);
  if (!folder) { await c.w(1500); reset(); return; }
  await c.tap($('[data-key="nolan"]', grid));
  c.screen('folder');
  await c.w(1500);
  await c.tap($('[data-id="interstellar"]', folder));
  c.screen('det-interstellar'); $$('.a-row', det).forEach(r => r.classList.add('on'));
  await c.w(1500);
  const loc = $('.a-shelfloc', det);
  c.drag($('.a-rows', det), 0, -160, 700);
  det.classList.add('scrolled'); $('.a-dscroll', det).style.transform = `translateY(${-(loc.offsetTop - 300)}px)`;
  await c.w(1100);
  loc.classList.add('hl');
  await c.w(3200);
  reset(); c.screen('coll');
  await c.w(600);
}

/* ---------- Watchlist & Wishlist ---------- */
async function watch(c) {
  const scr = $('[data-s="watch"]', c.root), panels = $$('.a-wpanel', scr), chipW = $('.a-chip.watch', scr), chipH = $('.a-chip.wish', scr);
  const wlist = $('[data-p="watch"] .a-list', scr), hlist = $('[data-p="wish"] .a-list', scr), wc = $('.a-wc', scr), hc = $('.a-hc', scr);
  const toast = $('.a-toast2', scr), q = $('[data-p="wish"] .a-q', scr), field = $('[data-p="wish"] .a-field', scr);
  const show = p => { panels.forEach(x => x.classList.toggle('on', x.dataset.p === p)); chipW.classList.toggle('on', p === 'watch'); chipH.classList.toggle('on', p === 'wish'); };
  const say = async t => { $('span', toast).textContent = t; toast.classList.add('on'); await c.w(1500); toast.classList.remove('on'); };
  const reset = () => {
    $$('.a-wr.new', scr).forEach(n => n.remove()); $$('.a-wr', wlist).forEach(r => r.classList.remove('swiped', 'gone'));
    q.textContent = ''; field.classList.remove('focus', 'typing'); wc.textContent = '3 films'; hc.textContent = '3 editions'; show('watch');
  };
  reset(); c.screen('watch');
  await c.w(900);
  // a film arrives from All Media
  const m = document.createElement('div'); m.className = 'a-wr new';
  m.innerHTML = `<span class="a-del">Remove</span><div class="a-li"><span class="a-lt" style="background-image:url(/scans/matrix-front.jpg)"></span><span><b>The Matrix</b><small>DVD · 136 min</small></span><i class="a-chev">›</i></div>`;
  wlist.prepend(m); wc.textContent = '4 films';
  say('The Matrix moved to Watchlist');
  await c.w(2000);
  // watched one: swipe to remove
  const jp = $$('.a-wr', wlist).find(r => r.dataset.id === 'jurassic');
  c.drag(jp, -120, 0, 480); jp.classList.add('swiped');
  await c.w(900);
  await c.tap($('.a-del', jp));
  jp.classList.add('gone'); wc.textContent = '3 films';
  await c.w(1400);
  // wishlist
  await c.tap(chipH); show('wish');
  await c.w(1300);
  await c.tap(field); field.classList.add('focus');
  for (const ch of 'Blade Runner 2049') { q.textContent += ch; field.classList.add('typing'); await c.w(55); }
  await c.w(350);
  const n = document.createElement('div'); n.className = 'a-wr new';
  n.innerHTML = `<div class="a-li"><span class="a-lt hunt" style="background:linear-gradient(160deg,#e08a3a,#3a1206)">BR</span><span><b>Blade Runner 2049</b><small>4K UHD · Steelbook</small></span><i class="a-tag">Wanted</i></div>`;
  hlist.prepend(n); hc.textContent = '4 editions'; q.textContent = ''; field.classList.remove('focus', 'typing');
  say('Added to Wishlist');
  await c.w(3000);
  reset();
  await c.w(500);
}

const DEMOS = { latest, all, coll, watch };

/** Start a looping demo on a phone. Returns a stop function. */
export function playDemo(root, name) {
  const c = makeCtx(root);
  (async () => { while (c.alive) { try { await DEMOS[name](c); } catch (e) { if (e !== STOP) { console.error(e); return; } } } })();
  return () => { c.alive = false; };
}

/** Play a demo only while its element is on screen. */
export function demoWhenVisible(el, root, name) {
  let stop = null;
  new IntersectionObserver(es => {
    if (es[0].isIntersecting && !stop) stop = playDemo(root, name);
    else if (!es[0].isIntersecting && stop) { stop(); stop = null; }
  }, { threshold: .35 }).observe(el);
}
