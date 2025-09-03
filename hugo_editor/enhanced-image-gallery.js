/**
 * Enhanced Image Gallery Component
 * 增强图片库组件 - 提供图片浏览、管理、上传和优化功能
 * @version 2.0.0
 */

class EnhancedImageGallery {
    constructor(options = {}) {
        this.options = {
            container: options.container || '#imageGallery',
            onImageSelect: options.onImageSelect || null,
            onImageDelete: options.onImageDelete || null,
            onImageInsert: options.onImageInsert || null,
            allowMultiSelect: options.allowMultiSelect !== false,
            showUpload: options.showUpload !== false,
            categories: options.categories || ['all', 'posts', 'covers', 'gallery', 'icons'],
            serverUrl: options.serverUrl || 'http://127.0.0.1:8080',
            maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
            allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            ...options
        };
        
        this.images = new Map(); // 存储图片数据
        this.selectedImages = new Set(); // 选中的图片
        this.currentView = 'grid'; // 当前视图模式
        this.currentCategory = 'all'; // 当前分类
        this.searchQuery = ''; // 搜索关键词
        this.sortBy = 'date'; // 排序方式
        this.isUploading = false; // 上传状态
        this.uploadProgress = 0; // 上传进度
        this.serverAvailable = false; // 服务器状态
        
        this.init();
    }
    
    async init() {
        this.createGalleryHTML();
        this.bindEvents();
        await this.checkServerConnection();
        this.loadImages();
    }
    
    async checkServerConnection() {
        try {
            const response = await fetch(`${this.options.serverUrl}/health`);
            if (response.ok) {
                this.serverAvailable = true;
                console.log('文件服务器连接正常');
            } else {
                throw new Error('服务器响应异常');
            }
        } catch (error) {
            this.serverAvailable = false;
            console.warn('文件服务器不可用:', error);
        }
    }
    
