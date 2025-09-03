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
const PORT = 8080;
const editorPath = path.resolve(__dirname);
const projectRoot = path.resolve(__dirname, '..');

// 静态文件服务（编辑器）
app.use(express.static(editorPath));

// Hugo 主站静态服务（public 目录）
app.use('/site', express.static(path.join(projectRoot, 'public')));

// 日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Hugo Editor Unified Server', timestamp: new Date().toISOString() });
});

// 主页重定向到 Hugo 主站首页
app.get('/', (req, res) => {
    res.sendFile(path.join(projectRoot, 'public', 'index.html'));
});

// CORS 配置（API 路由专用）
app.use('/api', cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            'http://localhost:1313',
            'http://127.0.0.1:1313'
        ];
        if (allowedOrigins.includes(origin) || origin.startsWith('file://')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 文件上传配置
const upload = multer({
    limits: { fileSize: 10 * 1024 * 1024 },
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const dest = path.join(projectRoot, 'static', 'images', 'uploads');
            fs.mkdir(dest, { recursive: true }).then(() => cb(null, dest));
        },
        filename: function (req, file, cb) {
            cb(null, uuidv4() + path.extname(file.originalname));
        }
    })
});

// API 路由：图片上传
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file uploaded' });
        // 图片压缩与优化
        const outputPath = path.join(file.destination, 'optimized-' + file.filename);
        await sharp(file.path)
            .resize({ width: 1920, height: 1080, fit: 'inside' })
            .jpeg({ quality: 85 })
            .toFile(outputPath);
        res.json({ success: true, filename: file.filename, url: `/static/images/uploads/optimized-${file.filename}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 路由：文件写入
app.post('/api/save', async (req, res) => {
    try {
        const { filename, content, directory } = req.body;
        if (!filename || !content) return res.status(400).json({ error: 'Missing filename or content' });
        // 支持自定义导出目录
        let targetDir = path.join(projectRoot, directory || 'content/posts');
        await fs.mkdir(targetDir, { recursive: true });
        const filePath = path.join(targetDir, filename);
        await fs.writeFile(filePath, content, 'utf8');
        res.json({ success: true, filename, relativePath: path.relative(projectRoot, filePath) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 其他 API 路由可按需扩展...

// 错误处理
app.use((err, req, res, next) => {
    console.error('统一服务器错误:', err);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Hugo Editor 统一服务器已启动，端口: ${PORT}`);
    console.log(`📍 编辑器地址: http://127.0.0.1:${PORT}`);
    console.log(`📁 服务目录: ${editorPath}`);
});
