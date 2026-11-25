// orders.js — papan pesanan: antrean tiket, bar kesabaran, dan tekanan
// antrean yang naik sepanjang shift. Tiket yang kesabarannya habis
// hangus dan memberi satu strike.

import { buildTicket } from './recipes.js';

export class OrderBoard {
  constructor(rng) {
    this.rng = rng;
    this.tickets = [];
    this.nextId = 1;
    this.spawnTimer = 0;
    this.selected = 0; // indeks tiket yang sedang dilayani
  }

  get size() {
    return this.tickets.length;
  }

  selectedTicket() {
    if (this.tickets.length === 0) return null;
    const i = Math.min(this.selected, this.tickets.length - 1);
    return this.tickets[i];
  }

  select(index) {
    if (index >= 0 && index < this.tickets.length) this.selected = index;
  }

  // Tambah satu tiket; kadang (peluang doubleChance) datang dua tiket
  // sekaligus dari rombongan pembeli yang sama.
  spawn(heat, doubleChance) {
    const t = buildTicket(this.rng, heat, this.nextId++);
    this.tickets.push(t);
    if (this.rng() < doubleChance) {
      const twin = buildTicket(this.rng, heat, this.nextId++);
      twin.double = true;
      this.tickets.push(twin);
    }
  }

  remove(ticket) {
    const i = this.tickets.indexOf(ticket);
    if (i >= 0) this.tickets.splice(i, 1);
    if (this.selected >= this.tickets.length) {
      this.selected = Math.max(0, this.tickets.length - 1);
    }
  }

  // Jalankan waktu: kesabaran menipis (lebih cepat saat antrean panjang),
  // tiket baru datang berkala. Mengembalikan daftar tiket yang hangus.
  tick(dt, heat) {
    const expired = [];
    const crowdFactor = 1 + Math.max(0, this.tickets.length - 3) * 0.12;
    for (const t of this.tickets) {
      t.patience -= dt * crowdFactor;
      if (t.patience <= 0) expired.push(t);
    }
    for (const t of expired) this.remove(t);

    this.spawnTimer -= dt;
    const interval = 13 - heat * 5.5;
    if (this.spawnTimer <= 0 && this.tickets.length < 6) {
      this.spawn(heat, 0.08 + heat * 0.22);
      this.spawnTimer = interval * (0.8 + this.rng() * 0.45);
    }
    return expired;
  }

  patienceRatio(ticket) {
    return Math.max(0, ticket.patience / ticket.patienceMax);
  }
}
