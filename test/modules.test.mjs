// The module layer: the core API, every card registered once, and the bundle exporting the same API with its fonts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { installDom } from './dom.mjs';

const dom = installDom();
const lib = await import('../src/index.js');
const TAGS = ['agenda', 'help', 'info', 'timers', 'weather', 'wifi'].map((n) => `lamplight-${n}-card`);
const API = ['BASE_CSS', 'LamplightCard', 'PHOTO_LOOK', 'TOKENS', 'VERSION', 'cap', 'dayStart', 'define', 'esc', 'failedHtml', 'fontBase', 'loadState', 'preblur', 'registerFonts'];

test('the core API is exported', () => {
  for (const name of API) assert.ok(name in lib, name);
  assert.equal(lib.esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  assert.equal(lib.cap('rain'), 'Rain');
  assert.match(lib.BASE_CSS, /--warm:/);
  assert.equal(lib.dayStart(new Date(2026, 9, 9, 18, 30)).getTime(), new Date(2026, 9, 9).getTime());
});

test('the version matches package.json', () => {
  assert.equal(lib.VERSION, JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).version);
});

test('importing registers each card once, and lists it once', () => {
  for (const tag of TAGS) assert.equal(dom.defined.get(tag)?.prototype instanceof lib.LamplightCard, true, tag);
  assert.deepEqual(window.customCards.map((c) => c.type).sort(), TAGS);
  assert.equal(lib.define(TAGS[0], class extends lib.LamplightCard {}, 'Again'), dom.defined.get(TAGS[0]));  // no throw
  assert.equal(window.customCards.length, TAGS.length);
});

test('a card of your own builds on LamplightCard', () => {
  class Mine extends lib.LamplightCard {
    defaults() { return { title: 'Mine' }; }
  }
  assert.equal(lib.define('my-test-card', Mine, 'Mine', 'A test card'), Mine);
  const card = new Mine();
  card.setConfig({ nav: { back: '/rooms', back_label: 'Rooms' } });
  assert.deepEqual(card.config, { title: 'Mine', nav: { back: '/rooms', back_label: 'Rooms' } });
  assert.equal(card.backLabel(), 'Rooms');
});

test('fonts are registered once, next to the module unless the page says where', () => {
  const style = dom.head.filter((el) => el.id === 'lamplight-fonts');
  assert.equal(style.length, 1);
  assert.ok(style[0].textContent.includes(new URL('../src/ahn-latin.woff2', import.meta.url).href));
  lib.registerFonts('/elsewhere/');
  assert.equal(dom.head.filter((el) => el.id === 'lamplight-fonts').length, 1);
  globalThis.lamplightFontBase = '/local/fonts/';
  assert.equal(lib.fontBase(), '/local/fonts/');
  delete globalThis.lamplightFontBase;
});

test('each card module imports what it uses (a card loaded on its own renders without another card)', async () => {
  for (const name of ['agenda', 'help', 'info', 'timers', 'weather', 'wifi']) {
    const src = (await import('node:fs')).readFileSync(new URL(`../src/cards/${name}.js`, import.meta.url), 'utf8');
    const own = new Set([...src.matchAll(/^(?:export )?(?:const|let|class|function) (\w+)/gm)].map((m) => m[1]));
    const imported = new Set((src.match(/^import \{([^}]*)\}/m)?.[1] || '').split(',').map((x) => x.trim()));
    for (const other of ['agenda', 'help', 'info', 'timers', 'weather', 'wifi']) {
      if (other === name) continue;
      const theirs = readFileSync(new URL(`../src/cards/${other}.js`, import.meta.url), 'utf8');
      for (const m of theirs.matchAll(/^(?:export )?(?:const|let|class|function) (\w+)/gm)) {
        if (own.has(m[1]) || imported.has(m[1])) continue;
        assert.ok(!new RegExp(`\\b${m[1]}\\b`).test(src), `${name}.js uses ${m[1]} from ${other}.js`);
      }
    }
  }
});
