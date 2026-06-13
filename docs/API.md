# Hotkey Chain API 文档

> 版本 1.3.0 · Manifest V3 · 适用 Chrome 120+（部分 API 有版本门槛，见下）

## 📦 概览

- **动作链**：把多个浏览器动作编排成一条「链」，按顺序执行，每步可设延迟（毫秒）。
- **触发方式**：快捷键、工具栏图标、图标右键菜单、页面右键菜单、地址栏（omnibox）、定时、网址自动运行。
- **配置存储**：整份配置存于 `chrome.storage.local`（10 MB，无单项 8 KB 限制；不跨设备同步，用导入/导出手动迁移）。
- **兼容性门槛**：`read_later` 需 Chrome 120+（缺失时自动降级提示）；`save_page_mhtml` 需 Chrome 116+（`pageCapture` 返回 Promise）。

> 所有 manifest 配置（权限、`commands` ≤4 个建议快捷键、`omnibox`）与 API 用法均经 Chrome 官方文档核对，符合 MV3 规范。

## 🎯 扩展控制功能

### 管理操作 (4个)

- **启用/禁用扩展** (`toggle_enabled`)
- **卸载扩展** (`uninstall_extension`)
- **重新加载开发扩展** (`reload_dev_extension`)
- **启动Chrome应用** (`launch_app`)

### 信息查看 (2个)

- **显示扩展信息** (`show_extension_info`)
- **打开扩展详情** (`open_details`)

### 快速访问 (3个)

- **打开扩展选项** (`open_options`)
- **打开扩展主页** (`open_homepage`)
- **打开商店页面** (`open_store_page`)

## ⚡ 触发方式

| 触发器 | 说明 |
| --- | --- |
| 快捷键 | `Ctrl+Shift+H` 默认链；链 1–9 有命令槽位（4–9 自行绑键） |
| 点击图标 | 运行默认链 |
| 图标右键菜单 | 「运行动作链」子菜单按名称列出所有链（action 菜单顶层受 Chrome 6 项上限约束，故用子菜单） |
| 页面右键菜单 | 页面/选中文字/链接/图片/音视频上的「运行动作链」子菜单，在被点击的标签页上运行 |
| 地址栏 | 输入 `hc` + 空格 + 链名称搜索并运行（omnibox；空查询不运行任何链，避免误触发破坏性链） |
| 定时 | 每条链可设 N 分钟周期运行（`chrome.alarms`，最小 1 分钟） |
| 网址自动运行 | 页面加载完成且 URL 匹配规则时自动运行（同一标签页同一链 10 秒冷却防循环） |

## 🧪 模板变量

`打开网址` 与 `显示系统通知` 的文本支持以下占位符（URL 中除 `{url}` 外自动编码）：

`{url}` `{title}` `{selection}` `{clipboard}` `{date}` `{time}`

示例：用 `https://www.bing.com/search?q={selection}` 实现自定义引擎搜索选中文字。

## 🔀 流程控制

- `if_url_matches` - 网址匹配 `pattern`（支持 `*` 通配/子串，逗号分隔多规则）则继续，否则停止本链
- `if_has_selection` - 页面有选中文字则继续，否则停止本链
- `run_chain` - 运行另一条链（`chainKey` 字段；防循环、嵌套深度上限 5）
- `wait` - 等待延迟

## 🔧 基础动作类型

### 执行命令

- `execute_command` - 执行命令

### 页面操作

- `scroll_to_top` - 滚动到顶部
- `scroll_to_bottom` - 滚动到底部
- `scroll_page_up` - 向上滚动一屏
- `scroll_page_down` - 向下滚动一屏
- `reload_page` - 重新加载页面
- `toggle_fullscreen` - 切换全屏
- `toggle_dark_mode` - 深色模式切换（CSS 反色滤镜，再次执行恢复）
- `translate_page` - 用 Google 翻译打开当前页面（目标语言跟随界面语言）
- `go_back` - 后退
- `go_forward` - 前进
- `print_page` - 打印页面
- `open_url` - 打开指定网址（`url` 字段；`openIn` 字段可选 `new`/`current`，默认新标签页）

### 标签管理

