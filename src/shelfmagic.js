// Real shelves: a disc slides off the shelf, turns to show its barcode, and the phone scans it into the collection.
import gsap from 'gsap';
import BOXES from './shelves.json';
import { FILMS } from './films.js';
import { makeScanPhone } from './scanphone.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const F = Object.fromEntries(FILMS.map(f => [f.id, f]));

// which spine slot each disc comes from (index into the detected spine boxes)
const SHELVES = [
  { id: 'wall', name: 'Hallway DVD wall', ratio: 876 / 1110, vertical: true, discs: [['avatar', 70], ['matrix', 150]] },
  { id: 'tower', name: 'Blu-ray tower', ratio: 386 / 846, vertical: false, discs: [['dune', 9], ['joker', 21]] },
  { id: 'case', name: 'Living room bookcase', ratio: 754 / 884, vertical: false, discs: [['oppenheimer', 40], ['jurassic', 130]] },
];
const SIZE = { dvd: [150, 211, 20], bluray: [150, 190, 17], uhd: [150, 190, 17] };
const SHELL = { dvd: '#0d0e12', bluray: '#1a5fd0', uhd: '#0b0b0d' };

const magic = $('#magic');
if (magic) init();

function caseEl(f) {
  const [W, H, D] = SIZE[f.fmt], c = SHELL[f.fmt];
  const el = document.createElement('div'); el.className = 'cs3';
  el.style.cssText = `width:${W}px;height:${H}px;margin:${-H / 2}px 0 0 ${-W / 2}px;--sh:${c}`;
  el.innerHTML = `
    <i class="cf front" style="background-image:url(${f.front});transform:translateZ(${D / 2}px)"></i>
    <i class="cf back" style="background-image:url(${f.back});transform:rotateY(180deg) translateZ(${D / 2}px)"></i>
    <i class="cf spine" style="width:${D}px;left:${(W - D) / 2}px;background-image:url(${f.spine});transform:rotateY(-90deg) translateZ(${W / 2}px)"></i>
    <i class="cf edge" style="width:${D}px;left:${(W - D) / 2}px;transform:rotateY(90deg) translateZ(${W / 2}px)"></i>
    <i class="cf edge" style="height:${D}px;top:${(H - D) / 2}px;transform:rotateX(90deg) translateZ(${H / 2}px)"></i>
    <i class="cf edge" style="height:${D}px;top:${(H - D) / 2}px;transform:rotateX(-90deg) translateZ(${H / 2}px)"></i>`;
  return el;
}

function init() {
  const photosEl = $('#mgPhotos'), fx = $('#mgFx'), wrap = $('#mgPhone');
  SHELVES.forEach((sh, i) => {
    const el = document.createElement('div'); el.className = 'mg-photo'; el.dataset.i = i; el.style.setProperty('--r', sh.ratio);
    const slots = sh.discs.map(([, k]) => { const [x, y, w, h] = BOXES[sh.id][k]; return `<i class="mg-slot" data-k="${k}" style="left:${x * 100}%;top:${y * 100}%;width:${w * 100}%;height:${h * 100}%"></i>`; }).join('');
    el.innerHTML = `<img src="shelves/${sh.id}.jpg" alt="A real shelf of ${sh.vertical ? 'DVDs' : 'Blu-rays'}" loading="lazy">${slots}`;
    photosEl.appendChild(el);
  });
  const phone = makeScanPhone(wrap, { max: 10 });
  const photos = $$('.mg-photo', photosEl), step = $('#mgStep'), name = $('#mgName');
  const setStage = i => photos.forEach((p, k) => { p.dataset.pos = k === i ? 'on' : k === (i + 1) % 3 ? 'next' : 'prev'; });

  async function pull(sh, photo, [id, k], alive) {
    const f = F[id], slot = $(`.mg-slot[data-k="${k}"]`, photo);
    slot.classList.add('pick'); await sleep(700); if (!alive()) return;
    const mr = magic.getBoundingClientRect(), sr = slot.getBoundingClientRect(), stage = $('.mg-stage', magic).getBoundingClientRect();
    const [W, H] = SIZE[f.fmt];
    const el = caseEl(f); fx.appendChild(el);
    const sx = sr.left + sr.width / 2 - mr.left, sy = sr.top + sr.height / 2 - mr.top;
    const spineLen = sh.vertical ? sr.height : sr.width;
    const s0 = spineLen / H;
    const small = innerWidth < 900;
    const hx = stage.left + stage.width * (small ? .36 : .5) - mr.left, hy = stage.top + stage.height * (small ? .42 : .5) - mr.top;
    const sHold = Math.min(1.25, stage.height * (small ? .4 : .55) / H, stage.width * (small ? .48 : .6) / W);
    gsap.set(el, { left: sx, top: sy, scale: s0, rotationY: 90, rotationZ: sh.vertical ? 0 : 90, rotationX: 0, z: 0 });
    slot.classList.add('gone');
    photo.classList.add('dim');
    const tl = gsap.timeline();
    tl.to(el, { z: 60, duration: .45, ease: 'power2.out' })                                      // slide off the shelf
      .to(el, { left: hx, top: hy, scale: sHold, rotationY: 200, rotationZ: 0, rotationX: -6, z: 120, duration: 1.3, ease: 'power3.inOut' }) // turn to the back
      .to(el, { rotationY: 186, rotationX: -3, duration: .8, ease: 'sine.inOut' });
    await sleep(2300); if (!alive()) { el.remove(); return; }
    await phone.scan(f);
    // into the phone
    const pr = $('.sp-list', wrap).getBoundingClientRect();
    await new Promise(res => gsap.to(el, { left: pr.left + pr.width * .2 - mr.left, top: pr.top + 30 - mr.top, scale: .06, rotationY: 180, rotationX: 0, z: 0, duration: .8, ease: 'power3.in', onComplete: res }));
    el.remove(); photo.classList.remove('dim'); slot.classList.remove('pick');
  }

  async function runShelf(i, alive) {
    const sh = SHELVES[i], photo = photos[i];
    setStage(i); phone.idle(`shelves/${sh.id}.jpg`); step.textContent = `Shelf ${i + 1} of 3`; name.textContent = sh.name;
    $$('.mg-slot', photo).forEach(s => s.classList.remove('pick', 'gone'));
    await sleep(1100);
    for (const d of sh.discs) { if (!alive()) return; await pull(sh, photo, d, alive); await sleep(300); }
  }

  let running = false, visible = false;
  async function loop() {
    if (running) return; running = true;
    const alive = () => visible;
    while (visible) {
      phone.reset();
      for (let i = 0; i < 3 && visible; i++) await runShelf(i, alive);
      if (visible) { await sleep(500); await phone.importAll(); await sleep(1200); }
    }
    running = false;
  }
  setStage(0);
  if (RM) return;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); }, { threshold: .3 }).observe(magic);
}
