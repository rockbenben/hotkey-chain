// Options page JavaScript for Hotkey Chain Extension

// Global variables
let currentConfig = {};
let editingChainId = null;
let userLocale = null; // 'auto' or any _locales/<code> (en, zh_CN, ja, ar, …)
let i18nCache = {}; // options page override cache

// Action types mapping (same as background.js)
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
  TOGGLE_DARK_MODE: "toggle_dark_mode",
  TRANSLATE_PAGE: "translate_page",
  MEDIA_PLAY_PAUSE: "media_play_pause",
  MEDIA_SPEED_UP: "media_speed_up",
  MEDIA_SPEED_DOWN: "media_speed_down",
  MEDIA_SPEED_RESET: "media_speed_reset",
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
  MINIMIZE_WINDOW: "minimize_window",
  MAXIMIZE_WINDOW: "maximize_window",
  OPEN_INCOGNITO_WINDOW: "open_incognito_window",
  COPY_SELECTED_TEXT: "copy_selected_text",
  SEARCH_SELECTION: "search_selection",
  SPEAK_SELECTION: "speak_selection",
  STOP_SPEAKING: "stop_speaking",
  CAPTURE_SCREENSHOT: "capture_screenshot",
  SHOW_NOTIFICATION: "show_notification",
  OPEN_BROWSER_PAGE: "open_browser_page",
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
  IF_URL_MATCHES: "if_url_matches",
  IF_HAS_SELECTION: "if_has_selection",
  RUN_CHAIN: "run_chain",
};

// Built-in browser pages selectable for the open_browser_page action
const BROWSER_PAGE_OPTIONS = ["downloads", "history", "bookmarks", "extensions", "settings", "shortcuts", "clear_browsing_data"];

// Action display names (i18n)
const ACTION_NAMES = {
  [ACTION_TYPES.SCROLL_TO_TOP]: () => t("actionName_scroll_to_top", "滚动到顶部"),
  [ACTION_TYPES.SCROLL_TO_BOTTOM]: () => t("actionName_scroll_to_bottom", "滚动到底部"),
  [ACTION_TYPES.RELOAD_PAGE]: () => t("actionName_reload_page", "刷新页面"),
  [ACTION_TYPES.CLOSE_TAB]: () => t("actionName_close_tab", "关闭标签页"),
  [ACTION_TYPES.NEW_TAB]: () => t("actionName_new_tab", "新标签页"),
  [ACTION_TYPES.COPY_URL]: () => t("actionName_copy_url", "复制URL"),
  [ACTION_TYPES.COPY_TITLE]: () => t("actionName_copy_title", "复制标题"),
  [ACTION_TYPES.FULLSCREEN]: () => t("actionName_toggle_fullscreen", "全屏切换"),
  [ACTION_TYPES.ZOOM_IN]: () => t("actionName_zoom_in", "放大"),
  [ACTION_TYPES.ZOOM_OUT]: () => t("actionName_zoom_out", "缩小"),
  [ACTION_TYPES.ZOOM_RESET]: () => t("actionName_zoom_reset", "重置缩放"),
  [ACTION_TYPES.BACK]: () => t("actionName_go_back", "后退"),
  [ACTION_TYPES.FORWARD]: () => t("actionName_go_forward", "前进"),
  [ACTION_TYPES.BOOKMARK]: () => t("actionName_bookmark_page", "添加书签"),
  [ACTION_TYPES.COPY_AS_MARKDOWN]: () => t("actionName_copy_as_markdown", "复制为 Markdown 链接"),
  [ACTION_TYPES.CLEAR_CACHE]: () => t("actionName_clear_cache", "硬刷新（绕过缓存）"),
  [ACTION_TYPES.DUPLICATE_TAB]: () => t("actionName_duplicate_tab", "复制标签页"),
  [ACTION_TYPES.PIN_TAB]: () => t("actionName_pin_tab", "固定/取消固定标签页"),
  [ACTION_TYPES.MUTE_TAB]: () => t("actionName_mute_tab", "静音/取消静音标签页"),
  [ACTION_TYPES.CLOSE_OTHER_TABS]: () => t("actionName_close_other_tabs", "关闭其他标签页"),
  [ACTION_TYPES.MOVE_TAB_LEFT]: () => t("actionName_move_tab_left", "标签页左移"),
  [ACTION_TYPES.MOVE_TAB_RIGHT]: () => t("actionName_move_tab_right", "标签页右移"),
  [ACTION_TYPES.PREV_TAB]: () => t("actionName_prev_tab", "上一个标签页"),
  [ACTION_TYPES.NEXT_TAB]: () => t("actionName_next_tab", "下一个标签页"),
  [ACTION_TYPES.NEW_WINDOW]: () => t("actionName_new_window", "新建窗口"),
  [ACTION_TYPES.REOPEN_CLOSED_TAB]: () => t("actionName_reopen_closed_tab", "重新打开关闭的标签页"),
  [ACTION_TYPES.PRINT_PAGE]: () => t("actionName_print_page", "打印页面"),
  [ACTION_TYPES.OPEN_URL]: () => t("actionName_open_url", "打开网址"),
  [ACTION_TYPES.WAIT]: () => t("actionName_wait", "等待"),
  [ACTION_TYPES.EXECUTE_COMMAND]: () => t("actionName_execute_command", "执行命令"),
  [ACTION_TYPES.CALL_EXTENSION]: () => t("actionName_call_extension", "调用扩展"),
  [ACTION_TYPES.SCROLL_PAGE_UP]: () => t("actionName_scroll_page_up", "向上滚动一屏"),
  [ACTION_TYPES.SCROLL_PAGE_DOWN]: () => t("actionName_scroll_page_down", "向下滚动一屏"),
  [ACTION_TYPES.CLOSE_TABS_RIGHT]: () => t("actionName_close_tabs_right", "关闭右侧标签页"),
  [ACTION_TYPES.CLOSE_WINDOW]: () => t("actionName_close_window", "关闭窗口"),
  [ACTION_TYPES.TOGGLE_DARK_MODE]: () => t("actionName_toggle_dark_mode", "深色模式切换"),
  [ACTION_TYPES.TRANSLATE_PAGE]: () => t("actionName_translate_page", "翻译页面"),
  [ACTION_TYPES.MEDIA_PLAY_PAUSE]: () => t("actionName_media_play_pause", "播放/暂停媒体"),
  [ACTION_TYPES.MEDIA_SPEED_UP]: () => t("actionName_media_speed_up", "加快播放速度"),
  [ACTION_TYPES.MEDIA_SPEED_DOWN]: () => t("actionName_media_speed_down", "减慢播放速度"),
  [ACTION_TYPES.MEDIA_SPEED_RESET]: () => t("actionName_media_speed_reset", "重置播放速度"),
  [ACTION_TYPES.CLOSE_LEFT_TABS]: () => t("actionName_close_left_tabs", "关闭左侧标签页"),
  [ACTION_TYPES.CLOSE_DUPLICATE_TABS]: () => t("actionName_close_duplicate_tabs", "关闭重复标签页"),
  [ACTION_TYPES.SORT_TABS_BY_URL]: () => t("actionName_sort_tabs_by_url", "按网址排序标签页"),
  [ACTION_TYPES.GROUP_TABS_BY_DOMAIN]: () => t("actionName_group_tabs_by_domain", "按网站分组标签页"),
  [ACTION_TYPES.UNGROUP_ALL_TABS]: () => t("actionName_ungroup_all_tabs", "取消所有标签分组"),
  [ACTION_TYPES.MUTE_ALL_TABS]: () => t("actionName_mute_all_tabs", "静音所有标签页"),
  [ACTION_TYPES.UNMUTE_ALL_TABS]: () => t("actionName_unmute_all_tabs", "取消所有静音"),
  [ACTION_TYPES.RELOAD_ALL_TABS]: () => t("actionName_reload_all_tabs", "刷新所有标签页"),
  [ACTION_TYPES.MOVE_TAB_FIRST]: () => t("actionName_move_tab_first", "标签页移到最左"),
  [ACTION_TYPES.MOVE_TAB_LAST]: () => t("actionName_move_tab_last", "标签页移到最右"),
  [ACTION_TYPES.MOVE_TAB_TO_NEW_WINDOW]: () => t("actionName_move_tab_to_new_window", "标签页移到新窗口"),
  [ACTION_TYPES.MINIMIZE_WINDOW]: () => t("actionName_minimize_window", "最小化窗口"),
  [ACTION_TYPES.MAXIMIZE_WINDOW]: () => t("actionName_maximize_window", "最大化窗口"),
  [ACTION_TYPES.OPEN_INCOGNITO_WINDOW]: () => t("actionName_open_incognito_window", "打开无痕窗口"),
  [ACTION_TYPES.COPY_SELECTED_TEXT]: () => t("actionName_copy_selected_text", "复制选中文字"),
  [ACTION_TYPES.SEARCH_SELECTION]: () => t("actionName_search_selection", "搜索选中文字"),
  [ACTION_TYPES.SPEAK_SELECTION]: () => t("actionName_speak_selection", "朗读选中文字"),
  [ACTION_TYPES.STOP_SPEAKING]: () => t("actionName_stop_speaking", "停止朗读"),
  [ACTION_TYPES.CAPTURE_SCREENSHOT]: () => t("actionName_capture_screenshot", "截图（可见区域）"),
  [ACTION_TYPES.SHOW_NOTIFICATION]: () => t("actionName_show_notification", "显示系统通知"),
  [ACTION_TYPES.OPEN_BROWSER_PAGE]: () => t("actionName_open_browser_page", "打开浏览器页面"),
  [ACTION_TYPES.DISCARD_OTHER_TABS]: () => t("actionName_discard_other_tabs", "休眠其他标签页（释放内存）"),
  [ACTION_TYPES.GOTO_AUDIBLE_TAB]: () => t("actionName_goto_audible_tab", "跳到发声标签页"),
  [ACTION_TYPES.BOOKMARK_ALL_TABS]: () => t("actionName_bookmark_all_tabs", "收藏所有标签页"),
  [ACTION_TYPES.READ_LATER]: () => t("actionName_read_later", "加入阅读清单"),
  [ACTION_TYPES.CLEAR_BROWSING_CACHE]: () => t("actionName_clear_browsing_cache", "清除浏览器缓存"),
  [ACTION_TYPES.CLEAR_SITE_DATA]: () => t("actionName_clear_site_data", "清除本站数据"),
  [ACTION_TYPES.DELETE_URL_FROM_HISTORY]: () => t("actionName_delete_url_from_history", "从历史记录删除本页"),
  [ACTION_TYPES.TOGGLE_KEEP_AWAKE]: () => t("actionName_toggle_keep_awake", "保持唤醒开/关"),
  [ACTION_TYPES.SHOW_DOWNLOADS_FOLDER]: () => t("actionName_show_downloads_folder", "打开下载文件夹"),
  [ACTION_TYPES.SAVE_PAGE_MHTML]: () => t("actionName_save_page_mhtml", "保存页面 (MHTML)"),
  [ACTION_TYPES.IF_URL_MATCHES]: () => t("actionName_if_url_matches", "条件：网址匹配则继续"),
  [ACTION_TYPES.IF_HAS_SELECTION]: () => t("actionName_if_has_selection", "条件：有选中文字则继续"),
  [ACTION_TYPES.RUN_CHAIN]: () => t("actionName_run_chain", "运行另一条动作链"),
};

