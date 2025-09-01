#!/bin/bash

# Hugo Editor 系统服务配置脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_DIR="/opt/hugo-editor"
SERVICE_USER="hugo-editor"

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

# 检查root权限
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        exit 1
    fi
}

# 创建启动脚本
create_start_scripts() {
    log_info "创建启动脚本..."
    
    # 创建服务启动脚本
    cat > $PROJECT_DIR/hugo_editor/start-services.sh << 'EOF'
#!/bin/bash

# Hugo Editor 服务启动脚本

PROJECT_DIR="/opt/hugo-editor"
PID_DIR="$PROJECT_DIR/logs"
LOG_DIR="$PROJECT_DIR/logs"

# 创建必要目录
mkdir -p $PID_DIR $LOG_DIR

# 启动文件服务器
cd $PROJECT_DIR/hugo_editor
nohup node file-server.js > $LOG_DIR/file-server.log 2>&1 &
echo $! > $PID_DIR/file-server.pid

# 等待文件服务器启动
sleep 3

# 启动编辑器界面服务器
nohup node editor-server.js > $LOG_DIR/editor-ui.log 2>&1 &
echo $! > $PID_DIR/editor-ui.pid

# 创建主PID文件
echo $! > $PID_DIR/hugo-editor.pid

echo "Hugo Editor services started"
EOF

    # 创建服务停止脚本
    cat > $PROJECT_DIR/hugo_editor/stop-services.sh << 'EOF'
#!/bin/bash

# Hugo Editor 服务停止脚本

PROJECT_DIR="/opt/hugo-editor"
PID_DIR="$PROJECT_DIR/logs"

# 停止编辑器界面服务器
if [[ -f $PID_DIR/editor-ui.pid ]]; then
    kill $(cat $PID_DIR/editor-ui.pid) 2>/dev/null || true
    rm -f $PID_DIR/editor-ui.pid
fi

# 停止文件服务器
if [[ -f $PID_DIR/file-server.pid ]]; then
    kill $(cat $PID_DIR/file-server.pid) 2>/dev/null || true
    rm -f $PID_DIR/file-server.pid
fi

# 删除主PID文件
rm -f $PID_DIR/hugo-editor.pid

echo "Hugo Editor services stopped"
EOF

    # 设置执行权限
    chmod +x $PROJECT_DIR/hugo_editor/start-services.sh
    chmod +x $PROJECT_DIR/hugo_editor/stop-services.sh
    chown $SERVICE_USER:$SERVICE_USER $PROJECT_DIR/hugo_editor/start-services.sh
    chown $SERVICE_USER:$SERVICE_USER $PROJECT_DIR/hugo_editor/stop-services.sh
    
    log_success "启动脚本创建完成"
}

# 安装systemd服务
install_systemd_services() {
    log_info "安装systemd服务..."
    
    # 复制服务文件
    cp deploy/systemd/hugo-file-server.service /etc/systemd/system/
    cp deploy/systemd/hugo-editor-ui.service /etc/systemd/system/
    
    # 重新加载systemd
    systemctl daemon-reload
    
    # 启用服务
    systemctl enable hugo-file-server.service
    systemctl enable hugo-editor-ui.service
    
    log_success "systemd服务安装完成"
}

# 创建日志轮转配置
create_logrotate_config() {
    log_info "创建日志轮转配置..."
    
    cat > /etc/logrotate.d/hugo-editor << EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        systemctl reload hugo-file-server hugo-editor-ui 2>/dev/null || true
    endscript
}
EOF
    
    log_success "日志轮转配置创建完成"
}

