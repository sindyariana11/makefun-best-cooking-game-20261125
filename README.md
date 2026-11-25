# Bakso Blusukan — Gerobak Bakso Sapi

Game masak gerobak bakso keliling di sore hari. Kamu menjaga gerobak
teal "Bakso Blusukan": pembeli mengantre dengan tiket pesanan, dan kamu
harus merebus bakso di panci besar, merakit mangkok persis seperti
tiket, lalu menyajikannya sebelum kesabaran pembeli habis.

## Cara main

1. **Baca tiket** di papan pesanan sebelah kanan: jenis bakso
   (sapi/urat) dan jumlahnya, jenis mie (kuning/bihun/campur), level
   cabai (0–3 sendok sambal), dan pelengkap (tahu, pangsit, bawang
   goreng, seledri). Klik tiket untuk memilih pesanan yang dilayani.
2. **Rebus bakso**: klik Bakso Sapi / Bakso Urat di rak untuk memasukkan
   bakso mentah ke panci. Busur timer di tiap bakso menunjukkan
   kematangan — hijau berarti matang; dibiarkan terlalu lama, bakso
   gosong dan harus dibuang.
3. **Rakit mangkok**: klik jenis mie, sendok bakso matang dari panci,
   tuang kuah dengan Sendok Kuah, tambahkan sambal per sendok (klik
   indikator sambal di atas mangkok untuk mengulang dari nol), lalu
   klik pelengkap sesuai tiket.
4. **Sajikan** dengan tombol SAJIKAN atau Enter. Mangkok yang pas
   dibayar penuh plus tip sesuai sisa kesabaran pembeli; mangkok yang
   meleset ditolak dengan petunjuk bagian yang salah. Backspace membuang
   mangkok untuk merakit ulang.
5. Tiket yang kesabarannya habis membuat pembeli pergi dan memberi satu
   strike — tiga strike dan gerobak ditutup. Menjelang akhir shift
   antrean makin panjang, tiket makin ramai, dan rombongan pembeli bisa
   datang dengan dua tiket sekaligus.

Kontrol keyboard: angka 1–9 dan 0 memilih bahan di rak, Tab berpindah
tiket, Enter/Space menyajikan, Backspace membuang mangkok, R memulai
shift baru setelah gerobak tutup.

## Struktur

- `game/index.html` — halaman + canvas 1280×800.
- `game/src/recipes.js` — data menu, harga, dan pembangun tiket.
- `game/src/orders.js` — papan pesanan, kesabaran, dan tekanan antrean.
- `game/src/stations.js` — panci rebusan (timer kematangan) + mangkok rakitan.
- `game/src/render.js` — seluruh gambar canvas: gerobak, panci beruap,
  rak bahan, mangkok bermotif geometris, papan pesanan.
- `game/src/input.js` — mouse + keyboard.
- `game/src/main.js` — loop game, jam shift, saji, skor, dan mode
  screenshot deterministik (`?shot=cover|rush|serve&seed=N`).
- `main.ts` — menyalin `game/` + `screenshots/` ke output dan menulis
  `dossier.json` lewat `buildDossier` dari `vendor/makefun-game.ts`.

## Bounty

[![make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
![rank](https://make.fun/badge/best-cooking-game-20261125-0137/sindyariana11/makefun-best-cooking-game-20261125/rank.svg)
![reward](https://make.fun/badge/best-cooking-game-20261125-0137/sindyariana11/makefun-best-cooking-game-20261125/reward.svg)

Bounty: https://make.fun/bounty/best-cooking-game-20261125-0137
