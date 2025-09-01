# Hugo Editor Docker 镜像
# 基于 Node.js 18 Alpine Linux
FROM node:18-alpine

# 设置维护者信息
LABEL maintainer="Hugo Editor Team"
LABEL version="1.0.0"
LABEL description="Hugo Editor - 现代化的Hugo博客编辑器"

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    bash \
    curl \
    git \
    hugo \
    nginx \
    supervisor \
    tzdata \
    && rm -rf /var/cache/apk/*

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用用户
RUN addgroup -g 1001 -S hugo-editor && \
    adduser -S hugo-editor -u 1001 -G hugo-editor

# 复制package.json和package-lock.json
COPY hugo_editor/package*.json ./hugo_editor/

# 安装Node.js依赖
RUN cd hugo_editor && npm ci --only=production && npm cache clean --force

# 复制项目文件
COPY . .

# 设置文件权限
RUN chown -R hugo-editor:hugo-editor /app && \
    chmod +x hugo_editor/*.sh

# 创建必要的目录
RUN mkdir -p /app/logs /app/uploads /app/backups && \
    chown -R hugo-editor:hugo-editor /app/logs /app/uploads /app/backups

# 复制配置文件
COPY deploy/docker/nginx.conf /etc/nginx/nginx.conf
COPY deploy/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 暴露端口
EXPOSE 80 8080 8081

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080
ENV FILE_SERVER_PORT=8081
ENV HUGO_ENV=production

# 使用supervisor启动多个服务
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
