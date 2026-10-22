// Movieshelf app screens, built in HTML so they stay crisp at any size.
// Designed at iPhone 15 Pro size (393 × 852 points) and scaled into the frame.
import { FILMS } from './films.js';

export const PW = 421, PH = 880; // phone outer size (screen + bezel)
const F = Object.fromEntries(FILMS.map(f => [f.id, f]));
const img = id => `scans/${id}-front.jpg`;
const FMT = { uhd: ['4K', '#111'], bluray: ['BD', '#2a63e0'], dvd: ['DVD', '#4a4d58'] };

const I = {
  home: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3.2 2.5 11h2.7v9h5.3v-5.6h3v5.6h5.3v-9h2.7z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 7v10M7 12h10" stroke="#5f7cf0" stroke-width="2.4" stroke-linecap="round"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="11" width="3.4" height="9" rx="1"/><rect x="10.3" y="4" width="3.4" height="16" rx="1"/><rect x="16.6" y="8" width="3.4" height="12" rx="1"/></svg>',
  more: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 5h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-5-7z"/><circle cx="10" cy="12" r="1.4" fill="#5f7cf0"/><circle cx="14" cy="12" r="1.4" fill="#5f7cf0"/><circle cx="18" cy="12" r="1.4" fill="#5f7cf0"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M7 12h10M10 17h4"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4" fill="currentColor"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  addc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
};

export const statusBar = () => `<div class="a-sb"><b>9:41</b><i class="a-island"></i><span class="a-sbi">
  <svg viewBox="0 0 18 12" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
  <svg viewBox="0 0 16 12" fill="#fff"><path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.6 10.6 0 0 0 8 .4 10.6 10.6 0 0 0 .5 3.4l1.2 1.3A9 9 0 0 1 8 2.2zm0 3.4c1.5 0 2.9.6 4 1.6l1.2-1.3A7.4 7.4 0 0 0 8 3.8a7.4 7.4 0 0 0-5.2 2.1L4 7.2a5.8 5.8 0 0 1 4-1.6zm0 3.4c.7 0 1.3.3 1.7.7L8 11.6 6.3 9.7c.4-.4 1-.7 1.7-.7z"/></svg>
  <i class="a-bat"><i></i></i></span></div>`;

export const tabBar = () => `<div class="a-tab"><svg class="a-tabbg" viewBox="0 0 393 96" preserveAspectRatio="none"><path d="M0 26H22C44 26 46 74 76 74S108 26 130 26H393V96H0Z" fill="#5f7cf0"/></svg>
  <span class="a-home">${I.home}</span>
  <span class="a-ti" style="left:150px">${I.plus}<small>Import</small></span>
  <span class="a-ti" style="left:240px">${I.stats}<small>Stats</small></span>
  <span class="a-ti" style="left:325px">${I.more}<small>More</small></span></div>`;

const CHIPS = { latest: ['<b class="a-new">NEW</b>', 'Latest adds'], all: [I.play, 'All Media'], coll: [I.grid, 'Collections'], watch: [I.eye, 'Watchlist'], wish: [I.heart, 'Wishlist'] };
const chips = (active, keys = ['latest', 'all', 'coll', 'watch']) =>
  `<div class="a-chips">${keys.map(k => `<span class="a-chip ${k} ${k === active ? 'on' : ''}" data-k="${k}">${CHIPS[k][0]}<em>${CHIPS[k][1]}</em></span>`).join('')}</div>`;
const header = () => `<div class="a-head"><h4>Movie Shelf</h4><p>Your personal movie collection</p></div>`;
const badge = f => `<i class="a-fmt" style="background:${FMT[f.fmt][1]}">${FMT[f.fmt][0]}</i>`;

