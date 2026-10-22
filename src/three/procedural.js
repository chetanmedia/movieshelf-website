// Canvas-drawn artwork: case backs, spines, header bands, disc labels and
// fallback covers (used only if the generated art can't be loaded).

export const CW = 880, CH = 1168;

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
function spacing(g, px) { if ('letterSpacing' in g) g.letterSpacing = px + 'px'; }

/* ---------- EAN-13 ---------- */
const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
const PAR = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
export function ean13(d12) {
  const ds = d12.split('').map(Number); let s = 0; ds.forEach((v, i) => s += v * (i % 2 ? 3 : 1)); ds.push((10 - s % 10) % 10);
  let b = '101'; const p = PAR[ds[0]];
  for (let i = 1; i < 7; i++) b += (p[i - 1] === 'L' ? L : G)[ds[i]];
  b += '01010'; for (let i = 7; i < 13; i++) b += R[ds[i]]; b += '101';
  return { bits: b, code: ds.join('') };
}
export function drawEAN(g, x, y, w, h, d12) {
  const { bits, code } = ean13(d12); const m = w / (bits.length + 14);
  g.fillStyle = '#fff'; g.fillRect(x, y, w, h); g.fillStyle = '#000';
  const guard = new Set([0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94]);
  for (let i = 0; i < bits.length; i++) if (bits[i] === '1') g.fillRect(x + (i + 9) * m, y + h * .07, m + .4, h * (guard.has(i) ? .78 : .7));
  g.font = `500 ${h * .16}px "JetBrains Mono", monospace`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillText(code[0], x + 4 * m, y + h * .94); g.fillText(code.slice(1, 7), x + 33 * m, y + h * .96); g.fillText(code.slice(7), x + 79 * m, y + h * .96);
  return code;
}

