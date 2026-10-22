import { THREE, makeRenderer, studio, buildCase, visibleLoop, fit, lerp } from './common.js';
import { FILMS } from '../films.js';

export async function initWall(canvas) {
  const host = canvas.parentElement;
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x07080c, 9, 19);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 60); camera.position.set(0, .4, 9.4);
  fit(renderer, camera, host);
  studio(scene, renderer, { warm: 2.2, rim: 1.6 });
  const spot = new THREE.PointLight(0xffc27a, 12, 9, 1.6); spot.position.set(0, 3, 2.5); scene.add(spot);

  const narrow = host.clientWidth < 760;
  const rows = 3, cols = narrow ? 7 : 13, gap = .1, rowH = 2.35;
  const wood = new THREE.MeshStandardMaterial({ color: 0x241b13, roughness: .75 });
  const order = [0, 3, 1, 5, 2, 4, 6, 9, 7, 8, 1, 0, 4, 2, 6, 3, 5, 9, 8, 7];
  const jobs = [], slots = [];
  for (let r = 0; r < rows; r++) {
    const y = (1 - r) * rowH - .3;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(cols * 1.47 + 1, .07, .7), wood); plank.position.set(0, y - .035, -.05); scene.add(plank);
    for (let c = 0; c < cols; c++) {
      const film = FILMS[order[(c + r * 4) % order.length]];
      const x = (c - (cols - 1) / 2) * (1.35 + gap);
      slots.push({ x, y, r, c, film });
      jobs.push(buildCase(renderer, film, { simple: true }));
    }
  }
  const built = await Promise.all(jobs);
  const cases = built.map((g, i) => {
    const s = slots[i]; const F = g.userData.F; const holder = new THREE.Group(); holder.add(g);
    holder.userData = { ...s, by: s.y + F.h / 2, lift: 0, tilt: (Math.sin(i * 12.9) * .5) * .06 };
    scene.add(holder); return holder;
  });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(-9, -9); let hover = null, mouse = { x: 0, y: 0 }, pm = { x: 0, y: 0 };
  canvas.addEventListener('pointermove', e => { const b = canvas.getBoundingClientRect(); ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); mouse.x = ndc.x; mouse.y = ndc.y; });
  canvas.addEventListener('pointerleave', () => ndc.set(-9, -9));

  let p = .5;
  const loop = visibleLoop(host, (dt, t) => {
    pm.x += (mouse.x - pm.x) * .04; pm.y += (mouse.y - pm.y) * .04;
    const span = (cols * 1.45) / 2 - (narrow ? 1.2 : 3.2);
    camera.position.set(lerp(-span, span, p) + pm.x * .4, .4 + pm.y * .25, 9.4);
    camera.lookAt(camera.position.x * .85, .1, 0);
    ray.setFromCamera(ndc, camera); const hit = ray.intersectObjects(cases, true)[0];
    let h = null; if (hit) { h = hit.object; while (h && !cases.includes(h)) h = h.parent; }
    hover = h; canvas.style.cursor = h ? 'pointer' : '';
    cases.forEach(c => {
      const u = c.userData; u.lift += ((c === hover ? 1 : 0) - u.lift) * .12;
      const bend = -Math.pow(u.x - camera.position.x, 2) * .025;
      c.position.set(u.x, u.by + u.lift * .18, bend + u.lift * .6);
      c.rotation.set(-u.lift * .05, u.tilt * (1 - u.lift) - (u.x - camera.position.x) * .03 * (1 - u.lift), 0);
    });
    renderer.render(scene, camera);
  });
  return { setProgress(v) { p = v; }, renderOnce: loop.renderOnce };
}
