// Just enough of a browser for the modules to load in node (no rendering): custom elements, document.head, window.
export function installDom({ fontBase } = {}) {
  const defined = new Map();
  const head = [];
  globalThis.window = globalThis;
  globalThis.HTMLElement = class {};
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
  globalThis.location = { pathname: '/home' };
  globalThis.addEventListener = () => {};
  globalThis.customCards = undefined;
  if (fontBase) globalThis.lamplightFontBase = fontBase;
  else delete globalThis.lamplightFontBase;
  return { defined, head };
}
