# Changelog

## 1.2.0 (13 October 2026)

**Load states.** A card that fetches something now says whether it is loading, failed, empty or ready. When the
forecast or the calendars can't be read, the card shows "Couldn't load …" with a Retry button and a warning subtitle,
instead of "Loading forecast…" for good. A refresh that fails keeps what was on screen. New in the core: `loadState()`,
`failedHtml()` and a `retry()` hook. See DESIGN.md, Load states.

**Page fit.** Cards size themselves to the screen with one shared ResizeObserver instead of polling every 2 seconds.
They stop watching when they leave the page and start again when Home Assistant brings a view back. Dispatch
`lamplight-layout` on `window` if your dashboard moves things without a resize. New `resized()` hook.

**Pre-blurred photo.** When `--l-photo` is one image, it is blurred once into a small image (`preblur()`) and shown with
no live filter, which is much lighter on kiosk tablets. Gradients and images the page can't read keep the live blur.

**Cards**
- Timers: paused timers show the time they have left. Cancelling a running timer offers Undo, which sets it again for
  the time it had left. Alarms, reminders and paused timers ask for a second tap ("Tap again to cancel").
- Info: a reply that isn't an answer shows "Didn't catch that", naming your `wake_phrase` if you set one.
  `?alert=1` shows View Assist's `alert_data`, and `?pic=1` shows the image without `show_image`.
- Help: with `read_only_entity` on, the examples are shown but a tap runs nothing.
- Wi-Fi follows the Lamp Rule: a neutral disc, a drop shadow on the code, and plain bold steps. Nothing on that page is
  "on".
- `toast()` takes an optional Undo action, and `call()` passes one through. New `hideToast()`, `TOAST_MS` and `UNDO_MS`.

**Theme.** `themes/lamplight.yaml` puts Home Assistant's own header, sidebar and stock cards in the Lamplight colours.

**Demo and tests.** The demo gallery adds a forecast that won't load, a paused timer, read-only Help and a misfire, on a
room photo the cards pre-blur. Card behaviour tests run in node against a stand-in DOM.

## 1.1.0 (9 October 2026)

**A reusable module layer.**
- `src/` is ES modules: `core.js` exports the base class and helpers, each card imports what it uses and exports its
  class, and `src/index.js` re-exports it all.
- `dist/lamplight.js` is built with esbuild into an ES module with the same exports. It is still one HACS plugin file,
  so other cards can `import { LamplightCard, define, esc } …`.
- The fonts are still found next to the bundle, and `window.lamplightFontBase` can point somewhere else.
- `define()` registers a tag once and lists it in the card picker once, so two copies of the bundle don't clash.
- `dayStart` is now a core export. The timers card had been using the agenda card's copy.
- New: module tests (node, no browser), CI checks that the bundle is up to date, and a README section, "Building on
  Lamplight".

## 1.0.0 (7 October 2026)

Initial release. DESIGN.md (the Lamplight design system) and six cards for Home Assistant wall tablets: weather,
agenda, timers, help, info and Wi-Fi. Also the bundled fonts (Atkinson Hyperlegible Next with Lexend digits), a demo
on a stand-in Home Assistant, and the HACS packaging.
