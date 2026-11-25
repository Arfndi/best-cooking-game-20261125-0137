// The Golden Ladle — main.ts
// One job: hand the entry in. Copy game/ and screenshots/ from this
// repository into the output directory, then write dossier.json with the
// kit's buildDossier, exactly as the scorer recomputes it.
//
// The grader runs `node main.ts` with the repository as the working
// directory. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
//
// Run: node main.ts
//   MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
import { buildDossier } from './vendor/makefun-game.ts';
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648
};

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

function fail(message: string): never {
  console.error('main.ts: ' + message);
  process.exit(1);
}

function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// Copy a tree of plain files only. Symlinks are refused: the gate
// requires game/ to hold plain files and directories.
function copyTree(sourceDir: string, targetDir: string, copied: string[]): void {
  if (!existsSync(sourceDir)) fail('missing directory: ' + sourceDir);
  mkdirSync(targetDir, { recursive: true });
  for (const name of readdirSync(sourceDir).sort()) {
    const source = join(sourceDir, name);
    const target = join(targetDir, name);
    const info = lstatSync(source);
    if (info.isSymbolicLink()) fail('symlink refused: ' + source);
    if (info.isDirectory()) {
      copyTree(source, target, copied);
    } else if (info.isFile()) {
      copyFileSync(source, target);
      copied.push(target);
    } else {
      fail('not a plain file or directory: ' + source);
    }
  }
}

function countEntries(dir: string): number {
  let count = 1;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    count += lstatSync(path).isDirectory() ? countEntries(path) : 1;
  }
  return count;
}

// ---- hand the entry in ----
if (outputDir === '/' || outputDir === repoRoot) {
  fail('refusing unsafe output directory: ' + outputDir);
}
if (existsSync(outputDir)) rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const copied: string[] = [];
copyTree(join(repoRoot, 'game'), join(outputDir, 'game'), copied);
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), copied);

const dossier = buildDossier(outputDir, GATE_CAPS);
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(dossierPath, dossier);

// The scorer rebuilds the dossier from the same files and compares bytes,
// so check our own work the same way before reporting success.
const rebuilt = buildDossier(outputDir, GATE_CAPS);
if (Buffer.compare(Buffer.from(dossier), Buffer.from(rebuilt)) !== 0) {
  fail('dossier.json does not match a fresh buildDossier run');
}

const dossierBytes = Buffer.from(dossier);
console.log('game files copied: ' + copied.filter((p) => p.includes('/game/')).length);
console.log('screenshots copied: ' + copied.filter((p) => p.includes('/screenshots/')).length);
console.log('output entries: ' + countEntries(outputDir) + ' (cap 1000)');
console.log('dossier.json: ' + dossierBytes.length + ' bytes, sha256 ' + sha256Hex(dossierBytes));
console.log('entry handed in to ' + outputDir);
