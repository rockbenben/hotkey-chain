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
  FOCUS_ADDRESS_BAR: "focus_address_bar",
  CALL_EXTENSION: "call_extension",
  EXECUTE_COMMAND: "execute_command",
  CLEAR_CACHE: "clear_cache",
  DUPLICATE_TAB: "duplicate_tab",
  PIN_TAB: "pin_tab",
};

// Build default configuration (with i18n names)
function createDefaultConfig() {
  return {
    defaultChain: "chain_1",
    chains: {
      // 阅读模式：回到顶部 → 放大 ×2 → 全屏
      chain_1: {
        name: t("defaultChain_reading", "Reading mode"),
        actions: [
          { type: ACTION_TYPES.SCROLL_TO_TOP, delay: 0 },
          { type: ACTION_TYPES.ZOOM_IN, delay: 200 },
          { type: ACTION_TYPES.ZOOM_IN, delay: 200 },
          { type: ACTION_TYPES.FULLSCREEN, delay: 0 },
        ],
      },
      // 标签工具：复制标签页 → 固定/取消固定 → 新建标签页
      chain_2: {
        name: t("defaultChain_tabTools", "Tab tools"),
        actions: [
          { type: ACTION_TYPES.DUPLICATE_TAB, delay: 0 },
          { type: ACTION_TYPES.PIN_TAB, delay: 200 },
          { type: ACTION_TYPES.NEW_TAB, delay: 200 },
        ],
      },
      // 快速收藏：复制 URL → 加入书签（剪贴板保留 URL）
      chain_3: {
        name: t("defaultChain_quickBookmark", "Quick bookmark"),
        actions: [
          { type: ACTION_TYPES.COPY_URL, delay: 0 },
          { type: ACTION_TYPES.BOOKMARK, delay: 200 },
        ],
      },
      // 强制刷新：清缓存并刷新当前站点
      chain_4: {
        name: t("defaultChain_devRefresh", "Dev hard refresh"),
        actions: [{ type: ACTION_TYPES.CLEAR_CACHE, delay: 0 }],
      },
      // 命令演示：展示如何执行扩展命令（以本扩展为例）
      chain_5: {
        name: t("defaultChain_commandDemo", "Command demo"),
        actions: [
          // 选择并执行本扩展的某个命令作为示例，例如执行链1
          { type: ACTION_TYPES.EXECUTE_COMMAND, delay: 0, extensionId: chrome.runtime.id, command: "execute_chain_1" },
        ],
      },
    },
  };
}

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

  // Add generic chain execution options
  chrome.contextMenus.create({
    id: "execute-chain_1",
    title: t("menu_executeChain", "Execute chain 1", ["1"]),
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "execute-chain_2",
    title: t("menu_executeChain", "Execute chain 2", ["2"]),
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "execute-chain_3",
    title: t("menu_executeChain", "Execute chain 3", ["3"]),
    contexts: ["action"],
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
}

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  // Set default configuration if not exists
  const result = await chrome.storage.sync.get(["hotkeyChainConfig"]);
  if (!result.hotkeyChainConfig) {
    await chrome.storage.sync.set({ hotkeyChainConfig: createDefaultConfig() });
    console.log("Hotkey Chain: Default configuration set");
  }
  await loadLocaleOverrideCache();
  await buildContextMenus();
});

chrome.runtime.onStartup.addListener(async () => {
  await loadLocaleOverrideCache();
  await buildContextMenus();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.localeOverride) {
    loadLocaleOverrideCache()
      .then(buildContextMenus)
      .catch(() => {});
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "hotkey-chain-execute-default") {
    await executeDefaultChain();
  } else if (info.menuItemId === "hotkey-chain-options") {
    // Open options page
    chrome.runtime.openOptionsPage();
  } else if (info.menuItemId.startsWith("execute-")) {
    const chainKey = info.menuItemId.replace("execute-", "");
    await executeChain(chainKey);
  }
});

