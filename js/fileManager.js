// js/fileManager.js
class FileManager {
  constructor() {
    this.directoryHandle = null;
    this.files = new Map();
    this.currentFile = null;
    this.mode = 'local';
    this.githubConfig = null;
    this.branch = 'main';
  }
  
  isSupported() {
    return 'showDirectoryPicker' in window;
  }
  
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
  
  async loadFiles() {
    this.files.clear();
    
    if (!this.directoryHandle) {
      return;
    }
    
    let postsDir;
    try {
      postsDir = await this.directoryHandle.getDirectoryHandle('_posts');
    } catch (error) {
      postsDir = await this.directoryHandle.getDirectoryHandle('_posts', { create: true });
    }
    
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
  
  getArticles() {
    return Array.from(this.files.values()).sort((a, b) => {
      const dateA = a.frontmatter.date || '';
      const dateB = b.frontmatter.date || '';
      return dateB.localeCompare(dateA);
    });
  }
  
  async readArticle(filename) {
    const article = this.files.get(filename);
    if (!article) {
      throw new Error(`文章不存在: ${filename}`);
    }
    
    this.currentFile = filename;
    return article;
  }
  
  async saveArticle(filename, content) {
    const article = this.files.get(filename);
    
    if (!article) {
      await this.createArticle(filename, content);
      return;
    }
    
    const writable = await article.handle.createWritable();
    await writable.write(content);
    await writable.close();
    
    const { frontmatter, content: articleContent } = Utils.parseFrontmatter(content);
    article.frontmatter = frontmatter;
    article.content = articleContent;
    article.rawContent = content;
    article.lastModified = Date.now();
    
    return article;
  }
  
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
    
    const postsDir = await this.directoryHandle.getDirectoryHandle('_posts', { create: true });
    
    const fileHandle = await postsDir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    
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

  // GitHub API 方法
  setGithubConfig(config) {
    this.githubConfig = config;
    if (config?.branch) {
      this.branch = config.branch;
    }
  }

  async githubApiCall(endpoint, options = {}) {
    if (!this.githubConfig?.token) {
      throw new Error('GitHub Token 未配置');
    }

    const url = `https://api.github.com${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${this.githubConfig.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`GitHub API 错误: ${response.status} - ${error.message || '未知错误'}`);
    }

    return response.json();
  }

  async loadGithubFiles() {
    this.files.clear();
    this.mode = 'github';

    if (!this.githubConfig?.owner || !this.githubConfig?.repo) {
      throw new Error('请先配置 GitHub 仓库信息');
    }

    const { owner, repo } = this.githubConfig;
    
    console.log('Loading GitHub files:', { owner, repo, branch: this.branch });
    
    try {
      // 获取 _posts 目录内容
      const contents = await this.githubApiCall(
        `/repos/${owner}/${repo}/contents/_posts?ref=${this.branch}`
      );
      
      console.log('GitHub API response:', contents);

      // 检查是否是数组
      if (!Array.isArray(contents)) {
        console.error('Unexpected response:', contents);
        throw new Error('无法获取 _posts 目录内容');
      }

      console.log(`Found ${contents.length} items in _posts`);

      // 过滤 .md 文件并加载内容
      for (const item of contents) {
        console.log('Processing item:', item.name, item.type);
        if (item.type === 'file' && item.name.endsWith('.md')) {
          try {
            // 获取文件内容
            const fileData = await this.githubApiCall(
              `/repos/${owner}/${repo}/contents/_posts/${item.name}?ref=${this.branch}`
            );
            
            console.log('File data received:', item.name);
            
            // 解码 Base64 内容 (支持中文)
            const content = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
            const { frontmatter, content: articleContent } = Utils.parseFrontmatter(content);
            
            console.log('Parsed frontmatter:', frontmatter);
            
            this.files.set(item.name, {
              sha: fileData.sha,
              filename: item.name,
              path: item.path,
              frontmatter,
              content: articleContent,
              rawContent: content,
              lastModified: new Date(item.commit?.committer?.date || Date.now()).getTime()
            });
          } catch (err) {
            console.error(`加载文件 ${item.name} 失败:`, err);
          }
        }
      }
      
      console.log('Total files loaded:', this.files.size);

      return Array.from(this.files.values());
    } catch (error) {
      console.error('GitHub load error:', error);
      if (error.message.includes('404')) {
        throw new Error('_posts 目录不存在，请确认仓库中有 _posts 目录');
      }
      throw error;
    }
  }

  async saveGithubArticle(filename, content) {
    if (!this.githubConfig?.owner || !this.githubConfig?.repo) {
      throw new Error('请先配置 GitHub 仓库信息');
    }

    const { owner, repo } = this.githubConfig;
    const article = this.files.get(filename);
    const path = `_posts/${filename}`;
    
    const body = {
      message: `Update post: ${filename}`,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: this.branch
    };

    // 如果文件已存在，需要提供 SHA
    if (article?.sha) {
      body.sha = article.sha;
    }

    const result = await this.githubApiCall(
      `/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify(body)
      }
    );

    // 更新本地缓存
    const { frontmatter, content: articleContent } = Utils.parseFrontmatter(content);
    this.files.set(filename, {
      sha: result.content.sha,
      filename,
      path,
      frontmatter,
      content: articleContent,
      rawContent: content,
      lastModified: Date.now()
    });

    return this.files.get(filename);
  }

  async createGithubArticle(title, options = {}) {
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
    
    return this.saveGithubArticle(filename, content);
  }
}

window.FileManager = FileManager;
