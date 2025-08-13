// Content Script for Hotkey Chain Extension

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const action = request.action;

  try {
    switch (action) {
      case "scroll_to_top":
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;

      case "scroll_to_bottom":
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        break;

      case "copy_url":
        copyToClipboard(window.location.href);
        showNotification("URL copied to clipboard");
        break;

      case "copy_title":
        copyToClipboard(document.title);
        showNotification("Title copied to clipboard");
        break;

      case "toggle_fullscreen":
        toggleFullscreen();
        break;

      case "open_devtools":
        openDevTools();
        break;

      case "find_in_page":
        triggerFindInPage();
        break;

      case "select_all":
        selectAllContent();
        break;

      case "page_top":
        window.scrollTo({ top: 0, behavior: "smooth" });
        showNotification("已跳转到页面顶部");
        break;

      case "page_bottom":
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        showNotification("已跳转到页面底部");
        break;

      case "select_text_for_translation":
        // 为翻译扩展准备文本选择
        selectTextForTranslation();
        break;

      case "show_extension_notification":
        // 显示扩展激活通知
        showNotification(request.message || `已尝试激活扩展: ${request.extensionName}`, request.isError || false);
        break;

      case "show_extension_info_modal":
        // 显示扩展详细信息模态框
        showExtensionInfoModal(request.extensionName, request.extensionInfo);
        break;

      case "simulate_keyboard_shortcut":
        // 模拟键盘快捷键
        simulateKeyboardShortcut(request.keySequence);
        break;

      default:
        console.warn(`Unknown content script action: ${action}`);
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error(`Error executing content script action ${action}:`, error);
    sendResponse({ success: false, error: error.message });
  }
});

// Copy text to clipboard
async function copyToClipboard(text) {
  try {
    // 尝试使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      console.log("Successfully copied using Clipboard API");
    } else {
      // 使用传统方法作为备用
      await fallbackCopyToClipboard(text);
      console.log("Successfully copied using fallback method");
    }
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    // 再次尝试备用方法
    try {
      await fallbackCopyToClipboard(text);
      console.log("Successfully copied using secondary fallback");
    } catch (fallbackError) {
      console.error("All copy methods failed:", fallbackError);
      showNotification("复制失败，请手动复制", true);
    }
  }
}

// 备用复制方法
async function fallbackCopyToClipboard(text) {
  return new Promise((resolve, reject) => {
    // 创建临时文本区域
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // 设置样式以确保不可见
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";
    textArea.style.zIndex = "-1";

    document.body.appendChild(textArea);

    try {
      textArea.focus();
      textArea.select();

      // 尝试使用 execCommand
      const successful = document.execCommand("copy");

      if (successful) {
        resolve();
      } else {
        reject(new Error("execCommand failed"));
      }
    } catch (error) {
      reject(error);
    } finally {
      textArea.remove();
    }
  });
}

// Toggle fullscreen mode
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    // Enter fullscreen
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  } else {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

// Show notification
function showNotification(message, isError = false, duration = 2500) {
  // Create notification element
  const notification = document.createElement("div");
  notification.textContent = message;

  const backgroundColor = isError ? "#dc3545" : "#333";
  const textColor = isError ? "#fff" : "#fff";

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${backgroundColor};
    color: ${textColor};
    padding: 12px 20px;
    border-radius: 6px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: opacity 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;

  document.body.appendChild(notification);

  // Remove notification after specified duration
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}

console.log("Hotkey Chain Extension: Content script loaded");
function openDevTools() {
  console.log("Content script: Attempting to open DevTools");

  // Method 1: Try to focus on console (some sites might have console access)
  try {
    if (window.console && window.console.log) {
      // Create a distinctive log entry that user can see
      console.group("🔧 Hotkey Chain - DevTools Opened");
      console.log("DevTools access requested at:", new Date().toLocaleTimeString());
      console.log("Page URL:", window.location.href);
      console.log("Page Title:", document.title);
      console.groupEnd();
    }
  } catch (e) {
    console.warn("Console access failed:", e);
  }

  // Method 2: Try to trigger a debugger statement (only works if DevTools is already open)
  try {
    // Only trigger debugger in development
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.protocol === "file:") {
      debugger; // This will pause execution if DevTools is open
    }
  } catch (e) {
    console.warn("Debugger trigger failed:", e);
  }

  // Method 3: Show notification to user
  showNotification("🔧 DevTools功能已触发 - 请手动按F12打开", 3000);
}

