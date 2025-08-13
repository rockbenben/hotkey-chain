# 🔗 Hotkey Chain Chrome Extension

一个强大的 Chrome 扩展，允许用户通过热键执行多个连续动作。支持自定义动作链配置，提高浏览效率。内置多种实用的页面操作功能和扩展管理功能。

## ✨ 功能特性

### 🎯 核心功能

- **热键链执行**: 使用快捷键快速执行预设的动作链
- **动作链配置**: 创建和管理多个自定义动作序列
- **一键执行**: 点击扩展图---

⭐ 如果这个项目对您有帮助，请考虑给个 Star！- **延迟控制**: 为每个动作设置执行延迟时间

### � 扩展管理功能

#### 管理操作

- **启用/禁用扩展**: 快速切换扩展状态
- **卸载扩展**: 安全卸载指定扩展
- **重新加载开发扩展**: 便于开发调试
- **启动Chrome应用**: 启动已安装的Chrome应用

#### 信息查看

- **显示扩展信息**: 查看扩展详细信息
- **打开扩展详情**: 快速跳转到扩展管理页面

#### 快速访问

- **打开扩展选项**: 直接访问扩展设置
- **打开扩展主页**: 访问扩展官方页面
- **打开商店页面**: 在Chrome网上应用店查看

### 🚀 支持的动作类型

#### 🌐 页面操作

- **页面导航**: 滚动到顶部/底部、刷新页面、前进/后退
- **标签页管理**: 关闭当前标签、打开新标签、复制标签、固定标签
- **内容操作**: 复制URL、复制页面标题、添加书签
- **视图控制**: 缩放页面、切换全屏模式

#### 📥 高级功能

- **触发下载**: 触发页面下载功能
- **清除缓存**: 清理当前站点缓存并强制刷新
- **聚焦地址栏**: 快速定位到地址栏

### ⌨️ 默认热键

- `Ctrl+Shift+H`: 执行默认动作链
- `Ctrl+Shift+1`: 执行动作链 1
- `Ctrl+Shift+2`: 执行动作链 2
- `Ctrl+Shift+3`: 执行动作链 3

### 🎨 右键菜单

右键点击扩展图标显示简洁菜单：

```yml
执行默认动作链
─────────────────
执行动作链 1
执行动作链 2
执行动作链 3
─────────────────
配置设置
```

## 📦 安装使用

### 🔧 安装步骤

1. **下载项目**: 下载或克隆此项目到本地
2. **打开Chrome**: 启动Chrome浏览器  
3. **扩展管理**: 访问 `chrome://extensions/`
4. **开发者模式**: 开启页面右上角的"开发者模式"开关
5. **加载扩展**: 点击"加载已解压的扩展程序"按钮
6. **选择目录**: 选择本项目的根目录文件夹

### ✅ 验证安装

- Chrome工具栏出现🔗链条图标
- 右键点击图标可看到菜单选项
- 快捷键 `Ctrl+Shift+H` 可以响应

### 🚀 快速上手

1. **立即体验**: 点击扩展图标执行默认动作链
2. **查看菜单**: 右键点击图标查看所有选项
3. **进入配置**: 选择菜单中的"配置设置"
4. **自定义链**: 在配置页面创建您的动作链

## 🛠️ 配置指南

### 创建动作链

1. 进入配置页面
2. 点击"添加新链"按钮
3. 设置动作链名称
4. 添加所需的动作步骤
5. 调整每个动作的延迟时间
6. 保存配置

### 扩展管理功能

在动作类型中选择"调用扩展功能"或"执行命令"，可以：

- 管理其他扩展的启用/禁用状态
- 查看扩展详细信息
- 快速访问扩展选项和主页
- 打开Chrome应用商店页面

### 动作类型说明

