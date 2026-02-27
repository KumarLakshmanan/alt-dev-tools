/**
 * Network Tab — request table, detail panel, sorting, filtering,
 * HAR export, cURL copy, timing, WebSocket frames, request blocking.
 */
import type { PanelState } from '../state';
import { sendMessage } from '../connection';
import { escapeHtml, formatBytes, formatTime, getFileName, showToast, showContextMenu } from '../utils';

let state: PanelState;

let networkTableBody: HTMLElement;
let networkFilter: HTMLInputElement;
let networkDetail: HTMLElement;
let networkDetailContent: HTMLElement;

export function initNetworkTab(panelState: PanelState): void {
  state = panelState;

  networkTableBody = document.getElementById('network-table-body')!;
  networkFilter = document.getElementById('network-filter') as HTMLInputElement;
  networkDetail = document.getElementById('network-detail')!;
  networkDetailContent = document.getElementById('network-detail-content')!;

  // Clear
  document.getElementById('network-clear')!.addEventListener('click', () => {
    state.network.entries = [];
    state.network.selectedEntry = null;
    networkDetail.classList.add('hidden');
    renderNetwork();
  });

  // Preserve log
  (document.getElementById('network-preserve') as HTMLInputElement).addEventListener('change', function () {
    state.network.preserveLog = this.checked;
  });

  // URL filter
  networkFilter.addEventListener('input', function () {
    state.network.filter = this.value.toLowerCase();
    renderNetwork();
  });

  // Body search
  document.getElementById('network-search')!.addEventListener('input', function (this: HTMLInputElement) {
    state.network.searchQuery = this.value.toLowerCase();
    renderNetwork();
  });

  // Column sorting
  document.querySelectorAll<HTMLElement>('.network-table th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort!;
      if (state.network.sortColumn === col) {
        state.network.sortDirection = state.network.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.network.sortColumn = col;
        state.network.sortDirection = 'asc';
      }
      document.querySelectorAll('.network-table th.sortable').forEach((h) => h.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add('sort-' + state.network.sortDirection);
      renderNetwork();
    });
  });

  // Request blocking
  document.getElementById('network-block-toggle')!.addEventListener('click', function () {
    document.getElementById('network-blocking-panel')!.classList.toggle('hidden');
    this.classList.toggle('active');
  });
  document.getElementById('network-blocking-close')!.addEventListener('click', () => {
    document.getElementById('network-blocking-panel')!.classList.add('hidden');
    document.getElementById('network-block-toggle')!.classList.remove('active');
  });
  document.getElementById('blocking-add-btn')!.addEventListener('click', () => addBlockingPattern());
  document.getElementById('blocking-pattern-input')!.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBlockingPattern(); });

  // Type filters
  document.querySelectorAll<HTMLElement>('.type-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.network.typeFilter = btn.dataset.type!;
      renderNetwork();
    });
  });

  // Detail tabs
  document.querySelectorAll<HTMLElement>('.detail-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.detail-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      state.network.detailTab = tab.dataset.detail!;
      if (state.network.selectedEntry) renderNetworkDetail(state.network.selectedEntry);
    });
  });

  document.getElementById('network-detail-close')!.addEventListener('click', () => {
    state.network.selectedEntry = null;
    networkDetail.classList.add('hidden');
    document.querySelectorAll('#network-table-body tr.selected').forEach((tr) => tr.classList.remove('selected'));
  });

  // HAR export
  document.getElementById('network-export')!.addEventListener('click', exportAsHar);
  // cURL / URL copy
  document.getElementById('network-copy-curl')!.addEventListener('click', copyCurl);
  document.getElementById('network-copy-url')!.addEventListener('click', copyUrl);

  // WS frames close
  document.getElementById('network-ws-close')!.addEventListener('click', () => {
    document.getElementById('network-ws-panel')!.classList.add('hidden');
  });
}

// ── Public API ──

