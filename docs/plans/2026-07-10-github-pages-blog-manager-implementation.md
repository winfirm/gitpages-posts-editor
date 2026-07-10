# GitHub Pages 博客管理工具实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建一个基于纯HTML/JavaScript的单页应用，用于管理GitHub Pages博客，支持本地文件和GitHub API两种模式，集成LMStudio本地大模型API。

**Architecture:** 采用模块化设计，分为文件管理、编辑器、AI助手三大核心模块。支持双模式运行：本地开发模式使用File System Access API，GitHub Pages模式使用GitHub REST API。

**Tech Stack:** HTML5, CSS3, JavaScript ES6+, marked.js, highlight.js, GitHub API v3, LMStudio API (OpenAI兼容)

---

## Task 1: 项目基础结构

**Files:**
- Create: `/Users/panxw/Agent/aieditor/package.json`
- Create: `/Users/panxw/Agent/aieditor/index.html`
- Create: `/Users/panxw/Agent/aieditor/css/style.css`
- Create: `/Users/panxw/Agent/aieditor/js/app.js`

**Step 1: 创建package.json**

```json
{
  "name": "github-pages-blog-manager",
  "version": "1.0.0",
  "description": "A web app for managing GitHub Pages blog posts",
  "main": "index.html",
  "scripts": {
    "start": "python3 -m http.server 8000",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["github-pages", "jekyll", "blog", "markdown"],
  "author": "",
  "license": "MIT"
}
```

**Step 2: 创建基础HTML结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Pages 博客管理器</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
</head>
<body>
  <div id="app">
    <header class="header">
      <h1>GitHub Pages 博客管理器</h1>
      <div class="header-actions">
        <button id="btn-open-dir" class="btn btn-primary">打开目录</button>
        <button id="btn-settings" class="btn btn-secondary">设置</button>
      </div>
    </header>
    
    <main class="main">
      <aside class="sidebar">
        <div class="sidebar-header">
          <input type="text" id="search-input" placeholder="搜索文章..." class="search-input">
          <select id="sort-select" class="sort-select">
            <option value="date-desc">日期 (新→旧)</option>
            <option value="date-asc">日期 (旧→新)</option>
            <option value="title-asc">标题 (A→Z)</option>
            <option value="title-desc">标题 (Z→A)</option>
          </select>
        </div>
        <ul id="article-list" class="article-list"></ul>
        <div class="sidebar-footer">
          <button id="btn-new-article" class="btn btn-success">新建文章</button>
        </div>
      </aside>
      
      <section class="editor-section">
        <div class="editor-toolbar">
          <button id="btn-save" class="btn btn-primary" disabled>保存</button>
          <button id="btn-preview" class="btn btn-secondary">预览</button>
          <button id="btn-ai" class="btn btn-ai" disabled>AI 助手</button>
        </div>
        <div class="editor-container">
          <div class="editor-pane">
            <textarea id="editor" class="editor" placeholder="在此输入 Markdown 内容..." disabled></textarea>
          </div>
          <div class="preview-pane">
            <div id="preview" class="preview"></div>
          </div>
        </div>
      </section>
    </main>
    
    <footer class="footer">
      <span id="status-mode">模式: 本地</span>
      <span id="status-file">文件: 未选择</span>
      <span id="status-ai">AI: 未连接</span>
    </footer>
  </div>
  
  <!-- AI助手模态框 -->
  <div id="ai-modal" class="modal" style="display: none;">
    <div class="modal-content">
      <div class="modal-header">
        <h2>AI 助手</h2>
        <button id="btn-close-modal" class="btn-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="ai-tabs">
          <button class="ai-tab active" data-tab="generate">生成内容</button>
          <button class="ai-tab" data-tab="optimize">优化内容</button>
          <button class="ai-tab" data-tab="translate">翻译</button>
        </div>
        <div class="ai-tab-content active" id="tab-generate">
          <textarea id="ai-prompt" placeholder="请输入生成提示，例如：写一篇关于 Python 异步编程的文章..." rows="4"></textarea>
          <button id="btn-generate" class="btn btn-primary">生成</button>
        </div>
        <div class="ai-tab-content" id="tab-optimize" style="display: none;">
          <textarea id="ai-optimize-instructions" placeholder="请输入优化指令，例如：改进文章结构，使语言更生动..." rows="4"></textarea>
          <button id="btn-optimize" class="btn btn-primary">优化</button>
        </div>
        <div class="ai-tab-content" id="tab-translate" style="display: none;">
          <select id="ai-target-language" class="form-select">
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
          <button id="btn-translate" class="btn btn-primary">翻译</button>
        </div>
        <div id="ai-result" class="ai-result" style="display: none;">
          <h3>AI 生成结果</h3>
          <div id="ai-result-content" class="ai-result-content"></div>
          <div class="ai-result-actions">
            <button id="btn-apply-ai" class="btn btn-success">应用到编辑器</button>
            <button id="btn-copy-ai" class="btn btn-secondary">复制</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 设置模态框 -->
  <div id="settings-modal" class="modal" style="display: none;">
    <div class="modal-content">
      <div class="modal-header">
        <h2>设置</h2>
        <button id="btn-close-settings" class="btn-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="settings-section">
          <h3>GitHub 配置</h3>
          <div class="form-group">
            <label for="github-owner">仓库所有者</label>
            <input type="text" id="github-owner" class="form-input" placeholder="username">
          </div>
          <div class="form-group">
            <label for="github-repo">仓库名称</label>
            <input type="text" id="github-repo" class="form-input" placeholder="repo-name">
          </div>
          <div class="form-group">
            <label for="github-token">GitHub Token</label>
            <input type="password" id="github-token" class="form-input" placeholder="ghp_xxxxxxxxxxxx">
          </div>
          <div class="form-group">
            <label for="github-branch">分支</label>
            <input type="text" id="github-branch" class="form-input" value="main">
          </div>
        </div>
        
        <div class="settings-section">
          <h3>LMStudio 配置</h3>
          <div class="form-group">
            <label for="lmstudio-url">API 地址</label>
            <input type="text" id="lmstudio-url" class="form-input" value="http://localhost:1234/v1/chat/completions">
          </div>
          <div class="form-group">
            <label for="lmstudio-model">模型名称</label>
            <input type="text" id="lmstudio-model" class="form-input" value="local-model">
          </div>
        </div>
        
        <div class="settings-section">
          <h3>应用设置</h3>
          <div class="form-group">
            <label for="posts-dir">文章目录</label>
            <input type="text" id="posts-dir" class="form-input" value="_posts">
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="auto-save" checked> 自动保存
            </label>
          </div>
        </div>
        
        <div class="settings-footer">
          <button id="btn-save-settings" class="btn btn-primary">保存设置</button>
          <button id="btn-test-connection" class="btn btn-secondary">测试连接</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Toast通知 -->
  <div id="toast-container" class="toast-container"></div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.0/marked.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="js/utils.js"></script>
  <script src="js/fileManager.js"></script>
  <script src="js/editor.js"></script>
  <script src="js/aiAssistant.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