// Common extension action templates.
// Each action carries a stable `nameKey` (i18n message id) used as both the
// <option> value and the match key, so the label can be localized without
// breaking selection when the UI language changes. `name` is the localized
// label shown to the user (resolved lazily via t()).
const EXTENSION_TEMPLATES = {
  gighmmpiobklfepjocnamgkkbiglidom: {
    // AdBlock
    name: "AdBlock",
    actions: [
      { nameKey: "extTmpl_toggleAdblock", message: { action: "toggle" } },
      { nameKey: "extTmpl_pauseBlocking", message: { action: "pause" } },
      { nameKey: "extTmpl_resumeBlocking", message: { action: "resume" } },
    ],
  },
  cjpalhdlnbpafiamejdnhcphjbkeiagm: {
    // uBlock Origin
    name: "uBlock Origin",
    actions: [
      { nameKey: "extTmpl_toggleBlocker", message: { action: "toggle" } },
      { nameKey: "extTmpl_reloadFilters", message: { action: "reload-filters" } },
    ],
  },
  hdokiejnpimakedhajhdlcegeplioahd: {
    // LastPass
    name: "LastPass",
    actions: [
      { nameKey: "extTmpl_fillForm", message: { action: "fill_form" } },
      { nameKey: "extTmpl_openVault", message: { action: "open_vault" } },
      { nameKey: "extTmpl_generatePassword", message: { action: "generate_password" } },
    ],
  },
  nngceckbapebfimnlniiiahkandclblb: {
    // Bitwarden
    name: "Bitwarden",
    actions: [
      { nameKey: "extTmpl_autofill", message: { action: "autofill" } },
      { nameKey: "extTmpl_openPopup", message: { action: "open_popup" } },
    ],
  },
  fhbjgbiflinjbdggehcddcbncdddomop: {
    // Postman
    name: "Postman",
    actions: [
      { nameKey: "extTmpl_captureRequest", message: { action: "capture_request" } },
      { nameKey: "extTmpl_importRequest", message: { action: "import_request" } },
    ],
  },
  kjacjjdnoddnpbbcjilcajfhhbdhkpgk: {
    // Web Developer
    name: "Web Developer",
    actions: [
      { nameKey: "extTmpl_showRuler", message: { action: "show_ruler" } },
      { nameKey: "extTmpl_disableCss", message: { action: "disable_css" } },
    ],
  },
  aapbdbdomjkkjkaonfhkkikfgjllcleb: {
    // Google Translate
    name: "Google Translate",
    actions: [
      { nameKey: "extTmpl_translatePage", message: { action: "translate_page" } },
      { nameKey: "extTmpl_translateSelection", message: { action: "translate_selection" } },
    ],
  },
  alelhddbbhepgpmgidjdcjakblofbmce: {
    // GoFullPage
    name: "GoFullPage",
    actions: [
      { nameKey: "extTmpl_captureFullPage", message: { action: "capture_full_page" } },
      { nameKey: "extTmpl_captureVisible", message: { action: "capture_visible" } },
    ],
  },
  generic: {
    nameKey: "extTmpl_genericName",
    actions: [
      { nameKey: "extTmpl_toggleFeature", message: { action: "toggle" } },
      { nameKey: "extTmpl_runMain", message: { action: "execute" } },
      { nameKey: "extTmpl_openPopup", message: { action: "open_popup" } },
      { nameKey: "extTmpl_refresh", message: { action: "refresh" } },
      { nameKey: "extTmpl_reset", message: { action: "reset" } },
    ],
  },
};

// 扩展命令缓存（动态加载）
let extensionCommandsCache = {};
let isLoadingCommands = false;

let installedExtensions = [];

// Action categories (stable IDs) and their i18n labels
const ACTION_CATEGORY_LABELS = {
  execute_command: () => t("category_execute_command", "执行命令"),
  flow: () => t("category_flow", "流程控制"),
  page_ops: () => t("category_page_ops", "页面操作"),
  tab_mgmt: () => t("category_tab_mgmt", "标签管理"),
  window_mgmt: () => t("category_window", "窗口管理"),
  zoom: () => t("category_zoom", "缩放控制"),
  media: () => t("category_media", "媒体控制"),
  content: () => t("category_content", "内容操作"),
  advanced: () => t("category_advanced", "高级功能"),
  extension: () => t("category_extension", "扩展调用"),
};

// Action categories for grouped display (do not localize keys here)
const ACTION_CATEGORIES = {
  execute_command: [ACTION_TYPES.EXECUTE_COMMAND],
  flow: [ACTION_TYPES.IF_URL_MATCHES, ACTION_TYPES.IF_HAS_SELECTION, ACTION_TYPES.RUN_CHAIN, ACTION_TYPES.WAIT],
  page_ops: [
    ACTION_TYPES.SCROLL_TO_TOP,
    ACTION_TYPES.SCROLL_TO_BOTTOM,
    ACTION_TYPES.SCROLL_PAGE_UP,
    ACTION_TYPES.SCROLL_PAGE_DOWN,
    ACTION_TYPES.RELOAD_PAGE,
    ACTION_TYPES.FULLSCREEN,
    ACTION_TYPES.TOGGLE_DARK_MODE,
    ACTION_TYPES.TRANSLATE_PAGE,
    ACTION_TYPES.BACK,
    ACTION_TYPES.FORWARD,
    ACTION_TYPES.PRINT_PAGE,
    ACTION_TYPES.OPEN_URL,
  ],
  tab_mgmt: [
    ACTION_TYPES.NEW_TAB,
    ACTION_TYPES.CLOSE_TAB,
    ACTION_TYPES.CLOSE_OTHER_TABS,
    ACTION_TYPES.CLOSE_TABS_RIGHT,
    ACTION_TYPES.CLOSE_LEFT_TABS,
    ACTION_TYPES.CLOSE_DUPLICATE_TABS,
    ACTION_TYPES.SORT_TABS_BY_URL,
    ACTION_TYPES.GROUP_TABS_BY_DOMAIN,
    ACTION_TYPES.UNGROUP_ALL_TABS,
    ACTION_TYPES.DUPLICATE_TAB,
    ACTION_TYPES.PIN_TAB,
    ACTION_TYPES.MUTE_TAB,
    ACTION_TYPES.MUTE_ALL_TABS,
    ACTION_TYPES.UNMUTE_ALL_TABS,
    ACTION_TYPES.RELOAD_ALL_TABS,
    ACTION_TYPES.MOVE_TAB_LEFT,
    ACTION_TYPES.MOVE_TAB_RIGHT,
    ACTION_TYPES.MOVE_TAB_FIRST,
    ACTION_TYPES.MOVE_TAB_LAST,
    ACTION_TYPES.PREV_TAB,
    ACTION_TYPES.NEXT_TAB,
    ACTION_TYPES.REOPEN_CLOSED_TAB,
    ACTION_TYPES.DISCARD_OTHER_TABS,
    ACTION_TYPES.GOTO_AUDIBLE_TAB,
    ACTION_TYPES.BOOKMARK_ALL_TABS,
  ],
  window_mgmt: [
    ACTION_TYPES.NEW_WINDOW,
    ACTION_TYPES.CLOSE_WINDOW,
    ACTION_TYPES.MINIMIZE_WINDOW,
    ACTION_TYPES.MAXIMIZE_WINDOW,
    ACTION_TYPES.OPEN_INCOGNITO_WINDOW,
    ACTION_TYPES.MOVE_TAB_TO_NEW_WINDOW,
  ],
  zoom: [ACTION_TYPES.ZOOM_IN, ACTION_TYPES.ZOOM_OUT, ACTION_TYPES.ZOOM_RESET],
  media: [ACTION_TYPES.MEDIA_PLAY_PAUSE, ACTION_TYPES.MEDIA_SPEED_UP, ACTION_TYPES.MEDIA_SPEED_DOWN, ACTION_TYPES.MEDIA_SPEED_RESET, ACTION_TYPES.SPEAK_SELECTION, ACTION_TYPES.STOP_SPEAKING],
  content: [ACTION_TYPES.COPY_URL, ACTION_TYPES.COPY_TITLE, ACTION_TYPES.COPY_AS_MARKDOWN, ACTION_TYPES.COPY_SELECTED_TEXT, ACTION_TYPES.SEARCH_SELECTION, ACTION_TYPES.BOOKMARK, ACTION_TYPES.READ_LATER],
  advanced: [
    ACTION_TYPES.CLEAR_CACHE,
    ACTION_TYPES.CAPTURE_SCREENSHOT,
    ACTION_TYPES.SAVE_PAGE_MHTML,
    ACTION_TYPES.SHOW_NOTIFICATION,
    ACTION_TYPES.OPEN_BROWSER_PAGE,
    ACTION_TYPES.SHOW_DOWNLOADS_FOLDER,
    ACTION_TYPES.CLEAR_BROWSING_CACHE,
    ACTION_TYPES.CLEAR_SITE_DATA,
    ACTION_TYPES.DELETE_URL_FROM_HISTORY,
    ACTION_TYPES.TOGGLE_KEEP_AWAKE,
  ],
  extension: [ACTION_TYPES.CALL_EXTENSION],
};

// ---- Action visuals (Shortcut-style colored icon tiles) ----
// Color is by category (so a chain spanning categories reads as a colorful
// sequence); icons are line glyphs shared across related actions.
const CATEGORY_COLORS = {
  execute_command: "#14b8a6",
  flow: "#8b5cf6",
  page_ops: "#3b82f6",
  tab_mgmt: "#10b981",
  window_mgmt: "#6366f1",
  zoom: "#06b6d4",
  media: "#a855f7",
  content: "#f59e0b",
  advanced: "#0ea5e9",
  extension: "#f43f5e",
};

// Reverse lookup: action type -> category id
const ACTION_CATEGORY_OF = (() => {
  const map = {};
  for (const [cat, list] of Object.entries(ACTION_CATEGORIES)) {
    for (const type of list) map[type] = cat;
  }
  return map;
})();

// 24x24 line-icon inner markup (stroke = currentColor, set to #fff on tiles)
const ICONS = {
  arrowUp: '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',
  arrowDown: '<path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
  arrowRight: '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
  chevUp: '<path d="M17 11l-5-5-5 5"/><path d="M17 18l-5-5-5 5"/>',
  chevDown: '<path d="M7 6l5 5 5-5"/><path d="M7 13l5 5 5-5"/>',
  chevLeft: '<path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/>',
  chevRight: '<path d="M13 17l5-5-5-5"/><path d="M6 17l5-5-5-5"/>',
  refresh: '<path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  expand: '<path d="M8 3H5a2 2 0 00-2 2v3"/><path d="M16 3h3a2 2 0 012 2v3"/><path d="M8 21H5a2 2 0 01-2-2v-3"/><path d="M16 21h3a2 2 0 002-2v-3"/>',
  moon: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 010 18 14 14 0 010-18z"/>',
  printer: '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  xCircle: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
  sort: '<path d="M11 5h10M11 9h7M11 13h4"/><path d="M3 8l3-3 3 3"/><path d="M6 5v14"/>',
  group: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M13 6h5a3 3 0 013 3v0"/>',
  pin: '<path d="M12 17v5"/><path d="M9 3h6l-1 7 3 2v2H7v-2l3-2-1-7z"/>',
  volume: '<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7"/>',
  volumeX: '<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  bookmarkPlus: '<path d="M6 3h12v18l-6-4-6 4z"/><path d="M12 7v6M9 10h6"/>',
  window: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>',
  maximize: '<path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3"/>',
  eyeOff: '<path d="M17.9 17.9A9.8 9.8 0 0112 20c-7 0-10-8-10-8a18 18 0 015.1-5.9M9.9 4.2A9.6 9.6 0 0112 4c7 0 10 8 10 8a18 18 0 01-2.2 3.2"/><path d="M1 1l22 22"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M21 21l-4.3-4.3"/>',
  zoomOut: '<circle cx="11" cy="11" r="7"/><path d="M8 11h6M21 21l-4.3-4.3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  play: '<path d="M7 4l13 8-13 8V4z"/>',
  fastFwd: '<path d="M13 5l8 7-8 7V5z"/><path d="M3 5l8 7-8 7V5z"/>',
  rewind: '<path d="M11 5L3 12l8 7V5z"/><path d="M21 5l-8 7 8 7V5z"/>',
  speak: '<path d="M3 10v4h3l4 4V6L6 10H3z"/><path d="M14 8a5 5 0 010 8M17 5a9 9 0 010 14"/>',
  link: '<path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>',
  type: '<path d="M4 7V5h16v2"/><path d="M9 19h6M12 5v14"/>',
  code: '<path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 11h6M9 15h4"/>',
  branch: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="9" r="2.5"/><path d="M6 8.5v7M6 12h6a3 3 0 003-3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  command: '<path d="M6 4a2 2 0 110 4h12a2 2 0 110-4 2 2 0 11-4 0v12a2 2 0 11-4 0V8a2 2 0 11-4 0 2 2 0 11-4 0z"/>',
  camera: '<path d="M3 7h3l2-2h8l2 2h3v12H3z"/><circle cx="12" cy="13" r="3.5"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7M8 21v-7h8v7"/>',
  bell: '<path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  folder: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  puzzle: '<path d="M9 4a2 2 0 014 0v1h2a2 2 0 012 2v2h1a2 2 0 010 4h-1v3a2 2 0 01-2 2h-2v-1a2 2 0 00-4 0v1H7a2 2 0 01-2-2v-2H4a2 2 0 010-4h1V7a2 2 0 012-2h2V4z"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
};

