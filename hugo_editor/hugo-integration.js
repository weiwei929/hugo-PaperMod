/**
 * Hugo Editor 集成模块
 * 负责Hugo项目结构检测、路径管理和文件操作
 * @version 1.0.0
 * @author Hugo Editor 优化项目组
 */

class HugoIntegration {
    constructor() {
        this.projectRoot = this.detectProjectRoot();
        this.config = {
            contentDir: 'content',
            staticDir: 'static',
            imagesDir: 'static/images',
            allowedDirs: ['content', 'static/images'],
            allowedExtensions: ['.md', '.jpg', '.jpeg', '.png', '.gif', '.webp']
        };
    }

    /**
     * 检测Hugo项目根目录
     * @returns {string} 项目根目录路径
     */
    detectProjectRoot() {
        // 从当前编辑器位置向上查找Hugo项目根目录
        let currentPath = window.location.pathname;
        if (currentPath.includes('hugo_editor')) {
            // 假设编辑器在hugo_editor目录下，项目根目录在上一级
            return currentPath.replace(/\/hugo_editor.*$/, '') || '.';
        }
        return '.';
    }

    /**
     * 检测Hugo项目结构
     * @returns {Promise<Object>} 项目结构信息
     */
    async detectProjectStructure() {
        try {
            const structure = {
                isHugoProject: false,
                hasConfig: false,
                hasContent: false,
                hasStatic: false,
                hasThemes: false,
                contentDir: this.config.contentDir,
                staticDir: this.config.staticDir,
                detectedAt: new Date().toISOString()
            };

            // 检查配置文件
            const configFiles = ['config.yml', 'config.yaml', 'config.toml', 'hugo.yml'];
            for (const configFile of configFiles) {
                if (await this.fileExists(configFile)) {
                    structure.hasConfig = true;
                    structure.configFile = configFile;
                    break;
                }
            }

            // 检查关键目录
            structure.hasContent = await this.directoryExists(this.config.contentDir);
            structure.hasStatic = await this.directoryExists(this.config.staticDir);
            structure.hasThemes = await this.directoryExists('themes');

            // 判断是否为Hugo项目
            structure.isHugoProject = structure.hasConfig && structure.hasContent;

            return structure;
        } catch (error) {
            console.error('检测项目结构时出错:', error);
            return {
                isHugoProject: false,
                error: error.message
            };
        }
    }

    /**
     * 验证文件路径安全性
     * @param {string} filePath 要验证的文件路径
     * @returns {boolean} 路径是否安全
     */
    validatePath(filePath) {
        try {
            // 规范化路径
            const normalizedPath = this.normalizePath(filePath);
            
            // 防止路径遍历攻击
            if (normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.includes('\\..')) {
                throw new Error('检测到不安全的路径遍历');
            }

            // 检查是否在允许的目录内
            const isAllowedDir = this.config.allowedDirs.some(dir => 
                normalizedPath.startsWith(dir + '/') || normalizedPath === dir
            );

            if (!isAllowedDir) {
                throw new Error(`路径不在允许的目录内: ${this.config.allowedDirs.join(', ')}`);
            }

            return true;
        } catch (error) {
            console.error('路径验证失败:', error.message);
            return false;
        }
    }

    /**
     * 验证文件类型
     * @param {string} fileName 文件名
     * @returns {boolean} 文件类型是否允许
     */
    validateFileType(fileName) {
        const ext = this.getFileExtension(fileName).toLowerCase();
        return this.config.allowedExtensions.includes(ext);
    }

    /**
     * 验证文件大小
     * @param {number} fileSize 文件大小（字节）
     * @param {number} maxSize 最大允许大小（字节，默认5MB）
     * @returns {boolean} 文件大小是否符合要求
     */
    validateFileSize(fileSize, maxSize = 5 * 1024 * 1024) {
        return fileSize <= maxSize;
    }

    /**
     * 生成智能文件路径
     * @param {string} fileName 文件名
     * @param {string} category 文件类别 (posts, diary, novel, etc.)
     * @param {string} type 文件类型 (markdown, image)
     * @returns {string} 生成的文件路径
     */
    generateSmartPath(fileName, category = 'posts', type = 'markdown') {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // 清理文件名
        const cleanFileName = this.sanitizeFileName(fileName);
        
        if (type === 'markdown') {
            // Markdown文件路径
            const basePath = `${this.config.contentDir}/${category}`;
            return `${basePath}/${cleanFileName}`;
        } else if (type === 'image') {
            // 图片文件路径
            const basePath = `${this.config.imagesDir}/${category}`;
            return `${basePath}/${year}/${month}/${cleanFileName}`;
        }
        
        return `${this.config.contentDir}/${category}/${cleanFileName}`;
    }

