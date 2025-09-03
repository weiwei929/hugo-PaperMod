/**
 * Hugo Editor 统一服务器（单进程单端口）
 * 集成静态服务和 API 服务，端口默认 8080
 */

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const cors = require('cors');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8080;
const editorPath = path.resolve(__dirname);
const projectRoot = path.resolve(__dirname, '..');

// 环境检测
console.log('🔧 环境信息:');
console.log(`   - Node.js: ${process.version}`);
console.log(`   - 平台: ${process.platform}`);
console.log(`   - 架构: ${process.arch}`);
console.log(`   - 工作目录: ${projectRoot}`);
console.log(`   - 编辑器目录: ${editorPath}`);
console.log(`   - 端口: ${PORT}`);

// 检查必要的目录
async function ensureDirectories() {
    const dirs = [
        path.join(projectRoot, 'static', 'images', 'uploads'),
        path.join(projectRoot, 'content', 'posts'),
        path.join(projectRoot, 'public')
    ];
    
    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
            console.log(`✅ 目录确认: ${path.relative(projectRoot, dir)}`);
        } catch (err) {
            console.warn(`⚠️  目录创建失败: ${path.relative(projectRoot, dir)} - ${err.message}`);
        }
    }
}

ensureDirectories();

// Hugo 主站静态资源优先处理（public 目录）
app.use(express.static(path.join(projectRoot, 'public')));

// 编辑器静态资源（hugo_editor 目录）
app.use(express.static(editorPath));

// 图片上传目录静态服务
app.use('/images/uploads', express.static(path.join(projectRoot, 'static', 'images', 'uploads')));

// Hugo static 目录静态服务（兼容旧的图片路径）
app.use('/images', express.static(path.join(projectRoot, 'static', 'images')));

// 日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// 健康检查
app.get('/health', (req, res) => {
    const healthData = {
        status: 'ok',
        service: 'Hugo Editor Unified Server',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            platform: process.platform,
            arch: process.arch
        },
        directories: {
            project: projectRoot,
            editor: editorPath,
            uploads: path.join(projectRoot, 'static', 'images', 'uploads')
        }
    };
    res.json(healthData);
});


// CORS 配置修正
const allowedOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://43.133.39.84:8080',  // VPS 地址
    'http://0.0.0.0:8080',      // 通配符监听
    // 可按需扩展其他允许的来源
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('file://')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '1mb' })); // 限制JSON payload大小
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 安全头中间件
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// 文件上传配置
const upload = multer({
    limits: { 
        fileSize: 10 * 1024 * 1024,  // 10MB限制
        files: 1                      // 单次只能上传1个文件
    },
    fileFilter: function (req, file, cb) {
        // 只允许图片文件
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
        }
    },
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const dest = path.join(projectRoot, 'static', 'images', 'uploads');
            fs.mkdir(dest, { recursive: true }).then(() => cb(null, dest));
        },
        filename: function (req, file, cb) {
            // 生成安全的文件名
            const ext = path.extname(file.originalname).toLowerCase();
            const safeName = uuidv4() + ext;
            cb(null, safeName);
        }
    })
});

// API 路由：图片上传
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file uploaded' });
        
        // 图片压缩与优化
        const optimizedFilename = 'optimized-' + file.filename;
        const outputPath = path.join(file.destination, optimizedFilename);
        
        await sharp(file.path)
            .resize({ width: 1920, height: 1080, fit: 'inside' })
            .jpeg({ quality: 85 })
            .toFile(outputPath);
        
        // 删除原始文件，只保留优化后的文件
        await fs.unlink(file.path);
        
        // 返回正确的图片访问路径
        const webPath = `/images/uploads/${optimizedFilename}`;
        res.json({ 
            success: true, 
            filename: optimizedFilename, 
            url: webPath,
            webPath: webPath,
            markdownRef: `![${file.originalname}](${webPath})`,
            // 兼容前端期望的数据结构
            images: [{
                filename: optimizedFilename,
                webPath: webPath,
                originalname: file.originalname
            }]
        });
    } catch (err) {
        console.error('图片上传错误:', err);
        res.status(500).json({ error: err.message });
    }
});

