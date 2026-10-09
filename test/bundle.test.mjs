// dist/lamplight.js (what HACS installs) is an ES module with the same API, and finds its fonts beside it in dist/.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { installDom } from './dom.mjs';

const dom = installDom();
const dist = await import('../dist/lamplight.js');
const src = await import('../src/index.js');  // a second copy of the code: must not throw or list cards twice

test('the bundle exports what src/index.js exports', () => {
  assert.deepEqual(Object.keys(dist).sort(), Object.keys(src).sort());
});

test('the bundle registers every card, and a second copy changes nothing', () => {
  assert.equal(window.customCards.length, 6);
  assert.equal(new Set(window.customCards.map((c) => c.type)).size, 6);
});

test('the font paths are kept: the files are in dist/, beside the bundle', () => {
  const css = dom.head.find((el) => el.id === 'lamplight-fonts').textContent;
  for (const font of ['ahn-latin.woff2', 'ahn-latin-ext.woff2', 'lexend-latin.woff2']) {
    const url = new URL(`../dist/${font}`, import.meta.url);
    assert.ok(css.includes(url.href), font);
    assert.ok(existsSync(url), font);
  }
});
