// The demo: every card on a made-up home, with a stand-in Home Assistant, then a few of their other states (a forecast
// that won't load, Help while visitors are in, a reply that isn't an answer). Open demo/index.html (any static server),
// or demo/index.html?card=weather for one card at tablet size.
import ICONS from './icons.js';
import '../dist/lamplight.js';

/* Stand-ins for Home Assistant's own elements. */
customElements.define('ha-card', class extends HTMLElement {});
customElements.define('ha-icon', class extends HTMLElement {
  static get observedAttributes() { return ['icon']; }
  attributeChangedCallback() { this.draw(); }
  connectedCallback() { this.draw(); }
  draw() {
    const path = ICONS[String(this.getAttribute('icon') || '').replace(/^mdi:/, '')];
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>:host{display:inline-flex;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px)}svg{width:100%;height:100%;fill:currentColor}</style>
      <svg viewBox="0 0 24 24">${path ? `<path d="${path}"/>` : ''}</svg>`;
  }
});

const now = Date.now(); const MIN = 60e3; const HOUR = 60 * MIN;
const at = (ms) => new Date(now + ms).toISOString();
const today = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };
const tomorrow = (h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(h, m, 0, 0); return d.toISOString(); };
const dateOnly = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('sv'); };
const hour = new Date().getHours();

const states = {
  'sun.sun': { state: hour >= 7 && hour < 19 ? 'above_horizon' : 'below_horizon', attributes: { next_rising: tomorrow(7, 12), next_setting: today(18, 31) } },
  'weather.home': { state: 'partlycloudy', attributes: { temperature: 17, humidity: 64, wind_speed: 14, wind_bearing: 230, uv_index: 3, friendly_name: 'Home' } },
  'weather.offline': { state: 'cloudy', attributes: { temperature: 13, humidity: 81, wind_speed: 22, wind_bearing: 200, friendly_name: 'Offline' } },
  'input_boolean.visitors': { state: 'on', attributes: { friendly_name: 'Visitors' } },
  'calendar.family': { state: 'on', attributes: { friendly_name: 'Family' } },
  'calendar.work': { state: 'off', attributes: { friendly_name: 'Work' } },
  'calendar.birthdays': { state: 'off', attributes: { friendly_name: 'Birthdays' } },
  'timer.washing_machine': { state: 'active', attributes: { finishes_at: at(52 * MIN) } },
  'sensor.viewassist_kitchen': { state: 'normal', attributes: {
    friendly_name: 'the kitchen', home_screen: '/view-assist/clock', mode: 'normal',
    timers: [
      { id: 't1', name: 'pasta', timer_class: 'timer', status: 'running', created_at: at(-3 * MIN), original_expiry: at(9 * MIN), expires: at(9 * MIN) },
      { id: 't2', name: 'bread', timer_class: 'timer', status: 'paused', created_at: at(-7 * MIN), original_expiry: at(38 * MIN), expires: at(38 * MIN), updated_at: at(-4 * MIN) },
      { id: 'a1', name: 'wake up', timer_class: 'alarm', status: 'running', expires: tomorrow(7, 0) },
    ],
    title: 'Pasta timing',
    message: 'Fresh pasta needs **2 to 3 minutes** in well-salted boiling water; dried needs 9 to 11.\n\n* Taste a minute before the packet time\n* Keep a mug of the water for the sauce',
  } },
  'sensor.viewassist_bedroom': { state: 'normal', attributes: {
    friendly_name: 'the bedroom', home_screen: '/view-assist/clock', mode: 'normal', timers: [], title: '', message: "Sorry, I couldn't understand that",
  } },
};

const hourly = Array.from({ length: 14 }, (_, i) => ({
  datetime: at(i * HOUR), temperature: 17 + Math.round(3 * Math.sin((hour + i - 9) / 4) * 10) / 10 - (i > 6 ? 2 : 0),
  condition: i < 4 ? 'partlycloudy' : i < 7 ? 'rainy' : i < 10 ? 'cloudy' : 'clear-night', precipitation: i >= 4 && i < 7 ? [0.4, 1.2, 0.6][i - 4] : 0,
}));
const daily = [['partlycloudy', 19, 11], ['rainy', 16, 10, 3.4], ['cloudy', 15, 9], ['sunny', 18, 8], ['partlycloudy', 20, 11], ['pouring', 14, 10, 8.1]]
  .map(([condition, t, lo, rain], i) => ({ datetime: dateOnly(i), condition, temperature: t, templow: lo, precipitation: rain || 0 }));
const events = {
  'calendar.family': [
    { summary: 'Bin day: recycling', start: dateOnly(0), end: dateOnly(1) },
    { summary: 'Swimming lesson', start: at(-40 * MIN), end: at(20 * MIN), location: 'Leisure centre, Park Road' },
    { summary: 'Dinner with Jo and Priya', start: today(19, 30), end: today(22, 0), location: 'The Olive Tree' },
    { summary: 'Farmers market', start: tomorrow(9, 30), end: tomorrow(11, 0) },
    { summary: 'Boiler service', start: tomorrow(14, 0), end: tomorrow(15, 0) },
  ],
  'calendar.work': [
    { summary: 'Stand-up', start: today(9, 15), end: today(9, 30), location: 'Microsoft Teams Meeting' },
    { summary: 'Cancelled: Design review', start: today(15, 0), end: today(16, 0) },
    { summary: 'Planning', start: tomorrow(10, 0), end: tomorrow(11, 30), location: 'https://zoom.us/j/1' },
  ],
  'calendar.birthdays': [{ summary: "Sam's birthday", start: dateOnly(1), end: dateOnly(2) }],
};

const hass = {
  states, locale: { language: 'en-GB' },
  async callService(domain, service, data) { console.log('callService', domain, service, data); },
  async callWS(msg) {
    if (msg.type === 'conversation/process') {
      await new Promise((r) => setTimeout(r, 700));
      return { conversation_id: 'demo', response: { speech: { plain: { speech: `Done: "${msg.text}". (This is the demo; nothing happened.)` } } } };
    }
    const id = msg.target?.entity_id;
    if (id === 'weather.offline') { await new Promise((r) => setTimeout(r, 300)); throw new Error('the weather service is offline'); }
    if (msg.domain === 'weather') return { response: { [id]: { forecast: msg.service_data.type === 'hourly' ? hourly : daily } } };
    if (msg.domain === 'calendar') return { response: { [id]: { events: events[id] || [] } } };
    throw new Error('not in the demo');
  },
};

const nav = { home: '#', back: '#', back_label: 'Kitchen' };
const VA = { view_assist_sensor: 'sensor.viewassist_kitchen', nav };
const HELP = [
  { name: 'Lights', icon: 'mdi:lightbulb-group', hint: 'Rooms, brightness and scenes', tip: "Say the room's name, or nothing for the room you're in.", examples: [
    { say: 'turn on the lights in the {room}' }, { say: 'dim the living room to 30%' }, { say: 'turn everything off', confirm: true }, { say: 'set the scene to movie night' }] },
  { name: 'Timers', icon: 'mdi:timer-outline', hint: 'Timers and alarms on this tablet', examples: [
    { say: 'set a timer for 10 minutes' }, { say: 'set a pasta timer for 9 minutes' }, { say: 'wake me at 7 tomorrow' }] },
  { name: 'Music', icon: 'mdi:music', hint: 'Speakers in every room', examples: [{ say: 'play some jazz in the {room}' }, { say: 'pause the music' }, { say: 'turn it up' }] },
  { name: 'Weather', icon: 'mdi:weather-partly-cloudy', hint: 'Today and the week ahead', examples: [{ say: 'will it rain today?' }, { say: "what's the weather tomorrow?" }] },
  { name: 'Shopping', icon: 'mdi:cart-outline', hint: 'The shared list', examples: [{ say: 'add oat milk to the shopping list' }, { say: "what's on the shopping list?" }] },
  { name: 'Remember', icon: 'mdi:brain', hint: 'Notes the house keeps', examples: [{ say: 'remember that…', tap: false, note: 'Needs your own words, so it only shows here' }] },
];
const CARDS = {
  weather: { type: 'lamplight-weather-card', entity: 'weather.home', nav },
  agenda: { type: 'lamplight-agenda-card', nav, calendars: {
    'calendar.family': { name: 'Family', icon: 'mdi:home-heart' }, 'calendar.work': { name: 'Work', icon: 'mdi:briefcase-outline' },
    'calendar.birthdays': { name: 'Birthdays', icon: 'mdi:cake-variant-outline' } } },
  timers: { type: 'lamplight-timers-card', ...VA, appliance_timers: [{ entity: 'timer.washing_machine', name: 'Washing machine', icon: 'mdi:washing-machine' }] },
  help: { type: 'lamplight-help-card', ...VA, rooms: { 'sensor.viewassist_kitchen': 'kitchen' }, categories: HELP },
  info: { type: 'lamplight-info-card', ...VA },
  wifi: { type: 'lamplight-wifi-card', qr: './wifi.svg', ssid: 'Guest network', nav },
  'forecast-offline': { type: 'lamplight-weather-card', entity: 'weather.offline', nav, caption: "Weather: the forecast won't load" },
  'help-read-only': { type: 'lamplight-help-card', ...VA, rooms: { 'sensor.viewassist_kitchen': 'kitchen' }, categories: HELP,
    read_only_entity: 'input_boolean.visitors', caption: 'Help: read-only while visitors are in' },
  'info-misfire': { type: 'lamplight-info-card', view_assist_sensor: 'sensor.viewassist_bedroom', nav, wake_phrase: 'Okay Nabu', caption: "Info: didn't catch that" },
};

function mount(name, host) {
  const conf = CARDS[name];
  const el = document.createElement(conf.type);
  el.setConfig(conf);
  el.hass = hass;
  host.appendChild(el);
  return el;
}

const one = new URLSearchParams(location.search).get('card');
if (one && CARDS[one]) {
  document.body.classList.add('single');
  mount(one, document.querySelector('#single'));
} else {
  const grid = document.querySelector('#gallery');
  Object.keys(CARDS).forEach((name) => {
    const fig = document.createElement('figure');
    fig.innerHTML = `<div class="tablet"><div class="screen"></div></div><figcaption><a href="?card=${name}">${CARDS[name].caption || name}</a></figcaption>`;
    grid.appendChild(fig);
    mount(name, fig.querySelector('.screen'));
  });
}
