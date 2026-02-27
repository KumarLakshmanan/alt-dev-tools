/**
 * Console Tab — output rendering, input eval, expandable objects, context menu.
 */
import type { PanelState } from '../state';
import type { ConsoleEntry } from '../state';
import { sendMessage } from '../connection';
import { escapeHtml, showToast, showContextMenu } from '../utils';

let state: PanelState;
let switchTabFn: (tab: string) => void;
let loadSourceFileFn: (file: any) => void;

let consoleOutput: HTMLElement;
let consoleInput: HTMLInputElement;
let consoleFilter: HTMLInputElement;
let storeAsGlobalCounter = 0;

export function initConsoleTab(
  panelState: PanelState,
  switchTab: (tab: string) => void,
  loadSourceFile: (file: any) => void
): void {
  state = panelState;
  switchTabFn = switchTab;
  loadSourceFileFn = loadSourceFile;

  consoleOutput = document.getElementById('console-output')!;
  consoleInput = document.getElementById('console-input') as HTMLInputElement;
  consoleFilter = document.getElementById('console-filter') as HTMLInputElement;

  // Clear
  document.getElementById('console-clear')!.addEventListener('click', () => {
    state.console.entries = [];
    consoleOutput.innerHTML = '';
  });

  // Filter
  consoleFilter.addEventListener('input', function () {
    state.console.filter = this.value.toLowerCase();
    renderConsole();
  });

  // Level filters
  document.querySelectorAll<HTMLInputElement>('.level-filter input').forEach((cb) => {
    cb.addEventListener('change', () => {
      (state.console.levels as any)[cb.dataset.level!] = cb.checked;
      renderConsole();
    });
  });

  // Input
  consoleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && consoleInput.value.trim()) {
      const expr = consoleInput.value;
      state.console.commandHistory.push(expr);
      state.console.historyIndex = state.console.commandHistory.length;
      addConsoleEntry('command', [{ type: 'string', value: expr }], '');
      if (state.tabId) sendMessage({ type: 'eval-in-page', tabId: state.tabId, expression: expr });
      consoleInput.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.console.historyIndex > 0) {
        state.console.historyIndex--;
        consoleInput.value = state.console.commandHistory[state.console.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.console.historyIndex < state.console.commandHistory.length - 1) {
        state.console.historyIndex++;
        consoleInput.value = state.console.commandHistory[state.console.historyIndex];
      } else {
        state.console.historyIndex = state.console.commandHistory.length;
        consoleInput.value = '';
      }
    }
  });
}

// ── Public API ──

export function handleConsoleMessage(message: any): void {
  if (message.method === 'clear') {
    state.console.entries = [];
    state.console.groupDepth = 0;
    consoleOutput.innerHTML = '';
    return;
  }
  if (message.method === 'group' || message.method === 'groupCollapsed') {
    state.console.groupDepth = message.groupDepth ?? state.console.groupDepth + 1;
  }
  if (message.method === 'groupEnd') {
    state.console.groupDepth = Math.max(0, (message.groupDepth ?? state.console.groupDepth) - 1);
  }
  addConsoleEntry(message.method, message.args || [], message.source || '', message.timestamp, message.groupDepth);
}

export function handleEvalResult(response: any): void {
  if (!response) return;
  if (response.isError) {
    addConsoleEntry('error', [response.result || { type: 'error', value: 'Error' }], '');
  } else {
    addConsoleEntry('result', [response.result || { type: 'undefined', value: 'undefined' }], '');
  }
}

// ── Internals ──

function addConsoleEntry(method: string, args: any[], source: string, timestamp?: number, groupDepth?: number): void {
  const entry: ConsoleEntry = { method, args, source, timestamp: timestamp || Date.now(), groupDepth: groupDepth || 0 };
  state.console.entries.push(entry);
  appendConsoleEntry(entry);
}

function getEntryLevel(method: string): string {
  if (method === 'warn') return 'warn';
  if (method === 'error' || method === 'assert') return 'error';
  if (method === 'info') return 'info';
  if (method === 'debug' || method === 'trace') return 'verbose';
  return 'info';
}

