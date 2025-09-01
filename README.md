<h1 align="center">
  <img src="https://raw.githubusercontent.com/weiwei929/hugo-PaperMod/master/hugo_editor/assets/logo.png" alt="Hugo Editor" width="120" height="120">
  <br>
  Hugo Editor
  <br>
  <small>现代化的Hugo博客编辑器</small>
</h1>

<h4 align="center">🚀 现代化 | 🎨 可视化 | 📱 响应式 | ⚡ 高效率</h4>

<p align="center">
  <strong>Hugo Editor</strong> 是一个基于 <a href="https://github.com/adityatelange/hugo-PaperMod">Hugo PaperMod</a> 主题构建的现代化博客编辑器
  <br>
  提供可视化编辑、图片管理、实时预览、一键部署等功能，让Hugo博客创作更简单高效
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> •
  <a href="#功能特性">功能特性</a> •
  <a href="#在线演示">在线演示</a> •
  <a href="#部署指南">部署指南</a> •
  <a href="#使用文档">使用文档</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Hugo-0.100+-blue?logo=hugo" alt="Hugo Version">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" alt="Node.js Version">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey" alt="Platform">
  <img src="https://img.shields.io/badge/Docker-Ready-blue?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/VPS-Deployable-success" alt="VPS Deployable">
</p>


---

## 📸 界面预览

<p align="center">
  <img src="https://raw.githubusercontent.com/weiwei929/hugo-PaperMod/master/docs/images/editor-preview.png" alt="Hugo Editor 界面预览" width="800">
</p>

<details>
<summary>🖼️ 更多截图</summary>

