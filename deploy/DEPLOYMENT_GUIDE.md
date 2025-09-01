# Hugo Editor VPS 部署指南

## 📋 目录

- [系统要求](#系统要求)
- [快速部署](#快速部署)
- [详细部署步骤](#详细部署步骤)
- [Docker部署](#docker部署)
- [SSL配置](#ssl配置)
- [服务管理](#服务管理)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 🖥️ 系统要求

### 最低配置
- **CPU**: 1核心
- **内存**: 1GB RAM
- **存储**: 10GB 可用空间
- **网络**: 公网IP地址
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### 推荐配置
- **CPU**: 2核心
- **内存**: 2GB RAM
- **存储**: 20GB SSD
- **网络**: 稳定的公网IP和域名
- **操作系统**: Ubuntu 22.04 LTS

### 软件依赖
- Node.js 18.x+
- Hugo Extended 0.100.0+
- Nginx 1.18+
- Git 2.25+

## 🚀 快速部署

### 方法一：一键部署脚本

```bash
# 1. 克隆项目
git clone https://github.com/your-username/hugo-PaperMod.git
cd hugo-PaperMod

# 2. 运行部署脚本
sudo chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh

# 3. 配置服务
sudo ./deploy/configure-services.sh

# 4. 配置Nginx
sudo ./deploy/configure-nginx.sh

# 5. （可选）配置SSL
sudo ./deploy/configure-ssl.sh --domain your-domain.com --email your-email@example.com
```

### 方法二：Docker部署

```bash
# 1. 克隆项目
git clone https://github.com/your-username/hugo-PaperMod.git
cd hugo-PaperMod

# 2. 构建并启动
cd deploy
docker-compose up -d

# 3. （可选）启用SSL
docker-compose --profile with-ssl up -d
```

## 📝 详细部署步骤

### 步骤1：准备服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git unzip software-properties-common

# 创建项目用户
sudo useradd -r -s /bin/bash -d /opt/hugo-editor hugo-editor
sudo mkdir -p /opt/hugo-editor
sudo chown hugo-editor:hugo-editor /opt/hugo-editor
```

### 步骤2：安装Node.js

```bash
# 添加NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装Node.js
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

### 步骤3：安装Hugo

```bash
# 获取最新版本
HUGO_VERSION=$(curl -s https://api.github.com/repos/gohugoio/hugo/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

# 下载并安装
cd /tmp
wget https://github.com/gohugoio/hugo/releases/download/${HUGO_VERSION}/hugo_extended_${HUGO_VERSION#v}_Linux-64bit.tar.gz
tar -xzf hugo_extended_${HUGO_VERSION#v}_Linux-64bit.tar.gz
sudo mv hugo /usr/local/bin/
sudo chmod +x /usr/local/bin/hugo

# 验证安装
hugo version
```

### 步骤4：部署项目

```bash
# 克隆项目
git clone https://github.com/your-username/hugo-PaperMod.git /tmp/hugo-editor
cd /tmp/hugo-editor

# 复制文件到项目目录
sudo cp -r hugo_editor /opt/hugo-editor/
sudo cp -r content /opt/hugo-editor/
sudo cp -r static /opt/hugo-editor/
sudo cp -r themes /opt/hugo-editor/
sudo cp config.yml /opt/hugo-editor/

# 设置权限
sudo chown -R hugo-editor:hugo-editor /opt/hugo-editor
sudo chmod +x /opt/hugo-editor/hugo_editor/*.sh
```

### 步骤5：安装依赖

```bash
# 切换到项目目录
cd /opt/hugo-editor/hugo_editor

# 安装Node.js依赖
sudo -u hugo-editor npm install
```

### 步骤6：配置防火墙

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 8081/tcp
sudo ufw --force enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=8081/tcp
sudo firewall-cmd --reload
```

## 🐳 Docker部署

### 准备工作

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker
```

### 部署步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-username/hugo-PaperMod.git
cd hugo-PaperMod/deploy

# 2. 配置环境变量（可选）
cp .env.example .env
nano .env

# 3. 构建并启动服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f
```

### Docker Compose 配置选项

```bash
# 基础服务
docker-compose up -d

# 包含SSL的完整服务
docker-compose --profile with-ssl up -d

# 包含缓存服务
docker-compose --profile with-cache up -d

# 运行备份
docker-compose --profile backup run --rm backup
```

## 🔒 SSL配置

### 自动SSL配置

```bash
# 使用配置脚本
sudo ./deploy/configure-ssl.sh --domain your-domain.com --email your-email@example.com
```

### 手动SSL配置

```bash
# 1. 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 2. 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 3. 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 2 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

## 🔧 服务管理

### systemd服务

```bash
# 安装服务
sudo ./deploy/configure-services.sh

# 服务管理命令
sudo systemctl start hugo-file-server hugo-editor-ui
sudo systemctl stop hugo-file-server hugo-editor-ui
sudo systemctl restart hugo-file-server hugo-editor-ui
sudo systemctl status hugo-file-server hugo-editor-ui

# 开机自启
sudo systemctl enable hugo-file-server hugo-editor-ui

# 查看日志
sudo journalctl -u hugo-file-server -f
sudo journalctl -u hugo-editor-ui -f
```

### Nginx配置

```bash
# 安装Nginx
sudo apt install -y nginx

# 复制配置文件
sudo cp deploy/nginx/hugo-editor.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/hugo-editor.conf /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

## 📊 监控和维护

### 健康检查

```bash
# 检查服务状态
curl http://localhost:8080/health
curl http://localhost:8081/health

# 检查端口
netstat -tuln | grep -E ':(8080|8081|80|443)'

# 检查进程
ps aux | grep -E '(node|nginx|hugo)'
```

### 日志管理

```bash
# 查看应用日志
tail -f /opt/hugo-editor/logs/file-server.log
tail -f /opt/hugo-editor/logs/editor-ui.log

# 查看Nginx日志
tail -f /var/log/nginx/hugo-editor.access.log
tail -f /var/log/nginx/hugo-editor.error.log

# 查看系统日志
sudo journalctl -u hugo-file-server -f
sudo journalctl -u hugo-editor-ui -f
```

### 备份和恢复

```bash
# 手动备份
sudo -u hugo-editor /opt/hugo-editor/backup.sh

# 查看备份
ls -la /opt/hugo-editor/backups/

# 恢复备份
cd /opt/hugo-editor
sudo -u hugo-editor tar -xzf backups/hugo-editor-backup-YYYYMMDD_HHMMSS.tar.gz
```

### 性能监控

```bash
# 系统资源监控
htop
iotop
df -h
free -h

# 应用性能监控
curl -s http://localhost:8080/health | jq
curl -s http://localhost:8081/health | jq

# 网络监控
ss -tuln | grep -E ':(8080|8081)'
```

## 🔍 故障排除

### 常见问题

#### 1. 端口被占用

```bash
# 查看端口占用
sudo netstat -tulpn | grep -E ':(8080|8081)'
sudo lsof -i :8080
sudo lsof -i :8081

# 解决方案
sudo systemctl stop hugo-file-server hugo-editor-ui
sudo systemctl start hugo-file-server hugo-editor-ui
```

#### 2. 权限问题

```bash
# 检查文件权限
ls -la /opt/hugo-editor/
ls -la /opt/hugo-editor/hugo_editor/

# 修复权限
sudo chown -R hugo-editor:hugo-editor /opt/hugo-editor
sudo chmod +x /opt/hugo-editor/hugo_editor/*.sh
```

#### 3. Node.js依赖问题

```bash
# 重新安装依赖
cd /opt/hugo-editor/hugo_editor
sudo -u hugo-editor rm -rf node_modules package-lock.json
sudo -u hugo-editor npm install
```

#### 4. Nginx配置问题

```bash
# 测试Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 重新加载配置
sudo systemctl reload nginx
```

#### 5. SSL证书问题

```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew --dry-run
sudo certbot renew

# 重新获取证书
sudo certbot delete --cert-name your-domain.com
sudo certbot --nginx -d your-domain.com
```

### 日志分析

```bash
# 查看错误日志
sudo grep -i error /opt/hugo-editor/logs/*.log
sudo grep -i error /var/log/nginx/*.log

# 查看访问日志
sudo tail -f /var/log/nginx/hugo-editor.access.log

# 分析日志
sudo awk '{print $1}' /var/log/nginx/hugo-editor.access.log | sort | uniq -c | sort -nr
```

### 性能优化

```bash
# 优化Node.js进程
export NODE_OPTIONS="--max-old-space-size=1024"

# 优化Nginx
sudo nano /etc/nginx/nginx.conf
# 调整 worker_processes 和 worker_connections

# 清理日志
sudo find /opt/hugo-editor/logs -name "*.log" -mtime +7 -delete
sudo find /var/log/nginx -name "*.log" -mtime +30 -delete
```

## 📞 技术支持

### 获取帮助

1. **查看文档**: 阅读完整的部署指南
2. **检查日志**: 查看应用和系统日志
3. **运行诊断**: 使用监控脚本检查系统状态
4. **社区支持**: 在GitHub Issues中提问

### 报告问题

请提供以下信息：
- 操作系统版本
- Node.js和Hugo版本
- 错误日志
- 系统资源使用情况
- 网络配置信息

## 🌐 访问和使用

### 访问地址

部署完成后，您可以通过以下地址访问：

- **HTTP访问**: `http://your-server-ip:8080`
- **域名访问**: `http://your-domain.com`（配置域名后）
- **HTTPS访问**: `https://your-domain.com`（配置SSL后）

### 首次使用

1. **打开浏览器**，访问部署地址
2. **创建文章**：填写标题、选择分类
3. **编写内容**：使用Markdown语法编写
4. **上传图片**：选择图片用途（插图/封面/图片库）
5. **实时预览**：右侧查看渲染效果
6. **一键导出**：点击"导出到Hugo"保存文章

### 功能特性

- ✅ **三种图片使用场景**：文章插图、封面图片、图片库欣赏
- ✅ **实时预览**：Markdown内容实时渲染
- ✅ **自动优化**：图片自动压缩和格式转换
- ✅ **一键导出**：直接保存到Hugo项目
- ✅ **模板系统**：多种文章模板可选
- ✅ **响应式设计**：适配各种设备

---

**Hugo Editor** - 现代化的Hugo博客编辑器 🚀