// Per-action icon key (falls back to a per-category default)
const ACTION_ICON_KEYS = {
  [ACTION_TYPES.SCROLL_TO_TOP]: "arrowUp",
  [ACTION_TYPES.SCROLL_TO_BOTTOM]: "arrowDown",
  [ACTION_TYPES.SCROLL_PAGE_UP]: "chevUp",
  [ACTION_TYPES.SCROLL_PAGE_DOWN]: "chevDown",
  [ACTION_TYPES.RELOAD_PAGE]: "refresh",
  [ACTION_TYPES.FULLSCREEN]: "expand",
  [ACTION_TYPES.TOGGLE_DARK_MODE]: "moon",
  [ACTION_TYPES.TRANSLATE_PAGE]: "globe",
  [ACTION_TYPES.BACK]: "arrowLeft",
  [ACTION_TYPES.FORWARD]: "arrowRight",
  [ACTION_TYPES.PRINT_PAGE]: "printer",
  [ACTION_TYPES.OPEN_URL]: "external",
  [ACTION_TYPES.NEW_TAB]: "plus",
  [ACTION_TYPES.CLOSE_TAB]: "x",
  [ACTION_TYPES.CLOSE_OTHER_TABS]: "xCircle",
  [ACTION_TYPES.CLOSE_TABS_RIGHT]: "chevRight",
  [ACTION_TYPES.CLOSE_LEFT_TABS]: "chevLeft",
  [ACTION_TYPES.CLOSE_DUPLICATE_TABS]: "copy",
  [ACTION_TYPES.SORT_TABS_BY_URL]: "sort",
  [ACTION_TYPES.GROUP_TABS_BY_DOMAIN]: "group",
  [ACTION_TYPES.UNGROUP_ALL_TABS]: "group",
  [ACTION_TYPES.DUPLICATE_TAB]: "copy",
  [ACTION_TYPES.PIN_TAB]: "pin",
  [ACTION_TYPES.MUTE_TAB]: "volumeX",
  [ACTION_TYPES.MUTE_ALL_TABS]: "volumeX",
  [ACTION_TYPES.UNMUTE_ALL_TABS]: "volume",
  [ACTION_TYPES.RELOAD_ALL_TABS]: "refresh",
  [ACTION_TYPES.MOVE_TAB_LEFT]: "arrowLeft",
  [ACTION_TYPES.MOVE_TAB_RIGHT]: "arrowRight",
  [ACTION_TYPES.MOVE_TAB_FIRST]: "chevLeft",
  [ACTION_TYPES.MOVE_TAB_LAST]: "chevRight",
  [ACTION_TYPES.PREV_TAB]: "arrowLeft",
  [ACTION_TYPES.NEXT_TAB]: "arrowRight",
  [ACTION_TYPES.REOPEN_CLOSED_TAB]: "refresh",
  [ACTION_TYPES.DISCARD_OTHER_TABS]: "moon",
  [ACTION_TYPES.GOTO_AUDIBLE_TAB]: "volume",
  [ACTION_TYPES.BOOKMARK_ALL_TABS]: "bookmark",
  [ACTION_TYPES.NEW_WINDOW]: "window",
  [ACTION_TYPES.CLOSE_WINDOW]: "x",
  [ACTION_TYPES.MINIMIZE_WINDOW]: "minus",
  [ACTION_TYPES.MAXIMIZE_WINDOW]: "maximize",
  [ACTION_TYPES.OPEN_INCOGNITO_WINDOW]: "eyeOff",
  [ACTION_TYPES.MOVE_TAB_TO_NEW_WINDOW]: "external",
  [ACTION_TYPES.ZOOM_IN]: "zoomIn",
  [ACTION_TYPES.ZOOM_OUT]: "zoomOut",
  [ACTION_TYPES.ZOOM_RESET]: "search",
  [ACTION_TYPES.MEDIA_PLAY_PAUSE]: "play",
  [ACTION_TYPES.MEDIA_SPEED_UP]: "fastFwd",
  [ACTION_TYPES.MEDIA_SPEED_DOWN]: "rewind",
  [ACTION_TYPES.MEDIA_SPEED_RESET]: "refresh",
  [ACTION_TYPES.SPEAK_SELECTION]: "speak",
  [ACTION_TYPES.STOP_SPEAKING]: "volumeX",
  [ACTION_TYPES.COPY_URL]: "link",
  [ACTION_TYPES.COPY_TITLE]: "type",
  [ACTION_TYPES.COPY_AS_MARKDOWN]: "code",
  [ACTION_TYPES.COPY_SELECTED_TEXT]: "clipboard",
  [ACTION_TYPES.SEARCH_SELECTION]: "search",
  [ACTION_TYPES.BOOKMARK]: "bookmark",
  [ACTION_TYPES.READ_LATER]: "bookmarkPlus",
  [ACTION_TYPES.CLEAR_CACHE]: "refresh",
  [ACTION_TYPES.CAPTURE_SCREENSHOT]: "camera",
  [ACTION_TYPES.SAVE_PAGE_MHTML]: "save",
  [ACTION_TYPES.SHOW_NOTIFICATION]: "bell",
  [ACTION_TYPES.OPEN_BROWSER_PAGE]: "layout",
  [ACTION_TYPES.SHOW_DOWNLOADS_FOLDER]: "folder",
  [ACTION_TYPES.CLEAR_BROWSING_CACHE]: "trash",
  [ACTION_TYPES.CLEAR_SITE_DATA]: "trash",
  [ACTION_TYPES.DELETE_URL_FROM_HISTORY]: "trash",
  [ACTION_TYPES.TOGGLE_KEEP_AWAKE]: "sun",
  [ACTION_TYPES.IF_URL_MATCHES]: "branch",
  [ACTION_TYPES.IF_HAS_SELECTION]: "branch",
  [ACTION_TYPES.RUN_CHAIN]: "link",
  [ACTION_TYPES.WAIT]: "clock",
  [ACTION_TYPES.EXECUTE_COMMAND]: "command",
  [ACTION_TYPES.CALL_EXTENSION]: "puzzle",
};

const CATEGORY_DEFAULT_ICON = {
  execute_command: "command", flow: "branch", page_ops: "dot", tab_mgmt: "window",
  window_mgmt: "window", zoom: "search", media: "play", content: "clipboard",
  advanced: "dot", extension: "puzzle",
};

// Resolve an action type to { color, svg } for a colored icon tile
function actionVisual(type) {
  const cat = ACTION_CATEGORY_OF[type] || "advanced";
  const color = CATEGORY_COLORS[cat] || "#64748b";
  const iconKey = ACTION_ICON_KEYS[type] || CATEGORY_DEFAULT_ICON[cat] || "dot";
  return { color, svg: ICONS[iconKey] || ICONS.dot };
}

// Build a colored icon-tile element for an action type
function actionTile(type, size = "") {
  const { color, svg } = actionVisual(type);
  return `<span class="action-tile ${size}" style="background:${color}"><svg viewBox="0 0 24 24">${svg}</svg></span>`;
}

// Built-in chain templates ("Shortcuts"-style recipes users can add with one click).
// `build` is a function so action text/names are localized at creation time.
const CHAIN_TEMPLATES = [
  {
    key: "focus",
    nameKey: "tmpl_focusMode",
    fallback: "专注模式",
    icon: "bi-moon-stars",
    build: () => [
      { type: ACTION_TYPES.MUTE_ALL_TABS, delay: 0 },
      { type: ACTION_TYPES.TOGGLE_DARK_MODE, delay: 200 },
      { type: ACTION_TYPES.FULLSCREEN, delay: 200 },
    ],
  },
  {
    key: "tabCleanup",
    nameKey: "tmpl_tabCleanup",
    fallback: "标签大扫除",
    icon: "bi-magic",
    build: () => [
      { type: ACTION_TYPES.CLOSE_DUPLICATE_TABS, delay: 0 },
      { type: ACTION_TYPES.SORT_TABS_BY_URL, delay: 300 },
      { type: ACTION_TYPES.GROUP_TABS_BY_DOMAIN, delay: 300 },
    ],
  },
  {
    key: "video",
    nameKey: "tmpl_videoMode",
    fallback: "视频模式",
    icon: "bi-play-circle",
    build: () => [
      { type: ACTION_TYPES.MEDIA_PLAY_PAUSE, delay: 0 },
      { type: ACTION_TYPES.FULLSCREEN, delay: 200 },
    ],
  },
  {
    key: "snapshot",
    nameKey: "tmpl_snapshot",
    fallback: "截图存档",
    icon: "bi-camera",
    build: () => [
      { type: ACTION_TYPES.CAPTURE_SCREENSHOT, delay: 0 },
      { type: ACTION_TYPES.BOOKMARK, delay: 300 },
      { type: ACTION_TYPES.SHOW_NOTIFICATION, delay: 300, text: t("tmpl_snapshot_done", "已截图并加入书签") },
    ],
  },
  {
    key: "readAloud",
    nameKey: "tmpl_readAloud",
    fallback: "朗读选中内容",
    icon: "bi-megaphone",
    build: () => [{ type: ACTION_TYPES.SPEAK_SELECTION, delay: 0 }],
  },
  {
    key: "translate",
    nameKey: "tmpl_translate",
    fallback: "翻译当前页面",
    icon: "bi-translate",
    build: () => [{ type: ACTION_TYPES.TRANSLATE_PAGE, delay: 0 }],
  },
  {
    key: "wrapUp",
    nameKey: "tmpl_wrapUp",
    fallback: "收工模式",
    icon: "bi-cup-hot",
    build: () => [
      { type: ACTION_TYPES.BOOKMARK, delay: 0 },
      { type: ACTION_TYPES.MUTE_ALL_TABS, delay: 200 },
      { type: ACTION_TYPES.MINIMIZE_WINDOW, delay: 200 },
    ],
  },
];

// Generate grouped action options
function generateGroupedActionOptions(selectedType) {
  return Object.entries(ACTION_CATEGORIES)
    .map(([categoryId, actions]) => {
      const label = (ACTION_CATEGORY_LABELS[categoryId] && ACTION_CATEGORY_LABELS[categoryId]()) || categoryId;
      return `
      <optgroup label="${label}">
        ${actions
          .map(
            (type) => `
          <option value="${type}" ${selectedType === type ? "selected" : ""}>${(ACTION_NAMES[type] && ACTION_NAMES[type]()) || type}</option>
        `
          )
          .join("")}
      </optgroup>
    `;
    })
    .join("");
}

