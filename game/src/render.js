// render.js — SEMUA gambar canvas Bakso Blusukan: gerobak teal sore hari,
// panci rebusan besar beruap, rak bahan di meja, mangkok rakitan, pass
// saji, dan papan pesanan. Tanpa aset luar; semua bentuk digambar kode.
// Pola mangkok memakai motif geometris segitiga-titik rancangan sendiri.

import { MEATBALL_TYPES, NOODLES, EXTRAS, meatballType, noodleById, extraById } from './recipes.js';
import { COOK_TIME, BURN_TIME } from './stations.js';

export const W = 1280;
export const H = 800;

// ---- Tata letak (dipakai juga oleh input.js untuk hit-test) ----
export const LAYOUT = {
  hud: { x: 0, y: 0, w: W, h: 54 },
  board: { x: 996, y: 62, w: 268, ticketH: 118, gap: 8, top: 100 },
  shelf: { x: 24, y: 108, binW: 80, binH: 78, gap: 6 },
  pot: { cx: 198, rimY: 302, rimRx: 142, rimRy: 34, bottom: 472 },
  bowl: { cx: 528, rimY: 336, rimRx: 108, rimRy: 31, bottom: 446 },
  pass: { x: 700, y: 238, w: 252, h: 208 },
  serveBtn: { x: 352, y: 524, w: 208, h: 56 },
  trashBtn: { x: 580, y: 524, w: 176, h: 56 },
};

// Urutan rak bahan dari kiri ke kanan.
export const SHELF_ITEMS = [
  { kind: 'meatball', id: 'sapi', label: 'Bakso Sapi' },
  { kind: 'meatball', id: 'urat', label: 'Bakso Urat' },
  { kind: 'noodle', id: 'kuning', label: 'Mie Kuning' },
  { kind: 'noodle', id: 'bihun', label: 'Bihun' },
  { kind: 'noodle', id: 'campur', label: 'Mie Campur' },
  { kind: 'chili', id: 'sambal', label: 'Sambal' },
  { kind: 'extra', id: 'tahu', label: 'Tahu' },
  { kind: 'extra', id: 'pangsit', label: 'Pangsit' },
  { kind: 'extra', id: 'bawang', label: 'Bwg Goreng' },
  { kind: 'extra', id: 'seledri', label: 'Seledri' },
  { kind: 'ladle', id: 'kuah', label: 'Sendok Kuah' },
];

export function shelfRect(index) {
  const s = LAYOUT.shelf;
  return { x: s.x + index * (s.binW + s.gap), y: s.y, w: s.binW, h: s.binH };
}

export function ticketRect(index) {
  const b = LAYOUT.board;
  return { x: b.x, y: b.top + index * (b.ticketH + b.gap), w: b.w, h: b.ticketH };
}

// Posisi bakso di permukaan kuah panci (8 slot, dua baris melengkung).
const POT_OFFSETS = [
  [-88, -4], [-30, -13], [30, -13], [88, -4],
  [-58, 11], [0, 15], [58, 11], [0, -1],
];
export function potSlotPos(i) {
  const p = LAYOUT.pot;
  const [dx, dy] = POT_OFFSETS[i % POT_OFFSETS.length];
  return { x: p.cx + dx, y: p.rimY + dy };
}

// RNG deterministik kecil untuk menata isi mangkok & gelembung.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fmtRp(n) {
  return 'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function fmtClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// ---------- potongan gambar ----------

function drawBackground(ctx, S) {
  // Langit sore + trotoar jalan tempat gerobak mangkal.
  const sky = ctx.createLinearGradient(0, 0, 0, 500);
  sky.addColorStop(0, '#f7c873');
  sky.addColorStop(0.7, '#f3e5c8');
  sky.addColorStop(1, '#ecd9ae');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 512);
  ctx.fillStyle = '#8d8578';
  ctx.fillRect(0, 640, W, 160);
  ctx.fillStyle = '#7c7466';
  ctx.fillRect(0, 640, W, 8);
  // Siluet rumah & pohon di kejauhan.
  ctx.fillStyle = 'rgba(146,110,66,0.35)';
  ctx.fillRect(30, 420, 130, 92);
  ctx.fillRect(700, 408, 170, 104);
  ctx.beginPath();
  ctx.arc(930, 420, 46, 0, Math.PI * 2);
  ctx.arc(896, 438, 34, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(90,120,60,0.4)';
  ctx.fill();
}

