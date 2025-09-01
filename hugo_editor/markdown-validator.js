/**
 * Markdown文档导入和格式验证模块
 * 用于验证Markdown文档是否符合Hugo格式规范
 */
class MarkdownValidator {
    constructor() {
        this.validationRules = {
            frontMatter: {
                required: ['title', 'date'],
                optional: ['tags', 'categories', 'description', 'draft', 'weight']
            },
            filename: {
                pattern: /^\d{4}-\d{2}-\d{2}-.+\.md$/,
                maxLength: 100
            },
            content: {
                maxImageSize: 5 * 1024 * 1024, // 5MB
                allowedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
            }
        };
        this.validationResults = [];
        this.init();
    }

    /**
     * 初始化验证器
     */
    init() {
        this.createValidatorUI();
        this.bindEvents();
    }

    /**
     * 创建验证器用户界面
     */
    createValidatorUI() {
        const validatorHTML = `
            <div id="markdown-validator" class="validator-container" style="display: none;">
                <div class="validator-header">
                    <h3>📄 Markdown文档导入和验证</h3>
                    <button class="close-validator" title="关闭">&times;</button>
                </div>
                
                <div class="import-section">
                    <div class="import-methods">
                        <div class="file-input-wrapper">
                            <input type="file" id="markdown-file-input" multiple accept=".md,.markdown" style="display: none;">
                            <button class="import-btn file-select-btn">
                                📁 选择Markdown文件
                            </button>
                        </div>
                        
                        <div class="drag-drop-area" id="markdown-drop-area">
                            <div class="drop-content">
                                <div class="drop-icon">📄</div>
                                <p>拖拽Markdown文件到这里</p>
                                <small>支持 .md 和 .markdown 文件</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="validation-section">
                    <div class="validation-controls">
                        <button class="validate-btn" disabled>
                            🔍 开始验证
                        </button>
                        <button class="auto-fix-btn" disabled>
                            🔧 自动修复
                        </button>
                        <button class="export-report-btn" disabled>
                            📊 导出报告
                        </button>
                    </div>
                    
                    <div class="validation-results" id="validation-results">
                        <div class="no-files-message">
                            <p>请先导入Markdown文件</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', validatorHTML);
        this.addValidatorStyles();
    }

    /**
     * 添加验证器样式
     */
    addValidatorStyles() {
        const styles = `
            <style id="markdown-validator-styles">
                .validator-container {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 90%;
                    max-width: 800px;
                    max-height: 80vh;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                .validator-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .validator-header h3 {
                    margin: 0;
                    font-size: 18px;
                }
                
                .close-validator {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 0.2s;
                }
                
                .close-validator:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                
                .import-section {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                }
                
                .import-methods {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                }
                
                .file-select-btn {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                }
                
                .file-select-btn:hover {
                    background: #45a049;
                }
                
                .drag-drop-area {
                    flex: 1;
                    border: 2px dashed #ddd;
                    border-radius: 8px;
                    padding: 30px;
                    text-align: center;
                    transition: all 0.2s;
                    background: #fafafa;
                }
                
                .drag-drop-area.drag-over {
                    border-color: #4CAF50;
                    background: #f0f8f0;
                }
                
                .drop-content .drop-icon {
                    font-size: 48px;
                    margin-bottom: 10px;
                }
                
                .drop-content p {
                    margin: 10px 0 5px 0;
                    font-size: 16px;
                    color: #333;
                }
                
                .drop-content small {
                    color: #666;
                }
                
                .validation-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .validation-controls {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    gap: 10px;
                }
                
                .validation-controls button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .validate-btn {
                    background: #2196F3;
                    color: white;
                }
                
                .validate-btn:hover:not(:disabled) {
                    background: #1976D2;
                }
                
                .auto-fix-btn {
                    background: #FF9800;
                    color: white;
                }
                
                .auto-fix-btn:hover:not(:disabled) {
                    background: #F57C00;
                }
                
                .export-report-btn {
                    background: #9C27B0;
                    color: white;
                }
                
                .export-report-btn:hover:not(:disabled) {
                    background: #7B1FA2;
                }
                
                .validation-controls button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .validation-results {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                }
                
                .no-files-message {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                }
                
                .file-result {
                    margin-bottom: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .file-header {
                    background: #f5f5f5;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                }
                
                .file-name {
                    font-weight: bold;
                    color: #333;
                }
                
                .file-status {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                .status-valid {
                    background: #4CAF50;
                    color: white;
                }
                
                .status-warning {
                    background: #FF9800;
                    color: white;
                }
                
                .status-error {
                    background: #f44336;
                    color: white;
                }
                
                .file-details {
                    padding: 15px;
                    display: none;
                }
                
                .file-details.expanded {
                    display: block;
                }
                
                .validation-item {
                    margin-bottom: 10px;
                    padding: 10px;
                    border-radius: 4px;
                    border-left: 4px solid;
                }
                
                .validation-error {
                    background: #ffebee;
                    border-left-color: #f44336;
                }
                
                .validation-warning {
                    background: #fff3e0;
                    border-left-color: #FF9800;
                }
                
                .validation-success {
                    background: #e8f5e8;
                    border-left-color: #4CAF50;
                }
                
                .validation-item-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .validation-item-description {
                    color: #666;
                    font-size: 14px;
                }
                
                .fix-suggestion {
                    margin-top: 8px;
                    padding: 8px;
                    background: rgba(33, 150, 243, 0.1);
                    border-radius: 4px;
                    font-size: 13px;
                }
                
                .fix-suggestion strong {
                    color: #1976D2;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 关闭验证器
        document.querySelector('.close-validator').addEventListener('click', () => {
            this.hideValidator();
        });
        
        // 文件选择
        const fileInput = document.getElementById('markdown-file-input');
        const fileSelectBtn = document.querySelector('.file-select-btn');
        
        fileSelectBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });
        
        // 拖拽功能
        const dropArea = document.getElementById('markdown-drop-area');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('drag-over');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('drag-over');
            }, false);
        });
        
        dropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelect(files);
        }, false);
        
        // 验证按钮
        document.querySelector('.validate-btn').addEventListener('click', () => {
            this.validateFiles();
        });
        
        // 自动修复按钮
        document.querySelector('.auto-fix-btn').addEventListener('click', () => {
            this.autoFixFiles();
        });
        
        // 导出报告按钮
        document.querySelector('.export-report-btn').addEventListener('click', () => {
            this.exportReport();
        });
    }

    /**
     * 阻止默认拖拽行为
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * 显示验证器
     */
    showValidator() {
        document.getElementById('markdown-validator').style.display = 'flex';
    }

    /**
     * 隐藏验证器
     */
    hideValidator() {
        document.getElementById('markdown-validator').style.display = 'none';
        this.resetValidator();
    }

    /**
     * 重置验证器状态
     */
    resetValidator() {
        this.validationResults = [];
        document.getElementById('markdown-file-input').value = '';
        document.querySelector('.validate-btn').disabled = true;
        document.querySelector('.auto-fix-btn').disabled = true;
        document.querySelector('.export-report-btn').disabled = true;
        
        const resultsContainer = document.getElementById('validation-results');
        resultsContainer.innerHTML = `
            <div class="no-files-message">
                <p>请先导入Markdown文件</p>
            </div>
        `;
    }

    /**
     * 处理文件选择
     */
    async handleFileSelect(files) {
        const markdownFiles = Array.from(files).filter(file => 
            file.name.endsWith('.md') || file.name.endsWith('.markdown')
        );
        
        if (markdownFiles.length === 0) {
            alert('请选择有效的Markdown文件（.md 或 .markdown）');
            return;
        }
        
        this.importedFiles = [];
        
        for (const file of markdownFiles) {
            try {
                const content = await this.readFileContent(file);
                this.importedFiles.push({
                    file: file,
                    name: file.name,
                    content: content,
                    size: file.size,
                    lastModified: new Date(file.lastModified)
                });
            } catch (error) {
                console.error(`读取文件 ${file.name} 失败:`, error);
            }
        }
        
        this.updateFileList();
        document.querySelector('.validate-btn').disabled = false;
    }

    /**
     * 读取文件内容
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * 更新文件列表显示
     */
    updateFileList() {
        const resultsContainer = document.getElementById('validation-results');
        
        if (this.importedFiles.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-files-message">
                    <p>请先导入Markdown文件</p>
                </div>
            `;
            return;
        }
        
        const fileListHTML = `
            <div class="imported-files">
                <h4>已导入的文件 (${this.importedFiles.length})</h4>
                ${this.importedFiles.map((fileData, index) => `
                    <div class="file-item">
                        <div class="file-info">
                            <span class="file-name">📄 ${fileData.name}</span>
                            <span class="file-size">(${this.formatFileSize(fileData.size)})</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        resultsContainer.innerHTML = fileListHTML;
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
     * 验证所有文件
     */
    async validateFiles() {
        if (!this.importedFiles || this.importedFiles.length === 0) {
            alert('请先导入Markdown文件');
            return;
        }
        
        document.querySelector('.validate-btn').disabled = true;
        document.querySelector('.validate-btn').textContent = '🔍 验证中...';
        
        this.validationResults = [];
        
        for (const fileData of this.importedFiles) {
            const result = await this.validateSingleFile(fileData);
            this.validationResults.push(result);
        }
        
        this.displayValidationResults();
        
        document.querySelector('.validate-btn').disabled = false;
        document.querySelector('.validate-btn').textContent = '🔍 开始验证';
        document.querySelector('.auto-fix-btn').disabled = false;
        document.querySelector('.export-report-btn').disabled = false;
    }

    /**
     * 验证单个文件
     */
    async validateSingleFile(fileData) {
        const result = {
            fileName: fileData.name,
            fileSize: fileData.size,
            lastModified: fileData.lastModified,
            issues: [],
            status: 'valid' // valid, warning, error
        };
        
        // 解析Front Matter
        const { frontMatter, content } = this.parseFrontMatter(fileData.content);
        result.frontMatter = frontMatter;
        result.content = content;
        
        // 验证文件名
        this.validateFileName(fileData.name, result);
        
        // 验证Front Matter
        this.validateFrontMatter(frontMatter, result);
        
        // 验证内容
        this.validateContent(content, result);
        
        // 确定整体状态
        const hasErrors = result.issues.some(issue => issue.level === 'error');
        const hasWarnings = result.issues.some(issue => issue.level === 'warning');
        
        if (hasErrors) {
            result.status = 'error';
        } else if (hasWarnings) {
            result.status = 'warning';
        }
        
        return result;
    }

    /**
     * 解析Front Matter
     */
    parseFrontMatter(content) {
        const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontMatterRegex);
        
        if (!match) {
            return {
                frontMatter: null,
                content: content
            };
        }
        
        try {
            // 简单的YAML解析（仅支持基本格式）
            const yamlContent = match[1];
            const frontMatter = {};
            
            yamlContent.split('\n').forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim();
                    
                    // 移除引号
                    if ((value.startsWith('"') && value.endsWith('"')) || 
                        (value.startsWith("'") && value.endsWith("'"))) {
                        frontMatter[key] = value.slice(1, -1);
                    } else if (value === 'true' || value === 'false') {
                        frontMatter[key] = value === 'true';
                    } else if (!isNaN(value) && value !== '') {
                        frontMatter[key] = Number(value);
                    } else {
                        frontMatter[key] = value;
                    }
                }
            });
            
            return {
                frontMatter: frontMatter,
                content: match[2]
            };
        } catch (error) {
            return {
                frontMatter: null,
                content: content,
                parseError: error.message
            };
        }
    }

    /**
     * 验证文件名
     */
    validateFileName(fileName, result) {
        // 检查文件名格式
        if (!this.validationRules.filename.pattern.test(fileName)) {
            result.issues.push({
                level: 'warning',
                category: 'filename',
                title: '文件名格式不规范',
                description: `文件名 "${fileName}" 不符合Hugo推荐的格式 "YYYY-MM-DD-title.md"`,
                suggestion: '建议使用格式：2024-01-01-your-post-title.md'
            });
        }
        
        // 检查文件名长度
        if (fileName.length > this.validationRules.filename.maxLength) {
            result.issues.push({
                level: 'warning',
                category: 'filename',
                title: '文件名过长',
                description: `文件名长度 ${fileName.length} 字符，建议不超过 ${this.validationRules.filename.maxLength} 字符`,
                suggestion: '缩短文件名以提高可读性和兼容性'
            });
        }
        
        // 检查特殊字符
        const invalidChars = fileName.match(/[<>:"|?*\\]/g);
        if (invalidChars) {
            result.issues.push({
                level: 'error',
                category: 'filename',
                title: '文件名包含无效字符',
                description: `文件名包含无效字符: ${invalidChars.join(', ')}`,
                suggestion: '移除或替换这些字符：< > : " | ? * \\'
            });
        }
    }

    /**
     * 验证Front Matter
     */
    validateFrontMatter(frontMatter, result) {
        if (!frontMatter) {
            result.issues.push({
                level: 'error',
                category: 'frontmatter',
                title: '缺少Front Matter',
                description: 'Markdown文件必须包含Front Matter部分',
                suggestion: '在文件开头添加Front Matter，格式：\n---\ntitle: "文章标题"\ndate: 2024-01-01\n---'
            });
            return;
        }
        
        // 检查必需字段
        this.validationRules.frontMatter.required.forEach(field => {
            if (!frontMatter[field]) {
                result.issues.push({
                    level: 'error',
                    category: 'frontmatter',
                    title: `缺少必需字段: ${field}`,
                    description: `Front Matter中缺少必需的 "${field}" 字段`,
                    suggestion: `添加 ${field} 字段到Front Matter中`
                });
            }
        });
        
        // 验证日期格式
        if (frontMatter.date) {
            const dateStr = frontMatter.date.toString();
            const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)?)?$/;
            if (!dateRegex.test(dateStr)) {
                result.issues.push({
                    level: 'warning',
                    category: 'frontmatter',
                    title: '日期格式不规范',
                    description: `日期 "${dateStr}" 格式不规范`,
                    suggestion: '使用ISO 8601格式：YYYY-MM-DD 或 YYYY-MM-DDTHH:MM:SS'
                });
            }
        }
        
        // 验证标题
        if (frontMatter.title) {
            if (frontMatter.title.length > 100) {
                result.issues.push({
                    level: 'warning',
                    category: 'frontmatter',
                    title: '标题过长',
                    description: `标题长度 ${frontMatter.title.length} 字符，建议不超过100字符`,
                    suggestion: '缩短标题以提高SEO效果'
                });
            }
        }
        
        // 检查draft字段
        if (frontMatter.draft === true) {
            result.issues.push({
                level: 'info',
                category: 'frontmatter',
                title: '草稿状态',
                description: '文章标记为草稿，不会在生产环境中显示',
                suggestion: '发布时将draft设置为false或删除该字段'
            });
        }
    }

    /**
     * 验证内容
     */
    validateContent(content, result) {
        if (!content || content.trim().length === 0) {
            result.issues.push({
                level: 'warning',
                category: 'content',
                title: '内容为空',
                description: '文章内容为空',
                suggestion: '添加文章内容'
            });
            return;
        }
        
        // 检查图片链接
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let imageMatch;
        
        while ((imageMatch = imageRegex.exec(content)) !== null) {
            const imagePath = imageMatch[2];
            
            // 检查是否为相对路径
            if (!imagePath.startsWith('http') && !imagePath.startsWith('/')) {
                result.issues.push({
                    level: 'info',
                    category: 'content',
                    title: '图片使用相对路径',
                    description: `图片 "${imagePath}" 使用相对路径`,
                    suggestion: '确保图片文件存在于正确的位置，或使用绝对路径'
                });
            }
            
            // 检查图片格式
            const extension = imagePath.split('.').pop().toLowerCase();
            if (!this.validationRules.content.allowedImageFormats.includes(extension)) {
                result.issues.push({
                    level: 'warning',
                    category: 'content',
                    title: '不推荐的图片格式',
                    description: `图片格式 "${extension}" 可能不被所有浏览器支持`,
                    suggestion: `推荐使用: ${this.validationRules.content.allowedImageFormats.join(', ')}`
                });
            }
        }
        
        // 检查内部链接
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let linkMatch;
        
        while ((linkMatch = linkRegex.exec(content)) !== null) {
            const linkPath = linkMatch[2];
            
            // 跳过外部链接和图片
            if (linkPath.startsWith('http') || linkPath.startsWith('#') || linkMatch[0].startsWith('![')) {
                continue;
            }
            
            result.issues.push({
                level: 'info',
                category: 'content',
                title: '内部链接检测',
                description: `发现内部链接: "${linkPath}"`,
                suggestion: '确保链接目标文件存在且路径正确'
            });
        }
        
        // 检查标题层级
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        const headings = [];
        let headingMatch;
        
        while ((headingMatch = headingRegex.exec(content)) !== null) {
            headings.push({
                level: headingMatch[1].length,
                text: headingMatch[2]
            });
        }
        
        // 检查是否跳级
        for (let i = 1; i < headings.length; i++) {
            const prevLevel = headings[i - 1].level;
            const currentLevel = headings[i].level;
            
            if (currentLevel > prevLevel + 1) {
                result.issues.push({
                    level: 'warning',
                    category: 'content',
                    title: '标题层级跳跃',
                    description: `标题 "${headings[i].text}" 从 H${prevLevel} 跳跃到 H${currentLevel}`,
                    suggestion: '保持标题层级的连续性，避免跳级'
                });
            }
        }
    }

    /**
     * 显示验证结果
     */
    displayValidationResults() {
        const resultsContainer = document.getElementById('validation-results');
        
        if (this.validationResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-files-message">
                    <p>没有验证结果</p>
                </div>
            `;
            return;
        }
        
        const resultsHTML = `
            <div class="validation-summary">
                <h4>验证结果</h4>
                <div class="summary-stats">
                    <span class="stat-item">
                        📄 总文件数: ${this.validationResults.length}
                    </span>
                    <span class="stat-item">
                        ✅ 通过: ${this.validationResults.filter(r => r.status === 'valid').length}
                    </span>
                    <span class="stat-item">
                        ⚠️ 警告: ${this.validationResults.filter(r => r.status === 'warning').length}
                    </span>
                    <span class="stat-item">
                        ❌ 错误: ${this.validationResults.filter(r => r.status === 'error').length}
                    </span>
                </div>
            </div>
            
            <div class="results-list">
                ${this.validationResults.map((result, index) => this.renderFileResult(result, index)).join('')}
            </div>
        `;
        
        resultsContainer.innerHTML = resultsHTML;
        
        // 绑定展开/收起事件
        document.querySelectorAll('.file-header').forEach(header => {
            header.addEventListener('click', () => {
                const details = header.nextElementSibling;
                const isExpanded = details.classList.contains('expanded');
                
                details.classList.toggle('expanded', !isExpanded);
                
                const arrow = header.querySelector('.expand-arrow');
                arrow.textContent = isExpanded ? '▶' : '▼';
            });
        });
    }

    /**
     * 渲染单个文件结果
     */
    renderFileResult(result, index) {
        const statusClass = `status-${result.status}`;
        const statusText = {
            'valid': '✅ 通过',
            'warning': '⚠️ 警告',
            'error': '❌ 错误'
        }[result.status];
        
        const issuesByCategory = {};
        result.issues.forEach(issue => {
            if (!issuesByCategory[issue.category]) {
                issuesByCategory[issue.category] = [];
            }
            issuesByCategory[issue.category].push(issue);
        });
        
        return `
            <div class="file-result">
                <div class="file-header">
                    <div class="file-info">
                        <span class="file-name">${result.fileName}</span>
                        <small class="file-meta">
                            ${this.formatFileSize(result.fileSize)} • 
                            ${result.lastModified.toLocaleDateString()}
                        </small>
                    </div>
                    <div class="file-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <span class="issue-count">${result.issues.length} 项</span>
                        <span class="expand-arrow">▶</span>
                    </div>
                </div>
                
                <div class="file-details">
                    ${result.issues.length === 0 ? 
                        '<div class="validation-item validation-success"><div class="validation-item-title">✅ 验证通过</div><div class="validation-item-description">该文件符合Hugo格式规范</div></div>' :
                        Object.entries(issuesByCategory).map(([category, issues]) => `
                            <div class="category-section">
                                <h5>${this.getCategoryTitle(category)}</h5>
                                ${issues.map(issue => this.renderValidationItem(issue)).join('')}
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
    }

    /**
     * 获取分类标题
     */
    getCategoryTitle(category) {
        const titles = {
            'filename': '📝 文件名',
            'frontmatter': '📋 Front Matter',
            'content': '📄 内容'
        };
        return titles[category] || category;
    }

    /**
     * 渲染验证项
     */
    renderValidationItem(issue) {
        const levelClass = `validation-${issue.level}`;
        const levelIcon = {
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        }[issue.level];
        
        return `
            <div class="validation-item ${levelClass}">
                <div class="validation-item-title">
                    ${levelIcon} ${issue.title}
                </div>
                <div class="validation-item-description">
                    ${issue.description}
                </div>
                ${issue.suggestion ? `
                    <div class="fix-suggestion">
                        <strong>建议:</strong> ${issue.suggestion}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * 自动修复文件
     */
    async autoFixFiles() {
        if (!this.validationResults || this.validationResults.length === 0) {
            alert('请先进行验证');
            return;
        }
        
        const fixableIssues = this.validationResults.reduce((total, result) => {
            return total + result.issues.filter(issue => this.canAutoFix(issue)).length;
        }, 0);
        
        if (fixableIssues === 0) {
            alert('没有可以自动修复的问题');
            return;
        }
        
        const confirmed = confirm(`发现 ${fixableIssues} 个可自动修复的问题，是否继续？`);
        if (!confirmed) return;
        
        document.querySelector('.auto-fix-btn').disabled = true;
        document.querySelector('.auto-fix-btn').textContent = '🔧 修复中...';
        
        const fixedFiles = [];
        
        for (const result of this.validationResults) {
            const fixedContent = await this.fixSingleFile(result);
            if (fixedContent) {
                fixedFiles.push({
                    name: result.fileName,
                    content: fixedContent
                });
            }
        }
        
        if (fixedFiles.length > 0) {
            this.downloadFixedFiles(fixedFiles);
        }
        
        document.querySelector('.auto-fix-btn').disabled = false;
        document.querySelector('.auto-fix-btn').textContent = '🔧 自动修复';
    }

    /**
     * 检查问题是否可以自动修复
     */
    canAutoFix(issue) {
        const fixableTypes = [
            'frontmatter-missing-field',
            'frontmatter-date-format',
            'filename-format'
        ];
        return fixableTypes.includes(issue.type);
    }

    /**
     * 修复单个文件
     */
    async fixSingleFile(result) {
        // 这里实现具体的修复逻辑
        // 由于篇幅限制，这里只是示例
        let content = this.importedFiles.find(f => f.name === result.fileName)?.content;
        if (!content) return null;
        
        // 修复Front Matter
        if (!result.frontMatter) {
            const title = result.fileName.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
            const frontMatter = `---
title: "${title}"
date: ${new Date().toISOString().split('T')[0]}
draft: false
---

`;
            content = frontMatter + content;
        }
        
        return content;
    }

    /**
     * 下载修复后的文件
     */
    downloadFixedFiles(fixedFiles) {
        fixedFiles.forEach(file => {
            const blob = new Blob([file.content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fixed-${file.name}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        
        alert(`已下载 ${fixedFiles.length} 个修复后的文件`);
    }

    /**
     * 导出验证报告
     */
    exportReport() {
        if (!this.validationResults || this.validationResults.length === 0) {
            alert('没有验证结果可导出');
            return;
        }
        
        const report = this.generateReport();
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `validation-report-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 生成验证报告
     */
    generateReport() {
        const totalFiles = this.validationResults.length;
        const validFiles = this.validationResults.filter(r => r.status === 'valid').length;
        const warningFiles = this.validationResults.filter(r => r.status === 'warning').length;
        const errorFiles = this.validationResults.filter(r => r.status === 'error').length;
        
        let report = `# Markdown文档验证报告

`;
        report += `**生成时间:** ${new Date().toLocaleString()}

`;
        report += `## 概览

`;
        report += `- 总文件数: ${totalFiles}
`;
        report += `- 通过验证: ${validFiles}
`;
        report += `- 存在警告: ${warningFiles}
`;
        report += `- 存在错误: ${errorFiles}

`;
        
        report += `## 详细结果

`;
        
        this.validationResults.forEach((result, index) => {
            report += `### ${index + 1}. ${result.fileName}

`;
            report += `**状态:** ${result.status === 'valid' ? '✅ 通过' : result.status === 'warning' ? '⚠️ 警告' : '❌ 错误'}

`;
            
            if (result.issues.length > 0) {
                report += `**问题列表:**

`;
                result.issues.forEach((issue, issueIndex) => {
                    const icon = issue.level === 'error' ? '❌' : issue.level === 'warning' ? '⚠️' : 'ℹ️';
                    report += `${issueIndex + 1}. ${icon} **${issue.title}**
`;
                    report += `   - ${issue.description}
`;
                    if (issue.suggestion) {
                        report += `   - 建议: ${issue.suggestion}
`;
                    }
                    report += `
`;
                });
            } else {
                report += `✅ 该文件通过所有验证检查

`;
            }
            
            report += `---

`;
        });
        
        return report;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownValidator;
} else if (typeof window !== 'undefined') {
    window.MarkdownValidator = MarkdownValidator;
}