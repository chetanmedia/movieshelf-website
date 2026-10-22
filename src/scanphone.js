// A phone running Movieshelf's Scan Barcode screen. Call scan(film) to read a disc's barcode and add it.
import { statusBar, PW } from './app-ui.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const FL = { uhd: '4K UHD', bluray: 'Blu-ray', dvd: 'DVD' };
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const RET = { x: 196.5, y: 275 }; // viewfinder centre in screen points

export function makeScanPhone(wrap, { max = 10 } = {}) {
  wrap.innerHTML = `<div class="ip"><i class="ip-b l1"></i><i class="ip-b l2"></i><i class="ip-b r1"></i><div class="ip-scr app"><div class="scr sp" data-on>
    <div class="a-cam"><div class="a-feed sp-feed"></div><div class="a-camfade"></div></div>
    ${statusBar()}
    <div class="a-scantop"><span class="a-glass a-round"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></span><span class="a-seg"><b>Scan Barcode</b><span>Search</span></span><span class="a-glass a-round"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg></span></div>
    <div class="a-ret"><i></i><i></i><i></i><i></i><span class="a-laser"></span><span class="a-lock"></span></div>
    <div class="a-hint">Point the camera at a barcode</div>
    <div class="a-toast">${CHECK}<span></span></div>
    <div class="a-sheet">
      <i class="a-grab"></i>
      <div class="a-input"><span class="a-code"></span><i class="a-caret"></i><em>Enter barcode number</em></div>
      <div class="a-listhead"><b>Imported list <span class="a-n">0</span> / ${max}</b><span class="a-import">Import</span></div>
      <div class="sp-list"></div>
    </div>
  </div><i class="ip-glare"></i></div></div>`;
  const ip = wrap.querySelector('.ip'), fit = () => { ip.style.transform = `scale(${wrap.clientWidth / PW})`; }; fit(); new ResizeObserver(fit).observe(wrap);
  const scr = wrap.querySelector('.sp'), feed = wrap.querySelector('.sp-feed'), code = wrap.querySelector('.a-code'), nEl = wrap.querySelector('.a-n');
  const list = wrap.querySelector('.sp-list'), toast = wrap.querySelector('.a-toast span'), imp = wrap.querySelector('.a-import'), hint = wrap.querySelector('.a-hint');
  let n = 0, busy = false, idleUrl = null;
  const idle = url => {
    if (url !== undefined) idleUrl = url;
    feed.style.transition = 'filter .6s';
    if (!idleUrl) { feed.style.backgroundImage = 'none'; return; }
    feed.style.backgroundImage = `url(${idleUrl})`; feed.style.backgroundSize = '170% auto'; feed.style.backgroundPosition = '50% 40%'; feed.style.filter = 'blur(3px) brightness(.7)';
  };

  const frame = (f, W) => {
    const H = W * f.bc.r;
    feed.style.backgroundImage = `url(${f.back})`;
    feed.style.backgroundSize = `${W}px ${H}px`;
    feed.style.backgroundPosition = `${RET.x - f.bc.u * W}px ${RET.y - f.bc.v * H}px`;
  };
  const set = (k, on) => scr.classList.toggle(k, on);

  async function importAll() {
    imp.classList.add('go'); toast.textContent = `${n} discs imported`; set('added', true);
    await sleep(1400);
    set('added', false); imp.classList.remove('go'); list.innerHTML = ''; n = 0; nEl.textContent = 0; set('has', false);
  }

  return {
    get count() { return n; },
    /** Read the film's barcode and add it to the imported list. Resolves when done. */
    async scan(f, { speed = 1 } = {}) {
      if (busy || !f.bc) return false; busy = true;
      const T = ms => sleep(ms / speed);
      set('found', false); set('added', false); code.textContent = '';
      hint.textContent = 'Hold steady over the barcode';
      feed.style.transition = 'none'; frame(f, 470); feed.style.filter = 'blur(2px) brightness(.9)';
      void feed.offsetWidth;
      feed.style.transition = `background-size ${900 / speed}ms cubic-bezier(.3,.7,.2,1), background-position ${900 / speed}ms cubic-bezier(.3,.7,.2,1), filter ${700 / speed}ms`;
      frame(f, 780); feed.style.filter = '';
      await T(500);
      set('scanning', true);
      for (let i = 1; i <= f.bc.code.length; i++) { code.textContent = f.bc.code.slice(0, i); await T(55); }
      await T(150);
      set('scanning', false); set('found', true);
      n++; nEl.textContent = n; set('has', true);
      toast.textContent = `${f.t} added`; set('added', true);
      const r = document.createElement('div'); r.className = 'sp-row';
      r.innerHTML = `<span class="t" style="background-image:url(${f.front})"></span><span><b>${f.t}</b><small>${FL[f.fmt]} · ${f.y}</small></span><span class="ok">${CHECK}</span>`;
      list.prepend(r); while (list.children.length > 4) list.lastElementChild.remove();
      await T(1100);
      set('added', false); set('found', false); hint.textContent = 'Point the camera at a barcode';
      if (idleUrl) idle();
      if (n >= max) await importAll();
      busy = false; return true;
    },
    importAll,
    idle,
    reset() { list.innerHTML = ''; n = 0; nEl.textContent = 0; code.textContent = ''; ['found', 'added', 'scanning', 'has'].forEach(k => set(k, false)); },
  };
}
