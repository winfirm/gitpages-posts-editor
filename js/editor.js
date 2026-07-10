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
