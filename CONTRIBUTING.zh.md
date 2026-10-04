# 参与 Hotkey Chain 开发

扩展本体在 `extension/`，没有构建步骤，加载什么就发布什么。
下面全是开发相关的内容 —— 只是使用这个扩展的话完全用不到。

### 仓库结构

扩展要发布的东西全在 `extension/` 里，其余都是开发与商店素材。项目没有构建步骤，所以 `extension/` 本身就是扩展 —— 打包只是「把这个目录压掉」，没有清单要跟着维护。

```
extension/          ← 扩展本体（「加载已解压的扩展程序」选它）
  manifest.json     ← 必须位于 zip 根目录，否则商店拒收
  assets/           ← 内置的运行时库与字体
assets/screenshot/  ← README 用的截图（特意放在 extension/ 之外）
docs/  scripts/  test.mjs  descriptions.json   ← 都不进包
```

### 测试

```bash
npm test           # 或：node --test test.mjs
```

守的是那些「不会报错、只会静默失效」的问题：两份动作清单是否一致、每个动作是否都有显示名 / 分类 / 后台处理分支、代码里用到的每个 i18n key 是否 18 种语言都有（缺 key 时用户看到的是源码里的硬编码回退文案，而不是自己的语言）、`manifest.json` 与 `package.json` 的版本是否一致。

其中两条专门守**文档与代码的漂移** —— 除此之外没有别的机制守它：

- **文档里的数字要与代码一致。** 动作数和语言 key 数写在 7 类文件、50 多处（含 18 个 `extDescription` 与 18 语言的商店长描述）。**不要手改**：

  ```bash
  node scripts/sync-action-count.mjs           # 从代码重写所有出现处
  node scripts/sync-action-count.mjs --check   # CI 模式：过期就退出码 1
  ```

- **`docs/API.md` 的模板表要与 `CHAIN_TEMPLATES` 一致。** 这张表曾漂移 18/28 行 —— 12 行还列着已删除的 `show_notification`、3 行少了动作、2 行动作名写错、1 行描述的其实是另一条链。改动模板后，测试会告诉你该修哪一行。

### 打包构建

```bash
npm run package    # 或：node scripts/package.mjs
```

产出 `dist/hotkey-chain-v<版本>.zip`，可直接上传 Chrome 网上应用店。脚本压完会把压缩包再读回来，确认 `manifest.json` 确实在根目录、且没有条目名用了反斜杠 —— Windows PowerShell 5.1 可能写出不符合规范的条目名，而商店只会回一句没什么信息量的错误。

只有上传前才需要跑它；日常开发直接对 `extension/` 用「加载已解压的扩展程序」即可。无需任何依赖，只用 Node 内置能力 + 系统压缩工具。

### 发布

推一个 `v*` tag 会触发 [`.github/workflows/release.yml`](.github/workflows/release.yml)：跑测试、校验 tag 与 `extension/manifest.json` 版本一致（不一致直接失败）、打包、验证压缩包，然后建一个带 zip 附件的 GitHub Release。推 main 只跑测试 —— 只在发布时才跑的闸门没有意义，红的时候 tag 已经推出去了。

### 选项页设计

`options.css` 是覆盖 Bootstrap 而不是取代它，所以有几条规则是承重的，很容易被当成冗余「顺手清理」掉：

