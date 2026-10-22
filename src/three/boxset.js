import { THREE, makeRenderer, studio, buildCase, boxArt, makeTex, printMat, visibleLoop, fit, lerp, seg, ease } from './common.js';
import { BOXSET } from '../films.js';
import { drawVariant, drawSleeveSide, drawSleeveBack } from './procedural.js';

export async function initBoxset(canvas) {
  const host = canvas.parentElement;
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50); camera.position.set(0, .3, 8);
  fit(renderer, camera, host);
  studio(scene, renderer, { warm: 2.4, rim: 2.8 });

  const art = await boxArt();
  const W = 1.44, H = 1.8, D = .44, T = .012;
  const board = new THREE.MeshPhysicalMaterial({ color: 0x0b1626, roughness: .55, clearcoat: .4, clearcoatRoughness: .3 });
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xc9a85a, metalness: .9, roughness: .3 });
  const sleeve = new THREE.Group(); scene.add(sleeve);
  const panel = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), board); m.position.set(x, y, z); sleeve.add(m); return m; };
  panel(W, H, T, 0, 0, D / 2); panel(W, H, T, 0, 0, -D / 2); panel(W, T, D, 0, H / 2, 0); panel(W, T, D, 0, -H / 2, 0); panel(T, H, D, -W / 2, 0, 0);
  const frontP = new THREE.Mesh(new THREE.PlaneGeometry(W - .006, H - .006), printMat(makeTex(renderer, art, W / H))); frontP.position.z = D / 2 + T / 2 + .001; sleeve.add(frontP);
  const backP = new THREE.Mesh(new THREE.PlaneGeometry(W - .006, H - .006), printMat(makeTex(renderer, drawSleeveBack(art), W / H))); backP.rotation.y = Math.PI; backP.position.z = -D / 2 - T / 2 - .001; sleeve.add(backP);
  const sideP = new THREE.Mesh(new THREE.PlaneGeometry(D, H - .006), printMat(makeTex(renderer, drawSleeveSide(art, BOXSET.t), D / H))); sideP.rotation.y = -Math.PI / 2; sideP.position.x = -W / 2 - T / 2 - .001; sleeve.add(sideP);
  [H / 2 + T / 2 + .001, -H / 2 - T / 2 - .001].forEach(y => { const s = new THREE.Mesh(new THREE.PlaneGeometry(W, .02), gold); s.rotation.x = -Math.PI / 2; s.position.set(0, y, D / 2 - .03); sleeve.add(s); });

  const parts = await Promise.all(BOXSET.parts.map((part, i) =>
    buildCase(renderer, { id: 'trilogy' + i, t: part.t, y: part.y, fmt: 'bluray', c: ['#071a2a', '#1b6a7a', '#f3d999'] }, { simple: true, fmt: 'bluray', frontOverride: drawVariant(art, i, part), spineTitle: part.t })));
  parts.forEach(c => scene.add(c));
  const dummy = new THREE.Object3D(); sleeve.add(dummy);
  const A = new THREE.Vector3(), Aq = new THREE.Quaternion(), As = new THREE.Vector3(), B = new THREE.Vector3(), Bq = new THREE.Quaternion(), E = new THREE.Euler();

  let p = 0;
  const loop = visibleLoop(host, (dt, t) => {
    const n = host.clientWidth / host.clientHeight < .9;
    const a = ease(seg(p, 0, .25)), b = seg(p, .2, .62), c = ease(seg(p, .62, .95));
    sleeve.position.set(lerp(n ? 0 : 1.1, n ? 0 : 1.3, c), lerp(n ? .5 : 0, n ? .1 : -.5, c), lerp(0, -2.2, c));
    sleeve.rotation.set(.06 + Math.sin(t * .5) * .02, lerp(.25, -.9, a) + lerp(0, .7, c) + Math.sin(t * .3) * .04, 0);
    sleeve.scale.setScalar((n ? .72 : 1) * lerp(1, .85, c));
    sleeve.updateMatrixWorld(true);
    parts.forEach((cs, i) => {
      const k = ease(seg(b, i * .16, i * .16 + .52));
      dummy.position.set(.01 + k * 1.75, 0, (1 - i) * .136); dummy.rotation.set(0, 0, 0); dummy.updateMatrixWorld(true);
      dummy.getWorldPosition(A); dummy.getWorldQuaternion(Aq); dummy.getWorldScale(As);
      const sx = n ? .95 : 1.5;
      B.set((i - 1) * sx + (n ? 0 : 1.35), (n ? .25 : .05) + (i === 1 ? .12 : 0) + Math.sin(t * .6 + i) * .04 * c, (i === 1 ? 1.1 : .7));
      Bq.setFromEuler(E.set(0, (1 - i) * .3 + Math.sin(t * .4 + i) * .03 * c, 0));
      cs.position.lerpVectors(A, B, c); cs.quaternion.slerpQuaternions(Aq, Bq, c); cs.scale.setScalar(lerp(As.x, n ? .62 : .88, c));
    });
    renderer.render(scene, camera);
  });
  return { setProgress(v) { p = v; }, renderOnce: loop.renderOnce };
}
