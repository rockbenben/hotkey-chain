# 🔗 Hotkey Chain (Chrome Extension)

> Chain 77 browser actions and run them by hotkey, address bar, right-click, schedule, or URL match

**English** · [简体中文](README.zh.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) [![365 Open Source Plan #014](https://img.shields.io/badge/365%20Open%20Source%20Plan-%23014-1f6feb)](https://github.com/rockbenben/365opensource)

**[⬇ Install from the Chrome Web Store](https://chromewebstore.google.com/detail/hotkey-chain/kcinhmiihahdgckoonemglanjpggdldb)** · [load an unpacked build](#-installation)

![Chain list](assets/screenshot/1-chain-list.png)

Think of macOS/iOS Shortcuts, but living inside Chrome. Build a sequence once (a "chain"), then run it anywhere — with per-step delays, conditions, variables, and chains that call other chains.

## Table of Contents

- [Highlights](#-highlights)
- [Compatibility](#-compatibility)
- [Triggers](#-triggers)
- [Actions](#-actions)
- [Flow control & variables](#-flow-control--variables)
- [Permissions & privacy](#-permissions--privacy)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#️-configuration)
- [Internationalization](#-internationalization)

## 🧩 Compatibility

| Aspect | Supported |
| --- | --- |
| Browser | Chrome 116+, Edge 116+, and other Chromium browsers |
| Install | Chrome Web Store, or load `extension/` unpacked — no build step |
| Two actions need a newer Chrome | *Add to reading list* needs 120+ (falls back with a notice); *Save page as MHTML* needs 116+ |
| Where chains run | Any `http(s)` page. Browser pages (`chrome://`, the Web Store) block extension scripts, so page actions are skipped there |
| Data | Stays in your browser — no account, no sync, no server |

## ✨ Highlights

- **77 actions** across pages, tabs, windows, media, content, and the browser itself
- **Five ways to trigger** a chain — hotkey, icon, right-click, address bar, schedule, or URL auto-run
- **Flow control**: conditions, sub-chains, and template variables make a chain behave like a tiny script
- **Visual editor**: build chains with grouped action pickers, per-step delays, and drag-and-drop ordering
- **Template gallery**: one click to add ready-made chains (Focus mode, Tab cleanup, Video mode, …)
- **Backup & share**: export/import the whole config, or share a single chain as its own file
- **18 languages**: switch the entire UI between English, 简体中文, 日本語, العربية and 14 more

## ⚡ Triggers

| Trigger | How |
| --- | --- |
| **Hotkey** | `Ctrl+Shift+H` runs the default chain; `Ctrl+Shift+1/2/3` run chains 1–3; chains 4–9 have bindable slots |
| **Toolbar icon** | Click to run the default chain; right-click for a menu of your chains |
| **In-page right-click** | Run a chain from the page, a text selection, a link, an image, or media |
| **Address bar** | Type `hc` + space + a chain name to find and run it (omnibox) |
| **Schedule** | Run a chain every N minutes in the background (`chrome.alarms`) |
| **URL auto-run** | Run a chain automatically when a freshly loaded page matches your URL patterns (with a loop-guard cooldown) |

## 🎬 Actions

77 actions in nine groups. The extension lists every one of them, in your language, under **Available actions** on the options page — this table is just the shape of it.

| Group | What's in it |
| --- | --- |
| **Page** | Scroll, reload, back/forward, fullscreen, dark mode, translate, print, open a URL |
| **Tabs** | Close duplicates, sort by URL, group by domain, mute, discard to free memory, reopen closed, move and switch |
| **Windows** | New, close, minimize, maximize, incognito, move tab to its own window |
| **Media** | Play/pause, playback speed, read the selection aloud |
| **Content** | Copy the URL, title, selection, a Markdown link, or your own format; search the selection; bookmark; add to reading list |
| **Zoom** | In, out, reset |
| **Flow control** | Conditions, confirmation prompts, sub-chains, waits |
| **Advanced** | Hard refresh, screenshot, save as MHTML, notifications, clear cache or this site's data, keep awake |
| **Extension control** | Enable/disable, uninstall, reload a dev build, open another extension's options or store page. This group is what the `management` permission is for — see [Permissions & privacy](#-permissions--privacy) |

## 🔀 Flow control & variables

A chain isn't just a fixed list — you can branch and compose:

- **Conditions** — `Continue if URL matches` and `Continue if text is selected` stop the chain early when the condition fails
- **Confirmation** — `Ask to confirm` pauses the chain and shows a dialog on the page; the rest runs only if you choose Continue. Put it before a destructive step like *Close other tabs*
- **Sub-chains** — `Run another chain` calls a chain as a step (with loop and depth guards)
- **Variables** — in *Open URL*, *Copy text*, *Ask to confirm* and *Show notification* text, use `{url}` `{title}` `{selection}` `{clipboard}` `{date}` `{time}` (e.g. search the selection on any site)
- **Run feedback** — a toolbar badge shows while a chain runs; failures raise an error badge plus a system notification

## 🔐 Permissions & privacy

The install prompt asks for a lot, because an action can only be offered if the permission behind it is granted. Here is what the broad ones are actually for:

| Permission | Needed by |
| --- | --- |
| `<all_urls>` + `scripting` + `activeTab` | Every action that runs *inside* a page: scroll, dark mode, translate, copy selection, read aloud. It has to work on whatever site you're on, so it can't be scoped to a list. |
| `management` | The **Extension control** actions — enable / disable / uninstall another extension, reload a dev build. Uninstall always asks for confirmation. |
| `browsingData` | *Clear browser cache* and *Clear this site's data*. |
| `history` | *Remove page from history*. |
| `clipboardRead` / `clipboardWrite` | The copy actions, and the `{clipboard}` variable. |
| `pageCapture` | *Save page as MHTML*. |
| `tabs` · `tabGroups` · `sessions` | The tab and window actions — sorting, grouping, reopening a closed tab. |
| `bookmarks` · `readingList` · `downloads` · `search` | Bookmark, reading-list, download-folder, and search-selection actions. |
| `tts` · `notifications` · `alarms` · `power` | Read aloud, notifications, scheduled chains, keep-awake. |
| `storage` · `contextMenus` | Your chains, and the right-click menu. |

**Nothing leaves your browser.** There is no analytics, no telemetry, and no backend — the only two `fetch` calls in the source read the extension's own bundled locale files via `chrome.runtime.getURL()`. Chains and settings live in `chrome.storage`; export/import is a local file you choose.

If you don't want to grant this much, load an unpacked build and delete the permissions you don't need from `extension/manifest.json` — the actions that depend on them will fail, everything else keeps working.

## 📦 Installation

**[From the Chrome Web Store](https://chromewebstore.google.com/detail/hotkey-chain/kcinhmiihahdgckoonemglanjpggdldb)** — one click, auto-updates. This is all most people need.

To run it from source instead (to modify it, or to trim permissions):

1. Clone or download this repository
2. Open `chrome://extensions` and enable **Developer mode**
3. Click **Load unpacked** and select the **`extension`** folder (the one with `manifest.json` directly inside)
4. The 🔗 icon appears in the toolbar

Customize keyboard shortcuts at `chrome://extensions/shortcuts` (the keyboard icon in the options toolbar jumps straight there).

Working on the extension — tests, packaging, releasing, brand assets — is in [CONTRIBUTING.md](CONTRIBUTING.md).

## 🚀 Quick Start

1. Click the 🔗 icon to run the default chain, or right-click it for the chain menu
2. Open **Options** to manage chains — start from a template, or build your own
3. In a chain: add actions, set per-step delays, drag to reorder, then bind a hotkey or trigger
4. Hit **Test Run** to try it on the current tab

## 🛠️ Configuration

- The options page is a visual editor: grouped action pickers, per-step delays (ms), and drag-and-drop ordering. Each chain card previews its first three steps as a timeline, with the delay shown on the connector between them
- The toolbar splits by weight: library operations (language, shortcuts, export, import, restore) on the left, the two actions that create something on the right
- Each chain can carry its own triggers — a schedule interval and URL auto-run patterns
- **Execute command** lists the commands of any extension (including this one); **Call extension** sends a structured message (template or custom JSON)
- Chains and their order are stored in `chrome.storage.local`
- The toolbar's **Export/Import** buttons back up or restore the whole config as JSON; **Export this chain** (in the editor) shares one chain as a file

## 🌍 Internationalization

- **18 languages**: English, 简体中文, 繁體中文, 日本語, 한국어, Español, Français, Deutsch, Português (Brasil), Русский, Italiano, العربية, हिन्दी, Bahasa Indonesia, Türkçe, Tiếng Việt, ไทย, Polski — default follows the browser
- The options page has a language selector that overrides the entire extension — background, menus, notifications, and commands; right-to-left layout is applied automatically for Arabic
- Locale files live in `extension/_locales/<code>/messages.json` (e.g. `en`, `zh_CN`, `ja`, `ar`), 340 keys each — `npm test` fails if any locale drifts out of sync
- Chrome's i18n has no plural rules, so counts that vary use a pair of keys (`actions_count_one` / `actions_count`); languages without a plural distinction simply repeat the same string

## About the 365 Open Source Plan

Project **#014** of the [365 Open Source Plan](https://github.com/rockbenben/365opensource) — one person + AI, 300+ open-source projects in a year.

[Submit your idea →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
