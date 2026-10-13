/* Lamplight 1.2.0 for Home Assistant. https://github.com/HaydenGriffin/lamplight (MIT). Built from src/ by scripts/build.mjs. */

// src/core.js
var VERSION = "1.2.0";
var fontBase = () => globalThis.lamplightFontBase || new URL(".", import.meta.url).href;
var registerFonts = (base = fontBase()) => {
  if (document.getElementById("lamplight-fonts")) return;
  const style = document.createElement("style");
  style.id = "lamplight-fonts";
  style.textContent = `
    @font-face{font-family:'Lamplight Text';font-weight:200 800;font-display:swap;src:url(${base}ahn-latin.woff2) format('woff2')}
    @font-face{font-family:'Lamplight Text';font-weight:200 800;font-display:swap;src:url(${base}ahn-latin-ext.woff2) format('woff2');unicode-range:U+0100-024F,U+1E00-1EFF}
    @font-face{font-family:'Lamplight Text';font-weight:200 800;font-display:swap;src:url(${base}lexend-latin.woff2) format('woff2');unicode-range:U+0030-0039}
    @font-face{font-family:Lexend;font-weight:200 800;font-display:swap;src:url(${base}lexend-latin.woff2) format('woff2')}`;
  document.head.appendChild(style);
};
registerFonts();
var esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var dayStart = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
var cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
var loadState = ({ loading = false, error = null, count = 0 } = {}) => count > 0 ? "ready" : error ? "failed" : loading ? "loading" : "empty";
var failedHtml = (what) => `<div class="load-failed" role="status"><span class="lf-disc" aria-hidden="true"><ha-icon icon="mdi:cloud-alert-outline"></ha-icon></span>
    <b>Couldn't load ${esc(what)}</b><span>Check the connection, then try again.</span>
    <button class="lf-retry" data-act="retry"><ha-icon icon="mdi:refresh"></ha-icon>Retry</button></div>`;
var PHOTO_LOOK = { blur: 26, brightness: 0.36, saturate: 1.15 };
var photoFilter = (look, scale = 1) => `blur(${+(look.blur * scale).toFixed(2)}px) brightness(${look.brightness}) saturate(${look.saturate})`;
var softened = /* @__PURE__ */ new Map();
var preblur = (url, look = PHOTO_LOOK, width = 160) => {
  if (!url) return Promise.resolve(null);
  const key = `${url}|${photoFilter(look)}`;
  if (!softened.has(key)) {
    softened.set(key, new Promise((resolve) => {
      try {
        const img = new Image();
        img.decoding = "async";
        const abs = new URL(url, location.href);
        if (abs.origin !== location.origin) img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const w = width;
            const h = Math.max(1, Math.round(w * (img.naturalHeight / img.naturalWidth || 0.625)));
            const scale = w / 788;
            const pad = Math.ceil(look.blur * scale * 2);
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx || !("filter" in ctx)) {
              resolve(null);
              return;
            }
            ctx.filter = photoFilter(look, scale);
            ctx.drawImage(img, -pad, -pad, w + pad * 2, h + pad * 2);
            resolve(canvas.toDataURL("image/jpeg", 0.86));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = abs.href;
      } catch {
        resolve(null);
      }
    }));
    if (softened.size > 12) softened.delete(softened.keys().next().value);
  }
  return softened.get(key);
};
var TOAST_MS = 2500;
var UNDO_MS = 8e3;
var ERROR_MS = 5e3;
var TOKENS = `
  :host{display:block;
    --page:var(--l-page,#0b0c0f);--panel:var(--l-panel,rgba(22,24,29,.74));--panel-solid:#17191e;--raised:var(--l-raised,rgba(255,255,255,.08));--raised-2:var(--l-raised-2,rgba(255,255,255,.14));--line:rgba(255,255,255,.07);
    --text:#f4f2ee;--muted:#b9b4ac;--accent:#80d8ff;--accent-ink:#04222e;--warm:#ffc76b;--warm-ink:#2a1a04;--warm-rgb:255,186,84;--warm-soft:rgba(var(--warm-rgb),.16);--warm-glow:rgba(var(--warm-rgb),.45);--ok:#7ee2a8;--warn:#ff9d5c;--alert:#ff8a80;
    --dimmer:rgba(0,0,0,.55);--toast-ground:rgba(12,13,16,.94);--error-ground:#5a1616;--error-text:#ffd7d2;--danger-ink:#2b0a07;--r-tile:22px;--r-sm:14px;
    --glow:radial-gradient(120% 100% at 0% 0%,rgba(var(--warm-rgb),.30),rgba(var(--warm-rgb),0) 62%);
    --text-font:'Lamplight Text','Atkinson Hyperlegible Next',Roboto,Arial,sans-serif;--num:Lexend,'Atkinson Hyperlegible Next',sans-serif}`;