function drawCart(ctx, S) {
  // Tenda gerobak bergaris teal-krem.
  ctx.save();
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#0f766e' : '#f3e5c8';
    ctx.beginPath();
    ctx.moveTo(16 + i * 80, 100);
    ctx.lineTo(16 + (i + 1) * 80, 100);
    ctx.lineTo(16 + (i + 1) * 80 + 10, 62);
    ctx.lineTo(16 + i * 80 + 10, 62);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#0b5952';
  ctx.fillRect(16, 98, 960, 8);
  ctx.restore();

  // Meja kayu tempat rak bahan dan area kerja.
  ctx.fillStyle = '#9a6a3f';
  ctx.fillRect(16, 486, 960, 26);
  ctx.fillStyle = '#7d552f';
  ctx.fillRect(16, 506, 960, 6);
  ctx.strokeStyle = 'rgba(90,58,28,0.5)';
  for (let x = 60; x < 970; x += 90) {
    ctx.beginPath(); ctx.moveTo(x, 490); ctx.lineTo(x, 508); ctx.stroke();
  }

  // Badan gerobak teal di bawah meja, papan nama dicat tangan.
  ctx.fillStyle = '#0f766e';
  rr(ctx, 60, 560, 872, 168, 10); ctx.fill();
  ctx.fillStyle = '#0b5952';
  rr(ctx, 60, 560, 872, 26, 10); ctx.fill();
  ctx.fillStyle = '#f7e7bd';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('BAKSO  BLUSUKAN', 496, 648);
  ctx.font = 'italic 19px Georgia, serif';
  ctx.fillStyle = '#bfe3dd';
  ctx.fillText('— gerobak bakso sapi keliling, mangkal sejak sore —', 496, 682);
  // Roda gerobak.
  for (const wx of [150, 842]) {
    ctx.beginPath(); ctx.arc(wx, 742, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#33302b'; ctx.fill();
    ctx.beginPath(); ctx.arc(wx, 742, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#c9c2b2'; ctx.fill();
  }
}

function drawShelf(ctx, S) {
  ctx.fillStyle = 'rgba(125,85,47,0.85)';
  rr(ctx, 16, 102, 960, 92, 8); ctx.fill();
  SHELF_ITEMS.forEach((item, i) => {
    const r = shelfRect(i);
    ctx.fillStyle = '#fdf6e0';
    rr(ctx, r.x, r.y, r.w, r.h, 7); ctx.fill();
    ctx.strokeStyle = '#b08b4f'; ctx.lineWidth = 1.5; ctx.stroke();
    drawShelfGlyph(ctx, item, r.x + r.w / 2, r.y + 30);
    ctx.fillStyle = '#4a3520';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const words = item.label.split(' ');
    if (words.length > 1) {
      ctx.fillText(words[0], r.x + r.w / 2, r.y + 62);
      ctx.fillText(words.slice(1).join(' '), r.x + r.w / 2, r.y + 74);
    } else {
      ctx.fillText(item.label, r.x + r.w / 2, r.y + 68);
    }
  });
}

function drawShelfGlyph(ctx, item, cx, cy) {
  ctx.save();
  if (item.kind === 'meatball') {
    const c = meatballType(item.id).color;
    for (const [dx, dy] of [[-11, 3], [0, -6], [11, 3], [0, 8]]) {
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 8, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(cx + dx - 2, cy + dy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  } else if (item.kind === 'noodle') {
    const c = noodleById(item.id).color;
    ctx.strokeStyle = c; ctx.lineWidth = 3;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.arc(cx + k * 10, cy + 2, 8, Math.PI * 0.15, Math.PI * 0.95);
      ctx.stroke();
    }
    if (item.id === 'campur') {
      ctx.strokeStyle = '#f2ead8';
      ctx.beginPath(); ctx.arc(cx, cy + 4, 9, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    }
    ctx.fillStyle = '#7d552f';
    ctx.fillRect(cx - 18, cy - 12, 36, 4);
  } else if (item.kind === 'chili') {
    ctx.fillStyle = '#b3271e';
    ctx.beginPath(); ctx.ellipse(cx, cy + 4, 15, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d43a2a';
    ctx.beginPath(); ctx.ellipse(cx, cy + 1, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx + 8, cy - 2); ctx.lineTo(cx + 17, cy - 12); ctx.stroke();
  } else if (item.kind === 'ladle') {
    ctx.strokeStyle = '#9aa0a3'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx - 12, cy - 13); ctx.lineTo(cx + 4, cy + 3); ctx.stroke();
    ctx.fillStyle = '#c7ccce';
    ctx.beginPath(); ctx.ellipse(cx + 9, cy + 8, 10, 6, 0.6, 0, Math.PI * 2); ctx.fill();
  } else if (item.id === 'tahu') {
    ctx.fillStyle = '#f5eeda'; ctx.strokeStyle = '#d8c491';
    for (const [dx, dy] of [[-10, -4], [4, -6], [-3, 7]]) {
      ctx.fillRect(cx + dx, cy + dy, 13, 11); ctx.strokeRect(cx + dx, cy + dy, 13, 11);
    }
  } else if (item.id === 'pangsit') {
    ctx.fillStyle = '#e0aa54'; ctx.strokeStyle = '#b97f26';
    for (const [dx, dy] of [[-12, 6], [2, -8], [8, 8]]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx, cy + dy - 8); ctx.lineTo(cx + dx + 8, cy + dy + 6); ctx.lineTo(cx + dx - 8, cy + dy + 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  } else if (item.id === 'bawang') {
    ctx.fillStyle = '#c98f2e';
    const rng = mulberry32(41);
    for (let k = 0; k < 14; k++) {
      ctx.fillRect(cx - 14 + rng() * 28, cy - 8 + rng() * 16, 4, 2);
    }
  } else if (item.id === 'seledri') {
    ctx.strokeStyle = '#4d8f3f'; ctx.lineWidth = 2.5;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath(); ctx.moveTo(cx + k * 6, cy + 10);
      ctx.quadraticCurveTo(cx + k * 7, cy, cx + k * 5, cy - 10); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPot(ctx, S) {
  const p = LAYOUT.pot;
  // Uap naik dari panci (pola tetap saat mode beku).
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 5; ctx.lineCap = 'round';
  const t = S.animT || 0;
  for (let k = 0; k < 4; k++) {
    const sx = p.cx - 66 + k * 44;
    const wob = Math.sin(t * 1.4 + k * 1.7) * 6;
    ctx.beginPath();
    ctx.moveTo(sx, p.rimY - 44);
    ctx.bezierCurveTo(sx + wob, p.rimY - 64, sx - wob, p.rimY - 80, sx + wob * 0.6, p.rimY - 98);
    ctx.stroke();
  }
  ctx.restore();

  // Badan panci aluminium.
  const body = ctx.createLinearGradient(p.cx - p.rimRx, 0, p.cx + p.rimRx, 0);
  body.addColorStop(0, '#8f979c'); body.addColorStop(0.5, '#d4d9db'); body.addColorStop(1, '#868e93');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(p.cx - p.rimRx, p.rimY);
  ctx.lineTo(p.cx + p.rimRx, p.rimY);
  ctx.lineTo(p.cx + p.rimRx - 18, p.bottom);
  ctx.quadraticCurveTo(p.cx, p.bottom + 12, p.cx - p.rimRx + 18, p.bottom);
  ctx.closePath(); ctx.fill();
  // Gagang.
  ctx.strokeStyle = '#6d7478'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(p.cx - p.rimRx - 8, p.rimY + 26, 14, Math.PI * 0.4, Math.PI * 1.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(p.cx + p.rimRx + 8, p.rimY + 26, 14, Math.PI * 1.5, Math.PI * 0.6, true); ctx.stroke();

  // Permukaan kuah mendidih + gelembung.
  ctx.fillStyle = '#c98d3d';
  ctx.beginPath(); ctx.ellipse(p.cx, p.rimY, p.rimRx, p.rimRy, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dda64e';
  ctx.beginPath(); ctx.ellipse(p.cx, p.rimY - 2, p.rimRx - 14, p.rimRy - 7, 0, 0, Math.PI * 2); ctx.fill();
  const rng = mulberry32(97);
  ctx.strokeStyle = 'rgba(255,235,190,0.8)'; ctx.lineWidth = 1.6;
  for (let k = 0; k < 16; k++) {
    const bx = p.cx + (rng() * 2 - 1) * (p.rimRx - 26);
    const by = p.rimY + (rng() * 2 - 1) * (p.rimRy - 10);
    const br = 2 + rng() * 3.5;
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.stroke();
  }
  // Bibir panci.
  ctx.strokeStyle = '#767e83'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.ellipse(p.cx, p.rimY, p.rimRx, p.rimRy, 0, 0, Math.PI * 2); ctx.stroke();

  // Bakso di dalam panci + busur timer kematangan per bakso.
  S.pot.slots.forEach((slot, i) => {
    const pos = potSlotPos(i);
    const st = S.pot.stateOf(slot);
    const base = meatballType(slot.type).color;
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 17, 0, Math.PI * 2);
    ctx.fillStyle = st === 'burnt' ? '#3a2a1c' : st === 'done' ? base : '#cbb59a';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(pos.x - 5, pos.y - 5, 5, 0, Math.PI * 2); ctx.fill();
    if (slot.type === 'urat') { // urat: bintik serat
      ctx.fillStyle = 'rgba(60,35,15,0.5)';
      ctx.fillRect(pos.x - 8, pos.y + 2, 6, 2); ctx.fillRect(pos.x + 3, pos.y - 6, 5, 2);
    }
    // Busur timer: penuh = matang; merah berkedip halus = menuju gosong.
    const frac = Math.min(1, slot.cook / COOK_TIME);
    ctx.strokeStyle = st === 'burnt' ? '#b3271e' : st === 'done' ? '#3f9e4d' : '#f0f0f0';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (st === 'raw' ? frac : 1));
    ctx.stroke();
    if (st === 'done' && slot.cook > BURN_TIME - 4) {
      ctx.fillStyle = '#b3271e';
      ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('!', pos.x, pos.y - 26);
    }
  });

  ctx.fillStyle = 'rgba(32,48,43,0.78)';
  ctx.font = 'bold 15px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('P A N C I   R E B U S A N', p.cx, p.bottom - 16);
}

// Mangkok dengan motif geometris segitiga-titik (pola orisinal gerobak ini).
function drawBowlShape(ctx, cx, rimY, rimRx, rimRy, bottom, opts = {}) {
  ctx.save();
  // Badan mangkok krem bergaris teal.
  const g = ctx.createLinearGradient(cx - rimRx, 0, cx + rimRx, 0);
  g.addColorStop(0, '#efe3c2'); g.addColorStop(0.5, '#fdf6e0'); g.addColorStop(1, '#e7d7ae');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - rimRx, rimY);
  ctx.quadraticCurveTo(cx - rimRx + 8, bottom - 8, cx - rimRx * 0.42, bottom);
  ctx.lineTo(cx + rimRx * 0.42, bottom);
  ctx.quadraticCurveTo(cx + rimRx - 8, bottom - 8, cx + rimRx, rimY);
  ctx.closePath(); ctx.fill();
  // Motif: deretan segitiga teal + titik merah di pinggang mangkok.
  const midY = rimY + (bottom - rimY) * 0.52;
  ctx.fillStyle = '#0f766e';
  const n = 7;
  for (let k = 0; k < n; k++) {
    const tx = cx - rimRx * 0.62 + k * (rimRx * 1.24 / (n - 1));
    ctx.beginPath();
    ctx.moveTo(tx - 7, midY + 6); ctx.lineTo(tx + 7, midY + 6); ctx.lineTo(tx, midY - 6);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#b3271e';
  for (let k = 0; k < n - 1; k++) {
    const tx = cx - rimRx * 0.62 + (k + 0.5) * (rimRx * 1.24 / (n - 1));
    ctx.beginPath(); ctx.arc(tx, midY + 14, 2.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#0f766e'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, rimY, rimRx, rimRy, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  if (!opts.bare) {
    // Permukaan isi mangkok.
    ctx.fillStyle = opts.broth ? '#d9a441' : '#e8dcc0';
    ctx.beginPath(); ctx.ellipse(cx, rimY, rimRx - 5, rimRy - 3, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawBowlContents(ctx, bowl, cx, rimY, rimRx, rimRy, seed) {
  const rng = mulberry32(seed);
  // Mie: lengkung-lengkung warna sesuai jenis.
  if (bowl.noodle) {
    const nd = noodleById(bowl.noodle);
    ctx.strokeStyle = nd.color; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      const ox = (rng() * 2 - 1) * rimRx * 0.5;
      const oy = (rng() * 2 - 1) * rimRy * 0.45;
      ctx.beginPath();
      ctx.arc(cx + ox, rimY + oy, 10 + rng() * 9, rng() * 3, rng() * 3 + 2.4);
      ctx.stroke();
    }
    if (bowl.noodle === 'campur') {
      ctx.strokeStyle = '#f2ead8';
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(cx + (rng() * 2 - 1) * rimRx * 0.4, rimY + (rng() * 2 - 1) * 6, 8 + rng() * 6, 0, 2.2);
        ctx.stroke();
      }
    }
  }
  // Bakso matang di mangkok: berjajar rapi di permukaan kuah.
  bowl.meatballs.forEach((type, i) => {
    const n = bowl.meatballs.length;
    const perRow = 4;
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const col = i % perRow;
    const x = cx + (col - (inRow - 1) / 2) * 27;
    const y = rimY - 3 + row * 13 + (col % 2) * 3;
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fillStyle = meatballType(type).color; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2); ctx.fill();
    if (type === 'urat') {
      ctx.fillStyle = 'rgba(60,35,15,0.5)';
      ctx.fillRect(x - 6, y + 2, 5, 2); ctx.fillRect(x + 2, y - 5, 4, 2);
    }
  });
  // Sambal: gumpalan merah per sendok.
  for (let k = 0; k < bowl.chili; k++) {
    const x = cx - 22 + k * 22;
    ctx.fillStyle = '#b3271e';
    ctx.beginPath(); ctx.ellipse(x, rimY + 8, 10, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e05240';
    ctx.beginPath(); ctx.ellipse(x - 2, rimY + 6, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Pelengkap.
  if (bowl.extras.has('tahu')) {
    ctx.fillStyle = '#f8efdb'; ctx.strokeStyle = '#d8c491'; ctx.lineWidth = 1.2;
    for (const [dx, dy] of [[-52, 2], [46, -4], [-30, 10]]) {
      ctx.fillRect(cx + dx, rimY + dy, 13, 11); ctx.strokeRect(cx + dx, rimY + dy, 13, 11);
    }
  }
  if (bowl.extras.has('pangsit')) {
    ctx.fillStyle = '#e0aa54'; ctx.strokeStyle = '#b97f26'; ctx.lineWidth = 1.2;
    for (const [dx, dy] of [[54, 6], [-62, -6]]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx, rimY + dy - 8); ctx.lineTo(cx + dx + 8, rimY + dy + 6); ctx.lineTo(cx + dx - 8, rimY + dy + 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  if (bowl.extras.has('bawang')) {
    ctx.fillStyle = '#c98f2e';
    for (let k = 0; k < 12; k++) ctx.fillRect(cx - 60 + rng() * 120, rimY - 8 + rng() * 16, 4, 2);
  }
  if (bowl.extras.has('seledri')) {
    ctx.fillStyle = '#4d8f3f';
    for (let k = 0; k < 9; k++) ctx.fillRect(cx - 55 + rng() * 110, rimY - 7 + rng() * 14, 5, 2.4);
  }
}

function drawAssembly(ctx, S) {
  const b = LAYOUT.bowl;
  drawBowlShape(ctx, b.cx, b.rimY, b.rimRx, b.rimRy, b.bottom, { broth: S.bowl.broth });
  drawBowlContents(ctx, S.bowl, b.cx, b.rimY, b.rimRx, b.rimRy, 1234);
  ctx.fillStyle = '#20302b';
  ctx.font = 'bold 16px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('MANGKOK RAKITAN', b.cx, b.bottom + 30);
  // Indikator cabai di atas mangkok (klik untuk mengulang dari nol).
  const label = `Sambal: ${'●'.repeat(S.bowl.chili)}${'○'.repeat(3 - S.bowl.chili)} (klik = ulang)`;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillStyle = '#8a2a20';
  ctx.fillText(label, b.cx, b.rimY - 52);
  if (S.bowl.empty) {
    ctx.fillStyle = 'rgba(90,70,50,0.75)';
    ctx.font = 'italic 14px system-ui, sans-serif';
    ctx.fillText('mangkok kosong — klik mie untuk mulai', b.cx, b.rimY - 32);
  }
}
export function chiliResetRect() {
  const b = LAYOUT.bowl;
  return { x: b.cx - 110, y: b.rimY - 66, w: 220, h: 20 };
}

function drawPass(ctx, S) {
  const p = LAYOUT.pass;
  ctx.fillStyle = 'rgba(125,85,47,0.9)';
  rr(ctx, p.x, p.y, p.w, p.h, 10); ctx.fill();
  if (S.passBowl) {
    const cx = p.x + p.w / 2;
    const rimY = p.y + 96;
    // Uap mangkok jadi.
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    const t = S.animT || 0;
    for (let k = 0; k < 3; k++) {
      const sx = cx - 30 + k * 30;
      const wob = Math.sin(t * 1.6 + k * 2.1) * 4;
      ctx.beginPath();
      ctx.moveTo(sx, rimY - 34);
      ctx.bezierCurveTo(sx + wob, rimY - 52, sx - wob, rimY - 66, sx + wob * 0.5, rimY - 84);
      ctx.stroke();
    }
    drawBowlShape(ctx, cx, rimY, 78, 23, rimY + 74, { broth: true });
    drawBowlContents(ctx, S.passBowl.bowl, cx, rimY, 78, 23, 777);
    ctx.fillStyle = '#3f9e4d';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(S.passBowl.note || 'Siap diantar!', cx, p.y + p.h - 14);
  } else {
    ctx.fillStyle = 'rgba(247,231,189,0.65)';
    ctx.font = 'italic 14px system-ui, sans-serif';
    ctx.fillText('belum ada mangkok jadi', p.x + p.w / 2, p.y + 110);
  }
  // Judul pass digambar terakhir, di atas chip gelap, agar uap tidak menabrak teks.
  ctx.fillStyle = 'rgba(32,48,43,0.85)';
  rr(ctx, p.x + 26, p.y + 8, p.w - 52, 30, 8); ctx.fill();
  ctx.fillStyle = '#f7e7bd';
  ctx.font = 'bold 16px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('PASS — SIAP SAJI', p.x + p.w / 2, p.y + 29);
}

function drawTicket(ctx, S, ticket, index) {
  const r = ticketRect(index);
  const selected = S.board.selectedTicket() === ticket;
  ctx.fillStyle = selected ? '#fffbe9' : '#fdf6e0';
  rr(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
  ctx.strokeStyle = selected ? '#d99a26' : '#b08b4f';
  ctx.lineWidth = selected ? 4 : 1.5; ctx.stroke();
  const x = r.x + 12;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#20302b';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`#${ticket.id}  ${fmtRp(ticket.price)}`, x, r.y + 22);
  if (ticket.double) {
    ctx.fillStyle = '#b3271e';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('ROMBONGAN', r.x + r.w - 10, r.y + 22);
    ctx.textAlign = 'left';
  }
  const mb = meatballType(ticket.meatballType);
  const nd = noodleById(ticket.noodle);
  ctx.fillStyle = mb.color;
  ctx.beginPath(); ctx.arc(x + 7, r.y + 40, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#20302b';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`${mb.label} x${ticket.meatballCount}`, x + 20, r.y + 45);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(nd.label, x, r.y + 65);
  // Sendok sambal bertingkat: sendok terisi = level cabai.
  ctx.fillText('Sambal', x, r.y + 84);
  for (let k = 0; k < 3; k++) {
    const sx = x + 52 + k * 26;
    ctx.fillStyle = k < ticket.chili ? '#b3271e' : '#d8cdb2';
    ctx.beginPath(); ctx.ellipse(sx, r.y + 80, 9, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx + 6, r.y + 78); ctx.lineTo(sx + 13, r.y + 72); ctx.stroke();
  }
  if (ticket.extras.length) {
    ctx.fillStyle = '#5a4632';
    ctx.font = '12px system-ui, sans-serif';
    const names = ticket.extras.map((id) => extraById(id).label).join(' + ');
    ctx.fillText('+ ' + names, x, r.y + 101);
  }
  // Bar kesabaran.
  const ratio = S.board.patienceRatio(ticket);
  ctx.fillStyle = '#e2d5ae';
  rr(ctx, x, r.y + r.h - 11, r.w - 24, 6, 3); ctx.fill();
  ctx.fillStyle = ratio > 0.5 ? '#3f9e4d' : ratio > 0.25 ? '#d99a26' : '#b3271e';
  rr(ctx, x, r.y + r.h - 11, Math.max(6, (r.w - 24) * ratio), 6, 3); ctx.fill();
}

function drawBoard(ctx, S) {
  ctx.fillStyle = '#20302b';
  rr(ctx, LAYOUT.board.x - 8, 62, LAYOUT.board.w + 16, 560, 10); ctx.fill();
  ctx.fillStyle = '#f7e7bd';
  ctx.font = 'bold 19px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('PAPAN PESANAN', LAYOUT.board.x + LAYOUT.board.w / 2, 90);
  const visible = S.board.tickets.slice(0, 4);
  visible.forEach((t, i) => drawTicket(ctx, S, t, i));
  if (S.board.tickets.length > 4) {
    ctx.fillStyle = '#f7e7bd';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(`+${S.board.tickets.length - 4} tiket mengantre…`, LAYOUT.board.x + LAYOUT.board.w / 2, 606);
  }
  // Antrean pembeli di bawah papan: siluet orang menunggu.
  const q = Math.min(6, S.board.tickets.length + (S.extraQueue || 0));
  ctx.fillStyle = '#f7e7bd';
  ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('ANTREAN PEMBELI', LAYOUT.board.x, 652);
  for (let k = 0; k < q; k++) {
    const px = LAYOUT.board.x + 16 + k * 42;
    const py = 700;
    ctx.fillStyle = ['#b3543f', '#3f6db3', '#3f9e6d', '#8a5fb3', '#b38a3f', '#4f7d7d'][k % 6];
    ctx.beginPath(); ctx.arc(px, py - 26, 10, 0, Math.PI * 2); ctx.fill();
    rr(ctx, px - 11, py - 15, 22, 34, 8); ctx.fill();
  }
  if (q === 0) {
    ctx.fillStyle = 'rgba(247,231,189,0.6)';
    ctx.font = 'italic 12px system-ui, sans-serif';
    ctx.fillText('sepi… pembeli berikutnya segera datang', LAYOUT.board.x, 690);
  }
}

function drawHud(ctx, S) {
  ctx.fillStyle = '#20302b';
  ctx.fillRect(0, 0, W, 54);
  ctx.fillStyle = '#f7e7bd';
  ctx.font = 'bold 20px system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`Koin ${fmtRp(S.coins)}`, 18, 36);
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillStyle = S.timeLeft <= 30 ? '#e05240' : '#f7e7bd';
  ctx.fillText(`SISA SHIFT ${fmtClock(S.timeLeft)}`, W / 2, 38);
  ctx.textAlign = 'right';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillStyle = '#f7e7bd';
  ctx.fillText(`Skor ${S.score}`, 1010, 36);
  ctx.fillStyle = '#e05240';
  ctx.fillText('✕'.repeat(S.strikes) + '·'.repeat(Math.max(0, 3 - S.strikes)), 1262, 36);
}

function drawButtons(ctx, S) {
  const sv = LAYOUT.serveBtn;
  ctx.fillStyle = '#3f9e4d';
  rr(ctx, sv.x, sv.y, sv.w, sv.h, 10); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('SAJIKAN  (Enter)', sv.x + sv.w / 2, sv.y + 37);
  const tb = LAYOUT.trashBtn;
  ctx.fillStyle = '#8a4a3a';
  rr(ctx, tb.x, tb.y, tb.w, tb.h, 10); ctx.fill();
  ctx.fillStyle = '#fdf6e0';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('BUANG (⌫)', tb.x + tb.w / 2, tb.y + 35);
  // Papan pesan di kiri tombol.
  ctx.fillStyle = '#fdf6e0';
  rr(ctx, 24, 524, 308, 56, 8); ctx.fill();
  ctx.strokeStyle = '#b08b4f'; ctx.stroke();
  ctx.fillStyle = '#5a4632';
  ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'left';
  const msg = S.message || 'Klik tiket untuk memilih pesanan yang dilayani.';
  wrapText(ctx, msg, 36, 546, 284, 16, 2);
}

function wrapText(ctx, text, x, y, maxW, lh, maxLines) {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + lines * lh);
      lines++;
      if (lines >= maxLines) return;
      line = w;
    } else line = test;
  }
  if (lines < maxLines) ctx.fillText(line, x, y + lines * lh);
}

function drawBanner(ctx, S) {
  ctx.save();
  ctx.fillStyle = 'rgba(32,48,43,0.88)';
  rr(ctx, 330, 192, 380, 76, 14); ctx.fill();
  ctx.strokeStyle = '#d99a26'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#f7e7bd';
  ctx.textAlign = 'center';
  ctx.font = 'bold 33px Georgia, serif';
  ctx.fillText('BAKSO BLUSUKAN', 520, 230);
  ctx.font = 'italic 13px Georgia, serif';
  ctx.fillStyle = '#bfe3dd';
  ctx.fillText('Gerobak bakso sapi — layani antrean sebelum kesabaran habis!', 520, 256);
  ctx.restore();
}

function drawGameOver(ctx, S) {
  ctx.fillStyle = 'rgba(20,28,25,0.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f7e7bd';
  ctx.textAlign = 'center';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(S.overTitle || 'SHIFT SELESAI', W / 2, 330);
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(`Mangkok tersaji: ${S.served} · Koin: ${fmtRp(S.coins)} · Skor: ${S.score}`, W / 2, 386);
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillStyle = '#bfe3dd';
  ctx.fillText('Klik atau tekan R untuk shift berikutnya', W / 2, 436);
}

// Gambar satu frame penuh dari state S.
export function drawScene(ctx, S) {
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, S);
  drawCart(ctx, S);
  drawShelf(ctx, S);
  drawPot(ctx, S);
  drawAssembly(ctx, S);
  drawPass(ctx, S);
  drawBoard(ctx, S);
  drawButtons(ctx, S);
  drawHud(ctx, S);
  if (S.banner) drawBanner(ctx, S);
  if (S.over) drawGameOver(ctx, S);
}

export { fmtRp, fmtClock };
