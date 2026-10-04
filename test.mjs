// node --test test.mjs
//
// 这个扩展没有构建步骤，也就没有编译器替你发现问题。这里守的全是「不会报错、
// 只会静默失效」的那一类：动作少注册一处就在下拉框里消失或点了没反应，i18n
// 少一个 key 就把源码里硬编码的中文回退文案端给外语用户看。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const read = (file) => readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
const background = read("extension/background.js");
const options = read("extension/options.js");

// 从具名对象字面量里取出 `NAME: "value"` 这样的成对内容
function objectBlock(source, name) {
  const start = source.indexOf(`const ${name} = {`);
  assert.notEqual(start, -1, `源码里找不到 ${name}`);
  const end = source.indexOf("\n};", start);
  return source.slice(start, end);
}
const actionValues = (source) => new Set([...objectBlock(source, "ACTION_TYPES").matchAll(/^\s+\w+:\s*"(\w+)"/gm)].map((m) => m[1]));
const referencedTypes = (block) => new Set([...block.matchAll(/ACTION_TYPES\.(\w+)/g)].map((m) => m[1]));

test("background 和 options 的 ACTION_TYPES 完全一致", () => {
  // 两边各存一份，漂移了不会报错，只会让某个动作在一侧不存在
  const bg = actionValues(background);
  const opt = actionValues(options);
  assert.deepEqual([...bg].sort(), [...opt].sort());
});

test("每个动作都有显示名、分类和后台处理分支", () => {
  const constants = new Set([...objectBlock(options, "ACTION_TYPES").matchAll(/^\s+(\w+):/gm)].map((m) => m[1]));
  const named = referencedTypes(objectBlock(options, "ACTION_NAMES"));
  const categorized = referencedTypes(objectBlock(options, "ACTION_CATEGORIES"));
  const handled = new Set([...background.matchAll(/case ACTION_TYPES\.(\w+):/g)].map((m) => m[1]));

  const missingName = [...constants].filter((c) => !named.has(c));
  const missingCategory = [...constants].filter((c) => !categorized.has(c));
  const missingHandler = [...constants].filter((c) => !handled.has(c));

  assert.deepEqual(missingName, [], "ACTION_NAMES 缺少条目：动作在界面上会显示成原始 id");
  // 不在任何分类里的动作永远不会出现在下拉框里，等于加了个用不到的功能
  assert.deepEqual(missingCategory, [], "ACTION_CATEGORIES 未收录：动作在下拉框里根本选不到");
  assert.deepEqual(missingHandler, [], "executeAction 没有对应 case：动作能选中但点了没反应");
});

