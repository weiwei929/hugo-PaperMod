# Hugo Editor VPS 部署文件

本目录包含了Hugo Editor在VPS上部署所需的所有文件和脚本。

## 📁 文件结构

```
deploy/
├── deploy.sh                    # 主部署脚本
├── quick-start.sh              # 快速启动脚本
├── configure-services.sh       # 系统服务配置脚本
├── configure-ssl.sh            # SSL证书配置脚本
├── Dockerfile                  # Docker镜像构建文件
├── docker-compose.yml          # Docker Compose配置
├── .env.example               # 环境变量配置示例
├── DEPLOYMENT_GUIDE.md        # 详细部署指南
├── docker/                    # Docker相关配置
│   ├── nginx.conf             # Docker内Nginx配置
│   └── supervisord.conf       # 进程管理配置
├── nginx/                     # Nginx配置文件
│   └── hugo-editor.conf       # 生产环境Nginx配置
└── systemd/                   # 系统服务配置
    ├── hugo-editor.service    # 主服务配置
    ├── hugo-file-server.service  # 文件服务器配置
    └── hugo-editor-ui.service    # 编辑器界面服务配置
```

## 🚀 快速部署

### 方法一：一键部署（推荐）

```bash
# 在VPS上执行
sudo ./deploy/quick-start.sh --domain your-domain.com --email your-email@example.com --ssl
```

### 方法二：Docker部署

```bash
# 在VPS上执行
sudo ./deploy/quick-start.sh --docker
```

### 方法三：分步部署

```bash
# 1. 基础部署
sudo ./deploy/deploy.sh

# 2. 配置服务
sudo ./deploy/configure-services.sh

# 3. 配置SSL（可选）
sudo ./deploy/configure-ssl.sh --domain your-domain.com --email your-email@example.com
```

## ⚙️ 部署前准备

### 1. 服务器要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **内存**: 最低1GB，推荐2GB
- **存储**: 最低10GB，推荐20GB SSD
- **网络**: 公网IP地址，建议有域名

### 2. 上传文件到VPS

```bash
# 方法一：使用git克隆
git clone https://github.com/your-username/hugo-PaperMod.git
cd hugo-PaperMod

# 方法二：使用scp上传
scp -r ./deploy root@your-server-ip:/tmp/
scp -r ./hugo_editor root@your-server-ip:/tmp/
```

### 3. 设置脚本权限

```bash
# 在VPS上执行
chmod +x deploy/*.sh
```

## 🔧 配置说明

### 环境变量配置

```bash
# 复制环境变量配置文件
cp deploy/.env.example deploy/.env

# 编辑配置
nano deploy/.env
```

### 域名配置

如果您有域名，请确保：
1. 域名已解析到服务器IP
2. 防火墙已开放80和443端口
3. 在部署时指定域名参数

### SSL证书配置

使用Let's Encrypt免费SSL证书：
```bash
sudo ./deploy/configure-ssl.sh --domain your-domain.com --email your-email@example.com
```

## 📊 服务管理

### systemd服务

```bash
# 查看服务状态
sudo systemctl status hugo-file-server hugo-editor-ui

# 启动服务
sudo systemctl start hugo-file-server hugo-editor-ui

# 停止服务
sudo systemctl stop hugo-file-server hugo-editor-ui

# 重启服务
sudo systemctl restart hugo-file-server hugo-editor-ui

# 查看日志
sudo journalctl -u hugo-file-server -f
sudo journalctl -u hugo-editor-ui -f
```

### Docker服务

```bash
# 查看容器状态
docker-compose ps

# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart
```

## 🔍 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   sudo netstat -tulpn | grep -E ':(8080|8081)'
   sudo systemctl stop hugo-file-server hugo-editor-ui
   ```

2. **权限问题**
   ```bash
   sudo chown -R hugo-editor:hugo-editor /opt/hugo-editor
   ```

3. **依赖问题**
   ```bash
   cd /opt/hugo-editor/hugo_editor
   sudo -u hugo-editor npm install
   ```

4. **Nginx配置问题**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### 日志查看

```bash
# 应用日志
tail -f /opt/hugo-editor/logs/*.log

# Nginx日志
tail -f /var/log/nginx/hugo-editor.*.log

# 系统日志
sudo journalctl -u hugo-file-server -f
```

## 📞 技术支持

如果遇到问题，请：

1. 查看详细部署指南：`DEPLOYMENT_GUIDE.md`
2. 检查日志文件
3. 在GitHub Issues中提问
4. 提供系统信息和错误日志

## 🔄 更新部署

```bash
# 拉取最新代码
git pull origin master

# 重新部署
sudo ./deploy/quick-start.sh

# 或者重启服务
sudo systemctl restart hugo-file-server hugo-editor-ui
```

---

**Hugo Editor** - 让Hugo博客创作更简单 🚀
