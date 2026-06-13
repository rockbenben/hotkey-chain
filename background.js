// Background Service Worker for Hotkey Chain Extension

// Override-able i18n support (driven by options-selected language)
let localeOverride = "auto";
let i18nOverrideMap = null; // { key: message }

async function loadLocaleOverrideCache() {
  try {
    const { localeOverride: stored } = await chrome.storage.local.get(["localeOverride"]);
    localeOverride = stored || "auto";
    if (localeOverride && localeOverride !== "auto") {
      const url = chrome.runtime.getURL(`_locales/${localeOverride}/messages.json`);
      const resp = await fetch(url);
      if (!resp.ok) {
        i18nOverrideMap = null;
        return;
      }
      const json = await resp.json();
      const map = {};
      Object.keys(json).forEach((k) => {
        const v = json[k];
        if (v && typeof v.message === "string") map[k] = v.message;
      });
      i18nOverrideMap = map;
    } else {
      i18nOverrideMap = null;
    }
  } catch (e) {
    console.warn("Failed to load localeOverride cache", e);
    i18nOverrideMap = null;
  }
}

function substituteArgs(template, args) {
  if (!template || !Array.isArray(args) || args.length === 0) return template;
  // Replace $1, $2 ... with args[0], args[1] ...
  return template.replace(/\$([1-9]\d*)/g, (m, n) => {
    const idx = parseInt(n, 10) - 1;
    return idx >= 0 && idx < args.length ? String(args[idx]) : m;
  });
}

function t(key, fallback = "", args = []) {
  try {
    // Prefer override map if available
    if (i18nOverrideMap && i18nOverrideMap[key]) {
      return substituteArgs(i18nOverrideMap[key], args) || fallback || key;
    }
    const msg = chrome.i18n.getMessage(key, args);
    return msg || fallback || key;
  } catch (e) {
    return fallback || key;
  }
}

// Kick off loading override cache on service worker start
loadLocaleOverrideCache();

// Action types that can be executed
const ACTION_TYPES = {
  SCROLL_TO_TOP: "scroll_to_top",
  SCROLL_TO_BOTTOM: "scroll_to_bottom",
  RELOAD_PAGE: "reload_page",
  CLOSE_TAB: "close_tab",
  NEW_TAB: "new_tab",
  COPY_URL: "copy_url",
  COPY_TITLE: "copy_title",
  FULLSCREEN: "toggle_fullscreen",
  ZOOM_IN: "zoom_in",
  ZOOM_OUT: "zoom_out",
  ZOOM_RESET: "zoom_reset",
  BACK: "go_back",
  FORWARD: "go_forward",
  BOOKMARK: "bookmark_page",
  CALL_EXTENSION: "call_extension",
  EXECUTE_COMMAND: "execute_command",
  CLEAR_CACHE: "clear_cache",
  DUPLICATE_TAB: "duplicate_tab",
  PIN_TAB: "pin_tab",
  MUTE_TAB: "mute_tab",
  CLOSE_OTHER_TABS: "close_other_tabs",
  MOVE_TAB_LEFT: "move_tab_left",
  MOVE_TAB_RIGHT: "move_tab_right",
  PREV_TAB: "prev_tab",
  NEXT_TAB: "next_tab",
  NEW_WINDOW: "new_window",
  REOPEN_CLOSED_TAB: "reopen_closed_tab",
  PRINT_PAGE: "print_page",
  OPEN_URL: "open_url",
  COPY_AS_MARKDOWN: "copy_as_markdown",
  WAIT: "wait",
  SCROLL_PAGE_UP: "scroll_page_up",
  SCROLL_PAGE_DOWN: "scroll_page_down",
  CLOSE_TABS_RIGHT: "close_tabs_right",
  CLOSE_WINDOW: "close_window",
  // Page extras
  TOGGLE_DARK_MODE: "toggle_dark_mode",
  TRANSLATE_PAGE: "translate_page",
  // Media controls (content script)
  MEDIA_PLAY_PAUSE: "media_play_pause",
  MEDIA_SPEED_UP: "media_speed_up",
  MEDIA_SPEED_DOWN: "media_speed_down",
  MEDIA_SPEED_RESET: "media_speed_reset",
  // Tab management extras
  CLOSE_LEFT_TABS: "close_left_tabs",
  CLOSE_DUPLICATE_TABS: "close_duplicate_tabs",
  SORT_TABS_BY_URL: "sort_tabs_by_url",
  GROUP_TABS_BY_DOMAIN: "group_tabs_by_domain",
  UNGROUP_ALL_TABS: "ungroup_all_tabs",
  MUTE_ALL_TABS: "mute_all_tabs",
  UNMUTE_ALL_TABS: "unmute_all_tabs",
  RELOAD_ALL_TABS: "reload_all_tabs",
  MOVE_TAB_FIRST: "move_tab_first",
  MOVE_TAB_LAST: "move_tab_last",
  MOVE_TAB_TO_NEW_WINDOW: "move_tab_to_new_window",
  // Window management
  MINIMIZE_WINDOW: "minimize_window",
  MAXIMIZE_WINDOW: "maximize_window",
  OPEN_INCOGNITO_WINDOW: "open_incognito_window",
  // Selection / speech
  COPY_SELECTED_TEXT: "copy_selected_text",
  SEARCH_SELECTION: "search_selection",
  SPEAK_SELECTION: "speak_selection",
  STOP_SPEAKING: "stop_speaking",
  // Utilities
  CAPTURE_SCREENSHOT: "capture_screenshot",
  SHOW_NOTIFICATION: "show_notification",
  OPEN_BROWSER_PAGE: "open_browser_page",
  // Browser-API utilities
  DISCARD_OTHER_TABS: "discard_other_tabs",
  GOTO_AUDIBLE_TAB: "goto_audible_tab",
  BOOKMARK_ALL_TABS: "bookmark_all_tabs",
  READ_LATER: "read_later",
  CLEAR_BROWSING_CACHE: "clear_browsing_cache",
  CLEAR_SITE_DATA: "clear_site_data",
  DELETE_URL_FROM_HISTORY: "delete_url_from_history",
  TOGGLE_KEEP_AWAKE: "toggle_keep_awake",
  SHOW_DOWNLOADS_FOLDER: "show_downloads_folder",
  SAVE_PAGE_MHTML: "save_page_mhtml",
  // Flow control
  IF_URL_MATCHES: "if_url_matches",
  IF_HAS_SELECTION: "if_has_selection",
  RUN_CHAIN: "run_chain",
};

// Maximum nesting depth for chains that run other chains
const MAX_CHAIN_DEPTH = 5;

// Built-in browser pages reachable via the open_browser_page action
const BROWSER_PAGES = {
  downloads: "chrome://downloads",
  history: "chrome://history",
  bookmarks: "chrome://bookmarks",
  extensions: "chrome://extensions",
  settings: "chrome://settings",
  shortcuts: "chrome://extensions/shortcuts",
  clear_browsing_data: "chrome://settings/clearBrowserData",
};