    createGalleryHTML() {
        const container = document.querySelector(this.options.container);
        if (!container) {
            console.error('Image Gallery container not found:', this.options.container);
            return;
        }
        
        container.innerHTML = `
            <div class="image-gallery" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 1000; display: none;">
                <div class="gallery-header" style="background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div class="gallery-title" style="font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                        <span>🖼️ 图片库</span>
                        <div class="gallery-stats">
                            <span class="stat-item">
                                <span class="stat-number" id="totalImages">0</span>
                                <span class="stat-label">张图片</span>
                            </span>
                        </div>
                    </div>
                    <div class="gallery-controls" style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" placeholder="搜索图片..." id="gallerySearch" class="gallery-search" style="padding: 8px 12px; border: none; border-radius: 6px; background: rgba(255,255,255,0.1); color: white; width: 200px;">
                        <select id="galleryCategory" class="gallery-filter" style="padding: 8px 12px; border: none; border-radius: 6px; background: rgba(255,255,255,0.1); color: white;">
                            <option value="all">所有分类</option>
                            <option value="posts">文章图片</option>
                            <option value="covers">封面图片</option>
                            <option value="gallery">图片欣赏</option>
                            <option value="icons">图标资源</option>
                        </select>
                        <select id="gallerySort" class="gallery-sort" style="padding: 8px 12px; border: none; border-radius: 6px; background: rgba(255,255,255,0.1); color: white;">
                            <option value="date">按日期排序</option>
                            <option value="name">按名称排序</option>
                            <option value="size">按大小排序</option>
                        </select>
                        <button class="gallery-close" id="galleryClose" style="background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">✕</button>
                    </div>
                </div>
                
                <div class="gallery-content" style="padding: 20px; max-width: 1400px; margin: 0 auto; height: calc(100% - 80px); overflow-y: auto;">
                    ${this.options.showUpload ? this.createUploadZoneHTML() : ''}
                    <div class="gallery-grid" id="imagesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; margin-top: 20px;">
                        <div class="gallery-loading" style="text-align: center; padding: 60px; color: rgba(255,255,255,0.7);">
                            <div class="loading-spinner" style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                            <p>正在加载图片...</p>
                        </div>
                    </div>
                </div>
                
                <div class="gallery-progress" id="uploadProgress" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255,255,255,0.95); padding: 30px; border-radius: 12px; box-shadow: 0 10px 50px rgba(0,0,0,0.3); z-index: 1002; min-width: 350px; text-align: center;">
                    <div class="progress-text" style="font-size: 16px; color: #2c3e50; margin-bottom: 10px; font-weight: 600;">正在上传图片...</div>
                    <div class="progress-bar" style="width: 100%; height: 10px; background: #ecf0f1; border-radius: 5px; overflow: hidden; margin: 20px 0;">
                        <div class="progress-fill" id="progressFill" style="height: 100%; background: linear-gradient(90deg, #3498db, #2980b9); transition: width 0.3s ease; border-radius: 5px; width: 0%;"></div>
                    </div>
                    <div class="progress-details" id="progressDetails" style="font-size: 12px; color: #7f8c8d;">准备上传...</div>
                </div>
            </div>
        `;
        
        // 添加CSS动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .gallery-item {
                background: rgba(255,255,255,0.95);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
            }
            .gallery-item:hover {
                transform: translateY(-5px) scale(1.02);
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .gallery-item-image {
                width: 100%;
                height: 160px;
                object-fit: cover;
                display: block;
                transition: transform 0.3s ease;
            }
            .gallery-item:hover .gallery-item-image {
                transform: scale(1.05);
            }
            .gallery-item-info {
                padding: 15px;
                position: relative;
                z-index: 1;
            }
            .gallery-item-name {
                font-size: 14px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 8px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .gallery-item-meta {
                font-size: 11px;
                color: #7f8c8d;
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                flex-wrap: wrap;
                gap: 5px;
            }
            .gallery-item-actions {
                display: flex;
                gap: 8px;
            }
            .gallery-item-actions .btn {
                flex: 1;
                padding: 8px 12px;
                font-size: 11px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 500;
            }
            .btn-primary {
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
            }
            .btn-primary:hover {
                background: linear-gradient(135deg, #2980b9, #1f5f8b);
                transform: translateY(-1px);
            }
            .btn-warning {
                background: linear-gradient(135deg, #f39c12, #e67e22);
                color: white;
            }
            .btn-warning:hover {
                background: linear-gradient(135deg, #e67e22, #d35400);
                transform: translateY(-1px);
            }
            .badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 500;
                text-transform: uppercase;
            }
            .badge-success {
                background: linear-gradient(135deg, #27ae60, #2ecc71);
                color: white;
            }
            .badge-warning {
                background: linear-gradient(135deg, #f39c12, #e67e22);
                color: white;
            }
        `;
        document.head.appendChild(style);
    }
    
    createUploadZoneHTML() {
        return `
            <div class="gallery-upload-zone" id="uploadZone" style="border: 2px dashed #3498db; border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, rgba(52,152,219,0.1), rgba(155,89,182,0.1)); transition: all 0.3s ease; cursor: pointer;">
                <div class="upload-icon" style="font-size: 48px; color: #3498db; margin-bottom: 15px;">📤</div>
                <div class="upload-text" style="font-size: 16px; color: white; margin-bottom: 10px; font-weight: 500;">拖拽图片到此处或点击上传</div>
                <div class="upload-hint" style="font-size: 12px; color: rgba(255,255,255,0.7);">支持 JPEG、PNG、GIF、WebP 格式，最大 10MB</div>
                <input type="file" id="fileInput" multiple accept="image/*" style="display: none;">
            </div>
        `;
    }
    
    bindEvents() {
        const container = document.querySelector(this.options.container);
        
        // 关闭按钮
        const closeBtn = container.querySelector('#galleryClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // 搜索功能
        const searchInput = container.querySelector('#gallerySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.filterAndRenderImages();
            });
        }
        
        // 分类筛选
        const categorySelect = container.querySelector('#galleryCategory');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.filterAndRenderImages();
            });
        }
        
        // 排序
        const sortSelect = container.querySelector('#gallerySort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.filterAndRenderImages();
            });
        }
        
        // 上传区域事件
        if (this.options.showUpload) {
            this.setupUploadEvents();
        }
    }
    
    setupUploadEvents() {
        const container = document.querySelector(this.options.container);
        const uploadZone = container.querySelector('#uploadZone');
        const fileInput = container.querySelector('#fileInput');
        
        if (uploadZone && fileInput) {
            // 点击上传
            uploadZone.addEventListener('click', () => fileInput.click());
            
            // 文件选择
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(Array.from(e.target.files));
            });
            
            // 拖拽上传
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            });
            
            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('dragover');
            });
            
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files).filter(file => 
                    file.type.startsWith('image/')
                );
                this.handleFileUpload(files);
            });
        }
    }
    
    async handleFileUpload(files) {
        if (!files.length) return;
        
        if (!this.serverAvailable) {
            this.showToast('文件服务器不可用，无法上传图片', 'error');
            return;
        }
        
        this.isUploading = true;
        this.showUploadProgress();
        
        try {
            const formData = new FormData();
            files.forEach(file => formData.append('images', file));
            formData.append('category', this.currentCategory === 'all' ? 'posts' : this.currentCategory);
            
            const response = await fetch(`${this.options.serverUrl}/api/images/upload`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                result.images.forEach(imageInfo => {
                    this.images.set(imageInfo.filename, {
                        id: imageInfo.filename,
                        name: imageInfo.originalName,
                        filename: imageInfo.filename,
                        size: imageInfo.size,
                        webPath: imageInfo.webPath,
                        category: imageInfo.category,
                        uploadedToServer: true,
                        uploadDate: new Date()
                    });
                });
                
                this.filterAndRenderImages();
                this.showToast(`成功上传 ${result.images.length} 张图片`, 'success');
            } else {
                throw new Error(result.error || '上传失败');
            }
        } catch (error) {
            console.error('图片上传失败:', error);
            this.showToast(`上传失败: ${error.message}`, 'error');
        } finally {
            this.isUploading = false;
            this.hideUploadProgress();
        }
    }
    
    showUploadProgress() {
        const progress = document.querySelector('#uploadProgress');
        if (progress) {
            progress.style.display = 'block';
        }
    }
    
    hideUploadProgress() {
        const progress = document.querySelector('#uploadProgress');
        if (progress) {
            progress.style.display = 'none';
        }
    }
    
    show() {
        const gallery = document.querySelector(this.options.container + ' .image-gallery');
        if (gallery) {
            gallery.style.display = 'block';
            this.loadImages();
        }
    }
    
    hide() {
        const gallery = document.querySelector(this.options.container + ' .image-gallery');
        if (gallery) {
            gallery.style.display = 'none';
        }
    }
    
    async loadImages() {
        if (!this.serverAvailable) {
            this.renderEmptyState();
            return;
        }

        try {
            // 这里可以添加从服务器加载图片列表的逻辑
            // 暂时使用模拟数据
            this.renderEmptyState();
        } catch (error) {
            console.error('加载图片失败:', error);
            this.renderEmptyState();
        }
    }

    filterAndRenderImages() {
        let filteredImages = Array.from(this.images.values());

        // 分类筛选
        if (this.currentCategory !== 'all') {
            filteredImages = filteredImages.filter(img => img.category === this.currentCategory);
        }

        // 搜索筛选
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filteredImages = filteredImages.filter(img =>
                img.name.toLowerCase().includes(query) ||
                img.filename.toLowerCase().includes(query)
            );
        }

        // 排序
        filteredImages.sort((a, b) => {
            switch (this.sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'size':
                    return b.size - a.size;
                case 'date':
                default:
                    return new Date(b.uploadDate) - new Date(a.uploadDate);
            }
        });

        this.renderImages(filteredImages);
        this.updateStats(filteredImages.length);
    }

    renderImages(images) {
        const grid = document.querySelector('#imagesGrid');
        if (!grid) return;

        if (images.length === 0) {
            this.renderEmptyState();
            return;
        }

        grid.innerHTML = images.map(img => `
            <div class="gallery-item" data-id="${img.id}">
                <img src="${this.serverAvailable ? this.options.serverUrl + img.webPath : img.data}"
                     alt="${img.name}"
                     class="gallery-item-image">
                <div class="gallery-item-info">
                    <div class="gallery-item-name">${img.name}</div>
                    <div class="gallery-item-meta">
                        <span>${this.formatFileSize(img.size)}</span>
                        <span class="badge ${img.uploadedToServer ? 'badge-success' : 'badge-warning'}">
                            ${img.uploadedToServer ? '已上传' : '本地'}
                        </span>
                    </div>
                    <div class="gallery-item-actions">
                        <button class="btn btn-primary" onclick="enhancedGallery.insertImage('${img.id}')">插入</button>
                        <button class="btn btn-warning" onclick="enhancedGallery.deleteImage('${img.id}')">删除</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderEmptyState() {
        const grid = document.querySelector('#imagesGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="gallery-empty" style="grid-column: 1 / -1; text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.7);">
                <div class="gallery-empty-icon" style="font-size: 80px; margin-bottom: 20px; opacity: 0.5;">📷</div>
                <h3>暂无图片</h3>
                <p>上传一些图片开始使用图片库功能</p>
            </div>
        `;
    }

    updateStats(count) {
        const totalImages = document.querySelector('#totalImages');
        if (totalImages) {
            totalImages.textContent = count;
        }
    }

    insertImage(imageId) {
        const image = this.images.get(imageId);
        if (image && this.options.onImageInsert) {
            this.options.onImageInsert(image);
        }
    }

    deleteImage(imageId) {
        if (confirm('确定要删除这张图片吗？')) {
            this.images.delete(imageId);
            this.filterAndRenderImages();

            if (this.options.onImageDelete) {
                this.options.onImageDelete(imageId);
            }
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showToast(message, type = 'info') {
        // 简单的toast实现
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            transition: all 0.3s ease;
        `;

        switch (type) {
            case 'success':
                toast.style.background = '#27ae60';
                break;
            case 'error':
                toast.style.background = '#e74c3c';
                break;
            case 'warning':
                toast.style.background = '#f39c12';
                break;
            default:
                toast.style.background = '#3498db';
        }

        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// 全局实例
let enhancedGallery = null;
