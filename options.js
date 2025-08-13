// Options page JavaScript for Hotkey Chain Extension

// Global variables
let currentConfig = {};
let editingChainId = null;

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
  FOCUS_ADDRESS_BAR: "focus_address_bar",
  CALL_EXTENSION: "call_extension",
  EXECUTE_COMMAND: "execute_command",
  CLEAR_CACHE: "clear_cache",
  DUPLICATE_TAB: "duplicate_tab",
  PIN_TAB: "pin_tab",
  WAIT: "wait",
};

// Action display names
const ACTION_NAMES = {
  [ACTION_TYPES.SCROLL_TO_TOP]: "滚动到顶部",
  [ACTION_TYPES.SCROLL_TO_BOTTOM]: "滚动到底部",
  [ACTION_TYPES.RELOAD_PAGE]: "刷新页面",
  [ACTION_TYPES.CLOSE_TAB]: "关闭标签页",
  [ACTION_TYPES.NEW_TAB]: "新标签页",
  [ACTION_TYPES.COPY_URL]: "复制URL",
  [ACTION_TYPES.COPY_TITLE]: "复制标题",
  [ACTION_TYPES.FULLSCREEN]: "全屏切换",
  [ACTION_TYPES.ZOOM_IN]: "放大",
  [ACTION_TYPES.ZOOM_OUT]: "缩小",
  [ACTION_TYPES.ZOOM_RESET]: "重置缩放",
  [ACTION_TYPES.BACK]: "后退",
  [ACTION_TYPES.FORWARD]: "前进",
  [ACTION_TYPES.BOOKMARK]: "书签页面",
  [ACTION_TYPES.FOCUS_ADDRESS_BAR]: "聚焦地址栏",
  [ACTION_TYPES.CLEAR_CACHE]: "清除缓存",
  [ACTION_TYPES.DUPLICATE_TAB]: "复制标签页",
  [ACTION_TYPES.PIN_TAB]: "固定/取消固定标签页",
  [ACTION_TYPES.WAIT]: "等待",
  [ACTION_TYPES.EXECUTE_COMMAND]: "执行命令",
  [ACTION_TYPES.CALL_EXTENSION]: "调用扩展",
};

// Common extension action templates
const EXTENSION_TEMPLATES = {
  // AdBlock类扩展
  gighmmpiobklfepjocnamgkkbiglidom: {
    // AdBlock
    name: "AdBlock",
    actions: [
      { name: "切换广告拦截", message: { action: "toggle" } },
      { name: "暂停拦截", message: { action: "pause" } },
      { name: "恢复拦截", message: { action: "resume" } },
    ],
  },
  cjpalhdlnbpafiamejdnhcphjbkeiagm: {
    // uBlock Origin
    name: "uBlock Origin",
    actions: [
      { name: "切换拦截器", message: { action: "toggle" } },
      { name: "重新加载过滤器", message: { action: "reload-filters" } },
    ],
  },
  // 密码管理器
  hdokiejnpimakedhajhdlcegeplioahd: {
    // LastPass
    name: "LastPass",
    actions: [
      { name: "填充表单", message: { action: "fill_form" } },
      { name: "打开密码库", message: { action: "open_vault" } },
      { name: "生成密码", message: { action: "generate_password" } },
    ],
  },
  nngceckbapebfimnlniiiahkandclblb: {
    // Bitwarden
    name: "Bitwarden",
    actions: [
      { name: "自动填充", message: { action: "autofill" } },
      { name: "打开弹窗", message: { action: "open_popup" } },
    ],
  },
  // 开发者工具
  fhbjgbiflinjbdggehcddcbncdddomop: {
    // Postman
    name: "Postman",
    actions: [
      { name: "捕获请求", message: { action: "capture_request" } },
      { name: "导入请求", message: { action: "import_request" } },
    ],
  },
  kjacjjdnoddnpbbcjilcajfhhbdhkpgk: {
    // Web Developer
    name: "Web Developer",
    actions: [
      { name: "显示标尺", message: { action: "show_ruler" } },
      { name: "禁用CSS", message: { action: "disable_css" } },
    ],
  },
  // 翻译类
  aapbdbdomjkkjkaonfhkkikfgjllcleb: {
    // Google Translate
    name: "Google Translate",
    actions: [
      { name: "翻译页面", message: { action: "translate_page" } },
      { name: "翻译选中文本", message: { action: "translate_selection" } },
    ],
  },
  // 截图类
  alelhddbbhepgpmgidjdcjakblofbmce: {
    // GoFullPage
    name: "GoFullPage",
    actions: [
      { name: "截取整页", message: { action: "capture_full_page" } },
      { name: "截取可见区域", message: { action: "capture_visible" } },
    ],
  },
  // 通用动作模板
  generic: {
    name: "通用扩展",
    actions: [
      { name: "切换功能", message: { action: "toggle" } },
      { name: "执行主功能", message: { action: "execute" } },
      { name: "打开弹窗", message: { action: "open_popup" } },
      { name: "刷新", message: { action: "refresh" } },
      { name: "重置", message: { action: "reset" } },
    ],
  },
};