// Initialize options page
document.addEventListener("DOMContentLoaded", async () => {
  // Load user locale preference
  try {
    userLocale = localStorage.getItem("hotkey_chain_locale") || "auto";
  } catch {}
  // Preload override locale if any
  await loadOverrideLocale(userLocale);
  // Sync override to background so it can localize with the same language
  try {
    await chrome.storage.local.set({ localeOverride: userLocale || "auto" });
  } catch {}
  // i18n static text first
  applyI18nToPage();
  applyTextDirection(userLocale);
  // init selector
  const localeSelect = document.getElementById("localeSelect");
  if (localeSelect) {
    localeSelect.value = userLocale || "auto";
    localeSelect.addEventListener("change", async (e) => {
      userLocale = e.target.value;
      try {
        if (userLocale && userLocale !== "auto") {
          localStorage.setItem("hotkey_chain_locale", userLocale);
        } else {
          localStorage.removeItem("hotkey_chain_locale");
        }
      } catch {}
      // Persist override for background and wait a tick to ensure it's picked up
      try {
        await chrome.storage.local.set({ localeOverride: userLocale || "auto" });
      } catch {}
      await loadOverrideLocale(userLocale);
      applyI18nToPage();
      applyTextDirection(userLocale);
      // Reload extension commands to reflect new language coming from background
      try {
        await new Promise((r) => setTimeout(r, 150));
        await loadExtensionCommands();
      } catch {}
      renderMainView();
      renderActionsHelp();
      populateTemplateMenu();
      if (editingChainId) renderChainEdit(editingChainId);
    });
  }
  await loadExtensionCommands();
  await loadConfig();
  await loadInstalledExtensions();
  setupEventListeners();
  renderMainView();
  renderActionsHelp();
  populateTemplateMenu();

  // 初始化 Sortable.js 拖拽功能
  setTimeout(() => {
    initializeSortableDragDrop();
  }, 200);
});

// i18n helpers
function t(msgKey, fallback = "") {
  try {
    if (userLocale && userLocale !== "auto" && i18nCache[userLocale]) {
      const val = i18nCache[userLocale][msgKey];
      if (val) return val;
    }
    const res = chrome.i18n.getMessage(msgKey);
    return res || fallback || msgKey;
  } catch (e) {
    return fallback || msgKey;
  }
}

function applyI18nToPage() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const txt = t(key, el.textContent.trim());
    if (txt) el.textContent = txt;
  });
  // __MSG_*__ placeholders are only substituted in manifest/CSS, not HTML,
  // so placeholder/title attributes are localized here instead
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const txt = t(el.getAttribute("data-i18n-placeholder"), "");
    if (txt) el.setAttribute("placeholder", txt);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const txt = t(el.getAttribute("data-i18n-title"), "");
    if (txt) el.setAttribute("title", txt);
  });
  document.title = t("appTitle", document.title);
}

// RTL languages — mirror the page direction for these locales (e.g. Arabic).
const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);
function applyTextDirection(locale) {
  let lang = locale;
  if (!lang || lang === "auto") {
    try {
      lang = chrome.i18n.getUILanguage() || "en";
    } catch {
      lang = "en";
    }
  }
  const base = String(lang).toLowerCase().split(/[-_]/)[0];
  document.documentElement.setAttribute("dir", RTL_LOCALES.has(base) ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", base || "en");
}

async function loadOverrideLocale(locale) {
  if (!locale || locale === "auto") return;
  try {
    const resp = await fetch(`_locales/${locale}/messages.json`);
    if (!resp.ok) return;
    const json = await resp.json();
    const map = {};
    Object.keys(json).forEach((k) => {
      const v = json[k];
      if (v && typeof v.message === "string") map[k] = v.message;
    });
    i18nCache[locale] = map;
  } catch (e) {
    console.warn("Failed to load override locale", locale, e);
  }
}

// 动态加载所有扩展的命令
async function loadExtensionCommands() {
  if (isLoadingCommands) return;
  isLoadingCommands = true;

  try {
    const allCommands = await chrome.runtime.sendMessage({ action: "getAllExtensionCommands" });
    extensionCommandsCache = allCommands || {};
  } catch (error) {
    console.error("Failed to load extension commands:", error);
    extensionCommandsCache = {};
  } finally {
    isLoadingCommands = false;
  }
}
// Setup event listeners
function setupEventListeners() {
  // Add new chain
  document.getElementById("addChainBtn").addEventListener("click", () => {
    addNewChain();
  });

  // Template gallery dropdown
  const templateMenu = document.getElementById("templateMenu");
  if (templateMenu) {
    templateMenu.addEventListener("click", (e) => {
      const item = e.target.closest("[data-template-key]");
      if (item) {
        e.preventDefault();
        addChainFromTemplate(item.dataset.templateKey);
      }
    });
  }

  // Export configuration as a JSON file
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportConfig);
  }

  // Import configuration from a JSON file
  const importBtn = document.getElementById("importBtn");
  const importFileInput = document.getElementById("importFileInput");
  if (importBtn && importFileInput) {
    importBtn.addEventListener("click", () => importFileInput.click());
    importFileInput.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = ""; // allow re-importing the same file
      if (file) await importConfig(file);
    });
  }

  // Restore the built-in default action chains (replaces the whole config)
  const restoreDefaultsBtn = document.getElementById("restoreDefaultsBtn");
  if (restoreDefaultsBtn) {
    restoreDefaultsBtn.addEventListener("click", restoreDefaults);
  }

  // Open Chrome's keyboard shortcut settings for this extension
  const shortcutsBtn = document.getElementById("shortcutsBtn");
  if (shortcutsBtn) {
    shortcutsBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    });
  }

  // Back button in edit view
  document.getElementById("backBtn").addEventListener("click", () => {
    showMainView();
  });

  // Event delegation for main chain grid
  const chainsContainer = document.getElementById("chains-container");
  if (chainsContainer) {
    chainsContainer.addEventListener("click", (e) => {
      const executeBtn = e.target.closest(".execute-btn");
      if (executeBtn) {
        const chainKey = executeBtn.dataset.chainKey;
        executeChain(chainKey);
        return;
      }

      const editBtn = e.target.closest(".edit-chain-btn");
      if (editBtn) {
        const chainKey = editBtn.dataset.chainKey;
        editChain(chainKey);
        return;
      }

      const duplicateBtn = e.target.closest(".duplicate-chain-btn");
      if (duplicateBtn) {
        const chainKey = duplicateBtn.dataset.chainKey;
        duplicateChain(chainKey);
        return;
      }

      const deleteBtn = e.target.closest(".delete-chain-btn");
      if (deleteBtn) {
        const chainKey = deleteBtn.dataset.chainKey;
        deleteChain(chainKey);
        return;
      }

      const setDefaultBtn = e.target.closest(".set-default-btn");
      if (setDefaultBtn) {
        const chainKey = setDefaultBtn.dataset.chainKey;
        setDefaultChain(chainKey);
        return;
      }
    });
  }

  // 点击其他地方关闭菜单（保留以防其他地方需要）
  document.addEventListener("click", () => {
    document.querySelectorAll(".chain-menu-dropdown.show").forEach((menu) => {
      menu.classList.remove("show");
    });
  });

  // Event delegation for edit config area
  const chainEditConfigEl = document.getElementById("chainEditConfig");

  chainEditConfigEl.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-action-btn");
    if (addBtn) {
      const chainKey = addBtn.dataset.chainKey;
      addAction(chainKey);
      return;
    }

    const removeBtn = e.target.closest(".remove-action-btn");
    if (removeBtn) {
      const chainKey = removeBtn.dataset.chainKey;
      const actionIndex = parseInt(removeBtn.dataset.actionIndex, 10);
      removeAction(chainKey, actionIndex);
      return;
    }

    const refreshBtn = e.target.closest(".refresh-extensions-btn");
    if (refreshBtn) {
      const chainKey = refreshBtn.dataset.chainKey;
      const index = parseInt(refreshBtn.dataset.actionIndex, 10);
      refreshExtensionsList(chainKey, index);
      return;
    }

    const refreshCommandsBtn = e.target.closest(".refresh-commands-btn");
    if (refreshCommandsBtn) {
      const chainKey = refreshCommandsBtn.dataset.chainKey;
      const index = parseInt(refreshCommandsBtn.dataset.actionIndex, 10);
      refreshCommandsList(chainKey, index);
      return;
    }
  });

  chainEditConfigEl.addEventListener("change", (e) => {
    const target = e.target;

    if (target.matches(".action-type-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      updateActionType(chainKey, index, target.value);
      return;
    }

    if (target.matches(".extension-selector")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      handleExtensionSelection(chainKey, index, target.value);
      return;
    }

    if (target.matches(".command-selector")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      handleCommandSelection(chainKey, index, target.value);
      return;
    }

    if (target.matches(".command-extension-selector")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      handleCommandExtensionSelection(chainKey, index, target.value);
      return;
    }

    if (target.matches(".extension-action-selector")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      handleExtensionActionSelection(chainKey, index, target.value);
      return;
    }

    if (target.matches(".open-url-target")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].openIn = target.value;
      saveConfig();
      return;
    }

    if (target.matches(".browser-page-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].page = target.value;
      saveConfig();
      return;
    }

    if (target.matches(".run-chain-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].chainKey = target.value;
      saveConfig();
      return;
    }
  });

  chainEditConfigEl.addEventListener("input", (e) => {
    const target = e.target;

    if (target.matches(".chain-name-input")) {
      const chainKey = target.dataset.chainKey;
      updateChainName(chainKey, target.value);
      return;
    }

    if (target.matches(".action-delay-input")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      updateActionDelay(chainKey, index, target.value);
      return;
    }

    if (target.matches(".extension-id-input")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      updateExtensionId(chainKey, index, target.value.trim());
      return;
    }

    if (target.matches(".extension-message-input")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      updateExtensionMessage(chainKey, index, target.value);
      return;
    }

    if (target.matches(".open-url-input")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      updateActionUrl(chainKey, index, target.value);
      return;
    }

    if (target.matches(".notify-text-input")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].text = target.value;
      saveConfig();
      return;
    }

    if (target.matches(".condition-pattern-input")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].pattern = target.value;
      saveConfig();
      return;
    }
  });

  // Event listeners for new edit form fields
  const chainNameInput = document.getElementById("chainNameInput");
  if (chainNameInput) {
    chainNameInput.addEventListener("input", (e) => {
      if (editingChainId) {
        updateChainName(editingChainId, e.target.value);
      }
    });
  }

  const chainDescInput = document.getElementById("chainDescInput");
  if (chainDescInput) {
    chainDescInput.addEventListener("input", (e) => {
      if (editingChainId) {
        updateChainDescription(editingChainId, e.target.value);
      }
    });
  }

  const setAsDefaultCheck = document.getElementById("setAsDefaultCheck");
  if (setAsDefaultCheck) {
    setAsDefaultCheck.addEventListener("change", (e) => {
      if (editingChainId && e.target.checked) {
        setDefaultChain(editingChainId);
      }
    });
  }

  const testChainBtn = document.getElementById("testChainBtn");
  if (testChainBtn) {
    testChainBtn.addEventListener("click", () => {
      if (editingChainId) {
        executeChain(editingChainId);
      }
    });
  }

  // Export just the chain being edited (shareable single-chain JSON)
  const exportChainBtn = document.getElementById("exportChainBtn");
  if (exportChainBtn) {
    exportChainBtn.addEventListener("click", () => {
      if (editingChainId) {
        exportSingleChain(editingChainId);
      }
    });
  }

  // Trigger settings: schedule (minutes) and auto-run URL patterns
  const chainScheduleInput = document.getElementById("chainScheduleInput");
  if (chainScheduleInput) {
    chainScheduleInput.addEventListener("input", (e) => {
      if (editingChainId) {
        const minutes = parseInt(e.target.value, 10);
        currentConfig.chains[editingChainId].scheduleMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
        saveConfig();
      }
    });
  }

  const chainAutoRunInput = document.getElementById("chainAutoRunInput");
  if (chainAutoRunInput) {
    chainAutoRunInput.addEventListener("input", (e) => {
      if (editingChainId) {
        currentConfig.chains[editingChainId].autoRunPatterns = e.target.value;
        saveConfig();
      }
    });
  }
}

