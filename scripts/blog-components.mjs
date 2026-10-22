// Rich, visual building blocks for Journal posts. Authors write them in Markdown:
//
//   :::tip Optional title          :::note / :::warning / :::takeaways also work
//   Any **markdown** here.
//   :::
//
//   :::stats                       - value | label | optional small print
//   :::steps                       ### Step title  + text, repeated
//   :::cards                       ### Card title  + text, repeated
//   :::versus Left | Right         two markdown columns separated by a line with ---
//   :::checklist Title             - item (readers can tick them; saved in their browser)
//   :::bars Title                  - label | number | shown value
//   :::shelf Caption               - Title | dvd|bluray|uhd   (prefix * to highlight a spine)
//   :::pullquote                   one sentence worth repeating
//
//   {{phone:scan|Title|Text}}      {{phone:collection|…}}  {{phone:detail|…}}
//
// See content/blog/_STYLE.md for when to use each one.

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const items = inner => inner.split('\n').map(l => l.trim()).filter(l => /^[-*]\s+/.test(l)).map(l => l.replace(/^[-*]\s+/, ''));
const cols = s => s.split('|').map(x => x.trim());
const sections = inner => inner.split(/^###\s+/m).map(s => s.trim()).filter(Boolean).map(s => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), body: rest.join('\n').trim() }; });

const ICON = {
  tip: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z"/>',
  note: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  warning: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>',
  takeaways: '<path d="M5 12l4 4L19 6"/>',
};
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const LABEL = { tip: 'Collector tip', note: 'Good to know', warning: 'Watch out', takeaways: 'Key takeaways' };

export function renderBlock(name, arg, inner, md) {
  const block = s => md.parse(s);
  const inline = s => md.parseInline(s);
  switch (name) {
    case 'tip': case 'note': case 'warning': case 'takeaways':
      return `<aside class="callout ${name} rv"><div class="co-head">${svg(ICON[name])}<b>${esc(arg || LABEL[name])}</b></div><div class="co-body">${block(inner)}</div></aside>`;
    case 'stats':
      return `<div class="stats rv">${items(inner).map(l => { const [v, label, sub] = cols(l); const m = v.match(/^([^\d]*)([\d.,]+)(.*)$/);
        const num = m ? `<span class="v"${m ? ` data-count="${m[2].replace(/,/g, '')}" data-pre="${esc(m[1])}" data-post="${esc(m[3])}"` : ''}>${esc(v)}</span>` : `<span class="v">${esc(v)}</span>`;
        return `<div class="stat">${num}<span class="l">${inline(label || '')}</span>${sub ? `<small>${inline(sub)}</small>` : ''}</div>`; }).join('')}</div>`;
    case 'steps':
      return `<ol class="steps">${sections(inner).map((s, i) => `<li class="step rv"><span class="n">${String(i + 1).padStart(2, '0')}</span><div><h3 class="st">${inline(s.h)}</h3>${block(s.body)}</div></li>`).join('')}</ol>`;
    case 'cards':
      return `<div class="cards">${sections(inner).map((s, i) => `<div class="mcard rv" style="--i:${i}"><h3 class="ct">${inline(s.h)}</h3>${block(s.body)}</div>`).join('')}</div>`;
    case 'versus': {
      const [a = 'Option A', b = 'Option B'] = cols(arg || '');
      const [l, r = ''] = inner.split(/^\s*---\s*$/m);
      return `<div class="versus rv"><div class="vs-col"><span class="vs-h">${inline(a)}</span>${block(l.trim())}</div><span class="vs-mid" aria-hidden="true">vs</span><div class="vs-col alt"><span class="vs-h">${inline(b)}</span>${block(r.trim())}</div></div>`;
    }
    case 'checklist':
      return `<div class="checklist rv">${arg ? `<b class="cl-h">${esc(arg)}</b>` : ''}<ul>${items(inner).map((t, i) => `<li><label><input type="checkbox" data-k="${i}"><span class="box" aria-hidden="true"></span><span>${inline(t)}</span></label></li>`).join('')}</ul><small class="cl-n"></small></div>`;
    case 'bars': {
      const rows = items(inner).map(cols), max = Math.max(...rows.map(r => parseFloat(r[1]) || 0), 1);
      return `<figure class="bars rv">${arg ? `<figcaption>${esc(arg)}</figcaption>` : ''}${rows.map(([l, v, shown]) => `<div class="bar"><span class="bl">${inline(l)}</span><span class="track"><i style="--w:${Math.max(3, (parseFloat(v) || 0) / max * 100).toFixed(1)}%"></i></span><span class="bv">${esc(shown || v)}</span></div>`).join('')}</figure>`;
    }
    case 'shelf': {
      const spines = items(inner).map(l => { const hi = l.startsWith('*'); const [t, f = 'bluray'] = cols(l.replace(/^\*\s*/, '')); return { t, f: f.toLowerCase(), hi }; });
      const fl = { dvd: 'DVD', bluray: 'Blu-ray', uhd: '4K UHD' };
      return `<figure class="shelf rv"><div class="sh-row">${spines.map((s, i) => `<span class="sp ${s.f}${s.hi ? ' hi' : ''}" style="--i:${i};--h:${84 + ((i * 37) % 16)}%"><em>${esc(fl[s.f] || '')}</em><b>${esc(s.t)}</b></span>`).join('')}</div><div class="sh-board"></div>${arg ? `<figcaption>${inline(arg)}</figcaption>` : ''}</figure>`;
    }
    case 'pullquote':
      return `<blockquote class="pull rv"><p>${inline(inner.trim())}</p></blockquote>`;
    default:
      return block(inner);
  }
}

/* ---------- phone illustrations of the app ---------- */
const S = id => `/scans/${id}-front.jpg`;
const FMT = { uhd: '4K', bluray: 'BD', dvd: 'DVD' };
const screens = {
  scan: () => `<div class="ps scan"><img class="cam" src="/scans/dune-back.jpg" alt="" loading="lazy">
    <div class="ps-top"><span class="pill"><i></i>Scanning · 3 of 10</span></div>
    <div class="reticle"><i></i><i></i><i></i><i></i><span class="laser"></span></div>
    <div class="tray"><div class="thumbs">${['avatar', 'matrix', 'joker'].map(f => `<img src="${S(f)}" alt="" loading="lazy">`).join('')}<span class="plus">+7</span></div><span class="btn">Import 3</span></div></div>`,
  collection: () => `<div class="ps coll"><div class="ps-head"><b>Collection</b><small>248 titles</small></div>
    <div class="chips"><span>All</span><span class="on">4K UHD</span><span>Blu-ray</span><span>DVD</span></div>
    <div class="cgrid">${[['inception', 'uhd'], ['oppenheimer', 'uhd'], ['dune', 'bluray'], ['joker', 'bluray'], ['darkknight', 'bluray'], ['interstellar', 'dvd'], ['matrix', 'dvd'], ['jurassic', 'dvd'], ['endgame', 'dvd']].map(([f, k], i) => `<span class="cv" style="--i:${i}"><img src="${S(f)}" alt="" loading="lazy"><em class="${k}">${FMT[k]}</em></span>`).join('')}</div></div>`,
  detail: () => `<div class="ps det"><div class="hero"><img src="${S('dune')}" alt="" loading="lazy"></div>
    <b class="dt">Dune</b><small class="dm">2021 · Blu-ray · Dolby Atmos</small>
    <div class="loc"><small>Shelf location</small><b>Living room · Shelf B · Slot 14</b><div class="mini">${Array.from({ length: 18 }, (_, i) => `<i${i === 13 ? ' class="on"' : ''}></i>`).join('')}</div></div></div>`,
};
const DEFAULT = {
  scan: ['Scan a stack, import once', 'Point the camera at each barcode and Movieshelf queues up to 10 matches. Check them, then import the whole batch in one tap.'],
  collection: ['Filter by format in a tap', 'See every 4K UHD, Blu-ray or DVD you own with real covers, then search across the whole collection instantly.'],
  detail: ['Every disc has an address', 'Store the room, shelf and slot for each edition, so search tells you exactly where a disc lives.'],
};

export function phone(kind, title, text, ctaHref) {
  const k = screens[kind] ? kind : 'scan';
  const [t, x] = [title || DEFAULT[k][0], text || DEFAULT[k][1]];
  return `<figure class="phone-fig rv" aria-label="${esc(t)}"><div class="pm"><span class="island"></span>${screens[k]()}</div>
  <figcaption><span class="eyebrow"><i></i>Inside Movieshelf</span><b>${esc(t)}</b><span>${esc(x)}</span>${ctaHref ? `<a class="pf-link" href="${ctaHref}" target="_blank" rel="noopener">Try it free on iPhone →</a>` : ''}</figcaption></figure>`;
}
