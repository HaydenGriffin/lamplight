// The cards' behaviour, rendered into test/dom.mjs's stand-in elements: load states, Retry, and what a tap runs.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fakeHass, installDom } from './dom.mjs';

installDom();
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
