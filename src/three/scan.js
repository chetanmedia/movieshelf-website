import { THREE, makeRenderer, studio, buildCase, laserLine, visibleLoop, fit, lerp, seg, ease } from './common.js';
import { DEMO } from '../films.js';

/* The disc half of the scan reel. The phone is an HTML element flown over it (see main.js). */
export async function initScan(canvas, { reduced = false } = {}) {
  const host = canvas.parentElement;
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50); camera.position.set(0, 0, 7.4);
  fit(renderer, camera, host);
  studio(scene, renderer, { warm: 2.6, rim: 2.6 });

  const kase = await buildCase(renderer, DEMO);
  const root = new THREE.Group(); root.add(kase); scene.add(root);
  const half = kase.userData.F.d / 2;
  const BR = kase.userData.backRect; const bcX = BR.x - (.83 - .5) * BR.w, bcY = BR.y + (.5 - .895) * BR.h;
  const laser = laserLine(.5); laser.rotation.y = Math.PI; laser.position.set(bcX, bcY, -half - .03); laser.visible = false; kase.add(laser);
  const disc = kase.userData.disc;

  let p = 0;
  const V = new THREE.Vector3(), bcPt = { x: 0, y: 0 };
  const loop = visibleLoop(host, (dt, t) => {
    const n = host.clientWidth / host.clientHeight < .9;
    const a = ease(seg(p, 0, .16)), c = seg(p, .3, .47), d = ease(seg(p, .47, .64)), e = ease(seg(p, .66, .92));
    // desktop: case sits right of the copy, slides left once the phone docks on the far right
    const cx = n ? lerp(0, -.3, d) + e * .2 : lerp(1.25, .15, d) + e * .3;
    root.position.set(cx, (n ? 1.05 : 0) + (n ? .35 : .3) * a * (1 - d), 0);
    const ry = lerp(-.42, Math.PI - .28, a) + lerp(0, Math.PI + .55, d);
    root.rotation.set(lerp(.06, -.12, e) + Math.sin(t * .5) * .02, ry + Math.sin(t * .35) * .04, lerp(.04, 0, a));
    root.scale.setScalar((n ? .68 : 1) * lerp(1, .8, e));

    laser.visible = c > 0 && c < .62;
    laser.position.y = bcY + .07 - .14 * (.5 - .5 * Math.cos(c * Math.PI * 7));
    laser.material.opacity = Math.sin(Math.min(1, c / .62) * Math.PI);

    kase.userData.setOpen(e * .78);
    disc.position.set(.02 + e * .1, .02 + e * .55, .004 + e * .95);
    disc.rotation.set(-e * .45, e * (reduced ? .5 : Math.sin(t * .7) * 1.25), t * 1.2 * e);

    camera.position.set(0, n ? .35 : 0, lerp(7.4, 6.8, p));
    camera.lookAt(n ? 0 : .2, n ? .35 : 0, 0);
    renderer.render(scene, camera);
    kase.updateMatrixWorld(); V.set(bcX, bcY, -half - .01); kase.localToWorld(V); V.project(camera);
    const r = canvas.getBoundingClientRect(); bcPt.x = r.left + (V.x * .5 + .5) * r.width; bcPt.y = r.top + (-V.y * .5 + .5) * r.height;
  });
  return { setProgress(v) { p = v; }, renderOnce: loop.renderOnce, barcode: () => bcPt };
}
