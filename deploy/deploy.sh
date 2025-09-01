#!/bin/bash

# Hugo Editor VPS 部署脚本
# 适用于 Ubuntu 20.04+ / CentOS 8+ / Debian 11+
# 作者: Hugo Editor Team
# 版本: 1.0.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="hugo-editor"
PROJECT_DIR="/opt/hugo-editor"
SERVICE_USER="hugo-editor"
DOMAIN=""
EMAIL=""
USE_SSL=false
USE_DOCKER=false

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    
    log_info "检测到操作系统: $OS $VER"
}

# 更新系统包
update_system() {
    log_info "更新系统包..."
    
    if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
        apt update && apt upgrade -y
        apt install -y curl wget git unzip software-properties-common
    elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]]; then
        yum update -y
        yum install -y curl wget git unzip epel-release
    else
        log_error "不支持的操作系统: $OS"
        exit 1
    fi
    
    log_success "系统包更新完成"
}

# 安装Node.js
install_nodejs() {
    log_info "安装Node.js..."
    
    # 使用NodeSource官方仓库安装Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
        apt install -y nodejs
    elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]]; then
        yum install -y nodejs npm
    fi
    
    # 验证安装
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    log_success "Node.js安装完成: $node_version"
    log_success "npm版本: $npm_version"
}

# 安装Hugo
install_hugo() {
    log_info "安装Hugo..."
    
    # 获取最新版本
    HUGO_VERSION=$(curl -s https://api.github.com/repos/gohugoio/hugo/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    
    # 下载并安装Hugo
    cd /tmp
    wget https://github.com/gohugoio/hugo/releases/download/${HUGO_VERSION}/hugo_extended_${HUGO_VERSION#v}_Linux-64bit.tar.gz
    tar -xzf hugo_extended_${HUGO_VERSION#v}_Linux-64bit.tar.gz
    mv hugo /usr/local/bin/
    chmod +x /usr/local/bin/hugo
    
    # 验证安装
    hugo_version=$(hugo version)
    log_success "Hugo安装完成: $hugo_version"
}

# 安装Nginx
install_nginx() {
    log_info "安装Nginx..."
    
    if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
        apt install -y nginx
    elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]]; then
        yum install -y nginx
    fi
    
    # 启动并启用Nginx
    systemctl start nginx
    systemctl enable nginx
    
    log_success "Nginx安装完成"
}

# 创建项目用户
create_user() {
    log_info "创建项目用户: $SERVICE_USER"
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d $PROJECT_DIR $SERVICE_USER
        log_success "用户 $SERVICE_USER 创建成功"
    else
        log_warning "用户 $SERVICE_USER 已存在"
    fi
}

# 创建项目目录
create_directories() {
    log_info "创建项目目录..."
    
    mkdir -p $PROJECT_DIR
    mkdir -p $PROJECT_DIR/logs
    mkdir -p $PROJECT_DIR/backups
    mkdir -p /etc/hugo-editor
    
    chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_DIR
    
    log_success "项目目录创建完成"
}

# 部署项目文件
deploy_project() {
    log_info "部署项目文件..."
    
    # 如果项目目录已存在，先备份
    if [[ -d "$PROJECT_DIR/hugo_editor" ]]; then
        log_info "备份现有项目..."
        mv $PROJECT_DIR/hugo_editor $PROJECT_DIR/backups/hugo_editor_$(date +%Y%m%d_%H%M%S)
    fi
    
    # 复制项目文件
    cp -r ./hugo_editor $PROJECT_DIR/
    cp -r ./content $PROJECT_DIR/
    cp -r ./static $PROJECT_DIR/
    cp -r ./themes $PROJECT_DIR/
    cp ./config.yml $PROJECT_DIR/
    
    # 设置权限
    chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_DIR
    chmod +x $PROJECT_DIR/hugo_editor/*.sh
    
    log_success "项目文件部署完成"
}

# 安装项目依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    cd $PROJECT_DIR/hugo_editor
    sudo -u $SERVICE_USER npm install
    
    log_success "项目依赖安装完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian UFW
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 8080/tcp
        ufw allow 8081/tcp
        ufw --force enable
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL firewalld
        firewall-cmd --permanent --add-port=22/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=8080/tcp
        firewall-cmd --permanent --add-port=8081/tcp
        firewall-cmd --reload
    fi
    
    log_success "防火墙配置完成"
}

# 主函数
main() {
    echo "========================================="
    echo "    Hugo Editor VPS 部署脚本"
    echo "========================================="
    echo
    
    # 检查参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --email)
                EMAIL="$2"
                shift 2
                ;;
            --ssl)
                USE_SSL=true
                shift
                ;;
            --docker)
                USE_DOCKER=true
                shift
                ;;
            --help)
                echo "用法: $0 [选项]"
                echo "选项:"
                echo "  --domain DOMAIN    设置域名"
                echo "  --email EMAIL      设置邮箱（用于SSL证书）"
                echo "  --ssl              启用SSL证书"
                echo "  --docker           使用Docker部署"
                echo "  --help             显示帮助信息"
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                exit 1
                ;;
        esac
    done
    
    # 执行部署步骤
    check_root
    detect_os
    update_system
    install_nodejs
    install_hugo
    install_nginx
    create_user
    create_directories
    deploy_project
    install_dependencies
    configure_firewall
    
    log_success "Hugo Editor 部署完成！"
    echo
    echo "========================================="
    echo "部署信息:"
    echo "项目目录: $PROJECT_DIR"
    echo "服务用户: $SERVICE_USER"
    echo "访问地址: http://$(curl -s ifconfig.me):8080"
    if [[ -n "$DOMAIN" ]]; then
        echo "域名访问: http://$DOMAIN"
    fi
    echo "========================================="
    echo
    echo "下一步操作:"
    echo "1. 配置系统服务: ./configure-services.sh"
    echo "2. 配置Nginx: ./configure-nginx.sh"
    if [[ "$USE_SSL" == true ]]; then
        echo "3. 配置SSL证书: ./configure-ssl.sh"
    fi
    echo "4. 启动服务: systemctl start hugo-editor"
    echo
}

# 运行主函数
main "$@"
