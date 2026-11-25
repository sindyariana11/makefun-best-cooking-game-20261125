// main.js — loop game Bakso Blusukan: jam shift, rakit mangkok, cek
// resep, sajikan untuk koin & skor, tiket hangus jadi strike, tekanan
// naik berkala, game over + restart. Mode ?shot=cover|rush|serve&seed=N
// membekukan satu adegan tertata untuk screenshot juri.

import { OrderBoard } from './orders.js';
import { Pot, Bowl } from './stations.js';
import { MAX_CHILI, buildTicket, ticketPrice } from './recipes.js';
import { drawScene, mulberry32 } from './render.js';
import { attachInput } from './input.js';

const SHIFT_SECONDS = 240;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function freshState(rng) {
  return {
    rng,
    board: new OrderBoard(rng),
    pot: new Pot(),
    bowl: new Bowl(),
    passBowl: null,
    passTimer: 0,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    score: 0,
    served: 0,
    strikes: 0,
    message: '',
    messageTimer: 0,
    animT: 0,
    over: false,
    overTitle: '',
    banner: false,
    extraQueue: 0,
  };
}

let S = freshState(Math.random);

function heat() {
  return Math.min(1, S.elapsed / SHIFT_SECONDS + S.served * 0.012);
}

function say(text, seconds = 4) {
  S.message = text;
  S.messageTimer = seconds;
}

function serve() {
  if (S.over) return;
  const ticket = S.board.selectedTicket();
  if (!ticket) { say('Belum ada pesanan di papan.'); return; }
  if (S.bowl.empty) { say('Mangkok masih kosong — rakit dulu sesuai tiket.'); return; }
  const problem = S.bowl.checkAgainst(ticket);
  if (problem) { say('Belum pas: ' + problem); return; }
  const ratio = S.board.patienceRatio(ticket);
  const tip = Math.round(ticket.price * ratio * 0.5);
  S.coins += ticket.price + tip;
  S.score += 100 + Math.round(ratio * 60) + ticket.meatballCount * 5;
  S.served += 1;
  S.passBowl = {
    bowl: snapshotBowl(S.bowl),
    note: `+${fmtTip(ticket.price + tip)} untuk tiket #${ticket.id}!`,
  };
  S.passTimer = 3.2;
  S.board.remove(ticket);
  S.bowl.reset();
  say(tip > 1500 ? 'Pembeli puas, tip besar!' : 'Tersaji! Lanjut ke tiket berikutnya.');
}

