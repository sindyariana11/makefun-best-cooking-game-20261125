// stations.js — stasiun masak: panci rebusan besar dan mangkok rakitan.
// Bakso mentah masuk panci, matang dengan timer kematangan, lalu gosong
// bila dibiarkan. Mangkok dirakit potongan demi potongan lalu dicocokkan
// dengan tiket saat disajikan.

export const POT_CAPACITY = 8;
export const COOK_TIME = 6; // detik sampai matang
export const BURN_TIME = 15; // detik sampai gosong sejak masuk panci

export class Pot {
  constructor() {
    this.slots = []; // { type, cook } — cook = detik di dalam panci
  }

  get full() {
    return this.slots.length >= POT_CAPACITY;
  }

  addMeatball(type) {
    if (this.full) return false;
    this.slots.push({ type, cook: 0 });
    return true;
  }

  stateOf(slot) {
    if (slot.cook < COOK_TIME) return 'raw';
    if (slot.cook < BURN_TIME) return 'done';
    return 'burnt';
  }

  tick(dt) {
    for (const s of this.slots) s.cook += dt;
  }

  // Ambil satu bakso dari panci berdasarkan indeks slot. Hanya bakso
  // matang yang boleh naik ke mangkok; yang gosong dibuang ke tempat
  // sampah (dikembalikan sebagai 'burnt' supaya pemain dapat pesan).
  scoop(index) {
    const slot = this.slots[index];
    if (!slot) return null;
    const st = this.stateOf(slot);
    this.slots.splice(index, 1);
    if (st === 'done') return { ok: true, type: slot.type };
    if (st === 'burnt') return { ok: false, reason: 'burnt' };
    // Belum matang: kembalikan ke panci, jangan hilang.
    this.slots.splice(index, 0, slot);
    return { ok: false, reason: 'raw' };
  }

  doneCount() {
    return this.slots.filter((s) => this.stateOf(s) === 'done').length;
  }
}

export class Bowl {
  constructor() {
    this.reset();
  }

  reset() {
    this.noodle = null; // id mie atau null
    this.meatballs = []; // daftar id jenis bakso yang sudah matang
    this.broth = false;
    this.chili = 0; // sendok sambal 0..3
    this.extras = new Set();
  }

  get empty() {
    return (
      this.noodle === null &&
      this.meatballs.length === 0 &&
      !this.broth &&
      this.chili === 0 &&
      this.extras.size === 0
    );
  }

  setNoodle(id) {
    this.noodle = id;
  }

  addMeatball(type) {
    this.meatballs.push(type);
  }

  ladleBroth() {
    this.broth = true;
  }

  addChili(max) {
    if (this.chili < max) this.chili += 1;
    return this.chili;
  }

  resetChili() {
    this.chili = 0;
  }

  toggleExtra(id) {
    if (this.extras.has(id)) this.extras.delete(id);
    else this.extras.add(id);
  }

  // Cocokkan mangkok dengan tiket. Mengembalikan null bila pas, atau
  // pesan penyimpangan pertama yang ditemukan (dipakai pesan galat saji).
  checkAgainst(ticket) {
    if (!this.broth) return 'Kuah belum dituang — klik sendok kuah di panci.';
    if (this.noodle !== ticket.noodle) return 'Jenis mie tidak cocok dengan tiket.';
    if (this.meatballs.length !== ticket.meatballCount) {
      return `Jumlah bakso kurang/lebih: mangkok ${this.meatballs.length}, tiket ${ticket.meatballCount}.`;
    }
    if (this.meatballs.some((t) => t !== ticket.meatballType)) {
      return 'Ada bakso jenis lain tercampur di mangkok.';
    }
    if (this.chili !== ticket.chili) {
      return `Sambal tidak pas: mangkok ${this.chili} sendok, tiket ${ticket.chili} sendok.`;
    }
    for (const id of ticket.extras) {
      if (!this.extras.has(id)) return `Pelengkap kurang: ${id} belum masuk mangkok.`;
    }
    for (const id of this.extras) {
      if (!ticket.extras.includes(id)) return `Pelengkap lebih: ${id} tidak ada di tiket.`;
    }
    return null;
  }
}
