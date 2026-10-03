# 商店文案与产品详情 · Store copy & product detail

这份文件是**可直接粘贴**的商店素材，中英对照。18 种语言的完整版在仓库根目录：

| 文件 | 对应商店字段 |
| --- | --- |
| `extension/_locales/<code>/messages.json` → `extDescription` | 简短说明（上限 **132 字符**，18 种语言） |
| `descriptions.json` | 详细说明 / 产品详情（18 种语言） |
| `store-permissions.md` | 各项权限的申请理由 |
| `search-terms.json` | 搜索关键词 |
| `assets/screenshot/` | 截图 1280×800、marquee 1400×560、small 440×280 |

改文案时先改这里，再同步到那几个文件。**数字不要手写**：动作数与语言 key 数各有单一事实源，跑 `node scripts/sync-action-count.mjs` 会把这 7 类文件里的数字一起对齐（`--check` 供 CI 用），改完再跑一遍 `npm test`。

---

## 一句话 · One-liner

**中文**（47 字符）

> 浏览器里的快捷指令：把 103+ 个动作编排成链，用快捷键、地址栏、右键、定时或网址匹配触发。

**English**（120 characters）

> Shortcuts for your browser: chain 103+ actions and run them by hotkey, address bar, right-click, schedule, or URL match.

> [!IMPORTANT]
> 上面这两句必须与 `extension/_locales/en|zh_CN/messages.json` 的 `extDescription` **逐字一致** —— 那份才是真正打包进扩展、显示在商店里的文案，本节只是方便你复制。
> 简短说明有 **132 字符**硬上限（manifest `description` 的限制），18 种语言都必须卡在这条线内。德语、俄语、法语等语种天然更长，翻译时优先砍触发方式的枚举，别砍「103+ 个动作」这个事实。

---

## 产品详情 · Product detail

### 中文

**Hotkey Chain —— 浏览器里的快捷指令**

你每天在浏览器里重复的那几步：回到顶部、放大、全屏；关掉重复标签、按网站分组、收拾干净；把当前页存进阅读清单再提醒自己一声。Hotkey Chain 把它们串成一条「链」，按一个键跑完。

就像苹果的「快捷指令」，但活在浏览器里。

**它是怎么工作的**

一条链就是一列动作，按顺序执行，每一步之间可以设等待时间（毫秒）。选项页里拖拽排序，每张链卡片会把步骤画成一条时间轴，延迟就标在两步之间的连接线上——你一眼看得出这条链会花多久。

**七种触发方式**

- **快捷键** —— `Ctrl+Shift+H` 跑默认链，`Ctrl+Shift+1/2/3` 跑第 1–3 条；其余链可在浏览器的快捷键设置里自行绑定
- **侧边栏伴侣** —— 在侧边栏一键查找并运行动作链，边浏览网页边随手执行
- **工具栏图标** —— 点图标跑默认链，右键出链菜单
- **地址栏** —— 输入 `hc` + 空格 + 链名，边打边找
- **右键菜单** —— 在页面、选中文字、链接、图片或音视频上直接运行
- **定时** —— 每 N 分钟自动跑一次，适合「整理标签页」这类维护性工作
- **网址与单页应用匹配** —— 打开符合规则的页面或 SPA（GitHub/YouTube 等）路由切换时自动运行，比如进邮箱就自动进入专注模式

**103+ 个动作，十个分组**

动作按用途分成十组：页面、标签页、窗口、媒体、内容与端侧 AI、缩放、流程控制、高级工具与扩展管理。关闭重复标签页、按域名分组、朗读选中文字、把页面存成 MHTML，都只是其中的一项。完整清单在选项页的动作选择器里，可按分类浏览或直接搜索。

**危险动作，先问一句**

这是这个扩展和「一键工具」最大的不同：在「关闭其他标签页」这类不可撤销的动作前，放一个「询问确认后继续」，链就会停下来等你点头，点「取消」则整条链中止（或分流至失败备用链）。手滑触发的代价从此为零。

