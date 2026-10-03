# Contributing to Hotkey Chain

The extension itself is in `extension/`; there is no build step, so what you load is what ships.
Everything below is for working on it — using it needs none of this.

### Repository layout

Everything the extension ships lives in `extension/`; everything else is development and store material. There is no build step, so `extension/` *is* the extension — packaging is just "zip that directory", with no include list to keep in sync.

```
extension/          ← the extension itself (Load unpacked points here)
  manifest.json     ← must sit at the root of the zip, or the store rejects it
  assets/           ← vendored runtime libraries and fonts
assets/screenshot/  ← README images (deliberately outside extension/)
docs/  scripts/  test.mjs  descriptions.json   ← never shipped
```

### Tests

```bash
npm test           # or: node --test test.mjs
```

Guards the failures that stay silent instead of loud: the two copies of the action list agree, every action has a display name, a category and a background handler, every i18n key used in the code exists in all 18 locales (a missing key shows the hard-coded fallback instead of the user's language), and `manifest.json` agrees with `package.json` on the version.

Two of them guard the **docs** against drifting away from the code — because nothing else does:

- **the numbers in the docs match the code.** The action count and the locale key count are written in 7 kinds of file, 50+ places (including all 18 `extDescription` strings and the 18-language store description). Don't hand-edit them:

  ```bash
  node scripts/sync-action-count.mjs           # rewrite every occurrence from the code
  node scripts/sync-action-count.mjs --check   # CI mode: exit 1 if stale
  ```

- **the template table in `docs/API.md` matches `CHAIN_TEMPLATES`.** That table had drifted in 18 of 28 rows — a dozen still listed a `show_notification` step that had been removed, three were missing steps, two named the wrong action, one described a different chain entirely. When you change a template, the test tells you which row to fix.

### Build a package

```bash
npm run package    # or: node scripts/package.mjs
```

Produces `dist/hotkey-chain-v<version>.zip`, ready to upload to the Chrome Web Store. The script zips `extension/` and then reads the archive back to confirm `manifest.json` really is at the root and no entry name used backslashes — Windows PowerShell 5.1 can write non-compliant entry names, and the store rejects the result with an unhelpful error.

You only need this before uploading; for day-to-day development, **Load unpacked** on `extension/` is enough. No dependencies required — Node's built-ins plus your OS zip tool.

### Releasing

Pushing a `v*` tag runs [`.github/workflows/release.yml`](.github/workflows/release.yml): it runs the tests, refuses to continue if the tag disagrees with `extension/manifest.json`, packages the extension, verifies the archive, and creates a GitHub Release with the zip attached. Pushes to `main` run the tests only — a gate that fires only at release time is useless, because by then the tag is already public.

### Options page design

`options.css` overrides Bootstrap rather than replacing it, so a few rules are load-bearing and easy to "clean up" by mistake:

- **The action list is a timeline, not a list.** A step's delay is the gap before it runs, so it is drawn on the connector between two tiles instead of as a badge at the end of the row. Zero-delay steps render no chip at all — showing `0ms` on every instant step buried the two delays that actually mattered.
- **`.main-content` clears its horizontal padding.** Bootstrap's `.p-4` sits inside `.container-fluid`'s own padding; the two stack to 96px and cost a whole card column at 768px.
- **Cards stretch to equal height and push their buttons to the bottom**, so Run sits on one line across a row instead of wherever each card's content happens to end.
- **Accessibility floor**: every icon-only button carries an `aria-label` (set from the same i18n key as its tooltip, via `data-i18n-aria` for static markup), focus is visible through `:focus-visible`, and `prefers-reduced-motion` disables the card entrance animation and every hover translate.
- **Logical properties, not physical ones.** Arabic flips the whole page to `dir="rtl"`. The timeline rail uses `inset-inline-start` and `padding-inline-start`; with `left`/`padding-left` the rail stays on the west side of the card while the tiles mirror east, and the two come apart.
- **The action reference reuses the card tiles.** Category colour is how a chain is read at a glance, so the "Available actions" list shows the same coloured tile next to each name — that list is where the colour code is learned.
- **Numbers and units are formatted by the locale** (`label_msValue`, `"$1ms"` vs `"$1 مللي ثانية"`), never concatenated in code: whether a space belongs between them is a language decision.

### Brand assets

Every promo image has a source next to it, because the one that didn't went two design generations without being updated.

| Source | Output | What it is |
| --- | --- | --- |
| `assets/logo.svg` | `extension/icons/icon{16,32,48,128}.png` | The mark. Edit the SVG and re-render; don't touch the PNGs |
| `assets/promo/social.html` | `assets/social-card.png` | 1280×640 — GitHub's social preview size, and a 2:1 card for X |
| `assets/promo/marquee.html` | `assets/screenshot/marquee.png` | 1400×560 Chrome Web Store marquee tile |
| `assets/promo/small.html` | `assets/screenshot/small.png` | 440×280 Chrome Web Store small tile |
| — | `assets/screenshot/*.png` | Store screenshots, 1280×800, English and 简体中文 |

The screenshots have no source file — they are shot from the running extension, so they go stale the moment a label or a layout changes. When you touch the options page, re-shoot them: factory chains (`resetToDefaults`), light theme, and the browser language set per set (`--lang=en-US` / `--lang=zh-CN`) — the factory chain names are localized by the service worker, which follows the browser, not by the page's language override. Encode them as palette PNGs (256 colours, no dither) like the promo tiles: the truecolour capture is about three times the bytes for no visible difference.

Rendered with [html-shot](https://github.com/anthropics/skills) (Playwright + Chromium). `--base .` is what lets the pages resolve the bundled font at `/extension/assets/fonts/`:

```bash
node <html-shot>/render.mjs assets/promo/social.html assets/social-card.png --base . --palette
node <html-shot>/render.mjs assets/logo.svg extension/icons/icon16.png --width 16 --transparent --scale 1
```

Two things are deliberate and easy to undo by accident:

- **The mark is solid shapes, not outlines.** At 16px — the toolbar size, where it is seen most — a ring's interior fills in and the mark turns to mush. Render 16 and 32 with `--scale 1`: at that size crispness beats smoothing.
- **GitHub only reads the social card if you upload it** under *Settings → Social preview*. The `gh` CLI cannot set it, so a fresh render does not go live on its own.

### Third-party code

Vendored under `extension/assets/` — MV3 forbids loading scripts from a CDN. There is no build step, so upgrading means replacing the file.

| Library | Version | Used for |
| --- | --- | --- |
| [Bootstrap](https://getbootstrap.com/) | 5.3.8 | Options-page layout, plus the dropdown, collapse and toast components |
| [Bootstrap Icons](https://icons.getbootstrap.com/) | 1.13.1 | Icons — `extension/assets/fonts/bootstrap-icons.*` must be replaced together with the CSS, the font URLs carry a per-version hash |
| [SortableJS](https://sortablejs.github.io/Sortable/) | 1.15.7 | Drag-and-drop reordering of chains and actions |

`extension/assets/fonts/plus-jakarta-sans.woff2` is a self-hosted UI font. All of the above are MIT-licensed.
Back to the [README](README.md).
