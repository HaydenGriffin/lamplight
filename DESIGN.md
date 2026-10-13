---
name: Lamplight
description: Room-aware home screens on a blurred room photo. Things that are on glow like a lamp. Read from across a room, touched without precision.
colors:
  page: "#0b0c0f"
  page-solid: "#0e0f12"
  panel: "rgba(22,24,29,.74)"
  panel-solid: "#17191e"
  raised: "rgba(255,255,255,.08)"
  raised-2: "rgba(255,255,255,.14)"
  lead-neutral: "rgba(255,255,255,.24)"
  line: "rgba(255,255,255,.07)"
  text: "#f4f2ee"
  muted: "#b9b4ac"
  warm: "#ffc76b"
  warm-ink: "#2a1a04"
  warm-soft: "rgba(255,186,84,.16)"
  warm-glow: "rgba(255,186,84,.45)"
  accent: "#80d8ff"
  accent-ink: "#04222e"
  ok: "#7ee2a8"
  warn: "#ff9d5c"
  alert: "#ff8a80"
  dimmer: "rgba(0,0,0,.55)"
  toast-ground: "rgba(12,13,16,.94)"
  error-ground: "#5a1616"
  error-text: "#ffd7d2"
  danger-ink: "#2b0a07"
  glass: "rgba(12,14,18,.58)"
  phone-panel: "#16181d"
  phone-raised: "#22252b"
  phone-raised-2: "#2e3239"
  phone-warm-ground: "#352a17"
  phone-mode-ground: "#16303a"
  phone-warn-ground: "#382a12"
  phone-alert-ground: "#3d1c1a"
typography:
  display-clock:
    fontFamily: "Lexend, 'Atkinson Hyperlegible Next', sans-serif"
    fontSize: "min(calc((100cqh - 64px) * 1.12), 37cqw)"
    fontWeight: 600
    lineHeight: 0.84
    letterSpacing: "-0.05em"
    fontFeature: "tnum"
  clock-weather:
    fontFamily: "'Lamplight Text', 'Atkinson Hyperlegible Next', Roboto, Arial, sans-serif"
    fontSize: "50px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-1px"
  numeral-lg:
    fontFamily: "Lexend, 'Atkinson Hyperlegible Next', sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.05
    fontFeature: "tnum"
  numeral:
    fontFamily: "Lexend, 'Atkinson Hyperlegible Next', sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.1
    fontFeature: "tnum"
  hero-title:
    fontFamily: "'Lamplight Text', 'Atkinson Hyperlegible Next', Roboto, Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.15
    fontFeature: "tnum"
  headline:
    fontFamily: "'Lamplight Text', 'Atkinson Hyperlegible Next', Roboto, Arial, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.1
  title:
    fontFamily: "'Lamplight Text', 'Atkinson Hyperlegible Next', Roboto, Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.15
  body:
    fontFamily: "'Lamplight Text', 'Atkinson Hyperlegible Next', Roboto, Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.2
  button:
    fontFamily: "'Lamplight Text', 'Atkinson Hyperlegible Next', Roboto, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 600
  label:
    fontFamily: "'Lamplight Text', 'Atkinson Hyperlegible Next', Roboto, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.2
  caption:
    fontFamily: "'Lamplight Text', 'Atkinson Hyperlegible Next', Roboto, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.25
rounded:
  sm: "14px"
  chip: "16px"
  phone-tile: "20px"
  tile: "22px"
  hero: "26px"
  pill: "999px"
  round: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "10px"
  edge-y: "12px"
  edge-x: "14px"
  control: "56px"
  primary: "64px"
