/* Agenda: today and tomorrow from the household calendars, side by side. All-day items first, then timed events with
 * their time, whose calendar it is and a short place. What's on now is warm with a live dot; earlier events are dimmed;
 * cancelled ones are struck through. One calendar.get_events call per calendar, so a broken calendar can't blank the
 * page; refreshed every 10 minutes, at midnight and whenever a calendar's state changes.
 *   type: custom:lamplight-agenda-card
 *   calendars:
 *     calendar.family: {name: Family, icon: mdi:home-heart}
 *     calendar.work: {name: Work, icon: mdi:briefcase-outline}
 */
import { LamplightCard, dayStart, define, esc } from '../core.js';

const DAY_MS = 86400e3;
const AGENDA_REFRESH_MS = 10 * 60e3;
const CANCELLED = /^\s*(cancel+ed)\s*:\s*/i;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
/* All-day events carry a plain date ("2026-10-02"); parse it as local midnight, not UTC. */
const parseWhen = (v) => {
  const s = typeof v === 'string' ? v : v?.dateTime || v?.date || '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [y, m, d] = s.split('-').map(Number); return { at: new Date(y, m - 1, d), allDay: true }; }
  return { at: new Date(s), allDay: false };
};
const shortPlace = (loc) => {
  const l = String(loc || '').trim();
  if (!l || /^https?:\/\//i.test(l)) return '';
  if (/teams/i.test(l)) return 'Teams';
  if (/zoom\.us|zoom meeting/i.test(l)) return 'Zoom';
  return l.split(/[,\n]/)[0].slice(0, 40);
};

export class LamplightAgendaCard extends LamplightCard {
  setConfig(config) {
    if (!config.calendars || typeof config.calendars !== 'object') throw new Error('calendars is required');
    super.setConfig(config);
    this.calIds = Array.isArray(config.calendars) ? config.calendars : Object.keys(config.calendars);
  }

  build() {
    this.built = true;
    this.shell('Agenda', '<main><section class="day today"></section><section class="day tomorrow"></section></main>', { sub: 'Loading…' });
    this.shadowRoot.querySelectorAll('.day').forEach((d) => d.addEventListener('scroll', () => this.updateFade(), { passive: true, capture: true }));
  }

  update() {
    const sig = this.calIds.map((id) => `${this.st(id)?.state}|${this.st(id)?.attributes?.message || ''}`).join(',');
    if (sig !== this.calSig) { this.calSig = sig; this.load(); }
  }

  connectedCallback() {
    super.connectedCallback();
    clearInterval(this.refresh);
    this.refresh = setInterval(() => {
      const day = dayStart(new Date()).getTime();
      if (Date.now() - (this.loadedAt || 0) > AGENDA_REFRESH_MS || day !== this.loadedDay) this.load(); else this.render();
    }, 60e3);
    if (this._hass && this.built) this.load();
  }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this.refresh); }

  async load() {
    if (!this._hass || this.loading) return;
    this.loading = true;
    const from = dayStart(new Date()); const to = addDays(from, 2);
    const results = await Promise.allSettled(this.calIds.map((id) => this._hass.callWS({ type: 'call_service', domain: 'calendar', service: 'get_events',
      target: { entity_id: id }, service_data: { start_date_time: from.toISOString(), end_date_time: to.toISOString() }, return_response: true })));
    const events = []; let failed = 0;
    results.forEach((r, i) => {
      if (r.status !== 'fulfilled') { failed += 1; return; }
      const id = this.calIds[i];
      for (const e of r.value?.response?.[id]?.events || []) {
        const s = parseWhen(e.start); const en = parseWhen(e.end);
        if (!Number.isFinite(s.at.getTime())) continue;
        const summary = String(e.summary || '').trim();
        events.push({ cal: id, summary: summary.replace(CANCELLED, '') || 'Busy', cancelled: CANCELLED.test(summary), allDay: s.allDay,
          start: s.at, end: Number.isFinite(en.at.getTime()) ? en.at : new Date(s.at.getTime() + (s.allDay ? DAY_MS : 3600e3)), place: shortPlace(e.location) });
      }
    });
    this.events = events; this.failed = failed === this.calIds.length;
    this.loadedAt = Date.now(); this.loadedDay = from.getTime();
    this.loading = false;
    this.render();
    requestAnimationFrame(() => this.revealNow());
  }

  /* After a load, scroll today's list so what's on now (or next) is in view; earlier events stay reachable above. */
  revealNow() {
    const ul = this.shadowRoot?.querySelector('.today .events'); if (!ul) return;
    const li = ul.querySelector('li.live, li:not(.past):not(.allday)'); if (!li) return;
    const over = li.offsetTop + li.offsetHeight - (ul.scrollTop + ul.clientHeight) + 16;
    if (over > 0) ul.scrollTop += over;
    this.updateFade();
  }

  dayEvents(day) {
    const d0 = day.getTime(); const d1 = addDays(day, 1).getTime();
    const list = (this.events || []).filter((e) => e.start.getTime() < d1 && e.end.getTime() > d0);
    return {
      allDay: list.filter((e) => e.allDay).sort((a, b) => a.summary.localeCompare(b.summary)),
      timed: list.filter((e) => !e.allDay).sort((a, b) => a.start - b.start || a.end - b.end),
    };
  }

  render() {
    const root = this.shadowRoot; if (!root || !this._hass) return;
    const today = dayStart(new Date()); const tomorrow = addDays(today, 1);
    const t = this.dayEvents(today); const now = Date.now();
    if (this.failed) this.setSub("Couldn't read the calendars");
    else {
      const live = t.timed.filter((e) => !e.cancelled && e.start.getTime() <= now && e.end.getTime() > now);
      const next = t.timed.find((e) => !e.cancelled && e.start.getTime() > now);
      const date = today.toLocaleDateString(this.locale, { weekday: 'long', day: 'numeric', month: 'long' });
      this.setSub(live.length ? `${date} · now: ${live[0].summary}` : next ? `${date} · next at ${this.hhmm(next.start)}` : `${date} · nothing else today`);
    }
    root.querySelector('.today').innerHTML = this.dayHtml('Today', today, t, now);
    root.querySelector('.tomorrow').innerHTML = this.dayHtml('Tomorrow', tomorrow, this.dayEvents(tomorrow), now);
    requestAnimationFrame(() => this.updateFade());
  }

  dayHtml(label, day, { allDay, timed }, now) {
    const date = day.toLocaleDateString(this.locale, { weekday: 'short', day: 'numeric', month: 'short' });
    const head = `<h2><b>${label}</b><span>${esc(date)}</span></h2>`;
    if (!this.events) return `${head}<div class="empty">Loading…</div>`;
    if (!allDay.length && !timed.length) {
      return `${head}<div class="empty"><span class="disc big"><ha-icon icon="mdi:calendar-blank-outline"></ha-icon></span><b>Nothing on</b><span>No plans in the calendars</span></div>`;
    }
    const all = allDay.map((e) => `<li class="allday ${e.cancelled ? 'cancelled' : ''}"><span class="disc sm"><ha-icon icon="${esc(this.calIcon(e.cal))}"></ha-icon></span>
        <span class="ev"><b>${esc(e.summary)}</b><small>${esc(this.calName(e.cal))} · all day${e.cancelled ? ' · cancelled' : ''}</small></span></li>`).join('');
    const items = timed.map((e) => {
      const live = !e.cancelled && e.start.getTime() <= now && e.end.getTime() > now;
      const past = e.end.getTime() <= now;
      const time = e.start < day ? 'Until' : this.hhmm(e.start);
      const meta = [this.calName(e.cal), live ? `until ${this.hhmm(e.end)}` : `to ${this.hhmm(e.end)}`, e.place, e.cancelled ? 'cancelled' : ''].filter(Boolean).join(' · ');
      return `<li class="${live ? 'live' : ''} ${past ? 'past' : ''} ${e.cancelled ? 'cancelled' : ''}">
        <span class="time num">${live ? '<i class="dot" aria-hidden="true"></i>Now' : esc(time)}</span>
        <span class="ev"><b>${esc(e.summary)}</b>${past ? '' : `<small>${esc(meta)}</small>`}</span></li>`;
    }).join('');
    return `${head}<ul class="events">${all}${items}</ul>`;
  }

  calConf(id) { return Array.isArray(this.config.calendars) ? {} : this.config.calendars[id] || {}; }
  calName(id) { return this.calConf(id).name || this.st(id)?.attributes?.friendly_name || id; }
  calIcon(id) { return this.calConf(id).icon || 'mdi:calendar-outline'; }

  updateFade() {
    this.shadowRoot?.querySelectorAll('.events').forEach((ul) => ul.classList.toggle('more', ul.scrollHeight - ul.clientHeight - ul.scrollTop > 6));
  }

  styles() {
    return `
      main{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .day{background:var(--panel);border-radius:var(--r-tile);padding:12px 12px 0;display:flex;flex-direction:column;min-height:0;min-width:0}
      .day h2{margin:0 4px 8px;display:flex;align-items:baseline;gap:10px;font-size:17px;font-weight:600;color:var(--muted);line-height:1.2}
      .day h2 b{font-size:26px;color:var(--text)}
      .events{position:relative;list-style:none;margin:0;padding:0 0 12px;flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;gap:6px;scrollbar-width:none}
      .events::-webkit-scrollbar{display:none}
      .events.more{-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 44px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 44px),transparent)}
      .events li{flex:0 0 auto;display:flex;align-items:flex-start;gap:12px;padding:8px 10px;border-radius:var(--r-sm);background:var(--raised);min-height:56px}
      .events li.allday{align-items:center;background:var(--raised-2)}
      .time{flex:0 0 58px;font-size:18px;font-weight:600;line-height:1.35;display:flex;align-items:center;gap:6px;white-space:nowrap}
      .ev{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.25}
      .ev b{font-size:19px;font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
      .ev small{font-size:16px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
      li.live{background:var(--glow),var(--raised);box-shadow:inset 0 0 0 2px var(--warm)}
      li.live .time,li.live small{color:var(--warm)}
      li.past{background:none;padding-top:2px;padding-bottom:2px;min-height:0}
      li.past .time,li.past .ev b{color:var(--muted);font-weight:400;font-size:17px}
      li.past .ev b{display:block;white-space:nowrap;text-overflow:ellipsis}
      li.cancelled .ev b{text-decoration:line-through;text-decoration-thickness:2px;color:var(--muted);font-weight:400}
      .disc.sm{width:40px;height:40px;flex-basis:40px} .disc.sm ha-icon{--mdc-icon-size:22px}
      .disc.big{width:64px;height:64px;flex-basis:64px} .disc.big ha-icon{--mdc-icon-size:34px}
      .empty{font-size:17px;padding:0 12px 12px}`;
  }
}
define('lamplight-agenda-card', LamplightAgendaCard, 'Lamplight Agenda', 'Today and tomorrow from your calendars, for a wall tablet.');
