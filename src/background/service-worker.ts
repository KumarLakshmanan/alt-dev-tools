/**
 * Background Service Worker — Main Entry
 *
 * Manages connections between the side panel and content scripts.
 * Routes messages bidirectionally between panel ↔ content.
 */

import { PORT_NAME } from '@/shared/constants';
import { safeSendToTab } from './messaging';
import { handleCookiesMessage, handleStorageMessage } from './handlers';
import type { PanelToBackgroundMessage } from '@/shared/types';

// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Connection state
let panelPort: chrome.runtime.Port | null = null;
const activeTabIds = new Set<number>();

// =============================================
// PORT CONNECTION
// =============================================

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== PORT_NAME) return;
  panelPort = port;

  port.onDisconnect.addListener(() => {
    panelPort = null;
    activeTabIds.clear();
  });

  port.onMessage.addListener((message: PanelToBackgroundMessage) => {
    if (message.type === 'init') {
      activeTabIds.add(message.tabId);
      return;
    }

    const tabId = (message as { tabId?: number }).tabId;
    if (!tabId) return;

    routeMessage(message, tabId);
  });
});

// =============================================
// MESSAGE ROUTING
// =============================================

function routeMessage(message: PanelToBackgroundMessage, tabId: number): void {
  switch (message.type) {
    case 'eval-in-page':
      safeSendToTab(
        tabId,
        { type: 'eval-in-page', expression: message.expression },
        (response) => {
          panelPort?.postMessage({ type: 'eval-result', result: response });
        }
      );
      break;

    case 'get-page-sources':
      safeSendToTab(tabId, { type: 'get-page-sources' }, (response) => {
        panelPort?.postMessage({ type: 'page-sources', data: response || [] });
      });
      break;

    case 'get-dom-tree':
      safeSendToTab(tabId, { type: 'get-dom-tree' }, (response) => {
        panelPort?.postMessage({ type: 'dom-tree', data: response });
      });
      break;

    case 'highlight-element':
      safeSendToTab(tabId, { type: 'highlight-element', selector: message.selector });
      break;

    case 'unhighlight-element':
      safeSendToTab(tabId, { type: 'unhighlight-element' });
      break;

    case 'get-element-styles':
      safeSendToTab(
        tabId,
        { type: 'get-element-styles', selector: message.selector },
        (response) => {
          panelPort?.postMessage({ type: 'element-styles', data: response });
        }
      );
      break;

    case 'start-inspect-mode':
      safeSendToTab(tabId, { type: 'start-inspect-mode' });
      break;

    case 'stop-inspect-mode':
      safeSendToTab(tabId, { type: 'stop-inspect-mode' });
      break;

    case 'get-event-listeners':
      safeSendToTab(
        tabId,
        { type: 'get-event-listeners', selector: message.selector },
        (response) => {
          panelPort?.postMessage({ type: 'event-listeners', data: response || [] });
        }
      );
      break;

    case 'force-element-state':
      safeSendToTab(
        tabId,
        {
          type: 'force-element-state',
          selector: message.selector,
          pseudoClass: message.pseudoClass,
          enable: message.enable,
        },
        (response) => {
          panelPort?.postMessage({ type: 'force-state-result', data: response });
        }
      );
      break;

    case 'copy-element-html':
      safeSendToTab(
        tabId,
        { type: 'copy-element-html', selector: message.selector },
        (response) => {
          panelPort?.postMessage({ type: 'copy-html-result', data: response });
        }
      );
      break;

    case 'copy-element-selector':
      safeSendToTab(
        tabId,
        { type: 'copy-element-selector', selector: message.selector },
        (response) => {
          panelPort?.postMessage({ type: 'copy-selector-result', data: response });
        }
      );
      break;

    case 'scroll-into-view':
      safeSendToTab(tabId, { type: 'scroll-into-view', selector: message.selector });
      break;

    case 'delete-element':
      safeSendToTab(
        tabId,
        { type: 'delete-element', selector: message.selector },
        (response) => {
          panelPort?.postMessage({ type: 'delete-element-result', data: response });
        }
      );
      break;

    case 'add-html-adjacent':
      safeSendToTab(
        tabId,
        {
          type: 'add-html-adjacent',
          selector: message.selector,
          position: message.position,
          html: message.html,
        },
        (response) => {
          panelPort?.postMessage({ type: 'add-html-result', data: response });
        }
      );
      break;

    case 'edit-outer-html':
      safeSendToTab(
        tabId,
        { type: 'edit-outer-html', selector: message.selector, html: message.html },
        (response) => {
          panelPort?.postMessage({ type: 'edit-html-result', data: response });
        }
      );
      break;

    case 'start-dom-observer':
      safeSendToTab(tabId, { type: 'start-dom-observer' });
      break;

    case 'stop-dom-observer':
      safeSendToTab(tabId, { type: 'stop-dom-observer' });
      break;

    case 'get-cookies':
    case 'delete-cookie':
      handleCookiesMessage(message, tabId, panelPort);
      break;

    case 'get-storage':
      handleStorageMessage(message, tabId, panelPort);
      break;

    case 'set-blocked-urls':
      safeSendToTab(tabId, {
        type: 'eval-in-page',
        expression: `window.postMessage({__devtools_set_blocked_urls__: true, urls: ${JSON.stringify(message.urls || [])}}, "*"); "ok"`,
      });
      break;

    case 'set-selected-element':
      safeSendToTab(tabId, {
        type: 'eval-in-page',
        expression: `window.postMessage({__devtools_set_selected_element__: true, selector: ${JSON.stringify(message.selector || '')}}, "*"); "ok"`,
      });
      break;
  }
}

// =============================================
// FORWARD CONTENT SCRIPT MESSAGES TO PANEL
// =============================================

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.tab && panelPort) {
    panelPort.postMessage(message);
  }
  return false;
});