// --- 模板规范 ---
test("所有动作链模板具有完备的元数据和合法动作", () => {
  const start = options.indexOf("const CHAIN_TEMPLATES = [");
  assert.notEqual(start, -1, "源码里找不到 CHAIN_TEMPLATES");
  const end = options.indexOf("\n];", start);
  const templatesBlock = options.slice(start, end + 3);

  const templateKeys = [...templatesBlock.matchAll(/key:\s*"([^"]+)"/g)].map((m) => m[1]);
  const categories = [...templatesBlock.matchAll(/category:\s*"([^"]+)"/g)].map((m) => m[1]);
  const nameKeys = [...templatesBlock.matchAll(/nameKey:\s*"([^"]+)"/g)].map((m) => m[1]);
  const descKeys = [...templatesBlock.matchAll(/descKey:\s*"([^"]+)"/g)].map((m) => m[1]);
  // 模板可以带一条「伴侣链」(companion) —— 流水线编排和条件分支都需要第二条链，
  // 它同样要声明 nameKey/descKey，所以元数据数量是「模板数 + 伴侣链数」。
  const companionCount = [...templatesBlock.matchAll(/^\s*companion:\s*\{/gm)].length;
  const metaCount = templateKeys.length + companionCount;

  assert.ok(templateKeys.length >= 25, `模板数量应至少包含25个，当前为 ${templateKeys.length}`);
  assert.equal(templateKeys.length, categories.length, "每个模板都必须声明 category");
  assert.equal(metaCount, nameKeys.length, `每个模板和伴侣链都必须声明 nameKey（${templateKeys.length} + ${companionCount}）`);
  assert.equal(metaCount, descKeys.length, `每个模板和伴侣链都必须声明 descKey（${templateKeys.length} + ${companionCount}）`);

  // "@companion" 是实例化时替换成真实链 key 的占位符。声明了伴侣链才解析得出来，
  // 否则模板生成的链会指向一个不存在的 key，运行时静默什么都不做。
  const segments = [...templatesBlock.matchAll(/\r?\n  \{\r?\n    (?:key|companion):/g)];
  for (let i = 0; i < segments.length; i++) {
    const seg = templatesBlock.slice(segments[i].index, segments[i + 1] ? segments[i + 1].index : templatesBlock.length);
    if (seg.includes('"@companion"')) {
      assert.ok(seg.includes("companion: {"), "模板引用了 @companion 但没有声明 companion 链");
    }
  }

  const validCategories = new Set(["ai", "tabs", "reading", "developer", "privacy", "workflow"]);
  for (const cat of categories) {
    assert.ok(validCategories.has(cat), `未知的模板分类: ${cat}`);
  }
  for (const nk of nameKeys) {
    assert.ok(EN_KEYS.has(nk), `模板 nameKey ${nk} 在 en/messages.json 中不存在`);
  }
  for (const dk of descKeys) {
    assert.ok(EN_KEYS.has(dk), `模板 descKey ${dk} 在 en/messages.json 中不存在`);
  }
  const catNameKeys = [...options.matchAll(/nameKey:\s*"(tmpl_cat_[^"]+)"/g)].map((m) => m[1]);
  for (const cnk of catNameKeys) {
    assert.ok(EN_KEYS.has(cnk), `分类 nameKey ${cnk} 在 en/messages.json 中不存在`);
  }
  assert.ok(templateKeys.includes("workflowAiResearch"), "缺少 workflowAiResearch 工作流模板");
  assert.ok(templateKeys.includes("workflowReadLater"), "缺少 workflowReadLater 工作流模板");
  assert.ok(templateKeys.includes("pureReader"), "缺少 pureReader 纯净阅读模板");
  assert.ok(templateKeys.includes("siteScriptShield"), "缺少 siteScriptShield 脚本防护模板");
  assert.ok(templateKeys.includes("workstationLaunch"), "缺少 workstationLaunch 工作台模板");

  // 验证模板使用的每一个 ACTION_TYPES 常量都真实存在
  const templateActionTypes = [...templatesBlock.matchAll(/type:\s*ACTION_TYPES\.(\w+)/g)].map((m) => m[1]);
  const actionConstants = new Set([...objectBlock(options, "ACTION_TYPES").matchAll(/^\s+(\w+):/gm)].map((m) => m[1]));
  for (const at of templateActionTypes) {
    assert.ok(actionConstants.has(at), `模板中使用了未在 ACTION_TYPES 中定义的动作常量: ACTION_TYPES.${at}`);
  }
});

test("options.html 包含模板库模态框核心元素与无障碍属性", () => {
  const optionsHtml = read("extension/options.html");
  assert.ok(optionsHtml.includes('id="templateGalleryModal"'), "缺少 templateGalleryModal");
  assert.ok(optionsHtml.includes('id="templateSearchInput"'), "缺少 templateSearchInput");
  assert.ok(optionsHtml.includes('id="templateCategoryFilters"'), "缺少 templateCategoryFilters");
  assert.ok(optionsHtml.includes('id="templateCardsContainer"'), "缺少 templateCardsContainer");
});

test("options.html 包含动作选择器模态框核心元素", () => {
  const optionsHtml = read("extension/options.html");
  assert.ok(optionsHtml.includes('id="actionPickerModal"'), "缺少 actionPickerModal");
  assert.ok(optionsHtml.includes('id="actionPickerSearchInput"'), "缺少 actionPickerSearchInput");
  assert.ok(optionsHtml.includes('id="actionPickerCategoryFilters"'), "缺少 actionPickerCategoryFilters");
  assert.ok(optionsHtml.includes('id="actionPickerListContainer"'), "缺少 actionPickerListContainer");
});

test("options.js 包含动作挑选器与快捷键感知相关逻辑", () => {
  assert.ok(options.includes("function openActionPicker("), "缺少 openActionPicker 函数");
  assert.ok(options.includes("function addActionToChain("), "缺少 addActionToChain 函数");
  // 快捷键徽章必须读 Chrome 实际登记的值，不能按槽位猜
  // （原来写死 shortcut_badge_slot1/2/3，用户改过或没分配时显示的是假值）
  assert.ok(options.includes("refreshCommandShortcuts"), "缺少真实快捷键读取");
  assert.ok(options.includes("shortcut_badge_withKey"), "缺少快捷键徽章标识引用");
  assert.ok(options.includes("empty_cta_templates"), "空状态缺少从模板库挑选引导");
  assert.ok(options.includes("template-customize-btn"), "模板卡片缺少去编辑自定义按钮");
  assert.ok(options.includes("template-add-btn"), "模板卡片缺少快速添加按钮");
  assert.ok(options.includes("toast-action-btn"), "Toast 缺少操作按钮支持");
});

test("background.js 包含工作流流水线与上下文变量传递引擎", () => {
  const bg = read("extension/background.js");
  assert.ok(bg.includes("nextChainKey"), "缺少工作流下一链流水线逻辑 (nextChainKey)");
  assert.ok(bg.includes("fallbackChainKey"), "缺少工作流故障备用分支逻辑 (fallbackChainKey)");
  assert.ok(bg.includes("lastOutput"), "缺少工作流上下文输出缓存逻辑 (lastOutput)");
  assert.ok(bg.includes("last_output") || bg.includes("prev.output"), "模板变量应包含 prev.output / last_output 支持");
});

test("options.html 与 options.js 包含工作流编排配置与卡片感知", () => {
  const optionsHtml = read("extension/options.html");
  assert.ok(optionsHtml.includes('id="chainNextStepSelect"'), "缺少 chainNextStepSelect 下拉框");
  assert.ok(optionsHtml.includes('id="chainFallbackStepSelect"'), "缺少 chainFallbackStepSelect 下拉框");
  assert.ok(optionsHtml.includes('id="chainPassOutputCheck"'), "缺少 chainPassOutputCheck 数据传递开关");
  assert.ok(optionsHtml.includes('id="workflowMiniPipeline"'), "缺少 workflowMiniPipeline 预览容器");

  const optionsJs = read("extension/options.js");
  assert.ok(optionsJs.includes("chainNextStepSelect"), "options.js 缺少下一步工作流控制逻辑");
  assert.ok(optionsJs.includes("workflow-chip"), "主卡片缺少工作流流转徽章");
  assert.ok(optionsJs.includes("renderWorkflowMiniPipeline"), "缺少流水线流程图渲染函数");
});

// --- i18n ---

const LOCALES = readdirSync(new URL("./extension/_locales", import.meta.url));
const localeKeys = (locale) => new Set(Object.keys(JSON.parse(read(`extension/_locales/${locale}/messages.json`))));
const EN_KEYS = localeKeys("en");

test("代码里静态引用的 i18n key 都存在于 en", () => {
  const used = new Set();
  for (const file of ["extension/background.js", "extension/options.js", "extension/content.js", "extension/sidepanel.js"]) {
    // 只取字面量 key；模板字符串拼出来的（cmd_execute_chain_${n} 之类）跳过
    for (const m of read(file).matchAll(/\bt\(\s*"([\w.]+)"/g)) used.add(m[1]);
  }
  for (const htmlFile of ["extension/options.html", "extension/sidepanel.html"]) {
    for (const m of read(htmlFile).matchAll(/data-i18n(?:-[a-z]+)?="([\w.]+)"/g)) used.add(m[1]);
  }
  const missing = [...used].filter((k) => !EN_KEYS.has(k));
  assert.deepEqual(missing, [], "代码用到但 _locales/en 里没有的 key");
});

test("语言目录数量没有意外增减", () => {
  assert.equal(LOCALES.length, 18);
});

// 每种语言单独一条用例，失败时一眼看得出是哪一种
for (const locale of LOCALES) {
  test(`_locales/${locale} 的 key 与 en 齐平`, () => {
    const keys = localeKeys(locale);
    assert.deepEqual([...EN_KEYS].filter((k) => !keys.has(k)), [], `${locale} 缺少的 key（用户会看到源码里的硬编码回退文案）`);
    assert.deepEqual([...keys].filter((k) => !EN_KEYS.has(k)), [], `${locale} 多出的 key（en 没有，多半是拼错或已废弃）`);
  });
}

// --- 版本 ---

test("manifest 与 package.json 版本一致", () => {
  // CI 发布时会拿 tag 去比 manifest；package.json 再和 manifest 对齐，
  // 三者才不会各说各话（商店显示 manifest 的，Release 页显示 tag 的）
  const manifest = JSON.parse(read("extension/manifest.json"));
  const pkg = JSON.parse(read("package.json"));
  assert.equal(manifest.version, pkg.version);
});

// --- Chrome Extension MV3 规范守则 ---

test("每个 JS 源文件都能通过语法解析", () => {
  // 本文件其余用例都是把源码当纯文本正则匹配，语法错误在它们眼里完全隐形：
  // background.js 曾经漏掉一个 }（把新代码插进了 showSystemNotification 内部），
  // 40 条用例全绿，而 service worker 根本解析不了 —— 整个扩展一个功能都不会触发。
  // 所以这里必须真的让解析器读一遍，不能只 grep。
  // 名单从目录里数，不手写：手写过的清单会漏掉新加的文件（theme.js 就是），
  // 而漏掉的那一个恰恰是没人守着的。
  const dir = new URL("./extension/", import.meta.url);
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".js"))
    .map((f) => "extension/" + f);
  assert.ok(files.length >= 5, `扩展源文件数量异常：${files.join(", ")}`);
  for (const file of files) {
    assert.doesNotThrow(
      () => new vm.Script(read(file), { filename: file }),
      `${file} 存在语法错误，扩展加载后会静默失效`,
    );
  }
});

test("源码使用 async/await，不使用 .then() 链式调用", () => {
  for (const file of ["extension/background.js", "extension/content.js", "extension/options.js", "extension/sidepanel.js"]) {
    const lines = read(file).split("\n");
    const thenLines = lines
      .map((l, i) => ({ line: i + 1, text: l }))
      .filter((item) => item.text.includes(".then("));
    assert.deepEqual(thenLines, [], `${file} 中存在 .then() 调用，请按 MV3 最佳实践重构为 async/await`);
  }
});

test("manifest 中声明的所有图标文件真实存在", () => {
  const manifest = JSON.parse(read("extension/manifest.json"));
  const iconPaths = [];
  if (manifest.icons) Object.values(manifest.icons).forEach((p) => iconPaths.push(p));
  if (manifest.action?.default_icon) {
    if (typeof manifest.action.default_icon === "string") iconPaths.push(manifest.action.default_icon);
    else Object.values(manifest.action.default_icon).forEach((p) => iconPaths.push(p));
  }
  for (const iconPath of iconPaths) {
    assert.doesNotThrow(() => readFileSync(new URL(`./extension/${iconPath}`, import.meta.url)), `图标 ${iconPath} 未找到`);
  }
});

test("不存在非法的 chrome.windows.query 调用", () => {
  for (const file of ["extension/background.js", "extension/options.js", "extension/content.js", "extension/sidepanel.js"]) {
    assert.equal(read(file).includes("windows.query"), false, `${file} 中包含了不存在的 chrome.windows.query API`);
  }
});

test("CHROMEWEBSTORE.md 存在且包含所有必要章节", () => {
  const cws = read("CHROMEWEBSTORE.md");
  const requiredSections = [
    "## Store Listing",
    "## Graphics & Assets",
    "## Permissions Justification",
    "## Privacy & Data Use",
    "## Privacy Policy",
    "## Distribution",
    "## Developer Info",
    "## Version History",
  ];
  for (const sec of requiredSections) {
    assert.equal(cws.includes(sec), true, `CHROMEWEBSTORE.md 缺少必要章节: ${sec}`);
  }
});

test("store-permissions.md 完备记录了 manifest 声明的全部权限", () => {
  const manifest = JSON.parse(read("extension/manifest.json"));
  const permDoc = read("store-permissions.md");
  for (const perm of manifest.permissions || []) {
    assert.ok(permDoc.includes(`\`${perm}\``), `store-permissions.md 缺少权限 ${perm} 的说明`);
  }
});

test("options.js 中 deleteChain 包含工作流断链引用清理逻辑", () => {
  assert.ok(options.includes("c.nextChainKey === chainKey"), "deleteChain 必须清理下游 nextChainKey 引用");
  assert.ok(options.includes("c.fallbackChainKey === chainKey"), "deleteChain 必须清理下游 fallbackChainKey 引用");
});

test("background.js 支持 raw unencoded 双大括号与 stoppedEarly 中断防护", () => {
  assert.ok(background.includes("stoppedEarly"), "executeChain 必须包含 stoppedEarly 阻断标识");
  assert.ok(background.includes("!rawKey && k !== \"url\""), "expandTemplate 必须支持双括号 {{}} 原样不转义输出");
});

test("expandTemplate 真的会替换变量（而不是原样输出）", async () => {
  // 这条用例存在的理由：上面那条只断言源码里出现过 "!rawKey && k !== url"，
  // 文本匹配当然通过 —— 但正则外层写成了捕获组 (...|...)，回调签名
  // (m, rawKey, key) 整体错位，rawKey 拿到的是整个匹配串，
  // 于是 {url} {title} {output} {date} 等所有变量都原样输出、且不报任何错。
  // 所以这里必须把函数真的抠出来跑一遍，不能再靠文本匹配。
  const start = background.indexOf("async function expandTemplate(");
  assert.notEqual(start, -1, "源码里找不到 expandTemplate");
  const endMatch = /\r?\n\}\r?\n/.exec(background.slice(start));
  assert.ok(endMatch, "找不到 expandTemplate 的函数结尾");
  const source = background.slice(start, start + endMatch.index + endMatch[0].length);

  const expand = new Function(
    "getSelectionText",
    "readClipboardText",
    `${source}\nreturn expandTemplate;`,
  )(async () => "SELECTED", async () => "CLIP");

  const tab = { id: 1, url: "https://example.com/p", title: "Example" };
  const ctx = { variables: { images: "IMG", links: "LNK", q: "a b&c" }, lastOutput: "OUT" };

  assert.equal(await expand("{title}|{url}", tab, { ctx }), "Example|https://example.com/p");
  assert.equal(await expand("{output}", tab, { ctx }), "OUT");
  // 自定义变量：extractMedia 模板靠 outputVar 把 images / links 传给下游
  assert.equal(await expand("{images}+{links}", tab, { ctx }), "IMG+LNK");
  assert.equal(await expand("{selection}", tab, { ctx }), "SELECTED");
  assert.equal(await expand("{clipboard}", tab, { ctx }), "CLIP");
  assert.match(await expand("{date}", tab, { ctx }), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(await expand("{time}", tab, { ctx }), /^\d{2}:\d{2}:\d{2}$/);
  // 认不出的变量要原样保留，不能被清空
  assert.equal(await expand("{nope}", tab, { ctx }), "{nope}");
  // encode 模式：单括号转义、双括号原样、url 例外
  assert.equal(await expand("{q}", tab, { ctx, encode: true }), "a%20b%26c");
  assert.equal(await expand("{{q}}", tab, { ctx, encode: true }), "a b&c");
  assert.equal(await expand("{url}", tab, { ctx, encode: true }), "https://example.com/p");
});

test("resolveLanguageName 不会把 auto 当成语言名拼进提示词", () => {
  // 动作参数默认是 "auto"，localeOverride 在用户没在选项页选语言时也是 "auto"。
  // 旧写法 `code = fallbackCode || "en"` 里 fallbackCode 为 "auto" 是真值，
  // 于是 code 停在 "auto"，查表失败又把 "auto" 原样返回 —— 开箱即用状态下
  // 三个 AI 动作发出的提示词都是 "... concisely in auto:"，一句废话指令。
  const namesStart = background.indexOf("const AI_LANGUAGE_NAMES = {");
  assert.notEqual(namesStart, -1, "找不到 AI_LANGUAGE_NAMES");
  const namesSrc = background.slice(namesStart, background.indexOf("\n};", namesStart) + 3);

  const fnStart = background.indexOf("function resolveLanguageName(");
  assert.notEqual(fnStart, -1, "找不到 resolveLanguageName");
  const fnEnd = /\r?\n\}\r?\n/.exec(background.slice(fnStart));
  assert.ok(fnEnd, "找不到 resolveLanguageName 的函数结尾");
  const fnSrc = background.slice(fnStart, fnStart + fnEnd.index + fnEnd[0].length);

  const resolve = new Function(`${namesSrc}\n${fnSrc}\nreturn resolveLanguageName;`)();

  // 两处都是 auto：必须返回空串表示「不指定语言」，让调用方拼出干净提示词
  assert.equal(resolve("auto", "auto"), "");
  assert.equal(resolve(undefined, "auto"), "");
  assert.equal(resolve("", ""), "");
  // 第二参传 undefined 会落到默认参数 "en"（不是 auto），所以这里得到 English 而非空串。
  // 实际调用点传的都是 localeOverride（恒为字符串），不会走到这个分支。
  assert.equal(resolve("auto", undefined), "English");
  // 只要有一处明确，就要查得出语言名
  assert.equal(resolve("auto", "zh_CN"), "Simplified Chinese");
  assert.equal(resolve("zh_CN", "auto"), "Simplified Chinese");
  assert.equal(resolve("ja", "auto"), "Japanese");
  assert.equal(resolve("en", "auto"), "English");
  // 区域码落到基础语言
  assert.equal(resolve("zh-CN", "en"), "Simplified Chinese");
  // 绝不允许把 "auto" 当语言名返回
  for (const [code, fallback] of [["auto", "auto"], ["auto", undefined], [undefined, "auto"], [undefined, undefined]]) {
    assert.notEqual(resolve(code, fallback), "auto", `resolveLanguageName(${code}, ${fallback}) 返回了 "auto"`);
  }
});

