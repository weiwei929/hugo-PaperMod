/**
 * Hugo Editor 静态文件服务器
 * 提供编辑器界面的 HTTP 服务，解决 CORS 问题
 * @version 1.0.0
 */

const express = require('express');
const path = require('path');

class EditorServer {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || 8080;
        this.editorPath = options.editorPath || __dirname;
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        // 静态文件服务
        this.app.use(express.static(this.editorPath));
        
        // 日志中间件
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }
    
    setupRoutes() {
        // 主页重定向到编辑器
        this.app.get('/', (req, res) => {
            res.redirect('/hugo-editor.html');
        });
        
        // 健康检查
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                service: 'Hugo Editor Static Server',
                timestamp: new Date().toISOString()
            });
        });
    }
    
    async start() {
        try {
            this.server = this.app.listen(this.port, '127.0.0.1', () => {
                console.log(`🌐 Hugo Editor 界面服务器已启动`);
                console.log(`📍 编辑器地址: http://127.0.0.1:${this.port}`);
                console.log(`📁 服务目录: ${this.editorPath}`);
                console.log(`💡 请在浏览器中访问上述地址使用编辑器`);
            });
            
            return this.server;
        } catch (error) {
            console.error('编辑器服务器启动失败:', error);
            throw error;
        }
    }
    
    async stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(resolve);
            });
        }
    }
}

// 如果直接运行此文件，启动服务器
if (require.main === module) {
    const editorServer = new EditorServer({
        port: process.env.EDITOR_PORT || 8080,
        editorPath: __dirname
    });

    editorServer.start().catch(console.error);

    // 优雅关闭
    process.on('SIGINT', async () => {
        console.log('\n正在关闭编辑器服务器...');
        await editorServer.stop();
        process.exit(0);
    });
}

module.exports = EditorServer;
