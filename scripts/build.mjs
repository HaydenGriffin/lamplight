// Bundles src/index.js (the core API + every card, ES modules) into dist/lamplight.js, itself an ES module with the same
// exports, so Home Assistant loads it as a module resource and other code can import from it. The fonts stay next to it
// in dist/ (core.js finds them from import.meta.url). esbuild is a pinned devDependency: `npm ci` once, then
// `node scripts/build.mjs`; the output is deterministic, and CI checks it's committed up to date.
import { readFileSync } from 'node:fs';
import * as esbuild from 'esbuild';

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const banner = `/* Lamplight ${version} for Home Assistant. https://github.com/HaydenGriffin/lamplight (MIT). Built from src/ by scripts/build.mjs. */`;

const out = await esbuild.build({
  entryPoints: [new URL('src/index.js', root).pathname],
  outfile: new URL('dist/lamplight.js', root).pathname,
  bundle: true,
  format: 'esm',
  target: 'es2022',
  charset: 'utf8',
  legalComments: 'none',
  banner: { js: banner },
  metafile: true,
  logLevel: 'warning',
});
const files = Object.keys(out.metafile.inputs).length;
console.log(`dist/lamplight.js: ${files} modules`);
