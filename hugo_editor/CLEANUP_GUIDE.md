# 项目清理指南

## 可以安全删除的文件（遗留文件）

以下文件是旧的多进程架构的遗留文件，在统一服务器架构中不再需要：

### 1. 遗留服务器文件
- `file-server.js` - 旧的文件服务器，已被 `unified-server.js` 替代
- `editor-server.js` - 旧的编辑器服务器，已被 `unified-server.js` 替代

### 2. 测试和配置文件
- `test-integration.js` - 旧的集成测试（如果存在）

## 保留的核心文件

### 服务器文件
- ✅ `unified-server.js` - 核心统一服务器
- ✅ `package.json` - 项目配置和依赖

### 前端文件
- ✅ `hugo-editor.html` - 主编辑器界面
- ✅ `hugo-editor.js` - 主编辑器逻辑
- ✅ `image-manager.js` - 图片管理
- ✅ `image-optimizer.js` - 图片优化
- ✅ `image-gallery.js` - 图片库
- ✅ `image-usage-manager.js` - 图片使用管理
- ✅ `enhanced-image-gallery.js` - 增强图片库
- ✅ `markdown-validator.js` - Markdown验证
- ✅ `hugo-integration.js` - Hugo集成
- ✅ `editor-enhancements.js` - 编辑器增强

### 样式文件
- ✅ `image-gallery.css` - 图片库样式
- ✅ `image-manager.css` - 图片管理样式
- ✅ `image-usage.css` - 图片使用样式

### 启动脚本
- ✅ `start-server.bat` - Windows启动脚本

## 清理命令

如果您确认要删除遗留文件，可以执行：

```bash
# 删除遗留服务器文件
rm file-server.js editor-server.js

# 删除测试文件（如果存在）
rm test-integration.js
```

## 注意事项

1. 删除前请确保这些文件没有被其他地方引用
2. 建议先备份这些文件，以防万一需要恢复
3. 删除后重新测试整个系统的功能
