// main.ts — titik masuk bundel Bakso Blusukan (akun 10).
// Tugasnya sederhana: salin folder game/ dan screenshots/ dari repo ini
// ke direktori output, lalu tulis dossier.json hasil buildDossier atas
// isi output itu, persis seperti yang akan dihitung ulang oleh penilai.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR
  ? join(repoDir, process.env.MAKEFUN_OUTPUT_DIR)
  : join(repoDir, 'out');

// Bersihkan output lama supaya tidak ada sisa berkas dari bundel sebelumnya.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// Salin dua folder isi entri apa adanya.
cpSync(join(repoDir, 'game'), join(outputDir, 'game'), { recursive: true });
cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

// Dossier dihitung dari output (bukan dari repo) agar berkas yang
// diserahkan dan berkas yang dinilai selalu merupakan salinan yang sama.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`dossier tertulis di ${join(outputDir, 'dossier.json')}`);
