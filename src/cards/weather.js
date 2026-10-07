/* Weather: now (big), the next 12 hours as a chart (temperature line and rain bars), and the next five days with
 * low–high bars on a shared scale. The page takes a sky colour from the condition and day or night instead of the photo.
 *   type: custom:lamplight-weather-card
 *   entity: weather.home
 *   wind_unit: km/h          # label only; the value comes from the weather entity
 */
const W_ICON = {
  'clear-night': 'weather-night', cloudy: 'weather-cloudy', exceptional: 'alert-circle-outline', fog: 'weather-fog', hail: 'weather-hail',
  lightning: 'weather-lightning', 'lightning-rainy': 'weather-lightning-rainy', partlycloudy: 'weather-partly-cloudy', pouring: 'weather-pouring',
  rainy: 'weather-rainy', snowy: 'weather-snowy', 'snowy-rainy': 'weather-snowy-rainy', sunny: 'weather-sunny', windy: 'weather-windy', 'windy-variant': 'weather-windy-variant',
};
const W_LABEL = { 'clear-night': 'Clear', partlycloudy: 'Partly cloudy', 'lightning-rainy': 'Thunderstorms', 'snowy-rainy': 'Sleet', 'windy-variant': 'Windy', pouring: 'Heavy rain' };
const wLabel = (c) => W_LABEL[c] || cap(c || '');
const compass = (deg) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(((deg ?? 0) % 360) / 45) % 8];

class LamplightWeatherCard extends LamplightCard {
  defaults() { return { entity: 'weather.home' }; }

  build() {
    this.built = true;
    this.shell('Weather', '<main class="grid"><section class="now"></section><section class="right"><div class="hours"></div><div class="days"></div></section></main>',
      { extra: '<span class="sun"></span>' });
  }

  update() {
    const w = this.st(this.config.entity); const sun = this.st('sun.sun');
    const sig = `${w?.state}|${w?.attributes?.temperature}|${sun?.state}|${this.fc?.at || 0}`;
    if (sig !== this.sig) { this.sig = sig; this.render(); }
    this.load();
  }

  async load() {
    if (this.loading || (this.fc && Date.now() - this.fc.at < 20 * 60e3)) return;
    this.loading = true;
    try {
      const id = this.config.entity;
      const ask = (type) => this._hass.callWS({ type: 'call_service', domain: 'weather', service: 'get_forecasts', target: { entity_id: id }, service_data: { type }, return_response: true });
      const [h, d] = await Promise.all([ask('hourly'), ask('daily')]);
      this.fc = { at: Date.now(), hourly: h.response?.[id]?.forecast || [], daily: d.response?.[id]?.forecast || [] };
      this.sig = null; this.render();
    } catch { /* keep the last forecast */ } finally { this.loading = false; }
  }

  sky(cond, day) {
    if (!day) return 'night';
    if (['rainy', 'pouring', 'lightning-rainy', 'lightning', 'hail', 'snowy-rainy'].includes(cond)) return 'rain';
    if (['cloudy', 'fog', 'snowy'].includes(cond)) return 'grey';
    return 'day';
  }

  render() {
    const root = this.shadowRoot; const w = this.st(this.config.entity); if (!root || !w) return;
    const a = w.attributes; const sun = this.st('sun.sun'); const day = sun?.state !== 'below_horizon';
    this.setAttribute('sky', this.sky(w.state, day));
    const today = this.fc?.daily?.[0];
    const rise = Date.parse(sun?.attributes?.next_rising || ''); const set = Date.parse(sun?.attributes?.next_setting || '');
    root.querySelector('.sun').innerHTML = sun ? `<ha-icon icon="mdi:weather-sunset-up"></ha-icon>${Number.isFinite(rise) ? this.hhmm(rise) : '–'}
      <ha-icon icon="mdi:weather-sunset-down"></ha-icon>${Number.isFinite(set) ? this.hhmm(set) : '–'}` : '';
    const unit = a.wind_speed_unit || this.config.wind_unit || 'km/h';
    root.querySelector('.now').innerHTML = `
      <div class="now-top"><ha-icon class="cond-icon" icon="mdi:${W_ICON[w.state] || 'weather-cloudy'}"></ha-icon><span class="temp">${Math.round(a.temperature)}°</span></div>
      <div class="cond">${esc(wLabel(w.state))}</div>
      ${today ? `<div class="hilo">High ${Math.round(today.temperature)}° · Low ${Math.round(today.templow)}°</div>` : ''}
      <div class="stats">
        <span><ha-icon icon="mdi:weather-windy"></ha-icon><b>${Math.round(a.wind_speed ?? 0)}</b><small>${esc(unit)} ${compass(a.wind_bearing)}</small></span>
        <span><ha-icon icon="mdi:water-percent"></ha-icon><b>${Math.round(a.humidity ?? 0)}%</b><small>humidity</small></span>
        ${a.uv_index !== undefined ? `<span><ha-icon icon="mdi:sun-wireless-outline"></ha-icon><b>${Math.round(a.uv_index)}</b><small>UV</small></span>` : ''}
      </div>`;
    root.querySelector('.hours').innerHTML = this.hoursHtml();
    root.querySelector('.days').innerHTML = this.daysHtml();
  }