// 扩展命令缓存（动态加载）
let extensionCommandsCache = {};
let isLoadingCommands = false;

let installedExtensions = [];

// Action categories for grouped display
const ACTION_CATEGORIES = {
  执行命令: [ACTION_TYPES.EXECUTE_COMMAND],
  页面操作: [ACTION_TYPES.SCROLL_TO_TOP, ACTION_TYPES.SCROLL_TO_BOTTOM, ACTION_TYPES.RELOAD_PAGE, ACTION_TYPES.FULLSCREEN, ACTION_TYPES.BACK, ACTION_TYPES.FORWARD],
  标签管理: [ACTION_TYPES.CLOSE_TAB, ACTION_TYPES.NEW_TAB, ACTION_TYPES.DUPLICATE_TAB, ACTION_TYPES.PIN_TAB],
  缩放控制: [ACTION_TYPES.ZOOM_IN, ACTION_TYPES.ZOOM_OUT, ACTION_TYPES.ZOOM_RESET],
  内容操作: [ACTION_TYPES.COPY_URL, ACTION_TYPES.COPY_TITLE, ACTION_TYPES.BOOKMARK, ACTION_TYPES.FOCUS_ADDRESS_BAR],
  高级功能: [ACTION_TYPES.CLEAR_CACHE, ACTION_TYPES.WAIT],
  扩展调用: [ACTION_TYPES.CALL_EXTENSION],
};

// Preferred order for action options
const ACTION_TYPE_ORDER = [
  // 执行命令 - 第一个
  ACTION_TYPES.EXECUTE_COMMAND,

  // 页面操作
  ACTION_TYPES.SCROLL_TO_TOP,
  ACTION_TYPES.SCROLL_TO_BOTTOM,
  ACTION_TYPES.RELOAD_PAGE,
  ACTION_TYPES.FULLSCREEN,
  ACTION_TYPES.BACK,
  ACTION_TYPES.FORWARD,

  // 标签管理
  ACTION_TYPES.CLOSE_TAB,
  ACTION_TYPES.NEW_TAB,
  ACTION_TYPES.DUPLICATE_TAB,
  ACTION_TYPES.PIN_TAB,

  // 缩放控制
  ACTION_TYPES.ZOOM_IN,
  ACTION_TYPES.ZOOM_OUT,
  ACTION_TYPES.ZOOM_RESET,

  // 内容操作
  ACTION_TYPES.COPY_URL,
  ACTION_TYPES.COPY_TITLE,
  ACTION_TYPES.BOOKMARK,
  ACTION_TYPES.FOCUS_ADDRESS_BAR,

  // 高级功能
  ACTION_TYPES.CLEAR_CACHE,
  ACTION_TYPES.WAIT,

  // 扩展调用 - 最后一个
  ACTION_TYPES.CALL_EXTENSION,
];

// Generate grouped action options
function generateGroupedActionOptions(selectedType) {
  return Object.entries(ACTION_CATEGORIES)
    .map(
      ([category, actions]) => `
      <optgroup label="${category}">
        ${actions
          .map(
            (type) => `
          <option value="${type}" ${selectedType === type ? "selected" : ""}>${ACTION_NAMES[type]}</option>
        `
          )
          .join("")}
      </optgroup>
    `
    )
    .join("");
}