export function handleNetworkMessage(data: any): void {
  state.network.entries.push(data);
  appendNetworkEntry(data, state.network.entries.length - 1);
  updateNetworkSummary();
}

export function handleWebSocketMessage(message: any): void {
  const d = message.data || message;
  if (!d) return;
  if (message.action === 'open') {
    state.network.websockets[d.id] = { url: d.url, status: 'open', timestamp: d.timestamp };
    state.network.entries.push({
      url: d.url, method: 'WS', status: 101, statusText: 'Switching Protocols',
      requestHeaders: {}, requestBody: null, responseHeaders: {}, responseBody: '', resourceType: 'websocket',
      size: 0, time: 0, initiator: 'WebSocket', timestamp: d.timestamp, wsId: d.id,
    } as any);
    renderNetwork();
  } else if (message.action === 'message') {
    state.network.wsFrames.push({ id: d.id, url: d.url, direction: d.direction, data: d.data, timestamp: d.timestamp });
    renderWsFrames();
  } else if (message.action === 'close') {
    if (state.network.websockets[d.id]) state.network.websockets[d.id].status = 'closed';
  } else if (message.action === 'error') {
    if (state.network.websockets[d.id]) state.network.websockets[d.id].status = 'error';
  }
}

export function clearNetworkIfNotPreserved(): void {
  if (!state.network.preserveLog) state.network.entries = [];
}

// ── Internals ──

function addBlockingPattern(): void {
  const input = document.getElementById('blocking-pattern-input') as HTMLInputElement;
  const pattern = input.value.trim();
  if (!pattern) return;
  state.network.blockedUrls.push(pattern);
  input.value = '';
  renderBlockingPatterns();
  if (state.tabId) sendMessage({ type: 'set-blocked-urls', tabId: state.tabId, urls: state.network.blockedUrls });
}

function renderBlockingPatterns(): void {
  const list = document.getElementById('blocking-patterns-list')!;
  list.innerHTML = '';
  state.network.blockedUrls.forEach((pattern, idx) => {
    const row = document.createElement('div');
    row.className = 'blocking-pattern-row';
    row.innerHTML = '<span class="blocking-pattern">' + escapeHtml(pattern) + '</span>';
    const removeBtn = document.createElement('button');
    removeBtn.className = 'toolbar-btn';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => {
      state.network.blockedUrls.splice(idx, 1);
      renderBlockingPatterns();
      if (state.tabId) sendMessage({ type: 'set-blocked-urls', tabId: state.tabId, urls: state.network.blockedUrls });
    });
    row.appendChild(removeBtn);
    list.appendChild(row);
  });
}

function shouldShowNetworkEntry(entry: any): boolean {
  if (state.network.typeFilter !== 'all') {
    const type = entry.resourceType || 'other';
    if (state.network.typeFilter === 'fetch') { if (type !== 'fetch' && type !== 'xhr') return false; }
    else if (state.network.typeFilter === 'websocket') { if (type !== 'websocket') return false; }
    else if (type !== state.network.typeFilter) return false;
  }
  if (state.network.filter) {
    const url = (entry.url || '').toLowerCase();
    if (!url.includes(state.network.filter) && !getFileName(entry.url || '').toLowerCase().includes(state.network.filter)) return false;
  }
  if (state.network.searchQuery) {
    const searchIn = ((entry.url || '') + ' ' + (entry.responseBody || '') + ' ' + (entry.requestBody || '')).toLowerCase();
    if (!searchIn.includes(state.network.searchQuery)) return false;
  }
  return true;
}

function getStatusClass(status: number | undefined): string {
  if (!status || status === 0) return 'status-error';
  if (status >= 200 && status < 300) return 'status-ok';
  if (status >= 300 && status < 400) return 'status-redirect';
  if (status >= 400) return 'status-error';
  return 'status-pending';
}

