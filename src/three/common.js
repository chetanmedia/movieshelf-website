import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { REMOTE, BOXSET } from '../films.js';
import * as P from './procedural.js';

export { THREE, RoundedBoxGeometry };

/* Real-world case sizes, 1 unit = 10 cm */
export const FORMATS = {
  bluray: { key: 'bluray', fmt: 'bluray', w: 1.35, h: 1.71, d: .13, color: 0x1a5fd0, trans: 0, rough: .2, band: 'BLU-RAY', bandH: .15, bandBg: '#1a5fd0', spineBg: '#1a5fd0' },
  uhd:    { key: 'uhd', fmt: 'uhd', w: 1.35, h: 1.71, d: .13, color: 0x0b0b0d, trans: 0, rough: .3, band: '4K ULTRA HD', bandH: .15, bandBg: '#050506', spineBg: '#0b0b0d' },
  dvd:    { key: 'dvd', fmt: 'dvd', w: 1.35, h: 1.90, d: .14, color: 0x101114, trans: 0, rough: .38, band: null, bandH: 0, bandBg: '#000', spineBg: '#141519' },
};

export function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  r.setClearColor(0x000000, 0);
  return r;
}

export function studio(scene, renderer, { warm = 2.6, rim = 2.2 } = {}) {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; pm.dispose();
  const key = new THREE.DirectionalLight(0xffdcae, warm); key.position.set(-3, 5, 6);
  const rimL = new THREE.DirectionalLight(0x8aa0ff, rim); rimL.position.set(5, 2, -4);
  const fill = new THREE.HemisphereLight(0xc9d2ff, 0x140e10, .5);
  scene.add(key, rimL, fill);
  return { key, rim: rimL, fill };
}

