// js/fileManager.js
class FileManager {
  constructor() {
    this.files = new Map();
    this.currentFile = null;
    this.githubConfig = null;
    this.branch = 'main';
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
      throw new Error(`Article not found: ${filename}`);
    }

    this.currentFile = filename;
    return article;
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

  async checkGithubPermissions() {
    if (!this.githubConfig?.token) {
      return { valid: false, scopes: [], message: 'GitHub Token not configured' };
    }

    const { owner, repo } = this.githubConfig;
    if (!owner || !repo) {
      return { valid: false, scopes: [], message: 'Please configure GitHub repository info first' };
    }

    try {
      // 1. Check token scopes
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${this.githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const scopesHeader = response.headers.get('X-OAuth-Scopes') || '';
      const scopes = scopesHeader ? scopesHeader.split(',').map(s => s.trim()).filter(Boolean) : [];

      // Fine-grained tokens don't return scopes in headers
      const isFineGrained = scopes.length === 0 && response.status === 200;

      // 2. Check write access
      const hasWriteAccess = scopes.some(s => s === 'repo' || s === 'public_repo' || s === 'gist');

      let canWrite = hasWriteAccess;

      if (isFineGrained) {
        // Fine-grained token: test by probing the repo
        try {
          const testResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
              'Authorization': `token ${this.githubConfig.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (!testResponse.ok) {
            return {
              valid: false,
              scopes: [],
              isFineGrained: true,
              message: `Token has no access to repository ${owner}/${repo}`
            };
          }

          const repoData = await testResponse.json();
          const permissions = repoData.permissions || {};

          // repoData.permissions includes push: true/false
          canWrite = permissions.push === true;

          return {
            valid: true,
            scopes: [],
            isFineGrained: true,
            canWrite,
            message: canWrite
              ? 'Token is valid with write access'
              : 'Token is valid but lacks write access'
          };
        } catch (e) {
          return {
            valid: true,
            scopes: [],
            isFineGrained: true,
            canWrite: false,
            message: 'Could not determine token write access — check token permissions if saving fails'
          };
        }
      }

      // Classic token: check via scope
      return {
        valid: true,
        scopes,
        isFineGrained: false,
        canWrite,
        message: canWrite
          ? `Token is valid, scopes: ${scopes.join(', ')}`
          : `Token is valid but lacks write access. Current scopes: ${scopes.join(', ') || 'none'}`
      };
    } catch (error) {
      return {
        valid: false,
        scopes: [],
        message: `Token verification failed: ${error.message}`
      };
    }
  }

  async githubApiCall(endpoint, options = {}) {
    if (!this.githubConfig?.token) {
      throw new Error('GitHub Token not configured');
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
      const status = response.status;
      const errorMsg = error.message || 'unknown error';

      // Permission diagnostics
      if (status === 403 || status === 401) {
        if (errorMsg.includes('Resource not accessible') || errorMsg.includes('token')) {
          throw new Error(
            `GitHub permission error: ${errorMsg}\n\n` +
            `Your Personal Access Token lacks write access. Please check:\n` +
            `1. Classic Token: enable repo (private repos) or public_repo (public repos)\n` +
            `2. Fine-grained Token: set Contents to "Read and write"\n` +
            `3. Ensure the token has access to this repository (especially org repos)\n\n` +
            `Docs: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens`
          );
        }
      }
      throw new Error(`GitHub API error (${status}): ${errorMsg}`);
    }

    return response.json();
  }

  async loadGithubFiles() {
    this.files.clear();

    if (!this.githubConfig?.owner || !this.githubConfig?.repo) {
      throw new Error('Please configure GitHub repository info first');
    }

    const { owner, repo } = this.githubConfig;

    console.log('Loading GitHub files:', { owner, repo, branch: this.branch });

    try {
      // Fetch _posts directory contents
      const contents = await this.githubApiCall(
        `/repos/${owner}/${repo}/contents/_posts?ref=${this.branch}`
      );

      console.log('GitHub API response:', contents);

      // Ensure response is an array
      if (!Array.isArray(contents)) {
        console.error('Unexpected response:', contents);
        throw new Error('Could not fetch _posts directory contents');
      }

      console.log(`Found ${contents.length} items in _posts`);

      // Filter .md files and load contents
      for (const item of contents) {
        console.log('Processing item:', item.name, item.type);
        if (item.type === 'file' && item.name.endsWith('.md')) {
          try {
            // Fetch file content
            const fileData = await this.githubApiCall(
              `/repos/${owner}/${repo}/contents/_posts/${item.name}?ref=${this.branch}`
            );

            console.log('File data received:', item.name);

            // Decode Base64 content (supports Unicode)
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
            console.error(`Failed to load file ${item.name}:`, err);
          }
        }
      }

      console.log('Total files loaded:', this.files.size);

      return Array.from(this.files.values());
    } catch (error) {
      console.error('GitHub load error:', error);
      if (error.message.includes('404')) {
        throw new Error('_posts directory not found. Please ensure it exists in your repository');
      }
      throw error;
    }
  }

  async saveGithubArticle(filename, content) {
    if (!this.githubConfig?.owner || !this.githubConfig?.repo) {
      throw new Error('Please configure GitHub repository info first');
    }

    const { owner, repo } = this.githubConfig;
    const article = this.files.get(filename);
    const path = `_posts/${filename}`;

    const body = {
      message: `Update post: ${filename}`,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: this.branch
    };

    // Existing files need SHA for update
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

    // Update local cache
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

  async deleteGithubArticle(filename, sha) {
    if (!this.githubConfig?.owner || !this.githubConfig?.repo) {
      throw new Error('Please configure GitHub repository info first');
    }

    const { owner, repo } = this.githubConfig;
    const path = `_posts/${filename}`;

    await this.githubApiCall(
      `/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'DELETE',
        body: JSON.stringify({
          message: `Delete post: ${filename}`,
          sha,
          branch: this.branch
        })
      }
    );

    // Remove from local cache
    this.files.delete(filename);

    if (this.currentFile === filename) {
      this.currentFile = null;
    }
  }

  async createGithubArticle(title, options = {}) {
    const { layout = 'post' } = options;

    const date = Utils.formatDate(new Date());
    const filename = Utils.generateFilename(title, date);

    const frontmatter = Utils.generateFrontmatter({
      title,
      date,
      layout
    });

    const content = `${frontmatter}\n\n# ${title}\n\nStart writing here...\n`;

    return this.saveGithubArticle(filename, content);
  }
}

window.FileManager = FileManager;