// Build default configuration (with i18n names)
function createDefaultConfig() {
  return {
    defaultChain: "chain_1",
    chainOrder: ["chain_1", "chain_2", "chain_3", "chain_4", "chain_5", "chain_6", "chain_7", "chain_8"],
    chains: {
      // 阅读模式：回到顶部 → 放大 → 全屏（高频经典款）
      chain_1: {
        name: t("defaultChain_reading", "Reading mode"),
        actions: [
          { type: ACTION_TYPES.SCROLL_TO_TOP, delay: 0 },
          { type: ACTION_TYPES.ZOOM_IN, delay: 200 },
          { type: ACTION_TYPES.FULLSCREEN, delay: 200 },
        ],
      },
      // 整理标签页：去重 → 按网址排序 → 按域名分组（批量标签管理）
      chain_2: {
        name: t("defaultChain_tidyTabs", "Tidy tabs"),
        actions: [
          { type: ACTION_TYPES.CLOSE_DUPLICATE_TABS, delay: 0 },
          { type: ACTION_TYPES.SORT_TABS_BY_URL, delay: 200 },
          { type: ACTION_TYPES.GROUP_TABS_BY_DOMAIN, delay: 200 },
        ],
      },
      // 稍后再读：加入阅读清单 → 桌面通知（含 {title} 模板变量）
      chain_3: {
        name: t("defaultChain_readLater", "Read later"),
        actions: [
          { type: ACTION_TYPES.READ_LATER, delay: 0 },
          { type: ACTION_TYPES.SHOW_NOTIFICATION, delay: 0, text: t("defaultChain_readLater_note", "Saved to reading list: {title}") },
        ],
      },
      // 搜索选中文字：仅当页面有选区时才用默认搜索引擎搜索（流程控制守卫）
      chain_4: {
        name: t("defaultChain_searchSelection", "Search selection"),
        actions: [
          { type: ACTION_TYPES.IF_HAS_SELECTION, delay: 0 },
          { type: ACTION_TYPES.SEARCH_SELECTION, delay: 0 },
        ],
      },
      // 影院模式：仅在视频站点（条件 URL 匹配）→ 全屏 → 播放/暂停
      chain_5: {
        name: t("defaultChain_cinema", "Cinema mode"),
        actions: [
          { type: ACTION_TYPES.IF_URL_MATCHES, delay: 0, pattern: "*youtube.com*\n*bilibili.com*\n*netflix.com*" },
          { type: ACTION_TYPES.FULLSCREEN, delay: 0 },
          { type: ACTION_TYPES.MEDIA_PLAY_PAUSE, delay: 300 },
        ],
      },
      // 复制为 Markdown 链接：方便粘贴到笔记 / 文档（高频分享款）
      chain_6: {
        name: t("defaultChain_copyMarkdown", "Copy as Markdown"),
        actions: [{ type: ACTION_TYPES.COPY_AS_MARKDOWN, delay: 0 }],
      },
      // 强制刷新：清缓存 → 重新加载当前站点（高频开发款）
      chain_7: {
        name: t("defaultChain_hardRefresh", "Hard refresh"),
        actions: [
          { type: ACTION_TYPES.CLEAR_CACHE, delay: 0 },
          { type: ACTION_TYPES.RELOAD_PAGE, delay: 200 },
        ],
      },
      // 晨间例行：先运行「整理标签页」(嵌套链) → 打开邮箱 → 通知（RUN_CHAIN 演示）
      chain_8: {
        name: t("defaultChain_morningRoutine", "Morning routine"),
        actions: [
          { type: ACTION_TYPES.RUN_CHAIN, delay: 0, chainKey: "chain_2" },
          { type: ACTION_TYPES.OPEN_URL, delay: 300, url: "https://mail.google.com", openIn: "new" },
          { type: ACTION_TYPES.SHOW_NOTIFICATION, delay: 0, text: t("defaultChain_morningRoutine_note", "Workspace ready") },
        ],
      },
    },
  };
}

// Maximum number of chains listed in the icon context menu
const MAX_MENU_CHAINS = 10;

async function buildContextMenus() {
  try {
    await chrome.contextMenus.removeAll();
  } catch (e) {
    // ignore
  }

  // Create context menu
  chrome.contextMenus.create({
    id: "hotkey-chain-execute-default",
    title: t("menu_executeDefault", "Execute default chain"),
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "hotkey-chain-separator-1",
    type: "separator",
    contexts: ["action"],
  });

  // List actual chains by name (in the order shown on the options page).
  // They live in a submenu because Chrome caps the action context menu at
  // ACTION_MENU_TOP_LEVEL_LIMIT (6) top-level items — extras are silently
  // dropped if listed flat.
  const config = await getConfig();
  chrome.contextMenus.create({
    id: "hotkey-chain-action-chains",
    title: t("menu_pageParent", "Run action chain"),
    contexts: ["action"],
  });
  getOrderedChainKeys(config)
    .slice(0, MAX_MENU_CHAINS)
    .forEach((chainKey) => {
      chrome.contextMenus.create({
        id: `execute-${chainKey}`,
        parentId: "hotkey-chain-action-chains",
        title: config.chains[chainKey].name || chainKey,
        contexts: ["action"],
      });
    });

  chrome.contextMenus.create({
    id: "hotkey-chain-separator-2",
    type: "separator",
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "hotkey-chain-options",
    title: t("menu_options", "Options"),
    contexts: ["action"],
  });

  // In-page right-click trigger: a submenu listing chains, available on
  // pages, selections, links and media so chains can be run in context
  const pageContexts = ["page", "selection", "link", "image", "video", "audio"];
  chrome.contextMenus.create({
    id: "hotkey-chain-page-parent",
    title: t("menu_pageParent", "Run action chain"),
    contexts: pageContexts,
  });
  getOrderedChainKeys(config)
    .slice(0, MAX_MENU_CHAINS)
    .forEach((chainKey) => {
      chrome.contextMenus.create({
        id: `page-execute-${chainKey}`,
        parentId: "hotkey-chain-page-parent",
        title: config.chains[chainKey].name || chainKey,
        contexts: pageContexts,
      });
    });
}

// Ordered chain keys, skipping entries that no longer exist
function getOrderedChainKeys(config) {
  const order = Array.isArray(config.chainOrder) && config.chainOrder.length ? config.chainOrder : Object.keys(config.chains);
  const seen = new Set();
  const keys = [];
  for (const key of order) {
    if (config.chains[key] && !seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  // Append chains missing from chainOrder so they are never unreachable
  for (const key of Object.keys(config.chains)) {
    if (!seen.has(key)) keys.push(key);
  }
  return keys;
}

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  // Set default configuration if not exists, migrating from sync storage (v1.0)
  const result = await chrome.storage.local.get(["hotkeyChainConfig"]);
  if (!result.hotkeyChainConfig) {
    const syncResult = await chrome.storage.sync.get(["hotkeyChainConfig"]).catch(() => ({}));
    if (syncResult.hotkeyChainConfig) {
      await chrome.storage.local.set({ hotkeyChainConfig: syncResult.hotkeyChainConfig });
      await chrome.storage.sync.remove(["hotkeyChainConfig"]).catch(() => {});
    } else {
      await chrome.storage.local.set({ hotkeyChainConfig: createDefaultConfig() });
    }
  }
  await loadLocaleOverrideCache();
  await buildContextMenus();
  await syncScheduleAlarms();
  await reapplyKeepAwake();
});

chrome.runtime.onStartup.addListener(async () => {
  await loadLocaleOverrideCache();
  await buildContextMenus();
  await syncScheduleAlarms();
  await reapplyKeepAwake();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.localeOverride) {
    loadLocaleOverrideCache()
      .then(buildContextMenus)
      .catch(() => {});
  }
  // Keep menus and schedules in sync with chain edits
  if (changes.hotkeyChainConfig) {
    buildContextMenus().catch(() => {});
    syncScheduleAlarms().catch(() => {});
  }
});

// Re-request keep-awake after a service worker restart (the OS-level
// request does not survive the worker being unloaded)
async function reapplyKeepAwake() {
  try {
    const { keepAwake } = await chrome.storage.local.get(["keepAwake"]);
    if (keepAwake) chrome.power.requestKeepAwake("display");
  } catch (e) {
    // power API is cosmetic here
  }
}

// --- Scheduled trigger (chrome.alarms) ---
// A chain with scheduleMinutes > 0 runs periodically; alarm name = "chain:<key>"

async function syncScheduleAlarms() {
  const config = await getConfig();
  const alarms = await chrome.alarms.getAll();

  // Drop alarms whose chain is gone or no longer scheduled
  for (const alarm of alarms) {
    if (!alarm.name.startsWith("chain:")) continue;
    const key = alarm.name.slice("chain:".length);
    const chain = config.chains[key];
    if (!chain || !(Number(chain.scheduleMinutes) > 0)) {
      await chrome.alarms.clear(alarm.name);
    }
  }

  // Create/update alarms for scheduled chains (Chrome enforces a minimum period)
  for (const [key, chain] of Object.entries(config.chains)) {
    const minutes = Number(chain.scheduleMinutes);
    if (!(minutes > 0)) continue;
    const period = Math.max(1, minutes);
    const existing = alarms.find((a) => a.name === `chain:${key}`);
    if (!existing || existing.periodInMinutes !== period) {
      await chrome.alarms.create(`chain:${key}`, { periodInMinutes: period });
    }
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith("chain:")) {
    // noFocus: a periodic background run must not yank the Chrome window
    // in front of whatever application the user is working in
    await executeChain(alarm.name.slice("chain:".length), { noFocus: true });
  }
});

// --- Auto-run trigger (per-chain URL patterns, evaluated on page load) ---

// tabId:chainKey -> timestamp of the last auto-run, to avoid loops when a
// chain reloads or rewrites the page it was triggered by
const autoRunLastAt = new Map();
const AUTO_RUN_COOLDOWN_MS = 10000;