**Step 3: 创建基础CSS样式**

```css
/* css/style.css */
:root {
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --secondary-color: #64748b;
  --success-color: #16a34a;
  --danger-color: #dc2626;
  --warning-color: #f59e0b;
  --background-color: #0f172a;
  --surface-color: #1e293b;
  --surface-hover: #334155;
  --text-color: #f8fafc;
  --text-muted: #94a3b8;
  --border-color: #334155;
  --editor-bg: #1e293b;
  --preview-bg: #ffffff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
}

.header h1 {
  font-size: 1.25rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-hover);
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #475569;
}

.btn-success {
  background-color: var(--success-color);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #15803d;
}

.btn-ai {
  background: linear-gradient(135deg, #8b5cf6, #06b6d4);
  color: white;
}

.btn-ai:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #0891b2);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
}

.btn-close:hover {
  color: var(--text-color);
}

/* Main Layout */
.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 300px;
  background-color: var(--surface-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  color: var(--text-color);
}

.sort-select {
  width: 100%;
  padding: 0.5rem;
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  color: var(--text-color);
}

.article-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
}

.article-item {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.2s;
}

.article-item:hover {
  background-color: var(--surface-hover);
}

.article-item.active {
  background-color: var(--primary-color);
}

.article-item-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.article-item-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.article-item-tags {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.tag {
  padding: 0.125rem 0.5rem;
  background-color: var(--background-color);
  border-radius: 1rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.sidebar-footer .btn {
  width: 100%;
}

/* Editor Section */
.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
}

.editor-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}

.editor {
  flex: 1;
  width: 100%;
  padding: 1rem;
  background-color: var(--editor-bg);
  border: none;
  color: var(--text-color);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  resize: none;
}

.editor:focus {
  outline: none;
}

.preview-pane {
  flex: 1;
  overflow-y: auto;
  background-color: var(--preview-bg);
}

.preview {
  padding: 1.5rem;
  color: #1e293b;
  line-height: 1.8;
}

.preview h1, .preview h2, .preview h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #0f172a;
}

.preview p {
  margin-bottom: 1rem;
}

.preview code {
  padding: 0.125rem 0.375rem;
  background-color: #f1f5f9;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875em;
}

.preview pre {
  padding: 1rem;
  background-color: #1e293b;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.preview pre code {
  padding: 0;
  background-color: transparent;
  color: #f8fafc;
}

/* Footer */
.footer {
  display: flex;
  gap: 2rem;
  padding: 0.5rem 1.5rem;
  background-color: var(--surface-color);
  border-top: 1px solid var(--border-color);
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--surface-color);
  border-radius: 0.5rem;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

/* AI Tabs */
.ai-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.ai-tab {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 0.375rem;
}

.ai-tab:hover {
  background-color: var(--surface-hover);
}

.ai-tab.active {
  background-color: var(--primary-color);
  color: white;
}

.ai-tab-content {
  display: none;
}

.ai-tab-content.active {
  display: block;
}

.ai-result {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--background-color);
  border-radius: 0.5rem;
}

.ai-result-content {
  padding: 1rem;
  background-color: var(--preview-bg);
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  color: #1e293b;
  max-height: 300px;
  overflow-y: auto;
}

.ai-result-actions {
  display: flex;
  gap: 0.5rem;
}

/* Forms */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-input, .form-select {
  width: 100%;
  padding: 0.5rem;
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  color: var(--text-color);
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.settings-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.settings-section:last-child {
  border-bottom: none;
}

.settings-section h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.settings-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

/* Toast */
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
}

.toast {
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 0.375rem;
  color: white;
  animation: slideIn 0.3s ease;
}

.toast-success {
  background-color: var(--success-color);
}

.toast-error {
  background-color: var(--danger-color);
}

.toast-warning {
  background-color: var(--warning-color);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .main {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .editor-container {
    flex-direction: column;
  }
  
  .editor-pane {
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
}
```

**Step 4: 创建工具函数模块**