components:
  clock-button:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.round}"
    size: "56px"
  back-pill:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 20px 0 14px"
    height: "56px"
  pill-button:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "56px"
  pill-button-raised:
    backgroundColor: "{colors.raised-2}"
  tile:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.tile}"
    padding: "14px"
  disc:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.round}"
    size: "48px"
  disc-on:
    backgroundColor: "{colors.warm}"
    textColor: "{colors.warm-ink}"
  disc-mode:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  hero:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.hero}"
    padding: "16px 18px 18px"
  hero-button:
    backgroundColor: "{colors.raised-2}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "64px"
  hero-button-primary:
    backgroundColor: "{colors.warm}"
    textColor: "{colors.warm-ink}"
  hero-button-lead:
    backgroundColor: "{colors.lead-neutral}"
    textColor: "{colors.text}"
  segmented:
    backgroundColor: "{colors.raised}"
    rounded: "{rounded.pill}"
    padding: "4px"
  segmented-option:
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    height: "56px"
  segmented-option-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  list-chip:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "56px"
  list-chip-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  sheet:
    backgroundColor: "{colors.panel-solid}"
    textColor: "{colors.text}"
    rounded: "26px 26px 0 0"
    padding: "14px 18px 18px"
  sheet-close:
    backgroundColor: "{colors.raised-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.round}"
    size: "56px"
  toast:
    backgroundColor: "{colors.toast-ground}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  toast-error:
    backgroundColor: "{colors.error-ground}"
    textColor: "{colors.error-text}"
  live-dot:
    backgroundColor: "{colors.warm}"
    rounded: "{rounded.round}"
    size: "10px"
  glance-chip:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.text}"
    rounded: "{rounded.chip}"
    padding: "8px 14px 8px 12px"
    height: "62px"
  phone-tab:
    backgroundColor: "{colors.phone-panel}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    height: "56px"
  phone-tab-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  phone-tile:
    backgroundColor: "{colors.phone-panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.phone-tile}"
    padding: "12px"
---

# Design System: Lamplight

> The design system behind a set of Home Assistant wall-tablet dashboards, written from the shipped cards. The six cards in
> [`src/cards`](src/cards) follow it; the tokens and shared components are in [`src/core.js`](src/core.js).

## Overview

**Creative North Star: "Lamplight"**

Every page is the house in the evening. The room's own clock photo sits behind the page, blurred and darkened, and smoked-glass panels float on it. Things that are on glow warm like a lamp; things that are off sit quiet. Sky blue is kept for modes and selection. The signature element is the round icon disc, which carries every icon and lights up when its thing is on.

The primary surface is landscape wall tablets (designed on the Lenovo ThinkSmart View: 788×492 CSS px, an Android 8.1 WebView, touch only), read from across a room by people who don't all see well. Density is low on purpose: big type, few and big targets, one screen with no page scroll. The clock is home; every other page is one or two taps from it and returns to it on its own.

A second surface, a phone dashboard (~390–412 px portrait), speaks the same language (same text, accent, warm and status colours, discs, warm glow, pills, sheets) but on opaque panels, as a vertical scroll, with a sticky tab bar. The phone alone also has a light mode (see Light mode).

**Key Characteristics:**
- Full-bleed page on the blurred room photo; translucent panels on top; radius 0 on the page itself.
- Round discs carry every icon; a filled, glowing warm disc means "on".
- Warm = on / lit / running. Sky = modes and selection. Nothing else gets either colour.
- Atkinson Hyperlegible Next for words, Lexend for digits, everywhere.
- 56px minimum touch target, 64px for the primary action; text never below 16px.
- Bottom sheets over a dimmer with a round close button; short dark toast pills confirm actions.
- Sentence case; MDI icons only.

## Colors

Warm white text on a near-black photo ground, one lamp-amber that means "on", one sky blue for modes and selection, and three status colours.

### Primary
- **Lamp Warm** (warm) with **Lamp Ink** (warm-ink): the colour of "on". A lit tile's disc, its state text, the live dot, progress fills, the volume fill, the primary hero button when it turns something on, the selected light-level option. Warm-coloured *icons* on neutral buttons mark an action that turns something on.
- **Lamp Glow** (warm-soft, warm-glow): the halo around an on disc (`0 0 22px` warm-glow) and soft warm grounds (timer chips, bed half "in", empty-state disc). The on-tile glow is a corner radial gradient of the same amber (see Elevation). Write glows as `rgba(var(--warm-rgb), a)` with `--warm-rgb: 255,186,84`.

### Secondary
- **Sky** (accent) with **Sky Ink** (accent-ink): modes (work, cinema, guest, night) and selection (chosen tab, chosen list, chosen segment, chosen scene). Also the focus ring (3px outline, 2px offset) and presence badges.