function appendNetworkEntry(entry: any, index: number): void {
  if (!shouldShowNetworkEntry(entry)) return;
  const tr = document.createElement('tr');
  tr.dataset.index = String(index);
  if (entry.error || (entry.status && entry.status >= 400)) tr.className = 'error-row';

  const maxTime = Math.max(...state.network.entries.map((e: any) => e.time || 1));
  const barWidth = Math.max(2, Math.round(((entry.time || 0) / maxTime) * 100));
  const barColor = (entry.status && entry.status >= 400) ? '#f44' : (entry.time > 1000 ? '#fa3' : '#4af');

  tr.innerHTML =
    '<td class="cell-name" title="' + escapeHtml(entry.url || '') + '">' + escapeHtml(getFileName(entry.url || '')) + '</td>'
    + '<td class="cell-status ' + getStatusClass(entry.status) + '">' + (entry.status || '—') + '</td>'
    + '<td class="cell-type">' + escapeHtml(entry.resourceType || 'other') + '</td>'
    + '<td class="cell-initiator">' + escapeHtml(entry.initiator || '') + '</td>'
    + '<td class="cell-size">' + formatBytes(entry.size || 0) + '</td>'
    + '<td class="cell-time">' + formatTime(entry.time || 0) + '</td>'
    + '<td class="cell-waterfall"><div class="waterfall-bar" style="width:' + barWidth + '%;background:' + barColor + ';height:6px;border-radius:3px;min-width:2px;"></div></td>';

  tr.addEventListener('click', () => {
    document.querySelectorAll('#network-table-body tr.selected').forEach((r) => r.classList.remove('selected'));
    tr.classList.add('selected');
    state.network.selectedEntry = entry;
    networkDetail.classList.remove('hidden');
    renderNetworkDetail(entry);
    if (entry.resourceType === 'websocket') showWsFramesForEntry();
  });

  // Right-click context menu for network rows
  tr.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.pageX, e.pageY, [
      {
        label: 'Open in new tab',
        action: () => { if (entry.url) window.open(entry.url, '_blank'); },
      },
      {
        label: 'Copy URL',
        action: () => { navigator.clipboard.writeText(entry.url || '').catch(() => {}); showToast('URL copied'); },
      },
      {
        label: 'Copy as cURL',
        action: () => {
          const curl = buildCurlCommand(entry);
          navigator.clipboard.writeText(curl).catch(() => {});
          showToast('cURL copied');
        },
      },
      {
        label: 'Copy response body',
        action: () => {
          navigator.clipboard.writeText(entry.responseBody || '').catch(() => {});
          showToast('Response copied');
        },
      },
      {
        label: 'Block this URL pattern',
        action: () => {
          try {
            const url = new URL(entry.url || '');
            const pattern = url.hostname + url.pathname;
            if (!state.network.blockedUrls.includes(pattern)) {
              state.network.blockedUrls.push(pattern);
              if (state.tabId) sendMessage({ type: 'set-blocked-urls', tabId: state.tabId, urls: state.network.blockedUrls });
              showToast('URL pattern blocked: ' + pattern);
            }
          } catch { /* ignore */ }
        },
      },
    ]);
  });

  networkTableBody.appendChild(tr);
}

function renderNetwork(): void {
  networkTableBody.innerHTML = '';
  let entries = state.network.entries.slice();
  if (state.network.sortColumn) {
    const col = state.network.sortColumn;
    const dir = state.network.sortDirection === 'asc' ? 1 : -1;
    entries.sort((a: any, b: any) => {
      let va: any, vb: any;
      switch (col) {
        case 'name': va = getFileName(a.url || ''); vb = getFileName(b.url || ''); break;
        case 'status': va = a.status || 0; vb = b.status || 0; break;
        case 'type': va = a.resourceType || ''; vb = b.resourceType || ''; break;
        case 'initiator': va = a.initiator || ''; vb = b.initiator || ''; break;
        case 'size': va = a.size || 0; vb = b.size || 0; break;
        case 'time': va = a.time || 0; vb = b.time || 0; break;
        default: va = 0; vb = 0;
      }
      if (typeof va === 'string') return va.localeCompare(vb) * dir;
      return (va - vb) * dir;
    });
  }
  entries.forEach((entry, idx) => appendNetworkEntry(entry, idx));
  updateNetworkSummary();
}

