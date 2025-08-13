# 🔗 Hotkey Chain (Chrome Extension)

<div align="right">English | <a href="./README_zh-CN.md">简体中文</a></div>

> A productivity extension to execute multiple actions in a single hotkey-driven chain. Configure custom action sequences, manage Chrome extensions, and speed up your daily browsing.

## Table of Contents

- Features
- Installation
- Quick Start
- Usage
- Actions & Commands
- Internationalization (i18n)
- Development
- Contributing
- License

## ✨ Features

Core

- Run a chain of actions with a single hotkey
- Create/manage multiple custom chains; drag-and-drop ordering
- One-click: click the toolbar icon to run the default chain
- Per-action delay control (ms)

Extension utilities

- Enable/disable an extension
- Uninstall with confirmation
- Reload a development extension
- Launch a Chrome App
- Show detailed extension info (modal/notification)
- Quick navigation: open options/homepage/store page

Actions supported

- Page: scroll top/bottom, reload, back/forward, toggle fullscreen
- Tabs: close/new/duplicate/pin
- Content: copy URL/title, bookmark page, focus address bar
- Zoom: in/out/reset
- Advanced: clear cache, wait, call extension, execute command

Built-in samples

- Reading mode, Tab tools, Quick bookmark, Dev hard refresh
- Command demo: shows how to execute a command (including self)

## 📦 Installation

Load unpacked

1) Clone or download this repository
2) Open chrome://extensions and enable Developer mode
3) Click “Load unpacked” and select the hotkey-chain folder
4) The 🔗 icon appears in the toolbar

Keyboard shortcuts (customizable at chrome://extensions/shortcuts)

- Ctrl+Shift+H: Run default chain
- Ctrl+Shift+1/2/3: Run chain 1/2/3

Context menu (icon)

- Run default chain
- Run chain 1/2/3
- Open settings (options page)

## 🚀 Quick Start

- Click the toolbar icon to run the default chain
- Right-click the icon for the quick menu
- Open Options and edit chains: add actions, set delays, drag to reorder

## 🛠️ Usage & Configuration

- Options page provides a visual editor for action chains
- “Execute command” lists available commands of an extension (including this one)
- “Call extension” can send a structured message (template or custom JSON)
- Chains and order are saved in chrome.storage.sync

## 🧩 Actions & Commands

Action categories include page/tabs/content/zoom/advanced/extension. You can:

- Execute a Chrome command (e.g., run chain_1 of this extension)
- Toggle another extension’s enabled state
- Open options/details/homepage of another extension
- Get detailed info (permissions, install type, version, etc.)

## 🌍 Internationalization (i18n)

- Default locale: English (en). Available: en, zh_CN
- Options page has a language selector; your choice overrides the entire extension (background, menus, notifications, commands)
- Locale files under `_locales/en/messages.json` and `_locales/zh_CN/messages.json`

## 📄 License

MIT. See LICENSE for details.

—

If you find this useful, a star would be appreciated.
