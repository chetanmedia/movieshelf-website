// DVD, Blu-ray, 4K UHD and CD case dimension lookup. All sizes in millimetres; units are display only.
// Sources: DVD keep case 190 x 135 x 14 mm and Blu-ray case 171.5 x 135 mm (Wikipedia: Keep case,
// Optical disc packaging; cdrom2go.com Blu-ray case dimensions); slim Blu-ray 7.5 mm (cdrom2go.com);
// CD jewel case 142 x 125 x 10 mm, slim 5 mm (Wikipedia: Optical disc packaging; cdrom2go.com).
// Cover insert sizes match the Movieshelf cover maker (DVD 273 x 183 mm, Blu-ray/4K 2 x 129 mm + spine, 148 mm tall).
const root = document.getElementById('cd');
if (root) {
  const C = {
    dvd: { name: 'DVD', sub: 'standard keep case', h: 190, w: 135, d: 14, dNote: '14 mm (some 15 mm)', ins: [273, 183], color: '#7d93ff' },
    slim: { name: 'Slim DVD', sub: 'TV box sets', h: 190, w: 135, d: 7, dNote: '7 to 9 mm', ins: [266, 183], color: '#6f7a94' },
    bd: { name: 'Blu-ray', sub: 'US case', h: 171.5, w: 135, d: 12, dNote: '11 to 13 mm', ins: [270, 148], color: '#3d7bff' },
    bduk: { name: 'Blu-ray UK', sub: 'thicker case', h: 171.5, w: 135, d: 14, dNote: '14 mm', ins: [272, 148], color: '#3d7bff' },
    uhd: { name: '4K UHD', sub: 'black case', h: 171.5, w: 135, d: 12, dNote: '12 to 13 mm', ins: [270, 148], color: '#2a2e3a', edge: '#8b92a8' },
    multi: { name: 'Multi-disc', sub: 'Blu-ray or 4K', h: 171.5, w: 135, d: 15, dNote: '15 mm and up', ins: [273, 148], color: '#3d7bff' },
    bdslim: { name: 'Slim Blu-ray', sub: 'thin case', h: 171.5, w: 135, d: 7.5, dNote: 'about 7.5 mm', ins: [265.5, 148], color: '#5a86ff' },
    cd: { name: 'CD', sub: 'jewel case', h: 125, w: 142, d: 10, dNote: '10 mm', ins: [120, 120], insNote: 'front booklet', color: '#c9d1e6' },
    cdslim: { name: 'Slim CD', sub: 'slim jewel case', h: 125, w: 142, d: 5, dNote: '5 mm', ins: [120, 120], insNote: 'front booklet', color: '#aab3c9' },
  };
  const IN = 25.4, FOOT = 304.8, KALLAX = 330;
  const $ = s => root.querySelector(s);
  const q = new URLSearchParams(location.search);
  let key = C[q.get('case')] ? q.get('case') : 'bd';
  let unit = q.get('u') === 'mm' || q.get('u') === 'in' ? q.get('u') : ((navigator.language || 'en-US').toLowerCase() === 'en-us' ? 'in' : 'mm');
  let used = false;

  const inch = mm => {
    const v = mm / IN;
    return `${v < 1 ? v.toFixed(2) : v.toFixed(v < 10 ? 2 : 1)} in`;
  };
  const mmS = mm => `${+mm.toFixed(1)} mm`;
  const one = mm => unit === 'in' ? inch(mm) : mmS(mm);
  const other = mm => unit === 'in' ? mmS(mm) : inch(mm);
  const trio = (a, b, c) => unit === 'in'
    ? `${(a / IN).toFixed(2)} × ${(b / IN).toFixed(2)} × ${(c / IN).toFixed(2)} in`
    : `${+a.toFixed(1)} × ${+b.toFixed(1)} × ${+c.toFixed(1)} mm`;
  const trioO = (a, b, c) => unit === 'in'
    ? `${+a.toFixed(1)} × ${+b.toFixed(1)} × ${+c.toFixed(1)} mm`
    : `${(a / IN).toFixed(2)} × ${(b / IN).toFixed(2)} × ${(c / IN).toFixed(2)} in`;

  // format buttons
  $('[data-cases]').innerHTML = Object.entries(C).map(([k, c]) =>
    `<button type="button" data-case="${k}" aria-pressed="${k === key}" style="--c:${c.color}"><b>${c.name}</b><small>${c.sub}</small></button>`).join('');

  function svg(c) {
    // Front view of the selected case over a dashed DVD outline, to scale.
    const ref = C.dvd, S = 1.25, pad = 20, W = 200 * S + pad * 2, H = 200 * S + pad * 2;
    const x = (W - c.w * S) / 2, y = H - pad - c.h * S, rx = (W - ref.w * S) / 2, ry = H - pad - ref.h * S;
    const showRef = c !== ref;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${c.name} case drawn to scale${showRef ? ' next to a DVD case outline' : ''}">
      ${showRef ? `<rect x="${rx}" y="${ry}" width="${ref.w * S}" height="${ref.h * S}" rx="6" fill="none" stroke="#61677c" stroke-dasharray="5 5"/><text x="${rx + ref.w * S - 6}" y="${ry + 16}" text-anchor="end" class="lbl">DVD</text>` : ''}
      <rect x="${x}" y="${y}" width="${c.w * S}" height="${c.h * S}" rx="6" fill="${c.color}" fill-opacity=".22" stroke="${c.edge || c.color}" stroke-width="2"/>
      <line x1="${x}" y1="${H - 15}" x2="${x + c.w * S}" y2="${H - 15}" class="dim"/><text x="${W / 2}" y="${H - 1}" text-anchor="middle" class="lbl">${one(c.w)}</text>
      <line x1="${x - 8}" y1="${y}" x2="${x - 8}" y2="${y + c.h * S}" class="dim"/><text transform="translate(${x - 13} ${y + c.h * S / 2}) rotate(-90)" text-anchor="middle" class="lbl">${one(c.h)}</text>
    </svg>`;
  }

  function render() {
    const c = C[key];
    root.querySelectorAll('[data-case]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.case === key)));
    root.querySelectorAll('[data-unit]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.unit === unit)));
    $('[data-name]').textContent = `${c.name} case dimensions`;
    $('[data-big]').textContent = trio(c.h, c.w, c.d);
    $('[data-alt]').textContent = `${trioO(c.h, c.w, c.d)} · height × width × thickness`;
    const per = (len) => Math.floor(len / c.d);
    const rows = [
      ['Height', one(c.h), other(c.h)],
      ['Width', one(c.w), other(c.w)],
      ['Thickness (spine)', one(c.d), c.dNote],
      [c.insNote ? 'Booklet' : 'Cover insert, flat', `${unit === 'in' ? `${(c.ins[0] / IN).toFixed(2)} × ${(c.ins[1] / IN).toFixed(2)} in` : `${c.ins[0]} × ${c.ins[1]} mm`}`, c.insNote || 'back + spine + front'],
      ['Per foot of shelf', `${per(FOOT)} cases`, `${per(1000)} per meter`],
      ['Per KALLAX cube', `${per(KALLAX)} cases`, 'one row, 33 cm wide'],
    ];
    $('[data-rows]').innerHTML = rows.map(r => `<tr><th scope="row">${r[0]}</th><td><b>${r[1]}</b><small>${r[2]}</small></td></tr>`).join('');
    $('[data-viz]').innerHTML = svg(c);
    const p = new URLSearchParams({ case: key, u: unit });
    history.replaceState(null, '', `${location.pathname}?${p}`);
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.case) key = b.dataset.case;
    else if (b.dataset.unit) unit = b.dataset.unit;
    else if (b.hasAttribute('data-copy')) {
      const c = C[key];
      const text = `${c.name} case: ${trio(c.h, c.w, c.d)} (${trioO(c.h, c.w, c.d)}), height × width × thickness. ${location.href}`;
      navigator.clipboard?.writeText(text).then(() => { b.textContent = 'Copied'; setTimeout(() => (b.textContent = 'Copy dimensions'), 1600); }).catch(() => {});
      return;
    } else return;
    render();
    if (!used) { used = true; window.plausible?.('tool_use', { props: { tool: 'case-dimensions' } }); }
  });

  render();
}