function fmtTip(n) {
  return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function snapshotBowl(bowl) {
  const copy = new Bowl();
  copy.noodle = bowl.noodle;
  copy.meatballs = [...bowl.meatballs];
  copy.broth = bowl.broth;
  copy.chili = bowl.chili;
  copy.extras = new Set(bowl.extras);
  return copy;
}

function scoopFromPot(index) {
  if (S.over) return;
  const res = S.pot.scoop(index);
  if (!res) return;
  if (res.ok) {
    S.bowl.addMeatball(res.type);
    say('Bakso matang masuk mangkok.');
  } else if (res.reason === 'burnt') {
    say('Bakso gosong dibuang. Lain kali jangan kelamaan direbus!');
  } else {
    say('Bakso itu belum matang — tunggu busur timernya hijau.');
  }
}

function scoopAnyDone() {
  // Dahulukan bakso matang yang paling lama direbus: ia yang paling
  // dekat ke gosong, jadi selamatkan dia lebih dulu.
  let idx = -1;
  let longest = -1;
  S.pot.slots.forEach((s, i) => {
    if (S.pot.stateOf(s) === 'done' && s.cook > longest) { longest = s.cook; idx = i; }
  });
  if (idx >= 0) scoopFromPot(idx);
  else if (S.pot.slots.length) say('Belum ada bakso yang matang di panci.');
  else say('Panci kosong — klik Bakso Sapi/Urat di rak untuk mulai merebus.');
}

const actions = {
  anyClick() {
    if (S.over) restart();
  },
  restart() {
    if (S.over) restart();
  },
  cycleTicket() {
    if (S.board.size) S.board.select((S.board.selected + 1) % S.board.size);
  },
  selectTicket(i) {
    S.board.select(i);
    const t = S.board.selectedTicket();
    if (t) say(`Melayani tiket #${t.id}.`);
  },
  shelf(item) {
    if (S.over) return;
    if (item.kind === 'meatball') {
      if (S.pot.addMeatball(item.id)) say(`${item.label} masuk panci — tunggu sampai matang.`);
      else say('Panci penuh! Sendok dulu yang sudah matang.');
    } else if (item.kind === 'noodle') {
      S.bowl.setNoodle(item.id);
      say(`Mie ${item.label.replace('Mie ', '')} masuk mangkok.`);
    } else if (item.kind === 'chili') {
      const before = S.bowl.chili;
      S.bowl.addChili(MAX_CHILI);
      say(S.bowl.chili > before ? `Sambal ${S.bowl.chili} sendok.` : 'Sambal sudah 3 sendok (maksimum). Klik indikator sambal untuk mengulang.');
    } else if (item.kind === 'ladle') {
      if (S.bowl.broth) say('Kuah sudah dituang.');
      else { S.bowl.ladleBroth(); say('Kuah panas dituang dari panci.'); }
    } else if (item.kind === 'extra') {
      S.bowl.toggleExtra(item.id);
      say(`${item.label} ${S.bowl.extras.has(item.id) ? 'masuk' : 'diambil lagi dari'} mangkok.`);
    }
  },
  potSlot(i) { scoopFromPot(i); },
  potBody() { scoopAnyDone(); },
  chiliReset() {
    if (S.bowl.chili > 0) { S.bowl.resetChili(); say('Sambal diulang dari nol.'); }
  },
  serve,
  trash() {
    if (S.over) return;
    if (!S.bowl.empty) { S.bowl.reset(); say('Mangkok dibuang. Rakit ulang dari awal.'); }
  },
};

function restart() {
  S = freshState(Math.random);
  S.board.spawn(0, 0);
  S.board.spawn(0, 0);
  say('Shift baru! Layani tiket pertama di papan pesanan.');
}

function endShift(title) {
  S.over = true;
  S.overTitle = title;
}

function step(dt) {
  if (S.over) return;
  S.animT += dt;
  S.elapsed += dt;
  S.timeLeft -= dt;
  if (S.messageTimer > 0) {
    S.messageTimer -= dt;
    if (S.messageTimer <= 0) S.message = '';
  }
  if (S.passTimer > 0) {
    S.passTimer -= dt;
    if (S.passTimer <= 0) S.passBowl = null;
  }
  S.pot.tick(dt);
  const expired = S.board.tick(dt, heat());
  if (expired.length) {
    S.strikes += expired.length;
    say(`Tiket #${expired.map((t) => t.id).join(', #')} hangus — pembeli pergi! Strike ${S.strikes}/3.`, 5);
    if (S.strikes >= 3) { endShift('GEROBAK DITUTUP — 3 PEMBELI PERGI'); return; }
  }
  if (S.timeLeft <= 0) endShift('SHIFT SELESAI — MATAHARI TERBENAM');
}

// ---------- mode screenshot deterministik ----------

function buildShotScene(kind, seed) {
  const rng = mulberry32(seed);
  const st = freshState(rng);
  st.animT = 0;

  const mkTicket = (heatLevel, patienceFrac) => {
    const t = buildTicket(rng, heatLevel, st.board.nextId++);
    t.patience = Math.round(t.patienceMax * patienceFrac);
    return t;
  };
  const fillBowl = (ticket, meatballsIn) => {
    const b = new Bowl();
    b.noodle = ticket.noodle;
    b.broth = true;
    for (let i = 0; i < meatballsIn; i++) b.meatballs.push(ticket.meatballType);
    b.chili = Math.max(0, ticket.chili - 1);
    if (ticket.extras.length) b.extras.add(ticket.extras[0]);
    return b;
  };
  const finishedBowlFor = (ticket) => {
    const b = new Bowl();
    b.noodle = ticket.noodle;
    b.broth = true;
    for (let i = 0; i < ticket.meatballCount; i++) b.meatballs.push(ticket.meatballType);
    b.chili = ticket.chili;
    for (const e of ticket.extras) b.extras.add(e);
    return b;
  };
  const stockPot = (pattern) => {
    pattern.forEach(([type, cook]) => st.pot.slots.push({ type, cook }));
  };

  if (kind === 'cover') {
    const t1 = mkTicket(0.25, 0.85);
    const t2 = mkTicket(0.3, 0.62);
    st.board.tickets = [t1, t2];
    st.bowl = fillBowl(t1, 3);
    st.passBowl = { bowl: finishedBowlFor(t2), note: 'Siap diantar!' };
    stockPot([['sapi', 9], ['sapi', 7.5], ['urat', 4], ['sapi', 2], ['urat', 10]]);
    st.timeLeft = 183;
    st.coins = 12500;
    st.score = 340;
    st.served = 3;
    st.banner = true;
    st.extraQueue = 1;
    st.message = 'Klik tiket untuk memilih pesanan yang dilayani.';
  } else if (kind === 'rush') {
    const t1 = mkTicket(0.8, 0.22);
    const t2 = mkTicket(0.75, 0.48);
    const t3 = mkTicket(0.85, 0.66);
    const t4 = mkTicket(0.7, 0.8);
    t3.double = true;
    st.board.tickets = [t1, t2, t3, t4];
    st.board.selected = 0;
    st.bowl = fillBowl(t1, Math.max(2, t1.meatballCount - 1));
    st.passBowl = { bowl: finishedBowlFor(t2), note: 'Siap diantar!' };
    stockPot([['sapi', 11], ['urat', 8], ['sapi', 6.5], ['urat', 3], ['sapi', 13], ['urat', 5], ['sapi', 1.5], ['urat', 9]]);
    st.timeLeft = 64;
    st.coins = 48750;
    st.score = 1280;
    st.served = 11;
    st.strikes = 1;
    st.extraQueue = 2;
    st.message = 'Jam sibuk! Antrean memanjang, tiket dobel datang bersamaan.';
  } else { // serve
    const t1 = mkTicket(0.45, 0.9);
    const t2 = mkTicket(0.5, 0.55);
    st.board.tickets = [t1, t2];
    st.bowl = fillBowl(t1, 2);
    st.passBowl = { bowl: finishedBowlFor(t1), note: `+${fmtTip(ticketPrice(t1) + 2200)} untuk tiket #${t1.id}!` };
    stockPot([['urat', 8.5], ['sapi', 5], ['urat', 2.5], ['sapi', 10]]);
    st.timeLeft = 121;
    st.coins = 31200;
    st.score = 860;
    st.served = 7;
    st.message = 'Mangkok jadi sesuai tiket — pembeli membayar plus tip!';
  }
  return st;
}

// ---------- mulai ----------

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot === 'cover' || shot === 'rush' || shot === 'serve') {
  const seed = Number(params.get('seed') || 7) || 7;
  S = buildShotScene(shot, seed);
  drawScene(ctx, S); // satu gambar beku, tanpa loop animasi
} else {
  attachInput(canvas, actions);
  restart();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    drawScene(ctx, S);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
