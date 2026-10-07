/* Info: what the assistant just said, large. For View Assist's `info` and `infopic` views: it reads the tablet's View
 * Assist sensor attributes `message` (auto-fitted from 46px down to 24px, then it scrolls), `title`, and with
 * `show_image: true` the `image` beside it. "Keep" toggles View Assist's hold mode so the page stays up. Back returns to
 * the page shown before the answer.
 *   type: custom:lamplight-info-card
 *   show_image: true
 */
const FONT_MAX = 46; const FONT_MIN = 24; const FONT_STEP = 2;
const OWN_PATHS = /\/(info|infopic)\/?$/;

/* The page shown before the info page, so Back can return to it (voice answers arrive from any page). */
let lastPage = null;
const notePage = () => { const p = location.pathname; if (!OWN_PATHS.test(p)) lastPage = p; };
notePage();
window.addEventListener('location-changed', notePage);
window.addEventListener('popstate', notePage);

/* Plain text with light markdown: **bold** and "* " or "- " bullets. Line breaks are kept by CSS (pre-line). */
const formatMessage = (text) => esc(String(text ?? '').trim()).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^[ \t]*[*-][ \t]+/gm, '• ');

class LamplightInfoCard extends LamplightCard {
  defaults() { return { show_image: false }; }

  build() {
    this.built = true;
    this.shell('Assistant', '<main></main>', { extra: '<button class="keep" data-act="keep"></button>' });
    this.fit = () => requestAnimationFrame(() => this.fitText());
    window.addEventListener('resize', this.fit);
  }

  update() {
    const a = this.st(this.vaSensor)?.attributes || {};
    const sig = JSON.stringify([a.title, a.message, this.config.show_image ? a.image : '', a.mode]);
    if (sig === this.sig) return;
    if (a.message !== this.lastMessage) { this.lastMessage = a.message; this.saidAt = Date.now(); }
    this.sig = sig; this.render();
  }

  disconnectedCallback() { super.disconnectedCallback(); window.removeEventListener('resize', this.fit); }

  backLabel() {
    if (window.lamplightNav?.backLabel) return window.lamplightNav.backLabel();
    return !lastPage || lastPage === this.homePath ? '' : this.nav.back_label || 'Back';
  }
  goBack() { return !lastPage || lastPage === this.homePath ? this.goHome() : this.navigate(lastPage); }

  render() {
    const root = this.shadowRoot; if (!root || !this._hass) return;
    this.syncNav();
    const a = this.st(this.vaSensor)?.attributes || {};
    const title = String(a.title || '').trim(); const message = String(a.message || '').trim();
    const image = this.config.show_image ? String(a.image || '').trim() : '';
    const kept = a.mode === 'hold';
    root.querySelector('h1').textContent = title || 'Assistant';
    const said = `said at ${this.hhmm(this.saidAt || Date.now())}`;
    this.setSub(!message ? '' : title ? `Assistant · ${said}` : cap(said));
    const keep = root.querySelector('.keep');
    keep.className = `keep ${kept ? 'on' : ''}`;
    keep.hidden = !message && !image;
    keep.setAttribute('aria-pressed', String(kept));
    keep.setAttribute('aria-label', kept ? 'Kept on screen. Tap to let it close' : 'Keep on screen');
    keep.innerHTML = `<ha-icon icon="${kept ? 'mdi:pin' : 'mdi:pin-outline'}"></ha-icon>${kept ? 'Kept' : 'Keep'}`;
    const main = root.querySelector('main');
    main.className = image ? 'pic' : '';
    if (!message && !image) {
      main.innerHTML = `<section class="msg empty"><span class="disc big"><ha-icon icon="mdi:message-text-outline"></ha-icon></span>
        <b>Nothing to show</b><span>Ask something and the answer shows here.</span></section>`;
      return;
    }
    main.innerHTML = `${image ? `<figure class="img"><img src="${esc(image)}" alt=""></figure>` : ''}
      <section class="msg"><div class="scroll"><p class="txt">${formatMessage(message)}</p></div>
        <span class="more" hidden><ha-icon icon="mdi:chevron-down"></ha-icon>More below</span></section>`;
    const img = main.querySelector('img');
    if (img) img.addEventListener('error', () => { main.className = ''; img.parentElement.remove(); this.fitText(); });
    main.querySelector('.scroll').addEventListener('scroll', () => this.updateMore(), { passive: true });
    requestAnimationFrame(() => this.fitText());
  }

  /* The largest size (46 → 24px) at which the whole message fits; below that it scrolls. */
  fitText() {
    const scroll = this.shadowRoot?.querySelector('.scroll'); const txt = scroll?.querySelector('.txt');
    if (!scroll || !txt || !scroll.clientHeight) return;
    let size = FONT_MAX;
    txt.style.fontSize = `${size}px`;
    while (size > FONT_MIN && scroll.scrollHeight > scroll.clientHeight + 1) { size -= FONT_STEP; txt.style.fontSize = `${size}px`; }
    txt.classList.toggle('long', size <= 30);
    this.updateMore();
  }

  updateMore() {
    const msg = this.shadowRoot?.querySelector('.msg'); const scroll = msg?.querySelector('.scroll'); if (!scroll) return;
    const more = scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop > 6;
    msg.classList.toggle('more', more); msg.querySelector('.more').hidden = !more;
  }

  async act(act) {
    if (act !== 'keep') return;
    const sensor = this.vaSensor; if (!sensor) return;
    const kept = this.st(sensor)?.attributes?.mode === 'hold';
    try { await this._hass.callService('view_assist', 'set_state', { entity_id: sensor, mode: kept ? 'normal' : 'hold' }); } catch { /* ignore */ }
  }

  styles() {
    return `
      .keep{height:56px;flex:0 0 auto;border-radius:999px;display:flex;align-items:center;gap:6px;padding:0 20px 0 14px;font-size:18px;font-weight:600}
      .keep ha-icon{--mdc-icon-size:24px}
      .keep.on{background:var(--accent);color:var(--accent-ink)} .keep[hidden]{display:none}
      .title h1{font-size:26px;line-height:1.2}
      main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
      main.pic{grid-template-columns:minmax(0,1fr) minmax(0,2fr)}
      .msg{position:relative;background:var(--panel);border-radius:var(--r-tile);padding:18px 26px;display:flex;flex-direction:column;min-height:0;min-width:0}
      .scroll{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;display:flex;flex-direction:column}
      .scroll::-webkit-scrollbar{display:none}
      .txt{margin:auto 0;font-size:${FONT_MAX}px;font-weight:400;line-height:1.28;white-space:pre-line;overflow-wrap:anywhere;color:var(--text)}
      .txt.long{line-height:1.38}
      .txt b{font-weight:600}
      .msg.more .scroll{-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 48px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 48px),transparent)}
      .more{flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:4px;padding-top:4px;font-size:16px;color:var(--muted);pointer-events:none}
      .more[hidden]{display:none} .more ha-icon{--mdc-icon-size:20px}
      .img{margin:0;background:var(--panel);border-radius:var(--r-tile);padding:12px;display:flex;align-items:center;justify-content:center;min-height:0;min-width:0;overflow:hidden}
      .img img{max-width:100%;max-height:100%;object-fit:contain;border-radius:var(--r-sm)}
      .msg.empty{align-items:center;justify-content:center;gap:8px;text-align:center;color:var(--muted);font-size:19px}`;
  }
}
define('lamplight-info-card', LamplightInfoCard, 'Lamplight Info', "The assistant's last answer, large, for View Assist tablets.");