```javascript
// js/utils.js
const Utils = {
  // 格式化日期
  formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },
  
  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // 显示Toast通知
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  },
  
  // 解析YAML Frontmatter
  parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return { frontmatter: {}, content: content };
    }
    
    const frontmatter = {};
    const lines = match[1].split('\n');
    
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // 处理数组
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => v.trim());
        }
        
        frontmatter[key] = value;
      }
    });
    
    return {
      frontmatter,
      content: match[2]
    };
  },
  
  // 生成YAML Frontmatter
  generateFrontmatter(article) {
    const lines = ['---'];
    lines.push(`title: ${article.title}`);
    lines.push(`date: ${article.date}`);
    lines.push(`layout: ${article.layout || 'post'}`);
    
    if (article.categories && article.categories.length > 0) {
      lines.push(`categories: [${article.categories.join(', ')}]`);
    }
    
    if (article.tags && article.tags.length > 0) {
      lines.push(`tags: [${article.tags.join(', ')}]`);
    }
    
    if (article.excerpt) {
      lines.push(`excerpt: ${article.excerpt}`);
    }
    
    lines.push('---');
    return lines.join('\n');
  },
  
  // 从文件名提取日期
  extractDateFromFilename(filename) {
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
  },
  
  // 从标题生成文件名
  generateFilename(title, date) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${date}-${slug}.md`;
  }
};

// 导出到全局
window.Utils = Utils;
```

**Step 5: 运行测试**

Run: `python3 -m http.server 8000`
Expected: 服务器启动，可在浏览器访问 http://localhost:8000

**Step 6: 提交代码**

```bash
git init
git add .
git commit -m "feat: initialize project structure with HTML, CSS, and utils"
```

---

## Task 2: 文件管理模块 (本地模式)

**Files:**
- Create: `/Users/panxw/Agent/aieditor/js/fileManager.js`

**Step 1: 创建文件管理模块**

```javascript
// js/fileManager.js
class FileManager {
  constructor() {
    this.directoryHandle = null;
    this.files = new Map();
    this.currentFile = null;
    this.mode = 'local'; // 'local' or 'github'
  }
  
  // 检查是否支持File System Access API
  isSupported() {
    return 'showDirectoryPicker' in window;
  }
  
  // 打开本地目录
  async openDirectory() {
    if (!this.isSupported()) {
      throw new Error('您的浏览器不支持 File System Access API');
    }
    
    try {
      this.directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      
      await this.loadFiles();
      this.mode = 'local';
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        return false;
      }
      throw error;
    }
  }
  
  // 加载目录中的文件
  async loadFiles() {
    this.files.clear();
    
    if (!this.directoryHandle) {
      return;
    }
    
    // 查找_posts目录
    let postsDir;
    try {
      postsDir = await this.directoryHandle.getDirectoryHandle('_posts');
    } catch (error) {
      // 如果_posts目录不存在，创建它
      postsDir = await this.directoryHandle.getDirectoryHandle('_posts', { create: true });
    }
    
    // 遍历文件
    for await (const [name, handle] of postsDir) {
      if (handle.kind === 'file' && name.endsWith('.md')) {
        const file = await handle.getFile();
        const content = await file.text();
        const { frontmatter, content: articleContent } = Utils.parseFrontmatter(content);
        
        this.files.set(name, {
          handle,
          filename: name,
          path: `_posts/${name}`,
          frontmatter,
          content: articleContent,
          rawContent: content,
          lastModified: file.lastModified
        });
      }
    }
    
    return Array.from(this.files.values());
  }
  
  // 获取文章列表
  getArticles() {
    return Array.from(this.files.values()).sort((a, b) => {
      const dateA = a.frontmatter.date || '';
      const dateB = b.frontmatter.date || '';
      return dateB.localeCompare(dateA);
    });
  }
  
  // 读取文章内容
  async readArticle(filename) {
    const article = this.files.get(filename);
    if (!article) {
      throw new Error(`文章不存在: ${filename}`);
    }
    
    this.currentFile = filename;
    return article;
  }
  
  // 保存文章
  async saveArticle(filename, content) {
    const article = this.files.get(filename);
    
    if (!article) {
      // 新文章
      await this.createArticle(filename, content);
      return;
    }
    
    // 更新现有文章
    const writable = await article.handle.createWritable();
    await writable.write(content);
    await writable.close();
    
    // 更新缓存
    const { frontmatter, content: articleContent } = Utils.parseFrontmatter(content);
    article.frontmatter = frontmatter;
    article.content = articleContent;
    article.rawContent = content;
    article.lastModified = Date.now();
    
    return article;
  }
  
  // 创建新文章
  async createArticle(title, options = {}) {
    const {
      categories = [],
      tags = [],
      layout = 'post'
    } = options;
    
    const date = Utils.formatDate(new Date());
    const filename = Utils.generateFilename(title, date);
    
    const frontmatter = Utils.generateFrontmatter({
      title,
      date,
      layout,
      categories,
      tags
    });
    
    const content = `${frontmatter}\n\n# ${title}\n\n在此输入文章内容...\n`;
    
    // 获取_posts目录
    const postsDir = await this.directoryHandle.getDirectoryHandle('_posts', { create: true });
    
    // 创建文件
    const fileHandle = await postsDir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    
    // 添加到缓存
    const { frontmatter: fm, content: articleContent } = Utils.parseFrontmatter(content);
    const article = {
      handle: fileHandle,
      filename,
      path: `_posts/${filename}`,
      frontmatter: fm,
      content: articleContent,
      rawContent: content,
      lastModified: Date.now()
    };
    
    this.files.set(filename, article);
    this.currentFile = filename;
    
    return article;
  }
  
  // 删除文章
  async deleteArticle(filename) {
    const article = this.files.get(filename);
    if (!article) {
      throw new Error(`文章不存在: ${filename}`);
    }
    
    await this.directoryHandle.removeEntry(`_posts/${filename}`);
    this.files.delete(filename);
    
    if (this.currentFile === filename) {
      this.currentFile = null;
    }
    
    return true;
  }
  
  // 搜索文章
  searchArticles(query) {
    const lowerQuery = query.toLowerCase();
    return this.getArticles().filter(article => {
      const title = (article.frontmatter.title || '').toLowerCase();
      const tags = (article.frontmatter.tags || []).join(' ').toLowerCase();
      const categories = (article.frontmatter.categories || []).join(' ').toLowerCase();
      
      return title.includes(lowerQuery) ||
             tags.includes(lowerQuery) ||
             categories.includes(lowerQuery);
    });
  }
  
  // 排序文章
  sortArticles(articles, sortBy) {
    return [...articles].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return (b.frontmatter.date || '').localeCompare(a.frontmatter.date || '');
        case 'date-asc':
          return (a.frontmatter.date || '').localeCompare(b.frontmatter.date || '');
        case 'title-asc':
          return (a.frontmatter.title || '').localeCompare(b.frontmatter.title || '');
        case 'title-desc':
          return (b.frontmatter.title || '').localeCompare(a.frontmatter.title || '');
        default:
          return 0;
      }
    });
  }
}