// Initialize options page
document.addEventListener("DOMContentLoaded", async () => {
  await loadExtensionCommands();
  await loadConfig();
  await loadInstalledExtensions();
  setupEventListeners();
  renderMainView();
  renderActionsHelp();

  // 初始化 Sortable.js 拖拽功能
  setTimeout(() => {
    initializeSortableDragDrop();
  }, 200);
});

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
  editTitle.textContent = `编辑动作链: ${chain.name}`;

  // Fill in the form fields
  const chainNameInput = document.getElementById("chainNameInput");
  const chainDescInput = document.getElementById("chainDescInput");
  const setAsDefaultCheck = document.getElementById("setAsDefaultCheck");

  if (chainNameInput) chainNameInput.value = chain.name || "";
  if (chainDescInput) chainDescInput.value = chain.description || "";
  if (setAsDefaultCheck) setAsDefaultCheck.checked = currentConfig.defaultChain === chainKey;

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

// Save configuration to storage
async function saveConfig() {
  try {
    await chrome.runtime.sendMessage({
      action: "saveConfig",
      config: currentConfig,
    });
  } catch (error) {
    console.error("Failed to save config:", error);
  }
}

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

      chainCard.innerHTML = `
        <div class="chain-card-header position-relative">
          ${
            !isDefault
              ? `
            <button class="btn btn-link p-1 position-absolute top-0 end-0 set-default-btn" data-chain-key="${chainKey}" title="设为默认动作链">
              <i class="bi bi-star text-warning"></i>
            </button>
          `
              : `
            <div class="position-absolute top-0 end-0 p-2">
              <i class="bi bi-star-fill text-warning" title="默认动作链"></i>
            </div>
          `
          }
          <div class="d-flex align-items-start pe-4">
            <span class="drag-handle me-2">⋮⋮</span>
            <div class="flex-grow-1">
              <h6 class="chain-title mb-1">${chain.name}</h6>
              <div class="chain-meta">
                <span class="chain-actions-count">
                  <i class="bi bi-list-ul me-1"></i>${chain.actions.length} 个动作
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="chain-card-body">
          <div class="chain-actions mb-3">
            ${chain.actions
              .slice(0, 3)
              .map(
                (action) => `
              <div class="action-item d-flex justify-content-between align-items-center py-1">
                <span class="action-name text-truncate">${ACTION_NAMES[action.type] || action.type}</span>
                <span class="badge bg-light text-dark ms-2">${action.delay}ms</span>
              </div>
            `
              )
              .join("")}
            ${chain.actions.length > 3 ? `<div class="text-muted small mt-2"><i class="bi bi-three-dots"></i> 还有 ${chain.actions.length - 3} 个动作</div>` : ""}
            ${chain.actions.length === 0 ? `<div class="text-muted small"><i class="bi bi-info-circle me-1"></i>暂无动作</div>` : ""}
          </div>
          <div class="chain-card-actions d-flex gap-2 flex-wrap">
            <button class="btn btn-primary btn-sm execute-btn flex-fill" data-chain-key="${chainKey}">
              <i class="bi bi-caret-right-fill me-1"></i>执行
            </button>
            <button class="btn btn-outline-secondary btn-sm edit-chain-btn" data-chain-key="${chainKey}">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm delete-chain-btn" data-chain-key="${chainKey}">
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
          <span class="drag-handle me-3" style="cursor: move;">⋮⋮</span>
          <div class="flex-grow-1">
            <div class="row g-2 align-items-center">
              <div class="col-md-4">
                <select class="form-select form-select-sm action-type-select" data-chain-key="${chainKey}" data-action-index="${index}">
                  ${generateGroupedActionOptions(action.type)}
                </select>
              </div>
              <div class="col-md-3">
                <div class="input-group input-group-sm">
                  <span class="input-group-text">延迟</span>
                  <input type="number" class="form-control action-delay-input" min="0" max="10000" step="100" 
                         value="${action.delay}" data-chain-key="${chainKey}" data-action-index="${index}" placeholder="ms">
                  <span class="input-group-text">ms</span>
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
            <label class="form-label small">选择扩展:</label>
            <select class="form-select form-select-sm extension-selector" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">-- 选择已安装的扩展 --</option>
              <option value="manual" ${!action.extensionId || action.extensionId === "manual" ? "selected" : ""}>手动输入扩展ID</option>
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
          <label class="form-label small">扩展ID:</label>
          <input type="text" class="form-control form-control-sm extension-id-input" placeholder="扩展ID (如: nfgcnddoajoekfpacfkehomkgmpndhob)" 
                 value="${action.extensionId && action.extensionId !== "manual" ? action.extensionId : ""}" 
                 data-chain-key="${chainKey}" data-action-index="${index}">
        </div>
        
        <div class="extension-action-row mb-2" ${!action.extensionId || action.extensionId === "manual" ? 'style="display:none"' : ""}>
          <label class="form-label small">预设动作:</label>
          <select class="form-select form-select-sm extension-action-selector" data-chain-key="${chainKey}" data-action-index="${index}">
            <option value="">-- 选择动作模板 --</option>
            <option value="custom">自定义消息</option>
          </select>
        </div>
        
        <div class="extension-message-row">
          <label class="form-label small">消息内容:</label>
          <textarea class="form-control form-control-sm extension-message-input" rows="3" placeholder="消息内容 (JSON格式，如: {&quot;action&quot;: &quot;toggle&quot;})" 
                   data-chain-key="${chainKey}" data-action-index="${index}">${action.message ? JSON.stringify(action.message, null, 2) : ""}</textarea>
        </div>
      </div>
    `;
  } else if (action.type === ACTION_TYPES.EXECUTE_COMMAND) {
    return `
      <div class="mt-2">
        <div class="row g-2 mb-2">
          <div class="col-md-6">
            <label class="form-label small">选择扩展:</label>
            <select class="form-select form-select-sm command-extension-selector" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">-- 选择扩展 --</option>
            </select>
          </div>
        </div>
        
        <div class="row g-2">
          <div class="col">
            <label class="form-label small">选择命令:</label>
            <div class="input-group input-group-sm">
              <select class="form-select form-select-sm command-selector" data-chain-key="${chainKey}" data-action-index="${index}">
                <option value="">-- 选择命令 --</option>
              </select>
              <button class="btn btn-outline-secondary refresh-commands-btn" data-chain-key="${chainKey}" data-action-index="${index}" title="刷新命令列表">
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  return ""; // For other action types, no additional controls
}

// Render actions configuration
function renderActionsConfig(chainKey, actions) {
  return actions
    .map(
      (action, index) => `
    <div class="action-config" draggable="true" data-chain-key="${chainKey}" data-action-index="${index}">
      <div class="action-main-row">
        <span class="drag-handle">⋮⋮</span>
        <select class="form-select form-select-sm action-type-select" data-chain-key="${chainKey}" data-action-index="${index}">
          ${generateGroupedActionOptions(action.type)}
        </select>

        <label>延迟:</label>
        <input type="number" class="form-control form-control-sm action-delay-input" min="0" max="10000" step="100" value="${action.delay}"
               data-chain-key="${chainKey}" data-action-index="${index}" placeholder="ms">
        <button class="btn btn-danger btn-sm remove-action-btn" data-chain-key="${chainKey}" data-action-index="${index}">删除</button>
      </div>

      ${
        action.type === ACTION_TYPES.CALL_EXTENSION
          ? `
        <div class="extension-config">
          <div class="extension-selector-row">
            <label>选择扩展:</label>
            <select class="form-select form-select-sm extension-selector" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">-- 选择已安装的扩展 --</option>
              <option value="manual" ${!action.extensionId || action.extensionId === "manual" ? "selected" : ""}>手动输入扩展ID</option>
            </select>
            <button class="btn btn-secondary btn-sm refresh-extensions-btn" data-chain-key="${chainKey}" data-action-index="${index}">刷新</button>
          </div>
          
          <div class="extension-id-row" ${action.extensionId && action.extensionId !== "manual" ? 'style="display:none"' : ""}>
            <label>扩展ID:</label>
            <input type="text" class="form-control form-control-sm extension-id-input" placeholder="扩展ID (如: nfgcnddoajoekfpacfkehomkgmpndhob)" 
                   value="${action.extensionId && action.extensionId !== "manual" ? action.extensionId : ""}" 
                   data-chain-key="${chainKey}" data-action-index="${index}">
          </div>
          
          <div class="extension-action-row" ${!action.extensionId || action.extensionId === "manual" ? 'style="display:none"' : ""}>
            <label>预设动作:</label>
            <select class="form-select form-select-sm extension-action-selector" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">-- 选择动作模板 --</option>
              <option value="custom">自定义消息</option>
            </select>
          </div>
          
          <div class="extension-message-row">
            <label>消息内容:</label>
            <textarea class="form-control form-control-sm extension-message-input" placeholder="消息内容 (JSON格式，如: {&quot;action&quot;: &quot;toggle&quot;})" 
                     data-chain-key="${chainKey}" data-action-index="${index}">${action.message ? JSON.stringify(action.message, null, 2) : ""}</textarea>
          </div>
        </div>
      `
          : action.type === ACTION_TYPES.EXECUTE_COMMAND
          ? `
        <div class="command-config">
          <div class="command-selector-row">
            <label>选择扩展:</label>
            <select class="form-select form-select-sm command-extension-selector" data-chain-key="${chainKey}" data-action-index="${index}">
              <option value="">-- 选择扩展 --</option>
            </select>
          </div>
          </div>
          
          <div class="command-list-row">
            <label>选择命令:</label>
            <div class="command-selector-with-refresh">
              <select class="form-select form-select-sm command-selector" data-chain-key="${chainKey}" data-action-index="${index}">
                <option value="">-- 选择命令 --</option>
              </select>
              <button class="btn btn-secondary btn-small refresh-commands-btn" data-chain-key="${chainKey}" data-action-index="${index}" title="刷新命令列表">🔄</button>
            </div>
          </div>
          
          <div class="command-manual-row">
            <label>或手动输入命令:</label>
            <input type="text" class="command-input" placeholder="命令名称 (如: _execute_action, execute_chain_1)" 
                   value="${action.command || ""}" 
                   data-chain-key="${chainKey}" data-action-index="${index}">
            <small class="help-text">扩展自身命令格式: _execute_action, execute_chain_1 等</small>
          </div>
        </div>
      `
          : ""
      }
    </div>
  `
    )
    .join("");
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
    selector.innerHTML = '<option value="">-- 选择扩展 --</option>';

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
    currentOption.textContent = "Hotkey Chain (本扩展)";
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
    .map(
      ([category, actions]) => `
      <div class="card mb-3">
        <div class="card-header">
          <h6 class="mb-0">${category}</h6>
        </div>
        <div class="card-body">
          <div class="row">
            ${actions
              .map(
                (action) => `
              <div class="col-md-6 col-lg-4 mb-2">
                <span class="badge bg-light text-dark">${ACTION_NAMES[action]}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

// Execute chain
async function executeChain(chainKey) {
  try {
    await chrome.runtime.sendMessage({
      action: "executeChain",
      chainKey: chainKey,
    });
    showMessage(`执行动作链: ${currentConfig.chains[chainKey].name}`);
  } catch (error) {
    console.error("Failed to execute chain:", error);
    showMessage("执行失败", true);
  }
}

// Set default chain
async function setDefaultChain(chainKey) {
  currentConfig.defaultChain = chainKey;
  await saveConfig();
  renderMainView();
  showMessage("默认链已设置");
}

// Add new chain
async function addNewChain() {
  const chainKey = `chain_${Date.now()}`;
  currentConfig.chains[chainKey] = {
    name: "新动作链",
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
  showMessage("新链已添加");

  // 自动进入编辑模式
  setTimeout(() => {
    editChain(chainKey);
  }, 100);
}

// Delete chain
async function deleteChain(chainKey) {
  if (Object.keys(currentConfig.chains).length <= 1) {
    showMessage("至少需要保留一个动作链", true);
    return;
  }

  const chainName = currentConfig.chains[chainKey]?.name || "未知动作链";

  // 显示确认对话框
  const confirmed = confirm(`确定要删除动作链"${chainName}"吗？\n\n此操作不可撤销。`);
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
  showMessage("动作链已删除");
}

// Update chain name
async function updateChainName(chainKey, newName) {
  currentConfig.chains[chainKey].name = newName;
  await saveConfig();

  // Update edit view title if in edit mode
  const editView = document.getElementById("edit-view");
  if (editView.style.display !== "none") {
    const editTitle = document.getElementById("editChainTitle");
    editTitle.textContent = `编辑动作链: ${newName}`;
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

  showMessage("动作已添加");
}

// Remove action from chain
async function removeAction(chainKey, actionIndex) {
  currentConfig.chains[chainKey].actions.splice(actionIndex, 1);
  await saveConfig();

  // Re-render the entire chain edit view to immediately show the changes
  if (editingChainId === chainKey) {
    renderChainEdit(chainKey);
  }

  showMessage("动作已删除");
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

  await saveConfig();

  // Re-render the entire chain edit view to immediately show the changes
  if (editingChainId === chainKey) {
    renderChainEdit(chainKey);
  }
}

// Update action delay
async function updateActionDelay(chainKey, actionIndex, newDelay) {
  currentConfig.chains[chainKey].actions[actionIndex].delay = parseInt(newDelay) || 0;
  await saveConfig();
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
  const template = EXTENSION_TEMPLATES[action.extensionId];

  if (selectedValue === "custom") {
    // User wants to customize, don't auto-fill
    return;
  }

  if (template && template.actions) {
    const selectedAction = template.actions.find((a) => a.name === selectedValue);
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

  // Update the manual input field
  const container = document.querySelector(`[data-chain-key="${chainKey}"][data-action-index="${actionIndex}"]`).closest(".action-config");
  const commandInput = container.querySelector(".command-input");
  if (commandInput) {
    commandInput.value = selectedCommand;
  }

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
          name: extensionId === chrome.runtime.id ? "Hotkey Chain" : "Unknown",
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
      option.textContent = `${cmd.name} - ${cmd.description}`;
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

  // Add template actions
  template.actions.forEach((action) => {
    const option = document.createElement("option");
    option.value = action.name;
    option.textContent = action.name;
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

      showMessage(`已刷新 ${extensions.length} 个扩展`);
    }
  } catch (error) {
    console.error("Failed to refresh extensions:", error);
    showMessage("刷新扩展列表失败", true);
  }
}

// Refresh commands list for a specific action
async function refreshCommandsList(chainKey, actionIndex) {
  try {
    const action = currentConfig.chains[chainKey].actions[actionIndex];
    const extensionId = action.extensionId;

    if (!extensionId) {
      showMessage("请先选择扩展", true);
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

    showMessage("已刷新命令列表");
  } catch (error) {
    console.error("Failed to refresh commands:", error);
    showMessage("刷新命令列表失败", true);
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
          ${text}
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

// Make functions global for HTML onclick handlers
window.executeChain = executeChain;
window.deleteChain = deleteChain;
window.updateChainName = updateChainName;
window.addAction = addAction;
window.removeAction = removeAction;
window.updateActionType = updateActionType;
window.updateActionDelay = updateActionDelay;
window.updateExtensionId = updateExtensionId;
window.updateExtensionMessage = updateExtensionMessage;

// 使用 Sortable.js 实现拖拽排序
function initializeSortableDragDrop() {
  // 主页面 - 动作链网格拖拽排序
  const chainsContainer = document.getElementById("chains-container");
  if (chainsContainer && window.Sortable) {
    new Sortable(chainsContainer, {
      animation: 150,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      handle: ".drag-handle",
      onEnd: async function (evt) {
        await updateChainOrderFromSort();
      },
    });
  }

  // 编辑界面 - 动作拖拽排序
  const editActionsList = document.getElementById("chainEditConfig");
  if (editActionsList && window.Sortable && editingChainId) {
    new Sortable(editActionsList, {
      animation: 150,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      handle: ".drag-handle",
      onEnd: async function (evt) {
        await updateActionOrderFromSort(editingChainId);
      },
    });
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

// 更新动作链顺序（执行页面）
async function updateExecuteChainOrderFromSort() {
  const chainItems = document.querySelectorAll(".chain-list .chain-item");

  // 提取新的顺序
  const newOrder = [];
  chainItems.forEach((item) => {
    const chainKey = item.dataset.chainKey;
    newOrder.push(chainKey);
  });

  // 保存新的顺序
  currentConfig.chainOrder = newOrder;
  await saveConfig();
  renderMainView(); // 同步更新主页面
}
