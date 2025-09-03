/**
 * Hugo编辑器增强功能模块 - 升级版
 * 提供编辑器样式增强、快捷工具栏、字数统计、自动保存、模板管理等功能
 * @version 2.0.0
 */
class EditorEnhancements {
    constructor(options = {}) {
        this.options = {
            enableQuickInsert: true,
            enableWordCount: true,
            autoSave: true,
            autoSaveInterval: 30000, // 30秒
            enableKeyboardShortcuts: true,
            enableDarkMode: true,
            enableResponsiveLayout: true,
            enableScrollSync: true,
            enableTemplates: true,
            enableFileServer: true,
            serverUrl: 'http://127.0.0.1:8080',
            ...options
        };

        this.editor = null;
        this.wordCount = 0;
        this.readingTime = 0;
        this.autoSaveTimer = null;
        this.lastSaveContent = '';
        this.templates = new Map();
        this.serverAvailable = false;

        // 绑定方法上下文
        this.updateWordCount = this.updateWordCount.bind(this);
        this.scheduleAutoSave = this.scheduleAutoSave.bind(this);
        this.syncScrollPosition = this.syncScrollPosition.bind(this);
        this.checkServerStatus = this.checkServerStatus.bind(this);
    }
    
    /**
     * 初始化编辑器增强功能
     */
    init() {
        this.editor = document.getElementById('content');
        if (!this.editor) return;
        
        this.setupEditor();
        this.enhanceEditorStyles();
        this.createToolbar();
        this.setupWordCount();
        this.setupAutoSave();
        this.setupKeyboardShortcuts();
        this.setupDarkMode();
        this.setupResponsiveLayout();
    }
    
    /**
     * 设置编辑器基础功能
     */
    setupEditor() {
        if (!this.editor) return;
        
        // 监听内容变化
        this.editor.addEventListener('input', () => {
            this.updateWordCount();
            this.scheduleAutoSave();
        });
        
        // 监听滚动同步
        if (this.options.enableScrollSync) {
            this.editor.addEventListener('scroll', this.syncScrollPosition);
        }
        
        // 恢复自动保存的内容
        this.restoreAutoSave();
    }
    
    /**
     * 增强编辑器样式
     */
    enhanceEditorStyles() {
        if (!this.editor) return;
        
        // 添加编辑器增强样式
        this.editor.style.fontFamily = 'Consolas, "Courier New", monospace';
        this.editor.style.lineHeight = '1.6';
        this.editor.style.fontSize = '14px';
        
        const style = document.createElement('style');
        style.textContent = `
            #content {
                transition: all 0.3s ease;
                border: none;
                outline: none;
                resize: vertical;
                background: #fafafa;
                color: #333;
                padding: 20px;
            }
            
            #content:focus {
                background: #fff;
                box-shadow: 0 0 10px rgba(0,123,255,0.1);
            }
            
            .dark-mode #content {
                background: #2d2d2d;
                color: #e0e0e0;
            }
            
            .dark-mode #content:focus {
                background: #333;
                box-shadow: 0 0 10px rgba(77,171,247,0.2);
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 创建快捷工具栏
     */
    createToolbar() {
        if (!this.options.enableQuickInsert) return;
        
        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-group">
                <button class="toolbar-btn" data-action="bold" title="粗体 (Ctrl+B)">
                    <strong>B</strong>
                </button>
                <button class="toolbar-btn" data-action="italic" title="斜体 (Ctrl+I)">
                    <em>I</em>
                </button>
                <button class="toolbar-btn" data-action="strikethrough" title="删除线">
                    <s>S</s>
                </button>
            </div>
            <div class="toolbar-group">
                <button class="toolbar-btn" data-action="heading" title="标题 (Ctrl+H)">
                    H1
                </button>
                <button class="toolbar-btn" data-action="quote" title="引用 (Ctrl+Q)">
                    &quot;
                </button>
                <button class="toolbar-btn" data-action="code" title="代码">
                    &lt;/&gt;
                </button>
            </div>
            <div class="toolbar-group">
                <button class="toolbar-btn" data-action="link" title="链接 (Ctrl+L)">
                    🔗
                </button>
                <button class="toolbar-btn" data-action="image" title="图片 (Ctrl+Shift+I)">
                    🖼️
                </button>
                <button class="toolbar-btn" data-action="table" title="表格">
                    📊
                </button>
            </div>
            <div class="toolbar-group">
                <button class="toolbar-btn" data-action="list" title="列表 (Ctrl+Shift+L)">
                    📝
                </button>
                <button class="toolbar-btn" data-action="hr" title="分割线">
                    ➖
                </button>
                <button class="toolbar-btn" data-action="date" title="插入日期">
                    📅
                </button>
            </div>
        `;
        
        // 插入到编辑器前面
        const editorContainer = this.editor.parentElement;
        editorContainer.insertBefore(toolbar, this.editor);
        
        // 绑定工具栏事件
        this.bindToolbarEvents(toolbar);
        
        // 添加工具栏样式
        this.addToolbarStyles();
    }
    
