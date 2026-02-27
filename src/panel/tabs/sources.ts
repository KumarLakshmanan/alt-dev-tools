/**
 * Sources Tab — source tree, code viewer, syntax highlighting,
 * pretty-printing, cross-file search.
 */
import type { PanelState } from '../state';
import { sendMessage } from '../connection';
import { escapeHtml, getFileName } from '../utils';

let state: PanelState;

let sourcesTree: HTMLElement;
let sourcesCode: HTMLElement;
let sourcesFilename: HTMLElement;

export function initSourcesTab(panelState: PanelState): void {
  state = panelState;

  sourcesTree = document.getElementById('sources-tree')!;
  sourcesCode = document.getElementById('sources-code')!;
  sourcesFilename = document.getElementById('sources-filename')!;

  // Pretty print
  document.getElementById('sources-pretty-print')!.addEventListener('click', function (this: HTMLElement) {
    if (!state.sources.selectedFile || !state.sources.selectedFile.content) return;
    const file = state.sources.selectedFile;
    const content = file.content!;
    if (!state.sources.prettyPrinted) {
      let pretty = content;
      if (file.type === 'script') pretty = prettyPrintJs(content);
      else if (file.type === 'stylesheet') pretty = prettyPrintCss(content);
      else pretty = prettyPrintHtml(content);
      state.sources.prettyPrinted = true;
      file._origContent = content;
      file.content = pretty;
      renderSourceCode(pretty, file.type);
      this.classList.add('active');
    } else {
      state.sources.prettyPrinted = false;
      file.content = file._origContent || file.content;
      renderSourceCode(file.content!, file.type);
      this.classList.remove('active');
    }
  });

  // Search toggle
  const searchBar = document.getElementById('sources-search-bar')!;
  const searchResults = document.getElementById('sources-search-results')!;
  const searchInput = document.getElementById('sources-search-input') as HTMLInputElement;

  document.getElementById('sources-search-toggle')!.addEventListener('click', () => {
    searchBar.classList.toggle('hidden');
    searchResults.classList.toggle('hidden');
    if (!searchBar.classList.contains('hidden')) searchInput.focus();
  });

  let searchDebounce: ReturnType<typeof setTimeout> | null = null;
  searchInput.addEventListener('input', () => {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => searchAcrossFiles(searchInput.value), 300);
  });
}

// ── Public API ──

export function loadPageSources(): void {
  if (!state.tabId) return;
  sourcesTree.innerHTML = '<div class="sources-placeholder">Loading sources...</div>';
  sendMessage({ type: 'get-page-sources', tabId: state.tabId });
}

export function handlePageSources(sources: any[]): void {
  if (!sources || sources.length === 0) {
    sourcesTree.innerHTML = '<div class="sources-placeholder">No sources found</div>';
    return;
  }
  state.sources.files = sources;
  renderSourcesTree();
}

export function loadSourceFile(file: any): void {
  state.sources.selectedFile = file;
  sourcesFilename.textContent = file.url;
  if (file.content) {
    renderSourceCode(file.content, file.type);
  } else {
    sourcesCode.innerHTML = '<div class="sources-placeholder">Loading...</div>';
    fetch(file.url)
      .then((res) => res.text())
      .then((text) => { file.content = text; renderSourceCode(text, file.type); })
      .catch(() => { sourcesCode.innerHTML = '<div class="sources-placeholder">Unable to load content (CORS restricted)</div>'; });
  }
}

// ── Internals ──

