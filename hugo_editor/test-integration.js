/**
 * Hugo Editor 集成测试
 * 测试导出功能、文件系统API、图片处理等核心功能
 */

class HugoEditorTester {
    constructor() {
        this.testResults = [];
        this.hugoEditor = null;
    }

    async runAllTests() {
        console.log('🚀 开始Hugo Editor集成测试...');
        
        // 初始化编辑器
        await this.initializeEditor();
        
        // 运行各项测试
        await this.testBasicFunctionality();
        await this.testFileSystemAPI();
        await this.testExportFunctionality();
        await this.testImageHandling();
        await this.testErrorHandling();
        
        // 输出测试结果
        this.generateTestReport();
    }

    async initializeEditor() {
        try {
            // 检查编辑器是否已初始化
            if (typeof hugoEditor !== 'undefined') {
                this.hugoEditor = hugoEditor;
                this.addTestResult('编辑器初始化', true, '编辑器已成功初始化');
            } else {
                throw new Error('编辑器未找到');
            }
        } catch (error) {
            this.addTestResult('编辑器初始化', false, error.message);
        }
    }

    async testBasicFunctionality() {
        console.log('📝 测试基础功能...');
        
        try {
            // 测试表单元素是否存在
            const requiredElements = [
                'title', 'markdownEditor', 'contentType', 
                'categories', 'tags', 'description'
            ];
            
            for (const elementId of requiredElements) {
                const element = document.getElementById(elementId);
                if (!element) {
                    throw new Error(`缺少必需元素: ${elementId}`);
                }
            }
            
            this.addTestResult('基础UI元素', true, '所有必需的UI元素都存在');
            
            // 测试数据收集功能
            await this.testDataCollection();
            
        } catch (error) {
            this.addTestResult('基础功能测试', false, error.message);
        }
    }

    async testDataCollection() {
        try {
            // 填充测试数据
            document.getElementById('title').value = '测试文章标题';
            document.getElementById('markdownEditor').value = '# 测试内容\n\n这是一个测试文章。';
            document.getElementById('description').value = '测试描述';
            
            // 测试数据收集
            const frontMatter = this.hugoEditor.collectFrontMatter();
            
            if (frontMatter.title === '测试文章标题' && frontMatter.description === '测试描述') {
                this.addTestResult('数据收集', true, 'Front Matter数据收集正常');
            } else {
                throw new Error('数据收集不完整');
            }
            
        } catch (error) {
            this.addTestResult('数据收集', false, error.message);
        }
    }

    async testFileSystemAPI() {
        console.log('📁 测试文件系统API支持...');
        
        try {
            // 检查File System Access API支持
            const hasFileSystemAPI = 'showDirectoryPicker' in window;
            
            if (hasFileSystemAPI) {
                this.addTestResult('File System API', true, '浏览器支持File System Access API');
                
                // 测试Hugo项目验证函数
                if (typeof this.hugoEditor.validateHugoProject === 'function') {
                    this.addTestResult('Hugo项目验证', true, 'Hugo项目验证函数存在');
                } else {
                    this.addTestResult('Hugo项目验证', false, 'Hugo项目验证函数缺失');
                }
                
            } else {
                this.addTestResult('File System API', false, '浏览器不支持File System Access API，将使用降级方案');
            }
            
        } catch (error) {
            this.addTestResult('文件系统API测试', false, error.message);
        }
    }

    async testExportFunctionality() {
        console.log('📤 测试导出功能...');
        
        try {
            // 测试Markdown生成
            const frontMatter = {
                title: '测试文章',
                date: new Date().toISOString(),
                draft: false,
                description: '测试描述',
                categories: ['测试'],
                tags: ['test'],
                toc: true,
                comments: true,
                showShareButtons: true
            };
            
            const content = '# 测试内容\n\n这是测试内容。';
            const markdown = this.hugoEditor.generateHugoMarkdown(frontMatter, content);
            
            // 验证生成的Markdown格式
            if (markdown.includes('---') && markdown.includes('title: "测试文章"')) {
                this.addTestResult('Markdown生成', true, 'Hugo格式Markdown生成正常');
            } else {
                throw new Error('Markdown格式不正确');
            }
            
            // 测试文件名生成
            const slug = this.hugoEditor.generateSlug('测试文章标题');
            if (slug && slug.length > 0) {
                this.addTestResult('文件名生成', true, `生成的slug: ${slug}`);
            } else {
                throw new Error('文件名生成失败');
            }
            
        } catch (error) {
            this.addTestResult('导出功能测试', false, error.message);
        }
    }