// Tabs opened while a chain was running. Their FIRST load must not trigger
// auto-run: a chain that opens a tab matching its own autoRunPatterns would
// otherwise spawn tabs forever (each new tab has a fresh id, so the per-tab
// cooldown above never catches it). A later user-initiated reload still runs.
const chainCreatedTabs = new Set();
chrome.tabs.onCreated.addListener((tab) => {
  if (activeChainRuns > 0 && tab.id != null) chainCreatedTabs.add(tab.id);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url || !/^https?:/i.test(tab.url)) return;
  if (chainCreatedTabs.has(tabId)) {
    chainCreatedTabs.delete(tabId); // one-shot: only the chain-spawned first load is skipped
    return;
  }
  try {
    const config = await getConfig();
    for (const [chainKey, chain] of Object.entries(config.chains)) {
      if (!chain.autoRunPatterns || !urlMatchesAny(tab.url, chain.autoRunPatterns)) continue;
      const mapKey = `${tabId}:${chainKey}`;
      const last = autoRunLastAt.get(mapKey) || 0;
      if (Date.now() - last < AUTO_RUN_COOLDOWN_MS) continue;
      autoRunLastAt.set(mapKey, Date.now());
      await executeChain(chainKey, { tabId });
    }
  } catch (e) {
    console.warn("Auto-run check failed:", e);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chainCreatedTabs.delete(tabId);
  for (const key of autoRunLastAt.keys()) {
    if (key.startsWith(`${tabId}:`)) autoRunLastAt.delete(key);
  }
});

// --- Omnibox trigger: type "hc <chain name>" in the address bar ---

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

if (chrome.omnibox) {
  chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
    try {
      const config = await getConfig();
      const query = text.trim().toLowerCase();
      const suggestions = getOrderedChainKeys(config)
        .filter((key) => !query || (config.chains[key].name || "").toLowerCase().includes(query))
        .slice(0, 8)
        .map((key) => ({
          content: key,
          description: escapeXml(config.chains[key].name || key),
        }));
      suggest(suggestions);
    } catch (e) {
      console.warn("Omnibox suggest failed:", e);
    }
  });

  chrome.omnibox.onInputEntered.addListener(async (text) => {
    const config = await getConfig();
    // Selected suggestion passes the chain key; free text matches by name
    if (config.chains[text]) {
      await executeChain(text);
      return;
    }
    const query = text.trim().toLowerCase();
    // An empty query must NOT match: name.includes("") is true for every chain,
    // so a bare "hc <space> Enter" would otherwise run the first (maybe destructive) chain.
    const match = query ? getOrderedChainKeys(config).find((key) => (config.chains[key].name || "").toLowerCase().includes(query)) : null;
    if (match) {
      await executeChain(match);
    } else {
      // No matching chain — do nothing rather than running an arbitrary
      // (possibly destructive) chain on a typo
      console.warn(`Omnibox: no chain matches "${text}"`);
    }
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuItemId = String(info.menuItemId);
  if (menuItemId === "hotkey-chain-execute-default") {
    await executeDefaultChain();
  } else if (menuItemId === "hotkey-chain-options") {
    // Open options page
    chrome.runtime.openOptionsPage();
  } else if (menuItemId.startsWith("page-execute-")) {
    // In-page trigger: pin the run to the tab that was right-clicked
    const chainKey = menuItemId.replace("page-execute-", "");
    await executeChain(chainKey, tab && tab.id ? { tabId: tab.id } : {});
  } else if (menuItemId.startsWith("execute-")) {
    const chainKey = menuItemId.replace("execute-", "");
    await executeChain(chainKey);
  }
});

// Handle command events (hotkeys)
chrome.commands.onCommand.addListener(async (command) => {

  if (command === "_execute_action") {
    // Execute default chain
    await executeDefaultChain();
  } else if (command.startsWith("execute_chain_")) {
    // Execute specific chain
    const chainNumber = parseInt(command.split("_")[2], 10);
    await executeChainByNumber(chainNumber);
  }
});

// Resolve "chain N" to an actual chain: prefer the literal key (chain_1..),
// otherwise fall back to the N-th chain in display order so hotkeys keep
// working after the original chains are deleted or replaced.
// ctx (when called from a running chain's execute_command action) carries the
// caller's chainKey/callStack so executeChain's loop guard still applies.
async function executeChainByNumber(n, ctx = {}) {
  const config = await getConfig();
  const context = {
    tabId: ctx.tabId,
    callStack: [...(ctx.callStack || []), ctx.chainKey].filter(Boolean),
  };
  const literalKey = `chain_${n}`;
  if (config.chains[literalKey]) {
    await executeChain(literalKey, context);
    return;
  }
  const ordered = getOrderedChainKeys(config);
  const fallbackKey = ordered[n - 1];
  if (fallbackKey) {
    await executeChain(fallbackKey, context);
  } else {
    console.warn(`No chain bound to slot ${n}`);
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  await executeDefaultChain();
});

// Execute default chain
async function executeDefaultChain() {
  const config = await getConfig();
  let chainKey = config.defaultChain;
  // Fall back to the first available chain if the default was deleted
  if (!chainKey || !config.chains[chainKey]) {
    chainKey = getOrderedChainKeys(config)[0];
  }
  if (chainKey) {
    await executeChain(chainKey);
  } else {
    console.warn("No chains configured");
  }
}

// Get the current active tab (re-queried because chain actions can close,
// switch, or create tabs, invalidating any tab captured at chain start)
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

// Remember the last real (http/https) tab the user focused. Runs triggered from
// the options page have the options tab as the active tab, so without this they
// would execute against the options page itself (e.g. close_other_tabs would
// close the user's real tabs). Extension pages are never recorded.
let lastUserTabId = null;
function rememberUserTab(tab) {
  if (tab && tab.id != null && tab.url && /^https?:/i.test(tab.url)) lastUserTabId = tab.id;
}
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    rememberUserTab(await chrome.tabs.get(tabId));
  } catch (e) {
    // tab may already be gone
  }
});
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    rememberUserTab(tab);
  } catch (e) {
    // window may have closed
  }
});

// Resolve the tab an options-page-initiated run should target: the user's last
// real page, with a fallback (after a service-worker restart) to any active
// normal tab. Returns {} to keep the existing active-tab behaviour when none.
async function resolveUserRunContext() {
  if (lastUserTabId != null) {
    const tab = await chrome.tabs.get(lastUserTabId).catch(() => null);
    if (tab && tab.url && /^https?:/i.test(tab.url)) return { tabId: lastUserTabId };
  }
  try {
    const candidates = await chrome.tabs.query({ active: true });
    const normal = candidates.find((t) => t.url && /^https?:/i.test(t.url));
    if (normal) return { tabId: normal.id };
  } catch (e) {
    // fall through to default
  }
  return {};
}

// --- Run-state badge feedback ---

let activeChainRuns = 0;

async function badgeChainStarted() {
  activeChainRuns++;
  try {
    await chrome.action.setBadgeBackgroundColor({ color: "#1a73e8" });
    await chrome.action.setBadgeText({ text: "▶" });
  } catch (e) {
    // badge is cosmetic
  }
}

async function badgeChainFinished(hadErrors) {
  activeChainRuns = Math.max(0, activeChainRuns - 1);
  try {
    if (hadErrors) {
      await chrome.action.setBadgeBackgroundColor({ color: "#dc3545" });
      await chrome.action.setBadgeText({ text: "!" });
      setTimeout(() => {
        if (activeChainRuns === 0) chrome.action.setBadgeText({ text: "" }).catch(() => {});
      }, 3000);
    } else if (activeChainRuns === 0) {
      await chrome.action.setBadgeText({ text: "" });
    }
  } catch (e) {
    // badge is cosmetic
  }
}

