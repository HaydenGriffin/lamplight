/* Help: "What can I say?" A voice cheat-sheet with categories on the left and examples on the right, each starting with
 * the wake phrase. Tapping an example runs it for real: the text goes to the assistant (conversation/process) and its
 * reply shows in a toast. Examples marked `confirm` ask for a second tap first. A follow-up tapped within 90 s continues
 * the same conversation ("another ten minutes" after a timer).
 *   type: custom:lamplight-help-card
 *   agent_id: conversation.home_assistant
 *   wake_phrase: Okay Nabu
 *   rooms: {sensor.viewassist_kitchen: kitchen}     # optional: fills {room} in examples
 *   categories:
 *     - name: Lights
 *       icon: mdi:lightbulb-group
 *       hint: Rooms, brightness and scenes
 *       tip: Say the room's name, or nothing for the room you're in.
 *       examples:
 *         - say: turn on the lights in the {room}
 *         - say: turn everything off
 *           confirm: true
 *         - say: remember that…
 *           tap: false            # shown, not run (it needs your own words)
 * `run` is sent instead of `say` when they differ; `agent` sends one example to another agent; `note` adds a small line.
 */
const ASK_TIMEOUT_MS = 25000;
const FOLLOW_UP_MS = 90000;
const ARM_MS = 4000;
const REPLY_MS = 7000;

class LamplightHelpCard extends LamplightCard {
  setConfig(config) {
    if (!Array.isArray(config.categories) || !config.categories.length) throw new Error('categories is required');
    super.setConfig(config);
    this.sel = 0; this.asking = false; this.armed = null;
  }
  defaults() { return { agent_id: 'conversation.home_assistant', wake_phrase: 'Okay Nabu', rooms: {} }; }
  get cats() { return this.config.categories; }
  get roomName() { return this.config.rooms[this.vaSensor] || ''; }
  fill(text) { return this.roomName ? text.replace(/\{room\}/g, this.roomName) : text.replace(/,? in the \{room\}/g, '').replace(/\{room\}/g, 'here'); }

  build() {
    this.built = true;
    this.shell(this.config.title || 'What can I say?', `<main><nav class="cats-wrap" aria-label="Categories"><div class="cats scroll" role="tablist"></div>
        <span class="fade" hidden><ha-icon icon="mdi:chevron-down"></ha-icon>More</span></nav><section class="panel"></section></main>`,
    { sub: 'Tap an example to try it for real' });
    this.shadowRoot.addEventListener('scroll', (ev) => this.fadeFor(ev.target), true);
    this.renderCats(); this.renderPanel();
  }
  disconnectedCallback() { super.disconnectedCallback(); clearTimeout(this.armTimer); }

  renderCats() {
    this.shadowRoot.querySelector('.cats').innerHTML = this.cats.map((c, i) => `<button class="cat ${i === this.sel ? 'sel' : ''}" role="tab" aria-selected="${i === this.sel}" data-act="cat" data-i="${i}">
      <ha-icon icon="${esc(c.icon || 'mdi:comment-text-outline')}"></ha-icon><span>${esc(c.name)}</span></button>`).join('');
    this.revealSelected();
  }

  /* Keep the chosen category fully in view, clear of the "More" hint, in the scrolling list. */
  revealSelected() {
    const list = this.shadowRoot.querySelector('.cats'); const b = list.querySelector('.sel'); if (!b) return;
    const room = 44;
    if (b.offsetTop < list.scrollTop) list.scrollTop = b.offsetTop;
    else if (b.offsetTop + b.offsetHeight > list.scrollTop + list.clientHeight - room) list.scrollTop = b.offsetTop + b.offsetHeight - list.clientHeight + room;
    this.fadeFor(list);
  }

