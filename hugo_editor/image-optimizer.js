/**
 * Hugo Editor 高级图片优化处理器
 * 提供智能压缩、格式转换、质量优化等高级功能
 * @version 1.0.0
 * @author Hugo Editor Team
 */

class ImageOptimizer {
    constructor(options = {}) {
        this.options = {
            // 压缩设置
            defaultQuality: options.defaultQuality || 0.85,
            minQuality: options.minQuality || 0.6,
            maxQuality: options.maxQuality || 0.95,
            
            // 尺寸设置
            maxWidth: options.maxWidth || 1920,
            maxHeight: options.maxHeight || 1080,
            thumbnailSize: options.thumbnailSize || 300,
            
            // 格式设置
            preferredFormat: options.preferredFormat || 'webp',
            fallbackFormat: options.fallbackFormat || 'jpeg',
            supportedFormats: options.supportedFormats || ['webp', 'avif', 'jpeg', 'png'],
            
            // 优化设置
            enableProgressiveJPEG: options.enableProgressiveJPEG !== false,
            preserveExif: options.preserveExif || false,
            enableSmartCrop: options.enableSmartCrop || false,
            
            // 性能设置
            maxConcurrentProcessing: options.maxConcurrentProcessing || 3,
            chunkSize: options.chunkSize || 1024 * 1024, // 1MB chunks
            
            ...options
        };
        
        this.processingQueue = [];
        this.activeProcesses = 0;
        this.supportedFormats = this.detectFormatSupport();
        
        this.init();
    }
    
    /**
     * 初始化优化器
     */
    init() {
        this.setupWorkers();
        this.preloadOptimizationLibraries();
    }
    
    /**
     * 检测浏览器格式支持
     */
    detectFormatSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        
        const support = {
            webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
            avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
            jpeg: true,
            png: true
        };
        