/* ---------- scan ---------- */
function scanScreen() {
  return `<div class="scr" data-s="scan">
    <div class="a-cam"><div class="a-feed" style="background-image:url(scans/dune-back.jpg)"></div><div class="a-camfade"></div></div>
    ${statusBar()}
    <div class="a-scantop"><span class="a-glass a-round">${I.x}</span><span class="a-seg"><b>Scan Barcode</b><span>Search</span></span><span class="a-glass a-round">${I.bolt}</span></div>
    <div class="a-ret"><i></i><i></i><i></i><i></i><span class="a-laser"></span><span class="a-lock"></span></div>
    <div class="a-hint">Hold steady over the barcode</div>
    <div class="a-toast">${I.check}<span>Dune added to your shelf</span></div>
    <div class="a-sheet">
      <i class="a-grab"></i>
      <div class="a-input"><span class="a-code"></span><i class="a-caret"></i><em>Enter barcode number</em></div>
      <div class="a-listhead"><b>Imported list <span class="a-n">0</span> / 10</b><span class="a-import">Import</span></div>
      <div class="a-empty">Point the camera at a barcode to add it</div>
      <div class="a-found"><span class="a-thumb" style="background-image:url(${img('dune')})"></span><span><b>Dune</b><small>2021 · Blu-ray · Region B</small></span><span class="a-ok">${I.check}</span></div>
      <div class="a-queue"><span>Next in stack</span><i></i><i></i><i></i></div>
    </div>
  </div>`;
}

/* ---------- detail (shared by scan result, latest adds, collections) ---------- */
const DETAILS = {
  dune: { meta: '2021 · 155 min · Sci-fi', tags: [['BLU-RAY', '#2a63e0'], ['Region B'], ['Atmos']], added: 'Added just now',
    rows: [['Director', 'Denis Villeneuve'], ['Format', 'Blu-ray · 1080p · Region B'], ['Audio', 'Dolby Atmos · DTS-HD MA 5.1'], ['Subtitles', 'Italian, English SDH'], ['Barcode', '<span class="mono">5051891184725</span>']],
    shelf: ['Living room', 'Shelf B', 'Slot 14'], note: 'Italian import. Slipcover kept in the box.' },
  inception: { meta: '2010 · 148 min · Sci-fi', tags: [['4K UHD', '#111'], ['HDR'], ['+ Blu-ray']], added: 'Added 2 days ago',
    rows: [['Director', 'Christopher Nolan'], ['Format', '4K UHD + Blu-ray · HDR'], ['Audio', 'DTS-HD MA 5.1'], ['Subtitles', 'English SDH, French, Spanish'], ['Extras', 'Digital code included']],
    shelf: ['Living room', 'Shelf A', 'Slot 6'], note: 'Upgrade from the 2010 Blu-ray.' },
  interstellar: { meta: '2014 · 169 min · Sci-fi', tags: [['DVD', '#4a4d58'], ['Region 2'], ['2.40:1']], added: 'In Christopher Nolan',
    rows: [['Director', 'Christopher Nolan'], ['Format', 'DVD · Widescreen · Region 2'], ['Audio', 'Dolby Digital 5.1'], ['Subtitles', 'Swedish'], ['Runtime', '169 min']],
    shelf: ['Living room', 'Shelf A', 'Slot 3'], note: 'Swedish release. Want the 4K someday.' },
};
function detailScreen(id, name) {
  const d = DETAILS[id], f = F[id];
  return `<div class="scr a-det" data-s="${name}">
    <div class="a-dscroll">
      <div class="a-backdrop" style="background-image:url(${img(id)})"></div>
      <div class="a-dhero"><span class="a-poster" style="background-image:url(${img(id)})"></span>
        <div><span class="a-added">${I.check}${d.added}</span><h5>${f.t}</h5><p>${d.meta}</p>
        <div class="a-tags">${d.tags.map(([t, c]) => `<i${c ? ` style="background:${c}"` : ''}>${t}</i>`).join('')}</div></div></div>
      <div class="a-rows">${d.rows.map(([k, v]) => `<div class="a-row"><span>${k}</span><b>${v}</b></div>`).join('')}</div>
      <div class="a-shelfloc"><span class="a-lbl">${I.pin}Shelf location</span><b>${d.shelf.join(' · ')}</b><small>Last moved 3 weeks ago</small></div>
      <div class="a-notes"><span class="a-lbl">${I.tag}Notes</span><p>${d.note}</p></div>
    </div>
    ${statusBar()}
    <div class="a-dnav"><span class="a-glass a-round">${I.back}</span><span class="a-sp"></span><span class="a-glass a-round">${I.heart}</span><span class="a-glass a-round">${I.dots}</span></div>
    <div class="a-dbtns"><span class="a-btn ghost">${I.eye}Watchlist</span><span class="a-btn">${I.grid}Add to collection</span></div>
  </div>`;
}

