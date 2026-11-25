// recipes.js — data menu Gerobak Bakso Blusukan.
// Semua tiket dibangun dari potongan-potongan ini: jenis bakso, jumlah,
// jenis mie, level cabai (sendok sambal), dan pelengkap. Harga dihitung
// dari potongan yang sama supaya tiket mahal selalu tiket yang ramai.

export const MEATBALL_TYPES = [
  { id: 'sapi', label: 'Bakso Sapi', short: 'SAPI', price: 1500, color: '#a4713e' },
  { id: 'urat', label: 'Bakso Urat', short: 'URAT', price: 1800, color: '#8a5a30' },
];

export const NOODLES = [
  { id: 'kuning', label: 'Mie Kuning', short: 'KUNING', price: 3000, color: '#e8b93c' },
  { id: 'bihun', label: 'Bihun', short: 'BIHUN', price: 3000, color: '#f2ead8' },
  { id: 'campur', label: 'Mie Campur', short: 'CAMPUR', price: 3500, color: '#d99a3c' },
];

export const EXTRAS = [
  { id: 'tahu', label: 'Tahu', price: 1000, color: '#f5eeda' },
  { id: 'pangsit', label: 'Pangsit', price: 1500, color: '#e0aa54' },
  { id: 'bawang', label: 'Bawang Goreng', price: 500, color: '#c98f2e' },
  { id: 'seledri', label: 'Seledri', price: 500, color: '#4d8f3f' },
];

export const MAX_CHILI = 3;
export const CHILI_PRICE = 500;
export const BROTH_PRICE = 2000;

export function meatballType(id) {
  return MEATBALL_TYPES.find((m) => m.id === id);
}
export function noodleById(id) {
  return NOODLES.find((n) => n.id === id);
}
export function extraById(id) {
  return EXTRAS.find((e) => e.id === id);
}

// Harga satu tiket: kuah selalu termasuk, sisanya per potongan.
export function ticketPrice(ticket) {
  const mb = meatballType(ticket.meatballType);
  let total = BROTH_PRICE + mb.price * ticket.meatballCount;
  total += noodleById(ticket.noodle).price;
  total += ticket.chili * CHILI_PRICE;
  for (const id of ticket.extras) total += extraById(id).price;
  return total;
}

// Bangun satu tiket pesanan. rng: fungsi acak 0..1 (bisa disemai untuk
// adegan screenshot yang deterministik). heat 0..1 menaikkan keramaian
// tiket: bakso lebih banyak, pelengkap lebih sering, cabai lebih tinggi.
export function buildTicket(rng, heat, id) {
  const type = MEATBALL_TYPES[Math.floor(rng() * MEATBALL_TYPES.length)];
  const count = 3 + Math.floor(rng() * 3) + (heat > 0.55 && rng() < 0.5 ? 1 : 0);
  const noodle = NOODLES[Math.floor(rng() * NOODLES.length)];
  const chili = Math.min(MAX_CHILI, Math.floor(rng() * (2 + heat * 2)));
  const extras = [];
  for (const ex of EXTRAS) {
    const chance = 0.22 + heat * 0.3;
    if (rng() < chance) extras.push(ex.id);
  }
  const patienceMax = Math.round(78 - heat * 26 + rng() * 8);
  const ticket = {
    id,
    meatballType: type.id,
    meatballCount: count,
    noodle: noodle.id,
    chili,
    extras,
    patience: patienceMax,
    patienceMax,
    double: false,
  };
  ticket.price = ticketPrice(ticket);
  return ticket;
}

// Ringkasan tiket satu baris untuk papan pesanan dan pesan galat saji.
export function ticketSummary(ticket) {
  const mb = meatballType(ticket.meatballType);
  const nd = noodleById(ticket.noodle);
  const parts = [`${mb.label} x${ticket.meatballCount}`, nd.label];
  parts.push(ticket.chili > 0 ? `Sambal ${ticket.chili} sendok` : 'Tanpa sambal');
  for (const id of ticket.extras) parts.push(extraById(id).label);
  return parts.join(' · ');
}