- **动作列表是时间轴，不是列表。** 延迟是某一步开跑前的那段等待，所以它画在两个磁贴之间的连接线上，而不是行尾的一枚徽章。0 延迟不渲染任何东西 —— 每一步都挂个 `0ms`，反而把真正有延迟的那两步淹没了。
- **`.main-content` 清掉了横向内边距。** Bootstrap 的 `.p-4` 叠在 `.container-fluid` 自己的内边距上，两层加起来 96px，在 768px 宽时正好挤掉一整列卡片。
- **卡片等高并把按钮推到底部**，同一排的「运行」才会落在一条线上，而不是各自停在内容结束的地方。
- **可访问性底线**：每个纯图标按钮都带 `aria-label`（与其 tooltip 取同一个 i18n key，静态标记走 `data-i18n-aria`）；焦点通过 `:focus-visible` 可见；`prefers-reduced-motion` 会关掉卡片入场动画和所有悬停位移。
- **用逻辑属性，不用物理属性。** 阿拉伯语会把整页翻成 `dir="rtl"`。时间轴导轨用的是 `inset-inline-start` / `padding-inline-start`；若写成 `left` / `padding-left`，磁贴镜像到右边而导轨仍留在左边，两者会脱节。
- **动作速查区复用卡片上的彩色磁贴。** 分类配色是一眼读懂动作链的主要方式，所以「可用动作」列表在每个名字旁放同款磁贴 —— 那里正是学会这套配色的地方。
- **数字与单位由语言决定格式**（`label_msValue`，`"$1ms"` 对 `"$1 مللي ثانية"`），不在代码里拼接：中间要不要空格是语言的决定。
- **两种主题都要留住两级面。** `theme.js` 在 `<head>` 里跑，设置页与侧边栏随系统一起转深 —— 否则从侧边栏点开设置页会闪一下白。亮色靠投影把卡片从面板里托出来，暗色没这招，所以嵌套面（模板卡片、动作选择行、动作卡片、链信息面板）与容器交替一级（`--card` ↔ `--surface-2`）；塌成一级，模板库看起来就是一个空面板。
- **提示弹层停在右下角。** 右上角是工具栏主按钮的位置，而一条提示要在那儿停好几秒。

### 品牌素材

每张宣传图都有对应的源文件 —— 因为唯一没有源文件的那张，跨了两代设计都没人更新。

| 源文件 | 产物 | 说明 |
| --- | --- | --- |
| `assets/logo.svg` | `extension/icons/icon{16,32,48,128}.png` | 标识。改 SVG 再重出，别直接动 PNG |
| `assets/promo/social.html` | `assets/social-card.png` | 1280×640，GitHub 社交预览图尺寸，同时满足 X 的 2:1 卡片 |
| `assets/promo/marquee.html` | `assets/screenshot/marquee.png` | 1400×560，Chrome 网上应用店 marquee 宣传图 |
| `assets/promo/small.html` | `assets/screenshot/small.png` | 440×280，应用店小图块 |
| —— | `assets/screenshot/*.png` | 应用店截图，1280×800，中英各一套 |

截图没有源文件 —— 它是从跑起来的扩展实拍出来的，所以标签或布局一改它就过期。动了选项页就重拍：用 `resetToDefaults` 回到出厂链、固定浅色主题，语言靠启动参数分套（`--lang=en-US` / `--lang=zh-CN`）—— 出厂链名由后台按**浏览器**语言生成，页面里那个语言下拉框管不到它。编码与宣传图一致，出成调色板 PNG（256 色、不抖动）：真彩版本体积约为三倍，肉眼看不出差别。

用 [html-shot](https://github.com/anthropics/skills)（Playwright + Chromium）渲染。`--base .` 是这些页面能找到 `/extension/assets/fonts/` 下那个字体的原因：

```bash
node <html-shot>/render.mjs assets/promo/social.html assets/social-card.png --base . --palette
node <html-shot>/render.mjs assets/logo.svg extension/icons/icon16.png --width 16 --transparent --scale 1
```

有两件事是刻意为之，很容易被误改：

- **标识用实心形状而非描边。** 16px（工具栏尺寸，也是它被看到最多的地方）下，圆环的内部会糊死，整个图形变成一团。16 和 32 用 `--scale 1` 渲染：这个尺寸下清晰度比平滑重要。
- **GitHub 只认手动上传的社交预览图**（*Settings → Social preview*）。`gh` CLI 设不了，所以重新渲染并不会自动生效。

### 第三方代码

以下库直接内置在 `extension/assets/` 下 —— MV3 禁止从 CDN 加载脚本。项目没有构建步骤，升级即替换文件。

| 库 | 版本 | 用途 |
| --- | --- | --- |
| [Bootstrap](https://getbootstrap.com/) | 5.3.8 | 选项页布局，以及下拉菜单、折叠面板、Toast 组件 |
| [Bootstrap Icons](https://icons.getbootstrap.com/) | 1.13.1 | 图标 —— `extension/assets/fonts/bootstrap-icons.*` 必须与 CSS 一起替换，字体 URL 带有随版本变化的哈希 |
| [SortableJS](https://sortablejs.github.io/Sortable/) | 1.15.7 | 动作链与动作的拖拽排序 |

`extension/assets/fonts/plus-jakarta-sans.woff2` 是自托管的界面字体。以上均为 MIT 许可。
返回 [README](README.zh.md)。