function renderSourcesTree(): void {
  sourcesTree.innerHTML = '';
  const groups: Record<string, any[]> = {};
  state.sources.files.forEach((file: any) => {
    try {
      const origin = new URL(file.url).origin;
      if (!groups[origin]) groups[origin] = [];
      groups[origin].push(file);
    } catch {
      if (!groups['other']) groups['other'] = [];
      groups['other'].push(file);
    }
  });

  Object.keys(groups).sort().forEach((origin) => {
    const folderEl = document.createElement('div');
    folderEl.className = 'tree-item';
    folderEl.innerHTML = '<span class="tree-icon folder">📁</span>' + escapeHtml(origin);
    const groupEl = document.createElement('div');
    groupEl.className = 'tree-group';
    folderEl.addEventListener('click', () => groupEl.classList.toggle('collapsed'));
    sourcesTree.appendChild(folderEl);

    groups[origin].forEach((file) => {
      const fileEl = document.createElement('div');
      fileEl.className = 'tree-item';
      const icon = file.type === 'document' ? '📄' : file.type === 'stylesheet' ? '🎨' : file.type === 'script' ? '📜' : '📋';
      const iconClass = file.type === 'document' ? 'file-html' : file.type === 'stylesheet' ? 'file-css' : file.type === 'script' ? 'file-js' : 'file-other';
      fileEl.innerHTML = '<span class="tree-icon ' + iconClass + '">' + icon + '</span>' + escapeHtml(getFileName(file.url));
      fileEl.title = file.url;
      fileEl.addEventListener('click', () => {
        sourcesTree.querySelectorAll('.tree-item.selected').forEach((el) => el.classList.remove('selected'));
        fileEl.classList.add('selected');
        loadSourceFile(file);
      });
      groupEl.appendChild(fileEl);
    });
    sourcesTree.appendChild(groupEl);
  });
}

function renderSourceCode(content: string, type: string): void {
  sourcesCode.innerHTML = '';
  state.sources.prettyPrinted = state.sources.prettyPrinted; // keep current
  const lines = content.split('\n');
  const fragment = document.createDocumentFragment();
  lines.forEach((line, idx) => {
    const lineEl = document.createElement('div');
    lineEl.className = 'code-line';
    const numEl = document.createElement('span');
    numEl.className = 'line-number';
    numEl.textContent = String(idx + 1);
    const contentEl = document.createElement('span');
    contentEl.className = 'line-content';
    contentEl.innerHTML = highlightSyntax(line, type);
    lineEl.appendChild(numEl);
    lineEl.appendChild(contentEl);
    fragment.appendChild(lineEl);
  });
  sourcesCode.appendChild(fragment);
}

// ── Search ──