function getEntryIcon(method: string): string {
  switch (method) {
    case 'warn':
      return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    case 'error':
      return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    case 'info':
      return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    case 'debug':
      return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9 9a3 3 0 0 1 6 0c0 1-.5 2-1.5 2.5L12 13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    case 'command':
      return '›';
    case 'result':
      return '‹';
    case 'trace':
      return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
    case 'group':
      return '▼';
    case 'groupCollapsed':
      return '▶';
    case 'timeEnd':
      return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
    default:
      return '';
  }
}

function shouldShowEntry(entry: ConsoleEntry): boolean {
  const level = getEntryLevel(entry.method);
  if (!(state.console.levels as any)[level]) return false;
  if (state.console.filter) {
    const text = entry.args.map((a: any) => a.value).join(' ').toLowerCase();
    if (!text.includes(state.console.filter)) return false;
  }
  return true;
}

function formatArg(arg: any): HTMLElement {
  if (arg.expandable && (arg.children || arg.items)) {
    return createExpandableElement(arg);
  }
  const span = document.createElement('span');
  span.className = 'val-' + arg.type;
  span.textContent = arg.value;
  return span;
}

function createExpandableElement(arg: any): HTMLElement {
  const wrapper = document.createElement('span');
  wrapper.className = 'expandable-value';

  const toggle = document.createElement('span');
  toggle.className = 'expand-toggle collapsed';
  toggle.textContent = '▶';
  wrapper.appendChild(toggle);

  const preview = document.createElement('span');
  preview.className = 'val-' + arg.type + ' expand-preview';
  preview.textContent = arg.preview || arg.value;
  wrapper.appendChild(preview);

  const details = document.createElement('div');
  details.className = 'expand-details hidden';
  wrapper.appendChild(details);

  let expanded = false;
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    expanded = !expanded;
    toggle.textContent = expanded ? '▼' : '▶';
    toggle.className = expanded ? 'expand-toggle expanded' : 'expand-toggle collapsed';
    if (expanded) {
      details.classList.remove('hidden');
      if (details.children.length === 0) renderExpandedContent(details, arg);
    } else {
      details.classList.add('hidden');
    }
  });

  preview.addEventListener('click', (e) => { e.stopPropagation(); toggle.click(); });
  return wrapper;
}

function renderExpandedContent(container: HTMLElement, arg: any): void {
  if (arg.type === 'array' && arg.items) {
    arg.items.forEach((item: any, idx: number) => {
      const row = document.createElement('div');
      row.className = 'expand-row';
      const key = document.createElement('span');
      key.className = 'expand-key';
      key.textContent = idx + ': ';
      row.appendChild(key);
      row.appendChild(formatArg(item));
      container.appendChild(row);
    });
    if (arg.length > arg.items.length) {
      const more = document.createElement('div');
      more.className = 'expand-row';
      more.innerHTML = '<span class="val-undefined">... ' + (arg.length - arg.items.length) + ' more items</span>';
      container.appendChild(more);
    }
    const lenRow = document.createElement('div');
    lenRow.className = 'expand-row';
    lenRow.innerHTML = '<span class="expand-key">length: </span><span class="val-number">' + (arg.length || 0) + '</span>';
    container.appendChild(lenRow);
  } else if (arg.children && typeof arg.children === 'object') {
    Object.keys(arg.children).forEach((k) => {
      const row = document.createElement('div');
      row.className = 'expand-row';
      const keyEl = document.createElement('span');
      keyEl.className = 'expand-key';
      keyEl.textContent = k + ': ';
      row.appendChild(keyEl);
      row.appendChild(formatArg(arg.children[k]));
      container.appendChild(row);
    });
  } else if (arg.items) {
    arg.items.forEach((item: any, idx: number) => {
      const row = document.createElement('div');
      row.className = 'expand-row';
      const key = document.createElement('span');
      key.className = 'expand-key';
      key.textContent = idx + ': ';
      row.appendChild(key);
      row.appendChild(formatArg(item));
      container.appendChild(row);
    });
  }
}

