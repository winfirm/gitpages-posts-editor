# GitHub Pages 博客管理工具设计文档

## 1. 项目概述

这是一个基于纯HTML/JavaScript的单页应用，用于管理GitHub Pages博客。主要功能包括：
- 读取和管理Jekyll格式的_posts目录文章
- 创建新文章并自动生成YAML frontmatter
- 分屏Markdown编辑器（左侧编辑，右侧实时预览）
- 集成LMStudio本地大模型API，提供AI辅助功能
- 文章列表管理，支持搜索、排序和状态查看

## 2. 架构设计

### 2.1 技术栈
- **前端**: 纯HTML5 + CSS3 + JavaScript (ES6+)
- **Markdown解析**: marked.js (轻量级Markdown解析器)
- **语法高亮**: highlight.js (代码块高亮)
- **样式**: 自定义CSS，支持暗色主题
- **API调用**: Fetch API
- **GitHub集成**: GitHub REST API v3

### 2.2 双模式架构

本应用支持两种运行模式：

#### 模式1：本地开发模式
- 使用File System Access API读取本地_posts目录
- 直接读写本地文件
- 无需网络连接（除AI功能外）

#### 模式2：GitHub Pages部署模式
- 使用GitHub API读取仓库内容
- 通过GitHub API创建/更新文件
- 需要GitHub Token进行认证

**GitHub API调用：**
```javascript
// 获取_posts目录内容
const response = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/contents/_posts`,
  {
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  }
);

// 读取文件内容
const fileContent = atob(response.data.content);

// 创建/更新文件
const updateResponse = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Update post via blog manager',
      content: btoa(newContent),
      sha: response.data.sha // 更新时需要提供SHA
    })
  }
);
```

### 2.3 核心模块
```
src/
├── index.html          # 主页面
├── css/
│   ├── style.css       # 主样式
│   └── editor.css      # 编辑器样式
├── js/
│   ├── app.js          # 主应用逻辑
│   ├── fileManager.js  # 文件管理模块
│   ├── editor.js       # 编辑器模块
│   ├── aiAssistant.js  # AI助手模块
│   └── utils.js        # 工具函数
└── libs/
    ├── marked.min.js   # Markdown解析器
    └── highlight.min.js # 语法高亮
```

### 2.3 数据流
1. 用户选择_posts目录（通过File API）
2. 应用解析目录结构，显示文章列表
3. 用户选择文章进行编辑或创建新文章
4. 编辑器加载内容，分屏显示
5. 用户可调用AI助手生成/优化内容
6. 保存时更新本地文件（通过File API）

## 3. 功能模块设计

### 3.1 文件管理模块 (fileManager.js)

**主要功能：**
- 使用File API和Directory API读取本地目录
- 解析_posts目录中的.md文件
- 提取文章frontmatter信息
- 监听文件变化（通过轮询或File System Access API）

**数据结构：**
```javascript
// 文章对象
const article = {
  filename: '2026-07-10-hello-world.md',
  path: '_posts/2026-07-10-hello-world.md',
  frontmatter: {
    title: 'Hello World',
    date: '2026-07-10',
    layout: 'post',
    categories: [],
    tags: []
  },
  content: '文章正文内容...',
  lastModified: Date.now()
};
```

**核心方法：**
- `loadDirectory(directoryHandle)` - 加载目录
- `readArticle(fileHandle)` - 读取文章
- `saveArticle(fileHandle, content)` - 保存文章
- `createArticle(title, categories, tags)` - 创建新文章
- `listArticles()` - 列出所有文章

### 3.2 编辑器模块 (editor.js)

**主要功能：**
- 分屏布局：左侧Markdown编辑，右侧实时预览
- 支持Markdown语法
- 实时预览（使用marked.js解析）
- 语法高亮（代码块）
- 保存功能

**UI组件：**
```
┌─────────────────────────────────────┐
│ 工具栏: [保存] [预览] [AI助手]      │
├─────────────────┬───────────────────┤
│ Markdown编辑器   │ 实时预览          │
│                 │                  │
│ # Hello World   │ Hello World      │
│                 │                  │
│ 这是文章内容...  │ 这是文章内容...   │
│                 │                  │
└─────────────────┴───────────────────┘
```

**核心方法：**
- `loadContent(content)` - 加载内容
- `getContent()` - 获取内容
- `updatePreview()` - 更新预览
- `insertText(text)` - 插入文本
- `replaceSelection(oldText, newText)` - 替换选中文本

### 3.3 AI助手模块 (aiAssistant.js)

**主要功能：**
- 连接LMStudio本地API
- 根据提示生成文章内容
- 优化现有文章内容
- 翻译文章

**LMStudio API调用：**
```javascript
// LMStudio API端点 (默认)
const LMSTUDIO_API = 'http://localhost:1234/v1/chat/completions';