// Show main view
function showMainView() {
  document.getElementById("main-view").style.display = "block";
  document.getElementById("edit-view").style.display = "none";

  // 重新渲染主页面以显示最新的动作信息
  renderMainView();

  // 重新初始化拖拽功能
  setTimeout(() => {
    initializeSortableDragDrop();
  }, 100);

  // 清除编辑状态
  editingChainId = null;
}

// Show edit view
function showEditView() {
  document.getElementById("main-view").style.display = "none";
  document.getElementById("edit-view").style.display = "block";
}

// Edit chain function
function editChain(chainKey) {
  showEditView();
  editingChainId = chainKey;
  const chain = currentConfig.chains[chainKey];

  // Update edit view title
  const editTitle = document.getElementById("editChainTitle");
  editTitle.textContent = `${t("edit_title", "编辑动作链")}: ${chain.name}`;

  // Fill in the form fields
  const chainNameInput = document.getElementById("chainNameInput");
  const chainDescInput = document.getElementById("chainDescInput");
  const setAsDefaultCheck = document.getElementById("setAsDefaultCheck");

  if (chainNameInput) chainNameInput.value = chain.name || "";
  if (chainDescInput) chainDescInput.value = chain.description || "";
  if (setAsDefaultCheck) setAsDefaultCheck.checked = currentConfig.defaultChain === chainKey;

  const chainScheduleInput = document.getElementById("chainScheduleInput");
  const chainAutoRunInput = document.getElementById("chainAutoRunInput");
  if (chainScheduleInput) chainScheduleInput.value = Number(chain.scheduleMinutes) > 0 ? chain.scheduleMinutes : 0;
  if (chainAutoRunInput) chainAutoRunInput.value = chain.autoRunPatterns || "";

  // Render the chain configuration in edit view
  renderChainEdit(chainKey);
}

// Load configuration from storage
async function loadConfig() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "getConfig" });
    currentConfig = response;

    // 确保有 chainOrder 字段，如果没有则根据现有顺序创建
    if (!currentConfig.chainOrder) {
      currentConfig.chainOrder = Object.keys(currentConfig.chains);
    }
  } catch (error) {
    console.error("Failed to load config:", error);
    // Use default config if loading fails
    currentConfig = {
      defaultChain: "chain_1",
      chainOrder: ["chain_1"],
      chains: {
        chain_1: {
          name: "默认链",
          actions: [
            { type: ACTION_TYPES.SCROLL_TO_TOP, delay: 200 },
            { type: ACTION_TYPES.RELOAD_PAGE, delay: 500 },
          ],
        },
      },
    };
  }
}

// Save configuration to storage.
// Debounced: the editor saves on every keystroke, and each write fans out to
// the background (rebuilds context menus, re-syncs alarms). Coalescing rapid
// edits avoids that churn.
let saveConfigTimer = null;
let saveConfigDirty = false;

function saveConfig() {
  saveConfigDirty = true;
  clearTimeout(saveConfigTimer);
  saveConfigTimer = setTimeout(flushSaveConfig, 400);
}

async function flushSaveConfig() {
  if (!saveConfigDirty) return;
  saveConfigDirty = false;
  clearTimeout(saveConfigTimer);
  try {
    const response = await chrome.runtime.sendMessage({
      action: "saveConfig",
      config: currentConfig,
    });
    if (response && response.success === false) {
      throw new Error(response.error || "unknown error");
    }
  } catch (error) {
    // Surface unexpected storage failures instead of silently losing edits
    console.error("Failed to save config:", error);
    showMessage(t("toast_saveFailed", "保存失败: $1").replace("$1", error.message), true);
  }
}

// Persist the trailing debounced write when the options page closes
window.addEventListener("pagehide", () => {
  flushSaveConfig();
});

// Load installed extensions
async function loadInstalledExtensions() {
  try {
    installedExtensions = await chrome.runtime.sendMessage({ action: "getInstalledExtensions" });
  } catch (error) {
    console.error("Failed to load installed extensions:", error);
    installedExtensions = [];
  }
}

// Render main view with action chains
function renderMainView() {
  // Chains grid container
  const chainsContainer = document.getElementById("chains-container");
  if (chainsContainer) {
    chainsContainer.innerHTML = "";

    // 按照保存的顺序或默认顺序渲染动作链
    const chainOrder = currentConfig.chainOrder || Object.keys(currentConfig.chains);
    chainOrder.forEach((chainKey) => {
      const chain = currentConfig.chains[chainKey];
      if (!chain) return; // 跳过不存在的动作链

      const chainCard = document.createElement("div");
      chainCard.className = "chain-card";
      chainCard.draggable = true;
      chainCard.dataset.chainKey = chainKey;

      const isDefault = chainKey === currentConfig.defaultChain;

      const scheduleMin = Number(chain.scheduleMinutes) > 0 ? Number(chain.scheduleMinutes) : 0;
      const hasAutoRun = !!(chain.autoRunPatterns && String(chain.autoRunPatterns).trim());
      const triggerChips =
        (scheduleMin ? `<span class="cc-chip" title="${t("info_schedule", "Schedule")}"><i class="bi bi-clock me-1"></i>${scheduleMin}m</span>` : "") +
        (hasAutoRun ? `<span class="cc-chip" title="${t("info_autoRun", "Auto-run")}"><i class="bi bi-lightning-charge"></i></span>` : "");

      chainCard.innerHTML = `
        <div class="chain-card-header">
          <span class="drag-handle" title="">⋮⋮</span>
          <div class="cc-titlewrap">
            <h6 class="chain-title">${escapeHtmlAttr(chain.name)}</h6>
            <div class="chain-meta">
              <span class="chain-actions-count">${chain.actions.length} ${t("actions_count", "个动作")}</span>
              ${isDefault ? `<span class="cc-chip def"><i class="bi bi-star-fill me-1"></i>${t("tooltip_defaultChain", "Default")}</span>` : ""}
              ${triggerChips}
            </div>
          </div>
          ${
            !isDefault
              ? `<button class="set-default-btn" data-chain-key="${chainKey}" title="${t("tooltip_setDefaultChain", "Set as default chain")}"><i class="bi bi-star"></i></button>`
              : ""
          }
        </div>
        <div class="chain-card-body">
          <div class="chain-actions">
            ${chain.actions
              .slice(0, 3)
              .map(
                (action) => `
              <div class="action-item">
                ${actionTile(action.type)}
                <span class="action-name">${(ACTION_NAMES[action.type] && ACTION_NAMES[action.type]()) || escapeHtmlAttr(action.type)}</span>
                <span class="action-ms ${Number(action.delay) === 0 ? "zero" : ""}">${Number(action.delay) || 0}${t("label_ms", "ms")}</span>
              </div>
            `
              )
              .join("")}
            ${
              chain.actions.length > 3
                ? `<div class="chain-more">+ ${chain.actions.length - 3} ${t("actions_more", "more")}</div>`
                : ""
            }
            ${chain.actions.length === 0 ? `<div class="chain-empty">${t("actions_none", "暂无动作")}</div>` : ""}
          </div>
          <div class="chain-card-actions">
            <button class="btn btn-primary btn-sm execute-btn" data-chain-key="${chainKey}">
              <i class="bi bi-play-fill me-1"></i>${t("card_exec", "执行")}
            </button>
            <button class="btn btn-outline-secondary btn-sm icon-btn edit-chain-btn" data-chain-key="${chainKey}" title="${t("card_edit", "编辑")}">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-secondary btn-sm icon-btn duplicate-chain-btn" data-chain-key="${chainKey}" title="${t("card_duplicate", "复制")}">
              <i class="bi bi-copy"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm icon-btn delete-chain-btn" data-chain-key="${chainKey}" title="${t("card_delete", "删除")}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      `;

      chainsContainer.appendChild(chainCard);
    });
  }
}

// Render chain edit interface
function renderChainEdit(chainKey) {
  const chain = currentConfig.chains[chainKey];
  if (!chain) return;

  const actionsList = document.getElementById("chainEditConfig");
  if (!actionsList) return;

  // Clear existing content
  actionsList.innerHTML = "";

  // Render each action
  chain.actions.forEach((action, index) => {
    const actionDiv = document.createElement("div");
    actionDiv.className = "action-config card mb-3";
    actionDiv.draggable = true;
    actionDiv.dataset.chainKey = chainKey;
    actionDiv.dataset.actionIndex = index;

    actionDiv.innerHTML = `
      <div class="card-body">
        <div class="d-flex align-items-center">
          <span class="drag-handle me-2" style="cursor: move;">⋮⋮</span>
          ${actionTile(action.type, "edit-tile")}
          <div class="flex-grow-1">
            <div class="row g-2 align-items-center">
              <div class="col-md-4">
                <select class="form-select form-select-sm action-type-select" data-chain-key="${chainKey}" data-action-index="${index}">
                  ${generateGroupedActionOptions(action.type)}
                </select>
              </div>
    <div class="col-md-3">
                <div class="input-group input-group-sm">
  <span class="input-group-text">${t("label_delay", "延迟")}</span>
                  <input type="number" class="form-control action-delay-input" min="0" max="10000" step="100"
          value="${Number(action.delay) || 0}" data-chain-key="${chainKey}" data-action-index="${index}" placeholder="${t("label_ms", "ms")}">
        <span class="input-group-text">${t("label_ms", "ms")}</span>
                </div>
              </div>
              <div class="col-md-auto">
                <button class="btn btn-outline-danger btn-sm remove-action-btn" data-chain-key="${chainKey}" data-action-index="${index}">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            ${generateActionSpecificControls(chainKey, index, action)}
          </div>
        </div>
      </div>
    `;

    actionsList.appendChild(actionDiv);
  });

  // Update add action button event
  const addActionBtn = document.getElementById("addActionBtn");
  if (addActionBtn) {
    // Remove existing listeners
    addActionBtn.replaceWith(addActionBtn.cloneNode(true));
    const newAddActionBtn = document.getElementById("addActionBtn");
    newAddActionBtn.addEventListener("click", () => {
      addAction(chainKey);
    });
  }

  // Initialize extension selectors after rendering
  setTimeout(async () => {
    await initializeExtensionSelectors();
  }, 0);

  // Initialize drag and drop for actions
  setTimeout(() => {
    initializeSortableDragDrop();
  }, 100);
}

