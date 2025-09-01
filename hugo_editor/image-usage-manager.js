/**
 * 图片使用场景管理器
 * 管理三种图片使用场景：文章插图、文章封面、图片库欣赏
 * @version 1.0.0
 */

class ImageUsageManager {
    constructor(options = {}) {
        this.options = {
            enableInlineImages: true,    // 文章插图
            enableCoverImages: true,     // 文章封面
            enableGalleryImages: true,   // 图片库欣赏
            ...options
        };
        
        this.currentUsageType = 'inline'; // 当前使用类型
        this.coverImage = null; // 当前封面图片
        this.inlineImages = new Map(); // 文章插图
        this.galleryImages = new Map(); // 图片库图片
        
        this.init();
    }
    
    init() {
        this.createUsageInterface();
        this.bindEvents();
    }
    
    /**
     * 创建使用场景界面
     */
    createUsageInterface() {
        // 创建图片使用类型选择器
        const usageSelector = this.createUsageSelector();
        
        // 创建封面图片设置区域
        const coverSection = this.createCoverSection();
        
        // 将界面元素添加到页面
        this.insertInterfaceElements(usageSelector, coverSection);
    }
    
    /**
     * 创建使用类型选择器
     */
    createUsageSelector() {
        const selector = document.createElement('div');
        selector.className = 'image-usage-selector';
        selector.innerHTML = `
            <div class="usage-selector-header">
                <h4>图片用途选择</h4>
                <p class="usage-hint">选择图片的使用方式</p>
            </div>
            <div class="usage-options">
                <label class="usage-option active" data-usage="inline">
                    <input type="radio" name="imageUsage" value="inline" checked>
                    <div class="option-content">
                        <div class="option-icon">📝</div>
                        <div class="option-text">
                            <div class="option-title">文章插图</div>
                            <div class="option-desc">插入到文章内容中</div>
                        </div>
                    </div>
                </label>
                <label class="usage-option" data-usage="cover">
                    <input type="radio" name="imageUsage" value="cover">
                    <div class="option-content">
                        <div class="option-icon">🖼️</div>
                        <div class="option-text">
                            <div class="option-title">文章封面</div>
                            <div class="option-desc">设置为文章封面图片</div>
                        </div>
                    </div>
                </label>
                <label class="usage-option" data-usage="gallery">
                    <input type="radio" name="imageUsage" value="gallery">
                    <div class="option-content">
                        <div class="option-icon">🎨</div>
                        <div class="option-text">
                            <div class="option-title">图片库</div>
                            <div class="option-desc">仅存储和欣赏</div>
                        </div>
                    </div>
                </label>
            </div>
        `;
        
        return selector;
    }
    
    /**
     * 创建封面图片设置区域
     */
    createCoverSection() {
        const section = document.createElement('div');
        section.className = 'cover-image-section';
        section.innerHTML = `
            <div class="cover-section-header">
                <h4>文章封面</h4>
                <button class="btn btn-sm btn-outline" id="clearCoverBtn">清除封面</button>
            </div>
            <div class="cover-preview" id="coverPreview">
                <div class="cover-placeholder">
                    <div class="placeholder-icon">🖼️</div>
                    <div class="placeholder-text">暂无封面图片</div>
                    <div class="placeholder-hint">上传图片并选择"文章封面"用途</div>
                </div>
            </div>
        `;
        
        return section;
    }
    
    /**
     * 插入界面元素到页面
     */
    insertInterfaceElements(usageSelector, coverSection) {
        // 查找合适的插入位置
        const imageUploadArea = document.querySelector('.image-upload-area') || 
                               document.querySelector('#imageUpload') ||
                               document.querySelector('.sidebar');
        
        if (imageUploadArea) {
            // 插入使用类型选择器
            imageUploadArea.insertBefore(usageSelector, imageUploadArea.firstChild);
            
            // 插入封面设置区域
            const frontMatterSection = document.querySelector('.front-matter') ||
                                     document.querySelector('.article-meta');
            if (frontMatterSection) {
                frontMatterSection.appendChild(coverSection);
            } else {
                imageUploadArea.appendChild(coverSection);
            }
        }
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 使用类型选择事件
        document.addEventListener('change', (e) => {
            if (e.target.name === 'imageUsage') {
                this.handleUsageTypeChange(e.target.value);
            }
        });
        
        // 清除封面按钮事件
        const clearCoverBtn = document.getElementById('clearCoverBtn');
        if (clearCoverBtn) {
            clearCoverBtn.addEventListener('click', () => this.clearCoverImage());
        }
        
        // 监听图片上传完成事件
        document.addEventListener('imageProcessed', (e) => {
            this.handleImageProcessed(e.detail);
        });
    }
    
    /**
     * 处理使用类型变化
     */
    handleUsageTypeChange(usageType) {
        this.currentUsageType = usageType;
        
        // 更新界面状态
        document.querySelectorAll('.usage-option').forEach(option => {
            option.classList.toggle('active', option.dataset.usage === usageType);
        });
        
        // 显示相应的提示信息
        this.showUsageHint(usageType);
    }
    
    /**
     * 显示使用提示
     */
    showUsageHint(usageType) {
        const hints = {
            inline: '上传的图片将作为文章插图，可以插入到文章内容中',
            cover: '上传的图片将设置为文章封面，显示在文章顶部',
            gallery: '上传的图片将存储在图片库中，仅用于欣赏和管理'
        };
        
        const hintElement = document.querySelector('.usage-hint');
        if (hintElement) {
            hintElement.textContent = hints[usageType] || '';
        }
    }
    