/* ---------- fallback front cover ---------- */
const coverCache = new Map();
export function drawCover(f) {
  if (coverCache.has(f.id)) return coverCache.get(f.id);
  const W = CW, H = CH; const [cv, g] = canvas(W, H); const r = rng(f.id.length * 977 + 13); const [c0, c1, c2] = f.c;
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c0); gr.addColorStop(.7, c1); gr.addColorStop(1, c0); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const circle = (x, y, rr, fill) => { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fillStyle = fill; g.fill(); };
  switch (f.m) {
    case 'mountains': circle(W * .64, H * .4, W * .15, c2);
      for (let l = 0; l < 3; l++) { g.beginPath(); const base = H * (.5 + l * .09); g.moveTo(0, H); g.lineTo(0, base); let x = 0; while (x < W) { x += W * (.08 + r() * .12); g.lineTo(x, base - H * (.05 + r() * .16) / (l * .6 + 1)); x += W * (.06 + r() * .1); g.lineTo(x, base + r() * 20); } g.lineTo(W, H); g.closePath(); g.fillStyle = ['#5a7fb8', '#1b3358', '#09162b'][l]; g.fill(); } break;
    case 'waves': circle(W * .5, H * .48, W * .2, c2); g.fillStyle = c0; g.fillRect(0, H * .48, W, H);
      for (let k = 0; k < 22; k++) { const y = H * .49 + k * k * 1.3 + k * 6; g.beginPath(); for (let x = 0; x <= W; x += 10) g.lineTo(x, y + Math.sin(x / (40 + k * 4) + k) * (3 + k * .7)); g.strokeStyle = k < 6 ? hexA(c2, .6 - k * .08) : hexA(c1, .5 - k * .015); g.lineWidth = 2 + k * .15; g.stroke(); } break;
    case 'rings': g.fillStyle = c0; g.fillRect(0, 0, W, H); for (let s = 0; s < 220; s++) { g.fillStyle = `rgba(255,255,255,${r() * .8})`; g.fillRect(r() * W, r() * H * .75, 2, 2); }
      { const pg = g.createRadialGradient(W * .42, H * .33, 10, W * .5, H * .4, W * .26); pg.addColorStop(0, c2); pg.addColorStop(.5, c1); pg.addColorStop(1, c0); circle(W * .5, H * .4, W * .24, pg);
        g.save(); g.translate(W * .5, H * .4); g.rotate(-.35); for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(0, 0, W * (.38 + k * .05), W * (.08 + k * .012), 0, 0, 7); g.strokeStyle = hexA(k ? c1 : c2, .8 - k * .2); g.lineWidth = 6 - k; g.stroke(); } g.restore(); } break;
    case 'city': gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c2); gr.addColorStop(.45, c1); gr.addColorStop(1, c0); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      { let x = -10; while (x < W) { const bw = 50 + r() * 100, bh = H * (.25 + r() * .45); g.fillStyle = hexA(c0, .9); g.fillRect(x, H - bh, bw, bh); for (let wy = H - bh + 14; wy < H - 30; wy += 22) for (let wx = x + 8; wx < x + bw - 8; wx += 16) if (r() > .6) { g.fillStyle = hexA(c2, .35 + r() * .6); g.fillRect(wx, wy, 6, 9); } x += bw + 4; } } break;
    case 'moon': circle(W * .5, H * .36, W * .26, c2);
      for (let l = 0; l < 4; l++) { g.beginPath(); g.moveTo(0, H); const b = H * (.55 + l * .08); g.lineTo(0, b); for (let x = 0; x <= W; x += W / 6) g.quadraticCurveTo(x + W / 12, b - 60 + r() * 40, x + W / 6, b + r() * 14); g.lineTo(W, H); g.closePath(); g.fillStyle = l % 2 ? c1 : c0; g.globalAlpha = .8 + l * .05; g.fill(); } g.globalAlpha = 1; break;
    default: g.fillStyle = c0; g.fillRect(0, 0, W, H); for (let s = 0; s < 9000; s++) { const v = r() * 255 | 0; g.fillStyle = `rgba(${v},${v},${v},.3)`; g.fillRect(r() * W, r() * H, 4, 3); }
      g.fillStyle = c1; g.fillRect(0, H * .38, W, H * .12); circle(W * .5, H * .44, W * .11, c2); circle(W * .5, H * .44, W * .06, c0);
  }
  const vg = g.createRadialGradient(W / 2, H / 2, W * .3, W / 2, H / 2, W * .9); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.85)'; spacing(g, 6);
  g.font = `600 ${W * .024}px Figtree, sans-serif`; g.fillText(f.tag.toUpperCase(), W / 2, H * .07);
  spacing(g, 2); let fs = W * .14; const T = f.t.toUpperCase();
  do { g.font = `800 ${fs}px "Bricolage Grotesque", sans-serif`; fs -= 3; } while (g.measureText(T).width > W * .84);
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; g.fillStyle = '#fff'; g.fillText(T, W / 2, H * .84); g.shadowBlur = 0;
  g.fillStyle = 'rgba(255,255,255,.3)'; for (let l = 0; l < 3; l++) { const lw = W * (.7 - l * .12); g.fillRect((W - lw) / 2, H * (.885 + l * .022), lw, 4); }
  coverCache.set(f.id, cv); return cv;
}

