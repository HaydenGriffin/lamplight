/* Lamplight core: the tokens, fonts, header, navigation and toast every card shares. See DESIGN.md, and README.md
 * ("Building on Lamplight") for this module's API.
 * The cards are built for wall tablets (around 788×492 CSS px, landscape) and fill the screen: one card per view,
 * in a panel or a View Assist dashboard. */
export const VERSION = '1.1.0';

/* Where the font files are: next to the file this code runs from (dist/ for the HACS bundle), unless the page sets
   window.lamplightFontBase (a URL ending in "/") before loading it, e.g. a bundle that keeps its fonts elsewhere. */
export const fontBase = () => globalThis.lamplightFontBase || new URL('.', import.meta.url).href;

/* 'Lamplight Text' is Atkinson Hyperlegible Next for letters with Lexend for the ten digits: Atkinson's slashed zero
   reads as "Ø" from across a room, Lexend's plain one doesn't. Fonts must be registered on the document, not in a
   shadow root, for shadow DOM to use them. */
export const registerFonts = (base = fontBase()) => {
  if (document.getElementById('lamplight-fonts')) return;
  const style = document.createElement('style');
  style.id = 'lamplight-fonts';
  style.textContent = `
    @font-face{font-family:'Lamplight Text';font-weight:200 800;font-display:swap;src:url(${base}ahn-latin.woff2) format('woff2')}
    @font-face{font-family:'Lamplight Text';font-weight:200 800;font-display:swap;src:url(${base}ahn-latin-ext.woff2) format('woff2');unicode-range:U+0100-024F,U+1E00-1EFF}
    @font-face{font-family:'Lamplight Text';font-weight:200 800;font-display:swap;src:url(${base}lexend-latin.woff2) format('woff2');unicode-range:U+0030-0039}
    @font-face{font-family:Lexend;font-weight:200 800;font-display:swap;src:url(${base}lexend-latin.woff2) format('woff2')}`;
  document.head.appendChild(style);
};
registerFonts();

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* Local midnight of a date (for "today", "tomorrow" and day labels). */
export const dayStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* A card's load state from what it knows: 'loading', 'failed' (an error and nothing to show), 'empty' or 'ready'.
   Something to show beats an error, so a card keeps its last good data when a refresh fails (DESIGN.md, Load states). */
export const loadState = ({ loading = false, error = null, count = 0 } = {}) => (count > 0 ? 'ready' : error ? 'failed' : loading ? 'loading' : 'empty');

/* The one "Couldn't load" block: an outlined warning disc, what didn't load, and Retry, which calls the card's retry().
   `what` is the thing, e.g. "the forecast". Its styles are in BASE_CSS. */
export const failedHtml = (what) => `<div class="load-failed" role="status"><span class="lf-disc" aria-hidden="true"><ha-icon icon="mdi:cloud-alert-outline"></ha-icon></span>
    <b>Couldn't load ${esc(what)}</b><span>Check the connection, then try again.</span>
    <button class="lf-retry" data-act="retry"><ha-icon icon="mdi:refresh"></ha-icon>Retry</button></div>`;

/* The page photo, blurred once into a small image instead of a live filter:blur over the whole page on every card,
   which is slow on kiosk WebViews (The No Frost Rule, DESIGN.md). A 160px-wide copy blurred by the same share of its
   width looks the same scaled up. Only images the page may read back (same origin, or served with CORS) and browsers
   with canvas filters; anything else, or a failure, resolves null and the card keeps the live blur. One job per photo. */
