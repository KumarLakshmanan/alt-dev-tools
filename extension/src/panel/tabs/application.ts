/**
 * Application Tab — Cookies, localStorage, sessionStorage, IndexedDB, CacheStorage,
 * Service Workers & Web Manifest tables & CRUD.
 */
import type { PanelState } from '../state';
import type { IndexedDBDatabase, CacheStorageData, ServiceWorkerData, WebManifestData } from '@/shared/types';
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
  } else if (section === 'indexedDB') {
    sendMessage({ type: 'get-indexeddb', tabId: state.tabId });
  } else if (section === 'cacheStorage') {
    sendMessage({ type: 'get-caches', tabId: state.tabId });
  } else if (section === 'serviceWorkers') {
    sendMessage({ type: 'get-service-workers', tabId: state.tabId });
  } else if (section === 'manifest') {
    sendMessage({ type: 'get-manifest', tabId: state.tabId });
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

export function handleIndexedDBData(data: IndexedDBDatabase[]): void {
  state.application.indexedDB = data || [];
  renderApplicationData();
}

export function handleCacheData(data: CacheStorageData[]): void {
  state.application.caches = data || [];
  renderApplicationData();
}

export function handleServiceWorkersData(data: ServiceWorkerData[]): void {
  state.application.serviceWorkers = data || [];
  renderApplicationData();
}

export function handleManifestData(data: WebManifestData | null): void {
  state.application.manifest = data;
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
  else if (section === 'indexedDB') renderIndexedDBTable(state.application.indexedDB, filter);
  else if (section === 'cacheStorage') renderCacheStorageTable(state.application.caches, filter);
  else if (section === 'serviceWorkers') renderServiceWorkersTable(state.application.serviceWorkers);
  else if (section === 'manifest') renderManifestView(state.application.manifest);
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

function renderIndexedDBTable(dbs: IndexedDBDatabase[], filter: string): void {
  if (!dbs || dbs.length === 0) {
    appDataContainer.innerHTML = '<div class="sources-placeholder">No IndexedDB databases found</div>';
    return;
  }
  const filtered = dbs.filter((db) => !filter || db.name.toLowerCase().includes(filter));
  let html = '<table class="app-table"><thead><tr><th>Database</th><th>Version</th><th>Object Stores</th></tr></thead><tbody>';
  filtered.forEach((db) => {
    html += '<tr>';
    html += '<td class="cell-name">' + escapeHtml(db.name) + '</td>';
    html += '<td>' + escapeHtml(String(db.version)) + '</td>';
    html += '<td>' + (db.stores.length > 0 ? db.stores.map((s) => '<code>' + escapeHtml(s) + '</code>').join(', ') : '<em>none</em>') + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  appDataContainer.innerHTML = html;
}

function renderCacheStorageTable(caches: CacheStorageData[], filter: string): void {
  if (!caches || caches.length === 0) {
    appDataContainer.innerHTML = '<div class="sources-placeholder">No Cache Storage found</div>';
    return;
  }
  const filtered = caches.filter((c) => !filter || c.name.toLowerCase().includes(filter));
  let html = '';
  filtered.forEach((cache) => {
    html += '<div class="app-cache-group">';
    html += '<div class="app-cache-name">' + escapeHtml(cache.name) + ' <span class="app-badge">' + cache.size + ' entries</span></div>';
    if (cache.entries.length > 0) {
      html += '<table class="app-table"><thead><tr><th>Method</th><th>URL</th></tr></thead><tbody>';
      cache.entries.forEach((e) => {
        html += '<tr><td>' + escapeHtml(e.method) + '</td><td class="cell-value">' + escapeHtml(e.url) + '</td></tr>';
      });
      if (cache.size > cache.entries.length) {
        html += '<tr><td colspan="2" style="text-align:center;opacity:.6">… and ' + (cache.size - cache.entries.length) + ' more</td></tr>';
      }
      html += '</tbody></table>';
    }
    html += '</div>';
  });
  appDataContainer.innerHTML = html;
}

function renderServiceWorkersTable(workers: ServiceWorkerData[]): void {
  if (!workers || workers.length === 0) {
    appDataContainer.innerHTML = '<div class="sources-placeholder">No Service Workers registered</div>';
    return;
  }
  let html = '<table class="app-table"><thead><tr><th>Scope</th><th>Script URL</th><th>State</th><th>Update Via Cache</th></tr></thead><tbody>';
  workers.forEach((w) => {
    const stateClass = w.state === 'activated' ? 'color:var(--success,#22c55e)' : w.state === 'installing' ? 'color:var(--warn,#f59e0b)' : '';
    html += '<tr>';
    html += '<td class="cell-name">' + escapeHtml(w.scope) + '</td>';
    html += '<td class="cell-value">' + escapeHtml(w.scriptURL) + '</td>';
    html += '<td><span style="' + stateClass + '">' + escapeHtml(w.state) + '</span></td>';
    html += '<td>' + escapeHtml(w.updateViaCache || '') + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  appDataContainer.innerHTML = html;
}

function renderManifestView(manifest: WebManifestData | null): void {
  if (!manifest) {
    appDataContainer.innerHTML = '<div class="sources-placeholder">No Web App Manifest found (&lt;link rel="manifest"&gt; missing)</div>';
    return;
  }
  if (manifest.error) {
    appDataContainer.innerHTML = '<div class="sources-placeholder">Manifest URL: <code>' + escapeHtml(manifest.url) + '</code><br>Error: ' + escapeHtml(String(manifest.error)) + '</div>';
    return;
  }

  const fields: [string, string][] = [
    ['URL', manifest.url],
    ['name', String(manifest.name ?? '')],
    ['short_name', String(manifest.short_name ?? '')],
    ['description', String(manifest.description ?? '')],
    ['start_url', String(manifest.start_url ?? '')],
    ['display', String(manifest.display ?? '')],
    ['theme_color', String(manifest.theme_color ?? '')],
    ['background_color', String(manifest.background_color ?? '')],
  ];

  let html = '<table class="app-table"><thead><tr><th>Property</th><th>Value</th></tr></thead><tbody>';
  fields.forEach(([key, val]) => {
    if (val) {
      html += '<tr><td class="cell-name">' + escapeHtml(key) + '</td><td class="cell-value">' + escapeHtml(val) + '</td></tr>';
    }
  });

  if (Array.isArray(manifest.icons) && manifest.icons.length > 0) {
    html += '<tr><td class="cell-name">icons</td><td>';
    manifest.icons.forEach((icon) => {
      html += '<div>' + escapeHtml(icon.sizes) + ' — ' + escapeHtml(icon.type || '') + ' <a href="' + escapeHtml(icon.src) + '" target="_blank" rel="noopener" style="color:var(--brand)">' + escapeHtml(icon.src) + '</a></div>';
    });
    html += '</td></tr>';
  }

  html += '</tbody></table>';
  appDataContainer.innerHTML = html;
}

