// 编辑器滚动性能测试和修复
class EditorScrollFix {
    static init() {
        this.checkScrollPerformance();
        this.optimizeTextareaScrolling();
        this.addScrollDebugTools();
    }
    
    static checkScrollPerformance() {
        const textarea = document.getElementById('content');
        if (!textarea) return;
        
        console.log('编辑器滚动性能检查:');
        console.log('- 文本长度:', textarea.value.length);
        console.log('- 行数:', textarea.value.split('\n').length);
        
        // 检查是否有阻塞滚动的样式
        const computedStyle = window.getComputedStyle(textarea);
        console.log('- overflow-y:', computedStyle.overflowY);
        console.log('- overflow-x:', computedStyle.overflowX);
        console.log('- position:', computedStyle.position);
        
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
        const textarea = document.getElementById('content');
        if (!textarea) return;
        
        // 确保 textarea 可以正常滚动
        textarea.style.overflowY = 'auto';
        textarea.style.overflowX = 'auto';
        
        // 优化滚动性能
        if (textarea.value.length > 10000) {
            console.log('大文档检测，启用滚动优化');
            
            // 使用虚拟滚动或分页显示
            this.enableVirtualScrolling(textarea);
        }
        
        // 添加滚动事件监听以验证
        textarea.addEventListener('scroll', () => {
            console.log('滚动位置:', textarea.scrollTop, '/', textarea.scrollHeight - textarea.clientHeight);
        });
        
        // 测试键盘导航
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                e.key === 'PageUp' || e.key === 'PageDown') {
                console.log('键盘导航:', e.key);
                // 不阻止默认行为，让浏览器正常处理
            }
        });
    }
    
    static enableVirtualScrolling(textarea) {
        // 对于大文档，我们可以考虑实现虚拟滚动
        // 或者至少确保滚动是流畅的
        
        // 减少重绘频率
        let scrollTimeout;
        textarea.addEventListener('scroll', () => {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(() => {
                // 滚动结束后的处理
                this.updateLineNumbers();
            }, 100);
        });
    }
    
    static updateLineNumbers() {
        // 更新行号（如果有的话）
        // 这里可以添加行号更新逻辑
    }
    
    static addScrollDebugTools() {
        // 添加调试按钮
        const debugPanel = document.createElement('div');
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
        `;
        
        const textarea = document.getElementById('content');
        if (textarea) {
            debugPanel.innerHTML = `
                <div>文本长度: ${textarea.value.length}</div>
                <div>行数: ${textarea.value.split('\n').length}</div>
                <button onclick="EditorScrollFix.testScroll()" style="margin-top: 5px;">测试滚动</button>
                <button onclick="EditorScrollFix.forceScrollToTop()" style="margin-top: 5px;">回到顶部</button>
                <button onclick="EditorScrollFix.forceScrollToBottom()" style="margin-top: 5px;">到底部</button>
            `;
        }
        
        document.body.appendChild(debugPanel);
        
        // 3秒后自动隐藏
        setTimeout(() => {
            debugPanel.style.display = 'none';
        }, 5000);
    }
    
    static testScroll() {
        const textarea = document.getElementById('content');
        if (!textarea) return;
        
        console.log('开始滚动测试...');
        
        // 测试程序化滚动
        textarea.scrollTop = 100;
        setTimeout(() => {
            console.log('滚动到 100px:', textarea.scrollTop);
            textarea.scrollTop = 0;
        }, 500);
    }
    
    static forceScrollToTop() {
        const textarea = document.getElementById('content');
        if (textarea) {
            textarea.scrollTop = 0;
            textarea.focus();
        }
    }
    
    static forceScrollToBottom() {
        const textarea = document.getElementById('content');
        if (textarea) {
            textarea.scrollTop = textarea.scrollHeight;
            textarea.focus();
        }
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EditorScrollFix.init());
} else {
    EditorScrollFix.init();
}
