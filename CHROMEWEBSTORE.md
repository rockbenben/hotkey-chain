# Chrome Web Store Listing — Hotkey Chain

> Last Updated: 2026-09-18

## Store Listing

**Extension Name** [REQUIRED]
Hotkey Chain

**Short Description** [REQUIRED]
Shortcuts for your browser: chain 103+ actions and run them by hotkey, address bar, right-click, schedule, or URL match.

**Detailed Description** [REQUIRED]
Hotkey Chain turns everyday browsing into one-click automations by letting you compose, chain, and trigger over 102 browser actions.

Key Features:
- Chain 103+ built-in actions: tab management, navigation, window control, page scripting, site permissions & content settings, media controls, audio TTS, reading list, screenshots, and on-device Chrome AI Prompt API.
- Multiple trigger options: keyboard shortcuts (Ctrl+Shift+H for the default chain, Ctrl+Shift+1/2/3 for chains 1–3; chains 4–9 have bindable slots but no default key — Chrome caps suggested keys at 4), toolbar icon, side panel companion, omnibox command ("hc <name>"), in-page right-click context menu, recurring background schedule, or automatic page URL & SPA route matching.
- Dedicated Side Panel: browse any webpage while triggering and inspecting chains from Chrome's side panel.
- On-device AI integration: summarize, explain, and translate page content or text selections using Chrome's built-in Gemini Nano / Prompt API with zero external network requests.
- Workflow automation pipeline: orchestrate multi-chain execution (Chain A ➔ Chain B) with automatic success transitions, failure fallback routes, and context data piping ({output}, {{output}}, {prev.output}).
- Full Chrome automation: toggle per-site JavaScript/images/popups, wait for page navigation, launch top work sites, group tabs by domain, collapse/expand tab groups, discard inactive tabs to reclaim memory, and organize across windows.
- In-page power tools: toggle design mode for in-place editing, extract all page links or image URLs to clipboard, copy page HTML, or capture clean MHTML snapshots.
- 28 modern categorized templates: AI knowledge card clipper, workstation launch, pure distraction-free reader, site script shield, frontend dev reset pipeline, isolated focus workspace sandbox, incognito handoff, RAM reclaim, in-place design editor, and multi-step research workflows.
- Inter-extension automation: call commands and send messages to other installed extensions.
- Full privacy: 100% offline, local configuration storage, zero tracking, zero analytics, zero data collection.

How to Use:
1. Click the Hotkey Chain toolbar icon or press Ctrl+Shift+H to open Settings or run your default chain.
2. Click "New Chain" or pick from 28 ready-made presets (AI Knowledge Card, Daily Workstation, Dev Reset Pipeline, Focus Sandbox, Tab Cleanup, Video Fullscreen, Snapshot & Save).
3. Add actions to your chain in sequence with optional delays and parameters.
4. Assign a keyboard shortcut or trigger rule, and run it whenever you browse.

Privacy & Permissions:
Hotkey Chain runs entirely on your device. It makes no remote server calls, collects no personal information, and stores all chains locally in chrome.storage.local. Every permission requested maps directly to a user-configured chain action.