  hoursHtml() {
    const hours = (this.fc?.hourly || []).filter((h) => Date.parse(h.datetime) >= Date.now() - 30 * 60e3).slice(0, 12);
    if (hours.length < 2) return '<div class="loading">Loading forecast…</div>';
    const temps = hours.map((h) => h.temperature); let lo = Math.min(...temps); let hi = Math.max(...temps);
    if (hi - lo < 3) { lo -= 1.5; hi += 1.5; }
    const maxRain = Math.max(1, ...hours.map((h) => h.precipitation || 0));
    const n = hours.length; const W = 1000; const H = 100;
    const x = (i) => ((i + 0.5) / n) * W; const y = (t) => 10 + (1 - (t - lo) / (hi - lo)) * (H - 20);
    const line = hours.map((h, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(h.temperature).toFixed(1)}`).join(' ');
    const cols = hours.map((h, i) => {
      const rain = h.precipitation || 0;
      return `<div class="hcol"><span class="h-t" style="top:${Math.round(20 + (y(h.temperature) / H) * 72 - 24)}px">${Math.round(h.temperature)}°</span>
        <span class="h-rain" style="--r:${Math.round((rain / maxRain) * 100)}%">${rain >= 0.1 ? rain.toFixed(1) : ''}</span>
        <ha-icon icon="mdi:${W_ICON[h.condition] || 'weather-cloudy'}"></ha-icon><span class="h-time">${i === 0 ? 'Now' : String(new Date(h.datetime).getHours()).padStart(2, '0')}</span></div>`;
    }).join('');
    return `<h2>Next 12 hours ${hours.some((h) => (h.precipitation || 0) >= 0.1) ? '<small>rain in mm</small>' : '<small>no rain expected</small>'}</h2>
      <div class="hchart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${line}" fill="none" stroke="var(--chart-line)" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg><div class="hcols">${cols}</div></div>`;
  }

  daysHtml() {
    const days = (this.fc?.daily || []).slice(1, 6);
    if (!days.length) return '';
    const lo = Math.min(...days.map((d) => d.templow ?? d.temperature)); const hi = Math.max(...days.map((d) => d.temperature));
    const span = Math.max(1, hi - lo);
    return `<h2>Next days</h2>${days.map((d) => {
      const l = d.templow ?? d.temperature; const left = ((l - lo) / span) * 100; const width = Math.max(4, ((d.temperature - l) / span) * 100);
      const rain = d.precipitation || 0;
      return `<div class="day"><span class="d-name">${new Date(d.datetime).toLocaleDateString(this.locale, { weekday: 'short' })}</span>
        <ha-icon icon="mdi:${W_ICON[d.condition] || 'weather-cloudy'}"></ha-icon><span class="d-rain">${rain >= 0.2 ? `${rain.toFixed(1)} mm` : ''}</span>
        <span class="d-lo">${Math.round(l)}°</span><span class="d-bar"><span style="left:${left.toFixed(1)}%;width:${width.toFixed(1)}%"></span></span><span class="d-hi">${Math.round(d.temperature)}°</span></div>`;
    }).join('')}`;
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
      .days{display:flex;flex-direction:column;gap:2px;background:rgba(0,0,0,.2);border-radius:var(--r-tile);padding:8px 14px}
      .days h2{margin-bottom:2px}
      .day{display:grid;grid-template-columns:52px 28px 70px 36px minmax(0,1fr) 36px;align-items:center;gap:8px;min-height:34px;font-size:19px}
      .d-name{font-weight:600} .day ha-icon{color:var(--sky-muted)} .d-rain{font-size:16px;color:var(--accent)}
      .d-lo{text-align:right;color:var(--sky-muted);font-variant-numeric:tabular-nums} .d-hi{font-weight:600;font-variant-numeric:tabular-nums}
      .d-bar{position:relative;height:8px;border-radius:8px;background:rgba(255,255,255,.14)}
      .d-bar span{position:absolute;top:0;bottom:0;border-radius:8px;background:linear-gradient(90deg,var(--accent),var(--warm))}
      .loading{color:var(--sky-muted);padding:20px;font-size:17px}`;
  }
}
define('lamplight-weather-card', LamplightWeatherCard, 'Lamplight Weather', 'Now, the next 12 hours and the next five days, for a wall tablet.');