function updateNetworkSummary(): void {
  const count = state.network.entries.length;
  const totalSize = state.network.entries.reduce((sum: number, e: any) => sum + (e.size || 0), 0);
  const totalTime = state.network.entries.reduce((sum: number, e: any) => sum + (e.time || 0), 0);
  document.getElementById('network-request-count')!.textContent = count + ' request' + (count !== 1 ? 's' : '');
  document.getElementById('network-transferred')!.textContent = formatBytes(totalSize) + ' transferred';
  document.getElementById('network-finish-time')!.textContent = 'Finish: ' + formatTime(totalTime);
}

function renderNetworkDetail(entry: any): void {
  const tab = state.network.detailTab;
  let html = '';

  if (tab === 'headers') {
    html += '<div class="detail-section"><div class="detail-section-title">General</div>';
    html += kv('Request URL', entry.url) + kv('Request Method', entry.method) + kv('Status Code', entry.status + ' ' + (entry.statusText || ''));
    html += kv('Resource Type', entry.resourceType || 'other') + '</div>';
    if (entry.responseHeaders && Object.keys(entry.responseHeaders).length > 0) {
      html += '<div class="detail-section"><div class="detail-section-title">Response Headers (' + Object.keys(entry.responseHeaders).length + ')</div>';
      Object.keys(entry.responseHeaders).sort().forEach((k) => { html += kv(k, entry.responseHeaders[k]); });
      html += '</div>';
    }
    if (entry.requestHeaders && Object.keys(entry.requestHeaders).length > 0) {
      html += '<div class="detail-section"><div class="detail-section-title">Request Headers (' + Object.keys(entry.requestHeaders).length + ')</div>';
      Object.keys(entry.requestHeaders).sort().forEach((k) => { html += kv(k, entry.requestHeaders[k]); });
      html += '</div>';
    }
  } else if (tab === 'payload') {
    if (entry.requestBody) {
      const parsed = tryParsePayload(entry.requestBody);
      if (parsed && typeof parsed === 'object') {
        html += '<div class="detail-section"><div class="detail-section-title">Request Payload</div>';
        Object.keys(parsed).forEach((k) => { html += kv(k, (parsed as any)[k]); });
        html += '</div>';
      } else {
        html += '<div class="detail-section"><div class="detail-section-title">Request Payload</div><div class="detail-body">' + escapeHtml(tryPrettyPrint(entry.requestBody)) + '</div></div>';
      }
    } else {
      html += '<div style="color:var(--text-muted);padding:20px;text-align:center;">This request has no payload.</div>';
    }
  } else if (tab === 'preview') {
    if (entry.responseBody) {
      const ct = entry.responseHeaders ? (entry.responseHeaders['content-type'] || '') : '';
      if (ct.indexOf('image') !== -1) {
        html += '<div class="detail-section"><div class="image-preview-container"><img src="' + escapeHtml(entry.url) + '" class="image-preview" alt="Image preview" onerror="this.outerHTML=\'<span>Unable to load image preview</span>\'"></div></div>';
      } else if (ct.indexOf('json') !== -1 || entry.responseBody.trim().charAt(0) === '{' || entry.responseBody.trim().charAt(0) === '[') {
        html += '<div class="detail-section"><div class="detail-body json-preview">' + escapeHtml(tryPrettyPrint(entry.responseBody)) + '</div></div>';
      } else if (ct.indexOf('html') !== -1) {
        html += '<div class="detail-section"><div class="html-preview-container"><iframe sandbox="" srcdoc="' + escapeHtml(entry.responseBody.substring(0, 50000)) + '" class="html-preview-iframe"></iframe></div></div>';
      } else {
        html += '<div class="detail-section"><div class="detail-body">' + escapeHtml(entry.responseBody.substring(0, 5000)) + '</div></div>';
      }
    } else {
      html += '<div style="color:var(--text-muted);padding:20px;text-align:center;">No data to preview.</div>';
    }
  } else if (tab === 'response') {
    if (entry.responseBody) {
      html += '<div class="detail-section"><div class="detail-body" style="white-space:pre-wrap;word-break:break-all;">' + escapeHtml(entry.responseBody) + '</div></div>';
    } else {
      html += '<div style="color:var(--text-muted);padding:20px;text-align:center;">This request has no response data.</div>';
    }
  } else if (tab === 'timing') {
    html += renderTimingTab(entry);
  }
  networkDetailContent.innerHTML = html;
}

