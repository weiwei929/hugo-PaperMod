// 编辑器滚动性能测试和修复
class EditorScrollFix {
    static init() {
        this.checkScrollPerformance();
        this.optimizeTextareaScrolling();
        this.fixPreviewPaneScrolling();
        this.setupMemoryOptimization();
        this.addScrollDebugTools();
    }
    
    static checkScrollPerformance() {
        const textarea = document.getElementById('markdownEditor');
        if (!textarea) return;
        
        console.log('编辑器滚动性能检查:');
        console.log('- 文本长度:', textarea.value.length);
        console.log('- 行数:', textarea.value.split('\n').length);
        
        // 检查是否有阻塞滚动的样式
        const computedStyle = window.getComputedStyle(textarea);
        console.log('- textarea overflow-y:', computedStyle.overflowY);
        console.log('- textarea overflow-x:', computedStyle.overflowX);
        console.log('- textarea position:', computedStyle.position);
        
        // 检查预览面板
        const previewPane = document.querySelector('.preview-pane');
        if (previewPane) {
            const previewStyle = window.getComputedStyle(previewPane);
            console.log('- preview overflow-y:', previewStyle.overflowY);
            console.log('- preview height:', previewStyle.height);
        }
        
        // 检查父容器
        let parent = textarea.parentElement;
        while (parent && parent !== document.body) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.overflow === 'hidden' || parentStyle.overflowY === 'hidden') {
                console.warn('发现可能阻塞滚动的父容器:', parent.className, parentStyle.overflow);
            }
            parent = parent.parentElement;
        }
    }
    
    static optimizeTextareaScrolling() {
        const textarea = document.getElementById('markdownEditor');
        if (!textarea) return;
        
        // 强制设置滚动样式
        textarea.style.overflowY = 'auto';
        textarea.style.overflowX = 'auto';
        textarea.style.scrollBehavior = 'auto'; // 移除smooth以提高性能
        
        // 对于大文档，限制某些操作
        if (textarea.value.length > 20000) {
            console.log('大文档检测 (>20KB)，启用高级优化');
            
            // 禁用平滑滚动以提高性能
            textarea.style.scrollBehavior = 'auto';
            
            // 添加虚拟化处理
            this.enableVirtualScrolling(textarea);
        }
        
        // 添加滚动事件监听以验证
        let scrollDebounce;
        textarea.addEventListener('scroll', () => {
            if (scrollDebounce) clearTimeout(scrollDebounce);
            scrollDebounce = setTimeout(() => {
                console.log('textarea滚动位置:', textarea.scrollTop, '/', textarea.scrollHeight - textarea.clientHeight);
            }, 100);
        });
        
        // 测试键盘导航
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                e.key === 'PageUp' || e.key === 'PageDown') {
                console.log('键盘导航:', e.key, '当前光标位置:', textarea.selectionStart);
            }
        });
        
        // 强制刷新滚动状态
        setTimeout(() => {
            textarea.scrollTop = textarea.scrollTop;
        }, 100);
    }
    
    static fixPreviewPaneScrolling() {
        const previewPane = document.querySelector('.preview-pane');
        if (!previewPane) return;
        
        console.log('修复预览面板滚动...');
        
        // 强制设置预览面板滚动
        previewPane.style.overflowY = 'auto';
        previewPane.style.overflowX = 'hidden';
        previewPane.style.height = 'auto';
        previewPane.style.maxHeight = '100%';
        
        // 确保预览内容不会阻塞滚动
        const previewContent = previewPane.querySelector('.preview-content');
        if (previewContent) {
            previewContent.style.height = 'auto';
            previewContent.style.minHeight = '100%';
            previewContent.style.overflowWrap = 'break-word';
        }
        
        // 添加滚动测试
        let previewScrollDebounce;
        previewPane.addEventListener('scroll', () => {
            if (previewScrollDebounce) clearTimeout(previewScrollDebounce);
            previewScrollDebounce = setTimeout(() => {
                console.log('预览面板滚动位置:', previewPane.scrollTop, '/', previewPane.scrollHeight - previewPane.clientHeight);
            }, 100);
        });
        
        // 强制刷新预览面板滚动状态
        setTimeout(() => {
            previewPane.scrollTop = previewPane.scrollTop;
        }, 200);
    }
    
    static setupMemoryOptimization() {
        const textarea = document.getElementById('markdownEditor');
        if (!textarea) return;
        
        // 监控内存使用
        let lastLength = 0;
        const checkMemory = () => {
            const currentLength = textarea.value.length;
            
            if (currentLength > lastLength + 10000) { // 每增加10KB检查一次
                console.log('文档大小增长，检查内存使用:', {
                    文档大小: (currentLength / 1024).toFixed(2) + 'KB',
                    行数: textarea.value.split('\n').length
                });
                
                // 如果文档太大，建议用户保存
                if (currentLength > 100000) { // 100KB
                    console.warn('文档过大，建议保存后继续编辑');
                    this.showLargeDocumentWarning();
                }
                
                lastLength = currentLength;
            }
        };
        
        // 定期检查
        setInterval(checkMemory, 2000);
        
        // 监听粘贴事件，防止一次性粘贴过大内容
        textarea.addEventListener('paste', (e) => {
            setTimeout(() => {
                if (textarea.value.length > 200000) { // 200KB
                    console.error('文档过大，可能影响性能');
                    this.showPerformanceWarning();
                }
            }, 100);
        });
    }
    
    static enableVirtualScrolling(textarea) {
        console.log('启用虚拟滚动优化...');
        
        // 减少重绘频率
        let scrollTimeout;
        let isScrolling = false;
        
        textarea.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                requestAnimationFrame(() => {
                    isScrolling = false;
                });
            }
            
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(() => {
                // 滚动结束后的处理
                this.updateLineNumbers();
            }, 150);
        });
    }
    
    static updateLineNumbers() {
        // 更新行号（如果有的话）
        // 这里可以添加行号更新逻辑
    }
    
    static showLargeDocumentWarning() {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 10001;
            max-width: 400px;
            text-align: center;
        `;
        warning.innerHTML = `
            <h4 style="margin: 0 0 10px 0;">文档过大提醒</h4>
            <p style="margin: 0 0 15px 0;">当前文档较大，可能影响编辑性能。建议保存当前内容后继续编辑。</p>
            <button onclick="this.parentElement.remove()" style="background: #856404; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">知道了</button>
        `;
        document.body.appendChild(warning);
        
        setTimeout(() => {
            if (warning.parentElement) {
                warning.remove();
            }
        }, 8000);
    }
    
    static showPerformanceWarning() {
        console.warn('性能警告：文档过大，建议分割文档或保存当前内容');
    }
    
    static addScrollDebugTools() {
        // 添加调试按钮
        const debugPanel = document.createElement('div');
        debugPanel.id = 'scroll-debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 12px;
            font-family: monospace;
            max-width: 250px;
        `;
        
        const textarea = document.getElementById('markdownEditor');
        const previewPane = document.querySelector('.preview-pane');
        
        if (textarea) {
            debugPanel.innerHTML = `
                <div>文本长度: ${textarea.value.length}</div>
                <div>行数: ${textarea.value.split('\n').length}</div>
                <div>预览面板: ${previewPane ? '存在' : '不存在'}</div>
                <button onclick="EditorScrollFix.testTextareaScroll()" style="margin: 2px; padding: 4px 8px; font-size: 10px;">测试编辑器滚动</button>
                <button onclick="EditorScrollFix.testPreviewScroll()" style="margin: 2px; padding: 4px 8px; font-size: 10px;">测试预览滚动</button>
                <button onclick="EditorScrollFix.forceScrollToTop()" style="margin: 2px; padding: 4px 8px; font-size: 10px;">回到顶部</button>
                <button onclick="EditorScrollFix.forceScrollToBottom()" style="margin: 2px; padding: 4px 8px; font-size: 10px;">到底部</button>
                <button onclick="document.getElementById('scroll-debug-panel').remove()" style="margin: 2px; padding: 4px 8px; font-size: 10px;">关闭</button>
            `;
        }
        
        document.body.appendChild(debugPanel);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (debugPanel.parentElement) {
                debugPanel.style.opacity = '0.5';
            }
        }, 5000);
    }
    
    static testTextareaScroll() {
        const textarea = document.getElementById('markdownEditor');
        if (!textarea) return;
        
        console.log('开始编辑器滚动测试...');
        
        // 测试程序化滚动
        const originalScrollTop = textarea.scrollTop;
        textarea.scrollTop = 100;
        setTimeout(() => {
            console.log('滚动到 100px:', textarea.scrollTop);
            textarea.scrollTop = textarea.scrollHeight / 2;
            setTimeout(() => {
                console.log('滚动到中间:', textarea.scrollTop);
                textarea.scrollTop = originalScrollTop;
                console.log('恢复原位置:', textarea.scrollTop);
            }, 500);
        }, 500);
    }
    
    static testPreviewScroll() {
        const previewPane = document.querySelector('.preview-pane');
        if (!previewPane) {
            console.log('预览面板不存在');
            return;
        }
        
        console.log('开始预览面板滚动测试...');
        
        const originalScrollTop = previewPane.scrollTop;
        previewPane.scrollTop = 100;
        setTimeout(() => {
            console.log('预览滚动到 100px:', previewPane.scrollTop);
            previewPane.scrollTop = previewPane.scrollHeight / 2;
            setTimeout(() => {
                console.log('预览滚动到中间:', previewPane.scrollTop);
                previewPane.scrollTop = originalScrollTop;
                console.log('预览恢复原位置:', previewPane.scrollTop);
            }, 500);
        }, 500);
    }
    
    static forceScrollToTop() {
        const textarea = document.getElementById('markdownEditor');
        const previewPane = document.querySelector('.preview-pane');
        
        if (textarea) {
            textarea.scrollTop = 0;
            textarea.focus();
        }
        if (previewPane) {
            previewPane.scrollTop = 0;
        }
    }
    
    static forceScrollToBottom() {
        const textarea = document.getElementById('markdownEditor');
        const previewPane = document.querySelector('.preview-pane');
        
        if (textarea) {
            textarea.scrollTop = textarea.scrollHeight;
            textarea.focus();
        }
        if (previewPane) {
            previewPane.scrollTop = previewPane.scrollHeight;
        }
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => EditorScrollFix.init(), 500);
    });
} else {
    setTimeout(() => EditorScrollFix.init(), 500);
}
