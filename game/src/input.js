// input.js — mouse + keyboard. Klik diterjemahkan ke aksi game lewat
// peta wilayah dari render.js; keyboard: angka 1-9 memilih bahan rak,
// Enter/Space sajikan, Backspace buang mangkok, R mulai ulang.

import { LAYOUT, SHELF_ITEMS, shelfRect, ticketRect, potSlotPos, chiliResetRect } from './render.js';

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// actions: kumpulan callback dari main.js
// { shelf(item), potSlot(index), potBody(), serve(), trash(), selectTicket(i), chiliReset(), anyClick() }
export function attachInput(canvas, actions) {
  function toGame(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) * (canvas.width / rect.width),
      y: (evt.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  canvas.addEventListener('click', (evt) => {
    const { x, y } = toGame(evt);
    actions.anyClick();

    // Tiket di papan pesanan.
    for (let i = 0; i < 4; i++) {
      if (inRect(x, y, ticketRect(i))) { actions.selectTicket(i); return; }
    }
    // Rak bahan.
    for (let i = 0; i < SHELF_ITEMS.length; i++) {
      if (inRect(x, y, shelfRect(i))) { actions.shelf(SHELF_ITEMS[i]); return; }
    }
    // Bakso di panci: klik lingkaran bakso tertentu.
    for (let i = 0; i < 8; i++) {
      const p = potSlotPos(i);
      const dx = x - p.x, dy = y - p.y;
      if (dx * dx + dy * dy <= 24 * 24) { actions.potSlot(i); return; }
    }
    // Badan panci: klik di mana saja pada panci = sendok bakso matang pertama.
    const pot = LAYOUT.pot;
    if (x >= pot.cx - pot.rimRx - 16 && x <= pot.cx + pot.rimRx + 16 && y >= pot.rimY - 20 && y <= pot.bottom + 14) {
      actions.potBody();
      return;
    }
    // Indikator cabai di bawah mangkok: ulang dari nol.
    if (inRect(x, y, chiliResetRect())) { actions.chiliReset(); return; }
    // Tombol saji / buang.
    if (inRect(x, y, LAYOUT.serveBtn)) { actions.serve(); return; }
    if (inRect(x, y, LAYOUT.trashBtn)) { actions.trash(); return; }
  });

  window.addEventListener('keydown', (evt) => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      actions.anyClick();
      actions.serve();
    } else if (evt.key === 'Backspace') {
      evt.preventDefault();
      actions.trash();
    } else if (evt.key === 'r' || evt.key === 'R') {
      actions.restart();
    } else if (/^[1-9]$/.test(evt.key)) {
      const item = SHELF_ITEMS[Number(evt.key) - 1];
      if (item) actions.shelf(item);
    } else if (evt.key === '0') {
      const item = SHELF_ITEMS[9];
      if (item) actions.shelf(item);
    } else if (evt.key === 'Tab') {
      evt.preventDefault();
      actions.cycleTicket();
    }
  });
}