// Execute specific chain.
// context.tabId — pin every step to this tab (page context menu / auto-run)
//   instead of following the focused tab; also prevents focus stealing.
// context.callStack — chain keys above us, for run_chain loop/depth guards.
async function executeChain(chainKey, context = {}) {
  const callStack = context.callStack || [];
  if (callStack.includes(chainKey)) {
    console.warn(`Chain loop detected, skipping: ${[...callStack, chainKey].join(" -> ")}`);
    return;
  }
  if (callStack.length >= MAX_CHAIN_DEPTH) {
    console.warn(`Chain call depth limit (${MAX_CHAIN_DEPTH}) reached at ${chainKey}`);
    return;
  }

  let errorCount = 0;
  let chain = null;
  await badgeChainStarted();
  try {
    const config = await getConfig();
    chain = config.chains[chainKey];

    if (!chain) {
      console.error(`Chain ${chainKey} not found`);
      return;
    }


    const resolveTab = async () => {
      if (context.tabId) {
        return await chrome.tabs.get(context.tabId).catch(() => null);
      }
      return await getActiveTab();
    };

    // Triggered on the focused tab: bring its window forward first.
    // Pinned-tab runs (auto-run on background tabs) and scheduled runs
    // (noFocus) must NOT steal focus.
    if (!context.tabId && !context.noFocus) {
      const activeTab = await getActiveTab();
      if (!activeTab) {
        console.error("No active tab found");
        return;
      }
      try {
        if (activeTab.windowId) await chrome.windows.update(activeTab.windowId, { focused: true });
        await chrome.tabs.update(activeTab.id, { active: true });
      } catch (e) {
        console.warn("Focus window/tab failed:", e);
      }
    }

    // Execute actions sequentially. Each action's delay is the wait applied
    // BEFORE that action runs (including the first one, if configured).
    // Cap at 30 s so crafted imports can't hang the service worker indefinitely.
    for (const action of chain.actions) {
      const delay = Math.min(Math.max(0, Number(action.delay) || 0), 30000);
      if (delay > 0) {
        await chainSleep(delay);
      }

      // Re-resolve the tab on every step so actions after
      // close_tab / next_tab / new_tab target the right tab
      const tab = await resolveTab();
      if (!tab) {
        console.warn(`Chain ${chain.name} stopped: no target tab`);
        break;
      }

      const result = await executeAction(tab, action, { chainKey, callStack, tabId: context.tabId });
      if (result && result.stop) {
        break;
      }
      if (result && result.error) errorCount++;
    }

  } catch (error) {
    errorCount++;
    console.error("Error executing chain:", error);
  } finally {
    await badgeChainFinished(errorCount > 0);
    if (errorCount > 0 && chain) {
      await showSystemNotification(t("msg_chainErrors", `Chain ${chain.name}: ${errorCount} action(s) failed`, [chain.name, String(errorCount)]));
    }
  }
}

// Send a message to the page's content script. If the content script is not
// there yet (page opened before install/update, or just reloaded), inject it
// once and retry.
async function sendToContent(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (firstError) {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (secondError) {
      // chrome:// pages, the Web Store, etc. never allow injection
      console.warn(`Content script unavailable in tab ${tabId}:`, secondError);
      return null;
    }
  }
}

// --- URL pattern matching (supports * wildcards or plain substrings) ---

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function urlMatchesPattern(url, pattern) {
  const p = (pattern || "").trim();
  if (!p) return false;
  if (!p.includes("*")) return url.includes(p);
  // Collapse runs of '*' before building the regex: split("*").join(".*") would
  // otherwise turn consecutive stars into adjacent ".*.*" and cause catastrophic
  // backtracking (a hang of the service worker) on long non-matching URLs.
  const re = new RegExp("^" + p.replace(/\*+/g, "*").split("*").map(escapeRegex).join(".*") + "$", "i");
  return re.test(url);
}

// patternsString: comma- or newline-separated patterns
function urlMatchesAny(url, patternsString) {
  return String(patternsString || "")
    .split(/[\n,]/)
    .some((p) => urlMatchesPattern(url || "", p));
}

// --- Template variables: {url} {title} {selection} {clipboard} {date} {time} ---

async function expandTemplate(template, tab, { encode = false } = {}) {
  if (!template || !template.includes("{")) return template;
  const values = {
    url: tab.url || "",
    title: tab.title || "",
  };
  if (template.includes("{selection}")) values.selection = await getSelectionText(tab.id);
  if (template.includes("{clipboard}")) values.clipboard = await readClipboardText(tab.id);
  const now = new Date();
  values.date = now.toISOString().slice(0, 10);
  values.time = now.toTimeString().slice(0, 8);
  return template.replace(/\{(url|title|selection|clipboard|date|time)\}/g, (m, key) => {
    const v = values[key] ?? "";
    // {url} stays raw so it can be used as a full URL; the rest are
    // encoded when substituted into URLs
    return encode && key !== "url" ? encodeURIComponent(v) : v;
  });
}

// Read clipboard text via the page (requires clipboardRead; fails silently
// when the document is not focused)
async function readClipboardText(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        try {
          return await navigator.clipboard.readText();
        } catch (e) {
          return "";
        }
      },
    });
    return (results?.[0]?.result || "").trim();
  } catch (e) {
    console.warn("Cannot read clipboard:", e);
    return "";
  }
}

// Chunked base64 for potentially large buffers (MHTML capture)
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Read the current text selection from a tab (empty string when none/unavailable)
async function getSelectionText(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => String(window.getSelection()),
    });
    return (results?.[0]?.result || "").trim();
  } catch (e) {
    console.warn("Cannot read selection:", e);
    return "";
  }
}

// Show an OS-level notification (used by the show_notification action)
async function showSystemNotification(message, title) {
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: title || t("extName", "Hotkey Chain"),
      message: message || "",
    });
  } catch (e) {
    console.warn("Failed to show notification:", e);
  }
}

