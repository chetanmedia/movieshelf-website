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
      $('[data-mine-n]').textContent = all.length ? `${found} of ${all.length} recognised, so they get posters and details.` : '';
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
  function reveal(f, animate) {
    picked = f;
    const pick = $('[data-pick]'), reel = $('[data-reel]');
    const finish = () => {
      pick.innerHTML = cardHtml(f); pick.classList.remove('out'); void pick.offsetWidth; pick.classList.add('in');
      reel.classList.remove('go', 'landed', 'calm'); reel.innerHTML = ''; spinning = false; update();
      const p = new URLSearchParams(location.search); if (f.i) { p.set('m', f.i); } else p.delete('m');
      history.replaceState(history.state, '', `${location.pathname}${p.toString() ? '?' + p : ''}`);
    };
    if (!animate) { finish(); return; }
    spinning = true; update();
    if (calm.matches) { calmShuffle(f, finish); return; }
    // Slot-machine reel: posters race sideways through a spotlight and slow down onto the pick.
    const ready = warm.filter(w => w.ok && key(w.f) !== key(f)), list = pool(), tiles = [];
    for (let i = 0; i < 22; i++) tiles.push(ready.length > 6 ? ready[Math.floor(Math.random() * ready.length)].f : list[Math.floor(Math.random() * list.length)] || f);
    tiles.push(f);
    reel.innerHTML = `<div class="rm-strip">${tiles.map((t, i) => `<div class="rm-tile${t.p ? '' : ' nop'}${i === tiles.length - 1 ? ' final' : ''}">${t.p ? `<img src="${poster(t, 'w185')}" alt="" onerror="this.parentNode.classList.add('nop')">` : ''}<span>${esc(t.t)}</span></div>`).join('')}</div><div class="rm-spot" aria-hidden="true"></div>`;
    pick.classList.add('out');
    reel.classList.add('go');
    const strip = reel.querySelector('.rm-strip'), tile = strip.firstElementChild;
    const step = tile.offsetWidth + parseFloat(getComputedStyle(strip).columnGap || 14); // layout size (ignores the tiles' scale), now that the reel is visible
    const from = -tile.offsetWidth / 2, to = from - (tiles.length - 1) * step;
    const big = new Image(); if (f.p) big.src = poster(f, 'w342');
    const anim = strip.animate([
      { transform: `translateX(${from}px)`, filter: 'blur(0px)' },
      { transform: `translateX(${from + (to - from) * .25}px)`, filter: 'blur(5px)', offset: .18 },
      { transform: `translateX(${from + (to - from) * .9}px)`, filter: 'blur(2px)', offset: .62 },
      { transform: `translateX(${to}px)`, filter: 'blur(0px)' },
    ], { duration: 2100, easing: 'cubic-bezier(.2,.6,.15,1)', fill: 'forwards' });
    anim.onfinish = () => {
      reel.classList.add('landed');
      // give the full-size poster a moment to arrive so the card doesn't flash empty
      const done = () => { clearTimeout(cap); setTimeout(finish, 420); }, cap = setTimeout(done, 700);
      if (!f.p || big.complete) done(); else big.onload = big.onerror = done;
    };
    warmUp();
  }

  // Reduce motion: no sliding, just a quick cross-fade through a few posters in the spotlight.
  function calmShuffle(f, finish) {
    const pick = $('[data-pick]'), reel = $('[data-reel]');
    const ready = warm.filter(w => w.ok).map(w => w.f), list = pool();
    const tiles = Array.from({ length: 6 }, () => (ready.length ? ready : list)[Math.floor(Math.random() * (ready.length || list.length))] || f).concat(f);
    reel.innerHTML = `<div class="rm-fades">${tiles.map(t => `<div class="rm-tile${t.p ? '' : ' nop'}">${t.p ? `<img src="${poster(t, 'w185')}" alt="" onerror="this.parentNode.classList.add('nop')">` : ''}<span>${esc(t.t)}</span></div>`).join('')}</div><div class="rm-spot" aria-hidden="true"></div>`;
    pick.classList.add('out'); reel.classList.add('go', 'calm');
    const els = [...reel.querySelectorAll('.rm-tile')]; let i = 0;
    els[0].classList.add('show');
    const tick = setInterval(() => {
      els[i].classList.remove('show'); i++; els[i].classList.add('show');
      if (i === els.length - 1) { clearInterval(tick); els[i].classList.add('final'); reel.classList.add('landed'); setTimeout(() => { reel.classList.remove('calm'); finish(); }, 650); }
    }, 170);
    warmUp();
  }

  // Keep a handful of posters pre-loaded so the reel never shows empty tiles.
  let warm = [];
  function warmUp() {
    const list = pool().filter(f => f.p); if (!list.length) return;
    warm = warm.filter(w => w.ok).slice(-30);
    for (let i = 0; i < 16; i++) {
      const f = list[Math.floor(Math.random() * list.length)], w = { f, ok: false }, im = new Image();
      im.onload = () => { w.ok = true; }; im.src = poster(f, 'w185'); warm.push(w);
    }
  }

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
    if (t.closest('[data-spin]')) { spin(); return; }
    if (t.closest('[data-save]') && picked) {
      const k = key(picked), i = saved.findIndex(s => s.k === k);
      if (i >= 0) saved.splice(i, 1); else { saved.unshift({ k, t: picked.t, y: picked.y, p: picked.p || '', f: picked.mine ? picked : undefined }); track('Tool Save'); }
      store.set('saved', saved); $('[data-pick]').innerHTML = cardHtml(picked); update(); return;
    }
    if (t.closest('[data-seenit]') && picked) { seen.add(key(picked)); store.set('seen', [...seen]); spin(); return; }
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
  addEventListener('keydown', e => { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON|A/.test(document.activeElement?.tagName || '') && !$('[data-spin]').disabled) { e.preventDefault(); spin(); } });

  fetch('/tools/films.json').then(r => r.json()).then(j => {
    data = j; genres = j.genres || {};
    drawGenres();
    const m = +new URLSearchParams(location.search).get('m');
    const shared = m && j.films.find(f => f.i === m);
    if (shared) reveal(shared, false);
    update(); warmUp();
  }).catch(() => { $('[data-spin-label]').textContent = 'Couldn’t load films'; });
}