| 编辑界面 | 图片管理 |
|---------|---------|
| ![编辑界面](https://raw.githubusercontent.com/weiwei929/hugo-PaperMod/master/docs/images/editor-interface.png) | ![图片管理](https://raw.githubusercontent.com/weiwei929/hugo-PaperMod/master/docs/images/image-manager.png) |

| 实时预览 | 一键部署 |
|---------|---------|
| ![实时预览](https://raw.githubusercontent.com/weiwei929/hugo-PaperMod/master/docs/images/live-preview.png) | ![一键部署](https://raw.githubusercontent.com/weiwei929/hugo-PaperMod/master/docs/images/one-click-deploy.png) |

</details>

---

## ✨ 功能特性

### 🎨 可视化编辑
- **Markdown编辑器**: 语法高亮、实时预览、快捷键支持
- **分屏模式**: 左侧编辑，右侧实时预览
- **模板系统**: 博客文章、日记、项目介绍等多种模板
- **Front Matter管理**: 可视化设置文章元数据

### 🖼️ 智能图片管理
- **三种使用场景**: 文章插图、封面图片、图片库欣赏
- **自动优化**: 图片压缩、格式转换、尺寸调整
- **分类存储**: 按日期和文章自动分类存储
- **拖拽上传**: 支持拖拽和批量上传

### 🚀 一键部署
- **本地集成**: 直接写入Hugo项目，无需手动移动文件
- **VPS部署**: 一键部署到生产环境
- **Docker支持**: 容器化部署，开箱即用
- **SSL配置**: 自动配置Let's Encrypt证书

### 🔧 开发体验
- **实时预览**: 编辑内容实时渲染
- **自动保存**: 防止内容丢失
- **错误处理**: 完善的错误提示和恢复机制
- **响应式设计**: 适配各种设备和屏幕

### 🌐 生产就绪
- **系统服务**: systemd服务管理，开机自启
- **反向代理**: Nginx配置，性能优化
- **监控备份**: 自动备份、健康检查
- **安全配置**: 防火墙、权限控制、SSL加密
---

## 🚀 快速开始

### 📋 系统要求

- **Node.js**: 18.0.0 或更高版本
- **Hugo**: 0.100.0 或更高版本（推荐使用 Extended 版本）
- **Git**: 用于版本控制
- **现代浏览器**: Chrome、Firefox、Safari、Edge 等

### 💻 本地开发

#### 1. 克隆项目

```bash
git clone https://github.com/weiwei929/hugo-PaperMod.git
cd hugo-PaperMod
```

#### 2. 安装依赖

```bash
cd hugo_editor
npm install
```

#### 3. 启动服务

```bash
# Windows
start-server.bat

# Linux/macOS
chmod +x start-server.sh
./start-server.sh
```

#### 4. 访问编辑器

打开浏览器访问：`http://127.0.0.1:8080`

### 🐳 Docker 快速启动

```bash
# 克隆项目
git clone https://github.com/weiwei929/hugo-PaperMod.git
cd hugo-PaperMod

# 使用 Docker Compose 启动
cd deploy
docker-compose up -d

# 访问编辑器
open http://localhost:8080
```

### 🌐 VPS 一键部署

```bash
# 在VPS上执行
git clone https://github.com/weiwei929/hugo-PaperMod.git
cd hugo-PaperMod

# 一键部署（包含SSL）
sudo ./deploy/quick-start.sh --domain your-domain.com --email your-email@example.com --ssl

# 或使用Docker部署
sudo ./deploy/quick-start.sh --docker
```

### 📱 使用流程

1. **创建文章**: 填写标题、选择分类、设置标签
2. **选择图片用途**: 文章插图 / 封面图片 / 图片库欣赏
3. **编写内容**: 使用Markdown语法，支持实时预览
4. **上传图片**: 拖拽上传，自动优化和分类存储
5. **一键导出**: 直接保存到Hugo项目，立即可用

---

## 📚 部署指南

### 🖥️ VPS部署

详细的VPS部署指南请参考：[**📖 VPS部署指南**](deploy/DEPLOYMENT_GUIDE.md)

支持的系统：
- Ubuntu 20.04+ / 22.04 LTS（推荐）
- CentOS 8+ / Stream
- Debian 11+
- Red Hat Enterprise Linux 8+

### 🐳 Docker部署

```bash
# 基础部署
docker-compose up -d

# 包含SSL的完整部署
docker-compose --profile with-ssl up -d

# 包含缓存服务
docker-compose --profile with-cache up -d
```

### ⚙️ 配置选项

环境变量配置请参考：[**📄 配置文件**](deploy/.env.example)

---

## 🎯 在线演示

- **编辑器演示**: [https://hugo-editor-demo.example.com](https://hugo-editor-demo.example.com)
- **博客预览**: [https://blog-demo.example.com](https://blog-demo.example.com)

---

## 📖 使用文档

- [**🚀 快速开始指南**](docs/QUICK_START.md)
- [**📝 编辑器使用手册**](docs/EDITOR_GUIDE.md)
- [**🖼️ 图片管理指南**](docs/IMAGE_GUIDE.md)
- [**🔧 部署配置文档**](deploy/DEPLOYMENT_GUIDE.md)
- [**❓ 常见问题解答**](docs/FAQ.md)

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. **Fork** 这个仓库
2. **创建** 你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. **提交** 你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. **推送** 到分支 (`git push origin feature/AmazingFeature`)
5. **打开** 一个 Pull Request

---

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🙏 致谢

### 基于的优秀项目
- [**Hugo PaperMod**](https://github.com/adityatelange/hugo-PaperMod) - 优秀的Hugo主题
- [**Hugo**](https://gohugo.io/) - 快速的静态网站生成器

### 使用的开源库
- [**Highlight.js**](https://github.com/highlightjs/highlight.js) - 代码语法高亮
- [**Marked**](https://github.com/markedjs/marked) - Markdown解析器
- [**Sharp**](https://github.com/lovell/sharp) - 图片处理库
- [**Express.js**](https://expressjs.com/) - Web应用框架

### 特别感谢
- 所有贡献者和支持者
- Hugo和PaperMod社区
- 开源软件社区

---

## ⭐ Star History

如果这个项目对您有帮助，请给我们一个 ⭐ Star！

[![Star History Chart](https://api.star-history.com/svg?repos=weiwei929/hugo-PaperMod&type=Date)](https://star-history.com/#weiwei929/hugo-PaperMod&Date)

---

<p align="center">
  <strong>Hugo Editor</strong> - 让Hugo博客创作更简单高效 🚀
  <br>
  <small>Made with ❤️ by <a href="https://github.com/weiwei929">weiwei929</a></small>
</p>