// Execute individual action.
// Returns {} on success, { stop: true } when a condition action wants the
// chain to halt, { error } when the action failed.
async function executeAction(tab, action, ctx = {}) {
  try {
    switch (action.type) {
      case ACTION_TYPES.SCROLL_TO_TOP:
      case ACTION_TYPES.SCROLL_TO_BOTTOM:
      case ACTION_TYPES.SCROLL_PAGE_UP:
      case ACTION_TYPES.SCROLL_PAGE_DOWN:
      case ACTION_TYPES.COPY_URL:
      case ACTION_TYPES.COPY_TITLE:
      case ACTION_TYPES.COPY_AS_MARKDOWN:
      case ACTION_TYPES.COPY_SELECTED_TEXT:
      case ACTION_TYPES.TOGGLE_DARK_MODE:
      case ACTION_TYPES.MEDIA_PLAY_PAUSE:
      case ACTION_TYPES.MEDIA_SPEED_UP:
      case ACTION_TYPES.MEDIA_SPEED_DOWN:
      case ACTION_TYPES.MEDIA_SPEED_RESET:
      case ACTION_TYPES.FULLSCREEN:
      case ACTION_TYPES.PRINT_PAGE:
        // These actions need to be executed in content script
        await sendToContent(tab.id, { action: action.type });
        break;

      case ACTION_TYPES.RELOAD_PAGE:
        await chrome.tabs.reload(tab.id);
        break;

      case ACTION_TYPES.CLOSE_TAB:
        await chrome.tabs.remove(tab.id);
        break;

      case ACTION_TYPES.NEW_TAB:
        await chrome.tabs.create({});
        break;

      case ACTION_TYPES.NEW_WINDOW:
        await chrome.windows.create({});
        break;

      case ACTION_TYPES.REOPEN_CLOSED_TAB:
        // 恢复最近关闭的标签页/窗口（需要 sessions 权限）
        await chrome.sessions.restore();
        break;

      case ACTION_TYPES.MUTE_TAB: {
        const fresh = await chrome.tabs.get(tab.id);
        await chrome.tabs.update(tab.id, { muted: !fresh.mutedInfo?.muted });
        break;
      }

      case ACTION_TYPES.CLOSE_OTHER_TABS: {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        const ids = tabs.filter((t) => t.id !== tab.id && !t.pinned).map((t) => t.id);
        if (ids.length) await chrome.tabs.remove(ids);
        break;
      }

      case ACTION_TYPES.CLOSE_TABS_RIGHT: {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        const current = tabs.find((t) => t.id === tab.id);
        if (current) {
          const ids = tabs.filter((t) => t.index > current.index && !t.pinned).map((t) => t.id);
          if (ids.length) await chrome.tabs.remove(ids);
        }
        break;
      }

      case ACTION_TYPES.CLOSE_WINDOW:
        await chrome.windows.remove(tab.windowId);
        break;

      case ACTION_TYPES.CLOSE_LEFT_TABS: {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        const current = tabs.find((t) => t.id === tab.id);
        if (current) {
          const ids = tabs.filter((t) => t.index < current.index && !t.pinned).map((t) => t.id);
          if (ids.length) await chrome.tabs.remove(ids);
        }
        break;
      }

      case ACTION_TYPES.CLOSE_DUPLICATE_TABS: {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        const seenByUrl = new Map();
        const toClose = [];
        for (const tb of tabs) {
          const url = tb.url || "";
          if (!url) continue;
          const kept = seenByUrl.get(url);
          if (!kept) {
            seenByUrl.set(url, tb);
          } else if ((tb.active || tb.pinned) && !kept.active && !kept.pinned) {
            // Prefer keeping the active/pinned copy
            toClose.push(kept.id);
            seenByUrl.set(url, tb);
          } else {
            toClose.push(tb.id);
          }
        }
        if (toClose.length) {
          await chrome.tabs.remove(toClose);
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            message: t("msg_duplicateTabsClosed", `Closed ${toClose.length} duplicate tab(s)`, [String(toClose.length)]),
            isError: false,
          });
        }
        break;
      }

      case ACTION_TYPES.SORT_TABS_BY_URL: {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId, pinned: false });
        if (tabs.length > 1) {
          const sortKey = (tb) => {
            try {
              const u = new URL(tb.url || "");
              return `${u.hostname.replace(/^www\./, "")} ${u.href}`;
            } catch {
              return tb.url || "";
            }
          };
          const firstIndex = Math.min(...tabs.map((tb) => tb.index));
          const sorted = [...tabs].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
          for (let i = 0; i < sorted.length; i++) {
            await chrome.tabs.move(sorted[i].id, { index: firstIndex + i });
          }
        }
        break;
      }

      case ACTION_TYPES.GROUP_TABS_BY_DOMAIN: {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId, pinned: false });
        const byHost = {};
        for (const tb of tabs) {
          if (tb.groupId && tb.groupId !== -1) continue; // already grouped
          try {
            const host = new URL(tb.url || "").hostname.replace(/^www\./, "");
            if (host) (byHost[host] ||= []).push(tb.id);
          } catch {
            // non-URL tabs (chrome://newtab etc.) stay ungrouped
          }
        }
        for (const [host, ids] of Object.entries(byHost)) {
          if (ids.length >= 2) {
            const groupId = await chrome.tabs.group({ tabIds: ids });
            await chrome.tabGroups.update(groupId, { title: host });
          }
        }
        break;
      }

      case ACTION_TYPES.UNGROUP_ALL_TABS: {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        const grouped = tabs.filter((tb) => tb.groupId && tb.groupId !== -1).map((tb) => tb.id);
        if (grouped.length) await chrome.tabs.ungroup(grouped);
        break;
      }

      case ACTION_TYPES.MUTE_ALL_TABS:
      case ACTION_TYPES.UNMUTE_ALL_TABS: {
        const muted = action.type === ACTION_TYPES.MUTE_ALL_TABS;
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        await Promise.all(tabs.map((tb) => chrome.tabs.update(tb.id, { muted }).catch(() => {})));
        break;
      }

      case ACTION_TYPES.RELOAD_ALL_TABS: {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        await Promise.all(tabs.map((tb) => chrome.tabs.reload(tb.id).catch(() => {})));
        break;
      }

      case ACTION_TYPES.MOVE_TAB_FIRST:
        await chrome.tabs.move(tab.id, { index: 0 });
        break;

      case ACTION_TYPES.MOVE_TAB_LAST:
        await chrome.tabs.move(tab.id, { index: -1 });
        break;

      case ACTION_TYPES.MOVE_TAB_TO_NEW_WINDOW:
        await chrome.windows.create({ tabId: tab.id });
        break;

      case ACTION_TYPES.MINIMIZE_WINDOW:
        await chrome.windows.update(tab.windowId, { state: "minimized" });
        break;

      case ACTION_TYPES.MAXIMIZE_WINDOW:
        await chrome.windows.update(tab.windowId, { state: "maximized" });
        break;

      case ACTION_TYPES.OPEN_INCOGNITO_WINDOW:
        try {
          await chrome.windows.create({ incognito: true });
        } catch (e) {
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            message: t("error_incognitoNotAllowed", "Allow this extension in incognito mode first (chrome://extensions)"),
            isError: true,
          });
        }
        break;

      case ACTION_TYPES.TRANSLATE_PAGE: {
        if (tab.url && /^https?:/i.test(tab.url)) {
          const uiLang = (localeOverride && localeOverride !== "auto" ? localeOverride : chrome.i18n.getUILanguage()).replace("_", "-");
          const translateUrl = `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(uiLang)}&u=${encodeURIComponent(tab.url)}`;
          await chrome.tabs.create({ url: translateUrl });
        }
        break;
      }

      case ACTION_TYPES.SEARCH_SELECTION: {
        const selection = await getSelectionText(tab.id);
        if (selection) {
          // Uses the user's default search engine
          await chrome.search.query({ text: selection.slice(0, 500), disposition: "NEW_TAB" });
        } else {
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            message: t("content_noSelection", "No text selected"),
            isError: true,
          });
        }
        break;
      }

      case ACTION_TYPES.SPEAK_SELECTION: {
        const selection = await getSelectionText(tab.id);
        const text = selection || tab.title || "";
        if (text) {
          chrome.tts.stop();
          chrome.tts.speak(text.slice(0, 10000), { enqueue: false });
        }
        break;
      }

      case ACTION_TYPES.STOP_SPEAKING:
        chrome.tts.stop();
        break;

      case ACTION_TYPES.CAPTURE_SCREENSHOT: {
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        await chrome.downloads.download({ url: dataUrl, filename: `hotkey-chain/screenshot-${stamp}.png` });
        break;
      }

      case ACTION_TYPES.SHOW_NOTIFICATION:
        await showSystemNotification(action.text ? await expandTemplate(action.text, tab) : tab.title || "");
        break;

      case ACTION_TYPES.OPEN_BROWSER_PAGE:
        await chrome.tabs.create({ url: BROWSER_PAGES[action.page] || BROWSER_PAGES.downloads });
        break;

      case ACTION_TYPES.DISCARD_OTHER_TABS: {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId, active: false, discarded: false });
        for (const tb of tabs) {
          if (!tb.pinned) await chrome.tabs.discard(tb.id).catch(() => {});
        }
        break;
      }

      case ACTION_TYPES.GOTO_AUDIBLE_TAB: {
        const [audible] = await chrome.tabs.query({ audible: true });
        if (audible) {
          await chrome.windows.update(audible.windowId, { focused: true });
          await chrome.tabs.update(audible.id, { active: true });
        } else {
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            message: t("msg_noAudibleTab", "No audible tab"),
            isError: true,
          });
        }
        break;
      }

      case ACTION_TYPES.BOOKMARK_ALL_TABS: {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        const savable = tabs.filter((tb) => tb.url && /^https?:/i.test(tb.url));
        if (savable.length) {
          const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
          const folder = await chrome.bookmarks.create({ title: `Tabs ${stamp}` });
          for (const tb of savable) {
            await chrome.bookmarks.create({ parentId: folder.id, title: tb.title || tb.url, url: tb.url });
          }
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            message: t("msg_tabsBookmarked", `Bookmarked ${savable.length} tabs`, [String(savable.length)]),
            isError: false,
          });
        }
        break;
      }

      case ACTION_TYPES.READ_LATER: {
        if (!chrome.readingList) {
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            message: t("msg_readingListUnsupported", "Reading list API not supported in this browser"),
            isError: true,
          });
          break;
        }
        if (tab.url && /^https?:/i.test(tab.url)) {
          try {
            await chrome.readingList.addEntry({ title: tab.title || tab.url, url: tab.url, hasBeenRead: false });
            await sendToContent(tab.id, {
              action: "show_extension_notification",
              message: t("msg_readLaterAdded", "Added to reading list"),
              isError: false,
            });
          } catch (e) {
            // duplicate entries throw
            await sendToContent(tab.id, {
              action: "show_extension_notification",
              message: t("msg_readLaterExists", "Already in reading list"),
              isError: false,
            });
          }
        }
        break;
      }

      case ACTION_TYPES.CLEAR_BROWSING_CACHE:
        await chrome.browsingData.removeCache({});
        await sendToContent(tab.id, {
          action: "show_extension_notification",
          message: t("msg_cacheCleared", "Browser cache cleared"),
          isError: false,
        });
        break;

      case ACTION_TYPES.CLEAR_SITE_DATA: {
        if (tab.url && /^https?:/i.test(tab.url)) {
          const origin = new URL(tab.url).origin;
          await chrome.browsingData.remove(
            { origins: [origin] },
            { cacheStorage: true, cookies: true, fileSystems: true, indexedDB: true, localStorage: true, serviceWorkers: true, webSQL: true }
          );
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            message: t("msg_siteDataCleared", "Site data cleared"),
            isError: false,
          });
        }
        break;
      }

      case ACTION_TYPES.DELETE_URL_FROM_HISTORY:
        if (tab.url) {
          await chrome.history.deleteUrl({ url: tab.url });
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            message: t("msg_historyDeleted", "Removed from history"),
            isError: false,
          });
        }
        break;

      case ACTION_TYPES.TOGGLE_KEEP_AWAKE: {
        const { keepAwake } = await chrome.storage.local.get(["keepAwake"]);
        if (keepAwake) {
          chrome.power.releaseKeepAwake();
          await chrome.storage.local.set({ keepAwake: false });
          await showSystemNotification(t("msg_keepAwakeOff", "Keep awake off"));
        } else {
          chrome.power.requestKeepAwake("display");
          await chrome.storage.local.set({ keepAwake: true });
          await showSystemNotification(t("msg_keepAwakeOn", "Keep awake on"));
        }
        break;
      }

      case ACTION_TYPES.SHOW_DOWNLOADS_FOLDER:
        chrome.downloads.showDefaultFolder();
        break;

      case ACTION_TYPES.SAVE_PAGE_MHTML: {
        const blob = await chrome.pageCapture.saveAsMHTML({ tabId: tab.id });
        const base64 = arrayBufferToBase64(await blob.arrayBuffer());
        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        await chrome.downloads.download({
          url: `data:multipart/related;base64,${base64}`,
          filename: `hotkey-chain/page-${stamp}.mhtml`,
        });
        break;
      }

      case ACTION_TYPES.IF_URL_MATCHES:
        if (!urlMatchesAny(tab.url || "", action.pattern)) {
          return { stop: true };
        }
        break;

      case ACTION_TYPES.IF_HAS_SELECTION: {
        const selection = await getSelectionText(tab.id);
        if (!selection) {
          return { stop: true };
        }
        break;
      }

      case ACTION_TYPES.RUN_CHAIN:
        if (action.chainKey) {
          await executeChain(action.chainKey, {
            tabId: ctx.tabId,
            callStack: [...(ctx.callStack || []), ctx.chainKey].filter(Boolean),
          });
        }
        break;

      case ACTION_TYPES.MOVE_TAB_LEFT: {
        const current = await chrome.tabs.get(tab.id);
        await chrome.tabs.move(tab.id, { index: Math.max(0, current.index - 1) });
        break;
      }

      case ACTION_TYPES.MOVE_TAB_RIGHT: {
        const current = await chrome.tabs.get(tab.id);
        await chrome.tabs.move(tab.id, { index: current.index + 1 });
        break;
      }

      case ACTION_TYPES.NEXT_TAB:
      case ACTION_TYPES.PREV_TAB: {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        if (tabs.length > 1) {
          const current = tabs.find((t) => t.id === tab.id) || tabs.find((t) => t.active);
          const offset = action.type === ACTION_TYPES.NEXT_TAB ? 1 : -1;
          const target = tabs[(current.index + offset + tabs.length) % tabs.length];
          await chrome.tabs.update(target.id, { active: true });
        }
        break;
      }

      case ACTION_TYPES.OPEN_URL:
        if (action.url && action.url.trim()) {
          let url = await expandTemplate(action.url.trim(), tab, { encode: true });
          // Only allow http/https/file — prepend https for bare domains.
          // Blocks javascript://, data:, vbscript:, and other non-navigation schemes.
          if (!/^https?:\/\//i.test(url) && !/^file:\/\//i.test(url)) {
            url = "https://" + url;
          }
          if (action.openIn === "current") {
            await chrome.tabs.update(tab.id, { url });
          } else {
            await chrome.tabs.create({ url });
          }
        }
        break;

      case ACTION_TYPES.ZOOM_IN:
        const currentZoomIn = await chrome.tabs.getZoom(tab.id);
        await chrome.tabs.setZoom(tab.id, Math.min(currentZoomIn + 0.1, 3));
        break;

      case ACTION_TYPES.ZOOM_OUT:
        const currentZoomOut = await chrome.tabs.getZoom(tab.id);
        await chrome.tabs.setZoom(tab.id, Math.max(currentZoomOut - 0.1, 0.25));
        break;

      case ACTION_TYPES.ZOOM_RESET:
        await chrome.tabs.setZoom(tab.id, 1);
        break;

      case ACTION_TYPES.BACK:
        await chrome.tabs.goBack(tab.id);
        break;

      case ACTION_TYPES.FORWARD:
        await chrome.tabs.goForward(tab.id);
        break;

      case ACTION_TYPES.BOOKMARK: {
        // Skip duplicates so repeated runs don't pile up identical bookmarks
        const existing = tab.url ? await chrome.bookmarks.search({ url: tab.url }) : [];
        if (existing.length > 0) {
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            message: t("content_bookmarkExists", "Already bookmarked"),
            isError: false,
          });
        } else {
          await chrome.bookmarks.create({
            title: tab.title,
            url: tab.url,
          });
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            message: t("content_bookmarkAdded", "Page bookmarked"),
            isError: false,
          });
        }
        break;
      }

      case ACTION_TYPES.WAIT:
        // Pure delay step: the configured delay is already applied before
        // each action in executeChain(), so nothing else is needed here.
        break;

      case ACTION_TYPES.CALL_EXTENSION:
        // 尝试调用其他扩展
        if (action.extensionId && action.message) {
          try {
            await chrome.runtime.sendMessage(action.extensionId, action.message);
          } catch (error) {
            console.warn("Extension call failed:", error);
            // 如果直接调用失败，尝试通过content script调用
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (extensionId, message) => {
                try {
                  chrome.runtime.sendMessage(extensionId, message);
                } catch (e) {
                  console.warn("Content script extension call failed:", e);
                }
              },
              args: [action.extensionId, action.message],
            });
          }
        }
        break;

      case ACTION_TYPES.EXECUTE_COMMAND:
        // 执行扩展命令
        if (action.command) {
          try {
            // 如果是本扩展的命令，直接执行
            if (action.extensionId === chrome.runtime.id || !action.extensionId) {
              if (action.command === "_execute_action") {
                // Run the default chain. The call stack is carried through so
                // the same loop/depth guard as run_chain/execute_chain_N stops
                // any recursion (this used to be skipped outright).
                const cfg = await getConfig();
                let defKey = cfg.defaultChain && cfg.chains[cfg.defaultChain] ? cfg.defaultChain : getOrderedChainKeys(cfg)[0];
                if (defKey) {
                  await executeChain(defKey, {
                    tabId: ctx.tabId,
                    callStack: [...(ctx.callStack || []), ctx.chainKey].filter(Boolean),
                  });
                }
              } else if (action.command.startsWith("execute_chain_")) {
                const chainNumber = parseInt(action.command.split("_")[2], 10);
                await executeChainByNumber(chainNumber, ctx);
              } else {
              }
            } else {
              // 处理其他扩展的命令，传递按键序列
              await executeExtensionCommand(action.extensionId, action.command, tab);
            }
          } catch (error) {
            console.warn("Command execution failed:", error);
          }
        }
        break;

      case ACTION_TYPES.CLEAR_CACHE:
        // 硬刷新当前标签页：绕过 HTTP 缓存重新加载，无需额外权限
        await chrome.tabs.reload(tab.id, { bypassCache: true });
        break;

      case ACTION_TYPES.DUPLICATE_TAB:
        await chrome.tabs.duplicate(tab.id);
        break;

      case ACTION_TYPES.PIN_TAB:
        await chrome.tabs.update(tab.id, { pinned: !tab.pinned });
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }

    return {};
  } catch (error) {
    console.error(`Error executing action ${action.type}:`, error);
    return { error };
  }
}

