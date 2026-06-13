# Hotkey Chain — Store Permission Justifications

Paste each line into the Chrome Web Store dashboard ("Privacy practices" → permission justifications) and the Edge Add-ons "Permissions justification" field. Every justification maps to a concrete feature/API in the extension.

## Single purpose

Hotkey Chain lets users combine multiple browser actions into a reusable "chain" and run it by hotkey, the address bar, a right-click, a schedule, or automatic URL matching. All permissions exist solely to perform the user-configured actions inside a chain.

## Permission justifications

| Permission | Justification |
| --- | --- |
| `storage` | Stores the user's chains, settings, chosen interface language, and keep-awake state locally via `chrome.storage.local`. No remote storage. |
| `activeTab` | Runs page actions (scroll, copy, dark mode, etc.) on the tab the user is currently on when a chain is triggered. |
| `scripting` | Injects the content script on demand and runs small functions in the page to read the current text selection and clipboard for the selection/clipboard actions. |
| `tabs` | Reads tab URLs/titles to close duplicates, sort tabs by URL, group by domain, switch/move tabs, fill the `{url}`/`{title}` variables, and evaluate URL auto-run rules. |
| `tabGroups` | Powers the "Group tabs by domain" and "Ungroup all tabs" actions via `chrome.tabGroups`. |
| `sessions` | Powers the "Reopen closed tab" action (`chrome.sessions.restore`). |
| `contextMenus` | Adds the toolbar-icon and in-page right-click menus that let users run a chain on a page, selection, link, image, or media. |
| `bookmarks` | Powers "Bookmark page" and "Bookmark all tabs" (`chrome.bookmarks.create`). |
| `management` | Lists installed extensions and powers the optional extension-control actions: enable/disable, uninstall (with the browser's confirmation), reload a dev extension, launch a Chrome app, and show extension info. |
| `clipboardWrite` | Powers "Copy URL/Title/Selection" and "Copy as Markdown link". |
| `clipboardRead` | Reads the clipboard only when a chain uses the `{clipboard}` template variable. |
| `downloads` | Saves screenshots and MHTML page archives to the Downloads folder, and opens the downloads folder. |
| `notifications` | Shows the "Show notification" action and surfaces chain run feedback / error messages. |
| `tts` | Powers "Read selection aloud" and "Stop reading" via `chrome.tts`. |
| `alarms` | Runs chains on a user-set schedule (every N minutes) via `chrome.alarms`. |
| `browsingData` | Powers "Clear browser cache" and "Clear this site's data" (only when the user runs those actions). |
| `history` | Powers "Remove this page from history" (`chrome.history.deleteUrl`). |
| `power` | Powers the "Keep awake" toggle (`chrome.power.requestKeepAwake`); released when toggled off. |
| `readingList` | Powers "Add to reading list" (`chrome.readingList.addEntry`). |
| `search` | Powers "Search the selection" using the user's default search engine (`chrome.search.query`). |
| `pageCapture` | Powers "Save page as MHTML" (`chrome.pageCapture.saveAsMHTML`). |

## Host permission justification

| Host permission | Justification |
| --- | --- |
| `<all_urls>` | A chain can run page actions (scroll, copy the selection, toggle dark mode, capture a screenshot, save as MHTML, translate, etc.) on whatever page the user is viewing, and URL auto-run must check page URLs. The extension only acts on a page when the user triggers a chain (or a rule they created matches); it does not read or send page content in the background. |

## Remote code

No. The extension runs only the JavaScript bundled in the package; it does not load or execute any remote/eval'd code.

## Data collection & privacy

- The extension does **not** collect, transmit, or sell any user data.
- All configuration (chains, settings, language) is stored locally in the browser via `chrome.storage.local`; export/import is a manual, user-initiated file the user controls.
- No analytics, no tracking, no remote servers.
