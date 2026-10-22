// Reading progress + table-of-contents highlighting. The page works fully without it.
(() => {
  const bar = document.querySelector('.progress i'), prose = document.querySelector('.prose');
  if (bar && prose) {
    const upd = () => { const r = prose.getBoundingClientRect(); const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight * .6))); bar.style.transform = `scaleX(${p})`; };
    addEventListener('scroll', upd, { passive: true }); upd();
  }
  const links = [...document.querySelectorAll('.toc a')];
  if (links.length && 'IntersectionObserver' in window) {
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.classList.remove('on')); map.get(e.target.id)?.classList.add('on'); } }), { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
  }
})();