function renderTimingTab(entry: any): string {
  let html = '<div class="detail-section"><div class="detail-section-title">Timing</div>';
  if (entry.timing) {
    const t = entry.timing;
    const phases = [
      { name: 'Stalled/Blocking', value: t.blocked, color: '#ccc' },
      { name: 'DNS Lookup', value: t.dns, color: '#48c9b0' },
      { name: 'Initial Connection', value: t.connect, color: '#f5b041' },
      { name: 'SSL', value: t.ssl, color: '#a569bd' },
      { name: 'Request Sent', value: t.send, color: '#5dade2' },
      { name: 'Waiting (TTFB)', value: t.wait, color: '#58d68d' },
      { name: 'Content Download', value: t.receive, color: '#5499c7' },
    ];
    const maxPhase = Math.max(...phases.map((p) => p.value || 0)) || 1;
    phases.forEach((phase) => {
      const bw = Math.max(0, Math.round(((phase.value || 0) / maxPhase) * 100));
      html += '<div class="timing-row"><span class="timing-label">' + phase.name + '</span>';
      html += '<div class="timing-bar-wrap"><div class="timing-bar-fill" style="width:' + bw + '%;background:' + phase.color + ';"></div></div>';
      html += '<span class="timing-value">' + formatTime(phase.value || 0) + '</span></div>';
    });
    html += '<div class="timing-row total"><span class="timing-label">Total</span><span class="timing-value">' + formatTime(t.total || entry.time || 0) + '</span></div>';
    if (t.transferSize) {
      html += '<div style="margin-top:12px;padding-top:8px;border-top:1px solid var(--border-color);">';
      html += kv('Transfer Size', formatBytes(t.transferSize));
      html += kv('Resource Size', formatBytes(t.decodedBodySize || 0));
      html += kv('Compressed', formatBytes(t.encodedBodySize || 0)) + '</div>';
    }
  } else {
    html += '<div class="timing-bar" style="width:100%;background:var(--accent-color);height:8px;border-radius:4px;margin:8px 0 16px;"></div>';
    html += kv('Total Duration', formatTime(entry.time || 0));
    html += '<div style="color:var(--text-muted);font-size:10px;margin-top:8px;">Detailed timing data not available for this request.</div>';
  }
  html += kv('Request sent at', new Date(entry.timestamp || Date.now()).toLocaleTimeString());
  html += kv('Response size', formatBytes(entry.size || 0)) + '</div>';
  return html;
}

function kv(key: string, value: any): string {
  return '<div class="detail-kv"><span class="detail-kv-key">' + escapeHtml(key) + ':</span><span class="detail-kv-value">' + escapeHtml(String(value || '')) + '</span></div>';
}

function tryPrettyPrint(str: string): string {
  try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
}

function tryParsePayload(str: string): Record<string, string> | null {
  try { return JSON.parse(str); } catch { /* not json */ }
  if (str.indexOf('=') !== -1) {
    try {
      const params = new URLSearchParams(str);
      const obj: Record<string, string> = {};
      params.forEach((v, k) => { obj[k] = v; });
      if (Object.keys(obj).length > 0) return obj;
    } catch { /* not url-encoded */ }
  }
  return null;
}

