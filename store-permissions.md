# Hotkey Chain — Store Permission Justifications

Paste each line into the Chrome Web Store dashboard ("Privacy practices" → permission justifications) and the Edge Add-ons "Permissions justification" field. Every justification maps to a concrete feature/API in the extension.

## Single purpose

Hotkey Chain lets users combine multiple browser actions into a reusable "chain" and run it by hotkey, the address bar, a right-click, a schedule, or automatic URL matching. All permissions exist solely to perform the user-configured actions inside a chain.

## Permission justifications

| Permission | Justification |
| --- | --- |
| `storage` | Stores the user's chains, settings, chosen interface language, and keep-awake state locally via `chrome.storage.local`. No remote storage. |
| `activeTab` | Runs page actions (scroll, reload, fullscreen, dark mode, design mode, copy, translate, screenshot, …) on the tab the user is currently viewing when they trigger a chain. This grant is why those actions work without asking for access to every site up front. |
| `scripting` | Injects the content script on demand and executes small helper functions in the page to read text selection, clipboard, and page outerHTML for user-initiated actions. Nothing is injected or read unless a chain runs. |
| `tabs` | Reads tab URLs and titles to close duplicates, sort tabs by URL, group by domain, discard tabs to free RAM, switch/move tabs, substitute {url} and {title} template variables, and evaluate URL auto-run rules. |
| `tabGroups` | Powers "Group tabs by domain", "Ungroup all tabs", "Collapse all tab groups", and "Expand all tab groups" via `chrome.tabGroups`. |
| `sessions` | Powers the "Reopen closed tab" action (`chrome.sessions.restore`). |
| `contextMenus` | Adds the toolbar-icon and in-page right-click menus that let users run a chain on a page, selection, link, image, or media element. |
| `bookmarks` | Powers "Bookmark page" and "Bookmark all tabs" (`chrome.bookmarks.create`). |
| `management` | Lists installed extensions and powers the optional extension-control actions: enable/disable, uninstall (with the browser's own confirmation), reload a dev extension, launch a Chrome app, show extension info, and trigger another extension's commands. |
| `clipboardWrite` | Powers "Copy URL/Title/Selection", "Copy as Markdown link", "Copy page HTML", and "Extract all links/images". |
| `clipboardRead` | Reads the clipboard only when a user-configured chain uses the {clipboard} template variable. |
| `downloads` | Saves screenshots and MHTML page archives to the Downloads folder, and opens the downloads folder. |
| `notifications` | Shows the "Show notification" action, AI summary results, and surfaces chain run execution feedback and error messages. |
| `tts` | Powers "Read selection aloud", "Speak custom text", and "Stop reading" via `chrome.tts`. |
| `alarms` | Runs chains on a user-set schedule (every N minutes) via `chrome.alarms`. |
| `browsingData` | Powers "Clear browser cache", "Clear this site's data", "Clear all cookies", and "Clear downloads history" only when the user explicitly triggers those actions. |
| `history` | Powers "Remove this page from history" (`chrome.history.deleteUrl`). |
| `power` | Powers the "Keep awake" toggle (`chrome.power.requestKeepAwake`); released when toggled off. |
| `readingList` | Powers the single "Add to reading list" action. It calls `chrome.readingList.addEntry()` to save the current tab's title and URL to Chrome's own reading list, and runs only when the user triggers a chain containing that action. The extension never reads, edits or removes existing entries, and no reading-list data is sent anywhere — it stays in the user's browser. |
| `search` | Powers "Search the selection" using the user's default search engine (`chrome.search.query`). |
| `pageCapture` | Powers "Save page as MHTML" (`chrome.pageCapture.saveAsMHTML`). |
| `sidePanel` | Powers the dedicated Hotkey Chain side panel companion and the "Open side panel" action (`chrome.sidePanel.open`) to manage and run chains alongside any webpage. |
| `webNavigation` | Detects Single-Page Application (SPA) in-page route transitions (e.g. GitHub, YouTube, Next.js) to trigger configured URL auto-run chains, and powers the "Wait for page navigation" workflow action (`chrome.webNavigation`). |
| `contentSettings` | Powers per-site content rule toggles: "Toggle JavaScript for site", "Toggle images for site", and "Toggle popups for site" (`chrome.contentSettings`). |
| `topSites` | Powers the "Open top sites" action to launch the user's most frequently visited work sites in background tabs (`chrome.topSites.get`). |

## Host permission justification

| Host permission | Justification |
| --- | --- |
| `<all_urls>` | Two things need this host permission. **(1) User-triggered page actions** — scroll, copy the selection, toggle dark mode or design mode, extract links/images, capture a screenshot, save as MHTML, translate, … must be able to run on whatever page the user is looking at, so the scope cannot be narrowed to a fixed list of sites. **(2) URL auto-run rules** the user configured must be matched against page URLs. The extension only executes on a page when the user triggers a chain, or when an auto-run rule they created matches. |

### Why a content script is declared for all URLs

The manifest also declares `content_scripts` for `<all_urls>` at `document_idle`, so a
content script is loaded on every page. This is deliberate, and it is worth stating plainly
because it is the broadest-looking thing in the manifest:

- **It is a passive message listener.** On load it registers a `chrome.runtime.onMessage`
  listener and reads the extension's own bundled locale file (via `chrome.runtime.getURL()`).
  It reads nothing from the page and sends nothing anywhere.
- **It only acts when the user acts.** Every handler is driven by a message the background
  sends while a chain runs. No chain, no reads.
- **Why it is declared rather than injected on demand.** The extension can inject on demand —
  and does, as a fallback for tabs opened before install or update — but the in-page progress
  HUD must be able to appear *while* a chain runs, and the HUD deliberately does **not** trigger
  injection (spawning a whole content script just to draw a progress bar is not a trade worth
  making). Declaring the script is what makes the HUD work on any page the user starts a chain
  from.

## Remote code

No. The extension runs only the JavaScript bundled in the package; it does not load or execute any remote/eval'd code.

## Data collection & privacy

- The extension does **not** collect, transmit, or sell any user data.
- All configuration (chains, settings, language) is stored locally in the browser via `chrome.storage.local`; export/import is a manual, user-initiated file the user controls.
- No analytics, no tracking, no remote servers.