- `new_tab` - 新建标签
- `close_tab` - 关闭标签
- `close_other_tabs` - 关闭其他标签（保留固定标签）
- `close_tabs_right` - 关闭右侧标签（保留固定标签）
- `close_left_tabs` - 关闭左侧标签（保留固定标签）
- `close_duplicate_tabs` - 关闭重复标签（优先保留活动/固定标签，完成后通知数量）
- `sort_tabs_by_url` - 按域名+网址排序标签（固定标签位置不变）
- `group_tabs_by_domain` - 同域名 ≥2 个标签自动分组，组名为域名
- `ungroup_all_tabs` - 取消当前窗口所有标签分组
- `duplicate_tab` - 复制标签
- `pin_tab` - 固定/取消固定标签
- `mute_tab` - 静音/取消静音标签
- `mute_all_tabs` / `unmute_all_tabs` - 静音/恢复当前窗口所有标签
- `reload_all_tabs` - 刷新当前窗口所有标签
- `move_tab_left` - 标签左移
- `move_tab_right` - 标签右移
- `move_tab_first` / `move_tab_last` - 标签移到最左/最右
- `prev_tab` - 切换到上一个标签（循环）
- `next_tab` - 切换到下一个标签（循环）
- `reopen_closed_tab` - 重新打开最近关闭的标签（需要 `sessions` 权限）
- `discard_other_tabs` - 休眠其他未固定标签释放内存（`tabs.discard`，激活时自动重载）
- `goto_audible_tab` - 跳转到正在发声的标签页
- `bookmark_all_tabs` - 把窗口内所有 http(s) 标签收藏到带时间戳的新书签夹

### 窗口管理

- `new_window` - 新建窗口
- `close_window` - 关闭当前窗口
- `minimize_window` / `maximize_window` - 最小化/最大化当前窗口
- `open_incognito_window` - 打开无痕窗口（需在扩展详情页允许无痕访问）
- `move_tab_to_new_window` - 当前标签移到新窗口

### 媒体控制

- `media_play_pause` - 播放/暂停页面中的音视频
- `media_speed_up` / `media_speed_down` - 播放速度 ±0.25x（0.25–4x）
- `media_speed_reset` - 重置为 1x
- `speak_selection` - 朗读选中文字（无选中则朗读标题，`tts` 权限）
- `stop_speaking` - 停止朗读

### 缩放控制

- `zoom_in` - 放大
- `zoom_out` - 缩小
- `zoom_reset` - 重置缩放

### 内容操作

- `copy_url` - 复制网址
- `copy_title` - 复制标题
- `copy_as_markdown` - 复制为 Markdown 链接（`[标题](网址)`）
- `copy_selected_text` - 复制选中文字
- `search_selection` - 用浏览器**默认搜索引擎**搜索选中文字（`chrome.search`）
- `bookmark_page` - 添加书签（自动跳过已收藏的页面，避免重复）
- `read_later` - 加入 Chrome 阅读清单（需 Chrome 120+，自动检测降级提示）

### 高级功能

- `clear_cache` - 硬刷新（绕过缓存重新加载当前标签页）
- `capture_screenshot` - 截取可见区域为 PNG 并保存到下载目录 `hotkey-chain/`（需 `downloads` 权限）
- `save_page_mhtml` - 整页存档为 MHTML 文件（`pageCapture`；特大页面可能因 data URL 体积受限失败）
- `show_notification` - 显示系统通知（`text` 字段支持模板变量，留空则显示页面标题）
- `open_browser_page` - 打开浏览器内置页面（`page` 字段：`downloads`/`history`/`bookmarks`/`extensions`/`settings`/`shortcuts`/`clear_browsing_data`）
- `show_downloads_folder` - 打开系统下载文件夹
- `clear_browsing_cache` - 清除整个浏览器 HTTP 缓存（`browsingData`）
- `clear_site_data` - 清除当前站点的 Cookie/缓存/本地存储等（按 origin）
- `delete_url_from_history` - 把当前页面从历史记录中删除
- `toggle_keep_awake` - 阻止/恢复系统休眠（`power`，状态在后台重启后自动恢复）

### 扩展调用

- `call_extension` - 调用扩展功能

## 🎮 快捷键配置

### 默认快捷键

