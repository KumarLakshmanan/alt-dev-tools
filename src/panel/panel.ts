/**
 * Panel — main entry point.
 * Composes all tab modules, manages tab switching and the port message router.
 */
import { createInitialState } from './state';
import { connectPort, onPortMessage, onReconnect, sendMessage } from './connection';
import { showToast } from './utils';

// Tab modules
import {
  initElementsTab, loadDomTree, handleDomTree, handleElementStyles,
  handleEventListeners, handleInspectElementSelected, handleCopyHtmlResult,
  handleCopySelectorResult, handleDomMutation, cancelInspectMode,
} from './tabs/elements';
import { initConsoleTab, handleConsoleMessage, handleEvalResult } from './tabs/console';
import { initNetworkTab, handleNetworkMessage, handleWebSocketMessage, clearNetworkIfNotPreserved } from './tabs/network';
import { initSourcesTab, loadPageSources, handlePageSources, loadSourceFile } from './tabs/sources';
import { initApplicationTab, loadApplicationData, handleCookiesData, handleStorageData, loadCookies } from './tabs/application';

// ── State ──
const state = createInitialState();

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
}

// ── Port message router ──
function handleMessage(message: any): void {
  switch (message.type) {
    case 'console': handleConsoleMessage(message); break;
    case 'network': handleNetworkMessage(message.data); break;
    case 'dom-tree': handleDomTree(message.data); break;
    case 'page-sources': handlePageSources(message.data); break;
    case 'element-styles': handleElementStyles(message.data); break;
    case 'eval-result': handleEvalResult(message.result); break;
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
    case 'websocket': handleWebSocketMessage(message); break;
    case 'inspect-element-selected': handleInspectElementSelected(message); break;
    case 'inspect-mode-cancelled': cancelInspectMode(); break;
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

  // Tab bar click handling
  document.querySelectorAll<HTMLElement>('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab!));
  });

  // Connect to background
  onPortMessage(handleMessage);
  onReconnect(() => {
    if (state.tabId) {
      sendMessage({ type: 'init', tabId: state.tabId });
      if (state.activeTab === 'elements') loadDomTree();
    }
  });
  connectPort();

  // Get current tab ID
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    if (tabs[0]) {
      state.tabId = tabs[0].id ?? null;
      sendMessage({ type: 'init', tabId: state.tabId! });
      loadDomTree();
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

// Run on load
init();