export const PHOTO_LOOK = { blur: 26, brightness: 0.36, saturate: 1.15 };
const photoFilter = (look, scale = 1) => `blur(${+(look.blur * scale).toFixed(2)}px) brightness(${look.brightness}) saturate(${look.saturate})`;
const softened = new Map();
export const preblur = (url, look = PHOTO_LOOK, width = 160) => {
  if (!url) return Promise.resolve(null);
  const key = `${url}|${photoFilter(look)}`;
  if (!softened.has(key)) {
    softened.set(key, new Promise((resolve) => {
      try {
        const img = new Image(); img.decoding = 'async';
        const abs = new URL(url, location.href); if (abs.origin !== location.origin) img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const w = width; const h = Math.max(1, Math.round(w * (img.naturalHeight / img.naturalWidth || 0.625)));
            const scale = w / 788; const pad = Math.ceil(look.blur * scale * 2);
            const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx || !('filter' in ctx)) { resolve(null); return; }
            ctx.filter = photoFilter(look, scale);
            ctx.drawImage(img, -pad, -pad, w + pad * 2, h + pad * 2);  // drawn past the edges, so the blur doesn't darken them
            resolve(canvas.toDataURL('image/jpeg', 0.86));
          } catch { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = abs.href;
      } catch { resolve(null); }
    }));
    if (softened.size > 12) softened.delete(softened.keys().next().value);
  }
  return softened.get(key);
};

/* How long a toast stays: a confirmation, one with Undo, and the shortest an error stays. */
export const TOAST_MS = 2500;
export const UNDO_MS = 8000;
const ERROR_MS = 5000;

/* Every colour goes through these properties (The One Token Rule). --l-page, --l-panel and --l-photo can be set from a
   theme or a parent card: --l-photo is a background image shown blurred behind the panels, --l-photo-show: 0 hides it.
   --l-photo-soft and --l-photo-filter are the pre-blurred copy and its filter (none), which cards set on themselves. */
export const TOKENS = `
  :host{display:block;
    --page:var(--l-page,#0b0c0f);--panel:var(--l-panel,rgba(22,24,29,.74));--panel-solid:#17191e;--raised:var(--l-raised,rgba(255,255,255,.08));--raised-2:var(--l-raised-2,rgba(255,255,255,.14));--line:rgba(255,255,255,.07);
    --text:#f4f2ee;--muted:#b9b4ac;--accent:#80d8ff;--accent-ink:#04222e;--warm:#ffc76b;--warm-ink:#2a1a04;--warm-rgb:255,186,84;--warm-soft:rgba(var(--warm-rgb),.16);--warm-glow:rgba(var(--warm-rgb),.45);--ok:#7ee2a8;--warn:#ff9d5c;--alert:#ff8a80;
    --dimmer:rgba(0,0,0,.55);--toast-ground:rgba(12,13,16,.94);--error-ground:#5a1616;--error-text:#ffd7d2;--danger-ink:#2b0a07;--r-tile:22px;--r-sm:14px;
    --glow:radial-gradient(120% 100% at 0% 0%,rgba(var(--warm-rgb),.30),rgba(var(--warm-rgb),0) 62%);
    --text-font:'Lamplight Text','Atkinson Hyperlegible Next',Roboto,Arial,sans-serif;--num:Lexend,'Atkinson Hyperlegible Next',sans-serif}`;