- `Ctrl+Shift+H` - 执行默认动作链（保留命令 `_execute_action`：按键时触发 `action.onClicked`，与点击图标同路径）
- `Ctrl+Shift+1` - 执行动作链 1
- `Ctrl+Shift+2` - 执行动作链 2  
- `Ctrl+Shift+3` - 执行动作链 3
- 动作链 4–9 提供了命令槽位，可在快捷键设置页自行绑定按键

> Chrome 限制：最多 4 个命令可带建议快捷键（本扩展正好用满：默认 + 链 1/2/3）；链 4–9 无默认键，需手动绑定。

### 快捷键与动作链的对应规则

`执行动作链 N` 优先匹配字面键名 `chain_N`（默认配置）；如果该链已被删除，
则回退到选项页中排序的第 N 条动作链，保证快捷键不会失效。

### 自定义快捷键

在 `chrome://extensions/shortcuts` 修改快捷键（选项页工具栏的键盘按钮可直达）

## 🎨 右键菜单

右键点击扩展图标显示（动作链条目按选项页中的名称与顺序动态生成，最多 10 条）：

```
执行默认动作链
─────────────────
阅读模式
标签工具
快速收藏
…
─────────────────
打开设置
```

## 🧰 链模板

选项页「从模板新建」提供一键创建的预设功能链：

| 模板 | 动作序列 |
| --- | --- |
| 专注模式 | 静音所有标签 → 深色模式 → 全屏 |
| 标签大扫除 | 关闭重复标签 → 按网址排序 → 按网站分组 |
| 视频模式 | 播放/暂停 → 全屏 |
| 截图存档 | 截图 → 加书签 → 系统通知 |
| 朗读选中内容 | 朗读选中文字 |
| 翻译当前页面 | Google 翻译打开本页 |
| 收工模式 | 加书签 → 全部静音 → 最小化窗口 |

## 🌍 国际化

- **18 种界面语言**：English（`en`）、简体中文（`zh_CN`）、繁體中文（`zh_TW`）、日本語（`ja`）、한국어（`ko`）、Español（`es`）、Français（`fr`）、Deutsch（`de`）、Português (Brasil)（`pt_BR`）、Русский（`ru`）、Italiano（`it`）、العربية（`ar`）、हिन्दी（`hi`）、Bahasa Indonesia（`id`）、Türkçe（`tr`）、Tiếng Việt（`vi`）、ไทย（`th`）、Polski（`pl`）。
- **默认跟随浏览器**界面语言（manifest `default_locale: "en"`，无匹配时回退英语）。
- **整套覆盖**：选项页的语言选择器把后台、右键菜单、系统通知、命令与内容脚本提示一并切换；选择保存在 `chrome.storage.local` 的 `localeOverride`，后台与内容脚本据此本地化，与浏览器 UI 语言解耦。
- **从右到左（RTL）**：阿拉伯语自动对选项页应用 `dir="rtl"`。
- **语言文件**：`_locales/<code>/messages.json`，每种语言键集一致（各 321 条）；动作/触发/界面文案全覆盖。占位符 `$1` 与模板变量 `{url}` 等在各语言中保持原样不译。
- **校验**：`node scripts/check-i18n.mjs` 检查每个语言相对 `en` 的键齐全、占位符/模板变量一致、JSON 合法。

## 🔒 权限要求

- `storage` - 存储配置
- `activeTab` - 当前标签操作
- `scripting` - 注入脚本
- `contextMenus` - 右键菜单
- `bookmarks` - 书签管理
- `management` - 扩展管理
- `clipboardWrite` - 剪贴板写入
- `sessions` - 恢复最近关闭的标签页
- `tabs` - 读取标签网址（去重/排序/分组/自动触发需要）
- `tabGroups` - 标签分组
- `downloads` - 保存截图/MHTML、打开下载文件夹
- `notifications` - 系统通知
- `tts` - 文字朗读
- `alarms` - 定时运行动作链
- `browsingData` - 清除缓存/站点数据
- `history` - 从历史记录删除页面
- `power` - 保持系统唤醒
- `readingList` - 加入阅读清单（Chrome 120+）
- `search` - 用默认搜索引擎搜索
- `pageCapture` - 保存页面为 MHTML
- `clipboardRead` - `{clipboard}` 模板变量
- `<all_urls>`（host） - 截图与读取选中文字（内容脚本本就运行于所有页面）

另有 manifest 配置项 `omnibox.keyword: "hc"`（非权限）。
