// Random movie generator. Film data comes from TMDB at build time (/tools/films.json); see scripts/tmdb.mjs.
const root = document.getElementById('rm');
if (root) {
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const IMG = 'https://image.tmdb.org/t/p/';
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem('ms-rm-' + k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem('ms-rm-' + k, JSON.stringify(v)); } catch {} } };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/^(the|a|an) /, '').replace(/[^a-z0-9]+/g, '');
  const track = (name, props = {}) => document.dispatchEvent(new CustomEvent('ms:track', { detail: { name, props: { tool: 'random-movie', ...props } } }));

  let data = null, genres = {}, mode = 'popular', picked = null, spinning = false;
  const filt = { g: new Set(), dec: 'any', len: 'any', rate: 0 };
  let seen = new Set(store.get('seen', [])), saved = store.get('saved', []), recent = [];

  // ---------- filters ----------
  const DECADES = [['any', 'Any'], ['2020', '2020s'], ['2010', '2010s'], ['2000', '2000s'], ['1990', '1990s'], ['1980', '1980s'], ['1970', '1970s'], ['old', 'Before 1970']];
  $('[data-decades]').innerHTML = DECADES.map(([k, l]) => `<button type="button" data-dec="${k}" aria-pressed="${k === 'any'}">${l}</button>`).join('');
  function drawGenres() {
    const order = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'];
    const ids = Object.entries(genres).filter(([, n]) => order.includes(n)).sort((a, b) => order.indexOf(a[1]) - order.indexOf(b[1]));
    $('[data-genres]').innerHTML = ids.map(([id, n]) => `<button type="button" data-g="${id}" aria-pressed="${filt.g.has(+id)}">${n === 'Science Fiction' ? 'Sci-fi' : n}</button>`).join('');
  }

  // own list: lines matched to the film data by title (and year when given)
  function myList() {
    const lines = $('[data-list]').value.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 2000);
    const byTitle = new Map();
    for (const f of data?.films || []) { const k = norm(f.t); if (!byTitle.has(k) || f.n > byTitle.get(k).n) byTitle.set(k, f); byTitle.set(k + f.y, f); }
    return lines.map(l => {
      const m = l.match(/^(.*?)\s*[([]?(\d{4})[)\]]?\s*$/);
      const title = m && m[1] ? m[1] : l, year = m && m[1] ? m[2] : '';
      return byTitle.get(norm(title) + year) || byTitle.get(norm(title)) || { t: title, y: year ? +year : 0, mine: true };
    });
  }

  function pool() {
    if (!data) return [];
    if (mode === 'mine') return myList().filter(f => !seen.has(key(f)));
    return data.films.filter(f => {
      if (mode === 'gems' && !f.h) return false;
      if (mode === 'xmas' && !f.x) return false;
      if (mode === 'popular' && (f.h && !f.x)) return false;
      if (seen.has(key(f))) return false;
      if (filt.g.size && ![...filt.g].every(g => f.g.includes(g))) return false;
      if (filt.dec === 'old' ? f.y >= 1970 : filt.dec !== 'any' && (f.y < +filt.dec || f.y > +filt.dec + 9)) return false;
      if (filt.len === 'short' && !(f.r && f.r < 90)) return false;
      if (filt.len === 'mid' && !(f.r >= 90 && f.r <= 120)) return false;
      if (filt.len === 'long' && !(f.r > 120)) return false;
      if (filt.rate && f.v && f.v < filt.rate) return false;
      return true;
    });
  }
  const key = f => f.i ? `i${f.i}` : `t${norm(f.t)}${f.y || ''}`;

  function update() {
    $$('[data-mode]').forEach(b => b.setAttribute('aria-selected', b.dataset.mode === mode));
    $('[data-filters]').hidden = mode === 'mine';
    $('[data-mine]').hidden = mode !== 'mine';
    $$('[data-g]').forEach(b => b.setAttribute('aria-pressed', filt.g.has(+b.dataset.g)));
    $$('[data-dec]').forEach(b => b.setAttribute('aria-pressed', b.dataset.dec === filt.dec));
    $$('[data-len]').forEach(b => b.setAttribute('aria-pressed', b.dataset.len === filt.len));
    $$('[data-rate]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.rate === filt.rate));
    const n = pool().length, spin = $('[data-spin]');
    if (data) {
      spin.disabled = !n || spinning;
      $('[data-spin-label]').textContent = n ? (picked ? 'Spin again' : 'Spin') : mode === 'mine' ? 'Add some films first' : 'No films match';
      $('[data-count]').textContent = mode === 'mine'
        ? (n ? `${n.toLocaleString()} film${n === 1 ? '' : 's'} on your list` : '')
        : `${n.toLocaleString()} film${n === 1 ? '' : 's'} match${n === 1 ? 'es' : ''}`;
    }
    if (mode === 'mine' && data) {
      const all = myList(), found = all.filter(f => !f.mine).length;
      $('[data-mine-n]').textContent = all.length ? `${found} of ${all.length} recognized, so they get posters and details.` : '';
    }
    drawSaved();
  }

  // ---------- the pick card ----------
  const runtime = r => r ? `${Math.floor(r / 60)} h ${r % 60} min`.replace(/^0 h /, '') : '';
  const gnames = f => (f.g || []).map(g => genres[g]).filter(Boolean).slice(0, 3).join(', ');
  const poster = (f, size) => f.p ? `${IMG}${size}${f.p}` : '';
  function cardHtml(f) {
    const isSaved = saved.some(s => s.k === key(f));
    const meta = [f.y || '', runtime(f.r), gnames(f)].filter(Boolean).join(' · ');
    return `<article class="rm-card">
      <div class="rm-poster${f.p ? '' : ' nop'}">${f.p ? `<img src="${poster(f, 'w342')}" alt="Poster for ${esc(f.t)}" width="342" height="513" onerror="this.parentNode.classList.add('nop')">` : ''}<div class="rm-noposter"><b>${esc(f.t)}</b>${f.y ? `<span>${f.y}</span>` : ''}</div></div>
      <div class="rm-info">
        <span class="eyebrow"><i></i>Tonight’s pick</span>
        <h2>${esc(f.t)}</h2>
        ${meta ? `<p class="rm-meta">${esc(meta)}</p>` : ''}
        ${f.v ? `<p class="rm-rate"><b>★ ${f.v.toFixed(1)}</b><span>/10 on TMDB · ${f.n.toLocaleString()} votes</span></p>` : ''}
        ${f.tg ? `<p class="rm-tag">“${esc(f.tg)}”</p>` : ''}
        ${f.o ? `<p class="rm-over">${esc(f.o)}</p>` : ''}
        ${f.d?.length ? `<p class="rm-crew"><span>Directed by</span> ${esc(f.d.join(' & '))}</p>` : ''}
        ${f.c?.length ? `<p class="rm-crew"><span>Starring</span> ${esc(f.c.slice(0, 3).join(', '))}</p>` : ''}
        ${f.mine ? '<p class="rm-over dim">From your list. We couldn’t find extra details for this one.</p>' : ''}
        <div class="rm-acts">
          <button type="button" class="rm-btn ${isSaved ? 'on' : ''}" data-save aria-pressed="${isSaved}">${isSaved ? '♥ Saved' : '♡ Save for later'}</button>
          <button type="button" class="rm-btn" data-seenit>Seen it, don’t show again</button>
          ${f.i > 0 ? `<a class="rm-btn" href="https://www.themoviedb.org/movie/${f.i}" target="_blank" rel="noopener">More on TMDB ↗</a>` : ''}
          <button type="button" class="rm-btn" data-share>Share</button>
        </div>
      </div>
    </article>`;
  }

  // ---------- spin ----------
  function choose(list) {
    const fresh = list.filter(f => !recent.includes(key(f)));
    const from = fresh.length ? fresh : list;
    return from[Math.floor(Math.random() * from.length)];
  }
  function spin() {
    const list = pool(); if (!list.length || spinning) return;
    const f = choose(list);
    recent = [key(f), ...recent].slice(0, 30);
    track('Tool Used', { mode });
    reveal(f, true);
  }
  // ---------- the slot machine ----------
  // Three reels (genre symbol, poster, year) driven frame by frame: a little wind-up, a fast spin with motion blur,
  // a long slow crawl, then a weighty overshoot that springs back onto the payline. Reels stop left, right, then poster.
  const slot = $('[data-machine]'), lever = $('[data-lever]'), msg = $('[data-slot-msg]');
  const reels = $$('.rm-reelv').map(el => ({ el, rs: el.querySelector('.rm-rs'), k: 1, items: [] }));
  const SYM = { 28: '💥', 12: '🗺️', 16: '🎨', 35: '😂', 80: '🕵️', 99: '🎥', 18: '🎭', 10751: '👪', 14: '🐉', 36: '🏛️', 27: '👻', 10402: '🎵', 9648: '🔍', 10749: '💘', 878: '🚀', 53: '🔪', 10752: '⚔️', 37: '🤠', 10770: '📺' };
  const SHORT = { 'Science Fiction': 'Sci-fi', 'Documentary': 'Doc', 'TV Movie': 'TV' };
  const symFor = f => {
    if (f.x || mode === 'xmas') return ['🎄', 'Xmas'];
    const g = (f.g || []).find(id => SYM[id]);
    return g ? [SYM[g], SHORT[genres[g]] || genres[g] || ''] : ['🎬', f.mine ? 'Yours' : 'Film'];
  };
  const symHtml = ([e, l]) => `<div class="rm-sym"><b>${e}</b><span>${esc(l)}</span></div>`;
  const yearHtml = y => `<div class="rm-sym yr"><b>${y || '★'}</b></div>`;
  const posterHtml = t => `<div class="rm-pt${t.p ? '' : ' nop'}"><div class="rm-pf">${t.p ? `<img src="${poster(t, 'w185')}" alt="" draggable="false" onerror="this.parentNode.parentNode.classList.add('nop')">` : ''}<span>${esc(t.t)}</span></div></div>`;
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const fillers = () => { const ready = warm.filter(w => w.ok).map(w => w.f), list = pool(); return ready.length > 5 ? ready : list.length ? list : data?.films || []; };
  const randGenreSym = () => { const ids = Object.keys(SYM).filter(id => genres[id] && id !== '10770'); if (!ids.length) return symHtml([rnd(['🎬', '🍿', '⭐', '🎟️']), '']); const id = rnd(ids); return symHtml([SYM[id], SHORT[genres[id]] || genres[id]]); };
  const randYear = () => yearHtml(1960 + Math.floor(Math.random() * 66));

  function place(r, k) {
    r.k = k;
    const h = r.h || (r.h = r.rs.firstElementChild?.offsetHeight || 1), H = r.H || (r.H = r.el.clientHeight);
    r.rs.style.transform = `translate3d(0,${((H - h) / 2 - (r.items.length - 1 - k) * h).toFixed(2)}px,0)`;
  }
  // items[0] sits below the payline, items[k] on it; higher indexes come down from above (reels roll downwards)
  function load(r, items, k) { r.items = items; r.rs.innerHTML = items.slice().reverse().join(''); r.h = r.H = 0; place(r, k); }
  function idle() {
    const fl = fillers();
    load(reels[0], [randGenreSym(), randGenreSym(), randGenreSym()], 1);
    load(reels[1], fl.length ? [posterHtml(rnd(fl)), posterHtml(rnd(fl)), posterHtml(rnd(fl))] : [0, 1, 2].map(() => '<div class="rm-pt nop"><div class="rm-pf"><span>🎬</span></div></div>'), 1);
    load(reels[2], [randYear(), randYear(), randYear()], 1);
  }
  function finalState(f) {
    load(reels[0], [randGenreSym(), symHtml(symFor(f)), randGenreSym()], 1);
    load(reels[1], [posterHtml(rnd(fillers()) || f), posterHtml(f), posterHtml(rnd(fillers()) || f)], 1);
    load(reels[2], [randYear(), yearHtml(f.y), randYear()], 1);
  }

  const easeQuart = u => 1 - Math.pow(1 - u, 4), easeQuint = u => 1 - Math.pow(1 - u, 5);
  function roll(r, final, makeFiller, n, dur, ease, onStop, onSpeed) {
    const cur = Math.round(r.k), old = r.items;
    const items = [old[cur - 1] ?? makeFiller(), old[cur] ?? makeFiller()];
    for (let i = 0; i < n; i++) items.push(makeFiller());
    items.push(final, makeFiller());
    load(r, items, 1);
    const K = items.length - 2, ov = .2, wind = 200, settle = 650, a = 7, w = 12;
    const t0 = performance.now(); let lastI = 1, lastK = 1, lastT = t0;
    const frame = now => {
      const t = now - t0; let k;
      if (t < wind) k = 1 - .16 * Math.sin(Math.PI * t / wind);
      else if (t < wind + dur) k = 1 + (K + ov - 1) * ease((t - wind) / dur);
      else { const s = (t - wind - dur) / 1000; k = K + ov * Math.exp(-a * s) * (Math.cos(w * s) + a / w * Math.sin(w * s)); }
      const done = t >= wind + dur + settle;
      if (done) k = K;
      place(r, k);
      const v = Math.abs(k - lastK) / Math.max(1, now - lastT) * 1000; lastK = k; lastT = now;
      r.el.classList.toggle('fast', v > 9); onSpeed?.(v);
      const i = Math.round(k); if (i !== lastI) { lastI = i; sfx.tick(); }
      if (!done) requestAnimationFrame(frame);
      else { r.el.classList.remove('fast'); r.el.classList.add('stop'); setTimeout(() => r.el.classList.remove('stop'), 400); onStop(); }
    };
    // the clunk lands as the reel hits the payline, before the bounce settles
    setTimeout(() => sfx.clunk(), wind + dur - 40);
    requestAnimationFrame(frame);
  }

  function reveal(f, animate) {
    picked = f;
    const pick = $('[data-pick]');
    const finish = () => {
      pick.innerHTML = cardHtml(f); pick.classList.remove('out', 'in'); void pick.offsetWidth; pick.classList.add('in');
      spinning = false; slot.classList.remove('spinning'); update();
      const p = new URLSearchParams(location.search); if (f.i) { p.set('m', f.i); } else p.delete('m');
      history.replaceState(history.state, '', `${location.pathname}${p.toString() ? '?' + p : ''}`);
    };
    if (!animate) { finalState(f); msg.textContent = `Tonight’s pick: ${f.t}`; finish(); return; }
    spinning = true; update();
    slot.classList.remove('win'); slot.classList.add('spinning');
    pick.classList.add('out');
    msg.textContent = rnd(['Rolling…', 'Feeling lucky…', 'Here we go…', 'Come on, big screen…']);
    const big = new Image(); if (f.p) big.src = poster(f, 'w342');
    const fl = fillers(), filmFiller = () => posterHtml(rnd(fl) || f);
    const win = () => {
      slot.classList.add('win'); sfx.jingle(); burst();
      msg.textContent = rnd(['Jackpot!', 'Winner!', 'Big win!', 'Lights, camera, jackpot!']) + ' ' + f.t;
      spins = store.get('spins', 0) + 1; store.set('spins', spins); drawSpins();
      const done = () => { clearTimeout(cap); setTimeout(finish, 380); }, cap = setTimeout(done, 900);
      if (!f.p || big.complete) done(); else big.onload = big.onerror = done;
    };
    if (calm.matches) { calmRoll(f, filmFiller, win); warmUp(); return; }
    const hum = sfx.motor();
    let stopped = 0;
    const stop = () => { if (++stopped === 3) { hum?.stop(); win(); } };
    roll(reels[0], symHtml(symFor(f)), randGenreSym, 14, 1500, easeQuart, stop);
    roll(reels[2], yearHtml(f.y), randYear, 18, 2200, easeQuart, stop);
    roll(reels[1], posterHtml(f), filmFiller, 24, 3300, easeQuint, stop, v => hum?.speed(v));
    warmUp();
  }

  // Reduce motion: reels don't travel. Side reels change in place, the poster window cross-fades a few films.
  function calmRoll(f, filmFiller, win) {
    let n = 0;
    const tick = setInterval(() => {
      n++; sfx.tick();
      load(reels[1], [filmFiller(), n < 7 ? filmFiller() : posterHtml(f), filmFiller()], 1);
      reels[1].el.classList.remove('swap'); void reels[1].el.offsetWidth; reels[1].el.classList.add('swap');
      if (n === 2) { load(reels[0], [randGenreSym(), symHtml(symFor(f)), randGenreSym()], 1); sfx.clunk(); }
      if (n === 4) { load(reels[2], [randYear(), yearHtml(f.y), randYear()], 1); sfx.clunk(); }
      if (n === 7) { clearInterval(tick); sfx.clunk(); win(); }
    }, 190);
  }

  // coins, popcorn and tickets burst out of the window on a win
  function burst() {
    if (calm.matches) return;
    const win = slot.querySelector('.rm-window'), box = win.getBoundingClientRect(), sb = slot.getBoundingClientRect();
    const cx = box.left - sb.left + box.width / 2, cy = box.top - sb.top + box.height / 2;
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('span'); s.className = 'rm-fx'; s.textContent = rnd(['🪙', '🪙', '🍿', '⭐', '🎟️', '🪙']);
      s.style.left = cx + 'px'; s.style.top = cy + 'px'; slot.appendChild(s);
      const ang = Math.random() * Math.PI * 2, sp = 140 + Math.random() * 220, dx = Math.cos(ang) * sp, up = -120 - Math.random() * 200;
      s.animate([
        { transform: 'translate(-50%,-50%) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * .6}px), calc(-50% + ${up}px)) scale(1.1) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: .4 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${up + 380}px)) scale(.9) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ], { duration: 1300 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => s.remove();
    }
  }

  // bulbs around the bezel: the top and bottom rows plus the sides, chasing in three phases
  function drawBulbs() {
    const pts = [];
    for (let i = 0; i <= 13; i++) { const x = 3 + i * 94 / 13; pts.push(`left:${x}%;top:7px`, `left:${x}%;top:calc(100% - 7px)`); }
    for (let i = 1; i <= 5; i++) { const y = i * 100 / 6; pts.push(`left:7px;top:${y}%`, `left:calc(100% - 7px);top:${y}%`); }
    $('[data-bulbs]').innerHTML = pts.map((p, i) => `<i style="${p};--n:${i % 3}"></i>`).join('');
  }

  // ---------- lever ----------
  function setLever(p) { lever.style.setProperty('--p', p.toFixed(3)); }
  let leverBusy = false;
  function pull() {
    if (spinning || leverBusy || $('[data-spin]').disabled) return;
    sfx.unlock();
    if (calm.matches) { spin(); return; }
    leverBusy = true;
    const t0 = performance.now(); let notch = 0;
    const down = 260, hold = 70, up = 520;
    const frame = now => {
      const t = now - t0; let p;
      if (t < down) { const u = t / down; p = u * u; const nn = Math.floor(p * 6); if (nn > notch) { notch = nn; sfx.ratchet(nn); } }
      else if (t < down + hold) p = 1;
      else { const u = Math.min(1, (t - down - hold) / up); p = Math.exp(-5 * u) * Math.cos(9 * u) * (1 - u); }
      setLever(Math.max(-.08, p));
      if (t >= down && !lever.dataset.fired) { lever.dataset.fired = 1; spin(); }
      if (t < down + hold + up) requestAnimationFrame(frame); else { setLever(0); delete lever.dataset.fired; leverBusy = false; }
    };
    requestAnimationFrame(frame);
  }
  // drag the knob down like the real thing; a tap pulls it for you
  let drag = null;
  lever.addEventListener('pointerdown', e => {
    if (spinning || leverBusy || $('[data-spin]').disabled) return;
    e.preventDefault(); lever.setPointerCapture(e.pointerId); sfx.unlock();
    drag = { y: e.clientY, p: 0, notch: 0, len: lever.offsetHeight * .5 };
  });
  lever.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.p = Math.max(0, Math.min(1, (e.clientY - drag.y) / drag.len)); setLever(drag.p);
    const nn = Math.floor(drag.p * 6); if (nn > drag.notch) { drag.notch = nn; sfx.ratchet(nn); } else if (nn < drag.notch) drag.notch = nn;
  });
  const release = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.p < .06) { setLever(0); pull(); return; }
    if (d.p > .6) { spin(); }
    // spring back
    const t0 = performance.now(), from = d.p;
    const frame = now => { const u = Math.min(1, (now - t0) / 480); setLever(from * Math.exp(-5 * u) * Math.cos(9 * u) * (1 - u)); if (u < 1) requestAnimationFrame(frame); else setLever(0); };
    requestAnimationFrame(frame);
  };
  lever.addEventListener('pointerup', release); lever.addEventListener('pointercancel', release);
  lever.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pull(); } });

  // ---------- sound (synthesised, nothing to download) ----------
  const sfx = (() => {
    let ctx = null, noise = null, lastTick = 0, muted = store.get('mute', false);
    const ac = () => {
      if (muted) return null;
      if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch { return null; } }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    const nbuf = c => { if (!noise) { noise = c.createBuffer(1, c.sampleRate * .4, c.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return noise; };
    const out = (c, node, t, peak, dec, att = .002) => { const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + att); g.gain.exponentialRampToValueAtTime(.0001, t + att + dec); node.connect(g); g.connect(c.destination); };
    const click = (c, t, f, vol, dec) => { const s = c.createBufferSource(); s.buffer = nbuf(c); const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = 3; s.connect(b); out(c, b, t, vol, dec); s.start(t, Math.random() * .3); s.stop(t + dec + .03); };
    const tone = (c, t, f, type, vol, dec, to) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dec); out(c, o, t, vol, dec, .004); o.start(t); o.stop(t + dec + .05); };
    return {
      get muted() { return muted; },
      setMuted(m) { muted = m; store.set('mute', m); if (m && ctx) ctx.suspend?.(); else ac(); },
      unlock() { ac(); },
      tick() { const c = ac(); if (!c) return; const n = c.currentTime; if (n - lastTick < .028) return; lastTick = n; click(c, n, 2400 + Math.random() * 800, .22, .022); tone(c, n, 1250, 'square', .018, .018); },
      clunk() { const c = ac(); if (!c) return; const n = c.currentTime; tone(c, n, 150, 'sine', .55, .22, 50); click(c, n, 420, .45, .09); click(c, n + .012, 3000, .18, .03); },
      ratchet(i) { const c = ac(); if (!c) return; const n = c.currentTime; click(c, n, 1500 + i * 120, .3, .03); tone(c, n, 240 + i * 20, 'square', .03, .03); },
      jingle() {
        const c = ac(); if (!c) return; const n = c.currentTime + .05;
        [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => { tone(c, n + i * .085, f, 'triangle', .2, .26); tone(c, n + i * .085, f * 2, 'sine', .05, .16); });
        for (let i = 0; i < 12; i++) { const t = n + .62 + i * .055 + Math.random() * .03; tone(c, t, 2300 + Math.random() * 900, 'sine', .07, .14); tone(c, t + .01, 3600 + Math.random() * 900, 'sine', .035, .09); }
      },
      motor() {
        const c = ac(); if (!c) return null;
        const o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
        o.type = 'sawtooth'; o.frequency.value = 60; lp.type = 'lowpass'; lp.frequency.value = 380; g.gain.value = .0001;
        o.connect(lp); lp.connect(g); g.connect(c.destination); o.start();
        g.gain.exponentialRampToValueAtTime(.045, c.currentTime + .25);
        return {
          speed(v) { const t = c.currentTime; o.frequency.setTargetAtTime(45 + Math.min(v, 40) * 3, t, .05); g.gain.setTargetAtTime(.008 + Math.min(v, 40) / 40 * .045, t, .08); },
          stop() { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(.0001, t, .05); o.stop(t + .4); },
        };
      },
    };
  })();
  const muteBtn = $('[data-mute]');
  const drawMute = () => { muteBtn.setAttribute('aria-pressed', sfx.muted); muteBtn.setAttribute('aria-label', sfx.muted ? 'Sound off' : 'Sound on'); };
  muteBtn.addEventListener('click', () => { sfx.setMuted(!sfx.muted); drawMute(); });
  drawMute();

  let spins = store.get('spins', 0);
  function drawSpins() { slot.style.setProperty('--spins', `"${String(spins).padStart(3, '0')}"`); }

  // Keep a handful of posters pre-loaded so the reels never show empty tiles.
  let warm = [];
  function warmUp() {
    const list = pool().filter(f => f.p); if (!list.length) return;
    warm = warm.filter(w => w.ok).slice(-40);
    for (let i = 0; i < 18; i++) {
      const f = list[Math.floor(Math.random() * list.length)], w = { f, ok: false }, im = new Image();
      im.onload = () => { w.ok = true; }; im.src = poster(f, 'w185'); warm.push(w);
    }
  }
  drawBulbs(); idle(); drawSpins();
  addEventListener('resize', () => reels.forEach(r => { r.h = r.H = 0; place(r, r.k); }));

  // ---------- saved / seen ----------
  function drawSaved() {
    const ul = $('[data-saved]');
    ul.innerHTML = saved.length ? saved.slice(0, 30).map(s => `<li><button type="button" data-open="${esc(s.k)}">${s.p ? `<img src="${IMG}w92${s.p}" alt="" loading="lazy">` : '<i></i>'}<span>${esc(s.t)}${s.y ? ` <em>${s.y}</em>` : ''}</span></button><button type="button" class="rm-x" data-unsave="${esc(s.k)}" aria-label="Remove ${esc(s.t)}">×</button></li>`).join('')
      : '<li class="none">Tap ♡ on a pick to save it here.</li>';
    $('[data-clear-saved]').hidden = !saved.length;
    $('[data-seen]').innerHTML = seen.size ? `${seen.size} film${seen.size === 1 ? '' : 's'} hidden as seen. <button type="button" class="rm-link" data-unseen>Show them again</button>` : '';
  }
  const findByKey = k => (data?.films || []).find(f => key(f) === k) || saved.find(s => s.k === k)?.f;

  // ---------- events ----------
  root.addEventListener('click', e => {
    const t = e.target;
    const m = t.closest('[data-mode]'); if (m) { mode = m.dataset.mode; update(); warm = []; warmUp(); return; }
    const g = t.closest('[data-g]'); if (g) { const id = +g.dataset.g; filt.g.has(id) ? filt.g.delete(id) : filt.g.add(id); update(); return; }
    const d = t.closest('[data-dec]'); if (d) { filt.dec = d.dataset.dec; update(); return; }
    const l = t.closest('[data-len]'); if (l) { filt.len = l.dataset.len; update(); return; }
    const r = t.closest('[data-rate]'); if (r) { filt.rate = +r.dataset.rate; update(); return; }
    if (t.closest('[data-clear]')) { filt.g.clear(); filt.dec = 'any'; filt.len = 'any'; filt.rate = 0; update(); return; }
    if (t.closest('[data-spin]')) { pull(); return; }
    if (t.closest('[data-save]') && picked) {
      const k = key(picked), i = saved.findIndex(s => s.k === k);
      if (i >= 0) saved.splice(i, 1); else { saved.unshift({ k, t: picked.t, y: picked.y, p: picked.p || '', f: picked.mine ? picked : undefined }); track('Tool Save'); }
      store.set('saved', saved); $('[data-pick]').innerHTML = cardHtml(picked); update(); return;
    }
    if (t.closest('[data-seenit]') && picked) { seen.add(key(picked)); store.set('seen', [...seen]); pull(); return; }
    if (t.closest('[data-share]') && picked) {
      const url = location.href, text = `Tonight’s pick: ${picked.t}${picked.y ? ` (${picked.y})` : ''}`;
      if (navigator.share) navigator.share({ title: text, text, url }).catch(() => {});
      else navigator.clipboard?.writeText(`${text} ${url}`).then(() => { const b = t.closest('[data-share]'); b.textContent = 'Link copied'; setTimeout(() => (b.textContent = 'Share'), 1600); });
      track('Tool Share'); return;
    }
    const o = t.closest('[data-open]'); if (o) { const f = findByKey(o.dataset.open); if (f) { reveal(f, false); $('[data-machine]').scrollIntoView({ behavior: calm.matches ? 'auto' : 'smooth', block: 'center' }); } return; }
    const u = t.closest('[data-unsave]'); if (u) { saved = saved.filter(s => s.k !== u.dataset.unsave); store.set('saved', saved); if (picked) $('[data-pick]').innerHTML = cardHtml(picked); update(); return; }
    if (t.closest('[data-clear-saved]')) { saved = []; store.set('saved', saved); update(); return; }
    if (t.closest('[data-unseen]')) { seen = new Set(); store.set('seen', []); update(); return; }
  });
  let lt; $('[data-list]').addEventListener('input', () => { clearTimeout(lt); lt = setTimeout(() => { store.set('list', $('[data-list]').value); update(); }, 250); });
  $('[data-list]').value = store.get('list', '');
  addEventListener('keydown', e => { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON|A/.test(document.activeElement?.tagName || '') && !$('[data-spin]').disabled) { e.preventDefault(); pull(); } });

  fetch('/tools/films.json').then(r => r.json()).then(j => {
    data = j; genres = j.genres || {};
    drawGenres();
    const m = +new URLSearchParams(location.search).get('m');
    const shared = m && j.films.find(f => f.i === m);
    if (shared) reveal(shared, false); else idle();
    update(); warmUp();
  }).catch(() => { $('[data-spin-label]').textContent = 'Couldn’t load films'; });
}