// 请求格式
const request = {
  model: 'local-model', // 或具体模型名称
  messages: [
    { role: 'system', content: '你是一个专业的技术博客作者...' },
    { role: 'user', content: '请根据标题生成文章内容...' }
  ],
  temperature: 0.7,
  max_tokens: 2000
};
```

**AI功能：**
1. **内容生成**
   - 输入：文章标题、关键词、大纲
   - 输出：完整的Markdown文章

2. **内容优化**
   - 输入：现有文章内容、优化提示
   - 输出：优化后的文章

3. **翻译功能**
   - 输入：文章内容、目标语言
   - 输出：翻译后的文章

**核心方法：**
- `connect()` - 连接LMStudio API
- `generateContent(prompt, options)` - 生成内容
- `optimizeContent(content, instructions)` - 优化内容
- `translateContent(content, targetLanguage)` - 翻译内容
- `checkConnection()` - 检查连接状态

### 3.4 文章列表模块

**主要功能：**
- 显示文章列表（标题、日期、状态）
- 搜索和过滤
- 排序（按日期、标题）
- 批量操作

**UI布局：**
```
┌─────────────────────────────────────┐
│ 搜索: [搜索框] [排序: 日期▼]       │
├─────────────────────────────────────┤
│ □ 2026-07-10 Hello World    [编辑] │
│ □ 2026-07-09 My First Post  [编辑] │
│ □ 2026-07-08 Tech Trends    [编辑] │
└─────────────────────────────────────┘
│ [新建文章] [删除选中] [导出选中]    │
└─────────────────────────────────────┘
```

## 4. 用户界面设计

### 4.1 整体布局
```
┌─────────────────────────────────────┐
│ 标题栏: GitHub Pages 博客管理器      │
├─────────┬───────────────────────────┤
│         │                           │
│ 文章    │      主内容区             │
│ 列表    │    (编辑器/预览)          │
│         │                           │
│         │                           │
│         │                           │
├─────────┴───────────────────────────┤
│ 状态栏: 连接状态 | 文件状态 | AI状态 │
└─────────────────────────────────────┘
```

### 4.2 响应式设计
- 桌面：三栏布局（文章列表、编辑器、预览）
- 平板：两栏布局（文章列表、编辑器）
- 手机：单栏布局（切换视图）

## 5. 实现步骤

### 阶段1：基础框架 (1-2天)
1. 创建项目结构
2. 实现基础HTML/CSS布局
3. 实现文件管理模块（File API）
4. 实现文章列表显示

### 阶段2：编辑器功能 (2-3天)
1. 实现分屏编辑器
2. 集成marked.js解析器
3. 实现实时预览
4. 实现保存功能

### 阶段3：AI集成 (1-2天)
1. 实现LMStudio API连接
2. 实现内容生成功能
3. 实现内容优化功能
4. 实现翻译功能

### 阶段4：完善和优化 (1-2天)
1. 添加错误处理
2. 优化用户体验
3. 添加快捷键支持
4. 测试和调试

## 6. 注意事项

### 6.1 安全性
- API密钥管理（如果需要）
- 文件访问权限
- XSS防护

### 6.2 性能
- 大文件处理
- 实时预览优化
- API调用防抖

### 6.3 兼容性
- 现代浏览器支持（Chrome, Firefox, Edge）
- File System Access API兼容性

## 7. 测试策略

### 7.1 单元测试
- 文件管理模块测试
- 编辑器模块测试
- AI助手模块测试

### 7.2 集成测试
- 完整工作流测试
- API调用测试
- 错误处理测试

### 7.3 用户测试
- 界面易用性测试
- 性能测试
- 兼容性测试

## 8. 配置管理

### 8.1 应用配置
```javascript
// config.js
const CONFIG = {
  // GitHub配置
  github: {
    owner: '',      // 仓库所有者
    repo: '',       // 仓库名称
    token: '',      // GitHub Token
    branch: 'main'  // 分支名
  },
  
  // LMStudio配置
  lmstudio: {
    apiUrl: 'http://localhost:1234/v1/chat/completions',
    model: 'local-model',
    temperature: 0.7,
    maxTokens: 2000
  },
  
  // 应用配置
  app: {
    postsDir: '_posts',
    autoSave: true,
    previewDebounce: 300
  }
};
```

### 8.2 用户配置界面
提供设置界面，允许用户配置：
- GitHub仓库信息
- LMStudio API地址
- 应用偏好设置

## 9. 快捷键支持

### 9.1 编辑器快捷键
- `Ctrl+S` / `Cmd+S`: 保存文章
- `Ctrl+Enter` / `Cmd+Enter`: 生成AI内容
- `Ctrl+Shift+P` / `Cmd+Shift+P`: 切换预览
- `Ctrl+Z` / `Cmd+Z`: 撤销
- `Ctrl+Y` / `Cmd+Y`: 重做

### 9.2 全局快捷键
- `Ctrl+N` / `Cmd+N`: 新建文章
- `Ctrl+O` / `Cmd+O`: 打开目录
- `Ctrl+F` / `Cmd+F`: 搜索文章

## 10. 错误处理

### 10.1 文件操作错误
- 目录读取失败
- 文件保存失败
- 权限不足

### 10.2 API错误
- GitHub API调用失败
- LMStudio连接失败
- 网络错误

### 10.3 用户反馈
- Toast通知系统
- 错误日志记录
- 恢复建议