### Tertiary
- **Mint** (ok): ready, done, good air.
- **Ember Orange** (warn): needs a look (door open, high usage, a stale reading). Visibly orange, not amber.
- **Coral** (alert): errors, destructive actions, offline.

### Neutral
- **Night Ground** (page; **page-solid** in the Solid variant): the page under the photo.
- **Smoked Glass** (panel): every tile and hero on the photo. In the Solid variant it becomes panel-solid.
- **Sheet Ground** (panel-solid): bottom sheets and anything that must be fully opaque.
- **Raised** (raised) and **Raised 2** (raised-2): buttons, pills, discs at rest and the step brighter (buttons inside a hero, segmented tracks, count badges, slider tracks).
- **Lead Neutral** (lead-neutral): the brighter neutral of a lead hero button that does not turn anything on.
- **Line** (line): hairlines and toast borders.
- **Warm White** (text) and **Warm Grey** (muted): primary and secondary text. Muted clears 4.5:1 on panel and is never used for the main reading.
- **Dimmer** (dimmer) behind sheets; **Toast Ground** (toast-ground) under toasts.
- **Clock Glass** (glass): round buttons and glance chips on the clock face, which sits on the sharp photo rather than the blurred one.

### Phone
The phone has no photo behind its panels, so it uses opaque equivalents: **phone-panel**, **phone-raised**, **phone-raised-2**, and tinted grounds for a whole row or chip: **phone-warm-ground** (lit chip), **phone-mode-ground** (mode tile), **phone-warn-ground** and **phone-alert-ground** (rows that need a look or are failing). Text, muted, warm, accent, ok and alert are the same tokens as the tablets.

### Named Rules
**The Lamp Rule.** Warm means on, lit or running, and nothing else. An idle action button is neutral with a warm icon; a filled, glowing disc always means on.

**The Sky Rule.** Sky blue marks a mode that is on or the thing you selected. It never means "on" for a device and never decorates.

**The Outlined Warning Rule.** A warning is an outlined disc (`inset 0 0 0 2px` warn, transparent fill) with an alert icon and warn-coloured state text. Never a filled disc, because filled means on.

**The Never Colour Alone Rule.** Every coloured state also has an icon and a text state ("On", "Off", "20%", "Open").

**The One Token Rule.** Card CSS reads colours through the custom properties (`var(--warm)`, `rgba(var(--warm-rgb), a)`), never as a literal hex or literal amber rgba.

## Light mode

For the phone only. "Lamplight by day": a warm linen page, warm-white panels, recessed tints for controls, the same lamp amber for "on", a deep sky for selection. Same hierarchy and the same rules as dark; only the token values change. **The wall tablets never go light.**

**Choosing it.** Each person can have a default (light, dark, or match the phone), and the phone itself remembers a choice per login. Match phone follows `prefers-color-scheme` and flips live. Switching re-declares every token under `:host([light])`; nothing reloads. In light mode the card also lights the page around it (Home Assistant's header and view background, the document's theme colour) and puts Home Assistant's own values back when it goes dark again.