/* ---------- composed back cover (uses the real front art) ---------- */
export function drawBack(f, front) {
  const W = CW, H = CH; const [cv, g] = canvas(W, H); const [c0, , c2] = f.c;
  g.fillStyle = '#060608'; g.fillRect(0, 0, W, H);
  g.save(); g.filter = 'blur(18px) brightness(.55) saturate(1.2)'; g.drawImage(front, -60, -60, W + 120, H + 120); g.restore();
  const fade = g.createLinearGradient(0, 0, 0, H); fade.addColorStop(0, 'rgba(0,0,0,.15)'); fade.addColorStop(.55, 'rgba(0,0,0,.55)'); fade.addColorStop(1, 'rgba(0,0,0,.9)'); g.fillStyle = fade; g.fillRect(0, 0, W, H);
  g.textAlign = 'center'; g.fillStyle = c2; spacing(g, 4); g.font = `800 ${W * .052}px "Bricolage Grotesque", sans-serif`; g.fillText(f.tag.toUpperCase(), W / 2, H * .1);
  spacing(g, 0); g.fillStyle = 'rgba(255,255,255,.88)'; g.font = `400 ${W * .03}px Figtree, sans-serif`;
  let line = '', y = H * .17; for (const w of f.syn.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > W * .8) { g.fillText(line, W / 2, y); line = w; y += W * .045; } else line = t; } g.fillText(line, W / 2, y);
  const sy = y + W * .06, sw = W * .26, sh = W * .17;
  const fw = front.width || front.naturalWidth, fh = front.height || front.naturalHeight;
  for (let k = 0; k < 3; k++) { const sx = W * (.08 + k * .29); g.drawImage(front, fw * (.08 + k * .22), fh * (.12 + k * .13), fw * .5, fh * .33, sx, sy, sw, sh); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.strokeRect(sx, sy, sw, sh); }
  const ty = sy + sh + W * .09; g.textAlign = 'left'; g.font = `500 ${W * .021}px "JetBrains Mono", monospace`;
  const rows = [['RUNTIME', f.run + ' MIN'], ['AUDIO', f.au.toUpperCase()], ['SUBTITLES', 'EN · ES · FR · DE'], ['VIDEO', f.fmt === 'dvd' ? '480p · 16:9' : f.fmt === 'uhd' ? '2160p · HDR · 2.39:1' : '1080p · 2.39:1']];
  g.strokeStyle = hexA(c2, .5); g.strokeRect(W * .07, ty - W * .05, W * .86, rows.length * W * .045 + W * .04);
  rows.forEach((rw, k) => { g.fillStyle = hexA(c2, .95); g.fillText(rw[0], W * .1, ty + k * W * .045); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText(rw[1], W * .32, ty + k * W * .045); });
  g.fillStyle = 'rgba(255,255,255,.35)'; for (let l = 0; l < 5; l++) g.fillRect(W * .08, H * (.84 + l * .016), W * (.46 - (l % 2) * .08), 3);
  drawEAN(g, W * .6, H * .83, W * .32, H * .12, f.ean);
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.strokeRect(W * .08, H * .93, W * .07, W * .07); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `800 ${W * .03}px "Bricolage Grotesque", sans-serif`; g.fillText('NR', W * .115, H * .93 + W * .047);
  return cv;
}

