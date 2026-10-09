/* Timers: what's running on this tablet, with live countdowns and a ring, alarms and reminders with their time, and
 * appliance timers (washing machine, dryer) as quiet read-only rows. Quick-start buttons on the right. Timers are View
 * Assist's: they're read from the tablet's View Assist sensor (`timers` attribute) and set and cancelled through its
 * services.
 *   type: custom:lamplight-timers-card
 *   quick_minutes: [5, 10, 15, 20]
 *   appliance_timers: [{entity: timer.washing_machine, name: Washing machine, icon: mdi:washing-machine}]
 *   view_assist_sensor: sensor.viewassist_kitchen   # optional; tablets find their own
 * An appliance timer is a timer entity whose `finishes_at` attribute is set while it runs.
 */
import { LamplightCard, cap, dayStart, define, esc } from '../core.js';

const RING_C = 2 * Math.PI * 30;
/* Time left, in words so it can't be read as a time of day: "1 h 05 min", "17 min 39 s", "45 s". */
const leftHtml = (sec) => {
  const s = Math.max(0, Math.ceil(sec)); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const x = s % 60;
  const part = (n, unit) => `${n}<u>${unit}</u>`;
  if (h) return `${part(h, 'h')} ${part(String(m).padStart(2, '0'), 'min')}`;
  return m ? `${part(m, 'min')} ${part(x, 's')}` : part(x, 's');
};

export class LamplightTimersCard extends LamplightCard {
  defaults() { return { quick_minutes: [5, 10, 15, 20], appliance_timers: [] }; }

  get roomName() { return this.st(this.vaSensor)?.attributes?.friendly_name || 'this room'; }

  get vaTimers() {
    const list = this.st(this.vaSensor)?.attributes?.timers;
    if (!Array.isArray(list)) return [];
    return list.filter((t) => t && t.status !== 'expired').map((t) => {
      const at = Date.parse(t.expires || ''); const from = Date.parse(t.created_at || ''); const orig = Date.parse(t.original_expiry || t.expires || '');
      return { id: t.id, name: String(t.name || ''), cls: t.timer_class || 'timer', at,
        total: Number.isFinite(from) && Number.isFinite(orig) && orig > from ? (orig - from) / 1000 : null };
    }).filter((t) => Number.isFinite(t.at)).sort((a, b) => a.at - b.at);
  }

  get appliances() {
    return (this.config.appliance_timers || []).map((a) => {
      const s = this.st(a.entity); const at = Date.parse(s?.attributes?.finishes_at || '');
      return s?.state === 'active' && Number.isFinite(at) ? { ...a, at } : null;
    }).filter(Boolean);
  }

  build() {
    this.built = true;
    this.shell('Timers', `<main><section class="list-box"><div class="list"></div></section>
      <section class="start"><h2>Start a timer</h2><div class="quick"></div></section></main>`);
    this.shadowRoot.querySelector('.list').addEventListener('scroll', () => this.updateFade(), { passive: true });
  }

  update() {
    const apps = (this.config.appliance_timers || []).map((a) => { const x = this.st(a.entity); return `${x?.state}|${x?.attributes?.finishes_at}`; });
    const sig = JSON.stringify([this.vaSensor, this.st(this.vaSensor)?.attributes?.timers || [], apps]);
    if (sig !== this.sig) { this.sig = sig; this.busy = ''; this.render(); }
  }

