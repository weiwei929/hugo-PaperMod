#!/bin/bash

# Hugo Editor 快速启动脚本
# 一键部署到VPS

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置变量
DOMAIN=""
EMAIL=""
USE_SSL=false
USE_DOCKER=false
SKIP_DEPS=false

# 显示横幅
show_banner() {
    echo -e "${CYAN}"
    echo "========================================="
    echo "    🚀 Hugo Editor 快速部署脚本"
    echo "========================================="
    echo -e "${NC}"
    echo "现代化的Hugo博客编辑器"
    echo "支持图片管理、实时预览、一键导出"
    echo
}

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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "Hugo Editor 快速部署脚本"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  --domain DOMAIN      设置域名（推荐）"
    echo "  --email EMAIL        设置邮箱（用于SSL证书）"
    echo "  --ssl                启用SSL证书"
    echo "  --docker             使用Docker部署"
    echo "  --skip-deps          跳过依赖安装"
    echo "  --help               显示帮助信息"
    echo
    echo "示例:"
    echo "  $0 --domain blog.example.com --email admin@example.com --ssl"
    echo "  $0 --docker"
    echo "  $0"
    echo
}

# 检查系统要求
check_requirements() {
    log_step "检查系统要求..."
    
    # 检查操作系统
    if [[ ! -f /etc/os-release ]]; then
        log_error "不支持的操作系统"
        exit 1
    fi
    
    . /etc/os-release
    log_info "操作系统: $NAME $VERSION_ID"
    
    # 检查root权限
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
    
    # 检查网络连接
    if ! ping -c 1 google.com &> /dev/null; then
        log_warning "网络连接可能有问题"
    fi
    
    # 检查可用空间
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 5000000 ]]; then  # 5GB
        log_warning "可用磁盘空间不足5GB，建议清理磁盘"
    fi
    
    log_success "系统要求检查完成"
}

# Docker部署
deploy_with_docker() {
    log_step "使用Docker部署..."
    
    # 安装Docker
    if ! command -v docker &> /dev/null; then
        log_info "安装Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl start docker
        systemctl enable docker
    fi
    
    # 安装Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_info "安装Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # 构建并启动服务
    cd deploy
    
    if [[ "$USE_SSL" == true && -n "$DOMAIN" ]]; then
        log_info "启动带SSL的完整服务..."
        docker-compose --profile with-ssl up -d
    else
        log_info "启动基础服务..."
        docker-compose up -d
    fi
    
    log_success "Docker部署完成"
}

# 传统部署
deploy_traditional() {
    log_step "使用传统方式部署..."
    
    # 运行主部署脚本
    ./deploy/deploy.sh ${DOMAIN:+--domain $DOMAIN} ${EMAIL:+--email $EMAIL} ${USE_SSL:+--ssl}
    
    # 配置服务
    ./deploy/configure-services.sh
    
    # 配置Nginx
    if [[ -n "$DOMAIN" ]]; then
        log_info "配置Nginx..."
        cp deploy/nginx/hugo-editor.conf /etc/nginx/sites-available/
        sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/hugo-editor.conf
        ln -sf /etc/nginx/sites-available/hugo-editor.conf /etc/nginx/sites-enabled/
        nginx -t && systemctl reload nginx
    fi
    
    # 配置SSL
    if [[ "$USE_SSL" == true && -n "$DOMAIN" && -n "$EMAIL" ]]; then
        ./deploy/configure-ssl.sh --domain $DOMAIN --email $EMAIL
    fi
    
    log_success "传统部署完成"
}

# 部署后检查
post_deploy_check() {
    log_step "部署后检查..."
    
    sleep 10  # 等待服务启动
    
    # 检查端口
    local ports=(8080 8081)
    for port in "${ports[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            log_success "端口 $port 正常监听"
        else
            log_warning "端口 $port 未监听"
        fi
    done
    
    # 检查HTTP响应
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then
        log_success "HTTP服务正常"
    else
        log_warning "HTTP服务可能有问题"
    fi
    
    # 检查文件服务器
    if curl -s http://localhost:8081/health | grep -q "ok"; then
        log_success "文件服务器正常"
    else
        log_warning "文件服务器可能有问题"
    fi
}

# 显示部署结果
show_result() {
    echo
    echo -e "${GREEN}========================================="
    echo "    🎉 Hugo Editor 部署完成！"
    echo "=========================================${NC}"
    echo
    
    # 获取服务器IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
    
    echo "📍 访问地址:"
    if [[ -n "$DOMAIN" ]]; then
        if [[ "$USE_SSL" == true ]]; then
            echo "   🔒 HTTPS: https://$DOMAIN"
            echo "   🔒 HTTPS: https://www.$DOMAIN"
        else
            echo "   🌐 HTTP:  http://$DOMAIN"
            echo "   🌐 HTTP:  http://www.$DOMAIN"
        fi
    else
        echo "   🌐 HTTP:  http://$SERVER_IP:8080"
    fi
    echo
    
    echo "🔧 服务管理:"
    if [[ "$USE_DOCKER" == true ]]; then
        echo "   启动服务: docker-compose up -d"
        echo "   停止服务: docker-compose down"
        echo "   查看日志: docker-compose logs -f"
        echo "   查看状态: docker-compose ps"
    else
        echo "   启动服务: systemctl start hugo-file-server hugo-editor-ui"
        echo "   停止服务: systemctl stop hugo-file-server hugo-editor-ui"
        echo "   查看状态: systemctl status hugo-file-server hugo-editor-ui"
        echo "   查看日志: journalctl -u hugo-file-server -f"
    fi
    echo
    
    echo "📁 重要路径:"
    if [[ "$USE_DOCKER" == true ]]; then
        echo "   项目目录: $(pwd)"
        echo "   配置文件: $(pwd)/deploy/docker-compose.yml"
        echo "   日志目录: Docker容器内 /app/logs"
    else
        echo "   项目目录: /opt/hugo-editor"
        echo "   日志目录: /opt/hugo-editor/logs"
        echo "   备份目录: /opt/hugo-editor/backups"
    fi
    echo
    
    echo "📚 使用指南:"
    echo "   1. 打开浏览器访问上述地址"
    echo "   2. 创建文章：填写标题、选择分类"
    echo "   3. 上传图片：选择用途（插图/封面/图片库）"
    echo "   4. 编写内容：使用Markdown语法"
    echo "   5. 实时预览：右侧查看渲染效果"
    echo "   6. 一键导出：保存到Hugo项目"
    echo
    
    if [[ "$USE_SSL" != true && -n "$DOMAIN" ]]; then
        echo -e "${YELLOW}💡 提示: 建议配置SSL证书以提高安全性${NC}"
        echo "   运行: sudo ./deploy/configure-ssl.sh --domain $DOMAIN --email your-email@example.com"
        echo
    fi
    
    echo -e "${CYAN}🎯 Hugo Editor 已准备就绪，开始您的博客创作之旅！${NC}"
    echo
}

# 主函数
main() {
    show_banner
    
    # 解析参数
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
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 执行部署
    check_requirements
    
    if [[ "$USE_DOCKER" == true ]]; then
        deploy_with_docker
    else
        deploy_traditional
    fi
    
    post_deploy_check
    show_result
}

# 运行主函数
main "$@"