var BASE_CSS = `${TOKENS}
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
var fitted = /* @__PURE__ */ new Set();
var fitObserver = null;
var fitFrame = 0;
var place = (card) => {
  card.style.setProperty("--l-top", `${Math.max(0, card.getBoundingClientRect().top)}px`);
  card.resized();
};
var placeAll = () => {
  if (fitFrame) return;
  fitFrame = requestAnimationFrame(() => {
    fitFrame = 0;
    fitted.forEach(place);
  });
};
var fit = (card) => {
  if (!fitted.size) {
    window.addEventListener("resize", placeAll);
    window.addEventListener("lamplight-layout", placeAll);
    if (typeof ResizeObserver === "function") fitObserver = new ResizeObserver(placeAll);
  }
  fitted.add(card);
  fitObserver?.observe(card);
  requestAnimationFrame(() => place(card));
  return () => {
    if (!fitted.delete(card)) return;
    fitObserver?.unobserve(card);
    if (fitted.size) return;
    fitObserver?.disconnect();
    fitObserver = null;
    window.removeEventListener("resize", placeAll);
    window.removeEventListener("lamplight-layout", placeAll);
  };
};
var LamplightCard = class extends HTMLElement {
  setConfig(config) {
    this.config = { ...this.defaults(), ...config };
    this.nav = config.nav || {};
  }
  defaults() {
    return {};
  }
  set hass(hass) {
    this._hass = hass;
    if (!this.built) this.build();
    this.update();
  }
  get hass() {
    return this._hass;
  }
  getCardSize() {
    return 10;
  }
  update() {
  }
  st(id) {
    return id ? this._hass?.states[id] : void 0;
  }
  get locale() {
    return this.config.locale || this._hass?.locale?.language || void 0;
  }
  hhmm(d) {
    return new Date(d).toLocaleTimeString(this.locale, { hour: "2-digit", minute: "2-digit" });
  }
  get vaSensor() {
    if (this.config.view_assist_sensor) return this.config.view_assist_sensor;
    try {
      return localStorage.getItem("view_assist_sensor") || null;
    } catch {
      return null;
    }
  }
  get homePath() {
    return this.nav.home || this.st(this.vaSensor)?.attributes?.home_screen || "";
  }
  backLabel() {
    if (window.lamplightNav?.backLabel) return window.lamplightNav.backLabel();
    return this.nav.back_label || "Back";
  }
  /* The shell: header, the card's own main, a toast. */
  shell(title, main, { sub = "", extra = "" } = {}) {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}${this.styles()}</style><ha-card><header class="head">
        <button class="icon" data-act="home" aria-label="Back to clock"><ha-icon icon="mdi:clock-outline"></ha-icon></button>
        <button class="back" data-act="back"><ha-icon icon="mdi:arrow-left"></ha-icon><span class="bl"></span></button>
        <div class="title"><h1>${esc(title)}</h1><span class="sub">${esc(sub)}</span></div>${extra}</header>
      ${main}<div class="toast" role="status" aria-live="polite" hidden></div></ha-card>`;
    this.shadowRoot.addEventListener("click", (ev) => {
      const el = ev.composedPath().find((n) => n?.dataset && "act" in n.dataset);
      if (!el || el.disabled) return;
      if (el.dataset.act === "home") this.goHome();
      else if (el.dataset.act === "back") this.goBack();
      else if (el.dataset.act === "retry") this.retry();
      else if (el.dataset.act === "undo") {
        const run = this.undoRun;
        this.hideToast();
        run?.();
      } else this.act(el.dataset.act, el);
    });
    if (this.isConnected) {
      this.startFit();
      this.softenPhoto();
    }
    this.syncNav();
  }
  act() {
  }
  retry() {
  }
  resized() {
  }
  styles() {
    return "";
  }
  connectedCallback() {
    this.syncNav();
    this.startFit();
    this.softenPhoto();
  }
  disconnectedCallback() {
    this.stopFit();
    this.hideToast();
  }
  startFit() {
    if (this.shadowRoot && !this.unfit) this.unfit = fit(this);
  }
  stopFit() {
    this.unfit?.();
    this.unfit = null;
  }
  /* Shows the page photo pre-blurred (see preblur) when --l-photo is one image; otherwise the live blur stays. */
  async softenPhoto() {
    if (!this.shadowRoot || typeof getComputedStyle !== "function") return;
    const css = getComputedStyle(this);
    const url = css.getPropertyValue("--l-photo-show").trim() === "0" ? "" : /^\s*url\((['"]?)(.+?)\1\)\s*$/.exec(css.getPropertyValue("--l-photo"))?.[2] || "";
    if (url === this.softFor) return;
    this.softFor = url;
    const soft = await preblur(url);
    if (this.softFor !== url) return;
    if (soft) {
      this.style.setProperty("--l-photo-soft", `url("${soft}")`);
      this.style.setProperty("--l-photo-filter", "none");
    } else {
      this.style.removeProperty("--l-photo-soft");
      this.style.removeProperty("--l-photo-filter");
    }
  }
  /* HA keeps views alive, so the header is refreshed each time the card is shown. */
  syncNav() {
    const root = this.shadowRoot;
    if (!root) return;
    const home = root.querySelector(".icon[data-act=home]");
    const back = root.querySelector(".back");
    if (home) home.hidden = !(window.lamplightNav?.home || this.homePath);
    if (back) {
      const label = this.backLabel();
      back.hidden = !label;
      back.querySelector(".bl").textContent = label;
      back.setAttribute("aria-label", `Back to ${label}`);
    }
  }
  setSub(text, cls = "") {
    const el = this.shadowRoot?.querySelector(".sub");
    if (el) {
      el.textContent = text;
      el.className = `sub ${cls}`;
    }
  }
  goHome() {
    return window.lamplightNav?.home ? window.lamplightNav.home() : this.navigate(this.homePath);
  }
  goBack() {
    if (window.lamplightNav?.back) return window.lamplightNav.back();
    if (this.nav.back) return this.navigate(this.nav.back);
    return history.back();
  }
  async navigate(path) {
    if (!path) return;
    const sensor = this.vaSensor;
    try {
      if (sensor && this.st(sensor)) await this._hass.callService("view_assist", "navigate", { device: sensor, path, revert_timeout: 0 });
    } catch {
    }
    if (location.pathname !== path) {
      history.pushState(null, "", path);
      window.dispatchEvent(new Event("location-changed"));
    }
  }
  /* A short pill at the top. With `undo` (a function) it grows an Undo button and stays UNDO_MS; a tap on Undo runs it. */
  toast(text, error = false, ms = TOAST_MS, undo = null) {
    const el = this.shadowRoot?.querySelector(".toast");
    if (!el) return;
    this.undoRun = undo;
    el.innerHTML = `<span class="t-msg">${esc(text)}</span>${undo ? '<button class="undo" data-act="undo"><ha-icon icon="mdi:undo"></ha-icon>Undo</button>' : ""}`;
    el.classList.toggle("error", error);
    el.classList.toggle("has-undo", !!undo);
    el.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.hideToast(), error ? Math.max(ms, ERROR_MS) : undo ? Math.max(ms, UNDO_MS) : ms);
  }
  hideToast() {
    clearTimeout(this.toastTimer);
    this.undoRun = null;
    const el = this.shadowRoot?.querySelector(".toast");
    if (el) el.hidden = true;
  }
  async call(domain, service, data, done, undo = null) {
    if (done) this.toast(done, false, TOAST_MS, undo);
    try {
      await this._hass.callService(domain, service, data);
      return true;
    } catch (e) {
      this.toast(`That didn't work: ${e?.message || e}`, true);
      return false;
    }
  }
};
var define = (tag, cls, name, description) => {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  window.customCards = window.customCards || [];
  if (name && !window.customCards.some((c) => c.type === tag)) {
    window.customCards.push({ type: tag, name, description, preview: false, documentationURL: "https://github.com/HaydenGriffin/lamplight" });
  }
  return customElements.get(tag);
};

// src/cards/agenda.js
var DAY_MS = 864e5;
var AGENDA_REFRESH_MS = 10 * 6e4;
var CANCELLED = /^\s*(cancel+ed)\s*:\s*/i;
var addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
var parseWhen = (v) => {
  const s = typeof v === "string" ? v : v?.dateTime || v?.date || "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return { at: new Date(y, m - 1, d), allDay: true };
  }
  return { at: new Date(s), allDay: false };
};
var shortPlace = (loc) => {
  const l = String(loc || "").trim();
  if (!l || /^https?:\/\//i.test(l)) return "";
  if (/teams/i.test(l)) return "Teams";
  if (/zoom\.us|zoom meeting/i.test(l)) return "Zoom";
  return l.split(/[,\n]/)[0].slice(0, 40);
};
var LamplightAgendaCard = class extends LamplightCard {
  setConfig(config) {
    if (!config.calendars || typeof config.calendars !== "object") throw new Error("calendars is required");
    super.setConfig(config);
    this.calIds = Array.isArray(config.calendars) ? config.calendars : Object.keys(config.calendars);
  }
  build() {
    this.built = true;
    this.shell("Agenda", '<main><section class="day today"></section><section class="day tomorrow"></section></main>', { sub: "Loading…" });
    this.shadowRoot.querySelectorAll(".day").forEach((d) => d.addEventListener("scroll", () => this.updateFade(), { passive: true, capture: true }));
  }
  update() {
    const sig = this.calIds.map((id) => `${this.st(id)?.state}|${this.st(id)?.attributes?.message || ""}`).join(",");
    if (sig !== this.calSig) {
      this.calSig = sig;
      this.load();
    }
  }
  connectedCallback() {
    super.connectedCallback();
    clearInterval(this.refresh);
    this.refresh = setInterval(() => {
      const day = dayStart(/* @__PURE__ */ new Date()).getTime();
      if (Date.now() - (this.loadedAt || 0) > AGENDA_REFRESH_MS || day !== this.loadedDay) this.load();
      else this.render();
    }, 6e4);
    if (this._hass && this.built) this.load();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.refresh);
  }
  async load() {
    if (!this._hass || this.loading) return;
    this.loading = true;
    const from = dayStart(/* @__PURE__ */ new Date());
    const to = addDays(from, 2);
    const results = await Promise.allSettled(this.calIds.map((id) => this._hass.callWS({
      type: "call_service",
      domain: "calendar",
      service: "get_events",
      target: { entity_id: id },
      service_data: { start_date_time: from.toISOString(), end_date_time: to.toISOString() },
      return_response: true
    })));
    const events = [];
    let failed = 0;
    results.forEach((r, i) => {
      if (r.status !== "fulfilled") {
        failed += 1;
        return;
      }
      const id = this.calIds[i];
      for (const e of r.value?.response?.[id]?.events || []) {
        const s = parseWhen(e.start);
        const en = parseWhen(e.end);
        if (!Number.isFinite(s.at.getTime())) continue;
        const summary = String(e.summary || "").trim();
        events.push({
          cal: id,
          summary: summary.replace(CANCELLED, "") || "Busy",
          cancelled: CANCELLED.test(summary),
          allDay: s.allDay,
          start: s.at,
          end: Number.isFinite(en.at.getTime()) ? en.at : new Date(s.at.getTime() + (s.allDay ? DAY_MS : 36e5)),
          place: shortPlace(e.location)
        });
      }
    });
    this.events = events;
    this.read = this.calIds.length - failed;
    this.failed = failed > 0;
    this.loadedAt = Date.now();
    this.loadedDay = from.getTime();
    this.loading = false;
    this.render();
    requestAnimationFrame(() => this.revealNow());
  }
  retry() {
    this.events = null;
    this.render();
    this.load();
  }
  /* After a load, scroll today's list so what's on now (or next) is in view; earlier events stay reachable above. */
  revealNow() {
    const ul = this.shadowRoot?.querySelector(".today .events");
    if (!ul) return;
    const li = ul.querySelector("li.live, li:not(.past):not(.allday)");
    if (!li) return;
    const over = li.offsetTop + li.offsetHeight - (ul.scrollTop + ul.clientHeight) + 16;
    if (over > 0) ul.scrollTop += over;
    this.updateFade();
  }
  dayEvents(day) {
    const d0 = day.getTime();
    const d1 = addDays(day, 1).getTime();
    const list = (this.events || []).filter((e) => e.start.getTime() < d1 && e.end.getTime() > d0);
    return {
      allDay: list.filter((e) => e.allDay).sort((a, b) => a.summary.localeCompare(b.summary)),
      timed: list.filter((e) => !e.allDay).sort((a, b) => a.start - b.start || a.end - b.end)
    };
  }
  render() {
    const root = this.shadowRoot;
    if (!root || !this._hass) return;
    const today = dayStart(/* @__PURE__ */ new Date());
    const tomorrow = addDays(today, 1);
    const t = this.dayEvents(today);
    const now = Date.now();
    const state = this.events ? loadState({ error: this.failed, count: this.read }) : "loading";
    root.querySelector("main").classList.toggle("failed", state === "failed");
    if (state === "failed") {
      this.setSub("Couldn't read the calendars", "warn");
      root.querySelector(".today").innerHTML = failedHtml(this.calIds.length > 1 ? "the calendars" : "the calendar");
      root.querySelector(".tomorrow").innerHTML = "";
      return;
    }
    if (state === "loading") this.setSub("Loading…");
    else {
      const live = t.timed.filter((e) => !e.cancelled && e.start.getTime() <= now && e.end.getTime() > now);
      const next = t.timed.find((e) => !e.cancelled && e.start.getTime() > now);
      const date = today.toLocaleDateString(this.locale, { weekday: "long", day: "numeric", month: "long" });
      this.setSub(live.length ? `${date} · now: ${live[0].summary}` : next ? `${date} · next at ${this.hhmm(next.start)}` : `${date} · nothing else today`);
    }
    root.querySelector(".today").innerHTML = this.dayHtml("Today", today, t, now);
    root.querySelector(".tomorrow").innerHTML = this.dayHtml("Tomorrow", tomorrow, this.dayEvents(tomorrow), now);
    requestAnimationFrame(() => this.updateFade());
  }
  dayHtml(label, day, { allDay, timed }, now) {
    const date = day.toLocaleDateString(this.locale, { weekday: "short", day: "numeric", month: "short" });
    const head = `<h2><b>${label}</b><span>${esc(date)}</span></h2>`;
    if (!this.events) return `${head}<div class="empty">Loading…</div>`;
    if (!allDay.length && !timed.length) {
      return `${head}<div class="empty"><span class="disc big"><ha-icon icon="mdi:calendar-blank-outline"></ha-icon></span><b>Nothing on</b><span>No plans in the calendars</span></div>`;
    }
    const all = allDay.map((e) => `<li class="allday ${e.cancelled ? "cancelled" : ""}"><span class="disc sm"><ha-icon icon="${esc(this.calIcon(e.cal))}"></ha-icon></span>
        <span class="ev"><b>${esc(e.summary)}</b><small>${esc(this.calName(e.cal))} · all day${e.cancelled ? " · cancelled" : ""}</small></span></li>`).join("");
    const items = timed.map((e) => {
      const live = !e.cancelled && e.start.getTime() <= now && e.end.getTime() > now;
      const past = e.end.getTime() <= now;
      const time = e.start < day ? "Until" : this.hhmm(e.start);
      const meta = [this.calName(e.cal), live ? `until ${this.hhmm(e.end)}` : `to ${this.hhmm(e.end)}`, e.place, e.cancelled ? "cancelled" : ""].filter(Boolean).join(" · ");
      return `<li class="${live ? "live" : ""} ${past ? "past" : ""} ${e.cancelled ? "cancelled" : ""}">
        <span class="time num">${live ? '<i class="dot" aria-hidden="true"></i>Now' : esc(time)}</span>
        <span class="ev"><b>${esc(e.summary)}</b>${past ? "" : `<small>${esc(meta)}</small>`}</span></li>`;
    }).join("");
    return `${head}<ul class="events">${all}${items}</ul>`;
  }
  calConf(id) {
    return Array.isArray(this.config.calendars) ? {} : this.config.calendars[id] || {};
  }
  calName(id) {
    return this.calConf(id).name || this.st(id)?.attributes?.friendly_name || id;
  }
  calIcon(id) {
    return this.calConf(id).icon || "mdi:calendar-outline";
  }
  updateFade() {
    this.shadowRoot?.querySelectorAll(".events").forEach((ul) => ul.classList.toggle("more", ul.scrollHeight - ul.clientHeight - ul.scrollTop > 6));
  }
  styles() {
    return `
      main{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}
      main.failed{grid-template-columns:1fr} main.failed .tomorrow{display:none} main.failed .today{padding-bottom:12px}
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
};
define("lamplight-agenda-card", LamplightAgendaCard, "Lamplight Agenda", "Today and tomorrow from your calendars, for a wall tablet.");

// src/cards/help.js
var ASK_TIMEOUT_MS = 25e3;
var FOLLOW_UP_MS = 9e4;
var ARM_MS = 4e3;
var REPLY_MS = 7e3;
var LamplightHelpCard = class extends LamplightCard {
  setConfig(config) {
    if (!Array.isArray(config.categories) || !config.categories.length) throw new Error("categories is required");
    super.setConfig(config);
    this.sel = 0;
    this.asking = false;
    this.armed = null;
  }
  defaults() {
    return { agent_id: "conversation.home_assistant", wake_phrase: "Okay Nabu", rooms: {} };
  }
  get cats() {
    return this.config.categories;
  }
  /* Read-only (guests in, say): the page is a list of what to say, and nothing runs from a tap. */
  get readOnly() {
    return this.st(this.config.read_only_entity)?.state === "on";
  }
  get subText() {
    return this.readOnly ? `Start with "${this.config.wake_phrase}", then say it` : "Tap an example to try it for real";
  }
  get roomName() {
    return this.config.rooms[this.vaSensor] || "";
  }
  fill(text) {
    return this.roomName ? text.replace(/\{room\}/g, this.roomName) : text.replace(/,? in the \{room\}/g, "").replace(/\{room\}/g, "here");
  }
  build() {
    this.built = true;
    this.shell(
      this.config.title || "What can I say?",
      `<main><nav class="cats-wrap" aria-label="Categories"><div class="cats scroll" role="tablist"></div>
        <span class="fade" hidden><ha-icon icon="mdi:chevron-down"></ha-icon>More</span></nav><section class="panel"></section></main>`,
      { sub: this.subText }
    );
    this.shadowRoot.addEventListener("scroll", (ev) => this.fadeFor(ev.target), true);
    this.shownReadOnly = this.readOnly;
    this.renderCats();
    this.renderPanel();
  }
  update() {
    if (this.readOnly === this.shownReadOnly) return;
    this.shownReadOnly = this.readOnly;
    this.disarm();
    this.setSub(this.subText);
    this.renderPanel();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.armTimer);
  }
  renderCats() {
    this.shadowRoot.querySelector(".cats").innerHTML = this.cats.map((c, i) => `<button class="cat ${i === this.sel ? "sel" : ""}" role="tab" aria-selected="${i === this.sel}" data-act="cat" data-i="${i}">
      <ha-icon icon="${esc(c.icon || "mdi:comment-text-outline")}"></ha-icon><span>${esc(c.name)}</span></button>`).join("");
    this.revealSelected();
  }
  /* Keep the chosen category fully in view, clear of the "More" hint, in the scrolling list. */
  revealSelected() {
    const list = this.shadowRoot.querySelector(".cats");
    const b = list.querySelector(".sel");
    if (!b) return;
    const room = 44;
    if (b.offsetTop < list.scrollTop) list.scrollTop = b.offsetTop;
    else if (b.offsetTop + b.offsetHeight > list.scrollTop + list.clientHeight - room) list.scrollTop = b.offsetTop + b.offsetHeight - list.clientHeight + room;
    this.fadeFor(list);
  }
  renderPanel() {
    const c = this.cats[this.sel];
    const wake = esc(`${this.config.wake_phrase},`);
    const say = (e) => `<span class="say"><em>${wake}</em> ${esc(this.fill(e.say))}${e.note ? `<small>${esc(e.note)}</small>` : ""}</span>`;
    const still = this.readOnly;
    const rows = (c.examples || []).map((e, i) => e.tap === false || still ? `<div class="ex still">${say(e)}</div>` : `<button class="ex" data-act="try" data-i="${i}">${say(e)}<span class="go"><ha-icon icon="mdi:play"></ha-icon></span></button>`).join("");
    this.shadowRoot.querySelector(".panel").innerHTML = `<div class="p-head"><span class="disc"><ha-icon icon="${esc(c.icon || "mdi:comment-text-outline")}"></ha-icon></span>
        <div class="p-title"><h2>${esc(c.name)}</h2>${c.hint ? `<span>${esc(c.hint)}</span>` : ""}</div></div>
      <div class="ex-wrap"><div class="exs scroll">${rows}${c.tip ? `<p class="tip"><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon><span>${esc(c.tip)}</span></p>` : ""}</div>
        <span class="fade" hidden><ha-icon icon="mdi:chevron-down"></ha-icon>More</span></div>`;
    this.fadeFor(this.shadowRoot.querySelector(".exs"));
  }
  /* A scrolling list shows a "More" hint at its foot until it has been scrolled to the end. */
  fadeFor(el) {
    if (!el?.classList?.contains("scroll")) return;
    const fade = el.parentElement?.querySelector(".fade");
    if (!fade) return;
    fade.hidden = !(el.scrollHeight - el.clientHeight > 8 && el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  }
  act(act, el) {
    const i = Number(el.dataset.i);
    if (act === "cat") this.select(i);
    else if (act === "try") this.tryExample(i, el);
  }
  select(i) {
    if (i === this.sel) return;
    this.sel = i;
    this.armed = null;
    this.shadowRoot.querySelectorAll(".cat").forEach((b, n) => {
      b.classList.toggle("sel", n === i);
      b.setAttribute("aria-selected", String(n === i));
    });
    this.renderPanel();
    this.revealSelected();
  }
  async tryExample(i, btn) {
    if (this.asking || this.readOnly) return;
    const ex = this.cats[this.sel].examples[i];
    if (!ex) return;
    if (ex.confirm && this.armed !== `${this.sel}:${i}`) {
      this.arm(`${this.sel}:${i}`, btn);
      return;
    }
    this.disarm();
    this.asking = true;
    btn.classList.add("busy");
    btn.setAttribute("aria-busy", "true");
    btn.querySelector(".go").innerHTML = '<span class="ask">Asking…</span>';
    try {
      const msg = { type: "conversation/process", text: this.fill(ex.run || ex.say), agent_id: ex.agent || this.config.agent_id };
      if (!ex.agent && this.conv && Date.now() - this.conv.at < FOLLOW_UP_MS) msg.conversation_id = this.conv.id;
      let timer;
      const limit = new Promise((_, no) => {
        timer = setTimeout(() => no(new Error("no answer yet")), ASK_TIMEOUT_MS);
      });
      const r = await Promise.race([this._hass.callWS(msg), limit]);
      clearTimeout(timer);
      if (r?.conversation_id && !ex.agent) this.conv = { id: r.conversation_id, at: Date.now() };
      this.toast(r?.response?.speech?.plain?.speech || "Done", false, REPLY_MS);
    } catch (e) {
      this.toast(`That didn't work: ${e?.message || e}`, true);
    }
    this.asking = false;
    if (btn.isConnected) {
      btn.classList.remove("busy");
      btn.removeAttribute("aria-busy");
      btn.querySelector(".go").innerHTML = '<ha-icon icon="mdi:play"></ha-icon>';
    }
  }
  /* First tap on a `confirm` example: the row turns into "Tap again" for ARM_MS. */
  arm(key, btn) {
    this.disarm();
    this.armed = key;
    btn.classList.add("armed");
    btn.querySelector(".go").innerHTML = '<span class="ask">Tap again</span>';
    this.armTimer = setTimeout(() => this.disarm(), ARM_MS);
  }
  disarm() {
    clearTimeout(this.armTimer);
    this.armed = null;
    this.shadowRoot.querySelectorAll(".ex.armed").forEach((b) => {
      b.classList.remove("armed");
      b.querySelector(".go").innerHTML = '<ha-icon icon="mdi:play"></ha-icon>';
    });
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
};
define("lamplight-help-card", LamplightHelpCard, "Lamplight Help", "What can I say? A tappable voice cheat-sheet.");