/* ---------- spine ---------- */
export function drawSpine(f, F, title) {
  const W = 120, H = 1500; const [cv, g] = canvas(W, H);
  g.fillStyle = F.spineBg; g.fillRect(0, 0, W, H);
  const band = F.band ? 150 : 0;
  if (F.band) { g.fillStyle = F.bandBg; g.fillRect(0, 0, W, band); g.fillStyle = '#fff'; g.save(); g.translate(W / 2, band / 2); g.rotate(Math.PI / 2); g.font = `800 26px "Bricolage Grotesque", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; spacing(g, 3); g.fillText(F.fmt === 'uhd' ? '4K' : 'BD', 0, 0); g.restore(); }
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(.3, 'rgba(0,0,0,0)'); gr.addColorStop(.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)');
  g.save(); g.translate(W / 2, band + 40); g.rotate(Math.PI / 2); g.fillStyle = '#fff'; g.textBaseline = 'middle'; spacing(g, 6);
  g.font = `800 50px "Bricolage Grotesque", sans-serif`; g.fillText((title || f.t).toUpperCase(), 0, 0);
  g.font = `500 30px "JetBrains Mono", monospace`; g.fillStyle = 'rgba(255,255,255,.6)'; g.textAlign = 'right'; g.fillText(String(f.y || ''), H - band - 80, 0);
  g.restore(); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return cv;
}

/* ---------- header band ---------- */
const bandCache = new Map();
export function drawBand(F) {
  if (bandCache.has(F.key)) return bandCache.get(F.key);
  const W = 1024, H = Math.round(1024 * F.bandH / (F.w - .08)); const [cv, g] = canvas(W, H);
  g.fillStyle = F.bandBg; g.fillRect(0, 0, W, H);
  const sh = g.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(255,255,255,.18)'); sh.addColorStop(.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = sh; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = H * .06;
  const cx = W / 2 - (F.key === 'uhd' ? 200 : 130), cy = H / 2, rr = H * .28;
  g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, rr * .3, 0, 7); g.fill();
  g.font = `800 ${H * .42}px "Bricolage Grotesque", sans-serif`; g.textBaseline = 'middle'; spacing(g, H * .08); g.textAlign = 'left';
  g.fillText(F.band, cx + rr + H * .25, cy + H * .02);
  bandCache.set(F.key, cv); return cv;
}

/* ---------- disc label ---------- */
export function drawDiscLabel(f, front) {
  const S = 1024; const [cv, g] = canvas(S, S);
  g.save(); g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, 7); g.clip();
  const fw = front.width || front.naturalWidth, fh = front.height || front.naturalHeight;
  g.drawImage(front, 0, (fh - fw) * .35, fw, fw, 0, 0, S, S);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, S, S);
  g.fillStyle = '#fff'; g.font = `800 ${S * .07}px "Bricolage Grotesque", sans-serif`; g.textAlign = 'center'; spacing(g, 8);
  g.fillText(f.t.toUpperCase(), S / 2, S * .2); g.restore();
  return cv;
}

/* ---------- box set inner case variants ---------- */
export function drawVariant(art, idx, part) {
  const W = CW, H = CH; const [cv, g] = canvas(W, H);
  const aw = art.width || art.naturalWidth, ah = art.height || art.naturalHeight;
  const sx = [0, aw * .22, aw * .44][idx];
  g.drawImage(art, sx, ah * .18, aw * .56, ah * .74, 0, 0, W, H);
  const tint = ['rgba(10,30,80,.15)', 'rgba(20,90,110,.25)', 'rgba(90,40,10,.25)'][idx]; g.fillStyle = tint; g.fillRect(0, 0, W, H);
  const fade = g.createLinearGradient(0, H * .55, 0, H); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = fade; g.fillRect(0, H * .55, W, H * .45);
  g.textAlign = 'center'; g.fillStyle = '#f3d999'; spacing(g, 10); g.font = `600 ${W * .03}px Figtree, sans-serif`; g.fillText(part.sub.toUpperCase(), W / 2, H * .76);
  spacing(g, 3); g.fillStyle = '#fff'; let fs = W * .12; const T = part.t.toUpperCase();
  do { g.font = `800 ${fs}px "Bricolage Grotesque", sans-serif`; fs -= 3; } while (g.measureText(T).width > W * .86);
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 24; g.fillText(T, W / 2, H * .86); g.shadowBlur = 0;
  g.fillStyle = 'rgba(255,255,255,.3)'; for (let l = 0; l < 2; l++) { const lw = W * (.6 - l * .12); g.fillRect((W - lw) / 2, H * (.91 + l * .02), lw, 4); }
  return cv;
}

export function drawSleeveSide(art, label) {
  const W = 300, H = 1500; const [cv, g] = canvas(W, H);
  const aw = art.width || art.naturalWidth, ah = art.height || art.naturalHeight;
  g.save(); g.filter = 'blur(6px) brightness(.5)'; g.drawImage(art, aw * .4, 0, aw * .2, ah, -10, -10, W + 20, H + 20); g.restore();
  g.save(); g.translate(W / 2, 60); g.rotate(Math.PI / 2); g.fillStyle = '#f3d999'; g.font = `800 64px "Bricolage Grotesque", sans-serif`; spacing(g, 10); g.textBaseline = 'middle'; g.fillText(label.toUpperCase(), 0, 0); g.restore();
  return cv;
}

export function drawSleeveBack(art) {
  const W = CW, H = CH; const [cv, g] = canvas(W, H);
  g.save(); g.filter = 'blur(14px) brightness(.4)'; g.scale(-1, 1); g.drawImage(art, -W - 40, -40, W + 80, H + 80); g.restore();
  g.textAlign = 'center'; g.fillStyle = '#f3d999'; g.font = `800 ${W * .06}px "Bricolage Grotesque", sans-serif`; spacing(g, 6); g.fillText('THREE FILMS. ONE ROAD.', W / 2, H * .14);
  drawEAN(g, W * .6, H * .84, W * .32, H * .12, '507777000123');
  return cv;
}

/* spine from a real scan, with the molded band on top for Blu-ray / 4K cases */
export function drawScannedSpine(img, F) {
  const W = 120, H = 1500; const [cv, g] = canvas(W, H);
  const band = F.band ? Math.round(H * F.bandH / F.h) : 0;
  g.fillStyle = F.spineBg; g.fillRect(0, 0, W, H);
  g.drawImage(img, 0, band, W, H - band);
  if (F.band) { g.fillStyle = '#fff'; g.save(); g.translate(W / 2, band / 2); g.rotate(Math.PI / 2); g.font = `800 26px "Bricolage Grotesque", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; spacing(g, 3); g.fillText(F.fmt === 'uhd' ? '4K' : 'BD', 0, 0); g.restore(); }
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(0,0,0,.3)'); gr.addColorStop(.25, 'rgba(0,0,0,0)'); gr.addColorStop(.75, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return cv;
}
