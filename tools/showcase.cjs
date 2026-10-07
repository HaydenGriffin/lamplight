// Renders the README images. Serve the repo root first (python3 -m http.server 8765), then:
//   node tools/showcase.cjs            (needs: npm install playwright)
// It screenshots each demo card at tablet size and composes docs/images/{hero,cards,palette}.png.
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = fs.mkdtempSync(path.join(os.tmpdir(), 'lamplight-'));
const OUT = path.join(ROOT, 'docs/images');
const CARDS = ['weather', 'agenda', 'timers', 'help', 'info', 'wifi'];
const shot = (n) => 'file://' + path.join(SHOTS, `${n}.png`);
const font = (f) => 'file://' + path.join(ROOT, 'dist', f);

const base = `<style>
@font-face{font-family:LT;src:url(${font('ahn-latin.woff2')});font-weight:200 800}
@font-face{font-family:LT;src:url(${font('lexend-latin.woff2')});font-weight:200 800;unicode-range:U+0030-0039}
@font-face{font-family:Lexend;src:url(${font('lexend-latin.woff2')});font-weight:200 800}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0b0c0f;color:#f4f2ee;font-family:LT;-webkit-font-smoothing:antialiased}
.canvas{position:relative;overflow:hidden;background:radial-gradient(900px 600px at 15% 20%,rgba(196,122,44,.28),transparent 70%),radial-gradient(800px 600px at 90% 90%,rgba(47,85,119,.3),transparent 70%),#0b0c0f}
.tablet{border-radius:22px;padding:12px;background:linear-gradient(160deg,#2b2c30,#141518);box-shadow:0 0 0 1px #3a3c42 inset,0 40px 80px -30px #000}
.tablet img{display:block;width:100%;border-radius:8px}
.eyebrow{font-size:16px;font-weight:600;color:#ffc76b}
p.lead{color:#b9b4ac;font-size:22px;line-height:1.5}
</style>`;

const hero = `${base}<div class="canvas" style="width:1600px;height:900px">
  <div style="position:absolute;left:90px;top:110px;width:560px">
    <div class="eyebrow">A design system for Home Assistant wall tablets</div>
    <h1 style="font-size:84px;font-weight:700;letter-spacing:-.02em;margin:14px 0 22px">Lamplight</h1>
    <p class="lead">Things that are on glow like a lamp. Big type, few and big targets, one screen with no scrolling, read
      from across a room and touched without precision.</p>
    <p class="lead" style="margin-top:22px;color:#f4f2ee">The rules, the tokens, and six cards built on them.</p>
  </div>
  <div class="tablet" style="position:absolute;left:720px;top:96px;width:800px;transform:rotate(-1.5deg)"><img src="${shot('agenda')}"></div>
  <div class="tablet" style="position:absolute;left:640px;top:520px;width:430px;transform:rotate(2deg)"><img src="${shot('timers')}"></div>
  <div class="tablet" style="position:absolute;left:1110px;top:540px;width:430px;transform:rotate(-2deg)"><img src="${shot('weather')}"></div>
</div>`;

const grid = `${base}<div class="canvas" style="width:1600px;height:1460px;padding:70px 80px">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:56px 48px">
  ${CARDS.map((n) => `<div><div class="tablet"><img src="${shot(n)}"></div>
    <p style="margin-top:18px;font-size:24px;font-weight:600;text-transform:capitalize">${n === 'wifi' ? 'Wi-Fi' : n}</p></div>`).join('')}
  </div></div>`;

const sw = (name, hex, ink, note) => `<div style="display:flex;align-items:center;gap:18px">
  <span style="width:84px;height:84px;border-radius:50%;background:${hex};flex:none;${ink ? `color:${ink};` : ''}box-shadow:${name.startsWith('Lamp') ? '0 0 26px rgba(255,186,84,.5)' : '0 0 0 1px rgba(255,255,255,.1) inset'}"></span>
  <span><b style="font-size:24px">${name}</b><br><span style="color:#b9b4ac;font-size:19px">${note}</span></span></div>`;
const palette = `${base}<div class="canvas" style="width:1600px;height:780px;padding:80px 90px">
  <div class="eyebrow">The colour rules</div>
  <h1 style="font-size:52px;font-weight:700;margin:12px 0 44px">Warm means on. Sky means chosen.</h1>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:40px 36px">
    ${sw('Lamp warm', '#ffc76b', '', 'On, lit or running. Nothing else.')}
    ${sw('Sky', '#80d8ff', '', 'A mode that is on, or what you selected')}
    ${sw('Ember orange', '#ff9d5c', '', 'Needs a look: always an outlined disc')}
    ${sw('Mint', '#7ee2a8', '', 'Ready, done, good air')}
    ${sw('Coral', '#ff8a80', '', 'Errors, offline, destructive')}
    ${sw('Smoked glass', 'rgba(22,24,29,.9)', '', 'Panels over the blurred room photo')}
  </div>
  <div style="display:flex;gap:60px;margin-top:64px;align-items:flex-end">
    <div><div style="font-family:Lexend;font-size:120px;font-weight:600;line-height:.85;letter-spacing:-.04em">20:41</div><p style="color:#b9b4ac;margin-top:14px;font-size:19px">Lexend for every digit</p></div>
    <div><div style="font-size:30px;font-weight:600">Atkinson Hyperlegible Next</div><div style="font-size:19px;color:#b9b4ac;margin-top:6px">for every word. 16px is the floor; 56px is the smallest target.</div></div>
  </div></div>`;

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 788, height: 492 }, deviceScaleFactor: 2 });
  for (const card of CARDS) {
    await page.goto(`http://127.0.0.1:8765/demo/index.html?card=${card}`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SHOTS, `${card}.png`) });
  }
  const big = await browser.newPage({ viewport: { width: 1600, height: 1500 }, deviceScaleFactor: 2 });
  for (const [name, html] of Object.entries({ 'hero.png': hero, 'cards.png': grid, 'palette.png': palette })) {
    const file = path.join(SHOTS, name + '.html');
    fs.writeFileSync(file, html);
    await big.goto('file://' + file);
    await big.evaluate(() => document.fonts.ready);
    await big.waitForTimeout(300);
    await (await big.$('.canvas')).screenshot({ path: path.join(OUT, name) });
    console.log('wrote', name);
  }
  await browser.close();
})();