/* The page, the photo layer, buttons, the header and the toast: the same on every card. */
export const BASE_CSS = `${TOKENS}
  *{box-sizing:border-box}
  ha-card{position:relative;height:var(--l-height,calc(100dvh - var(--l-top,0px)));min-height:420px;background:var(--page);color:var(--text);border:0;border-radius:0;display:flex;flex-direction:column;gap:10px;padding:12px 14px;overflow:hidden;font-family:var(--text-font);font-size:19px}
  ha-card::before{content:'';position:absolute;inset:-48px;z-index:0;background:var(--l-photo-soft,var(--l-photo,none)) center/cover no-repeat;filter:var(--l-photo-filter,${photoFilter(PHOTO_LOOK)});opacity:var(--l-photo-show,1);pointer-events:none}
  ha-card > *{position:relative;z-index:1}
  button{font:inherit;color:inherit;background:var(--raised);border:0;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
  button:active{filter:brightness(1.25)} button:disabled{opacity:.5;cursor:default}
  button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
  ha-icon{display:inline-flex;--mdc-icon-size:26px;flex-shrink:0}
  .num{font-family:var(--num);font-variant-numeric:tabular-nums}
  .head{display:flex;align-items:center;gap:10px;height:64px;flex:0 0 64px}
  .icon{width:56px;height:56px;flex:0 0 56px;border-radius:50%;display:flex;align-items:center;justify-content:center}
  .back{height:56px;flex:0 0 auto;border-radius:999px;display:flex;align-items:center;gap:6px;padding:0 20px 0 14px;font-size:18px;font-weight:600;max-width:210px;white-space:nowrap}
  .back ha-icon{--mdc-icon-size:24px}
  .icon[hidden],.back[hidden]{display:none}
  .title{flex:1;min-width:0;display:flex;flex-direction:column;margin-left:4px}
  .title h1{margin:0;font-size:30px;font-weight:600;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sub{font-size:17px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3} .sub.warn{color:var(--warn)}
  .disc{width:48px;height:48px;flex:0 0 48px;border-radius:50%;background:var(--raised);color:var(--text);display:inline-flex;align-items:center;justify-content:center}
  .disc.big{width:72px;height:72px;flex-basis:72px} .disc.big ha-icon{--mdc-icon-size:36px;color:var(--muted)}
  .empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;color:var(--muted);font-size:18px;padding:16px}
  .empty b{font-size:26px;font-weight:600;color:var(--text)}
  .load-failed{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:16px;color:var(--muted);font-size:17px}
  .load-failed b{font-size:26px;font-weight:600;color:var(--text)}
  .lf-disc{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--warn);box-shadow:inset 0 0 0 2px var(--warn)}
  .lf-disc ha-icon{--mdc-icon-size:32px}
  .lf-retry{margin-top:8px;height:56px;padding:0 22px 0 16px;border-radius:999px;background:var(--raised-2);font-size:18px;font-weight:600;display:inline-flex;align-items:center;gap:8px}
  .lf-retry ha-icon{--mdc-icon-size:22px}
  .toast{position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:30;max-width:90%;background:var(--toast-ground);color:var(--text);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:12px 22px;font-size:18px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 10px 30px rgba(0,0,0,.5)}
  .toast.error{background:var(--error-ground);color:var(--error-text);border-color:rgba(255,138,128,.45)} .toast[hidden]{display:none}
  .toast.has-undo:not([hidden]){display:flex;align-items:center;gap:14px;padding:5px 5px 5px 22px}
  .toast.has-undo .t-msg{min-width:0;overflow:hidden;text-overflow:ellipsis}
  .undo{height:56px;flex:0 0 auto;border-radius:999px;display:inline-flex;align-items:center;gap:6px;padding:0 20px 0 14px;background:var(--raised-2);font-size:18px;font-weight:600}
  .undo ha-icon{--mdc-icon-size:22px;color:var(--warm)}
  .dot{width:10px;height:10px;border-radius:50%;background:var(--warm);flex-shrink:0;animation:pulse 1.6s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}
  @media (prefers-reduced-motion:reduce){.dot{animation:none}}`;

/* The page fit: a card's --l-top is its distance from the top of the screen (Home Assistant's header, when it shows), so
   the card fills the rest of it. One ResizeObserver and one resize listener serve every card on the page, attached while
   any card is connected; a dashboard that moves things without a resize can dispatch 'lamplight-layout' on window.
   After placing a card, its resized() hook runs (the info card refits its text there). */