// Trigger find in page functionality
function triggerFindInPage() {
  console.log("Content script: Triggering find in page");

  // Try to focus on search elements that might exist
  const searchSelectors = ['input[type="search"]', 'input[name="search"]', 'input[placeholder*="search" i]', 'input[placeholder*="搜索" i]', ".search-input", "#search", "[data-search]"];

  let foundSearchBox = false;
  for (const selector of searchSelectors) {
    const searchBox = document.querySelector(selector);
    if (searchBox) {
      searchBox.focus();
      searchBox.select();
      showNotification(`已聚焦搜索框: ${selector}`);
      foundSearchBox = true;
      break;
    }
  }

  if (!foundSearchBox) {
    // Show instruction for manual search
    showNotification("💡 请手动按 Ctrl+F 搜索页面内容", 3000);
  }
}

// Select all content
function selectAllContent() {
  console.log("Content script: Selecting all content");

  try {
    // Method 1: Try using Selection API
    const selection = window.getSelection();
    const range = document.createRange();

    // Select the main content area if possible
    const contentSelectors = ["main", "article", ".content", ".post-content", ".entry-content", "body"];

    let targetElement = document.body;
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        targetElement = element;
        break;
      }
    }

    range.selectNodeContents(targetElement);
    selection.removeAllRanges();
    selection.addRange(range);

    showNotification(`已选择全部内容 (${targetElement.tagName})`);
  } catch (e) {
    console.warn("Select all failed:", e);
    showNotification("选择全部内容失败，请手动按 Ctrl+A");
  }
}

// Select text for translation extensions
function selectTextForTranslation() {
  console.log("Content script: Selecting text for translation");

  try {
    // 如果页面上有已选择的文本，保持不变
    const selection = window.getSelection();
    if (selection.toString().trim().length > 0) {
      showNotification("已有选中文本，可进行翻译");
      return;
    }

    // 否则尝试选择页面主要内容
    const mainContentSelectors = ["main", "article", ".content", ".main-content", "#content", "#main", ".post-content", ".entry-content"];

    let contentElement = null;
    for (const selector of mainContentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }

    // 如果找不到主要内容，选择body的第一个段落或文本节点
    if (!contentElement) {
      const paragraphs = document.querySelectorAll("p, div, span");
      for (const p of paragraphs) {
        if (p.textContent.trim().length > 20) {
          contentElement = p;
          break;
        }
      }
    }

    if (contentElement) {
      const range = document.createRange();
      range.selectNodeContents(contentElement);
      selection.removeAllRanges();
      selection.addRange(range);
      showNotification("已选择页面内容，可进行翻译");
    } else {
      // 最后备选：选择页面标题
      const title = document.querySelector("h1, h2, title");
      if (title) {
        const range = document.createRange();
        range.selectNodeContents(title);
        selection.removeAllRanges();
        selection.addRange(range);
        showNotification("已选择页面标题");
      }
    }
  } catch (error) {
    console.error("Failed to select text for translation:", error);
    showNotification("文本选择失败");
  }
}

// Simulate keyboard shortcut
function simulateKeyboardShortcut(keySequence) {
  console.log("Content script: Simulating keyboard shortcut:", keySequence);

  if (!keySequence) {
    showNotification("无效的快捷键序列", true);
    return;
  }

  try {
    // 解析按键序列，例如 "Ctrl+Shift+L"
    const keys = keySequence.split("+").map((key) => key.trim());
    const modifiers = {
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    };

    let mainKey = "";

    // 识别修饰键和主键
    keys.forEach((key) => {
      const lowerKey = key.toLowerCase();
      switch (lowerKey) {
        case "ctrl":
        case "control":
          modifiers.ctrlKey = true;
          break;
        case "shift":
          modifiers.shiftKey = true;
          break;
        case "alt":
          modifiers.altKey = true;
          break;
        case "meta":
        case "cmd":
        case "command":
          modifiers.metaKey = true;
          break;
        default:
          mainKey = key;
          break;
      }
    });

    if (!mainKey) {
      showNotification("无法识别主按键", true);
      return;
    }

    // 创建键盘事件
    const keyCode = getKeyCode(mainKey);
    const eventOptions = {
      key: mainKey,
      code: `Key${mainKey.toUpperCase()}`,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
      ...modifiers,
    };

    // 发送keydown事件
    const keydownEvent = new KeyboardEvent("keydown", eventOptions);
    document.dispatchEvent(keydownEvent);

    // 发送keyup事件
    const keyupEvent = new KeyboardEvent("keyup", eventOptions);
    document.dispatchEvent(keyupEvent);

    showNotification(`已模拟快捷键: ${keySequence}`);
    console.log("Successfully simulated keyboard shortcut:", keySequence);
  } catch (error) {
    console.error("Failed to simulate keyboard shortcut:", error);
    showNotification(`快捷键模拟失败: ${keySequence}`, true);
  }
}

