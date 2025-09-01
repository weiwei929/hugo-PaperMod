#!/bin/bash

# Hugo Editor SSL配置脚本
# 使用Let's Encrypt自动配置SSL证书

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
DOMAIN=""
EMAIL=""
WEBROOT="/var/www/certbot"

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

# 检查参数
check_params() {
    if [[ -z "$DOMAIN" ]]; then
        log_error "请提供域名参数"
        echo "用法: $0 --domain example.com --email admin@example.com"
        exit 1
    fi
    
    if [[ -z "$EMAIL" ]]; then
        log_error "请提供邮箱参数"
        echo "用法: $0 --domain example.com --email admin@example.com"
        exit 1
    fi
}

# 安装Certbot
install_certbot() {
    log_info "安装Certbot..."
    
    if command -v certbot &> /dev/null; then
        log_warning "Certbot已安装"
        return
    fi
    
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
    fi
    
    if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
        apt update
        apt install -y certbot python3-certbot-nginx
    elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]]; then
        yum install -y certbot python3-certbot-nginx
    else
        log_error "不支持的操作系统: $OS"
        exit 1
    fi
    
    log_success "Certbot安装完成"
}

# 创建webroot目录
create_webroot() {
    log_info "创建webroot目录..."
    
    mkdir -p $WEBROOT
    chown -R www-data:www-data $WEBROOT 2>/dev/null || chown -R nginx:nginx $WEBROOT
    
    log_success "Webroot目录创建完成: $WEBROOT"
}

# 配置临时Nginx
setup_temp_nginx() {
    log_info "配置临时Nginx..."
    
    cat > /etc/nginx/sites-available/temp-hugo-editor << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    location / {
        return 200 'Hugo Editor SSL Setup';
        add_header Content-Type text/plain;
    }
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/temp-hugo-editor /etc/nginx/sites-enabled/
    
    # 测试配置
    nginx -t
    systemctl reload nginx
    
    log_success "临时Nginx配置完成"
}

# 获取SSL证书
obtain_certificate() {
    log_info "获取SSL证书..."
    
    certbot certonly \
        --webroot \
        --webroot-path=$WEBROOT \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN,www.$DOMAIN
    
    if [[ $? -eq 0 ]]; then
        log_success "SSL证书获取成功"
    else
        log_error "SSL证书获取失败"
        exit 1
    fi
}

# 配置生产Nginx
setup_production_nginx() {
    log_info "配置生产环境Nginx..."
    
    # 复制配置文件并替换域名
    cp deploy/nginx/hugo-editor.conf /etc/nginx/sites-available/hugo-editor
    sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/hugo-editor
    
    # 禁用临时配置
    rm -f /etc/nginx/sites-enabled/temp-hugo-editor
    
    # 启用生产配置
    ln -sf /etc/nginx/sites-available/hugo-editor /etc/nginx/sites-enabled/
    
    # 测试配置
    nginx -t
    systemctl reload nginx
    
    log_success "生产环境Nginx配置完成"
}

# 设置自动续期
setup_auto_renewal() {
    log_info "设置SSL证书自动续期..."
    
    # 创建续期脚本
    cat > /etc/cron.d/certbot-renewal << EOF
# 每天凌晨2点检查证书续期
0 2 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
EOF
    
    # 测试续期
    certbot renew --dry-run
    
    if [[ $? -eq 0 ]]; then
        log_success "SSL证书自动续期设置完成"
    else
        log_warning "SSL证书续期测试失败，请手动检查"
    fi
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 443/tcp
        ufw reload
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --reload
    fi
    
    log_success "防火墙配置完成"
}

# 验证SSL配置
verify_ssl() {
    log_info "验证SSL配置..."
    
    sleep 5
    
    if curl -s -I https://$DOMAIN | grep -q "200 OK"; then
        log_success "SSL配置验证成功"
        log_info "您的网站现在可以通过 https://$DOMAIN 访问"
    else
        log_warning "SSL配置验证失败，请检查配置"
    fi
}

# 主函数
main() {
    echo "========================================="
    echo "    Hugo Editor SSL配置脚本"
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
            --help)
                echo "用法: $0 --domain DOMAIN --email EMAIL"
                echo "选项:"
                echo "  --domain DOMAIN    设置域名"
                echo "  --email EMAIL      设置邮箱（用于SSL证书）"
                echo "  --help             显示帮助信息"
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                exit 1
                ;;
        esac
    done
    
    check_params
    
    # 检查root权限
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        exit 1
    fi
    
    # 执行SSL配置步骤
    install_certbot
    create_webroot
    setup_temp_nginx
    obtain_certificate
    setup_production_nginx
    setup_auto_renewal
    configure_firewall
    verify_ssl
    
    log_success "SSL配置完成！"
    echo
    echo "========================================="
    echo "SSL配置信息:"
    echo "域名: $DOMAIN"
    echo "证书路径: /etc/letsencrypt/live/$DOMAIN/"
    echo "访问地址: https://$DOMAIN"
    echo "自动续期: 已启用"
    echo "========================================="
    echo
}

# 运行主函数
main "$@"
