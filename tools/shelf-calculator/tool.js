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
    $('[data-total]').textContent = total ? fmt(total) : '0';
    $('[data-sub]').innerHTML = total
      ? `of shelf for ${plural(discs, 'case')}${box.mm ? ' plus box sets' : ''}${grow ? `, including ${grow}% room to grow` : ''}. That's ${alt(total).replace(' ', '&nbsp;')}.`
      : 'Add some discs to see how much shelf you need.';
    // proportion bar
    const parts = [...rows.filter(r => r.mm), ...(box.mm ? [box] : [])];
    $('[data-bar]').innerHTML = parts.map(r => `<i style="flex:${r.mm};--c:${r.color};${r.edge ? `--e:${r.edge}` : ''}" title="${r.name}"></i>`).join('') + (grow && base ? `<i class="grow" style="flex:${total - base}"></i>` : '');
    const pk = root.querySelector('[data-peek]'); if (pk) pk.querySelector('b').textContent = total ? fmt(total) : '0';
    // furniture
    const cubes = Math.ceil(total / KALLAX), cubes2 = Math.ceil(total / KALLAX / 2);
    const b80 = Math.ceil(total / 760), b40 = Math.ceil(total / 360), own = Math.ceil(total / shelfMM);
    $('[data-fit]').innerHTML = !total ? '' : [
      `<li><b>${plural(cubes, 'KALLAX cube')}</b><span>${kallaxPlan(cubes)}. Shelving two rows deep? Then ${plural(cubes2, 'cube')}.</span></li>`,
      `<li><b>${plural(b80, 'BILLY 80 cm shelf', 'BILLY 80 cm shelves')}</b><span>${plural(Math.ceil(b80 / 6), 'bookcase')} with the 6 shelves they come with.</span></li>`,
      `<li><b>${plural(b40, 'BILLY 40 cm shelf', 'BILLY 40 cm shelves')}</b><span>${plural(Math.ceil(b40 / 6), 'narrow bookcase')} with 6 shelves each.</span></li>`,
      `<li class="own"><b>${plural(own, 'shelf', 'shelves')} of your own</b><span>at ${fmt(shelfMM)} wide each.</span></li>`,
    ].join('');
    // per-format breakdown + KALLAX picture
    drawCubes(rows, box, total);
    // keep the URL shareable
    const p = new URLSearchParams();
    rows.forEach(r => { if (r.count) p.set(r.k, r.count); const s = +form['sp_' + r.k].value; if (s && s !== F.find(f => f.k === r.k).spine) p.set('sp_' + r.k, s); });
    if (box.mm) p.set('box', Math.round(box.mm));
    if (form.slip.checked) p.set('slip', '1');
    if (grow !== 20) p.set('grow', grow);
    p.set('u', unit);
    if (Math.round(shelfMM) !== Math.round(unit === 'in' ? 30 * IN : 800)) p.set('shelf', Math.round(shelfMM));
    history.replaceState(null, '', `${location.pathname}?${p}`);
  }

  function drawCubes(rows, box, total) {
    const viz = $('[data-viz]');
    if (!total) { viz.innerHTML = ''; return; }
    const spines = [];
    for (const r of rows) for (let i = 0; i < r.count && spines.length < 4000; i++) spines.push(r);
    for (let left = box.mm; left > 0; left -= 45) spines.push({ ...box, spine: Math.min(45, left), box: true });
    const cubes = []; let cur = [], used = 0;
    for (const s of spines) {
      if (used + s.spine > KALLAX) { cubes.push(cur); cur = []; used = 0; }
      cur.push(s); used += s.spine;
    }
    if (cur.length) cubes.push(cur);
    const totalCubes = Math.ceil(total / KALLAX), shown = Math.min(totalCubes, 20);
    while (cubes.length < totalCubes) cubes.push([]);
    const cols = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(shown))));
    viz.innerHTML = `<p class="sc-viz-h">Your collection in KALLAX cubes${totalCubes > shown ? ` <span>(first ${shown} of ${totalCubes})</span>` : ''}</p>
      <div class="sc-cubes" style="--cols:${cols}">${cubes.slice(0, shown).map(c => `<div class="sc-cube">${c.map(s => `<i style="width:${(s.spine / KALLAX * 100).toFixed(2)}%;height:${(s.h / KALLAX * 100).toFixed(1)}%;--c:${s.color};${s.edge ? `--e:${s.edge}` : ''}"${s.box ? ' class="bx"' : ''}></i>`).join('')}${!c.length ? '<span class="free">room to grow</span>' : ''}</div>`).join('')}</div>
      <ul class="sc-legend">${[...rows.filter(r => r.count), ...(box.mm ? [box] : [])].map(r => `<li style="--c:${r.color};${r.edge ? `--e:${r.edge}` : ''}"><i></i>${r.name}${r.count != null ? ` <span>${r.count.toLocaleString()} × ${r.spine} mm</span>` : ` <span>${fmt(r.mm)}</span>`}</li>`).join('')}</ul>`;
  }

  const once = () => { if (used) return; used = true; document.dispatchEvent(new CustomEvent('ms:track', { detail: { name: 'Tool Used', props: { tool: 'shelf-calculator' } } })); };
  let t;
  const update = () => { clearTimeout(t); t = setTimeout(render, 60); };
  form.addEventListener('input', () => { once(); update(); });
  root.addEventListener('click', e => {
    const step = e.target.closest('[data-d]');
    if (step) { const inp = step.parentElement.querySelector('input'); inp.value = Math.max(0, n(inp.value) + +step.dataset.d); once(); update(); }
    const u = e.target.closest('[data-unit]');
    if (u && u.dataset.unit !== unit) { calc(); unit = u.dataset.unit; syncLenInputs(); update(); }
    const g = e.target.closest('[data-grow]');
    if (g) { grow = +g.dataset.grow; $$('[data-grow]').forEach(b => b.setAttribute('aria-pressed', b === g)); once(); update(); }
    const c = e.target.closest('[data-copy]');
    if (c) {
      const done = () => { c.textContent = 'Link copied'; setTimeout(() => (c.textContent = 'Copy link to this result'), 1800); };
      navigator.clipboard?.writeText(location.href).then(done, () => prompt('Copy this link', location.href));
      document.dispatchEvent(new CustomEvent('ms:track', { detail: { name: 'Tool Share', props: { tool: 'shelf-calculator' } } }));
    }
  });
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
