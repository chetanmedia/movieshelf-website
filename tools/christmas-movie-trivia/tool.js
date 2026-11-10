// Christmas movie trivia. Hand-written questions (_questions.json, published scrambled) plus a few
// questions made from TMDB data about Christmas films (director, year, star).
const root = document.getElementById('cq');
if (root) {
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const ROUND = 10, SECS = 20;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem('ms-cq-' + k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem('ms-cq-' + k, JSON.stringify(v)); } catch {} } };
  const track = (name, props = {}) => document.dispatchEvent(new CustomEvent('ms:track', { detail: { name, props: { tool: 'christmas-movie-trivia', ...props } } }));

  let bank = [], dataQs = [], round = [], qi = 0, score = 0, streak = 0, bestStreak = 0, correct = 0, answers = [], pace = store.get('pace', 'timed'), timer = 0, tLeft = SECS, locked = false;
  const recent = new Set(store.get('recent', []));

  // ---------- questions built from the film data ----------
  function buildDataQs(films) {
    const xmas = films.filter(f => f.x && f.d?.length && f.c?.length && f.n >= 300).sort((a, b) => b.n - a.n).slice(0, 40);
    const out = [], dirs = [...new Set(xmas.flatMap(f => f.d))], stars = [...new Set(xmas.map(f => f.c[0]))];
    for (const f of xmas) {
      const otherDirs = shuffle(dirs.filter(d => !f.d.includes(d))).slice(0, 3);
      if (otherDirs.length === 3) out.push({ q: `Who directed ${f.t}?`, f: f.t, a: f.d[0], w: otherDirs, data: 1 });
      const yrs = shuffle([-11, -7, -4, -2, 3, 5, 8, 12]).map(d => f.y + d).filter(y => y <= new Date().getFullYear()).slice(0, 3);
      out.push({ q: `In which year was ${f.t} released?`, f: f.t, a: String(f.y), w: yrs.map(String), data: 1 });
      const otherStars = shuffle(stars.filter(s => !f.c.includes(s))).slice(0, 3);
      if (otherStars.length === 3) out.push({ q: `Who stars in ${f.t}?`, f: f.t, a: f.c[0], w: otherStars, data: 1 });
    }
    return out;
  }
  function makeRound() {
    const fresh = q => !recent.has(q.q);
    // unseen questions first; at most 3 from the film data; never the same film twice in a round
    const hand = [...shuffle(bank.filter(fresh)), ...shuffle(bank.filter(q => !fresh(q)))];
    const data = shuffle(dataQs.filter(fresh)).slice(0, 3);
    const films = new Set(), list = [];
    const take = q => { if (list.length < ROUND && !films.has(q.f)) { films.add(q.f); list.push(q); } };
    data.forEach(take); hand.forEach(take);
    for (const q of hand) { if (list.length >= ROUND) break; if (!list.includes(q)) list.push(q); } // only if there aren't enough films
    return shuffle(list).map(q => ({ ...q, opts: shuffle([q.a, ...q.w]) }));
  }

  // ---------- screens ----------
  function show(name) {
    $$('[data-screen]').forEach(s => { s.hidden = s.dataset.screen !== name; });
    const s = $(`[data-screen="${name}"]`); s.classList.remove('in'); void s.offsetWidth; s.classList.add('in');
  }
  function drawIntro() {
    const best = store.get('best', null);
    $('[data-best]').hidden = !best;
    if (best) $('[data-best]').innerHTML = `Your best: <b>${best.n}/10</b> · ${best.pts.toLocaleString()} points`;
    $$('[data-pace]').forEach(b => b.setAttribute('aria-pressed', b.dataset.pace === pace));
  }
  function start() {
    round = makeRound(); qi = 0; score = 0; streak = 0; bestStreak = 0; correct = 0; answers = [];
    round.forEach(q => recent.add(q.q));
    store.set('recent', [...recent].slice(-60));
    track('Tool Used', { pace });
    show('play'); setScore(0, false); question();
  }

  // ---------- a question ----------
  function question() {
    locked = false;
    const q = round[qi];
    $('[data-qn]').textContent = `${qi + 1} / ${ROUND}`;
    $('[data-bar]').style.width = `${(qi / ROUND) * 100}%`;
    $('[data-film]').textContent = q.f;
    $('[data-q]').textContent = q.q;
    $('[data-opts]').innerHTML = q.opts.map((o, i) => `<button type="button" data-o="${i}" style="--i:${i}"><span>${'ABCD'[i]}</span>${esc(o)}</button>`).join('');
    $('[data-fb]').textContent = ''; $('[data-fb]').className = 'cq-fb';
    $('[data-next]').hidden = true;
    const card = $('[data-card]'); card.classList.remove('in', 'good', 'bad'); void card.offsetWidth; card.classList.add('in');
    $('[data-ring]').hidden = pace !== 'timed';
    if (pace === 'timed') startTimer();
    setTimeout(() => $('[data-opts] button')?.focus({ preventScroll: true }), 350);
  }
  function startTimer() {
    cancelAnimationFrame(timer);
    const ring = $('[data-ring]'), t0 = performance.now();
    ring.classList.remove('low');
    const step = now => {
      tLeft = Math.max(0, SECS - (now - t0) / 1000);
      ring.style.setProperty('--p', (tLeft / SECS * 100).toFixed(2));
      $('[data-secs]').textContent = Math.ceil(tLeft);
      ring.classList.toggle('low', tLeft <= 5);
      if (tLeft <= 0) { answer(-1); return; }
      timer = requestAnimationFrame(step);
    };
    timer = requestAnimationFrame(step);
  }
  function answer(i) {
    if (locked) return; locked = true;
    cancelAnimationFrame(timer);
    const q = round[qi], btns = $$('[data-o]'), right = q.opts.indexOf(q.a), ok = i === right;
    btns.forEach((b, k) => { b.disabled = true; if (k === right) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); else b.classList.add('dim'); });
    const card = $('[data-card]');
    let pts = 0;
    if (ok) {
      streak++; bestStreak = Math.max(bestStreak, streak); correct++;
      const mult = streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;
      pts = Math.round((100 + (pace === 'timed' ? Math.round(tLeft / SECS * 50) : 0)) * mult);
      setScore(score + pts, true);
      card.classList.add('good'); burst(btns[right]);
      $('[data-fb]').innerHTML = `<b>+${pts}</b> ${['Correct!', 'Spot on!', 'Nice!', 'Yes!', 'Nailed it!'][Math.random() * 5 | 0]}${mult > 1 ? ` <span class="hot">🔥 ${streak} in a row</span>` : ''}`;
      $('[data-fb]').className = 'cq-fb good';
    } else {
      streak = 0; card.classList.add('bad');
      $('[data-fb]').innerHTML = i < 0 ? `⏰ Time’s up. It was <b>${esc(q.a)}</b>.` : `Not quite. It was <b>${esc(q.a)}</b>.`;
      $('[data-fb]').className = 'cq-fb bad';
    }
    drawMult();
    answers.push({ q, i, ok, pts });
    $('[data-next]').hidden = false;
    $('[data-next]').textContent = qi === ROUND - 1 ? 'See my score →' : 'Next question →';
    setTimeout(() => $('[data-next]').focus({ preventScroll: true }), 50);
  }
  function drawMult() {
    const m = $('[data-mult]'), mult = streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;
    m.hidden = mult === 1;
    m.querySelector('b').textContent = `×${mult}`;
    if (mult > 1) { m.classList.remove('pulse'); void m.offsetWidth; m.classList.add('pulse'); }
  }
  let shown = 0;
  function setScore(v, animate) {
    const el = $('[data-score]'), from = shown; score = v;
    if (!animate || calm.matches) { shown = v; el.textContent = v.toLocaleString(); return; }
    const t0 = performance.now(), step = now => { const k = Math.min(1, (now - t0) / 600); shown = Math.round(from + (v - from) * (1 - Math.pow(1 - k, 3))); el.textContent = shown.toLocaleString(); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    el.parentElement.classList.remove('bump'); void el.offsetWidth; el.parentElement.classList.add('bump');
  }
  function next() { if (qi < ROUND - 1) { qi++; question(); } else end(); }

  // ---------- end of round ----------
  const RANKS = [[10, '🎅', 'Santa’s Head Elf', 'A perfect round. The North Pole wants to hire you.'], [8, '🧝', 'Certified Elf', 'You clearly rewatch these every year.'], [6, '🎄', 'Holiday Regular', 'Solid festive knowledge. One more rewatch and you’re there.'], [4, '🎁', 'Still Wrapping Up', 'Not bad. Time for a Christmas movie marathon.'], [0, '🥶', 'Bah Humbug', 'Someone needs a cozy night in with the classics.']];
  function end() {
    $('[data-bar]').style.width = '100%';
    const [, emoji, title, line] = RANKS.find(([min]) => correct >= min);
    const best = store.get('best', null), isBest = !best || score > best.pts;
    if (isBest) store.set('best', { n: correct, pts: score });
    track('Game Finished', { correct, points: score, pace });
    show('end');
    $('[data-rank]').innerHTML = `<span class="cq-medal">${emoji}</span><small>You’re a</small><h2>${title}</h2><p>${line}</p>`;
    count($('[data-final-n]'), correct, ''); count($('[data-final-pts]'), score, ''); count($('[data-final-best]'), bestStreak, '');
    $('[data-newbest]').hidden = !isBest || !best;
    $('[data-review]').innerHTML = answers.map((a, i) => `<li class="${a.ok ? 'ok' : 'no'}" style="--i:${i}"><span>${a.ok ? '✓' : '✕'}</span><div><small>${esc(a.q.f)}</small><b>${esc(a.q.q)}</b><em>${esc(a.q.a)}</em></div></li>`).join('');
    if (correct >= 8) setTimeout(() => burst(null, 140), 400);
  }
  function count(el, to) { if (calm.matches) { el.textContent = to.toLocaleString(); return; } const t0 = performance.now(); const s = now => { const k = Math.min(1, (now - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString(); if (k < 1) requestAnimationFrame(s); }; requestAnimationFrame(s); }

  // ---------- share ----------
  function share() {
    const [, emoji, title] = RANKS.find(([min]) => correct >= min);
    const text = `🎄 Christmas Movie Trivia: ${correct}/10 (${score.toLocaleString()} points). I'm a ${title} ${emoji}\nCan you beat me?`, url = `${location.origin}/tools/christmas-movie-trivia/`;
    track('Tool Share');
    if (navigator.share && matchMedia('(pointer: coarse)').matches) navigator.share({ text, url }).catch(() => {});
    else navigator.clipboard?.writeText(`${text} ${url}`).then(() => { const b = $('[data-share]'); b.textContent = 'Copied! Paste it anywhere'; setTimeout(() => (b.textContent = 'Share my score'), 1800); });
  }

  // ---------- printable party version ----------
  function printQuiz() {
    const qs = shuffle(bank).slice(0, 20).map(q => ({ ...q, opts: shuffle([q.a, ...q.w]) }));
    $('[data-print-area]').innerHTML = `<h1>Christmas Movie Trivia</h1><p class="sub">20 questions · Write the letter of your answer · From getmovieshelf.app</p>
      <ol>${qs.map(q => `<li><b>${esc(q.q)}</b> <i>(${esc(q.f)})</i><div>${q.opts.map((o, i) => `<span>${'ABCD'[i]}. ${esc(o)}</span>`).join('')}</div></li>`).join('')}</ol>
      <div class="key"><h2>Answers</h2><ol>${qs.map(q => `<li>${'ABCD'[q.opts.indexOf(q.a)]}. ${esc(q.a)}</li>`).join('')}</ol></div>`;
    track('Tool Print');
    window.print();
  }

  // ---------- effects ----------
  function burst(from, n = 40) {
    if (calm.matches) return;
    const c = $('[data-burst]'), x = c.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; c.classList.add('on');
    const r = from?.getBoundingClientRect(), ox = r ? r.left + r.width / 2 : innerWidth / 2, oy = r ? r.top + r.height / 2 : innerHeight * .35;
    const shapes = ['❄', '★', '●'], cols = ['#ffffff', '#ffd27f', '#2fd15b', '#ff6b8e', '#a3b4ff'];
    const ps = Array.from({ length: n }, () => { const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * (n > 60 ? 13 : 8); return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, s: 10 + Math.random() * 12, ch: shapes[Math.random() * 3 | 0], c: cols[Math.random() * 5 | 0], r: Math.random() * 6, vr: (Math.random() - .5) * .2 }; });
    const t0 = performance.now();
    const f = now => {
      const k = (now - t0) / (n > 60 ? 2400 : 1100);
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, innerWidth, innerHeight); x.globalAlpha = Math.max(0, 1 - k);
      for (const p of ps) { p.vy += .25; p.vx *= .98; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.font = `${p.s}px sans-serif`; x.textAlign = 'center'; x.fillText(p.ch, 0, 0); x.restore(); }
      if (k < 1) requestAnimationFrame(f); else { x.clearRect(0, 0, innerWidth, innerHeight); c.classList.remove('on'); }
    };
    requestAnimationFrame(f);
  }
  // gentle snowfall behind the quiz
  (function snow() {
    const c = $('[data-snow]'), x = c.getContext('2d');
    let w, h, flakes = [];
    const size = () => { const r = root.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); w = r.width; h = r.height; c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); flakes = Array.from({ length: Math.round(w * h / 9000) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: .6 + Math.random() * 2.2, v: .2 + Math.random() * .6, d: Math.random() * 6 })); };
    size(); new ResizeObserver(size).observe(root);
    if (calm.matches) { flakes.forEach(f => { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(f.x, f.y, f.r, 0, 7); x.fill(); }); return; }
    let vis = true; new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(root);
    const t = now => {
      if (vis) { x.clearRect(0, 0, w, h); for (const f of flakes) { f.y += f.v; f.x += Math.sin(now / 1500 + f.d) * .25; if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; } x.fillStyle = `rgba(255,255,255,${.25 + f.r / 6})`; x.beginPath(); x.arc(f.x, f.y, f.r, 0, 7); x.fill(); } }
      requestAnimationFrame(t);
    };
    requestAnimationFrame(t);
  })();

  // ---------- events ----------
  root.addEventListener('click', e => {
    const t = e.target;
    const p = t.closest('[data-pace]'); if (p) { pace = p.dataset.pace; store.set('pace', pace); drawIntro(); }
    if (t.closest('[data-start]') || t.closest('[data-again]')) start();
    const o = t.closest('[data-o]'); if (o) answer(+o.dataset.o);
    if (t.closest('[data-next]')) next();
    if (t.closest('[data-share]')) share();
    if (t.closest('[data-print]')) printQuiz();
  });
  addEventListener('keydown', e => {
    if ($('[data-screen="play"]').hidden) return;
    const k = 'abcd'.indexOf(e.key.toLowerCase()); if (k >= 0 && !locked && round[qi]) { answer(k); e.preventDefault(); }
    if (e.key === 'Enter' && locked && document.activeElement?.tagName !== 'BUTTON') next();
  });

  Promise.all([
    fetch(new URL('questions.dat', import.meta.url)).then(r => r.text()),
    fetch('/tools/films.json').then(r => r.json()).catch(() => ({ films: [] })),
  ]).then(([enc, fj]) => {
    bank = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(enc.trim().split('').reverse().join('')), c => c.charCodeAt(0)))).questions;
    dataQs = buildDataQs(fj.films || []);
    const b = $('[data-start]'); b.disabled = false; b.textContent = 'Start the quiz';
    drawIntro();
  }).catch(() => { $('[data-start]').textContent = 'Couldn’t load the questions'; });
}