// src/cards/info.js
var FONT_MAX = 46;
var FONT_MIN = 24;
var FONT_STEP = 2;
var OWN_PATHS = /\/(info|infopic)\/?$/;
var lastPage = null;
var notePage = () => {
  const p = location.pathname;
  if (!OWN_PATHS.test(p)) lastPage = p;
};
notePage();
window.addEventListener("location-changed", notePage);
window.addEventListener("popstate", notePage);
var MISFIRE = [
  /hasn'?t been defined/i,
  /\bisn'?t defined\b/i,
  /couldn'?t understand/i,
  /not (?:sure|aware) (?:what|of)/i,
  /^no (?:device|entity|area|timer)s?\b.{0,30}\b(?:named|called|found)\b/i,
  /^sorry,? i (?:didn'?t|did not|can'?t|cannot)/i,
  /unexpected error/i,
  /^(?:hello|hi)[.!,]? i'?m (?:here|ready) to help/i,
  /what can i do for you(?: today)?\??$/i
];
var reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var isMisfire = (text, wake = "") => {
  const t = String(text || "").trim();
  if (!t || t.length >= 140) return false;
  const bare = wake ? new RegExp(`^["']?${reEscape(String(wake).trim())}[.!?,]*["']?$`, "i") : null;
  return MISFIRE.some((re) => re.test(t)) || !!bare?.test(t);
};
var formatMessage = (text) => esc(String(text ?? "").trim()).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^[ \t]*[*-][ \t]+/gm, "• ");
var LamplightInfoCard = class extends LamplightCard {
  defaults() {
    return { show_image: false, wake_phrase: "" };
  }
  build() {
    this.built = true;
    this.shell("Assistant", "<main></main>", { extra: '<button class="keep" data-act="keep"></button>' });
  }
  update() {
    const a = this.st(this.vaSensor)?.attributes || {};
    const sig = JSON.stringify([a.title, a.message, a.image, a.alert_data, a.mode, location.search]);
    if (sig === this.sig) return;
    if (a.message !== this.lastMessage) {
      this.lastMessage = a.message;
      this.saidAt = Date.now();
    }
    this.sig = sig;
    this.render();
  }
  resized() {
    this.fitText();
  }
  backLabel() {
    if (window.lamplightNav?.backLabel) return window.lamplightNav.backLabel();
    return !lastPage || lastPage === this.homePath ? "" : this.nav.back_label || "Back";
  }
  goBack() {
    return !lastPage || lastPage === this.homePath ? this.goHome() : this.navigate(lastPage);
  }
  render() {
    const root = this.shadowRoot;
    if (!root || !this._hass) return;
    this.syncNav();
    const a = this.st(this.vaSensor)?.attributes || {};
    const q = new URLSearchParams(location.search || "");
    const alert = q.get("alert") === "1" && a.alert_data && typeof a.alert_data === "object" ? a.alert_data : null;
    const title = String(alert ? alert.header || "Alert" : a.title || "").trim();
    const message = String(alert ? [alert.line1, alert.line2].filter(Boolean).join("\n") : a.message || "").trim();
    const image = this.config.show_image || q.get("pic") === "1" ? String(a.image || "").trim() : "";
    const kept = a.mode === "hold";
    root.querySelector("h1").textContent = title || "Assistant";
    const said = `said at ${this.hhmm(this.saidAt || Date.now())}`;
    this.setSub(!message ? "" : title ? `Assistant · ${said}` : cap(said));
    const keep = root.querySelector(".keep");
    keep.className = `keep ${kept ? "on" : ""}`;
    keep.hidden = !message && !image;
    keep.setAttribute("aria-pressed", String(kept));
    keep.setAttribute("aria-label", kept ? "Kept on screen. Tap to let it close" : "Keep on screen");
    keep.innerHTML = `<ha-icon icon="${kept ? "mdi:pin" : "mdi:pin-outline"}"></ha-icon>${kept ? "Kept" : "Keep"}`;
    const main = root.querySelector("main");
    main.className = image ? "pic" : "";
    if (!message && !image) {
      main.innerHTML = `<section class="msg empty"><span class="disc big"><ha-icon icon="mdi:message-text-outline"></ha-icon></span>
        <b>Nothing to show</b><span>Ask something and the answer shows here.</span></section>`;
      return;
    }
    if (!alert && !image && isMisfire(message, this.config.wake_phrase)) {
      keep.hidden = true;
      root.querySelector("h1").textContent = "Assistant";
      const wake = String(this.config.wake_phrase || "").trim();
      main.innerHTML = `<section class="msg empty misfire"><span class="disc big"><ha-icon icon="mdi:microphone-question"></ha-icon></span>
        <b>Didn't catch that</b><span>${wake ? `Say "${esc(wake)}" and try again.` : "Try asking again."}</span><small>It replied: ${esc(message)}</small></section>`;
      return;
    }
    main.innerHTML = `${image ? `<figure class="img"><img src="${esc(image)}" alt=""></figure>` : ""}
      <section class="msg"><div class="scroll"><p class="txt">${formatMessage(message)}</p></div>
        <span class="more" hidden><ha-icon icon="mdi:chevron-down"></ha-icon>More below</span></section>`;
    const img = main.querySelector("img");
    if (img) img.addEventListener("error", () => {
      main.className = "";
      img.parentElement.remove();
      this.fitText();
    });
    main.querySelector(".scroll").addEventListener("scroll", () => this.updateMore(), { passive: true });
    requestAnimationFrame(() => this.fitText());
  }
  /* The largest size (46 → 24px) at which the whole message fits; below that it scrolls. */
  fitText() {
    const scroll = this.shadowRoot?.querySelector(".scroll");
    const txt = scroll?.querySelector(".txt");
    if (!scroll || !txt || !scroll.clientHeight) return;
    let size = FONT_MAX;
    txt.style.fontSize = `${size}px`;
    while (size > FONT_MIN && scroll.scrollHeight > scroll.clientHeight + 1) {
      size -= FONT_STEP;
      txt.style.fontSize = `${size}px`;
    }
    txt.classList.toggle("long", size <= 30);
    this.updateMore();
  }
  updateMore() {
    const msg = this.shadowRoot?.querySelector(".msg");
    const scroll = msg?.querySelector(".scroll");
    if (!scroll) return;
    const more = scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop > 6;
    msg.classList.toggle("more", more);
    msg.querySelector(".more").hidden = !more;
  }
  async act(act) {
    if (act !== "keep") return;
    const sensor = this.vaSensor;
    if (!sensor) return;
    const kept = this.st(sensor)?.attributes?.mode === "hold";
    try {
      await this._hass.callService("view_assist", "set_state", { entity_id: sensor, mode: kept ? "normal" : "hold" });
    } catch {
    }
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
      .msg.empty{align-items:center;justify-content:center;gap:8px;text-align:center;color:var(--muted);font-size:19px}
      .msg.misfire small{margin-top:10px;font-size:16px;max-width:80%;overflow-wrap:anywhere}`;
  }
};
define("lamplight-info-card", LamplightInfoCard, "Lamplight Info", "The assistant's last answer, large, for View Assist tablets.");

// src/cards/timers.js
var RING_C = 2 * Math.PI * 30;
var ARM_MS2 = 5e3;
var UNDO_MIN_S = 30;
var leftHtml = (sec) => {
  const s = Math.max(0, Math.ceil(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const x = s % 60;
  const part = (n, unit) => `${n}<u>${unit}</u>`;
  if (h) return `${part(h, "h")} ${part(String(m).padStart(2, "0"), "min")}`;
  return m ? `${part(m, "min")} ${part(x, "s")}` : part(x, "s");
};
var timeWords = (sec) => {
  const s = Math.max(1, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const x = s % 60;
  const part = (n, unit) => n ? `${n} ${unit}${n === 1 ? "" : "s"}` : "";
  return [part(h, "hour"), part(m, "minute"), part(x, "second")].filter(Boolean).join(" ");
};
var LamplightTimersCard = class extends LamplightCard {
  defaults() {
    return { quick_minutes: [5, 10, 15, 20], appliance_timers: [] };
  }
  get roomName() {
    return this.st(this.vaSensor)?.attributes?.friendly_name || "this room";
  }
  /* Soonest first, paused timers last. A paused timer (status "paused") has the time it had left: `remaining` (seconds)
     when the sensor gives it, else its expiry less the moment it was paused (`updated_at`). */
  get vaTimers() {
    const list = this.st(this.vaSensor)?.attributes?.timers;
    if (!Array.isArray(list)) return [];
    const now = Date.now();
    return list.filter((t) => t && t.status !== "expired").map((t) => {
      const at = Date.parse(t.expires || "");
      const from = Date.parse(t.created_at || "");
      const orig = Date.parse(t.original_expiry || t.expires || "");
      const paused = t.status === "paused";
      const remaining = parseFloat(t.remaining);
      const left = !paused ? (at - now) / 1e3 : Number.isFinite(remaining) ? remaining : (at - Date.parse(t.updated_at || "")) / 1e3;
      return {
        id: String(t.id),
        name: String(t.name || ""),
        cls: t.timer_class || "timer",
        at,
        paused,
        left: Number.isFinite(left) ? Math.max(0, left) : null,
        total: Number.isFinite(from) && Number.isFinite(orig) && orig > from ? (orig - from) / 1e3 : null
      };
    }).filter((t) => t.paused || Number.isFinite(t.at)).sort((a, b) => a.paused - b.paused || (a.paused ? 0 : a.at - b.at));
  }
  get appliances() {
    return (this.config.appliance_timers || []).map((a) => {
      const s = this.st(a.entity);
      const at = Date.parse(s?.attributes?.finishes_at || "");
      return s?.state === "active" && Number.isFinite(at) ? { ...a, at } : null;
    }).filter(Boolean);
  }
  build() {
    this.built = true;
    this.shell("Timers", `<main><section class="list-box"><div class="list"></div></section>
      <section class="start"><h2>Start a timer</h2><div class="quick"></div></section></main>`);
    this.shadowRoot.querySelector(".list").addEventListener("scroll", () => this.updateFade(), { passive: true });
  }
  update() {
    const apps = (this.config.appliance_timers || []).map((a) => {
      const x = this.st(a.entity);
      return `${x?.state}|${x?.attributes?.finishes_at}`;
    });
    const sig = JSON.stringify([this.vaSensor, this.st(this.vaSensor)?.attributes?.timers || [], apps]);
    if (sig !== this.sig) {
      this.sig = sig;
      this.busy = "";
      this.render();
    }
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.built) this.syncTicker();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.ticker);
    this.ticker = null;
    this.disarm();
  }
  render() {
    const root = this.shadowRoot;
    if (!root || !this._hass) return;
    const timers = this.vaTimers;
    const apps = this.appliances;
    const running = timers.filter((t) => t.cls === "timer" && !t.paused);
    const next = running[0];
    const paused = timers.filter((t) => t.paused).length;
    const alarms = timers.filter((t) => t.cls !== "timer").length;
    this.setSub(running.length ? `${running.length} running · next done at ${this.hhmm(next.at)}` : paused ? `${paused} paused` : alarms ? `${alarms} alarm${alarms > 1 ? "s" : ""} set` : `Nothing running in ${this.roomName}`, running.length ? "warm" : "");
    const rows = [...timers.map((t) => this.timerRow(t)), ...apps.map((a) => this.applianceRow(a))];
    root.querySelector(".list").innerHTML = rows.length ? rows.join("") : `<div class="empty"><span class="disc big"><ha-icon icon="mdi:timer-outline"></ha-icon></span>
      <b>No timers running</b><span>Tap a time on the right to start one here.</span></div>`;
    root.querySelector(".quick").innerHTML = this.config.quick_minutes.map((m) => `<button class="q" data-act="start" data-arg="${Number(m)}" aria-label="Start a ${Number(m)} minute timer"
      ${this.busy === `start:${Number(m)}` || !this.vaSensor ? "disabled" : ""}><b>${Number(m)}</b><small>min</small></button>`).join("");
    this.tick();
    this.syncTicker();
    requestAnimationFrame(() => this.updateFade());
  }
  dayWord(d) {
    const a = dayStart(/* @__PURE__ */ new Date());
    const b = dayStart(d);
    const n = Math.round((b - a) / 864e5);
    return n === 0 ? "" : n === 1 ? " tomorrow" : ` ${new Date(d).toLocaleDateString(this.locale, { weekday: "long" })}`;
  }
  /* Cancel, or "Tap again to cancel" while it's armed (alarms, reminders and paused timers). */
  cancelHtml(t, label) {
    const armed = this.armed === t.id;
    return `<button class="pill ${armed ? "danger" : ""}" data-act="cancel" data-arg="${esc(t.id)}" data-name="${esc(label)}">
      <ha-icon icon="mdi:close"></ha-icon>${armed ? "Tap again to cancel" : "Cancel"}</button>`;
  }
  timerRow(t) {
    if (t.cls !== "timer") {
      const label2 = t.name ? cap(t.name) : t.cls === "alarm" ? "Alarm" : "Reminder";
      return `<div class="row alarm"><span class="disc"><ha-icon icon="mdi:${t.cls === "alarm" ? "alarm" : "bell-outline"}"></ha-icon></span>
        <span class="txt"><b class="num">${esc(this.hhmm(t.at))}${esc(this.dayWord(t.at))}</b><span>${esc(label2)}</span></span>${this.cancelHtml(t, label2)}</div>`;
    }
    const label = t.name ? cap(t.name) : "Timer";
    if (t.paused) {
      return `<div class="row timer paused"><span class="disc"><ha-icon icon="mdi:timer-pause-outline"></ha-icon></span>
        <span class="txt"><b class="cd num">${t.left !== null ? leftHtml(t.left) : "Paused"}</b><span>${esc(label)} · paused</span></span>${this.cancelHtml(t, label)}</div>`;
    }
    return `<div class="row timer"><span class="ring" aria-hidden="true"><svg viewBox="0 0 68 68"><circle class="track" cx="34" cy="34" r="30"/>
        <circle class="fill" cx="34" cy="34" r="30" data-ring="${t.at}" data-total="${t.total || ""}" stroke-dasharray="${RING_C.toFixed(1)}"/></svg></span>
      <span class="txt"><b class="cd num" data-deadline="${t.at}" role="timer" aria-label="${esc(label)}"></b><span>${esc(label)} · done at ${esc(this.hhmm(t.at))}</span></span>
      <button class="pill" data-act="cancel" data-arg="${esc(t.id)}" data-name="${esc(label)}"><ha-icon icon="mdi:close"></ha-icon>Cancel</button></div>`;
  }
  applianceRow(a) {
    return `<div class="row appliance"><span class="disc"><ha-icon icon="${esc(a.icon || "mdi:timer-sand")}"></ha-icon></span>
      <span class="txt"><b class="cd num" data-deadline="${a.at}"></b><span>${esc(a.name || a.entity)} · done at ${esc(this.hhmm(a.at))}</span></span></div>`;
  }
  /* Countdowns and rings update in place once a second; nothing else re-renders. */
  tick() {
    const root = this.shadowRoot;
    if (!root) return;
    const now = Date.now();
    root.querySelectorAll("[data-deadline]").forEach((el) => {
      const left = (Number(el.dataset.deadline) - now) / 1e3;
      el.innerHTML = left > 0 ? leftHtml(left) : "Done";
    });
    root.querySelectorAll("[data-ring]").forEach((el) => {
      const total = Number(el.dataset.total);
      const left = Math.max(0, (Number(el.dataset.ring) - now) / 1e3);
      el.setAttribute("stroke-dashoffset", (RING_C * (1 - (total > 0 ? Math.min(1, left / total) : 1))).toFixed(1));
    });
  }
  syncTicker() {
    const need = !!this.shadowRoot?.querySelector("[data-deadline]");
    if (need && !this.ticker) this.ticker = setInterval(() => this.tick(), 1e3);
    if (!need && this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }
  updateFade() {
    const list = this.shadowRoot?.querySelector(".list");
    if (!list) return;
    list.parentElement.classList.toggle("more", list.scrollHeight - list.clientHeight - list.scrollTop > 6);
  }
  act(act, el) {
    const arg = el.dataset.arg;
    if (act === "start") {
      this.busy = `start:${arg}`;
      this.render();
      this.call("view_assist", "set_timer", { entity_id: this.vaSensor, type: "timer", time: `${Number(arg)} minutes` }, `Timer set for ${Number(arg)} minutes`);
      setTimeout(() => {
        if (this.busy === `start:${arg}`) {
          this.busy = "";
          this.render();
        }
      }, 1e4);
    } else if (act === "cancel") {
      const t = this.vaTimers.find((x) => x.id === arg) || { id: arg, cls: "alarm" };
      if ((t.cls !== "timer" || t.paused) && this.armed !== arg) {
        this.arm(arg);
        return;
      }
      this.disarm();
      this.cancel(t, el.dataset.name);
    }
  }
  /* A running timer cancels at once; Undo sets it again with its name and the time it had left (UNDO_MIN_S at least). */
  cancel(t, name) {
    const label = cap(name || "Timer");
    const again = t.cls === "timer" && !t.paused && t.left > 0 ? () => this.call("view_assist", "set_timer", {
      entity_id: this.vaSensor,
      type: "timer",
      time: timeWords(Math.max(UNDO_MIN_S, t.left)),
      ...t.name ? { name: t.name } : {}
    }, `${label} back on`) : null;
    this.call("view_assist", "cancel_timer", { timer_id: t.id }, `${label} cancelled`, again);
  }
  /* The two-tap arm (DESIGN.md, Actions): the first tap turns Cancel red for ARM_MS. */
  arm(id) {
    clearTimeout(this.armTimer);
    this.armed = id;
    this.render();
    this.armTimer = setTimeout(() => {
      this.armed = null;
      this.render();
    }, ARM_MS2);
  }
  disarm() {
    clearTimeout(this.armTimer);
    if (this.armed) {
      this.armed = null;
      this.render();
    }
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
      .row.timer.paused{background:var(--raised);gap:14px} .row.timer.paused .txt > span{color:var(--muted)}
      .ring{width:64px;height:64px;flex:0 0 64px}
      .ring svg{width:100%;height:100%;transform:rotate(-90deg)}
      .ring circle{fill:none;stroke-width:6}
      .ring .track{stroke:var(--raised-2)}
      .ring .fill{stroke:var(--warm);stroke-linecap:round;transition:stroke-dashoffset 1s linear}
      .disc{background:var(--raised-2)}
      .row.alarm .disc{color:var(--accent)}
      .row.appliance .txt b.cd{font-size:30px}
      .pill{height:56px;flex:0 0 auto;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 18px 0 14px;font-size:18px;font-weight:600;background:var(--raised-2);white-space:nowrap}
      .pill.danger{background:var(--alert);color:var(--danger-ink)}
      .start{background:var(--panel);border-radius:var(--r-tile);padding:12px;display:flex;flex-direction:column;gap:10px;min-height:0}
      h2{margin:0 2px;font-size:17px;font-weight:600;color:var(--muted)}
      .quick{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:minmax(72px,1fr);gap:10px}
      .q{border-radius:var(--r-tile);display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--raised-2);min-height:72px}
      .q b{font-family:var(--num);font-size:34px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums}
      .q small{font-size:17px;color:var(--muted)}
      @media (prefers-reduced-motion:reduce){.ring .fill{transition:none}}`;
  }
};
define("lamplight-timers-card", LamplightTimersCard, "Lamplight Timers", "View Assist timers with countdowns and quick-start buttons.");