// Execute command for other extensions
async function executeExtensionCommand(extensionId, command, tab) {
  try {

    switch (command) {
      case "toggle_enabled":
        // 切换扩展的启用状态 (chrome.management.setEnabled)
        try {
          const extension = await chrome.management.get(extensionId);
          const newEnabled = !extension.enabled;
          await chrome.management.setEnabled(extensionId, newEnabled);

          await sendToContent(tab.id, {
            action: "show_extension_notification",
            extensionName: extension.name,
            message: t("msg_extension_toggled", `${extension.name} ${newEnabled ? "enabled" : "disabled"}`, [
              extension.name,
              newEnabled ? t("state_enabled", "enabled") : t("state_disabled", "disabled"),
            ]),
            isError: false,
          });
        } catch (error) {
          console.error("Failed to toggle extension:", error);
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            extensionName: t("label_extension", "Extension"),
            message: t("error_toggle_extension_failed", "Failed to toggle extension"),
            isError: true,
          });
        }
        break;

      case "uninstall_extension":
        // 卸载扩展 (chrome.management.uninstall) - 会弹出用户确认对话框
        try {
          const extension = await chrome.management.get(extensionId);
          await chrome.management.uninstall(extensionId, { showConfirmDialog: true });

          await sendToContent(tab.id, {
            action: "show_extension_notification",
            extensionName: extension.name,
            message: t("msg_uninstall_requested", `${extension.name} uninstall requested`, [extension.name]),
            isError: false,
          });
        } catch (error) {
          console.error("Failed to uninstall extension:", error);
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            extensionName: t("label_extension", "Extension"),
            message: t("error_uninstall_extension_failed", "Failed to uninstall extension"),
            isError: true,
          });
        }
        break;

      case "open_options":
        // 打开扩展的选项页面
        try {
          const extension = await chrome.management.get(extensionId);
          if (extension.optionsUrl) {
            await chrome.tabs.create({ url: extension.optionsUrl });
          } else {
            await sendToContent(tab.id, {
              action: "show_extension_notification",
              extensionName: extension.name,
              message: t("msg_no_options_page", `${extension.name} has no options page`, [extension.name]),
              isError: true,
            });
          }
        } catch (error) {
          console.error("Failed to open extension options:", error);
        }
        break;

      case "open_details":
        // 打开扩展在chrome://extensions页面的详情
        try {
          const extension = await chrome.management.get(extensionId);
          const detailsUrl = `chrome://extensions/?id=${extensionId}`;
          await chrome.tabs.create({ url: detailsUrl });
        } catch (error) {
          console.error("Failed to open extension details:", error);
        }
        break;

      case "show_extension_info":
        // 显示扩展详细信息 (chrome.management.get)
        try {
          const extension = await chrome.management.get(extensionId);
          const info = `${t("label_extension_name", "Extension")}: ${extension.name}
${t("label_version", "Version")}: ${extension.version}
${t("label_description", "Description")}: ${extension.description}
${t("label_type", "Type")}: ${extension.type}
${t("label_install_type", "Install type")}: ${extension.installType}
${t("label_permissions", "Permissions")}: ${extension.permissions?.join(", ") || t("label_none", "None")}
${t("label_homepage", "Homepage")}: ${extension.homepageUrl || t("label_none", "None")}`;


          try {
            await sendToContent(tab.id, {
              action: "show_extension_info_modal",
              extensionName: extension.name,
              extensionInfo: info,
            });
          } catch (messageError) {
            console.error("Failed to send message to content script:", messageError);
            // 备用方案：显示简单通知
            try {
              await sendToContent(tab.id, {
                action: "show_extension_notification",
                extensionName: extension.name,
                message: t("msg_check_console_for_details", `${extension.name} details: check console`, [extension.name]),
                isError: false,
              });
            } catch (fallbackError) {
              console.error("Fallback notification also failed:", fallbackError);
            }
          }
        } catch (error) {
          console.error("Failed to get extension info:", error);
          try {
            await sendToContent(tab.id, {
              action: "show_extension_notification",
              extensionName: t("label_error", "Error"),
              message: t("error_get_extension_info_failed", "Failed to get extension info"),
              isError: true,
            });
          } catch (notificationError) {
            console.error("Error notification failed:", notificationError);
          }
        }
        break;

      case "open_homepage":
        // 打开扩展主页
        try {
          const extension = await chrome.management.get(extensionId);
          if (extension.homepageUrl) {
            await chrome.tabs.create({ url: extension.homepageUrl });
          } else {
            await sendToContent(tab.id, {
              action: "show_extension_notification",
              extensionName: extension.name,
              message: t("msg_no_homepage", `${extension.name} has no homepage`, [extension.name]),
              isError: true,
            });
          }
        } catch (error) {
          console.error("Failed to open extension homepage:", error);
        }
        break;

      case "reload_dev_extension":
        // 重新加载开发扩展 (仅对开发中的扩展有效)
        try {
          const extension = await chrome.management.get(extensionId);
          if (extension.installType === "development") {
            // 先禁用再启用来实现重新加载
            await chrome.management.setEnabled(extensionId, false);
            await new Promise((resolve) => setTimeout(resolve, 500)); // 短暂延迟
            await chrome.management.setEnabled(extensionId, true);

            await sendToContent(tab.id, {
              action: "show_extension_notification",
              extensionName: extension.name,
              message: t("msg_dev_extension_reloaded", `Dev extension ${extension.name} reloaded`, [extension.name]),
              isError: false,
            });
          } else {
            await sendToContent(tab.id, {
              action: "show_extension_notification",
              extensionName: extension.name,
              message: t("msg_not_dev_extension", `${extension.name} is not a dev extension`, [extension.name]),
              isError: true,
            });
          }
        } catch (error) {
          console.error("Failed to reload dev extension:", error);
        }
        break;

      case "launch_app":
        // 启动Chrome应用 (chrome.management.launchApp)
        try {
          const extension = await chrome.management.get(extensionId);
          if (extension.type === "packaged_app" || extension.type === "hosted_app") {
            await chrome.management.launchApp(extensionId);
            await sendToContent(tab.id, {
              action: "show_extension_notification",
              extensionName: extension.name,
              message: t("msg_app_launched", `App ${extension.name} launched`, [extension.name]),
              isError: false,
            });
          } else {
            await sendToContent(tab.id, {
              action: "show_extension_notification",
              extensionName: extension.name,
              message: t("msg_not_chrome_app", `${extension.name} is not a Chrome app`, [extension.name]),
              isError: true,
            });
          }
        } catch (error) {
          console.error("Failed to launch app:", error);
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            extensionName: t("label_app", "App"),
            message: t("error_launch_app_failed", "Failed to launch app"),
            isError: true,
          });
        }
        break;

      case "open_store_page":
        // 打开Chrome网上应用店页面
        try {
          const extension = await chrome.management.get(extensionId);
          const storeUrl = `https://chromewebstore.google.com/detail/${extensionId}`;
          await chrome.tabs.create({ url: storeUrl });
        } catch (error) {
          console.error("Failed to open store page:", error);
        }
        break;

      default:
        // 未知命令
        try {
          await sendToContent(tab.id, {
            action: "show_extension_notification",
            extensionName: t("label_command", "Command"),
            message: t("error_unknown_command", `Unknown command: ${command}`, [command]),
            isError: true,
          });
        } catch (error) {
          console.warn("Failed to show notification:", error);
        }
        break;
    }
  } catch (error) {
    console.error("Failed to execute extension command:", error);
    try {
      await sendToContent(tab.id, {
        action: "show_extension_notification",
        extensionName: t("label_error", "Error"),
        message: t("error_execute_command_failed", "Command execution failed"),
        isError: true,
      });
    } catch (notificationError) {
      console.error("Failed to show error notification:", notificationError);
    }
  }
}