// 导出到全局
window.FileManager = FileManager;
```

**Step 2: 测试文件管理模块**

在浏览器控制台测试：
```javascript
const fm = new FileManager();
console.log('File System Access API supported:', fm.isSupported());
```

Expected: 输出 `true` (如果浏览器支持)

**Step 3: 提交代码**

```bash
git add js/fileManager.js
git commit -m "feat: add FileManager module for local file operations"
```

---

## Task 3: 编辑器模块

**Files:**
- Create: `/Users/panxw/Agent/aieditor/js/editor.js`

**Step 1: 创建编辑器模块**

```javascript
// js/editor.js
class Editor {
  constructor() {
    this.editorElement = document.getElementById('editor');
    this.previewElement = document.getElementById('preview');
    this.saveButton = document.getElementById('btn-save');
    this.previewButton = document.getElementById('btn-preview');
    
    this.currentContent = '';
    this.isDirty = false;
    this.debounceTimer = null;
    
    this.init();
  }
  
  init() {
    // 配置marked.js
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        highlight: function(code, lang) {
          if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(code, { language: lang }).value;
            } catch (err) {
              console.error('Highlight error:', err);
            }
          }
          return code;
        },
        breaks: true,
        gfm: true
      });
    }
    
    // 绑定事件
    this.editorElement.addEventListener('input', () => {
      this.onContentChange();
    });
    
    this.saveButton.addEventListener('click', () => {
      this.save();
    });
    
    this.previewButton.addEventListener('click', () => {
      this.togglePreview();
    });
    
    // 键盘快捷键
    this.editorElement.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.save();
      }
    });
  }
  
  // 加载内容
  loadContent(content) {
    this.currentContent = content;
    this.editorElement.value = content;
    this.isDirty = false;
    this.updateSaveButton();
    this.updatePreview();
  }
  
  // 获取内容
  getContent() {
    return this.editorElement.value;
  }
  
  // 内容变化处理
  onContentChange() {
    this.isDirty = true;
    this.updateSaveButton();
    
    // 防抖更新预览
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.updatePreview();
    }, 300);
  }
  
  // 更新预览
  updatePreview() {
    const content = this.editorElement.value;
    
    // 分离frontmatter和内容
    const { content: markdownContent } = Utils.parseFrontmatter(content);
    
    if (typeof marked !== 'undefined') {
      this.previewElement.innerHTML = marked.parse(markdownContent);
    } else {
      this.previewElement.textContent = markdownContent;
    }
  }
  
  // 切换预览显示
  togglePreview() {
    const previewPane = document.querySelector('.preview-pane');
    const editorPane = document.querySelector('.editor-pane');
    
    if (previewPane.style.display === 'none') {
      previewPane.style.display = 'block';
      editorPane.style.flex = '1';
      this.previewButton.textContent = '隐藏预览';
    } else {
      previewPane.style.display = 'none';
      editorPane.style.flex = '1';
      this.previewButton.textContent = '显示预览';
    }
  }
  
  // 保存按钮状态
  updateSaveButton() {
    this.saveButton.disabled = !this.isDirty;
  }
  
  // 保存
  async save() {
    if (!this.isDirty) {
      return;
    }
    
    // 触发保存事件
    const event = new CustomEvent('editor:save', {
      detail: {
        content: this.editorElement.value
      }
    });
    document.dispatchEvent(event);
  }
  
  // 插入文本
  insertText(text) {
    const start = this.editorElement.selectionStart;
    const end = this.editorElement.selectionEnd;
    const content = this.editorElement.value;
    
    this.editorElement.value = content.substring(0, start) + text + content.substring(end);
    this.editorElement.selectionStart = this.editorElement.selectionEnd = start + text.length;
    this.editorElement.focus();
    
    this.onContentChange();
  }
  
  // 替换选中文本
  replaceSelection(newText) {
    const start = this.editorElement.selectionStart;
    const end = this.editorElement.selectionEnd;
    const content = this.editorElement.value;
    
    this.editorElement.value = content.substring(0, start) + newText + content.substring(end);
    this.editorElement.selectionStart = start;
    this.editorElement.selectionEnd = start + newText.length;
    this.editorElement.focus();
    
    this.onContentChange();
  }
  
  // 获取选中文本
  getSelectedText() {
    const start = this.editorElement.selectionStart;
    const end = this.editorElement.selectionEnd;
    return this.editorElement.value.substring(start, end);
  }
  
  // 启用/禁用编辑器
  setEnabled(enabled) {
    this.editorElement.disabled = !enabled;
    this.saveButton.disabled = !enabled || !this.isDirty;
  }
  
  // 清空编辑器
  clear() {
    this.editorElement.value = '';
    this.currentContent = '';
    this.isDirty = false;
    this.updateSaveButton();
    this.updatePreview();
  }
}

