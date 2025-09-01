# Hugo PaperMod Front Matter 参考手册

## 基础参数

```yaml
---
title: "文章标题"                    # 必需 - 文章标题
date: 2024-01-15T10:00:00+08:00     # 必需 - 发布日期
draft: false                        # 可选 - 是否为草稿（true/false）
---
```

## 分类和标签

```yaml
tags: ["标签1", "标签2"]            # 可选 - 文章标签
categories: ["分类1"]               # 可选 - 文章分类
```

## 作者和描述

```yaml
author: "作者名"                    # 可选 - 作者信息
description: "文章描述"             # 可选 - 文章描述（用于SEO）
```

## 目录设置

```yaml
showToc: true                       # 可选 - 显示目录（true/false）
TocOpen: false                      # 可选 - 目录默认展开（true/false）
```

## 页面控制

```yaml
hidemeta: false                     # 可选 - 隐藏元信息（true/false）
comments: true                      # 可选 - 启用评论（true/false）
searchHidden: false                 # 可选 - 在搜索中隐藏（true/false）
```

## SEO 和分享

```yaml
canonicalURL: "https://example.com" # 可选 - 规范URL
disableShare: false                 # 可选 - 禁用分享按钮（true/false）
```

## 代码高亮

```yaml
disableHLJS: false                  # 可选 - 禁用代码高亮（true/false）
```

## 封面图片设置

```yaml
cover:
    image: "/images/cover.jpg"      # 封面图片路径
    alt: "封面图片描述"              # 图片alt文本
    caption: "图片说明"             # 图片说明文字
    relative: false                 # 是否使用相对路径（true/false）
    hidden: false                   # 是否隐藏封面（true/false）
    responsiveImages: true          # 响应式图片（true/false）
```

## 完整示例

```yaml
---
title: "我的技术博客文章"
date: 2024-01-15T10:00:00+08:00
draft: false
tags: ["Hugo", "技术", "博客"]
categories: ["技术分享"]
author: "张三"
description: "这是一篇关于Hugo博客搭建的技术文章"
showToc: true
TocOpen: false
hidemeta: false
comments: true
canonicalURL: "https://myblog.com/posts/hugo-tutorial"
disableHLJS: false
disableShare: false
searchHidden: false
cover:
    image: "/images/hugo-tutorial-cover.jpg"
    alt: "Hugo教程封面"
    caption: "Hugo静态网站生成器教程"
    relative: false
    hidden: false
---
```

## 快速模板

### 普通文章模板
```yaml
---
title: ""
date: {{ .Date }}
draft: false
tags: []
categories: []
showToc: true
---
```

### 页面模板
```yaml
---
title: ""
date: {{ .Date }}
draft: false
showToc: false
hidemeta: true
comments: false
---
```

## 高级功能

### 图片和媒体
```yaml
cover:
    image: "/images/cover.jpg"      # 封面图片路径
    alt: "封面图片描述"              # 图片alt文本
    caption: "图片说明"             # 图片说明文字
    relative: false                 # 是否使用相对路径（true/false）
    hidden: false                   # 是否隐藏封面（true/false）
    responsiveImages: true          # 响应式图片（true/false）
```

### 内容类型标识
```yaml
type: "post"                       # 内容类型（post/page/diary/novel）
layout: "single"                   # 布局模板
series: ["我的日记", "旅行记录"]     # 系列文章（适合连载小说或主题日志）
```

### 阅读体验
```yaml
showReadingTime: true              # 显示阅读时间
showWordCount: true                # 显示字数统计
showToc: false                     # 日志类文章通常不需要目录
TocOpen: false                     # 目录默认收起
```

### 情感和氛围标签
```yaml
tags: ["生活感悟", "旅行", "美食", "摄影", "心情随笔"]
categories: ["日常生活", "旅行日记", "小说连载"]
mood: "愉快"                       # 自定义心情标签
location: "北京"                   # 地点标签（适合旅行日志）
```

### 社交分享优化
```yaml
disableShare: false                # 启用分享（日志内容适合分享）
socialImage: "/images/social-preview.jpg"  # 社交媒体分享预览图
```

## 日志文章快速模板
```yaml
---
title: "{{ .Date | dateFormat \"2006年01月02日\" }} - 标题"
date: {{ .Date }}
draft: false
tags: ["日常", "心情"]
categories: ["生活日记"]
showToc: false
showReadingTime: true
cover:
    image: "/images/diary/{{ .Date | dateFormat \"2006-01-02\" }}.jpg"
    alt: "今日记录"
    relative: false
---
```

## 小说章节模板
```yaml
---
title: "第一章：开始"
date: {{ .Date }}
draft: false
tags: ["小说", "原创"]
categories: ["小说连载"]
series: ["我的小说"]
showToc: true
TocOpen: false
cover:
    image: "/images/novel/chapter-cover.jpg"
    alt: "章节封面"
---
```

## 图片管理建议

### 目录结构
```
static/
├── images/
│   ├── diary/          # 日记配图
│   ├── travel/         # 旅行照片
│   ├── food/           # 美食照片
│   ├── novel/          # 小说插图
│   └── covers/         # 封面图片
```

### 图片优化参数
```yaml
# 在config.yml中添加
params:
  images:
    - "/images/default-cover.jpg"  # 默认封面
  imageProcessing:
    cover:
      resize: "600x"
      quality: 85
```

## 使用技巧

1. **图片命名规范**：建议使用日期+描述的方式，如 `2024-01-15-sunset.jpg`
2. **封面图片**：建议尺寸 1200x630px，适合社交媒体分享
3. **系列文章**：使用 `series` 参数可以自动生成系列导航
4. **标签策略**：
   - 情感类：开心、感动、思考、回忆
   - 主题类：美食、旅行、读书、电影
   - 地点类：家、咖啡厅、公园、海边