/* ---------- art loading: local file → CDN (CORS) → procedural ---------- */
const BASE = import.meta.env.BASE_URL || '/';
const imgCache = new Map();
function loadImg(src, cors) {
  return new Promise((res, rej) => { const i = new Image(); if (cors) i.crossOrigin = 'anonymous'; i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
export function getArt(key) {
  if (!key) return Promise.resolve(null);
  if (!imgCache.has(key)) {
    const local = key.includes('/') ? `${BASE}${key}` : `${BASE}covers/${key}.jpg`;
    imgCache.set(key, loadImg(local)
      .catch(() => REMOTE[key] ? loadImg(REMOTE[key], true) : Promise.reject())
      .catch(() => null));
  }
  return imgCache.get(key);
}
/** URL usable in an <img> tag (no CORS needed). */
export async function artURL(film) {
  const local = `${BASE}covers/${film.front}.jpg`;
  try { await loadImg(local); return local; } catch {}
  if (REMOTE[film.front]) { try { await loadImg(REMOTE[film.front]); return REMOTE[film.front]; } catch {} }
  return P.drawCover(film).toDataURL('image/jpeg', .85);
}

const memo = new Map();
const once = (k, fn) => { if (!memo.has(k)) memo.set(k, fn()); return memo.get(k); };
export const frontSrc = f => once('f' + f.id, async () => (await getArt(f.front)) || P.drawCover(f));
export const backSrc = f => once('b' + f.id, async () => (await getArt(f.back)) || P.drawBack(f, await frontSrc(f)));
export const discSrc = f => once('d' + f.id, async () => (await getArt(f.disc)) || P.drawDiscLabel(f, await frontSrc(f)));
export const spineSrc = f => once('s' + f.id, async () => getArt(f.spine));
export const boxArt = () => once('boxset', async () => (await getArt(BOXSET.front)) || P.drawCover({ id: 'boxset', t: 'Northbound Trilogy', c: ['#071a2a', '#1b6a7a', '#f3d999'], m: 'mountains', tag: 'Collector’s edition', d: '' }));

/* ---------- textures ---------- */
const texCache = new WeakMap();
export function makeTex(renderer, src, planeAspect) {
  if (!texCache.has(renderer)) texCache.set(renderer, new Map());
  const cache = texCache.get(renderer); const ck = src; let byAspect = cache.get(ck);
  if (!byAspect) { byAspect = new Map(); cache.set(ck, byAspect); }
  const ak = planeAspect ? planeAspect.toFixed(3) : 'raw';
  if (!byAspect.has(ak)) byAspect.set(ak, makeTexRaw(renderer, src, planeAspect));
  return byAspect.get(ak);
}
function makeTexRaw(renderer, src, planeAspect) {
  const t =src instanceof HTMLCanvasElement ? new THREE.CanvasTexture(src) : new THREE.Texture(src);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  t.needsUpdate = true;
  if (planeAspect) {
    const ia = (src.naturalWidth || src.width) / (src.naturalHeight || src.height);
    if (ia < planeAspect) { t.repeat.set(1, ia / planeAspect); t.offset.set(0, (1 - t.repeat.y) / 2); }
    else { t.repeat.set(planeAspect / ia, 1); t.offset.set((1 - t.repeat.x) / 2, 0); }
  }
  return t;
}

const shellCache = new Map();
export function shellMat(F) {
  if (!shellCache.has(F.key)) shellCache.set(F.key, new THREE.MeshPhysicalMaterial({
    color: F.color, roughness: F.rough, metalness: 0, clearcoat: 1, clearcoatRoughness: .1,
    ...(F.trans ? { transmission: F.trans, thickness: .05 } : {}), ior: 1.46, envMapIntensity: 1.1 }));
  return shellCache.get(F.key);
}
/** Printed insert under a glossy clear sleeve. */
export function printMat(map) {
  return new THREE.MeshPhysicalMaterial({ map, roughness: .55, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: .85 });
}

/**
 * A disc case with a hinged lid, printed front/back/spine and a disc inside.
 * opts: { simple } skips the hinge, back print and disc (for big shelves).
 *       { frontOverride } canvas/image to use instead of the film's front art.
 */
export async function buildCase(renderer, film, opts = {}) {
  const F = FORMATS[opts.fmt || film.fmt]; const { w, h, d } = F;
  const front = opts.frontOverride || await frontSrc(film);
  const g = new THREE.Group(); g.userData.film = film; g.userData.F = F;
  const shell = shellMat(F), pad = .028, r = .016;
  const artW = w - pad * 2 - .03;
  const artH = h - pad * 2 - F.bandH - (F.bandH ? .012 : 0);
  const artY = -h / 2 + pad + artH / 2;
  const bandY = h / 2 - pad - F.bandH / 2;

  const spineImg = !opts.spineTitle && film.spine ? await spineSrc(film) : null;
  const spineTex = makeTex(renderer, spineImg ? P.drawScannedSpine(spineImg, F) : P.drawSpine(film, F, opts.spineTitle));
  const spine = new THREE.Mesh(new THREE.PlaneGeometry(d - .012, h - pad * 2), printMat(spineTex));
  spine.rotation.y = -Math.PI / 2; spine.position.set(-w / 2 - .0015, 0, 0); g.add(spine);

  if (opts.simple) {
    const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), shell); g.add(body);
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(artW, artH), printMat(makeTex(renderer, front, artW / artH)));
    fp.position.set(.012, artY, d / 2 + .0015); g.add(fp);
    if (F.band) { const bp = new THREE.Mesh(new THREE.PlaneGeometry(w - .08, F.bandH), printMat(makeTex(renderer, P.drawBand(F)))); bp.position.set(.01, bandY, d / 2 + .0015); g.add(bp); }
    g.userData.setOpen = () => {};
    return g;
  }

  const back = await backSrc(film);
  const half = d / 2;
  const boxGeo = new RoundedBoxGeometry(w, h, half, 3, Math.min(r, half / 2.2));
  const tray = new THREE.Mesh(boxGeo, shell); tray.position.z = -half / 2; g.add(tray);
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(w - .08, h - .08), new THREE.MeshStandardMaterial({ color: F.key === 'bluray' ? 0x0d3c8a : 0x0a0a0c, roughness: .5 }));
  inner.position.z = .0008; g.add(inner);
  const hinge = new THREE.Group(); hinge.position.set(-w / 2, 0, 0); g.add(hinge);
  const lid = new THREE.Mesh(boxGeo, shell); lid.position.set(w / 2, 0, half / 2); hinge.add(lid);

  const fp = new THREE.Mesh(new THREE.PlaneGeometry(artW, artH), printMat(makeTex(renderer, front, artW / artH)));
  fp.position.set(w / 2 + .012, artY, half + .0015); hinge.add(fp);
  if (F.band) { const bp = new THREE.Mesh(new THREE.PlaneGeometry(w - .08, F.bandH), printMat(makeTex(renderer, P.drawBand(F)))); bp.position.set(w / 2 + .01, bandY, half + .0015); hinge.add(bp); }
  const bw = artW, bh = artH;
  const bkp = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), printMat(makeTex(renderer, back, bw / bh)));
  bkp.rotation.y = Math.PI; bkp.position.set(-.012, artY, -half - .0015); g.add(bkp);
  g.userData.backRect = { w: bw, h: bh, x: -.012, y: artY, z: -half };

  const disc = await buildDisc(renderer, film); disc.position.set(.02, .02, .004); g.add(disc);
  const hub = new THREE.Mesh(new THREE.RingGeometry(.05, .12, 48), new THREE.MeshStandardMaterial({ color: 0x2a2c33, roughness: .4 })); hub.position.set(.02, .02, .002); g.add(hub);

  g.userData.hinge = hinge; g.userData.disc = disc; g.userData.back = bkp;
  g.userData.setOpen = t => { hinge.rotation.y = -t * Math.PI * .93; };
  return g;
}

