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
    this.bindEvents();
  }
  
  bindEvents() {
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
    
    const tabs = document.querySelectorAll('.ai-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });
    
    const generateBtn = document.getElementById('btn-generate');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generateContent();
      });
    }
    
    const optimizeBtn = document.getElementById('btn-optimize');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => {
        this.optimizeContent();
      });
    }
    
    const translateBtn = document.getElementById('btn-translate');
    if (translateBtn) {
      translateBtn.addEventListener('click', () => {
        this.translateContent();
      });
    }
    
    const applyBtn = document.getElementById('btn-apply-ai');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyAIResult();
      });
    }
    
    const copyBtn = document.getElementById('btn-copy-ai');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyAIResult();
      });
    }
  }
  
  showModal() {
    const modal = document.getElementById('ai-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }
  
  hideModal() {
    const modal = document.getElementById('ai-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
  
  switchTab(tabName) {
    const tabs = document.querySelectorAll('.ai-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    const contents = document.querySelectorAll('.ai-tab-content');
    contents.forEach(content => {
      const isActive = content.id === `tab-${tabName}`;
      content.style.display = isActive ? 'block' : 'none';
      content.classList.toggle('active', isActive);
    });
  }
  
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
  
  updateStatus(text, type = 'info') {
    const statusElement = document.getElementById('status-ai');
    if (statusElement) {
      statusElement.textContent = text;
      statusElement.className = `status-${type}`;
    }
  }
  
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
  
  async optimizeContent() {
    const instructions = document.getElementById('ai-optimize-instructions').value;
    if (!instructions) {
      Utils.showToast('请输入优化指令', 'warning');
      return;
    }
    
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
  
  async translateContent() {
    const targetLanguage = document.getElementById('ai-target-language').value;
    
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
  
  showAIResult(content) {
    const resultDiv = document.getElementById('ai-result');
    const contentDiv = document.getElementById('ai-result-content');
    
    if (resultDiv && contentDiv) {
      contentDiv.innerHTML = marked.parse(content);
      resultDiv.style.display = 'block';
      
      this.currentResult = content;
    }
  }
  
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
  
  showLoading(message) {
    console.log(message);
  }
  
  hideLoading() {
    console.log('Loading complete');
  }
  
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

window.AIAssistant = AIAssistant;