Support & Feedback:
Open-source on GitHub: https://github.com/rockbenben/hotkey-chain
Report issues: https://github.com/rockbenben/hotkey-chain/issues

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Combines multiple browser actions into automated chains triggered by keyboard shortcuts, menus, schedules, or URL rules.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `extension/icons/icon128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ✅ Ready | `assets/screenshot/1-chain-list.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ✅ Ready | `assets/screenshot/2-chain-editor.png` |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ✅ Ready | `assets/screenshot/3-templates.png` |
| Screenshot 4 | 1280×800 or 640×400 | ✅ Ready | `assets/screenshot/4-schedule.png` |
| Screenshot 5 | 1280×800 or 640×400 | ✅ Ready | `assets/screenshot/5-action-library.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ✅ Ready | `assets/screenshot/small.png` |
| Marquee Promo Tile | 1400×560 | ✅ Ready | `assets/screenshot/marquee.png` |
| Social preview card | 1280×640 | ✅ Ready | `assets/social-card.png` |

> Simplified-Chinese variants of screenshots 1–5 live in `assets/screenshot/zh/`.
> These are **rendered** from `assets/promo/*.html` — see CONTRIBUTING.md for the render command.

### Screenshot Notes
- Screenshot 1: Options dashboard — chain cards with trigger badges, live step timeline, and quick-run controls.
- Screenshot 2: Visual chain editor — drag-and-drop actions, per-step delays, and template variables.
- Screenshot 3: Template gallery — 28 presets with category filters and instant search.
- Screenshot 4: Per-chain schedule and URL auto-run triggers.
- Screenshot 5: Grouped action picker covering tab management, Chrome AI actions, and in-page utilities.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Stores the user's chains, settings, chosen interface language, and keep-awake state locally via chrome.storage.local. No remote storage. |
| `activeTab` | permissions | Runs page actions (scroll, copy, dark mode, design mode, etc.) on the tab the user is currently viewing when a chain is triggered. |
| `scripting` | permissions | Injects content script on demand and executes small helper functions in the page to read text selection, clipboard, and page outerHTML for user-initiated actions. |
| `tabs` | permissions | Reads tab URLs and titles to close duplicates, sort tabs by URL, group by domain, discard tabs to free RAM, switch/move tabs, substitute {url} and {title} template variables, and evaluate URL auto-run rules. |
| `tabGroups` | permissions | Powers "Group tabs by domain", "Ungroup all tabs", "Collapse all tab groups", and "Expand all tab groups" via chrome.tabGroups. |
| `sessions` | permissions | Powers the "Reopen closed tab" action (chrome.sessions.restore). |
| `contextMenus` | permissions | Adds toolbar-icon and in-page right-click menus that let users run a chain on a page, selection, link, image, or media element. |
| `bookmarks` | permissions | Powers "Bookmark page" and "Bookmark all tabs" (chrome.bookmarks.create). |
| `management` | permissions | Lists installed extensions and powers optional extension-control actions: enable/disable, uninstall (with native browser confirmation), reload dev extensions, and trigger extension commands. |
| `clipboardWrite` | permissions | Powers "Copy URL/Title/Selection", "Copy as Markdown link", "Copy page HTML", and "Extract all links/images". |
| `clipboardRead` | permissions | Reads the clipboard only when a user-configured chain uses the {clipboard} template variable. |
| `downloads` | permissions | Saves screenshots and MHTML page archives to the Downloads folder, and opens the downloads folder. |
| `notifications` | permissions | Shows the "Show notification" action, AI summary results, and surfaces chain run execution feedback and error messages. |
| `tts` | permissions | Powers "Read selection aloud", "Speak custom text", and "Stop reading" via chrome.tts. |
| `alarms` | permissions | Runs chains on a user-set schedule (every N minutes) via chrome.alarms. |
| `browsingData` | permissions | Powers "Clear browser cache", "Clear this site's data", "Clear all cookies", and "Clear downloads history" only when the user explicitly triggers those actions. |
| `history` | permissions | Powers "Remove this page from history" (chrome.history.deleteUrl). |
| `power` | permissions | Powers the "Keep awake" toggle (chrome.power.requestKeepAwake); released when toggled off. |
| `readingList` | permissions | Powers "Add to reading list" (chrome.readingList.addEntry) to save the current tab's title and URL to Chrome's native reading list upon user request. |
| `search` | permissions | Powers "Search the selection" using the user's default search engine (chrome.search.query). |
| `pageCapture` | permissions | Powers "Save page as MHTML" (chrome.pageCapture.saveAsMHTML). |
| `sidePanel` | permissions | Powers the dedicated Hotkey Chain side panel companion and "Open side panel" action (chrome.sidePanel.open) to manage and run chains alongside any webpage. |
| `webNavigation` | permissions | Detects Single-Page Application (SPA) in-page route transitions (e.g. GitHub, YouTube, Next.js) to trigger configured URL auto-run chains, and powers the "Wait for page navigation" workflow action (chrome.webNavigation). |
| `contentSettings` | permissions | Powers per-site content rule toggles: "Toggle JavaScript for site", "Toggle images for site", and "Toggle popups for site" (chrome.contentSettings). |
| `topSites` | permissions | Powers the "Open top sites" action to launch the user's most frequently visited work sites in background tabs (chrome.topSites.get). |
| `<all_urls>` | host_permissions | A chain can run user-initiated page actions (scroll, copy selection, toggle design mode, extract links/images, capture screenshot, save MHTML, etc.) on whatever page the user is viewing, and URL auto-run rules must match target URLs. The extension only executes on a page when the user explicitly triggers a chain or when an auto-run rule configured by the user matches. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | N/A | No |
| Health info | No | No | N/A | No |
| Financial info | No | No | N/A | No |
| Authentication info | No | No | N/A | No |
| Personal communications | No | No | N/A | No |
| Location | No | No | N/A | No |
| Web history | No | No | N/A | No |
| User activity | No | No | N/A | No |
| Website content | No | No | N/A | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED if collecting data, RECOMMENDED otherwise]
https://github.com/rockbenben/hotkey-chain/blob/main/docs/privacy-policy.md

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

## Developer Info

**Publisher Name** [REQUIRED]
rockbenben

**Contact Email** [REQUIRED]
https://github.com/rockbenben/hotkey-chain

**Support URL / Email** [RECOMMENDED]
https://github.com/rockbenben/hotkey-chain/issues

**Homepage URL** [RECOMMENDED]
https://github.com/rockbenben/hotkey-chain

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.5.0 | 2026-09-18 | Live step progress in the toolbar badge and an in-page HUD that names the action being executed; shortcut badges now show the shortcut Chrome actually registered instead of assuming the suggested key; on-device AI failures stop the chain and say why instead of silently building an empty card; trimmed 15 redundant system notifications from the templates; docs and store copy re-synced with the code. | Draft |
| 1.4.0 | 2026-09-11 | Full Chrome open APIs expansion (Side Panel companion, Prompt API / built-in AI summarize/explain/translate, tab discard, collapse/expand tab groups, close other windows, cookie/download cleanup, design mode, link/image extractors, speech TTS, and MV3 async/await compliance). | Draft |
| 1.3.0 | 2026-06-20 | Added URL auto-run triggers and recurring alarm schedule execution. | Published |
| 1.2.0 | 2026-03-15 | Added tab group by domain and Markdown link actions. | Published |
| 1.0.0 | 2026-01-10 | Initial public release on Chrome Web Store. | Published |

## Review Notes

### Known Issues / Limitations
- Built-in Chrome AI Prompt API actions (`ai_summarize`, `ai_explain`, `ai_translate`) run on Chrome's on-device `LanguageModel` (Gemini Nano). No `chrome://flags` setting and no API key are required — the API ships with Chrome — but it is desktop-only (Windows 10/11, macOS 13+, Linux, Chromebook Plus; not Android/iOS) and needs about 22 GB free disk plus either over 4 GB VRAM or 16 GB RAM with 4+ cores. The model downloads on first use; progress is visible at `chrome://on-device-internals`. When the API is missing, the model is still downloading, or the hardware is unsupported, a system notification states which of those it is and the chain stops there — it does not silently continue and let later steps build a card out of stale output. 22 of the 28 templates never use AI, so they are unaffected.
- Calling external extensions (`call_extension`) requires the target extension to have `externally_connectable` configured in its manifest.
