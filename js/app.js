// js/app.js
const App = {
  state: {
    mode: 'local', // 'local' or 'github'
    currentFile: null,
    articles: [],
    settings: {
      github: {
        owner: '',
        repo: '',
        token: '',
        branch: 'main'
      },
      lmstudio: {
        url: 'http://localhost:1234/v1/chat/completions',
        model: 'local-model'
      },
      postsDir: '_posts',
      autoSave: true
    }
  },
  
  init() {
    this.loadSettings();
    this.bindEvents();
    this.updateStatus();
  },
  
  loadSettings() {
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        this.state.settings = { ...this.state.settings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  },
  
  saveSettings() {
    localStorage.setItem('app-settings', JSON.stringify(this.state.settings));
  },
  
  bindEvents() {
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      document.getElementById('settings-modal').style.display = 'flex';
    });
    
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      document.getElementById('settings-modal').style.display = 'none';
    });
    
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      this.saveSettingsFromForm();
      document.getElementById('settings-modal').style.display = 'none';
      Utils.showToast('设置已保存');
    });
  },
  
  saveSettingsFromForm() {
    this.state.settings.github.owner = document.getElementById('github-owner')?.value || '';
    this.state.settings.github.repo = document.getElementById('github-repo')?.value || '';
    this.state.settings.github.token = document.getElementById('github-token')?.value || '';
    this.state.settings.github.branch = document.getElementById('github-branch')?.value || 'main';
    this.state.settings.lmstudio.url = document.getElementById('lmstudio-url')?.value || '';
    this.state.settings.lmstudio.model = document.getElementById('lmstudio-model')?.value || '';
    this.state.settings.postsDir = document.getElementById('posts-dir')?.value || '_posts';
    this.state.settings.autoSave = document.getElementById('auto-save')?.checked || false;
    this.saveSettings();
  },
  
  updateStatus() {
    document.getElementById('status-mode').textContent = `模式: ${this.state.mode === 'local' ? '本地' : 'GitHub'}`;
    document.getElementById('status-file').textContent = `文件: ${this.state.currentFile || '未选择'}`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
