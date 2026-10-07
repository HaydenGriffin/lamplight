// Bundles src/ into dist/lamplight.js: the core, then every card. No dependencies; run with `node scripts/build.mjs`.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const cards = readdirSync(new URL('src/cards/', root)).filter((f) => f.endsWith('.js')).sort();
const parts = ['src/core.js', ...cards.map((f) => `src/cards/${f}`)].map((p) => `// ---- ${p}\n${readFileSync(new URL(p, root), 'utf8')}`);
const banner = '/* Lamplight cards for Home Assistant. https://github.com/HaydenGriffin/lamplight (MIT). Built from src/ by scripts/build.mjs. */\n';
writeFileSync(new URL('dist/lamplight.js', root), banner + parts.join('\n'));
console.log(`dist/lamplight.js: core + ${cards.length} cards`);
