// Just enough of a browser for the modules to load in node (no rendering): custom elements, document.head, window.
// FakeElement stands in for a card and its shadow root: querySelector('.x') always finds the same element for a selector
// (attribute selectors like '[data-deadline]' find nothing), so a test can render a card and read what it wrote.
class FakeElement {
  constructor() {
    this.kids = new Map(); this.html = ''; this.textContent = ''; this.hidden = false; this.className = '';
    this.dataset = {}; this.attrs = {}; this.listeners = {};
    const props = {};
    this.style = { props, setProperty: (k, v) => { props[k] = String(v); }, removeProperty: (k) => { delete props[k]; }, getPropertyValue: (k) => props[k] || '' };
  }
  get innerHTML() { return this.html; }
  set innerHTML(v) { this.html = String(v); this.kids.clear(); }
  get classList() {
    const list = () => this.className.split(/\s+/).filter(Boolean);
    const set = (names) => { this.className = names.join(' '); };
    return {
      contains: (c) => list().includes(c),
      add: (c) => { if (!list().includes(c)) set([...list(), c]); },
      remove: (c) => set(list().filter((x) => x !== c)),
      toggle: (c, on = !list().includes(c)) => { if (on) { if (!list().includes(c)) set([...list(), c]); } else set(list().filter((x) => x !== c)); return on; },
    };
  }
  querySelector(sel) {
    if (sel.startsWith('[')) return null;
    if (!this.kids.has(sel)) this.kids.set(sel, new FakeElement());
    return this.kids.get(sel);
  }
  querySelectorAll() { return []; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  removeEventListener() {}
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }
  removeAttribute(k) { delete this.attrs[k]; }
  toggleAttribute(k, on) { if (on) this.attrs[k] = ''; else delete this.attrs[k]; }
  getBoundingClientRect() { return { top: 0, left: 0, width: 788, height: 492 }; }
  attachShadow() { this.shadowRoot = new FakeElement(); return this.shadowRoot; }
  get isConnected() { return true; }
  /* A tap on an element with data-act: what the card's click listener sees. */
  tap(dataset) { for (const fn of this.listeners.click || []) fn({ composedPath: () => [{ dataset }] }); }
}

export function installDom({ fontBase } = {}) {
  const defined = new Map();
  const head = [];
  globalThis.window = globalThis;
  globalThis.HTMLElement = FakeElement;
  globalThis.customElements = {
    define(tag, cls) {
      if (defined.has(tag)) throw new Error(`${tag} has already been defined`);
      defined.set(tag, cls);
    },
    get: (tag) => defined.get(tag),
  };
  globalThis.document = {
    getElementById: (id) => head.find((el) => el.id === id) || null,
    createElement: (tag) => ({ tagName: tag, id: '', textContent: '' }),
    head: { appendChild: (el) => head.push(el) },
  };
  globalThis.location = { pathname: '/home', search: '' };
  const listeners = {};
  globalThis.addEventListener = (type, fn) => { (listeners[type] ||= new Set()).add(fn); };
  globalThis.removeEventListener = (type, fn) => { listeners[type]?.delete(fn); };
  const observed = new Set();
  globalThis.ResizeObserver = class {
    constructor(fn) { this.fn = fn; }
    observe(el) { observed.add(el); }
    unobserve(el) { observed.delete(el); }
    disconnect() { observed.clear(); }
  };
  globalThis.requestAnimationFrame = (fn) => { fn(); return 0; };
  globalThis.customCards = undefined;
  if (fontBase) globalThis.lamplightFontBase = fontBase;
  else delete globalThis.lamplightFontBase;
  return { defined, head, listeners, observed };
}

/* A stand-in Home Assistant: states, and callService / callWS answered by the test (or a plain resolve). */
export function fakeHass(states = {}, { ws, service } = {}) {
  const calls = [];
  return {
    states, calls, locale: { language: 'en-GB' },
    async callService(domain, name, data) { calls.push({ domain, service: name, data }); return service?.(domain, name, data); },
    async callWS(msg) { calls.push(msg); return ws ? ws(msg) : {}; },
  };
}