// API 路由：文件写入
app.post('/api/save', async (req, res) => {
    try {
        const { filename, content, directory } = req.body;
        if (!filename || !content) {
            return res.status(400).json({ error: 'Missing filename or content' });
        }
        
        // 安全性验证
        // 1. 验证文件名
        const safeFilename = path.basename(filename); // 防止目录穿越
        if (safeFilename !== filename || !safeFilename.endsWith('.md')) {
            return res.status(400).json({ error: 'Invalid filename. Only .md files allowed.' });
        }
        
        // 2. 验证目录路径
        const allowedDirs = ['content/posts', 'content/drafts'];
        const targetDirectory = directory || 'content/posts';
        if (!allowedDirs.includes(targetDirectory)) {
            return res.status(400).json({ error: 'Invalid directory path' });
        }
        
        // 3. 构建安全的文件路径
        let targetDir = path.join(projectRoot, targetDirectory);
        await fs.mkdir(targetDir, { recursive: true });
        const filePath = path.join(targetDir, safeFilename);
        
        // 4. 验证路径没有穿越出项目目录
        if (!filePath.startsWith(projectRoot)) {
            return res.status(400).json({ error: 'Path traversal not allowed' });
        }
        
        await fs.writeFile(filePath, content, 'utf8');
        
        // 触发 Hugo 重建
        try {
            const { spawn } = require('child_process');
            
            // 检测操作系统，Windows下使用hugo.exe
            const isWindows = process.platform === 'win32';
            const hugoCmd = isWindows ? 'hugo.exe' : 'hugo';
            
            const hugo = spawn(hugoCmd, ['--cleanDestinationDir', '--environment', 'production'], { 
                cwd: projectRoot,
                stdio: 'pipe',
                shell: isWindows // Windows需要shell
            });
            
            hugo.stdout.on('data', (data) => {
                console.log(`Hugo: ${data.toString().trim()}`);
            });
            
            hugo.stderr.on('data', (data) => {
                console.error(`Hugo错误: ${data.toString().trim()}`);
            });
            
            hugo.on('close', (code) => {
                console.log(`Hugo 重建完成，退出码: ${code}`);
                if (code !== 0) {
                    console.error('Hugo 重建失败');
                }
            });
            
            hugo.on('error', (err) => {
                console.error('Hugo 重建错误:', err.message);
            });
        } catch (hugoError) {
            console.warn('Hugo 重建失败:', hugoError.message);
        }
        
        res.json({ success: true, filename, relativePath: path.relative(projectRoot, filePath) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 兜底 Hugo 站点静态资源（如 /posts/xxx/、/tags/xxx/ 等）
app.use(async (req, res, next) => {
    try {
        const filePath = path.join(projectRoot, 'public', req.path);
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
            return res.sendFile(filePath);
        }
    } catch {
        // 文件不存在则继续后续处理
    }
    next();
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] 服务器错误:`, {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    
    res.status(500).json({ 
        error: err.message,
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

// 404 处理
app.use((req, res) => {
    console.warn(`[${new Date().toISOString()}] 404: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'Resource not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🎉 ===================================');
    console.log('   Hugo Editor 统一服务器启动成功');
    console.log('🎉 ===================================');
    console.log(`🚀 服务器端口: ${PORT}`);
    console.log(`📍 本地访问: http://127.0.0.1:${PORT}`);
    console.log(`🌐 外部访问: http://0.0.0.0:${PORT}`);
    console.log(`📁 项目根目录: ${projectRoot}`);
    console.log(`📝 编辑器地址: http://127.0.0.1:${PORT}/hugo-editor.html`);
    console.log(`🏠 主站地址: http://127.0.0.1:${PORT}/`);
    console.log('');
    console.log('📚 可用的API端点:');
    console.log('   - GET  /health          健康检查');
    console.log('   - POST /api/upload      图片上传');
    console.log('   - POST /api/save        文章保存');
    console.log('');
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('🛑 收到SIGTERM信号，优雅关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 收到SIGINT信号，优雅关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});