// Utility functions
async function getConfig() {
  const result = await chrome.storage.local.get(["hotkeyChainConfig"]);
  return result.hotkeyChainConfig || createDefaultConfig();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Delay between chain actions. The MV3 service worker is suspended after 30s
// without events or extension API calls, and a plain setTimeout does NOT
// reset that idle timer — a 60s wait would silently kill the chain mid-run.
// Chunk long waits and ping a trivial API between chunks to stay alive.
async function chainSleep(ms) {
  let remaining = Number(ms) || 0;
  while (remaining > 0) {
    const step = Math.min(remaining, 20000);
    await sleep(step);
    remaining -= step;
    if (remaining > 0) {
      try {
        await chrome.runtime.getPlatformInfo();
      } catch (e) {
        // keepalive ping only
      }
    }
  }
}

// Message handler for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getConfig") {
    getConfig().then((config) => sendResponse(config));
    return true; // Keep message channel open
  } else if (request.action === "saveConfig") {
    chrome.storage.local.set({ hotkeyChainConfig: request.config })
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        // e.g. sync quota exceeded — surface to the options page instead of hanging
        console.error("Failed to save config:", error);
        sendResponse({ success: false, error: String(error?.message || error) });
      });
    return true;
  } else if (request.action === "executeChain") {
    // Only the options page sends this. Its own tab is active, so target the
    // user's last real browsing tab instead of running on the options page.
    resolveUserRunContext().then((ctx) =>
      executeChain(request.chainKey, ctx).then(() => {
        sendResponse({ success: true });
      })
    );
    return true;
  } else if (request.action === "resetToDefaults") {
    const fresh = createDefaultConfig();
    chrome.storage.local.set({ hotkeyChainConfig: fresh })
      .then(() => sendResponse({ success: true, config: fresh }))
      .catch((error) => {
        console.error("Failed to restore defaults:", error);
        sendResponse({ success: false, error: String(error?.message || error) });
      });
    return true;
  } else if (request.action === "getInstalledExtensions") {
    getInstalledExtensions().then((extensions) => sendResponse(extensions));
    return true;
  } else if (request.action === "getExtensionCommands") {
    getExtensionCommands(request.extensionId).then((commands) => sendResponse(commands));
    return true;
  } else if (request.action === "getAllExtensionCommands") {
    getAllExtensionCommands().then((allCommands) => sendResponse(allCommands));
    return true;
  } else if (request.action === "getLocaleMessages") {
    // Hand the content script the active override map so its notifications
    // follow the user's chosen language, not the browser UI language.
    // Reload from storage so a just-changed language is reflected (the
    // background's own onChanged handler may not have run yet).
    (async () => {
      await loadLocaleOverrideCache();
      sendResponse({ override: i18nOverrideMap });
    })();
    return true;
  }
});