// Handle command events (hotkeys)
chrome.commands.onCommand.addListener(async (command) => {
  console.log("Command received:", command);

  if (command === "_execute_action") {
    // Execute default chain
    await executeDefaultChain();
  } else if (command.startsWith("execute_chain_")) {
    // Execute specific chain
    const chainNumber = command.split("_")[2];
    await executeChain(`chain_${chainNumber}`);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log("Extension icon clicked");
  await executeDefaultChain();
});

// Execute default chain
async function executeDefaultChain() {
  const config = await getConfig();
  const defaultChainKey = config.defaultChain;
  await executeChain(defaultChainKey);
}

// Execute specific chain
async function executeChain(chainKey) {
  try {
    const config = await getConfig();
    const chain = config.chains[chainKey];

    if (!chain) {
      console.error(`Chain ${chainKey} not found`);
      return;
    }

    console.log(`Executing chain: ${chain.name}`);

    // Get active tab and ensure window/tab focused
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
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

    // Execute actions sequentially with delays
    for (let i = 0; i < chain.actions.length; i++) {
      const action = chain.actions[i];

      if (action.delay > 0 && i > 0) {
        await sleep(action.delay);
      }

      await executeAction(activeTab, action);
    }

    console.log(`Chain ${chain.name} execution completed`);
  } catch (error) {
    console.error("Error executing chain:", error);
  }
}

// Execute individual action
async function executeAction(tab, action) {
  try {
    switch (action.type) {
      case ACTION_TYPES.SCROLL_TO_TOP:
      case ACTION_TYPES.SCROLL_TO_BOTTOM:
      case ACTION_TYPES.COPY_URL:
      case ACTION_TYPES.COPY_TITLE:
      case ACTION_TYPES.FULLSCREEN:
        // These actions need to be executed in content script
        await chrome.tabs.sendMessage(tab.id, { action: action.type });
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

      case ACTION_TYPES.BOOKMARK:
        await chrome.bookmarks.create({
          title: tab.title,
          url: tab.url,
        });
        break;

      case ACTION_TYPES.FOCUS_ADDRESS_BAR:
        // This requires additional permissions or different approach
        console.log("Focus address bar action - requires manual implementation");
        break;

      case ACTION_TYPES.OPEN_DEVTOOLS:
        // Use chrome.debugger to open devtools (requires debugger permission)
        // For now, we'll try to inject a script that calls console methods
        await chrome.tabs.sendMessage(tab.id, { action: ACTION_TYPES.OPEN_DEVTOOLS });
        break;

      case ACTION_TYPES.FIND_IN_PAGE:
        // Trigger browser's find functionality
        await chrome.tabs.sendMessage(tab.id, { action: ACTION_TYPES.FIND_IN_PAGE });
        break;

      case ACTION_TYPES.SELECT_ALL:
        // Select all content on the page
        await chrome.tabs.sendMessage(tab.id, { action: ACTION_TYPES.SELECT_ALL });
        break;

      case ACTION_TYPES.PAGE_TOP:
        // Quick jump to top
        await chrome.tabs.sendMessage(tab.id, { action: ACTION_TYPES.PAGE_TOP });
        break;

      case ACTION_TYPES.CALL_EXTENSION:
        // 尝试调用其他扩展
        if (action.extensionId && action.message) {
          try {
            await chrome.runtime.sendMessage(action.extensionId, action.message);
            console.log("Extension call sent:", action.extensionId, action.message);
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
                // 避免递归调用：如果当前正在执行默认链，则跳过
                console.log("Skipping _execute_action to avoid recursion");
              } else if (action.command.startsWith("execute_chain_")) {
                const chainNumber = action.command.split("_")[2];
                await executeChain(`chain_${chainNumber}`);
              } else {
                console.log("Unknown command:", action.command);
              }
            } else {
              // 处理其他扩展的命令，传递按键序列
              await executeExtensionCommand(action.extensionId, action.command, tab, action.keySequence);
            }
            console.log("Command executed:", action.command);
          } catch (error) {
            console.warn("Command execution failed:", error);
          }
        }
        break;

      case ACTION_TYPES.CLEAR_CACHE:
        // 清除当前站点的缓存
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if ("caches" in window) {
              caches.keys().then((names) => {
                names.forEach((name) => caches.delete(name));
              });
            }
            // 硬刷新页面
            location.reload(true);
          },
        });
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

    console.log(`Action executed: ${action.type}`);
  } catch (error) {
    console.error(`Error executing action ${action.type}:`, error);
  }
}

