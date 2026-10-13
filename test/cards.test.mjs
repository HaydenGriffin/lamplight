// The cards' behaviour, rendered into test/dom.mjs's stand-in elements: load states, Retry, and what a tap runs.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fakeHass, installDom } from './dom.mjs';

const dom = installDom();
const lib = await import('../src/index.js');
const tick = () => new Promise((r) => setTimeout(r, 0));

test('loadState: something to show beats an error', () => {
  assert.equal(lib.loadState({ loading: true }), 'loading');
  assert.equal(lib.loadState({ error: new Error('x') }), 'failed');
  assert.equal(lib.loadState({ error: new Error('x'), count: 3 }), 'ready');
  assert.equal(lib.loadState({}), 'empty');
  assert.match(lib.failedHtml('the <forecast>'), /Couldn't load the &lt;forecast&gt;.*data-act="retry"/s);
});

test('weather: a failed forecast says so with Retry, and Retry loads it', async () => {
  let fail = true;
  const forecast = [0, 1, 2].map((i) => ({ datetime: new Date(Date.now() + i * 3600e3).toISOString(), temperature: 15 + i, condition: 'cloudy' }));
  const hass = fakeHass({ 'weather.home': { state: 'cloudy', attributes: { temperature: 15 } } }, {
    ws: (msg) => { if (fail) throw new Error('offline'); return { response: { 'weather.home': { forecast } } }; },
  });
  const card = new lib.LamplightWeatherCard();
  card.setConfig({ entity: 'weather.home' });
  card.hass = hass;
  const hours = card.shadowRoot.querySelector('.hours');
  assert.match(hours.innerHTML, /Loading forecast/);
  await tick();
  assert.match(hours.innerHTML, /Couldn't load the forecast/);
  assert.match(card.shadowRoot.querySelector('.sub').textContent, /Forecast unavailable/);

  card.hass = hass;  // a state update within the minute doesn't hammer the service
  assert.equal(hass.calls.length, 2);

  fail = false;
  card.shadowRoot.tap({ act: 'retry' });
  assert.match(card.shadowRoot.querySelector('.hours').innerHTML, /Loading forecast/);
  await tick();
  assert.equal(hass.calls.length, 4);
  assert.match(card.shadowRoot.querySelector('.hours').innerHTML, /Next 12 hours/);
  assert.equal(card.shadowRoot.querySelector('.sub').textContent, '');
  card.disconnectedCallback();
});

test('agenda: no calendar read is a failed load with Retry; one read is enough to show', async () => {
  let fail = true;
  const hass = fakeHass({ 'calendar.a': { state: 'off', attributes: {} }, 'calendar.b': { state: 'off', attributes: {} } }, {
    ws: (msg) => { if (fail || msg.target.entity_id === 'calendar.b') throw new Error('offline'); return { response: { 'calendar.a': { events: [] } } }; },
  });
  const card = new lib.LamplightAgendaCard();
  card.setConfig({ calendars: ['calendar.a', 'calendar.b'] });
  card.hass = hass;
  await tick();
  const root = card.shadowRoot;
  assert.match(root.querySelector('.today').innerHTML, /Couldn't load the calendars.*data-act="retry"/s);
  assert.ok(root.querySelector('main').classList.contains('failed'));

  fail = false;
  root.tap({ act: 'retry' });
  await tick();
  assert.match(root.querySelector('.today').innerHTML, /Nothing on/);
  assert.ok(!root.querySelector('main').classList.contains('failed'));
  card.disconnectedCallback();
});

test('the page fit: one shared observer while cards are connected, gone after, back on a reconnect', () => {
  const a = new lib.LamplightWifiCard(); a.setConfig({ qr: '/local/qr.svg' }); a.hass = fakeHass();
  const b = new lib.LamplightWifiCard(); b.setConfig({ qr: '/local/qr.svg' }); b.hass = fakeHass();
  assert.deepEqual([...dom.observed], [a, b]);
  assert.equal(dom.listeners.resize.size, 1);
  assert.equal(a.style.getPropertyValue('--l-top'), '0px');
  a.disconnectedCallback();
  assert.deepEqual([...dom.observed], [b]);
  b.disconnectedCallback();
  assert.equal(dom.observed.size, 0);
  assert.equal(dom.listeners.resize.size, 0);
  b.connectedCallback();
  assert.deepEqual([...dom.observed], [b]);
  assert.equal(dom.listeners.resize.size, 1);
  b.disconnectedCallback();
});

test('the page photo is blurred once into an image; without one the live blur stays', async () => {
  const drawn = [];
  globalThis.Image = class { set src(v) { this.url = v; this.naturalWidth = 1600; this.naturalHeight = 1000; setTimeout(() => this.onload()); } };
  const createElement = document.createElement;
  document.createElement = (tag) => (tag === 'canvas' ? { getContext: () => ({ filter: '', drawImage() { drawn.push(this.filter); } }), toDataURL: () => 'data:image/jpeg;base64,AAAA' } : createElement(tag));
  let photo = 'url("/local/room.jpg")';
  globalThis.getComputedStyle = () => ({ getPropertyValue: (k) => (k === '--l-photo' ? photo : '') });
  globalThis.location.href = 'http://ha.local/home';
  globalThis.location.origin = 'http://ha.local';
  try {
    assert.match(lib.BASE_CSS, /var\(--l-photo-soft,var\(--l-photo,none\)\).*filter:var\(--l-photo-filter,blur\(26px\) brightness\(0\.36\) saturate\(1\.15\)\)/);
    const card = new lib.LamplightWifiCard(); card.setConfig({ qr: '/local/qr.svg' }); card.hass = fakeHass();
    await tick(); await tick();  // shell() started it
    assert.equal(card.style.getPropertyValue('--l-photo-soft'), 'url("data:image/jpeg;base64,AAAA")');
    assert.equal(card.style.getPropertyValue('--l-photo-filter'), 'none');
    const other = new lib.LamplightHelpCard(); other.setConfig({ categories: [{ name: 'A', examples: [] }] }); other.hass = fakeHass();
    await tick(); await tick();
    assert.equal(drawn.length, 1);  // the same photo is blurred once for every card
    assert.match(drawn[0], /^blur\(5\.28px\)/);  // 26px at 160 of 788px
    photo = 'radial-gradient(#000, #111)';
    card.connectedCallback(); await tick();
    assert.equal(card.style.getPropertyValue('--l-photo-soft'), '');
    assert.equal(card.style.getPropertyValue('--l-photo-filter'), '');
    card.disconnectedCallback(); other.disconnectedCallback();
  } finally {
    delete globalThis.Image; delete globalThis.getComputedStyle; document.createElement = createElement;
  }
});

test('info: a reply that is not an answer shows "Didn\'t catch that" with the configured wake phrase', async () => {
  const { isMisfire } = await import('../src/cards/info.js');
  assert.ok(isMisfire("Sorry, I couldn't understand that"));
  assert.ok(isMisfire('Hey Jarvis.', 'Hey Jarvis'));
  assert.ok(!isMisfire('Hey Jarvis.'));
  assert.ok(!isMisfire('It is 14 degrees and sunny.'));
  assert.ok(!isMisfire(`${'A long answer that mentions it could not understand the question. '.repeat(3)}`));

  const va = { message: "Sorry, I couldn't understand that", title: '', image: '/local/pic.jpg', mode: 'normal',
    alert_data: { header: 'Door open', line1: 'The back door is open', line2: 'for 10 minutes' } };
  const hass = fakeHass({ 'sensor.viewassist_hall': { state: 'normal', attributes: va } });
  const card = new lib.LamplightInfoCard();
  card.setConfig({ view_assist_sensor: 'sensor.viewassist_hall', wake_phrase: 'Hey Jarvis' });
  card.hass = hass;
  const main = card.shadowRoot.querySelector('main');
  assert.match(main.innerHTML, /Didn't catch that.*Say "Hey Jarvis" and try again.*It replied: Sorry, I couldn&#39;t understand that/s);
  assert.ok(card.shadowRoot.querySelector('.keep').hidden);

  location.search = '?alert=1';
  card.hass = { ...hass };
  assert.equal(card.shadowRoot.querySelector('h1').textContent, 'Door open');
  assert.match(card.shadowRoot.querySelector('main').innerHTML, /The back door is open\nfor 10 minutes/);

  location.search = '?pic=1';
  va.message = 'Here is the garden camera';
  card.hass = { ...hass };
  assert.match(card.shadowRoot.querySelector('main').innerHTML, /<img src="\/local\/pic.jpg"/);
  location.search = '';
  card.disconnectedCallback();
});

test('help: while read_only_entity is on, the examples show but a tap runs nothing', async () => {
  const states = { 'input_boolean.visitors': { state: 'on', attributes: {} } };
  const hass = fakeHass(states, { ws: () => ({ response: { speech: { plain: { speech: 'Done' } } } }) });
  const card = new lib.LamplightHelpCard();
  card.setConfig({ wake_phrase: 'Hey Jarvis', read_only_entity: 'input_boolean.visitors',
    categories: [{ name: 'Lights', examples: [{ say: 'turn on the lights' }] }] });
  card.hass = hass;
  const root = card.shadowRoot;
  assert.doesNotMatch(root.querySelector('.panel').innerHTML, /data-act="try"/);
  assert.match(root.querySelector('.panel').innerHTML, /class="ex still".*turn on the lights/s);
  assert.match(root.innerHTML, /<span class="sub">Start with &quot;Hey Jarvis&quot;, then say it<\/span>/);
  const btn = new HTMLElement(); btn.querySelector('.go');
  await card.tryExample(0, btn);
  assert.equal(hass.calls.length, 0);

  states['input_boolean.visitors'] = { state: 'off', attributes: {} };
  card.hass = hass;
  assert.match(root.querySelector('.panel').innerHTML, /data-act="try"/);
  assert.equal(root.querySelector('.sub').textContent, 'Tap an example to try it for real');
  await card.tryExample(0, btn);
  assert.equal(hass.calls[0].type, 'conversation/process');
  assert.equal(hass.calls[0].text, 'turn on the lights');
  card.hideToast?.(); clearTimeout(card.toastTimer);
  card.disconnectedCallback();
});

test('toast: an Undo action runs once from its button, and the toast goes', () => {
  const card = new lib.LamplightWifiCard(); card.setConfig({ qr: '/local/qr.svg' }); card.hass = fakeHass();
  let undone = 0;
  card.toast('Lights off', false, lib.TOAST_MS, () => { undone += 1; });
  const toast = card.shadowRoot.querySelector('.toast');
  assert.match(toast.innerHTML, /Lights off<\/span><button class="undo" data-act="undo">/);
  assert.ok(toast.classList.contains('has-undo') && !toast.hidden);
  card.shadowRoot.tap({ act: 'undo' });
  card.shadowRoot.tap({ act: 'undo' });
  assert.equal(undone, 1);
  assert.ok(toast.hidden);
  card.toast('Saved');
  assert.doesNotMatch(toast.innerHTML, /undo/);
  card.disconnectedCallback();
});

test('timers: paused rows, Undo on a cancelled timer, and the two-tap arm for alarms', async () => {
  const now = Date.now(); const iso = (ms) => new Date(now + ms).toISOString();
  const timers = [
    { id: 't1', name: 'pasta', timer_class: 'timer', status: 'running', created_at: iso(-60e3), original_expiry: iso(270e3), expires: iso(270e3) },
    { id: 't2', name: 'bread', timer_class: 'timer', status: 'paused', expires: iso(600e3), updated_at: iso(-300e3) },
    { id: 'a1', name: 'wake up', timer_class: 'alarm', status: 'running', expires: iso(9 * 3600e3) },
  ];
  const hass = fakeHass({ 'sensor.viewassist_kitchen': { state: 'normal', attributes: { friendly_name: 'the kitchen', timers } } });
  const card = new lib.LamplightTimersCard();
  card.setConfig({ view_assist_sensor: 'sensor.viewassist_kitchen' });
  card.hass = hass;
  const root = card.shadowRoot;
  assert.deepEqual(card.vaTimers.map((t) => [t.id, t.paused]), [['t1', false], ['a1', false], ['t2', true]]);
  assert.equal(card.vaTimers[2].left, 900);  // the time it had left when it was paused
  assert.match(root.querySelector('.list').innerHTML, /row timer paused.*15<u>min<\/u> 0<u>s<\/u>.*Bread · paused/s);
  assert.equal(root.querySelector('.sub').textContent, '1 running · next done at ' + card.hhmm(now + 270e3));

  root.tap({ act: 'cancel', arg: 't1', name: 'Pasta' });
  await tick();
  assert.deepEqual(hass.calls.at(-1), { domain: 'view_assist', service: 'cancel_timer', data: { timer_id: 't1' } });
  assert.match(root.querySelector('.toast').innerHTML, /Pasta cancelled.*Undo/s);
  root.tap({ act: 'undo' });
  await tick();
  const again = hass.calls.at(-1);
  assert.equal(again.service, 'set_timer');
  assert.equal(again.data.name, 'pasta');
  assert.match(again.data.time, /^4 minutes (29|30) seconds$/);

  const before = hass.calls.length;
  root.tap({ act: 'cancel', arg: 'a1', name: 'Wake up' });
  assert.equal(hass.calls.length, before);  // armed, not cancelled
  assert.match(root.querySelector('.list').innerHTML, /pill danger.*Tap again to cancel/s);
  root.tap({ act: 'cancel', arg: 'a1', name: 'Wake up' });
  await tick();
  assert.deepEqual(hass.calls.at(-1).data, { timer_id: 'a1' });
  assert.doesNotMatch(root.querySelector('.toast').innerHTML, /Undo/);
  card.disconnectedCallback();
});