// 导出到全局
window.Editor = Editor;
```

**Step 2: 测试编辑器模块**

在浏览器控制台测试：
```javascript
const editor = new Editor();
editor.loadContent('# Hello World\n\nThis is a test.');
console.log('Editor content:', editor.getContent());
```

Expected: 输出文章内容

**Step 3: 提交代码**

```bash
git add js/editor.js
git commit -m "feat: add Editor module with Markdown preview"
```

---

## Task 4: AI助手模块

**Files:**
- Create: `/Users/panxw/Agent/aieditor/js/aiAssistant.js`

**Step 1: 创建AI助手模块**

```javascript
// js/aiAssistant.js
class AIAssistant {
  constructor() {
    this.apiUrl = 'http://localhost:1234/v1/chat/completions';
    this.model = 'local-model';
    this.isConnected = false;
    this.temperature = 0.7;
    this.maxTokens = 2000;
    
    this.init();
  }
  
  init() {
    // 绑定UI事件
    this.bindEvents();
  }
  
  bindEvents() {
    // AI按钮
    const aiButton = document.getElementById('btn-ai');
    const aiModal = document.getElementById('ai-modal');
    const closeModal = document.getElementById('btn-close-modal');
    
    if (aiButton) {
      aiButton.addEventListener('click', () => {
        this.showModal();
      });
    }
    
    if (closeModal) {
      closeModal.addEventListener('click', () => {
        this.hideModal();
      });
    }
    
    // 标签切换
    const tabs = document.querySelectorAll('.ai-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });
    
    // 生成按钮
    const generateBtn = document.getElementById('btn-generate');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generateContent();
      });
    }
    
    // 优化按钮
    const optimizeBtn = document.getElementById('btn-optimize');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => {
        this.optimizeContent();
      });
    }
    
    // 翻译按钮
    const translateBtn = document.getElementById('btn-translate');
    if (translateBtn) {
      translateBtn.addEventListener('click', () => {
        this.translateContent();
      });
    }
    
    // 应用AI结果
    const applyBtn = document.getElementById('btn-apply-ai');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyAIResult();
      });
    }
    
    // 复制AI结果
    const copyBtn = document.getElementById('btn-copy-ai');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyAIResult();
      });
    }
  }
  
  // 显示模态框
  showModal() {
    const modal = document.getElementById('ai-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }
  
  // 隐藏模态框
  hideModal() {
    const modal = document.getElementById('ai-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
  
  // 切换标签
  switchTab(tabName) {
    // 更新标签状态
    const tabs = document.querySelectorAll('.ai-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // 更新内容显示
    const contents = document.querySelectorAll('.ai-tab-content');
    contents.forEach(content => {
      const isActive = content.id === `tab-${tabName}`;
      content.style.display = isActive ? 'block' : 'none';
      content.classList.toggle('active', isActive);
    });
  }
  
  // 连接测试
  async testConnection() {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: 'Hello' }
          ],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        this.isConnected = true;
        this.updateStatus('AI: 已连接', 'success');
        return true;
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      this.isConnected = false;
      this.updateStatus('AI: 连接失败', 'error');
      console.error('Connection test failed:', error);
      return false;
    }
  }
  
  // 更新状态显示
  updateStatus(text, type = 'info') {
    const statusElement = document.getElementById('status-ai');
    if (statusElement) {
      statusElement.textContent = text;
      statusElement.className = `status-${type}`;
    }
  }
  
  // 调用LMStudio API
  async callAPI(messages, options = {}) {
    const {
      temperature = this.temperature,
      maxTokens = this.maxTokens
    } = options;
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  // 生成内容
  async generateContent() {
    const prompt = document.getElementById('ai-prompt').value;
    if (!prompt) {
      Utils.showToast('请输入生成提示', 'warning');
      return;
    }
    
    this.showLoading('正在生成内容...');
    
    try {
      const messages = [
        {
          role: 'system',
          content: '你是一个专业的技术博客作者，擅长撰写高质量的 Markdown 格式技术文章。请根据用户提供的标题或提示，生成完整的博客文章内容。文章应该包含适当的标题、段落、代码示例（如果相关）和技术细节。'
        },
        {
          role: 'user',
          content: `请根据以下提示生成一篇博客文章：\n\n${prompt}`
        }
      ];
      
      const result = await this.callAPI(messages);
      this.showAIResult(result);
      Utils.showToast('内容生成成功', 'success');
    } catch (error) {
      console.error('Generate error:', error);
      Utils.showToast(`生成失败: ${error.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }
  
  // 优化内容
  async optimizeContent() {
    const instructions = document.getElementById('ai-optimize-instructions').value;
    if (!instructions) {
      Utils.showToast('请输入优化指令', 'warning');
      return;
    }
    
    // 获取当前编辑器内容
    const editor = window.app?.editor;
    if (!editor) {
      Utils.showToast('编辑器未初始化', 'error');
      return;
    }
    
    const currentContent = editor.getContent();
    if (!currentContent) {
      Utils.showToast('没有内容可优化', 'warning');
      return;
    }
    
    this.showLoading('正在优化内容...');
    
    try {
      const messages = [
        {
          role: 'system',
          content: '你是一个专业的技术编辑，擅长优化和改进技术文章。请根据用户的指令，优化提供的 Markdown 内容。保持文章的核心意思，但改进其结构、语言和可读性。'
        },
        {
          role: 'user',
          content: `请优化以下文章内容：\n\n优化指令：${instructions}\n\n当前内容：\n${currentContent}`
        }
      ];
      
      const result = await this.callAPI(messages);
      this.showAIResult(result);
      Utils.showToast('内容优化成功', 'success');
    } catch (error) {
      console.error('Optimize error:', error);
      Utils.showToast(`优化失败: ${error.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }
  
  // 翻译内容
  async translateContent() {
    const targetLanguage = document.getElementById('ai-target-language').value;
    
    // 获取当前编辑器内容
    const editor = window.app?.editor;
    if (!editor) {
      Utils.showToast('编辑器未初始化', 'error');
      return;
    }
    
    const currentContent = editor.getContent();
    if (!currentContent) {
      Utils.showToast('没有内容可翻译', 'warning');
      return;
    }
    
    this.showLoading('正在翻译...');
    
    try {
      const languageNames = {
        'en': 'English',
        'zh': '中文',
        'ja': 'Japanese',
        'ko': 'Korean'
      };
      
      const messages = [
        {
          role: 'system',
          content: `你是一个专业的技术翻译，擅长将技术文章翻译成${languageNames[targetLanguage] || targetLanguage}。请保持 Markdown 格式不变，只翻译文本内容。技术术语可以保留原文或提供常见翻译。`
        },
        {
          role: 'user',
          content: `请将以下文章翻译成${languageNames[targetLanguage] || targetLanguage}：\n\n${currentContent}`
        }
      ];
      
      const result = await this.callAPI(messages);
      this.showAIResult(result);
      Utils.showToast('翻译成功', 'success');
    } catch (error) {
      console.error('Translate error:', error);
      Utils.showToast(`翻译失败: ${error.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }
  
  // 显示AI结果
  showAIResult(content) {
    const resultDiv = document.getElementById('ai-result');
    const contentDiv = document.getElementById('ai-result-content');
    
    if (resultDiv && contentDiv) {
      contentDiv.innerHTML = marked.parse(content);
      resultDiv.style.display = 'block';
      
      // 存储结果供后续使用
      this.currentResult = content;
    }
  }
  
  // 应用AI结果到编辑器
  applyAIResult() {
    if (!this.currentResult) {
      Utils.showToast('没有可应用的结果', 'warning');
      return;
    }
    
    const editor = window.app?.editor;
    if (editor) {
      editor.loadContent(this.currentResult);
      this.hideModal();
      Utils.showToast('内容已应用到编辑器', 'success');
    }
  }
  
  // 复制AI结果
  async copyAIResult() {
    if (!this.currentResult) {
      Utils.showToast('没有可复制的内容', 'warning');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(this.currentResult);
      Utils.showToast('内容已复制到剪贴板', 'success');
    } catch (error) {
      console.error('Copy error:', error);
      Utils.showToast('复制失败', 'error');
    }
  }
  
  // 显示加载状态
  showLoading(message) {
    // 可以实现加载动画
    console.log(message);
  }
  
  // 隐藏加载状态
  hideLoading() {
    // 隐藏加载动画
    console.log('Loading complete');
  }
  
  // 更新配置
  updateConfig(config) {
    if (config.apiUrl) {
      this.apiUrl = config.apiUrl;
    }
    if (config.model) {
      this.model = config.model;
    }
    if (config.temperature !== undefined) {
      this.temperature = config.temperature;
    }
    if (config.maxTokens) {
      this.maxTokens = config.maxTokens;
    }
  }
}

// 导出到全局
window.AIAssistant = AIAssistant;
```

**Step 2: 测试AI助手模块**

在浏览器控制台测试：
```javascript
const ai = new AIAssistant();
console.log('AI Assistant initialized');
```

Expected: 输出初始化信息

**Step 3: 提交代码**

```bash
git add js/aiAssistant.js
git commit -m "feat: add AI Assistant module with LMStudio integration"
```

---

## Task 5: 主应用模块

**Files:**
- Modify: `/Users/panxw/Agent/aieditor/js/app.js`

**Step 1: 创建主应用模块**

```javascript
// js/app.js
class App {
  constructor() {
    this.fileManager = new FileManager();
    this.editor = new Editor();
    this.aiAssistant = new AIAssistant();
    
    this.currentArticle = null;
    this.mode = 'local'; // 'local' or 'github'
    
    this.init();
  }
  
  init() {
    // 绑定UI事件
    this.bindEvents();
    
    // 检查浏览器支持
    this.checkBrowserSupport();
    
    // 加载设置
    this.loadSettings();
    
    // 初始化UI状态
    this.updateUIState();
    
    // 绑定编辑器保存事件
    document.addEventListener('editor:save', (e) => {
      this.saveCurrentArticle(e.detail.content);
    });
    
    console.log('App initialized');
  }
  
  bindEvents() {
    // 打开目录按钮
    const openDirBtn = document.getElementById('btn-open-dir');
    if (openDirBtn) {
      openDirBtn.addEventListener('click', () => {
        this.openDirectory();
      });
    }
    
    // 新建文章按钮
    const newArticleBtn = document.getElementById('btn-new-article');
    if (newArticleBtn) {
      newArticleBtn.addEventListener('click', () => {
        this.createNewArticle();
      });
    }
    
    // 搜索输入
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.searchArticles(e.target.value);
      }, 300));
    }
    
    // 排序选择
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortArticles(e.target.value);
      });
    }
    
    // 设置按钮
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showSettings();
      });
    }
    
    // 关闭设置按钮
    const closeSettingsBtn = document.getElementById('btn-close-settings');
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        this.hideSettings();
      });
    }
    
    // 保存设置按钮
    const saveSettingsBtn = document.getElementById('btn-save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }
    
    // 测试连接按钮
    const testConnectionBtn = document.getElementById('btn-test-connection');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', () => {
        this.testConnection();
      });
    }
  }
  
  checkBrowserSupport() {
    if (!this.fileManager.isSupported()) {
      Utils.showToast('您的浏览器不支持 File System Access API，部分功能将受限', 'warning');
      
      // 禁用本地模式相关按钮
      const openDirBtn = document.getElementById('btn-open-dir');
      if (openDirBtn) {
        openDirBtn.disabled = true;
      }
    }
  }
  
  async openDirectory() {
    try {
      const success = await this.fileManager.openDirectory();
      if (success) {
        Utils.showToast('目录已打开', 'success');
        this.updateArticleList();
        this.updateStatusMode('本地');
      }
    } catch (error) {
      console.error('Open directory error:', error);
      Utils.showToast(`打开目录失败: ${error.message}`, 'error');
    }
  }
  
  updateArticleList() {
    const articleList = document.getElementById('article-list');
    if (!articleList) return;
    
    const articles = this.fileManager.getArticles();
    articleList.innerHTML = '';
    
    articles.forEach(article => {
      const li = document.createElement('li');
      li.className = 'article-item';
      li.dataset.filename = article.filename;
      
      const title = article.frontmatter.title || article.filename;
      const date = article.frontmatter.date || '';
      const tags = article.frontmatter.tags || [];
      
      li.innerHTML = `
        <div class="article-item-title">${title}</div>
        <div class="article-item-date">${date}</div>
        ${tags.length > 0 ? `
          <div class="article-item-tags">
            ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      `;
      
      li.addEventListener('click', () => {
        this.openArticle(article.filename);
      });
      
      articleList.appendChild(li);
    });
    
    this.updateArticleCount(articles.length);
  }
  
  async openArticle(filename) {
    try {
      const article = await this.fileManager.readArticle(filename);
      this.currentArticle = article;
      
      // 加载到编辑器
      this.editor.loadContent(article.rawContent);
      this.editor.setEnabled(true);
      
      // 更新UI状态
      this.updateArticleSelection(filename);
      this.updateStatusFile(filename);
      
      // 启用AI按钮
      const aiButton = document.getElementById('btn-ai');
      if (aiButton) {
        aiButton.disabled = false;
      }
      
    } catch (error) {
      console.error('Open article error:', error);
      Utils.showToast(`打开文章失败: ${error.message}`, 'error');
    }
  }
  
  async saveCurrentArticle(content) {
    if (!this.currentArticle) {
      Utils.showToast('没有选中的文章', 'warning');
      return;
    }
    
    try {
      await this.fileManager.saveArticle(this.currentArticle.filename, content);
      Utils.showToast('文章已保存', 'success');
      
      // 更新文章列表
      this.updateArticleList();
      
    } catch (error) {
      console.error('Save article error:', error);
      Utils.showToast(`保存失败: ${error.message}`, 'error');
    }
  }
  
  async createNewArticle() {
    const title = prompt('请输入文章标题:');
    if (!title) return;
    
    try {
      const article = await this.fileManager.createArticle(title, {
        categories: [],
        tags: []
      });
      
      // 打开新文章
      await this.openArticle(article.filename);
      this.updateArticleList();
      
      Utils.showToast('文章已创建', 'success');
      
    } catch (error) {
      console.error('Create article error:', error);
      Utils.showToast(`创建文章失败: ${error.message}`, 'error');
    }
  }
  
  searchArticles(query) {
    const articles = this.fileManager.searchArticles(query);
    this.renderArticleList(articles);
  }
  
  sortArticles(sortBy) {
    const articles = this.fileManager.sortArticles(
      this.fileManager.getArticles(),
      sortBy
    );
    this.renderArticleList(articles);
  }
  
  renderArticleList(articles) {
    const articleList = document.getElementById('article-list');
    if (!articleList) return;
    
    articleList.innerHTML = '';
    
    articles.forEach(article => {
      const li = document.createElement('li');
      li.className = 'article-item';
      li.dataset.filename = article.filename;
      
      const title = article.frontmatter.title || article.filename;
      const date = article.frontmatter.date || '';
      const tags = article.frontmatter.tags || [];
      
      li.innerHTML = `
        <div class="article-item-title">${title}</div>
        <div class="article-item-date">${date}</div>
        ${tags.length > 0 ? `
          <div class="article-item-tags">
            ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      `;
      
      li.addEventListener('click', () => {
        this.openArticle(article.filename);
      });
      
      articleList.appendChild(li);
    });
  }
  
  updateArticleSelection(filename) {
    const items = document.querySelectorAll('.article-item');
    items.forEach(item => {
      item.classList.toggle('active', item.dataset.filename === filename);
    });
  }
  
  updateArticleCount(count) {
    const statusFile = document.getElementById('status-file');
    if (statusFile) {
      statusFile.textContent = `文章: ${count} 篇`;
    }
  }
  
  updateStatusMode(mode) {
    const statusMode = document.getElementById('status-mode');
    if (statusMode) {
      statusMode.textContent = `模式: ${mode}`;
    }
  }
  
  updateStatusFile(filename) {
    const statusFile = document.getElementById('status-file');
    if (statusFile) {
      statusFile.textContent = `文件: ${filename}`;
    }
  }
  
  updateUIState() {
    // 根据模式更新UI
    if (this.mode === 'github') {
      this.updateStatusMode('GitHub');
    } else {
      this.updateStatusMode('本地');
    }
  }
  
  showSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.display = 'flex';
      this.loadSettingsToForm();
    }
  }
  
  hideSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
  
  loadSettings() {
    const settings = localStorage.getItem('blogManagerSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.applySettings(parsed);
    }
  }
  
  loadSettingsToForm() {
    const settings = JSON.parse(localStorage.getItem('blogManagerSettings') || '{}');
    
    document.getElementById('github-owner').value = settings.github?.owner || '';
    document.getElementById('github-repo').value = settings.github?.repo || '';
    document.getElementById('github-token').value = settings.github?.token || '';
    document.getElementById('github-branch').value = settings.github?.branch || 'main';
    
    document.getElementById('lmstudio-url').value = settings.lmstudio?.apiUrl || 'http://localhost:1234/v1/chat/completions';
    document.getElementById('lmstudio-model').value = settings.lmstudio?.model || 'local-model';
    
    document.getElementById('posts-dir').value = settings.app?.postsDir || '_posts';
    document.getElementById('auto-save').checked = settings.app?.autoSave !== false;
  }
  
  saveSettings() {
    const settings = {
      github: {
        owner: document.getElementById('github-owner').value,
        repo: document.getElementById('github-repo').value,
        token: document.getElementById('github-token').value,
        branch: document.getElementById('github-branch').value
      },
      lmstudio: {
        apiUrl: document.getElementById('lmstudio-url').value,
        model: document.getElementById('lmstudio-model').value
      },
      app: {
        postsDir: document.getElementById('posts-dir').value,
        autoSave: document.getElementById('auto-save').checked
      }
    };
    
    localStorage.setItem('blogManagerSettings', JSON.stringify(settings));
    this.applySettings(settings);
    
    Utils.showToast('设置已保存', 'success');
    this.hideSettings();
  }
  
  applySettings(settings) {
    // 应用GitHub设置
    if (settings.github) {
      this.fileManager.githubConfig = settings.github;
    }
    
    // 应用LMStudio设置
    if (settings.lmstudio) {
      this.aiAssistant.updateConfig(settings.lmstudio);
    }
  }
  
  async testConnection() {
    const success = await this.aiAssistant.testConnection();
    if (success) {
      Utils.showToast('连接测试成功', 'success');
    } else {
      Utils.showToast('连接测试失败，请检查LMStudio是否运行', 'error');
    }
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
```

**Step 2: 测试主应用模块**

1. 启动本地服务器：`python3 -m http.server 8000`
2. 在浏览器打开 http://localhost:8000
3. 点击"打开目录"按钮
4. 选择包含_posts目录的Jekyll项目
5. 验证文章列表是否正确显示

Expected: 应用正常运行，可以打开目录、查看文章列表

**Step 3: 提交代码**

```bash
git add js/app.js
git commit -m "feat: add main App module with full integration"
```

---

## Task 6: 测试和完善

**Files:**
- Create: `/Users/panxw/Agent/aieditor/README.md`
- Create: `/Users/panxw/Agent/aieditor/.gitignore`

**Step 1: 创建README文档**

```markdown
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
```

**Step 2: 创建.gitignore**

```
# 依赖目录
node_modules/

# 系统文件
.DS_Store
Thumbs.db

# 编辑器目录
.vscode/
.idea/
*.swp
*.swo

# 日志
*.log

# 临时文件
tmp/
temp/

# 构建输出
dist/
build/
```

**Step 3: 最终测试**

1. 完整功能测试：
   - 打开目录
   - 查看文章列表
   - 创建新文章
   - 编辑文章
   - 保存文章
   - 使用AI助手生成内容
   - 使用AI助手优化内容
   - 使用AI助手翻译内容

2. 错误处理测试：
   - 网络断开时的AI调用
   - 保存失败时的提示
   - 无效文件格式处理

Expected: 所有功能正常工作，错误处理得当

**Step 4: 最终提交**

```bash
git add .
git commit -m "docs: add README and .gitignore, complete project setup"
```

---

## 执行说明

**对于Claude:** 使用superpowers:subagent-driven-development技能执行此计划。每个Task作为一个独立的子代理任务执行，任务间进行代码审查。

**执行顺序：**
1. Task 1: 项目基础结构
2. Task 2: 文件管理模块
3. Task 3: 编辑器模块
4. Task 4: AI助手模块
5. Task 5: 主应用模块
6. Task 6: 测试和完善

**验证点：**
- 每个Task完成后运行测试验证
- 检查浏览器控制台是否有错误
- 验证UI交互是否正常
- 测试核心功能是否工作

**注意事项：**
- 确保所有JavaScript文件正确加载
- 检查CSS样式是否生效
- 验证API调用是否正常
- 测试不同浏览器的兼容性