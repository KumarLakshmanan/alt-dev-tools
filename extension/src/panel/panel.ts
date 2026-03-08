/**
 * Panel — main entry point.
 * Renders the Preact component tree into #app, then wires up all tab modules,
 * manages tab switching and the port message router.
 */
import { render, h } from 'preact';
import { createInitialState } from './state';
import { connectPort, onPortMessage, onReconnect, sendMessage } from './connection';
import { showToast } from './utils';

// ── Preact component tree ──
import { App } from './components/App';

// Tab modules
import {
  initElementsTab, loadDomTree, handleDomTree, handleElementStyles,
  handleEventListeners, handleInspectElementSelected, handleCopyHtmlResult,
  handleCopySelectorResult, handleDomMutation, cancelInspectMode,
} from './tabs/elements';
import { initConsoleTab, handleConsoleMessage, handleEvalResult } from './tabs/console';
import { initNetworkTab, handleNetworkMessage, handleWebSocketMessage, clearNetworkIfNotPreserved } from './tabs/network';
import { initSourcesTab, loadPageSources, handlePageSources, loadSourceFile } from './tabs/sources';
import { initApplicationTab, loadApplicationData, handleCookiesData, handleStorageData, handleIndexedDBData, handleCacheData, handleServiceWorkersData, handleManifestData, loadCookies } from './tabs/application';
import { initPerformanceTab, loadPerformanceData, handlePerformanceData } from './tabs/performance';
import { initDeviceTab, handleDeviceEmulationResult } from './tabs/device';
import { initLicenseTab, isProUnlocked } from './tabs/license';
import { initSecurityTab, loadSecurityData, handleSecurityData } from './tabs/security';

// ── State ──
const state = createInitialState();

// ── DOM Builder ──
/**
 * Renders the Preact `<App>` component tree synchronously into `#app`.
 * After this call all element IDs are present in the real DOM and can
 * be queried by the tabs/*.ts modules in `init()`.
 */
function buildLayout(): void {
  const appEl = document.getElementById('app');
  if (appEl) render(h(App, {}), appEl);
}

// ── Tab Switching ──
function switchTab(tabName: string): void {
  state.activeTab = tabName;
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', (t as HTMLElement).dataset.tab === tabName);
  });
  document.querySelectorAll('.panel').forEach((p) => {
    p.classList.toggle('active', p.id === tabName + '-panel');
  });
  if (tabName === 'sources' && state.sources.files.length === 0) loadPageSources();
  if (tabName === 'elements' && !state.elements.domTree) loadDomTree();
  if (tabName === 'application') loadApplicationData();
  if (tabName === 'performance') loadPerformanceData();
  if (tabName === 'security') loadSecurityData();
}

/** IDs of Pro lock overlay elements that should be shown/hidden. */
const PRO_OVERLAYS = ['pro-lock-sources', 'pro-lock-application', 'pro-lock-performance', 'pro-lock-device'];

/**
 * Show overlays when Pro is NOT unlocked; hide them when it IS.
 */
function applyProLockState(): void {
  const unlocked = isProUnlocked();
  PRO_OVERLAYS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', unlocked);
  });
}

/** Wire up the "Unlock with License Key" buttons inside the overlays. */
function wireProLockButtons(): void {
  document.querySelectorAll<HTMLElement>('[data-go-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.goTab;
      if (target) switchTab(target);
    });
  });
}