    async testImageHandling() {
        console.log('🖼️ 测试图片处理功能...');
        
        try {
            // 检查图片相关方法是否存在
            const imageMethods = [
                'handleImageUpload',
                'generateImageFileName',
                'renderUploadedImages',
                'insertImage',
                'removeImage'
            ];
            
            let missingMethods = [];
            for (const method of imageMethods) {
                if (typeof this.hugoEditor[method] !== 'function') {
                    missingMethods.push(method);
                }
            }
            
            if (missingMethods.length === 0) {
                this.addTestResult('图片处理方法', true, '所有图片处理方法都存在');
            } else {
                throw new Error(`缺少图片处理方法: ${missingMethods.join(', ')}`);
            }
            
            // 测试图片文件名生成
            const testImage = {
                name: 'test-image.jpg',
                type: 'image/jpeg',
                size: 1024
            };
            
            const fileName = this.hugoEditor.generateImageFileName(testImage);
            if (fileName && fileName.includes('.jpg')) {
                this.addTestResult('图片文件名生成', true, `生成的文件名: ${fileName}`);
            } else {
                throw new Error('图片文件名生成失败');
            }
            
        } catch (error) {
            this.addTestResult('图片处理测试', false, error.message);
        }
    }

    async testErrorHandling() {
        console.log('⚠️ 测试错误处理...');
        
        try {
            // 测试Toast通知系统
            if (typeof this.hugoEditor.showToast === 'function') {
                this.hugoEditor.showToast('测试通知', 'info');
                this.addTestResult('通知系统', true, 'Toast通知系统正常');
            } else {
                throw new Error('Toast通知系统缺失');
            }
            
            // 测试状态设置
            if (typeof this.hugoEditor.setStatus === 'function') {
                this.hugoEditor.setStatus('测试状态');
                this.addTestResult('状态系统', true, '状态设置系统正常');
            } else {
                throw new Error('状态设置系统缺失');
            }
            
        } catch (error) {
            this.addTestResult('错误处理测试', false, error.message);
        }
    }

    addTestResult(testName, passed, message) {
        this.testResults.push({
            name: testName,
            passed: passed,
            message: message,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${message}`);
    }

    generateTestReport() {
        console.log('\n📊 测试报告生成中...');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: ((passedTests / totalTests) * 100).toFixed(2) + '%'
            },
            details: this.testResults,
            timestamp: new Date().toISOString()
        };
        
        console.log('\n🎯 测试总结:');
        console.log(`总测试数: ${totalTests}`);
        console.log(`通过: ${passedTests}`);
        console.log(`失败: ${failedTests}`);
        console.log(`成功率: ${report.summary.successRate}`);
        
        // 保存测试报告到localStorage
        localStorage.setItem('hugo-editor-test-report', JSON.stringify(report));
        
        // 显示详细结果
        if (failedTests > 0) {
            console.log('\n❌ 失败的测试:');
            this.testResults.filter(r => !r.passed).forEach(test => {
                console.log(`- ${test.name}: ${test.message}`);
            });
        }
        
        return report;
    }

    // 手动运行单个测试的方法
    async runSingleTest(testName) {
        switch (testName) {
            case 'basic':
                await this.testBasicFunctionality();
                break;
            case 'filesystem':
                await this.testFileSystemAPI();
                break;
            case 'export':
                await this.testExportFunctionality();
                break;
            case 'image':
                await this.testImageHandling();
                break;
            case 'error':
                await this.testErrorHandling();
                break;
            default:
                console.log('未知的测试名称');
        }
    }
}

// 全局测试实例
window.hugoEditorTester = new HugoEditorTester();

// 自动运行测试（可选）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🔧 Hugo Editor 测试工具已加载');
            console.log('运行 hugoEditorTester.runAllTests() 开始完整测试');
            console.log('或运行 hugoEditorTester.runSingleTest("testName") 运行单个测试');
        }, 1000);
    });
} else {
    setTimeout(() => {
        console.log('🔧 Hugo Editor 测试工具已加载');
        console.log('运行 hugoEditorTester.runAllTests() 开始完整测试');
    }, 1000);
}