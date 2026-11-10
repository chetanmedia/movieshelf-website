// Guess the Movie: a daily emoji film puzzle. Puzzles are hand-written (tools/guess-the-movie/_puzzles.json),
// checked against TMDB data at build time and published scrambled in puzzles.dat.
const root = document.getElementById('gm');
if (root) {
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const IMG = 'https://image.tmdb.org/t/p/';
  const MAX = 6;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/^(the|a|an) /, '').replace(/[^a-z0-9]+/g, '');
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem('ms-gtm-' + k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem('ms-gtm-' + k, JSON.stringify(v)); } catch {} } };
  const track = (name, props = {}) => document.dispatchEvent(new CustomEvent('ms:track', { detail: { name, props: { tool: 'guess-the-movie', ...props } } }));

  let P = null, films = [], idx = 0, today = 0, puzzle = null, st = null, states = store.get('states', {});
  const dayNo = d => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(...P.start.split('-').map((v, i) => i === 1 ? v - 1 : +v))) / 864e5);
  const dateOf = n => { const [y, m, d] = P.start.split('-').map(Number); return new Date(y, m - 1, d + n); };
  const puzzleFor = n => P.puzzles[((n % P.puzzles.length) + P.puzzles.length) % P.puzzles.length];

  // ---------- clues ----------
  const CLUES = [
    { ico: '🎬', label: 'Emoji', val: p => p.e },
    { ico: '📅', label: 'Year & genre', val: p => `${p.y} · ${p.g}` },
    { ico: '🤪', label: 'Explained badly', val: p => p.p },
    { ico: '🎥', label: 'Directed by', val: p => p.d },
    { ico: '⭐', label: 'Starring', val: p => p.a },
    { ico: '🔤', label: 'The title', val: p => shape(p.t) },
  ];
  const shape = t => t.split(' ').map((w, wi) => [...w].map((ch, ci) => /[a-z0-9]/i.test(ch) ? (wi === 0 && ci === 0 ? ch.toUpperCase() : '_') : ch).join(' ')).join('   ');
  const shown = () => Math.min(MAX, (st?.guesses.length || 0) + 1 + (st?.done ? MAX : 0));

  function drawEmoji(animate) {
    const box = $('[data-emoji]');
    box.innerHTML = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(puzzle.e)].map((s, i) => `<span style="--i:${i}">${s.segment}</span>`).join('');
    if (animate && !calm.matches) { box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop'); }
  }
  function drawClues(newest) {
    const n = shown();
    $('[data-ladder]').innerHTML = CLUES.map((c, i) => `<i class="${i < n ? 'on' : ''}${st.done && st.won && i === st.guesses.length - 1 ? ' win' : ''}"></i>`).join('');
    $('[data-clues]').innerHTML = CLUES.slice(1, n).map((c, i) => `<li class="${i + 1 === newest ? 'new' : ''}${i + 1 === 5 ? ' shape' : ''}"><span class="ci">${c.ico}</span><div><small>${c.label}</small><b>${esc(c.val(puzzle))}</b></div></li>`).join('')
      + (n < CLUES.length ? `<li class="locked"><span class="ci">🔒</span><div><small>Next clue: ${CLUES[n].label}</small><b>Unlocks after a wrong guess or skip${CLUES.length - n > 1 ? ` · ${CLUES.length - n - 1} more after that` : ''}</b></div></li>` : '');
  }
  function drawGuesses(newest) {
    $('[data-guesses]').innerHTML = st.guesses.map((g, i) => `<li class="${g.ok ? 'ok' : g.skip ? 'skip' : 'no'}${i === newest ? ' new' : ''}"><span>${g.ok ? '✓' : g.skip ? '→' : '✕'}</span>${g.skip ? 'Skipped' : esc(g.t)}</li>`).join('');
    const left = MAX - st.guesses.length;
    $('[data-left]').textContent = `${left} guess${left === 1 ? '' : 'es'} left`;
  }

  // ---------- autocomplete ----------
  let sugIdx = -1, sugList = [];
  function suggest() {
    const q = norm($('[data-guess]').value), ul = $('[data-sug]');
    if (q.length < 2) { ul.hidden = true; sugList = []; return; }
    const starts = [], has = [];
    for (const f of films) { const n = norm(f.t); if (n.startsWith(q)) starts.push(f); else if (n.includes(q)) has.push(f); if (starts.length > 30) break; }
    const byVotes = (a, b) => (b.n || 0) - (a.n || 0);
    sugList = [...starts.sort(byVotes), ...has.sort(byVotes)].slice(0, 6);
    sugIdx = -1;
    ul.innerHTML = sugList.map((f, i) => `<li role="option" data-i="${i}">${f.p ? `<img src="${IMG}w92${f.p}" alt="" loading="lazy" onerror="this.remove()">` : '<i></i>'}<span>${esc(f.t)}</span><em>${f.y || ''}</em></li>`).join('');
    ul.hidden = !sugList.length;
  }
  function pickSug(i) { const f = sugList[i]; if (!f) return; $('[data-guess]').value = f.t; $('[data-sug]').hidden = true; submit(f); }

  // ---------- guessing ----------
  function lev(a, b) { const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9; const d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
  function isRight(text, film) {
    if (film?.i && puzzle.i && film.i === puzzle.i) return true;
    const g = norm(text); if (!g) return false;
    return [puzzle.t, ...(puzzle.alt || [])].some(t => { const n = norm(t); return n === g || (n.length >= 8 && lev(n, g) <= 2); });
  }
  function submit(film) {
    if (!st || st.done) return;
    const inp = $('[data-guess]'), text = (film?.t || inp.value).trim();
    if (!text) { shake(); return; }
    if (st.guesses.some(g => !g.skip && norm(g.t) === norm(text))) { toast('You already tried that one'); shake(); return; }
    const ok = isRight(text, film);
    if (!st.guesses.length) track('Tool Used', { mode: st.archive ? 'archive' : 'daily' });
    st.guesses.push({ t: ok ? puzzle.t : text, ok });
    inp.value = ''; $('[data-sug]').hidden = true;
    after(ok);
  }
  function skip() { if (!st || st.done) return; if (!st.guesses.length) track('Tool Used', { mode: st.archive ? 'archive' : 'daily' }); st.guesses.push({ skip: true }); after(false); }
  function after(ok) {
    if (ok) { st.done = true; st.won = true; }
    else if (st.guesses.length >= MAX) { st.done = true; st.won = false; }
    save();
    drawGuesses(st.guesses.length - 1);
    if (!ok) { if (!st.guesses.at(-1).skip) shake(); drawClues(st.done ? -1 : shown() - 1); }
    if (st.done) finish(true);
  }
  function shake() { const f = $('[data-form]'); if (calm.matches) return; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
  function save() { states[st.n] = st; store.set('states', states); drawStreak(); }

  // ---------- end of a round ----------
  function finish(fresh) {
    $('[data-play]').hidden = true;
    drawClues(-1);
    const back = $('[data-poster-back]');
    back.innerHTML = puzzle.poster ? `<img src="${IMG}w342${puzzle.poster}" alt="Poster for ${esc(puzzle.t)}" onerror="this.parentNode.innerHTML='<b>${esc(puzzle.t).replace(/'/g, '&#39;')}</b>'">` : `<b>${esc(puzzle.t)}</b>`;
    const pos = $('[data-poster]'); pos.hidden = false;
    $('[data-stage]').classList.add('solved');
    requestAnimationFrame(() => pos.classList.add('flip'));
    if (fresh) { track(st.won ? 'Game Won' : 'Game Lost', { tries: st.guesses.length, archive: !!st.archive }); if (st.won) confetti(); }
    const tries = st.guesses.length, grid = gridOf(st);
    const res = $('[data-result]'); res.hidden = false;
    res.innerHTML = `<div class="gm-res-top">
        <span class="gm-badge ${st.won ? 'win' : 'lose'}">${st.won ? ['Genius!', 'Brilliant!', 'Great call!', 'Nice one!', 'Got there!', 'Phew!'][tries - 1] : 'So close'}</span>
        <h2>${esc(puzzle.t)} <span>(${puzzle.y})</span></h2>
        <p>${st.won ? `You got it in <b>${tries}</b> of ${MAX}.` : 'Better luck with the next one.'}</p>
        <div class="gm-grid" aria-label="Your result">${grid.split('').length ? [...grid].map((c, i) => `<i style="--i:${i}">${c}</i>`).join('') : ''}</div>
      </div>
      <div class="gm-res-acts">
        <button type="button" class="gm-share" data-share>Share result</button>
        ${st.archive ? `<button type="button" class="gm-btn" data-today>Back to today’s film</button>` : `<div class="gm-next"><small>Next film in</small><b data-countdown>--:--:--</b></div>`}
      </div>
      <div class="gm-more">
        ${today > 0 ? `<button type="button" class="gm-card" data-open="archive"><b>🗓️ Play past films</b><span>${today} earlier puzzle${today === 1 ? '' : 's'} to try</span></button>` : `<a class="gm-card" href="/tools/christmas-movie-trivia/"><b>🎄 Christmas movie trivia</b><span>Ten quick questions. Beat your best score.</span></a>`}
        <a class="gm-card" href="/tools/random-movie/"><b>🎲 Pick something to watch</b><span>Spin the random movie generator</span></a>
        <a class="gm-card" href="https://apps.apple.com/us/app/movieshelf-media-organizer/id6760224869?ct=tool-guess-the-movie&amp;mt=8" target="_blank" rel="noopener"><b>📀 Own it on disc?</b><span>Catalog your collection in Movieshelf</span></a>
      </div>`;
    if (!st.archive) tick();
    if (fresh && !st.archive) setTimeout(() => openModal('stats'), calm.matches ? 300 : 1900);
  }
  const gridOf = s => s.guesses.map(g => g.ok ? '🟩' : g.skip ? '⬛' : '🟥').join('') + '⬜'.repeat(Math.max(0, MAX - s.guesses.length));
  let cd;
  function tick() {
    clearInterval(cd);
    const el = () => $('[data-countdown]');
    const upd = () => {
      const now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), s = Math.max(0, Math.floor((next - now) / 1000));
      if (el()) el().textContent = [s / 3600, (s % 3600) / 60, s % 60].map(v => String(Math.floor(v)).padStart(2, '0')).join(':');
      if (s === 0) { clearInterval(cd); load(dayNo(new Date())); }
    };
    upd(); cd = setInterval(upd, 1000);
  }

  // ---------- stats ----------
  function stats() {
    const daily = Object.values(states).filter(s => !s.archive && s.done);
    const won = daily.filter(s => s.won), dist = [0, 0, 0, 0, 0, 0];
    won.forEach(s => dist[s.guesses.length - 1]++);
    let cur = 0, best = 0, run = 0;
    for (let n = 0; n <= today; n++) { const s = states[n]; if (s && !s.archive && s.won) { run++; best = Math.max(best, run); } else if (s?.done || n < today) run = 0; }
    for (let n = today; n >= 0; n--) { const s = states[n]; if (s && !s.archive && s.won) cur++; else if (n === today && !(s?.done)) continue; else break; }
    return { played: daily.length, wins: won.length, pct: daily.length ? Math.round(won.length / daily.length * 100) : 0, cur, best, dist };
  }
  function drawStreak() { $('[data-streak] b').textContent = stats().cur; $('[data-streak]').classList.toggle('hot', stats().cur > 0); }

  // ---------- modals ----------
  function openModal(kind) {
    const m = $('[data-modal]'), body = $('[data-modal-body]');
    if (kind === 'help') {
      body.innerHTML = `<h2 id="gm-mt">How to play</h2>
        <ol class="gm-how"><li><span>🎬</span>Guess the film from three emoji.</li><li><span>💡</span>Each wrong guess (or skip) unlocks a clue: the year, a badly explained plot, the director, the star, then the title’s letters.</li><li><span>🏆</span>You have ${MAX} tries. A new film appears every day at midnight.</li></ol>
        <p class="gm-small">Start typing and pick from the list, or type the title yourself. Small typos are fine.</p>
        <button type="button" class="gm-share" data-close>Let’s play</button>`;
    } else if (kind === 'stats') {
      const s = stats(), max = Math.max(1, ...s.dist), mine = !st?.archive && st?.won ? st.guesses.length - 1 : -1;
      body.innerHTML = `<h2 id="gm-mt">Your stats</h2>
        <div class="gm-nums">${[['Played', s.played], ['Win %', s.pct], ['Streak', s.cur], ['Best', s.best]].map(([l, v]) => `<div><b data-count="${v}">0</b><small>${l}</small></div>`).join('')}</div>
        <h3>Solved on guess…</h3>
        <ul class="gm-dist">${s.dist.map((v, i) => `<li class="${i === mine ? 'me' : ''}"><span>${i + 1}</span><i style="--w:${Math.max(7, v / max * 100)}%"><b>${v}</b></i></li>`).join('')}</ul>
        ${st?.done && !st.archive ? `<button type="button" class="gm-share" data-share>Share today’s result</button>` : ''}`;
      requestAnimationFrame(() => { m.classList.add('bars'); $$('[data-count]').forEach(el => countUp(el, +el.dataset.count)); });
    } else if (kind === 'archive') {
      const cells = [];
      for (let n = today; n >= 0; n--) { const s = states[n], d = dateOf(n); cells.push(`<button type="button" data-day="${n}" class="${s?.done ? (s.won ? 'won' : 'lost') : s?.guesses?.length ? 'part' : ''}${n === idx ? ' cur' : ''}"><b>#${n + 1}</b><small>${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></button>`); }
      body.innerHTML = `<h2 id="gm-mt">Past films</h2><p class="gm-small">Catch up on any day you missed. Past films don’t count towards your streak.</p><div class="gm-arch">${cells.join('')}</div>`;
    }
    m.classList.remove('bars'); m.hidden = false; requestAnimationFrame(() => m.classList.add('open'));
    document.documentElement.classList.add('gm-lock');
    m.querySelector('[data-close], button')?.focus({ preventScroll: true });
  }
  function closeModal() { const m = $('[data-modal]'); m.classList.remove('open'); document.documentElement.classList.remove('gm-lock'); setTimeout(() => { m.hidden = true; }, calm.matches ? 0 : 250); }
  function countUp(el, to) { if (calm.matches || !to) { el.textContent = to; return; } const t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / 700); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }

  // ---------- share ----------
  function share() {
    const text = `Guess the Movie #${st.n + 1} 🎬 ${st.won ? `${st.guesses.length}/${MAX}` : `X/${MAX}`}\n${gridOf(st)}\n`, url = `${location.origin}/tools/guess-the-movie/`;
    track('Tool Share');
    if (navigator.share && matchMedia('(pointer: coarse)').matches) navigator.share({ text: text + url }).catch(() => {});
    else navigator.clipboard?.writeText(text + url).then(() => toast('Result copied. Paste it anywhere!'), () => toast('Couldn’t copy, sorry'));
  }
  function toast(msg) { let t = root.querySelector('.gm-toast'); if (!t) { t = document.createElement('div'); t.className = 'gm-toast'; t.setAttribute('role', 'status'); root.append(t); } t.textContent = msg; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }

  // ---------- confetti ----------
  function confetti() {
    if (calm.matches) return;
    const c = $('[data-confetti]'), x = c.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; c.classList.add('on');
    const colors = ['#ffb547', '#6b8aff', '#2fd15b', '#ff6b8e', '#ffffff', '#a3b4ff'];
    const parts = Array.from({ length: 160 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .45, vx: (Math.random() - .5) * 16, vy: -Math.random() * 15 - 6, r: Math.random() * 6 + 4, c: colors[Math.random() * colors.length | 0], a: Math.random() * 6, va: (Math.random() - .5) * .3 }));
    const t0 = performance.now();
    const frame = now => {
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) { p.vy += .38; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }
      if (now - t0 < 2600) requestAnimationFrame(frame); else { x.clearRect(0, 0, innerWidth, innerHeight); c.classList.remove('on'); }
    };
    requestAnimationFrame(frame);
  }

  // ---------- loading a day ----------
  function load(n) {
    clearInterval(cd);
    idx = n; puzzle = puzzleFor(n);
    const archive = n !== today;
    st = states[n] && !!states[n].archive === archive ? states[n] : states[n]?.done ? states[n] : { n, guesses: [], done: false, won: false, archive };
    $('[data-no]').textContent = `#${n + 1}`;
    $('[data-date]').textContent = archive ? `Past film · ${dateOf(n).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}` : dateOf(n).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    $('[data-stage]').classList.remove('solved'); $('[data-poster]').classList.remove('flip'); $('[data-poster]').hidden = true;
    $('[data-result]').hidden = true; $('[data-play]').hidden = false;
    drawEmoji(true); drawClues(-1); drawGuesses(-1); drawStreak();
    if (st.done) finish(false);
    const u = new URL(location.href); if (archive) u.searchParams.set('day', n + 1); else u.searchParams.delete('day'); history.replaceState(history.state, '', u);
  }

  // ---------- events ----------
  $('[data-form]').addEventListener('submit', e => { e.preventDefault(); if (sugIdx >= 0) pickSug(sugIdx); else submit(sugList.find(f => norm(f.t) === norm($('[data-guess]').value))); });
  $('[data-guess]').addEventListener('input', suggest);
  $('[data-guess]').addEventListener('keydown', e => {
    const ul = $('[data-sug]'); if (ul.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sugIdx = (sugIdx + (e.key === 'ArrowDown' ? 1 : -1) + sugList.length) % sugList.length; [...ul.children].forEach((li, i) => li.classList.toggle('sel', i === sugIdx)); }
    if (e.key === 'Escape') ul.hidden = true;
  });
  $('[data-guess]').addEventListener('blur', () => setTimeout(() => { $('[data-sug]').hidden = true; }, 150));
  $('[data-sug]').addEventListener('pointerdown', e => { const li = e.target.closest('[data-i]'); if (li) { e.preventDefault(); pickSug(+li.dataset.i); } });
  root.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-skip]')) skip();
    const o = t.closest('[data-open]'); if (o) openModal(o.dataset.open);
    if (t.closest('[data-close]')) closeModal();
    if (t.closest('[data-share]')) share();
    const pl = t.closest("[data-day]"); if (pl) { closeModal(); load(+pl.dataset.day); window.scrollTo({ top: root.getBoundingClientRect().top + scrollY - 100, behavior: calm.matches ? 'auto' : 'smooth' }); }
    if (t.closest('[data-today]')) load(today);
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('[data-modal]').hidden) closeModal(); });

  Promise.all([
    fetch(new URL('puzzles.dat', import.meta.url)).then(r => r.text()),
    fetch('/tools/films.json').then(r => r.json()).catch(() => ({ films: [] })),
  ]).then(([enc, fj]) => {
    P = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(enc.trim().split('').reverse().join('')), c => c.charCodeAt(0))));
    films = fj.films || [];
    // make sure every answer can be found in the suggestions
    const have = new Set(films.map(f => norm(f.t)));
    P.puzzles.forEach(p => { if (!have.has(norm(p.t))) films.push({ t: p.t, y: p.y, p: p.poster || '', i: p.i, n: 0 }); });
    today = Math.max(0, dayNo(new Date()));
    const asked = +new URLSearchParams(location.search).get('day');
    load(asked >= 1 && asked - 1 <= today ? asked - 1 : today);
    if (!store.get('seenHelp', false)) { store.set('seenHelp', true); setTimeout(() => openModal('help'), 500); }
  }).catch(() => { $('[data-emoji]').innerHTML = '<p class="gm-small">The puzzle couldn’t load. Please refresh the page.</p>'; });
}