test("queryPromptAI 在隔离世界拿不到 API 时改用主世界重试", async () => {
  // 架构关键点：内容脚本默认注入 ISOLATED（隔离世界），而 LanguageModel 是否对隔离
  // 世界可见没有权威文档；MAIN（页面主世界）确定是普通 Window，而规范里 LanguageModel
  // 就是 [Exposed=Window]。所以必须「ISOLATED 拿不到就换 MAIN」，
  // 但「环境不支持」这类结论与运行世界无关，不该白试第二个世界。
  // 这条用例真的把 background.js 跑起来，用假 chrome 记录实际注入了哪些世界。
  const noop = () => {};
  // 记录实际注入了哪些世界（world 字段）。注意 scripting 必须是**同一个对象**：
  // 每次访问都返回新对象的话，下面替换 executeScript 就不会生效。
  const seen = [];
  let tabReply = null;
  const scriptingStub = {
    executeScript: async (opts) => {
      seen.push(opts.world || "ISOLATED");
      return [tabReply];
    },
  };
  // 递归深桩：chrome.alarms.onAlarm.addListener 是两层嵌套，浅层桩会挂在 .addListener 上。
  // 同时要保证 await 一个桩不会死循环（then 必须返回 undefined）。
  const deepStub = () =>
    new Proxy(async () => ({}), {
      get(_t, p) {
        if (p === "addListener" || p === "removeListener") return noop;
        if (p === "hasListener") return () => false;
        if (p === "then") return undefined;
        if (p === "lastError") return undefined;
        return deepStub();
      },
    });
  const chromeMock = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "notifications") return { create: async () => {} };
        if (prop === "i18n") return { getMessage: () => "", getUILanguage: () => "en" };
        if (prop === "scripting") return scriptingStub;
        if (prop === "runtime") {
          return {
            id: "test-ext",
            getURL: (u) => `chrome-extension://test/${u}`,
            getPlatformInfo: async () => ({}),
            onInstalled: { addListener: noop },
            onStartup: { addListener: noop },
            onMessage: { addListener: noop },
            lastError: undefined,
          };
        }
        if (prop === "storage") {
          return { local: { get: async () => ({}), set: async () => {} }, onChanged: { addListener: noop } };
        }
        return deepStub();
      },
    },
  );

  const ctx = vm.createContext({ chrome: chromeMock, console, fetch: async () => ({ ok: false }) });
  new vm.Script(background, { filename: "background.js" }).runInContext(ctx);

  // 隔离世界没有 API，主世界有结果 → 应该两个世界都试，最终拿到结果
  scriptingStub.executeScript = async (opts) => {
    seen.push(opts.world || "ISOLATED");
    return opts.world === "MAIN" ? [{ result: { result: "SUMMARY" } }] : [{ result: { state: "no-api" } }];
  };
  assert.equal(await vm.runInContext('queryPromptAI("p", "", 7)', ctx), "SUMMARY");
  assert.deepEqual(seen, ["ISOLATED", "MAIN"], "隔离世界没 API 时必须再用主世界试一次");

  // 隔离世界直接给结果 → 不该再注入主世界
  seen.length = 0;
  scriptingStub.executeScript = async (opts) => {
    seen.push(opts.world || "ISOLATED");
    return [{ result: { result: "OK" } }];
  };
  assert.equal(await vm.runInContext('queryPromptAI("p", "", 7)', ctx), "OK");
  assert.deepEqual(seen, ["ISOLATED"], "拿到结果后不该多注入一次");

  // 环境不支持（unavailable）→ 结论与运行世界无关，只试一次
  seen.length = 0;
  scriptingStub.executeScript = async (opts) => {
    seen.push(opts.world || "ISOLATED");
    return [{ result: { state: "not-ready", raw: "unavailable" } }];
  };
  assert.equal(await vm.runInContext('queryPromptAI("p", "", 7)', ctx), null);
  assert.deepEqual(seen, ["ISOLATED"], "「不支持」不该白试第二个世界");

  // 系统提示必须走 initialPrompts（不是已被移除的 systemPrompt 选项）。
  // 注意 vm 里造出来的对象原型和宿主 realm 不同，deepStrictEqual 会因原型不一致失败，
  // 所以逐字段断言。
  let passedOpts = null;
  scriptingStub.executeScript = async (opts) => {
    passedOpts = opts.args[1];
    return [{ result: { result: "X" } }];
  };
  await vm.runInContext('queryPromptAI("p", "SYS", 7)', ctx);
  assert.ok(passedOpts && Array.isArray(passedOpts.initialPrompts), "create 选项应带 initialPrompts");
  assert.equal(passedOpts.initialPrompts.length, 1);
  assert.equal(passedOpts.initialPrompts[0].role, "system");
  assert.equal(passedOpts.initialPrompts[0].content, "SYS");
  assert.equal("systemPrompt" in passedOpts, false, "不应再使用已移除的 systemPrompt 选项");
});

test("AI 状态诊断能区分四个上下文", () => {
  // 「检查 AI 状态」要能回答「到底是哪个上下文有 API」，而不是只给一个笼统结论。
  // 这条用例守的是「四个上下文都被探到、且原样回报 Chrome 给的值」。
  assert.ok(background.includes("async function probeAiContexts("), "缺少 probeAiContexts");
  assert.ok(background.includes('request.action === "probeAiContexts"'), "onMessage 没有接上 probeAiContexts");
  for (const key of ["sw", "isolated", "main"]) {
    assert.ok(background.includes(`${key}: null`), `probeAiContexts 缺少 ${key} 字段`);
  }
  assert.ok(background.includes('for (const [world, key] of [["ISOLATED", "isolated"], ["MAIN", "main"]])'), "probeAiContexts 没有遍历两个世界");

  const optionsJs = read("extension/options.js");
  assert.ok(optionsJs.includes('chrome.runtime.sendMessage({ action: "probeAiContexts" })'), "选项页没有调用诊断");
  assert.ok(optionsJs.includes("showAiReport"), "选项页没有展示诊断结果");
  // 诊断结果多行，toast 会压成一行，所以必须用能保留换行的容器
  assert.ok(optionsJs.includes("<pre"), "诊断结果应放在 <pre> 里保留换行");
});

test("AI 输出语言默认落到浏览器界面语言，而不是空着让模型自己猜", () => {
  // 不给语言指令时 Gemini Nano 会默认用英语回答（它的训练默认），
  // 于是中文用户拿到的是英文摘要。这条用例守的就是「必须落到一个具体语言」。
  const takeBlock = (decl) => {
    const s = background.indexOf(`const ${decl} = {`);
    assert.notEqual(s, -1, `找不到 ${decl}`);
    return background.slice(s, background.indexOf("\n};", s) + 3);
  };
  const takeFn = (name) => {
    const s = background.indexOf(`function ${name}(`);
    assert.notEqual(s, -1, `找不到 ${name}`);
    const end = /\r?\n\}\r?\n/.exec(background.slice(s));
    assert.ok(end, `找不到 ${name} 的函数结尾`);
    return background.slice(s, s + end.index + end[0].length);
  };
  const src = [
    takeBlock("AI_LANGUAGE_NAMES"),
    takeFn("resolveLanguageName"),
    // resolveAiOutputLanguage 现在委托给带「来源」信息的 Detailed 版本，两个都要带上
    takeFn("resolveAiOutputLanguageDetailed"),
    takeFn("resolveAiOutputLanguage"),
  ].join("\n");
  const make = (uiLang) =>
    new Function("chrome", `${src}\nreturn resolveAiOutputLanguage;`)({ i18n: { getUILanguage: () => uiLang } });

  // 默认路径（动作参数与界面覆盖都是 auto）→ 浏览器界面语言
  assert.equal(make("zh-CN")("auto", "auto"), "Simplified Chinese");
  assert.equal(make("zh-TW")("auto", "auto"), "Traditional Chinese");
  assert.equal(make("ja")("auto", "auto"), "Japanese");
  assert.equal(make("en-US")("auto", "auto"), "English");
  // 18 种界面语言之外的语言也不能返回空串或裸代码
  assert.equal(make("nl")("auto", "auto"), "Dutch");
  assert.equal(make("sv")("auto", "auto"), "Swedish");
  // 手动设置优先于界面语言
  assert.equal(make("zh-CN")("ja", "auto"), "Japanese");
  assert.equal(make("zh-CN")("auto", "de"), "German");
  assert.equal(make("zh-CN")("en", "de"), "English");
  // 任何情况下都不能是空串 —— 空串就等于不给语言指令，也就等于英文输出
  for (const ui of ["zh-CN", "en-US", "nl", "xx"]) {
    const v = make(ui)("auto", "auto");
    assert.ok(v && v !== "auto", `界面语言 ${ui} 下解析成了 ${JSON.stringify(v)}`);
  }
});