| Token | Dark | Light | Notes |
|---|---|---|---|
| page | #0b0c0f | #f4f0e9 | warm linen; also the HA view, header and document |
| panel / panel-solid | #16181d / #17191e | #fffcf7 | tiles, rows, sheets |
| raised | #22252b | #ece6dc | in light, controls are a recessed tint (visible on page and on panels) |
| raised-2 | #2e3239 | #e3dccf | the stronger step: pills in rows, discs, tracks |
| lead-neutral | rgba(255,255,255,.24) | #d9d1c4 | |
| line | rgba(255,255,255,.07) | rgba(60,45,25,.1) | |
| text / text-soft / muted | #f4f2ee / #d8d3cb / #b9b4ac | #1d1a16 / #3b352d / #655d52 | muted ≥4.7:1 on raised-2 |
| accent / accent-ink | #80d8ff / #04222e | #0a6890 / #ffffff | deep sky: a fill with white ink and a text colour (≥4.5:1 on every ground) |
| mode-bg | #16303a | #e1f1f8 | |
| warm / warm-ink | #ffc76b / #2a1a04 | #ffbf4d / #2a1a04 | the lamp **fill** (on discs, go buttons, switches) |
| warm-t | = warm | #7d4b00 | warm **text and icons** ("5 of 5 on", warm action icons) |
| warm-line | = warm | #c27c00 | warm **marks**: meters, progress, sliders, rings, charts, live dot, electricity bars |
| warm-rgb (washes, halo) | 255,186,84 | 245,166,35 | the lit-tile wash and lamp halo, same alphas |
| warm-bg | #352a17 | #fdecc8 | lit chips |
| ok / warn / alert | #7ee2a8 / #ff9d5c / #ff8a80 | #17703e / #a14300 / #b3261e | deepened so they read as text; Outlined Warning Rule unchanged |
| warn-bg / alert-bg | #382a12 / #3d1c1a | #fbe6d3 / #fae1dd | |
| alert-ink | #2b0a07 | #ffffff | armed and danger buttons |
| error-text | #ffd7d2 | #8c1d14 | on alert rows (the error toast keeps the dark value) |
| dimmer | rgba(0,0,0,.55) | rgba(28,22,14,.4) | |
| hero-glass / chip-glass / scrim-soft | dark glass | rgba(255,252,247,.82 / .88 / .72) | frosted white on the room photo |
| hero photo | blur 22 · brightness .42 · wash .15→.55 page | blur 22 · brightness 1.05 · wash .68→.88 page | the room photo stays, frosted light; hero sub-lines use text-soft |
| music art | brightness .5 · dark wash | brightness 1.05 · warm-white wash .6→.86 | |
| photo-scrim / scrim | rgba(8,9,11,.84) / rgba(5,6,7,.62) | unchanged | **text on photos stays white on a dark gradient** (`--on-photo` = #fff) |
| thumb | text, shadow .55 | #ffffff, soft shadow + hairline | slider thumbs |
| shadows | toast/cover/sheet black | rgba(40,30,15,.18–.3) | soft, warm, subtle |
| press | brightness(1.22) | brightness(.94) | a press darkens a light surface |
| sleep deep / light / rem | #5b7fd6 / #9cc3e4 / #b9a0e8 | #3e64c6 / #79a6d8 / #9a7ed8 | |
| HA vars on the host | (view theme) | primary-text, secondary-text, card/primary/secondary-background, divider, primary-color… | so Home Assistant's own cards inside read right |

**The Toast Stays Dark Rule.** Toasts keep the dark pill in light mode (ground #211e1a, opaque, with the dark tokens scoped to the toast: warm-white text, raised-2 Undo, amber Undo icon; the error toast keeps #5a1616 / #ffd7d2). A toast floats over any surface for 2.5 s; a dark pill on a light page separates itself at a glance, as on iOS and Android.

**The Two Warms Rule (light).** `--warm` is only ever a fill with warm ink. Warm words and icons use `--warm-t`; warm lines and bars use `--warm-line`. In dark all three are the same amber, so dark is unchanged.

**The Photo Rule (both modes).** Photos and camera pictures are never tinted. Words on a photo are white (`--on-photo`) on the dark `--photo-scrim` gradient; round badges on photos use the dark `--scrim`.

Contrast is checked against WCAG AA over every tab and the main sheets.

## Typography

**Text Font:** 'Lamplight Text' (with Atkinson Hyperlegible Next, Roboto, Arial)
**Numeral Font:** Lexend (with Atkinson Hyperlegible Next)

**Character:** 'Lamplight Text' is a composite face that `src/core.js` registers on the document: Atkinson Hyperlegible Next for letters, Lexend for the ten digits (U+0030–0039). Atkinson's slashed zero reads as "Ø" from across a room; Lexend's plain zero doesn't. So every number in running text is already Lexend, and large standalone numerals set Lexend directly with tabular figures.

### Hierarchy
- **Display clock** (Lexend 600, fills the clock area, line-height 0.84, -0.05em, tabular): the time on the clock face only. Two pages have a display numeral as their hero: Weather's current temperature (104px) and Energy's "Today so far" total (72px, 58px when the amount is long).
- **Clock weather** (Lamplight Text 400, 50px, line-height 1, -1px): the outdoor temperature at the top left of the clock face only. Set lighter than the time so the time stays the one dominant number.
- **Numeral large** (Lexend 600, 34px, tabular): the big number in a hero or a detail page (energy now, heating room temperatures, timer countdowns, quick-timer minutes, week figures).
- **Numeral** (Lexend 600, 26px, tabular): temperatures in tiles, countdowns in timer chips, sleep and health figures, sheet values.
- **Hero title** (600, 34px; 26–28px when clamped to two lines): the one big line in a hero card.
- **Headline** (600, 30px, line-height 1.1): page title in the header.
- **Title** (600, 26px): sheet titles.
- **Body** (600, 19px, line-height 1.2): tile and row names.
- **Button** (600, 18px): every pill, hero button, chip and toast.
- **Label** (400, 17px, muted): tile states, the header subtitle, section labels (600).
- **Caption** (400, 16px, muted): secondary lines, axis labels, count badges. 16px is the floor.

### Named Rules
**The 16px Floor Rule.** No text is smaller than 16px, on any surface.

**The Lexend Digits Rule.** Every digit is Lexend: through 'Lamplight Text' in running text, set directly with `font-variant-numeric: tabular-nums` for standalone numerals. Lexend is never used for words.

**The Sentence Case Rule.** Titles, buttons, labels and section labels are sentence case. No uppercase, no tracked-out labels. Negative tracking is allowed only on large numerals.

## Layout

**Tablet (primary, 788×492 landscape).** The card fills the screen (`height: calc(100dvh - <measured top>)`); nothing scrolls off the main view except deliberately scrollable lists, which scroll inside their own region with `overscroll-behavior: contain`. Outer padding 12px 14px; gaps 10px (8px in dense grids). CSS grid throughout.

- **Header** (64px): round clock button, then a back pill where the page has a parent, then the title with a one-line live subtitle; at most two round 56px buttons or one pill on the right.
- **Content** (~400px): either a 2-column hero plus quieter tiles (Room), a 4-column grid of ~180px tiles, or a floor plan plus page tiles (65/35 split). Prefer fewer, bigger targets.
- **Overlays** (sheets, toasts) are absolutely positioned inside the card, so they never cover the kiosk app's own chrome.

**Phone (second surface, ~390–412px portrait).**
- Vertical scroll, content capped at 620px and centred.
- **Sticky tab bar** at the top: two 56px pill tabs on a solid page-colour bar with a 16px fade below and the status-bar inset above.
- Room hero at the top (same blurred-photo treatment, scoped to the hero), then sections 26px apart with 22px section headings.
- **2-column grids** (tiles at least 112px tall; a lone last tile spans the row and lies flat); 1 column below 360px.
- **Sheets** rise from the bottom (max 88dvh); big ones (TV, music, cameras) open as **full-height sheets** (`100dvh - 10px`) with their own scroll body. Each sheet pushes a history entry, so the phone's Back button closes it.
- Toasts are fixed under the tab bar.

### Named Rules
**The Control Floor Rule.** Every touch target is at least 56px in its smaller dimension; primary actions on tablets are 64px.

**The One Screen Rule.** A tablet page fits 788×492 without page scroll. If it doesn't fit, cut or move content into a sheet; don't shrink type or targets.

**The Clock Home Rule.** Every tablet page has the clock button first and returns to the clock by itself after inactivity.

## Elevation & Depth

Depth comes from the photo and translucency, not shadows. The blurred room photo (`blur(26px) brightness(.36) saturate(1.15)`, inset -48px) is the bottom layer; smoked-glass panels sit on it; raised neutrals sit on panels. Light is the other depth cue: an "on" thing emits a warm glow.

### Shadow Vocabulary
- **Lamp halo** (`box-shadow: 0 0 22px rgba(var(--warm-rgb), .45)`): on a disc that is on. Only on.
- **Lamp wash** (`radial-gradient(120% 100% at 0% 0%, rgba(var(--warm-rgb), .30), rgba(var(--warm-rgb), 0) 62%)` over panel): the background of a tile that is on.
- **Sheet lift** (`box-shadow: 0 -12px 40px rgba(0,0,0,.6)`): bottom sheets.
- **Toast lift** (`box-shadow: 0 10px 30px rgba(0,0,0,.5)`): toasts.
- **Cover** (`box-shadow: 0 10px 28px rgba(0,0,0,.45)`): album art.

### Named Rules
**The Glow Means On Rule.** Warm glow (halo or wash) appears only on something that is on, lit or running.

**The No Frost Rule.** No `backdrop-filter`, ever. The glass look comes from the pre-blurred photo layer and translucent fills; the kiosk WebView is too slow for live blur.

**Pre-blur.** The live `filter: blur()` on the photo layer is the fallback, not the norm. When `--l-photo` is one image the page may read back (same origin, or served with CORS), the core blurs it once into a 160px-wide canvas with the same look (the blur scaled to that width, brightness .36, saturate 1.15) and sets `--l-photo-soft` to the result and `--l-photo-filter: none` on the card, so the kiosk paints a plain image. Scaled up, it looks the same. Each photo is blurred once for every card on the page. Gradients, other sites' photos without CORS and browsers without canvas filters keep the live blur. Weather has no photo layer (the sky replaces it) and skips it.

**The Solid Variant Rule.** Pages never paint their own background over the photo layer. Setting `--l-photo-show: 0` and pointing `--l-panel` at panel-solid gives the Solid variant; cards read `--l-page`, `--l-panel` and `--l-photo` so it works.

## Shapes

The page is square and full-bleed (radius 0, no border). Inside it everything is soft: 14px for small buttons, covers and inner cards; 16px for the clock's glance chips and timer chips; 22px for tiles (20px on the phone); 26px for the hero and the top corners of sheets; pills (999px) for every text button, chip, segmented control, back pill and toast; circles for discs, the clock button, close buttons and transport controls. Borders are rare: a 2px inset ring marks a warning, a selected item in a list, or a disabled card.

## Components

### Clock button and header
- **Clock button:** 56px circle, raised, `mdi:clock-outline`, `aria-label="Back to clock"`, first in every tablet header.
- **Back pill:** 56px pill, raised, `mdi:arrow-left` plus the real destination's name (never "Clock"), refreshed on `connectedCallback`.
- **Title:** headline with a muted, single-line, live subtitle; warn-coloured when it reports a problem.

### Discs
- **Shape:** 48px circle, raised, 26px MDI icon. 56px for a big disc, 40px for a small one.
- **On:** warm fill, warm ink, lamp halo. **Mode:** sky fill, sky ink, no halo. **Warning:** outlined (see The Outlined Warning Rule). **Ok / alert:** a tinted ground at ~18% with the status colour icon.

### Tiles
- **Style:** smoked glass, 22px, 14px padding, disc top-left, name (body) and state (label, muted) under it. The whole tile is the button.
- **On:** lamp wash plus an on disc; state text in warm.
- **Mode on:** sky disc, state text in sky.
- **Gone / unavailable:** 55% opacity. **Pressed:** `brightness(1.25)`. **Disabled:** 45% opacity.
- **Press and hold** (550ms) sinks the tile to 0.965 and brightens it, then opens history.

### Hero card
- **Style:** the one big thing a room is for. Spans two columns, 26px radius, panel with a faint white lift, 16px 18px 18px padding.
- **Content:** disc and name row, a hero title or large numeral, a live sub-line, then 2–3 64px pill buttons.
- **Buttons:** raised-2 at rest; **primary** is warm with warm ink only when it turns something on; a **lead** action that doesn't is lead-neutral with a warm icon.
- **On / mode on:** a corner wash of warm (on) or sky at 18% (mode).

### Buttons and pills
- **Pill button:** 56px, pill, raised (raised-2 inside a hero or tile), icon plus 18px label.
- **Round button:** 56px circle, raised, icon only, with an `aria-label`.
- **Danger pill:** alert fill with danger ink (`--danger-ink`, #2b0a07), 600 weight, for confirming a cancel, remove or delete. No text-only red buttons.
- **Focus:** 3px sky outline, 2px offset. **Pressed:** `brightness(1.25)`. **Busy:** 70% opacity plus a single 8s fill along the button.

### Segmented control
Raised pill track with a 4px inset; 56px pill options in muted; the selected option is sky with sky ink. Exception that follows The Lamp Rule: a segment that sets light level shows its selected option in warm, because the choice turns lights on.

### Chips
- **List chips (Lists):** 56px pill, raised, 18px label, count badge in raised-2; selected is sky with sky ink and a darkened badge. A round 56px "more" chip ends the row.
- **Glance chips (clock face):** clock glass, 16px radius (chip), at least 62px tall, at most 250px wide. The icon is neutral (text); warm when the chip's subject is on or running (music playing, TV on, an appliance running, a timer counting); sky only for a mode chip (Work mode, Guest room). Warn and alert levels tint the glass and colour the icon. At most five along the bottom of the clock.
- **Timer chips:** 56px, 16px radius, warm-soft ground, Lexend countdown in warm.

### Sliders and progress
- **Slider:** 56px tall hit area, 10px pill track in raised-2 filled in warm up to the value (volume and seek alike), 36px round thumb in warm white (`--text`, #f4f2ee) with a soft shadow (`0 2px 8px rgba(0,0,0,.5)`). Focus as buttons.
- **Progress bar:** 6px track in raised-2, warm fill, Lexend elapsed and duration in caption size.

### Bottom sheets
- **Style:** panel-solid, top corners 26px, 14px 18px 18px padding, up to 720px wide on tablets, sheet lift, over the 55% dimmer (`--dimmer`). Content scrolls inside the sheet with soft scroll-edge shadows. A wide sheet can go full width with tighter padding when it holds a grid of buttons.
- **Header:** disc, title (26px) with a muted sub-line, and a 56px round close button in raised-2 (`mdi:close`, `aria-label="Close"`) at the top right. Every sheet has it; there are no text "Done" or "Close" pills. A primary action (Save, Delete, Cancel timer) can sit at the bottom, but it is never the close. A confirm sheet may offer "Cancel" as one of its choices.
- **Closing:** a tap on the dimmer, the close button, and a timeout; any touch inside restarts the timer. On the phone, Back also closes.

### Toast
- **Style:** a dark pill at the top centre, 14px from the top, z-index above sheets (toast ground, 1px `rgba(255,255,255,.12)` border, 18px/600 text, 12px 22px padding, toast lift, one line with an ellipsis, at most 90% wide), about 2.5s. Every card uses this one style.
- **Help exception:** the Help page's toast carries the assistant's spoken answer, so it wraps to three lines with a 26px radius; everything else matches.
- **Error:** the same pill on a deep red ground (`--error-ground`, #5a1616) with a 1px coral border (`rgba(255,138,128,.45)`) and light coral text (`--error-text`, #ffd7d2). One value on every card, the clock and the phone.
- **Undo:** the toast grows a 56px raised-2 "Undo" pill with a warm icon at its right.

### Live dot
A 10px warm circle that pulses on a 1.6s loop, only beside "motion now", "playing now" or "running now". It is one of only two looping animations (the other is the timer ring) and stops under `prefers-reduced-motion`.

### Phone tab bar and rows
- **Tabs:** two equal 56px pill tabs, phone-panel at rest with muted text, selected in sky with sky ink, each with a Lexend count badge.
- **Rows:** at least 72px, 20px radius, phone-panel, disc then name and state, then a pill or round button. Lit rows get a smaller lamp wash.

## Load states

A card that fetches something (the forecast, the calendars) is always in one of four states, and says which. `loadState()`
in `src/core.js` picks it from what the card knows:

- **Loading:** a quiet muted line where the content will be ("Loading forecast…"). No spinners.
- **Failed:** the fetch failed and there is nothing to show. The one "Couldn't load" block (`failedHtml()`): a 64px
  outlined warning disc with `mdi:cloud-alert-outline` (The Outlined Warning Rule), "Couldn't load the forecast" in the
  title size, "Check the connection, then try again." in muted, and a 56px raised-2 **Retry** pill. The header subtitle
  says it too, in warn ("Forecast unavailable · checked 14:05").
- **Empty:** it loaded and there is nothing: a neutral 72px disc, a bold line and a muted line ("Nothing on"). Never the
  failed look, because nothing is wrong.
- **Ready:** the content.

**The Last Good Data Rule.** Something to show beats an error. A refresh that fails keeps what was on screen; Failed is
only for a card with nothing to show. A page never says "Loading…" for good.

**Retry** tries at once and shows Loading while it does. The cards also try again on their own (the forecast a minute
later, the calendars on their 10-minute refresh), so a tablet left alone recovers without a tap.

## Actions

Every tablet page and the phone follow these.

1. **One action, one name, one service.** Keep a shared vocabulary, with each name always calling the same script:
   **Lights off** (lights only) · **Everything off** (lights, TV, music, warm-ups) · **Good night** (plus heating, blinds,
   night mode) · **Play everywhere** · **Only <Room>** · **Pause everywhere** · **<Room> joins Everywhere** (a switch) ·
   **Screen off / Screen on**.
2. **Stable slots.** While a room or device exists, its control stays in place. If it can't run, show it disabled with a one-line
   reason ("Speaker offline", "Start some music first"). State changes a label or enabled state, never whether it's there.
3. **Hold is only a shortcut.** Every hold target also has a visible **More**, **Edit** or chevron that opens the same thing.
   No hold tips; nothing is discoverable only by holding.
4. **Tap does what the label says.** Navigation rows and tiles carry a chevron; instant actions never do. Chips that act say what
   they do and offer Undo.
5. **Predictable homes.** A room's controls appear in the same order on its tablet page, the phone's room card and the phone
   room sheet: header (temperature · humidity · who's here) → that room's notices → the room's main device → lights and scenes →
   warmth, blinds, appliances, timers → extras. If the phone's card can't fit something, it shows "All <Room> controls".
6. **One confirm pattern** for risky actions: the two-tap arm ("Tap again to …", red, 5 s). Everything off, Good night, TV off,
   anything that starts water or heat.
7. **Text labels** on every button except universal media transport (previous / play-pause / next), close (×) and the clock button.
8. **Per-room notices** show on that room's page and the phone's room surfaces, two at a time plus "N more", dismissed from one
   store so a notice cleared anywhere is cleared everywhere.

## Do's and Don'ts

### Do:
- **Do** put the 56px round clock button first in every tablet header, and a back pill naming the real parent where there is one.
- **Do** keep every text at 16px or more, every target at 56px or more, and tablet primary actions at 64px.
- **Do** show "on" as a warm disc with the lamp halo, a lamp wash on the tile, and warm state text, together with an icon and words.
- **Do** keep sky blue for modes that are on and for the current selection.
- **Do** show warnings as an outlined orange disc with an alert icon and orange state text.
- **Do** read every colour through the custom properties, with the fallbacks above, so the Solid variant and the phone stay in step.
- **Do** set every standalone number in Lexend with tabular figures, and use 'Lamplight Text' first in every text font stack.
- **Do** close every sheet on a dimmer tap, a visible 56px close button and a timeout (and Back on the phone).
- **Do** stop the live dot and every transition under `prefers-reduced-motion`.

### Don't:
- **Don't** use warm for anything that isn't on, lit or running: not idle buttons, not selection, not warnings.
- **Don't** fill or glow a warning disc; a filled glowing disc always means on.
- **Don't** use `backdrop-filter` on any surface.
- **Don't** paint a page background over the photo layer, or hard-code literal hex or literal amber rgba where a token exists.
- **Don't** add animation loops beyond the live dot and the timer ring.
- **Don't** use uppercase, tracked-out labels, or eyebrow or kicker labels above titles.
- **Don't** use emoji or text glyphs as icons; use `<ha-icon icon="mdi:…">` only.
- **Don't** make a page scroll on a tablet to fit content; cut it or move it to a sheet.
- **Don't** show controls for capabilities that don't exist yet.