const fitted = new Set();
let fitObserver = null; let fitFrame = 0;
const place = (card) => { card.style.setProperty('--l-top', `${Math.max(0, card.getBoundingClientRect().top)}px`); card.resized(); };
const placeAll = () => {
  if (fitFrame) return;
  fitFrame = requestAnimationFrame(() => { fitFrame = 0; fitted.forEach(place); });
};
const fit = (card) => {
  if (!fitted.size) {
    window.addEventListener('resize', placeAll); window.addEventListener('lamplight-layout', placeAll);
    if (typeof ResizeObserver === 'function') fitObserver = new ResizeObserver(placeAll);
  }
  fitted.add(card); fitObserver?.observe(card);
  requestAnimationFrame(() => place(card));
  return () => {
    if (!fitted.delete(card)) return;
    fitObserver?.unobserve(card);
    if (fitted.size) return;
    fitObserver?.disconnect(); fitObserver = null;
    window.removeEventListener('resize', placeAll); window.removeEventListener('lamplight-layout', placeAll);
  };
};

/* A card's shared behaviour. Navigation, in order of preference:
     1. window.lamplightNav = { home(), back(), backLabel() } if the dashboard provides one;
     2. View Assist: on a tablet with a View Assist sensor, the clock goes to its home screen;
     3. the card's `nav` config: { home: '/path', back: '/path', back_label: 'Rooms' }.
   Without a home path the clock button hides; without a back path, Back goes back in history. */
export class LamplightCard extends HTMLElement {
  setConfig(config) { this.config = { ...this.defaults(), ...config }; this.nav = config.nav || {}; }
  defaults() { return {}; }
  set hass(hass) { this._hass = hass; if (!this.built) this.build(); this.update(); }
  get hass() { return this._hass; }
  getCardSize() { return 10; }
  update() { }
  st(id) { return id ? this._hass?.states[id] : undefined; }
  get locale() { return this.config.locale || this._hass?.locale?.language || undefined; }
  hhmm(d) { return new Date(d).toLocaleTimeString(this.locale, { hour: '2-digit', minute: '2-digit' }); }

  get vaSensor() {
    if (this.config.view_assist_sensor) return this.config.view_assist_sensor;
    try { return localStorage.getItem('view_assist_sensor') || null; } catch { return null; }
  }
  get homePath() { return this.nav.home || this.st(this.vaSensor)?.attributes?.home_screen || ''; }
  backLabel() {
    if (window.lamplightNav?.backLabel) return window.lamplightNav.backLabel();
    return this.nav.back_label || 'Back';
  }

