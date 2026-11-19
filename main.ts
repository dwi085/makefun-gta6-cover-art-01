// Vice Cover Studio — entry program for gta6-cover-art-01 (Node 22, stdlib only).
// The app is plain static files under app/ (index.html plus ES modules, no build step,
// no network request at runtime). This program hands the entry in: it copies app/ and
// screenshots/ from beside this file into the output directory and writes
// dossier.json there with the vendored make.fun library, which is the summary the
// judge reads. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps below mirror the scorer's own limits, so a dossier written here is one the
// gate accepts: at most 4 screenshots, each at most 256 KiB; app/ at most 993 files and
// 48 MiB in all, no path over 1000 bytes; the dossier text capped at 160 KiB. The
// program writes the whole of /output under the platform's own 1000-entry, 64 MiB cap,
// which app/, screenshots/ and dossier.json share, so the entry leaves room to spare.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
