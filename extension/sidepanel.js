// Side Panel Controller for Hotkey Chain Extension

let currentConfig = { chains: {}, chainOrder: [] };
let localeOverrideMap = null;

async function loadLocaleMessages() {
  try {
    const { localeOverride } = await chrome.storage.local.get(["localeOverride"]);
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

function t(key, fallback = "") {
  try {
    if (localeOverrideMap && localeOverrideMap[key]) return localeOverrideMap[key];
    const msg = chrome.i18n.getMessage(key);
    return msg || fallback || key;
  } catch (e) {
    return fallback || key;
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
    emptyState.classList.remove("d-none");
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
    const shortcutText = chain.hotkey || "";
    const hasAi = (chain.actions || []).some((a) =>
      a.type === "ai_summarize" || a.type === "ai_explain" || a.type === "ai_translate"
    );
    const aiBadge = hasAi
      ? `<span class="chain-badge" style="background:rgba(13,202,240,0.15);color:#087990;border:1px solid rgba(13,202,240,0.3);font-size:0.68rem;" title="${escapeHtml(t("badge_requiresAi", "需端侧 AI"))}"><i class="bi bi-cpu me-1" aria-hidden="true"></i>AI</span>`
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
    const response = await chrome.runtime.sendMessage({
      action: "executeChain",
      chainKey,
    });
    if (response && response.success) {
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

  document.getElementById("openOptionsBtn")?.addEventListener("click", async () => {
    try {
      await chrome.runtime.openOptionsPage();
    } catch (e) {
      window.open("options.html", "_blank");
    }
  });

  document.getElementById("addChainLink")?.addEventListener("click", async () => {
    try {
      await chrome.runtime.openOptionsPage();
    } catch (e) {
      window.open("options.html", "_blank");
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      (async () => {
        try {
          if (changes.localeOverride) {
            await loadLocaleMessages();
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
