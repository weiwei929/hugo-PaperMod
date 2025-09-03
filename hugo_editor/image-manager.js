/**
 * Hugo Editor 图片管理模块
 * 提供图片上传、压缩、格式转换、路径管理等功能
 * @version 1.0.0
 * @author Hugo Editor Team
 */

class ImageManager {
    constructor(options = {}) {
        this.options = {
            maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
            maxWidth: options.maxWidth || 1920,
            maxHeight: options.maxHeight || 1080,
            quality: options.quality || 0.85,
            allowedFormats: options.allowedFormats || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            outputFormat: options.outputFormat || 'webp', // 默认输出WebP格式
            compressionEnabled: options.compressionEnabled !== false,
            autoOptimize: options.autoOptimize !== false,
            enableGallery: options.enableGallery !== false, // 启用图片库功能
            ...options
        };
        
        this.uploadedImages = new Map(); // 存储已上传的图片信息
        this.processingQueue = []; // 处理队列
        this.isProcessing = false;
        
        // 初始化高级图片优化器
        this.imageOptimizer = new ImageOptimizer({
            defaultQuality: this.options.quality,
            maxWidth: this.options.maxWidth,
            maxHeight: this.options.maxHeight,
            preferredFormat: this.options.outputFormat,
            enableProgressiveJPEG: true,
            preserveExif: false
        });
        
        // 初始化图片使用场景管理器
        if (typeof ImageUsageManager !== 'undefined') {
            this.usageManager = new ImageUsageManager({
                enableInlineImages: true,
                enableCoverImages: true,
                enableGalleryImages: true
            });
        }

        // 初始化图片库
        if (this.options.enableGallery && typeof ImageGallery !== 'undefined') {
            this.imageGallery = new ImageGallery({
                onImageSelect: (imageInfo) => this.handleGalleryImageSelect(imageInfo),
                onImageDelete: (imageId) => this.handleGalleryImageDelete(imageId),
                onImageInsert: (imageInfo) => this.insertImageFromGallery(imageInfo)
            });
        }
        
        this.init();
    }
    
