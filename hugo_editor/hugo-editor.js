// Hugo Markdown Editor - JavaScript逻辑文件
// 专为Hugo PaperMod主题优化，支持日志和小说内容创作

class HugoEditor {
    constructor() {
        this.currentDocument = {
            title: '',
            content: '',
            frontMatter: {},
            images: []
        };
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAutoSave();
        this.loadFromLocalStorage();
        this.updatePreview();
    }

    setupEventListeners() {
        // 编辑器内容变化
        const editor = document.getElementById('markdownEditor');
        editor.addEventListener('input', () => {
            this.updatePreview();
            this.updateWordCount();
            this.setStatus('编辑中...');
        });

        // 标题变化
        document.getElementById('title').addEventListener('input', (e) => {
            this.currentDocument.title = e.target.value;
            this.autoSave();
        });

        // 标签输入
        this.setupTagInput('categories', 'categoriesTags');
        this.setupTagInput('tags', 'tagsTags');

        // 快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveDocument();
            }
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.exportToHugo();
            }
        });

        // 表单变化监听
        const formElements = ['description', 'contentType', 'draft', 'toc', 'comments', 'showShareButtons'];
        formElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.autoSave());
            }
        });
    }

    setupTagInput(inputId, containerId) {
        const input = document.getElementById(inputId);
        const container = document.getElementById(containerId);
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                e.preventDefault();
                this.addTag(input.value.trim(), container, inputId);
                input.value = '';
                this.autoSave();
            }
        });
    }

    addTag(text, container, type) {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            <span>${text}</span>
            <span class="remove" onclick="this.parentElement.remove(); hugoEditor.autoSave();">&times;</span>
        `;
        container.appendChild(tag);
    }

    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000); // 每30秒自动保存
    }

    autoSave() {
        this.saveToLocalStorage();
        this.setStatus('已自动保存');
    }

    saveToLocalStorage() {
        const data = {
            title: document.getElementById('title').value,
            content: document.getElementById('markdownEditor').value,
            frontMatter: this.collectFrontMatter(),
            images: this.currentDocument.images,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('hugo-editor-draft', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('hugo-editor-draft');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                document.getElementById('title').value = data.title || '';
                document.getElementById('markdownEditor').value = data.content || '';
                this.currentDocument.images = data.images || [];
                
                // 恢复Front Matter
                if (data.frontMatter) {
                    this.restoreFrontMatter(data.frontMatter);
                }
                
                this.updatePreview();
                this.updateWordCount();
                this.renderUploadedImages();
                this.setStatus('已加载草稿');
            } catch (e) {
                console.error('加载草稿失败:', e);
            }
        }
    }

    collectFrontMatter() {
        const fm = {
            title: document.getElementById('title').value,
            date: new Date().toISOString(),
            draft: document.getElementById('draft').checked,
            description: document.getElementById('description').value,
            coverImage: document.getElementById('coverImage').value,
            toc: document.getElementById('toc').checked,
            comments: document.getElementById('comments').checked,
            showShareButtons: document.getElementById('showShareButtons').checked,
            contentType: document.getElementById('contentType').value
        };

        // 收集标签和分类
        fm.categories = this.getTagsFromContainer('categoriesTags');
        fm.tags = this.getTagsFromContainer('tagsTags');

        // 收集特殊字段
        const specialFields = document.querySelectorAll('#specialFields input, #specialFields select, #specialFields textarea');
        specialFields.forEach(field => {
            if (field.type === 'checkbox') {
                fm[field.id] = field.checked;
            } else {
                fm[field.id] = field.value;
            }
        });

        return fm;
    }

    restoreFrontMatter(fm) {
        // 恢复基本字段
        const fields = ['description', 'contentType', 'draft', 'toc', 'comments', 'showShareButtons'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && fm[field] !== undefined) {
                if (element.type === 'checkbox') {
                    element.checked = fm[field];
                } else {
                    element.value = fm[field];
                }
            }
        });

        // 恢复标签和分类
        this.restoreTags(fm.categories || [], 'categoriesTags');
        this.restoreTags(fm.tags || [], 'tagsTags');

        // 更新内容类型相关字段
        this.updateFormByType();
    }

    restoreTags(tags, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        tags.forEach(tag => {
            this.addTag(tag, container, containerId.replace('Tags', ''));
        });
    }

    getTagsFromContainer(containerId) {
        const container = document.getElementById(containerId);
        const tags = [];
        container.querySelectorAll('.tag span:first-child').forEach(span => {
            tags.push(span.textContent);
        });
        return tags;
    }

    updatePreview() {
        const content = document.getElementById('markdownEditor').value;
        const previewContent = document.getElementById('previewContent');
        
        if (content.trim()) {
            // 简单的Markdown渲染（可以集成更完整的Markdown解析器）
            let html = this.simpleMarkdownRender(content);
            previewContent.innerHTML = html;
        } else {
            previewContent.innerHTML = '<p style="color: #999; text-align: center; margin-top: 50px;">实时预览将在这里显示...</p>';
        }
    }

    simpleMarkdownRender(text) {
        // 简单的Markdown渲染实现
        return text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/!\[([^\]]*)\]\(([^\)]*)\)/g, '<img src="$2" alt="$1" />')
            .replace(/\[([^\]]*)\]\(([^\)]*)\)/g, '<a href="$2">$1</a>')
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/`([^`]*)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    updateWordCount() {
        const content = document.getElementById('markdownEditor').value;
        const wordCount = content.length;
        document.getElementById('wordCount').textContent = `字数: ${wordCount}`;
    }

    setStatus(message) {
        document.getElementById('statusText').textContent = message;
        setTimeout(() => {
            document.getElementById('statusText').textContent = '就绪';
        }, 3000);
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 内容类型相关功能
    updateFormByType() {
        const contentType = document.getElementById('contentType').value;
        const specialFields = document.getElementById('specialFields');
        
        let html = '<h3>📝 特殊设置</h3>';
        
        switch (contentType) {
            case 'diary':
                html += `
                    <div class="form-group">
                        <label for="mood">心情</label>
                        <select id="mood">
                            <option value="">选择心情</option>
                            <option value="开心">😊 开心</option>
                            <option value="平静">😌 平静</option>
                            <option value="思考">🤔 思考</option>
                            <option value="感动">🥺 感动</option>
                            <option value="疲惫">😴 疲惫</option>
                            <option value="兴奋">🤩 兴奋</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="location">地点</label>
                        <input type="text" id="location" placeholder="记录地点">
                    </div>
                    <div class="form-group">
                        <label for="weather">天气</label>
                        <input type="text" id="weather" placeholder="今日天气">
                    </div>
                `;
                break;
                
            case 'novel':
                html += `
                    <div class="form-group">
                        <label for="series">系列名称</label>
                        <input type="text" id="series" placeholder="小说系列名">
                    </div>
                    <div class="form-group">
                        <label for="chapter">章节号</label>
                        <input type="number" id="chapter" placeholder="章节编号">
                    </div>
                    <div class="form-group">
                        <label for="characters">主要角色</label>
                        <input type="text" id="characters" placeholder="角色名，用逗号分隔">
                    </div>
                `;
                break;
                
            case 'photo':
                html += `
                    <div class="form-group">
                        <label for="photoTheme">图片主题</label>
                        <input type="text" id="photoTheme" placeholder="图片集主题">
                    </div>
                    <div class="form-group">
                        <label for="shootingDate">拍摄日期</label>
                        <input type="date" id="shootingDate">
                    </div>
                    <div class="form-group">
                        <label for="camera">拍摄设备</label>
                        <input type="text" id="camera" placeholder="相机或设备信息">
                    </div>
                `;
                break;
        }
        
        specialFields.innerHTML = html;
    }

    // 图片处理功能
    async handleImageUpload(event) {
        const files = Array.from(event.target.files);

        if (files.length === 0) return;

        this.setStatus('正在上传图片...');

        try {
            // 尝试使用文件服务器上传
            const uploadedImages = await this.uploadImagesToServer(files);

            // 将上传成功的图片添加到当前文档
            uploadedImages.forEach(imageInfo => {
                const imageData = {
                    id: Date.now() + Math.random(),
                    name: imageInfo.originalName,
                    filename: imageInfo.filename,
                    size: imageInfo.size,
                    webPath: imageInfo.webPath,
                    markdownRef: imageInfo.markdownRef,
                    category: imageInfo.category,
                    uploadedToServer: true
                };

                this.currentDocument.images.push(imageData);
            });

            this.renderUploadedImages();
            this.autoSave();
            this.showToast(`成功上传 ${uploadedImages.length} 张图片`, 'success');
            this.setStatus('图片上传完成');

        } catch (error) {
            console.warn('服务器上传失败，使用本地模式:', error);
            // 降级到本地Base64模式
            await this.handleImageUploadLocal(files);
        }
    }

    async uploadImagesToServer(files) {
        // 检查文件服务器状态
        const healthResponse = await fetch('http://127.0.0.1:8081/health');
        if (!healthResponse.ok) {
            throw new Error('文件服务器不可用');
        }

        // 准备FormData
        const formData = new FormData();
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                formData.append('images', file);
            }
        });

        // 添加分类信息
        const contentType = document.getElementById('contentType').value;
        const title = document.getElementById('title').value;
        const articleSlug = title ? this.generateSlug(title) : null;

        formData.append('category', contentType === 'photo' ? 'gallery' : 'posts');
        if (articleSlug) {
            formData.append('articleSlug', articleSlug);
        }

        // 上传图片
        const response = await fetch('http://127.0.0.1:8081/api/images/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || '图片上传失败');
        }

        return result.images;
    }

    async handleImageUploadLocal(files) {
        // 本地Base64模式（降级方案）
        const promises = files.map(file => {
            return new Promise((resolve) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const imageData = {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            data: e.target.result,
                            id: Date.now() + Math.random(),
                            uploadedToServer: false
                        };

                        this.currentDocument.images.push(imageData);
                        resolve(imageData);
                    };
                    reader.readAsDataURL(file);
                } else {
                    resolve(null);
                }
            });
        });

        const results = await Promise.all(promises);
        const validImages = results.filter(img => img !== null);

        this.renderUploadedImages();
        this.autoSave();
        this.showToast(`本地上传 ${validImages.length} 张图片（Base64模式）`, 'warning');
        this.setStatus('本地图片上传完成');
    }

    renderUploadedImages() {
        const container = document.getElementById('uploadedImages');

        if (this.currentDocument.images.length === 0) {
            container.innerHTML = '<p style="color: #999; font-size: 12px;">暂无上传的图片</p>';
            return;
        }

        container.innerHTML = this.currentDocument.images.map(img => {
            const imageSource = img.uploadedToServer ?
                `http://127.0.0.1:8081${img.webPath}` :
                img.data;

            const statusBadge = img.uploadedToServer ?
                '<span class="badge badge-success">已上传</span>' :
                '<span class="badge badge-warning">本地</span>';

            return `
                <div class="image-item">
                    <img src="${imageSource}" alt="${img.name}" style="max-width: 100px; max-height: 100px; object-fit: cover;">
                    <div class="info">
                        <div>${img.name}</div>
                        <div style="color: #999; font-size: 11px;">
                            ${this.formatFileSize(img.size)} ${statusBadge}
                        </div>
                        ${img.category ? `<div style="color: #666; font-size: 10px;">分类: ${img.category}</div>` : ''}
                    </div>
                    <div class="actions">
                        <button class="btn btn-primary btn-sm" onclick="hugoEditor.insertImage('${img.id}')">插入</button>
                        <button class="btn btn-warning btn-sm" onclick="hugoEditor.removeImage('${img.id}')">删除</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    insertImage(imageId) {
        const image = this.currentDocument.images.find(img => img.id == imageId);
        if (image) {
            const editor = document.getElementById('markdownEditor');

            let markdownImage;
            if (image.uploadedToServer && image.markdownRef) {
                // 使用服务器生成的Markdown引用
                markdownImage = `${image.markdownRef}\n\n`;
            } else if (image.uploadedToServer && image.webPath) {
                // 使用服务器路径
                const altText = image.name.replace(/\.[^/.]+$/, ""); // 移除扩展名
                markdownImage = `![${altText}](${image.webPath})\n\n`;
            } else {
                // 本地模式，生成传统路径
                const imagePath = `/images/${this.generateImageFileName(image)}`;
                markdownImage = `![${image.name}](${imagePath})\n\n`;
            }

            const cursorPos = editor.selectionStart;
            const textBefore = editor.value.substring(0, cursorPos);
            const textAfter = editor.value.substring(cursorPos);

            editor.value = textBefore + markdownImage + textAfter;
            editor.focus();
            editor.setSelectionRange(cursorPos + markdownImage.length, cursorPos + markdownImage.length);

            this.updatePreview();
            this.updateWordCount();
            this.showToast('图片已插入到编辑器');
        }
    }

    removeImage(imageId) {
        this.currentDocument.images = this.currentDocument.images.filter(img => img.id != imageId);
        this.renderUploadedImages();
        this.autoSave();
        this.showToast('图片已删除');
    }

    generateImageFileName(image) {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
        const ext = image.name.split('.').pop();
        return `${dateStr}-${timeStr}-${Math.random().toString(36).substr(2, 5)}.${ext}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 文档操作功能
    newDocument() {
        if (confirm('创建新文档将清空当前内容，是否继续？')) {
            // 清空所有字段
            document.getElementById('title').value = '';
            document.getElementById('markdownEditor').value = '';
            document.getElementById('description').value = '';
            document.getElementById('categoriesTags').innerHTML = '';
            document.getElementById('tagsTags').innerHTML = '';
            document.getElementById('specialFields').innerHTML = '';
            
            // 重置复选框
            document.getElementById('draft').checked = false;
            document.getElementById('toc').checked = true;
            document.getElementById('comments').checked = true;
            document.getElementById('showShareButtons').checked = true;
            
            // 清空图片
            this.currentDocument.images = [];
            this.renderUploadedImages();
            
            // 重置内容类型
            document.getElementById('contentType').value = 'post';
            this.updateFormByType();
            
            this.updatePreview();
            this.updateWordCount();
            this.setStatus('新文档已创建');
            this.showToast('新文档已创建');
        }
    }

    loadDocument() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt,.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        if (file.name.endsWith('.json')) {
                            // 加载JSON格式的编辑器文件
                            const data = JSON.parse(e.target.result);
                            this.loadDocumentData(data);
                        } else {
                            // 加载Markdown文件
                            this.loadMarkdownFile(e.target.result);
                        }
                        this.showToast(`文件 "${file.name}" 加载成功`);
                    } catch (error) {
                        this.showToast('文件加载失败: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    loadDocumentData(data) {
        document.getElementById('title').value = data.title || '';
        document.getElementById('markdownEditor').value = data.content || '';
        this.currentDocument.images = data.images || [];
        
        if (data.frontMatter) {
            this.restoreFrontMatter(data.frontMatter);
        }
        
        this.updatePreview();
        this.updateWordCount();
        this.renderUploadedImages();
    }

    loadMarkdownFile(content) {
        // 解析Markdown文件的Front Matter
        const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontMatterRegex);
        
        if (match) {
            // 有Front Matter
            const frontMatterText = match[1];
            const markdownContent = match[2];
            
            // 简单解析YAML Front Matter
            const frontMatter = this.parseSimpleYAML(frontMatterText);
            
            document.getElementById('title').value = frontMatter.title || '';
            document.getElementById('markdownEditor').value = markdownContent;
            this.restoreFrontMatter(frontMatter);
        } else {
            // 纯Markdown内容
            document.getElementById('markdownEditor').value = content;
        }
        
        this.updatePreview();
        this.updateWordCount();
    }

    parseSimpleYAML(yamlText) {
        const result = {};
        const lines = yamlText.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/^([^:]+):\s*(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                
                // 处理不同类型的值
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(s => s.trim().replace(/["']/g, ''));
                } else {
                    value = value.replace(/["']/g, '');
                }
                
                result[key] = value;
            }
        });
        
        return result;
    }

    saveDocument() {
        const data = {
            title: document.getElementById('title').value,
            content: document.getElementById('markdownEditor').value,
            frontMatter: this.collectFrontMatter(),
            images: this.currentDocument.images,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.title || 'untitled'}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('文档已保存');
    }

    // 导出功能
    async exportToHugo() {
        const title = document.getElementById('title').value;
        if (!title.trim()) {
            this.showToast('请先输入文章标题', 'error');
            return;
        }

        // 生成文件名
        const date = new Date().toISOString().split('T')[0];
        const slug = this.generateSlug(title);
        const fileName = `${date}-${slug}.md`;

        // 根据内容类型设置默认导出路径
        const contentType = document.getElementById('contentType').value;
        let exportPath;
        switch (contentType) {
            case 'diary':
                exportPath = 'content/diary';
                break;
            case 'novel':
                exportPath = 'content/novel';
                break;
            case 'photo':
                exportPath = 'content/photos';
                break;
            default:
                exportPath = 'content/posts';
        }

        // 尝试使用本地文件服务器直接导出
        try {
            await this.exportViaFileServer(fileName, exportPath);
        } catch (error) {
            console.warn('本地文件服务器不可用，显示导出模态框:', error);
            // 降级到手动导出模式
            document.getElementById('fileName').value = fileName;
            document.getElementById('exportPath').value = exportPath;
            document.getElementById('exportModal').style.display = 'block';
        }
    }

    async exportViaFileServer(fileName, exportPath) {
        this.setStatus('正在导出到 Hugo 项目...');
        try {
            // 收集文章数据
            const frontMatter = this.collectFrontMatter();
            const content = document.getElementById('markdownEditor').value;
            const hugoContent = this.generateHugoMarkdown(frontMatter, content);

            // 发送文件写入请求到统一服务器（8080）
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: hugoContent,
                    filename: fileName,
                    directory: exportPath
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast(`文章已成功导出到: ${fileName}`, 'success');
                this.setStatus('导出成功');
                await this.triggerHugoRebuild();
            } else {
                throw new Error(result.error || '导出失败');
            }
        } catch (error) {
            console.error('统一服务器导出失败:', error);
            this.setStatus('导出失败');
            throw error;
        }
    }

    async triggerHugoRebuild() {
        try {
            // 这里可以添加触发 Hugo 重新构建的逻辑
            // 例如通过 WebSocket 通知或者调用 Hugo 命令
            console.log('可以在这里添加 Hugo 重新构建逻辑');
        } catch (error) {
            console.warn('Hugo 重新构建失败:', error);
        }
    }

    async confirmExport() {
        const fileName = document.getElementById('fileName').value;
        const exportPath = document.getElementById('exportPath').value;

        try {
            // 首先尝试使用文件服务器
            await this.exportViaFileServer(fileName, exportPath);
            document.getElementById('exportModal').style.display = 'none';
        } catch (serverError) {
            console.warn('文件服务器导出失败，尝试其他方式:', serverError);

            try {
                // 检查是否支持File System Access API
                if ('showDirectoryPicker' in window) {
                    await this.exportWithFileSystemAPI();
                } else {
                    // 降级到下载方式
                    this.fallbackExport();
                    this.showToast('浏览器不支持直接文件写入，已切换到下载模式', 'warning');
                }
                document.getElementById('exportModal').style.display = 'none';
            } catch (error) {
                console.error('所有导出方式都失败:', error);
                this.showToast(`导出失败: ${error.message}`, 'error');
                this.fallbackExport();
                document.getElementById('exportModal').style.display = 'none';
            }
        }
    }
    
    async exportWithFileSystemAPI() {
        const frontMatter = this.collectFrontMatter();
        const content = document.getElementById('markdownEditor').value;
        const fileName = document.getElementById('fileName').value;
        
        // 生成Hugo格式的Markdown文件
        const hugoContent = this.generateHugoMarkdown(frontMatter, content);
        
        try {
            // 让用户选择Hugo项目目录
            const dirHandle = await window.showDirectoryPicker();
            
            // 检查是否为Hugo项目
            const isHugoProject = await this.validateHugoProject(dirHandle);
            if (!isHugoProject) {
                this.showToast('所选目录不是有效的Hugo项目', 'error');
                return;
            }
            
            // 获取content目录
            const contentDir = await this.getOrCreateDirectory(dirHandle, 'content');
            
            // 根据内容类型获取子目录
            const exportPath = document.getElementById('exportPath').value;
            const subDirName = exportPath.replace('content/', '') || 'posts';
            const targetDir = await this.getOrCreateDirectory(contentDir, subDirName);
            
            // 写入文件
            const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(hugoContent);
            await writable.close();
            
            this.showToast(`文件已成功保存到Hugo项目: ${fileName}`);
            
            // 处理图片
            if (this.currentDocument.images.length > 0) {
                await this.exportImagesWithFileSystemAPI(dirHandle);
            }
            
            this.closeModal('exportModal');
            
        } catch (error) {
            if (error.name === 'AbortError') {
                this.showToast('用户取消了文件选择', 'info');
            } else {
                throw error;
            }
        }
    }
    
    async validateHugoProject(dirHandle) {
        try {
            // 检查config.yml或config.toml是否存在
            const configFiles = ['config.yml', 'config.yaml', 'config.toml'];
            for (const configFile of configFiles) {
                try {
                    await dirHandle.getFileHandle(configFile);
                    return true;
                } catch (e) {
                    // 继续检查下一个配置文件
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }
    
    async getOrCreateDirectory(parentDir, dirName) {
        try {
            return await parentDir.getDirectoryHandle(dirName);
        } catch (error) {
            // 目录不存在，创建它
            return await parentDir.getDirectoryHandle(dirName, { create: true });
        }
    }
    
    async exportImagesWithFileSystemAPI(projectDir) {
        try {
            // 获取static/images目录
            const staticDir = await this.getOrCreateDirectory(projectDir, 'static');
            const imagesDir = await this.getOrCreateDirectory(staticDir, 'images');
            const postsDir = await this.getOrCreateDirectory(imagesDir, 'posts');
            
            let successCount = 0;
            
            for (const image of this.currentDocument.images) {
                const fileName = this.generateImageFileName(image);
                
                // 将base64转换为blob
                const base64Data = image.data.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                
                // 写入图片文件
                const fileHandle = await postsDir.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(byteArray);
                await writable.close();
                
                successCount++;
            }
            
            if (successCount > 0) {
                this.showToast(`${successCount} 张图片已保存到Hugo项目`);
            }
            
        } catch (error) {
            console.error('图片导出失败:', error);
            this.showToast('图片导出失败，请手动处理', 'error');
        }
    }

    generateHugoMarkdown(frontMatter, content) {
        let yaml = '---\n';
        
        // 基本字段
        yaml += `title: "${frontMatter.title}"\n`;
        yaml += `date: ${frontMatter.date}\n`;
        yaml += `draft: ${frontMatter.draft}\n`;
        
        if (frontMatter.description) {
            yaml += `description: "${frontMatter.description}"\n`;
        }
        
        // 分类和标签
        if (frontMatter.categories && frontMatter.categories.length > 0) {
            yaml += `categories: [${frontMatter.categories.map(c => `"${c}"`).join(', ')}]\n`;
        }
        
        if (frontMatter.tags && frontMatter.tags.length > 0) {
            yaml += `tags: [${frontMatter.tags.map(t => `"${t}"`).join(', ')}]\n`;
        }
        
        // 页面设置
        yaml += `ShowToc: ${frontMatter.toc}\n`;
        yaml += `TocOpen: false\n`;
        yaml += `comments: ${frontMatter.comments}\n`;
        yaml += `ShowShareButtons: ${frontMatter.showShareButtons}\n`;
        
        // 特殊字段
        const specialFields = ['mood', 'location', 'weather', 'series', 'chapter', 'characters', 'photoTheme', 'shootingDate', 'camera'];
        specialFields.forEach(field => {
            if (frontMatter[field]) {
                yaml += `${field}: "${frontMatter[field]}"\n`;
            }
        });
        
        // 封面图片（优先使用设置的封面图片）
        if (frontMatter.coverImage) {
            yaml += `cover:\n`;
            yaml += `    image: "${frontMatter.coverImage}"\n`;
            yaml += `    alt: "${frontMatter.title}"\n`;
            yaml += `    caption: ""\n`;
            yaml += `    relative: false\n`;
        } else if (this.currentDocument.images.length > 0) {
            // 降级：使用第一张上传的图片作为封面
            const firstImage = this.currentDocument.images[0];
            yaml += `cover:\n`;
            yaml += `    image: "/images/${this.generateImageFileName(firstImage)}"\n`;
            yaml += `    alt: "${frontMatter.title}"\n`;
            yaml += `    caption: ""\n`;
            yaml += `    relative: false\n`;
        }
        
        yaml += '---\n\n';
        
        return yaml + content;
    }

    exportImages() {
        this.currentDocument.images.forEach(image => {
            const fileName = this.generateImageFileName(image);
            
            // 将base64转换为blob
            const base64Data = image.data.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: image.type });
            
            // 下载图片
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        });
        
        this.showToast(`${this.currentDocument.images.length} 张图片已导出`);
    }

    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    fallbackExport() {
        const frontMatter = this.collectFrontMatter();
        const content = document.getElementById('markdownEditor').value;
        const fileName = document.getElementById('fileName').value || 'untitled.md';
        const hugoContent = this.generateHugoMarkdown(frontMatter, content);

        const blob = new Blob([hugoContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // UI控制功能
    toggleSplit() {
        const previewPane = document.getElementById('previewPane');
        const splitToggle = document.getElementById('splitToggle');
        
        if (previewPane.style.display === 'none') {
            previewPane.style.display = 'block';
            splitToggle.classList.add('active');
            splitToggle.textContent = '📱 关闭预览';
            this.updatePreview();
        } else {
            previewPane.style.display = 'none';
            splitToggle.classList.remove('active');
            splitToggle.textContent = '📱 分屏预览';
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

// 全局函数
function newDocument() {
    hugoEditor.newDocument();
}

function loadDocument() {
    hugoEditor.loadDocument();
}

function exportToHugo() {
    hugoEditor.exportToHugo();
}

function confirmExport() {
    hugoEditor.confirmExport();
}

function updateFormByType() {
    hugoEditor.updateFormByType();
}

function handleImageUpload(event) {
    hugoEditor.handleImageUpload(event);
}

function toggleSplit() {
    hugoEditor.toggleSplit();
}

function closeModal(modalId) {
    hugoEditor.closeModal(modalId);
}

// 初始化编辑器
const hugoEditor = new HugoEditor();

// 全局变量
let markdownValidator;

// 在现有的初始化函数中添加
function initializeEditor() {
    // 初始化Markdown验证器
    markdownValidator = new MarkdownValidator();
}

// 显示Markdown验证器的函数
function showMarkdownValidator() {
    if (markdownValidator) {
        markdownValidator.showValidator();
    }
}

function updateFormByType() {
    hugoEditor.updateFormByType();
}

function handleImageUpload(event) {
    hugoEditor.handleImageUpload(event);
}

function toggleSplit() {
    hugoEditor.toggleSplit();
}

function closeModal(modalId) {
    hugoEditor.closeModal(modalId);
}
