// js/fileManager.js
class FileManager {
  constructor() {
    this.directoryHandle = null;
    this.files = new Map();
    this.currentFile = null;
    this.mode = 'local';
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
}

window.FileManager = FileManager;