    /**
     * 初始化图片管理器
     */
    init() {
        this.setupEventListeners();
        this.createImagePreviewContainer();
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 拖拽上传
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        
        // 粘贴上传
        document.addEventListener('paste', this.handlePaste.bind(this));
        
        // 文件选择上传
        const fileInput = document.getElementById('imageFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
    }
    
    /**
     * 创建图片预览容器
     */
    createImagePreviewContainer() {
        if (document.getElementById('imagePreviewContainer')) {
            return;
        }

        const container = document.createElement('div');
        container.id = 'imagePreviewContainer';
        container.className = 'image-preview-container';
        container.innerHTML = `
            <div class="image-preview-header">
                <h3>图片管理</h3>
                <div class="image-preview-controls">
                    <button id="selectImageBtn" class="btn btn-primary">
                        <span class="icon">📁</span> 选择图片
                    </button>
                    <button id="optimizeAllBtn" class="btn btn-secondary">
                        <span class="icon">⚡</span> 批量优化
                    </button>
                    <button id="showStatsBtn" class="btn btn-info">
                        <span class="icon">📊</span> 优化统计
                    </button>
                    ${this.options.enableGallery ? `
                    <button id="showGalleryBtn" class="btn btn-success">
                        <span class="icon">🖼️</span> 图片库
                    </button>
                    ` : ''}
                    <button id="clearAllBtn" class="btn btn-danger">
                        <span class="icon">🗑️</span> 清空所有
                    </button>
                </div>
            </div>
            <div class="image-upload-area" id="imageUploadArea">
                <div class="upload-placeholder">
                    <div class="upload-icon">📷</div>
                    <p>拖拽图片到此处，或点击选择图片</p>
                    <p class="upload-hint">支持 JPG、PNG、GIF、WebP 格式，最大 10MB</p>
                </div>
            </div>
            <div class="image-preview-list" id="imagePreviewList"></div>
            <input type="file" id="imageFileInput" multiple accept="image/*" style="display: none;">
        `;

        // 插入到编辑器容器中
        const editorContainer = document.querySelector('.editor-container') || document.body;
        editorContainer.appendChild(container);

        this.bindContainerEvents();
    }
    
    /**
     * 绑定容器内的事件
     */
    bindContainerEvents() {
        const selectBtn = document.getElementById('selectImageBtn');
        const optimizeBtn = document.getElementById('optimizeAllBtn');
        const statsBtn = document.getElementById('showStatsBtn');
        const clearBtn = document.getElementById('clearAllBtn');
        const galleryBtn = document.getElementById('showGalleryBtn');
        const uploadArea = document.getElementById('imageUploadArea');
        const fileInput = document.getElementById('imageFileInput');

        if (selectBtn) {
            selectBtn.addEventListener('click', () => fileInput.click());
        }
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => this.optimizeAllImages());
        }
        if (statsBtn) {
            statsBtn.addEventListener('click', () => this.showOptimizationStats());
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllImages());
        }
        if (galleryBtn && this.imageGallery) {
            galleryBtn.addEventListener('click', () => this.showImageGallery());
        }
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
            uploadArea.addEventListener('click', () => fileInput.click());
        }
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
    }
    
    /**
     * 处理拖拽悬停
     */
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const uploadArea = document.getElementById('imageUploadArea');
        if (uploadArea) {
            uploadArea.classList.add('drag-over');
        }
    }
    
    /**
     * 处理文件拖拽放置
     */
    async handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const uploadArea = document.getElementById('imageUploadArea');
        if (uploadArea) {
            uploadArea.classList.remove('drag-over');
        }
        
        const files = Array.from(event.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
            await this.processFiles(files);
        }
    }
    
    /**
     * 处理粘贴事件
     */
    async handlePaste(event) {
        const items = Array.from(event.clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        
        if (imageItems.length > 0) {
            event.preventDefault();
            
            const files = await Promise.all(
                imageItems.map(item => {
                    const file = item.getAsFile();
                    if (file) {
                        // 为粘贴的图片生成文件名
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        const extension = file.type.split('/')[1] || 'png';
                        return new File([file], `pasted-image-${timestamp}.${extension}`, {
                            type: file.type
                        });
                    }
                    return null;
                })
            );
            
            const validFiles = files.filter(file => file !== null);
            if (validFiles.length > 0) {
                await this.processFiles(validFiles);
            }
        }
    }
    
    /**
     * 处理文件选择
     */
    async handleFileSelect(event) {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            await this.processFiles(files);
        }
        
        // 清空文件输入，允许重复选择同一文件
        event.target.value = '';
    }
    
    /**
     * 处理文件列表
     */
    async processFiles(files) {
        const validFiles = files.filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            this.showToast('没有有效的图片文件', 'warning');
            return;
        }
        
        // 添加到处理队列
        this.processingQueue.push(...validFiles);
        
        // 开始处理
        if (!this.isProcessing) {
            await this.processQueue();
        }
    }
    
    /**
     * 验证文件
     */
    validateFile(file) {
        // 检查文件类型
        if (!this.options.allowedFormats.includes(file.type)) {
            this.showToast(`不支持的文件格式: ${file.type}`, 'error');
            return false;
        }
        
        // 检查文件大小
        if (file.size > this.options.maxFileSize) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            const maxSizeMB = (this.options.maxFileSize / (1024 * 1024)).toFixed(2);
            this.showToast(`文件过大: ${sizeMB}MB，最大允许: ${maxSizeMB}MB`, 'error');
            return false;
        }
        
        return true;
    }
    
    /**
     * 处理队列
     */
    async processQueue() {
        if (this.isProcessing || this.processingQueue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        
        try {
            while (this.processingQueue.length > 0) {
                const file = this.processingQueue.shift();
                await this.processImage(file);
            }
        } catch (error) {
            console.error('处理图片队列时出错:', error);
            this.showToast('处理图片时出错', 'error');
        } finally {
            this.isProcessing = false;
        }
    }
    
    /**
     * 处理单个图片
     */
    async processImage(file) {
        const imageId = this.generateImageId();
        
        try {
            this.showProcessingIndicator(imageId, file.name);
            
            // 读取图片文件
            const imageData = await this.readImageFile(file);
            
            // 优化图片
            const optimizedData = await this.optimizeImage(imageData, file);
            
            // 生成图片路径
            const imagePath = this.generateImagePath(file);
            
            // 创建图片信息对象
            const imageInfo = {
                id: imageId,
                fileName: file.name,
                originalSize: file.size,
                size: optimizedData.size, // 添加 size 属性
                fileSize: optimizedData.size,
                compressionRatio: ((file.size - optimizedData.size) / file.size * 100).toFixed(1),
                format: optimizedData.format,
                dataUrl: optimizedData.dataUrl,
                optimizedData: optimizedData, // 添加优化后的数据
                originalFile: file, // 添加原始文件引用
                path: imagePath,
                dimensions: optimizedData.dimensions,
                uploadTime: new Date().toISOString()
            };
            
            // 存储图片信息
            this.uploadedImages.set(imageId, imageInfo);

            // 尝试上传到服务器
            try {
                await this.uploadImageToServer(imageInfo);
            } catch (serverError) {
                console.warn('服务器上传失败，使用本地模式:', serverError);
                // 继续使用本地模式
            }

            // 隐藏处理指示器
            this.hideProcessingIndicator(imageId);

            // 更新预览
            this.updateImagePreview(imageInfo);

            // 添加到图片库
            this.addToGallery(imageInfo);

            // 触发图片处理完成事件，供使用场景管理器处理
            this.dispatchImageProcessedEvent(imageInfo);

            this.showToast(`图片 "${file.name}" 处理完成`, 'success');
            
        } catch (error) {
            console.error('图片处理失败:', error);
            this.hideProcessingIndicator(imageId);
            this.showToast(`图片 "${file.name}" 处理失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 读取图片文件
     */
    readImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve({
                    dataUrl: event.target.result,
                    arrayBuffer: null // 如果需要可以添加
                });
            };
            
            reader.onerror = () => {
                reject(new Error('读取文件失败'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * 优化图片 - 使用高级优化器
     */
    async optimizeImage(imageData, originalFile) {
        try {
            // 使用高级优化器处理图片
            const optimizationResult = await this.imageOptimizer.optimizeImage(originalFile);
            
            if (optimizationResult.success) {
                return {
                    dataUrl: optimizationResult.optimized.dataUrl,
                    blob: optimizationResult.optimized.blob,
                    size: optimizationResult.optimized.size,
                    format: `image/${optimizationResult.optimized.format}`,
                    width: optimizationResult.optimized.width,
                    height: optimizationResult.optimized.height,
                    compressionRatio: optimizationResult.compressionRatio,
                    strategy: optimizationResult.strategy
                };
            } else {
                // 如果高级优化失败，回退到基础优化
                console.warn('高级优化失败，使用基础优化:', optimizationResult.error);
                return this.basicOptimizeImage(imageData, originalFile);
            }
        } catch (error) {
            console.warn('高级优化出错，使用基础优化:', error);
            return this.basicOptimizeImage(imageData, originalFile);
        }
    }
    
    /**
     * 基础图片优化（备用方案）
     */
    async basicOptimizeImage(imageData, originalFile) {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 计算新尺寸
                const { width, height } = this.calculateOptimalSize(
                    img.width, 
                    img.height, 
                    this.options.maxWidth, 
                    this.options.maxHeight
                );
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制图片
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换格式和压缩
                const outputFormat = this.getOutputFormat(originalFile.type);
                const quality = this.options.quality;
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            resolve({
                                dataUrl: event.target.result,
                                blob: blob,
                                size: blob.size,
                                format: outputFormat,
                                width: width,
                                height: height
                            });
                        };
                        reader.readAsDataURL(blob);
                    } else {
                        // 如果压缩失败，返回原始数据
                        resolve(imageData);
                    }
                }, outputFormat, quality);
            };
            
            img.onerror = () => {
                // 如果加载失败，返回原始数据
                resolve(imageData);
            };
            
            img.src = imageData.dataUrl;
        });
    }
    
    /**
     * 计算最优尺寸
     */
    calculateOptimalSize(originalWidth, originalHeight, maxWidth, maxHeight) {
        let { width, height } = { width: originalWidth, height: originalHeight };
        
        // 如果图片尺寸超过限制，按比例缩放
        if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const ratio = Math.min(widthRatio, heightRatio);
            
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        return { width, height };
    }
    
    /**
     * 获取输出格式
     */
    getOutputFormat(originalFormat) {
        // 如果原格式是GIF，保持GIF格式（保留动画）
        if (originalFormat === 'image/gif') {
            return 'image/gif';
        }
        
        // 否则使用配置的输出格式
        return `image/${this.options.outputFormat}`;
    }
    
    /**
     * 获取图片尺寸
     */
    getImageDimensions(dataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };
            img.onerror = () => {
                resolve({ width: 0, height: 0 });
            };
            img.src = dataUrl;
        });
    }
    
    /**
     * 生成图片路径
     */
    generateImagePath(file) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // 清理文件名
        const cleanFileName = this.sanitizeFileName(file.name);
        
        // 生成路径：/images/uploads/filename（与服务器存储路径一致）
        return `/images/uploads/${cleanFileName}`;
    }
    
    /**
     * 清理文件名
     */
    sanitizeFileName(fileName) {
        // 移除或替换特殊字符
        return fileName
            .replace(/[^a-zA-Z0-9\u4e00-\u9fa5.-]/g, '-') // 保留中文、英文、数字、点和横线
            .replace(/-+/g, '-') // 合并多个横线
            .replace(/^-|-$/g, ''); // 移除开头和结尾的横线
    }
    
    /**
     * 生成图片ID
     */
    generateImageId() {
        return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 显示处理指示器
     */
    showProcessingIndicator(imageId, fileName) {
        const list = document.getElementById('imagePreviewList');
        if (!list) return;
        
        const indicator = document.createElement('div');
        indicator.id = `processing_${imageId}`;
        indicator.className = 'image-processing-indicator';
        indicator.innerHTML = `
            <div class="processing-content">
                <div class="spinner"></div>
                <p>正在处理: ${fileName}</p>
            </div>
        `;
        
        list.appendChild(indicator);
    }
    
    /**
     * 隐藏处理指示器
     */
    hideProcessingIndicator(imageId) {
        const indicator = document.getElementById(`processing_${imageId}`);
        if (indicator) {
            indicator.remove();
        }
    }
    
    /**
     * 更新图片预览
     */
    updateImagePreview(imageInfo) {
        const list = document.getElementById('imagePreviewList');
        if (!list) return;

        // 确保必要的属性存在
        if (!imageInfo || !imageInfo.id) {
            console.error('图片信息不完整:', imageInfo);
            return;
        }

        // 移除旧的预览项（如果存在）
        const existingItem = document.getElementById(`preview_${imageInfo.id}`);
        if (existingItem) {
            existingItem.remove();
        }

        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        previewItem.id = `preview_${imageInfo.id}`;

        // 安全地获取文件大小信息
        const currentSize = imageInfo.size || imageInfo.fileSize || 0;
        const originalSize = imageInfo.originalSize || (imageInfo.originalFile && imageInfo.originalFile.size) || currentSize;

        const sizeText = this.formatFileSize(currentSize);
        const originalSizeText = this.formatFileSize(originalSize);
        const dimensionsText = imageInfo.dimensions ?
            `${imageInfo.dimensions.width} × ${imageInfo.dimensions.height}` : '未知尺寸';

        // 计算压缩率
        const compressionRatio = originalSize > 0 ?
            (1 - currentSize / originalSize) * 100 : 0;
        const compressionText = compressionRatio > 0 ?
            `压缩 ${compressionRatio.toFixed(1)}%` : '未压缩';
        
        // 安全地获取图片数据和文件名
        const imageUrl = (imageInfo.optimizedData && imageInfo.optimizedData.dataUrl) ||
                        imageInfo.dataUrl ||
                        '';
        const fileName = imageInfo.fileName || '未知文件';

        previewItem.innerHTML = `
            <div class="image-preview-wrapper">
                <img src="${imageUrl}"
                     alt="${fileName}"
                     class="preview-image">
                <div class="image-overlay">
                    <div class="image-actions">
                        <button class="btn btn-sm btn-primary" onclick="imageManager.insertImage('${imageInfo.id}')" title="插入到编辑器">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="imageManager.editImage('${imageInfo.id}')" title="编辑图片信息">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="imageManager.showImageDetails('${imageInfo.id}')" title="查看详情">
                            <i class="fas fa-info"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="imageManager.showFormatOptions('${imageInfo.id}')" title="格式转换">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="imageManager.removeImage('${imageInfo.id}')" title="删除图片">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="image-info">
                <div class="image-name" title="${fileName}">
                    ${fileName}
                </div>
                <div class="image-details">
                    <span class="image-size">${sizeText}</span>
                    <span class="image-dimensions">${dimensionsText}</span>
                </div>
                <div class="image-compression">
                    <span class="compression-info">${compressionText}</span>
                    <span class="original-size">原始: ${originalSizeText}</span>
                </div>
                <div class="image-path" title="${imageInfo.path}">
                    ${imageInfo.path}
                </div>
            </div>
        `;
        
        list.appendChild(previewItem);
    }
    
    /**
     * 插入图片到编辑器
     */
    insertImage(imageId) {
        const imageInfo = this.uploadedImages.get(imageId);
        if (!imageInfo) {
            console.error('图片信息未找到:', imageId);
            return;
        }

        // 尝试多个可能的编辑器ID
        const editor = document.getElementById('markdownEditor') ||
                      document.getElementById('content') ||
                      document.querySelector('textarea');
        if (!editor) {
            console.error('编辑器元素未找到');
            this.showToast('编辑器未找到', 'error');
            return;
        }

        // 安全地获取文件名
        const fileName = imageInfo.fileName || '图片';
        const altText = fileName.replace(/\.[^/.]+$/, ''); // 移除扩展名
        const imagePath = imageInfo.path || `/images/${fileName}`;
        const markdownImage = `![${altText}](${imagePath})`;

        // 插入到编辑器当前光标位置
        const cursorPos = editor.selectionStart || 0;
        const textBefore = editor.value.substring(0, cursorPos);
        const textAfter = editor.value.substring(cursorPos);
        
        editor.value = textBefore + markdownImage + textAfter;
        
        // 更新光标位置
        const newCursorPos = cursorPos + markdownImage.length;
        editor.setSelectionRange(newCursorPos, newCursorPos);
        editor.focus();
        
        // 触发内容更新事件
        if (typeof updatePreview === 'function') {
            updatePreview();
        }
        
        this.showToast('图片已插入到编辑器', 'success');
    }
    
    /**
     * 编辑图片
     */
    editImage(imageId) {
        const imageInfo = this.uploadedImages.get(imageId);
        if (!imageInfo) return;
        
        // 这里可以实现图片编辑功能
        // 暂时显示图片信息
        this.showImageEditModal(imageInfo);
    }
    
    /**
     * 显示图片详情
     */
    async showImageDetails(imageId) {
        const imageInfo = this.uploadedImages.get(imageId);
        if (!imageInfo) return;
        
        // 获取优化建议
        const suggestions = await this.getOptimizationSuggestions(imageId);
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">图片详情</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <img src="${imageInfo.optimizedData.dataUrl}" class="img-fluid" alt="预览图">
                            </div>
                            <div class="col-md-6">
                                <h6>基本信息</h6>
                                <table class="table table-sm">
                                    <tr><td>文件名</td><td>${imageInfo.originalFile.name}</td></tr>
                                    <tr><td>尺寸</td><td>${imageInfo.dimensions.width} × ${imageInfo.dimensions.height}</td></tr>
                                    <tr><td>格式</td><td>${imageInfo.format}</td></tr>
                                    <tr><td>大小</td><td>${this.formatFileSize(imageInfo.size)}</td></tr>
                                    <tr><td>原始大小</td><td>${this.formatFileSize(imageInfo.originalFile.size)}</td></tr>
                                    <tr><td>路径</td><td>${imageInfo.path}</td></tr>
                                </table>
                                
                                ${suggestions ? `
                                <h6>优化建议</h6>
                                <div class="optimization-suggestions">
                                    ${suggestions.suggestions.map(s => `
                                        <div class="alert alert-${s.impact === 'high' ? 'warning' : s.impact === 'medium' ? 'info' : 'light'} py-2">
                                            <small><strong>${s.type.toUpperCase()}:</strong> ${s.message}</small>
                                        </div>
                                    `).join('')}
                                    <p><small>预计可节省: ${this.formatFileSize(suggestions.estimatedSavings.savings)} (${suggestions.estimatedSavings.savingsPercentage.toFixed(1)}%)</small></p>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }
    
    /**
     * 显示格式转换选项
     */
    showFormatOptions(imageId) {
        const imageInfo = this.uploadedImages.get(imageId);
        if (!imageInfo) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">格式转换</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>当前格式: <strong>${imageInfo.format}</strong></p>
                        <p>选择目标格式:</p>
                        <div class="format-options">
                            <button class="btn btn-outline-primary me-2 mb-2" onclick="imageManager.convertImageFormat('${imageId}', 'webp')" data-bs-dismiss="modal">
                                WebP <small>(推荐)</small>
                            </button>
                            <button class="btn btn-outline-primary me-2 mb-2" onclick="imageManager.convertImageFormat('${imageId}', 'jpeg')" data-bs-dismiss="modal">
                                JPEG
                            </button>
                            <button class="btn btn-outline-primary me-2 mb-2" onclick="imageManager.convertImageFormat('${imageId}', 'png')" data-bs-dismiss="modal">
                                PNG
                            </button>
                            <button class="btn btn-outline-primary me-2 mb-2" onclick="imageManager.convertImageFormat('${imageId}', 'avif')" data-bs-dismiss="modal">
                                AVIF <small>(现代)</small>
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }
    
    /**
     * 显示图片编辑模态框
     */
    showImageEditModal(imageInfo) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">编辑图片</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-8">
                                <img src="${imageInfo.optimizedData.dataUrl}" 
                                     class="img-fluid" alt="预览图">
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label">文件名</label>
                                    <input type="text" class="form-control" 
                                           value="${imageInfo.originalFile.name}" readonly>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">路径</label>
                                    <input type="text" class="form-control" 
                                           value="${imageInfo.path}" id="editImagePath_${imageInfo.id}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">尺寸</label>
                                    <input type="text" class="form-control" 
                                           value="${imageInfo.dimensions.width} × ${imageInfo.dimensions.height}" readonly>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">大小</label>
                                    <input type="text" class="form-control" 
                                           value="${this.formatFileSize(imageInfo.size)}" readonly>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">格式</label>
                                    <input type="text" class="form-control" 
                                           value="${imageInfo.format}" readonly>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" 
                                onclick="imageManager.saveImageEdit('${imageInfo.id}')" data-bs-dismiss="modal">保存</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 显示模态框
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // 模态框关闭后移除
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }
    
    /**
     * 保存图片编辑
     */
    saveImageEdit(imageId) {
        const imageInfo = this.uploadedImages.get(imageId);
        if (!imageInfo) return;
        
        const pathInput = document.getElementById(`editImagePath_${imageId}`);
        if (pathInput) {
            imageInfo.path = pathInput.value;
            this.updateImagePreview(imageInfo);
            this.showToast('图片信息已更新', 'success');
        }
    }
    
    /**
     * 移除图片
     */
    removeImage(imageId) {
        if (confirm('确定要删除这张图片吗？')) {
            this.uploadedImages.delete(imageId);
            
            const previewItem = document.getElementById(`preview_${imageId}`);
            if (previewItem) {
                previewItem.remove();
            }
            
            this.showToast('图片已删除', 'success');
        }
    }
    
    /**
     * 批量优化所有图片 - 使用高级优化器
     */
    async optimizeAllImages() {
        const images = Array.from(this.uploadedImages.values());
        if (images.length === 0) {
            this.showToast('没有图片需要优化', 'warning');
            return;
        }
        
        this.showToast('开始批量优化图片...', 'info');
        
        try {
            // 使用高级优化器的批量处理功能
            const files = images.map(img => img.originalFile);
            const batchResult = await this.imageOptimizer.optimizeBatch(files);
            
            // 更新图片信息
            batchResult.results.forEach((result, index) => {
                if (result.result.success) {
                    const imageInfo = images[index];
                    imageInfo.optimizedData = result.result.optimized;
                    imageInfo.size = result.result.optimized.size;
                    
                    // 更新预览
                    this.updateImagePreview(imageInfo);
                }
            });
            
            const savedSize = batchResult.totalOriginalSize - batchResult.totalOptimizedSize;
            const savedPercentage = ((savedSize / batchResult.totalOriginalSize) * 100).toFixed(1);
            
            this.showToast(
                `批量优化完成！成功优化 ${batchResult.successful}/${batchResult.total} 张图片，节省 ${this.formatFileSize(savedSize)} (${savedPercentage}%)`, 
                'success'
            );
            
        } catch (error) {
            console.error('批量优化失败:', error);
            this.showToast('批量优化失败', 'error');
        }
    }
    
    /**
     * 获取图片优化建议
     */
    async getOptimizationSuggestions(imageId) {
        const imageInfo = this.uploadedImages.get(imageId);
        if (!imageInfo) return null;
        
        try {
            const suggestions = await this.imageOptimizer.getOptimizationSuggestions(imageInfo.originalFile);
            return suggestions;
        } catch (error) {
            console.error('获取优化建议失败:', error);
            return null;
        }
    }
    
    /**
     * 创建缩略图
     */
    async createThumbnail(imageId, size = 300) {
        const imageInfo = this.uploadedImages.get(imageId);
        if (!imageInfo) return null;
        
        try {
            const thumbnailResult = await this.imageOptimizer.createThumbnail(imageInfo.originalFile, size);
            
            if (thumbnailResult.success) {
                return thumbnailResult.optimized;
            }
            return null;
        } catch (error) {
            console.error('创建缩略图失败:', error);
            return null;
        }
    }
    
    /**
     * 格式转换
     */
    async convertImageFormat(imageId, targetFormat) {
        const imageInfo = this.uploadedImages.get(imageId);
        if (!imageInfo) return false;
        
        try {
            const conversionResult = await this.imageOptimizer.convertFormat(
                imageInfo.originalFile, 
                targetFormat
            );
            
            if (conversionResult.success) {
                // 更新图片信息
                imageInfo.optimizedData = conversionResult.optimized;
                imageInfo.format = `image/${targetFormat}`;
                imageInfo.size = conversionResult.optimized.size;
                
                // 更新预览
                this.updateImagePreview(imageInfo);
                
                this.showToast(`图片已转换为 ${targetFormat.toUpperCase()} 格式`, 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('格式转换失败:', error);
            this.showToast('格式转换失败', 'error');
            return false;
        }
    }
    
    /**
     * 显示优化统计信息
     */
    showOptimizationStats() {
        const images = Array.from(this.uploadedImages.values());
        if (images.length === 0) {
            this.showToast('没有图片数据', 'warning');
            return;
        }
        
        const totalOriginalSize = images.reduce((sum, img) => sum + img.originalFile.size, 0);
        const totalOptimizedSize = images.reduce((sum, img) => sum + img.size, 0);
        const totalSaved = totalOriginalSize - totalOptimizedSize;
        const savedPercentage = ((totalSaved / totalOriginalSize) * 100).toFixed(1);
        
        const stats = {
            totalImages: images.length,
            originalSize: this.formatFileSize(totalOriginalSize),
            optimizedSize: this.formatFileSize(totalOptimizedSize),
            savedSize: this.formatFileSize(totalSaved),
            savedPercentage: savedPercentage
        };
        
        // 创建统计模态框
        this.showStatsModal(stats);
    }
    
    /**
     * 显示统计模态框
     */
    showStatsModal(stats) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">图片优化统计</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-value">${stats.totalImages}</div>
                                    <div class="stat-label">总图片数</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-value text-success">${stats.savedPercentage}%</div>
                                    <div class="stat-label">压缩率</div>
                                </div>
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-4">
                                <div class="stat-item">
                                    <div class="stat-value">${stats.originalSize}</div>
                                    <div class="stat-label">原始大小</div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="stat-item">
                                    <div class="stat-value">${stats.optimizedSize}</div>
                                    <div class="stat-label">优化后大小</div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="stat-item">
                                    <div class="stat-value text-success">${stats.savedSize}</div>
                                    <div class="stat-label">节省空间</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 显示模态框
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // 模态框关闭后移除
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }
    
    /**
     * 显示图片库
     */
    showImageGallery() {
        if (!this.imageGallery) {
            this.showToast('图片库功能未启用', 'warning');
            return;
        }

        // 更新图片库中的图片数据
        const galleryImages = Array.from(this.uploadedImages.values()).map(imageInfo => ({
            id: imageInfo.id,
            name: imageInfo.fileName,
            url: imageInfo.dataUrl,
            path: imageInfo.path,
            size: imageInfo.fileSize,
            originalSize: imageInfo.originalSize,
            compressionRatio: imageInfo.compressionRatio,
            format: imageInfo.format,
            dimensions: imageInfo.dimensions,
            uploadTime: imageInfo.uploadTime
        }));

        // 检查 updateImages 方法是否存在
        if (typeof this.imageGallery.updateImages === 'function') {
            this.imageGallery.updateImages(galleryImages);
        } else {
            console.warn('imageGallery.updateImages 方法不存在');
        }
        
        // 检查 show 方法是否存在
        if (typeof this.imageGallery.show === 'function') {
            this.imageGallery.show();
        } else {
            console.warn('imageGallery.show 方法不存在');
        }
    }
    
    /**
     * 处理从图片库选择图片
     */
    handleGalleryImageSelect(imageInfo) {
        console.log('从图片库选择图片:', imageInfo);
        // 可以在这里添加选择图片后的处理逻辑
    }
    
    /**
     * 处理从图片库删除图片
     */
    handleGalleryImageDelete(imageId) {
        this.removeImage(imageId);
        this.showToast('图片已从库中删除', 'success');
    }
    
    /**
     * 从图片库插入图片到编辑器
     */
    insertImageFromGallery(imageInfo) {
        this.insertImage(imageInfo.id);
        this.imageGallery.hide();
        this.showToast('图片已插入到编辑器', 'success');
    }

    /**
     * 将图片添加到图片库
     */
    addToGallery(imageInfo) {
        if (this.imageGallery && typeof this.imageGallery.addImage === 'function') {
            const galleryImage = {
                id: imageInfo.id,
                name: imageInfo.fileName,
                url: imageInfo.dataUrl,
                path: imageInfo.path,
                size: imageInfo.fileSize,
                originalSize: imageInfo.originalSize,
                compressionRatio: imageInfo.compressionRatio,
                format: imageInfo.format,
                dimensions: imageInfo.dimensions,
                uploadTime: imageInfo.uploadTime
            };
            this.imageGallery.addImage(galleryImage);
        } else {
            // 如果图片库不可用，将图片信息存储在内部
            console.log('图片库不可用，图片信息已存储:', imageInfo.fileName);
        }
    }
    
    /**
     * 清空所有图片
     */
    clearAllImages() {
        if (confirm('确定要清空所有图片吗？此操作不可撤销。')) {
            this.uploadedImages.clear();
            
            const list = document.getElementById('imagePreviewList');
            if (list) {
                list.innerHTML = '';
            }
            
            this.showToast('所有图片已清空', 'success');
        }
    }
    
    /**
     * 获取所有图片信息
     */
    getAllImages() {
        return Array.from(this.uploadedImages.values());
    }
    
    /**
     * 获取图片信息
     */
    getImage(imageId) {
        return this.uploadedImages.get(imageId);
    }
    
    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        // 如果存在全局的showToast函数，使用它
        if (typeof showToast === 'function') {
            showToast(message, type);
            return;
        }
        
        // 否则使用简单的alert
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // 创建简单的toast通知
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            color: white;
            border-radius: 4px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 上传图片到服务器
     */
    async uploadImageToServer(imageInfo) {
        if (!imageInfo.originalFile) {
            throw new Error('原始文件不存在');
        }

        // 检查服务器是否可用
        try {
            const baseUrl = window.location.origin; // 使用当前页面的源地址
            const healthResponse = await fetch(`${baseUrl}/health`);
            if (!healthResponse.ok) {
                throw new Error('文件服务器不可用');
            }
        } catch (error) {
            throw new Error('无法连接到文件服务器');
        }

        // 准备上传数据
        const formData = new FormData();
        formData.append('image', imageInfo.originalFile); // 修正字段名为 'image'
        formData.append('category', 'posts'); // 默认分类

        // 如果有文章标题，添加为 articleSlug
        const titleElement = document.getElementById('title');
        if (titleElement && titleElement.value) {
            const slug = this.generateSlug(titleElement.value);
            formData.append('articleSlug', slug);
        }

        // 上传到服务器
        const baseUrl = window.location.origin; // 使用当前页面的源地址
        const response = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || '服务器上传失败');
        }

        // 更新图片信息
        if (result.images && result.images.length > 0) {
            const serverImage = result.images[0];
            imageInfo.serverPath = serverImage.webPath;
            imageInfo.serverFilename = serverImage.filename;
            imageInfo.uploadedToServer = true;
            imageInfo.path = serverImage.webPath; // 更新路径为服务器路径

            console.log('图片已上传到服务器:', serverImage.webPath);
        }

        return result;
    }

    /**
     * 生成URL友好的slug
     */
    generateSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fff]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * 分发图片处理完成事件
     */
    dispatchImageProcessedEvent(imageInfo) {
        const event = new CustomEvent('imageProcessed', {
            detail: imageInfo,
            bubbles: true
        });
        document.dispatchEvent(event);
    }
}

// 导出图片管理器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageManager;
}

// 全局实例（如果在浏览器环境中）
if (typeof window !== 'undefined') {
    window.ImageManager = ImageManager;
    
    // 自动初始化（可选）
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.imageManager) {
            window.imageManager = new ImageManager();
        }
    });
}