/* ---------- latest adds ---------- */
const STACK = ['dune', 'joker', 'inception', 'oppenheimer', 'matrix'];
function latestScreen() {
  const d = DETAILS.inception;
  return `<div class="scr" data-s="latest">
    <div class="a-glow" style="background-image:url(${img('dune')})"></div>
    ${statusBar()}${header()}${chips('latest')}
    <div class="a-tip">Tap a card to see details</div>
    <div class="a-stack">${STACK.map(id => `<span class="a-card" data-id="${id}"><span class="a-cin">
      <span class="a-face fr" style="background-image:url(${img(id)})">${id === 'dune' ? '<span class="a-just">Just added</span>' : ''}<b>${F[id].t}</b><small>${FMT[F[id].fmt][0] === 'BD' ? 'Blu-ray' : FMT[F[id].fmt][0] === '4K' ? '4K UHD' : 'DVD'} · ${F[id].y}</small></span>
      <span class="a-face bk"><b>${F[id].t}</b>${id === 'inception' ? `<small>${d.meta}</small><i>${d.rows[1][1]}</i><i>${d.shelf.join(' · ')}</i>` : ''}</span></span></span>`).join('')}</div>
    <div class="a-dots">${STACK.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>
    <div class="a-swipe">Swipe to see more</div>
    ${tabBar()}
  </div>`;
}

/* ---------- all media ---------- */
const ALL = ['dune', 'inception', 'avatar', 'joker', 'oppenheimer', 'matrix', 'darkknight', 'interstellar', 'jurassic', 'endgame'];
function allScreen() {
  return `<div class="scr" data-s="all">
    ${statusBar()}${header()}${chips('all')}
    <div class="a-search"><span class="a-field">${I.search}<span class="a-q"></span><i class="a-caret"></i><em>Search ${ALL.length} titles</em></span><span class="a-glass a-sq">${I.filter}</span></div>
    <div class="a-pills"><i class="on" data-f="all">All</i><i data-f="uhd">4K UHD</i><i data-f="bluray">Blu-ray</i><i data-f="dvd">DVD</i><span class="a-count">${ALL.length} titles</span></div>
    <div class="a-grid">${ALL.map(id => `<span class="a-tile" data-id="${id}" data-fmt="${F[id].fmt}" data-t="${F[id].t.toLowerCase()}"><span class="a-tp" style="background-image:url(${img(id)})">${badge(F[id])}</span><b>${F[id].t}</b><small>${F[id].y}</small></span>`).join('')}</div>
    ${tabBar()}
  </div>`;
}

/* ---------- collections ---------- */
const FOLDERS = [['Christopher Nolan', ['inception', 'darkknight', 'interstellar'], 4, 'nolan'], ['Sci-fi nights', ['dune', 'matrix', 'avatar'], 5], ['4K Ultra HD', ['oppenheimer', 'inception', 'dune'], 2], ['Shelf B · Living room', ['jurassic', 'joker', 'endgame'], 12]];
const folderTile = ([n, ids, c, key]) => `<span class="a-folder"${key ? ` data-key="${key}"` : ''}><span class="a-mosaic"><i style="background-image:url(${img(ids[0])})"></i><i style="background-image:url(${img(ids[1])})"></i><i style="background-image:url(${img(ids[2])})"></i></span><b>${n}</b><small>${c} titles</small></span>`;
function collScreen() {
  return `<div class="scr" data-s="coll">
    ${statusBar()}${header()}${chips('coll')}
    <div class="a-search"><span class="a-field">${I.search}<em>Search collections</em></span></div>
    <div class="a-folders"><span class="a-folder new"><i>+</i><b>New collection</b></span>${FOLDERS.map(folderTile).join('')}</div>
    <div class="a-modal"><div class="a-msheet"><i class="a-grab"></i><b>New collection</b>
      <div class="a-input sm"><span class="a-mname"></span><i class="a-caret"></i><em>Collection name</em></div>
      <div class="a-mrow"><span>Cover</span><span class="a-sw2">Auto from posters</span></div>
      <span class="a-btn a-create">Create collection</span></div></div>
    ${tabBar()}
  </div>`;
}
function folderScreen() {
  const ids = ['inception', 'darkknight', 'interstellar', 'oppenheimer'];
  return `<div class="scr" data-s="folder">
    ${statusBar()}
    <div class="a-fnav"><span class="a-glass a-round">${I.back}</span><div><b>Christopher Nolan</b><small>4 titles · Shelf A</small></div><span class="a-glass a-round">${I.dots}</span></div>
    <div class="a-fgrid">${ids.map(id => `<span class="a-ftile" data-id="${id}"><span class="a-tp" style="background-image:url(${img(id)})">${badge(F[id])}</span><b>${F[id].t}</b><small>${F[id].y} · Shelf A</small></span>`).join('')}</div>
    ${tabBar()}
  </div>`;
}

