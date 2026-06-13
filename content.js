// Content Script for Hotkey Chain Extension

// Localized-message override, mirrored from the options-page language choice.
// Without this, content scripts fall back to chrome.i18n (the browser UI
// language), which diverges from the override the user picked in Options.
let contentI18nOverride = null;

async function loadContentLocaleOverride() {
  try {
    const { localeOverride } = await chrome.storage.local.get(["localeOverride"]);
    if (!localeOverride || localeOverride === "auto") {
      contentI18nOverride = null;
      return;
    }
    // The background already has the override map loaded; reuse it instead of
    // fetching _locales (which would require web_accessible_resources).
    const resp = await chrome.runtime.sendMessage({ action: "getLocaleMessages" });
    contentI18nOverride = resp && resp.override ? resp.override : null;
  } catch (e) {
    contentI18nOverride = null;
  }
}

// i18n helper
function t(key, fallback = "") {
  try {
    if (contentI18nOverride && contentI18nOverride[key]) return contentI18nOverride[key];
    const msg = chrome.i18n.getMessage(key);
    return msg || fallback || key;
  } catch (e) {
    return fallback || key;
  }
}

// Listen for messages from background script.
// Guarded against double-registration: the background script injects
// content.js on demand into pages opened before install/update.
if (!window.__hotkeyChainContentLoaded) {
  window.__hotkeyChainContentLoaded = true;
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
  loadContentLocaleOverride();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.localeOverride) loadContentLocaleOverride();
  });
}

function handleBackgroundMessage(request, sender, sendResponse) {
  const action = request.action;

  try {
    switch (action) {
      case "scroll_to_top":
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;

      case "scroll_to_bottom":
        // documentElement covers pages where body doesn't carry the scroll height
        window.scrollTo({ top: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight), behavior: "smooth" });
        break;

      case "scroll_page_up":
        window.scrollBy({ top: -window.innerHeight * 0.9, behavior: "smooth" });
        break;

      case "scroll_page_down":
        window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
        break;

      case "copy_url":
        copyToClipboard(window.location.href);
        showNotification(t("content_urlCopied", "URL copied to clipboard"));
        break;

      case "copy_title":
        copyToClipboard(document.title);
        showNotification(t("content_titleCopied", "Title copied to clipboard"));
        break;

      case "copy_as_markdown":
        copyToClipboard(`[${document.title}](${window.location.href})`);
        showNotification(t("content_markdownCopied", "Markdown link copied to clipboard"));
        break;

      case "copy_selected_text": {
        const selection = String(window.getSelection()).trim();
        if (selection) {
          copyToClipboard(selection);
          showNotification(t("content_selectionCopied", "Selection copied to clipboard"));
        } else {
          showNotification(t("content_noSelection", "No text selected"), true);
        }
        break;
      }

      case "toggle_dark_mode":
        toggleDarkMode();
        break;

      case "media_play_pause": {
        const media = findMediaElements();
        if (!media.length) {
          showNotification(t("content_noMedia", "No media found on this page"), true);
          break;
        }
        const playing = media.filter((m) => !m.paused);
        if (playing.length) {
          playing.forEach((m) => m.pause());
        } else {
          media.forEach((m) => m.play().catch(() => {}));
        }
        break;
      }

      case "media_speed_up":
      case "media_speed_down":
      case "media_speed_reset": {
        const media = findMediaElements();
        if (!media.length) {
          showNotification(t("content_noMedia", "No media found on this page"), true);
          break;
        }
        let rate = media[0].playbackRate;
        if (action === "media_speed_up") rate = Math.min(rate + 0.25, 4);
        else if (action === "media_speed_down") rate = Math.max(rate - 0.25, 0.25);
        else rate = 1;
        media.forEach((m) => (m.playbackRate = rate));
        showNotification(t("content_playbackRate", "Playback speed: $1x").replace("$1", String(rate)));
        break;
      }

      case "toggle_fullscreen":
        toggleFullscreen();
        break;

      case "print_page":
        window.print();
        break;

      case "show_extension_notification":
        // 显示扩展激活通知
        showNotification(request.message || `${t("menu_executeDefault", "已尝试激活扩展")}: ${request.extensionName}`, request.isError || false);
        break;

      case "show_extension_info_modal":
        // 显示扩展详细信息模态框
        showExtensionInfoModal(request.extensionName, request.extensionInfo);
        break;

      default:
        console.warn(`Unknown content script action: ${action}`);
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error(`Error executing content script action ${action}:`, error);
    sendResponse({ success: false, error: error.message });
  }
}

// Copy text to clipboard
async function copyToClipboard(text) {
  try {
    // 尝试使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // 使用传统方法作为备用
      await fallbackCopyToClipboard(text);
    }
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    // 再次尝试备用方法
    try {
      await fallbackCopyToClipboard(text);
    } catch (fallbackError) {
      console.error("All copy methods failed:", fallbackError);
      showNotification(t("content_copyFailed", "复制失败，请手动复制"), true);
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

// Collect controllable media elements (video/audio, including inside open shadow roots is out of scope)
function findMediaElements() {
  return [...document.querySelectorAll("video, audio")];
}

// Toggle a CSS-filter based dark mode on the page
function toggleDarkMode() {
  const styleId = "hotkey-chain-dark-mode-style";
  const existing = document.getElementById(styleId);
  if (existing) {
    existing.remove();
    showNotification(t("content_darkModeOff", "Dark mode off"));
  } else {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      html { filter: invert(1) hue-rotate(180deg) !important; background: #111 !important; }
      img, video, canvas, picture, svg, iframe, embed, object {
        filter: invert(1) hue-rotate(180deg) !important;
      }
    `;
    document.documentElement.appendChild(style);
    showNotification(t("content_darkModeOn", "Dark mode on"));
  }
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


// Show extension info modal
function showExtensionInfoModal(extensionName, extensionInfo) {

  try {
    // 创建模态框背景
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "hotkey-chain-info-modal";
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
    title.textContent = `${t("actionName_call_extension", "调用扩展")} ${extensionName}`;
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
    closeButton.textContent = t("content_close", "关闭");
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
    // Expose the closer so a re-open can dismiss the previous instance (and its listener)
    modalOverlay.__hotkeyChainClose = closeModal;

    // 组装模态框
    modal.appendChild(title);
    modal.appendChild(infoContent);
    modal.appendChild(closeButton);
    modalOverlay.appendChild(modal);

    // Singleton: if a modal is already open, close it first so we never stack
    // overlays or leak its document keydown listener.
    const prior = document.getElementById("hotkey-chain-info-modal");
    if (prior && prior !== modalOverlay && typeof prior.__hotkeyChainClose === "function") {
      prior.__hotkeyChainClose();
    }

    // 显示模态框
    document.body.appendChild(modalOverlay);

  } catch (error) {
    console.error("Failed to create extension info modal:", error);
    // 备用方案：显示简单通知
    showNotification(`${t("actionName_call_extension", "调用扩展")}: ${extensionName}\n${extensionInfo}`, false, 5000);
  }
}
