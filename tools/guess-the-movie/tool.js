// Guess the Movie: Daily 10 and Endless.
// Daily 10 = one hand-written emoji headliner (tools/guess-the-movie/_puzzles.json, published scrambled in puzzles.dat)
// plus nine fact-clue films picked from the TMDB data (/tools/films.json), seeded by the day so everyone gets the same set.
// Endless = fact-clue films one after another until you miss one.
const root = document.getElementById('gm');
if (root) {
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const IMG = 'https://image.tmdb.org/t/p/';
  const MAX = 6, ROUNDS = 10;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/^(the|a|an) /, '').replace(/[^a-z0-9]+/g, '');
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem('ms-gtm-' + k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem('ms-gtm-' + k, JSON.stringify(v)); } catch {} } };
  const track = (name, props = {}) => document.dispatchEvent(new CustomEvent('ms:track', { detail: { name, props: { tool: 'guess-the-movie', ...props } } }));

  let P = null, films = [], genres = {}, today = 0;
  let mode = 'daily', day = 0, set = null, ds = null, ri = 0; // daily: day number, its 10 puzzles, its saved state, current round
  let puzzle = null, st = null; // the round on screen
  let states = store.get('days', {});
  const end = { diff: store.get('diff', 'easy'), run: 0, seen: new Set(), over: false };

  const dayNo = d => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(...P.start.split('-').map((v, i) => i === 1 ? v - 1 : +v))) / 864e5);
  const dateOf = n => { const [y, m, d] = P.start.split('-').map(Number); return new Date(y, m - 1, d + n); };
  const emojiFor = n => P.puzzles[((n % P.puzzles.length) + P.puzzles.length) % P.puzzles.length];
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // ---------- puzzles ----------
  const shape = t => t.split(' ').map((w, wi) => [...w].map((ch, ci) => /[a-z0-9]/i.test(ch) ? (wi === 0 && ci === 0 ? ch.toUpperCase() : '_') : ch).join(' ')).join('   ');
  const runtime = r => r ? `${Math.floor(r / 60)} h ${r % 60} min`.replace(/^0 h /, '') : '';
  const gnames = f => (f.g || []).map(g => genres[g]).filter(Boolean).slice(0, 2).join(' · ');
  const STOP = new Set(['the', 'and', 'with', 'from', 'that', 'this', 'into', 'part', 'movie', 'film', 'story', 'return', 'returns', 'chapter', 'last', 'first', 'great', 'little', 'about', 'what', 'when', 'where', 'they', 'your', 'love', 'life', 'night', 'home', 'world', 'time', 'year', 'days']);
  const reRx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function redact(text, t) {
    let s = String(text || '');
    const base = t.replace(/^(the|a|an) /i, '');
    const words = [t, base, ...base.split(/[\s:,\-–—.!?'’]+/).filter(w => w.length > 3 && !STOP.has(w.toLowerCase()))];
    for (const w of words) s = s.replace(new RegExp(`(^|[^\\p{L}\\p{N}])${reRx(w)}(?=$|[^\\p{L}\\p{N}])`, 'giu'), '$1▇▇▇');
    return s;
  }
  const trim = (s, n) => { if (s.length <= n) return s; const cut = s.slice(0, n), dot = cut.lastIndexOf('. '); return dot > n * .5 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, '') + '…'; };

  function emojiPuzzle(p) {
    return { kind: 'emoji', t: p.t, y: p.y, i: p.i, alt: p.alt || [], poster: p.poster, e: p.e, clues: [
      { ico: '🎬', label: 'Emoji', val: p.e },
      { ico: '📅', label: 'Year & genre', val: `${p.y} · ${p.g}` },
      { ico: '🤪', label: 'Explained badly', val: p.p },
      { ico: '🎥', label: 'Directed by', val: p.d },
      { ico: '⭐', label: 'Starring', val: p.a },
      { ico: '🔤', label: 'The title', val: shape(p.t), shape: 1 },
    ] };
  }
  function factPuzzle(f) {
    const clues = [{ ico: '📅', label: 'Year & genre', val: [f.y, gnames(f)].filter(Boolean).join(' · ') }];
    if (f.tg) clues.push({ ico: '💬', label: 'Tagline', val: `“${redact(f.tg, f.t)}”` });
    else clues.push({ ico: '⏱️', label: 'Runtime & rating', val: [runtime(f.r), f.v ? `★ ${f.v.toFixed(1)} on TMDB` : ''].filter(Boolean).join(' · ') || 'Not listed' });
    clues.push({ ico: '⭐', label: 'Starring', val: (f.c || []).slice(0, 3).join(', ') });
    clues.push({ ico: '🎥', label: 'Directed by', val: (f.d || []).join(' & ') });
    if (f.o) clues.push({ ico: '📖', label: 'The plot', val: trim(redact(f.o, f.t), 260) });
    else clues.push({ ico: '🔠', label: 'First letter and length', val: `Starts with “${f.t.replace(/^(the|a|an) /i, '')[0].toUpperCase()}” · ${f.t.split(' ').length} word${f.t.split(' ').length === 1 ? '' : 's'}` });
    clues.push({ ico: '🔤', label: 'The title', val: shape(f.t), shape: 1 });
    return { kind: 'fact', t: f.t, y: f.y, i: f.i, alt: [], poster: f.p, f, clues };
  }

  // films good enough for fact clues, split into tiers by how well known they are
  let tiers = null;
  function buildTiers() {
    const emojiTitles = new Set(P.puzzles.map(p => norm(p.t)));
    const usable = films.filter(f => f.y && f.d?.length && f.c?.length && f.t.length < 60);
    const fresh = usable.filter(f => !emojiTitles.has(norm(f.t)));
    const ok = (fresh.length >= 60 ? fresh : usable).slice().sort((a, b) => (b.n || 0) - (a.n || 0) || (a.i || 0) - (b.i || 0));
    const known = ok.some(f => f.n > 0);
    if (!known || ok.length < 120) { const k = Math.ceil(ok.length / 3); tiers = { a: ok.slice(0, k), b: ok.slice(k, 2 * k), c: ok.slice(2 * k) }; }
    else tiers = { a: ok.slice(0, 260), b: ok.slice(260, 800), c: ok.slice(800, 1800).filter(f => f.n >= 300) };
    tiers.easy = ok.slice(0, known ? 450 : ok.length);
    tiers.medium = known ? ok.slice(200, 1200) : ok;
    tiers.buff = known ? ok.slice(900).filter(f => f.n >= 300).concat(ok.filter(f => f.h)) : ok;
    for (const k of ['b', 'c', 'medium', 'buff']) if (tiers[k].length < 20) tiers[k] = ok;
  }

  const sets = new Map();
  function setFor(n) {
    if (sets.has(n)) return sets.get(n);
    const r = rng(n * 9973 + 17), used = new Set(), out = [emojiPuzzle(emojiFor(n))];
    used.add(norm(out[0].t));
    for (let k = 0; k < ROUNDS - 1; k++) {
      const tier = tiers[['a', 'b', 'c'][Math.floor(k / 3)]];
      let f = null;
      for (let tries = 0; tries < 60; tries++) { f = tier[Math.floor(r() * tier.length)]; if (f && !used.has(norm(f.t))) break; }
      if (!f) break;
      used.add(norm(f.t)); out.push(factPuzzle(f));
    }
    sets.set(n, out); return out;
  }

  // ---------- drawing a round ----------
  const shown = () => Math.min(MAX, (st?.g.length || 0) + 1 + (st?.done ? MAX : 0));
  function drawStage(animate) {
    const box = $('[data-emoji]');
    box.classList.toggle('fact', puzzle.kind === 'fact');
    if (puzzle.kind === 'emoji') {
      box.innerHTML = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(puzzle.e)].map((s, i) => `<span style="--i:${i}">${s.segment}</span>`).join('');
    } else {
      const f = puzzle.f;
      box.innerHTML = `<div class="gm-clap"><div class="gm-clap-top" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="gm-clap-body"><small>Year</small><b>${f.y}</b><span>${esc(gnames(f) || 'Film')}</span></div></div>`;
    }
    if (animate && !calm.matches) { box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop'); }
  }
  function drawClues(newest) {
    const n = shown(), C = puzzle.clues;
    $('[data-ladder]').innerHTML = C.map((c, i) => `<i class="${i < n ? 'on' : ''}${st.done && st.won && i === st.g.length - 1 ? ' win' : ''}"></i>`).join('');
    $('[data-clues]').innerHTML = C.slice(1, n).map((c, i) => `<li class="${i + 1 === newest ? 'new' : ''}${c.shape ? ' shape' : ''}"><span class="ci">${c.ico}</span><div><small>${c.label}</small><b>${esc(c.val)}</b></div></li>`).join('')
      + (n < C.length ? `<li class="locked"><span class="ci">🔒</span><div><small>Next clue: ${C[n].label}</small><b>Unlocks after a wrong guess or skip${C.length - n > 1 ? ` · ${C.length - n - 1} more after that` : ''}</b></div></li>` : '');
  }
  function drawGuesses(newest) {
    $('[data-guesses]').innerHTML = st.g.map((g, i) => `<li class="${g.ok ? 'ok' : g.skip ? 'skip' : 'no'}${i === newest ? ' new' : ''}"><span>${g.ok ? '✓' : g.skip ? '→' : '✕'}</span>${g.skip ? 'Skipped' : esc(g.t)}</li>`).join('');
    const left = MAX - st.g.length;
    $('[data-left]').textContent = `${left} guess${left === 1 ? '' : 'es'} left`;
  }
  const sq = r => !r?.done ? '⬜' : !r.won ? '🟥' : r.g.length <= 2 ? '🟩' : r.g.length <= 4 ? '🟨' : '🟧';
  const pts = r => r?.won ? 7 - r.g.length : 0;
  function drawSet(pulse) {
    const box = $('[data-set]');
    if (mode !== 'daily') { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = ds.r.map((r, i) => `<button type="button" data-round="${i}" class="${r.done ? (r.won ? 'won' : 'lost') : ''}${i === ri ? ' cur' : ''}${i === pulse ? ' pulse' : ''}" ${r.done || i === firstOpen() ? '' : 'disabled'} aria-label="Film ${i + 1}${r.done ? (r.won ? ', solved' : ', missed') : ''}"><span>${i === 0 ? '🎬' : i + 1}</span><i>${r.done ? sq(r) : ''}</i></button>`).join('')
      + `<div class="gm-score"><b data-pts>${ds.r.reduce((a, r) => a + pts(r), 0)}</b><small>pts</small></div>`;
  }
  const firstOpen = () => { const i = ds.r.findIndex(r => !r.done); return i < 0 ? ROUNDS : i; };

  function showRound(animate = true) {
    $('[data-stage]').classList.remove('solved'); $('[data-poster]').classList.remove('flip'); $('[data-poster]').hidden = true;
    $('[data-result]').hidden = true; $('[data-play]').hidden = false;
    drawStage(animate); drawClues(-1); drawGuesses(-1); drawStreak();
    if (mode === 'daily') {
      drawSet();
      $('[data-no]').textContent = `Film ${ri + 1} of ${ROUNDS}`;
      $('[data-date]').textContent = (day !== today ? 'Past set · ' : '') + dateOf(day).toLocaleDateString(undefined, day !== today ? { month: 'long', day: 'numeric' } : { weekday: 'long', month: 'long', day: 'numeric' });
    } else {
      $('[data-no]').textContent = `Film ${end.run + 1}`;
      $('[data-date]').textContent = { easy: 'Easy · big hits', medium: 'Medium · well known', buff: 'Film buff · deep cuts' }[end.diff];
    }
    if (st.done) finishRound(false);
    else if (animate && matchMedia('(pointer: fine)').matches) $('[data-guess]').focus({ preventScroll: true });
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
    if (film?.i && puzzle.i && film.i !== puzzle.i && norm(film.t) === norm(puzzle.t) && film.y !== puzzle.y) return false; // same title, different film
    const g = norm(text); if (!g) return false;
    return [puzzle.t, ...(puzzle.alt || [])].some(t => { const n = norm(t); return n === g || (n.length >= 8 && lev(n, g) <= 2); });
  }
  const started = () => { if (!st.g.length && (mode === 'endless' || ri === 0 || !ds.r.some(r => r.g.length))) track('Tool Used', { mode: mode === 'endless' ? 'endless-' + end.diff : day !== today ? 'archive' : 'daily' }); };
  function submit(film) {
    if (!st || st.done) return;
    const inp = $('[data-guess]'), text = (film?.t || inp.value).trim();
    if (!text) { shake(); return; }
    if (st.g.some(g => !g.skip && norm(g.t) === norm(text))) { toast('You already tried that one'); shake(); return; }
    const ok = isRight(text, film);
    started();
    st.g.push({ t: ok ? puzzle.t : text, ok });
    inp.value = ''; $('[data-sug]').hidden = true;
    after(ok);
  }
  function skip() { if (!st || st.done) return; started(); st.g.push({ skip: true }); after(false); }
  function after(ok) {
    if (ok) { st.done = true; st.won = true; }
    else if (st.g.length >= MAX) { st.done = true; st.won = false; }
    save();
    drawGuesses(st.g.length - 1);
    if (!ok) { if (!st.g.at(-1).skip) shake(); drawClues(st.done ? -1 : shown() - 1); }
    if (st.done) finishRound(true);
  }
  function shake() { const f = $('[data-form]'); if (calm.matches) return; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
  function save() {
    if (mode !== 'daily') return;
    ds.fin = ds.r.every(r => r.done);
    states[day] = ds; store.set('days', states); drawStreak();
  }

  // ---------- end of a round ----------
  const BADGE = ['Genius!', 'Brilliant!', 'Great call!', 'Nice one!', 'Got there!', 'Phew!'];
  function finishRound(fresh) {
    $('[data-play]').hidden = true;
    drawClues(-1);
    const back = $('[data-poster-back]');
    back.innerHTML = puzzle.poster ? `<img src="${IMG}w342${puzzle.poster}" alt="Poster for ${esc(puzzle.t)}" onerror="this.parentNode.innerHTML='<b>${esc(puzzle.t).replace(/'/g, '&#39;')}</b>'">` : `<b>${esc(puzzle.t)}</b>`;
    const pos = $('[data-poster]'); pos.hidden = false;
    $('[data-stage]').classList.add('solved');
    requestAnimationFrame(() => pos.classList.add('flip'));
    if (fresh && st.won) burst();
    const res = $('[data-result]'); res.hidden = false; res.classList.remove('big');
    const tries = st.g.length;
    const head = `<span class="gm-badge ${st.won ? 'win' : 'lose'}">${st.won ? BADGE[tries - 1] : 'Missed this one'}</span>
      <h2>${esc(puzzle.t)} <span>(${puzzle.y})</span></h2>`;

    if (mode === 'endless') {
      if (st.won) {
        if (fresh) { end.run++; const b = store.get('best-' + end.diff, 0); if (end.run > b) { store.set('best-' + end.diff, end.run); } }
        drawHud(fresh);
        res.innerHTML = `<div class="gm-res-top">${head}<p>Solved in <b>${tries}</b>. Your run is <b>${end.run}</b>${end.run >= store.get('best-' + end.diff, 0) && end.run > 1 ? ', a new best' : ''}.</p></div>
          <div class="gm-res-acts"><button type="button" class="gm-share gm-nextbtn" data-next>Next film →</button></div>`;
      } else {
        const best = store.get('best-' + end.diff, 0);
        if (fresh) track('Game Finished', { mode: 'endless-' + end.diff, run: end.run });
        end.over = true;
        res.classList.add('big');
        res.innerHTML = `<div class="gm-res-top">${head}<p class="gm-over">Run over</p><div class="gm-bigscore"><b data-countup="${end.run}">${end.run}</b><small>film${end.run === 1 ? '' : 's'} in a row</small></div><p>${end.run && end.run >= best ? '🏆 That’s your best run on this level.' : `Your best on this level is <b>${best}</b>.`}</p></div>
          <div class="gm-res-acts"><button type="button" class="gm-share" data-again>Play again</button><button type="button" class="gm-btn" data-share>Share run</button></div>
          ${moreCards()}`;
        countUps(res);
      }
      $('[data-next], [data-again]')?.focus({ preventScroll: true });
      return;
    }

    // daily
    if (fresh) track(st.won ? 'Game Won' : 'Game Lost', { tries, round: ri + 1, archive: day !== today });
    drawSet(ri);
    const nxt = firstOpen();
    if (nxt < ROUNDS) {
      res.innerHTML = `<div class="gm-res-top">${head}<p>${st.won ? `Solved in <b>${tries}</b> of ${MAX}. <b>+${pts(st)}</b> points.` : 'No points for this one.'}</p></div>
        <div class="gm-res-acts"><button type="button" class="gm-share gm-nextbtn" data-next>Next film (${nxt + 1} of ${ROUNDS}) →</button></div>`;
      if (fresh) $('[data-next]')?.focus({ preventScroll: true });
      return;
    }
    // the whole set is done
    const solved = ds.r.filter(r => r.won).length, total = ds.r.reduce((a, r) => a + pts(r), 0);
    if (fresh) { track('Game Finished', { mode: day !== today ? 'archive' : 'daily', solved, points: total }); if (solved >= 7) confetti(); }
    res.classList.add('big');
    res.innerHTML = `<div class="gm-res-top">${head}
        <p class="gm-over">${day !== today ? 'Past set complete' : 'Today’s 10 complete'}</p>
        <div class="gm-bigscore"><b data-countup="${solved}">${solved}</b><small>of ${ROUNDS} films · <span data-countup="${total}">${total}</span> pts</small></div>
        <p>${['Rough day at the movies.', 'Rough day at the movies.', 'Warming up.', 'Warming up.', 'Not bad at all.', 'Solid showing.', 'Proper film fan.', 'Seriously good.', 'Film critic level.', 'Nearly flawless.', 'Perfect score. Take a bow.'][solved]}</p>
        <div class="gm-grid" aria-label="Your result">${ds.r.map((r, i) => `<i style="--i:${i}">${sq(r)}</i>`).join('')}</div>
      </div>
      <div class="gm-res-acts">
        <button type="button" class="gm-share" data-share>Share result</button>
        ${day !== today ? `<button type="button" class="gm-btn" data-today>Back to today’s 10</button>` : `<div class="gm-next"><small>Next 10 in</small><b data-countdown>--:--:--</b></div>`}
      </div>
      <button type="button" class="gm-btn gm-endless-cta" data-mode="endless">♾️ Keep playing in Endless mode</button>
      ${moreCards()}`;
    countUps(res);
    if (day === today) tick();
    if (fresh && day === today) setTimeout(() => openModal('stats'), calm.matches ? 300 : 2200);
  }
  const moreCards = () => `<div class="gm-more">
      ${today > 0 ? `<button type="button" class="gm-card" data-open="archive"><b>🗓️ Play past sets</b><span>${today} earlier day${today === 1 ? '' : 's'} to try</span></button>` : `<a class="gm-card" href="/tools/christmas-movie-trivia/"><b>🎄 Christmas movie trivia</b><span>Ten quick questions. Beat your best score.</span></a>`}
      <a class="gm-card" href="/tools/random-movie/"><b>🎰 Pick something to watch</b><span>Pull the lever on Cinema Slots</span></a>
      <a class="gm-card" href="https://apps.apple.com/us/app/movieshelf-media-organizer/id6760224869?ct=tool-guess-the-movie&amp;mt=8" target="_blank" rel="noopener"><b>📀 Own it on disc?</b><span>Catalog your collection in Movieshelf</span></a>
    </div>`;
  function countUps(box) { box.querySelectorAll('[data-countup]').forEach(el => countUp(el, +el.dataset.countup)); }
  let cd;
  function tick() {
    clearInterval(cd);
    const el = () => $('[data-countdown]');
    const upd = () => {
      const now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), s = Math.max(0, Math.floor((next - now) / 1000));
      if (el()) el().textContent = [s / 3600, (s % 3600) / 60, s % 60].map(v => String(Math.floor(v)).padStart(2, '0')).join(':');
      if (s === 0) { clearInterval(cd); today = Math.max(0, dayNo(new Date())); if (mode === 'daily') loadDay(today); }
    };
    upd(); cd = setInterval(upd, 1000);
  }

  // ---------- daily sets ----------
  const blank = () => ({ g: [], done: false, won: false });
  function loadDay(n, round) {
    clearInterval(cd);
    mode = 'daily'; drawMode();
    day = n; set = setFor(n);
    ds = states[n] || { r: Array.from({ length: ROUNDS }, blank) };
    ri = round ?? Math.min(firstOpen(), ROUNDS - 1);
    puzzle = set[ri]; st = ds.r[ri];
    showRound();
    const u = new URL(location.href); if (n !== today) u.searchParams.set('day', n + 1); else u.searchParams.delete('day'); history.replaceState(history.state, '', u);
  }
  function nextRound() {
    if (mode === 'endless') { newEndless(); return; }
    const n = firstOpen(); if (n >= ROUNDS) return;
    ri = n; puzzle = set[ri]; st = ds.r[ri];
    showRound();
    scrollToGame();
  }
  const scrollToGame = () => { const top = root.getBoundingClientRect().top; if (top < 0 || top > innerHeight * .4) window.scrollTo({ top: top + scrollY - 90, behavior: calm.matches ? 'auto' : 'smooth' }); };

  // ---------- endless ----------
  function drawHud(bump) {
    $('[data-hud]').hidden = mode !== 'endless';
    $$('[data-diff]').forEach(b => b.setAttribute('aria-pressed', b.dataset.diff === end.diff));
    const r = $('[data-run]'); r.textContent = end.run; $('[data-best]').textContent = store.get('best-' + end.diff, 0);
    if (bump && !calm.matches) { r.classList.remove('bump'); void r.offsetWidth; r.classList.add('bump'); }
  }
  function newEndless(reset) {
    clearInterval(cd);
    if (reset || end.over) { end.run = 0; end.over = false; }
    mode = 'endless'; drawMode();
    const pool = tiers[end.diff];
    let f; for (let i = 0; i < 80; i++) { f = pool[Math.floor(Math.random() * pool.length)]; if (!end.seen.has(norm(f.t))) break; }
    end.seen.add(norm(f.t)); if (end.seen.size > pool.length * .8) end.seen.clear();
    puzzle = factPuzzle(f); st = blank();
    drawHud(); showRound();
    const u = new URL(location.href); u.searchParams.delete('day'); u.searchParams.set('mode', 'endless'); history.replaceState(history.state, '', u);
  }
  function drawMode() {
    $$('[data-mode][role="tab"]').forEach(b => b.setAttribute('aria-selected', b.dataset.mode === mode));
    root.classList.toggle('endless', mode === 'endless');
    $('[data-hud]').hidden = mode !== 'endless';
    $('[data-set]').hidden = mode !== 'daily';
    $('[data-streak]').hidden = mode !== 'daily';
    if (mode === 'daily') { const u = new URL(location.href); u.searchParams.delete('mode'); history.replaceState(history.state, '', u); }
  }

  // ---------- stats ----------
  function stats() {
    const done = Object.entries(states).filter(([, s]) => s.fin);
    const solvedOf = s => s.r.filter(r => r.won).length;
    let cur = 0, best = 0, run = 0;
    for (let n = 0; n <= today; n++) { const s = states[n]; if (s?.fin) { run++; best = Math.max(best, run); } else if (n < today) run = 0; }
    for (let n = today; n >= 0; n--) { if (states[n]?.fin) cur++; else if (n === today) continue; else break; }
    const dist = [0, 0, 0, 0, 0]; // 10, 8-9, 6-7, 4-5, 0-3
    done.forEach(([, s]) => { const v = solvedOf(s); dist[v === 10 ? 0 : v >= 8 ? 1 : v >= 6 ? 2 : v >= 4 ? 3 : 4]++; });
    const top = done.reduce((a, [, s]) => Math.max(a, solvedOf(s)), 0);
    return { played: done.length, avg: done.length ? (done.reduce((a, [, s]) => a + solvedOf(s), 0) / done.length).toFixed(1) : '0', cur, best, top, dist };
  }
  function drawStreak() { const c = stats().cur; $('[data-streak] b').textContent = c; $('[data-streak]').classList.toggle('hot', c > 0); }

  // ---------- modals ----------
  function openModal(kind) {
    const m = $('[data-modal]'), body = $('[data-modal-body]');
    if (kind === 'help') {
      body.innerHTML = `<h2 id="gm-mt">How to play</h2>
        <ol class="gm-how"><li><span>🎬</span>Every day there are 10 films to guess, the same for everyone. The first one is three emoji. The other nine start with just the year and genre.</li><li><span>💡</span>Each wrong guess (or skip) unlocks a clue: a tagline, the stars, the director, the plot with the title blanked out, then the title’s letters.</li><li><span>🏆</span>You have ${MAX} tries per film. Fewer tries, more points: up to 6 per film.</li><li><span>♾️</span>Want more? Endless mode keeps the films coming until you miss one.</li></ol>
        <p class="gm-small">Start typing and pick from the list, or type the title yourself. Small typos are fine.</p>
        <button type="button" class="gm-share" data-close>Let’s play</button>`;
    } else if (kind === 'stats') {
      const s = stats(), max = Math.max(1, ...s.dist);
      const mineV = mode === 'daily' && ds?.fin && day === today ? ds.r.filter(r => r.won).length : -1;
      const mine = mineV < 0 ? -1 : mineV === 10 ? 0 : mineV >= 8 ? 1 : mineV >= 6 ? 2 : mineV >= 4 ? 3 : 4;
      body.innerHTML = `<h2 id="gm-mt">Your stats</h2>
        <div class="gm-nums">${[['Days played', s.played], ['Avg solved', s.avg], ['Day streak', s.cur], ['Best streak', s.best]].map(([l, v]) => `<div><b data-count="${v}">0</b><small>${l}</small></div>`).join('')}</div>
        <h3>Films solved per day</h3>
        <ul class="gm-dist">${['10', '8–9', '6–7', '4–5', '0–3'].map((l, i) => `<li class="${i === mine ? 'me' : ''}"><span>${l}</span><i style="--w:${Math.max(7, s.dist[i] / max * 100)}%"><b>${s.dist[i]}</b></i></li>`).join('')}</ul>
        <h3>Endless best runs</h3>
        <div class="gm-nums three">${[['Easy', 'easy'], ['Medium', 'medium'], ['Film buff', 'buff']].map(([l, k]) => `<div><b>${store.get('best-' + k, 0)}</b><small>${l}</small></div>`).join('')}</div>
        ${mode === 'daily' && ds?.fin && day === today ? `<button type="button" class="gm-share" data-share>Share today’s result</button>` : ''}`;
      requestAnimationFrame(() => { m.classList.add('bars'); $$('[data-count]').forEach(el => { const v = el.dataset.count; if (/\./.test(v)) el.textContent = v; else countUp(el, +v); }); });
    } else if (kind === 'archive') {
      const cells = [];
      for (let n = today; n >= 0; n--) { const s = states[n], d = dateOf(n), solved = s ? s.r.filter(r => r.won).length : 0; cells.push(`<button type="button" data-day="${n}" class="${s?.fin ? (solved >= 5 ? 'won' : 'lost') : s?.r.some(r => r.g.length) ? 'part' : ''}${n === day && mode === 'daily' ? ' cur' : ''}"><b>${s?.fin ? `${solved}/10` : `#${n + 1}`}</b><small>${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></button>`); }
      body.innerHTML = `<h2 id="gm-mt">Past sets</h2><p class="gm-small">Catch up on any day you missed. Past sets don’t count towards your streak.</p><div class="gm-arch">${cells.join('')}</div>`;
    }
    m.classList.remove('bars'); m.hidden = false; requestAnimationFrame(() => m.classList.add('open'));
    document.documentElement.classList.add('gm-lock');
    m.querySelector('[data-close], button')?.focus({ preventScroll: true });
  }
  function closeModal() { const m = $('[data-modal]'); m.classList.remove('open'); document.documentElement.classList.remove('gm-lock'); setTimeout(() => { m.hidden = true; }, calm.matches ? 0 : 250); }
  function countUp(el, to) { if (calm.matches || !to) { el.textContent = to; return; } const t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / 800); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }

  // ---------- share ----------
  function share() {
    const url = `${location.origin}/tools/guess-the-movie/`;
    let text;
    if (mode === 'endless') text = `Guess the Movie ♾️ ${{ easy: 'Easy', medium: 'Medium', buff: 'Film buff' }[end.diff]}: ${end.run} film${end.run === 1 ? '' : 's'} in a row 🎬\n`;
    else { const solved = ds.r.filter(r => r.won).length, total = ds.r.reduce((a, r) => a + pts(r), 0); text = `Guess the Movie #${day + 1} 🎬 ${solved}/10 · ${total} pts\n${ds.r.map(sq).join('')}\n`; }
    track('Tool Share', { mode });
    if (navigator.share && matchMedia('(pointer: coarse)').matches) navigator.share({ text: text + url }).catch(() => {});
    else navigator.clipboard?.writeText(text + url).then(() => toast('Result copied. Paste it anywhere!'), () => toast('Couldn’t copy, sorry'));
  }
  function toast(msg) { let t = root.querySelector('.gm-toast'); if (!t) { t = document.createElement('div'); t.className = 'gm-toast'; t.setAttribute('role', 'status'); root.append(t); } t.textContent = msg; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }

  // ---------- celebrations ----------
  function burst() {
    if (calm.matches) return;
    const stage = $('[data-stage]');
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span'); s.className = 'gm-fx'; s.textContent = ['⭐', '✨', '🍿', '🎬'][i % 4];
      stage.appendChild(s);
      const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 120;
      s.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1) rotate(${Math.random() * 300}deg)`, opacity: 0 }], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => s.remove();
    }
  }
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
    if (!P) return;
    if (t.closest('[data-skip]')) skip();
    const o = t.closest('[data-open]'); if (o) openModal(o.dataset.open);
    if (t.closest('[data-close]')) closeModal();
    if (t.closest('[data-share]')) share();
    if (t.closest('[data-next]')) nextRound();
    if (t.closest('[data-again]')) { newEndless(true); scrollToGame(); }
    const md = t.closest('[data-mode]'); if (md) { if (md.dataset.mode === 'endless' && mode !== 'endless') { newEndless(true); scrollToGame(); } else if (md.dataset.mode === 'daily' && mode !== 'daily') loadDay(today); }
    const df = t.closest('[data-diff]'); if (df && df.dataset.diff !== end.diff) { end.diff = df.dataset.diff; store.set('diff', end.diff); end.seen.clear(); newEndless(true); }
    const rd = t.closest('[data-round]'); if (rd && !rd.disabled && +rd.dataset.round !== ri) { ri = +rd.dataset.round; puzzle = set[ri]; st = ds.r[ri]; showRound(false); }
    const pl = t.closest('[data-day]'); if (pl) { closeModal(); loadDay(+pl.dataset.day); scrollToGame(); }
    if (t.closest('[data-today]')) loadDay(today);
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('[data-modal]').hidden) closeModal();
    if (e.key === 'Enter' && document.activeElement === document.body && $('[data-next]')) nextRound();
  });

  Promise.all([
    fetch(new URL('puzzles.dat', import.meta.url)).then(r => r.text()),
    fetch('/tools/films.json').then(r => r.json()).catch(() => ({ films: [] })),
  ]).then(([enc, fj]) => {
    P = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(enc.trim().split('').reverse().join('')), c => c.charCodeAt(0))));
    films = fj.films || []; genres = fj.genres || {};
    // make sure every emoji answer can be found in the suggestions
    const have = new Set(films.map(f => norm(f.t)));
    P.puzzles.forEach(p => { if (!have.has(norm(p.t))) films.push({ t: p.t, y: p.y, p: p.poster || '', i: p.i, n: 0 }); });
    buildTiers();
    today = Math.max(0, dayNo(new Date()));
    const q = new URLSearchParams(location.search), asked = +q.get('day');
    if (q.get('mode') === 'endless') newEndless(true);
    else loadDay(asked >= 1 && asked - 1 <= today ? asked - 1 : today);
    if (!store.get('seenHelp2', false)) { store.set('seenHelp2', true); setTimeout(() => openModal('help'), 500); }
  }).catch(err => { console.error(err); $('[data-emoji]').innerHTML = '<p class="gm-small">The puzzle couldn’t load. Please refresh the page.</p>'; });
}
