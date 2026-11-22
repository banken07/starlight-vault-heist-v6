// main.ts — one job: hand the game in.
// Copies game/ and screenshots/ from this repository into the output
// directory (MAKEFUN_OUTPUT_DIR, or /output on the grader) and writes
// /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Node standard library only. It writes nothing into the repository
// itself: on the grader the repo is mounted read-only, so every write
// goes to the output directory, never to a path at or above the repo.
import { cpSync, mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

mkdirSync(outDir, { recursive: true });
// A hand-in with no screenshots is not a hand-in: fail loudly here,
// while the mistake is still cheap, instead of shipping an empty set.
const shotDir = join(repoRoot, 'screenshots');
if (!existsSync(shotDir) || readdirSync(shotDir).filter((f) => !f.startsWith('.')).length < 3) {
  throw new Error('Starlight Vault: screenshots/ needs at least 3 renders before hand-in');
}
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
const dossier = buildDossier(outDir, caps);
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Starlight Vault handed in: ${dossier.length} byte dossier in ${outDir}`);
