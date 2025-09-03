@echo off
REM Hugo Editor 启动脚本
REM Hugo Editor Startup Script
REM @version 1.0.0

echo.
echo ========================================
echo    Hugo Editor 文件服务器启动脚本
echo ========================================
echo.

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [信息] Node.js 版本:
node --version

REM 检查是否在正确的目录
if not exist "package.json" (
    echo [错误] 未找到 package.json 文件
    echo 请确保在 hugo_editor 目录下运行此脚本
    pause
    exit /b 1
)

REM 检查依赖是否安装
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [成功] 依赖安装完成
    echo.
)

REM 检查端口是否被占用
echo [信息] 检查端口 8081 是否可用...
netstat -an | find "8081" >nul
if %errorlevel% equ 0 (
    echo [警告] 端口 8081 可能已被占用
    echo 如果启动失败，请检查是否有其他程序使用此端口
    echo.
)

REM 检查 Hugo 项目结构
cd ..
if not exist "config.yml" (
    if not exist "config.yaml" (
        if not exist "config.toml" (
            echo [警告] 未检测到 Hugo 配置文件
            echo 请确保在 Hugo 项目根目录下运行
        )
    )
)

if not exist "content" (
    echo [警告] 未检测到 content 目录
    mkdir content
    echo [信息] 已创建 content 目录
)

if not exist "static" (
    echo [警告] 未检测到 static 目录
    mkdir static
    echo [信息] 已创建 static 目录
)

if not exist "static\images" (
    mkdir static\images
    echo [信息] 已创建 static\images 目录
)

cd hugo_editor

echo [信息] 正在启动 Hugo Editor 统一服务器...
echo [信息] 服务地址: http://127.0.0.1:8080
echo [信息] 按 Ctrl+C 停止服务器
echo.
node unified-server.js
echo.
echo [信息] 服务器已停止
pause
