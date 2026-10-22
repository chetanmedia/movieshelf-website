import { THREE, makeRenderer, studio, buildCase, laserLine, visibleLoop, fit, clamp01 } from './common.js';
import { FILMS, FMT_LABEL } from '../films.js';

const DESKTOP = [
  [-4.35, 1.55, -.8, .5, .07], [-3.35, -1.95, .2, .32, -.05], [-5.1, -.4, -3.1, .62, .1], [-2.35, 2.95, -4.3, .22, -.08],
  [4.35, 1.5, -.6, -.52, -.06], [3.45, -1.95, .3, -.36, .05], [5.2, -.3, -3.2, -.6, -.1], [2.35, 3.05, -4.5, -.22, .08],
  [-1.3, -3.45, -3.8, .16, .04], [1.45, -3.55, -4.1, -.18, -.05],
];
const MOBILE = [
  [-1.0, 2.5, -.3, .38, .07], [.1, 2.85, -1.5, -.08, -.03], [1.05, 2.4, -.6, -.4, -.06],
  [-1.02, -2.55, -.2, .32, -.05], [0, -2.95, -1.4, .05, .02], [1.05, -2.5, -.5, -.36, .05],
];

export async function initHero(canvas, chip, { reduced = false } = {}) {
  const host = canvas.parentElement;
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07080c, 9, 22);
  const CZ = host.clientWidth / host.clientHeight < .9 ? 10 : 9;
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 60); camera.position.set(0, 0, CZ);
  fit(renderer, camera, host);
  studio(scene, renderer, { warm: 2.8, rim: 2.4 });

  /* projector beam */
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xffc98a) } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 wp=modelMatrix*vec4(position,1.); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; uniform float uTime; uniform vec3 uColor;
      void main(){ float core=pow(abs(dot(vN,vV)),2.2); float along=smoothstep(0.,.85,vUv.y); float flick=.92+.08*sin(uTime*23.)*sin(uTime*7.3);
      gl_FragColor=vec4(uColor, core*along*.11*flick); }`,
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(3.6, 12, 64, 1, true), beamMat);
  beam.position.set(0, 2.2, -4.2); scene.add(beam);

  const N = 420, pos = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) { const y = -3.8 + Math.random() * 11.5; const rad = (8.2 - y) / 12 * 3.6 * Math.sqrt(Math.random()); const a = Math.random() * 6.283; pos[i * 3] = Math.cos(a) * rad; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(a) * rad - 4.2; seeds[i] = Math.random(); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = document.createElement('canvas'); dot.width = dot.height = 32; { const g = dot.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: .05, map: new THREE.CanvasTexture(dot), color: 0xffd6a0, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* cases */
  const narrow = () => host.clientWidth / host.clientHeight < .9;
  const layout = narrow() ? MOBILE : DESKTOP;
  const cases = [];
  layout.forEach((L, i) => {
    buildCase(renderer, FILMS[i % FILMS.length], { simple: i > 3 }).then(c => {
      const [x, y, z, ry, rz] = L;
      const holder = new THREE.Group(); holder.add(c); holder.scale.setScalar(narrow() ? .56 : .86); scene.add(holder);
      holder.userData = { x, y, z, ry, rz, spin: 0, vel: 0, born: performance.now() / 1000 + i * .06, idx: i };
      const laser = laserLine(1.3); laser.position.z = c.userData.F.d / 2 + .02; laser.visible = false; c.add(laser);
      c.userData.laser = laser;
      cases.push(holder);
    });
  });

  /* interaction */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let drag = null, lastX = 0, mouse = { x: 0, y: 0 }, pm = { x: 0, y: 0 };
  const pick = e => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const hit = ray.intersectObjects(cases, true)[0]; if (!hit) return null; let o = hit.object; while (o && !cases.includes(o)) o = o.parent; return o; };
  canvas.addEventListener('pointerdown', e => { const h = pick(e); if (!h) return; drag = h; lastX = e.clientX; h.userData.vel = 0; canvas.setPointerCapture(e.pointerId); host.classList.add('dragging'); });
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width - .5; mouse.y = (e.clientY - r.top) / r.height - .5;
    if (drag) { const dx = e.clientX - lastX; lastX = e.clientX; drag.userData.spin += dx * .012; drag.userData.vel = dx * .012; }
    else if (e.pointerType === 'mouse') canvas.style.cursor = pick(e) ? 'grab' : '';
  });
  const end = () => { drag = null; host.classList.remove('dragging'); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  /* scan events */
  const v = new THREE.Vector3();
  let nextScan = 2.6, scanning = null, scanT = 0, hits = 0;
  function startScan(t) {
    const pool = cases.filter(c => c.userData.z > -1.5 && c !== drag); if (!pool.length) { nextScan = t + 1; return; }
    scanning = pool[(hits++ * 3 + 1) % pool.length]; scanT = 0;
    const inner = scanning.children[0]; inner.userData.laser.visible = true;
    const f = inner.userData.film;
    chip.querySelector('[data-t]').textContent = f.t;
    chip.querySelector('[data-m]').textContent = `${FMT_LABEL[f.fmt]} · ${f.y}`;
  }

  let scrollFade = 0;
  const loop = visibleLoop(host, (dt, t) => {
    beamMat.uniforms.uTime.value = t;
    const p = dustGeo.attributes.position;
    for (let i = 0; i < N; i++) { let y = p.array[i * 3 + 1] - dt * (.05 + seeds[i] * .08); if (y < -3.8) y = 7.6; p.array[i * 3 + 1] = y; p.array[i * 3] += Math.sin(t * .4 + seeds[i] * 40) * dt * .03; }
    p.needsUpdate = true;

    pm.x += (mouse.x - pm.x) * .05; pm.y += (mouse.y - pm.y) * .05;
    camera.position.x = pm.x * .9; camera.position.y = -pm.y * .6 - scrollFade * 1.2; camera.position.z = CZ; camera.lookAt(0, -scrollFade * .6, 0);

    cases.forEach(c => {
      const u = c.userData; const k = reduced ? 1 : clamp01((t - u.born) / 1.6); const e = 1 - Math.pow(1 - k, 4);
      if (c !== drag) { u.spin += u.vel; u.vel *= .95; if (Math.abs(u.vel) < .002) u.spin += (Math.round(u.spin / 6.283) * 6.283 - u.spin) * .02; }
      c.position.set(u.x * (1 + (1 - e) * .5), u.y + Math.sin(t * .55 + u.idx) * .07, u.z - (1 - e) * 14);
      c.rotation.set(Math.sin(t * .4 + u.idx * 2) * .06, u.ry + u.spin + (1 - e) * 3 + Math.sin(t * .3 + u.idx) * .08, u.rz);
    });

    if (!reduced && t > nextScan && !scanning) startScan(t);
    if (scanning) {
      scanT += dt; const inner = scanning.children[0]; const F = inner.userData.F; const L = inner.userData.laser;
      const k = Math.min(1, scanT / .9); L.position.y = F.h / 2 - .1 - k * (F.h - .2); L.material.opacity = Math.sin(k * Math.PI);
      inner.updateMatrixWorld(); v.set(F.w / 2, F.h / 2, 0); inner.localToWorld(v); v.project(camera);
      const r = host.getBoundingClientRect();
      const cx = Math.min(r.width - 250, Math.max(16, (v.x * .5 + .5) * r.width - (v.x > .3 ? 230 : 0))), cy = Math.max(90, (-v.y * .5 + .5) * r.height);
      chip.style.transform = `translate(${cx}px, ${cy}px)`;
      if (scanT > .85) chip.classList.add('on');
      if (scanT > .9) L.visible = false;
      if (scanT > 3.1) { chip.classList.remove('on'); scanning = null; nextScan = t + 1.2; }
    }
    renderer.render(scene, camera);
  });

  return { setScroll(p) { scrollFade = p; }, renderOnce: loop.renderOnce };
}