# 创建监控脚本
create_monitoring_script() {
    log_info "创建监控脚本..."
    
    cat > $PROJECT_DIR/monitor.sh << 'EOF'
#!/bin/bash

# Hugo Editor 监控脚本

PROJECT_DIR="/opt/hugo-editor"
LOG_FILE="$PROJECT_DIR/logs/monitor.log"

# 检查服务状态
check_service() {
    local service=$1
    if systemctl is-active --quiet $service; then
        echo "$(date): $service is running" >> $LOG_FILE
        return 0
    else
        echo "$(date): $service is not running, attempting restart" >> $LOG_FILE
        systemctl start $service
        return 1
    fi
}

# 检查端口
check_port() {
    local port=$1
    local service=$2
    if netstat -tuln | grep -q ":$port "; then
        echo "$(date): Port $port ($service) is open" >> $LOG_FILE
        return 0
    else
        echo "$(date): Port $port ($service) is not accessible" >> $LOG_FILE
        return 1
    fi
}

# 主监控逻辑
main() {
    echo "$(date): Starting health check" >> $LOG_FILE
    
    # 检查服务
    check_service "hugo-file-server"
    check_service "hugo-editor-ui"
    
    # 检查端口
    check_port "8080" "editor-ui"
    check_port "8081" "file-server"
    
    # 检查磁盘空间
    disk_usage=$(df $PROJECT_DIR | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        echo "$(date): WARNING: Disk usage is ${disk_usage}%" >> $LOG_FILE
    fi
    
    # 检查内存使用
    mem_usage=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
    if (( $(echo "$mem_usage > 90" | bc -l) )); then
        echo "$(date): WARNING: Memory usage is ${mem_usage}%" >> $LOG_FILE
    fi
    
    echo "$(date): Health check completed" >> $LOG_FILE
}

main "$@"
EOF

    chmod +x $PROJECT_DIR/monitor.sh
    chown $SERVICE_USER:$SERVICE_USER $PROJECT_DIR/monitor.sh
    
    # 创建cron任务
    cat > /etc/cron.d/hugo-editor-monitor << EOF
# Hugo Editor 监控任务 - 每5分钟检查一次
*/5 * * * * $SERVICE_USER $PROJECT_DIR/monitor.sh
EOF
    
    log_success "监控脚本创建完成"
}

# 创建备份脚本
create_backup_script() {
    log_info "创建备份脚本..."
    
    cat > $PROJECT_DIR/backup.sh << 'EOF'
#!/bin/bash

# Hugo Editor 备份脚本

PROJECT_DIR="/opt/hugo-editor"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="hugo-editor-backup-$DATE.tar.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 创建备份
cd $PROJECT_DIR
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    --exclude='logs/*' \
    --exclude='backups/*' \
    --exclude='node_modules' \
    --exclude='.git' \
    content/ static/ hugo_editor/ config.yml

# 保留最近30天的备份
find $BACKUP_DIR -name "hugo-editor-backup-*.tar.gz" -mtime +30 -delete

echo "$(date): Backup created: $BACKUP_FILE"
EOF

    chmod +x $PROJECT_DIR/backup.sh
    chown $SERVICE_USER:$SERVICE_USER $PROJECT_DIR/backup.sh
    
    # 创建每日备份cron任务
    cat > /etc/cron.d/hugo-editor-backup << EOF
# Hugo Editor 每日备份 - 凌晨3点执行
0 3 * * * $SERVICE_USER $PROJECT_DIR/backup.sh
EOF
    
    log_success "备份脚本创建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 启动服务
    systemctl start hugo-file-server
    systemctl start hugo-editor-ui
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    if systemctl is-active --quiet hugo-file-server; then
        log_success "文件服务器启动成功"
    else
        log_error "文件服务器启动失败"
        systemctl status hugo-file-server
    fi
    
    if systemctl is-active --quiet hugo-editor-ui; then
        log_success "编辑器界面服务器启动成功"
    else
        log_error "编辑器界面服务器启动失败"
        systemctl status hugo-editor-ui
    fi
}

# 主函数
main() {
    echo "========================================="
    echo "    Hugo Editor 系统服务配置"
    echo "========================================="
    echo
    
    check_root
    create_start_scripts
    install_systemd_services
    create_logrotate_config
    create_monitoring_script
    create_backup_script
    start_services
    
    log_success "系统服务配置完成！"
    echo
    echo "========================================="
    echo "服务管理命令:"
    echo "启动服务: systemctl start hugo-file-server hugo-editor-ui"
    echo "停止服务: systemctl stop hugo-file-server hugo-editor-ui"
    echo "重启服务: systemctl restart hugo-file-server hugo-editor-ui"
    echo "查看状态: systemctl status hugo-file-server hugo-editor-ui"
    echo "查看日志: journalctl -u hugo-file-server -f"
    echo "========================================="
    echo
}

# 运行主函数
main "$@"
