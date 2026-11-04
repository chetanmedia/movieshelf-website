// DVD / Blu-ray cover maker. One renderer draws the whole insert (back, spine, front + bleed) in millimetres,
// used for the live preview, the 3D case and the 300 dpi export. Images never leave the browser.
// Insert sizes: DVD 273 x 183 mm with a 14 mm spine (Avery J8437, 4over4); Blu-ray / 4K UHD Elite cases
// 129 + 12 + 129 mm panels (Duplication.com), 148 mm tall (Ronyasoft). Bleed: 3 mm on every edge.
const root = document.getElementById('cm');
if (root) {
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const TPL = {
    dvd: { name: 'DVD', note: 'Standard 14 mm case', panel: 129.5, h: 183, spine: 14, case: '#14161c' },
    slim: { name: 'Slim DVD', note: '7 mm case', panel: 129.5, h: 183, spine: 7, case: '#14161c' },
    bd: { name: 'Blu-ray', note: '12 mm Elite case', panel: 129, h: 148, spine: 12, case: '#1f4fbf' },
    uhd: { name: '4K UHD', note: '12 mm black case', panel: 129, h: 148, spine: 12, case: '#111216' },
    bduk: { name: 'Blu-ray UK', note: '14 mm case', panel: 129, h: 148, spine: 14, case: '#1f4fbf' },
    multi: { name: 'Multi-disc', note: '15 mm Blu-ray case', panel: 129, h: 148, spine: 15, case: '#1f4fbf' },
  };
  const FONTS = ['Bebas Neue', 'Anton', 'Oswald', 'Playfair Display', 'Bricolage Grotesque', 'Instrument Serif', 'Figtree', 'Space Mono'];
  const BLEED = 3, SAFE = 3, KEY = 'ms-cover-maker-v1';
  // fallbacks so the cover still looks right if a web font is slow or blocked
  const STACK = { 'Bebas Neue': '"Bebas Neue", "Oswald", "Arial Narrow", Impact, sans-serif', 'Anton': 'Anton, Impact, "Arial Black", sans-serif', 'Oswald': 'Oswald, "Arial Narrow", sans-serif',
    'Playfair Display': '"Playfair Display", Georgia, serif', 'Bricolage Grotesque': '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif', 'Instrument Serif': '"Instrument Serif", Georgia, serif',
    'Figtree': 'Figtree, "Helvetica Neue", Arial, sans-serif', 'Space Mono': '"Space Mono", ui-monospace, Menlo, monospace' };
  const ff = f => STACK[f] || `"${f}", sans-serif`;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const DEFAULT = {
    tpl: 'bd', spine: 12, paper: (navigator.language || '').toLowerCase() === 'en-us' ? 'letter' : 'a4', guides: true,
    f: { zoom: 1, x: 0, y: 0, title: 'Midnight Archive', font: 'Bebas Neue', color: '#ffffff', size: 17, pos: 'bottom', banner: true, bannerText: 'COLLECTOR’S EDITION', bannerColor: '#1d3fa8' },
    s: { title: 'MIDNIGHT ARCHIVE', font: 'Bebas Neue', color: '#ffffff', num: '001', bg: 'auto', bgColor: '#141a2e', dir: 'down', zoom: 1, x: 0, y: 0 },
    b: { bg: 'blur', bgColor: '#10131d', zoom: 1, x: 0, y: 0, dim: true, tagline: 'Some films you watch. Some you keep.', body: 'Write your own synopsis here. Keep it to a few short paragraphs so it stays readable once printed.\n\nText wraps automatically and stays inside the safe area, away from the folds.', font: 'Figtree', color: '#e8eaf2', small: 'Your own notes · Runtime · Audio' },
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  let st = clone(DEFAULT), imgs = { front: null, back: null, spine: null };
  try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved?.st) st = { ...clone(DEFAULT), ...saved.st, f: { ...DEFAULT.f, ...saved.st.f }, s: { ...DEFAULT.s, ...saved.st.s }, b: { ...DEFAULT.b, ...saved.st.b } }; } catch {}

  // images aren't saved between visits, so don't restore settings that point at one
  if (st.s.bg === 'image') st.s.bg = 'auto';
  if (st.b.bg === 'image') st.b.bg = 'blur';
  const track = (name, props = {}) => document.dispatchEvent(new CustomEvent('ms:track', { detail: { name, props: { tool: 'cover-maker', ...props } } }));
  let used = false; const once = () => { if (!used) { used = true; track('Tool Used'); } };
  const get = k => k.split('.').reduce((o, p) => o?.[p], st);
  const set = (k, v) => { const ps = k.split('.'); let o = st; while (ps.length > 1) o = o[ps.shift()]; o[ps[0]] = v; };
  const tpl = () => TPL[st.tpl];
  const dims = () => { const t = tpl(); const w = t.panel * 2 + st.spine; return { w, h: t.h, W: w + BLEED * 2, H: t.h + BLEED * 2, panel: t.panel }; };

  // ---------- sample artwork (an original illustration, used until someone adds their own) ----------
  const demo = document.createElement('canvas');
  (function drawDemo() {
    demo.width = 1200; demo.height = 1500; const c = demo.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, 1500); g.addColorStop(0, '#0d1230'); g.addColorStop(.45, '#3b1d5e'); g.addColorStop(.72, '#c2477a'); g.addColorStop(1, '#ffb36b');
    c.fillStyle = g; c.fillRect(0, 0, 1200, 1500);
    let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 220; i++) { c.fillStyle = `rgba(255,255,255,${.25 + rnd() * .6})`; c.beginPath(); c.arc(rnd() * 1200, rnd() * 700, rnd() * 2.2, 0, 7); c.fill(); }
    const sun = c.createRadialGradient(600, 980, 20, 600, 980, 330); sun.addColorStop(0, '#fff2c4'); sun.addColorStop(.35, '#ffcf7a'); sun.addColorStop(1, 'rgba(255,160,90,0)');
    c.fillStyle = sun; c.beginPath(); c.arc(600, 980, 330, 0, 7); c.fill();
    const ridge = (base, amp, col, step) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, 1500); for (let x = 0; x <= 1200; x += step) c.lineTo(x, base - Math.abs(Math.sin(x * .006 + base) * amp) - rnd() * amp * .25); c.lineTo(1200, 1500); c.fill(); };
    ridge(1080, 160, '#2a1640', 40); ridge(1190, 120, '#1a0f2c', 30); ridge(1310, 80, '#0e0a1a', 24);
  })();

  // ---------- helpers ----------
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const avgCache = new WeakMap();
  const avgColor = src => { if (avgCache.has(src)) return avgCache.get(src); const v = avgColor0(src); avgCache.set(src, v); return v; };
  const avgColor0 = src => { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.drawImage(src, 0, 0, 1, 1); const [r, g, b] = x.getImageData(0, 0, 1, 1).data; const k = .55; return `rgb(${r * k | 0},${g * k | 0},${b * k | 0})`; };
  const cover = (ctx, src, x, y, w, h, zoom = 1, ox = 0, oy = 0) => {
    const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
    const s = Math.max(w / sw, h / sh) * zoom, dw = sw * s, dh = sh * s;
    const dx = x + (w - dw) / 2 + ox * (dw - w) / 2, dy = y + (h - dh) / 2 + oy * (dh - h) / 2;
    ctx.drawImage(src, dx, dy, dw, dh);
  };
  function wrap(ctx, text, maxW) {
    const out = [];
    for (const para of String(text).split('\n')) {
      if (!para.trim()) { out.push(''); continue; }
      let line = '';
      for (const word of para.split(/\s+/)) { const t = line ? `${line} ${word}` : word; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t; }
      out.push(line);
    }
    return out;
  }
  const fitText = (ctx, text, font, weight, maxW, startPx) => { let px = startPx; do { ctx.font = `${weight} ${px}px ${ff(font)}`; px -= 0.5; } while (ctx.measureText(text).width > maxW && px > 4); return px + .5; };

  // ---------- the renderer ----------
  // k = pixels per millimetre. Origin is the top-left of the bleed area.
  function render(ctx, k, { guides = false } = {}) {
    const d = dims(), b = BLEED, pw = d.panel, sp = st.spine;
    const xBack = b, xSpine = b + pw, xFront = b + pw + sp, yTop = b;
    const front = imgs.front || demo, frontLabel = !!imgs.front;
    ctx.save(); ctx.scale(k, k);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, d.W, d.H);
    // back background
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, xSpine, d.H); ctx.clip();
    if (st.b.bg === 'color') { ctx.fillStyle = st.b.bgColor; ctx.fillRect(0, 0, xSpine, d.H); }
    else if (st.b.bg === 'image' && imgs.back) { cover(ctx, imgs.back, 0, 0, xSpine, d.H, +st.b.zoom, +st.b.x, +st.b.y); if (st.b.dim) { const dg = ctx.createLinearGradient(0, 0, 0, d.H); dg.addColorStop(0, 'rgba(0,0,0,.55)'); dg.addColorStop(.6, 'rgba(0,0,0,.35)'); dg.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = dg; ctx.fillRect(0, 0, xSpine, d.H); } }
    else { ctx.filter = `blur(${6 * k}px) brightness(.45) saturate(1.2)`; ctx.scale(1, 1); cover(ctx, front, -6, -6, xSpine + 12, d.H + 12, 1.1); ctx.filter = 'none'; ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(0, 0, xSpine, d.H); }
    ctx.restore();
    // front artwork
    ctx.save(); ctx.beginPath(); ctx.rect(xFront, 0, d.W - xFront, d.H); ctx.clip();
    cover(ctx, front, xFront, 0, d.W - xFront, d.H, +st.f.zoom, +st.f.x, +st.f.y);
    ctx.restore();
    void frontLabel;
    // spine
    ctx.save(); ctx.beginPath(); ctx.rect(xSpine, 0, sp, d.H); ctx.clip();
    if (st.s.bg === 'image' && imgs.spine) cover(ctx, imgs.spine, xSpine, 0, sp, d.H, +st.s.zoom, +st.s.x, +st.s.y);
    else { ctx.fillStyle = st.s.bg === 'color' ? st.s.bgColor : avgColor(front); ctx.fillRect(xSpine, 0, sp, d.H); }
    const sg = ctx.createLinearGradient(xSpine, 0, xSpine + sp, 0); sg.addColorStop(0, 'rgba(255,255,255,.06)'); sg.addColorStop(.5, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,0,0,.18)');
    ctx.fillStyle = sg; ctx.fillRect(xSpine, 0, sp, d.H);
    ctx.translate(xSpine + sp / 2, yTop + d.h / 2); ctx.rotate(st.s.dir === 'up' ? -Math.PI / 2 : Math.PI / 2);
    const len = d.h - SAFE * 2 - (st.s.num ? 16 : 0);
    ctx.fillStyle = st.s.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (st.s.title && !st.s.noText) { fitText(ctx, st.s.title, st.s.font, 700, len, sp * .62); ctx.fillText(st.s.title, st.s.num ? -8 : 0, sp * .03); }
    if (st.s.num && !st.s.noText) {
      ctx.font = `700 ${Math.min(5, sp * .38)}px ${ff("Space Mono")}`;
      const nx = d.h / 2 - SAFE - 6;
      ctx.globalAlpha = .9; ctx.fillText(st.s.num, nx, 0); ctx.globalAlpha = 1;
      ctx.fillStyle = st.s.color; ctx.globalAlpha = .35; ctx.fillRect(nx - 7, -sp * .32, .3, sp * .64); ctx.globalAlpha = 1;
    }
    ctx.restore();
    // front banner + title
    const fx = xFront, fw = pw;
    if (st.f.banner && st.f.bannerText && !st.f.noText) {
      ctx.fillStyle = st.f.bannerColor; ctx.fillRect(fx, 0, d.W - fx, yTop + 11);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(fx, yTop + 10.6, d.W - fx, .4);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fitText(ctx, st.f.bannerText, 'Figtree', 700, fw - SAFE * 4, 4.6); ctx.fillText(st.f.bannerText, fx + fw / 2, yTop + 5.6);
    }
    if (st.f.title && !st.f.noText) {
      ctx.save(); ctx.fillStyle = st.f.color; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const lines = []; const px = +st.f.size;
      ctx.font = `700 ${px}px ${ff(st.f.font)}`;
      lines.push(...wrap(ctx, st.f.title, fw - SAFE * 2 - 6));
      const lh = px * 1.02, block = lh * lines.length;
      const top = st.f.pos === 'top' ? yTop + (st.f.banner ? 14 : SAFE) + px : st.f.pos === 'middle' ? yTop + d.h / 2 - block / 2 + px * .8 : yTop + d.h - SAFE - 6 - block + px * .8;
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 2.2; ctx.shadowOffsetY = .5;
      lines.forEach((l, i) => ctx.fillText(l, fx + fw / 2, top + i * lh));
      ctx.restore();
    }
    // back text
    const bx = xBack + SAFE + 6, bw = pw - SAFE * 2 - 12;
    let y = yTop + SAFE + 10;
    ctx.fillStyle = st.b.color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (st.b.tagline && !st.b.noText) {
      ctx.font = `italic 400 ${d.h > 160 ? 9 : 8}px ${ff("Instrument Serif")}`;
      for (const l of wrap(ctx, st.b.tagline, bw)) { ctx.fillText(l, bx, y + 6); y += 8.8; }
      y += 6;
    }
    if (st.b.body && !st.b.noText) {
      const bpx = d.h > 160 ? 3.4 : 3.1; ctx.font = `400 ${bpx}px ${ff(st.b.font)}`; ctx.globalAlpha = .92;
      for (const l of wrap(ctx, st.b.body, bw)) { if (y > yTop + d.h - SAFE - 18) break; ctx.fillText(l, bx, y + bpx); y += bpx * 1.5; }
      ctx.globalAlpha = 1;
    }
    if (st.b.small && !st.b.noText) {
      ctx.font = `500 2.6px ${ff("Space Mono")}`; ctx.globalAlpha = .7;
      const sy = yTop + d.h - SAFE - 8; ctx.fillRect(bx, sy - 5, bw, .2); ctx.fillText(st.b.small, bx, sy); ctx.globalAlpha = 1;
    }
    // print guides (preview only)
    if (guides) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 70, 110, .28)';
      ctx.fillRect(0, 0, d.W, b); ctx.fillRect(0, d.H - b, d.W, b); ctx.fillRect(0, b, b, d.h); ctx.fillRect(d.W - b, b, b, d.h);
      ctx.lineWidth = .35; ctx.strokeStyle = '#ff5c84'; ctx.setLineDash([]); ctx.strokeRect(b, b, d.w, d.h);
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.setLineDash([1.5, 1.2]);
      for (const x of [xSpine, xFront]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, d.H); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(120, 200, 255, .8)'; ctx.setLineDash([.6, .9]);
      ctx.strokeRect(xBack + SAFE, yTop + SAFE, pw - SAFE * 2, d.h - SAFE * 2);
      ctx.strokeRect(xFront + SAFE, yTop + SAFE, pw - SAFE * 2, d.h - SAFE * 2);
      ctx.setLineDash([]); ctx.font = `600 3.4px ${ff('Figtree')}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fillText('BACK', xBack + pw / 2, d.H - .7); ctx.fillText('FRONT', xFront + pw / 2, d.H - .7);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- preview canvas ----------
  const canvas = $('[data-canvas]'), cctx = canvas.getContext('2d');
  let raf = 0;
  function draw() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const d = dims(), wrapW = $('[data-flat]').clientWidth || 600;
      const dpr = Math.min(2, devicePixelRatio || 1), k = wrapW / d.W;
      canvas.width = Math.round(d.W * k * dpr); canvas.height = Math.round(d.H * k * dpr);
      canvas.style.aspectRatio = `${d.W} / ${d.H}`;
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(cctx, k, { guides: st.guides });
      $('[data-size]').innerHTML = `<b>${d.w.toFixed(1)} × ${d.h} mm</b> trim · ${d.W.toFixed(1)} × ${d.H} mm with 3 mm bleed · ${(d.w / 25.4).toFixed(2)} × ${(d.h / 25.4).toFixed(2)} in`
        + (d.h > 160 && st.paper === 'letter' ? '<br><span class="warn">A DVD cover only just fits on Letter paper. A4, or DVD insert paper, gives more room.</span>' : '');
      if (!$('[data-case]').hidden) draw3d();
    });
  }

  // ---------- 3D case ----------
  let rotY = 34, rotX = 6;
  function draw3d() {
    const d = dims(), k = 3.2, c = document.createElement('canvas');
    c.width = Math.round(d.W * k); c.height = Math.round(d.H * k);
    render(c.getContext('2d'), k);
    const url = c.toDataURL('image/jpeg', .9);
    const box = $('[data-case3d]'), scale = Math.min(1.6, ($('[data-case]').clientWidth * .55) / d.panel);
    const fw = d.panel * scale, fh = d.h * scale, sw = st.spine * scale;
    box.style.cssText = `width:${fw}px;height:${fh}px;--sw:${sw}px;--case:${tpl().case};transform:rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    const bgW = d.W * scale, bgH = d.H * scale, off = BLEED * scale;
    const face = (el, x) => { el.style.backgroundImage = `url(${url})`; el.style.backgroundSize = `${bgW}px ${bgH}px`; el.style.backgroundPosition = `${-x - off}px ${-off}px`; };
    face($('[data-face-front]'), (d.panel + st.spine) * scale);
    face($('[data-face-spine]'), d.panel * scale);
    face($('[data-face-back]'), 0);
    $('[data-face-edge]').style.cssText = `width:${sw}px`;
  }
  const caseWrap = $('[data-case]');
  let drag3 = null;
  caseWrap.addEventListener('pointerdown', e => { drag3 = { x: e.clientX, y: e.clientY, ry: rotY, rx: rotX }; caseWrap.setPointerCapture(e.pointerId); });
  caseWrap.addEventListener('pointermove', e => {
    if (!drag3) return;
    rotY = Math.max(-200, Math.min(90, drag3.ry + (e.clientX - drag3.x) * .5)); rotX = Math.max(-20, Math.min(25, drag3.rx - (e.clientY - drag3.y) * .25));
    $('[data-case3d]').style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
  caseWrap.addEventListener('pointerup', () => { drag3 = null; });

  // ---------- drag the front image on the flat preview ----------
  let dragF = null;
  // which part of the cover is under the pointer, and does it have a movable image?
  function partAt(e) {
    const d = dims(), r = canvas.getBoundingClientRect(), mm = (e.clientX - r.left) / r.width * d.W;
    if (mm >= BLEED + d.panel + st.spine) return { key: 'f', w: r.width * (d.panel / d.W) };
    if (mm >= BLEED + d.panel) return st.s.bg === 'image' && imgs.spine ? { key: 's', w: r.width * (st.spine / d.W) } : null;
    return st.b.bg === 'image' && imgs.back ? { key: 'b', w: r.width * (d.panel / d.W) } : null;
  }
  canvas.addEventListener('pointerdown', e => {
    const part = partAt(e); if (!part) return;
    const o = st[part.key];
    dragF = { ...part, x: e.clientX, y: e.clientY, fx: +o.x, fy: +o.y, h: canvas.getBoundingClientRect().height };
    canvas.setPointerCapture(e.pointerId); canvas.classList.add('grab'); once();
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragF) { const p2 = partAt(e); canvas.style.cursor = p2 ? 'grab' : 'default'; return; }
    const o = st[dragF.key], z = Math.max(1.05, +o.zoom);
    o.x = Math.max(-1, Math.min(1, dragF.fx - (e.clientX - dragF.x) / (dragF.w * (z - .95)) * 2));
    o.y = Math.max(-1, Math.min(1, dragF.fy - (e.clientY - dragF.y) / (dragF.h * (z - .95)) * 2));
    syncInputs([`${dragF.key}.x`, `${dragF.key}.y`]); draw();
  });
  const endDrag = () => { if (dragF) { dragF = null; canvas.classList.remove('grab'); save(); } };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

  // ---------- form binding ----------
  $$('[data-fonts]').forEach(s => { s.innerHTML = FONTS.map(f => `<option value="${f}" style="font-family:'${f}'">${f}</option>`).join(''); });
  $('[data-tpls]').innerHTML = Object.entries(TPL).map(([k, t]) => `<button type="button" data-tpl="${k}" style="--case:${t.case}"><i aria-hidden="true"></i><b>${t.name}</b><small>${t.note}</small><small>${(t.panel * 2 + t.spine).toFixed(0)} × ${t.h} mm</small></button>`).join('');
  function syncInputs(only) {
    for (const el of $$('[data-k]')) {
      const k = el.dataset.k; if (only && !only.includes(k)) continue;
      const v = get(k);
      if (el.type === 'checkbox') el.checked = !!v; else if (document.activeElement !== el || only) el.value = v;
    }
    $$('[data-tpl]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tpl === st.tpl));
    $$('[data-show-if]').forEach(el => { const [k, v] = el.dataset.showIf.split('='); el.hidden = get(k) !== v; });
    $$('[data-hide-if]').forEach(el => { el.hidden = !!get(el.dataset.hideIf); });
    $('[data-paper]').textContent = st.paper === 'a4' ? 'A4' : 'Letter';
  }
  let saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify({ st })); } catch {} }, 400); }
  root.addEventListener('input', e => {
    const el = e.target.closest('[data-k]'); if (!el) return;
    const k = el.dataset.k;
    let v = el.type === 'checkbox' ? el.checked : el.type === 'range' || el.type === 'number' ? +el.value : el.value;
    if (k === 'spine') v = Math.max(5, Math.min(40, v || tpl().spine));
    set(k, v); once(); syncInputs(['__none']); draw(); save();
  });
  root.addEventListener('change', e => { const el = e.target.closest('[data-k]'); if (el?.tagName === 'SELECT') { set(el.dataset.k, el.value); syncInputs(); loadFonts().then(draw); save(); } });
  root.addEventListener('click', e => {
    const t = e.target.closest('[data-tpl]');
    if (t) { st.tpl = t.dataset.tpl; st.spine = tpl().spine; once(); syncInputs(); draw(); save(); }
    const tab = e.target.closest('[data-tab]');
    if (tab) { $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', b === tab)); $$('[data-sec]').forEach(s => { s.hidden = s.dataset.sec !== tab.dataset.tab; }); }
    const v = e.target.closest('[data-view]');
    if (v) {
      $$('[data-view]').forEach(b => b.setAttribute('aria-selected', b === v));
      $('[data-flat]').hidden = v.dataset.view !== 'flat'; $('[data-case]').hidden = v.dataset.view !== 'case';
      if (v.dataset.view === 'case') { draw3d(); track('Tool 3D View'); }
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) { const w2 = rm.dataset.remove; imgs[w2] = null; if (w2 === 'back') st.b.bg = 'blur'; else st.s.bg = 'auto'; syncInputs(); draw(); save(); }
    if (e.target.closest('[data-reset]')) { st = clone(DEFAULT); imgs = { front: null, back: null, spine: null }; try { localStorage.removeItem(KEY); } catch {} syncInputs(); draw(); }
    const ex = e.target.closest('[data-export]');
    if (ex) exportFile(ex.dataset.export, ex);
  });

  // ---------- images ----------
  async function useFile(file, which) {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    try { imgs[which] = await loadImg(url); } catch { return; }
    if (which === 'front') { st.f.zoom = 1; st.f.x = 0; st.f.y = 0; }
    if (which === 'back') { st.b.bg = 'image'; st.b.zoom = 1; st.b.x = 0; st.b.y = 0; }
    if (which === 'spine') { st.s.bg = 'image'; st.s.zoom = 1; st.s.x = 0; st.s.y = 0; }
    once(); track('Tool Image Added', { which }); syncInputs(); draw();
  }
  root.addEventListener('change', e => { const f = e.target.closest('[data-file]'); if (f) useFile(f.files[0], f.dataset.file); });
  $$('[data-drop]').forEach(z => {
    z.addEventListener('dragover', e => { e.preventDefault(); z.classList.add('over'); });
    z.addEventListener('dragleave', () => z.classList.remove('over'));
    z.addEventListener('drop', e => { e.preventDefault(); z.classList.remove('over'); useFile(e.dataTransfer.files[0], z.dataset.drop); });
  });
  // dropping an image anywhere on the preview sets the front artwork
  $('[data-flat]').addEventListener('dragover', e => e.preventDefault());
  $('[data-flat]').addEventListener('drop', e => { e.preventDefault(); useFile(e.dataTransfer.files[0], 'front'); });

  // ---------- export ----------
  async function exportFile(kind, btn) {
    const label = btn.textContent; btn.disabled = true; btn.textContent = 'Preparing…';
    try {
      await loadFonts();
      const d = dims(), k = 300 / 25.4, c = document.createElement('canvas');
      c.width = Math.round(d.W * k); c.height = Math.round(d.H * k);
      render(c.getContext('2d'), k);
      const name = `${(st.f.title || st.s.title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover'}-${st.tpl}`;
      if (kind === 'png') {
        const blob = await new Promise(r => c.toBlob(r, 'image/png'));
        download(blob, `${name}.png`);
      } else {
        const jpg = new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/jpeg', .93))).arrayBuffer());
        const pdf = kind === 'pdf-exact' ? makePdf(jpg, c.width, c.height, d.W, d.H, 0, 0, null)
          : (() => { const [pw, ph] = st.paper === 'a4' ? [297, 210] : [279.4, 215.9]; const ox = (pw - d.W) / 2, oy = (ph - d.H) / 2; return makePdf(jpg, c.width, c.height, pw, ph, ox, oy, d); })();
        download(new Blob([pdf], { type: 'application/pdf' }), `${name}${kind === 'pdf-page' ? `-${st.paper}` : ''}.pdf`);
      }
      track('Tool Download', { kind, case: st.tpl });
    } finally { btn.disabled = false; btn.textContent = label; }
  }
  function download(blob, filename) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  // Minimal PDF: one page, one JPEG image, optional crop marks at the trim lines.
  function makePdf(jpg, pxW, pxH, pageWmm, pageHmm, oxMm, oyMm, d) {
    const pt = mm => +(mm * 72 / 25.4).toFixed(3);
    const PW = pt(pageWmm), PH = pt(pageHmm);
    const iw = d ? pt(d.W) : PW, ih = d ? pt(d.H) : PH, ix = pt(oxMm), iy = PH - pt(oyMm) - ih;
    let marks = '';
    if (d) {
      const b = pt(BLEED), L = pt(5), gap = pt(1.5), x0 = ix + b, x1 = ix + iw - b, y0 = iy + b, y1 = iy + ih - b;
      const folds = [ix + b + pt(d.panel), ix + b + pt(d.panel + st.spine)];
      const seg = (a, b2, c2, d2) => `${a} ${b2} m ${c2} ${d2} l S\n`;
      marks += '0 0 0 RG 0.4 w\n';
      for (const x of [x0, x1]) { marks += seg(x, iy - gap, x, iy - gap - L) + seg(x, iy + ih + gap, x, iy + ih + gap + L); }
      for (const y of [y0, y1]) { marks += seg(ix - gap, y, ix - gap - L, y) + seg(ix + iw + gap, y, ix + iw + gap + L, y); }
      marks += '[2 2] 0 d\n';
      for (const x of folds) { marks += seg(x, iy - gap, x, iy - gap - L) + seg(x, iy + ih + gap, x, iy + ih + gap + L); }
    }
    const content = `q ${iw} 0 0 ${ih} ${ix} ${iy} cm /Im0 Do Q\n${marks}`;
    const enc = new TextEncoder(), parts = [], offsets = [];
    let len = 0;
    const push = x => { const u = typeof x === 'string' ? enc.encode(x) : x; parts.push(u); len += u.length; };
    const obj = (n, body) => { offsets[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    obj(3, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
    obj(4, () => { push(`<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); push(jpg); push('\nendstream'); });
    obj(5, () => push(`<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream`));
    const xref = len;
    let x = 'xref\n0 6\n0000000000 65535 f \n';
    for (let i = 1; i <= 5; i++) x += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    push(`${x}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(parts);
  }

  // fonts must be loaded before the canvas can use them
  function loadFonts() {
    if (!document.fonts?.load) return Promise.resolve();
    const need = new Set([st.f.font, st.s.font, st.b.font, 'Instrument Serif', 'Space Mono', 'Figtree']);
    return Promise.all([...need].flatMap(f => [document.fonts.load(`700 20px "${f}"`), document.fonts.load(`400 20px "${f}"`), document.fonts.load(`italic 400 20px "${f}"`)]).map(p => p.catch(() => {}))).then(() => {});
  }

  // phones: the preview stays pinned at the top while editing, so the size and download buttons move below the editor
  const mq = matchMedia('(max-width: 980px)'), sizeEl = $('[data-size]'), exportEl = $('.cm-export');
  const place = () => { if (mq.matches) $('.cm-panel').append(sizeEl, exportEl); else $('.cm-stage').append(sizeEl, exportEl); };
  mq.addEventListener?.('change', place); place();
  addEventListener('resize', () => draw());
  syncInputs(); draw();
  loadFonts().then(draw);
  document.fonts?.ready.then(draw);
}
