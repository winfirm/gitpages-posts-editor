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
        this.updateStatus('AI: Connected', 'success');
        return true;
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      this.isConnected = false;
      this.updateStatus('AI: Disconnected', 'error');
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
      Utils.showToast('Please enter a prompt', 'warning');
      return;
    }
    
    this.showLoading('Generating...');
    
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a professional tech blogger skilled at writing high-quality Markdown technical articles. Generate complete blog post content based on the user\'s title or prompt. Include appropriate headings, paragraphs, code examples (if relevant), and technical details.'
        },
        {
          role: 'user',
          content: `Write a blog post based on the following prompt:\n\n${prompt}`
        }
      ];
      
      const result = await this.callAPI(messages);
      this.showAIResult(result);
      Utils.showToast('Content generated', 'success');
    } catch (error) {
      console.error('Generate error:', error);
      Utils.showToast(`Generate failed: ${error.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }
  
  async optimizeContent() {
    const instructions = document.getElementById('ai-optimize-instructions').value;
    if (!instructions) {
      Utils.showToast('Please enter optimization instructions', 'warning');
      return;
    }
    
    const editor = window.app?.editor;
    if (!editor) {
      Utils.showToast('Editor not initialized', 'error');
      return;
    }
    
    const currentContent = editor.getContent();
    if (!currentContent) {
      Utils.showToast('No content to optimize', 'warning');
      return;
    }
    
    this.showLoading('Optimizing...');
    
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a professional technical editor skilled at optimizing and improving tech articles. Follow the user\'s instructions to optimize the provided Markdown content. Preserve the core meaning while improving structure, language, and readability.'
        },
        {
          role: 'user',
          content: `Optimize the following article:\n\nInstructions: ${instructions}\n\nCurrent content:\n${currentContent}`
        }
      ];
      
      const result = await this.callAPI(messages);
      this.showAIResult(result);
      Utils.showToast('Content optimized', 'success');
    } catch (error) {
      console.error('Optimize error:', error);
      Utils.showToast(`Optimize failed: ${error.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }
  
  async translateContent() {
    const targetLanguage = document.getElementById('ai-target-language').value;
    
    const editor = window.app?.editor;
    if (!editor) {
      Utils.showToast('Editor not initialized', 'error');
      return;
    }
    
    const currentContent = editor.getContent();
    if (!currentContent) {
      Utils.showToast('No content to translate', 'warning');
      return;
    }
    
    this.showLoading('Translating...');
    
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
          content: `You are a professional technical translator skilled at translating tech articles into ${languageNames[targetLanguage] || targetLanguage}. Preserve Markdown formatting exactly — only translate the text content. Keep technical terms in their original form or use common translations.`
        },
        {
          role: 'user',
          content: `Translate the following article into ${languageNames[targetLanguage] || targetLanguage}:\n\n${currentContent}`
        }
      ];
      
      const result = await this.callAPI(messages);
      this.showAIResult(result);
      Utils.showToast('Translation complete', 'success');
    } catch (error) {
      console.error('Translate error:', error);
      Utils.showToast(`Translate failed: ${error.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }
  
  showAIResult(content) {
    const resultDiv = document.getElementById('ai-result');
    const contentDiv = document.getElementById('ai-result-content');
    const actionDiv = document.querySelector('.ai-result-actions');
    
    if (resultDiv && contentDiv) {
      contentDiv.innerHTML = marked.parse(content);
      resultDiv.style.display = 'block';
      
      // Restore apply/copy buttons (hidden during showLoading)
      if (actionDiv) actionDiv.style.display = '';
      
      this.currentResult = content;
    }
  }
  
  applyAIResult() {
    if (!this.currentResult) {
      Utils.showToast('No result to apply', 'warning');
      return;
    }

    const editor = window.app?.editor;
    if (editor) {
      const currentContent = editor.getContent();

      // 统一换行符（GitHub 可能用 \r\n，导致字符串定位失败）
      const normalized = currentContent.replace(/\r\n/g, '\n');

      // 查找 frontmatter 的结束位置（---\n...\n---\n）
      const fmStart = normalized.indexOf('---\n');
      if (fmStart === 0) {
        const fmEnd = normalized.indexOf('\n---\n', 4); // 从第4个字符后开始找
        if (fmEnd !== -1) {
          // 保留原始 frontmatter 文本，只替换正文
          const frontmatterPart = normalized.substring(0, fmEnd + 5); // 包含结尾的 \n---\n
          editor.replaceContent(frontmatterPart + this.currentResult);
        } else {
          editor.replaceContent(this.currentResult);
        }
      } else {
        // 没有 frontmatter，直接使用 AI 结果
        editor.replaceContent(this.currentResult);
      }

      this.hideModal();
      Utils.showToast('Content applied to editor', 'success');
    }
  }
  
  async copyAIResult() {
    if (!this.currentResult) {
      Utils.showToast('Nothing to copy', 'warning');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(this.currentResult);
      Utils.showToast('Copied to clipboard', 'success');
    } catch (error) {
      console.error('Copy error:', error);
      Utils.showToast('Copy failed', 'error');
    }
  }
  
  showLoading(message) {
    const resultDiv = document.getElementById('ai-result');
    const contentDiv = document.getElementById('ai-result-content');
    const actionDiv = document.querySelector('.ai-result-actions');

    // Show result area with loading spinner
    if (resultDiv) resultDiv.style.display = 'block';
    if (contentDiv) {
      contentDiv.innerHTML = `<div class="ai-loading">
        <div class="ai-loading-spinner"></div>
        <div class="ai-loading-text">${message}</div>
      </div>`;
    }
    // Hide apply/copy buttons; showAIResult will restore them
    if (actionDiv) actionDiv.style.display = 'none';

    // Disable tab action buttons to prevent duplicate submissions
    const tabBtns = ['btn-generate', 'btn-optimize', 'btn-translate'];
    tabBtns.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = true;
    });
  }

  hideLoading() {
    // Re-enable action buttons
    const tabBtns = ['btn-generate', 'btn-optimize', 'btn-translate'];
    tabBtns.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = false;
    });

    // Restore apply/copy area (content may still show loading if showAIResult wasn't called)
    const actionDiv = document.querySelector('.ai-result-actions');
    if (actionDiv) actionDiv.style.display = '';
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
