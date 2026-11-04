// Region code checker: will this DVD / Blu-ray / 4K disc play on my player?
// Country data and map paths come from regions.json (built by scripts/region-data/gen.mjs).
const root = document.getElementById('rc');
if (root) {
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const DVD = ['1', '2', '3', '4', '5', '6'], BD = ['A', 'B', 'C'];
  const COLORS = {
    dvd: { 1: '#6b8aff', 2: '#ffb547', 3: '#2fd15b', 4: '#ff6b8e', 5: '#b48cff', 6: '#3fd0d4' },
    bd: { A: '#6b8aff', B: '#ffb547', C: '#ff6b8e' },
  };
  const WHO = {
    dvd: { 1: 'US, Canada', 2: 'Europe, UK, Japan, Middle East', 3: 'Southeast Asia, Korea, Hong Kong', 4: 'Latin America, Australia, NZ', 5: 'Russia, India, Africa', 6: 'China' },
    bd: { A: 'Americas, Japan, Korea, SE Asia', B: 'Europe, UK, Africa, Australia', C: 'China, India, Russia' },
  };

  // ---- state (restored from the URL so a check can be shared) ----
  const q = new URLSearchParams(location.search);
  const guessCc = (navigator.language || 'en-US').split('-')[1]?.toUpperCase() || 'US';
  let fmt = ['dvd', 'bd', 'uhd'].includes(q.get('f')) ? q.get('f') : 'bd';
  let disc = new Set((q.get('d') || (fmt === 'dvd' ? '2' : 'B')).split(',').filter(Boolean));
  let player = q.get('p') || guessCc;
  let type = ['std', 'console', 'free', 'pc'].includes(q.get('t')) ? q.get('t') : 'std';
  let bought = q.get('b') || '';
  let data = null, by = {}, used = false;

  const track = (name, props = {}) => document.dispatchEvent(new CustomEvent('ms:track', { detail: { name, props: { tool: 'region-checker', ...props } } }));
  const once = () => { if (!used) { used = true; track('Tool Used'); } };
  const replay = (el, cls) => { if (!el || calm.matches) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const regionOf = (cc, f) => by[cc] ? (f === 'dvd' ? by[cc].dvd : by[cc].bd) : null;
  const THE = new Set(['US', 'GB', 'NL', 'PH', 'AE', 'CZ', 'BS', 'GM', 'CF', 'DO', 'MV', 'MH', 'SB', 'KY', 'VA', 'CD', 'CG']);
  const nameOf = cc => (THE.has(cc) ? 'the ' : '') + (by[cc]?.name || cc);
  const codes = () => fmt === 'dvd' ? DVD : BD;
  const isFree = () => fmt === 'uhd' || disc.has('free') || codes().every(c => disc.has(c));

  // ---- badges that look like the ones printed on cases ----
  function drawBadges() {
    const box = $('[data-badges]');
    $('[data-disc-hint]').textContent = fmt === 'uhd'
      ? '4K UHD Blu-ray discs have no region code, so there is nothing to pick.'
      : 'Tap the badge that matches the back of the case. Pick more than one if the disc shows several.';
    $('.rc-bought').hidden = fmt === 'uhd';
    if (fmt === 'uhd') { box.innerHTML = '<div class="rc-uhd-note"><span class="rc-b uhd"><b>4K</b><small>ULTRA HD</small></span><p>Plays in every country, on any 4K UHD player.</p></div>'; return; }
    const free = disc.has('free') || codes().every(c => disc.has(c));
    box.innerHTML = codes().map(c => `<button type="button" class="rc-b ${fmt}" data-code="${c}" aria-pressed="${!free && disc.has(c)}" style="--c:${COLORS[fmt][c]}" title="${WHO[fmt][c]}">${fmt === 'dvd' ? `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17"/><path d="M3 20h34M20 3c-6 5-6 29 0 34M20 3c6 5 6 29 0 34"/></svg>` : ''}<b>${c}</b><small>${WHO[fmt][c]}</small></button>`).join('')
      + `<button type="button" class="rc-b free" data-code="free" aria-pressed="${free}"><b>${fmt === 'dvd' ? 'ALL / 0' : 'ABC'}</b><small>Region-free</small></button>`;
  }

  // ---- the answer ----
  function verdict() {
    const pr = regionOf(player, fmt === 'uhd' ? 'bd' : fmt), pc = by[player];
    const fmtName = { dvd: 'DVD', bd: 'Blu-ray', uhd: '4K UHD disc' }[fmt];
    const discTxt = isFree() ? 'region-free' : `Region ${[...disc].filter(c => c !== 'free').sort().join(' + ')}`;
    const where = pc ? `bought in ${nameOf(player)}` : 'your player';
    let state, head, body, tips = [];
    if (fmt !== 'uhd' && !disc.size) {
      state = 'wait'; head = 'Pick the region on the disc'; body = 'Choose the badge printed on the back of the case, or the country you bought it in.';
    } else if (fmt === 'uhd') {
      state = type === 'pc' ? 'maybe' : 'yes';
      head = type === 'pc' ? 'Plays on a 4K-capable drive' : 'Plays';
      body = type === 'console' ? '4K UHD discs have no region lock, so any console with a 4K UHD drive plays them, such as the PS5 with a disc drive, the Xbox Series X and the Xbox One S and X. The PS4, PS4 Pro and Xbox Series S can’t read 4K discs.'
        : type === 'pc' ? 'There is no region lock, but very few computer drives and apps can play 4K UHD movies. Check that your drive is UHD-compatible.'
          : 'The 4K UHD Blu-ray format has no region coding, so this disc plays on any 4K UHD player in the world. A regular Blu-ray player can’t read 4K discs.';
      tips.push('If the case also has a regular Blu-ray inside, that disc can still be region locked. Check it separately.');
    } else if (isFree()) {
      state = 'yes'; head = 'Plays'; body = `A region-free ${fmtName} plays on any ${fmt === 'dvd' ? 'DVD' : 'Blu-ray'} player, including yours.`;
    } else if (type === 'free') {
      state = 'yes'; head = 'Plays on a region-free player';
      body = fmt === 'bd'
        ? `A truly region-free player plays ${discTxt} Blu-rays. Watch out: many players sold as “multi-region” only unlock DVDs. Look for “Blu-ray Region A/B/C” in the specs.`
        : `A region-free player ignores DVD region codes, so this ${discTxt} disc plays.`;
    } else if (pr && disc.has(pr)) {
      state = 'yes'; head = 'Plays'; body = `Your ${type === 'console' ? 'console' : 'player'}, ${where}, is ${fmt === 'dvd' ? 'DVD' : 'Blu-ray'} Region ${pr}, and this disc is ${discTxt}.`;
    } else if (type === 'pc') {
      const target = [...disc].filter(c => c !== 'free').sort()[0];
      state = 'maybe'; head = 'Only after switching your drive’s region';
      body = fmt === 'dvd'
        ? `Computer DVD drives can be set to Region ${target}, but only five times. The fifth change becomes permanent, so think before you switch.`
        : `Computer Blu-ray drives and playback apps also store a region and usually allow only a few changes. Switching to Region ${target} would let this disc play.`;
    } else {
      state = 'no'; head = 'Won’t play';
      body = `Your ${type === 'console' ? 'console' : 'player'}, ${where}, is ${fmt === 'dvd' ? 'DVD' : 'Blu-ray'} Region ${pr || '?'}, but this disc is locked to ${discTxt}. You’d see a “wrong region” message.`;
      if (fmt === 'bd') tips.push('Look for the 4K UHD edition of the same film. 4K discs have no region lock.', 'Check if a release for your region exists. Many imports get one later.');
      tips.push(`A region-free player plays it${fmt === 'bd' ? ', as long as it unlocks Blu-ray as well as DVD' : ''}.`);
      if (type === 'console') tips.push('Consoles follow the same region rules for movies as players, and can’t be switched.');
    }
    // PAL / NTSC catch for DVDs
    if (fmt === 'dvd' && state !== 'wait' && pc) {
      const discNtsc = bought ? !!by[bought]?.ntsc : (disc.has('1') || disc.has('free') ? null : [...disc].every(c => ['2', '4', '5', '6'].includes(c)) ? false : null);
      if (discNtsc === false && pc.ntsc) tips.unshift(`This DVD is probably PAL, and ${nameOf(player)} uses NTSC. Even with a region-free player, it needs to convert PAL or your TV must accept a 50Hz signal.${!bought && disc.has('2') ? ' (Japanese Region 2 DVDs are the exception: they’re NTSC.)' : ''}`);
      if (discNtsc === true && !pc.ntsc) tips.unshift('This DVD is probably NTSC. Most players and TVs outside North America handle NTSC fine, but older ones may not.');
    }
    if (pc?.unsure && fmt !== 'uhd') tips.push(`Sources disagree on the region for ${pc.name}. Check the label on the back of your player to be sure.`);
    const icon = { yes: '<path d="m6 12.5 4 4L18 8"/>', no: '<path d="M7 7l10 10M17 7 7 17"/>', maybe: '<path d="M12 7v6M12 16.5v.5"/>', wait: '<path d="M12 7v5l3 2"/>' }[state];
    const v = $('[data-verdict]');
    const key = state + head + body + tips.join();
    if (v.dataset.k === key) return;
    v.dataset.k = key; v.className = `rc-verdict ${state}`;
    v.innerHTML = `<div class="rc-v-top"><span class="rc-v-ico" aria-hidden="true"><svg viewBox="0 0 24 24">${icon}</svg></span>
      <div><span class="eyebrow"><i></i>${fmt === 'uhd' ? '4K UHD Blu-ray' : `${fmtName} · ${discTxt}`} → ${pc ? pc.name : 'your player'}</span><h3>${head}</h3></div></div>
      <p>${body}</p>${tips.length ? `<ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}`;
    replay(v, 'pop');
    const pk = $('[data-peek]'); pk.className = `rc-peek ${state}${pk.classList.contains('on') ? ' on' : ''}`; pk.querySelector('b').textContent = head;
  }

  // ---- map ----
  let mapReady = false;
  function buildMap() {
    const box = $('[data-map]');
    box.innerHTML = `<svg viewBox="0 0 960 470" role="img" aria-label="World map coloured by disc region">
      <g class="rc-countries">${data.shapes.map(([cc, d]) => `<path data-cc="${cc}" d="${d}"/>`).join('')}</g>
      <g class="rc-pin" data-pin><circle r="14" class="halo"/><circle r="6.5" class="dot"/><text y="-16" text-anchor="middle"></text></g></svg>`;
    mapReady = true;
  }
  const centroids = {};
  function pinTo(cc) {
    const pin = $('[data-pin]'); if (!pin) return;
    const pathEl = $(`.rc-countries path[data-cc="${cc}"]`);
    if (!pathEl) { pin.style.display = 'none'; return; }
    if (!centroids[cc]) {
      // largest piece of the country, so the pin lands on the mainland (e.g. US not Alaska)
      const segs = pathEl.getAttribute('d').split('M').filter(Boolean);
      let best = null, area = -1;
      for (const sg of segs) {
        const pts = sg.replace(/Z/g, '').split('L').map(p => p.split(',').map(Number)).filter(p => p.length === 2 && !p.some(isNaN));
        let a = 0, x = 0, y = 0;
        for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; const f = x1 * y2 - x2 * y1; a += f; x += (x1 + x2) * f; y += (y1 + y2) * f; }
        if (Math.abs(a) > area && a) { area = Math.abs(a); best = [x / (3 * a), y / (3 * a)]; }
      }
      centroids[cc] = best;
    }
    const c = centroids[cc]; if (!c) { pin.style.display = 'none'; return; }
    pin.style.display = '';
    pin.setAttribute('transform', `translate(${c[0].toFixed(1)} ${c[1].toFixed(1)})`);
    pin.querySelector('text').textContent = 'Your player';
  }
  function paintMap() {
    if (!mapReady) return;
    const mf = fmt === 'uhd' ? 'uhd' : fmt;
    $('[data-map-title]').textContent = fmt === 'uhd' ? 'Where 4K UHD discs play: everywhere' : `${fmt === 'dvd' ? 'DVD' : 'Blu-ray'} regions of the world`;
    const lit = new Set(isFree() ? codes() : [...disc]);
    for (const p of $$('.rc-countries path')) {
      const cc = p.dataset.cc, r = mf === 'uhd' ? 'all' : regionOf(cc, mf);
      const color = mf === 'uhd' ? '#2fd15b' : COLORS[mf][r] || '#3a3f52';
      p.style.setProperty('--c', color);
      p.classList.toggle('on', mf === 'uhd' || lit.has(r));
      p.classList.toggle('me', cc === player);
      p.classList.toggle('unsure', !!by[cc]?.unsure && mf === 'dvd');
    }
    $('[data-map]').classList.toggle('dimmed', fmt !== 'uhd' && disc.size > 0 && !isFree());
    pinTo(player);
    $('[data-legend]').innerHTML = mf === 'uhd'
      ? '<li style="--c:#2fd15b"><i></i>Every country</li>'
      : codes().map(c => `<li style="--c:${COLORS[mf][c]}" class="${lit.has(c) ? 'on' : ''}"><i></i><b>${c}</b> ${WHO[mf][c]}</li>`).join('');
  }

  // ---- selects ----
  function fillSelects() {
    const opts = data.countries.map(c => `<option value="${c.cc}">${c.name}</option>`).join('');
    $('[data-player]').innerHTML = opts;
    $('[data-bought]').innerHTML = '<option value="">Choose a country</option>' + opts;
    if (!by[player]) player = 'US';
    $('[data-player]').value = player;
    $('[data-bought]').value = bought;
  }

  function render() {
    $$('[data-f]').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === fmt));
    $$('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === type));
    drawBadges();
    if (data) { verdict(); paintMap(); }
    const p = new URLSearchParams();
    p.set('f', fmt);
    if (fmt !== 'uhd' && disc.size) p.set('d', [...disc].join(','));
    p.set('p', player);
    if (type !== 'std') p.set('t', type);
    if (bought && fmt !== 'uhd') p.set('b', bought);
    history.replaceState(history.state, '', `${location.pathname}?${p}`);
  }

  // ---- events ----
  root.addEventListener('click', e => {
    const f = e.target.closest('[data-f]');
    if (f && f.dataset.f !== fmt) {
      fmt = f.dataset.f; once();
      if (fmt !== 'uhd') {
        // keep the same "bought in" country if one is set, otherwise default to that player's opposite region for a useful demo
        disc = new Set(bought && by[bought] ? [regionOf(bought, fmt)] : [fmt === 'dvd' ? '2' : 'B']);
      }
      render();
    }
    const b = e.target.closest('[data-code]');
    if (b) {
      once(); bought = ''; $('[data-bought]').value = '';
      const c = b.dataset.code;
      if (c === 'free') disc = disc.has('free') ? new Set() : new Set(['free']);
      else { disc.delete('free'); disc.has(c) ? disc.delete(c) : disc.add(c); if (codes().every(x => disc.has(x))) disc = new Set(['free']); }
      render();
    }
    const t = e.target.closest('[data-t]');
    if (t) { type = t.dataset.t; once(); render(); }
    const cp = e.target.closest('[data-copy]');
    if (cp) {
      navigator.clipboard?.writeText(location.href).then(() => { cp.textContent = 'Link copied'; setTimeout(() => (cp.textContent = 'Copy link to this check'), 1800); }, () => prompt('Copy this link', location.href));
      track('Tool Share');
    }
  });
  root.addEventListener('change', e => {
    if (e.target.matches('[data-player]')) { player = e.target.value; once(); render(); }
    if (e.target.matches('[data-bought]')) {
      bought = e.target.value; once();
      if (bought && by[bought]) disc = new Set([regionOf(bought, fmt === 'uhd' ? 'bd' : fmt)]);
      render();
    }
  });

  // map: hover/tap shows the country and its regions; tap sets your player country
  const tip = $('[data-tip]'), mapbox = $('.rc-mapbox');
  const showTip = e => {
    const p = e.target.closest?.('.rc-countries path');
    if (!p) { tip.hidden = true; return; }
    const c = by[p.dataset.cc]; if (!c) return;
    const r = mapbox.getBoundingClientRect(), x = (e.clientX ?? 0) - r.left, y = (e.clientY ?? 0) - r.top;
    tip.innerHTML = `<b>${c.name}</b> DVD ${c.dvd} · Blu-ray ${c.bd}${c.unsure ? ' <em>(check)</em>' : ''}`;
    tip.hidden = false;
    tip.style.left = `${Math.max(80, Math.min(r.width - 80, x))}px`; tip.style.top = `${y - 14}px`;
  };
  mapbox.addEventListener('pointermove', showTip);
  mapbox.addEventListener('pointerleave', () => { tip.hidden = true; });
  mapbox.addEventListener('click', e => {
    const p = e.target.closest('.rc-countries path'); if (!p || !by[p.dataset.cc]) return;
    showTip(e);
    player = p.dataset.cc; $('[data-player]').value = player; once(); track('Tool Map Tap'); render();
  });

  // phones: a pill with the live answer while the result card is off screen
  const peek = $('[data-peek]'), outCard = $('.rc-out'), inCard = $('.rc-in');
  if ('IntersectionObserver' in window) {
    let outVis = false, inVis = false;
    const set = () => peek.classList.toggle('on', inVis && !outVis && !!data);
    new IntersectionObserver(es => es.forEach(e => { outVis = e.isIntersecting; set(); })).observe(outCard);
    new IntersectionObserver(es => es.forEach(e => { inVis = e.isIntersecting; set(); })).observe(inCard);
  }
  peek.addEventListener('click', () => $('[data-verdict]').scrollIntoView({ behavior: calm.matches ? 'auto' : 'smooth', block: 'start' }));

  render();
  fetch(new URL('regions.json', import.meta.url)).then(r => r.json()).then(j => {
    data = j; by = Object.fromEntries(j.countries.map(c => [c.cc, c]));
    fillSelects(); buildMap(); render();
  }).catch(() => { $('[data-map]').innerHTML = '<div class="rc-map-load">The map couldn’t load. The checker still works.</div>'; });
}