export async function buildDisc(renderer, film) {
  const R = .6, hole = .075, grp = new THREE.Group();
  const label = await discSrc(film);
  const top = new THREE.Mesh(new THREE.RingGeometry(hole, R, 96, 1), new THREE.MeshPhysicalMaterial({ map: makeTex(renderer, label), roughness: .45, clearcoat: .6, side: THREE.FrontSide }));
  top.position.z = .0035;
  const bottom = new THREE.Mesh(new THREE.RingGeometry(hole, R, 96, 1), new THREE.MeshPhysicalMaterial({
    color: 0xd9dce6, metalness: 1, roughness: .1, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [120, 900], envMapIntensity: 1.6, side: THREE.FrontSide }));
  bottom.rotation.y = Math.PI; bottom.position.z = -.0035;
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(R, R, .007, 96, 1, true), new THREE.MeshStandardMaterial({ color: 0xbfc3cc, metalness: 1, roughness: .2 }));
  edge.rotation.x = Math.PI / 2;
  grp.add(top, bottom, edge);
  return grp;
}

/** Soft circular shadow sprite. */
export function softShadow(size = 2, opacity = .55) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity, depthWrite: false }));
  return m;
}

/** Thin glowing scan line. */
export function laserLine(width = 1.3, color = 0xff3d6e) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 32);
  const fx = g.createLinearGradient(0, 0, 256, 0); fx.addColorStop(0, 'rgba(0,0,0,1)'); fx.addColorStop(.1, 'rgba(0,0,0,0)'); fx.addColorStop(.9, 'rgba(0,0,0,0)'); fx.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = fx; g.fillRect(0, 0, 256, 32);
  return new THREE.Mesh(new THREE.PlaneGeometry(width, .07), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
}

/** Run a render loop only while the canvas is on screen. */
export function visibleLoop(el, tick) {
  let on = false, raf = 0, last = performance.now();
  const frame = t => { const dt = Math.min(.05, (t - last) / 1000); last = t; tick(dt, t / 1000); if (on) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !on) { on = true; last = performance.now(); raf = requestAnimationFrame(frame); } else if (!v) { on = false; cancelAnimationFrame(raf); } }, { rootMargin: '100px' }).observe(el);
  return { renderOnce: () => tick(0, performance.now() / 1000) };
}

export function fit(renderer, camera, el) {
  const resize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  resize(); new ResizeObserver(resize).observe(el); return resize;
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp01 = v => Math.max(0, Math.min(1, v));
export const seg = (p, a, b) => clamp01((p - a) / (b - a));
export const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