function searchAcrossFiles(query: string): void {
  const countEl = document.getElementById('sources-search-count')!;
  const resultsEl = document.getElementById('sources-search-results')!;
  if (!query || query.length < 2) { resultsEl.innerHTML = ''; countEl.textContent = ''; return; }
  const results: { file: any; line: string; lineNum: number }[] = [];
  const queryLower = query.toLowerCase();
  state.sources.files.forEach((file: any) => {
    if (!file.content) return;
    file.content.split('\n').forEach((line: string, idx: number) => {
      if (line.toLowerCase().indexOf(queryLower) !== -1) results.push({ file, line: line.trim(), lineNum: idx + 1 });
    });
  });
  countEl.textContent = results.length + ' result' + (results.length !== 1 ? 's' : '');
  resultsEl.innerHTML = '';
  results.slice(0, 100).forEach((r) => {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.innerHTML = '<span class="search-result-file">' + escapeHtml(getFileName(r.file.url)) + ':' + r.lineNum + '</span>'
      + '<span class="search-result-line">' + highlightSearchMatch(escapeHtml(r.line.substring(0, 200)), query) + '</span>';
    item.addEventListener('click', () => {
      loadSourceFile(r.file);
      setTimeout(() => {
        const lineEls = sourcesCode.querySelectorAll('.code-line');
        if (lineEls[r.lineNum - 1]) {
          (lineEls[r.lineNum - 1] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          (lineEls[r.lineNum - 1] as HTMLElement).style.background = 'rgba(255,255,0,0.15)';
          setTimeout(() => { (lineEls[r.lineNum - 1] as HTMLElement).style.background = ''; }, 3000);
        }
      }, 200);
    });
    resultsEl.appendChild(item);
  });
}

function highlightSearchMatch(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.substring(0, idx) + '<mark>' + text.substring(idx, idx + query.length) + '</mark>' + text.substring(idx + query.length);
}

// ── Syntax Highlighting ──

function highlightSyntax(line: string, type: string): string {
  const escaped = escapeHtml(line);
  if (type === 'document') return highlightHtml(escaped);
  if (type === 'stylesheet') return highlightCss(escaped);
  if (type === 'script') return highlightJs(escaped);
  return escaped;
}

function highlightHtml(line: string): string {
  line = line.replace(/(&lt;!--.*?--&gt;)/g, '<span class="syntax-comment">$1</span>');
  line = line.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="syntax-tag">$2</span>');
  line = line.replace(/([\w-]+)(=)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g,
    '<span class="syntax-attr-name">$1</span>$2<span class="syntax-attr-value">$3</span>');
  return line;
}

function highlightCss(line: string): string {
  line = line.replace(/(\/\*.*?\*\/)/g, '<span class="syntax-comment">$1</span>');
  line = line.replace(/^([^{:]+)(\{)/, '<span class="syntax-selector">$1</span>$2');
  line = line.replace(/([\w-]+)(\s*:)/g, '<span class="syntax-property">$1</span>$2');
  line = line.replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="syntax-string">$1</span>');
  line = line.replace(/\b(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|s|ms)?\b/g, '<span class="syntax-number">$1$2</span>');
  return line;
}

function highlightJs(line: string): string {
  line = line.replace(/(\/\/.*$)/g, '<span class="syntax-comment">$1</span>');
  line = line.replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;|&#39;(?:[^&]|&(?!#39;))*?&#39;|`[^`]*?`)/g, '<span class="syntax-string">$1</span>');
  const keywords = [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import',
    'export', 'from', 'default', 'try', 'catch', 'finally', 'throw', 'async', 'await',
    'typeof', 'instanceof', 'null', 'undefined', 'true', 'false',
  ];
  keywords.forEach((kw) => { line = line.replace(new RegExp('\\b(' + kw + ')\\b', 'g'), '<span class="syntax-keyword">$1</span>'); });
  line = line.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="syntax-number">$1</span>');
  return line;
}

// ── Pretty Printing ──

function prettyPrintJs(code: string): string {
  try {
    let result = '';
    let indent = 0;
    let inString = false;
    let stringChar = '';
    for (let i = 0; i < code.length; i++) {
      const c = code[i];
      if (inString) {
        result += c;
        if (c === stringChar && code[i - 1] !== '\\') inString = false;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { inString = true; stringChar = c; result += c; continue; }
      if (c === '{') { indent++; result += ' {\n' + '  '.repeat(indent); }
      else if (c === '}') { indent = Math.max(0, indent - 1); result += '\n' + '  '.repeat(indent) + '}'; if (i + 1 < code.length && code[i + 1] !== ';' && code[i + 1] !== ',' && code[i + 1] !== ')') result += '\n' + '  '.repeat(indent); }
      else if (c === ';') { result += ';\n' + '  '.repeat(indent); }
      else if (c === '\n' || c === '\r') { if (c === '\r' && code[i + 1] === '\n') i++; }
      else { result += c; }
    }
    return result;
  } catch { return code; }
}

function prettyPrintCss(code: string): string {
  try {
    return code.replace(/\{/g, ' {\n  ').replace(/\}/g, '\n}\n').replace(/;/g, ';\n  ').replace(/\n\s*\n/g, '\n');
  } catch { return code; }
}

function prettyPrintHtml(code: string): string {
  try {
    let indent = 0;
    return code.replace(/(>)(<)(\/*)/g, '$1\n$2$3').split('\n').map((line) => {
      line = line.trim();
      if (!line) return '';
      if (line.match(/^<\//)) indent = Math.max(0, indent - 1);
      const result = '  '.repeat(indent) + line;
      if (line.match(/^<[^/!]/) && !line.match(/\/>$/)) indent++;
      return result;
    }).join('\n');
  } catch { return code; }
}
