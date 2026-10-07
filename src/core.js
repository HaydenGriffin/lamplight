/* Lamplight core: the tokens, fonts, header, navigation and toast every card shares. See DESIGN.md.
 * The cards are built for wall tablets (around 788×492 CSS px, landscape) and fill the screen: one card per view,
 * in a panel or a View Assist dashboard. */
const VERSION = '1.0.0';
const BASE = new URL('.', import.meta.url).href;

/* 'Lamplight Text' is Atkinson Hyperlegible Next for letters with Lexend for the ten digits: Atkinson's slashed zero
   reads as "Ø" from across a room, Lexend's plain one doesn't. Fonts must be registered on the document, not in a
   shadow root, for shadow DOM to use them. */
const registerFonts = () => {
  if (document.getElementById('lamplight-fonts')) return;
  const style = document.createElement('style');
  style.id = 'lamplight-fonts';
  style.textContent = `
    @font-face{font-family:'Lamplight Text';font-weight:200 800;font-display:swap;src:url(${BASE}ahn-latin.woff2) format('woff2')}
    @font-face{font-family:'Lamplight Text';font-weight:200 800;font-display:swap;src:url(${BASE}ahn-latin-ext.woff2) format('woff2');unicode-range:U+0100-024F,U+1E00-1EFF}
    @font-face{font-family:'Lamplight Text';font-weight:200 800;font-display:swap;src:url(${BASE}lexend-latin.woff2) format('woff2');unicode-range:U+0030-0039}
    @font-face{font-family:Lexend;font-weight:200 800;font-display:swap;src:url(${BASE}lexend-latin.woff2) format('woff2')}`;
  document.head.appendChild(style);
};
registerFonts();

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* Every colour goes through these properties (The One Token Rule). --l-page, --l-panel and --l-photo can be set from a
   theme or a parent card: --l-photo is a background image shown blurred behind the panels, --l-photo-show: 0 hides it. */
const TOKENS = `
  :host{display:block;
    --page:var(--l-page,#0b0c0f);--panel:var(--l-panel,rgba(22,24,29,.74));--panel-solid:#17191e;--raised:var(--l-raised,rgba(255,255,255,.08));--raised-2:var(--l-raised-2,rgba(255,255,255,.14));--line:rgba(255,255,255,.07);
    --text:#f4f2ee;--muted:#b9b4ac;--accent:#80d8ff;--accent-ink:#04222e;--warm:#ffc76b;--warm-ink:#2a1a04;--warm-rgb:255,186,84;--warm-soft:rgba(var(--warm-rgb),.16);--warm-glow:rgba(var(--warm-rgb),.45);--ok:#7ee2a8;--warn:#ff9d5c;--alert:#ff8a80;
    --dimmer:rgba(0,0,0,.55);--toast-ground:rgba(12,13,16,.94);--error-ground:#5a1616;--error-text:#ffd7d2;--danger-ink:#2b0a07;--r-tile:22px;--r-sm:14px;
    --glow:radial-gradient(120% 100% at 0% 0%,rgba(var(--warm-rgb),.30),rgba(var(--warm-rgb),0) 62%);
    --text-font:'Lamplight Text','Atkinson Hyperlegible Next',Roboto,Arial,sans-serif;--num:Lexend,'Atkinson Hyperlegible Next',sans-serif}`;

/* The page, the photo layer, buttons, the header and the toast: the same on every card. */
const BASE_CSS = `${TOKENS}
  *{box-sizing:border-box}
  ha-card{position:relative;height:var(--l-height,calc(100dvh - var(--l-top,0px)));min-height:420px;background:var(--page);color:var(--text);border:0;border-radius:0;display:flex;flex-direction:column;gap:10px;padding:12px 14px;overflow:hidden;font-family:var(--text-font);font-size:19px}
  ha-card::before{content:'';position:absolute;inset:-48px;z-index:0;background:var(--l-photo,none) center/cover no-repeat;filter:blur(26px) brightness(.36) saturate(1.15);opacity:var(--l-photo-show,1);pointer-events:none}
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
  .sub{font-size:17px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3}
  .disc{width:48px;height:48px;flex:0 0 48px;border-radius:50%;background:var(--raised);color:var(--text);display:inline-flex;align-items:center;justify-content:center}
  .disc.big{width:72px;height:72px;flex-basis:72px} .disc.big ha-icon{--mdc-icon-size:36px;color:var(--muted)}
  .empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;color:var(--muted);font-size:18px;padding:16px}
  .empty b{font-size:26px;font-weight:600;color:var(--text)}
  .toast{position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:30;max-width:90%;background:var(--toast-ground);color:var(--text);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:12px 22px;font-size:18px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 10px 30px rgba(0,0,0,.5)}
  .toast.error{background:var(--error-ground);color:var(--error-text);border-color:rgba(255,138,128,.45)} .toast[hidden]{display:none}
  .dot{width:10px;height:10px;border-radius:50%;background:var(--warm);flex-shrink:0;animation:pulse 1.6s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}
  @media (prefers-reduced-motion:reduce){.dot{animation:none}}`;

/* A card's shared behaviour. Navigation, in order of preference:
     1. window.lamplightNav = { home(), back(), backLabel() } if the dashboard provides one;
     2. View Assist: on a tablet with a View Assist sensor, the clock goes to its home screen;
     3. the card's `nav` config: { home: '/path', back: '/path', back_label: 'Rooms' }.
   Without a home path the clock button hides; without a back path, Back goes back in history. */
class LamplightCard extends HTMLElement {
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
      else this.act(el.dataset.act, el);
    });
    const fit = () => requestAnimationFrame(() => this.style.setProperty('--l-top', `${Math.max(0, this.getBoundingClientRect().top)}px`));
    fit(); window.addEventListener('resize', fit); this.fitTimer = setInterval(fit, 2000);
    this.syncNav();
  }
  act() { }
  styles() { return ''; }
  connectedCallback() { this.syncNav(); }
  disconnectedCallback() { clearInterval(this.fitTimer); }

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

  toast(text, error = false, ms = 2500) {
    const el = this.shadowRoot?.querySelector('.toast'); if (!el) return;
    el.textContent = text; el.classList.toggle('error', error); el.hidden = false;
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { el.hidden = true; }, error ? Math.max(ms, 5000) : ms);
  }
  async call(domain, service, data, done) {
    if (done) this.toast(done);
    try { await this._hass.callService(domain, service, data); return true; } catch (e) { this.toast(`That didn't work: ${e?.message || e}`, true); return false; }
  }
}

const define = (tag, cls, name, description) => {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: tag, name, description, preview: false, documentationURL: 'https://github.com/HaydenGriffin/lamplight' });
};
