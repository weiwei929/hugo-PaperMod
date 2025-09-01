/**
 * Hugo Editor 本地文件服务器
 * 提供文件写入和图片上传 API，支持 Hugo 项目集成
 * @version 1.0.0
 * @author Hugo Editor Team
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class HugoFileServer {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || 8081;
        this.projectRoot = options.projectRoot || path.resolve(__dirname, '..');
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            allowedFileTypes: ['.md', '.txt', '.json'],
            imageQuality: 85,
            maxImageWidth: 1920,
            maxImageHeight: 1080,
            ...options
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // CORS 配置 - 允许本地文件和本地服务器访问
        this.app.use(cors({
            origin: function(origin, callback) {
                // 允许没有 origin 的请求（如 file:// 协议）
                if (!origin) return callback(null, true);

                // 允许的来源列表
                const allowedOrigins = [
                    'http://localhost:8080',
                    'http://127.0.0.1:8080',
                    'http://localhost:1313',
                    'http://127.0.0.1:1313'
                ];

                // 检查是否为允许的来源或本地文件
                if (allowedOrigins.includes(origin) || origin.startsWith('file://')) {
                    return callback(null, true);
                }

                return callback(null, true); // 临时允许所有本地请求
            },
            credentials: false,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // JSON 解析
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // 静态文件服务
        this.app.use('/static', express.static(path.join(this.projectRoot, 'static')));

        // 请求日志
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // 健康检查
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                projectRoot: this.projectRoot
            });
        });

        // 文件写入 API
        this.app.post('/api/files/write', async (req, res) => {
            try {
                const { content, filename, directory = 'content/posts' } = req.body;
                
                if (!content || !filename) {
                    return res.status(400).json({ 
                        success: false, 
                        error: '缺少必要参数：content 和 filename' 
                    });
                }

                const result = await this.writeFile(content, filename, directory);
                res.json(result);
            } catch (error) {
                console.error('文件写入错误:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        });

        // 图片上传 API
        this.app.post('/api/images/upload', this.setupImageUpload(), async (req, res) => {
            try {
                if (!req.files || req.files.length === 0) {
                    return res.status(400).json({ 
                        success: false, 
                        error: '没有上传的图片文件' 
                    });
                }

                const { category = 'posts', articleSlug } = req.body;
                const results = [];

                for (const file of req.files) {
                    const result = await this.processAndSaveImage(file, category, articleSlug);
                    results.push(result);
                }

                res.json({ 
                    success: true, 
                    images: results 
                });
            } catch (error) {
                console.error('图片上传错误:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        });

        // 项目结构检测 API
        this.app.get('/api/project/structure', async (req, res) => {
            try {
                const structure = await this.detectProjectStructure();
                res.json(structure);
            } catch (error) {
                console.error('项目结构检测错误:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        });

        // 目录创建 API
        this.app.post('/api/directories/create', async (req, res) => {
            try {
                const { path: dirPath } = req.body;
                
                if (!dirPath) {
                    return res.status(400).json({ 
                        success: false, 
                        error: '缺少目录路径参数' 
                    });
                }

                const result = await this.createDirectory(dirPath);
                res.json(result);
            } catch (error) {
                console.error('目录创建错误:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        });
    }

    setupImageUpload() {
        const storage = multer.memoryStorage();
        return multer({
            storage: storage,
            limits: {
                fileSize: this.config.maxFileSize,
                files: 10 // 最多10个文件
            },
            fileFilter: (req, file, cb) => {
                if (this.config.allowedImageTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error(`不支持的图片格式: ${file.mimetype}`), false);
                }
            }
        }).array('images', 10);
    }

    async writeFile(content, filename, directory) {
        // 路径安全验证
        const sanitizedFilename = this.sanitizeFilename(filename);
        const sanitizedDirectory = this.sanitizePath(directory);
        
        if (!this.isPathSafe(sanitizedDirectory)) {
            throw new Error('不安全的目录路径');
        }

        const fullDirectory = path.join(this.projectRoot, sanitizedDirectory);
        const fullPath = path.join(fullDirectory, sanitizedFilename);

        // 确保目录存在
        await fs.mkdir(fullDirectory, { recursive: true });

        // 写入文件
        await fs.writeFile(fullPath, content, 'utf8');

        return {
            success: true,
            path: fullPath,
            relativePath: path.join(sanitizedDirectory, sanitizedFilename),
            message: '文件写入成功'
        };
    }

    async processAndSaveImage(file, category, articleSlug) {
        // 生成唯一文件名
        const timestamp = new Date().toISOString().slice(0, 7).replace('-', '/'); // 2025/01
        const uniqueId = uuidv4().slice(0, 8);
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext);
        const sanitizedBaseName = this.sanitizeFilename(baseName);
        
        let imagePath;
        if (articleSlug) {
            imagePath = `static/images/${category}/${articleSlug}`;
        } else {
            imagePath = `static/images/${category}/${timestamp}`;
        }
        
        const filename = `${sanitizedBaseName}-${uniqueId}${ext}`;
        const fullDirectory = path.join(this.projectRoot, imagePath);
        const fullPath = path.join(fullDirectory, filename);

        // 确保目录存在
        await fs.mkdir(fullDirectory, { recursive: true });

        // 图片处理和优化
        let processedBuffer = file.buffer;
        
        if (file.mimetype !== 'image/gif') { // GIF 不处理，保持动画
            try {
                const image = sharp(file.buffer);
                const metadata = await image.metadata();
                
                // 调整尺寸
                if (metadata.width > this.config.maxImageWidth || 
                    metadata.height > this.config.maxImageHeight) {
                    image.resize(this.config.maxImageWidth, this.config.maxImageHeight, {
                        fit: 'inside',
                        withoutEnlargement: true
                    });
                }

                // 压缩
                if (file.mimetype === 'image/jpeg') {
                    processedBuffer = await image.jpeg({ 
                        quality: this.config.imageQuality 
                    }).toBuffer();
                } else if (file.mimetype === 'image/png') {
                    processedBuffer = await image.png({ 
                        compressionLevel: 6 
                    }).toBuffer();
                } else if (file.mimetype === 'image/webp') {
                    processedBuffer = await image.webp({ 
                        quality: this.config.imageQuality 
                    }).toBuffer();
                }
            } catch (error) {
                console.warn('图片处理失败，使用原始文件:', error.message);
            }
        }

        // 保存文件
        await fs.writeFile(fullPath, processedBuffer);

        // 生成 Web 路径
        const webPath = `/${imagePath.replace('static/', '')}/${filename}`;

        return {
            originalName: file.originalname,
            filename: filename,
            path: fullPath,
            webPath: webPath,
            size: processedBuffer.length,
            category: category,
            markdownRef: `![${sanitizedBaseName}](${webPath})`
        };
    }

    async detectProjectStructure() {
        const structure = {
            isHugoProject: false,
            hasConfig: false,
            hasContent: false,
            hasStatic: false,
            hasThemes: false,
            directories: [],
            detectedAt: new Date().toISOString()
        };

        try {
            // 检查配置文件
            const configFiles = ['config.yml', 'config.yaml', 'config.toml', 'config.json'];
            for (const configFile of configFiles) {
                try {
                    await fs.access(path.join(this.projectRoot, configFile));
                    structure.hasConfig = true;
                    structure.configFile = configFile;
                    break;
                } catch {}
            }

            // 检查目录
            const requiredDirs = ['content', 'static', 'themes'];
            for (const dir of requiredDirs) {
                try {
                    const dirPath = path.join(this.projectRoot, dir);
                    await fs.access(dirPath);
                    structure[`has${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = true;
                    structure.directories.push(dir);
                } catch {}
            }

            structure.isHugoProject = structure.hasConfig && structure.hasContent;
        } catch (error) {
            console.error('项目结构检测错误:', error);
        }

        return structure;
    }

    async createDirectory(dirPath) {
        const sanitizedPath = this.sanitizePath(dirPath);
        
        if (!this.isPathSafe(sanitizedPath)) {
            throw new Error('不安全的目录路径');
        }

        const fullPath = path.join(this.projectRoot, sanitizedPath);
        await fs.mkdir(fullPath, { recursive: true });

        return {
            success: true,
            path: fullPath,
            relativePath: sanitizedPath,
            message: '目录创建成功'
        };
    }

    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9\u4e00-\u9fff._-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    sanitizePath(filePath) {
        return path.normalize(filePath)
            .replace(/\.\./g, '')
            .replace(/^[/\\]+/, '');
    }

    isPathSafe(filePath) {
        const allowedPaths = [
            'content',
            'static/images',
            'hugo_editor/exports',
            'hugo_editor/temp'
        ];
        
        return allowedPaths.some(allowedPath => 
            filePath.startsWith(allowedPath) || filePath === allowedPath
        );
    }

    setupErrorHandling() {
        this.app.use((error, req, res, next) => {
            console.error('服务器错误:', error);
            
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        error: '文件大小超过限制'
                    });
                }
            }

            res.status(500).json({
                success: false,
                error: '服务器内部错误'
            });
        });
    }

    async start() {
        try {
            // 检查项目结构
            const structure = await this.detectProjectStructure();
            if (!structure.isHugoProject) {
                console.warn('警告: 未检测到有效的 Hugo 项目结构');
            }

            this.server = this.app.listen(this.port, '127.0.0.1', () => {
                console.log(`🚀 Hugo Editor 文件服务器已启动`);
                console.log(`📍 地址: http://127.0.0.1:${this.port}`);
                console.log(`📁 项目根目录: ${this.projectRoot}`);
                console.log(`✅ Hugo 项目: ${structure.isHugoProject ? '是' : '否'}`);
            });

            return this.server;
        } catch (error) {
            console.error('服务器启动失败:', error);
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
    const server = new HugoFileServer({
        port: process.env.PORT || 8081,
        projectRoot: path.resolve(__dirname, '..')
    });

    server.start().catch(console.error);

    // 优雅关闭
    process.on('SIGINT', async () => {
        console.log('\n正在关闭服务器...');
        await server.stop();
        process.exit(0);
    });
}

module.exports = HugoFileServer;
