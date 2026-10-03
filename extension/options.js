// Options page JavaScript for Hotkey Chain Extension

// Global variables
let currentConfig = {};
let editingChainId = null;
let userLocale = null; // 'auto' or any _locales/<code> (en, zh_CN, ja, ar, …)
let i18nCache = {}; // options page override cache
let currentActionPickerCategory = "all";
let actionPickerSearchQuery = "";
let actionPickerTargetChainKey = null;

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
  COPY_TEXT: "copy_text",
  WAIT: "wait",
  SCROLL_PAGE_UP: "scroll_page_up",
  SCROLL_PAGE_DOWN: "scroll_page_down",
  CLOSE_TABS_RIGHT: "close_tabs_right",
  CLOSE_WINDOW: "close_window",
  TOGGLE_DARK_MODE: "toggle_dark_mode",
  TRANSLATE_PAGE: "translate_page",
  MEDIA_PLAY_PAUSE: "media_play_pause",
  MEDIA_PLAY: "media_play",
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
  CONFIRM: "confirm",
  RUN_CHAIN: "run_chain",
  // Chrome open APIs & tools
  OPEN_SIDE_PANEL: "open_side_panel",
  AI_SUMMARIZE: "ai_summarize",
  AI_EXPLAIN: "ai_explain",
  AI_TRANSLATE: "ai_translate",
  DISCARD_CURRENT_TAB: "discard_current_tab",
  DUPLICATE_TAB_TO_NEW_WINDOW: "duplicate_tab_to_new_window",
  COLLAPSE_ALL_GROUPS: "collapse_all_groups",
  EXPAND_ALL_GROUPS: "expand_all_groups",
  CLOSE_OTHER_WINDOWS: "close_other_windows",
  OPEN_OPTIONS_PAGE: "open_options_page",
  OPEN_SHORTCUTS_PAGE: "open_shortcuts_page",
  RELOAD_EXTENSION: "reload_extension",
  OPEN_ACTION_POPUP: "open_action_popup",
  CLEAR_COOKIES: "clear_cookies",
  CLEAR_DOWNLOADS_HISTORY: "clear_downloads_history",
  SPEAK_TEXT: "speak_text",
  TOGGLE_DESIGN_MODE: "toggle_design_mode",
  COPY_PAGE_HTML: "copy_page_html",
  EXTRACT_ALL_LINKS: "extract_all_links",
  EXTRACT_ALL_IMAGES: "extract_all_images",
  TOGGLE_SITE_JAVASCRIPT: "toggle_site_javascript",
  TOGGLE_SITE_IMAGES: "toggle_site_images",
  TOGGLE_SITE_POPUPS: "toggle_site_popups",
  OPEN_TOP_SITES: "open_top_sites",
  WAIT_FOR_NAVIGATION: "wait_for_navigation",
};

// Built-in browser pages selectable for the open_browser_page action
const BROWSER_PAGE_OPTIONS = ["downloads", "history", "bookmarks", "extensions", "settings", "shortcuts", "clear_browsing_data"];

// Supported languages for AI and TTS configuration
const SUPPORTED_LANGUAGES = [
  { code: "auto", labelKey: "opt_lang_auto", defaultLabel: "跟随系统 / 界面语言" },
  { code: "zh_CN", name: "简体中文" },
  { code: "zh_TW", name: "繁體中文" },
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "pt_BR", name: "Português (Brasil)" },
  { code: "ru", name: "Русский" },
  { code: "it", name: "Italiano" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "tr", name: "Türkçe" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "th", name: "ไทย" },
  { code: "pl", name: "Polski" },
];

function generateLanguageOptions(selectedCode = "auto") {
  return SUPPORTED_LANGUAGES.map((lang) => {
    const label = lang.labelKey ? t(lang.labelKey, lang.defaultLabel) : (lang.name || lang.defaultLabel || lang.code);
    const isSelected = (selectedCode || "auto") === lang.code ? "selected" : "";
    return `<option value="${lang.code}" ${isSelected}>${escapeHtmlAttr(label)}</option>`;
  }).join("");
}

