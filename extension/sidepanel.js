// Side Panel Controller for Hotkey Chain Extension

let currentConfig = { chains: {}, chainOrder: [] };
let localeOverrideMap = null;

// Which key runs which chain. This used to read chain.hotkey, a field nothing
// in the project ever wrote, so the badge could never appear while the options
// page showed the same information. Ask Chrome what it actually registered and
// resolve through the shared helper so both pages agree.
let commandShortcuts = new Map();
let panelLocale = "auto";

async function refreshCommandShortcuts() {
  try {
    const all = await chrome.commands.getAll();
    commandShortcuts = new Map(all.map((c) => [c.name, c.shortcut || ""]));
  } catch (e) {
    commandShortcuts = new Map();
  }
}

function shortcutForChain(chainKey) {
  const name = hotkeyChainCommandName(
    chainKey,
    currentConfig.chainOrder || Object.keys(currentConfig.chains || {}),
    currentConfig,
    (n) => commandShortcuts.has(`execute_chain_${n}`)
  );
  return name ? commandShortcuts.get(name) || "" : "";
}

async function loadLocaleMessages() {
  try {
    const { localeOverride } = await chrome.storage.local.get(["localeOverride"]);
    panelLocale = localeOverride || "auto";
    if (localeOverride && localeOverride !== "auto") {
      const resp = await chrome.runtime.sendMessage({ action: "getLocaleMessages" });
      localeOverrideMap = resp?.override || null;
    } else {
      localeOverrideMap = null;
    }
  } catch (e) {
    localeOverrideMap = null;
  }
}

// 与 options.js / background.js 同一契约：带 $1 的句子要把替换值传进来，
// getMessage 不传参数时会先删掉占位符再返回。
function t(key, fallback = "", args = null) {
  const list = args == null ? null : Array.isArray(args) ? args : [args];
  const fill = (text) =>
    list == null ? text : String(text).replace(/\$(\d)/g, (m, n) => list[Number(n) - 1] ?? m);
  try {
    if (localeOverrideMap && localeOverrideMap[key]) return fill(localeOverrideMap[key]);
    const msg = list == null ? chrome.i18n.getMessage(key) : chrome.i18n.getMessage(key, list);
    return fill(msg || fallback || key);
  } catch (e) {
    return fill(fallback || key);
  }
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const msg = t(key);
    if (msg) el.textContent = msg;
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    const msg = t(key);
    if (msg) el.setAttribute("title", msg);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const msg = t(key);
    if (msg) el.setAttribute("placeholder", msg);
  });
}

async function loadChains() {
  try {
    const config = await chrome.runtime.sendMessage({ action: "getConfig" });
    if (config && config.chains) {
      currentConfig = config;
    }
    await refreshCommandShortcuts();
    renderChains();
  } catch (e) {
    console.error("Failed to load chains in side panel:", e);
  }
}

function getOrderedKeys() {
  const order = currentConfig.chainOrder || [];
  const keys = Object.keys(currentConfig.chains || {});
  const inOrder = order.filter((k) => keys.includes(k));
  const remaining = keys.filter((k) => !inOrder.includes(k));
  return [...inOrder, ...remaining];
}