    /**
     * 创建目录（模拟）
     * @param {string} dirPath 目录路径
     * @returns {Promise<Object>} 操作结果
     */
    async createDirectory(dirPath) {
        try {
            if (!this.validatePath(dirPath)) {
                throw new Error('目录路径验证失败');
            }

            // 在实际实现中，这里会调用文件系统API或发送请求到本地服务
            // 目前返回模拟结果
            console.log(`创建目录: ${dirPath}`);
            
            return {
                success: true,
                path: dirPath,
                message: '目录创建成功',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                path: dirPath
            };
        }
    }

    /**
     * 写入文件（模拟）
     * @param {string} content 文件内容
     * @param {string} relativePath 相对路径
     * @returns {Promise<Object>} 操作结果
     */
    async writeFile(content, relativePath) {
        try {
            // 验证路径和文件类型
            if (!this.validatePath(relativePath)) {
                throw new Error('文件路径验证失败');
            }

            const fileName = this.getFileName(relativePath);
            if (!this.validateFileType(fileName)) {
                throw new Error('不支持的文件类型');
            }

            // 验证内容大小
            const contentSize = new Blob([content]).size;
            if (!this.validateFileSize(contentSize)) {
                throw new Error('文件内容过大');
            }

            // 确保目录存在
            const dirPath = this.getDirectoryPath(relativePath);
            await this.createDirectory(dirPath);

            // 在实际实现中，这里会调用文件系统API或发送请求到本地服务
            console.log(`写入文件: ${relativePath}`);
            console.log(`内容大小: ${contentSize} 字节`);
            
            return {
                success: true,
                path: relativePath,
                size: contentSize,
                message: '文件写入成功',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                path: relativePath
            };
        }
    }

    /**
     * 检查文件是否存在（模拟）
     * @param {string} filePath 文件路径
     * @returns {Promise<boolean>} 文件是否存在
     */
    async fileExists(filePath) {
        // 在实际实现中，这里会检查文件系统
        // 目前返回基于常见文件的模拟结果
        const commonFiles = ['config.yml', 'config.yaml', 'config.toml', 'hugo.yml'];
        return commonFiles.includes(filePath);
    }

    /**
     * 检查目录是否存在（模拟）
     * @param {string} dirPath 目录路径
     * @returns {Promise<boolean>} 目录是否存在
     */
    async directoryExists(dirPath) {
        // 在实际实现中，这里会检查文件系统
        // 目前返回基于项目结构的模拟结果
        const commonDirs = ['content', 'static', 'themes', 'layouts'];
        return commonDirs.includes(dirPath);
    }

    // 工具方法
    normalizePath(path) {
        return path.replace(/\\/g, '/').replace(/\/+/g, '/');
    }

    getFileExtension(fileName) {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot) : '';
    }

    getFileName(filePath) {
        return filePath.split('/').pop() || filePath;
    }

    getDirectoryPath(filePath) {
        const parts = filePath.split('/');
        parts.pop(); // 移除文件名
        return parts.join('/');
    }

    sanitizeFileName(fileName) {
        // 清理文件名，移除不安全字符
        return fileName
            .replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * 获取错误处理建议
     * @param {Error} error 错误对象
     * @returns {Object} 错误处理建议
     */
    getErrorSuggestion(error) {
        const suggestions = {
            'ENOENT': {
                message: '文件或目录不存在',
                suggestion: '请检查路径是否正确，或创建必要的目录'
            },
            'EACCES': {
                message: '权限不足',
                suggestion: '请检查文件权限，或尝试以管理员身份运行'
            },
            'ENOSPC': {
                message: '磁盘空间不足',
                suggestion: '请清理磁盘空间后重试'
            },
            'EMFILE': {
                message: '打开文件过多',
                suggestion: '请关闭一些文件后重试'
            }
        };

        const errorCode = error.code || 'UNKNOWN';
        return suggestions[errorCode] || {
            message: '未知错误',
            suggestion: '请检查控制台日志获取更多信息'
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HugoIntegration;
} else {
    window.HugoIntegration = HugoIntegration;
}