// ── Port message router ──
function handleMessage(message: any): void {
  switch (message.type) {
    case 'console': handleConsoleMessage(message); break;
    case 'network': handleNetworkMessage(message.data); break;
    case 'dom-tree': handleDomTree(message.data); break;
    case 'page-sources': handlePageSources(message.data); break;
    case 'element-styles': handleElementStyles(message.data); break;
    case 'eval-result':
      if (state.activeTab === 'performance') {
        handlePerformanceData(message.result);
      } else if (state.activeTab === 'security') {
        handleSecurityData(message.result);
      } else {
        handleEvalResult(message.result);
      }
      break;
    case 'event-listeners': handleEventListeners(message.data); break;
    case 'dom-mutation': handleDomMutation(message.mutations); break;
    case 'copy-html-result': handleCopyHtmlResult(message.data); break;
    case 'copy-selector-result': handleCopySelectorResult(message.data); break;
    case 'delete-element-result': if (message.data) loadDomTree(); break;
    case 'add-html-result':
    case 'edit-html-result': if (message.data) loadDomTree(); break;
    case 'cookies-data': handleCookiesData(message.data); break;
    case 'cookie-deleted': loadCookies(); break;
    case 'storage-data': handleStorageData(message.storageType, message.data); break;
    case 'indexeddb-data': handleIndexedDBData(message.data); break;
    case 'cache-data': handleCacheData(message.data); break;
    case 'service-workers-data': handleServiceWorkersData(message.data); break;
    case 'manifest-data': handleManifestData(message.data); break;
    case 'websocket': handleWebSocketMessage(message); break;
    case 'inspect-element-selected': handleInspectElementSelected(message); break;
    case 'inspect-mode-cancelled': cancelInspectMode(); break;
    case 'device-emulation-applied':
    case 'device-emulation-reset': handleDeviceEmulationResult(message); break;
  }
}

// ── Bootstrap ──
function init(): void {
  // Initialise tab modules
  initElementsTab(state, switchTab, loadSourceFile);
  initConsoleTab(state, switchTab, loadSourceFile);
  initNetworkTab(state);
  initSourcesTab(state);
  initApplicationTab(state);
  initPerformanceTab(state);
  initDeviceTab(state);
  initSecurityTab(state);

  // License — async: loads stored key, updates Pro state, then applies overlays
  initLicenseTab(state).then(() => {
    applyProLockState();
  });

  // React to license changes at runtime (activate / deactivate)
  window.addEventListener('altdevtools:prochange', () => {
    applyProLockState();
  });

  // Wire overlay "Unlock" buttons
  wireProLockButtons();

  // Tab bar click handling + drag-to-reorder + overflow "›" button
  const tabBarEl = document.querySelector<HTMLElement>('.tab-bar')!;
  document.querySelectorAll<HTMLElement>('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab!));
  });
  initTabDragAndDrop(tabBarEl);
  initTabOverflow(tabBarEl);

  // Connect to background
  onPortMessage(handleMessage);
  onReconnect(() => {
    if (state.tabId) {
      sendMessage({ type: 'init', tabId: state.tabId });
      if (state.activeTab === 'elements') loadDomTree();
    }
  });
  connectPort();

  // Get current tab ID — try currentWindow first (best for side panels), fallback to lastFocusedWindow
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      state.tabId = tabs[0].id;
      sendMessage({ type: 'init', tabId: state.tabId });
      loadDomTree();
    } else {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (fallbackTabs) => {
        if (fallbackTabs[0]?.id) {
          state.tabId = fallbackTabs[0].id;
          sendMessage({ type: 'init', tabId: state.tabId });
          loadDomTree();
        }
      });
    }
  });

  // Track tab activation
  chrome.tabs.onActivated.addListener((activeInfo) => {
    state.tabId = activeInfo.tabId;
    sendMessage({ type: 'init', tabId: state.tabId });
    state.elements.domTree = null;
    state.sources.files = [];
    clearNetworkIfNotPreserved();
    if (state.activeTab === 'elements') loadDomTree();
    if (state.activeTab === 'sources') loadPageSources();
  });

  // Direct runtime messages (not via port)
  chrome.runtime.onMessage.addListener((message: any) => {
    handleMessage(message);
    return undefined;
  });
}