// Get list of installed extensions
async function getInstalledExtensions() {
  try {
    const extensions = await chrome.management.getAll();
    return extensions
      .filter((ext) => ext.enabled && ext.id !== chrome.runtime.id) // Exclude self and disabled extensions
      .map((ext) => ({
        id: ext.id,
        name: ext.name,
        shortName: ext.shortName || ext.name,
        description: ext.description,
        type: ext.type,
        version: ext.version,
        homepageUrl: ext.homepageUrl,
        icons: ext.icons,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to get installed extensions:", error);
    return [];
  }
}

// Get commands for a specific extension
async function getExtensionCommands(extensionId) {
  try {
    if (extensionId === chrome.runtime.id) {
      return await buildOwnCommands();
    } else {
      // 对于其他扩展：只查询目标扩展本身，避免 management.getAll() 的开销
      const targetExt = await chrome.management.get(extensionId);
      return targetExt ? buildManagementCommands(targetExt) : [];
    }
  } catch (error) {
    console.error("Failed to get extension commands:", error);
    return [];
  }
}

// Get this extension's own commands, localized with the override language.
// For execute_chain_N we show the REAL name of the chain that slot runs (same
// resolution as executeChainByNumber) instead of a bare "Action chain N".
async function buildOwnCommands() {
  const allCommands = await chrome.commands.getAll();
  const config = await getConfig();
  const ordered = getOrderedChainKeys(config);
  return allCommands.map((cmd) => {
    const name = cmd.name || "";
    let label = cmd.description || name; // primary text shown in the dropdown
    let detail = label; // secondary text (the slot / shortcut hint)
    if (name === "_execute_action") {
      label = t("cmd_execute_action", label);
      detail = label;
    } else {
      const m = name.match(/^execute_chain_(\d+)/);
      if (m) {
        const n = parseInt(m[1], 10);
        const slotLabel = t(`cmd_execute_chain_${n}`, label);
        // The slot binds to chain_N if present, otherwise the N-th chain in
        // display order — mirror executeChainByNumber so the label matches what
        // actually runs.
        const chainKey = config.chains[`chain_${n}`] ? `chain_${n}` : ordered[n - 1];
        const chain = chainKey && config.chains[chainKey];
        label = chain && chain.name ? chain.name : slotLabel;
        detail = slotLabel;
      }
    }
    return {
      name: label,
      command: name,
      description: detail,
      shortcut: cmd.shortcut || "",
    };
  });
}

// Build the Chrome Management-based command list for another extension.
// Pure (no async API calls) so it can be reused when iterating over many
// extensions without triggering an N+1 management.getAll() pattern.
function buildManagementCommands(targetExt) {
  const commands = [];

  // 1. 启用/禁用扩展 (chrome.management.setEnabled)
  commands.push({
    name: t("cmd_toggle_extension_name", "Toggle extension"),
    command: "toggle_enabled",
    description: t("cmd_toggle_extension_desc", `Toggle ${targetExt.name} enabled state`, [targetExt.name]),
    shortcut: "",
  });

  // 2. 卸载扩展 (chrome.management.uninstall) - 需要用户确认
  if (targetExt.mayDisable) {
    commands.push({
      name: t("cmd_uninstall_extension_name", "Uninstall extension"),
      command: "uninstall_extension",
      description: t("cmd_uninstall_extension_desc", `Uninstall ${targetExt.name} (confirmation required)`, [targetExt.name]),
      shortcut: "",
    });
  }

  // 3. 打开扩展选项页面 (直接URL访问)
  if (targetExt.optionsUrl) {
    commands.push({
      name: t("cmd_open_options_name", "Open options"),
      command: "open_options",
      description: t("cmd_open_options_desc", `Open ${targetExt.name} options page`, [targetExt.name]),
      shortcut: "",
    });
  }

  // 4. 打开扩展详情页面 (chrome://extensions/?id=xxx)
  commands.push({
    name: t("cmd_open_details_name", "Open details"),
    command: "open_details",
    description: t("cmd_open_details_desc", `View ${targetExt.name} in extensions page`, [targetExt.name]),
    shortcut: "",
  });

  // 5. 获取扩展信息 (chrome.management.get)
  commands.push({
    name: t("cmd_show_info_name", "Show extension info"),
    command: "show_extension_info",
    description: t("cmd_show_info_desc", `Show details of ${targetExt.name}`, [targetExt.name]),
    shortcut: "",
  });

  // 6. 打开扩展主页 (如果有的话)
  if (targetExt.homepageUrl) {
    commands.push({
      name: t("cmd_open_homepage_name", "Open homepage"),
      command: "open_homepage",
      description: t("cmd_open_homepage_desc", `Visit ${targetExt.name} website`, [targetExt.name]),
      shortcut: "",
    });
  }

  // 7. 特殊：对于开发者扩展，提供重新加载功能
  if (targetExt.installType === "development") {
    commands.push({
      name: t("cmd_reload_dev_name", "Reload dev extension"),
      command: "reload_dev_extension",
      description: t("cmd_reload_dev_desc", `Reload dev extension ${targetExt.name}`, [targetExt.name]),
      shortcut: "",
    });
  }

  // 8. 启动应用程序 (仅对Chrome Apps有效)
  if (targetExt.type === "packaged_app" || targetExt.type === "hosted_app") {
    commands.push({
      name: t("cmd_launch_app_name", "Launch app"),
      command: "launch_app",
      description: t("cmd_launch_app_desc", `Launch Chrome app ${targetExt.name}`, [targetExt.name]),
      shortcut: "",
    });
  }

  // 9. 打开扩展商店页面 (仅对从 Web Store 安装的扩展有效)
  if (targetExt.installType === "normal") {
    commands.push({
      name: t("cmd_open_store_name", "Open store page"),
      command: "open_store_page",
      description: t("cmd_open_store_desc", `View ${targetExt.name} in Chrome Web Store`, [targetExt.name]),
      shortcut: "",
    });
  }

  return commands;
}

// Get all extension commands
async function getAllExtensionCommands() {
  try {
    const allCommands = {};

    // 获取当前扩展的实际命令（带语言覆盖的本地化）
    allCommands[chrome.runtime.id] = {
      name: t("appName", "Hotkey Chain"),
      commands: await buildOwnCommands(),
    };

    // 获取其他扩展信息并生成对应的命令（复用已取得的 ext 对象，避免逐个再查询）
    const extensions = await chrome.management.getAll();
    for (const ext of extensions) {
      if (ext.enabled && ext.id !== chrome.runtime.id && ext.type === "extension") {
        const commands = buildManagementCommands(ext);
        if (commands.length > 0) {
          allCommands[ext.id] = {
            name: ext.name,
            commands: commands,
          };
        }
      }
    }

    return allCommands;
  } catch (error) {
    console.error("Failed to get all extension commands:", error);
    return {};
  }
}

