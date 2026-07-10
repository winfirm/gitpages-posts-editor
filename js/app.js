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
    this.bindEvents();

    this.checkBrowserSupport();

    this.loadSettings();

    this.updateUIState();

    document.addEventListener('editor:save', (e) => {
      this.saveCurrentArticle(e.detail.content);
    });

    console.log('App initialized');
  }

  bindEvents() {
    const openDirBtn = document.getElementById('btn-open-dir');
    if (openDirBtn) {
      openDirBtn.addEventListener('click', () => {
        this.openDirectory();
      });
    }

    const loadGithubBtn = document.getElementById('btn-load-github');
    if (loadGithubBtn) {
      loadGithubBtn.addEventListener('click', () => {
        this.loadGithubFiles();
      });
    }

    const newArticleBtn = document.getElementById('btn-new-article');
    if (newArticleBtn) {
      newArticleBtn.addEventListener('click', () => {
        this.createNewArticle();
      });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.searchArticles(e.target.value);
      }, 300));
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortArticles(e.target.value);
      });
    }

    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showSettings();
      });
    }

    const closeSettingsBtn = document.getElementById('btn-close-settings');
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        this.hideSettings();
      });
    }

    const saveSettingsBtn = document.getElementById('btn-save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

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

      this.editor.loadContent(article.rawContent);
      this.editor.setEnabled(true);

      this.updateArticleSelection(filename);
      this.updateStatusFile(filename);

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
      if (this.mode === 'github') {
        await this.fileManager.saveGithubArticle(this.currentArticle.filename, content);
      } else {
        await this.fileManager.saveArticle(this.currentArticle.filename, content);
      }
      Utils.showToast('文章已保存', 'success');

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
      let article;
      if (this.mode === 'github') {
        article = await this.fileManager.createGithubArticle(title, {
          categories: [],
          tags: []
        });
      } else {
        article = await this.fileManager.createArticle(title, {
          categories: [],
          tags: []
        });
      }

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
    if (settings.github) {
      this.fileManager.setGithubConfig(settings.github);
    }

    if (settings.lmstudio) {
      this.aiAssistant.updateConfig(settings.lmstudio);
    }

    // 如果有GitHub配置，自动加载远程文件
    if (settings.github?.token && settings.github?.owner && settings.github?.repo) {
      this.loadGithubFiles();
    }
  }

  async loadGithubFiles() {
    try {
      Utils.showToast('正在加载 GitHub 仓库...', 'info');
      await this.fileManager.loadGithubFiles();
      this.mode = 'github';
      this.updateArticleList();
      this.updateStatusMode('GitHub');
      Utils.showToast('GitHub 仓库加载成功', 'success');
    } catch (error) {
      console.error('Load GitHub files error:', error);
      Utils.showToast(`加载 GitHub 仓库失败: ${error.message}`, 'error');
    }
  }

  async testConnection() {
    // 测试 GitHub 连接
    const githubOwner = document.getElementById('github-owner').value;
    const githubRepo = document.getElementById('github-repo').value;
    const githubToken = document.getElementById('github-token').value;

    if (githubToken && githubOwner && githubRepo) {
      try {
        // 临时设置配置进行测试
        this.fileManager.setGithubConfig({
          owner: githubOwner,
          repo: githubRepo,
          token: githubToken,
          branch: document.getElementById('github-branch').value
        });
        
        await this.fileManager.githubApiCall(`/repos/${githubOwner}/${githubRepo}`);
        Utils.showToast('GitHub 连接测试成功', 'success');
      } catch (error) {
        Utils.showToast(`GitHub 连接测试失败: ${error.message}`, 'error');
      }
    } else {
      Utils.showToast('请先填写完整的 GitHub 配置', 'warning');
    }
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
