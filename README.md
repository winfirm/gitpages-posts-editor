# GitHub Pages 博客管理器

一个基于纯HTML/JavaScript的单页应用，用于管理GitHub Pages博客。

## 功能特性

- 📁 读取和管理Jekyll格式的_posts目录文章
- ✏️ 分屏Markdown编辑器（左侧编辑，右侧实时预览）
- 🤖 集成LMStudio本地大模型API
  - 内容生成
  - 内容优化
  - 翻译功能
- 🔍 文章搜索和排序
- 💾 本地文件直接读写（需支持File System Access API的浏览器）

## 快速开始

### 本地运行

1. 克隆项目
   ```bash
   git clone <repository-url>
   cd github-pages-blog-manager
   ```

2. 启动本地服务器
   ```bash
   python3 -m http.server 8000
   ```

3. 在浏览器打开 http://localhost:8000

4. 点击"打开目录"按钮，选择您的Jekyll项目目录

### 配置LMStudio

1. 下载并安装 [LMStudio](https://lmstudio.ai/)
2. 下载一个模型（如Llama 2、Mistral等）
3. 启动LMStudio服务器（默认端口1234）
4. 在应用设置中配置API地址（默认http://localhost:1234/v1/chat/completions）

## 浏览器兼容性

- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Firefox（部分功能受限）
- ⚠️ Safari（不支持File System Access API）

## 技术栈

- HTML5 / CSS3 / JavaScript ES6+
- [marked.js](https://marked.js.org/) - Markdown解析
- [highlight.js](https://highlightjs.org/) - 语法高亮
- GitHub REST API v3
- LMStudio API (OpenAI兼容)

## 项目结构

```
github-pages-blog-manager/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── app.js          # 主应用逻辑
│   ├── fileManager.js  # 文件管理模块
│   ├── editor.js       # 编辑器模块
│   ├── aiAssistant.js  # AI助手模块
│   └── utils.js        # 工具函数
└── README.md
```

## 快捷键

- `Ctrl+S` / `Cmd+S`: 保存文章
- `Ctrl+Enter` / `Cmd+Enter`: 生成AI内容（AI助手打开时）
- `Ctrl+Z` / `Cmd+Z`: 撤销
- `Ctrl+Y` / `Cmd+Y`: 重做

## 许可证

MIT License
