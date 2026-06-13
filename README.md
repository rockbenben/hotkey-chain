# 🔗 Hotkey Chain (Chrome Extension)

<div align="right">English | <a href="./README_zh-CN.md">简体中文</a></div>

> **Shortcuts for your browser.** Chain dozens of browser actions together and trigger them however you like — a hotkey, the address bar, a right-click, a schedule, or automatically when a page matches a URL pattern.

Think of macOS/iOS Shortcuts, but living inside Chrome. Build a sequence once (a "chain"), then run it anywhere — with per-step delays, conditions, variables, and chains that call other chains.

## Table of Contents

- [Highlights](#-highlights)
- [Triggers](#-triggers)
- [Actions](#-actions)
- [Flow control & variables](#-flow-control--variables)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#️-configuration)
- [Internationalization](#-internationalization)
- [License](#-license)

## ✨ Highlights

- **75+ actions** across pages, tabs, windows, media, content, and the browser itself
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

**Page** — scroll top/bottom, scroll one screen up/down, reload, back/forward, fullscreen, dark mode, translate page, print, open URL (new or current tab, supports variables)

**Tabs** — new / close / close others / close to the left or right / close duplicates · sort by URL · group & ungroup by domain · duplicate / pin / mute (one or all) · reload all · discard others to free memory · jump to the audible tab · bookmark all tabs · move left / right / first / last · prev / next · reopen closed tab

**Windows** — new / close / minimize / maximize · open incognito · move tab to a new window

**Media** — play/pause · playback speed up / down / reset · read selection aloud (TTS) · stop reading

**Content** — copy URL / title / selection · copy as Markdown link · search selection with your default engine · bookmark (duplicate-safe) · add to reading list

**Zoom** — in / out / reset

**Advanced** — hard refresh · capture screenshot · save page as MHTML · system notification · open browser pages (downloads, history, settings…) · open downloads folder · clear browser cache · clear this site's data · remove page from history · keep-awake toggle

**Extension control** — enable/disable, uninstall (with confirmation), reload a dev extension, launch a Chrome App, show extension info, open its options/homepage/store page, or execute a Chrome command (including this extension's own chains)

## 🔀 Flow control & variables

A chain isn't just a fixed list — you can branch and compose:

- **Conditions** — `Continue if URL matches` and `Continue if text is selected` stop the chain early when the condition fails
- **Sub-chains** — `Run another chain` calls a chain as a step (with loop and depth guards)
- **Variables** — in *Open URL* and *Show notification* text, use `{url}` `{title}` `{selection}` `{clipboard}` `{date}` `{time}` (e.g. search the selection on any site)
- **Run feedback** — a toolbar badge shows while a chain runs; failures raise an error badge plus a system notification

## 📦 Installation

1. Clone or download this repository
2. Open `chrome://extensions` and enable **Developer mode**
3. Click **Load unpacked** and select the `hotkey-chain` folder
4. The 🔗 icon appears in the toolbar

Customize keyboard shortcuts at `chrome://extensions/shortcuts` (the keyboard icon in the options toolbar jumps straight there).

### Build a package

To produce a clean, distributable build (only the files the extension ships — no `design/`, `docs/`, or `scripts/`):

```bash
npm run package    # or: node scripts/package.mjs
```

Output (in `dist/`, git-ignored):

- `dist/hotkey-chain/` — unpacked folder, ready for **Load unpacked**
- `dist/hotkey-chain-v<version>.zip` — ready to upload to the Chrome Web Store (manifest at the archive root)

No dependencies required; the script uses Node's built-ins plus your OS zip tool.

## 🚀 Quick Start

1. Click the 🔗 icon to run the default chain, or right-click it for the chain menu
2. Open **Options** to manage chains — start from a template, or build your own
3. In a chain: add actions, set per-step delays, drag to reorder, then bind a hotkey or trigger
4. Hit **Test Run** to try it on the current tab

## 🛠️ Configuration

- The options page is a visual editor: grouped action pickers, per-step delays (ms), and drag-and-drop ordering
- Each chain can carry its own triggers — a schedule interval and URL auto-run patterns
- **Execute command** lists the commands of any extension (including this one); **Call extension** sends a structured message (template or custom JSON)
- Chains and their order are stored in `chrome.storage.local`
- The toolbar's **Export/Import** buttons back up or restore the whole config as JSON; **Export this chain** (in the editor) shares one chain as a file

## 🌍 Internationalization

- **18 languages**: English, 简体中文, 繁體中文, 日本語, 한국어, Español, Français, Deutsch, Português (Brasil), Русский, Italiano, العربية, हिन्दी, Bahasa Indonesia, Türkçe, Tiếng Việt, ไทย, Polski — default follows the browser
- The options page has a language selector that overrides the entire extension — background, menus, notifications, and commands; right-to-left layout is applied automatically for Arabic
- Locale files live in `_locales/<code>/messages.json` (e.g. `en`, `zh_CN`, `ja`, `ar`)

## 📄 License

MIT. See [LICENSE](./LICENSE) for details.

—

If you find this useful, a ⭐ would be appreciated.