再加上工作流流水线编排（支持跨链串联执行与错误降级分支）、数据管道直通（`{output}` 变量无缝将上游输出传递至下游）、条件判断（网址匹配才继续、有选中文字才继续）、链调用链，以及 `{url}` `{title}` `{selection}` `{clipboard}` `{date}` `{time}` 这些模板变量，一条链其实是一段自动化脚本。

**开箱即用**

28 个分类模板开箱可用，按 AI、标签页与内存、阅读与媒体、网页工具、隐私清理、日常工作流等分类陈列，模板库支持分类筛选与即时搜索。整份配置可导出为 JSON 备份或换机，单条链也能单独导出分享给别人。

**18 种界面语言**，默认跟随浏览器，也可在选项页里单独指定；阿拉伯语自动切换为从右到左布局。

**关于隐私**

没有账号，没有同步，没有服务端。你的动作链和设置存在浏览器本地，导出 / 导入是你自己选的文件。扩展索要的权限不少，因为一个动作要能提供，背后的权限就得先拿到——每一项对应哪个功能，在开源仓库里逐条写明。

免费，MIT 开源。

---

### English

**Hotkey Chain — Shortcuts for your browser**

The same few steps, every day: scroll to top, zoom in, go fullscreen. Close the duplicate tabs, group the rest by site, get the window back under control. Save the page to your reading list and remind yourself you did. Hotkey Chain chains those steps together and runs them from one keystroke.

Like Shortcuts, but inside your browser.

**How it works**

A chain is a list of actions that run in order, with an optional wait between steps. You reorder them by dragging in the options page, and each chain card draws its steps as a timeline — the wait is shown on the connector between two steps, so you can see how long the chain takes at a glance.

**Seven ways to trigger a chain**

- **Hotkey** — `Ctrl+Shift+H` runs the default chain, `Ctrl+Shift+1/2/3` run chains 1–3; bind the rest yourself in the browser's shortcut settings
- **Side panel companion** — browse any webpage while searching and triggering chains with one click in the side panel
- **Toolbar icon** — click to run the default chain, right-click for a menu of your chains
- **Address bar** — type `hc` + space + a chain name and pick it as you type
- **Right-click** — run a chain from a page, a text selection, a link, an image, or media
- **Schedule** — every N minutes, for housekeeping like tidying tabs
- **URL & SPA match** — runs itself when a matching page loads or single-page app route changes (GitHub, YouTube, Next.js); open your inbox and focus mode is already on

**103+ actions in ten groups**

The actions are grouped by purpose: pages, tabs, windows, media, content and on-device AI, zoom, flow control, advanced tools, and extension control. Closing duplicate tabs, grouping tabs by domain, reading the selection aloud or saving a page as MHTML are each one entry in that list. The full set lives in the action picker in the options page, browsable by category or searchable by name.

**It asks before anything you can't undo**

This is where it differs from a one-click tool: put an "Ask to confirm" step in front of something irreversible like "Close other tabs", and the chain stops and waits for a yes. Choose cancel and the whole chain stops (or routes to a fallback chain). Mis-firing a destructive chain stops being expensive.

Add workflow pipeline orchestration (sequential chain execution with fallback failure branches), context data piping (`{output}` forward to downstream steps), conditions (continue only if URL matches or text selected), sub-chains, and template variables `{url}` `{title}` `{selection}` `{clipboard}` `{date}` `{time}`, and a chain becomes a powerful automation workflow.

**Ready to use**

28 ready-made templates ship in categories — AI, tabs and memory, reading and media, web tools, privacy, daily workflow — and the gallery can be filtered by category or searched by name. Export the whole configuration as JSON to back it up or move machines, or export a single chain to share.

**18 interface languages**, following the browser by default and overridable in the options page. Arabic switches the layout right-to-left automatically.

**About privacy**

No account, no sync, no server. Your chains and settings live in your browser's local storage; export and import are files you choose. The extension asks for a fair number of permissions, because an action can only be offered if the permission behind it is granted — every one of them is mapped to the feature it serves in the open-source repository.

Free and MIT-licensed.