// Generate action-specific controls based on action type
function generateActionSpecificControls(chainKey, index, action) {
  if (action.type === ACTION_TYPES.CALL_EXTENSION) {
    return `
      <div class="mt-2">
        <div class="row g-2 mb-2">
          <div class="col-md-6">
            <label class="form-label small">${t("label_selectExtension", "选择扩展")}:</label>
            <select class="form-select form-select-sm extension-selector" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">${t("placeholder_selectInstalledExtension", "-- 选择已安装的扩展 --")}</option>
              <option value="manual" ${!action.extensionId || action.extensionId === "manual" ? "selected" : ""}>${t("option_manualInputExtensionId", "手动输入扩展ID")}</option>
            </select>
          </div>
          <div class="col-md-auto">
            <label class="form-label small">&nbsp;</label>
            <button class="btn btn-outline-secondary btn-sm refresh-extensions-btn d-block" data-chain-key="${chainKey}" data-action-index="${index}">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
        
        <div class="extension-id-row mb-2" ${action.extensionId && action.extensionId !== "manual" ? 'style="display:none"' : ""}>
          <label class="form-label small">${t("label_extensionId", "扩展ID")}:</label>
          <input type="text" class="form-control form-control-sm extension-id-input" placeholder="${t("placeholder_extensionIdExample", "扩展ID (如: nfgcnddoajoekfpacfkehomkgmpndhob)")}" 
                 value="${action.extensionId && action.extensionId !== "manual" ? escapeHtmlAttr(action.extensionId) : ""}"
                 data-chain-key="${chainKey}" data-action-index="${index}">
        </div>
        
        <div class="extension-action-row mb-2" ${!action.extensionId || action.extensionId === "manual" ? 'style="display:none"' : ""}>
          <label class="form-label small">${t("label_presetAction", "预设动作")}:</label>
          <select class="form-select form-select-sm extension-action-selector" data-chain-key="${chainKey}" data-action-index="${index}">
            <option value="">${t("placeholder_selectActionTemplate", "-- 选择动作模板 --")}</option>
            <option value="custom">${t("option_customMessage", "自定义消息")}</option>
          </select>
        </div>
        
        <div class="extension-message-row">
          <label class="form-label small">${t("label_messageContent", "消息内容")}:</label>
          <textarea class="form-control form-control-sm extension-message-input" rows="3" placeholder="${t("placeholder_messageJson", '消息内容 (JSON格式，如: {"action": "toggle"})')}"
                   data-chain-key="${chainKey}" data-action-index="${index}">${action.message ? escapeHtmlAttr(JSON.stringify(action.message, null, 2)) : ""}</textarea>
        </div>
        <div class="form-text small">${t("hint_callExtension", "向另一个扩展发送消息；仅当目标扩展允许外部消息（externally_connectable）时才生效，多数扩展不支持，可能没有反应。")}</div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.EXECUTE_COMMAND) {
    return `
      <div class="mt-2">
        <div class="row g-2 mb-2">
          <div class="col-md-6">
            <label class="form-label small">${t("label_selectExtension", "选择扩展")}:</label>
            <select class="form-select form-select-sm command-extension-selector" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">${t("label_selectExtension", "选择扩展")}</option>
            </select>
          </div>
        </div>
        
        <div class="row g-2">
          <div class="col">
            <label class="form-label small">${t("label_selectCommand", "选择命令")}:</label>
            <div class="input-group input-group-sm">
              <select class="form-select form-select-sm command-selector" data-chain-key="${chainKey}" data-action-index="${index}">
                <option value="">${t("placeholder_selectCommand", "-- 选择命令 --")}</option>
              </select>
              <button class="btn btn-outline-secondary refresh-commands-btn" data-chain-key="${chainKey}" data-action-index="${index}" title="${t("tooltip_refreshCommands", "刷新命令列表")}">
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="form-text small">${t("hint_executeCommand", "选「本扩展」运行你自己的动作链；选其它扩展则是对它执行管理操作（启用/停用、卸载、打开选项等），不是触发该扩展自己的快捷键。")}</div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.OPEN_URL) {
    return `
      <div class="mt-2">
        <div class="row g-2">
          <div class="col-md-8">
            <label class="form-label small">${t("label_url", "网址")}:</label>
            <input type="text" class="form-control form-control-sm open-url-input" placeholder="${t("placeholder_urlExample", "网址 (如: https://example.com)")}"
                   value="${action.url ? escapeHtmlAttr(action.url) : ""}"
                   data-chain-key="${chainKey}" data-action-index="${index}">
            <div class="form-text small">${t("hint_templateVars", "支持变量: {url} {title} {selection} {clipboard} {date} {time}")}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label small">${t("label_openIn", "打开方式")}:</label>
            <select class="form-select form-select-sm open-url-target" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="new" ${action.openIn !== "current" ? "selected" : ""}>${t("option_openIn_new", "新标签页")}</option>
              <option value="current" ${action.openIn === "current" ? "selected" : ""}>${t("option_openIn_current", "当前标签页")}</option>
            </select>
          </div>
        </div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.SHOW_NOTIFICATION) {
    return `
      <div class="mt-2">
        <label class="form-label small">${t("label_notifyText", "通知内容")}:</label>
        <input type="text" class="form-control form-control-sm notify-text-input" placeholder="${t("placeholder_notifyText", "要显示的通知文字")}"
               value="${action.text ? escapeHtmlAttr(action.text) : ""}"
               data-chain-key="${chainKey}" data-action-index="${index}">
        <div class="form-text small">${t("hint_templateVars", "支持变量: {url} {title} {selection} {clipboard} {date} {time}")}</div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.IF_URL_MATCHES) {
    return `
      <div class="mt-2">
        <label class="form-label small">${t("label_pattern", "匹配规则")}:</label>
        <input type="text" class="form-control form-control-sm condition-pattern-input" placeholder="${t("placeholder_pattern", "如 *://github.com/* 或关键字，多个用逗号分隔")}"
               value="${action.pattern ? escapeHtmlAttr(action.pattern) : ""}"
               data-chain-key="${chainKey}" data-action-index="${index}">
      </div>
    `;
  } else if (action.type === ACTION_TYPES.RUN_CHAIN) {
    const otherChains = (currentConfig.chainOrder || Object.keys(currentConfig.chains)).filter((key) => currentConfig.chains[key] && key !== chainKey);
    return `
      <div class="mt-2">
        <label class="form-label small">${t("label_runChain", "选择动作链")}:</label>
        <select class="form-select form-select-sm run-chain-select" data-chain-key="${chainKey}" data-action-index="${index}">
          <option value="">${t("placeholder_selectChain", "-- 选择动作链 --")}</option>
          ${otherChains.map((key) => `<option value="${key}" ${action.chainKey === key ? "selected" : ""}>${escapeHtmlAttr(currentConfig.chains[key].name || key)}</option>`).join("")}
        </select>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.OPEN_BROWSER_PAGE) {
    return `
      <div class="mt-2">
        <label class="form-label small">${t("label_browserPage", "浏览器页面")}:</label>
        <select class="form-select form-select-sm browser-page-select" data-chain-key="${chainKey}" data-action-index="${index}">
          ${BROWSER_PAGE_OPTIONS.map((page) => `<option value="${page}" ${(action.page || "downloads") === page ? "selected" : ""}>${t(`browserPage_${page}`, page)}</option>`).join("")}
        </select>
      </div>
    `;
  }
  return ""; // For other action types, no additional controls
}

// Escape a string for safe use inside an HTML attribute value
function escapeHtmlAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Initialize extension selectors with installed extensions
async function initializeExtensionSelectors() {
  const selectors = document.querySelectorAll(".extension-selector");

  selectors.forEach((selector) => {
    const chainKey = selector.dataset.chainKey;
    const actionIndex = parseInt(selector.dataset.actionIndex, 10);
    const action = currentConfig.chains[chainKey].actions[actionIndex];

    // Clear existing extension options (keep first two: placeholder and manual)
    while (selector.children.length > 2) {
      selector.removeChild(selector.lastChild);
    }

    // Add installed extensions
    installedExtensions.forEach((ext) => {
      const option = document.createElement("option");
      option.value = ext.id;
      option.textContent = `${ext.name} (${ext.version})`;
      if (action.extensionId === ext.id) {
        option.selected = true;
      }
      selector.appendChild(option);
    });

    // Initialize action selector if extension is selected
    if (action.extensionId && action.extensionId !== "manual") {
      const container = selector.closest(".action-config");
      const actionSelector = container.querySelector(".extension-action-selector");
      if (actionSelector) {
        populateActionSelector(actionSelector, action.extensionId);
      }
    }
  });

  // Initialize command extension selectors
  const commandExtensionSelectors = document.querySelectorAll(".command-extension-selector");
  commandExtensionSelectors.forEach((selector) => {
    const chainKey = selector.dataset.chainKey;
    const actionIndex = parseInt(selector.dataset.actionIndex, 10);
    const action = currentConfig.chains[chainKey].actions[actionIndex];

    // Clear existing options
    selector.innerHTML = `<option value="">${t("label_selectExtension", "选择扩展")}</option>`;

    // Add other installed extensions first (excluding current extension)
    const currentExtensionId = chrome.runtime.id;
    installedExtensions.forEach((ext) => {
      if (ext.id !== currentExtensionId) {
        const option = document.createElement("option");
        option.value = ext.id;
        option.textContent = `${ext.name} (${ext.version})`;
        selector.appendChild(option);
      }
    });

    // Add current extension at the end
    const currentOption = document.createElement("option");
    currentOption.value = currentExtensionId;
    currentOption.textContent = `${t("appName", "Hotkey Chain")} (${t("thisExtension", "本扩展")})`;
    selector.appendChild(currentOption);

    // Set current selection
    if (action.extensionId) {
      selector.value = action.extensionId;
    }
  });

  // Initialize command selectors
  const commandSelectors = document.querySelectorAll(".command-selector");
  for (const selector of commandSelectors) {
    const chainKey = selector.dataset.chainKey;
    const actionIndex = parseInt(selector.dataset.actionIndex, 10);
    const action = currentConfig.chains[chainKey].actions[actionIndex];

    // Use the extension ID that was set (either existing or default)
    const extensionId = action.extensionId || chrome.runtime.id;
    await populateCommandSelector(selector, extensionId);

    if (action.command) {
      selector.value = action.command;
    }
  }
}

// Render actions help
function renderActionsHelp() {
  const actionsHelp = document.querySelector(".actions-help");
  if (!actionsHelp) return;

  actionsHelp.innerHTML = Object.entries(ACTION_CATEGORIES)
    .map(([categoryId, actions]) => {
      const label = (ACTION_CATEGORY_LABELS[categoryId] && ACTION_CATEGORY_LABELS[categoryId]()) || categoryId;
      return `
      <div class="card mb-3">
        <div class="card-header">
          <h6 class="mb-0">${label}</h6>
        </div>
        <div class="card-body">
          <div class="row">
            ${actions
              .map(
                (action) => `
              <div class="col-md-6 col-lg-4 mb-2">
                <span class="badge bg-light text-dark">${(ACTION_NAMES[action] && ACTION_NAMES[action]()) || action}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

// Execute chain
async function executeChain(chainKey) {
  try {
    // The background reads the chain from storage — flush pending edits first
    await flushSaveConfig();
    await chrome.runtime.sendMessage({
      action: "executeChain",
      chainKey: chainKey,
    });
    showMessage(t("toast_chainExecuted", "执行动作链: $1").replace("$1", currentConfig.chains[chainKey].name));
  } catch (error) {
    console.error("Failed to execute chain:", error);
    showMessage(t("toast_executeFailed", "执行失败"), true);
  }
}

// Set default chain
async function setDefaultChain(chainKey) {
  currentConfig.defaultChain = chainKey;
  await saveConfig();
  renderMainView();
  showMessage(t("toast_defaultSet", "默认链已设置"));
}

// Add new chain
async function addNewChain() {
  const chainKey = `chain_${Date.now()}`;
  currentConfig.chains[chainKey] = {
    name: t("newChain_defaultName", "新动作链"),
    actions: [],
  };

  // 更新动作链顺序，将新链添加到开头
  if (!currentConfig.chainOrder) {
    currentConfig.chainOrder = [chainKey, ...Object.keys(currentConfig.chains).filter((k) => k !== chainKey)];
  } else {
    currentConfig.chainOrder = [chainKey, ...currentConfig.chainOrder];
  }

  await saveConfig();
  renderMainView();
  showMessage(t("toast_newChainAdded", "新链已添加"));

  // 自动进入编辑模式
  setTimeout(() => {
    editChain(chainKey);
  }, 100);
}

// Fill the template dropdown (re-run on locale change so names follow the language)
function populateTemplateMenu() {
  const templateMenu = document.getElementById("templateMenu");
  if (!templateMenu) return;
  templateMenu.innerHTML = CHAIN_TEMPLATES.map(
    (tpl) => `
    <li>
      <a class="dropdown-item" href="#" data-template-key="${tpl.key}">
        <i class="bi ${tpl.icon} me-2"></i>${t(tpl.nameKey, tpl.fallback)}
      </a>
    </li>
  `
  ).join("");
}

// Create a new chain from a built-in template and open it for editing
async function addChainFromTemplate(templateKey) {
  const template = CHAIN_TEMPLATES.find((tpl) => tpl.key === templateKey);
  if (!template) return;

  const chainKey = `chain_${Date.now()}`;
  currentConfig.chains[chainKey] = {
    name: t(template.nameKey, template.fallback),
    actions: template.build(),
  };

  if (!currentConfig.chainOrder) {
    currentConfig.chainOrder = Object.keys(currentConfig.chains);
  } else {
    currentConfig.chainOrder = [chainKey, ...currentConfig.chainOrder];
  }

  await saveConfig();
  renderMainView();
  showMessage(t("toast_newChainAdded", "新链已添加"));

  setTimeout(() => {
    editChain(chainKey);
  }, 100);
}

// Duplicate chain (deep copy, inserted right after the source)
async function duplicateChain(chainKey) {
  const source = currentConfig.chains[chainKey];
  if (!source) return;

  const newKey = `chain_${Date.now()}`;
  const copy = JSON.parse(JSON.stringify(source));
  copy.name = `${source.name} ${t("suffix_copy", "(副本)")}`;
  currentConfig.chains[newKey] = copy;

  if (!currentConfig.chainOrder) {
    currentConfig.chainOrder = Object.keys(currentConfig.chains);
  } else {
    const sourceIndex = currentConfig.chainOrder.indexOf(chainKey);
    if (sourceIndex >= 0) {
      currentConfig.chainOrder.splice(sourceIndex + 1, 0, newKey);
    } else {
      currentConfig.chainOrder.push(newKey);
    }
  }

  await saveConfig();
  renderMainView();
  setTimeout(() => initializeSortableDragDrop(), 100);
  showMessage(t("toast_chainDuplicated", "动作链已复制"));
}

// Export the full configuration as a downloadable JSON file
function exportConfig() {
  try {
    const data = JSON.stringify(currentConfig, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hotkey-chain-config-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage(t("toast_configExported", "配置已导出"));
  } catch (error) {
    console.error("Failed to export config:", error);
    showMessage(t("toast_executeFailed", "执行失败"), true);
  }
}

// Export a single chain as a shareable JSON file
function exportSingleChain(chainKey) {
  const chain = currentConfig.chains[chainKey];
  if (!chain) return;
  try {
    const payload = { type: "hotkey-chain", version: 1, chain: JSON.parse(JSON.stringify(chain)) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = (chain.name || "chain").replace(/[\\/:*?"<>|]/g, "_").slice(0, 50);
    link.download = `hotkey-chain-${safeName}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage(t("toast_chainExported", "已导出动作链"));
  } catch (error) {
    console.error("Failed to export chain:", error);
    showMessage(t("toast_executeFailed", "执行失败"), true);
  }
}

// A valid action list is an array of objects that each carry a string `type`.
// Imported files are untrusted: a null/garbage element would later crash
// renderMainView() (which dereferences action.type), leaving a blank page.
function isValidActionList(actions) {
  return Array.isArray(actions) && actions.every((a) => a && typeof a === "object" && typeof a.type === "string");
}

// Add a single shared chain (from exportSingleChain or a bare {name, actions} object)
async function importSingleChain(chainData) {
  if (!chainData || typeof chainData.name !== "string" || !isValidActionList(chainData.actions)) {
    throw new Error(t("error_invalidConfigFile", "无效的配置文件"));
  }
  const chainKey = `chain_${Date.now()}`;
  currentConfig.chains[chainKey] = JSON.parse(JSON.stringify(chainData));
  if (!currentConfig.chainOrder) {
    currentConfig.chainOrder = Object.keys(currentConfig.chains);
  } else {
    currentConfig.chainOrder = [chainKey, ...currentConfig.chainOrder];
  }
  await saveConfig();
  renderMainView();
  setTimeout(() => initializeSortableDragDrop(), 100);
  showMessage(t("toast_chainImported", "已导入动作链: $1").replace("$1", chainData.name));
}

// Import configuration from a JSON file (replaces the current configuration)
async function importConfig(file) {
  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    // Single-chain share file? Confirm then append.
    if (imported && imported.type === "hotkey-chain" && imported.chain) {
      const chainName = imported.chain && typeof imported.chain.name === "string" ? imported.chain.name : "?";
      if (!confirm(t("confirm_importChain", `导入动作链「${chainName}」？`).replace("$1", chainName))) return;
      await importSingleChain(imported.chain);
      return;
    }
    if (imported && !imported.chains && typeof imported.name === "string" && Array.isArray(imported.actions)) {
      if (!confirm(t("confirm_importChain", `导入动作链「${imported.name}」？`).replace("$1", imported.name))) return;
      await importSingleChain(imported);
      return;
    }

    // Minimal shape validation before replacing anything
    if (!imported || typeof imported !== "object" || !imported.chains || typeof imported.chains !== "object" || Object.keys(imported.chains).length === 0) {
      throw new Error(t("error_invalidConfigFile", "无效的配置文件"));
    }
    for (const [key, chain] of Object.entries(imported.chains)) {
      // Chain keys are interpolated unescaped into data-chain-key="..." during render.
      // Every key this extension generates is "chain_<digits>"; reject anything outside
      // [A-Za-z0-9_-] so a crafted import can't break out of the attribute and inject
      // HTML/JS into the (privileged) options page.
      if (!/^[\w-]+$/.test(key) || !chain || typeof chain.name !== "string" || !isValidActionList(chain.actions)) {
        throw new Error(t("error_invalidConfigFile", "无效的配置文件") + `: ${key}`);
      }
    }

    const confirmed = confirm(t("confirm_importOverwrite", "导入将替换当前全部配置，是否继续？"));
    if (!confirmed) return;

    // Normalize derived fields so the rest of the UI can rely on them
    if (!Array.isArray(imported.chainOrder)) {
      imported.chainOrder = Object.keys(imported.chains);
    }
    imported.chainOrder = imported.chainOrder.filter((key) => imported.chains[key]);
    Object.keys(imported.chains).forEach((key) => {
      if (!imported.chainOrder.includes(key)) imported.chainOrder.push(key);
    });
    if (!imported.defaultChain || !imported.chains[imported.defaultChain]) {
      imported.defaultChain = imported.chainOrder[0];
    }

    currentConfig = imported;
    await saveConfig();
    renderMainView();
    setTimeout(() => initializeSortableDragDrop(), 100);
    showMessage(t("toast_configImported", "配置已导入"));
  } catch (error) {
    console.error("Failed to import config:", error);
    showMessage(t("toast_importFailed", "导入失败: $1").replace("$1", error.message), true);
  }
}

// Restore the built-in default action chains (replaces the entire config)
async function restoreDefaults() {
  const confirmed = confirm(t("confirm_restoreDefaults", "恢复默认动作链将替换当前全部动作链，确定继续？"));
  if (!confirmed) return;
  try {
    const response = await chrome.runtime.sendMessage({ action: "resetToDefaults" });
    if (!response || response.success === false) {
      throw new Error((response && response.error) || "unknown error");
    }
    currentConfig = response.config;
    if (!currentConfig.chainOrder) currentConfig.chainOrder = Object.keys(currentConfig.chains);
    showMainView(); // re-renders the grid and re-inits drag-and-drop
    showMessage(t("toast_defaultsRestored", "已恢复默认动作链"));
  } catch (error) {
    console.error("Failed to restore defaults:", error);
    showMessage(t("toast_restoreDefaultsFailed", "恢复默认失败"), true);
  }
}

// Delete chain
async function deleteChain(chainKey) {
  if (Object.keys(currentConfig.chains).length <= 1) {
    showMessage(t("toast_atLeastOne", "至少需要保留一个动作链"), true);
    return;
  }

  const chainName = currentConfig.chains[chainKey]?.name || t("label_unknownChain", "未知动作链");

  // 显示确认对话框
  const confirmed = confirm(`${t("card_delete", "删除")} "${chainName}"?\n\n`);
  if (!confirmed) {
    return;
  }

  delete currentConfig.chains[chainKey];

  // 从动作链顺序中移除
  if (currentConfig.chainOrder) {
    currentConfig.chainOrder = currentConfig.chainOrder.filter((key) => key !== chainKey);
  }

  // If deleted chain was default, set first chain as default
  if (currentConfig.defaultChain === chainKey) {
    const remainingChains = currentConfig.chainOrder || Object.keys(currentConfig.chains);
    currentConfig.defaultChain = remainingChains[0];
  }

  await saveConfig();
  renderMainView();
  showMessage(t("card_delete", "删除"));
}

// Update chain name
async function updateChainName(chainKey, newName) {
  currentConfig.chains[chainKey].name = newName;
  await saveConfig();

  // Update edit view title if in edit mode
  const editView = document.getElementById("edit-view");
  if (editView.style.display !== "none") {
    const editTitle = document.getElementById("editChainTitle");
    editTitle.textContent = `${t("edit_title", "编辑动作链")}: ${newName}`;
  }
}

// Update chain description
async function updateChainDescription(chainKey, newDescription) {
  currentConfig.chains[chainKey].description = newDescription;
  await saveConfig();
}

// Add action to chain
async function addAction(chainKey) {
  currentConfig.chains[chainKey].actions.push({
    type: ACTION_TYPES.SCROLL_TO_TOP,
    delay: 200,
  });

  await saveConfig();

  // Re-render the entire chain edit view to immediately show the new action
  if (editingChainId === chainKey) {
    renderChainEdit(chainKey);
  }

  showMessage(t("actions_add", "添加动作"));
}

// Remove action from chain
async function removeAction(chainKey, actionIndex) {
  currentConfig.chains[chainKey].actions.splice(actionIndex, 1);
  await saveConfig();

  // Re-render the entire chain edit view to immediately show the changes
  if (editingChainId === chainKey) {
    renderChainEdit(chainKey);
  }

  showMessage(t("card_delete", "删除"));
}

// Update action type
async function updateActionType(chainKey, actionIndex, newType) {
  const action = currentConfig.chains[chainKey].actions[actionIndex];
  action.type = newType;

  // If switching to CALL_EXTENSION, initialize extension fields
  if (newType === ACTION_TYPES.CALL_EXTENSION) {
    if (!action.extensionId) action.extensionId = "";
    if (!action.message) action.message = {};
  }

  // If switching to EXECUTE_COMMAND, initialize command fields
  if (newType === ACTION_TYPES.EXECUTE_COMMAND) {
    if (!action.command) action.command = "";
    if (!action.extensionId) action.extensionId = chrome.runtime.id; // 默认为当前扩展
  }

  // If switching to OPEN_URL, initialize the url field
  if (newType === ACTION_TYPES.OPEN_URL) {
    if (!action.url) action.url = "";
  }

  // If switching to SHOW_NOTIFICATION, initialize the text field
  if (newType === ACTION_TYPES.SHOW_NOTIFICATION) {
    if (!action.text) action.text = "";
  }

  // If switching to OPEN_BROWSER_PAGE, initialize the page field
  if (newType === ACTION_TYPES.OPEN_BROWSER_PAGE) {
    if (!action.page) action.page = "downloads";
  }

  // If switching to IF_URL_MATCHES, initialize the pattern field
  if (newType === ACTION_TYPES.IF_URL_MATCHES) {
    if (!action.pattern) action.pattern = "";
  }

  // If switching to RUN_CHAIN, initialize the target chain field
  if (newType === ACTION_TYPES.RUN_CHAIN) {
    if (!action.chainKey) action.chainKey = "";
  }

  await saveConfig();

  // Re-render the entire chain edit view to immediately show the changes
  if (editingChainId === chainKey) {
    renderChainEdit(chainKey);
  }
}

// Update action delay
async function updateActionDelay(chainKey, actionIndex, newDelay) {
  currentConfig.chains[chainKey].actions[actionIndex].delay = parseInt(newDelay, 10) || 0;
  await saveConfig();
}

// Update the target URL of an open_url action
function updateActionUrl(chainKey, actionIndex, url) {
  currentConfig.chains[chainKey].actions[actionIndex].url = url;
  saveConfig();
}

// Update extension ID
function updateExtensionId(chainKey, actionIndex, extensionId) {
  const action = currentConfig.chains[chainKey].actions[actionIndex];
  action.extensionId = extensionId;
  saveConfig();
}

// Update extension message
function updateExtensionMessage(chainKey, actionIndex, messageString) {
  const action = currentConfig.chains[chainKey].actions[actionIndex];
  try {
    // Try to parse as JSON, fallback to string
    action.message = messageString ? JSON.parse(messageString) : {};
  } catch (error) {
    // If not valid JSON, treat as string
    action.message = messageString;
  }
  saveConfig();
}

// Handle extension selection
async function handleExtensionSelection(chainKey, actionIndex, selectedValue) {
  const action = currentConfig.chains[chainKey].actions[actionIndex];

  if (selectedValue === "manual") {
    action.extensionId = "";
    // Show manual input, hide action selector
    const container = document.querySelector(`[data-chain-key="${chainKey}"][data-action-index="${actionIndex}"]`).closest(".action-config");
    const idRow = container.querySelector(".extension-id-row");
    const actionRow = container.querySelector(".extension-action-row");
    if (idRow) idRow.style.display = "block";
    if (actionRow) actionRow.style.display = "none";
  } else if (selectedValue && selectedValue !== "") {
    action.extensionId = selectedValue;
    // Hide manual input, show action selector
    const container = document.querySelector(`[data-chain-key="${chainKey}"][data-action-index="${actionIndex}"]`).closest(".action-config");
    const idRow = container.querySelector(".extension-id-row");
    const actionRow = container.querySelector(".extension-action-row");
    const actionSelector = container.querySelector(".extension-action-selector");

    if (idRow) idRow.style.display = "none";
    if (actionRow) actionRow.style.display = "block";

    // Populate action selector with templates
    if (actionSelector) {
      populateActionSelector(actionSelector, selectedValue);
    }
  } else {
    // Show manual input when no selection
    const container = document.querySelector(`[data-chain-key="${chainKey}"][data-action-index="${actionIndex}"]`).closest(".action-config");
    const idRow = container.querySelector(".extension-id-row");
    const actionRow = container.querySelector(".extension-action-row");
    if (idRow) idRow.style.display = "block";
    if (actionRow) actionRow.style.display = "none";
  }

  await saveConfig();
}

// Handle extension action selection
async function handleExtensionActionSelection(chainKey, actionIndex, selectedValue) {
  const action = currentConfig.chains[chainKey].actions[actionIndex];
  // Mirror populateActionSelector's fallback: extensions without a bespoke
  // template show the generic presets, so resolve them the same way here —
  // otherwise selecting a generic preset would silently set no message.
  const template = EXTENSION_TEMPLATES[action.extensionId] || EXTENSION_TEMPLATES["generic"];

  if (selectedValue === "custom") {
    // User wants to customize, don't auto-fill
    return;
  }

  if (template && template.actions) {
    const selectedAction = template.actions.find((a) => a.nameKey === selectedValue);
    if (selectedAction) {
      action.message = selectedAction.message;
      // Update the message textarea
      const container = document.querySelector(`[data-chain-key="${chainKey}"][data-action-index="${actionIndex}"]`).closest(".action-config");
      const messageInput = container.querySelector(".extension-message-input");
      if (messageInput) {
        messageInput.value = JSON.stringify(selectedAction.message, null, 2);
      }
    }
  }

  await saveConfig();
}

// Handle command selection
async function handleCommandSelection(chainKey, actionIndex, selectedCommand) {
  const action = currentConfig.chains[chainKey].actions[actionIndex];
  action.command = selectedCommand;
  await saveConfig();
}

// Handle command extension selection
async function handleCommandExtensionSelection(chainKey, actionIndex, selectedExtensionId) {
  const action = currentConfig.chains[chainKey].actions[actionIndex];
  action.extensionId = selectedExtensionId;

  // Populate command selector
  const container = document.querySelector(`[data-chain-key="${chainKey}"][data-action-index="${actionIndex}"]`).closest(".action-config");
  const commandSelector = container.querySelector(".command-selector");

  if (commandSelector) {
    await populateCommandSelector(commandSelector, selectedExtensionId);
  }

  await saveConfig();
}

// Populate command selector with available commands
async function populateCommandSelector(selector, extensionId) {
  // Clear existing options except the first one
  while (selector.children.length > 1) {
    selector.removeChild(selector.lastChild);
  }

  // 如果缓存中没有该扩展的命令，尝试动态加载
  if (!extensionCommandsCache[extensionId]) {
    try {
      const commands = await chrome.runtime.sendMessage({
        action: "getExtensionCommands",
        extensionId: extensionId,
      });
      if (commands && commands.length > 0) {
        extensionCommandsCache[extensionId] = {
          name: extensionId === chrome.runtime.id ? t("extName", "Hotkey Chain") : "Unknown",
          commands: commands,
        };
      }
    } catch (error) {
      console.error("Failed to load commands for extension:", extensionId, error);
    }
  }

  const template = extensionCommandsCache[extensionId];
  if (template && template.commands) {
    template.commands.forEach((cmd) => {
      const option = document.createElement("option");
      option.value = cmd.command;
      // Avoid "Name - Name" when the secondary text is identical (e.g. an
      // unbound chain slot whose label is already the slot name).
      option.textContent = cmd.description && cmd.description !== cmd.name ? `${cmd.name} - ${cmd.description}` : cmd.name;
      if (cmd.shortcut) {
        option.textContent += ` (${cmd.shortcut})`;
      }
      selector.appendChild(option);
    });
  }
}

// Populate action selector with extension templates
function populateActionSelector(selector, extensionId) {
  const template = EXTENSION_TEMPLATES[extensionId] || EXTENSION_TEMPLATES["generic"];

  // Clear existing options except first two
  while (selector.children.length > 2) {
    selector.removeChild(selector.lastChild);
  }

  // Add template actions (stable nameKey as value, localized label as text)
  template.actions.forEach((action) => {
    const option = document.createElement("option");
    option.value = action.nameKey;
    option.textContent = t(action.nameKey, action.nameKey);
    selector.appendChild(option);
  });
}

// Refresh extensions list
async function refreshExtensionsList(chainKey, actionIndex) {
  try {
    const extensions = await chrome.runtime.sendMessage({ action: "getInstalledExtensions" });
    const container = document.querySelector(`[data-chain-key="${chainKey}"][data-action-index="${actionIndex}"]`).closest(".action-config");
    const selector = container.querySelector(".extension-selector");

    if (selector) {
      // Store current selection
      const currentValue = selector.value;

      // Clear existing extension options (keep first two: placeholder and manual)
      while (selector.children.length > 2) {
        selector.removeChild(selector.lastChild);
      }

      // Add installed extensions
      extensions.forEach((ext) => {
        const option = document.createElement("option");
        option.value = ext.id;
        option.textContent = `${ext.name} (${ext.version})`;
        selector.appendChild(option);
      });

      // Restore selection if still valid
      if (currentValue && [...selector.options].some((opt) => opt.value === currentValue)) {
        selector.value = currentValue;
      }

      showMessage(t("toast_extensionsRefreshed", "已刷新 $1 个扩展").replace("$1", extensions.length));
    }
  } catch (error) {
    console.error("Failed to refresh extensions:", error);
    showMessage(t("toast_refreshExtensionsFailed", "刷新扩展列表失败"), true);
  }
}

// Refresh commands list for a specific action
async function refreshCommandsList(chainKey, actionIndex) {
  try {
    const action = currentConfig.chains[chainKey].actions[actionIndex];
    const extensionId = action.extensionId;

    if (!extensionId) {
      showMessage(t("toast_selectExtensionFirst", "请先选择扩展"), true);
      return;
    }

    // 清除该扩展的缓存命令
    delete extensionCommandsCache[extensionId];

    // 重新加载命令
    const container = document.querySelector(`[data-chain-key="${chainKey}"][data-action-index="${actionIndex}"]`).closest(".action-config");
    const commandSelector = container.querySelector(".command-selector");

    if (commandSelector) {
      // 保存当前选择
      const currentValue = commandSelector.value;

      // 重新填充命令
      await populateCommandSelector(commandSelector, extensionId);

      // 尝试恢复选择
      if (currentValue && [...commandSelector.options].some((opt) => opt.value === currentValue)) {
        commandSelector.value = currentValue;
      }
    }

    showMessage(t("toast_commandsRefreshed", "已刷新命令列表"));
  } catch (error) {
    console.error("Failed to refresh commands:", error);
    showMessage(t("toast_refreshCommandsFailed", "刷新命令列表失败"), true);
  }
}

// Show message using Bootstrap Toast
function showMessage(text, isError = false) {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
    toastContainer.style.zIndex = "1055";
    document.body.appendChild(toastContainer);
  }

  // Create toast
  const toastId = "toast-" + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center ${isError ? "text-bg-danger" : "text-bg-success"} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${isError ? "bi-exclamation-triangle" : "bi-check-circle"} me-2"></i>
          ${escapeHtmlAttr(text)}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHtml);

  // Initialize and show toast
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, {
    delay: 3000,
  });

  toast.show();

  // Remove toast element after it's hidden
  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
}

