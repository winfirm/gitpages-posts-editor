// js/editor.js
class Editor {
  constructor() {
    this.editorElement = document.getElementById('editor');
    this.previewElement = document.getElementById('preview');
    this.saveButton = document.getElementById('btn-save');
    this.undoButton = document.getElementById('btn-undo');
    this.previewButton = document.getElementById('btn-preview');
    this.filenameInput = document.getElementById('filename-input');
    
    this.currentContent = '';
    this.originalContent = '';
    this.originalFilename = '';
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

    if (this.undoButton) {
      this.undoButton.addEventListener('click', () => {
        this.undoChanges();
      });
    }
    
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

    // 文件名输入框变化时标记为脏
    if (this.filenameInput) {
      this.filenameInput.addEventListener('input', () => {
        this.isDirty = true;
        this.updateSaveButton();
      });
    }

    // 默认隐藏预览面板，点击"显示预览"才展示
    const previewPane = document.querySelector('.preview-pane');
    if (previewPane) {
      previewPane.style.display = 'none';
    }
  }
  
  // 加载内容
  loadContent(content, filename) {
    this.currentContent = content;
    this.originalContent = content;
    this.editorElement.value = content;
    this.isDirty = false;
    this.setFilename(filename || '');
    this.setOriginalFilename(filename || '');
    this.updateSaveButton();
    this.updateUndoButton();
    this.updatePreview();
  }
  
  // 获取内容
  getContent() {
    return this.editorElement.value;
  }
  
  // 获取文件名
  getFilename() {
    return this.filenameInput ? this.filenameInput.value.trim() : '';
  }
  
  // 设置文件名
  setFilename(filename) {
    if (this.filenameInput) {
      this.filenameInput.value = filename || '';
    }
  }
  
  // 获取原始文件名（用于检测是否重命名）
  getOriginalFilename() {
    return this.originalFilename || '';
  }
  
  // 记录原始文件名（用于重命名检测）
  setOriginalFilename(filename) {
    this.originalFilename = filename || '';
  }
  
  // 内容变化处理
  onContentChange() {
    this.isDirty = true;
    this.updateSaveButton();
    this.updateUndoButton();
    
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
      // Show preview
      previewPane.style.display = 'block';
      editorPane.style.flex = '';
      this.previewButton.textContent = 'Hide Preview';
    } else {
      // Hide preview → editor fills the space
      previewPane.style.display = 'none';
      editorPane.style.flex = '';
      this.previewButton.textContent = 'Show Preview';
    }
  }
  
  // 保存按钮状态（内容变了 || 文件名变了）
  updateSaveButton() {
    const filenameChanged = this.filenameInput && this.originalFilename !== undefined &&
      this.getFilename() !== this.getOriginalFilename();
    this.saveButton.disabled = !this.isDirty && !filenameChanged;
  }

  // 文件名是否被修改过
  isFilenameDirty() {
    return this.getFilename() !== this.getOriginalFilename();
  }

  // 撤销按钮状态（仅在有未保存修改时可用）
  updateUndoButton() {
    if (this.undoButton) {
      const hasChanges = this.getContent() !== this.originalContent;
      this.undoButton.disabled = !hasChanges;
    }
  }

  // 撤销修改：恢复到原始内容
  undoChanges() {
    if (this.getContent() === this.originalContent) return;

    const confirmed = confirm('Undo all changes and restore initial state?');
    if (!confirmed) return;

    this.editorElement.value = this.originalContent;
    this.currentContent = this.originalContent;
    this.isDirty = false;
    this.updateSaveButton();
    this.updateUndoButton();
    this.updatePreview();

    Utils.showToast('Changes undone, restored to initial content', 'info');
  }

  // 标记为已保存（保存成功后调用，更新原始状态基准）
  markClean() {
    const content = this.getContent();
    this.originalContent = content;
    this.currentContent = content;
    this.isDirty = false;
    this.setOriginalFilename(this.getFilename());
    this.updateSaveButton();
    this.updateUndoButton();
  }
  
  // 保存（内容变更或文件名变更都可触发）
  async save() {
    if (!this.isDirty && !this.isFilenameDirty()) {
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
    if (this.filenameInput) {
      this.filenameInput.disabled = !enabled;
    }
    if (enabled) {
      this.updateSaveButton(); // 由 updateSaveButton 统一计算
    } else {
      this.saveButton.disabled = true;
    }
    if (this.undoButton) {
      this.undoButton.disabled = !enabled;
    }
  }
  
  // 替换内容（AI 应用时使用：保留原始内容锚点和文件名，标记为脏）
  replaceContent(content) {
    this.editorElement.value = content;
    this.currentContent = content;
    this.isDirty = true;
    this.updateSaveButton();
    this.updateUndoButton();
    this.updatePreview();
  }

  // 清空编辑器
  clear() {
    this.editorElement.value = '';
    this.currentContent = '';
    this.originalContent = '';
    this.isDirty = false;
    this.setFilename('');
    this.setOriginalFilename('');
    this.updateSaveButton();
    this.updateUndoButton();
    this.updatePreview();
  }
}

// 导出到全局
window.Editor = Editor;
