// js/utils.js
const Utils = {
  // 格式化日期
  formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },
  
  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // 显示Toast通知
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  },
  
  // 解析YAML Frontmatter
  parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return { frontmatter: {}, content: content };
    }
    
    const frontmatter = {};
    const lines = match[1].split('\n');
    
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // 处理数组
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => v.trim());
        }
        
        frontmatter[key] = value;
      }
    });
    
    return {
      frontmatter,
      content: match[2]
    };
  },
  
  // 生成YAML Frontmatter
  generateFrontmatter(article) {
    const lines = ['---'];
    lines.push(`title: ${article.title}`);
    lines.push(`date: ${article.date}`);
    lines.push(`layout: ${article.layout || 'post'}`);
    
    if (article.categories && article.categories.length > 0) {
      lines.push(`categories: [${article.categories.join(', ')}]`);
    }
    
    if (article.tags && article.tags.length > 0) {
      lines.push(`tags: [${article.tags.join(', ')}]`);
    }
    
    if (article.excerpt) {
      lines.push(`excerpt: ${article.excerpt}`);
    }
    
    lines.push('---');
    return lines.join('\n');
  },
  
  // 从文件名提取日期
  extractDateFromFilename(filename) {
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
  },
  
  // 从标题生成文件名
  generateFilename(title, date) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${date}-${slug}.md`;
  }
};

// 导出到全局
window.Utils = Utils;