/* ---------- watchlist / wishlist ---------- */
const WATCH = [['interstellar', 'Interstellar', 'DVD · 169 min'], ['jurassic', 'Jurassic Park', 'DVD · 127 min'], ['oppenheimer', 'Oppenheimer', '4K UHD · 181 min']];
const WISH = [['Dune: Part Two', '4K UHD · Steelbook', ['#c9934a', '#4a2a10'], 'D2'], ['Alien', '4K UHD · 45th anniversary', ['#2f4a3a', '#0b1410'], 'A'], ['Heat', 'Blu-ray · Director’s edition', ['#2c4a7a', '#0c1426'], 'H']];
const wrow = ([id, t, m]) => `<div class="a-wr" data-id="${id}"><span class="a-del">${I.trash}Remove</span><div class="a-li"><span class="a-lt" style="background-image:url(${img(id)})"></span><span><b>${t}</b><small>${m}</small></span><i class="a-chev">›</i></div></div>`;
const wishrow = ([t, m, [c1, c2], ab]) => `<div class="a-wr"><div class="a-li"><span class="a-lt hunt" style="background:linear-gradient(160deg,${c1},${c2})">${ab}</span><span><b>${t}</b><small>${m}</small></span><i class="a-tag">Wanted</i></div></div>`;
function watchScreen() {
  return `<div class="scr" data-s="watch">
    ${statusBar()}${header()}${chips('watch', ['latest', 'all', 'coll', 'watch', 'wish'])}
    <div class="a-wpanel on" data-p="watch">
      <div class="a-sec"><b>Up next</b><span class="a-wc">3 films</span></div>
      <div class="a-list">${WATCH.map(wrow).join('')}</div>
      <p class="a-foot">Move any film from All Media to your Watchlist.</p>
    </div>
    <div class="a-wpanel" data-p="wish">
      <div class="a-sec"><b>Still hunting</b><span class="a-hc">3 editions</span></div>
      <div class="a-wadd"><span class="a-field">${I.search}<span class="a-q"></span><i class="a-caret"></i><em>Add an edition you want</em></span></div>
      <div class="a-list">${WISH.map(wishrow).join('')}</div>
    </div>
    <div class="a-toast2">${I.check}<span></span></div>
    ${tabBar()}
  </div>`;
}

const BUILDERS = { scan: scanScreen, detail: () => detailScreen('dune', 'detail'), latest: latestScreen, 'det-inception': () => detailScreen('inception', 'det-inception'),
  all: allScreen, coll: collScreen, folder: folderScreen, 'det-interstellar': () => detailScreen('interstellar', 'det-interstellar'), watch: watchScreen };

/** Full phone: frame + chosen screens. */
export function phoneHTML(screens, active) {
  return `<div class="ip"><i class="ip-b l1"></i><i class="ip-b l2"></i><i class="ip-b l3"></i><i class="ip-b r1"></i>
    <div class="ip-scr app">${screens.map(s => BUILDERS[s]()).join('')}<i class="a-touch"></i><i class="ip-glare"></i></div></div>`
    .replace(`data-s="${active}"`, `data-s="${active}" data-on`);
}

export function setScreen(root, name) {
  root.querySelectorAll('.scr').forEach(s => { if (s.dataset.s === name) s.setAttribute('data-on', ''); else s.removeAttribute('data-on'); });
}

/** Scale a phone to fit its wrapper's width. */
export function autoScale(wrap) {
  const ip = wrap.querySelector('.ip');
  const fitIt = () => { ip.style.transform = `scale(${wrap.clientWidth / PW})`; };
  fitIt(); new ResizeObserver(fitIt).observe(wrap);
}