// Action display names (i18n)
const ACTION_NAMES = {
  [ACTION_TYPES.SCROLL_TO_TOP]: () => t("actionName_scroll_to_top", "滚动到顶部"),
  [ACTION_TYPES.SCROLL_TO_BOTTOM]: () => t("actionName_scroll_to_bottom", "滚动到底部"),
  [ACTION_TYPES.RELOAD_PAGE]: () => t("actionName_reload_page", "刷新页面"),
  [ACTION_TYPES.CLOSE_TAB]: () => t("actionName_close_tab", "关闭标签页"),
  [ACTION_TYPES.NEW_TAB]: () => t("actionName_new_tab", "新标签页"),
  [ACTION_TYPES.COPY_URL]: () => t("actionName_copy_url", "复制网址"),
  [ACTION_TYPES.COPY_TITLE]: () => t("actionName_copy_title", "复制标题"),
  [ACTION_TYPES.FULLSCREEN]: () => t("actionName_toggle_fullscreen", "全屏切换"),
  [ACTION_TYPES.ZOOM_IN]: () => t("actionName_zoom_in", "放大"),
  [ACTION_TYPES.ZOOM_OUT]: () => t("actionName_zoom_out", "缩小"),
  [ACTION_TYPES.ZOOM_RESET]: () => t("actionName_zoom_reset", "重置缩放"),
  [ACTION_TYPES.BACK]: () => t("actionName_go_back", "后退"),
  [ACTION_TYPES.FORWARD]: () => t("actionName_go_forward", "前进"),
  [ACTION_TYPES.BOOKMARK]: () => t("actionName_bookmark_page", "添加书签"),
  [ACTION_TYPES.COPY_AS_MARKDOWN]: () => t("actionName_copy_as_markdown", "复制为 Markdown 链接"),
  [ACTION_TYPES.COPY_TEXT]: () => t("actionName_copy_text", "按格式复制文字"),
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
  [ACTION_TYPES.MEDIA_PLAY]: () => t("actionName_media_play", "播放媒体（不暂停）"),
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
  [ACTION_TYPES.CONFIRM]: () => t("actionName_confirm", "询问确认后继续"),
  [ACTION_TYPES.RUN_CHAIN]: () => t("actionName_run_chain", "运行另一条动作链"),
  [ACTION_TYPES.OPEN_SIDE_PANEL]: () => t("actionName_open_side_panel", "打开侧边栏"),
  [ACTION_TYPES.AI_SUMMARIZE]: () => t("actionName_ai_summarize", "AI 总结内容"),
  [ACTION_TYPES.AI_EXPLAIN]: () => t("actionName_ai_explain", "AI 解释选中内容"),
  [ACTION_TYPES.AI_TRANSLATE]: () => t("actionName_ai_translate", "AI 翻译选中内容"),
  [ACTION_TYPES.DISCARD_CURRENT_TAB]: () => t("actionName_discard_current_tab", "休眠当前标签页（释放内存）"),
  [ACTION_TYPES.DUPLICATE_TAB_TO_NEW_WINDOW]: () => t("actionName_duplicate_tab_to_new_window", "在新窗口中复制标签页"),
  [ACTION_TYPES.COLLAPSE_ALL_GROUPS]: () => t("actionName_collapse_all_groups", "折叠所有标签分组"),
  [ACTION_TYPES.EXPAND_ALL_GROUPS]: () => t("actionName_expand_all_groups", "展开所有标签分组"),
  [ACTION_TYPES.CLOSE_OTHER_WINDOWS]: () => t("actionName_close_other_windows", "关闭其他窗口"),
  [ACTION_TYPES.OPEN_OPTIONS_PAGE]: () => t("actionName_open_options_page", "打开扩展设置页"),
  [ACTION_TYPES.OPEN_SHORTCUTS_PAGE]: () => t("actionName_open_shortcuts_page", "打开快捷键管理"),
  [ACTION_TYPES.RELOAD_EXTENSION]: () => t("actionName_reload_extension", "重新加载扩展"),
  [ACTION_TYPES.OPEN_ACTION_POPUP]: () => t("actionName_open_action_popup", "打开扩展弹窗"),
  [ACTION_TYPES.CLEAR_COOKIES]: () => t("actionName_clear_cookies", "清除所有 Cookie"),
  [ACTION_TYPES.CLEAR_DOWNLOADS_HISTORY]: () => t("actionName_clear_downloads_history", "清除下载记录"),
  [ACTION_TYPES.SPEAK_TEXT]: () => t("actionName_speak_text", "朗读指定文本"),
  [ACTION_TYPES.TOGGLE_DESIGN_MODE]: () => t("actionName_toggle_design_mode", "页面实时编辑开/关"),
  [ACTION_TYPES.COPY_PAGE_HTML]: () => t("actionName_copy_page_html", "复制页面 HTML 源码"),
  [ACTION_TYPES.EXTRACT_ALL_LINKS]: () => t("actionName_extract_all_links", "提取页面所有链接"),
  [ACTION_TYPES.EXTRACT_ALL_IMAGES]: () => t("actionName_extract_all_images", "提取页面所有图片链接"),
  [ACTION_TYPES.TOGGLE_SITE_JAVASCRIPT]: () => t("actionName_toggle_site_javascript", "当前站点 JavaScript 开/关"),
  [ACTION_TYPES.TOGGLE_SITE_IMAGES]: () => t("actionName_toggle_site_images", "当前站点图片加载开/关"),
  [ACTION_TYPES.TOGGLE_SITE_POPUPS]: () => t("actionName_toggle_site_popups", "当前站点弹窗拦截开/关"),
  [ACTION_TYPES.OPEN_TOP_SITES]: () => t("actionName_open_top_sites", "打开常用工作台站点"),
  [ACTION_TYPES.WAIT_FOR_NAVIGATION]: () => t("actionName_wait_for_navigation", "等待页面加载/导航完成"),
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
  flow: [ACTION_TYPES.IF_URL_MATCHES, ACTION_TYPES.IF_HAS_SELECTION, ACTION_TYPES.CONFIRM, ACTION_TYPES.RUN_CHAIN, ACTION_TYPES.WAIT, ACTION_TYPES.WAIT_FOR_NAVIGATION],
  page_ops: [
    ACTION_TYPES.SCROLL_TO_TOP,
    ACTION_TYPES.SCROLL_TO_BOTTOM,
    ACTION_TYPES.SCROLL_PAGE_UP,
    ACTION_TYPES.SCROLL_PAGE_DOWN,
    ACTION_TYPES.RELOAD_PAGE,
    ACTION_TYPES.FULLSCREEN,
    ACTION_TYPES.TOGGLE_DARK_MODE,
    ACTION_TYPES.TOGGLE_DESIGN_MODE,
    ACTION_TYPES.TOGGLE_SITE_JAVASCRIPT,
    ACTION_TYPES.TOGGLE_SITE_IMAGES,
    ACTION_TYPES.TOGGLE_SITE_POPUPS,
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
    ACTION_TYPES.COLLAPSE_ALL_GROUPS,
    ACTION_TYPES.EXPAND_ALL_GROUPS,
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
    ACTION_TYPES.DISCARD_CURRENT_TAB,
    ACTION_TYPES.DISCARD_OTHER_TABS,
    ACTION_TYPES.GOTO_AUDIBLE_TAB,
    ACTION_TYPES.BOOKMARK_ALL_TABS,
    ACTION_TYPES.OPEN_TOP_SITES,
  ],
  window_mgmt: [
    ACTION_TYPES.NEW_WINDOW,
    ACTION_TYPES.CLOSE_WINDOW,
    ACTION_TYPES.CLOSE_OTHER_WINDOWS,
    ACTION_TYPES.MINIMIZE_WINDOW,
    ACTION_TYPES.MAXIMIZE_WINDOW,
    ACTION_TYPES.OPEN_INCOGNITO_WINDOW,
    ACTION_TYPES.OPEN_SIDE_PANEL,
    ACTION_TYPES.MOVE_TAB_TO_NEW_WINDOW,
    ACTION_TYPES.DUPLICATE_TAB_TO_NEW_WINDOW,
  ],
  zoom: [ACTION_TYPES.ZOOM_IN, ACTION_TYPES.ZOOM_OUT, ACTION_TYPES.ZOOM_RESET],
  media: [ACTION_TYPES.MEDIA_PLAY_PAUSE, ACTION_TYPES.MEDIA_PLAY, ACTION_TYPES.MEDIA_SPEED_UP, ACTION_TYPES.MEDIA_SPEED_DOWN, ACTION_TYPES.MEDIA_SPEED_RESET, ACTION_TYPES.SPEAK_SELECTION, ACTION_TYPES.STOP_SPEAKING, ACTION_TYPES.SPEAK_TEXT],
  content: [
    ACTION_TYPES.COPY_URL,
    ACTION_TYPES.COPY_TITLE,
    ACTION_TYPES.COPY_AS_MARKDOWN,
    ACTION_TYPES.COPY_PAGE_HTML,
    ACTION_TYPES.COPY_TEXT,
    ACTION_TYPES.COPY_SELECTED_TEXT,
    ACTION_TYPES.SEARCH_SELECTION,
    ACTION_TYPES.BOOKMARK,
    ACTION_TYPES.READ_LATER,
    ACTION_TYPES.AI_SUMMARIZE,
    ACTION_TYPES.AI_EXPLAIN,
    ACTION_TYPES.AI_TRANSLATE,
    ACTION_TYPES.EXTRACT_ALL_LINKS,
    ACTION_TYPES.EXTRACT_ALL_IMAGES,
  ],
  advanced: [
    ACTION_TYPES.CLEAR_CACHE,
    ACTION_TYPES.CAPTURE_SCREENSHOT,
    ACTION_TYPES.SAVE_PAGE_MHTML,
    ACTION_TYPES.SHOW_NOTIFICATION,
    ACTION_TYPES.OPEN_BROWSER_PAGE,
    ACTION_TYPES.SHOW_DOWNLOADS_FOLDER,
    ACTION_TYPES.CLEAR_BROWSING_CACHE,
    ACTION_TYPES.CLEAR_SITE_DATA,
    ACTION_TYPES.CLEAR_COOKIES,
    ACTION_TYPES.CLEAR_DOWNLOADS_HISTORY,
    ACTION_TYPES.DELETE_URL_FROM_HISTORY,
    ACTION_TYPES.TOGGLE_KEEP_AWAKE,
    ACTION_TYPES.OPEN_OPTIONS_PAGE,
    ACTION_TYPES.OPEN_SHORTCUTS_PAGE,
    ACTION_TYPES.RELOAD_EXTENSION,
    ACTION_TYPES.OPEN_ACTION_POPUP,
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
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 014.9.6c0 1.6-2.4 2-2.4 3.4"/><path d="M12 17.2h.01"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
  sidebar: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>',
  sparkle: '<path d="M12 3l1.9 5.8a2 2 0 001.3 1.3L21 12l-5.8 1.9a2 2 0 00-1.3 1.3L12 21l-1.9-5.8a2 2 0 00-1.3-1.3L3 12l5.8-1.9a2 2 0 001.3-1.3L12 3z"/>',
  edit: '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  codeDoc: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13l-2 2 2 2"/><path d="M14 13l2 2-2 2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  cookie: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="10" r="1"/><circle cx="11" cy="15" r="1.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>',
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
  [ACTION_TYPES.MEDIA_PLAY]: "play",
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
  [ACTION_TYPES.CONFIRM]: "help",
  [ACTION_TYPES.COPY_TEXT]: "clipboard",
  [ACTION_TYPES.RUN_CHAIN]: "link",
  [ACTION_TYPES.WAIT]: "clock",
  [ACTION_TYPES.EXECUTE_COMMAND]: "command",
  [ACTION_TYPES.CALL_EXTENSION]: "puzzle",
  [ACTION_TYPES.OPEN_SIDE_PANEL]: "sidebar",
  [ACTION_TYPES.AI_SUMMARIZE]: "sparkle",
  [ACTION_TYPES.AI_EXPLAIN]: "sparkle",
  [ACTION_TYPES.AI_TRANSLATE]: "globe",
  [ACTION_TYPES.DISCARD_CURRENT_TAB]: "moon",
  [ACTION_TYPES.DUPLICATE_TAB_TO_NEW_WINDOW]: "window",
  [ACTION_TYPES.COLLAPSE_ALL_GROUPS]: "chevUp",
  [ACTION_TYPES.EXPAND_ALL_GROUPS]: "chevDown",
  [ACTION_TYPES.CLOSE_OTHER_WINDOWS]: "xCircle",
  [ACTION_TYPES.OPEN_OPTIONS_PAGE]: "settings",
  [ACTION_TYPES.OPEN_SHORTCUTS_PAGE]: "command",
  [ACTION_TYPES.RELOAD_EXTENSION]: "refresh",
  [ACTION_TYPES.OPEN_ACTION_POPUP]: "external",
  [ACTION_TYPES.CLEAR_COOKIES]: "cookie",
  [ACTION_TYPES.CLEAR_DOWNLOADS_HISTORY]: "trash",
  [ACTION_TYPES.SPEAK_TEXT]: "speak",
  [ACTION_TYPES.TOGGLE_DESIGN_MODE]: "edit",
  [ACTION_TYPES.COPY_PAGE_HTML]: "codeDoc",
  [ACTION_TYPES.EXTRACT_ALL_LINKS]: "link",
  [ACTION_TYPES.EXTRACT_ALL_IMAGES]: "image",
  [ACTION_TYPES.TOGGLE_SITE_JAVASCRIPT]: "code",
  [ACTION_TYPES.TOGGLE_SITE_IMAGES]: "image",
  [ACTION_TYPES.TOGGLE_SITE_POPUPS]: "external",
  [ACTION_TYPES.OPEN_TOP_SITES]: "globe",
  [ACTION_TYPES.WAIT_FOR_NAVIGATION]: "clock",
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

// 卡片上预览多少个动作，超出的折成「+ N more」
const PREVIEW_ACTIONS = 3;

// 「1 actions」是明显的语法错误。Chrome i18n 没有复数支持，
// 所以给单复数各留一个 key；中日韩等无复数变化的语言两个 key 写成一样即可。
function formatActionCount(n) {
  const word = n === 1 ? t("actions_count_one", "个动作") : t("actions_count", "个动作");
  return `${n} ${word}`;
}

// 把动作序列渲染成竖向时间轴：延迟是两步之间的间隔，所以它画在连接线上，
// 而不是行尾的徽章。0 延迟不显示数字，避免整张卡片被「0ms」刷屏。
function renderChainTimeline(actions) {
  return actions
    .slice(0, PREVIEW_ACTIONS)
    .map((action, i) => {
      const delay = Number(action.delay) || 0;
      const name = (ACTION_NAMES[action.type] && ACTION_NAMES[action.type]()) || escapeHtmlAttr(action.type);
      // 首个动作的延迟是「开跑前先等」，导轨只朝下长，上方不留悬空线头
      // 数字和单位之间要不要空格由语言决定：英文「200ms」不加，
      // 阿拉伯语「200 مللي ثانية」「200 мс」要加。所以走带 $1 的格式串，
      // 而不是在代码里拼接。
      const gap =
        delay > 0
          ? `<div class="action-gap timed${i === 0 ? " lead" : ""}"><span class="action-delay">${t("label_msValue", "$1ms", String(delay))}</span></div>`
          : i === 0
            ? ""
            : `<div class="action-gap"></div>`;
      return `${gap}
              <div class="action-item">
                ${actionTile(action.type)}
                <span class="action-name" title="${name}">${name}</span>
              </div>`;
    })
    .join("");
}

// Template categories for filtering in the gallery
const TEMPLATE_CATEGORIES = {
  all: { icon: "bi-grid-fill", nameKey: "tmpl_cat_all", fallback: "全部模板" },
  ai: { icon: "bi-cpu-fill", nameKey: "tmpl_cat_ai", fallback: "AI 智能" },
  tabs: { icon: "bi-window-stack", nameKey: "tmpl_cat_tabs", fallback: "标签与内存" },
  reading: { icon: "bi-book-half", nameKey: "tmpl_cat_reading", fallback: "阅读与视听" },
  developer: { icon: "bi-code-slash", nameKey: "tmpl_cat_developer", fallback: "网页与开发" },
  privacy: { icon: "bi-shield-lock-fill", nameKey: "tmpl_cat_privacy", fallback: "隐私与清理" },
  workflow: { icon: "bi-lightning-charge-fill", nameKey: "tmpl_cat_workflow", fallback: "日常工作流" },
};

// Built-in chain templates ("Shortcuts"-style recipes users can add with one click).
// `build` is a function so action text/names are localized at creation time.
const CHAIN_TEMPLATES = [
  {
    key: "aiSummarize",
    category: "ai",
    requiresAi: true,
    nameKey: "tmpl_aiSummarize",
    fallback: "AI 智能页面速读",
    descKey: "tmpl_aiSummarize_desc",
    descFallback: "使用端侧 Gemini Nano AI 提取网页核心摘要，并在侧边栏中整理展示",
    icon: "bi-robot",
    build: () => [
      { type: ACTION_TYPES.AI_SUMMARIZE, delay: 0, summaryLang: "auto", format: "concise" },
      { type: ACTION_TYPES.OPEN_SIDE_PANEL, delay: 300 },
    ],
  },
  {
    key: "aiExplain",
    category: "ai",
    requiresAi: true,
    nameKey: "tmpl_aiExplain",
    fallback: "AI 划词深度解析",
    descKey: "tmpl_aiExplain_desc",
    descFallback: "选中网页段落，呼叫端侧 AI 进行逐段答疑解析并在侧边栏记录",
    icon: "bi-lightbulb",
    build: () => [
      { type: ACTION_TYPES.AI_EXPLAIN, delay: 0, explainLang: "auto", style: "concise" },
      { type: ACTION_TYPES.OPEN_SIDE_PANEL, delay: 200 },
    ],
  },
  {
    key: "aiTranslate",
    category: "ai",
    requiresAi: true,
    nameKey: "tmpl_aiTranslate",
    fallback: "AI 选区翻译与朗读",
    descKey: "tmpl_aiTranslate_desc",
    descFallback: "通过端侧 AI 将划选文本翻译为目标语言，并调用系统语音引擎朗读",
    icon: "bi-translate",
    build: () => [
      { type: ACTION_TYPES.AI_TRANSLATE, delay: 0, targetLang: "auto", style: "natural" },
      { type: ACTION_TYPES.SPEAK_SELECTION, delay: 300, preferOutput: true, lang: "auto", rate: 1.0 },
    ],
  },
  {
    key: "tabHibernateClean",
    category: "tabs",
    nameKey: "tmpl_tabHibernateClean",
    fallback: "内存暴降与标签整理",
    descKey: "tmpl_tabHibernateClean_desc",
    descFallback: "关闭重复标签，休眠冻结非活跃标签释放内存，并按域名分组折叠",
    icon: "bi-battery-charging",
    build: () => [
      { type: ACTION_TYPES.CLOSE_DUPLICATE_TABS, delay: 0 },
      { type: ACTION_TYPES.DISCARD_OTHER_TABS, delay: 300 },
      { type: ACTION_TYPES.GROUP_TABS_BY_DOMAIN, delay: 300 },
      { type: ACTION_TYPES.COLLAPSE_ALL_GROUPS, delay: 200 },
    ],
  },
  {
    key: "tabCleanup",
    category: "tabs",
    nameKey: "tmpl_tabCleanup",
    fallback: "标签大扫除",
    descKey: "tmpl_tabCleanup_desc",
    descFallback: "清理重复标签页，按网址排序并按域名自动归类分组",
    icon: "bi-magic",
    build: () => [
      { type: ACTION_TYPES.CLOSE_DUPLICATE_TABS, delay: 0 },
      { type: ACTION_TYPES.SORT_TABS_BY_URL, delay: 300 },
      { type: ACTION_TYPES.GROUP_TABS_BY_DOMAIN, delay: 300 },
    ],
  },
  {
    key: "safeCloseOthers",
    category: "tabs",
    nameKey: "tmpl_safeCloseOthers",
    fallback: "安全关闭其他标签页",
    descKey: "tmpl_safeCloseOthers_desc",
    descFallback: "弹窗安全二次确认，防止误触关闭其他所有标签页",
    icon: "bi-shield-check",
    build: () => [
      { type: ACTION_TYPES.CONFIRM, delay: 0, text: t("tmpl_safeCloseOthers_ask", "确定要关闭其他所有标签页吗？") },
      { type: ACTION_TYPES.CLOSE_OTHER_TABS, delay: 0 },
    ],
  },
  {
    key: "focus",
    category: "workflow",
    nameKey: "tmpl_focusMode",
    fallback: "深度沉浸专注模式",
    descKey: "tmpl_focusMode_desc",
    descFallback: "一键静音所有标签页、切换深色保护眼睛并进入全屏专注",
    icon: "bi-moon-stars",
    build: () => [
      { type: ACTION_TYPES.MUTE_ALL_TABS, delay: 0 },
      { type: ACTION_TYPES.TOGGLE_DARK_MODE, delay: 200 },
      { type: ACTION_TYPES.FULLSCREEN, delay: 200 },
    ],
  },
  {
    key: "webEditor",
    category: "developer",
    nameKey: "tmpl_webEditor",
    fallback: "网页原地自由编辑",
    descKey: "tmpl_webEditor_desc",
    descFallback: "切换页面 DesignMode，支持像 Word 一样任意修改网页文字与布局用于排版截图",
    icon: "bi-pencil-square",
    build: () => [
      { type: ACTION_TYPES.TOGGLE_DESIGN_MODE, delay: 0 },
    ],
  },
  {
    key: "extractMedia",
    category: "developer",
    nameKey: "tmpl_extractMedia",
    fallback: "页面链接与图片提取",
    descKey: "tmpl_extractMedia_desc",
    descFallback: "从当前页面一键解析并提取全部媒体图片与链接清单",
    icon: "bi-file-earmark-arrow-down",
    build: () => [
      { type: ACTION_TYPES.EXTRACT_ALL_IMAGES, delay: 0, outputVar: "images", noCopy: true },
      { type: ACTION_TYPES.EXTRACT_ALL_LINKS, delay: 300, outputVar: "links", noCopy: true },
      // 两个提取动作都会覆盖剪贴板，所以这里必须把两份清单合成一次再写入 ——
      // 否则后一步的链接清单会把前一步的图片清单顶掉，而通知还说两者都提取了。
      // （Markdown 载荷按仓库既有做法内联，不走 i18n，见 copyMarkdown / aiKnowledgeCard。）
      { type: ACTION_TYPES.COPY_TEXT, delay: 200, text: "## Images\n{images}\n\n## Links\n{links}" },
    ],
  },
  {
    key: "cinema",
    category: "reading",
    nameKey: "tmpl_cinemaMode",
    fallback: "画中画与观影模式",
    descKey: "tmpl_cinemaMode_desc",
    descFallback: "弹出网页视频画中画独立浮窗，并开启全屏无干扰观影",
    icon: "bi-pip",
    build: () => [
      { type: ACTION_TYPES.MEDIA_PLAY, delay: 0 },
      { type: ACTION_TYPES.FULLSCREEN, delay: 200 },
    ],
  },
  {
    key: "readAloud",
    category: "reading",
    nameKey: "tmpl_readAloud",
    fallback: "语音朗读当前选区",
    descKey: "tmpl_readAloud_desc",
    descFallback: "调用浏览器原生语音合成引擎朗读当前高亮选中的文章段落",
    icon: "bi-megaphone",
    build: () => [{ type: ACTION_TYPES.SPEAK_SELECTION, delay: 0, lang: "auto", rate: 1.0, preferOutput: false }],
  },
  {
    key: "privacyWipe",
    category: "privacy",
    nameKey: "tmpl_privacyWipe",
    fallback: "隐私数据极速抹除",
    descKey: "tmpl_privacyWipe_desc",
    descFallback: "经弹窗确认后，快速清理近期的 Cookie 缓存与下载记录保护隐私",
    icon: "bi-trash3",
    build: () => [
      { type: ACTION_TYPES.CONFIRM, delay: 0, text: t("tmpl_privacyWipe_ask", "确定要清理浏览数据（Cookie与下载历史）吗？") },
      { type: ACTION_TYPES.CLEAR_COOKIES, delay: 100 },
      { type: ACTION_TYPES.CLEAR_DOWNLOADS_HISTORY, delay: 100 },
    ],
  },
  {
    key: "copyMarkdown",
    category: "workflow",
    nameKey: "tmpl_copyMarkdown",
    fallback: "Markdown 引用链接复制",
    descKey: "tmpl_copyMarkdown_desc",
    descFallback: "快速提取当前网页标题与网址，按 Markdown 标准格式格式化拷贝到剪贴板",
    icon: "bi-markdown",
    build: () => [
      { type: ACTION_TYPES.COPY_TEXT, delay: 0, text: "[{title}]({url})" },
    ],
  },
  {
    key: "snapshot",
    category: "workflow",
    nameKey: "tmpl_snapshot",
    fallback: "截图存盘并加入书签",
    descKey: "tmpl_snapshot_desc",
    descFallback: "截取可见区域图像，同时将页面添加至书签栏备忘",
    icon: "bi-camera",
    build: () => [
      { type: ACTION_TYPES.CAPTURE_SCREENSHOT, delay: 0 },
      { type: ACTION_TYPES.BOOKMARK, delay: 300 },
    ],
  },
  {
    key: "wrapUp",
    category: "workflow",
    nameKey: "tmpl_wrapUp",
    fallback: "一键收工模式",
    descKey: "tmpl_wrapUp_desc",
    descFallback: "保存书签防丢失，静音所有声音并最小化窗口准备下班",
    icon: "bi-cup-hot",
    build: () => [
      { type: ACTION_TYPES.BOOKMARK, delay: 0 },
      { type: ACTION_TYPES.MUTE_ALL_TABS, delay: 200 },
      { type: ACTION_TYPES.MINIMIZE_WINDOW, delay: 200 },
    ],
  },
  {
    key: "sidePanelCompanion",
    category: "workflow",
    nameKey: "tmpl_sidePanelCompanion",
    fallback: "侧边栏效率助手",
    descKey: "tmpl_sidePanelCompanion_desc",
    descFallback: "一键呼出 Hotkey Chain 侧边栏伴侣，随时执行快捷链与管理配置",
    icon: "bi-layout-sidebar-reverse",
    build: () => [
      { type: ACTION_TYPES.OPEN_SIDE_PANEL, delay: 0 },
    ],
  },
  {
    key: "workflowAiResearch",
    category: "workflow",
    requiresAi: true,
    nameKey: "tmpl_workflowAiResearch",
    fallback: "AI 提取与总结工作流",
    descKey: "tmpl_workflowAiResearch_desc",
    descFallback: "自动提取网页链接并由端侧 AI 智能总结要点，格式化写入剪贴板",
    icon: "bi-diagram-3",
    build: () => [
      { type: ACTION_TYPES.EXTRACT_ALL_LINKS, delay: 0 },
      { type: ACTION_TYPES.AI_SUMMARIZE, delay: 300, summaryLang: "auto", format: "bullets", noCopy: true },
      { type: ACTION_TYPES.COPY_TEXT, delay: 200, text: "## {title}\n{url}\n\n### AI Summary\n{output}" },
    ],
  },
  {
    key: "workflowReadLater",
    category: "workflow",
    nameKey: "tmpl_workflowReadLater",
    fallback: "稍后读与正文归档流水线",
    descKey: "tmpl_workflowReadLater_desc",
    descFallback: "将当前网页提取为干净的 Markdown 存入剪贴板，并加入 Chrome 阅读清单与书签",
    icon: "bi-journal-bookmark-fill",
    build: () => [
      { type: ACTION_TYPES.COPY_AS_MARKDOWN, delay: 0 },
      // 模板名里的「稍后读」指的是 Chrome 的阅读清单，所以要用 read_later，
      // 不能只加书签 —— 书签是另一回事，两者一起才叫「稍后读与归档」。
      { type: ACTION_TYPES.READ_LATER, delay: 300 },
      { type: ACTION_TYPES.BOOKMARK, delay: 200 },
    ],
  },
  {
    key: "aiKnowledgeCard",
    category: "ai",
    requiresAi: true,
    nameKey: "tmpl_aiKnowledgeCard",
    fallback: "AI 知识卡片速记",
    descKey: "tmpl_aiKnowledgeCard_desc",
    descFallback: "使用端侧 AI 提炼网页或划选内容的核心要点，格式化为 Markdown 引用卡片存入剪贴板",
    icon: "bi-journal-richtext",
    build: () => [
      { type: ACTION_TYPES.AI_SUMMARIZE, delay: 0, summaryLang: "auto", format: "concise", noCopy: true },
      { type: ACTION_TYPES.COPY_TEXT, delay: 200, text: "> [!NOTE] {title}\n> 💡 **Core Takeaway**:\n{output}\n\n- 🔗 Source: [{title}]({url})\n- 📅 Archived: {date}" },
    ],
  },
  {
    key: "workflowDevClean",
    category: "developer",
    nameKey: "tmpl_workflowDevClean",
    fallback: "前端开发极速重置流水线",
    descKey: "tmpl_workflowDevClean_desc",
    descFallback: "一键清除当前站点存储数据、清空浏览器缓存并强制硬刷新，前端调试零缓存干扰",
    icon: "bi-arrow-clockwise",
    build: () => [
      { type: ACTION_TYPES.CLEAR_SITE_DATA, delay: 0 },
      { type: ACTION_TYPES.CLEAR_BROWSING_CACHE, delay: 150 },
      { type: ACTION_TYPES.RELOAD_PAGE, delay: 200 },
    ],
  },
  {
    key: "workflowCleanWorkspace",
    category: "workflow",
    nameKey: "tmpl_workflowCleanWorkspace",
    fallback: "独占任务专注沙盒",
    descKey: "tmpl_workflowCleanWorkspace_desc",
    descFallback: "将当前标签页移至全新独立窗口并最大化，同时冻结休眠原窗口其余标签释放内存",
    icon: "bi-window-stack",
    build: () => [
      { type: ACTION_TYPES.MOVE_TAB_TO_NEW_WINDOW, delay: 0 },
      { type: ACTION_TYPES.MAXIMIZE_WINDOW, delay: 200 },
      { type: ACTION_TYPES.DISCARD_OTHER_TABS, delay: 200 },
    ],
  },
  {
    key: "incognitoHandoff",
    category: "privacy",
    nameKey: "tmpl_incognitoHandoff",
    fallback: "无痕隐身交接与痕迹抹除",
    descKey: "tmpl_incognitoHandoff_desc",
    descFallback: "在无痕窗口中无缝继续浏览当前网页，关闭原标签并从历史记录中彻底抹除访问足迹",
    icon: "bi-incognito",
    build: () => [
      { type: ACTION_TYPES.OPEN_INCOGNITO_WINDOW, delay: 0, openCurrentUrl: true },
      { type: ACTION_TYPES.DELETE_URL_FROM_HISTORY, delay: 200 },
      { type: ACTION_TYPES.CLOSE_TAB, delay: 100 },
    ],
  },
  {
    key: "pureReader",
    category: "reading",
    nameKey: "tmpl_pureReader",
    fallback: "纯净无扰阅读",
    descKey: "tmpl_pureReader_desc",
    descFallback: "拦截弹窗并屏蔽图片加载，开启深色模式享受极致沉浸式纯文本阅读",
    icon: "bi-file-earmark-font",
    build: () => [
      { type: ACTION_TYPES.TOGGLE_SITE_POPUPS, delay: 0 },
      { type: ACTION_TYPES.TOGGLE_SITE_IMAGES, delay: 100 },
      { type: ACTION_TYPES.TOGGLE_DARK_MODE, delay: 200 },
    ],
  },
  {
    key: "siteScriptShield",
    category: "privacy",
    nameKey: "tmpl_siteScriptShield",
    fallback: "站点脚本急停防护",
    descKey: "tmpl_siteScriptShield_desc",
    descFallback: "一键切换禁用当前站点的 JavaScript 执行并重新加载，阻断恶意弹窗与反复制行为",
    icon: "bi-shield-slash",
    build: () => [
      { type: ACTION_TYPES.TOGGLE_SITE_JAVASCRIPT, delay: 0 },
      { type: ACTION_TYPES.RELOAD_PAGE, delay: 200 },
    ],
  },
  {
    key: "workstationLaunch",
    category: "workflow",
    nameKey: "tmpl_workstationLaunch",
    fallback: "每日工作台一键启动",
    descKey: "tmpl_workstationLaunch_desc",
    descFallback: "一键打开高频常用网站、整理重复标签页并唤出侧边栏伴侣，迅速进入工作状态",
    icon: "bi-speedometer2",
    build: () => [
      { type: ACTION_TYPES.OPEN_TOP_SITES, delay: 0, count: 5 },
      { type: ACTION_TYPES.CLOSE_DUPLICATE_TABS, delay: 300 },
      { type: ACTION_TYPES.OPEN_SIDE_PANEL, delay: 300 },
    ],
  },
  {
    // 流水线编排示例：主链产出摘要，自动交给伴侣链朗读。
    // 模板库里此前没有任何一条链用过 nextChainKey —— 旗舰功能零示例。
    key: "pipelineSummarySpeak",
    category: "ai",
    requiresAi: true,
    nameKey: "tmpl_pipelineSummarySpeak",
    fallback: "长文提炼与朗读流水线",
    descKey: "tmpl_pipelineSummarySpeak_desc",
    descFallback: "端侧 AI 提炼正文摘要，完成后自动流转到第二条链，用系统语音朗读出来",
    icon: "bi-soundwave",
    passOutput: true,
    nextChainKey: "@companion",
    companion: {
      nameKey: "tmpl_pipelineSummarySpeak_next",
      fallback: "朗读摘要（流水线第二段）",
      descKey: "tmpl_pipelineSummarySpeak_next_desc",
      descFallback: "由主链自动触发：把上一步的摘要用系统语音朗读出来",
      build: () => [
        { type: ACTION_TYPES.SPEAK_SELECTION, delay: 0, preferOutput: true, lang: "auto", rate: 1.0 },
      ],
    },
    build: () => [
      { type: ACTION_TYPES.AI_SUMMARIZE, delay: 0, summaryLang: "auto", format: "bullets", noCopy: true },
      { type: ACTION_TYPES.COPY_TEXT, delay: 200, text: "## {title}\n{url}\n\n{output}" },
    ],
  },
  {
    // 条件分支示例：不满足条件时走 elseChainKey 到伴侣链提示，
    // 而不是安静地什么都不做。
    key: "selectionSearch",
    category: "workflow",
    nameKey: "tmpl_selectionSearch",
    fallback: "划词即搜（条件分支）",
    descKey: "tmpl_selectionSearch_desc",
    descFallback: "先判断页面上有没有选中文字：有就用默认搜索引擎搜索，没有则提示你先划词",
    icon: "bi-search",
    companion: {
      nameKey: "tmpl_selectionSearch_else",
      fallback: "提示先划词（分支）",
      descKey: "tmpl_selectionSearch_else_desc",
      descFallback: "由条件动作在不满足时触发：提示用户先选中要搜索的文字",
      build: () => [
        { type: ACTION_TYPES.SHOW_NOTIFICATION, delay: 0, text: t("tmpl_selectionSearch_elseMsg", "请先在页面上选中要搜索的文字") },
      ],
    },
    build: () => [
      { type: ACTION_TYPES.IF_HAS_SELECTION, delay: 0, elseChainKey: "@companion" },
      { type: ACTION_TYPES.SEARCH_SELECTION, delay: 100, preferOutput: true },
    ],
  },
  {
    // 等待导航示例：SPA 页面往往在 load 之后才渲染出内容，
    // 先刷新再等加载完成，提取到的链接才是完整的。
    key: "reloadThenExtract",
    category: "developer",
    nameKey: "tmpl_reloadThenExtract",
    fallback: "加载完成后提取链接",
    descKey: "tmpl_reloadThenExtract_desc",
    descFallback: "刷新页面并等待加载真正完成（适合单页应用），再提取全部外链并复制",
    icon: "bi-arrow-repeat",
    build: () => [
      { type: ACTION_TYPES.RELOAD_PAGE, delay: 0 },
      { type: ACTION_TYPES.WAIT_FOR_NAVIGATION, delay: 200, timeoutMs: 15000 },
      { type: ACTION_TYPES.EXTRACT_ALL_LINKS, delay: 200 },
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
  // 快捷键徽章要显示 Chrome 实际登记的值，所以渲染前先读一次
  await refreshCommandShortcuts();
  setupEventListeners();
  renderMainView();
  renderActionsHelp();
  populateTemplateMenu();
  renderFooterVersion();

  // 用户可能刚从 chrome://extensions/shortcuts 改完快捷键回来 ——
  // 回到本页时重读一次并重绘，否则徽章还是旧的。
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible") return;
    await refreshCommandShortcuts();
    renderMainView();
  });

  // 初始化 Sortable.js 拖拽功能
  setTimeout(() => {
    initializeSortableDragDrop();
  }, 200);

  // Chrome warns ("Blocked aria-hidden on an element because its descendant
  // retained focus") when a dialog is hidden while focus is still inside it:
  // Bootstrap sets aria-hidden at the start of the hide and only restores focus
  // once the transition ends. Move focus out at that moment instead.
  document.querySelectorAll(".modal").forEach((m) =>
    m.addEventListener("hide.bs.modal", () => {
      if (m.contains(document.activeElement)) document.activeElement.blur();
    })
  );
});

// i18n helpers
//
// 带 $1 的句子必须由这里做替换：chrome.i18n.getMessage 在不传替换参数时
// 会把占位符**删掉**再返回，调用点再 .replace("$1", …) 就永远替换不到 ——
// 于是「跟随浏览器」模式下屏上只剩「ms」「个动作」这类没有数字的半截话，
// 而手动选过语言的走 i18nCache（原始 JSON，$1 还在）却是好的。
// 契约与 background.js 的 t(key, fallback, args) 保持一致。
function t(msgKey, fallback = "", args = null) {
  const list = args == null ? null : Array.isArray(args) ? args : [args];
  const fill = (text) =>
    list == null ? text : String(text).replace(/\$(\d)/g, (m, n) => list[Number(n) - 1] ?? m);
  try {
    if (userLocale && userLocale !== "auto" && i18nCache[userLocale]) {
      const val = i18nCache[userLocale][msgKey];
      if (val) return fill(val);
    }
    const res = list == null ? chrome.i18n.getMessage(msgKey) : chrome.i18n.getMessage(msgKey, list);
    return fill(res || fallback || msgKey);
  } catch (e) {
    return fill(fallback || msgKey);
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
  // 只有图标、没有可见文字的按钮，屏幕阅读器只能靠 aria-label
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const txt = t(el.getAttribute("data-i18n-aria"), "");
    if (txt) el.setAttribute("aria-label", txt);
  });
  document.title = t("appTitle", document.title);
}

