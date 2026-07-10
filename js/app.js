// js/app.js
class App {
  constructor() {
    this.fileManager = new FileManager();
    this.editor = new Editor();
    this.aiAssistant = new AIAssistant();

    this.currentArticle = null;

    this.init();
  }

  init() {
    this.bindEvents();

    this.loadSettings();

    this.updateStatusMode('GitHub');

    document.addEventListener('editor:save', (e) => {
      this.saveCurrentArticle(e.detail.content);
    });

    console.log('App initialized');
  }

  bindEvents() {
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

  updateArticleList() {
    const articleList = document.getElementById('article-list');
    if (!articleList) {
      console.error('Article list element not found');
      return;
    }

    const articles = this.fileManager.getArticles();
    console.log('Rendering articles:', articles.length);
    
    articleList.innerHTML = '';

    if (articles.length === 0) {
      articleList.innerHTML = '<li class="article-item" style="color: #94a3b8; text-align: center; padding: 2rem;">No articles found</li>';
      this.updateArticleCount(0);
      return;
    }

    articles.forEach(article => {
      const li = this.createArticleListItem(article);
      articleList.appendChild(li);
    });

    this.updateArticleCount(articles.length);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async openArticle(filename) {
    try {
      const article = await this.fileManager.readArticle(filename);
      this.currentArticle = article;

      this.editor.loadContent(article.rawContent, filename);
      this.editor.setEnabled(true);

      this.updateArticleSelection(filename);
      this.updateStatusFile(filename);

      const aiButton = document.getElementById('btn-ai');
      if (aiButton) {
        aiButton.style.display = '';
        aiButton.disabled = false;
      }

    } catch (error) {
      console.error('Open article error:', error);
      Utils.showToast(`Failed to open article: ${error.message}`, 'error');
    }
  }

  async saveCurrentArticle(content) {
    if (!this.currentArticle) {
      Utils.showToast('No article selected', 'warning');
      return;
    }

      // Read filename from input; fall back to original
    const newFilename = this.editor.getFilename() || this.currentArticle.filename;
    const oldFilename = this.currentArticle.filename;
    const isRename = newFilename !== oldFilename;

    // Save old SHA before renaming (needed for DELETE)
    const oldSha = isRename ? this.currentArticle.sha : null;

    try {
      // 1. 保存新文件（GitHub PUT），更新当前文章引用
      const savedArticle = await this.fileManager.saveGithubArticle(newFilename, content);
      this.currentArticle = savedArticle;

      // 2. Delete old file from GitHub if renamed
      if (isRename) {
        try {
          await this.fileManager.deleteGithubArticle(oldFilename, oldSha);
        } catch (deleteError) {
          console.warn('Old file deletion failed (new file is safe):', deleteError);
          Utils.showToast(
            `New file saved, but old file (${oldFilename}) could not be deleted. Please clean up manually.`,
            'warning',
            6000
          );
        }
      }

      this.updateArticleList();
      this.updateStatusFile(newFilename);
      Utils.showToast(
        isRename ? `Renamed & saved (${oldFilename} → ${newFilename})` : 'Article saved',
        'success'
      );

      // Reset undo anchor after successful save
      this.editor.markClean();

    } catch (error) {
      console.error('Save article error:', error);
      if (error.message.includes('permission') || error.message.includes('Resource not accessible')) {
        Utils.showToast(`Save failed - permission issue<br><br>${error.message}`, 'error', 12000);
      } else {
        Utils.showToast(`Save failed: ${error.message}`, 'error', 5000);
      }
    }
  }

  async createNewArticle() {
    const title = prompt('Enter article title:');
    if (!title) return;

    try {
      const article = await this.fileManager.createGithubArticle(title);

      await this.openArticle(article.filename);
      this.updateArticleList();

      Utils.showToast('Article created', 'success');

    } catch (error) {
      console.error('Create article error:', error);
      Utils.showToast(`Create failed: ${error.message}`, 'error');
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
      const li = this.createArticleListItem(article);
      articleList.appendChild(li);
    });
  }

  // Shared list-item factory (includes delete button)
  createArticleListItem(article) {
    const li = document.createElement('li');
    li.className = 'article-item';
    li.dataset.filename = article.filename;

    const title = article.frontmatter.title || article.filename;
    const date = article.frontmatter.date || '';
    const tags = article.frontmatter.tags || [];

    li.innerHTML = `
      <button class="article-item-delete" title="Delete article">×</button>
      <div class="article-item-title">${this.escapeHtml(title)}</div>
      <div class="article-item-date">${date}</div>
      ${tags.length > 0 ? `
        <div class="article-item-tags">
          ${tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
    `;

    // Click row to open article
    li.addEventListener('click', (e) => {
      if (e.target.closest('.article-item-delete')) return;
      this.openArticle(article.filename);
    });

    // Delete button handler
    const deleteBtn = li.querySelector('.article-item-delete');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteArticle(article.filename);
    });

    return li;
  }

  async deleteArticle(filename) {
    const article = this.fileManager.files.get(filename);
    if (!article) {
      Utils.showToast('Article not found', 'error');
      return;
    }

    const title = article.frontmatter.title || filename;
    const confirmed = confirm(`Delete "${title}"?\n\nThis will permanently delete the file from the GitHub repository.`);
    if (!confirmed) return;

    try {
      await this.fileManager.deleteGithubArticle(filename, article.sha);

      // Clear editor if the deleted article was open
      if (this.currentArticle && this.currentArticle.filename === filename) {
        this.currentArticle = null;
        this.editor.clear();
        this.editor.setEnabled(false);
        document.getElementById('btn-ai').style.display = 'none';
        this.updateStatusFile('none selected');
      }

      this.updateArticleList();
      Utils.showToast(`Article "${title}" deleted`, 'success');

    } catch (error) {
      console.error('Delete article error:', error);
      Utils.showToast(`Delete failed: ${error.message}`, 'error');
    }
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
      statusFile.textContent = `Articles: ${count}`;
    }
  }

  updateStatusMode(mode) {
    const statusMode = document.getElementById('status-mode');
    if (statusMode) {
      statusMode.textContent = `Mode: ${mode}`;
    }
  }

  updateStatusFile(filename) {
    const statusFile = document.getElementById('status-file');
    if (statusFile) {
      statusFile.textContent = `File: ${filename}`;
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
      app: {} // reserved for future use
    };

    localStorage.setItem('blogManagerSettings', JSON.stringify(settings));
    this.applySettings(settings);

    Utils.showToast('Settings saved', 'success');
    this.hideSettings();
  }

  applySettings(settings) {
    if (settings.github) {
      this.fileManager.setGithubConfig(settings.github);
    }

    if (settings.lmstudio) {
      this.aiAssistant.updateConfig(settings.lmstudio);
      // Test AI connection on startup (non-blocking)
      this.aiAssistant.testConnection().catch(() => {});
    }

    // Auto-load remote files when GitHub config is complete
    if (settings.github?.token && settings.github?.owner && settings.github?.repo) {
      this.loadGithubFiles();
    }
  }

  async loadGithubFiles() {
    try {
      Utils.showToast('Loading GitHub repository...', 'info');
      await this.fileManager.loadGithubFiles();

      console.log('Files loaded, updating article list...');
      const articles = this.fileManager.getArticles();
      console.log('Articles to display:', articles.length, articles);
      
      this.updateArticleList();
      this.updateStatusMode('GitHub');
      Utils.showToast(`Repository loaded (${articles.length} articles)`, 'success');
    } catch (error) {
      console.error('Load GitHub files error:', error);
      Utils.showToast(`Failed to load repository: ${error.message}`, 'error');
    }
  }

  async testConnection() {
    // Test GitHub connection
    const githubOwner = document.getElementById('github-owner').value;
    const githubRepo = document.getElementById('github-repo').value;
    const githubToken = document.getElementById('github-token').value;

    if (githubToken && githubOwner && githubRepo) {
      try {
        // Temporarily apply config for test
        this.fileManager.setGithubConfig({
          owner: githubOwner,
          repo: githubRepo,
          token: githubToken,
          branch: document.getElementById('github-branch').value
        });

        Utils.showToast('Checking token permissions...', 'info', 2000);
        
        const permResult = await this.fileManager.checkGithubPermissions();

        if (!permResult.valid) {
          Utils.showToast(`Connection failed: ${permResult.message}`, 'error', 5000);
          return;
        }

        // Show permission result
        if (permResult.canWrite) {
          if (permResult.isFineGrained) {
            Utils.showToast('Connected — token has write access', 'success', 4000);
          } else {
            Utils.showToast(`Connected — scopes: ${permResult.scopes.join(', ')}`, 'success', 5000);
          }
        } else {
          // Token is valid but missing write permission
          const scopeMsg = permResult.isFineGrained
            ? 'Token type: Fine-grained PAT'
            : `Current scopes: ${permResult.scopes.join(', ') || 'none'}`;
          
          Utils.showToast(
            `Connected but no write permission<br>${scopeMsg}<br><br>` +
            `To save articles, add the following to your token:<br>` +
            `• Classic Token: add repo or public_repo scope<br>` +
            `• Fine-grained Token: set Contents to "Read and write"`,
            'warning',
            8000
          );
        }
      } catch (error) {
        Utils.showToast(`Connection test failed: ${error.message}`, 'error', 5000);
      }
    } else {
      Utils.showToast('Please complete GitHub configuration first', 'warning');
    }
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
