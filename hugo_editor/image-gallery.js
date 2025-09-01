/**
 * 图片库和预览功能模块
 * 提供图片网格展示、预览、搜索和基本管理功能
 */
class ImageGallery {
    constructor(options = {}) {
        this.options = {
            containerId: 'imageGallery',
            gridColumns: 4,
            thumbnailSize: 200,
            enableSearch: true,
            enablePreview: true,
            ...options
        };
        
        this.images = [];
        this.filteredImages = [];
        this.currentPreviewIndex = 0;
        this.selectedImages = new Set();
        
        this.init();
    }
    
    /**
     * 初始化图片库
     */
    init() {
        this.createGalleryContainer();
        this.setupEventListeners();
        this.loadImages();
    }
    
    /**
     * 创建图片库容器
     */
    createGalleryContainer() {
        const container = document.getElementById(this.options.containerId);
        if (!container) {
            console.error('图片库容器未找到');
            return;
        }
        
        container.innerHTML = `
            <div class="gallery-header">
                <div class="gallery-controls">
                    <input type="text" id="gallerySearch" placeholder="搜索图片..." class="gallery-search">
                    <select id="gallerySortBy" class="gallery-sort">
                        <option value="date-desc">最新优先</option>
                        <option value="date-asc">最旧优先</option>
                        <option value="name-asc">名称 A-Z</option>
                        <option value="name-desc">名称 Z-A</option>
                        <option value="size-desc">大小降序</option>
                        <option value="size-asc">大小升序</option>
                    </select>
                    <button id="gallerySelectAll" class="gallery-btn">全选</button>
                    <button id="galleryDeleteSelected" class="gallery-btn gallery-btn-danger" disabled>删除选中</button>
                </div>
                <div class="gallery-info">
                    <span id="galleryImageCount">0 张图片</span>
                    <span id="gallerySelectedCount"></span>
                </div>
            </div>
            <div class="gallery-grid" id="galleryGrid"></div>
            <div class="gallery-preview" id="galleryPreview" style="display: none;">
                <div class="preview-overlay"></div>
                <div class="preview-container">
                    <button class="preview-close" id="previewClose">&times;</button>
                    <button class="preview-nav preview-prev" id="previewPrev">&lt;</button>
                    <button class="preview-nav preview-next" id="previewNext">&gt;</button>
                    <div class="preview-content">
                        <img id="previewImage" alt="预览图片">
                        <div class="preview-info">
                            <h3 id="previewTitle"></h3>
                            <div class="preview-details">
                                <span id="previewSize"></span>
                                <span id="previewDimensions"></span>
                                <span id="previewDate"></span>
                            </div>
                            <div class="preview-actions">
                                <button id="previewInsert" class="preview-btn">插入到编辑器</button>
                                <button id="previewDownload" class="preview-btn">下载</button>
                                <button id="previewDelete" class="preview-btn preview-btn-danger">删除</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 搜索功能
        const searchInput = document.getElementById('gallerySearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
        }
        
        // 排序功能
        const sortSelect = document.getElementById('gallerySortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSort.bind(this));
        }
        
        // 全选功能
        const selectAllBtn = document.getElementById('gallerySelectAll');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', this.toggleSelectAll.bind(this));
        }
        
        // 删除选中
        const deleteSelectedBtn = document.getElementById('galleryDeleteSelected');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', this.deleteSelected.bind(this));
        }
        
        // 预览相关事件
        this.setupPreviewEvents();
        
        // 键盘事件
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
    
    /**
     * 设置预览事件
     */
    setupPreviewEvents() {
        const previewClose = document.getElementById('previewClose');
        const previewPrev = document.getElementById('previewPrev');
        const previewNext = document.getElementById('previewNext');
        const previewOverlay = document.querySelector('.preview-overlay');
        
        if (previewClose) {
            previewClose.addEventListener('click', this.closePreview.bind(this));
        }
        
        if (previewOverlay) {
            previewOverlay.addEventListener('click', this.closePreview.bind(this));
        }
        
        if (previewPrev) {
            previewPrev.addEventListener('click', this.showPreviousImage.bind(this));
        }
        
        if (previewNext) {
            previewNext.addEventListener('click', this.showNextImage.bind(this));
        }
        
        // 预览操作按钮
        const previewInsert = document.getElementById('previewInsert');
        const previewDownload = document.getElementById('previewDownload');
        const previewDelete = document.getElementById('previewDelete');
        
        if (previewInsert) {
            previewInsert.addEventListener('click', this.insertCurrentImage.bind(this));
        }
        
        if (previewDownload) {
            previewDownload.addEventListener('click', this.downloadCurrentImage.bind(this));
        }
        
        if (previewDelete) {
            previewDelete.addEventListener('click', this.deleteCurrentImage.bind(this));
        }
    }
    
    /**
     * 从ImageManager加载图片
     */
    loadImages() {
        // 假设ImageManager实例可用
        if (window.imageManager) {
            this.images = window.imageManager.getAllImages();
        } else {
            this.images = [];
        }
        
        this.filteredImages = [...this.images];
        this.renderGallery();
        this.updateImageCount();
    }
    
    /**
     * 渲染图片库
     */
    renderGallery() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;
        
        if (this.filteredImages.length === 0) {
            grid.innerHTML = '<div class="gallery-empty">暂无图片</div>';
            return;
        }
        
        grid.innerHTML = this.filteredImages.map((image, index) => `
            <div class="gallery-item ${this.selectedImages.has(image.id) ? 'selected' : ''}" 
                 data-image-id="${image.id}" data-index="${index}">
                <div class="gallery-item-checkbox">
                    <input type="checkbox" ${this.selectedImages.has(image.id) ? 'checked' : ''} 
                           onchange="imageGallery.toggleImageSelection('${image.id}')">
                </div>
                <div class="gallery-item-image" onclick="imageGallery.openPreview(${index})">
                    <img src="${image.dataUrl}" alt="${image.fileName}" loading="lazy">
                </div>
                <div class="gallery-item-info">
                    <div class="gallery-item-name" title="${image.fileName}">${this.truncateFileName(image.fileName)}</div>
                    <div class="gallery-item-size">${this.formatFileSize(image.size)}</div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * 处理搜索
     */
    handleSearch(event) {
        const query = event.target.value.toLowerCase().trim();
        
        if (!query) {
            this.filteredImages = [...this.images];
        } else {
            this.filteredImages = this.images.filter(image => 
                image.fileName.toLowerCase().includes(query) ||
                (image.alt && image.alt.toLowerCase().includes(query))
            );
        }
        
        this.renderGallery();
        this.updateImageCount();
    }
    
    /**
     * 处理排序
     */
    handleSort(event) {
        const sortBy = event.target.value;
        
        this.filteredImages.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.uploadDate) - new Date(a.uploadDate);
                case 'date-asc':
                    return new Date(a.uploadDate) - new Date(b.uploadDate);
                case 'name-asc':
                    return a.fileName.localeCompare(b.fileName);
                case 'name-desc':
                    return b.fileName.localeCompare(a.fileName);
                case 'size-desc':
                    return b.size - a.size;
                case 'size-asc':
                    return a.size - b.size;
                default:
                    return 0;
            }
        });
        
        this.renderGallery();
    }
    
    /**
     * 切换图片选择状态
     */
    toggleImageSelection(imageId) {
        if (this.selectedImages.has(imageId)) {
            this.selectedImages.delete(imageId);
        } else {
            this.selectedImages.add(imageId);
        }
        
        this.updateSelectionUI();
    }
    
    /**
     * 全选/取消全选
     */
    toggleSelectAll() {
        const selectAllBtn = document.getElementById('gallerySelectAll');
        
        if (this.selectedImages.size === this.filteredImages.length) {
            // 取消全选
            this.selectedImages.clear();
            selectAllBtn.textContent = '全选';
        } else {
            // 全选
            this.filteredImages.forEach(image => {
                this.selectedImages.add(image.id);
            });
            selectAllBtn.textContent = '取消全选';
        }
        
        this.updateSelectionUI();
    }
    
    /**
     * 更新选择状态UI
     */
    updateSelectionUI() {
        const deleteBtn = document.getElementById('galleryDeleteSelected');
        const selectedCount = document.getElementById('gallerySelectedCount');
        const selectAllBtn = document.getElementById('gallerySelectAll');
        
        // 更新删除按钮状态
        if (deleteBtn) {
            deleteBtn.disabled = this.selectedImages.size === 0;
        }
        
        // 更新选中数量显示
        if (selectedCount) {
            if (this.selectedImages.size > 0) {
                selectedCount.textContent = `已选中 ${this.selectedImages.size} 张`;
            } else {
                selectedCount.textContent = '';
            }
        }
        
        // 更新全选按钮文本
        if (selectAllBtn) {
            selectAllBtn.textContent = this.selectedImages.size === this.filteredImages.length ? '取消全选' : '全选';
        }
        
        // 更新网格中的选择状态
        this.renderGallery();
    }
    
    /**
     * 删除选中的图片
     */
    deleteSelected() {
        if (this.selectedImages.size === 0) return;
        
        if (confirm(`确定要删除选中的 ${this.selectedImages.size} 张图片吗？`)) {
            this.selectedImages.forEach(imageId => {
                if (window.imageManager) {
                    window.imageManager.removeImage(imageId);
                }
            });
            
            this.selectedImages.clear();
            this.loadImages(); // 重新加载图片列表
        }
    }
    
    /**
     * 打开预览
     */
    openPreview(index) {
        this.currentPreviewIndex = index;
        const preview = document.getElementById('galleryPreview');
        if (preview) {
            preview.style.display = 'flex';
            this.updatePreview();
        }
    }
    
    /**
     * 关闭预览
     */
    closePreview() {
        const preview = document.getElementById('galleryPreview');
        if (preview) {
            preview.style.display = 'none';
        }
    }
    
    /**
     * 显示上一张图片
     */
    showPreviousImage() {
        if (this.currentPreviewIndex > 0) {
            this.currentPreviewIndex--;
            this.updatePreview();
        }
    }
    
    /**
     * 显示下一张图片
     */
    showNextImage() {
        if (this.currentPreviewIndex < this.filteredImages.length - 1) {
            this.currentPreviewIndex++;
            this.updatePreview();
        }
    }
    
    /**
     * 更新预览内容
     */
    updatePreview() {
        const image = this.filteredImages[this.currentPreviewIndex];
        if (!image) return;
        
        const previewImage = document.getElementById('previewImage');
        const previewTitle = document.getElementById('previewTitle');
        const previewSize = document.getElementById('previewSize');
        const previewDimensions = document.getElementById('previewDimensions');
        const previewDate = document.getElementById('previewDate');
        const previewPrev = document.getElementById('previewPrev');
        const previewNext = document.getElementById('previewNext');
        
        if (previewImage) {
            previewImage.src = image.dataUrl;
            previewImage.alt = image.fileName;
        }
        
        if (previewTitle) {
            previewTitle.textContent = image.fileName;
        }
        
        if (previewSize) {
            previewSize.textContent = this.formatFileSize(image.size);
        }
        
        if (previewDimensions && image.width && image.height) {
            previewDimensions.textContent = `${image.width} × ${image.height}`;
        }
        
        if (previewDate) {
            previewDate.textContent = new Date(image.uploadDate).toLocaleString();
        }
        
        // 更新导航按钮状态
        if (previewPrev) {
            previewPrev.disabled = this.currentPreviewIndex === 0;
        }
        
        if (previewNext) {
            previewNext.disabled = this.currentPreviewIndex === this.filteredImages.length - 1;
        }
    }
    
    /**
     * 插入当前预览的图片到编辑器
     */
    insertCurrentImage() {
        const image = this.filteredImages[this.currentPreviewIndex];
        if (image && window.imageManager) {
            window.imageManager.insertImage(image.id);
            this.closePreview();
        }
    }
    
    /**
     * 下载当前预览的图片
     */
    downloadCurrentImage() {
        const image = this.filteredImages[this.currentPreviewIndex];
        if (image) {
            const link = document.createElement('a');
            link.href = image.dataUrl;
            link.download = image.fileName;
            link.click();
        }
    }
    
    /**
     * 删除当前预览的图片
     */
    deleteCurrentImage() {
        const image = this.filteredImages[this.currentPreviewIndex];
        if (image && confirm(`确定要删除图片 "${image.fileName}" 吗？`)) {
            if (window.imageManager) {
                window.imageManager.removeImage(image.id);
            }
            
            this.closePreview();
            this.loadImages();
        }
    }
    
    /**
     * 处理键盘事件
     */
    handleKeydown(event) {
        const preview = document.getElementById('galleryPreview');
        if (!preview || preview.style.display === 'none') return;
        
        switch (event.key) {
            case 'Escape':
                this.closePreview();
                break;
            case 'ArrowLeft':
                this.showPreviousImage();
                break;
            case 'ArrowRight':
                this.showNextImage();
                break;
        }
    }
    
    /**
     * 更新图片数量显示
     */
    updateImageCount() {
        const countElement = document.getElementById('galleryImageCount');
        if (countElement) {
            countElement.textContent = `${this.filteredImages.length} 张图片`;
        }
    }
    
    /**
     * 截断文件名
     */
    truncateFileName(fileName, maxLength = 20) {
        if (fileName.length <= maxLength) return fileName;
        
        const ext = fileName.split('.').pop();
        const name = fileName.substring(0, fileName.lastIndexOf('.'));
        const truncatedName = name.substring(0, maxLength - ext.length - 4) + '...';
        
        return `${truncatedName}.${ext}`;
    }
    
    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    /**
     * 刷新图片库
     */
    refresh() {
        this.loadImages();
    }
    
    /**
     * 清空选择
     */
    clearSelection() {
        this.selectedImages.clear();
        this.updateSelectionUI();
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageGallery;
}

// 浏览器环境下的全局变量
if (typeof window !== 'undefined') {
    window.ImageGallery = ImageGallery;
}