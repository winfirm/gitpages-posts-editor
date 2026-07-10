# GitPages Posts Editor

一个纯前端单页应用，通过 GitHub API 管理 GitHub Pages 博客（Jekyll `_posts`）。

无需后端服务器，所有代码在浏览器中运行，配置信息存储在 `localStorage`。

[Gitpages Posts Editor](https://winfirm.top/gitpages-posts-editor/)

[README English](./README.md)

---

![demo](./shots/demo.webp)

## 功能特性

- **GitHub API 集成**
  - 加载远程仓库 `_posts` 目录，解析 Jekyll frontmatter
  - 创建、编辑、重命名、删除文章
  - Token 权限检测（支持 Classic PAT 和 Fine-grained PAT）
- **Markdown 编辑器**
  - 分屏编辑 + 实时预览（marked.js + highlight.js）
  - 前端自动分离/拼接 frontmatter，保存时保留完整格式
  - 内容修改检测、一键撤销
- **文件名可编辑**
  - 工具栏直接修改文件名，保存后自动在 Git 仓库中重命名（新建 → 删除旧文件）
- **AI 助手（LMStudio）**
  - 内容生成、优化、翻译
  - AI 结果只替换正文，保留原始 frontmatter
  - 加载动画 + 连接状态指示
- **文章管理**
  - 搜索、排序（日期 / 标题）
  - 列表项悬停显示删除按钮（× → 确认 → GitHub API DELETE）
- **暗色主题 UI**，响应式布局

## 快速开始

### 前置条件

一个 GitHub 仓库，根目录下有 `_posts` 文件夹，内含 Jekyll 格式的 `.md` 文章。

### 1. 获取 GitHub Token

- 访问 https://github.com/settings/tokens
- 点击 **Fine-grained personal access tokens**
- 点击 **Generate new token**
- 点击 **Add permissions** -> **Contents** -> **Access: Read and write**
- 复制生成的 Token（格式：`ghp_xxxxxxxxxxxx`）

### 2. 启动应用

```bash
# 直接用浏览器打开（本地文件模式，仅查看）
open index.html

# 推荐：用本地服务器启动（安全限制更少）
python3 -m http.server 8000
# 访问 http://localhost:8000
```

### 3. 配置并加载

1. 点击 **设置**
2. 填写：
   - 仓库所有者（用户名）
   - 仓库名称
   - GitHub Token
   - 分支（默认 `main`）
3. 点击 **测试连接** 验证 Token 权限
4. 保存设置，应用自动加载 `_posts` 目录

### 配置 LMStudio

1. 下载安装 [LMStudio](https://lmstudio.ai/)
2. 加载模型（如 Llama 3、Qwen 等）
3. 启动本地服务器（默认 `http://localhost:1234`）
4. 在应用设置中填入 API 地址和模型名称

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + S` | 保存文章 |
| `Cmd/Ctrl + Enter` | 生成 AI 内容（AI 面板打开时） |

## 项目结构

```
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式（暗色主题）
├── js/
│   ├── app.js              # 应用主逻辑、事件绑定
│   ├── fileManager.js      # GitHub API 文件管理（CRUD）
│   ├── editor.js           # 编辑器、预览、撤销、文件名编辑
│   ├── aiAssistant.js      # LMStudio AI 助手
│   └── utils.js            # 工具函数（frontmatter 解析/生成、Toast）
├── docs/
│   └── plans/              # 设计文档
└── README.md
```

## 技术栈

| 技术 | 用途 |
|------|------|
| HTML5 / CSS3 / ES6+ | 前端基础 |
| [marked.js](https://marked.js.org/) | Markdown → HTML 渲染 |
| [highlight.js](https://highlightjs.org/) | 代码块语法高亮 |
| GitHub REST API v3 | 仓库内容读写 |
| LMStudio API (OpenAI 兼容) | 本地大模型推理 |

## 浏览器兼容

- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Firefox 90+
- ⚠️ Safari（未充分测试）

## 许可证

MIT