  renderPanel() {
    const c = this.cats[this.sel]; const wake = esc(`${this.config.wake_phrase},`);
    const say = (e) => `<span class="say"><em>${wake}</em> ${esc(this.fill(e.say))}${e.note ? `<small>${esc(e.note)}</small>` : ''}</span>`;
    const rows = (c.examples || []).map((e, i) => (e.tap === false ? `<div class="ex still">${say(e)}</div>`
      : `<button class="ex" data-act="try" data-i="${i}">${say(e)}<span class="go"><ha-icon icon="mdi:play"></ha-icon></span></button>`)).join('');
    this.shadowRoot.querySelector('.panel').innerHTML = `<div class="p-head"><span class="disc"><ha-icon icon="${esc(c.icon || 'mdi:comment-text-outline')}"></ha-icon></span>
        <div class="p-title"><h2>${esc(c.name)}</h2>${c.hint ? `<span>${esc(c.hint)}</span>` : ''}</div></div>
      <div class="ex-wrap"><div class="exs scroll">${rows}${c.tip ? `<p class="tip"><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon><span>${esc(c.tip)}</span></p>` : ''}</div>
        <span class="fade" hidden><ha-icon icon="mdi:chevron-down"></ha-icon>More</span></div>`;
    this.fadeFor(this.shadowRoot.querySelector('.exs'));
  }