    /**
     * 绑定工具栏事件
     */
    bindToolbarEvents(toolbar) {
        toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('.toolbar-btn');
            if (!btn) return;
            
            const action = btn.dataset.action;
            this.executeAction(action);
        });
    }
    
    /**
     * 执行快捷操作
     */
    executeAction(action) {
        if (!this.editor) return;
        
        const selection = this.getSelection();
        let replacement = '';
        
        switch (action) {
            case 'bold':
                replacement = `**${selection.text || '粗体文本'}**`;
                break;
            case 'italic':
                replacement = `*${selection.text || '斜体文本'}*`;
                break;
            case 'strikethrough':
                replacement = `~~${selection.text || '删除线文本'}~~`;
                break;
            case 'heading':
                replacement = `# ${selection.text || '标题'}`;
                break;
            case 'quote':
                replacement = `> ${selection.text || '引用内容'}`;
                break;
            case 'code':
                if (selection.text.includes('\n')) {
                    replacement = '```\n' + (selection.text || '代码块') + '\n```';
                } else {
                    replacement = '`' + (selection.text || '代码') + '`';
                }
                break;
            case 'link':
                replacement = `[${selection.text || '链接文本'}](https://example.com)`;
                break;
            case 'image':
                replacement = `![${selection.text || '图片描述'}](图片路径)`;
                break;
            case 'table':
                replacement = '| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n| 内容 | 内容 | 内容 |\n| 内容 | 内容 | 内容 |';
                break;
            case 'list':
                replacement = `- ${selection.text || '列表项'}`;
                break;
            case 'hr':
                replacement = '\n---\n';
                break;
            case 'date':
                replacement = new Date().toISOString().split('T')[0];
                break;
        }
        
        this.insertText(replacement, selection);
    }
    
    /**
     * 获取当前选择的文本
     */
    getSelection() {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const text = this.editor.value.substring(start, end);
        
        return { start, end, text };
    }
    
    /**
     * 插入文本到编辑器
     */
    insertText(text, selection) {
        const before = this.editor.value.substring(0, selection.start);
        const after = this.editor.value.substring(selection.end);
        
        this.editor.value = before + text + after;
        
        // 设置光标位置
        const newPosition = selection.start + text.length;
        this.editor.setSelectionRange(newPosition, newPosition);
        this.editor.focus();
        
        // 触发input事件
        this.editor.dispatchEvent(new Event('input'));
    }
    
    /**
     * 设置字数统计
     */
    setupWordCount() {
        if (!this.options.enableWordCount) return;
        
        // 创建统计显示
        this.createStatsDisplay();
        
        // 初始统计
        this.updateWordCount();
    }
    
    /**
     * 创建统计信息显示
     */
    createStatsDisplay() {
        const statsContainer = document.createElement('div');
        statsContainer.className = 'editor-stats';
        statsContainer.innerHTML = `
            <div class="stats-item">
                <span class="stats-label">字数:</span>
                <span class="stats-value" id="wordCountValue">0</span>
            </div>
            <div class="stats-item">
                <span class="stats-label">阅读时间:</span>
                <span class="stats-value" id="readingTimeValue">0分钟</span>
            </div>
            <div class="stats-item">
                <span class="stats-label">字符:</span>
                <span class="stats-value" id="charCountValue">0</span>
            </div>
        `;
        
        // 添加到状态栏
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            statusBar.appendChild(statsContainer);
        }
        
        // 添加样式
        this.addStatsStyles();
    }
    
    /**
     * 更新字数统计
     */
    updateWordCount() {
        if (!this.editor) return;
        
        const content = this.editor.value;
        
        // 计算中文字符和英文单词
        const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
        this.wordCount = chineseChars + englishWords;
        
        // 计算阅读时间（按每分钟200字计算）
        this.readingTime = Math.ceil(this.wordCount / 200);
        
        // 计算字符数
        const charCount = content.length;
        
        // 更新显示
        const wordCountEl = document.getElementById('wordCountValue');
        const readingTimeEl = document.getElementById('readingTimeValue');
        const charCountEl = document.getElementById('charCountValue');
        
        if (wordCountEl) wordCountEl.textContent = this.wordCount;
        if (readingTimeEl) readingTimeEl.textContent = `${this.readingTime}分钟`;
        if (charCountEl) charCountEl.textContent = charCount;
        
        // 更新原有的字数显示
        const originalWordCount = document.getElementById('wordCount');
        if (originalWordCount) {
            originalWordCount.textContent = `字数: ${this.wordCount}`;
        }
    }
    
    /**
     * 设置自动保存
     */
    setupAutoSave() {
        if (!this.options.autoSave) return;
        
        this.scheduleAutoSave();
    }
    
    /**
     * 安排自动保存
     */
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.performAutoSave();
        }, this.options.autoSaveInterval);
    }
    
    /**
     * 执行自动保存
     */
    performAutoSave() {
        if (!this.editor) return;
        
        const currentContent = this.editor.value;
        if (currentContent === this.lastSaveContent) return;
        
        // 保存到localStorage
        localStorage.setItem('hugo_editor_autosave', currentContent);
        localStorage.setItem('hugo_editor_autosave_time', new Date().toISOString());
        
        this.lastSaveContent = currentContent;
        
        // 显示保存指示器
        this.showAutoSaveIndicator();
    }
    
    /**
     * 显示自动保存指示器
     */
    showAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.textContent = '已自动保存';
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            document.body.removeChild(indicator);
        }, 2000);
    }
    
    /**
     * 设置键盘快捷键
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target !== this.editor) return;
            
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
            
            if (ctrlKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.executeAction('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.executeAction('italic');
                        break;
                    case 'h':
                        e.preventDefault();
                        this.executeAction('heading');
                        break;
                    case 'q':
                        e.preventDefault();
                        this.executeAction('quote');
                        break;
                    case 'l':
                        if (!e.shiftKey) {
                            e.preventDefault();
                            this.executeAction('link');
                        } else {
                            e.preventDefault();
                            this.executeAction('list');
                        }
                        break;
                }
                
                if (e.shiftKey) {
                    switch (e.key.toLowerCase()) {
                        case 'i':
                            e.preventDefault();
                            this.executeAction('image');
                            break;
                    }
                }
            }
        });
    }
    
    /**
     * 设置暗色模式
     */
    setupDarkMode() {
        if (!this.options.enableDarkMode) return;
        
        // 检查系统偏好和保存的设置
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('hugo_editor_theme');
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            this.enableDarkMode();
        }
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('hugo_editor_theme')) {
                if (e.matches) {
                    this.enableDarkMode();
                } else {
                    this.disableDarkMode();
                }
            }
        });
        
        // 添加主题切换按钮
        this.addThemeToggle();
    }
    
    /**
     * 启用暗色模式
     */
    enableDarkMode() {
        document.body.classList.add('dark-mode');
        localStorage.setItem('hugo_editor_theme', 'dark');
    }
    
    /**
     * 禁用暗色模式
     */
    disableDarkMode() {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('hugo_editor_theme', 'light');
    }
    
    /**
     * 添加主题切换按钮
     */
    addThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '🌓';
        themeToggle.title = '切换主题';
        
        themeToggle.addEventListener('click', () => {
            if (document.body.classList.contains('dark-mode')) {
                this.disableDarkMode();
            } else {
                this.enableDarkMode();
            }
        });
        
        // 添加到头部操作区域
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.appendChild(themeToggle);
        }
    }
    
    /**
     * 设置响应式布局
     */
    setupResponsiveLayout() {
        if (!this.options.enableResponsiveLayout) return;
        
        window.addEventListener('resize', () => {
            this.adjustLayout();
        });
        
        // 初始调整
        this.adjustLayout();
    }
    
    /**
     * 调整布局
     */
    adjustLayout() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            document.body.classList.add('mobile-layout');
        } else {
            document.body.classList.remove('mobile-layout');
        }
    }
    
    /**
     * 同步滚动位置
     */
    syncScrollPosition() {
        if (!this.options.enableScrollSync) return;
        
        const previewPane = document.getElementById('previewPane');
        if (previewPane && previewPane.style.display !== 'none') {
            const scrollPercentage = this.editor.scrollTop / (this.editor.scrollHeight - this.editor.clientHeight);
            previewPane.scrollTop = scrollPercentage * (previewPane.scrollHeight - previewPane.clientHeight);
        }
    }
    
    /**
     * 添加工具栏样式
     */
    addToolbarStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .editor-toolbar {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 12px;
                background: #f8f9fa;
                border-bottom: 1px solid #e0e0e0;
                border-radius: 8px 8px 0 0;
            }
            
            .toolbar-group {
                display: flex;
                gap: 4px;
                padding: 0 8px;
                border-right: 1px solid #e0e0e0;
            }
            
            .toolbar-group:last-child {
                border-right: none;
            }
            
            .toolbar-btn {
                padding: 6px 10px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
                min-width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .toolbar-btn:hover {
                background: #e9ecef;
                border-color: #007bff;
            }
            
            .toolbar-btn:active {
                background: #007bff;
                color: white;
            }
            
            .dark-mode .editor-toolbar {
                background: #3d3d3d;
                border-bottom-color: #555;
            }
            
            .dark-mode .toolbar-group {
                border-right-color: #555;
            }
            
            .dark-mode .toolbar-btn {
                background: #2d2d2d;
                border-color: #555;
                color: #e0e0e0;
            }
            
            .dark-mode .toolbar-btn:hover {
                background: #4d4d4d;
                border-color: #4dabf7;
            }
            
            .dark-mode .toolbar-btn:active {
                background: #4dabf7;
                color: #2d2d2d;
            }
            
            @media (max-width: 768px) {
                .editor-toolbar {
                    padding: 8px;
                    gap: 4px;
                }
                
                .toolbar-group {
                    padding: 0 4px;
                }
                
                .toolbar-btn {
                    padding: 4px 6px;
                    min-width: 28px;
                    height: 28px;
                    font-size: 11px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 添加统计信息样式
     */
    addStatsStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .editor-stats {
                display: flex;
                gap: 16px;
                margin-left: auto;
            }
            
            .stats-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
            }
            
            .stats-label {
                color: #666;
            }
            
            .stats-value {
                font-weight: 500;
                color: #333;
            }
            
            .dark-mode .stats-label {
                color: #b0b0b0;
            }
            
            .dark-mode .stats-value {
                color: #e0e0e0;
            }
            
            .autosave-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
                animation: fadeInOut 2s ease-in-out;
            }
            
            @keyframes fadeInOut {
                0%, 100% { opacity: 0; transform: translateY(-10px); }
                10%, 90% { opacity: 1; transform: translateY(0); }
            }
            
            .theme-toggle {
                padding: 8px;
                border: none;
                background: transparent;
                cursor: pointer;
                font-size: 16px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .theme-toggle:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            @media (max-width: 768px) {
                .editor-stats {
                    flex-direction: column;
                    gap: 8px;
                    margin-left: 0;
                    margin-top: 8px;
                }
                
                .stats-item {
                    font-size: 11px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 恢复自动保存的内容
     */
    restoreAutoSave() {
        const savedContent = localStorage.getItem('hugo_editor_autosave');
        const saveTime = localStorage.getItem('hugo_editor_autosave_time');
        
        if (savedContent && saveTime && this.editor) {
            const timeDiff = Date.now() - new Date(saveTime).getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // 只恢复24小时内的自动保存
            if (hoursDiff < 24) {
                const restore = confirm(`发现自动保存的内容（${new Date(saveTime).toLocaleString()}），是否恢复？`);
                if (restore) {
                    this.editor.value = savedContent;
                    this.updateWordCount();
                }
            } else {
                // 清除过期的自动保存
                this.clearAutoSave();
            }
        }
    }
    
    /**
     * 清除自动保存的内容
     */
    clearAutoSave() {
        localStorage.removeItem('hugo_editor_autosave');
        localStorage.removeItem('hugo_editor_autosave_time');
    }
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditorEnhancements;
}

// 浏览器环境下自动初始化
if (typeof window !== 'undefined') {
    window.EditorEnhancements = EditorEnhancements;
    
    // 自动初始化
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('content')) {
            const enhancements = new EditorEnhancements();
            enhancements.init();
        }
    });
}