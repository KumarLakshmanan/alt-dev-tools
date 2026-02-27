/**
 * Application Tab — Cookies, localStorage, sessionStorage tables & CRUD.
 */
import type { PanelState } from '../state';
import { sendMessage } from '../connection';
import { escapeHtml } from '../utils';

let state: PanelState;

let appDataContainer: HTMLElement;

export function initApplicationTab(panelState: PanelState): void {
  state = panelState;
  appDataContainer = document.getElementById('app-data-container')!;

  // Navigation
  document.querySelectorAll<HTMLElement>('.app-nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.app-nav-item').forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      state.application.activeSection = item.dataset.appSection!;
      loadApplicationData();
    });
  });

  document.getElementById('app-refresh')!.addEventListener('click', () => loadApplicationData());

  // Clear storage
  document.getElementById('app-clear-storage')!.addEventListener('click', () => {
    if (!state.tabId) return;
    const section = state.application.activeSection;
    if (section === 'cookies') {
      state.application.cookies.forEach((c: any) => {
        const url = (c.secure ? 'https://' : 'http://') + c.domain + c.path;
        sendMessage({ type: 'delete-cookie', tabId: state.tabId!, url, name: c.name });
      });
    } else if (section === 'localStorage') {
      sendMessage({ type: 'eval-in-page', tabId: state.tabId, expression: 'localStorage.clear(); "cleared"' });
    } else if (section === 'sessionStorage') {
      sendMessage({ type: 'eval-in-page', tabId: state.tabId, expression: 'sessionStorage.clear(); "cleared"' });
    }
    setTimeout(loadApplicationData, 300);
  });

  // Filter
  (document.getElementById('app-filter') as HTMLInputElement).addEventListener('input', function () {
    state.application.filter = this.value.toLowerCase();
    renderApplicationData();
  });
}

// ── Public API ──

export function loadApplicationData(): void {
  if (!state.tabId) return;
  const section = state.application.activeSection;
  if (section === 'cookies') {
    sendMessage({ type: 'get-cookies', tabId: state.tabId });
  } else if (section === 'localStorage') {
    sendMessage({ type: 'get-storage', tabId: state.tabId, storageType: 'localStorage' });
  } else if (section === 'sessionStorage') {
    sendMessage({ type: 'get-storage', tabId: state.tabId, storageType: 'sessionStorage' });
  }
}

export function handleCookiesData(cookies: any[]): void {
  state.application.cookies = cookies || [];
  renderApplicationData();
}

export function handleStorageData(storageType: string, data: any[]): void {
  if (storageType === 'localStorage') state.application.localStorage = data || [];
  else if (storageType === 'sessionStorage') state.application.sessionStorage = data || [];
  renderApplicationData();
}

export function loadCookies(): void {
  if (!state.tabId) return;
  sendMessage({ type: 'get-cookies', tabId: state.tabId });
}

// ── Internals ──

function renderApplicationData(): void {
  const section = state.application.activeSection;
  const filter = state.application.filter;
  if (section === 'cookies') renderCookiesTable(state.application.cookies, filter);
  else if (section === 'localStorage') renderStorageTable(state.application.localStorage, filter, 'localStorage');
  else if (section === 'sessionStorage') renderStorageTable(state.application.sessionStorage, filter, 'sessionStorage');
}

function renderCookiesTable(cookies: any[], filter: string): void {
  if (!cookies || cookies.length === 0) {
    appDataContainer.innerHTML = '<div class="sources-placeholder">No cookies found</div>';
    return;
  }
  const filtered = cookies.filter((c) => {
    if (!filter) return true;
    return (c.name + ' ' + c.value + ' ' + c.domain).toLowerCase().indexOf(filter) !== -1;
  });

  let html = '<table class="app-table"><thead><tr><th>Name</th><th>Value</th><th>Domain</th><th>Path</th><th>Expires</th><th>Size</th><th></th></tr></thead><tbody>';
  filtered.forEach((c) => {
    const expires = c.expirationDate ? new Date(c.expirationDate * 1000).toLocaleString() : 'Session';
    const size = (c.name.length + (c.value || '').length);
    html += '<tr>';
    html += '<td class="cell-name">' + escapeHtml(c.name) + '</td>';
    html += '<td class="cell-value" title="' + escapeHtml(c.value || '') + '">' + escapeHtml((c.value || '').substring(0, 80)) + '</td>';
    html += '<td>' + escapeHtml(c.domain || '') + '</td>';
    html += '<td>' + escapeHtml(c.path || '') + '</td>';
    html += '<td>' + escapeHtml(expires) + '</td>';
    html += '<td>' + size + '</td>';
    html += '<td><button class="toolbar-btn delete-cookie-btn" data-name="' + escapeHtml(c.name) + '" data-domain="' + escapeHtml(c.domain || '') + '" data-path="' + escapeHtml(c.path || '') + '" data-secure="' + (c.secure ? '1' : '0') + '">✕</button></td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  appDataContainer.innerHTML = html;

  appDataContainer.querySelectorAll<HTMLElement>('.delete-cookie-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name!;
      const domain = btn.dataset.domain!;
      const path = btn.dataset.path!;
      const secure = btn.dataset.secure === '1';
      const url = (secure ? 'https://' : 'http://') + domain + path;
      sendMessage({ type: 'delete-cookie', tabId: state.tabId!, url, name });
    });
  });
}

function renderStorageTable(items: any[], filter: string, storageType: string): void {
  if (!items || items.length === 0) {
    appDataContainer.innerHTML = '<div class="sources-placeholder">No ' + storageType + ' data found</div>';
    return;
  }
  const filtered = items.filter((item) => {
    if (!filter) return true;
    return (item.key + ' ' + item.value).toLowerCase().indexOf(filter) !== -1;
  });
  let html = '<table class="app-table"><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>';
  filtered.forEach((item) => {
    html += '<tr>';
    html += '<td class="cell-name">' + escapeHtml(item.key) + '</td>';
    html += '<td class="cell-value" title="' + escapeHtml(item.value || '') + '">' + escapeHtml((item.value || '').substring(0, 200)) + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  appDataContainer.innerHTML = html;
}