test("执行链会报分步进度（徽章 + 页面 HUD）", () => {
  // 原来徽章只有一个 ▶：用户知道有事发生，但不知道到哪一步、还有几步，
  // 长链尤其难判断是卡住了还是快好了。
  assert.ok(background.includes("async function badgeChainStep("), "缺少分步徽章");
  assert.ok(background.includes("async function sendProgress("), "缺少进度上报");
  assert.ok(background.includes('phase: "step"'), "没有上报 step 阶段");
  assert.ok(background.includes('phase: "end"'), "没有上报 end 阶段");

  // 进度必须在动作执行**之前**上报：AI 总结、等待导航这类动作本身可能耗好几秒，
  // 报在之后的话用户看到的永远是上一步。
  const loopIdx = background.indexOf("for (const action of chain.actions) {");
  const stepIdx = background.indexOf('phase: "step"');
  const execIdx = background.indexOf("const result = await executeAction(tab, action, actionCtx);");
  assert.ok(loopIdx < stepIdx && stepIdx < execIdx, `进度上报位置不对：loop=${loopIdx} step=${stepIdx} exec=${execIdx}`);

  // 嵌套链（run_chain）不该覆盖外层进度
  assert.ok(background.includes("if (activeChainRuns !== 1) return;"), "嵌套链会覆盖外层徽章");
  assert.ok(background.includes("const isOutermost = activeChainRuns === 1;"), "缺少最外层判定");

  // 进度用 tabs.sendMessage 直连：sendToContent 在失败时会注入整个 content.js，
  // 只为显示一个进度条不值得那个副作用。
  const sendStart = background.indexOf("async function sendProgress(");
  const sendBody = background.slice(sendStart, background.indexOf("\n}", sendStart));
  assert.ok(sendBody.includes("chrome.tabs.sendMessage"), "sendProgress 应直连 tabs.sendMessage");
  assert.ok(!sendBody.includes("sendToContent"), "sendProgress 不应触发 content.js 注入");

  // 内容脚本侧
  const content = read("extension/content.js");
  assert.ok(content.includes('case "chain_progress"'), "内容脚本没有接 chain_progress");
  assert.ok(content.includes("function showChainProgress("), "缺少 HUD 渲染函数");
  assert.ok(content.includes("function paintChainProgress("), "缺少 HUD 更新函数");
  // 链名是用户自己填的、动作名来自 locale 文件，都不能拼 innerHTML
  const hudStart = content.indexOf("function buildChainProgressEl(");
  const hudEnd = content.indexOf("function showNotification(");
  const hud = content.slice(hudStart, hudEnd);
  assert.ok(!hud.includes("innerHTML"), "HUD 不应使用 innerHTML 拼接动态文本");
  assert.ok(hud.includes("textContent"), "HUD 应用 textContent 写入动态文本");
});

test("进度里要出现当前动作的名字，而不只是序号", () => {
  // 徽章文本只够放几个字符，塞不下动作名。所以动作名要出现在两处：
  // 悬停提示（链跑在别的标签页时唯一的线索）和页面 HUD 的主行。
  assert.ok(background.includes("function actionDisplayName("), "缺少动作显示名解析");
  assert.ok(
    background.includes("t(`actionName_${type}`, type)"),
    "动作显示名应复用 locale 的 actionName_<type>，不要另建映射表",
  );
  // 进度载荷里必须带上动作名
  assert.ok(background.includes("actionName: stepLabel"), "进度载荷没有带动作名");
  assert.ok(background.includes("actionDisplayName(action.type)"), "没有解析当前动作名");
  // 徽章悬停提示
  assert.ok(background.includes("chrome.action.setTitle"), "徽章没有设置悬停提示");
  assert.ok(background.includes("badgeChainStep(stepIndex, totalSteps, stepLabel)"), "徽章没传动作名");
  // 结束后要恢复默认提示，否则上一次的动作名会一直留在图标上
  assert.ok(
    background.includes('chrome.action.setTitle({ title: t("action_defaultTitle"'),
    "结束后没有恢复默认悬停提示",
  );

  // HUD 主行应是动作名（data-role="name"），链名与计数退到次要行（data-role="meta"）
  const content = read("extension/content.js");
  const hudStart = content.indexOf("function buildChainProgressEl(");
  const hud = content.slice(hudStart, content.indexOf("function showNotification("));
  assert.ok(hud.includes('name.dataset.role = "name"'), "HUD 缺少主行节点");
  assert.ok(hud.includes('meta.dataset.role = "meta"'), "HUD 缺少次要行节点");
  assert.ok(hud.includes("actionName") && hud.includes("label = actionName"), "HUD 主行没有优先用后台给的动作名");
  assert.ok(!hud.includes('data-role="count"'), "计数不应再占据主行");

  // 每个动作都要能查出显示名，否则会退化成裸类型名
  const en = JSON.parse(read("extension/_locales/en/messages.json"));
  const actionValues = [...objectBlock(background, "ACTION_TYPES").matchAll(/^\s+\w+:\s*"(\w+)"/gm)].map((m) => m[1]);
  const missing = actionValues.filter((v) => !en[`actionName_${v}`]);
  assert.deepEqual(missing, [], `这些动作缺少 actionName_<type> 文案：${missing.join(", ")}`);
});