// Get key code for a key
function getKeyCode(key) {
  const keyCodes = {
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 80,
    q: 81,
    r: 82,
    s: 83,
    t: 84,
    u: 85,
    v: 86,
    w: 87,
    x: 88,
    y: 89,
    z: 90,
    1: 49,
    2: 50,
    3: 51,
    4: 52,
    5: 53,
    6: 54,
    7: 55,
    8: 56,
    9: 57,
    0: 48,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    Enter: 13,
    Escape: 27,
    Space: 32,
    Tab: 9,
    Backspace: 8,
    Delete: 46,
  };

  const upperKey = key.toUpperCase();
  return keyCodes[key.toLowerCase()] || keyCodes[upperKey] || key.charCodeAt(0);
}

// Show extension info modal
function showExtensionInfoModal(extensionName, extensionInfo) {
  console.log("Content script: Showing extension info modal for:", extensionName);

  try {
    // 创建模态框背景
    const modalOverlay = document.createElement("div");
    modalOverlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.7) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-family: Arial, sans-serif !important;
    `;

    // 创建模态框内容
    const modal = document.createElement("div");
    modal.style.cssText = `
      background: white !important;
      border-radius: 8px !important;
      padding: 24px !important;
      max-width: 500px !important;
      max-height: 70vh !important;
      overflow-y: auto !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      color: #333 !important;
      position: relative !important;
    `;

    // 标题
    const title = document.createElement("h3");
    title.textContent = `扩展信息: ${extensionName}`;
    title.style.cssText = `
      margin: 0 0 16px 0 !important;
      color: #1a73e8 !important;
      font-size: 18px !important;
      border-bottom: 2px solid #e8f0fe !important;
      padding-bottom: 8px !important;
      font-family: Arial, sans-serif !important;
    `;

    // 信息内容
    const infoContent = document.createElement("pre");
    infoContent.textContent = extensionInfo;
    infoContent.style.cssText = `
      white-space: pre-wrap !important;
      word-wrap: break-word !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      background: #f8f9fa !important;
      padding: 16px !important;
      border-radius: 4px !important;
      border: 1px solid #e8eaed !important;
      margin: 0 0 20px 0 !important;
      color: #333 !important;
    `;

    // 关闭按钮
    const closeButton = document.createElement("button");
    closeButton.textContent = "关闭";
    closeButton.style.cssText = `
      background: #1a73e8 !important;
      color: white !important;
      border: none !important;
      padding: 8px 16px !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      font-size: 14px !important;
      font-family: Arial, sans-serif !important;
      float: right !important;
    `;

    // 点击关闭按钮或背景关闭模态框
    const closeModal = () => {
      try {
        if (modalOverlay && modalOverlay.parentNode) {
          modalOverlay.parentNode.removeChild(modalOverlay);
        }
        document.removeEventListener("keydown", handleKeyPress);
      } catch (error) {
        console.error("Error closing modal:", error);
      }
    };

    closeButton.onclick = closeModal;
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    };

    // ESC键关闭
    const handleKeyPress = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleKeyPress);

    // 组装模态框
    modal.appendChild(title);
    modal.appendChild(infoContent);
    modal.appendChild(closeButton);
    modalOverlay.appendChild(modal);

    // 显示模态框
    document.body.appendChild(modalOverlay);

    console.log("Extension info modal displayed successfully");
  } catch (error) {
    console.error("Failed to create extension info modal:", error);
    // 备用方案：显示简单通知
    showNotification(`扩展信息: ${extensionName}\n${extensionInfo}`, false, 5000);
  }
}