        console.log('浏览器格式支持:', support);
        return support;
    }
    
    /**
     * 设置Web Workers（如果可用）
     */
    setupWorkers() {
        if (typeof Worker !== 'undefined') {
            try {
                // 创建图片处理Worker
                this.imageWorker = this.createImageWorker();
            } catch (error) {
                console.warn('无法创建Web Worker，将使用主线程处理:', error);
                this.imageWorker = null;
            }
        }
    }
    
    /**
     * 创建图片处理Worker
     */
    createImageWorker() {
        const workerCode = `
            self.onmessage = function(e) {
                const { imageData, options, taskId } = e.data;
                
                try {
                    // 在Worker中处理图片数据
                    const result = processImageInWorker(imageData, options);
                    self.postMessage({ taskId, result, success: true });
                } catch (error) {
                    self.postMessage({ taskId, error: error.message, success: false });
                }
            };
            
            function processImageInWorker(imageData, options) {
                // Worker中的图片处理逻辑
                // 这里可以实现更复杂的图片处理算法
                return imageData;
            }
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        return new Worker(URL.createObjectURL(blob));
    }
    
    /**
     * 预加载优化库
     */
    async preloadOptimizationLibraries() {
        // 这里可以预加载一些图片处理库
        // 例如：WASM版本的图片编码器
    }
    
    /**
     * 优化单个图片
     */
    async optimizeImage(file, customOptions = {}) {
        const options = { ...this.options, ...customOptions };
        
        try {
            // 分析图片
            const analysis = await this.analyzeImage(file);
            
            // 确定最佳优化策略
            const strategy = this.determineOptimizationStrategy(analysis, options);
            
            // 执行优化
            const result = await this.executeOptimization(file, strategy);
            
            return {
                success: true,
                original: {
                    size: file.size,
                    format: file.type,
                    ...analysis
                },
                optimized: result,
                compressionRatio: file.size / result.size,
                strategy: strategy
            };
            
        } catch (error) {
            console.error('图片优化失败:', error);
            return {
                success: false,
                error: error.message,
                original: { size: file.size, format: file.type }
            };
        }
    }
    
    /**
     * 分析图片特征
     */
    async analyzeImage(file) {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            img.onload = () => {
                try {
                    // 验证图片尺寸
                    if (!img.width || !img.height || img.width <= 0 || img.height <= 0) {
                        throw new Error('无效的图片尺寸');
                    }

                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    // 分析图片特征
                    const analysis = {
                        width: img.width,
                        height: img.height,
                        aspectRatio: img.width / img.height,
                        pixelCount: img.width * img.height,
                        complexity: this.calculateImageComplexity(ctx, img.width, img.height),
                        hasTransparency: this.detectTransparency(ctx, img.width, img.height),
                        dominantColors: this.extractDominantColors(ctx, img.width, img.height),
                        isPhoto: this.isPhotographicImage(ctx, img.width, img.height)
                    };

                    resolve(analysis);
                } catch (error) {
                    console.error('图片分析失败:', error);
                    resolve({
                        width: img.width || 0,
                        height: img.height || 0,
                        aspectRatio: 1,
                        pixelCount: 0,
                        complexity: 0.5,
                        hasTransparency: false,
                        dominantColors: [],
                        isPhoto: false,
                        error: error.message
                    });
                }
            };
            
            img.onerror = () => {
                resolve({
                    width: 0,
                    height: 0,
                    aspectRatio: 1,
                    pixelCount: 0,
                    complexity: 0.5,
                    hasTransparency: false,
                    dominantColors: [],
                    isPhoto: true
                });
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
    
    /**
     * 计算图片复杂度
     */
    calculateImageComplexity(ctx, width, height) {
        try {
            // 采样分析（避免处理过大图片）
            const sampleSize = Math.min(100, width, height);
            const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
            const data = imageData.data;
            
            let variance = 0;
            let mean = 0;
            
            // 计算亮度方差作为复杂度指标
            for (let i = 0; i < data.length; i += 4) {
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                mean += brightness;
            }
            mean /= (data.length / 4);
            
            for (let i = 0; i < data.length; i += 4) {
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                variance += Math.pow(brightness - mean, 2);
            }
            variance /= (data.length / 4);
            
            // 归一化到0-1范围
            return Math.min(variance / 10000, 1);
            
        } catch (error) {
            return 0.5; // 默认中等复杂度
        }
    }
    
    /**
     * 检测透明度
     */
    detectTransparency(ctx, width, height) {
        try {
            const sampleSize = Math.min(50, width, height);
            const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
            const data = imageData.data;
            
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] < 255) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 提取主要颜色
     */
    extractDominantColors(ctx, width, height) {
        try {
            const sampleSize = Math.min(50, width, height);
            const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
            const data = imageData.data;
            const colorMap = new Map();
            
            // 简化颜色并统计
            for (let i = 0; i < data.length; i += 16) { // 每4个像素采样一次
                const r = Math.floor(data[i] / 32) * 32;
                const g = Math.floor(data[i + 1] / 32) * 32;
                const b = Math.floor(data[i + 2] / 32) * 32;
                const color = `${r},${g},${b}`;
                
                colorMap.set(color, (colorMap.get(color) || 0) + 1);
            }
            
            // 返回前5个主要颜色
            return Array.from(colorMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([color, count]) => ({ color, count }));
                
        } catch (error) {
            return [];
        }
    }
    
    /**
     * 判断是否为摄影图片
     */
    isPhotographicImage(ctx, width, height) {
        try {
            const complexity = this.calculateImageComplexity(ctx, width, height);
            const dominantColors = this.extractDominantColors(ctx, width, height);
            
            // 基于复杂度和颜色多样性判断
            return complexity > 0.3 && dominantColors.length > 3;
        } catch (error) {
            return true;
        }
    }
    
    /**
     * 确定优化策略
     */
    determineOptimizationStrategy(analysis, options) {
        const strategy = {
            targetFormat: this.selectOptimalFormat(analysis, options),
            quality: this.calculateOptimalQuality(analysis, options),
            resize: this.calculateOptimalSize(analysis, options),
            progressive: options.enableProgressiveJPEG && analysis.isPhoto,
            preserveExif: options.preserveExif,
            smartCrop: options.enableSmartCrop && this.shouldSmartCrop(analysis)
        };
        
        return strategy;
    }
    
    /**
     * 选择最佳格式
     */
    selectOptimalFormat(analysis, options) {
        // 如果有透明度，优先PNG或WebP
        if (analysis.hasTransparency) {
            if (this.supportedFormats.webp) return 'webp';
            return 'png';
        }
        
        // 对于照片类图片
        if (analysis.isPhoto) {
            if (this.supportedFormats.avif) return 'avif';
            if (this.supportedFormats.webp) return 'webp';
            return 'jpeg';
        }
        
        // 对于简单图形
        if (analysis.complexity < 0.3) {
            if (this.supportedFormats.webp) return 'webp';
            return 'png';
        }
        
        // 默认策略
        return options.preferredFormat;
    }
    
    /**
     * 计算最佳质量
     */
    calculateOptimalQuality(analysis, options) {
        let quality = options.defaultQuality;
        
        // 根据复杂度调整质量
        if (analysis.complexity > 0.7) {
            quality = Math.min(quality + 0.1, options.maxQuality);
        } else if (analysis.complexity < 0.3) {
            quality = Math.max(quality - 0.1, options.minQuality);
        }
        
        // 根据图片大小调整
        if (analysis.pixelCount > 2000000) { // 大于2MP
            quality = Math.max(quality - 0.05, options.minQuality);
        }
        
        return quality;
    }
    
    /**
     * 计算最佳尺寸
     */
    calculateOptimalSize(analysis, options) {
        const { width, height } = analysis;
        const { maxWidth, maxHeight } = options;
        
        if (width <= maxWidth && height <= maxHeight) {
            return { width, height, needsResize: false };
        }
        
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio);
        
        return {
            width: Math.round(width * ratio),
            height: Math.round(height * ratio),
            needsResize: true,
            ratio: ratio
        };
    }
    
    /**
     * 判断是否需要智能裁剪
     */
    shouldSmartCrop(analysis) {
        // 对于极端宽高比的图片建议智能裁剪
        return analysis.aspectRatio > 3 || analysis.aspectRatio < 0.33;
    }
    
    /**
     * 执行优化
     */
    async executeOptimization(file, strategy) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                try {
                    // 设置画布尺寸
                    canvas.width = strategy.resize.width;
                    canvas.height = strategy.resize.height;
                    
                    // 高质量缩放设置
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // 绘制图片
                    if (strategy.smartCrop) {
                        this.drawWithSmartCrop(ctx, img, strategy.resize);
                    } else {
                        ctx.drawImage(img, 0, 0, strategy.resize.width, strategy.resize.height);
                    }
                    
                    // 转换格式
                    const mimeType = `image/${strategy.targetFormat}`;
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                resolve({
                                    dataUrl: event.target.result,
                                    blob: blob,
                                    size: blob.size,
                                    format: strategy.targetFormat,
                                    width: strategy.resize.width,
                                    height: strategy.resize.height,
                                    quality: strategy.quality
                                });
                            };
                            reader.readAsDataURL(blob);
                        } else {
                            reject(new Error('图片转换失败'));
                        }
                    }, mimeType, strategy.quality);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
    
    /**
     * 智能裁剪绘制
     */
    drawWithSmartCrop(ctx, img, targetSize) {
        const sourceRatio = img.width / img.height;
        const targetRatio = targetSize.width / targetSize.height;
        
        let sx, sy, sWidth, sHeight;
        
        if (sourceRatio > targetRatio) {
            // 源图更宽，裁剪左右
            sHeight = img.height;
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
            sy = 0;
        } else {
            // 源图更高，裁剪上下
            sWidth = img.width;
            sHeight = img.width / targetRatio;
            sx = 0;
            sy = (img.height - sHeight) / 2;
        }
        
        ctx.drawImage(
            img,
            sx, sy, sWidth, sHeight,
            0, 0, targetSize.width, targetSize.height
        );
    }
    
    /**
     * 批量优化图片
     */
    async optimizeBatch(files, options = {}) {
        const results = [];
        const batchOptions = { ...this.options, ...options };
        
        // 限制并发处理数量
        const chunks = this.chunkArray(files, this.options.maxConcurrentProcessing);
        
        for (const chunk of chunks) {
            const chunkPromises = chunk.map(file => this.optimizeImage(file, batchOptions));
            const chunkResults = await Promise.allSettled(chunkPromises);
            
            results.push(...chunkResults.map((result, index) => ({
                file: chunk[index],
                result: result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
            })));
        }
        
        return {
            total: files.length,
            successful: results.filter(r => r.result.success).length,
            failed: results.filter(r => !r.result.success).length,
            results: results,
            totalOriginalSize: results.reduce((sum, r) => sum + r.file.size, 0),
            totalOptimizedSize: results.reduce((sum, r) => 
                sum + (r.result.success ? r.result.optimized.size : r.file.size), 0)
        };
    }
    
    /**
     * 创建缩略图
     */
    async createThumbnail(file, size = this.options.thumbnailSize) {
        const thumbnailOptions = {
            maxWidth: size,
            maxHeight: size,
            defaultQuality: 0.8,
            preferredFormat: 'webp'
        };
        
        return this.optimizeImage(file, thumbnailOptions);
    }
    
    /**
     * 渐进式JPEG处理
     */
    async createProgressiveJPEG(file, quality = 0.85) {
        // 注意：浏览器的Canvas API不直接支持渐进式JPEG
        // 这里提供基础实现，实际应用中可能需要服务端处理
        const options = {
            targetFormat: 'jpeg',
            quality: quality,
            progressive: true
        };
        
        return this.optimizeImage(file, options);
    }
    
    /**
     * 格式转换
     */
    async convertFormat(file, targetFormat, quality = 0.85) {
        if (!this.supportedFormats[targetFormat]) {
            throw new Error(`不支持的格式: ${targetFormat}`);
        }
        
        const options = {
            targetFormat: targetFormat,
            quality: quality,
            maxWidth: 9999, // 不限制尺寸
            maxHeight: 9999
        };
        
        return this.optimizeImage(file, options);
    }
    
    /**
     * 获取优化建议
     */
    async getOptimizationSuggestions(file) {
        const analysis = await this.analyzeImage(file);
        const suggestions = [];
        
        // 尺寸建议
        if (analysis.width > 1920 || analysis.height > 1080) {
            suggestions.push({
                type: 'resize',
                message: '建议缩小图片尺寸以减少文件大小',
                impact: 'high'
            });
        }
        
        // 格式建议
        if (file.type === 'image/png' && !analysis.hasTransparency) {
            suggestions.push({
                type: 'format',
                message: '建议转换为JPEG或WebP格式',
                impact: 'medium'
            });
        }
        
        // 质量建议
        if (analysis.complexity < 0.3) {
            suggestions.push({
                type: 'quality',
                message: '可以降低质量设置而不明显影响视觉效果',
                impact: 'low'
            });
        }
        
        return {
            analysis,
            suggestions,
            estimatedSavings: this.estimateSavings(analysis, file.size)
        };
    }
    
    /**
     * 估算节省空间
     */
    estimateSavings(analysis, originalSize) {
        let estimatedRatio = 0.7; // 默认70%压缩率
        
        if (analysis.isPhoto) {
            estimatedRatio = 0.6; // 照片通常可以压缩更多
        }
        
        if (analysis.complexity < 0.3) {
            estimatedRatio = 0.8; // 简单图形压缩率较低
        }
        
        const estimatedSize = originalSize * estimatedRatio;
        const savings = originalSize - estimatedSize;
        
        return {
            estimatedSize,
            savings,
            savingsPercentage: (savings / originalSize) * 100
        };
    }
    
    /**
     * 工具方法：数组分块
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        if (this.imageWorker) {
            this.imageWorker.terminate();
            this.imageWorker = null;
        }
    }
}

// 导出图片优化器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageOptimizer;
}

// 全局实例（如果在浏览器环境中）
if (typeof window !== 'undefined') {
    window.ImageOptimizer = ImageOptimizer;
    
    // 自动初始化（可选）
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.imageOptimizer) {
            window.imageOptimizer = new ImageOptimizer();
        }
    });
}