test("系统提示要声明输出语言，且写明「无论原文语言」", () => {
  // 只在用户提示里写 "in Simplified Chinese" 时，模型有可能跟着**原文**语言走 ——
  // 总结一篇日文页面就输出日文。系统提示里再声明一次、并写明「无论原文是什么语言」，
  // 才是兜住这种情况的地方。
  assert.ok(background.includes("function buildAiSystemPrompt("), "缺少带语言的系统提示构造函数");
  const i = background.indexOf("function buildAiSystemPrompt(");
  const body = background.slice(i, background.indexOf("\r\n}\r\n", i));
  assert.ok(body.includes("${languageName}"), "系统提示没有带上语言名");
  assert.ok(/no matter what language the/.test(body), "系统提示没有声明「无论原文语言」");

  // 1 处定义 + 3 处调用
  const calls = (background.match(/buildAiSystemPrompt\(/g) || []).length;
  assert.equal(calls, 4, `buildAiSystemPrompt 应出现 4 次（1 定义 + 3 调用），实际 ${calls}`);
  assert.ok(background.includes("buildAiSystemPrompt(langName)"), "摘要/解释没有把语言传进系统提示");
  assert.ok(background.includes("buildAiSystemPrompt(targetLangName)"), "翻译没有把目标语言传进系统提示");
  assert.equal(background.includes("AI_SYSTEM_PROMPT"), false, "仍有残留的旧常量 AI_SYSTEM_PROMPT");
});

test("诊断会说明活动标签页，且非网页标签页不报成错误", () => {
  // 用户在本扩展的选项页点诊断按钮时，活动标签页就是 options.html —— 注入不了。
  // 原来会显示 "Cannot access contents of url ... Extension manifest must request
  // permission"，看着像故障，其实不是。
  assert.ok(background.includes("out.tabUrl = tabUrl"), "诊断没有报出探测的标签页");
  assert.ok(background.includes("const injectable = /^https?:/i.test(tabUrl)"), "没有判断标签页能否注入");
  assert.ok(background.includes('out.isolated = "(n/a)"'), "非网页标签页应标成 n/a");
  assert.ok(background.includes('out.note = "active tab is not a web page'), "缺少说明");
  const optionsJs = read("extension/options.js");
  assert.ok(optionsJs.includes("probe.tabUrl"), "诊断卡没有展示探测的标签页");
});

test("文档里的动作数与语言 key 数与代码一致", () => {
  // 这两个数字散在很多文件、几十处（含每种语言的 extDescription 与商店长描述）。
  // 手写记不住，实测漂移过，所以改成从 SSOT 生成 + 这里守着。
  const r = spawnSync(process.execPath, ["scripts/sync-action-count.mjs", "--check"], {
    // 用 fileURLToPath 而不是 .pathname：后者在路径含空格时会拿到百分号编码
    cwd: fileURLToPath(new URL(".", import.meta.url)),
    encoding: "utf8",
  });
  assert.equal(
    r.status,
    0,
    `文档里的数字与代码不一致：\n${(r.stderr || r.stdout || "").trim()}\n` +
      "跑一次 `node scripts/sync-action-count.mjs` 并把它一起提交。",
  );
});

test("API.md 的模板表动作序列与代码一致", () => {
  // 这张表曾漂移 18/28 行：12 行多了已删掉的 show_notification、3 行少了动作、
  // 2 行动作名写错（bookmark → bookmark_page）、1 行整条不同。
  // 用 CHAIN_TEMPLATES 当 SSOT 逐行比对，动作名序列必须一致。
  const api = read("docs/API.md");
  const zh = JSON.parse(read("extension/_locales/zh_CN/messages.json"));

  const ctx = vm.createContext({ console, t: (k, f) => f || k });
  // CHAIN_TEMPLATES 是数组（objectBlock 只认对象字面量），单独切片。
  // 模板的 build() 里引用了 ACTION_TYPES，所以要把表也注入进去 ——
  // 注意 objectBlock 不含结尾的 `};`，得自己补上。
  const tplStart = options.indexOf("const CHAIN_TEMPLATES = [");
  assert.notEqual(tplStart, -1, "源码里找不到 CHAIN_TEMPLATES");
  const tplSrc = options.slice(tplStart, options.indexOf("\n];", tplStart) + 3);
  const atSrc = objectBlock(background, "ACTION_TYPES").replace("const ACTION_TYPES = ", "") + "};";
  new vm.Script(
    `globalThis.ACTION_TYPES = ${atSrc}\n${tplSrc.replace("const CHAIN_TEMPLATES = ", "globalThis.__TPL = ")}`,
  ).runInContext(ctx);
  const TPL = ctx.__TPL;
  const AT = ctx.ACTION_TYPES;
  assert.ok(Array.isArray(TPL) && TPL.length > 0, "没能从源码取出 CHAIN_TEMPLATES");
  assert.ok(AT && typeof AT === "object", "没能从源码取出 ACTION_TYPES");
  const actionNames = new Set(Object.values(AT));

  // 模板 key -> 中文名（表格里用的是中文名）
  const nameOf = new Map();
  const base = options.indexOf("const CHAIN_TEMPLATES = [");
  for (const m of options.slice(base).matchAll(/\r?\n  \{\r?\n(?:    \/\/[^\r\n]*\r?\n)*    key: "([^"]+)",/g)) {
    const seg = options.slice(base + m.index, base + m.index + 900);
    const nk = (seg.match(/nameKey:\s*"([^"]+)"/) || [])[1];
    nameOf.set(m[1], zh[nk]?.message || m[1]);
  }
  const keyByName = new Map([...nameOf.entries()].map(([k, n]) => [n, k]));

  const rows = [...api.matchAll(/^\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/gm)];
  assert.ok(rows.length >= TPL.length, `API.md 模板表只有 ${rows.length} 行，代码里有 ${TPL.length} 个模板`);

  // 只比「动作名序列」，忽略参数与说明文字。
  // 不能只匹配带下划线的名字 —— `confirm` / `wait` 没有下划线会被漏掉（实测踩过）。
  // 所以按 ACTION_TYPES 的名字集合过滤，顺序保留。
  const namesIn = (s) => (s.match(/[a-z][a-z0-9_]*/g) || []).filter((x) => actionNames.has(x)).join(",");
  const problems = [];
  for (const [, name, , seqCell] of rows) {
    const key = keyByName.get(name);
    if (!key) {
      problems.push(`${name}: 表格里的模板名在代码里找不到`);
      continue;
    }
    const t = TPL.find((x) => x.key === key);
    const real = [...t.build(), ...(t.companion ? t.companion.build() : [])].map((a) => a.type).join(",");
    const doc = namesIn(seqCell);
    if (doc !== real) problems.push(`${name}:\n     文档 ${doc}\n     实际 ${real}`);
  }
  assert.deepEqual(problems, [], `API.md 模板表与代码不一致：\n  ${problems.join("\n  ")}`);
});

test("两份权限说明表逐条一致，且覆盖 manifest 的全部权限", () => {
  // 这两份表曾漂移：26 条里 14 条措辞不同，其中 store-permissions.md —— README 让用户
  // 粘进 Edge 后台的那份 —— 少列了 6 个动作（tabGroups / browsingData / clipboardWrite /
  // notifications / tts / management）。理由写不全，审核就会问「这个权限到底干什么」。
  const sp = read("store-permissions.md");
  const cw = read("CHROMEWEBSTORE.md");
  // 两份表的列数不同：store-permissions 是 2 列，CHROMEWEBSTORE 是 3 列（多一个 Type）。
  // 所以各用一条完整正则 —— 用参数拼「中间那段」会拼出空交替，匹配不到任何行（踩过）。
  const grab = (text, re) =>
    Object.fromEntries([...text.matchAll(re)].map((m) => [m[1], m[2]]));
  const A = grab(sp, /^\|\s*`([^`]+)`\s*\|\s*(.+?)\s*\|\s*$/gm);
  const B = grab(cw, /^\|\s*`([^`]+)`\s*\|\s*[a-z_]+\s*\|\s*(.+?)\s*\|\s*$/gm);
  const norm = (s) => s.replace(/`/g, "").replace(/\s+/g, " ").trim();

  const manifest = JSON.parse(read("extension/manifest.json"));
  const need = [...manifest.permissions, ...(manifest.host_permissions || [])];
  assert.ok(need.length >= 25, `manifest 权限数异常：${need.length}`);

  for (const p of need) {
    assert.ok(A[p], `store-permissions.md 缺 ${p} 的理由`);
    assert.ok(B[p], `CHROMEWEBSTORE.md 缺 ${p} 的理由`);
    assert.equal(norm(A[p]), norm(B[p]), `${p} 的理由在两份表里不一致`);
  }
  for (const p of Object.keys(A)) {
    assert.ok(need.includes(p), `store-permissions.md 写了 manifest 里没有的权限：${p}`);
  }

  // manifest 声明了 content_scripts 对 <all_urls> 在 document_idle 运行 —— 也就是
  // 每个页面都会加载。两份文档此前都只说「按需、用户触发」，没有一句解释它，
  // 而审核看到 manifest 一定会问「为什么每个页面都要跑」。
  assert.ok(manifest.content_scripts?.length, "manifest 已不再声明 content_scripts，本测试需同步更新");
  for (const [name, text] of [
    ["store-permissions.md", sp],
    ["CHROMEWEBSTORE.md", cw],
  ]) {
    assert.ok(text.includes("Why a content script is declared for all URLs"), `${name} 没有解释常驻内容脚本`);
  }
});

test("快捷键徽章显示 Chrome 实际登记的值，不按槽位猜", () => {
  // 用户反馈「有些快捷键没在 chrome 上登记，却显示了快捷键」。
  // 原因：徽章按槽位写死 "快捷键: Ctrl+Shift+1/2/3" 和默认链的 Ctrl+Shift+H，
  // 而用户可能在 chrome://extensions/shortcuts 里改过或清空过，
  // 也可能因为冲突（被别的扩展或系统占用）Chrome 压根没分配。
  const optionsSrc = read("extension/options.js");

  // 必须读真实值
  assert.ok(optionsSrc.includes("chrome.commands.getAll()"), "没有读取已登记的命令");
  assert.ok(optionsSrc.includes("async function refreshCommandShortcuts()"), "缺少快捷键刷新函数");
  assert.ok(optionsSrc.includes("commandShortcuts.get(cmdName)"), "徽章没有用实际快捷键");
  // 回到本页时要重读（用户可能刚从 chrome://extensions/shortcuts 回来）
  assert.ok(optionsSrc.includes('document.addEventListener("visibilitychange"'), "没有在回到页面时刷新快捷键");

  // 不能残留按槽位写死的徽章文案
  for (const dead of ["shortcut_badge_default", "shortcut_badge_slot1", "shortcut_badge_slot2", "shortcut_badge_slot3"]) {
    assert.equal(optionsSrc.includes(dead), false, `仍在按槽位猜快捷键：${dead}`);
  }
  // 没分配到快捷键时要明说，而不是显示一个假的
  assert.ok(optionsSrc.includes("shortcut_badge_unset"), "没有处理「未设置快捷键」的状态");

  // 链 → 命令的解析必须和 background 的 executeChainByNumber 一致。
  // 它现在住在 shortcuts.js：设置页和侧边栏都要显示同一件事，两处各写一份必然漂移。
  const sharedSrc = read("extension/shortcuts.js");
  assert.ok(sharedSrc.includes("function hotkeyChainCommandName("), "缺少链到命令的解析");
  assert.ok(sharedSrc.includes('return "_execute_action"'), "默认链应绑定 _execute_action");
  assert.ok(sharedSrc.includes("!config.chains[`chain_${slot}`]"), "槽位回退条件与 background 不一致");
  for (const page of ["extension/options.js", "extension/sidepanel.js"]) {
    assert.ok(read(page).includes("hotkeyChainCommandName"), `${page} 没有复用共享的链→命令解析`);
  }
  assert.ok(!optionsSrc.includes("const hasSlot = (n) =>"), "options.js 里还留着一份自己的解析");

  // 随之失效的 4 个文案不应留在 locale 里
  const en = JSON.parse(read("extension/_locales/en/messages.json"));
  const stillThere = ["shortcut_badge_default", "shortcut_badge_slot1", "shortcut_badge_slot2", "shortcut_badge_slot3"].filter((k) => en[k]);
  assert.deepEqual(stillThere, [], `这些文案已无人引用，应删除：${stillThere.join(", ")}`);
  assert.ok(en.shortcut_badge_withKey?.message.includes("{key}"), "快捷键文案应保留 {key} 占位");
});

test("AI 失败时必须中止，不能让下游拼出「有壳没内容」的假卡片", () => {
  // 原来三个 AI 动作在拿不到结果时都是静默 break，链继续往下跑，
  // 后面的 copy_text 会拿**上一步的产物**拼出一张「有卡片壳、没有内容」的卡片 ——
  // 看起来像成功了，实际 AI 压根没跑。这是典型的「假完成」。
  const aiCases = ["AI_SUMMARIZE", "AI_EXPLAIN", "AI_TRANSLATE"];
  for (const name of aiCases) {
    const i = background.indexOf(`case ACTION_TYPES.${name}:`);
    assert.notEqual(i, -1, `找不到 ${name}`);
    const body = background.slice(i, background.indexOf("case ACTION_TYPES.", i + 10));
    assert.ok(
      body.includes('return { error: "ai-unavailable", stop: true }'),
      `${name} 在 AI 无产出时应返回 { error, stop }，而不是静默 break`,
    );
    assert.ok(body.includes('return { error: "ai-no-text", stop: true }'), `${name} 在无文字时应返回 { error, stop }`);
    // 不能残留「通知一下就 break」的写法
    const notifyThenBreak = /showSystemNotification\([\s\S]{0,200}?\);\r?\n\s+break;/.test(body);
    assert.equal(notifyThenBreak, false, `${name} 仍有「提示后静默 break」的路径`);
  }

  // 结果处理必须「先计错误再判 stop」，否则 {error, stop} 这种结果
  // 会因为 stop 先 break 而不计入错误数 —— 链结束时既不报错也不走 fallback。
  const errIdx = background.indexOf("if (result && result.error) errorCount++;");
  const stopIdx = background.indexOf("if (result && result.stop) {");
  assert.ok(errIdx !== -1 && stopIdx !== -1, "找不到结果处理分支");
  assert.ok(errIdx < stopIdx, "应先计错误再判 stop，否则 {error, stop} 不会被计入失败");
});

test("语言解析能报出「是哪一级决定的」", () => {
  // 用户选了「自动」却拿到日语时，只给一个最终语言名是查不出原因的 ——
  // 必须知道是动作里写死了、扩展界面语言、还是浏览器界面语言。
  const takeBlock = (decl) => {
    const s = background.indexOf(`const ${decl} = {`);
    assert.notEqual(s, -1, `找不到 ${decl}`);
    return background.slice(s, background.indexOf("\n};", s) + 3);
  };
  const takeFn = (name) => {
    const s = background.indexOf(`function ${name}(`);
    assert.notEqual(s, -1, `找不到 ${name}`);
    const end = /\r?\n\}\r?\n/.exec(background.slice(s));
    return background.slice(s, s + end.index + end[0].length);
  };
  const src = [
    takeBlock("AI_LANGUAGE_NAMES"),
    takeFn("resolveLanguageName"),
    takeFn("resolveAiOutputLanguageDetailed"),
  ].join("\n");
  const detailed = (uiLang) =>
    new Function("chrome", `${src}\nreturn resolveAiOutputLanguageDetailed;`)({ i18n: { getUILanguage: () => uiLang } });

  // 动作里写死了 → 以动作为准，来源标 action
  const a = detailed("zh-CN")("ja", "auto");
  assert.equal(a.name, "Japanese");
  assert.equal(a.source, "action");
  assert.equal(a.sourceValue, "ja");
  // 动作是 auto、界面语言手动设过 → 来源标 interface
  const b = detailed("ja")("auto", "zh_CN");
  assert.equal(b.name, "Simplified Chinese");
  assert.equal(b.source, "interface");
  // 都选自动 → 落到浏览器界面语言，来源标 browser（这正是「选了自动却出日语」的现场）
  const c = detailed("ja")("auto", "auto");
  assert.equal(c.name, "Japanese");
  assert.equal(c.source, "browser");
  assert.equal(c.sourceValue, "ja");
  // 三者都拿不到 → 回退英语
  const d = detailed("")("auto", "auto");
  assert.equal(d.source, "browser");
  assert.equal(d.name, "English");

  // 诊断卡必须把这条信息展示出来，否则用户无从排查
  assert.ok(background.includes("out.aiLanguage = lang.name"), "probeAiContexts 没有回报解析出的语言");
  assert.ok(background.includes("out.aiLanguageSource = lang.source"), "probeAiContexts 没有回报语言来源");
  assert.ok(background.includes("out.browserUiLanguage"), "probeAiContexts 没有回报浏览器界面语言");
  const optionsJs = read("extension/options.js");
  assert.ok(optionsJs.includes("probe.aiLanguage"), "诊断卡没有展示 AI 输出语言");
  assert.ok(optionsJs.includes("probe.browserUiLanguage"), "诊断卡没有展示浏览器界面语言");
  // 动作级语言会覆盖全局，界面上要说明
  assert.equal(
    (optionsJs.match(/hint_actionLangOverrides/g) || []).length,
    3,
    "三个 AI 语言下拉都应带「动作级会覆盖全局」的提示",
  );
});

test("模板不再重复弹系统通知", () => {
  // 每个模板末尾原本都挂一个 show_notification，而它是**系统级（OS）弹窗**。
  // 但前一步动作自己就会弹提示（copy_text / bookmark / clear_* / ai_* …），
  // 或效果本身肉眼可见（页面变暗、侧边栏打开、窗口移动），再弹一次纯属打扰。
  // 唯一该保留的是 selectionSearch 的引导提示 —— 没有它，没选中文字时链会静默什么都不做。
  const optionsSrc = read("extension/options.js");
  const start = optionsSrc.indexOf("const CHAIN_TEMPLATES = [");
  const endIdx = optionsSrc.indexOf("\n];", start);
  const block = optionsSrc.slice(start, endIdx);
  const notifCount = (block.match(/ACTION_TYPES\.SHOW_NOTIFICATION/g) || []).length;
  assert.equal(notifCount, 1, `模板里应只剩 1 处系统通知（划词即搜的引导），当前 ${notifCount} 处`);
  assert.ok(block.includes("tmpl_selectionSearch_elseMsg"), "引导提示必须保留");

  // 随之失效的文案不应留在 locale 里
  const en = JSON.parse(read("extension/_locales/en/messages.json"));
  const deadKeys = [
    "tmpl_webEditor_done", "tmpl_extractMedia_done", "tmpl_privacyWipe_done", "tmpl_copyMarkdown_done",
    "tmpl_snapshot_done", "tmpl_sidePanelCompanion_done", "tmpl_workflowAiResearch_done",
    "tmpl_workflowReadLater_done", "tmpl_aiKnowledgeCard_done", "tmpl_workflowDevClean_done",
    "tmpl_workflowCleanWorkspace_done", "tmpl_pureReader_done", "tmpl_workstationLaunch_done",
    "tmpl_pipelineSummarySpeak_done", "tmpl_reloadThenExtract_done",
  ];
  const stillThere = deadKeys.filter((k) => en[k]);
  assert.deepEqual(stillThere, [], `这些文案已无人引用，应删除：${stillThere.join(", ")}`);

  // AI 工作流不该让 AI_SUMMARIZE 先抢一次剪贴板（后面紧跟 COPY_TEXT 格式化）
  const aiResearch = block.slice(block.indexOf('key: "workflowAiResearch"'), block.indexOf('key: "workflowReadLater"'));
  assert.ok(
    /AI_SUMMARIZE[^}]*noCopy: true/.test(aiResearch),
    "workflowAiResearch 的 AI_SUMMARIZE 应设 noCopy: true，否则会多弹一条误导的「已复制」",
  );
});

test("提取动作支持 noCopy，避免中间结果先占剪贴板", () => {
  // 模板里常把多个提取结果合并后再复制。若每个提取动作都顺手写剪贴板并弹提示，
  // 用户会看到「已复制图片」「已复制链接」「已复制」三条，而前两条是误导 ——
  // 剪贴板最终只有最后那份。所以提取动作要支持「只要输出、不要剪贴板」。
  const content = read("extension/content.js");
  const errorKeys = { extract_all_links: "content_noLinksFound", extract_all_images: "content_noImagesFound" };
  for (const act of ["extract_all_links", "extract_all_images"]) {
    const i = content.indexOf(`case "${act}": {`);
    assert.notEqual(i, -1, `找不到 ${act} 的处理器`);
    const body = content.slice(i, content.indexOf('case "', i + 10));
    assert.ok(body.includes("request.noCopy"), `${act} 没有处理 noCopy`);
    // 「没找到内容」是错误路径，提示必须保留（不受 noCopy 影响）
    assert.ok(body.includes(errorKeys[act]), `${act} 的错误提示不应被 noCopy 关掉`);
  }
  // 后台要把参数转发给内容脚本（原来只传 action.type）
  assert.ok(
    background.includes('{ action: action.type, noCopy: !!action.noCopy }'),
    "后台没有把 noCopy 转发给内容脚本",
  );
  // 提取动作要从 COPY_* 的共用分组里拆出来，否则会往复制类动作上挂一个无意义的参数
  const copyGroup = background.slice(
    background.indexOf("case ACTION_TYPES.COPY_URL:"),
    background.indexOf("case ACTION_TYPES.EXTRACT_ALL_LINKS:"),
  );
  assert.ok(!copyGroup.includes("EXTRACT_ALL_LINKS"), "提取动作不应和 COPY_* 混在同一分组");

  // 模板里确实用上了
  const optionsSrc = read("extension/options.js");
  const extractMedia = optionsSrc.slice(
    optionsSrc.indexOf('key: "extractMedia"'),
    optionsSrc.indexOf('key: "cinema"'),
  );
  assert.ok(
    /EXTRACT_ALL_IMAGES[^}]*noCopy: true/.test(extractMedia) &&
      /EXTRACT_ALL_LINKS[^}]*noCopy: true/.test(extractMedia),
    "extractMedia 的两个提取步骤都应设 noCopy: true",
  );
  // 参数要有界面开关，不能只靠模板写死
  assert.ok(optionsSrc.includes("extract-nocopy-check"), "缺少 noCopy 的界面开关");
  assert.ok(optionsSrc.includes('target.matches(".extract-nocopy-check")'), "缺少 noCopy 开关的事件处理");
});

test("稍后读模板真的用了阅读清单动作", () => {
  // 模板名叫「稍后读」，而 Chrome 的「稍后读」就是阅读清单（read_later）。
  // 只加书签是另一回事 —— 名不副实会让用户以为进了阅读清单。
  const optionsSrc = read("extension/options.js");
  const blk = optionsSrc.slice(
    optionsSrc.indexOf('key: "workflowReadLater"'),
    optionsSrc.indexOf('key: "aiKnowledgeCard"'),
  );
  assert.ok(blk.includes("ACTION_TYPES.READ_LATER"), "workflowReadLater 没有用 read_later");
  assert.ok(blk.includes("ACTION_TYPES.COPY_AS_MARKDOWN"), "workflowReadLater 应保留 Markdown 提取");
  assert.ok(blk.includes("ACTION_TYPES.BOOKMARK"), "workflowReadLater 应保留书签");
  // 名字里两件事都要有：稍后读（阅读清单）+ 归档（Markdown / 书签）
  assert.ok(blk.includes("tmpl_workflowReadLater_desc"), "缺少模板描述 key");
});

test("AI 动作清单在所有判定 AI 徽章的地方保持一致", () => {
  // 徽章判定写在三个地方：options.js 的 hasAi、sidepanel.js 的 hasAi、
  // 以及模板的 requiresAi。新增第 4 个 AI 动作时漏掉任何一处，
  // 卡片就不会显示「需端侧 AI」，用户点下去才发现跑不了。
  const aiValues = [...objectBlock(background, "ACTION_TYPES").matchAll(/^\s+AI_\w+:\s*"(\w+)"/gm)].map((m) => m[1]);
  assert.ok(aiValues.length >= 3, `AI 动作数量异常：${aiValues.length}`);

  const grabHasAi = (source, label) => {
    const start = source.indexOf("const hasAi = (chain.actions || []).some(");
    assert.notEqual(start, -1, `${label} 里找不到 hasAi 判定`);
    const end = source.indexOf(");", start);
    assert.notEqual(end, -1, `${label} 的 hasAi 判定没有正常结束`);
    return source.slice(start, end);
  };
  const optBlock = grabHasAi(read("extension/options.js"), "options.js");
  const spBlock = grabHasAi(read("extension/sidepanel.js"), "sidepanel.js");

  for (const value of aiValues) {
    const constant = value.toUpperCase(); // ai_summarize -> AI_SUMMARIZE
    assert.ok(optBlock.includes(`ACTION_TYPES.${constant}`), `options.js 的 hasAi 漏了 ACTION_TYPES.${constant}`);
    assert.ok(spBlock.includes(`"${value}"`), `sidepanel.js 的 hasAi 漏了 "${value}"`);
  }
});

test("支持完整的 Chrome 自动化 API 扩展 (webNavigation, contentSettings, topSites, 102+ 动作)", () => {
  const manifest = JSON.parse(read("extension/manifest.json"));
  assert.ok(manifest.permissions.includes("webNavigation"), "manifest 缺少 webNavigation 权限");
  assert.ok(manifest.permissions.includes("contentSettings"), "manifest 缺少 contentSettings 权限");
  assert.ok(manifest.permissions.includes("topSites"), "manifest 缺少 topSites 权限");

  assert.ok(background.includes("chrome.webNavigation.onHistoryStateUpdated"), "background 缺少 SPA 路由监听");
  assert.ok(background.includes("toggleContentSetting"), "background 缺少 toggleContentSetting 辅助函数");

  const bg = actionValues(background);
  assert.ok(bg.size >= 102, `动作数量应达到至少 102 个，当前为: ${bg.size}`);
  assert.ok(bg.has("toggle_site_javascript"), "缺少 toggle_site_javascript 动作");
  assert.ok(bg.has("toggle_site_images"), "缺少 toggle_site_images 动作");
  assert.ok(bg.has("toggle_site_popups"), "缺少 toggle_site_popups 动作");
  assert.ok(bg.has("open_top_sites"), "缺少 open_top_sites 动作");
  assert.ok(bg.has("wait_for_navigation"), "缺少 wait_for_navigation 动作");
});

test("options.html 与 options.js 包含端侧 AI 状态检测与提醒机制", () => {
  const optionsHtml = read("extension/options.html");
  assert.ok(optionsHtml.includes('id="checkAiStatusBtn"'), "options.html 缺少 checkAiStatusBtn 按钮");
  assert.ok(optionsHtml.includes('data-i18n-title="btn_checkAiStatus"'), "checkAiStatusBtn 缺少本地化标题属性");

  const optionsJs = read("extension/options.js");
  assert.ok(optionsJs.includes("checkAiStatusBtn"), "options.js 缺少 checkAiStatusBtn 事件监听");
  assert.ok(optionsJs.includes("badge_requiresAi"), "options.js 缺少 badge_requiresAi 提示徽章");
  assert.ok(optionsJs.includes("hint_aiRequirement"), "options.js 缺少 hint_aiRequirement 配置要求引导");
});

test("background.js 包含端侧 Prompt API 委托与异常兜底", () => {
  const bg = read("extension/background.js");
  assert.ok(bg.includes("queryPromptAI(prompt, systemPrompt = \"\", tabId = null)"), "queryPromptAI 必须支持 tabId 参数传递");
  assert.ok(bg.includes("chrome.scripting.executeScript"), "queryPromptAI 必须在 SW 无 AI 时委托 tabId 执行");
  assert.ok(bg.includes("msg_noTopSites"), "open_top_sites 必须包含空历史记录兜底提示");
  assert.ok(bg.includes("showSystemNotification(msg,"), "toggleContentSetting 必须包含系统通知兜底");
});

test("Prompt API 的可用性枚举必须新旧两套都认", () => {
  // 这条用例的理由：LanguageModel.availability() 返回
  // available / downloadable / downloading / unavailable，
  // 而旧的 ai.languageModel.capabilities() 返回 readily / after-download / no。
  // 此前只比较旧值，于是 "unavailable" 落进 else 分支被当成「已就绪」——
  // 状态检测会对着一个根本跑不了的浏览器报「✅ 已就绪」，然后 create() 抛错。
  // 所以这里必须真的把归一化函数抠出来，把两套取值都喂进去。
  const start = background.indexOf("function normalizeAiAvailability(");
  assert.notEqual(start, -1, "源码里找不到 normalizeAiAvailability");
  const endMatch = /\r?\n\}\r?\n/.exec(background.slice(start));
  assert.ok(endMatch, "找不到 normalizeAiAvailability 的函数结尾");
  const source = background.slice(start, start + endMatch.index + endMatch[0].length);
  const normalize = new Function(`${source}\nreturn normalizeAiAvailability;`)();

  // 新 API 取值
  assert.equal(normalize("available"), "ready");
  assert.equal(normalize("downloadable"), "downloadable");
  assert.equal(normalize("downloading"), "downloading");
  assert.equal(normalize("unavailable"), "unavailable");
  // 旧 API 取值
  assert.equal(normalize("readily"), "ready");
  assert.equal(normalize("after-download"), "downloadable");
  assert.equal(normalize("no"), "unavailable");
  // 认不出的值不能算「就绪」
  assert.equal(normalize("something-new"), "unknown");
  assert.notEqual(normalize("unavailable"), "ready");

  // 两个调用点都必须用它，不能各自写一套比较
  const options = read("extension/options.js");
  assert.ok(background.includes("normalizeAiAvailability("), "background.js 必须用归一化函数");
  assert.ok(options.includes("normalizeAiAvailability("), "options.js 的 AI 状态检测必须用归一化函数");
  // 旧写法的痕迹不该再出现在可用性比较里
  for (const file of ["extension/background.js", "extension/options.js"]) {
    assert.equal(read(file).includes('=== "after-download"'), false, `${file} 仍在直接比较旧的 after-download`);
    assert.equal(read(file).includes('=== "no"'), false, `${file} 仍在直接比较旧的 "no"`);
  }
});

test("background.js 和 options.js 完整支持端侧 AI 与 TTS 语言和参数配置", () => {
  const bg = read("extension/background.js");
  const opt = read("extension/options.js");

  // Language mapping & TTS tags in background
  assert.ok(bg.includes("resolveLanguageName"), "background.js 缺少 resolveLanguageName 辅助函数");
  assert.ok(bg.includes("BCP47_LANGUAGE_TAGS"), "background.js 缺少 BCP47_LANGUAGE_TAGS 语言映射表");
  assert.ok(bg.includes("action.targetLang"), "background.js AI_TRANSLATE 缺少 action.targetLang");
  assert.ok(bg.includes("action.summaryLang"), "background.js AI_SUMMARIZE 缺少 action.summaryLang");
  assert.ok(bg.includes("action.explainLang"), "background.js AI_EXPLAIN 缺少 action.explainLang");
  assert.ok(bg.includes("action.format"), "background.js AI_SUMMARIZE 缺少 action.format");
  assert.ok(bg.includes("action.style"), "background.js AI_EXPLAIN/TRANSLATE 缺少 action.style");
  assert.ok(bg.includes("action.preferOutput"), "background.js SPEAK_SELECTION 缺少 action.preferOutput");

  // Options page UI controls and event bindings
  assert.ok(opt.includes("SUPPORTED_LANGUAGES"), "options.js 缺少 SUPPORTED_LANGUAGES 定义");
  assert.ok(opt.includes("generateLanguageOptions"), "options.js 缺少 generateLanguageOptions 辅助函数");
  assert.ok(opt.includes("ai-target-lang-select"), "options.js 缺少 ai-target-lang-select 控件");
  assert.ok(opt.includes("ai-translate-style-select"), "options.js 缺少 ai-translate-style-select 控件");
  assert.ok(opt.includes("ai-summary-lang-select"), "options.js 缺少 ai-summary-lang-select 控件");
  assert.ok(opt.includes("ai-summary-format-select"), "options.js 缺少 ai-summary-format-select 控件");
  assert.ok(opt.includes("ai-explain-lang-select"), "options.js 缺少 ai-explain-lang-select 控件");
  assert.ok(opt.includes("ai-explain-style-select"), "options.js 缺少 ai-explain-style-select 控件");
  assert.ok(opt.includes("tts-lang-select"), "options.js 缺少 tts-lang-select 控件");
  assert.ok(opt.includes("tts-rate-input"), "options.js 缺少 tts-rate-input 控件");
  assert.ok(opt.includes("tts-prefer-output-check"), "options.js 缺少 tts-prefer-output-check 控件");
  assert.ok(opt.includes("translate-page-lang-select"), "options.js 缺少 translate-page-lang-select 控件");
  assert.ok(opt.includes("search-prefer-output-check"), "options.js 缺少 search-prefer-output-check 控件");
  assert.ok(bg.includes("action.targetLang.replace"), "background.js TRANSLATE_PAGE 缺少 action.targetLang 处理");
  assert.ok(bg.includes("queryText = (action.preferOutput"), "background.js SEARCH_SELECTION 缺少 action.preferOutput 处理");

  const sp = read("extension/sidepanel.js");
  assert.ok(opt.includes("hasAi"), "options.js 动作链卡片缺少 AI 标识感知");
  assert.ok(sp.includes("hasAi"), "sidepanel.js 缺少 AI 标识感知");
});

// --- 打磨稿落地的证人判据 ---
// 每条都对应一个真实踩过的坑；写完先故意破坏一次确认它会红，
// 不然它只是装饰（见「不变量测试要故意破坏一次」）。

test("带占位符的句子不许在调用点自己 replace", () => {
  // chrome.i18n.getMessage 不传替换参数时会把 $1 删掉再返回，
  // 所以 t(key).replace("$1", v) 永远替换不到东西 —— 这就是「ms」「个动作」事故的成因。
  for (const file of ["extension/options.js", "extension/content.js", "extension/sidepanel.js", "extension/background.js"]) {
    const src = read(file);
    const hits = src
      .split("\n")
      .map((l, i) => [i + 1, l])
      .filter(([, l]) => !l.trim().startsWith("//") && !l.trim().startsWith("*") && /replace\(\s*["']\$1["']/.test(l));
    assert.deepEqual(hits, [], `${file} 仍在调用点自己拼占位符；请改用 t(key, fallback, args)`);
  }
});

test("t() 的替换契约在三个页面里一致", () => {
  // background 一直是对的，页面侧曾经各写一份没有 args 的 t()
  for (const file of ["extension/options.js", "extension/content.js", "extension/sidepanel.js"]) {
    const src = read(file);
    assert.ok(/function t\([^)]*args/.test(src), `${file} 的 t() 没有替换参数`);
    assert.ok(src.includes("chrome.i18n.getMessage("), `${file} 的 t() 没有走 i18n`);
  }
});

test("提示弹层不 anchored 在顶部", () => {
  // 右上角是主按钮的位置，提示一停 3 秒就把它们盖住
  const src = read("extension/options.js");
  assert.ok(!src.includes('"toast-container position-fixed top-0'), "提示容器又回到了顶部");
  assert.ok(src.includes("toast-container position-fixed bottom-0"), "提示容器应锚在底部右侧");
});

test("可见的徽章颜色不写在 JS 内联样式里", () => {
  // 内联样式任何主题都够不着：侧边栏暗色的三处漏网有两处就是这么来的
  for (const file of ["extension/options.js", "extension/sidepanel.js"]) {
    const src = read(file);
    const hits = src
      .split("\n")
      .map((l, i) => [i + 1, l])
      .filter(([n, l]) => /class="[^"]*(badge|chip)[^"]*"[^>]*style="[^"]*(background|color)\s*:\s*(#|rgba?\()/.test(l));
    assert.deepEqual(hits, [], `${file} 的徽章又用内联颜色：${hits.map((h) => h[0]).join(", ")}`);
  }
});

test("破坏性动作的回执说清了对象并给了退路", () => {
  const src = read("extension/options.js");
  // 删除链：确认文案是一个完整句子，回执带撤销，而不是复用按钮标签
  assert.ok(src.includes('t("confirm_deleteChain"'), "删除链没有用整句确认文案");
  assert.ok(src.includes('t("toast_deletedChain"'), "删除回执没有写出被删的是哪条链");
  assert.ok(src.includes('t("toast_undo"'), "删除回执没有撤销");
  assert.ok(!/showMessage\(t\("card_delete", "删除"\)\)/.test(src), "删除回执又变回按钮标签两个字");
  // 删一个动作同样要能反悔
  assert.ok(src.includes('t("toast_removedAction"'), "移除单个动作没有回执");
});

test("被截断的文本有等价的全量出口", () => {
  // .chain-title 是 nowrap+ellipsis，没有 title 就只看得见前半段
  const src = read("extension/options.js");
  assert.ok(/class="chain-title"[^>]*\stitle=/.test(src), "链名被截断但没有 title 出口");
});

test("每个带 id 的表单控件都有可访问名", () => {
  // 标签写在 <label> 里但没 for，等于读屏软件读不到
  for (const htmlFile of ["extension/options.html", "extension/sidepanel.html"]) {
    const src = read(htmlFile);
    const ids = [...src.matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
    const unlabeled = ids.filter((id) => {
      const hasFor = new RegExp(`<label[^>]*for="${id}"`).test(src);
      const tag = new RegExp(`<[a-z]+[^>]*id="${id}"[^>]*>`).exec(src)?.[0] || "";
      const hasAria = /aria-label=/.test(tag);
      const isHidden = /type="hidden"| hidden[ />]/.test(tag);
      return !(hasFor || hasAria || isHidden);
    });
    assert.deepEqual(unlabeled, [], `${htmlFile} 里这些控件没有可访问名：${unlabeled.join(", ")}`);
  }
});

test("从扩展页面发起的运行必须要求一个真实网页", () => {
  // 设置页/侧边栏不是标签页，sender.tab 为空；没有这条守卫时链会打在自己身上，
  // 实测「放大」把设置页缩放推到了 2.0
  const bg = read("extension/background.js");
  assert.ok(bg.includes("request.expectWebTab"), "background 不再拒绝无网页目标的运行");
  assert.ok(bg.includes("noWebTab"), "background 没有报出「没有可作用的网页」这个状态");
  for (const page of ["extension/options.js", "extension/sidepanel.js"]) {
    assert.ok(read(page).includes("expectWebTab: true"), `${page} 发起的运行没有要求真实网页`);
  }
});

test("方向与 RTL 语言表只有一份", () => {
  // 设置页镜像 RTL，侧边栏以前从不设 dir —— 同一串阿语在两个表面两种排法
  const shared = read("extension/direction.js");
  assert.ok(shared.includes("const RTL_LOCALES"), "direction.js 丢了 RTL 语言表");
  assert.ok(shared.includes("function applyTextDirection("), "direction.js 丢了方向函数");
  assert.ok(!read("extension/options.js").includes("const RTL_LOCALES"), "options.js 又留了一份自己的 RTL 表");
  for (const page of ["extension/options.js", "extension/sidepanel.js"]) {
    const calls = (read(page).match(/applyTextDirection\(/g) || []).length;
    // once on load and once when the language changes — a page that only does
    // the first keeps the old direction until reload
    assert.ok(calls >= 2, `${page} 只在其中一条路径上应用了文字方向（${calls} 处）`);
  }
  for (const htmlFile of ["extension/options.html", "extension/sidepanel.html"]) {
    assert.ok(read(htmlFile).includes("direction.js"), `${htmlFile} 没有加载共享脚本`);
  }
});

test("承重的文字颜色对得上对比度", () => {
  // 这些配对是实测翻车过的：灰字压在被调深的胶囊底色上只有 2.36:1。
  // 用算的，不开浏览器，所以 CI 的干净克隆里也能跑。
  const css = read("extension/options.css");
  const hex = (h) => {
    const v = h.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
  };
  const lum = (c) => {
    const f = (v) => (v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(hex(a)), lum(hex(b))].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const tokens = (block) => {
    const at = css.indexOf(block);
    assert.notEqual(at, -1, `找不到 ${block}`);
    const body = css.slice(at, css.indexOf("}", at));
    return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{3,8})/g)].map((m) => [m[1], m[2]]));
  };
  const light = tokens(":root {");
  const dark = tokens('html[data-bs-theme="dark"] {');
  // 承载信息的灰字：正文要求 4.5:1
  for (const [mode, t] of Object.entries({ light, dark })) {
    assert.ok(ratio(t["--ink-2"], t["--bg-tint"]) >= 4.5, `${mode} --ink-2 on --bg-tint = ${ratio(t["--ink-2"], t["--bg-tint"]).toFixed(2)}`);
    assert.ok(ratio(t["--ink-3"], t["--bg-tint"]) >= 4.5, `${mode} --ink-3 on --bg-tint = ${ratio(t["--ink-3"], t["--bg-tint"]).toFixed(2)}`);
    assert.ok(ratio(t["--brand-ink"], t["--brand-soft"]) >= 4.5, `${mode} 快捷键徽章对比不足`);
    // 拖拽把手是重复出现的非文本线索，按 3:1 判
    assert.ok(ratio(t["--ink-deco"], t["--card"]) >= 3, `${mode} 拖拽把手低于 3:1`);
  }
});

test("暗色下的嵌套面要能看出层级", () => {
  // 亮色靠投影把卡片从面板里托起来，暗色没有这件事：嵌套面一旦和容器同色，
  // 模板库看起来就是一个空面板（实测 templateCardVsModal 1.00）。
  const css = read("extension/options.css");
  const hex = (h) => {
    const v = h.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
  };
  const lum = (c) => {
    const f = (v) => (v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(hex(a)), lum(hex(b))].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const at = css.indexOf('html[data-bs-theme="dark"] {');
  assert.notEqual(at, -1, "找不到暗色 token 块");
  const body = css.slice(at, css.indexOf("}", at));
  const token = (name) => {
    const m = body.match(new RegExp(name + ":\\s*#([0-9a-fA-F]{6})"));
    assert.ok(m, `暗色 token ${name} 不见了`);
    return m[0].split(":")[1].trim();
  };
  const surface2 = token("--surface-2");
  const card = token("--card");
  const page = token("--bg");
  assert.ok(ratio(surface2, card) >= 1.15, `嵌套面只比容器亮 ${ratio(surface2, card).toFixed(2)}`);
  assert.ok(ratio(card, page) >= 1.05, "卡片和页面底色分不开");
  // 光有 token 不算：得真的挂在这些选择器上
  const applies = (selector, value) => {
    const i = css.indexOf(`html[data-bs-theme="dark"] ${selector}`);
    assert.notEqual(i, -1, `暗色没有 ${selector} 规则`);
    const rule = css.slice(i, css.indexOf("}", i));
    assert.ok(rule.includes(value), `${selector} 没有用 ${value}`);
  };
  applies(".template-card,", "var(--surface-2)");
  applies(".action-picker-item,", "var(--surface-2)");
  applies(".action-config,", "var(--surface-2)");
  applies(".chain-info-panel,", "var(--surface-2)");
  applies(".template-actions-flow", "var(--card)");
  // 嵌套面是新底色，压在新底色上的字要重新量一次
  assert.ok(ratio(token("--ink-2"), surface2) >= 4.5, "灰字压不住嵌套面");
  assert.ok(ratio(token("--ink-deco"), surface2) >= 3, "嵌套面上的拖拽把手太暗");
});


test("卡片上的「运行」和「编辑」不能挤在同一个按钮里", () => {
  // 事件代理先认 execute-btn，两个类同时出现时「添加动作」会去运行一条空链，
  // 编辑器根本打不开。
  const both = /class="[^"]*execute-btn[^"]*edit-chain-btn[^"]*"|class="[^"]*edit-chain-btn[^"]*execute-btn[^"]*"/;
  assert.ok(!both.test(options), "空链入口同时带了 execute-btn 和 edit-chain-btn");
});

test("跑起来的链要能在页面上叫停", () => {
  const content = read("extension/content.js");
  // HUD 容器屏蔽点击的话，「停止」就是一块看得见的死字
  assert.match(content, /pointer-events: auto/, "HUD 仍然屏蔽指针事件");
  assert.match(content, /action: "cancelChainRun"/, "HUD 没有把停止发给后台");
  assert.match(background, /request\.action === "cancelChainRun"/, "后台不认停止消息");
  // 检查点必须落在动作循环里：循环外读一次标记等于没做
  const loop = background.slice(background.indexOf("for (const action of chain.actions)"));
  const beforeAction = loop.slice(0, loop.indexOf("await executeAction("));
  assert.ok((beforeAction.match(/checkCancelled\(\)/g) || []).length >= 2, "动作循环里少于两个停止检查点");
  // 最外层开始时不清标记，第二次运行一进去就是停止态
  assert.match(background, /callStack\.length === 0\) chainCancelled = false/, "没有在最外层运行前清停止标记");
  // 用户主动叫停不算出错，不该接着跑备用链
  assert.match(background, /chain\.fallbackChainKey && !cancelledRun/, "停止之后仍会跑备用链");
  // finally 里要读 cancelledRun：声明若落在 try 内，收尾时直接 ReferenceError
  const fn = background.slice(background.indexOf("async function executeChain("), background.indexOf("async function sendToContent("));
  const decl = fn.indexOf("let cancelledRun");
  assert.ok(decl > -1 && decl < fn.indexOf("try {"), "cancelledRun 声明在 try 里面，finally 读不到");
});
