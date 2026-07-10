# GitHub Pages 博客管理器

一个基于纯HTML/JavaScript的单页应用，用于管理GitHub Pages博客。

## 功能特性

- 📁 **双模式支持**
  - 本地模式：直接读写本地文件系统
  - GitHub模式：通过GitHub API管理远程仓库
- ✏️ 分屏Markdown编辑器（左侧编辑，右侧实时预览）
- 🤖 集成LMStudio本地大模型API
  - 内容生成
  - 内容优化
  - 翻译功能
- 🔍 文章搜索和排序
- 💾 创建、编辑、保存文章（自动生成frontmatter）

## 快速开始

### 方式一：本地模式（推荐）

适用于直接编辑本地Jekyll项目：

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

4. 点击"打开本地目录"按钮，选择您的Jekyll项目目录

### 方式二：GitHub模式

适用于管理远程GitHub仓库：

1. **获取GitHub Token**
   - 访问 https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择 `repo` 权限
   - 复制生成的Token（格式：`ghp_xxxxxxxx`）

2. **配置应用**
   - 点击"设置"按钮
   - 填写 GitHub 配置：
     - 仓库所有者：您的GitHub用户名
     - 仓库名称：您的博客仓库名
     - GitHub Token：粘贴刚才复制的Token
     - 分支：默认 `main`
   - 点击"测试连接"验证配置
   - 保存设置

3. **加载仓库**
   - 点击"加载 GitHub"按钮
   - 等待文章列表加载完成

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