    /**
     * 处理图片处理完成事件
     */
    handleImageProcessed(imageInfo) {
        switch (this.currentUsageType) {
            case 'inline':
                this.handleInlineImage(imageInfo);
                break;
            case 'cover':
                this.handleCoverImage(imageInfo);
                break;
            case 'gallery':
                this.handleGalleryImage(imageInfo);
                break;
        }
    }
    
    /**
     * 处理文章插图
     */
    handleInlineImage(imageInfo) {
        // 存储插图信息
        this.inlineImages.set(imageInfo.id, imageInfo);
        
        // 添加插入按钮
        this.addInsertButton(imageInfo);
        
        console.log('文章插图已准备:', imageInfo.fileName);
    }
    
    /**
     * 处理文章封面
     */
    handleCoverImage(imageInfo) {
        // 设置为封面图片
        this.coverImage = imageInfo;
        
        // 更新封面预览
        this.updateCoverPreview(imageInfo);
        
        // 更新Front Matter
        this.updateFrontMatterCover(imageInfo);
        
        console.log('文章封面已设置:', imageInfo.fileName);
    }
    
    /**
     * 处理图片库图片
     */
    handleGalleryImage(imageInfo) {
        // 存储到图片库
        this.galleryImages.set(imageInfo.id, imageInfo);
        
        console.log('图片已添加到图片库:', imageInfo.fileName);
    }
    
    /**
     * 添加插入按钮
     */
    addInsertButton(imageInfo) {
        const previewItem = document.getElementById(`preview_${imageInfo.id}`);
        if (previewItem) {
            const insertBtn = previewItem.querySelector('.btn-primary');
            if (insertBtn) {
                insertBtn.onclick = () => this.insertImageToEditor(imageInfo);
                insertBtn.textContent = '插入文章';
                insertBtn.title = '插入到文章内容中';
            }
        }
    }
    
    /**
     * 插入图片到编辑器
     */
    insertImageToEditor(imageInfo) {
        const editor = document.getElementById('markdownEditor') || 
                      document.getElementById('content') || 
                      document.querySelector('textarea');
        
        if (!editor) {
            this.showToast('编辑器未找到', 'error');
            return;
        }
        
        // 生成Markdown图片语法
        const fileName = imageInfo.fileName || '图片';
        const altText = fileName.replace(/\.[^/.]+$/, '');
        const imagePath = imageInfo.serverPath || imageInfo.path || `/images/${fileName}`;
        const markdownImage = `![${altText}](${imagePath})`;
        
        // 插入到编辑器当前光标位置
        const cursorPos = editor.selectionStart || 0;
        const textBefore = editor.value.substring(0, cursorPos);
        const textAfter = editor.value.substring(cursorPos);
        
        editor.value = textBefore + '\n' + markdownImage + '\n' + textAfter;
        
        // 设置新的光标位置
        const newPos = cursorPos + markdownImage.length + 2;
        editor.setSelectionRange(newPos, newPos);
        editor.focus();
        
        // 触发更新事件
        if (typeof hugoEditor !== 'undefined' && hugoEditor.updatePreview) {
            hugoEditor.updatePreview();
        }
        
        this.showToast('图片已插入到文章中', 'success');
    }
    
    /**
     * 更新封面预览
     */
    updateCoverPreview(imageInfo) {
        const coverPreview = document.getElementById('coverPreview');
        if (!coverPreview) return;
        
        const imageUrl = imageInfo.dataUrl || imageInfo.serverPath || imageInfo.path;
        
        coverPreview.innerHTML = `
            <div class="cover-image-wrapper">
                <img src="${imageUrl}" alt="${imageInfo.fileName}" class="cover-image">
                <div class="cover-overlay">
                    <div class="cover-info">
                        <div class="cover-name">${imageInfo.fileName}</div>
                        <div class="cover-size">${this.formatFileSize(imageInfo.size || imageInfo.fileSize)}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 更新Front Matter封面信息
     */
    updateFrontMatterCover(imageInfo) {
        const coverImageInput = document.getElementById('coverImage');
        if (coverImageInput) {
            const imagePath = imageInfo.serverPath || imageInfo.path || `/images/${imageInfo.fileName}`;
            coverImageInput.value = imagePath;
        }
        
        // 如果有Hugo编辑器实例，触发更新
        if (typeof hugoEditor !== 'undefined' && hugoEditor.updatePreview) {
            hugoEditor.updatePreview();
        }
    }
    
    /**
     * 清除封面图片
     */
    clearCoverImage() {
        this.coverImage = null;
        
        // 重置封面预览
        const coverPreview = document.getElementById('coverPreview');
        if (coverPreview) {
            coverPreview.innerHTML = `
                <div class="cover-placeholder">
                    <div class="placeholder-icon">🖼️</div>
                    <div class="placeholder-text">暂无封面图片</div>
                    <div class="placeholder-hint">上传图片并选择"文章封面"用途</div>
                </div>
            `;
        }
        
        // 清除Front Matter
        const coverImageInput = document.getElementById('coverImage');
        if (coverImageInput) {
            coverImageInput.value = '';
        }
        
        this.showToast('封面图片已清除', 'info');
    }
    
    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        // 简单的toast实现
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // 设置颜色
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        toast.style.background = colors[type] || colors.info;
        
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => toast.style.opacity = '1', 100);
        
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
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageUsageManager;
}

// 全局实例
if (typeof window !== 'undefined') {
    window.ImageUsageManager = ImageUsageManager;
}
