import { THREE, makeRenderer, studio, buildCase, FORMATS, visibleLoop, fit, clamp01 } from './common.js';
import { BARCODED as FILMS } from '../films.js';

/*
  A floor of cases drifting away from the viewer.
  Each case passes a scan gate near the front: wireframe + dim print → green flash → fully lit → into the fog.
*/
export async function initFinale(canvas, { onScan = () => {}, reduced = false } = {}) {
  const host = canvas.parentElement;
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const BG = 0x08090d;
  scene.fog = new THREE.Fog(BG, 16, 42);
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 80);
  fit(renderer, camera, host);
  studio(scene, renderer, { warm: 2.2, rim: 1.6 });
  const top = new THREE.DirectionalLight(0xf2f4ff, 1.4); top.position.set(0, 12, 6); scene.add(top);
  const glow = new THREE.PointLight(0x7d6cff, 14, 30, 2); glow.position.set(0, 3, -16); scene.add(glow);

  const FLOOR = -2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x0b0c12, roughness: .55, metalness: .4 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR - .08, -14); scene.add(floor);
  const grid = new THREE.GridHelper(80, 46, 0x2c2a45, 0x15161f); grid.position.set(0, FLOOR - .07, -14); grid.material.transparent = true; grid.material.opacity = .55; scene.add(grid);

  /* scan gate: a glowing line on the floor and a soft light curtain above it */
  const GATE = -2.6;
  const mkGrad = (w, h, stops, horiz) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const gr = horiz ? g.createLinearGradient(0, 0, w, 0) : g.createLinearGradient(0, 0, 0, h); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, w, h); return new THREE.CanvasTexture(c); };
  const fade = mkGrad(256, 4, [[0, 'rgba(0,0,0,0)'], [.2, '#fff'], [.8, '#fff'], [1, 'rgba(0,0,0,0)']], true);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(18, .06), new THREE.MeshBasicMaterial({ color: 0xff3d6e, map: fade, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  line.rotation.x = -Math.PI / 2; line.position.set(0, FLOOR + .25, GATE); scene.add(line);
  const curtainTex = mkGrad(4, 256, [[0, 'rgba(255,61,110,0)'], [.75, 'rgba(255,61,110,.10)'], [1, 'rgba(255,61,110,.5)']], false);
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(18, 2.4), new THREE.MeshBasicMaterial({ map: curtainTex, alphaMap: fade, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  curtain.position.set(0, FLOOR + 1.2 + .25, GATE); scene.add(curtain);

  /* cases */
  const narrow = host.clientWidth / host.clientHeight < .9;
  const COLS = narrow ? 4 : 8, ROWS = narrow ? 10 : 11, DX = 1.85, DZ = 2.75, SPAN = ROWS * DZ, FRONT = 7.5;
  const edges = {};
  Object.values(FORMATS).forEach(F => { edges[F.key] = new THREE.EdgesGeometry(new THREE.BoxGeometry(F.w * 1.04, F.h * 1.04, F.d + .05)); });
  const items = [];
  const jobs = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const film = FILMS[(r * 3 + c * 7) % FILMS.length];
    jobs.push(buildCase(renderer, film, { simple: true }).then(g => {
      const holder = new THREE.Group(); holder.add(g);
      g.rotation.x = -Math.PI / 2;
      const F = g.userData.F;
      const wire = new THREE.LineSegments(edges[F.key], new THREE.LineBasicMaterial({ color: 0x8fa3ff, transparent: true, opacity: 0, toneMapped: false }));
      g.add(wire);
      const prints = []; g.traverse(o => { if (o.isMesh && o.material && o.material.map) prints.push(o.material); });
      const x = (c - (COLS - 1) / 2) * DX + (Math.random() - .5) * .18;
      const z0 = FRONT - r * DZ - (c % 2) * DZ * .5;
      holder.position.set(x, FLOOR + F.d / 2, z0);
      holder.rotation.y = (Math.random() - .5) * .16;
      holder.userData = { film, wire, prints, z: z0, scanned: z0 < GATE, flash: 0 };
      scene.add(holder); items.push(holder);
    }));
  }
  await Promise.all(jobs);

  const dim = new THREE.Color(0x343849), white = new THREE.Color(0xffffff), blue = new THREE.Color(0x8fa3ff), green = new THREE.Color(0x2fd15b);
  const tmp = new THREE.Color();
  let boost = 0, mx = 0, my = 0, pmx = 0, pmy = 0;
  host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; });

  const loop = visibleLoop(host, (dt, t) => {
    const speed = reduced ? 0 : 1.15 + boost; boost *= .94;
    pmx += (mx - pmx) * .04; pmy += (my - pmy) * .04;
    camera.position.set(pmx * 1.2, (narrow ? 6.6 : 5.2) - pmy * .6, narrow ? 13 : 10.5);
    camera.lookAt(pmx * .4, FLOOR + .4, -8);
    for (const it of items) {
      const u = it.userData;
      u.z -= speed * dt;
      if (u.z < FRONT - SPAN) { u.z += SPAN; u.scanned = false; }
      it.position.z = u.z;
      // before the gate: wireframe + dim print. Crossing: flash green. After: lit, wire fades.
      const before = clamp01((u.z - GATE) / 1.2);          // 1 well before the gate
      const after = clamp01((GATE - u.z) / 3.2);           // 0 at gate → 1 when well past
      if (!u.scanned && u.z <= GATE) { u.scanned = true; u.flash = 1; onScan(u.film); }
      u.flash = Math.max(0, u.flash - dt * 1.4);
      const wireOn = u.z > GATE ? .35 + .55 * (1 - before * .4) : (1 - after);
      u.wire.material.opacity = wireOn;
      u.wire.material.color.copy(u.flash > 0 ? tmp.copy(blue).lerp(green, Math.min(1, u.flash * 1.6)) : (u.z > GATE ? blue : green));
      const lit = u.z > GATE ? 0 : Math.min(1, after * 1.6);
      tmp.copy(dim).lerp(white, lit); if (u.flash > 0) tmp.lerp(green, u.flash * .25);
      u.prints.forEach(m => m.color.copy(tmp));
    }
    line.material.opacity = .75 + .25 * Math.sin(t * 6);
    renderer.render(scene, camera);
  });

  return { boost(v) { boost = Math.min(4, boost + v); }, renderOnce: loop.renderOnce };
}