// ── Tab drag-and-drop reordering ──
function initTabDragAndDrop(tabBar: HTMLElement): void {
  let dragSrc: HTMLElement | null = null;

  function onDragStart(this: HTMLElement, e: DragEvent) {
    dragSrc = this;
    this.classList.add('tab-dragging');
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', '');
  }

  function onDragEnd(this: HTMLElement) {
    this.classList.remove('tab-dragging');
    tabBar.querySelectorAll('.tab').forEach((t) => t.classList.remove('tab-drag-over'));
    dragSrc = null;
  }

  function onDragOver(this: HTMLElement, e: DragEvent) {
    if (!dragSrc || dragSrc === this) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    tabBar.querySelectorAll('.tab').forEach((t) => t.classList.remove('tab-drag-over'));
    this.classList.add('tab-drag-over');
  }

  function onDrop(this: HTMLElement, e: DragEvent) {
    e.preventDefault();
    if (!dragSrc || dragSrc === this) return;
    const rect = this.getBoundingClientRect();
    const insertBefore = e.clientX < rect.left + rect.width / 2;
    if (insertBefore) {
      tabBar.insertBefore(dragSrc, this);
    } else {
      this.after(dragSrc);
    }
    tabBar.querySelectorAll('.tab').forEach((t) => t.classList.remove('tab-drag-over'));
  }

  function attachHandlers(tab: HTMLElement) {
    tab.draggable = true;
    tab.addEventListener('dragstart', onDragStart);
    tab.addEventListener('dragend', onDragEnd);
    tab.addEventListener('dragover', onDragOver);
    tab.addEventListener('drop', onDrop);
  }

  tabBar.querySelectorAll<HTMLElement>('.tab').forEach(attachHandlers);
}

// ── Tab overflow "›" button ──
function initTabOverflow(tabBar: HTMLElement): void {
  const overflowBtn = document.createElement('div');
  overflowBtn.className = 'tab-overflow-btn';
  overflowBtn.title = 'More tabs';
  overflowBtn.textContent = '›';
  tabBar.appendChild(overflowBtn);

  const dropdown = document.createElement('div');
  dropdown.className = 'tab-overflow-dropdown hidden';
  document.body.appendChild(dropdown);

  function updateOverflow() {
    const allTabs = [...tabBar.querySelectorAll<HTMLElement>('.tab')];

    // Show all tabs first so offsetWidth measurements are accurate
    allTabs.forEach((t) => t.classList.remove('tab-overflow-hidden'));

    const btnW = 26;
    const availW = tabBar.offsetWidth - btnW;
    let accW = 0;
    const hidden: HTMLElement[] = [];

    for (const tab of allTabs) {
      accW += tab.offsetWidth;
      if (accW > availW) {
        hidden.push(tab);
      }
    }

    hidden.forEach((t) => t.classList.add('tab-overflow-hidden'));
    overflowBtn.classList.toggle('tab-overflow-visible', hidden.length > 0);

    dropdown.innerHTML = '';
    hidden.forEach((tab) => {
      const item = document.createElement('div');
      item.className = 'tab-overflow-item';
      if (tab.classList.contains('active')) item.classList.add('active');
      const iconEl = tab.querySelector('.tab-icon');
      if (iconEl) {
        const iconClone = iconEl.cloneNode(true) as HTMLElement;
        iconClone.className = 'tab-icon';
        item.appendChild(iconClone);
      }
      const label = (tab.textContent ?? '').trim();
      item.appendChild(document.createTextNode(label));
      item.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        if (tabName) switchTab(tabName);
        dropdown.classList.add('hidden');
      });
      dropdown.appendChild(item);
    });
  }

  overflowBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    updateOverflow();
    dropdown.classList.toggle('hidden');
    const rect = overflowBtn.getBoundingClientRect();
    dropdown.style.top = rect.bottom + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';
  });

  document.addEventListener('click', () => dropdown.classList.add('hidden'));

  const ro = new ResizeObserver(updateOverflow);
  ro.observe(tabBar);
  updateOverflow();
}

// Run on load — build DOM first, then wire up all modules
buildLayout();
init();