// 使用 Sortable.js 实现拖拽排序
const SORTABLE_OPTIONS = {
  animation: 150,
  ghostClass: "sortable-ghost",
  chosenClass: "sortable-chosen",
  dragClass: "sortable-drag",
  handle: ".drag-handle",
};

// 在元素上创建 Sortable，若已存在实例先销毁，避免重复初始化导致的句柄堆叠
function createSortable(element, onEnd) {
  if (!element || !window.Sortable) return;
  const existing = Sortable.get(element);
  if (existing) existing.destroy();
  new Sortable(element, { ...SORTABLE_OPTIONS, onEnd });
}

function initializeSortableDragDrop() {
  // 主页面 - 动作链网格拖拽排序
  createSortable(document.getElementById("chains-container"), () => updateChainOrderFromSort());

  // 编辑界面 - 动作拖拽排序
  if (editingChainId) {
    createSortable(document.getElementById("chainEditConfig"), () => updateActionOrderFromSort(editingChainId));
  }
}

// 更新动作链顺序（主页面网格）
async function updateChainOrderFromSort() {
  const chainCards = document.querySelectorAll("#chains-container .chain-card");

  // 提取新的顺序
  const newOrder = [];
  chainCards.forEach((card) => {
    const chainKey = card.dataset.chainKey;
    newOrder.push(chainKey);
  });

  // 保存新的顺序
  currentConfig.chainOrder = newOrder;
  await saveConfig();
}

// 更新动作顺序（配置页面）
async function updateActionOrderFromSort(chainKey) {
  const actionItems = document.querySelectorAll(`#chainEditConfig .action-config`);
  const newActions = [];

  actionItems.forEach((item) => {
    const actionIndex = parseInt(item.dataset.actionIndex);
    if (currentConfig.chains[chainKey].actions[actionIndex]) {
      newActions.push(currentConfig.chains[chainKey].actions[actionIndex]);
    }
  });

  currentConfig.chains[chainKey].actions = newActions;
  await saveConfig();

  // 重新渲染编辑界面以更新索引
  if (editingChainId === chainKey) {
    renderChainEdit(chainKey);
  }
}