  /* A scrolling list shows a "More" hint at its foot until it has been scrolled to the end. */
  fadeFor(el) {
    if (!el?.classList?.contains('scroll')) return;
    const fade = el.parentElement?.querySelector('.fade'); if (!fade) return;
    fade.hidden = !(el.scrollHeight - el.clientHeight > 8 && el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  }

  act(act, el) {
    const i = Number(el.dataset.i);
    if (act === 'cat') this.select(i);
    else if (act === 'try') this.tryExample(i, el);
  }

  select(i) {
    if (i === this.sel) return;
    this.sel = i; this.armed = null;
    this.shadowRoot.querySelectorAll('.cat').forEach((b, n) => { b.classList.toggle('sel', n === i); b.setAttribute('aria-selected', String(n === i)); });
    this.renderPanel(); this.revealSelected();
  }

  async tryExample(i, btn) {
    if (this.asking) return;
    const ex = this.cats[this.sel].examples[i]; if (!ex) return;
    if (ex.confirm && this.armed !== `${this.sel}:${i}`) { this.arm(`${this.sel}:${i}`, btn); return; }
    this.disarm();
    this.asking = true; btn.classList.add('busy'); btn.setAttribute('aria-busy', 'true');
    btn.querySelector('.go').innerHTML = '<span class="ask">Asking…</span>';
    try {
      const msg = { type: 'conversation/process', text: this.fill(ex.run || ex.say), agent_id: ex.agent || this.config.agent_id };
      if (!ex.agent && this.conv && Date.now() - this.conv.at < FOLLOW_UP_MS) msg.conversation_id = this.conv.id;
      let timer; const limit = new Promise((_, no) => { timer = setTimeout(() => no(new Error('no answer yet')), ASK_TIMEOUT_MS); });
      const r = await Promise.race([this._hass.callWS(msg), limit]); clearTimeout(timer);
      if (r?.conversation_id && !ex.agent) this.conv = { id: r.conversation_id, at: Date.now() };
      this.toast(r?.response?.speech?.plain?.speech || 'Done', false, REPLY_MS);
    } catch (e) { this.toast(`That didn't work: ${e?.message || e}`, true); }
    this.asking = false;
    if (btn.isConnected) { btn.classList.remove('busy'); btn.removeAttribute('aria-busy'); btn.querySelector('.go').innerHTML = '<ha-icon icon="mdi:play"></ha-icon>'; }
  }

  /* First tap on a `confirm` example: the row turns into "Tap again" for ARM_MS. */
  arm(key, btn) {
    this.disarm(); this.armed = key;
    btn.classList.add('armed'); btn.querySelector('.go').innerHTML = '<span class="ask">Tap again</span>';
    this.armTimer = setTimeout(() => this.disarm(), ARM_MS);
  }

  disarm() {
    clearTimeout(this.armTimer); this.armed = null;
    this.shadowRoot.querySelectorAll('.ex.armed').forEach((b) => { b.classList.remove('armed'); b.querySelector('.go').innerHTML = '<ha-icon icon="mdi:play"></ha-icon>'; });
  }

  styles() {
    return `
      ha-card{gap:8px}
      button{border-radius:var(--r-sm);text-align:left;user-select:none;-webkit-user-select:none}
      .icon,.back{text-align:center}
      main{flex:1;min-height:0;display:grid;grid-template-columns:238px minmax(0,1fr);gap:12px}
      .cats-wrap{position:relative;min-height:0}
      .scroll{overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none} .scroll::-webkit-scrollbar{display:none}
      .cats{height:100%;display:flex;flex-direction:column;gap:6px;padding-bottom:36px}
      .cat{flex:0 0 auto;min-height:58px;border-radius:18px;background:var(--panel);display:flex;align-items:center;gap:12px;padding:6px 12px 6px 14px;font-size:19px;font-weight:600;line-height:1.15}
      .cat ha-icon{color:var(--muted)}
      .cat.sel{background:var(--accent);color:var(--accent-ink)} .cat.sel ha-icon{color:var(--accent-ink)}
      .fade{position:absolute;left:0;right:0;bottom:0;height:46px;display:flex;align-items:flex-end;justify-content:center;gap:4px;padding-bottom:4px;font-size:16px;font-weight:600;color:var(--text);pointer-events:none;border-radius:0 0 18px 18px;
        background:linear-gradient(rgba(11,12,15,0),rgba(11,12,15,.92) 78%)}
      .fade[hidden]{display:none} .fade ha-icon{--mdc-icon-size:22px}
      .panel{min-width:0;min-height:0;display:flex;flex-direction:column;gap:8px;background:var(--panel);border-radius:26px;padding:14px 14px 12px 16px}
      .p-head{display:flex;align-items:center;gap:12px;flex:0 0 auto}
      .p-head .disc{background:var(--warm-soft);color:var(--warm)}
      .p-title{min-width:0;display:flex;flex-direction:column;line-height:1.15}
      .p-title h2{margin:0;font-size:26px;font-weight:600}
      .p-title span{font-size:17px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ex-wrap{position:relative;flex:1;min-height:0}
      .exs{height:100%;display:flex;flex-direction:column;gap:8px;padding-bottom:30px}
      .ex{flex:0 0 auto;min-height:64px;border-radius:18px;background:var(--raised);display:flex;align-items:center;gap:10px;padding:8px 10px 8px 16px;font-size:19px;line-height:1.25}
      .ex.still{background:transparent;box-shadow:inset 0 0 0 2px var(--raised)}
      .say{flex:1;min-width:0}
      .say em{font-style:normal;color:var(--muted)}
      .say small{display:block;font-size:16px;color:var(--muted);margin-top:2px;line-height:1.25}
      .go{flex:0 0 auto;min-width:44px;height:44px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:var(--warm)}
      .ask{font-size:17px;font-weight:600;color:var(--text);padding:0 8px;white-space:nowrap}
      .ex.busy{opacity:.75;cursor:default}
      .ex.armed{background:var(--accent);color:var(--accent-ink)} .ex.armed em,.ex.armed small,.ex.armed .ask{color:var(--accent-ink)}
      .tip{display:flex;gap:10px;align-items:flex-start;margin:4px 2px 0;font-size:17px;line-height:1.35;color:var(--muted)}
      .tip ha-icon{--mdc-icon-size:24px;color:var(--warm);margin-top:-1px}
      .ex-wrap .fade{background:linear-gradient(rgba(23,25,30,0),rgba(23,25,30,.95) 78%)}
      /* the one wrapping toast: it carries the assistant's spoken answer, so it may run to three lines */
      .toast{width:max-content;max-width:min(660px,92%);border-radius:26px;line-height:1.3;white-space:normal;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
      .toast[hidden]{display:none}`;
  }
}
define('lamplight-help-card', LamplightHelpCard, 'Lamplight Help', 'What can I say? A tappable voice cheat-sheet.');