// Execute command for other extensions
async function executeExtensionCommand(extensionId, command, tab, keySequence = null) {
  try {
    console.log(`Executing command "${command}" for extension: ${extensionId}`);

    switch (command) {
      case "toggle_enabled":
        // 切换扩展的启用状态 (chrome.management.setEnabled)
        try {
          const extension = await chrome.management.get(extensionId);
          const newEnabled = !extension.enabled;
          await chrome.management.setEnabled(extensionId, newEnabled);

          await chrome.tabs.sendMessage(tab.id, {
            action: "show_extension_notification",
            extensionName: extension.name,
            message: t("msg_extension_toggled", `${extension.name} ${newEnabled ? "enabled" : "disabled"}`, [
              extension.name,
              newEnabled ? t("state_enabled", "enabled") : t("state_disabled", "disabled"),
            ]),
            isError: false,
          });
          console.log(`Extension ${extension.name} ${newEnabled ? "enabled" : "disabled"}`);
        } catch (error) {
          console.error("Failed to toggle extension:", error);
          await chrome.tabs.sendMessage(tab.id, {
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

          await chrome.tabs.sendMessage(tab.id, {
            action: "show_extension_notification",
            extensionName: extension.name,
            message: t("msg_uninstall_requested", `${extension.name} uninstall requested`, [extension.name]),
            isError: false,
          });
          console.log(`Uninstall requested for extension: ${extension.name}`);
        } catch (error) {
          console.error("Failed to uninstall extension:", error);
          await chrome.tabs.sendMessage(tab.id, {
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
            console.log(`Opened options for ${extension.name}`);
          } else {
            await chrome.tabs.sendMessage(tab.id, {
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
          console.log(`Opened extension details for ${extension.name}`);
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

          console.log(`Sending extension info to tab ${tab.id}:`, info);

          try {
            await chrome.tabs.sendMessage(tab.id, {
              action: "show_extension_info_modal",
              extensionName: extension.name,
              extensionInfo: info,
            });
            console.log(`Successfully sent extension info for: ${extension.name}`);
          } catch (messageError) {
            console.error("Failed to send message to content script:", messageError);
            // 备用方案：显示简单通知
            try {
              await chrome.tabs.sendMessage(tab.id, {
                action: "show_extension_notification",
                extensionName: extension.name,
                message: t("msg_check_console_for_details", `${extension.name} details: check console`, [extension.name]),
                isError: false,
              });
              console.log("Extension info:", info);
            } catch (fallbackError) {
              console.error("Fallback notification also failed:", fallbackError);
            }
          }
        } catch (error) {
          console.error("Failed to get extension info:", error);
          try {
            await chrome.tabs.sendMessage(tab.id, {
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
            console.log(`Opened homepage for ${extension.name}`);
          } else {
            await chrome.tabs.sendMessage(tab.id, {
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

            await chrome.tabs.sendMessage(tab.id, {
              action: "show_extension_notification",
              extensionName: extension.name,
              message: t("msg_dev_extension_reloaded", `Dev extension ${extension.name} reloaded`, [extension.name]),
              isError: false,
            });
            console.log(`Reloaded dev extension: ${extension.name}`);
          } else {
            await chrome.tabs.sendMessage(tab.id, {
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
            await chrome.tabs.sendMessage(tab.id, {
              action: "show_extension_notification",
              extensionName: extension.name,
              message: t("msg_app_launched", `App ${extension.name} launched`, [extension.name]),
              isError: false,
            });
            console.log(`Launched app: ${extension.name}`);
          } else {
            await chrome.tabs.sendMessage(tab.id, {
              action: "show_extension_notification",
              extensionName: extension.name,
              message: t("msg_not_chrome_app", `${extension.name} is not a Chrome app`, [extension.name]),
              isError: true,
            });
          }
        } catch (error) {
          console.error("Failed to launch app:", error);
          await chrome.tabs.sendMessage(tab.id, {
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
          const storeUrl = `https://chrome.google.com/webstore/detail/${extensionId}`;
          await chrome.tabs.create({ url: storeUrl });
          console.log(`Opened store page for ${extension.name}`);
        } catch (error) {
          console.error("Failed to open store page:", error);
        }
        break;

      default:
        // 未知命令
        console.log(`Unknown command: ${command}`);
        try {
          await chrome.tabs.sendMessage(tab.id, {
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
      await chrome.tabs.sendMessage(tab.id, {
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
  const result = await chrome.storage.sync.get(["hotkeyChainConfig"]);
  return result.hotkeyChainConfig || createDefaultConfig();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Message handler for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getConfig") {
    getConfig().then((config) => sendResponse(config));
    return true; // Keep message channel open
  } else if (request.action === "saveConfig") {
    chrome.storage.sync.set({ hotkeyChainConfig: request.config }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === "executeChain") {
    executeChain(request.chainKey).then(() => {
      sendResponse({ success: true });
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
      // 获取当前扩展的实际命令，并用覆盖语言重写名称/描述
      const allCommands = await chrome.commands.getAll();
      return allCommands.map((cmd) => {
        const name = cmd.name || "";
        let key = null;
        let args = [];
        if (name === "_execute_action") {
          key = "cmd_execute_action";
        } else {
          const m = name.match(/^execute_chain_(\d+)/);
          if (m) {
            key = `cmd_execute_chain_${m[1]}`;
          }
        }
        const fallback = cmd.description || name;
        const localized = key ? t(key, fallback, args) : fallback;
        return {
          name: localized,
          command: name,
          description: localized,
          shortcut: cmd.shortcut || "",
        };
      });
    } else {
      // 对于其他扩展，提供Chrome Management API支持的实际操作
      const extensions = await chrome.management.getAll();
      const targetExt = extensions.find((ext) => ext.id === extensionId);
      if (targetExt) {
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

        // 9. 打开扩展商店页面
        if (targetExt.updateUrl && targetExt.updateUrl.includes("chrome.google.com")) {
          const storeId = targetExt.id;
          commands.push({
            name: t("cmd_open_store_name", "Open store page"),
            command: "open_store_page",
            description: t("cmd_open_store_desc", `View ${targetExt.name} in Chrome Web Store`, [targetExt.name]),
            shortcut: "",
          });
        }

        return commands;
      }
    }
    return [];
  } catch (error) {
    console.error("Failed to get extension commands:", error);
    return [];
  }
}

// Get all extension commands
async function getAllExtensionCommands() {
  try {
    const allCommands = {};

    // 获取当前扩展的实际命令
    const currentCommands = await chrome.commands.getAll();
    allCommands[chrome.runtime.id] = {
      name: "Hotkey Chain",
      commands: currentCommands.map((cmd) => ({
        name: cmd.description || cmd.name,
        command: cmd.name,
        description: cmd.description,
        shortcut: cmd.shortcut || "",
      })),
    };

    // 获取其他扩展信息并生成推测的命令
    const extensions = await chrome.management.getAll();
    for (const ext of extensions) {
      if (ext.enabled && ext.id !== chrome.runtime.id && ext.type === "extension") {
        const commands = await getExtensionCommands(ext.id);
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

console.log("Hotkey Chain Extension: Background script loaded");