function appendConsoleEntry(entry: ConsoleEntry): void {
  if (!shouldShowEntry(entry)) return;
  if (entry.method === 'groupEnd') return;

  const div = document.createElement('div');
  const levelClass =
    entry.method === 'command' ? 'level-log command'
    : entry.method === 'result' ? 'level-log result'
    : (entry.method === 'group' || entry.method === 'groupCollapsed') ? 'level-log group-header'
    : entry.method === 'timeEnd' ? 'level-log time-entry'
    : 'level-' + (entry.method === 'debug' || entry.method === 'trace' ? 'debug' : entry.method === 'assert' ? 'error' : entry.method);
  div.className = 'console-entry ' + levelClass;

  if (entry.groupDepth > 0) div.style.paddingLeft = (20 + entry.groupDepth * 16) + 'px';

  const icon = document.createElement('span');
  icon.className = 'entry-icon';
  icon.innerHTML = getEntryIcon(entry.method);
  div.appendChild(icon);

  const content = document.createElement('span');
  content.className = 'entry-content';
  entry.args.forEach((arg: any, idx: number) => {
    if (idx > 0) content.appendChild(document.createTextNode(' '));
    content.appendChild(formatArg(arg));
  });
  div.appendChild(content);

  // Context menu
  div.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.pageX, e.pageY, [
      {
        label: 'Copy object', action: () => {
          navigator.clipboard.writeText(entry.args.map((a: any) => a.value).join(' ')).catch(() => {});
          showToast('Copied to clipboard');
        },
      },
      {
        label: 'Store as global variable', action: () => {
          const text = entry.args.map((a: any) => a.value).join(' ');
          const varName = 'temp' + (++storeAsGlobalCounter);
          if (state.tabId) {
            sendMessage({ type: 'eval-in-page', tabId: state.tabId, expression: 'window.' + varName + ' = ' + JSON.stringify(text) + '; "' + varName + '"' });
            showToast('Stored as ' + varName);
          }
        },
      },
      {
        label: 'Copy entry text', action: () => {
          navigator.clipboard.writeText(entry.args.map((a: any) => a.value).join(' ')).catch(() => {});
        },
      },
    ]);
  });

  // Source link
  if (entry.source) {
    const src = document.createElement('span');
    src.className = 'entry-source';
    const match = entry.source.match(/(?:at\s+)?(?:\S+\s+)?(?:\()?(\S+?)(?:\))?$/);
    const sourceText = match ? match[1] : entry.source;
    let displayText = sourceText;
    try {
      const parts = sourceText.split('/');
      const last = parts[parts.length - 1] || sourceText;
      if (last.length > 0) displayText = last;
    } catch { /* keep original */ }
    src.textContent = displayText;
    src.title = entry.source;
    src.style.cursor = 'pointer';
    src.addEventListener('click', (e) => {
      e.stopPropagation();
      const urlMatch = sourceText.match(/^(https?:\/\/[^:]+)/);
      if (urlMatch) {
        const targetUrl = urlMatch[1];
        const targetFile = state.sources.files.find((f: any) =>
          f.url === targetUrl || f.url.indexOf(targetUrl) !== -1 || targetUrl.indexOf(f.url) !== -1
        );
        if (targetFile) {
          switchTabFn('sources');
          loadSourceFileFn(targetFile);
          const lineMatch = sourceText.match(/:(\d+)/);
          if (lineMatch) {
            const lineNum = parseInt(lineMatch[1]);
            setTimeout(() => {
              const lineEls = document.getElementById('sources-code')!.querySelectorAll('.code-line');
              if (lineEls[lineNum - 1]) {
                (lineEls[lineNum - 1] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                (lineEls[lineNum - 1] as HTMLElement).style.background = 'rgba(255,255,0,0.15)';
                setTimeout(() => { (lineEls[lineNum - 1] as HTMLElement).style.background = ''; }, 3000);
              }
            }, 300);
          }
        } else {
          switchTabFn('sources');
        }
      }
    });
    div.appendChild(src);
  }

  consoleOutput.appendChild(div);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function renderConsole(): void {
  consoleOutput.innerHTML = '';
  state.console.entries.forEach((entry) => appendConsoleEntry(entry));
}