  connectedCallback() { super.connectedCallback(); if (this.built) this.syncTicker(); }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this.ticker); this.ticker = null; }

  render() {
    const root = this.shadowRoot; if (!root || !this._hass) return;
    const timers = this.vaTimers; const apps = this.appliances;
    const running = timers.filter((t) => t.cls === 'timer'); const next = running[0];
    this.setSub(running.length ? `${running.length} running · next done at ${this.hhmm(next.at)}`
      : timers.length ? `${timers.length} alarm${timers.length > 1 ? 's' : ''} set` : `Nothing running in ${this.roomName}`, running.length ? 'warm' : '');
    const rows = [...timers.map((t) => this.timerRow(t)), ...apps.map((a) => this.applianceRow(a))];
    root.querySelector('.list').innerHTML = rows.length ? rows.join('') : `<div class="empty"><span class="disc big"><ha-icon icon="mdi:timer-outline"></ha-icon></span>
      <b>No timers running</b><span>Tap a time on the right to start one here.</span></div>`;
    root.querySelector('.quick').innerHTML = this.config.quick_minutes.map((m) => `<button class="q" data-act="start" data-arg="${Number(m)}" aria-label="Start a ${Number(m)} minute timer"
      ${this.busy === `start:${Number(m)}` || !this.vaSensor ? 'disabled' : ''}><b>${Number(m)}</b><small>min</small></button>`).join('');
    this.tick(); this.syncTicker();
    requestAnimationFrame(() => this.updateFade());
  }

  dayWord(d) {
    const a = dayStart(new Date()); const b = dayStart(d); const n = Math.round((b - a) / 86400e3);
    return n === 0 ? '' : n === 1 ? ' tomorrow' : ` ${new Date(d).toLocaleDateString(this.locale, { weekday: 'long' })}`;
  }

  timerRow(t) {
    if (t.cls !== 'timer') {
      return `<div class="row alarm"><span class="disc"><ha-icon icon="mdi:${t.cls === 'alarm' ? 'alarm' : 'bell-outline'}"></ha-icon></span>
        <span class="txt"><b class="num">${esc(this.hhmm(t.at))}${esc(this.dayWord(t.at))}</b><span>${esc(t.name ? cap(t.name) : t.cls === 'alarm' ? 'Alarm' : 'Reminder')}</span></span>
        <button class="pill" data-act="cancel" data-arg="${esc(t.id)}" data-name="${esc(t.name || t.cls)}"><ha-icon icon="mdi:close"></ha-icon>Cancel</button></div>`;
    }
    const label = t.name ? cap(t.name) : 'Timer';
    return `<div class="row timer"><span class="ring" aria-hidden="true"><svg viewBox="0 0 68 68"><circle class="track" cx="34" cy="34" r="30"/>
        <circle class="fill" cx="34" cy="34" r="30" data-ring="${t.at}" data-total="${t.total || ''}" stroke-dasharray="${RING_C.toFixed(1)}"/></svg></span>
      <span class="txt"><b class="cd num" data-deadline="${t.at}" role="timer" aria-label="${esc(label)}"></b><span>${esc(label)} · done at ${esc(this.hhmm(t.at))}</span></span>
      <button class="pill" data-act="cancel" data-arg="${esc(t.id)}" data-name="${esc(label)}"><ha-icon icon="mdi:close"></ha-icon>Cancel</button></div>`;
  }

  applianceRow(a) {
    return `<div class="row appliance"><span class="disc"><ha-icon icon="${esc(a.icon || 'mdi:timer-sand')}"></ha-icon></span>
      <span class="txt"><b class="cd num" data-deadline="${a.at}"></b><span>${esc(a.name || a.entity)} · done at ${esc(this.hhmm(a.at))}</span></span></div>`;
  }

  /* Countdowns and rings update in place once a second; nothing else re-renders. */
  tick() {
    const root = this.shadowRoot; if (!root) return;
    const now = Date.now();
    root.querySelectorAll('[data-deadline]').forEach((el) => {
      const left = (Number(el.dataset.deadline) - now) / 1000;
      el.innerHTML = left > 0 ? leftHtml(left) : 'Done';
    });
    root.querySelectorAll('[data-ring]').forEach((el) => {
      const total = Number(el.dataset.total); const left = Math.max(0, (Number(el.dataset.ring) - now) / 1000);
      el.setAttribute('stroke-dashoffset', (RING_C * (1 - (total > 0 ? Math.min(1, left / total) : 1))).toFixed(1));
    });
  }

  syncTicker() {
    const need = !!this.shadowRoot?.querySelector('[data-deadline]');
    if (need && !this.ticker) this.ticker = setInterval(() => this.tick(), 1000);
    if (!need && this.ticker) { clearInterval(this.ticker); this.ticker = null; }
  }

  updateFade() {
    const list = this.shadowRoot?.querySelector('.list'); if (!list) return;
    list.parentElement.classList.toggle('more', list.scrollHeight - list.clientHeight - list.scrollTop > 6);
  }

  act(act, el) {
    const arg = el.dataset.arg;
    if (act === 'start') {
      this.busy = `start:${arg}`; this.render();
      this.call('view_assist', 'set_timer', { entity_id: this.vaSensor, type: 'timer', time: `${Number(arg)} minutes` }, `Timer set for ${Number(arg)} minutes`);
      setTimeout(() => { if (this.busy === `start:${arg}`) { this.busy = ''; this.render(); } }, 10000);
    } else if (act === 'cancel') this.call('view_assist', 'cancel_timer', { timer_id: arg }, `${cap(el.dataset.name || 'Timer')} cancelled`);
  }

  styles() {
    return `
      .sub.warm{color:var(--warm)}
      main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 200px;gap:10px}
      .list-box{position:relative;min-height:0;display:flex;background:var(--panel);border-radius:var(--r-tile);overflow:hidden}
      .list{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:10px;display:flex;flex-direction:column;gap:8px;scrollbar-width:none}
      .list::-webkit-scrollbar{display:none}
      .list-box.more .list{-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 48px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 48px),transparent)}
      .row{flex:0 0 auto;display:flex;align-items:center;gap:14px;min-height:84px;padding:8px 10px;border-radius:var(--r-sm);background:var(--raised)}
      .row.timer{background:var(--glow),var(--raised);gap:10px}
      .txt{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
      .txt b{font-size:26px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .txt b.cd{font-size:34px;line-height:1.05;letter-spacing:-.01em}
      .txt b.cd u{text-decoration:none;font-family:var(--text-font);font-size:19px;font-weight:600;color:var(--muted);margin-left:3px;letter-spacing:0}
      .txt > span{font-size:17px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
      .row.timer .txt > span{color:var(--warm)}
      .ring{width:64px;height:64px;flex:0 0 64px}
      .ring svg{width:100%;height:100%;transform:rotate(-90deg)}
      .ring circle{fill:none;stroke-width:6}
      .ring .track{stroke:var(--raised-2)}
      .ring .fill{stroke:var(--warm);stroke-linecap:round;transition:stroke-dashoffset 1s linear}
      .disc{background:var(--raised-2)}
      .row.alarm .disc{color:var(--accent)}
      .row.appliance .txt b.cd{font-size:30px}
      .pill{height:56px;flex:0 0 auto;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 18px 0 14px;font-size:18px;font-weight:600;background:var(--raised-2);white-space:nowrap}
      .start{background:var(--panel);border-radius:var(--r-tile);padding:12px;display:flex;flex-direction:column;gap:10px;min-height:0}
      h2{margin:0 2px;font-size:17px;font-weight:600;color:var(--muted)}
      .quick{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:minmax(72px,1fr);gap:10px}
      .q{border-radius:var(--r-tile);display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--raised-2);min-height:72px}
      .q b{font-family:var(--num);font-size:34px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums}
      .q small{font-size:17px;color:var(--muted)}
      @media (prefers-reduced-motion:reduce){.ring .fill{transition:none}}`;
  }
}
define('lamplight-timers-card', LamplightTimersCard, 'Lamplight Timers', "View Assist timers with countdowns and quick-start buttons.");