  /* The shell: header, the card's own main, a toast. */
  shell(title, main, { sub = '', extra = '' } = {}) {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}${this.styles()}</style><ha-card><header class="head">
        <button class="icon" data-act="home" aria-label="Back to clock"><ha-icon icon="mdi:clock-outline"></ha-icon></button>
        <button class="back" data-act="back"><ha-icon icon="mdi:arrow-left"></ha-icon><span class="bl"></span></button>
        <div class="title"><h1>${esc(title)}</h1><span class="sub">${esc(sub)}</span></div>${extra}</header>
      ${main}<div class="toast" role="status" aria-live="polite" hidden></div></ha-card>`;
    this.shadowRoot.addEventListener('click', (ev) => {
      const el = ev.composedPath().find((n) => n?.dataset && 'act' in n.dataset);
      if (!el || el.disabled) return;
      if (el.dataset.act === 'home') this.goHome();
      else if (el.dataset.act === 'back') this.goBack();
      else if (el.dataset.act === 'retry') this.retry();
      else if (el.dataset.act === 'undo') { const run = this.undoRun; this.hideToast(); run?.(); }
      else this.act(el.dataset.act, el);
    });
    if (this.isConnected) { this.startFit(); this.softenPhoto(); }
    this.syncNav();
  }
  act() { }
  retry() { }
  resized() { }
  styles() { return ''; }
  connectedCallback() { this.syncNav(); this.startFit(); this.softenPhoto(); }
  disconnectedCallback() { this.stopFit(); this.hideToast(); }
  startFit() { if (this.shadowRoot && !this.unfit) this.unfit = fit(this); }
  stopFit() { this.unfit?.(); this.unfit = null; }

  /* Shows the page photo pre-blurred (see preblur) when --l-photo is one image; otherwise the live blur stays. */
  async softenPhoto() {
    if (!this.shadowRoot || typeof getComputedStyle !== 'function') return;
    const css = getComputedStyle(this);
    const url = css.getPropertyValue('--l-photo-show').trim() === '0' ? '' : /^\s*url\((['"]?)(.+?)\1\)\s*$/.exec(css.getPropertyValue('--l-photo'))?.[2] || '';
    if (url === this.softFor) return;
    this.softFor = url;
    const soft = await preblur(url);
    if (this.softFor !== url) return;
    if (soft) { this.style.setProperty('--l-photo-soft', `url("${soft}")`); this.style.setProperty('--l-photo-filter', 'none'); }
    else { this.style.removeProperty('--l-photo-soft'); this.style.removeProperty('--l-photo-filter'); }
  }

  /* HA keeps views alive, so the header is refreshed each time the card is shown. */
  syncNav() {
    const root = this.shadowRoot; if (!root) return;
    const home = root.querySelector('.icon[data-act=home]'); const back = root.querySelector('.back');
    if (home) home.hidden = !(window.lamplightNav?.home || this.homePath);
    if (back) {
      const label = this.backLabel();
      back.hidden = !label; back.querySelector('.bl').textContent = label; back.setAttribute('aria-label', `Back to ${label}`);
    }
  }
  setSub(text, cls = '') { const el = this.shadowRoot?.querySelector('.sub'); if (el) { el.textContent = text; el.className = `sub ${cls}`; } }

  goHome() { return window.lamplightNav?.home ? window.lamplightNav.home() : this.navigate(this.homePath); }
  goBack() {
    if (window.lamplightNav?.back) return window.lamplightNav.back();
    if (this.nav.back) return this.navigate(this.nav.back);
    return history.back();
  }
  async navigate(path) {
    if (!path) return;
    const sensor = this.vaSensor;
    try { if (sensor && this.st(sensor)) await this._hass.callService('view_assist', 'navigate', { device: sensor, path, revert_timeout: 0 }); } catch { /* local only */ }
    if (location.pathname !== path) { history.pushState(null, '', path); window.dispatchEvent(new Event('location-changed')); }
  }

  /* A short pill at the top. With `undo` (a function) it grows an Undo button and stays UNDO_MS; a tap on Undo runs it. */
  toast(text, error = false, ms = TOAST_MS, undo = null) {
    const el = this.shadowRoot?.querySelector('.toast'); if (!el) return;
    this.undoRun = undo;
    el.innerHTML = `<span class="t-msg">${esc(text)}</span>${undo ? '<button class="undo" data-act="undo"><ha-icon icon="mdi:undo"></ha-icon>Undo</button>' : ''}`;
    el.classList.toggle('error', error); el.classList.toggle('has-undo', !!undo); el.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.hideToast(), error ? Math.max(ms, ERROR_MS) : undo ? Math.max(ms, UNDO_MS) : ms);
  }
  hideToast() {
    clearTimeout(this.toastTimer); this.undoRun = null;
    const el = this.shadowRoot?.querySelector('.toast'); if (el) el.hidden = true;
  }
  async call(domain, service, data, done, undo = null) {
    if (done) this.toast(done, false, TOAST_MS, undo);
    try { await this._hass.callService(domain, service, data); return true; } catch (e) { this.toast(`That didn't work: ${e?.message || e}`, true); return false; }
  }
}

/* Registers a card once (a second load of the same tag is a no-op, so two bundles can't throw), and lists it in the
   card picker once. Returns the class actually registered under `tag`. */
export const define = (tag, cls, name, description) => {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  window.customCards = window.customCards || [];
  if (name && !window.customCards.some((c) => c.type === tag)) {
    window.customCards.push({ type: tag, name, description, preview: false, documentationURL: 'https://github.com/HaydenGriffin/lamplight' });
  }
  return customElements.get(tag);
};
