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

// Hugo 主站静态资源优先处理（public 目录）
app.use(express.static(path.join(projectRoot, 'public')));

// 编辑器静态资源（hugo_editor 目录）
app.use(express.static(editorPath));

// 日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Hugo Editor Unified Server', timestamp: new Date().toISOString() });
});


// CORS 配置修正
const allowedOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://43.133.39.84:8080',  // VPS 地址
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
// ...existing code...
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