// RTL languages — mirror the page direction for these locales (e.g. Arabic).
// Lives in direction.js so the side panel cannot drift from this page.

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

  // Template gallery category filters
  const categoryFilters = document.getElementById("templateCategoryFilters");
  if (categoryFilters) {
    categoryFilters.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-filter-btn");
      if (btn && btn.dataset.category) {
        currentTemplateCategory = btn.dataset.category;
        renderTemplateGallery();
      }
    });
  }

  // Template gallery search input
  const searchInput = document.getElementById("templateSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      templateSearchQuery = e.target.value;
      renderTemplateGallery();
    });
  }

  // Template search reset button
  const resetBtn = document.getElementById("templateSearchResetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      templateSearchQuery = "";
      currentTemplateCategory = "all";
      renderTemplateGallery();
    });
  }

  // Template cards container click
  const cardsContainer = document.getElementById("templateCardsContainer");
  if (cardsContainer) {
    cardsContainer.addEventListener("click", (e) => {
      const customizeBtn = e.target.closest(".template-customize-btn");
      if (customizeBtn && customizeBtn.dataset.templateKey) {
        addChainFromTemplate(customizeBtn.dataset.templateKey, true);
        return;
      }
      const addBtn = e.target.closest(".template-add-btn");
      if (addBtn && addBtn.dataset.templateKey) {
        addChainFromTemplate(addBtn.dataset.templateKey, false);
        return;
      }
      // The two buttons are the entry points; the card body used to be a third
      // one that silently meant "add without editing", which is not what the
      // footer promised.
      const stray = e.target.closest("[data-template-key]");
      if (stray) {
        const first = stray.querySelector(".template-customize-btn");
        if (first) first.focus();
      }
    });
  }

  // Action picker category filters
  const actionCategoryFilters = document.getElementById("actionPickerCategoryFilters");
  if (actionCategoryFilters) {
    actionCategoryFilters.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-filter-btn");
      if (btn && btn.dataset.category) {
        currentActionPickerCategory = btn.dataset.category;
        renderActionPickerCategories();
        renderActionPickerList();
      }
    });
  }

  // Action picker search input
  const actionSearchInput = document.getElementById("actionPickerSearchInput");
  if (actionSearchInput) {
    actionSearchInput.addEventListener("input", (e) => {
      actionPickerSearchQuery = e.target.value;
      renderActionPickerList();
    });
  }

  // Action picker list container click & keyboard delegation
  const actionListContainer = document.getElementById("actionPickerListContainer");
  if (actionListContainer) {
    actionListContainer.addEventListener("click", (e) => {
      const item = e.target.closest(".action-picker-item");
      if (item && item.dataset.actionType && actionPickerTargetChainKey) {
        addActionToChain(actionPickerTargetChainKey, item.dataset.actionType);
      }
    });

    actionListContainer.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const item = e.target.closest(".action-picker-item");
        if (item && item.dataset.actionType && actionPickerTargetChainKey) {
          e.preventDefault();
          addActionToChain(actionPickerTargetChainKey, item.dataset.actionType);
        }
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

  // Open side panel
  const sidePanelBtn = document.getElementById("sidePanelBtn");
  if (sidePanelBtn) {
    sidePanelBtn.addEventListener("click", async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (chrome.sidePanel?.open && tab?.windowId) {
          await chrome.sidePanel.open({ windowId: tab.windowId });
        }
      } catch (e) {
        console.warn("Failed to open side panel:", e);
      }
    });
  }

  // Check on-device AI status (Gemini Nano / Chrome Prompt API)
  const checkAiStatusBtn = document.getElementById("checkAiStatusBtn");
  if (checkAiStatusBtn) {
    // 可用性返回值有两套命名：新 LanguageModel.availability() 用
    // available / downloadable / downloading / unavailable，
    // 旧的 ai.languageModel.capabilities() 用 readily / after-download / no。
    // 只认一套会让另一套全部落进 else —— 最糟的是 unavailable 被报成「已就绪」。
    const normalizeAiAvailability = (raw) => {
      switch (raw) {
        case "available":
        case "readily":
          return "ready";
        case "downloadable":
        case "after-download":
          return "downloadable";
        case "downloading":
          return "downloading";
        case "unavailable":
        case "no":
          return "unavailable";
        default:
          return "unknown";
      }
    };

    // 诊断结果每个上下文一行，toast 会把换行压成一行且会自动消失 ——
    // 用临时 modal + <pre> 展示，用户能慢慢看，也方便直接复制去排查。
    const showAiReport = (summary, lines, isError) => {
      document.getElementById("aiStatusReportModal")?.remove();
      const modal = document.createElement("div");
      modal.id = "aiStatusReportModal";
      modal.className = "modal fade";
      modal.tabIndex = -1;
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${escapeHtmlAttr(t("btn_checkAiStatus", "检测端侧 AI 状态"))}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="${isError ? "text-danger" : "text-success"} mb-2" style="white-space:pre-wrap;">${escapeHtmlAttr(summary)}</p>
              <pre class="small mb-0">${escapeHtmlAttr(lines)}</pre>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modal);
      if (window.bootstrap) {
        new bootstrap.Modal(modal).show();
      } else {
        modal.classList.add("show");
        modal.style.display = "block";
      }
      modal.addEventListener("hidden.bs.modal", () => modal.remove());
    };

    checkAiStatusBtn.addEventListener("click", async () => {
      try {
        // 本页就是扩展页面（一个真正的 Window），可以直接问 Chrome
        const localLm = window.LanguageModel || window.ai?.languageModel;
        let localRaw = null;
        if (localLm) {
          try {
            localRaw = localLm.capabilities
              ? (await localLm.capabilities()).available
              : localLm.availability
              ? await localLm.availability()
              : "available";
          } catch (e) {
            localRaw = "error: " + String(e?.message || e);
          }
        }

        // 后台 SW 与目标标签页的两个世界交给后台去探
        let probe = {};
        try {
          probe = (await chrome.runtime.sendMessage({ action: "probeAiContexts" })) || {};
        } catch (e) {
          probe = {};
        }

        const rows = [
          ["extension page", localRaw],
          ["service worker", probe.sw],
          ["page isolated", probe.isolated],
          ["page main", probe.main],
        ];
        const states = rows.map(([, v]) => normalizeAiAvailability(v));
        // 原样展示 Chrome 报的值：排查时它比任何转述都有用
        // 顺带报出探测的是哪个标签页 —— 活动标签页若是本扩展自己的页面或 chrome:// 页，
        // 两个页面上下文会显示 (n/a)，那是正常情况，不是故障。
        const pad = (text) => {
          const w = [...String(text)].reduce((a, ch) => a + (/[\u1100-\uffff]/.test(ch) ? 2 : 1), 0);
          return String(text) + " ".repeat(Math.max(1, 18 - w));
        };
        const lines = [
          ...rows.map(([name, v]) => `${pad(name)}${v == null ? "(no API)" : v}`),
          `${pad("probed tab")}${probe.tabUrl || "(none)"}`,
        ].join("\n");

        // 语言解析链也一并报出来。用户选了「自动」却拿到日语时，
        // 只有这里能看出是动作写死了、还是界面语言、还是浏览器界面语言。
        const langLines = [
          `${t("ai_diag_language", "AI output language").padEnd(16)}${probe.aiLanguage || "(unknown)"}  [${probe.aiLanguageSource || "?"}]`,
          `${"action setting".padEnd(16)}(auto — 探针按动作未指定计算)`,
          `${"interface override".padEnd(16)}${probe.interfaceOverride ?? "(unset)"}`,
          `${"browser UI language".padEnd(16)}${probe.browserUiLanguage || "(unknown)"}`,
        ].join("\n");

        if (states.includes("ready")) {
          showAiReport(
            `✅ ${t("ai_statusReady", "Chrome 内置端侧 AI (Gemini Nano) 已就绪，可直接执行智能操作。")}`,
            `${lines}\n\n${langLines}`,
            false,
          );
        } else if (states.includes("downloadable") || states.includes("downloading")) {
          showAiReport(
            `⏳ ${t("ai_modelDownloading", "Chrome AI model is downloading on device, please retry shortly")}`,
            `${lines}\n\n${langLines}`,
            false,
          );
        } else {
          showAiReport(
            `⚠️ ${t("badge_requiresAi", "需浏览器内置 AI")}: ${t("ai_notSupported", "This browser cannot run Chrome's built-in AI (Gemini Nano).")}\n\n${t("ai_statusGuide", "")}`,
            `${lines}\n\n${langLines}`,
            true,
          );
        }
      } catch (err) {
        showMessage(`${t("label_error", "错误")}: ${err?.message || err}`, true);
      }
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

      const workflowChip = e.target.closest(".workflow-chip");
      if (workflowChip && workflowChip.dataset.workflowTarget) {
        editChain(workflowChip.dataset.workflowTarget);
        return;
      }
    });
  }

  // Workflow pipeline controls in edit view
  const nextStepSelect = document.getElementById("chainNextStepSelect");
  if (nextStepSelect) {
    nextStepSelect.addEventListener("change", async (e) => {
      if (editingChainId && currentConfig.chains[editingChainId]) {
        currentConfig.chains[editingChainId].nextChainKey = e.target.value || undefined;
        await saveConfig();
        renderWorkflowMiniPipeline(editingChainId);
      }
    });
  }

  const fallbackStepSelect = document.getElementById("chainFallbackStepSelect");
  if (fallbackStepSelect) {
    fallbackStepSelect.addEventListener("change", async (e) => {
      if (editingChainId && currentConfig.chains[editingChainId]) {
        currentConfig.chains[editingChainId].fallbackChainKey = e.target.value || undefined;
        await saveConfig();
        renderWorkflowMiniPipeline(editingChainId);
      }
    });
  }

  const passOutputCheck = document.getElementById("chainPassOutputCheck");
  if (passOutputCheck) {
    passOutputCheck.addEventListener("change", async (e) => {
      if (editingChainId && currentConfig.chains[editingChainId]) {
        currentConfig.chains[editingChainId].passOutput = e.target.checked;
        await saveConfig();
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

    if (target.matches(".run-chain-else-select, .condition-else-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].elseChainKey = target.value || undefined;
      saveConfig();
      return;
    }

    if (target.matches(".run-chain-pass-check")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].passOutput = target.checked;
      saveConfig();
      return;
    }

    if (target.matches(".ai-target-lang-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].targetLang = target.value;
      saveConfig();
      return;
    }

    if (target.matches(".ai-translate-style-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].style = target.value;
      saveConfig();
      return;
    }

    if (target.matches(".ai-summary-lang-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].summaryLang = target.value;
      saveConfig();
      return;
    }

    if (target.matches(".ai-summary-format-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].format = target.value;
      saveConfig();
      return;
    }

    if (target.matches(".ai-summary-nocopy-check")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      const action = currentConfig.chains[chainKey].actions[index];
      if (target.checked) action.noCopy = true;
      else delete action.noCopy;
      saveConfig();
      return;
    }

    if (target.matches(".extract-nocopy-check")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      const action = currentConfig.chains[chainKey].actions[index];
      if (target.checked) action.noCopy = true;
      else delete action.noCopy;
      saveConfig();
      return;
    }

    if (target.matches(".incognito-current-check")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      const action = currentConfig.chains[chainKey].actions[index];
      if (target.checked) action.openCurrentUrl = true;
      else delete action.openCurrentUrl;
      saveConfig();
      return;
    }

    if (target.matches(".ai-explain-lang-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].explainLang = target.value;
      saveConfig();
      return;
    }

    if (target.matches(".ai-explain-style-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].style = target.value;
      saveConfig();
      return;
    }

    if (target.matches(".tts-lang-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].lang = target.value;
      saveConfig();
      return;
    }

    if (target.matches(".tts-rate-input")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      const val = parseFloat(target.value);
      currentConfig.chains[chainKey].actions[index].rate = isNaN(val) ? 1.0 : Math.max(0.5, Math.min(2.0, val));
      saveConfig();
      return;
    }

    if (target.matches(".tts-prefer-output-check")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].preferOutput = target.checked;
      saveConfig();
      return;
    }

    if (target.matches(".translate-page-lang-select")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].targetLang = target.value;
      saveConfig();
      return;
    }

    if (target.matches(".search-prefer-output-check")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].preferOutput = target.checked;
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

    if (target.matches(".copy-text-input, .confirm-text-input, .speak-text-input")) {
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

    if (target.matches(".top-sites-count-input")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].count = Math.max(1, Math.min(20, parseInt(target.value, 10) || 5));
      saveConfig();
      return;
    }

    if (target.matches(".wait-nav-timeout-input")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      currentConfig.chains[chainKey].actions[index].timeoutMs = Math.max(500, Math.min(60000, parseInt(target.value, 10) || 10000));
      saveConfig();
      return;
    }

    if (target.matches(".tts-rate-input")) {
      const chainKey = target.dataset.chainKey;
      const index = parseInt(target.dataset.actionIndex, 10);
      const val = parseFloat(target.value);
      currentConfig.chains[chainKey].actions[index].rate = isNaN(val) ? 1.0 : Math.max(0.5, Math.min(2.0, val));
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
  document.body.classList.remove("editing");
}

// Show edit view
function showEditView() {
  document.getElementById("main-view").style.display = "none";
  document.getElementById("edit-view").style.display = "block";
  // The masthead belongs to the list; the editor needs its own header's room.
  document.body.classList.add("editing");
  setSaveStatus("idle");
}

// Edit chain function
function editChain(chainKey) {
  showEditView();
  editingChainId = chainKey;
  const chain = currentConfig.chains[chainKey];
  if (!chain) return;

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

  // Populate workflow pipeline options
  const otherChains = (currentConfig.chainOrder || Object.keys(currentConfig.chains)).filter((k) => currentConfig.chains[k] && k !== chainKey);
  const nextStepSelect = document.getElementById("chainNextStepSelect");
  if (nextStepSelect) {
    nextStepSelect.innerHTML = `<option value="">${t("workflow_noNextChain", "（无 - 执行完毕即终止）")}</option>` +
      otherChains.map((k) => `<option value="${k}" ${chain.nextChainKey === k ? "selected" : ""}>${escapeHtmlAttr(currentConfig.chains[k].name || k)}</option>`).join("");
  }

  const fallbackStepSelect = document.getElementById("chainFallbackStepSelect");
  if (fallbackStepSelect) {
    fallbackStepSelect.innerHTML = `<option value="">${t("workflow_noFallbackChain", "（无 - 遇错停止）")}</option>` +
      otherChains.map((k) => `<option value="${k}" ${chain.fallbackChainKey === k ? "selected" : ""}>${escapeHtmlAttr(currentConfig.chains[k].name || k)}</option>`).join("");
  }

  const passOutputCheck = document.getElementById("chainPassOutputCheck");
  if (passOutputCheck) {
    passOutputCheck.checked = chain.passOutput !== false;
  }

  renderWorkflowMiniPipeline(chainKey);

  // Render the chain configuration in edit view
  renderChainEdit(chainKey);
}

// Render interactive mini pipeline preview in chain editor
function renderWorkflowMiniPipeline(chainKey) {
  const container = document.getElementById("workflowMiniPipeline");
  if (!container) return;

  const chain = currentConfig.chains[chainKey];
  if (!chain) {
    container.innerHTML = "";
    return;
  }

  // Build the pipeline sequence starting from chainKey
  const steps = [];
  const visited = new Set();
  let currentKey = chainKey;

  while (currentKey && currentConfig.chains[currentKey] && !visited.has(currentKey)) {
    visited.add(currentKey);
    steps.push({
      key: currentKey,
      name: currentConfig.chains[currentKey].name || currentKey,
      isCurrent: currentKey === chainKey,
    });
    currentKey = currentConfig.chains[currentKey].nextChainKey;
  }

  // Also find if another chain flows into this one
  const incomingChains = Object.entries(currentConfig.chains)
    .filter(([k, c]) => k !== chainKey && c.nextChainKey === chainKey)
    .map(([k, c]) => ({ key: k, name: c.name || k }));

  const fallbackChain = chain.fallbackChainKey && currentConfig.chains[chain.fallbackChainKey]
    ? { key: chain.fallbackChainKey, name: currentConfig.chains[chain.fallbackChainKey].name || chain.fallbackChainKey }
    : null;

  let incomingHtml = "";
  if (incomingChains.length > 0) {
    incomingHtml = incomingChains
      .map((inc) => `<span class="workflow-pipeline-node clickable" data-goto-chain="${inc.key}" title="${t("workflow_step_incoming", "上一环节：点击跳转编辑")}">${escapeHtmlAttr(inc.name)}</span>`)
      .join(", ") + ` <span class="workflow-pipeline-arrow">➔</span> `;
  }

  const pipelineHtml = steps
    .map((step) => {
      const cls = step.isCurrent ? "current" : "clickable";
      const title = step.isCurrent ? t("workflow_step_current", "当前动作链") : t("workflow_step_next", "后续环节：点击跳转编辑");
      return `<span class="workflow-pipeline-node ${cls}" data-goto-chain="${step.key}" title="${title}">${escapeHtmlAttr(step.name)}</span>`;
    })
    .join(` <span class="workflow-pipeline-arrow">➔</span> `);

  const fallbackHtml = fallbackChain
    ? `<div class="mt-2 text-muted small"><i class="bi bi-shield-exclamation text-warning me-1"></i>${t("workflow_fallback_label", "出错备用")}：<span class="workflow-pipeline-node fallback clickable" data-goto-chain="${fallbackChain.key}">${escapeHtmlAttr(fallbackChain.name)}</span></div>`
    : "";

  const flowNotice = steps.length > 1
    ? `<div class="text-primary fw-semibold mb-1 small"><i class="bi bi-diagram-3 me-1"></i>${t("workflow_pipeline_active", "流水线模式已激活：$1 个关联节点", steps.length)}</div>`
    : `<div class="text-muted mb-1 small"><i class="bi bi-info-circle me-1"></i>${t("workflow_pipeline_single", "单动作链（未关联下游）")}</div>`;

  container.innerHTML = `
    ${flowNotice}
    <div class="workflow-pipeline-flow">
      ${incomingHtml}
      ${pipelineHtml}
      ${steps[steps.length - 1]?.key !== chain.nextChainKey && !chain.nextChainKey ? ` <span class="workflow-pipeline-arrow text-muted">➔</span> <span class="text-muted small">${t("workflow_step_end", "终点")}</span>` : ""}
    </div>
    ${fallbackHtml}
  `;

  // Jump to that chain upon clicking
  container.querySelectorAll("[data-goto-chain]").forEach((el) => {
    el.addEventListener("click", () => {
      const targetKey = el.dataset.gotoChain;
      if (targetKey && targetKey !== chainKey && currentConfig.chains[targetKey]) {
        editChain(targetKey);
      }
    });
  });
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
          name: t("defaultChain_reading", "Reading mode"),
          actions: [
            { type: ACTION_TYPES.SCROLL_TO_TOP, delay: 0 },
            { type: ACTION_TYPES.ZOOM_IN, delay: 200 },
            { type: ACTION_TYPES.FULLSCREEN, delay: 200 },
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
  setSaveStatus("pending");
  try {
    const response = await chrome.runtime.sendMessage({
      action: "saveConfig",
      config: currentConfig,
    });
    if (response && response.success === false) {
      throw new Error(response.error || "unknown error");
    }
    setSaveStatus("saved");
  } catch (error) {
    // Surface unexpected storage failures instead of silently losing edits
    console.error("Failed to save config:", error);
    setSaveStatus("failed");
    showMessage(t("toast_saveFailed", "保存失败: $1", error.message), true);
  }
}

// The editor has no save button on purpose — it writes as you type. That is only
// reassuring if the screen says so, so the header carries a live receipt.
function setSaveStatus(state) {
  const el = document.getElementById("saveStatus");
  if (!el) return;
  el.dataset.state = state;
  const text =
    state === "pending" ? "⋯" :
    state === "failed" ? t("label_error", "错误") :
    state === "saved" ? t("edit_saved", "已保存") :
    t("edit_autosave", "改动自动保存");
  const clock = state === "saved" ? " " + new Date().toLocaleTimeString() : "";
  el.textContent = text + clock;
}

// A native confirm() is the browser's chrome, not our page, and its text was
// assembled in code ("删除 \"X\"?\n\n"). Ask in the page, in one string.
function confirmInPage(message) {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    host.className = "modal fade";
    host.tabIndex = -1;
    host.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content">
          <div class="modal-body p-4">
            <p class="mb-3"></p>
            <div class="d-flex gap-2 justify-content-end">
              <button type="button" class="btn btn-outline-secondary btn-sm" data-answer="no"></button>
              <button type="button" class="btn btn-primary btn-sm" data-answer="yes"></button>
            </div>
          </div>
        </div>
      </`;
    host.querySelector("p").textContent = message;
    host.querySelector('[data-answer="yes"]').textContent = t("content_continue", "继续");
    host.querySelector('[data-answer="no"]').textContent = t("content_cancel", "取消");
    document.body.appendChild(host);
    const modal = new bootstrap.Modal(host);
    let answered = false;
    const done = (v) => { if (!answered) { answered = true; resolve(v); modal.hide(); } };
    host.querySelectorAll("[data-answer]").forEach((b) =>
      b.addEventListener("click", () => done(b.dataset.answer === "yes"))
    );
    host.addEventListener("hidden.bs.modal", () => host.remove());
    host.addEventListener("shown.bs.modal", () => host.querySelector('[data-answer="no"]').focus());
    modal.show();
  });
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

// 快捷键徽章必须显示 **Chrome 实际登记的值**，不能按槽位猜。
// 用户可能在 chrome://extensions/shortcuts 里改过或清空过，
// 也可能因为冲突（被别的扩展或系统占用）Chrome 压根没给分配 ——
// 猜出来的徽章会显示一个按不出来的快捷键。
let commandShortcuts = new Map(); // 命令名 -> 实际快捷键（未分配为空串）

async function refreshCommandShortcuts() {
  try {
    const all = await chrome.commands.getAll();
    commandShortcuts = new Map(all.map((c) => [c.name, c.shortcut || ""]));
  } catch (e) {
    console.error("Failed to read registered shortcuts:", e);
    commandShortcuts = new Map();
  }
}

// 一条链由哪个命令触发 —— 解析住在 shortcuts.js，和侧边栏共用一份，
// 否则两处会各自漂移，而徽章指着一个并不存在的绑定。
function commandNameForChain(chainKey, orderedKeys, config) {
  return hotkeyChainCommandName(chainKey, orderedKeys, config, (n) => commandShortcuts.has(`execute_chain_${n}`));
}

// Render main view with action chains
function renderMainView() {
  // Chains grid container
  const chainsContainer = document.getElementById("chains-container");
  if (chainsContainer) {
    chainsContainer.innerHTML = "";

    // 按照保存的顺序或默认顺序渲染动作链
    const chainOrder = currentConfig.chainOrder || Object.keys(currentConfig.chains);

    // 一条链都没有时（删光了、或导入了一份空配置），原来是一片纯白，
    // 没有任何线索。空屏应该告诉人下一步做什么。
    const hasAny = chainOrder.some((key) => currentConfig.chains[key]);
    if (!hasAny) {
      chainsContainer.innerHTML = `
        <div class="chains-empty">
          <div class="chains-empty-art" aria-hidden="true">
            <span class="action-tile" style="background:${CATEGORY_COLORS.page_ops}"><svg viewBox="0 0 24 24">${ICONS.arrowUp}</svg></span>
            <span class="chains-empty-rail"></span>
            <span class="action-tile" style="background:${CATEGORY_COLORS.tab_mgmt}"><svg viewBox="0 0 24 24">${ICONS.copy}</svg></span>
            <span class="chains-empty-rail"></span>
            <span class="action-tile" style="background:${CATEGORY_COLORS.content}"><svg viewBox="0 0 24 24">${ICONS.clipboard}</svg></span>
          </div>
          <h3>${t("empty_title", "还没有动作链")}</h3>
          <p class="mb-4">${t("empty_body", "从模板开始最快，也可以新建一条空链自己添加动作。")}</p>
          <div class="d-flex justify-content-center gap-3 flex-wrap">
            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#templateGalleryModal">
              <i class="bi bi-stars me-2" aria-hidden="true"></i>${t("empty_cta_templates", "从模板库挑选")}
            </button>
            <button type="button" class="btn btn-outline-secondary" id="emptyAddBtn">
              <i class="bi bi-plus-lg me-2" aria-hidden="true"></i>${t("empty_cta_blank", "新建空白链")}
            </button>
            <button type="button" class="btn btn-outline-secondary" id="emptyRestoreBtn">
              <i class="bi bi-arrow-counterclockwise me-2" aria-hidden="true"></i>${t("toolbar_restoreDefaults", "恢复默认")}
            </button>
          </div>
          <p class="text-muted small mt-3 mb-0">${t("empty_restore_hint", "删错了？可以把出厂的链放回来。")}</p>
          </div>
        </div>
      `;
      const emptyAddBtn = document.getElementById("emptyAddBtn");
      if (emptyAddBtn) {
        emptyAddBtn.addEventListener("click", () => addNewChain());
      }
      const emptyRestoreBtn = document.getElementById("emptyRestoreBtn");
      if (emptyRestoreBtn) {
        emptyRestoreBtn.addEventListener("click", () => restoreDefaults());
      }
      return;
    }

    chainOrder.forEach((chainKey) => {
      const chain = currentConfig.chains[chainKey];
      if (!chain) return; // 跳过不存在的动作链

      const chainCard = document.createElement("div");
      chainCard.className = "chain-card";
      chainCard.draggable = true;
      chainCard.dataset.chainKey = chainKey;

      const isDefault = chainKey === currentConfig.defaultChain;
      // 徽章按 **Chrome 实际登记的快捷键** 渲染，而不是「按槽位猜一个」。
      // 用户在 chrome://extensions/shortcuts 里改过/清空过、或 Chrome 因冲突
      // 没分配时，猜出来的值就是个按不出来的快捷键。
      const cmdName = commandNameForChain(chainKey, chainOrder, currentConfig);
      const realShortcut = cmdName ? commandShortcuts.get(cmdName) || "" : "";
      let shortcutBadge = "";
      if (realShortcut) {
        shortcutBadge = `<span dir="ltr" class="cc-chip hotkey${isDefault ? " def-hotkey" : ""}" title="${t("shortcut_hint_click", "点击前往 Chrome 快捷键设置页面")}"><i class="bi bi-keyboard me-1" aria-hidden="true"></i>${t("shortcut_badge_withKey", "快捷键: {key}").replace("{key}", escapeHtmlAttr(realShortcut))}</span>`;
      } else if (cmdName) {
        // 有命令但没分配到快捷键 —— 明说，别显示一个假的
        shortcutBadge = `<span dir="ltr" class="cc-chip hotkey hotkey-unset" title="${t("shortcut_hint_click", "点击前往 Chrome 快捷键设置页面")}"><i class="bi bi-keyboard me-1" aria-hidden="true"></i>${t("shortcut_badge_unset", "未设置快捷键")}</span>`;
      } else {
        shortcutBadge = `<span class="cc-chip hotkey-subtle" title="${t("shortcut_badge_omnibox", "地址栏输入 hc + 链名")}"><i class="bi bi-terminal me-1" aria-hidden="true"></i>hc</span>`;
      }

      const scheduleMin = Number(chain.scheduleMinutes) > 0 ? Number(chain.scheduleMinutes) : 0;
      const hasAutoRun = !!(chain.autoRunPatterns && String(chain.autoRunPatterns).trim());
      const triggerChips =
        (scheduleMin ? `<span class="cc-chip" title="${t("info_schedule", "Schedule")}"><i class="bi bi-clock me-1"></i>${scheduleMin}m</span>` : "") +
        (hasAutoRun ? `<span class="cc-chip" title="${t("info_autoRun", "Auto-run")}"><i class="bi bi-lightning-charge"></i></span>` : "");

      let workflowChips = "";
      if (chain.nextChainKey && currentConfig.chains[chain.nextChainKey]) {
        const nextName = currentConfig.chains[chain.nextChainKey].name || chain.nextChainKey;
        const tooltip = t("workflow_chipTooltip", "工作流：执行完毕后自动流转至 $1", nextName);
        workflowChips += `<span class="cc-chip workflow-chip" data-workflow-target="${chain.nextChainKey}" title="${escapeHtmlAttr(tooltip)}"><i class="bi bi-diagram-3 me-1" aria-hidden="true"></i>➔ ${escapeHtmlAttr(nextName)}</span>`;
      }
      const hasIncoming = Object.entries(currentConfig.chains).some(([k, c]) => k !== chainKey && c.nextChainKey === chainKey);
      if (hasIncoming) {
        workflowChips += `<span class="cc-chip workflow-incoming" title="${t("workflow_incomingTooltip", "工作流下游节点：由其他动作链触发")}"><i class="bi bi-arrow-down-left-circle me-1" aria-hidden="true"></i>Workflow</span>`;
      }

      const hasAi = (chain.actions || []).some((a) =>
        a.type === ACTION_TYPES.AI_SUMMARIZE ||
        a.type === ACTION_TYPES.AI_EXPLAIN ||
        a.type === ACTION_TYPES.AI_TRANSLATE
      );
      const aiChip = hasAi
        ? `<span class="cc-chip ai-chip" title="${t("badge_requiresAi", "需浏览器内置 AI")}"><i class="bi bi-cpu me-1" aria-hidden="true"></i>${t("badge_requiresAi", "需浏览器内置 AI")}</span>`
        : "";

      chainCard.innerHTML = `
        <div class="chain-card-header">
          <span class="drag-handle" title="">⋮⋮</span>
          <div class="cc-titlewrap">
            <h6 class="chain-title" dir="ltr" title="${escapeHtmlAttr(chain.name)}">${escapeHtmlAttr(chain.name)}</h6>
            <div class="chain-meta">
              <span class="chain-actions-count">${formatActionCount(chain.actions.length)}</span>
              ${aiChip}
              ${shortcutBadge}
              ${workflowChips}
              ${isDefault ? `<span class="cc-chip def"><i class="bi bi-star-fill me-1"></i>${t("tooltip_defaultChain", "Default")}</span>` : ""}
              ${triggerChips}
            </div>
          </div>
          ${
            !isDefault
              ? `<button class="set-default-btn" data-chain-key="${chainKey}" title="${t("tooltip_setDefaultChain", "Set as default chain")}" aria-label="${t("tooltip_setDefaultChain", "Set as default chain")}"><i class="bi bi-star" aria-hidden="true"></i></button>`
              : ""
          }
        </div>
        <div class="chain-card-body">
          <div class="chain-actions">
            ${renderChainTimeline(chain.actions)}
            ${
              chain.actions.length > PREVIEW_ACTIONS
                ? `<div class="chain-more">${t("actions_more", "+$1 more", chain.actions.length - PREVIEW_ACTIONS)}</div>`
                : ""
            }
            ${chain.actions.length === 0 ? `<div class="chain-empty">${t("actions_none", "暂无动作")}</div>` : ""}
          </div>
          <div class="chain-card-actions">
            ${
              // 空链没什么可运行的，把「运行」换成让人往下走的入口
              // 空链没什么可运行的，把「运行」换成让人往下走的入口。
              // 别加 execute-btn：事件代理先认它，点了会变成「运行一条空链」。
              chain.actions.length === 0
                ? `<button class="btn btn-outline-primary btn-sm edit-chain-btn" data-chain-key="${chainKey}">
                     <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>${t("card_addActions", "添加动作")}
                   </button>`
                : `<button class="btn btn-primary btn-sm execute-btn" data-chain-key="${chainKey}">
                     <i class="bi bi-play-fill me-1" aria-hidden="true"></i>${t("card_exec", "运行")}
                   </button>
                   <button class="btn btn-outline-secondary btn-sm icon-btn edit-chain-btn" data-chain-key="${chainKey}" title="${t("card_edit", "编辑")}" aria-label="${t("card_edit", "编辑")}">
                     <i class="bi bi-pencil" aria-hidden="true"></i>
                   </button>`
            }
            <button class="btn btn-outline-secondary btn-sm icon-btn duplicate-chain-btn" data-chain-key="${chainKey}" title="${t("card_duplicate", "复制")}" aria-label="${t("card_duplicate", "复制")}">
              <i class="bi bi-copy" aria-hidden="true"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm icon-btn delete-chain-btn" data-chain-key="${chainKey}" title="${t("card_delete", "删除")}" aria-label="${t("card_delete", "删除")}">
              <i class="bi bi-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      `;

      chainCard.querySelectorAll(".cc-chip.hotkey").forEach((el) => {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
        });
      });

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
            <div class="action-row">
              <select class="form-select form-select-sm action-type-select" data-chain-key="${chainKey}" data-action-index="${index}" aria-label="${t("actions_title", "动作")}">
                ${generateGroupedActionOptions(action.type)}
              </select>
              <div class="input-group input-group-sm action-delay-group">
                <span class="input-group-text">${index === 0 ? t("label_delayBefore", "开跑前等") : t("label_delayAfter", "之后等")}</span>
                <input type="number" class="form-control action-delay-input" min="0" max="10000" step="100"
                  value="${Number(action.delay) || 0}" data-chain-key="${chainKey}" data-action-index="${index}" aria-label="${t("label_delay", "延迟")}">
                <span class="input-group-text">${t("label_ms", "ms")}</span>
              </div>
              <button class="btn btn-outline-danger btn-sm remove-action-btn" data-chain-key="${chainKey}" data-action-index="${index}" title="${t("actions_remove", "删除动作")}" aria-label="${t("actions_remove", "删除动作")}">
                <i class="bi bi-trash" aria-hidden="true"></i>
              </button>
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
            <div class="form-text small">${t("hint_templateVars", "支持变量: {url} {title} {selection} {clipboard} {output} {date} {time}")}</div>
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
        <div class="form-text small">${t("hint_templateVars", "支持变量: {url} {title} {selection} {clipboard} {output} {date} {time}")}</div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.COPY_TEXT) {
    return `
      <div class="mt-2">
        <label class="form-label small">${t("label_copyText", "复制内容")}:</label>
        <textarea class="form-control form-control-sm copy-text-input" rows="2" placeholder="${t("placeholder_copyText", "如 {title} — {url}")}"
                  data-chain-key="${chainKey}" data-action-index="${index}">${action.text ? escapeHtmlAttr(action.text) : ""}</textarea>
        <div class="form-text small">${t("hint_templateVars", "支持变量: {url} {title} {selection} {clipboard} {output} {date} {time}")}</div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.SPEAK_TEXT) {
    return `
      <div class="mt-2">
        <div class="mb-2">
          <label class="form-label small">${t("label_speakText", "朗读内容")}:</label>
          <textarea class="form-control form-control-sm speak-text-input" rows="2" placeholder="${t("placeholder_speakText", "要朗读的文字，支持变量如: {title} 或 {output}")}"
                    data-chain-key="${chainKey}" data-action-index="${index}">${action.text ? escapeHtmlAttr(action.text) : ""}</textarea>
          <div class="form-text small">${t("hint_templateVars", "支持变量: {url} {title} {selection} {clipboard} {output} {date} {time}")}</div>
        </div>
        <div class="row g-2">
          <div class="col-md-6">
            <label class="form-label small">${t("label_ttsLang", "朗读语言")}:</label>
            <select class="form-select form-select-sm tts-lang-select" data-chain-key="${chainKey}" data-action-index="${index}">
              ${generateLanguageOptions(action.lang || "auto")}
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label small">${t("label_ttsSpeed", "语速 (0.5x - 2.0x)")}:</label>
            <input type="number" class="form-control form-control-sm tts-rate-input" min="0.5" max="2.0" step="0.1"
                   value="${action.rate !== undefined ? action.rate : "1.0"}"
                   data-chain-key="${chainKey}" data-action-index="${index}">
          </div>
        </div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.SPEAK_SELECTION) {
    return `
      <div class="mt-2">
        <div class="row g-2 mb-2">
          <div class="col-md-6">
            <label class="form-label small">${t("label_ttsLang", "朗读语言")}:</label>
            <select class="form-select form-select-sm tts-lang-select" data-chain-key="${chainKey}" data-action-index="${index}">
              ${generateLanguageOptions(action.lang || "auto")}
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label small">${t("label_ttsSpeed", "语速 (0.5x - 2.0x)")}:</label>
            <input type="number" class="form-control form-control-sm tts-rate-input" min="0.5" max="2.0" step="0.1"
                   value="${action.rate !== undefined ? action.rate : "1.0"}"
                   data-chain-key="${chainKey}" data-action-index="${index}">
          </div>
        </div>
        <div class="form-check form-switch mb-1">
          <input class="form-check-input tts-prefer-output-check" type="checkbox" data-chain-key="${chainKey}" data-action-index="${index}" ${action.preferOutput ? "checked" : ""}>
          <label class="form-check-label small">${t("label_preferOutput", "优先朗读上一步输出（如翻译/总结结果）")}</label>
        </div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.TRANSLATE_PAGE) {
    return `
      <div class="mt-2">
        <label class="form-label small">${t("label_targetLang", "目标语言")}:</label>
        <select class="form-select form-select-sm translate-page-lang-select" data-chain-key="${chainKey}" data-action-index="${index}">
          ${generateLanguageOptions(action.targetLang || "auto")}
        </select>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.SEARCH_SELECTION) {
    return `
      <div class="mt-2">
        <div class="form-check form-switch mb-1">
          <input class="form-check-input search-prefer-output-check" type="checkbox" data-chain-key="${chainKey}" data-action-index="${index}" ${action.preferOutput ? "checked" : ""}>
          <label class="form-check-label small">${t("label_preferOutput", "优先搜索上一步输出（如翻译/总结结果）")}</label>
        </div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.CONFIRM) {
    const otherChains = (currentConfig.chainOrder || Object.keys(currentConfig.chains)).filter((key) => currentConfig.chains[key] && key !== chainKey);
    return `
      <div class="mt-2">
        <div class="row g-2 mb-2">
          <div class="col-md-7">
            <label class="form-label small">${t("label_confirmText", "询问文字")}:</label>
            <input type="text" class="form-control form-control-sm confirm-text-input" placeholder="${t("placeholder_confirmText", "如：确定要关闭其他标签页吗？")}"
                   value="${action.text ? escapeHtmlAttr(action.text) : ""}"
                   data-chain-key="${chainKey}" data-action-index="${index}">
          </div>
          <div class="col-md-5">
            <label class="form-label small">${t("workflow_elseChain", "取消时分支 (可选)")}:</label>
            <select class="form-select form-select-sm condition-else-select" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">${t("workflow_noElseChain", "（无 - 终止后续动作）")}</option>
              ${otherChains.map((key) => `<option value="${key}" ${action.elseChainKey === key ? "selected" : ""}>${escapeHtmlAttr(currentConfig.chains[key].name || key)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-text small">${t("hint_confirm", "在页面上弹出询问框：点「继续」才执行后面的动作，点「取消」则整条链停止。无法弹框的页面（如 chrome:// 设置页）也会停止。")}</div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.IF_URL_MATCHES) {
    const otherChains = (currentConfig.chainOrder || Object.keys(currentConfig.chains)).filter((key) => currentConfig.chains[key] && key !== chainKey);
    return `
      <div class="mt-2">
        <div class="row g-2">
          <div class="col-md-7">
            <label class="form-label small">${t("label_pattern", "匹配规则")}:</label>
            <input type="text" class="form-control form-control-sm condition-pattern-input" placeholder="${t("placeholder_pattern", "如 *://github.com/* 或关键字，多个用逗号分隔")}"
                   value="${action.pattern ? escapeHtmlAttr(action.pattern) : ""}"
                   data-chain-key="${chainKey}" data-action-index="${index}">
          </div>
          <div class="col-md-5">
            <label class="form-label small">${t("workflow_elseChain", "不满足时分支 (可选)")}:</label>
            <select class="form-select form-select-sm condition-else-select" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">${t("workflow_noElseChain", "（无 - 终止后续动作）")}</option>
              ${otherChains.map((key) => `<option value="${key}" ${action.elseChainKey === key ? "selected" : ""}>${escapeHtmlAttr(currentConfig.chains[key].name || key)}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.IF_HAS_SELECTION) {
    const otherChains = (currentConfig.chainOrder || Object.keys(currentConfig.chains)).filter((key) => currentConfig.chains[key] && key !== chainKey);
    return `
      <div class="mt-2">
        <div class="row g-2">
          <div class="col-md-7">
            <div class="form-text small mt-2">${t("hint_hasSelection", "若当前页面有选中文本则继续，并将选中文本作为 {{output}} 传递给后续动作。")}</div>
          </div>
          <div class="col-md-5">
            <label class="form-label small">${t("workflow_elseChain", "未选中时分支 (可选)")}:</label>
            <select class="form-select form-select-sm condition-else-select" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">${t("workflow_noElseChain", "（无 - 终止后续动作）")}</option>
              ${otherChains.map((key) => `<option value="${key}" ${action.elseChainKey === key ? "selected" : ""}>${escapeHtmlAttr(currentConfig.chains[key].name || key)}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.RUN_CHAIN) {
    const otherChains = (currentConfig.chainOrder || Object.keys(currentConfig.chains)).filter((key) => currentConfig.chains[key] && key !== chainKey);
    return `
      <div class="mt-2">
        <div class="row g-2 mb-2">
          <div class="col-md-7">
            <label class="form-label small">${t("label_runChain", "选择动作链")}:</label>
            <select class="form-select form-select-sm run-chain-select" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">${t("placeholder_selectChain", "-- 选择动作链 --")}</option>
              ${otherChains.map((key) => `<option value="${key}" ${action.chainKey === key ? "selected" : ""}>${escapeHtmlAttr(currentConfig.chains[key].name || key)}</option>`).join("")}
            </select>
          </div>
          <div class="col-md-5">
            <label class="form-label small">${t("workflow_elseChain", "出错备用链 (可选)")}:</label>
            <select class="form-select form-select-sm run-chain-else-select" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">${t("workflow_noElseChain", "（无 - 遇错停止）")}</option>
              ${otherChains.map((key) => `<option value="${key}" ${action.elseChainKey === key ? "selected" : ""}>${escapeHtmlAttr(currentConfig.chains[key].name || key)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-check form-switch mb-1">
          <input class="form-check-input run-chain-pass-check" type="checkbox" data-chain-key="${chainKey}" data-action-index="${index}" ${action.passOutput !== false ? "checked" : ""}>
          <label class="form-check-label small">${t("workflow_passOutput", "向下游传递输出数据（{{output}} / 选中文本）")}</label>
        </div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.EXTRACT_ALL_LINKS || action.type === ACTION_TYPES.EXTRACT_ALL_IMAGES) {
    return `
      <div class="mt-2">
        <div class="form-check form-switch">
          <input class="form-check-input extract-nocopy-check" type="checkbox" data-chain-key="${chainKey}" data-action-index="${index}" ${action.noCopy ? "checked" : ""}>
          <label class="form-check-label small">${t("label_noCopy", "不自动复制到剪贴板（结果交给后续动作处理）")}</label>
        </div>
        <div class="form-text small">${t("hint_extractNoCopy", "模板里把多个提取结果合并后再复制时勾选，避免中间结果先占一次剪贴板并弹出误导的「已复制」。")}</div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.OPEN_INCOGNITO_WINDOW) {
    return `
      <div class="mt-2">
        <div class="form-check form-switch">
          <input class="form-check-input incognito-current-check" type="checkbox" data-chain-key="${chainKey}" data-action-index="${index}" ${action.openCurrentUrl ? "checked" : ""}>
          <label class="form-check-label small">${t("label_incognitoCurrent", "在新窗口中打开当前网页")}</label>
        </div>
        <div class="form-text small">${t("hint_incognitoCurrent", "不勾选则只开一个空白无痕窗口。交接类动作链需要勾选，否则原标签关闭后页面就丢了。")}</div>
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
  } else if (action.type === ACTION_TYPES.OPEN_TOP_SITES) {
    return `
      <div class="mt-2">
        <label class="form-label small">${t("actionName_open_top_sites", "打开常用工作台站点")}:</label>
        <input type="number" class="form-control form-control-sm top-sites-count-input" min="1" max="20"
               value="${parseInt(action.count, 10) || 5}"
               data-chain-key="${chainKey}" data-action-index="${index}">
      </div>
    `;
  } else if (action.type === ACTION_TYPES.WAIT_FOR_NAVIGATION) {
    return `
      <div class="mt-2">
        <label class="form-label small">${t("label_delay", "延迟")}:</label>
        <div class="input-group input-group-sm">
          <input type="number" class="form-control form-control-sm wait-nav-timeout-input" min="500" max="60000" step="500"
                 value="${parseInt(action.timeoutMs, 10) || 10000}"
                 data-chain-key="${chainKey}" data-action-index="${index}">
          <span class="input-group-text">${t("label_ms", "毫秒")}</span>
        </div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.AI_SUMMARIZE) {
    return `
      <div class="mt-2">
        <div class="row g-2 mb-2">
          <div class="col-md-6">
            <label class="form-label small">${t("label_summaryLang", "总结语言")}:</label>
            <select class="form-select form-select-sm ai-summary-lang-select" data-chain-key="${chainKey}" data-action-index="${index}">
              ${generateLanguageOptions(action.summaryLang || "auto")}
            </select>
            <div class="form-text small">${t("hint_actionLangOverrides", "动作里指定了语言时会覆盖全局界面语言；选「自动」则跟随界面语言（见工具栏 CPU 图标的诊断）。")}</div>
          </div>
          <div class="col-md-6">
            <label class="form-label small">${t("label_summaryFormat", "总结形式")}:</label>
            <select class="form-select form-select-sm ai-summary-format-select" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="concise" ${(action.format || "concise") === "concise" ? "selected" : ""}>${t("opt_format_concise", "简明扼要")}</option>
              <option value="bullets" ${action.format === "bullets" ? "selected" : ""}>${t("opt_format_bullets", "要点列表 (Bullets)")}</option>
              <option value="detailed" ${action.format === "detailed" ? "selected" : ""}>${t("opt_format_detailed", "详细内容")}</option>
              <option value="one_sentence" ${action.format === "one_sentence" ? "selected" : ""}>${t("opt_format_oneSentence", "一句话概括")}</option>
            </select>
          </div>
        </div>
        <div class="form-check form-switch mb-2">
          <input class="form-check-input ai-summary-nocopy-check" type="checkbox" data-chain-key="${chainKey}" data-action-index="${index}" ${action.noCopy ? "checked" : ""}>
          <label class="form-check-label small">${t("label_noCopy", "不自动复制到剪贴板（结果交给后续动作处理）")}</label>
        </div>
        <div class="alert alert-info py-2 px-3 mb-0 small d-flex align-items-center gap-2">
          <i class="bi bi-cpu-fill flex-shrink-0 fs-5 text-info"></i>
          <div>
            <strong>${t("badge_requiresAi", "需浏览器内置 AI")}</strong>: ${t("hint_aiRequirement", "依赖 Chrome 内置 Gemini Nano (Prompt API)。需 Chrome 128+ 并在 chrome://flags 开启相关功能标志。")}
          </div>
        </div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.AI_EXPLAIN) {
    return `
      <div class="mt-2">
        <div class="row g-2 mb-2">
          <div class="col-md-6">
            <label class="form-label small">${t("label_explainLang", "解释语言")}:</label>
            <select class="form-select form-select-sm ai-explain-lang-select" data-chain-key="${chainKey}" data-action-index="${index}">
              ${generateLanguageOptions(action.explainLang || "auto")}
            </select>
            <div class="form-text small">${t("hint_actionLangOverrides", "动作里指定了语言时会覆盖全局界面语言；选「自动」则跟随界面语言（见工具栏 CPU 图标的诊断）。")}</div>
          </div>
          <div class="col-md-6">
            <label class="form-label small">${t("label_explainStyle", "解释风格")}:</label>
            <select class="form-select form-select-sm ai-explain-style-select" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="concise" ${(action.style || "concise") === "concise" ? "selected" : ""}>${t("opt_style_concise", "简明扼要")}</option>
              <option value="simple" ${action.style === "simple" ? "selected" : ""}>${t("opt_style_simple", "通俗浅显 (适合初学者)")}</option>
              <option value="technical" ${action.style === "technical" ? "selected" : ""}>${t("opt_style_technical", "深入原理 (技术细节)")}</option>
              <option value="analogy" ${action.style === "analogy" ? "selected" : ""}>${t("opt_style_analogy", "生动类比")}</option>
            </select>
          </div>
        </div>
        <div class="alert alert-info py-2 px-3 mb-0 small d-flex align-items-center gap-2">
          <i class="bi bi-cpu-fill flex-shrink-0 fs-5 text-info"></i>
          <div>
            <strong>${t("badge_requiresAi", "需浏览器内置 AI")}</strong>: ${t("hint_aiRequirement", "依赖 Chrome 内置 Gemini Nano (Prompt API)。需 Chrome 128+ 并在 chrome://flags 开启相关功能标志。")}
          </div>
        </div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.AI_TRANSLATE) {
    return `
      <div class="mt-2">
        <div class="row g-2 mb-2">
          <div class="col-md-6">
            <label class="form-label small">${t("label_targetLang", "目标语言")}:</label>
            <select class="form-select form-select-sm ai-target-lang-select" data-chain-key="${chainKey}" data-action-index="${index}">
              ${generateLanguageOptions(action.targetLang || "auto")}
            </select>
            <div class="form-text small">${t("hint_actionLangOverrides", "动作里指定了语言时会覆盖全局界面语言；选「自动」则跟随界面语言（见工具栏 CPU 图标的诊断）。")}</div>
          </div>
          <div class="col-md-6">
            <label class="form-label small">${t("label_translateStyle", "翻译风格")}:</label>
            <select class="form-select form-select-sm ai-translate-style-select" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="natural" ${(action.style || "natural") === "natural" ? "selected" : ""}>${t("opt_trans_natural", "自然流畅")}</option>
              <option value="formal" ${action.style === "formal" ? "selected" : ""}>${t("opt_trans_formal", "正式书面")}</option>
              <option value="literal" ${action.style === "literal" ? "selected" : ""}>${t("opt_trans_literal", "直译严谨")}</option>
            </select>
          </div>
        </div>
        <div class="alert alert-info py-2 px-3 mb-0 small d-flex align-items-center gap-2">
          <i class="bi bi-cpu-fill flex-shrink-0 fs-5 text-info"></i>
          <div>
            <strong>${t("badge_requiresAi", "需浏览器内置 AI")}</strong>: ${t("hint_aiRequirement", "依赖 Chrome 内置 Gemini Nano (Prompt API)。需 Chrome 128+ 并在 chrome://flags 开启相关功能标志。")}
          </div>
        </div>
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

// 版本号从 manifest 读，不硬编码 —— 否则又多一处发版时会忘记改的数字
function renderFooterVersion() {
  const el = document.getElementById("footerVersion");
  if (!el) return;
  try {
    el.textContent = chrome.runtime.getManifest().version;
  } catch (e) {
    el.parentElement.style.display = "none"; // 读不到就别显示占位符
  }
}

// Render actions help
function renderActionsHelp() {
  const actionsHelp = document.querySelector(".actions-help");
  if (!actionsHelp) return;

  // 用彩色磁贴而不是灰色药丸：动作磁贴的分类配色是卡片上的主要识别方式，
  // 这里正是学会「绿色=标签管理」的地方。列成灰底文字等于把这套编码扔掉。
  actionsHelp.innerHTML = Object.entries(ACTION_CATEGORIES)
    .map(([categoryId, actions]) => {
      const label = (ACTION_CATEGORY_LABELS[categoryId] && ACTION_CATEGORY_LABELS[categoryId]()) || categoryId;
      const color = CATEGORY_COLORS[categoryId] || "#64748b";
      return `
      <section class="help-group">
        <h6 class="help-group-title"><span class="help-dot" style="background:${color}" aria-hidden="true"></span>${label}</h6>
        <div class="help-actions">
            ${actions
              .map(
                (action) => `
              <span class="help-action">
                ${actionTile(action, "tiny")}
                <span>${(ACTION_NAMES[action] && ACTION_NAMES[action]()) || action}</span>
              </span>
            `
              )
              .join("")}
        </div>
      </section>
    `;
    })
    .join("");
}

// Execute chain
async function executeChain(chainKey) {
  try {
    // The background reads the chain from storage — flush pending edits first
    await flushSaveConfig();
    const me = await chrome.tabs.getCurrent();
    const res = await chrome.runtime.sendMessage({
      action: "executeChain",
      chainKey: chainKey,
      // This page is not a tab, so the background cannot infer the window from
      // the message; without it the run can fall back onto this page.
      windowId: me && me.windowId,
      expectWebTab: true,
    });
    const name = currentConfig.chains[chainKey].name;
    // No web page anywhere: say so rather than report a run the user cannot see.
    if (res && res.reason === "noWebTab") {
      showMessage(t("toast_noWebTarget", "没有可作用的网页：请先打开一个网页标签页再运行"), true);
      return;
    }
    if (res && res.success === false) {
      throw new Error(res.error || "unknown error");
    }
    showMessage(t("toast_chainExecuted", "已运行：$1", name));
  } catch (error) {
    console.error("Failed to execute chain:", error);
    showMessage(t("toast_executeFailed", "运行失败"), true);
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

// State for template gallery modal
let currentTemplateCategory = "all";
let templateSearchQuery = "";

// Render category filter tabs in the template gallery
function renderTemplateCategories() {
  const container = document.getElementById("templateCategoryFilters");
  if (!container) return;

  container.innerHTML = Object.entries(TEMPLATE_CATEGORIES)
    .map(([catKey, catInfo]) => {
      const label = t(catInfo.nameKey, catInfo.fallback);
      const isActive = currentTemplateCategory === catKey;
      return `
        <button type="button" class="category-filter-btn ${isActive ? "active" : ""}" data-category="${catKey}">
          <i class="bi ${catInfo.icon}" aria-hidden="true"></i>
          <span>${escapeHtmlAttr(label)}</span>
        </button>
      `;
    })
    .join("");
}

// Render cards in the template gallery modal
function renderTemplateGallery() {
  renderTemplateCategories();

  const container = document.getElementById("templateCardsContainer");
  const emptyState = document.getElementById("templateEmptyState");
  if (!container) return;

  const query = (templateSearchQuery || "").trim().toLowerCase();

  const filtered = CHAIN_TEMPLATES.filter((tpl) => {
    // 1. Category filter
    if (currentTemplateCategory !== "all" && tpl.category !== currentTemplateCategory) {
      return false;
    }

    // 2. Search keyword filter
    if (query) {
      const name = t(tpl.nameKey, tpl.fallback).toLowerCase();
      const desc = t(tpl.descKey, tpl.descFallback).toLowerCase();
      const catInfo = TEMPLATE_CATEGORIES[tpl.category];
      const catName = catInfo ? t(catInfo.nameKey, catInfo.fallback).toLowerCase() : "";

      // Check actions in template
      const actions = tpl.build();
      const actionNames = actions.map((a) => {
        const fn = ACTION_NAMES[a.type];
        return fn ? fn().toLowerCase() : a.type.toLowerCase();
      });

      const matches =
        name.includes(query) ||
        desc.includes(query) ||
        catName.includes(query) ||
        actionNames.some((an) => an.includes(query));

      if (!matches) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = "";
    if (emptyState) emptyState.classList.remove("d-none");
    return;
  }

  if (emptyState) emptyState.classList.add("d-none");

  container.innerHTML = filtered
    .map((tpl) => {
      const name = t(tpl.nameKey, tpl.fallback);
      const desc = t(tpl.descKey, tpl.descFallback);
      const catInfo = TEMPLATE_CATEGORIES[tpl.category];
      const catLabel = catInfo ? t(catInfo.nameKey, catInfo.fallback) : tpl.category;
      const actions = tpl.build();

      const actionFlowHtml = actions
        .map((act, idx) => {
          const actName = (ACTION_NAMES[act.type] && ACTION_NAMES[act.type]()) || act.type;
          const arrowHtml =
            idx < actions.length - 1
              ? `<i class="bi bi-chevron-right template-flow-arrow" aria-hidden="true"></i>`
              : "";
          return `
            <span class="template-flow-pill" title="${escapeHtmlAttr(actName)}">
              ${actionTile(act.type, "tiny")}
              <span>${escapeHtmlAttr(actName)}</span>
            </span>
            ${arrowHtml}
          `;
        })
        .join("");

      const countText = t("tmpl_gallery_actions_count", "$1 个动作", actions.length);
      const useText = t("tmpl_gallery_use", "使用此模板");

      return `
        <div class="col-md-6 col-lg-4">
          <div class="template-card" data-cat="${tpl.category}" data-template-key="${tpl.key}">
            <div class="template-card-top">
              <div class="template-card-icon">
                <i class="bi ${tpl.icon}" aria-hidden="true"></i>
              </div>
              <div class="d-flex align-items-center gap-1">
                <span class="template-badge-cat">
                  ${escapeHtmlAttr(catLabel)}
                </span>
                ${(tpl.requiresAi || tpl.category === "ai") ? `<span class="badge ai-chip"><i class="bi bi-cpu me-1" aria-hidden="true"></i>${escapeHtmlAttr(t("badge_requiresAi", "需浏览器内置 AI"))}</span>` : ""}
              </div>
            </div>
            <h5 class="template-card-title">${escapeHtmlAttr(name)}</h5>
            <p class="template-card-desc">${escapeHtmlAttr(desc)}</p>
            <div class="template-actions-flow">
              ${actionFlowHtml}
            </div>
            <div class="template-card-footer">
              <span class="template-card-count">
                <i class="bi bi-layers me-1" aria-hidden="true"></i>${escapeHtmlAttr(countText)}
              </span>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-primary btn-sm template-customize-btn" data-template-key="${tpl.key}" title="${escapeHtmlAttr(t("tmpl_gallery_add_and_edit", "添加并改参数"))}">
                  <i class="bi bi-pencil me-1" aria-hidden="true"></i>${escapeHtmlAttr(t("tmpl_gallery_add_and_edit", "添加并改参数"))}
                </button>
                <button type="button" class="btn btn-primary btn-sm template-add-btn template-use-btn" data-template-key="${tpl.key}" title="${escapeHtmlAttr(t("tmpl_gallery_add_direct", "直接添加"))}">
                  <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>${escapeHtmlAttr(t("tmpl_gallery_add_direct", "直接添加"))}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

// Backward-compatible alias
function populateTemplateMenu() {
  renderTemplateGallery();
}

// Create a new chain from a built-in template
async function addChainFromTemplate(templateKey, openEditor = false) {
  const template = CHAIN_TEMPLATES.find((tpl) => tpl.key === templateKey);
  if (!template) return;

  // Close gallery modal if open
  const modalEl = document.getElementById("templateGalleryModal");
  if (modalEl && window.bootstrap) {
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
  }

  const chainKey = `chain_${Date.now()}`;

  // 模板可以声明一条「伴侣链」(companion)：流水线编排 (nextChainKey / fallbackChainKey)
  // 和条件分支 (elseChainKey) 都需要第二条链才有意义，而链的 key 是运行时生成的，
  // 模板没法写死。所以模板里用 "@companion" 占位，这里换成真实 key。
  const companionKey = template.companion ? `chain_${Date.now() + 1}` : null;
  const resolveRef = (ref) => (ref === "@companion" ? companionKey : ref);

  const resolveActionRefs = (actions) =>
    actions.map((action) => {
      const next = { ...action };
      if (next.elseChainKey) next.elseChainKey = resolveRef(next.elseChainKey);
      if (next.chainKey) next.chainKey = resolveRef(next.chainKey);
      return next;
    });

  currentConfig.chains[chainKey] = {
    name: t(template.nameKey, template.fallback),
    description: t(template.descKey, template.descFallback),
    actions: resolveActionRefs(template.build(companionKey)),
  };
  // 只有模板真的声明了才写，避免给每条链都塞一个没用的字段
  if (template.passOutput !== undefined) currentConfig.chains[chainKey].passOutput = template.passOutput;
  if (template.nextChainKey) currentConfig.chains[chainKey].nextChainKey = resolveRef(template.nextChainKey);
  if (template.fallbackChainKey) currentConfig.chains[chainKey].fallbackChainKey = resolveRef(template.fallbackChainKey);

  const newKeys = [chainKey];
  if (template.companion) {
    currentConfig.chains[companionKey] = {
      name: t(template.companion.nameKey, template.companion.fallback),
      description: t(template.companion.descKey, template.companion.descFallback),
      actions: resolveActionRefs(template.companion.build()),
    };
    newKeys.push(companionKey);
  }

  if (!currentConfig.chainOrder) {
    currentConfig.chainOrder = Object.keys(currentConfig.chains);
  } else {
    currentConfig.chainOrder = [...newKeys, ...currentConfig.chainOrder];
  }

  await saveConfig();
  renderMainView();

  if (openEditor) {
    showMessage(t("toast_newChainAdded", "新链已添加"));
    setTimeout(() => {
      editChain(chainKey);
    }, 100);
  } else {
    showMessage(t("toast_newChainAdded", "新链已添加"), false, {
      label: t("toast_chainAdded_actionRun", "立即运行"),
      onClick: () => executeChain(chainKey),
    });
  }
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
    showMessage(t("toast_executeFailed", "运行失败"), true);
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
    showMessage(t("toast_executeFailed", "运行失败"), true);
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
  showMessage(t("toast_chainImported", "已导入动作链: $1", chainData.name));
}

// Import configuration from a JSON file (replaces the current configuration)
async function importConfig(file) {
  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    // Single-chain share file? Confirm then append.
    if (imported && imported.type === "hotkey-chain" && imported.chain) {
      const chainName = imported.chain && typeof imported.chain.name === "string" ? imported.chain.name : "?";
      if (!confirm(t("confirm_importChain", `导入动作链「${chainName}」？`, chainName))) return;
      await importSingleChain(imported.chain);
      return;
    }
    if (imported && !imported.chains && typeof imported.name === "string" && Array.isArray(imported.actions)) {
      if (!confirm(t("confirm_importChain", `导入动作链「${imported.name}」？`, imported.name))) return;
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
    showMessage(t("toast_importFailed", "导入失败: $1", error.message), true);
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

  const confirmed = await confirmInPage(t("confirm_deleteChain", "删除动作链「$1」？", chainName));
  if (!confirmed) return;

  // Kept so the toast can offer a real undo, including the workflow edges.
  const removed = {
    key: chainKey,
    chain: currentConfig.chains[chainKey],
    order: currentConfig.chainOrder ? [...currentConfig.chainOrder] : null,
    defaultChain: currentConfig.defaultChain,
  };

  delete currentConfig.chains[chainKey];

  // Clean up any workflow references to this deleted chain across all other chains
  for (const c of Object.values(currentConfig.chains)) {
    if (c.nextChainKey === chainKey) c.nextChainKey = undefined;
    if (c.fallbackChainKey === chainKey) c.fallbackChainKey = undefined;
    if (Array.isArray(c.actions)) {
      for (const act of c.actions) {
        if (act.chainKey === chainKey) act.chainKey = "";
        if (act.elseChainKey === chainKey) act.elseChainKey = undefined;
      }
    }
  }

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
  // "删除" alone reads as a button label, not as news; and the default chain may
  // have just moved, which changes what Ctrl+Shift+H does.
  const movedDefault = removed.defaultChain === removed.key && currentConfig.defaultChain !== removed.key;
  showMessage(
    t("toast_deletedChain", "已删除「$1」", removed.chain?.name || removed.key) +
      (movedDefault ? " · " + t("toast_defaultMoved", "默认链已改为 $1", currentConfig.chains[currentConfig.defaultChain]?.name || "") : ""),
    false,
    {
      label: t("toast_undo", "撤销"),
      onClick: () => {
        currentConfig.chains[removed.key] = removed.chain;
        if (removed.order) currentConfig.chainOrder = removed.order;
        currentConfig.defaultChain = removed.defaultChain;
        saveConfig();
        renderMainView();
      },
    }
  );
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

// Open Action Picker Modal
function openActionPicker(chainKey) {
  actionPickerTargetChainKey = chainKey;
  currentActionPickerCategory = "all";
  actionPickerSearchQuery = "";

  const searchInput = document.getElementById("actionPickerSearchInput");
  if (searchInput) {
    searchInput.value = "";
  }

  renderActionPickerCategories();
  renderActionPickerList();

  const modalEl = document.getElementById("actionPickerModal");
  if (modalEl && window.bootstrap) {
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
  }

  if (searchInput) {
    setTimeout(() => searchInput.focus(), 300);
  }
}

// Render category filter pills in Action Picker Modal
function renderActionPickerCategories() {
  const container = document.getElementById("actionPickerCategoryFilters");
  if (!container) return;

  const categories = [
    { id: "all", label: t("actionPicker_allCategories", "全部") },
    ...Object.keys(ACTION_CATEGORIES).map((catId) => ({
      id: catId,
      label: (ACTION_CATEGORY_LABELS[catId] && ACTION_CATEGORY_LABELS[catId]()) || catId,
    })),
  ];

  container.innerHTML = categories
    .map((cat) => {
      const isActive = currentActionPickerCategory === cat.id;
      return `<button type="button" class="category-filter-btn btn btn-sm ${
        isActive ? "active btn-primary" : "btn-outline-secondary"
      }" data-category="${cat.id}">${escapeHtmlAttr(cat.label)}</button>`;
    })
    .join("");
}

// Render actions inside Action Picker Modal grid
function renderActionPickerList() {
  const container = document.getElementById("actionPickerListContainer");
  const emptyState = document.getElementById("actionPickerEmptyState");
  if (!container) return;

  const query = (actionPickerSearchQuery || "").trim().toLowerCase();
  const matchingActions = [];

  for (const [catKey, actions] of Object.entries(ACTION_CATEGORIES)) {
    if (currentActionPickerCategory !== "all" && currentActionPickerCategory !== catKey) {
      continue;
    }

    const catLabel = (ACTION_CATEGORY_LABELS[catKey] && ACTION_CATEGORY_LABELS[catKey]()) || catKey;

    for (const actionType of actions) {
      const name = (ACTION_NAMES[actionType] && ACTION_NAMES[actionType]()) || actionType;
      if (query) {
        const matches =
          name.toLowerCase().includes(query) ||
          catLabel.toLowerCase().includes(query) ||
          actionType.toLowerCase().includes(query);
        if (!matches) continue;
      }

      matchingActions.push({
        type: actionType,
        name: name,
        catKey: catKey,
        catLabel: catLabel,
      });
    }
  }

  if (matchingActions.length === 0) {
    container.innerHTML = "";
    if (emptyState) emptyState.classList.remove("d-none");
    return;
  }

  if (emptyState) emptyState.classList.add("d-none");

  container.innerHTML = matchingActions
    .map((item) => {
      const isAi =
        item.type === ACTION_TYPES.AI_SUMMARIZE ||
        item.type === ACTION_TYPES.AI_EXPLAIN ||
        item.type === ACTION_TYPES.AI_TRANSLATE;
      const aiBadge = isAi
        ? `<span class="badge ai-chip ms-auto me-2"><i class="bi bi-cpu me-1" aria-hidden="true"></i>${escapeHtmlAttr(t("badge_requiresAi", "需浏览器内置 AI"))}</span>`
        : "";
      return `
        <div class="action-picker-item" data-action-type="${escapeHtmlAttr(item.type)}" role="button" tabindex="0" title="${escapeHtmlAttr(item.name)}">
          ${actionTile(item.type, "tiny")}
          <span class="action-picker-name">${escapeHtmlAttr(item.name)}</span>
          ${aiBadge}
          <span class="action-picker-cat">${escapeHtmlAttr(item.catLabel)}</span>
        </div>
      `;
    })
    .join("");
}

// Add chosen action to the target chain
async function addActionToChain(chainKey, actionType) {
  if (!currentConfig.chains || !currentConfig.chains[chainKey]) return;

  const newAction = {
    type: actionType,
    delay: 200,
  };

  if (actionType === ACTION_TYPES.CALL_EXTENSION) {
    newAction.extensionId = "";
    newAction.message = {};
  } else if (actionType === ACTION_TYPES.EXECUTE_COMMAND) {
    newAction.command = "";
    newAction.extensionId = chrome?.runtime?.id || "";
  } else if (actionType === ACTION_TYPES.OPEN_URL) {
    newAction.url = "";
  } else if (actionType === ACTION_TYPES.SHOW_NOTIFICATION) {
    newAction.text = "";
  } else if (actionType === ACTION_TYPES.COPY_TEXT) {
    newAction.text = "{title}\n{url}";
  } else if (actionType === ACTION_TYPES.CONFIRM) {
    newAction.text = t("confirm_defaultText", "确定要继续吗？");
  } else if (actionType === ACTION_TYPES.OPEN_BROWSER_PAGE) {
    newAction.page = "downloads";
  } else if (actionType === ACTION_TYPES.IF_URL_MATCHES) {
    newAction.pattern = "";
  } else if (actionType === ACTION_TYPES.RUN_CHAIN) {
    newAction.chainKey = "";
  } else if (actionType === ACTION_TYPES.AI_TRANSLATE) {
    newAction.targetLang = "auto";
    newAction.style = "natural";
  } else if (actionType === ACTION_TYPES.AI_SUMMARIZE) {
    newAction.summaryLang = "auto";
    newAction.format = "concise";
  } else if (actionType === ACTION_TYPES.AI_EXPLAIN) {
    newAction.explainLang = "auto";
    newAction.style = "concise";
  } else if (actionType === ACTION_TYPES.SPEAK_TEXT) {
    newAction.text = "{output}";
    newAction.lang = "auto";
    newAction.rate = 1.0;
  } else if (actionType === ACTION_TYPES.SPEAK_SELECTION) {
    newAction.lang = "auto";
    newAction.rate = 1.0;
    newAction.preferOutput = true;
  } else if (actionType === ACTION_TYPES.TRANSLATE_PAGE) {
    newAction.targetLang = "auto";
  } else if (actionType === ACTION_TYPES.SEARCH_SELECTION) {
    newAction.preferOutput = false;
  }

  currentConfig.chains[chainKey].actions.push(newAction);
  await saveConfig();

  // Close picker modal
  const modalEl = document.getElementById("actionPickerModal");
  if (modalEl && window.bootstrap) {
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
  }

  if (editingChainId === chainKey) {
    renderChainEdit(chainKey);
    // Smoothly scroll to the newly appended action card and trigger highlight pulse
    setTimeout(() => {
      const actionsList = document.getElementById("chainEditConfig");
      if (actionsList && actionsList.lastElementChild) {
        actionsList.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" });
        actionsList.lastElementChild.classList.add("action-highlight");
        setTimeout(() => {
          actionsList.lastElementChild?.classList.remove("action-highlight");
        }, 1200);
      }
    }, 100);
  }

  const actionName = (ACTION_NAMES[actionType] && ACTION_NAMES[actionType]()) || actionType;
  showMessage(`${t("actions_add", "添加动作")}: ${actionName}`);
}

// Add action entry point — opens action picker modal
async function addAction(chainKey) {
  openActionPicker(chainKey);
}

// Remove action from chain
async function removeAction(chainKey, actionIndex) {
  const chain = currentConfig.chains[chainKey];
  const [taken] = chain.actions.splice(actionIndex, 1);
  await saveConfig();

  // Re-render the entire chain edit view to immediately show the changes
  if (editingChainId === chainKey) {
    renderChainEdit(chainKey);
  }

  const name = (ACTION_NAMES[taken.type] && ACTION_NAMES[taken.type]()) || taken.type;
  showMessage(t("toast_removedAction", "已移除动作「$1」", name), false, {
    label: t("toast_undo", "撤销"),
    onClick: () => {
      chain.actions.splice(Math.min(actionIndex, chain.actions.length), 0, taken);
      saveConfig();
      if (editingChainId === chainKey) renderChainEdit(chainKey);
    },
  });
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

  // If switching to a text-carrying action, initialize the text field.
  // copy_text and confirm start from a usable default so an untouched action
  // still does something sensible.
  if (newType === ACTION_TYPES.SHOW_NOTIFICATION) {
    if (!action.text) action.text = "";
  }
  if (newType === ACTION_TYPES.COPY_TEXT) {
    if (!action.text) action.text = "{title}\n{url}";
  }
  if (newType === ACTION_TYPES.CONFIRM) {
    if (!action.text) action.text = t("confirm_defaultText", "确定要继续吗？");
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

  if (newType === ACTION_TYPES.AI_TRANSLATE) {
    if (!action.targetLang) action.targetLang = "auto";
    if (!action.style) action.style = "natural";
  }
  if (newType === ACTION_TYPES.AI_SUMMARIZE) {
    if (!action.summaryLang) action.summaryLang = "auto";
    if (!action.format) action.format = "concise";
  }
  if (newType === ACTION_TYPES.AI_EXPLAIN) {
    if (!action.explainLang) action.explainLang = "auto";
    if (!action.style) action.style = "concise";
  }
  if (newType === ACTION_TYPES.SPEAK_TEXT) {
    if (!action.text) action.text = "{output}";
    if (!action.lang) action.lang = "auto";
    if (action.rate === undefined) action.rate = 1.0;
  }
  if (newType === ACTION_TYPES.SPEAK_SELECTION) {
    if (!action.lang) action.lang = "auto";
    if (action.rate === undefined) action.rate = 1.0;
    if (action.preferOutput === undefined) action.preferOutput = true;
  }
  if (newType === ACTION_TYPES.TRANSLATE_PAGE) {
    if (!action.targetLang) action.targetLang = "auto";
  }
  if (newType === ACTION_TYPES.SEARCH_SELECTION) {
    if (action.preferOutput === undefined) action.preferOutput = false;
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

      showMessage(t("toast_extensionsRefreshed", "已刷新 $1 个扩展", extensions.length));
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
function showMessage(text, isError = false, action = null) {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    // Bottom-right: top-right is where the primary buttons live, and the toast
    // used to swallow them for its whole 3s.
    toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3";
    toastContainer.style.zIndex = "1055";
    document.body.appendChild(toastContainer);
  }

  // Create toast
  const toastId = "toast-" + Date.now();
  const actionBtnHtml =
    action && action.label
      ? `<button type="button" class="btn btn-sm toast-action-btn ms-2 px-2 py-1">${escapeHtmlAttr(action.label)}</button>`
      : "";

  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center ${isError ? "text-bg-danger" : "text-bg-success"} border-0" role="alert">
      <div class="d-flex align-items-center">
        <div class="toast-body d-flex align-items-center flex-grow-1">
          <i class="bi ${isError ? "bi-exclamation-triangle" : "bi-check-circle"} me-2"></i>
          <span>${escapeHtmlAttr(text)}</span>
          ${actionBtnHtml}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHtml);

  // Initialize and show toast
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, {
    delay: action ? 4500 : 3000,
  });

  if (action && typeof action.onClick === "function") {
    const actionBtn = toastElement.querySelector(".toast-action-btn");
    if (actionBtn) {
      actionBtn.addEventListener("click", () => {
        try {
          action.onClick();
        } catch (e) {
          console.error("Toast action callback failed:", e);
        }
        toast.hide();
      });
    }
  }

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
