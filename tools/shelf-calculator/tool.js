// Shelf space calculator. All maths is in millimetres; units are only for display.
// Case sizes: standard DVD keep case 14 mm, slim 7–9 mm (Ronyasoft case dimension guide);
// Blu-ray / 4K UHD Elite cases 12–14 mm, 171.5 mm tall (Duplication.com UHD case specs).
// Steelbook and VHS are averages of common retail cases and are marked as approximate.
const root = document.getElementById('sc');
if (root) {
  const F = [
    { k: 'dvd', name: 'DVD', spine: 14, h: 190, color: '#7d93ff', slip: true },
    { k: 'br', name: 'Blu-ray', spine: 12.5, h: 171.5, color: '#3d7bff', slip: true },
    { k: 'uhd', name: '4K UHD', spine: 13, h: 171.5, color: '#14161d', edge: '#5b6175', slip: true },
    { k: 'steel', name: 'Steelbook', spine: 14, h: 176, color: 'linear-gradient(90deg,#8d939f,#e3e7ee,#8d939f)' },
    { k: 'slim', name: 'Slim case', spine: 8, h: 184, color: '#6f7a94' },
    { k: 'vhs', name: 'VHS', spine: 27, h: 205, color: '#2a2420', edge: '#6d5a48' },
  ];
  const BOX = { k: 'box', name: 'Box sets', color: '#ffb547', h: 180 };
  const KALLAX = 330, IN = 25.4;
  const ICONS = {
    kallax: '<svg viewBox="0 0 32 32"><rect x="3" y="3" width="26" height="26" rx="2"/><path d="M16 3v26M3 16h26"/><path class="sp" d="M6 13V7m2.5 6V8m2.5 5V7m8 19v-6m2.5 6v-7m2.5 7v-6"/></svg>',
    billy80: '<svg viewBox="0 0 32 32"><rect x="5" y="2" width="22" height="28" rx="1.5"/><path d="M5 9.5h22M5 16h22M5 22.5h22"/><path class="sp" d="M8 9V5m2 4V4.5m2 4.5V5m6 11v-4m2 4v-4.5m2 4.5v-4"/></svg>',
    billy40: '<svg viewBox="0 0 32 32"><rect x="10" y="2" width="12" height="28" rx="1.5"/><path d="M10 9.5h12M10 16h12M10 22.5h12"/><path class="sp" d="M13 9V5m2 4V4.5m2 4.5V5"/></svg>',
    own: '<svg viewBox="0 0 32 32"><path d="M3 20h26M5 20v5m22-5v5"/><path class="sp" d="M7 19v-9m2.5 9v-10m2.5 10v-8m2.5 8v-9m2.5 9v-7"/><path d="M3 7h26" stroke-dasharray="2 2"/></svg>',
  };
  const form = root.querySelector('form');
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  let unit = (navigator.language || 'en-US').toLowerCase() === 'en-us' ? 'in' : 'cm';
  let grow = 20, used = false;

  // advanced spine inputs
  $('[data-adv]').innerHTML = F.map(f => `<label><span>${f.name}</span><span class="sc-len"><input type="number" step="0.5" min="1" max="80" name="sp_${f.k}" value="${f.spine}" aria-label="${f.name} spine width in millimetres"><span class="sc-u">mm</span></span></label>`).join('');

  // restore from URL
  const q = new URLSearchParams(location.search);
  if (q.has('u')) unit = q.get('u') === 'cm' ? 'cm' : 'in';
  if (q.has('grow')) grow = Math.max(0, Math.min(100, +q.get('grow') || 0));
  for (const f of F) {
    if (q.has(f.k)) form[f.k].value = Math.max(0, parseInt(q.get(f.k)) || 0);
    if (q.has('sp_' + f.k)) form['sp_' + f.k].value = +q.get('sp_' + f.k) || f.spine;
  }
  if (q.get('slip') === '1') form.slip.checked = true;
  const toU = mm => unit === 'in' ? mm / IN : mm / 10, fromU = v => unit === 'in' ? v * IN : v * 10;
  let boxMM = q.has('box') ? +q.get('box') || 0 : 0, shelfMM = q.has('shelf') ? +q.get('shelf') || 762 : (unit === 'in' ? 30 * IN : 800);
  const syncLenInputs = () => {
    form.box.value = +toU(boxMM).toFixed(1);
    form.shelfw.value = +toU(shelfMM).toFixed(1);
    $$('[data-u-short]').forEach(e => e.textContent = unit === 'in' ? 'in' : 'cm');
    $$('[data-unit]').forEach(b => b.setAttribute('aria-pressed', b.dataset.unit === unit));
  };
  $$('[data-grow]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.grow === grow));
  syncLenInputs();

  const fmt = mm => {
    if (unit === 'in') {
      const inches = Math.round(mm / IN);
      if (inches < 12) return `${inches} in`;
      const ft = Math.floor(inches / 12), r = inches % 12;
      return r ? `${ft} ft ${r} in` : `${ft} ft`;
    }
    return mm >= 1000 ? `${(mm / 1000).toFixed(2)} m` : `${Math.round(mm / 10)} cm`;
  };
  const alt = mm => unit === 'in' ? (mm >= 1000 ? `${(mm / 1000).toFixed(2)} m` : `${Math.round(mm / 10)} cm`) : (() => { const i = Math.round(mm / IN); return i < 12 ? `${i} in` : `${Math.floor(i / 12)} ft ${i % 12} in`; })();
  const n = v => Math.max(0, Math.floor(+v || 0));
  const plural = (x, s, p = s + 's') => `${x.toLocaleString()} ${x === 1 ? s : p}`;

  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = t => 1 - Math.pow(1 - t, 3);
  const tweens = new WeakMap();
  // Animate a number from its last value to a new one, writing it with fn(value).
  function tween(el, to, fn, ms = 600) {
    const st = tweens.get(el) || { v: 0 };
    cancelAnimationFrame(st.raf);
    const from = st.v;
    if (calm.matches || from === to) { st.v = to; el.textContent = fn(to); tweens.set(el, st); return; }
    const t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / ms); st.v = from + (to - from) * ease(k); el.textContent = fn(k === 1 ? to : st.v); if (k < 1) st.raf = requestAnimationFrame(step); };
    st.raf = requestAnimationFrame(step); tweens.set(el, st);
  }
  const replay = (el, cls) => { if (!el || calm.matches) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  // Tape measure: ticks and labels for the current total, in the chosen unit.
  let lastTape = '';
  function drawTape(total) {
    const tape = $('[data-tape]');
    if (!total) { tape.innerHTML = ''; lastTape = ''; return; }
    const key = `${Math.round(total)}:${unit}`;
    if (key === lastTape) return;
    lastTape = key;
    const units = unit === 'in' ? total / (12 * IN) : total / 1000; // feet or metres
    const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
    const major = steps.find(st => units / st <= 7) || 1000, minor = major / (major >= 1 && unit === 'in' && major < 2 ? 12 : 5);
    const W = 1000, x = v => (v / units) * W;
    let ticks = '', labels = '';
    for (let v = minor; v < units - minor * 0.3; v += minor) {
      const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6;
      ticks += `<line x1="${x(v).toFixed(1)}" x2="${x(v).toFixed(1)}" y1="0" y2="${isMajor ? 15 : 8}"/>`;
      if (isMajor) labels += `<span style="left:${(x(v) / 10).toFixed(2)}%">${+v.toFixed(2)}${unit === 'in' ? '′' : ' m'}</span>`;
    }
    tape.innerHTML = `<div class="tp-case" aria-hidden="true"><i></i></div>
      <div class="tp-strip"><svg viewBox="0 0 ${W} 32" preserveAspectRatio="none" aria-hidden="true"><g class="tk">${ticks}</g></svg>
        <div class="tp-lab" aria-hidden="true">${labels}</div><span class="tp-hook"></span></div>`;
    replay(tape, 'pull');
  }

  function kallaxPlan(cubes) {
    const units = [[25, '5×5'], [16, '4×4'], [10, '2×5'], [8, '2×4'], [4, '2×2'], [2, '1×2']];
    if (cubes <= 0) return '';
    const single = [...units].reverse().find(([c]) => c >= cubes);
    if (single) return `fits one KALLAX ${single[1]}`;
    const big = Math.floor(cubes / 25), rest = cubes - big * 25;
    const extra = rest ? [...units].reverse().find(([c]) => c >= rest) : null;
    return `${plural(big, 'KALLAX 5×5')}${extra ? ` + one ${extra[1]}` : ''}`;
  }

  function calc() {
    const slip = form.slip.checked;
    const rows = F.map(f => {
      const count = n(form[f.k].value), spine = Math.max(1, +form['sp_' + f.k].value || f.spine) + (slip && f.slip ? 1 : 0);
      return { ...f, count, spine, mm: count * spine };
    });
    boxMM = Math.max(0, fromU(+form.box.value || 0));
    shelfMM = Math.max(50, fromU(+form.shelfw.value || 0));
    const box = { ...BOX, mm: boxMM };
    const base = rows.reduce((a, r) => a + r.mm, 0) + boxMM;
    const total = base * (1 + grow / 100);
    const discs = rows.reduce((a, r) => a + r.count, 0);
    return { rows, box, base, total, discs };
  }

  function render() {
    const { rows, box, base, total, discs } = calc();
    tween($('[data-total]'), total, v => v ? fmt(v) : '0');
    drawTape(total);
    $('[data-sub]').innerHTML = total
      ? `of shelf for ${plural(discs, 'case')}${box.mm ? ' plus box sets' : ''}${grow ? `, including ${grow}% room to grow` : ''}. That's ${alt(total).replace(' ', '&nbsp;')}.`
      : 'Add some discs to see how much shelf you need.';
    // proportion bar
    const parts = [...rows.filter(r => r.mm), ...(box.mm ? [box] : [])];
    const bar = $('[data-bar]');
    const segs = [...parts.map(r => ({ k: r.k, g: r.mm, c: r.color, e: r.edge, name: r.name })), { k: 'grow', g: grow && base ? total - base : 0 }];
    for (const sg of segs) {
      let el = bar.querySelector(`[data-k="${sg.k}"]`);
      if (!el) { el = document.createElement('i'); el.dataset.k = sg.k; if (sg.k === 'grow') el.className = 'grow'; else { el.style.setProperty('--c', sg.c); if (sg.e) el.style.setProperty('--e', sg.e); el.title = sg.name; } el.style.flexGrow = 0; bar.append(el); void el.offsetWidth; }
      el.style.flexGrow = sg.g; el.hidden = !sg.g;
    }
    bar.querySelectorAll('i').forEach(el => { if (!segs.some(sg => sg.k === el.dataset.k)) { el.style.flexGrow = 0; el.hidden = true; } });
    const pk = root.querySelector('[data-peek]'); if (pk) tween(pk.querySelector('b'), total, v => v ? fmt(v) : '0');
    // furniture
    const cubes = Math.ceil(total / KALLAX), cubes2 = Math.ceil(total / KALLAX / 2);
    const b80 = Math.ceil(total / 760), b40 = Math.ceil(total / 360), own = Math.ceil(total / shelfMM);
    const fit = $('[data-fit]');
    const cards = [
      ['kallax', cubes, ['KALLAX cube', 'KALLAX cubes'], `${kallaxPlan(cubes)}. Shelving two rows deep? Then ${plural(cubes2, 'cube')}.`],
      ['billy80', b80, ['BILLY 80 cm shelf', 'BILLY 80 cm shelves'], `${plural(Math.ceil(b80 / 6), 'bookcase')} with the 6 shelves they come with.`],
      ['billy40', b40, ['BILLY 40 cm shelf', 'BILLY 40 cm shelves'], `${plural(Math.ceil(b40 / 6), 'narrow bookcase')} with 6 shelves each.`],
      ['own', own, ['shelf of your own', 'shelves of your own'], `at ${fmt(shelfMM)} wide each.`],
    ];
    fit.hidden = !total;
    if (!fit.children.length) fit.innerHTML = cards.map(([k]) => `<li class="f-${k}"><button type="button" data-show="${k}" aria-label="Preview on this furniture"><span class="fi" aria-hidden="true">${ICONS[k]}</span><div><b><span data-num>0</span> <span data-lbl></span></b><span data-note></span></div></button></li>`).join('');
    cards.forEach(([k, num, [one, many], note], i) => {
      const li = fit.children[i];
      li.querySelector('[data-show]').setAttribute('aria-pressed', k === view);
      tween(li.querySelector('[data-num]'), num, v => Math.round(v).toLocaleString());
      li.querySelector('[data-lbl]').textContent = num === 1 ? one : many;
      li.querySelector('[data-note]').textContent = note;
    });
    // per-format breakdown + KALLAX picture
    drawShelf(rows, box, total);
    // keep the URL shareable
    const p = new URLSearchParams();
    rows.forEach(r => { if (r.count) p.set(r.k, r.count); const s = +form['sp_' + r.k].value; if (s && s !== F.find(f => f.k === r.k).spine) p.set('sp_' + r.k, s); });
    if (box.mm) p.set('box', Math.round(box.mm));
    if (form.slip.checked) p.set('slip', '1');
    if (grow !== 20) p.set('grow', grow);
    p.set('u', unit);
    if (view !== 'kallax') p.set('v', view);
    if (finish !== 'white') p.set('fin', finish);
    if (Math.round(shelfMM) !== Math.round(unit === 'in' ? 30 * IN : 800)) p.set('shelf', Math.round(shelfMM));
    history.replaceState(null, '', `${location.pathname}?${p}`);
  }

  // ---------- the shelf preview: the collection drawn to scale on real furniture ----------
  const STYLES = {
    kallax: { name: 'KALLAX', cw: 330, ch: 330, frame: 30 },
    billy80: { name: 'BILLY 80', cw: 760, ch: 310, frame: 20, cols: 1, rows: 6 },
    billy40: { name: 'BILLY 40', cw: 360, ch: 310, frame: 20, cols: 1, rows: 6 },
    own: { name: 'My shelf', ch: 300, frame: 20, cols: 1, rows: 5 },
  };
  const FINISH = { white: ['#ece9e2', '#d6d1c6'], black: ['#2e2622', '#1d1714'], oak: ['#cfae84', '#b8936a'] };
  let view = ['kallax', 'billy80', 'billy40', 'own'].includes(q.get('v')) ? q.get('v') : 'kallax';
  let finish = FINISH[q.get('fin')] ? q.get('fin') : 'white';
  const KALLAX_UNITS = [[25, 5, 5, '5×5'], [16, 4, 4, '4×4'], [10, 2, 5, '2×5'], [8, 2, 4, '2×4'], [4, 2, 2, '2×2'], [2, 1, 2, '1×2']];

  function planUnits(style, total) {
    const st = STYLES[style];
    const cw = style === 'own' ? shelfMM : st.cw;
    if (style === 'kallax') {
      const cubes = Math.ceil(total / KALLAX);
      const out = [];
      let left = cubes;
      while (left > 25) { out.push(KALLAX_UNITS[0]); left -= 25; }
      if (left > 0) out.push([...KALLAX_UNITS].reverse().find(([c]) => c >= left));
      return out.map(([c, cols, rows, label]) => ({ cols, rows, cw: 330, ch: 330, frame: 30, label: `KALLAX ${label}` }));
    }
    const shelves = Math.ceil(total / cw);
    const n = Math.max(1, Math.ceil(shelves / st.rows));
    return Array.from({ length: n }, () => ({ cols: 1, rows: st.rows, cw, ch: st.ch, frame: st.frame, label: st.name }));
  }

  function drawShelf(rows, box, total) {
    const viz = $('[data-viz]');
    viz.hidden = !total;
    if (!total) return;
    if (!viz.querySelector('.sc-room')) {
      viz.innerHTML = `<div class="sc-viz-top"><p class="sc-viz-h">Preview your shelf</p>
        <div class="sc-seg sc-views" role="radiogroup" aria-label="Furniture">${Object.entries(STYLES).map(([k, v]) => `<button type="button" data-view="${k}">${v.name}</button>`).join('')}</div>
        <div class="sc-fin" role="radiogroup" aria-label="Finish">${Object.entries(FINISH).map(([k, [c]]) => `<button type="button" data-fin="${k}" style="--c:${c}" aria-label="${k === 'black' ? 'Black-brown' : k === 'oak' ? 'Oak effect' : 'White'} finish"></button>`).join('')}</div></div>
        <div class="sc-room"><div class="sc-stage"></div></div>
        <p class="sc-viz-cap"></p><span class="sc-tip" hidden></span><ul class="sc-legend"></ul>`;
    }
    $$('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === view));
    $$('[data-fin]').forEach(b => b.setAttribute('aria-pressed', b.dataset.fin === finish));
    const room = viz.querySelector('.sc-room'), stage = viz.querySelector('.sc-stage');
    room.style.setProperty('--wood', FINISH[finish][0]); room.style.setProperty('--wood2', FINISH[finish][1]);

    // lay the discs out in order: unit by unit, compartment by compartment, left to right
    const units = planUnits(view, total), MAXU = 10, shownU = units.slice(0, MAXU);
    const spines = [];
    for (const r of rows) for (let i = 0; i < r.count && spines.length < 6000; i++) spines.push(r);
    for (let left = box.mm; left > 0; left -= 45) spines.push({ ...box, spine: Math.min(45, left), box: true });
    const comps = [];
    let si = 0;
    for (const u of units) for (let c = 0; c < u.cols * u.rows; c++) {
      const list = []; let used = 0;
      while (si < spines.length && used + spines[si].spine <= u.cw) { list.push(spines[si]); used += spines[si++].spine; }
      if (!list.length && si < spines.length && spines[si].spine > u.cw) list.push(spines[si++]); // oversized item
      comps.push(list);
    }
    // scale everything so the tallest thing (furniture or the person) fits the stage
    const unitH = u => u.rows * u.ch + (u.rows + 1) * u.frame + (u.label.startsWith('KALLAX') ? 0 : 60);
    const tallest = Math.max(1750, ...shownU.map(unitH));
    const stageH = Math.min(340, Math.max(230, innerHeight * 0.36));
    const widest = Math.max(...shownU.map(u => u.cols * u.cw + (u.cols + 1) * u.frame));
    const avail = room.clientWidth - 70; // stage padding and gaps
    const k = Math.min(stageH / tallest, avail / (widest + 620)); // whole first unit + person always fit
    stage.style.setProperty('--k', k);
    let ci = 0, fresh = 0;
    const unitsHtml = [];
    shownU.forEach((u) => {
      const sig = `${u.cols}x${u.rows}:${u.cw}:${u.ch}:${k.toFixed(4)}`;
      const cells = [];
      for (let c = 0; c < u.cols * u.rows; c++, ci++) {
        const list = comps[ci] || [];
        cells.push(list.map((s, i) => `<i data-n="${s.name}${s.box ? '' : ` · ${s.spine} mm`}" style="--i:${i};width:${(Math.min(1, s.spine / u.cw) * 100).toFixed(3)}%;height:${Math.min(100, s.h / u.ch * 100 * (0.97 + ((i * 7) % 5) / 100)).toFixed(1)}%;--c:${s.color};${s.edge ? `--e:${s.edge}` : ''}"${s.box ? ' class="bx"' : ''}></i>`).join('') || '<span class="free" data-n="Room to grow"></span>');
      }
      unitsHtml.push({ sig, cells, u });
    });
    // person for scale first, then the furniture
    if (!stage.querySelector('.sc-person')) stage.insertAdjacentHTML('afterbegin', `<svg class="sc-person" viewBox="0 0 60 170" aria-hidden="true"><circle cx="30" cy="13" r="11"/><path d="M17 30h26a8 8 0 0 1 8 8v46a5 5 0 0 1-10 0V48h-1v116a6 6 0 0 1-12 0V102h-2v62a6 6 0 0 1-12 0V48h-1v36a5 5 0 0 1-10 0V38a8 8 0 0 1 8-8z"/></svg>`);
    stage.querySelector('.sc-person').style.height = `${1700 * k}px`;
    unitsHtml.forEach(({ sig, cells, u }, ui) => {
      let el = stage.children[ui + 1];
      if (!el || el.dataset.sig !== sig) {
        const fresh2 = document.createElement('div');
        fresh2.className = `sc-unit${u.label.startsWith('KALLAX') ? ' kx' : ' bl'}`;
        fresh2.dataset.sig = sig;
        fresh2.style.cssText = `--cols:${u.cols};--rows:${u.rows};--cw:${u.cw * k}px;--ch:${u.ch * k}px;--fr:${Math.max(3, u.frame * k)}px`;
        fresh2.innerHTML = cells.map(() => '<div class="sc-cube"></div>').join('') + `<span class="sc-unit-l">${u.label}</span>`;
        if (el) el.replaceWith(fresh2); else stage.append(fresh2);
        el = fresh2;
      }
      [...el.querySelectorAll('.sc-cube')].forEach((cube, i) => {
        if (cube.dataset.h !== cells[i]) { cube.innerHTML = cells[i]; cube.dataset.h = cells[i]; cube.style.setProperty('--d', `${Math.min(fresh++, 14) * 40}ms`); replay(cube, 'in'); }
      });
    });
    while (stage.children.length > shownU.length + 1) stage.lastElementChild.remove();
    const more = units.length - shownU.length;
    const names = [...new Set(units.map(u => u.label))];
    viz.querySelector('.sc-viz-cap').innerHTML = `${units.length === 1 ? `One ${names[0]}` : `${units.length} units: ${names.map(nm => `${units.filter(u => u.label === nm).length} × ${nm}`).join(' + ')}`}${more ? ` (first ${MAXU} shown)` : ''}. Person shown for scale.${units.length > 1 || stage.scrollWidth > stage.clientWidth ? ' <span class="swipe">Swipe to see it all →</span>' : ''}`;
    viz.querySelector('.sc-legend').innerHTML = [...rows.filter(r => r.count), ...(box.mm ? [box] : [])].map(r => `<li style="--c:${r.color};${r.edge ? `--e:${r.edge}` : ''}"><i></i>${r.name}${r.count != null ? ` <span>${r.count.toLocaleString()} × ${r.spine} mm</span>` : ` <span>${fmt(r.mm)}</span>`}</li>`).join('');
  }

  const once = () => { if (used) return; used = true; document.dispatchEvent(new CustomEvent('ms:track', { detail: { name: 'Tool Used', props: { tool: 'shelf-calculator' } } })); };
  let t;
  const update = () => { clearTimeout(t); t = setTimeout(render, 60); };
  form.addEventListener('input', () => { once(); update(); });
  root.addEventListener('click', e => {
    const step = e.target.closest('[data-d]');
    if (step && e.detail === 0) bump(step); // keyboard; pointer presses are handled below
    const u = e.target.closest('[data-unit]');
    if (u && u.dataset.unit !== unit) { calc(); unit = u.dataset.unit; syncLenInputs(); update(); }
    const g = e.target.closest('[data-grow]');
    if (g) { grow = +g.dataset.grow; $$('[data-grow]').forEach(b => b.setAttribute('aria-pressed', b === g)); once(); update(); }
    const vw = e.target.closest('[data-view]');
    if (vw) { view = vw.dataset.view; render(); }
    const fn = e.target.closest('[data-fin]');
    if (fn) { finish = fn.dataset.fin; render(); }
    const card = e.target.closest('[data-show]');
    if (card) { view = card.dataset.show; render(); $('[data-viz]').scrollIntoView({ behavior: calm.matches ? 'auto' : 'smooth', block: 'center' }); }
    const c = e.target.closest('[data-copy]');
    if (c) {
      const done = () => { c.textContent = 'Link copied'; setTimeout(() => (c.textContent = 'Copy link to this result'), 1800); };
      navigator.clipboard?.writeText(location.href).then(done, () => prompt('Copy this link', location.href));
      document.dispatchEvent(new CustomEvent('ms:track', { detail: { name: 'Tool Share', props: { tool: 'shelf-calculator' } } }));
    }
  });
  form.addEventListener('focusin', e => { if (e.target.type === 'number') setTimeout(() => e.target.select(), 0); });
  // re-scale the preview after rotating a phone or resizing
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(render, 200); });

  // steppers: tap to change by 10, hold to keep going (it speeds up)
  function bump(btn) {
    const inp = btn.parentElement.querySelector('input');
    inp.value = Math.max(0, n(inp.value) + +btn.dataset.d);
    replay(inp, 'bump'); once(); update(); meters();
  }
  let hold;
  const stop = () => clearTimeout(hold);
  root.addEventListener('pointerdown', e => {
    const btn = e.target.closest('[data-d]'); if (!btn || e.button > 0) return;
    e.preventDefault(); bump(btn);
    let wait = 380;
    const go = () => { bump(btn); wait = Math.max(45, wait * 0.82); hold = setTimeout(go, wait); };
    hold = setTimeout(go, wait);
  });
  ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(ev => root.addEventListener(ev, stop, true));

  // each format's swatch fills up like a little meter as the count grows
  function meters() { for (const f of F) { const sw = form[f.k].closest('.sc-f').querySelector('.sc-sw'); sw.style.setProperty('--fill', Math.min(1, Math.log10(n(form[f.k].value) + 1) / 3).toFixed(3)); } }
  form.addEventListener('input', meters);
  meters();

  // tooltip for the discs in the KALLAX picture
  const viz = $('[data-viz]');
  const tipAt = e => {
    const s = e.target.closest('.sc-cube i, .sc-cube .free'), tip = viz.querySelector('.sc-tip');
    if (!tip) return;
    if (!s) { tip.hidden = true; return; }
    const r = s.getBoundingClientRect(), v = viz.getBoundingClientRect();
    tip.textContent = s.dataset.n; tip.hidden = false;
    tip.style.left = `${Math.max(60, Math.min(v.width - 60, r.left - v.left + r.width / 2))}px`; tip.style.top = `${r.top - v.top - 8}px`;
  };
  viz.addEventListener('pointerover', tipAt);
  viz.addEventListener('pointerdown', tipAt);
  viz.addEventListener('scroll', () => { const tip = viz.querySelector('.sc-tip'); if (tip) tip.hidden = true; }, true);
  viz.addEventListener('pointerleave', () => { const tip = viz.querySelector('.sc-tip'); if (tip) tip.hidden = true; });

  // phones: a small pill shows the live total while the result card is off screen
  const peek = $('[data-peek]'), out = $('.sc-out'), inp = $('.sc-in');
  if (peek && 'IntersectionObserver' in window) {
    let outVis = false, inVis = false;
    const set = () => peek.classList.toggle('on', inVis && !outVis);
    new IntersectionObserver(es => es.forEach(e => { if (e.target === out) outVis = e.isIntersecting; else inVis = e.isIntersecting; set(); })).observe(out);
    new IntersectionObserver(es => es.forEach(e => { inVis = e.isIntersecting; set(); })).observe(inp);
    peek.addEventListener('click', () => out.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  render();
}