| 动作类型 | 说明 | 适用场景 |
|---------|------|---------|
| 滚动到顶部 | 平滑滚动到页面顶部 | 长文章阅读 |
| 滚动到底部 | 平滑滚动到页面底部 | 快速浏览结尾 |
| 刷新页面 | 重新加载当前页面 | 更新内容 |
| 关闭标签页 | 关闭当前标签页 | 清理标签 |
| 新标签页 | 打开新的空白标签页 | 多任务处理 |
| 复制URL | 复制当前页面地址 | 分享链接 |
| 复制标题 | 复制页面标题 | 记录笔记 |
| 全屏切换 | 切换浏览器全屏模式 | 专注阅读 |
| 缩放操作 | 放大/缩小/重置页面 | 调整视觉 |
| 导航操作 | 浏览器前进/后退 | 页面导航 |
| 书签页面 | 将页面添加到书签 | 收藏内容 |

## 📁 项目结构

```
hotkey-chain/
├── manifest.json          # 扩展清单文件
├── background.js           # 后台服务脚本  
├── content.js             # 内容脚本
├── options.html           # 配置页面
├── options.css            # 配置页面样式
├── options.js             # 配置页面逻辑
├── icons/                 # 扩展图标文件夹
├── docs/                  # 文档目录
│   ├── API.md            # API文档
│   ├── CHANGELOG.md      # 更新日志
│   └── DEVELOPMENT.md    # 开发文档
├── LICENSE                # 许可证文件
└── README.md              # 项目说明文档
```

## 🔧 技术架构

### Manifest V3 架构

- **Service Worker**: 处理后台逻辑、热键事件和扩展管理
- **Content Scripts**: 在页面中执行DOM操作和显示通知
- **Options Page**: 提供完整的配置界面
- **Storage API**: 保存用户配置和动作链数据
- **Management API**: 管理其他Chrome扩展

### 核心技术

- **JavaScript ES6+**: 主要开发语言
- **Chrome Extension APIs**: 浏览器扩展接口
- **Chrome Management API**: 扩展管理功能
- **CSS3**: 用户界面样式
- **HTML5**: 配置页面结构

## 🎨 自定义开发

### 添加新的动作类型

1. 在 `background.js` 中的 `ACTION_TYPES` 对象添加新类型
2. 在 `executeAction` 函数中添加对应的执行逻辑
3. 在 `options.js` 中添加动作选项
4. 如需页面操作，在 `content.js` 中添加相应处理

### 修改快捷键

在 `manifest.json` 的 `commands` 部分修改：

```json
"commands": {
  "_execute_action": {
    "suggested_key": {
      "default": "Ctrl+Shift+H"
    },
    "description": "Execute default action chain"
  }
}
```

也可在Chrome扩展管理页面修改快捷键。

## 🤝 贡献指南

欢迎提交 Issues 和 Pull Requests！

### 开发步骤

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -m 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交 Pull Request

### 开发规范

- 遵循 JavaScript ES6+ 标准
- 保持代码简洁和可读性
- 添加必要的注释说明
- 测试所有功能正常运行

## � 支持

如果您在使用过程中遇到问题或有功能建议：

1. 查看 `docs/` 目录中的相关文档
2. 在 GitHub Issues 中搜索相关问题
3. 提交新的 Issue 描述您的问题

## �🔗 相关链接

- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Chrome Management API](https://developer.chrome.com/docs/extensions/reference/management/)
- [Chrome Extension Commands](https://developer.chrome.com/docs/extensions/reference/commands/)

---

⭐ 如果这个项目对您有帮助，请考虑给个 Star！

## 📚 高级说明与限制

- 设置改为使用 Options 页面（options.html）。点击扩展图标不会打开弹窗，而是直接执行默认动作链；配置请在扩展详情页点击“扩展选项”，或右键图标选择“Hotkey Chain 配置”。
- 发送热键组合（SEND_HOTKEY）优先通过 Chrome DevTools Protocol 注入键盘事件，需要 `debugger` 权限；若注入失败会回退为在页面内派发合成 KeyboardEvent。某些站点会阻止脚本合成事件，属于浏览器安全限制。
- Meta 键说明：Windows 下为 Win 键，macOS 下为 Command 键。不同操作系统对系统级快捷键可能有拦截，扩展无法越权发送这类快捷键。
- 首次使用 `debugger` 权限时，Chrome 可能弹出授权提示，请点击允许以便注入热键。