// src/cards/weather.js
var FORECAST_MS = 20 * 6e4;
var FORECAST_RETRY_MS = 6e4;
var W_ICON = {
  "clear-night": "weather-night",
  cloudy: "weather-cloudy",
  exceptional: "alert-circle-outline",
  fog: "weather-fog",
  hail: "weather-hail",
  lightning: "weather-lightning",
  "lightning-rainy": "weather-lightning-rainy",
  partlycloudy: "weather-partly-cloudy",
  pouring: "weather-pouring",
  rainy: "weather-rainy",
  snowy: "weather-snowy",
  "snowy-rainy": "weather-snowy-rainy",
  sunny: "weather-sunny",
  windy: "weather-windy",
  "windy-variant": "weather-windy-variant"
};
var W_LABEL = { "clear-night": "Clear", partlycloudy: "Partly cloudy", "lightning-rainy": "Thunderstorms", "snowy-rainy": "Sleet", "windy-variant": "Windy", pouring: "Heavy rain" };
var wLabel = (c) => W_LABEL[c] || cap(c || "");
var compass = (deg) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round((deg ?? 0) % 360 / 45) % 8];
var LamplightWeatherCard = class extends LamplightCard {
  defaults() {
    return { entity: "weather.home" };
  }
  build() {
    this.built = true;
    this.shell(
      "Weather",
      '<main class="grid"><section class="now"></section><section class="right"><div class="hours"></div><div class="days"></div></section></main>',
      { extra: '<span class="sun"></span>' }
    );
  }
  update() {
    const w = this.st(this.config.entity);
    const sun = this.st("sun.sun");
    const sig = `${w?.state}|${w?.attributes?.temperature}|${sun?.state}|${this.fc?.at || 0}|${this.failedAt || 0}`;
    if (sig !== this.sig) {
      this.sig = sig;
      this.render();
    }
    this.load();
  }
  async load(force = false) {
    if (this.loading || !this._hass) return;
    if (!force && this.fc && Date.now() - this.fc.at < FORECAST_MS) return;
    if (!force && this.failedAt && Date.now() - this.failedAt < FORECAST_RETRY_MS) return;
    this.loading = true;
    if (force) this.render();
    try {
      const id = this.config.entity;
      const ask = (type) => this._hass.callWS({ type: "call_service", domain: "weather", service: "get_forecasts", target: { entity_id: id }, service_data: { type }, return_response: true });
      const [h, d] = await Promise.all([ask("hourly"), ask("daily")]);
      const hourly = h?.response?.[id]?.forecast;
      const daily = d?.response?.[id]?.forecast;
      if (!Array.isArray(hourly) || !Array.isArray(daily)) throw new Error("no forecast");
      this.fc = { at: Date.now(), hourly, daily };
      this.failedAt = 0;
    } catch {
      this.failedAt = Date.now();
    }
    this.loading = false;
    this.sig = null;
    this.render();
  }
  retry() {
    this.load(true);
  }
  softenPhoto() {
  }
  // the sky replaces the photo here
  /* The next 12 hours, and the forecast's load state (DESIGN.md, Load states). */
  get hours() {
    return (this.fc?.hourly || []).filter((h) => Date.parse(h.datetime) >= Date.now() - 30 * 6e4).slice(0, 12);
  }
  forecastState(hours) {
    return loadState({ loading: this.loading || !this.fc && !this.failedAt, error: !this.loading && this.failedAt, count: hours.length >= 2 ? hours.length : 0 });
  }
  sky(cond, day) {
    if (!day) return "night";
    if (["rainy", "pouring", "lightning-rainy", "lightning", "hail", "snowy-rainy"].includes(cond)) return "rain";
    if (["cloudy", "fog", "snowy"].includes(cond)) return "grey";
    return "day";
  }
  render() {
    const root = this.shadowRoot;
    const w = this.st(this.config.entity);
    if (!root || !w) return;
    const a = w.attributes;
    const sun = this.st("sun.sun");
    const day = sun?.state !== "below_horizon";
    this.setAttribute("sky", this.sky(w.state, day));
    const today = this.fc?.daily?.[0];
    const rise = Date.parse(sun?.attributes?.next_rising || "");
    const set = Date.parse(sun?.attributes?.next_setting || "");
    root.querySelector(".sun").innerHTML = sun ? `<ha-icon icon="mdi:weather-sunset-up"></ha-icon>${Number.isFinite(rise) ? this.hhmm(rise) : "–"}
      <ha-icon icon="mdi:weather-sunset-down"></ha-icon>${Number.isFinite(set) ? this.hhmm(set) : "–"}` : "";
    const unit = a.wind_speed_unit || this.config.wind_unit || "km/h";
    root.querySelector(".now").innerHTML = `
      <div class="now-top"><ha-icon class="cond-icon" icon="mdi:${W_ICON[w.state] || "weather-cloudy"}"></ha-icon><span class="temp">${Math.round(a.temperature)}°</span></div>
      <div class="cond">${esc(wLabel(w.state))}</div>
      ${today ? `<div class="hilo">High ${Math.round(today.temperature)}° · Low ${Math.round(today.templow)}°</div>` : ""}
      <div class="stats">
        <span><ha-icon icon="mdi:weather-windy"></ha-icon><b>${Math.round(a.wind_speed ?? 0)}</b><small>${esc(unit)} ${compass(a.wind_bearing)}</small></span>
        <span><ha-icon icon="mdi:water-percent"></ha-icon><b>${Math.round(a.humidity ?? 0)}%</b><small>humidity</small></span>
        ${a.uv_index !== void 0 ? `<span><ha-icon icon="mdi:sun-wireless-outline"></ha-icon><b>${Math.round(a.uv_index)}</b><small>UV</small></span>` : ""}
      </div>`;
    const hours = this.hours;
    const state = this.forecastState(hours);
    this.setSub(state === "failed" ? `Forecast unavailable · checked ${this.hhmm(this.failedAt)}` : "", state === "failed" ? "warn" : "");
    root.querySelector(".right").classList.toggle("failed", state === "failed");
    root.querySelector(".hours").innerHTML = this.hoursHtml(hours, state);
    const days = root.querySelector(".days");
    days.innerHTML = this.daysHtml();
    days.hidden = !days.innerHTML;
  }
  hoursHtml(hours, state) {
    if (state === "failed") return failedHtml("the forecast");
    if (state === "loading") return '<div class="loading">Loading forecast…</div>';
    if (state === "empty") return '<div class="loading">No hourly forecast from this weather service</div>';
    const temps = hours.map((h) => h.temperature);
    let lo = Math.min(...temps);
    let hi = Math.max(...temps);
    if (hi - lo < 3) {
      lo -= 1.5;
      hi += 1.5;
    }
    const maxRain = Math.max(1, ...hours.map((h) => h.precipitation || 0));
    const n = hours.length;
    const W = 1e3;
    const H = 100;
    const x = (i) => (i + 0.5) / n * W;
    const y = (t) => 10 + (1 - (t - lo) / (hi - lo)) * (H - 20);
    const line = hours.map((h, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(h.temperature).toFixed(1)}`).join(" ");
    const cols = hours.map((h, i) => {
      const rain = h.precipitation || 0;
      return `<div class="hcol"><span class="h-t" style="top:${Math.round(20 + y(h.temperature) / H * 72 - 24)}px">${Math.round(h.temperature)}°</span>
        <span class="h-rain" style="--r:${Math.round(rain / maxRain * 100)}%">${rain >= 0.1 ? rain.toFixed(1) : ""}</span>
        <ha-icon icon="mdi:${W_ICON[h.condition] || "weather-cloudy"}"></ha-icon><span class="h-time">${i === 0 ? "Now" : String(new Date(h.datetime).getHours()).padStart(2, "0")}</span></div>`;
    }).join("");
    return `<h2>Next 12 hours ${hours.some((h) => (h.precipitation || 0) >= 0.1) ? "<small>rain in mm</small>" : "<small>no rain expected</small>"}</h2>
      <div class="hchart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${line}" fill="none" stroke="var(--chart-line)" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg><div class="hcols">${cols}</div></div>`;
  }
  daysHtml() {
    const days = (this.fc?.daily || []).slice(1, 6);
    if (!days.length) return "";
    const lo = Math.min(...days.map((d) => d.templow ?? d.temperature));
    const hi = Math.max(...days.map((d) => d.temperature));
    const span = Math.max(1, hi - lo);
    return `<h2>Next days</h2>${days.map((d) => {
      const l = d.templow ?? d.temperature;
      const left = (l - lo) / span * 100;
      const width = Math.max(4, (d.temperature - l) / span * 100);
      const rain = d.precipitation || 0;
      return `<div class="day"><span class="d-name">${new Date(d.datetime).toLocaleDateString(this.locale, { weekday: "short" })}</span>
        <ha-icon icon="mdi:${W_ICON[d.condition] || "weather-cloudy"}"></ha-icon><span class="d-rain">${rain >= 0.2 ? `${rain.toFixed(1)} mm` : ""}</span>
        <span class="d-lo">${Math.round(l)}°</span><span class="d-bar"><span style="left:${left.toFixed(1)}%;width:${width.toFixed(1)}%"></span></span><span class="d-hi">${Math.round(d.temperature)}°</span></div>`;
    }).join("")}`;
  }
  styles() {
    return `
      :host{--sky-muted:rgba(244,242,238,.76);--sky-raised:rgba(255,255,255,.14);--chart-line:var(--warm)}
      :host([sky=day]){--sky:linear-gradient(160deg,#1c4f7c 0%,#173a5c 55%,#10233a 100%)}
      :host([sky=grey]){--sky:linear-gradient(160deg,#3a4652 0%,#28313b 60%,#1b2128 100%)}
      :host([sky=rain]){--sky:linear-gradient(160deg,#2c3b4a 0%,#1f2a36 60%,#141b23 100%);--chart-line:#9fd3ff}
      :host([sky=night]){--sky:linear-gradient(160deg,#141a2e 0%,#0d1120 60%,#07090f 100%);--chart-line:#b8c4ff}
      ha-card{background:var(--sky,#10233a);gap:8px} ha-card::before{display:none}
      .icon,.back{background:var(--sky-raised)}
      .sun{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:18px;font-variant-numeric:tabular-nums;color:var(--sky-muted)}
      .sun ha-icon{--mdc-icon-size:22px;color:var(--warm);margin-left:10px}
      .grid{flex:1;min-height:0;display:grid;grid-template-columns:286px minmax(0,1fr);gap:20px}
      .now{display:flex;flex-direction:column;justify-content:center;gap:4px;padding-left:4px}
      .now-top{display:flex;align-items:center;gap:8px}
      .cond-icon{--mdc-icon-size:76px;color:var(--warm)}
      .temp{font-family:var(--num);font-size:104px;font-weight:600;line-height:.9;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
      .cond{font-size:26px;font-weight:600;margin-top:6px}
      .hilo{font-size:19px;color:var(--sky-muted)}
      .stats{display:flex;gap:18px;margin-top:18px}
      .stats span{display:grid;grid-template-columns:auto auto;column-gap:6px;align-items:baseline}
      .stats ha-icon{grid-row:1/3;--mdc-icon-size:24px;color:var(--sky-muted);align-self:center}
      .stats b{font-family:var(--num);font-size:26px;font-weight:600;font-variant-numeric:tabular-nums} .stats small{font-size:16px;color:var(--sky-muted)}
      .right{display:flex;flex-direction:column;gap:10px;min-width:0}
      h2{margin:0 0 6px;font-size:17px;font-weight:600;color:var(--sky-muted);display:flex;gap:10px;align-items:baseline}
      h2 small{font-size:16px;font-weight:400}
      .hchart{position:relative;height:142px;background:rgba(0,0,0,.2);border-radius:var(--r-tile);padding:6px 4px 4px}
      .hchart svg{position:absolute;left:4px;right:4px;top:26px;width:calc(100% - 8px);height:72px}
      .hcols{position:absolute;inset:6px 4px 4px;display:grid;grid-template-columns:repeat(12,1fr)}
      .hcol{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px}
      .h-t{position:absolute;font-size:16px;font-weight:600;font-variant-numeric:tabular-nums}
      .h-rain{position:relative;width:60%;height:calc(var(--r) * .22);background:rgba(128,216,255,.5);border-radius:3px 3px 0 0;font-size:16px;color:var(--accent);display:flex;justify-content:center}
      .hcol ha-icon{--mdc-icon-size:20px;color:var(--sky-muted)}
      .h-time{font-size:16px;color:var(--sky-muted);font-variant-numeric:tabular-nums}
      .right.failed .hours{flex:1;display:flex;background:rgba(0,0,0,.2);border-radius:var(--r-tile)}
      .days[hidden]{display:none}
      .days{display:flex;flex-direction:column;gap:2px;background:rgba(0,0,0,.2);border-radius:var(--r-tile);padding:8px 14px}
      .days h2{margin-bottom:2px}
      .day{display:grid;grid-template-columns:52px 28px 70px 36px minmax(0,1fr) 36px;align-items:center;gap:8px;min-height:34px;font-size:19px}
      .d-name{font-weight:600} .day ha-icon{color:var(--sky-muted)} .d-rain{font-size:16px;color:var(--accent)}
      .d-lo{text-align:right;color:var(--sky-muted);font-variant-numeric:tabular-nums} .d-hi{font-weight:600;font-variant-numeric:tabular-nums}
      .d-bar{position:relative;height:8px;border-radius:8px;background:rgba(255,255,255,.14)}
      .d-bar span{position:absolute;top:0;bottom:0;border-radius:8px;background:linear-gradient(90deg,var(--accent),var(--warm))}
      .loading{color:var(--sky-muted);padding:20px;font-size:17px}`;
  }
};
define("lamplight-weather-card", LamplightWeatherCard, "Lamplight Weather", "Now, the next 12 hours and the next five days, for a wall tablet.");

// src/cards/wifi.js
var LamplightWifiCard = class extends LamplightCard {
  setConfig(config) {
    if (!config.qr) throw new Error("qr is required");
    super.setConfig(config);
  }
  build() {
    this.built = true;
    const { qr, ssid } = this.config;
    this.shell("Wi-Fi", `<main>
        <div class="code"><img src="${esc(qr)}" alt="Wi-Fi QR code"></div>
        <div class="info">
          <div class="disc"><ha-icon icon="mdi:wifi"></ha-icon></div>
          ${ssid ? `<p class="label">Network</p><p class="ssid">${esc(ssid)}</p>` : ""}
          <ol><li>Open your phone's camera</li><li>Point it at the code</li><li>Tap <b>Join</b></li></ol>
        </div></main>`, { sub: this.config.subtitle || "For guests and new devices" });
  }
  styles() {
    return `
      main{flex:1;min-height:0;display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center}
      .code{height:100%;max-height:390px;aspect-ratio:1;background:#fff;border-radius:26px;padding:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 28px rgba(0,0,0,.45)}
      .code img{width:100%;height:100%;display:block;image-rendering:pixelated}
      .info{background:var(--panel);border-radius:var(--r-tile);padding:20px 22px;align-self:stretch;display:flex;flex-direction:column;justify-content:center;gap:4px}
      .disc{width:56px;height:56px;flex:0 0 auto;background:var(--raised-2);margin-bottom:10px} .disc ha-icon{--mdc-icon-size:30px}
      .label{margin:0;font-size:17px;color:var(--muted)}
      .ssid{margin:0 0 14px;font-size:30px;font-weight:600;word-break:break-all}
      ol{margin:0;padding-left:26px;font-size:19px;line-height:1.6} ol b{color:var(--text);font-weight:700}`;
  }
};
define("lamplight-wifi-card", LamplightWifiCard, "Lamplight Wi-Fi", "A guest Wi-Fi QR code, big enough to scan from the sofa.");
export {
  BASE_CSS,
  LamplightAgendaCard,
  LamplightCard,
  LamplightHelpCard,
  LamplightInfoCard,
  LamplightTimersCard,
  LamplightWeatherCard,
  LamplightWifiCard,
  PHOTO_LOOK,
  TOAST_MS,
  TOKENS,
  UNDO_MS,
  VERSION,
  cap,
  dayStart,
  define,
  esc,
  failedHtml,
  fontBase,
  loadState,
  preblur,
  registerFonts
};
