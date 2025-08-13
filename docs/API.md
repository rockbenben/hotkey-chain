# Hotkey Chain API 文档

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

## 🔧 基础动作类型

### 执行命令

- `execute_command` - 执行命令

### 页面操作

- `scroll_to_top` - 滚动到顶部
- `scroll_to_bottom` - 滚动到底部
- `reload_page` - 重新加载页面
- `toggle_fullscreen` - 切换全屏
- `go_back` - 后退
- `go_forward` - 前进

### 标签管理

- `close_tab` - 关闭标签
- `new_tab` - 新建标签
- `duplicate_tab` - 复制标签
- `pin_tab` - 固定标签

### 缩放控制

- `zoom_in` - 放大
- `zoom_out` - 缩小
- `zoom_reset` - 重置缩放

### 内容操作

- `copy_url` - 复制网址
- `copy_title` - 复制标题
- `bookmark_page` - 添加书签
- `focus_address_bar` - 聚焦地址栏

### 高级功能

- `clear_cache` - 清除缓存
- `wait` - 等待延迟

### 扩展调用

- `call_extension` - 调用扩展功能

## 🎮 快捷键配置

### 默认快捷键

- `Ctrl+Shift+H` - 执行默认动作链
- `Ctrl+Shift+1` - 执行动作链 1
- `Ctrl+Shift+2` - 执行动作链 2  
- `Ctrl+Shift+3` - 执行动作链 3

### 自定义快捷键

在Chrome扩展管理页面(`chrome://extensions/`)点击键盘图标可修改快捷键

## 🎨 右键菜单

右键点击扩展图标显示：

```
执行默认动作链
─────────────────
执行动作链 1
执行动作链 2
执行动作链 3
─────────────────
配置设置
```

## 🔒 权限要求

- `storage` - 存储配置
- `activeTab` - 当前标签操作
- `scripting` - 注入脚本
- `contextMenus` - 右键菜单
- `bookmarks` - 书签管理
- `management` - 扩展管理
- `clipboardWrite` - 剪贴板写入
