# Privacy Policy — Hotkey Chain

**Last updated: 2026-09-18**

Hotkey Chain is a browser automation extension for Chrome and Edge. It runs entirely on your
device. This policy describes exactly what the extension does and does not do with your data.

## Summary

- **No data is collected.** No analytics, no telemetry, no crash reporting.
- **No data is transmitted.** There is no backend, no account, and no sync service.
- **No data is sold or shared** with anyone, for any purpose.
- Everything you configure stays in your own browser.

## What the extension stores

Chains, settings, the chosen interface language, and the keep-awake state are stored locally via
`chrome.storage.local`, inside your browser profile. This data never leaves your device unless you
explicitly export it yourself (**Export** produces a JSON file you choose where to save).

You can delete all of it at any time by removing the extension, or by clearing the extension's
storage from `chrome://extensions`.

## Network requests

The extension makes **no network requests to any server**. The only two `fetch()` calls in the
source code read the extension's own bundled locale files through `chrome.runtime.getURL()` —
i.e. files that ship inside the extension package, loaded from disk.

On-device AI features (summarize / explain / translate) run against Chrome's built-in
`LanguageModel` (Gemini Nano). Prompts, page text, and selections are processed locally on your
hardware. After Chrome's one-time model download (performed by Chrome itself, not by this
extension), no network request is involved.

## Permissions

Every permission the extension requests exists to perform an action you explicitly configure in a
chain — for example `tabs` to close duplicate tabs, `bookmarks` to bookmark a page, or `history`
to remove the current page from history. The extension acts only when you trigger a chain, or when
a URL auto-run rule **you** created matches.

A permission-by-permission justification is in [../store-permissions.md](../store-permissions.md)
and in [CHROMEWEBSTORE.md](../CHROMEWEBSTORE.md).

## Page content

Actions such as *extract all links*, *copy page HTML*, *summarize*, or *save as MHTML* read page
content **at the moment you run the chain**, on the tab you are viewing. That content is written to
your clipboard, saved to a file you chose, or passed to Chrome's on-device model. It is never sent
anywhere else and never stored by the extension.

## Third parties

There are none. The extension bundles all of its code and libraries; it does not load or execute
any remote or eval'd code.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Changes

If this policy ever changes, the updated version will be committed to this repository with a new
"Last updated" date.

## Contact

Open an issue at <https://github.com/rockbenben/hotkey-chain/issues>.