function renderChains() {
  const chainsList = document.getElementById("chainsList");
  const emptyState = document.getElementById("emptyState");
  const chainCountEl = document.getElementById("chainCount");
  const query = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();

  const allKeys = getOrderedKeys();
  const matchingKeys = allKeys.filter((k) => {
    const chain = currentConfig.chains[k];
    if (!chain) return false;
    if (!query) return true;
    const nameMatch = (chain.name || k).toLowerCase().includes(query);
    const actionMatch = (chain.actions || []).some((a) => (a.type || "").toLowerCase().includes(query));
    return nameMatch || actionMatch;
  });

  if (chainCountEl) {
    chainCountEl.textContent = `${allKeys.length} ${t("sidepanel_chainsSuffix", "chains")}`;
  }

  if (matchingKeys.length === 0) {
    chainsList.innerHTML = "";
    showEmptyState(allKeys.length === 0);
    return;
  }

  emptyState.classList.add("d-none");
  chainsList.innerHTML = "";

  matchingKeys.forEach((key) => {
    const chain = currentConfig.chains[key];
    const item = document.createElement("div");
    item.className = "chain-item";
    item.dataset.chainKey = key;

    const actionCount = (chain.actions || []).length;
    const shortcutText = shortcutForChain(key) || "";
    const hasAi = (chain.actions || []).some((a) =>
      a.type === "ai_summarize" || a.type === "ai_explain" || a.type === "ai_translate"
    );
    const aiBadge = hasAi
      ? `<span class="chain-badge ai-chip" title="${escapeHtml(t("badge_requiresAi", "需浏览器内置 AI"))}"><i class="bi bi-cpu me-1" aria-hidden="true"></i>AI</span>`
      : "";

    item.innerHTML = `
      <div class="chain-info">
        <div class="chain-title-row">
          <span class="chain-name">${escapeHtml(chain.name || key)}</span>
          ${aiBadge}
          ${shortcutText ? `<span class="chain-badge">${escapeHtml(shortcutText)}</span>` : ""}
        </div>
        <div class="chain-desc">${actionCount} ${t("sidepanel_actionsSuffix", "actions")}</div>
      </div>
      <button class="btn-run" data-chain-key="${escapeHtml(key)}" aria-label="${t("sidepanel_runChain", "Run")}">
        <i class="bi bi-play-fill"></i>
        <span>${t("sidepanel_runChain", "Run")}</span>
      </button>
    `;

    // Click anywhere on item or button executes chain
    item.addEventListener("click", async (e) => {
      e.stopPropagation();
      await runChain(key, chain.name || key);
    });

    chainsList.appendChild(item);
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// "Nothing here yet" and "nothing matches" are different problems, so they get
// different words and different exits.
function showEmptyState(noChainsAtAll) {
  const box = document.getElementById("emptyState");
  if (!box) return;
  const icon = box.querySelector("i");
  const text = box.querySelector("p");
  const btn = document.getElementById("emptyActionBtn");
  if (icon) icon.className = "bi text-muted fs-1 mb-2 " + (noChainsAtAll ? "bi-inboxes" : "bi-search");
  if (text) {
    text.textContent = noChainsAtAll
      ? t("sidepanel_noChains", "还没有动作链")
      : t("sidepanel_noMatches", "没有匹配的动作链");
  }
  if (btn) {
    btn.textContent = t("sidepanel_openInSettings", "在设置中打开");
    btn.classList.toggle("d-none", !noChainsAtAll);
    btn.onclick = openOptions;
  }
  box.classList.remove("d-none");
}

function openOptions() {
  try {
    chrome.runtime.openOptionsPage();
  } catch (e) {
    window.open("options.html", "_blank");
  }
}

let toastTimer = null;
function showToast(text, isError = false) {
  const toast = document.getElementById("statusToast");
  const textEl = document.getElementById("statusText");
  if (!toast || !textEl) return;

  textEl.textContent = text;
  toast.className = `status-toast ${isError ? "error" : ""}`;
  toast.classList.remove("d-none");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("d-none");
  }, 2500);
}

async function runChain(chainKey, chainName) {
  try {
    // The panel is not a tab either, so tell the background which window to
    // look in for the page this run should act on.
    const win = await chrome.windows.getCurrent();
    const response = await chrome.runtime.sendMessage({
      action: "executeChain",
      chainKey,
      windowId: win && win.id,
      expectWebTab: true,
    });
    if (response && response.reason === "noWebTab") {
      showToast(t("toast_noWebTarget", "没有可作用的网页：请先打开一个网页标签页再运行"), true);
    } else if (response && response.success) {
      showToast(`${t("sidepanel_executedPrefix", "Executed:")} ${chainName}`);
    } else if (response?.error) {
      showToast(response.error, true);
    }
  } catch (e) {
    showToast(t("sidepanel_executionFailed", "Execution failed"), true);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadLocaleMessages();
  // The options page mirrors RTL locales; the panel has to agree or the same
  // Arabic strings lay out two different ways in the two surfaces.
  applyTextDirection(panelLocale);
  applyI18n();
  await loadChains();

  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  searchInput?.addEventListener("input", () => {
    if (searchInput.value.trim()) {
      clearBtn?.classList.remove("d-none");
    } else {
      clearBtn?.classList.add("d-none");
    }
    renderChains();
  });

  clearBtn?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    clearBtn.classList.add("d-none");
    renderChains();
  });

  document.getElementById("openOptionsBtn")?.addEventListener("click", openOptions);

  document.getElementById("addChainLink")?.addEventListener("click", openOptions);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      (async () => {
        try {
          if (changes.localeOverride) {
            await loadLocaleMessages();
            applyTextDirection(panelLocale);
            applyI18n();
          }
          if (changes.hotkeyChainConfig) {
            await loadChains();
          }
        } catch (e) {}
      })();
    }
  });
});