function exportAsHar(): void {
  const har = {
    log: {
      version: '1.2',
      creator: { name: 'DevTools Sidebar', version: '1.0.0' },
      entries: state.network.entries.map((e: any) => ({
        startedDateTime: new Date(e.timestamp || Date.now()).toISOString(),
        time: e.time || 0,
        request: {
          method: e.method || 'GET', url: e.url || '',
          headers: Object.keys(e.requestHeaders || {}).map((k) => ({ name: k, value: e.requestHeaders[k] })),
          postData: e.requestBody ? { mimeType: 'application/octet-stream', text: e.requestBody } : undefined,
        },
        response: {
          status: e.status || 0, statusText: e.statusText || '',
          headers: Object.keys(e.responseHeaders || {}).map((k) => ({ name: k, value: e.responseHeaders[k] })),
          content: { size: e.size || 0, mimeType: (e.responseHeaders || {})['content-type'] || '', text: e.responseBody || '' },
        },
        timings: { send: 0, wait: e.time || 0, receive: 0 },
      })),
    },
  };
  const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'network-log.har'; a.click();
  URL.revokeObjectURL(url);
}

function buildCurlCommand(e: any): string {
  let curl = "curl '" + (e.url || '') + "'";
  if (e.method && e.method !== 'GET') curl += ' -X ' + e.method;
  Object.keys(e.requestHeaders || {}).forEach((k) => { curl += " -H '" + k + ': ' + e.requestHeaders[k] + "'"; });
  if (e.requestBody) curl += " --data-raw '" + e.requestBody.replace(/'/g, "'\\''") + "'";
  return curl;
}

function copyCurl(): void {
  const e = state.network.selectedEntry;
  if (!e) return;
  const curl = buildCurlCommand(e);
  navigator.clipboard.writeText(curl).then(() => {
    const btn = document.getElementById('network-copy-curl')!;
    btn.textContent = '✓'; setTimeout(() => { btn.textContent = 'cURL'; }, 1500);
  });
}

function copyUrl(): void {
  if (!state.network.selectedEntry) return;
  navigator.clipboard.writeText(state.network.selectedEntry.url || '').then(() => {
    const btn = document.getElementById('network-copy-url')!;
    btn.textContent = '✓'; setTimeout(() => { btn.textContent = 'URL'; }, 1500);
  });
}

function renderWsFrames(): void {
  const list = document.getElementById('ws-frames-list')!;
  if (state.network.wsFrames.length === 0) {
    list.innerHTML = '<div class="sources-placeholder">No WebSocket frames captured</div>';
    return;
  }
  const frames = state.network.wsFrames.slice(-200);
  list.innerHTML = '';
  frames.forEach((frame: any) => {
    const row = document.createElement('div');
    row.className = 'ws-frame-row ws-frame-' + frame.direction;
    const arrow = frame.direction === 'sent' ? '↑' : '↓';
    row.innerHTML = '<span class="ws-frame-arrow">' + arrow + '</span>'
      + '<span class="ws-frame-data">' + escapeHtml((frame.data || '').substring(0, 200)) + '</span>'
      + '<span class="ws-frame-time">' + new Date(frame.timestamp).toLocaleTimeString() + '</span>';
    row.title = frame.data || '';
    row.addEventListener('click', () => {
      networkDetailContent.innerHTML = '<div class="detail-section"><div class="detail-section-title">WebSocket Frame (' + frame.direction + ')</div>'
        + '<div class="detail-body" style="white-space:pre-wrap;">' + escapeHtml(frame.data || '') + '</div></div>';
      networkDetail.classList.remove('hidden');
    });
    list.appendChild(row);
  });
  list.scrollTop = list.scrollHeight;
}

function showWsFramesForEntry(): void {
  document.getElementById('network-ws-panel')!.classList.remove('hidden');
  renderWsFrames();
}
