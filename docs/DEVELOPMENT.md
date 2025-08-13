# 开发文档

## 文件结构

```
hotkey-chain/
├── manifest.json          # 扩展配置清单
├── background.js          # 后台服务工作线程
├── content.js            # 内容脚本
├── options.html          # 选项页面
├── options.js            # 选项页面脚本
├── options.css           # 选项页面样式
├── icons/                # 图标文件夹
├── docs/                 # 文档目录
│   ├── API.md           # API文档
│   └── CHANGELOG.md     # 更新日志
├── README.md            # 主说明文档
├── INSTALL.md           # 安装说明
└── LICENSE              # 许可证
```

## 核心文件说明

### manifest.json

- 扩展基本信息和权限配置
- 快捷键定义
- 图标和页面配置

### background.js

- 扩展的主要逻辑
- 事件处理和动作执行
- 扩展管理API调用
- 右键菜单处理

### content.js

- 页面内容脚本
- 处理页面操作（滚动、缩放等）
- 模态框和通知显示

### options.html/js/css

- 扩展配置界面
- 动作链配置和管理
- 实时预览和测试

## 权限说明

- `storage`: 保存用户配置
- `activeTab`: 操作当前标签页
- `scripting`: 注入脚本执行
- `contextMenus`: 创建右键菜单
- `bookmarks`: 书签管理
- `management`: 扩展管理
- `clipboardWrite`: 剪贴板操作

## API架构

### 消息通信

- Background ↔ Content Script
- Background ↔ Options Page

### 主要功能模块

1. **动作执行引擎**: 执行各种动作类型
2. **扩展管理器**: Chrome Management API包装
3. **配置管理器**: 用户设置存储和读取
4. **UI控制器**: 右键菜单和快捷键处理
