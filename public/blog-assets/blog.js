// Reading progress, sticky contents, scroll reveals, counters and checklists. Pages read fine without it.
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reading progress
  const bar = document.querySelector('.progress i'), prose = document.querySelector('.prose');
  if (bar && prose) {
    const upd = () => { const r = prose.getBoundingClientRect(); const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight * .6))); bar.style.transform = `scaleX(${p})`; };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  // contents: highlight current section (desktop sidebar + mobile sticky bar)
  const links = $$('.toc a, .toc-m a'), cur = document.querySelector('.tm-c'), menu = document.querySelector('.toc-m');
  const heads = [...new Set(links.map(a => a.getAttribute('href').slice(1)))].map(id => document.getElementById(id)).filter(Boolean);
  if (heads.length) {
    let last = '';
    const pick = () => {
      let h = heads[0];
      for (const x of heads) if (x.getBoundingClientRect().top < innerHeight * .3) h = x;
      if (h.id === last) return; last = h.id;
      links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + h.id));
      if (cur) cur.textContent = h.textContent.replace(/^#/, '');
    };
    addEventListener('scroll', pick, { passive: true }); pick();
  }
  if (menu) {
    menu.addEventListener('click', e => { if (e.target.closest('a')) menu.open = false; });
    document.addEventListener('click', e => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  }

  // reveal + counters
  const count = el => {
    const to = parseFloat(el.dataset.count), pre = el.dataset.pre || '', post = el.dataset.post || '';
    const dec = (el.dataset.count.split('.')[1] || '').length, t0 = performance.now(), dur = 1200;
    const fmt = v => pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + post;
    if (reduce) return;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
      $$('[data-count]', e.target).forEach(count);
    }), { rootMargin: '0px 0px -12% 0px' });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('in'));

  // shelves: bring the highlighted spine into view on narrow screens
  $$('.sh-row').forEach(row => { const hi = row.querySelector('.hi'); if (hi && row.scrollWidth > row.clientWidth) row.scrollLeft = hi.offsetLeft - row.clientWidth / 2 + hi.offsetWidth / 2; });

  // checklists remember ticks per article, in this browser only
  $$('.checklist').forEach((cl, n) => {
    const key = `ms-cl:${location.pathname}:${n}`, boxes = $$('input', cl), out = cl.querySelector('.cl-n');
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    boxes.forEach((b, i) => { b.checked = saved.includes(i); });
    const sync = () => {
      const on = boxes.flatMap((b, i) => b.checked ? [i] : []);
      if (out) out.textContent = `${on.length} of ${boxes.length} done`;
      try { localStorage.setItem(key, JSON.stringify(on)); } catch {}
    };
    cl.addEventListener('change', sync); sync();
  });
})();
